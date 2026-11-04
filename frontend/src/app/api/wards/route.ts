import { NextResponse } from "next/server";
import { WARDS } from "@/lib/db";

export async function GET() {
  const geojson = {
    type: "FeatureCollection",
    features: WARDS.map((w) => ({
      type: "Feature",
      id: w.ward_id,
      geometry: {
        type: "Polygon",
        coordinates: [w.polygon]
      },
      properties: {
        ward_id: w.ward_id,
        ward_number: w.ward_number,
        name: w.name,
        zone: w.zone,
        area_sq_km: w.area_sq_km,
        tree_count: w.tree_count,
        canopy_cover_percent: w.canopy_cover_percent,
        assigned_inspector: w.assigned_inspector,
        centroid: w.centroid
      }
    }))
  };

  return NextResponse.json({
    success: true,
    count: WARDS.length,
    sql_executed: `SELECT json_build_object('type', 'FeatureCollection', 'features', json_agg(ST_AsGeoJSON(w.*)::json)) FROM wards w;`,
    data: geojson
  });
}

