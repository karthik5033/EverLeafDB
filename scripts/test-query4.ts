/**
 * EverLeafDB Phase 19: Hybrid Query 4 Test Suite
 * Tests Treatment Efficacy & Cost Ranking: SQL aggregation, DENSE_RANK() window ordering, and ROI metrics.
 */

import { executeTreatmentEfficacyRanking } from "../frontend/src/lib/treatment-analytics";

async function runQuery4Tests() {
  console.log("================================================================================");
  console.log("EVERLEAFDB PHASE 19: HYBRID QUERY 4 (TREATMENT EFFICACY & ROI) TEST SUITE");
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
  // TEST 1: Basic Hybrid Query 4 Execution
  // -------------------------------------------------------------------------
  console.log("--- TEST 1: Basic Hybrid Query 4 Execution ---");
  const response = executeTreatmentEfficacyRanking();

  assert("Query execution succeeds", response.success);
  assert("Records array populated with therapeutic evaluations", response.records.length > 0);
  assert("Category ROI summaries generated", response.categories.length > 0);
  assert("KPIs summary calculated", response.kpis.overall_cure_rate > 0);

  // -------------------------------------------------------------------------
  // TEST 2: Aggregation Math Verification
  // -------------------------------------------------------------------------
  console.log("\n--- TEST 2: Aggregation Math & Success Rate Exactness ---");
  const mathCorrect = response.records.every((r) => {
    const totalCheck = r.total_administered === r.successful_cures + r.failed_outcomes;
    const rateCheck = Math.abs(r.success_rate_percent - ((r.successful_cures / r.total_administered) * 100)) < 0.05;
    return totalCheck && rateCheck;
  });
  assert("total_administered = successful_cures + failed_outcomes and success_rate_percent is exact", mathCorrect);

  // -------------------------------------------------------------------------
  // TEST 3: Window Ranking Monotonicity (DENSE_RANK() per disease)
  // -------------------------------------------------------------------------
  console.log("\n--- TEST 3: DENSE_RANK() Window Ordering ---");
  const grouped: Record<number, number[]> = {};
  response.records.forEach((r) => {
    if (!grouped[r.disease_id]) grouped[r.disease_id] = [];
    grouped[r.disease_id].push(r.roi_rank);
  });

  const rankStartsAtOne = Object.values(grouped).every((ranks) => ranks.includes(1));
  assert("Every disease group has a Rank #1 top-performing protocol", rankStartsAtOne);

  // -------------------------------------------------------------------------
  // TEST 4: Single Disease Filter Query
  // -------------------------------------------------------------------------
  console.log("\n--- TEST 4: Disease Filter Query (Disease 1 - Ganoderma) ---");
  const disease1Response = executeTreatmentEfficacyRanking(1);
  assert("Filtered query returns records strictly for disease_id = 1", disease1Response.records.every((r) => r.disease_id === 1));
  assert("Selected disease metadata returned", disease1Response.selected_disease?.disease_id === 1);

  // -------------------------------------------------------------------------
  // TEST 5: Financial Metrics Validity
  // -------------------------------------------------------------------------
  console.log("\n--- TEST 5: Financial Metrics Validity ---");
  const validFinancials = response.records.every((r) => r.avg_actual_cost > 0 && r.cost_per_cure >= r.avg_actual_cost);
  assert("avg_actual_cost > 0 and cost_per_cure >= avg_actual_cost across all records", validFinancials);

  // -------------------------------------------------------------------------
  // TEST 6: Strict Role Compliance (Zero forbidden title occurrences)
  // -------------------------------------------------------------------------
  console.log("\n--- TEST 6: Strict Field Inspector Compliance Check ---");
  const fullText = JSON.stringify(response).toLowerCase();
  assert("Analytics engine payload strictly complies with role naming (zero 'arborist' occurrences)", !fullText.includes("arborist"));

  // -------------------------------------------------------------------------
  // TEST 7: Query Execution Latency Benchmark
  // -------------------------------------------------------------------------
  console.log("\n--- TEST 7: Latency Benchmark ---");
  assert("Query 4 execution latency is sub-15ms", response.execution_stats.latency_ms < 15.0);

  console.log("\n================================================================================");
  console.log(`RESULTS: ${passed} / ${total} test assertions passed successfully.`);
  console.log("================================================================================\n");

  if (passed !== total) {
    process.exit(1);
  }
}

runQuery4Tests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
