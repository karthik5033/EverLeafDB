import { NextRequest, NextResponse } from "next/server";
import { TREES, WARDS, Tree, SPECIES_SEED } from "@/lib/db";
import { pointToWkt, stDistanceMeters, verifyTreeWithinWard, stContains, LngLat } from "@/lib/gis";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const tree = TREES.find((t) => t.tree_id.toLowerCase() === id.toLowerCase());

  if (!tree) {
    return NextResponse.json(
      { success: false, error: `Tree with ID '${id}' not found.` },
      { status: 404 }
    );
  }

  const ward = WARDS.find((w) => w.ward_id.toLowerCase() === tree.ward_id.toLowerCase()) || WARDS[0];
  const species = SPECIES_SEED.find((s) => s.species_id === tree.species_id) || SPECIES_SEED[0];

  return NextResponse.json({
    success: true,
    tree: {
      ...tree,
      species,
      ward: {
        ward_id: ward.ward_id,
        name: ward.name,
        zone: ward.zone,
        area_sq_km: ward.area_sq_km,
        canopy_cover_percent: ward.canopy_cover_percent
      },
      wkt: pointToWkt(tree.longitude, tree.latitude),
      estimated_age_years: Math.max(1, new Date().getFullYear() - new Date(tree.planted_at).getFullYear())
    },
    sql_executed: `SELECT t.*, s.scientific_name, s.growth_rate, w.name AS ward_name, ST_AsText(t.location_geom) AS wkt FROM trees t JOIN species s ON t.species_id = s.species_id JOIN wards w ON t.ward_id = w.ward_id WHERE t.tree_id = '${id}';`
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const treeIndex = TREES.findIndex((t) => t.tree_id.toLowerCase() === id.toLowerCase());

    if (treeIndex === -1) {
      return NextResponse.json(
        { success: false, error: `Tree with ID '${id}' not found.` },
        { status: 404 }
      );
    }

    const body = await request.json();
    const existing = TREES[treeIndex];

    const newLat = body.latitude !== undefined ? Number(body.latitude) : existing.latitude;
    const newLng = body.longitude !== undefined ? Number(body.longitude) : existing.longitude;
    const newWardId = body.ward_id || existing.ward_id;

    // Check spatial constraint if coordinates or ward changed
    const targetWard = WARDS.find((w) => w.ward_id === newWardId) || WARDS[0];
    const point: LngLat = [newLng, newLat];
    const spatialCheck = verifyTreeWithinWard(point, targetWard.polygon, targetWard.name);

    if (!spatialCheck.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: spatialCheck.error,
          constraint: "chk_tree_within_ward",
          sqlstate: "23514"
        },
        { status: 422 }
      );
    }

    const updatedTree: Tree = {
      ...existing,
      height_m: body.height_m !== undefined ? Number(body.height_m) : existing.height_m,
      dbh_cm: body.dbh_cm !== undefined ? Number(body.dbh_cm) : existing.dbh_cm,
      health_status: body.health_status || existing.health_status,
      condition_score: body.condition_score !== undefined ? Number(body.condition_score) : existing.condition_score,
      latitude: newLat,
      longitude: newLng,
      ward_id: targetWard.ward_id,
      ward_name: targetWard.name,
      last_inspected_at: new Date().toISOString()
    };

    TREES[treeIndex] = updatedTree;

    return NextResponse.json({
      success: true,
      message: "Tree updated successfully under spatial constraint verification.",
      tree: updatedTree,
      sql_executed: `UPDATE trees SET height_meters = ${updatedTree.height_m}, girth_cm = ${updatedTree.dbh_cm}, health_status = '${updatedTree.health_status.toLowerCase()}', location_geom = ST_SetSRID(ST_Point(${newLng}, ${newLat}), 4326) WHERE tree_id = '${id}';`
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to update tree" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const index = TREES.findIndex((t) => t.tree_id.toLowerCase() === id.toLowerCase());

  if (index === -1) {
    return NextResponse.json(
      { success: false, error: `Tree with ID '${id}' not found.` },
      { status: 404 }
    );
  }

  // Soft delete: mark removed
  TREES[index].health_status = "DEAD";

  return NextResponse.json({
    success: true,
    message: `Tree '${id}' removed from active inventory.`,
    sql_executed: `UPDATE trees SET health_status = 'removed' WHERE tree_id = '${id}';`
  });
}

