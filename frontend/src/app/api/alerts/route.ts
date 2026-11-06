import { NextRequest, NextResponse } from "next/server";
import {
  getSupervisorTriageQueue,
  executeSupervisorTriageAction,
  SupervisorTriageActionParams
} from "@/lib/triage-engine";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || undefined;
    const severity = searchParams.get("severity") || undefined;
    const wardId = searchParams.get("ward_id") || undefined;

    const data = getSupervisorTriageQueue({
      status,
      severity,
      ward_id: wardId
    });

    const sqlExecuted = `
SELECT * FROM vw_supervisor_triage_queue
WHERE 1=1
  ${status && status !== 'ALL' ? `AND alert_status = '${status}'` : ''}
  ${severity && severity !== 'ALL' ? `AND severity = '${severity}'` : ''}
  ${wardId && wardId !== 'ALL' ? `AND ward_id = '${wardId}'` : ''}
ORDER BY
  CASE severity WHEN 'CRITICAL' THEN 1 WHEN 'HIGH' THEN 2 WHEN 'WARNING' THEN 3 ELSE 4 END ASC,
  alert_created_at DESC;
    `.trim();

    return NextResponse.json({
      success: true,
      count: data.alerts.length,
      kpis: data.kpis,
      sql_executed: sqlExecuted,
      alerts: data.alerts
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to retrieve supervisor triage queue" },
      { status: 500 }
    );
  }
}

// Supervisor Clinical Triage & Stored Procedure Dispatch
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      alert_id,
      action = "CONFIRM_AND_DISPATCH",
      confirmed_disease_id,
      confidence_source,
      treatment_id,
      protocol,
      assigned_crew,
      priority,
      supervisor_remarks,
      supervisor_id
    } = body;

    if (!alert_id) {
      return NextResponse.json(
        { success: false, error: "Missing required parameter: alert_id" },
        { status: 400 }
      );
    }

    const actionParams: SupervisorTriageActionParams = {
      alert_id,
      action,
      confirmed_disease_id: confirmed_disease_id ? Number(confirmed_disease_id) : undefined,
      confidence_source,
      treatment_id: treatment_id ? Number(treatment_id) : undefined,
      protocol,
      assigned_crew,
      priority,
      supervisor_remarks,
      supervisor_id
    };

    const result = executeSupervisorTriageAction(actionParams);

    return NextResponse.json({
      ...result,
      sql_executed: `CALL sp_confirm_diagnosis_and_dispatch_order('${alert_id}', '${supervisor_id || "supervisor_01"}', ${confirmed_disease_id || 1}, ${treatment_id || 1}, '${assigned_crew || "Central Unit"}', '${priority || "EMERGENCY"}', CURRENT_DATE + 2);`
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Triage execution failed" },
      { status: 500 }
    );
  }
}
