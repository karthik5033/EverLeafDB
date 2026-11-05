/**
 * EverLeafDB Phase 13: Core Database Triggers & Audit Trail Test Suite
 * Tests PL/pgSQL triggers trg_fn_update_last_inspected() and trg_fn_audit_trail()
 */

import {
  triggerUpdateLastInspected,
  recordAuditTrail,
  computeJsonbDiff,
  getAuditLogs,
  AUDIT_STORE
} from "../frontend/src/lib/audit";
import { TREES } from "../frontend/src/lib/db";

async function runTriggerTests() {
  console.log("================================================================================");
  console.log("EVERLEAFDB PHASE 13: CORE OPERATIONAL TRIGGERS & AUDIT TRAIL TEST SUITE");
  console.log("================================================================================\n");

  let passed = 0;
  let total = 0;

  function assert(desc: string, condition: boolean) {
    total++;
    if (condition) {
      console.log(`  ✓ [PASS] ${desc}`);
      passed++;
    } else {
      console.error(`  ✗ [FAIL] ${desc}`);
    }
  }

  // -------------------------------------------------------------------------
  // TEST 1: trg_fn_update_last_inspected() timestamp synchronization
  // -------------------------------------------------------------------------
  console.log("--- TEST 1: trg_fn_update_last_inspected() Timestamp Synchronization ---");
  const targetTree = TREES[1]; // Neem Tree ("HEALTHY")
  const oldTimestamp = targetTree.last_inspected_at;
  const newInspectionTime = new Date().toISOString();

  const syncResult = triggerUpdateLastInspected(
    targetTree.tree_id || targetTree.id,
    newInspectionTime,
    4, // Healthy condition score
    "00000000-0000-0000-0000-000000000004"
  );

  assert("Trigger successfully updates trees.last_inspected_at", syncResult.success);
  assert(
    "Target tree last_inspected_at matches new inspection timestamp exactly",
    targetTree.last_inspected_at === newInspectionTime
  );
  assert(
    "Condition score = 4 preserves healthy status",
    targetTree.health_status === "HEALTHY" || targetTree.health_status === "good"
  );

  // -------------------------------------------------------------------------
  // TEST 2: trg_fn_update_last_inspected() health status escalation on score=1
  // -------------------------------------------------------------------------
  console.log("\n--- TEST 2: Health Status Escalation on Critical Condition (Score = 1) ---");
  const lethalInspectionTime = new Date().toISOString();
  const lethalResult = triggerUpdateLastInspected(
    targetTree.tree_id || targetTree.id,
    lethalInspectionTime,
    1, // Critical lethal score
    "00000000-0000-0000-0000-000000000004"
  );

  assert("Trigger executed for critical inspection", lethalResult.success);
  assert(
    "Tree health_status escalated to 'under_treatment' upon score = 1",
    targetTree.health_status === "under_treatment"
  );

  // -------------------------------------------------------------------------
  // TEST 3: trg_fn_audit_trail() INSERT capturing
  // -------------------------------------------------------------------------
  console.log("\n--- TEST 3: trg_fn_audit_trail() INSERT Operation ---");
  const insertAudit = recordAuditTrail({
    user_id: "00000000-0000-0000-0000-000000000004",
    action: "INSERT",
    table_name: "trees",
    record_id: "00000000-0000-0000-0000-000000009999",
    old_values: null,
    new_values: {
      tree_id: "tree_9999",
      species_id: 1,
      ward_id: 2,
      health_status: "good"
    }
  });

  assert("INSERT audit log record created", insertAudit.log_id > 0);
  assert("INSERT action correctly logged", insertAudit.action === "INSERT");
  assert("old_values is null for INSERT", insertAudit.old_values === null);
  assert("new_values contains inserted attributes", insertAudit.new_values?.tree_id === "tree_9999");

  // -------------------------------------------------------------------------
  // TEST 4: trg_fn_audit_trail() UPDATE Operation & JSONB Diff
  // -------------------------------------------------------------------------
  console.log("\n--- TEST 4: trg_fn_audit_trail() UPDATE Operation & Diff ---");
  const updateAudit = recordAuditTrail({
    user_id: "00000000-0000-0000-0000-000000000001",
    action: "UPDATE",
    table_name: "trees",
    record_id: "00000000-0000-0000-0000-000000009999",
    old_values: {
      health_status: "good",
      height_meters: 8.5
    },
    new_values: {
      health_status: "critical",
      height_meters: 8.5
    }
  });

  const diff = computeJsonbDiff(updateAudit.old_values, updateAudit.new_values);
  assert("UPDATE audit log record created", updateAudit.action === "UPDATE");
  assert("JSONB diff detects modified health_status", diff.health_status !== undefined);
  assert("JSONB diff transitions from 'good' to 'critical'", diff.health_status.from === "good" && diff.health_status.to === "critical");
  assert("Unchanged attribute 'height_meters' is excluded from delta diff", diff.height_meters === undefined);

  // -------------------------------------------------------------------------
  // TEST 5: trg_fn_audit_trail() DELETE Operation
  // -------------------------------------------------------------------------
  console.log("\n--- TEST 5: trg_fn_audit_trail() DELETE Operation ---");
  const deleteAudit = recordAuditTrail({
    user_id: "00000000-0000-0000-0000-000000000001",
    action: "DELETE",
    table_name: "work_orders",
    record_id: "00000000-0000-0000-0000-000000008888",
    old_values: {
      order_id: "wo_8888",
      status: "CANCELLED"
    },
    new_values: null
  });

  assert("DELETE audit log record created", deleteAudit.action === "DELETE");
  assert("new_values is null for DELETE", deleteAudit.new_values === null);
  assert("old_values captures deleted state", deleteAudit.old_values?.order_id === "wo_8888");

  // -------------------------------------------------------------------------
  // TEST 6: Audit Log Store Query & Filter Verification
  // -------------------------------------------------------------------------
  console.log("\n--- TEST 6: Audit Log Query & Filtering ---");
  const treeLogs = getAuditLogs({ table_name: "trees" });
  assert("Filtering by table_name='trees' returns only tree audits", treeLogs.every((l) => l.table_name === "trees"));

  console.log("\n================================================================================");
  console.log(`RESULTS: ${passed} / ${total} test assertions passed successfully.`);
  console.log("================================================================================\n");

  if (passed !== total) {
    process.exit(1);
  }
}

runTriggerTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
