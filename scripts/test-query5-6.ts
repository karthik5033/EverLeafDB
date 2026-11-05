/**
 * EverLeafDB Phase 20: Hybrid Query 5 & 6 Test Suite
 * Tests Overdue Inspections Query 5 and Tree Mortality Window Drivers Query 6.
 */

import {
  executeOverdueInspectionsQuery,
  executeTreeMortalityDriversQuery
} from "../frontend/src/lib/mortality-analytics";

async function runQuery5and6Tests() {
  console.log("================================================================================");
  console.log("EVERLEAFDB PHASE 20: HYBRID QUERY 5 & 6 (OVERDUE & MORTALITY) TEST SUITE");
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
  // TEST 1: Query 5 (Overdue Inspections) Basic Execution
  // -------------------------------------------------------------------------
  console.log("--- TEST 1: Query 5 Overdue Inspections Execution ---");
  const overdue180 = executeOverdueInspectionsQuery({ overdueDays: 180 });

  assert("Query 5 execution succeeds", overdue180.success);
  assert("Overdue trees array populated", overdue180.overdue_trees.length > 0);
  assert("Ward summaries array populated", overdue180.ward_summaries.length > 0);

  // -------------------------------------------------------------------------
  // TEST 2: Query 5 Threshold Constraint (days_overdue >= 180)
  // -------------------------------------------------------------------------
  console.log("\n--- TEST 2: Query 5 Overdue Days Threshold Constraint ---");
  const allOverdue180 = overdue180.overdue_trees.every((t) => t.days_overdue >= 180);
  assert("All flagged trees have days_overdue >= 180", allOverdue180);

  // -------------------------------------------------------------------------
  // TEST 3: Query 5 Ward Partition Ranking
  // -------------------------------------------------------------------------
  console.log("\n--- TEST 3: Query 5 Ward Partition Ranking Monotonicity ---");
  const wardGroups: Record<string, number[]> = {};
  overdue180.overdue_trees.forEach((t) => {
    if (!wardGroups[t.ward_id]) wardGroups[t.ward_id] = [];
    wardGroups[t.ward_id].push(t.ward_rank);
  });

  const ranksStartAtOne = Object.values(wardGroups).every((ranks) => ranks.includes(1));
  assert("Every ward group has a Rank #1 most overdue tree", ranksStartAtOne);

  // -------------------------------------------------------------------------
  // TEST 4: Query 5 Ward Filter
  // -------------------------------------------------------------------------
  console.log("\n--- TEST 4: Query 5 Ward Filter ---");
  const wardFiltered = executeOverdueInspectionsQuery({ overdueDays: 180, wardId: "ward_03" });
  assert("Filtered query returns trees strictly for ward_03", wardFiltered.overdue_trees.every((t) => t.ward_id === "ward_03"));

  // -------------------------------------------------------------------------
  // TEST 5: Query 6 (Tree Mortality Drivers) Execution
  // -------------------------------------------------------------------------
  console.log("\n--- TEST 5: Query 6 Tree Mortality Drivers Execution ---");
  const mortality = executeTreeMortalityDriversQuery();

  assert("Query 6 execution succeeds", mortality.success);
  assert("Mortality drivers array populated across species", mortality.mortality_drivers.length > 0);

  // -------------------------------------------------------------------------
  // TEST 6: Query 6 Lifespan Deficit & Pathogen Math
  // -------------------------------------------------------------------------
  console.log("\n--- TEST 6: Query 6 Lifespan Deficit & Pathogen Verification ---");
  const validMath = mortality.mortality_drivers.every((d) => {
    const deficitCheck = Math.abs(d.lifespan_deficit_years - (d.typical_lifespan_years - d.avg_lifespan_at_death_years)) < 0.1;
    const pathogenRateCheck = d.fatal_pathogen_percentage > 0 && d.fatal_pathogen_percentage <= 100;
    return deficitCheck && pathogenRateCheck;
  });
  assert("Lifespan deficit = typical_lifespan - avg_death_age and pathogen % is valid", validMath);

  // -------------------------------------------------------------------------
  // TEST 7: Query 6 Top Fatal Disease Attribution
  // -------------------------------------------------------------------------
  console.log("\n--- TEST 7: Query 6 Fatal Pathogen Attribution ---");
  const allHavePathogen = mortality.mortality_drivers.every((d) => typeof d.top_fatal_disease === "string" && d.top_fatal_disease.length > 0);
  assert("All species drivers have an identified primary fatal disease", allHavePathogen);

  // -------------------------------------------------------------------------
  // TEST 8: Strict Role Compliance (Zero forbidden title occurrences)
  // -------------------------------------------------------------------------
  console.log("\n--- TEST 8: Strict Field Inspector Compliance Check ---");
  const combinedPayload = JSON.stringify({ overdue180, mortality }).toLowerCase();
  assert("Queries 5 and 6 payload strictly complies with role naming (zero 'arborist' occurrences)", !combinedPayload.includes("arborist"));

  // -------------------------------------------------------------------------
  // TEST 9: Query Execution Latency Benchmark
  // -------------------------------------------------------------------------
  console.log("\n--- TEST 9: Latency Benchmark ---");
  assert("Query 5 execution latency is sub-15ms", overdue180.execution_stats.latency_ms < 15.0);
  assert("Query 6 execution latency is sub-15ms", mortality.execution_stats.latency_ms < 15.0);

  console.log("\n================================================================================");
  console.log(`RESULTS: ${passed} / ${total} test assertions passed successfully.`);
  console.log("================================================================================\n");

  if (passed !== total) {
    process.exit(1);
  }
}

runQuery5and6Tests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
