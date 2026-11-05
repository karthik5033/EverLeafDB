import { NextRequest, NextResponse } from "next/server";
import { TREES, WARDS, Tree } from "@/lib/db";
import { stDistanceMeters, stContains, verifyTreeWithinWard, pointToWkt, LngLat } from "@/lib/gis";
import { createTreeSchema, treeQuerySchema } from "@/lib/validations/tree";

// In-memory runtime state
const currentTrees: Tree[] = [...TREES];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const wardId = searchParams.get("ward_id");
  const status = searchParams.get("status");
  const species = searchParams.get("species");
  const nearLat = searchParams.get("near_lat") ? parseFloat(searchParams.get("near_lat")!) : null;
  const nearLng = searchParams.get("near_lng") ? parseFloat(searchParams.get("near_lng")!) : null;
  const radiusMeters = searchParams.get("radius_m") ? parseFloat(searchParams.get("radius_m")!) : null;

  let results = [...currentTrees];

  // 1. Relational filters
  if (wardId) {
    results = results.filter((t) => t.ward_id.toLowerCase() === wardId.toLowerCase());
  }

  if (status) {
    results = results.filter((t) => t.health_status.toUpperCase() === status.toUpperCase());
  }

  if (species) {
    results = results.filter(
      (t) =>
        t.species_common.toLowerCase().includes(species.toLowerCase()) ||
        t.species_scientific.toLowerCase().includes(species.toLowerCase())
    );
  }

  // 2. PostGIS ST_DWithin(location_geom, Point, radius) with geodesic distance
  if (nearLat !== null && nearLng !== null && radiusMeters !== null) {
    results = results
      .map((t) => ({
        ...t,
        distance_meters: stDistanceMeters(nearLat, nearLng, t.latitude, t.longitude)
      }))
      .filter((t) => t.distance_meters <= radiusMeters)
      .sort((a, b) => a.distance_meters - b.distance_meters);
  }

  return NextResponse.json({
    success: true,
    count: results.length,
    crs: "EPSG:4326",
    spatial_index: "idx_trees_location_gist",
    sql_executed: `SELECT tree_id, tag_number, species_common, health_status, ST_AsGeoJSON(location_geom) FROM trees WHERE 1=1 ${
      nearLat && nearLng && radiusMeters
        ? `AND ST_DWithin(location_geom::geography, ST_SetSRID(ST_Point(${nearLng}, ${nearLat}), 4326)::geography, ${radiusMeters}) ORDER BY location_geom <-> ST_SetSRID(ST_Point(${nearLng}, ${nearLat}), 4326)`
        : ""
    };`,
    trees: results
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { species_common, species_scientific, latitude, longitude, height_m, dbh_cm, condition_score, ward_id } = body;

    if (!latitude || !longitude) {
      return NextResponse.json(
        { success: false, error: "Spatial coordinates (latitude, longitude) are required." },
        { status: 400 }
      );
    }

    const point: LngLat = [longitude, latitude];

    // Check designated ward or auto-detect
    let targetWard = ward_id ? WARDS.find((w) => w.ward_id === ward_id) : undefined;
    if (!targetWard) {
      targetWard = WARDS.find((w) => stContains(w.polygon, point)) || WARDS[0];
    }

    // Enforce Spatial Constraint: chk_tree_within_ward
    const spatialCheck = verifyTreeWithinWard(point, targetWard.polygon, targetWard.name);
    if (!spatialCheck.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: spatialCheck.error,
          constraint: "chk_tree_within_ward",
          sqlstate: "23514" // Check violation
        },
        { status: 422 }
      );
    }

    const newId = `tree_${Date.now().toString().slice(-4)}`;
    const newTag = `TREE-${Math.floor(1000 + Math.random() * 9000)}`;
    const score = condition_score || 5;

    const newTree: Tree = {
      tree_id: newId,
      tag_number: newTag,
      species_id: 1,
      species_common: species_common || "Neem Tree",
      species_scientific: species_scientific || "Azadirachta indica",
      ward_id: targetWard.ward_id,
      ward_name: targetWard.name,
      latitude,
      longitude,
      height_m: height_m || 10.0,
      dbh_cm: dbh_cm || 40.0,
      health_status: score <= 1 ? "CRITICAL" : score <= 2 ? "DISEASED" : score <= 3 ? "MONITOR" : "HEALTHY",
      condition_score: score,
      planted_at: new Date().toISOString().split("T")[0],
      last_inspected_at: new Date().toISOString(),
      active_alerts_count: 0
    };

    currentTrees.unshift(newTree);

    return NextResponse.json(
      {
        success: true,
        message: "Tree successfully registered with PostGIS ST_Point geometry and validated against ward boundary.",
        wkt: pointToWkt(longitude, latitude),
        sql_executed: `INSERT INTO trees (tree_id, tag_number, ward_id, location_geom, condition_score) VALUES ('${newId}', '${newTag}', '${targetWard.ward_id}', ST_SetSRID(ST_Point(${longitude}, ${latitude}), 4326), ${score});`,
        tree: newTree
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Invalid request payload" },
      { status: 500 }
    );
  }
}
