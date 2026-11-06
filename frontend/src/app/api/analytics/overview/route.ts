import { NextRequest, NextResponse } from "next/server";
import { getExecutiveOverviewData } from "@/lib/executive-analytics";

export async function GET(request: NextRequest) {
  try {
    const data = getExecutiveOverviewData();

    const sqlExecuted = `
-- Executive City KPIs
SELECT * FROM vw_executive_city_kpis;

-- Health Status Distribution
SELECT * FROM vw_health_status_distribution;

-- Species Biodiversity Breakdown
SELECT * FROM vw_species_biodiversity_distribution;

-- Materialized Ward Health Summary
SELECT * FROM mv_ward_health_summary ORDER BY health_index_pct ASC;
    `.trim();

    return NextResponse.json({
      success: true,
      kpis: data.kpis,
      health_distribution: data.health_distribution,
      species_biodiversity: data.species_biodiversity,
      ward_summaries: data.ward_summaries,
      sql_executed: sqlExecuted
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve executive overview analytics" },
      { status: 500 }
    );
  }
}
