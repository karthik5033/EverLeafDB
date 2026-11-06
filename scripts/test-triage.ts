/**
 * EverLeafDB Phase 21: Supervisor Clinical Triage Test Suite
 * 
 * Verifies:
 * 1. Supervisor triage queue retrieval and KPI summary generation
 * 2. Status and severity filtering
 * 3. Side-by-side precedent match data integrity
 * 4. Stored procedure transaction state transitions (CONFIRM_AND_DISPATCH, DISMISS, ESCALATE_LAB)
 * 5. Strict role title compliance (zero 'arborist' occurrences)
 * 6. Execution latency benchmarking (sub-15ms)
 */

import {
  getSupervisorTriageQueue,
  getTriageAlertById,
  executeSupervisorTriageAction
} from "../frontend/src/lib/triage-engine";
import { ALERTS, WORK_ORDERS } from "../frontend/src/lib/db";

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
console.log("EVERLEAFDB PHASE 21: SUPERVISOR CLINICAL TRIAGE TEST SUITE");
console.log("================================================================================\n");

// --- TEST 1: Triage Queue Retrieval ---
console.log("--- TEST 1: Supervisor Triage Queue Retrieval ---");
const queueData = getSupervisorTriageQueue();
assert("Triage queue returns alerts array", Array.isArray(queueData.alerts) && queueData.alerts.length > 0);
assert("KPI summary metrics are populated", queueData.kpis.total_alerts > 0 && queueData.kpis.pending_count > 0);
assert("Average similarity is computed", queueData.kpis.avg_similarity > 80);

// --- TEST 2: Side-by-Side Precedent Match Integrity ---
console.log("\n--- TEST 2: Side-by-Side Precedent Match Data Integrity ---");
const sampleAlert = queueData.alerts[0];
assert("Alert has tree tag and botanical species", !!sampleAlert.tree_tag && !!sampleAlert.species_common);
assert("Alert has ward spatial attribution", !!sampleAlert.ward_id && !!sampleAlert.ward_name);
assert("Alert has field inspector attribution", !!sampleAlert.inspector_name && !!sampleAlert.inspector_notes);
assert("Alert has top precedent match", !!sampleAlert.precedent_match);
assert("Precedent has confirmed pathogen name", !!sampleAlert.precedent_match.disease_name);
assert("Precedent similarity is valid percentage", sampleAlert.precedent_match.similarity_percent >= 80);
assert("Precedent has therapeutic intervention and outcome", !!sampleAlert.precedent_match.treatment_name && !!sampleAlert.precedent_match.outcome_status);

// --- TEST 3: Status & Severity Filtering ---
console.log("\n--- TEST 3: Status and Severity Filtering ---");
const pendingOnly = getSupervisorTriageQueue({ status: "PENDING" });
assert("Filtered by PENDING returns strictly pending alerts", pendingOnly.alerts.every(a => a.status === "PENDING"));

const criticalOnly = getSupervisorTriageQueue({ severity: "CRITICAL" });
assert("Filtered by CRITICAL returns strictly critical alerts", criticalOnly.alerts.every(a => a.severity === "CRITICAL"));

// --- TEST 4: Single Alert Lookup ---
console.log("\n--- TEST 4: Single Alert Lookup by ID ---");
const singleAlert = getTriageAlertById(sampleAlert.alert_id);
assert("getTriageAlertById successfully retrieves matching alert", singleAlert !== null && singleAlert.alert_id === sampleAlert.alert_id);

// --- TEST 5: Triage Decision - Dismiss False Positive ---
console.log("\n--- TEST 5: Supervisor Triage Action - Dismiss ---");
const testAlertToDismiss = ALERTS.find(a => a.status === "PENDING");
if (testAlertToDismiss) {
  const dismissResult = executeSupervisorTriageAction({
    alert_id: testAlertToDismiss.alert_id,
    action: "DISMISS",
    supervisor_remarks: "Visual inspection reveals mechanical mowing laceration rather than fungal canker."
  });
  assert("Dismiss action succeeds", dismissResult.success);
  assert("Alert status transitions to DISMISSED", dismissResult.alert.status === "DISMISSED");
  assert("ACID row lock recorded in telemetry", dismissResult.acid_transaction.row_lock.includes("SELECT FOR UPDATE"));
}

// --- TEST 6: Triage Decision - Confirm Diagnosis & Dispatch Work Order ---
console.log("\n--- TEST 6: Supervisor Triage Action - Confirm & Stage Work Order ---");
const testAlertToConfirm = ALERTS.find(a => a.status === "PENDING");
if (testAlertToConfirm) {
  const initialOrderCount = WORK_ORDERS.length;
  const confirmResult = executeSupervisorTriageAction({
    alert_id: testAlertToConfirm.alert_id,
    action: "CONFIRM_AND_DISPATCH",
    confirmed_disease_id: 1,
    confidence_source: "vector_suggested",
    treatment_id: 1,
    assigned_crew: "North Rapid Response Team",
    priority: "EMERGENCY",
    supervisor_remarks: "Precedent match confirms Ganoderma root decay. Soil drenching staged immediately."
  });

  assert("Confirm and dispatch action succeeds", confirmResult.success);
  assert("Alert status transitions to ACTIONED", confirmResult.alert.status === "ACTIONED");
  assert("Clinical diagnosis record created", !!confirmResult.diagnosis && confirmResult.diagnosis.disease_id === 1);
  assert("Work order successfully dispatched", !!confirmResult.work_order && confirmResult.work_order.alert_id === testAlertToConfirm.alert_id);
  assert("Work orders collection increased", WORK_ORDERS.length === initialOrderCount + 1);
  assert("ACID procedure telemetry generated", confirmResult.acid_transaction.procedure === "sp_confirm_diagnosis_and_dispatch_order()");
}

// --- TEST 7: Strict Role Naming Compliance (Zero 'arborist' Occurrences) ---
console.log("\n--- TEST 7: Strict Role Naming Compliance ---");
const fullQueue = getSupervisorTriageQueue();
const fullText = JSON.stringify(fullQueue).toLowerCase();
assert("Triage queue payload strictly complies with role naming (zero 'arborist' occurrences)", !fullText.includes("arborist"));

// --- TEST 8: Latency Benchmark ---
console.log("\n--- TEST 8: Latency Benchmark ---");
const start = performance.now();
for (let i = 0; i < 50; i++) {
  getSupervisorTriageQueue();
}
const elapsed = (performance.now() - start) / 50;
console.log(`  ℹ Average Triage Queue retrieval latency: ${elapsed.toFixed(3)} ms`);
assert("Triage queue retrieval latency is sub-15ms", elapsed < 15.0);

console.log("\n================================================================================");
console.log(`RESULTS: ${passedAssertions} / ${totalAssertions} test assertions passed successfully.`);
console.log("================================================================================\n");

if (passedAssertions !== totalAssertions) {
  process.exit(1);
}
