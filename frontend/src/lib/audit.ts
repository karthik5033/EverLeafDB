/**
 * Operational Trigger & Relational Audit Trail Subsystem (Phase 13)
 * Implements PL/pgSQL triggers trg_fn_update_last_inspected and trg_fn_audit_trail
 */

import { AuditLog } from "../types/database";
import { TREES, Tree } from "./db";

// Runtime in-memory audit log store (mirrors PostgreSQL Table 14: audit_log)
export const AUDIT_STORE: AuditLog[] = [
  {
    log_id: 101,
    user_id: "00000000-0000-0000-0000-000000000004",
    action: "INSERT",
    table_name: "inspections",
    record_id: "00000000-0000-0000-0000-000000001084",
    old_values: null,
    new_values: {
      tree_id: "tree_1084",
      condition_score: 1,
      body_part: "leaf",
      symptom_notes: "Severe foliar necrosis and basal bracket mycelium"
    },
    performed_at: "2026-11-04T18:24:00Z"
  },
  {
    log_id: 100,
    user_id: "00000000-0000-0000-0000-000000000001",
    action: "UPDATE",
    table_name: "trees",
    record_id: "00000000-0000-0000-0000-000000001084",
    old_values: {
      health_status: "fair",
      last_inspected_at: "2026-05-10T10:00:00Z"
    },
    new_values: {
      health_status: "under_treatment",
      last_inspected_at: "2026-11-04T18:24:00Z"
    },
    performed_at: "2026-11-04T18:24:01Z"
  }
];

let nextLogId = 102;

/**
 * Executes trg_fn_audit_trail()
 * Captures INSERT, UPDATE, DELETE diffs into audit_log
 */
export function recordAuditTrail(params: {
  user_id?: string | null;
  action: "INSERT" | "UPDATE" | "DELETE" | "DISPATCH" | "LOGIN";
  table_name: string;
  record_id: string;
  old_values?: Record<string, unknown> | null;
  new_values?: Record<string, unknown> | null;
}): AuditLog {
  const auditEntry: AuditLog = {
    log_id: nextLogId++,
    user_id: params.user_id || "00000000-0000-0000-0000-000000000004",
    action: params.action,
    table_name: params.table_name,
    record_id: params.record_id,
    old_values: params.old_values || null,
    new_values: params.new_values || null,
    performed_at: new Date().toISOString()
  };

  AUDIT_STORE.unshift(auditEntry);
  return auditEntry;
}

/**
 * Executes trg_fn_update_last_inspected()
 * Synchronizes trees.last_inspected_at and updates health_status upon severe condition
 */
export function triggerUpdateLastInspected(
  treeId: string,
  inspectedAt: string,
  conditionScore: number,
  userId?: string
): { success: boolean; tree: Tree | null; auditLog: AuditLog | null } {
  const treeIndex = TREES.findIndex(
    (t) => (t as any).id === treeId || t.tag_number === treeId || t.tree_id === treeId
  );
  if (treeIndex === -1) {
    return { success: false, tree: null, auditLog: null };
  }

  const oldTree = { ...TREES[treeIndex] };
  const oldValues = {
    health_status: oldTree.health_status,
    last_inspected_at: oldTree.last_inspected_at || null
  };

  // Synchronize timestamp
  TREES[treeIndex].last_inspected_at = inspectedAt;

  // Escalation: if condition_score == 1 (Critical), transition to under_treatment
  const currentStatus = String(TREES[treeIndex].health_status).toLowerCase();
  if (conditionScore === 1 && currentStatus !== "dead" && currentStatus !== "removed") {
    TREES[treeIndex].health_status = "under_treatment";
  }

  const newValues = {
    health_status: TREES[treeIndex].health_status,
    last_inspected_at: inspectedAt
  };

  // Generate audit trail for the updated tree
  const auditLog = recordAuditTrail({
    user_id: userId,
    action: "UPDATE",
    table_name: "trees",
    record_id: treeId,
    old_values: oldValues,
    new_values: newValues
  });

  return {
    success: true,
    tree: TREES[treeIndex],
    auditLog
  };
}

/**
 * Computes JSONB attribute diffs between old_values and new_values
 */
export function computeJsonbDiff(
  oldValues: Record<string, unknown> | null,
  newValues: Record<string, unknown> | null
): Record<string, { from: unknown; to: unknown }> {
  const diffs: Record<string, { from: unknown; to: unknown }> = {};

  if (!oldValues && newValues) {
    for (const key of Object.keys(newValues)) {
      diffs[key] = { from: null, to: newValues[key] };
    }
    return diffs;
  }

  if (oldValues && !newValues) {
    for (const key of Object.keys(oldValues)) {
      diffs[key] = { from: oldValues[key], to: null };
    }
    return diffs;
  }

  if (oldValues && newValues) {
    const allKeys = new Set([...Object.keys(oldValues), ...Object.keys(newValues)]);
    for (const key of allKeys) {
      if (oldValues[key] !== newValues[key]) {
        diffs[key] = {
          from: oldValues[key] ?? null,
          to: newValues[key] ?? null
        };
      }
    }
  }

  return diffs;
}

/**
 * Query audit logs with optional filtering
 */
export function getAuditLogs(filter?: {
  table_name?: string;
  record_id?: string;
  action?: string;
  limit?: number;
}): AuditLog[] {
  let logs = [...AUDIT_STORE];

  if (filter?.table_name) {
    logs = logs.filter((l) => l.table_name.toLowerCase() === filter.table_name!.toLowerCase());
  }
  if (filter?.record_id) {
    logs = logs.filter((l) => l.record_id === filter.record_id);
  }
  if (filter?.action) {
    logs = logs.filter((l) => l.action.toUpperCase() === filter.action!.toUpperCase());
  }

  if (filter?.limit) {
    logs = logs.slice(0, filter.limit);
  }

  return logs;
}
