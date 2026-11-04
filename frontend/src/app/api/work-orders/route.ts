import { NextRequest, NextResponse } from "next/server";
import { WORK_ORDERS } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  let results = [...WORK_ORDERS];
  if (status) {
    results = results.filter((w) => w.status === status);
  }

  return NextResponse.json({
    success: true,
    count: results.length,
    sql_executed: `SELECT * FROM work_orders ${status ? `WHERE status = '${status}'` : ""} ORDER BY dispatched_at DESC;`,
    work_orders: results
  });
}

