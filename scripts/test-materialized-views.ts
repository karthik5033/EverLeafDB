/**
 * EverLeafDB Phase 24: Materialized Views & Concurrent Refresh Automation Test Suite
 *
 * Verifies:
 * 1. Materialized View mv_ward_health_summary schema and mathematical aggregation
 * 2. Unique index constraint validation (idx_mv_ward_health_pk on ward_id)
 * 3. Non-blocking concurrent refresh simulation (sp_refresh_ward_health_summary_concurrently)
 * 4. Latency performance speedup (< 5ms dashboard target verification)
 * 5. Immutable audit logging of refresh operations
 * 6. Strict role naming compliance (zero 'arborist' occurrences)
 */

import {
  getWardHealthSummary,
  refreshWardHealthSummaryConcurrently,
  benchmarkMaterializedViewVsLive,
  MATERIALIZED_WARD_HEALTH_SUMMARY
} from "../frontend/src/lib/materialized-views";
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
console.log("EVERLEAFDB PHASE 24: MATERIALIZED VIEWS & CONCURRENT REFRESH TEST SUITE");
console.log("================================================================================\n");

// --- TEST 1: Materialized View Precomputation ---
console.log("--- TEST 1: Materialized View Precomputation & Schema ---");
const mvResult = getWardHealthSummary(true);
assert("Materialized view returns rows array", Array.isArray(mvResult.data) && mvResult.data.length > 0);
assert("Query source is explicitly MATERIALIZED_VIEW", mvResult.query_source === "MATERIALIZED_VIEW");
assert("Refresh timestamp is populated", !!mvResult.refreshed_at);
assert("Execution latency is sub-5ms", mvResult.execution_latency_ms < 5.0);

// --- TEST 2: Aggregation Math & Relational Invariants ---
console.log("\n--- TEST 2: Aggregation Math & Relational Invariants ---");
const sampleRow = mvResult.data[0];
assert("Ward record contains required identity keys", !!sampleRow.ward_id && !!sampleRow.ward_name);
assert("Total trees >= sum of health categories", sampleRow.total_trees >= sampleRow.healthy_trees + sampleRow.dead_trees);
assert("Health index percentage is calibrated between 0% and 100%", sampleRow.health_index_pct >= 0 && sampleRow.health_index_pct <= 100);
assert("Average condition score is calibrated between 0 and 5", sampleRow.avg_condition_score >= 0 && sampleRow.avg_condition_score <= 5);
assert("Active outbreak flag matches active alerts threshold (flag = true if alerts >= 2)", sampleRow.active_outbreak_flag === (sampleRow.active_alerts_count >= 2));
assert("Overdue inspections count is non-negative", sampleRow.overdue_inspections_count >= 0);

// --- TEST 3: Unique Index (idx_mv_ward_health_pk) Guarantee ---
console.log("\n--- TEST 3: Unique Index Guarantee on ward_id ---");
const wardIdSet = new Set(mvResult.data.map(r => r.ward_id));
assert("All ward_id values are distinct and unique (enables REFRESH CONCURRENTLY)", wardIdSet.size === mvResult.data.length);

// --- TEST 4: Non-blocking Concurrent Refresh ---
console.log("\n--- TEST 4: Non-blocking Concurrent Refresh Execution ---");
const initialAuditCount = AUDIT_STORE.length;
const refreshRes = refreshWardHealthSummaryConcurrently("cron_test_worker");

assert("Concurrent refresh executes successfully", refreshRes.success === true);
assert("Rows refreshed matches total wards", refreshRes.rows_refreshed === mvResult.data.length);
assert("Refresh execution status is COMPLETED", refreshRes.status === "COMPLETED");
assert("Audit log recorded mv_ward_health_summary refresh entry", AUDIT_STORE.length === initialAuditCount + 1 && AUDIT_STORE[0].table_name === "mv_ward_health_summary");
assert("Audit log recorded CONCURRENT refresh type", (AUDIT_STORE[0].new_values as any)?.refresh_type === "CONCURRENT");

// --- TEST 5: Latency Benchmark & Performance Acceleration ---
console.log("\n--- TEST 5: Latency Benchmark & Performance Acceleration ---");
const benchmark = benchmarkMaterializedViewVsLive(30);
console.log(`  ℹ Live Relational Query Average: ${benchmark.live_query_avg_ms} ms`);
console.log(`  ℹ Materialized View Average: ${benchmark.materialized_view_avg_ms} ms`);
console.log(`  ℹ Performance Speedup Factor: ${benchmark.speedup_factor}x`);

assert("Materialized view latency meets < 5ms dashboard requirement", benchmark.materialized_view_avg_ms < 5.0);
assert("Materialized view accelerates query throughput (speedup > 1.0x)", benchmark.speedup_factor >= 1.0);
assert("Benchmark result flag meets_5ms_target is true", benchmark.meets_5ms_target === true);

// --- TEST 6: Strict Role Naming Compliance (Zero 'arborist' Occurrences) ---
console.log("\n--- TEST 6: Strict Role Naming Compliance ---");
const fullMvStr = JSON.stringify(mvResult).toLowerCase();
assert("Materialized view payload strictly complies with role naming (zero 'arborist' occurrences)", !fullMvStr.includes("arborist"));

console.log("\n================================================================================");
console.log(`RESULTS: ${passedAssertions} / ${totalAssertions} test assertions passed successfully.`);
console.log("================================================================================\n");

if (passedAssertions !== totalAssertions) {
  process.exit(1);
}
