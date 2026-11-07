/**
 * EverLeafDB Demo Seed & Reset Engine (Phase 30)
 * Provides rapid state reset and demographic repopulation for course viva presentations.
 */

import { TREES, ALERTS, WORK_ORDERS, INSPECTIONS } from "./db";
import { CITIZEN_REPORTS_STORE } from "./citizen-reporting";
import { AUDIT_STORE, recordAuditTrail } from "./audit";

export interface DemoResetResult {
  success: boolean;
  message: string;
  timestamp: string;
  counts: {
    trees: number;
    inspections: number;
    alerts: number;
    work_orders: number;
    citizen_reports: number;
    audit_logs: number;
  };
}

export function resetDemoDataState(): DemoResetResult {
  const initialTreeCount = TREES.length;

  // Reset any temporary trees added during tests
  while (TREES.length > 10) {
    TREES.pop();
  }

  // Restore initial critical alert status on tree 1084
  const tree1084 = TREES.find((t) => t.tree_id === "tree_1084" || t.tag_number === "BLR-1084");
  if (tree1084) {
    tree1084.health_status = "critical";
    tree1084.last_inspected_at = "2026-11-04T18:24:00Z";
  }

  // Restore initial alert state
  while (ALERTS.length > 3) {
    ALERTS.pop();
  }
  if (ALERTS.length > 0) {
    ALERTS[0].status = "PENDING";
  }

  // Restore initial work orders state
  while (WORK_ORDERS.length > 4) {
    WORK_ORDERS.pop();
  }
  if (WORK_ORDERS.length > 0) {
    WORK_ORDERS[0].status = "PENDING";
  }

  // Restore initial citizen reports
  while (CITIZEN_REPORTS_STORE.length > 4) {
    CITIZEN_REPORTS_STORE.pop();
  }
  if (CITIZEN_REPORTS_STORE.length > 1) {
    CITIZEN_REPORTS_STORE[1].status = "PENDING_TRIAGE";
  }

  // Record admin demo reset audit action
  recordAuditTrail({
    user_id: "00000000-0000-0000-0000-000000000001", // Municipal Admin
    action: "DISPATCH",
    table_name: "demo_sandbox",
    record_id: "viva_state_reset",
    old_values: null,
    new_values: {
      action: "RESET_TO_VIVA_BASELINE",
      restored_trees: TREES.length,
      restored_alerts: ALERTS.length,
      restored_work_orders: WORK_ORDERS.length
    }
  });

  return {
    success: true,
    message: "EverLeafDB demographic state successfully reset to certified Course Viva baseline.",
    timestamp: new Date().toISOString(),
    counts: {
      trees: TREES.length,
      inspections: INSPECTIONS.length,
      alerts: ALERTS.length,
      work_orders: WORK_ORDERS.length,
      citizen_reports: CITIZEN_REPORTS_STORE.length,
      audit_logs: AUDIT_STORE.length
    }
  };
}
