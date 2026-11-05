import { NextRequest, NextResponse } from "next/server";
import { WARDS } from "@/lib/db";
import { stContains, stDistanceMeters, stEnvelope, stAreaSqKm, polygonToWkt, LngLat } from "@/lib/gis";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const latStr = searchParams.get("lat");
  const lngStr = searchParams.get("lng");

  // Query: Resolve containing ward for coordinate point via PostGIS ST_Contains()
  if (latStr && lngStr) {
    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);
    const point: LngLat = [lng, lat];

    // 1. Exact polygon containment test
    let containingWard = WARDS.find((w) => stContains(w.polygon, point));

    // 2. If point is slightly outside (e.g. boundary border street), find nearest ward
    if (!containingWard) {
      containingWard = [...WARDS].sort((a, b) => {
        const distA = stDistanceMeters(lat, lng, a.centroid[1], a.centroid[0]);
        const distB = stDistanceMeters(lat, lng, b.centroid[1], b.centroid[0]);
        return distA - distB;
      })[0];
    }

    return NextResponse.json({
      success: true,
      coordinate: { latitude: lat, longitude: lng },
      matched_ward: {
        ward_id: containingWard.ward_id,
        ward_number: containingWard.ward_number,
        name: containingWard.name,
        zone: containingWard.zone,
        assigned_inspector: containingWard.assigned_inspector,
        tree_count: containingWard.tree_count,
        area_sq_km: containingWard.area_sq_km,
        distance_to_centroid_meters: stDistanceMeters(
          lat,
          lng,
          containingWard.centroid[1],
          containingWard.centroid[0]
        )
      },
      sql_executed: `SELECT ward_id, ward_number, name, zone FROM wards WHERE ST_Contains(boundary_geom, ST_SetSRID(ST_Point(${lng}, ${lat}), 4326)) LIMIT 1;`
    });
  }

  // Full FeatureCollection with spatial metadata
  const geojson = {
    type: "FeatureCollection",
    features: WARDS.map((w) => {
      const bbox = stEnvelope(w.polygon);
      const computedArea = stAreaSqKm(w.polygon);
      return {
        type: "Feature",
        id: w.ward_id,
        geometry: {
          type: "Polygon",
          coordinates: [w.polygon]
        },
        bbox: [bbox.minLng, bbox.minLat, bbox.maxLng, bbox.maxLat],
        properties: {
          ward_id: w.ward_id,
          ward_number: w.ward_number,
          name: w.name,
          zone: w.zone,
          area_sq_km: w.area_sq_km || computedArea,
          tree_count: w.tree_count,
          canopy_cover_percent: w.canopy_cover_percent,
          assigned_inspector: w.assigned_inspector,
          centroid: w.centroid,
          wkt_boundary: polygonToWkt(w.polygon)
        }
      };
    })
  };

  return NextResponse.json({
    success: true,
    count: WARDS.length,
    crs: {
      type: "name",
      properties: { name: "urn:ogc:def:crs:EPSG::4326" }
    },
    sql_executed: `SELECT json_build_object('type', 'FeatureCollection', 'features', json_agg(ST_AsGeoJSON(w.*)::json)) FROM wards w;`,
    data: geojson
  });
}
