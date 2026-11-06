import { NextRequest, NextResponse } from "next/server";
import {
  getKanbanBoardData,
  transitionWorkOrderStatus,
  reassignWorkOrderCrew,
  WorkOrderFilterParams
} from "@/lib/work-order-engine";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const assignedCrew = searchParams.get("assigned_crew") || undefined;
    const wardId = searchParams.get("ward_id") || undefined;
    const priority = searchParams.get("priority") || undefined;
    const searchQuery = searchParams.get("search_query") || undefined;

    const filters: WorkOrderFilterParams = {
      assigned_crew: assignedCrew,
      ward_id: wardId,
      priority: priority,
      search_query: searchQuery
    };

    const boardData = getKanbanBoardData(filters);

    const sqlExecuted = `
SELECT * FROM vw_work_orders_kanban
WHERE 1=1
  ${assignedCrew && assignedCrew !== 'ALL' ? `AND assigned_crew = '${assignedCrew}'` : ''}
  ${wardId && wardId !== 'ALL' ? `AND ward_id = '${wardId}'` : ''}
  ${priority && priority !== 'ALL' ? `AND priority = '${priority}'` : ''}
ORDER BY
  CASE priority WHEN 'EMERGENCY' THEN 1 WHEN 'HIGH' THEN 2 WHEN 'STANDARD' THEN 3 ELSE 4 END ASC,
  due_date ASC;
    `.trim();

    return NextResponse.json({
      success: true,
      columns: boardData.columns,
      kpis: boardData.kpis,
      all_crews: boardData.all_crews,
      all_wards: boardData.all_wards,
      sql_executed: sqlExecuted
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve work orders Kanban board" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { order_id, new_status, new_crew, actor_id = "user_supervisor_01", notes } = body;

    if (!order_id) {
      return NextResponse.json(
        { success: false, error: "Missing required parameter: order_id" },
        { status: 400 }
      );
    }

    // Handle crew reassignment
    if (new_crew) {
      const reassigned = reassignWorkOrderCrew(order_id, new_crew, actor_id);
      return NextResponse.json({
        ...reassigned,
        sql_executed: `UPDATE work_orders SET assigned_crew = '${new_crew}' WHERE order_id = '${order_id}';`
      });
    }

    // Handle status transition
    if (new_status) {
      const result = transitionWorkOrderStatus(order_id, new_status, actor_id, notes);
      return NextResponse.json({
        ...result,
        sql_executed: `SELECT * FROM fn_transition_work_order_status('${order_id}', '${new_status}', '${actor_id}', ${notes ? `'${notes}'` : 'NULL'});`
      });
    }

    return NextResponse.json(
      { success: false, error: "Either new_status or new_crew must be specified." },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update work order" },
      { status: 500 }
    );
  }
}
