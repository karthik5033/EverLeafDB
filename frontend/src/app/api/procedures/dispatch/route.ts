import { NextRequest, NextResponse } from "next/server";
import {
  executeStoredProcedureDispatch,
  StoredProcedureDispatchParams
} from "@/lib/stored-procedures";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      alert_id,
      supervisor_id = "user_supervisor_01",
      disease_id = 1,
      treatment_id = 1,
      assigned_crew = "North Rapid Response Team",
      priority = "EMERGENCY",
      due_date,
      supervisor_remarks,
      simulate_mid_flight_error = false
    } = body;

    if (!alert_id) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required parameter: alert_id",
          execution_status: "ROLLED_BACK"
        },
        { status: 400 }
      );
    }

    const dispatchParams: StoredProcedureDispatchParams = {
      alert_id,
      supervisor_id,
      disease_id: Number(disease_id),
      treatment_id: Number(treatment_id),
      assigned_crew,
      priority,
      due_date,
      supervisor_remarks,
      simulate_mid_flight_error: Boolean(simulate_mid_flight_error)
    };

    const result = executeStoredProcedureDispatch(dispatchParams);

    const sqlExecuted = `
CALL sp_confirm_diagnosis_and_dispatch_order(
  '${alert_id}'::UUID,
  '${supervisor_id}'::UUID,
  ${disease_id},
  ${treatment_id},
  '${assigned_crew}',
  '${priority}'::work_order_priority,
  ${due_date ? `'${due_date}'::DATE` : "CURRENT_DATE + 2"},
  ${supervisor_remarks ? `'${supervisor_remarks}'` : "NULL"}
);
    `.trim();

    const statusCode = result.success ? 200 : (result.error_code === "55P03" ? 409 : 422);

    return NextResponse.json(
      {
        ...result,
        sql_executed: sqlExecuted
      },
      { status: statusCode }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        execution_status: "ROLLED_BACK",
        error: error.message || "Failed to execute atomic dispatch stored procedure"
      },
      { status: 500 }
    );
  }
}

