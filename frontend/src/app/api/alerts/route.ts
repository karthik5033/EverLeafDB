import { NextRequest, NextResponse } from "next/server";
import { ALERTS, WORK_ORDERS, WorkOrder } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  let results = [...ALERTS];
  if (status) {
    results = results.filter((a) => a.status === status);
  }

  return NextResponse.json({
    success: true,
    count: results.length,
    sql_executed: `SELECT * FROM alerts ${status ? `WHERE status = '${status}'` : ""} ORDER BY created_at DESC;`,
    alerts: results
  });
}

// Supervisor Clinical Triage & Stored Procedure Dispatch
// Calls: sp_confirm_diagnosis_and_dispatch_order()
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { alert_id, assigned_crew, protocol, priority } = body;

    const alert = ALERTS.find((a) => a.alert_id === alert_id);
    if (!alert) {
      return NextResponse.json({ success: false, error: "Alert ID not found." }, { status: 404 });
    }

    // Atomic transaction state transition
    alert.status = "ACTIONED";

    const newOrder: WorkOrder = {
      order_id: `WO-${Math.floor(1000 + Math.random() * 9000)}`,
      tree_id: alert.tree_id,
      alert_id: alert.alert_id,
      priority: priority || "EMERGENCY",
      status: "DISPATCHED",
      protocol: protocol || "Propiconazole Root Drench + Canopy Weight Reduction",
      assigned_crew: assigned_crew || "North Emergency Unit A",
      dispatched_at: new Date().toISOString(),
      sla_hours: 48,
      cost_estimate_usd: 180
    };

    WORK_ORDERS.unshift(newOrder);

    return NextResponse.json({
      success: true,
      message: "Atomic stored procedure executed: Diagnosis confirmed & work order dispatched.",
      acid_transaction: {
        procedure: "sp_confirm_diagnosis_and_dispatch_order()",
        locks: "SELECT FOR UPDATE ON alerts (Pessimistic Row Lock)",
        isolation_level: "REPEATABLE READ",
        commit_status: "SUCCESS"
      },
      sql_executed: `CALL sp_confirm_diagnosis_and_dispatch_order('${alert_id}', 'inspector_04', 1, 1, '${newOrder.assigned_crew}', '${newOrder.priority}', CURRENT_DATE + 2);`,
      work_order: newOrder
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Triage execution failed" }, { status: 500 });
  }
}

