import { NextRequest, NextResponse } from "next/server";
import { getAuditLogs, AUDIT_STORE, computeJsonbDiff } from "@/lib/audit";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tableName = searchParams.get("table_name") || undefined;
  const recordId = searchParams.get("record_id") || undefined;
  const action = searchParams.get("action") || undefined;
  const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 50;

  const logs = getAuditLogs({ table_name: tableName, record_id: recordId, action, limit });

  const enrichedLogs = logs.map((log) => ({
    ...log,
    diff: computeJsonbDiff(log.old_values, log.new_values)
  }));

  return NextResponse.json({
    success: true,
    count: enrichedLogs.length,
    total_stored: AUDIT_STORE.length,
    sql_executed: `SELECT log_id, user_id, action, table_name, record_id, old_values, new_values, performed_at FROM audit_log ${
      tableName ? `WHERE table_name = '${tableName}'` : ""
    } ORDER BY performed_at DESC LIMIT ${limit};`,
    audit_logs: enrichedLogs
  });
}
