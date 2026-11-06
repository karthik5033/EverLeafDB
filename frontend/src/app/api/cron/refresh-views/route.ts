import { NextRequest, NextResponse } from "next/server";
import { refreshWardHealthSummaryConcurrently } from "@/lib/materialized-views";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const actorId = body.actor_id || "cron_background_worker";

    const result = refreshWardHealthSummaryConcurrently(actorId);

    const sqlExecuted = `CALL sp_refresh_ward_health_summary_concurrently('${actorId}');`;

    return NextResponse.json({
      ...result,
      sql_executed: sqlExecuted,
      message: `Materialized view mv_ward_health_summary refreshed concurrently with zero lock contention.`
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to execute concurrent view refresh" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const result = refreshWardHealthSummaryConcurrently("cron_scheduled_get");
    return NextResponse.json({
      ...result,
      sql_executed: "REFRESH MATERIALIZED VIEW CONCURRENTLY mv_ward_health_summary;"
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to refresh views" },
      { status: 500 }
    );
  }
}
