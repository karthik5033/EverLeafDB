/**
 * EverLeafDB Phase 23: Work Order Management & Crew Dispatch Kanban Engine
 *
 * Provides municipal crew dispatch operations:
 * - 4-column Kanban task board (PENDING, IN_PROGRESS, COMPLETED, CANCELLED)
 * - Real-time status transitions with auto-timestamping (closed_at)
 * - Contractor/crew and municipal ward filtering
 * - Strict role compliance (zero prohibited role occurrences)
 */

import { WORK_ORDERS, TREES, DISEASES, WorkOrder } from "./db";
import { AUDIT_STORE } from "./audit";
import { AuditLog } from "../types/database";

export type KanbanColumnId = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export interface KanbanWorkOrderItem extends WorkOrder {
  tree_tag: string;
  species_common: string;
  species_scientific: string;
  ward_id: string;
  ward_name: string;
  latitude: number;
  longitude: number;
  disease_name: string;
  sla_remaining_hours: number;
  is_overdue: boolean;
  column_id: KanbanColumnId;
}

export interface KanbanBoardData {
  columns: {
    PENDING: KanbanWorkOrderItem[];
    IN_PROGRESS: KanbanWorkOrderItem[];
    COMPLETED: KanbanWorkOrderItem[];
    CANCELLED: KanbanWorkOrderItem[];
  };
  kpis: {
    total_orders: number;
    pending_count: number;
    in_progress_count: number;
    completed_count: number;
    cancelled_count: number;
    emergency_sla_count: number;
    total_cost_allocated: number;
  };
  all_crews: string[];
  all_wards: { ward_id: string; ward_name: string }[];
}

export interface WorkOrderFilterParams {
  assigned_crew?: string;
  ward_id?: string;
  priority?: string;
  search_query?: string;
}

// Canonical municipal response crews list
export const MUNICIPAL_CREWS = [
  "North Rapid Response Team",
  "Central Arbor Emergency Unit 1",
  "South Biosecurity Sanitation Squad",
  "East Foliar Mist Contractors",
  "East Maintenance Unit 2"
];

function mapToKanbanColumn(status: string): KanbanColumnId {
  if (status === "DISPATCHED" || status === "PENDING") return "PENDING";
  if (status === "IN_PROGRESS") return "IN_PROGRESS";
  if (status === "COMPLETED") return "COMPLETED";
  if (status === "CANCELLED") return "CANCELLED";
  return "PENDING";
}

/**
 * Retrieves the consolidated Kanban board data with active cards,
 * column groupings, KPI summaries, and filter options.
 */
export function getKanbanBoardData(filters?: WorkOrderFilterParams): KanbanBoardData {
  const now = new Date();

  // Enrich work orders with relational metadata
  let enrichedList: KanbanWorkOrderItem[] = WORK_ORDERS.map((wo) => {
    const tree = TREES.find((t) => t.tree_id === wo.tree_id) || TREES[0];
    const columnId = mapToKanbanColumn(wo.status);

    // Compute SLA metrics
    const dispatchedDate = new Date(wo.dispatched_at);
    const deadlineDate = new Date(dispatchedDate.getTime() + wo.sla_hours * 3600 * 1000);
    const hoursRemaining = Math.round((deadlineDate.getTime() - now.getTime()) / (3600 * 1000));
    const isOverdue = columnId !== "COMPLETED" && columnId !== "CANCELLED" && hoursRemaining < 0;

    // Detect disease from protocol or sample
    const diseaseName = wo.protocol.includes("Ganoderma") || wo.protocol.includes("Root Drench")
      ? "Ganoderma Root & Butt Rot"
      : wo.protocol.includes("Oxytetracycline")
      ? "Bacterial Wetwood Canker"
      : wo.protocol.includes("Fungicide")
      ? "Dutch Elm Vascular Wilt"
      : wo.protocol.includes("Copper Hydroxide")
      ? "Anthracnose Foliar Blight"
      : "Pathological Vascular Flagging";

    return {
      ...wo,
      tree_tag: tree.tag_number,
      species_common: tree.species_common,
      species_scientific: tree.species_scientific,
      ward_id: tree.ward_id,
      ward_name: tree.ward_name,
      latitude: tree.latitude,
      longitude: tree.longitude,
      disease_name: diseaseName,
      sla_remaining_hours: columnId === "COMPLETED" || columnId === "CANCELLED" ? 0 : Math.max(0, hoursRemaining),
      is_overdue: isOverdue,
      column_id: columnId
    };
  });

  // Apply filters
  if (filters?.assigned_crew && filters.assigned_crew !== "ALL") {
    enrichedList = enrichedList.filter((item) => item.assigned_crew === filters.assigned_crew);
  }
  if (filters?.ward_id && filters.ward_id !== "ALL") {
    enrichedList = enrichedList.filter((item) => item.ward_id === filters.ward_id);
  }
  if (filters?.priority && filters.priority !== "ALL") {
    enrichedList = enrichedList.filter((item) => item.priority.toUpperCase() === filters.priority!.toUpperCase());
  }
  if (filters?.search_query && filters.search_query.trim() !== "") {
    const q = filters.search_query.toLowerCase();
    enrichedList = enrichedList.filter(
      (item) =>
        item.order_id.toLowerCase().includes(q) ||
        item.tree_tag.toLowerCase().includes(q) ||
        item.protocol.toLowerCase().includes(q) ||
        item.species_common.toLowerCase().includes(q)
    );
  }

  // Group into columns
  const columns: KanbanBoardData["columns"] = {
    PENDING: enrichedList.filter((item) => item.column_id === "PENDING"),
    IN_PROGRESS: enrichedList.filter((item) => item.column_id === "IN_PROGRESS"),
    COMPLETED: enrichedList.filter((item) => item.column_id === "COMPLETED"),
    CANCELLED: enrichedList.filter((item) => item.column_id === "CANCELLED")
  };

  // Sort columns: EMERGENCY first, then by date descending
  const priorityWeight: Record<string, number> = {
    EMERGENCY: 1,
    HIGH: 2,
    STANDARD: 3,
    MEDIUM: 4,
    LOW: 5
  };

  Object.keys(columns).forEach((key) => {
    columns[key as KanbanColumnId].sort((a, b) => {
      const pDiff = (priorityWeight[a.priority] || 9) - (priorityWeight[b.priority] || 9);
      if (pDiff !== 0) return pDiff;
      return new Date(b.dispatched_at).getTime() - new Date(a.dispatched_at).getTime();
    });
  });

  // Calculate KPIs
  const allOrders = WORK_ORDERS;
  const pendingCount = allOrders.filter((w) => mapToKanbanColumn(w.status) === "PENDING").length;
  const inProgressCount = allOrders.filter((w) => mapToKanbanColumn(w.status) === "IN_PROGRESS").length;
  const completedCount = allOrders.filter((w) => mapToKanbanColumn(w.status) === "COMPLETED").length;
  const cancelledCount = allOrders.filter((w) => mapToKanbanColumn(w.status) === "CANCELLED").length;
  const emergencyCount = allOrders.filter((w) => w.priority === "EMERGENCY" && mapToKanbanColumn(w.status) !== "COMPLETED" && mapToKanbanColumn(w.status) !== "CANCELLED").length;
  const totalCost = allOrders.reduce((sum, w) => sum + (w.cost_estimate_usd || 0), 0);

  // Collect distinct crews and wards
  const crewSet = new Set<string>();
  WORK_ORDERS.forEach((w) => crewSet.add(w.assigned_crew));
  MUNICIPAL_CREWS.forEach((c) => crewSet.add(c));

  const wardMap = new Map<string, string>();
  TREES.forEach((t) => wardMap.set(t.ward_id, t.ward_name));

  return {
    columns,
    kpis: {
      total_orders: allOrders.length,
      pending_count: pendingCount,
      in_progress_count: inProgressCount,
      completed_count: completedCount,
      cancelled_count: cancelledCount,
      emergency_sla_count: emergencyCount,
      total_cost_allocated: totalCost
    },
    all_crews: Array.from(crewSet),
    all_wards: Array.from(wardMap.entries()).map(([ward_id, ward_name]) => ({ ward_id, ward_name }))
  };
}

/**
 * Transitions a work order status, sets closed_at timestamp if completed/cancelled,
 * and records an immutable audit log entry.
 */
export function transitionWorkOrderStatus(
  orderId: string,
  newStatus: "PENDING" | "DISPATCHED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED",
  actorId: string = "user_supervisor_01",
  notes?: string
): {
  success: boolean;
  work_order: WorkOrder;
  old_status: string;
  new_status: string;
  closed_at: string | null;
  message: string;
} {
  const order = WORK_ORDERS.find((w) => w.order_id === orderId);
  if (!order) {
    throw new Error(`Work Order "${orderId}" not found in registry.`);
  }

  const oldStatus = order.status;
  order.status = newStatus;

  // Set closed_at timestamp upon completion or cancellation
  if (newStatus === "COMPLETED" || newStatus === "CANCELLED") {
    order.closed_at = new Date().toISOString();
  } else {
    order.closed_at = null;
  }

  // Record Audit Log Entry
  const auditEntry: AuditLog = {
    log_id: AUDIT_STORE.length + 1,
    user_id: actorId,
    action: "UPDATE",
    table_name: "work_orders",
    record_id: orderId,
    old_values: { status: oldStatus },
    new_values: {
      status: newStatus,
      closed_at: order.closed_at,
      inspector_notes: notes || `Work order status transitioned by Municipal Field Supervisor.`
    },
    performed_at: new Date().toISOString()
  };
  AUDIT_STORE.unshift(auditEntry);

  return {
    success: true,
    work_order: order,
    old_status: oldStatus,
    new_status: newStatus,
    closed_at: order.closed_at || null,
    message: `Work Order ${orderId} transitioned from ${oldStatus} to ${newStatus}.`
  };
}

/**
 * Reassigns a work order to a different municipal crew.
 */
export function reassignWorkOrderCrew(
  orderId: string,
  newCrew: string,
  actorId: string = "user_supervisor_01"
): {
  success: boolean;
  work_order: WorkOrder;
  old_crew: string;
  new_crew: string;
  message: string;
} {
  const order = WORK_ORDERS.find((w) => w.order_id === orderId);
  if (!order) {
    throw new Error(`Work Order "${orderId}" not found in registry.`);
  }

  const oldCrew = order.assigned_crew;
  order.assigned_crew = newCrew;

  // Audit entry
  const auditEntry: AuditLog = {
    log_id: AUDIT_STORE.length + 1,
    user_id: actorId,
    action: "UPDATE",
    table_name: "work_orders",
    record_id: orderId,
    old_values: { assigned_crew: oldCrew },
    new_values: { assigned_crew: newCrew },
    performed_at: new Date().toISOString()
  };
  AUDIT_STORE.unshift(auditEntry);

  return {
    success: true,
    work_order: order,
    old_crew: oldCrew,
    new_crew: newCrew,
    message: `Work Order ${orderId} reassigned to ${newCrew}.`
  };
}

