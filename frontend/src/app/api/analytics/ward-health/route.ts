import { NextRequest, NextResponse } from "next/server";
import {
  getWardHealthSummary,
  benchmarkMaterializedViewVsLive
} from "@/lib/materialized-views";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sourceParam = searchParams.get("source");
    const runBenchmark = searchParams.get("benchmark") === "true";

    const useMv = sourceParam !== "live";
    const summary = getWardHealthSummary(useMv);

    let benchmarkData = null;
    if (runBenchmark) {
      benchmarkData = benchmarkMaterializedViewVsLive(20);
    }

    const sqlExecuted = useMv
      ? "SELECT * FROM mv_ward_health_summary ORDER BY health_index_pct ASC;"
      : `
SELECT
  w.ward_id,
  w.name AS ward_name,
  COUNT(t.tree_id) AS total_trees,
  COUNT(CASE WHEN t.health_status IN ('HEALTHY', 'EXCELLENT') THEN 1 END) AS healthy_trees,
  COUNT(CASE WHEN t.health_status IN ('CRITICAL', 'POOR') THEN 1 END) AS critical_trees,
  ROUND(AVG(t.condition_score), 2) AS avg_condition_score,
  ROUND((COUNT(CASE WHEN t.health_status IN ('HEALTHY', 'EXCELLENT') THEN 1 END)::NUMERIC / NULLIF(COUNT(t.tree_id), 0)) * 100, 1) AS health_index_pct,
  COUNT(DISTINCT a.alert_id) FILTER (WHERE a.status = 'PENDING') AS active_alerts_count
FROM wards w
LEFT JOIN trees t ON w.ward_id = t.ward_id
LEFT JOIN alerts a ON t.tree_id = a.tree_id
GROUP BY w.ward_id, w.name
ORDER BY health_index_pct ASC;
      `.trim();

    return NextResponse.json({
      success: true,
      data: summary.data,
      count: summary.data.length,
      execution_latency_ms: summary.execution_latency_ms,
      query_source: summary.query_source,
      refreshed_at: summary.refreshed_at,
      benchmark: benchmarkData,
      sql_executed: sqlExecuted
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve ward health summary" },
      { status: 500 }
    );
  }
}
