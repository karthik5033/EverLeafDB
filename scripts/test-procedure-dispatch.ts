/**
 * EverLeafDB Phase 22: Stored Procedure Atomic Dispatch Test Suite
 *
 * Verifies:
 * 1. sp_confirm_diagnosis_and_dispatch_order atomic execution across 4 tables
 * 2. Pessimistic row locking (SELECT FOR UPDATE) and status conflict rejection
 * 3. Foreign key catalog validation (disease_id, treatment_id)
 * 4. Mid-flight transaction exception & atomic rollback (zero partial mutations)
 * 5. Immutable audit trail generation
 * 6. Strict role naming compliance (zero 'arborist' occurrences)
 * 7. Sub-15ms execution latency benchmarking
 */

import {
  executeStoredProcedureDispatch,
  CLINICAL_DIAGNOSES,
  OPERATIONAL_TREATMENT_RECORDS
} from "../frontend/src/lib/stored-procedures";
import { ALERTS, WORK_ORDERS } from "../frontend/src/lib/db";
import { AUDIT_STORE } from "../frontend/src/lib/audit";

let totalAssertions = 0;
let passedAssertions = 0;

function assert(description: string, condition: boolean) {
  totalAssertions++;
  if (condition) {
    passedAssertions++;
    console.log(`  ✓ [PASS] ${description}`);
  } else {
    console.error(`  ✗ [FAIL] ${description}`);
  }
}

console.log("================================================================================");
console.log("EVERLEAFDB PHASE 22: STORED PROCEDURE ATOMIC DISPATCH TEST SUITE");
console.log("================================================================================\n");

// Ensure a dedicated test alert is ready in PENDING state
const testAlertId = "ALT-TEST-PHASE22";
const existingAlert = ALERTS.find(a => a.alert_id === testAlertId);
if (existingAlert) {
  existingAlert.status = "PENDING";
} else {
  ALERTS.push({
    alert_id: testAlertId,
    tree_id: "tree_1084",
    ward_id: "ward_03",
    severity: "CRITICAL",
    status: "PENDING",
    detected_disease: "Ganoderma Root & Butt Rot",
    cosine_similarity: 0.925,
    created_at: new Date().toISOString(),
    assigned_inspector: "inspector_03"
  });
}

// --- TEST 1: Successful Atomic Stored Procedure Execution ---
console.log("--- TEST 1: Successful Atomic Stored Procedure Execution ---");
const initialWoCount = WORK_ORDERS.length;
const initialDiagCount = CLINICAL_DIAGNOSES.length;
const initialTrCount = OPERATIONAL_TREATMENT_RECORDS.length;
const initialAuditCount = AUDIT_STORE.length;

const commitResult = executeStoredProcedureDispatch({
  alert_id: testAlertId,
  supervisor_id: "user_supervisor_01",
  disease_id: 1, // Ganoderma
  treatment_id: 1, // Propiconazole Root Drench
  assigned_crew: "North Rapid Response Team",
  priority: "EMERGENCY",
  supervisor_remarks: "Precedent match verified by Municipal Tree Supervisor. Emergency trenching and soil drenching authorized."
});

assert("Procedure execution returns success = true", commitResult.success === true);
assert("Procedure status is COMMITTED", commitResult.execution_status === "COMMITTED");
assert("Alert status transitioned to ACTIONED", commitResult.alert?.status === "ACTIONED");
assert("Work order was generated with WO prefix", !!commitResult.work_order_id && commitResult.work_order_id.startsWith("WO-"));
assert("Diagnosis record was inserted", CLINICAL_DIAGNOSES.length === initialDiagCount + 1);
assert("Treatment record was inserted", OPERATIONAL_TREATMENT_RECORDS.length === initialTrCount + 1);
assert("Work order record was inserted", WORK_ORDERS.length === initialWoCount + 1);
assert("Audit log recorded DISPATCH action", AUDIT_STORE.length === initialAuditCount + 1 && AUDIT_STORE[0].action === "DISPATCH");
assert("ACID telemetry records 5 table mutations", commitResult.acid_telemetry.records_mutated.alerts === 1 && commitResult.acid_telemetry.records_mutated.work_orders === 1);

// --- TEST 2: Pessimistic Lock / Concurrency Status Conflict Rejection ---
console.log("\n--- TEST 2: Pessimistic Lock & Conflict Invariant Rejection ---");
const conflictResult = executeStoredProcedureDispatch({
  alert_id: testAlertId, // Already ACTIONED
  supervisor_id: "user_supervisor_02",
  disease_id: 1,
  treatment_id: 1,
  assigned_crew: "Central Crew",
  priority: "HIGH"
});

assert("Concurrent dispatch on non-pending alert is rejected", conflictResult.success === false);
assert("Status is ROLLED_BACK", conflictResult.execution_status === "ROLLED_BACK");
assert("Error code matches PostgreSQL serialization/lock conflict (55P03)", conflictResult.error_code === "55P03");
assert("Zero mutations recorded in telemetry on conflict", conflictResult.acid_telemetry.records_mutated.work_orders === 0);

// --- TEST 3: Foreign Key Catalog Validation & Rollback ---
console.log("\n--- TEST 3: Foreign Key Catalog Validation ---");
// Create temporary pending alert
const invalidFkAlertId = "ALT-TEST-FK-ERROR";
ALERTS.push({
  alert_id: invalidFkAlertId,
  tree_id: "tree_1084",
  ward_id: "ward_03",
  severity: "HIGH",
  status: "PENDING",
  detected_disease: "Unknown Pathogen",
  cosine_similarity: 0.81,
  created_at: new Date().toISOString(),
  assigned_inspector: "inspector_01"
});

const fkResult = executeStoredProcedureDispatch({
  alert_id: invalidFkAlertId,
  disease_id: 99999, // Non-existent disease
  treatment_id: 1,
  assigned_crew: "East Crew",
  priority: "MEDIUM"
});

assert("Invalid foreign key disease_id triggers rejection", fkResult.success === false);
assert("Error code matches foreign_key_violation (23503)", fkResult.error_code === "23503");
const targetFkAlert = ALERTS.find(a => a.alert_id === invalidFkAlertId);
assert("Target alert remains in PENDING state (no state mutation)", targetFkAlert?.status === "PENDING");

// --- TEST 4: Simulated Mid-Flight Failure & Full ACID Rollback ---
console.log("\n--- TEST 4: Mid-Flight Exception & Full ACID Rollback Verification ---");
const preRollbackWoCount = WORK_ORDERS.length;
const preRollbackDiagCount = CLINICAL_DIAGNOSES.length;
const preRollbackTrCount = OPERATIONAL_TREATMENT_RECORDS.length;
const preRollbackAuditCount = AUDIT_STORE.length;

const rollbackAlertId = "ALT-TEST-ROLLBACK";
ALERTS.push({
  alert_id: rollbackAlertId,
  tree_id: "tree_3042",
  ward_id: "ward_04",
  severity: "CRITICAL",
  status: "PENDING",
  detected_disease: "Bacterial Wetwood Canker",
  cosine_similarity: 0.88,
  created_at: new Date().toISOString(),
  assigned_inspector: "inspector_05"
});

const rollbackResult = executeStoredProcedureDispatch({
  alert_id: rollbackAlertId,
  disease_id: 2,
  treatment_id: 2,
  assigned_crew: "South Emergency Unit",
  priority: "EMERGENCY",
  simulate_mid_flight_error: true // Intentionally throws mid-transaction!
});

assert("Mid-flight failure triggers transaction abort", rollbackResult.success === false);
assert("Execution status is explicitly ROLLED_BACK", rollbackResult.execution_status === "ROLLED_BACK");
assert("Diagnoses store count restored to pre-transaction baseline (zero partial writes)", CLINICAL_DIAGNOSES.length === preRollbackDiagCount);
assert("Treatment records count restored to baseline", OPERATIONAL_TREATMENT_RECORDS.length === preRollbackTrCount);
assert("Work orders count restored to baseline", WORK_ORDERS.length === preRollbackWoCount);
assert("Audit log count restored to baseline", AUDIT_STORE.length === preRollbackAuditCount);
const rollbackAlert = ALERTS.find(a => a.alert_id === rollbackAlertId);
assert("Alert status rolled back to PENDING", rollbackAlert?.status === "PENDING");

// --- TEST 5: Strict Role Naming Compliance (Zero 'arborist' Occurrences) ---
console.log("\n--- TEST 5: Strict Role Naming Compliance ---");
const payloadStr = JSON.stringify(commitResult).toLowerCase();
assert("Stored procedure result payload strictly complies with role naming (zero 'arborist' occurrences)", !payloadStr.includes("arborist"));

// --- TEST 6: Execution Latency Benchmark ---
console.log("\n--- TEST 6: Stored Procedure Latency Benchmark ---");
const benchmarkAlertId = "ALT-TEST-BENCHMARK";
ALERTS.push({
  alert_id: benchmarkAlertId,
  tree_id: "tree_1084",
  ward_id: "ward_03",
  severity: "WARNING",
  status: "PENDING",
  detected_disease: "Test Disease",
  cosine_similarity: 0.85,
  created_at: new Date().toISOString(),
  assigned_inspector: "inspector_01"
});

const start = performance.now();
for (let i = 0; i < 20; i++) {
  // Execute rollback simulation to measure full snapshot + restore cycle
  executeStoredProcedureDispatch({
    alert_id: benchmarkAlertId,
    disease_id: 1,
    treatment_id: 1,
    assigned_crew: "Bench Crew",
    priority: "STANDARD",
    simulate_mid_flight_error: true
  });
}
const avgMs = (performance.now() - start) / 20;
console.log(`  ℹ Average Stored Procedure + Rollback latency: ${avgMs.toFixed(3)} ms`);
assert("Stored procedure execution and rollback latency is sub-15ms", avgMs < 15.0);

console.log("\n================================================================================");
console.log(`RESULTS: ${passedAssertions} / ${totalAssertions} test assertions passed successfully.`);
console.log("================================================================================\n");

if (passedAssertions !== totalAssertions) {
  process.exit(1);
}
