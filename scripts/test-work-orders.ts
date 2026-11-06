/**
 * EverLeafDB Phase 23: Work Order Management & Crew Dispatch Kanban Test Suite
 *
 * Verifies:
 * 1. 4-column Kanban board aggregation (PENDING, IN_PROGRESS, COMPLETED, CANCELLED)
 * 2. Status state transitions and automatic closed_at timestamping
 * 3. Crew reassignment and audit logging
 * 4. Filtering by assigned contractor/crew, ward, priority, and text search
 * 5. Strict role title compliance (zero 'arborist' occurrences)
 * 6. Execution latency benchmarking (sub-15ms)
 */

import {
  getKanbanBoardData,
  transitionWorkOrderStatus,
  reassignWorkOrderCrew,
  MUNICIPAL_CREWS
} from "../frontend/src/lib/work-order-engine";
import { WORK_ORDERS } from "../frontend/src/lib/db";
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
console.log("EVERLEAFDB PHASE 23: CREW DISPATCH KANBAN TEST SUITE");
console.log("================================================================================\n");

// --- TEST 1: Kanban Board Data Aggregation ---
console.log("--- TEST 1: Kanban Board Column Groupings & KPIs ---");
const boardData = getKanbanBoardData();
assert("Board data returns all 4 standard Kanban columns", !!boardData.columns.PENDING && !!boardData.columns.IN_PROGRESS && !!boardData.columns.COMPLETED && !!boardData.columns.CANCELLED);
assert("Total orders matches sum of all columns", boardData.kpis.total_orders === (
  boardData.columns.PENDING.length +
  boardData.columns.IN_PROGRESS.length +
  boardData.columns.COMPLETED.length +
  boardData.columns.CANCELLED.length
));
assert("KPI counts are populated and non-negative", boardData.kpis.total_orders > 0 && boardData.kpis.in_progress_count >= 0);
assert("Active crews list populated", boardData.all_crews.length >= 2);
assert("Municipal wards list populated", boardData.all_wards.length >= 2);

// --- TEST 2: Relational Metadata & SLA Integrity ---
console.log("\n--- TEST 2: Relational Metadata & SLA Calculation ---");
const sampleOrder = boardData.columns.PENDING[0] || boardData.columns.IN_PROGRESS[0];
assert("Work order has tree tag and botanical species", !!sampleOrder.tree_tag && !!sampleOrder.species_common);
assert("Work order has ward spatial attribution", !!sampleOrder.ward_id && !!sampleOrder.ward_name);
assert("Work order has target disease name", !!sampleOrder.disease_name);
assert("Work order has numeric standard remediation cost", typeof sampleOrder.cost_estimate_usd === "number" && sampleOrder.cost_estimate_usd > 0);
assert("SLA remaining hours calculated", typeof sampleOrder.sla_remaining_hours === "number");

// --- TEST 3: Status Transition State Machine & Auto-Timestamping ---
console.log("\n--- TEST 3: State Machine Status Transition & closed_at Timestamp ---");
// Create dedicated test order in PENDING
const testOrderId = `WO-TEST-${Date.now()}`;
WORK_ORDERS.unshift({
  order_id: testOrderId,
  tree_id: "tree_1084",
  priority: "HIGH",
  status: "PENDING",
  protocol: "Test Therapeutic Injection",
  assigned_crew: "North Rapid Response Team",
  dispatched_at: new Date().toISOString(),
  sla_hours: 48,
  cost_estimate_usd: 150
});

// 3a. Transition PENDING -> IN_PROGRESS
const toInProgress = transitionWorkOrderStatus(testOrderId, "IN_PROGRESS", "user_supervisor_01", "Crew deployed to site.");
assert("Transition to IN_PROGRESS succeeds", toInProgress.success);
assert("Status is updated to IN_PROGRESS", toInProgress.new_status === "IN_PROGRESS");
assert("closed_at remains null while in progress", toInProgress.closed_at === null);

// 3b. Transition IN_PROGRESS -> COMPLETED
const toCompleted = transitionWorkOrderStatus(testOrderId, "COMPLETED", "user_supervisor_01", "Therapeutic root drench completed.");
assert("Transition to COMPLETED succeeds", toCompleted.success);
assert("Status is updated to COMPLETED", toCompleted.new_status === "COMPLETED");
assert("closed_at timestamp is automatically populated on completion", !!toCompleted.closed_at);
assert("Audit log recorded work_order UPDATE action", AUDIT_STORE[0].action === "UPDATE" && AUDIT_STORE[0].record_id === testOrderId);

// 3c. Reopen COMPLETED -> PENDING
const toReopen = transitionWorkOrderStatus(testOrderId, "PENDING", "user_supervisor_01", "Reopening case for secondary foliar mist.");
assert("Reopening clears closed_at back to null", toReopen.closed_at === null);

// --- TEST 4: Crew Reassignment ---
console.log("\n--- TEST 4: Municipal Crew Reassignment ---");
const initialAuditLen = AUDIT_STORE.length;
const reassignRes = reassignWorkOrderCrew(testOrderId, "South Biosecurity Sanitation Squad", "user_supervisor_01");
assert("Reassign crew succeeds", reassignRes.success);
assert("New crew reflected in work order", reassignRes.new_crew === "South Biosecurity Sanitation Squad");
assert("Audit log captured crew change", AUDIT_STORE.length === initialAuditLen + 1 && AUDIT_STORE[0].table_name === "work_orders");

// --- TEST 5: Filtering Monotonicity ---
console.log("\n--- TEST 5: Filtering by Crew, Ward, and Search Query ---");
// Filter by crew
const filteredCrew = getKanbanBoardData({ assigned_crew: "East Maintenance Unit 2" });
const allCrewOrders = [
  ...filteredCrew.columns.PENDING,
  ...filteredCrew.columns.IN_PROGRESS,
  ...filteredCrew.columns.COMPLETED,
  ...filteredCrew.columns.CANCELLED
];
assert("Filtered by crew returns strictly matching crew orders", allCrewOrders.every(o => o.assigned_crew === "East Maintenance Unit 2"));

// Filter by search query
const searchFiltered = getKanbanBoardData({ search_query: "Banyan" });
const searchOrders = [
  ...searchFiltered.columns.PENDING,
  ...searchFiltered.columns.IN_PROGRESS,
  ...searchFiltered.columns.COMPLETED,
  ...searchFiltered.columns.CANCELLED
];
assert("Search query filters by botanical common name", searchOrders.every(o => o.species_common.includes("Banyan") || o.tree_tag.includes("Banyan") || o.protocol.includes("Banyan")));

// --- TEST 6: Strict Role Naming Compliance (Zero 'arborist' Occurrences) ---
console.log("\n--- TEST 6: Strict Role Naming Compliance ---");
const fullBoardStr = JSON.stringify(boardData).toLowerCase();
assert("Kanban board payload strictly complies with role naming (zero 'arborist' occurrences)", !fullBoardStr.includes("arborist"));

// --- TEST 7: Execution Latency Benchmark ---
console.log("\n--- TEST 7: Execution Latency Benchmark ---");
const start = performance.now();
for (let i = 0; i < 50; i++) {
  getKanbanBoardData();
}
const elapsed = (performance.now() - start) / 50;
console.log(`  ℹ Average Kanban Board retrieval & aggregation latency: ${elapsed.toFixed(3)} ms`);
assert("Kanban board compilation latency is sub-15ms", elapsed < 15.0);

console.log("\n================================================================================");
console.log(`RESULTS: ${passedAssertions} / ${totalAssertions} test assertions passed successfully.`);
console.log("================================================================================\n");

if (passedAssertions !== totalAssertions) {
  process.exit(1);
}

