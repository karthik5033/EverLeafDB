/**
 * EverLeafDB Phase 18: Hybrid Query 3 Test Suite
 * Tests Contagion Risk Cluster Detection: active epicenters + ST_DWithin(500m) + symptom similarity + untreated > 365d.
 */

import { executeContagionClustersQuery } from "../frontend/src/lib/hybrid-queries";

async function runQuery3Tests() {
  console.log("================================================================================");
  console.log("EVERLEAFDB PHASE 18: HYBRID QUERY 3 (CONTAGION CLUSTERS) TEST SUITE");
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
  // TEST 1: Basic Hybrid Query 3 Execution
  // -------------------------------------------------------------------------
  console.log("--- TEST 1: Basic Hybrid Query 3 Execution ---");
  const response = executeContagionClustersQuery({
    dangerRadiusMeters: 500,
    similarityThreshold: 0.82,
    untreatedDays: 365
  });

  assert("Query execution succeeds", response.success);
  assert("At least one active outbreak hazard zone identified", response.total_hazard_zones > 0);
  assert("Endangered trees array populated", response.endangered_trees.length > 0);

  // -------------------------------------------------------------------------
  // TEST 2: Spatial Danger Buffer Constraint (ST_DWithin <= radius)
  // -------------------------------------------------------------------------
  console.log("\n--- TEST 2: Spatial Danger Buffer Constraint (ST_DWithin) ---");
  const allWithinBuffer = response.endangered_trees.every((t) => t.distance_to_epicenter_meters <= 500.0);
  assert("All endangered trees are within specified 500m danger radius", allWithinBuffer);

  // -------------------------------------------------------------------------
  // TEST 3: Untreated Specimen Condition (> 365 days)
  // -------------------------------------------------------------------------
  console.log("\n--- TEST 3: Untreated Specimen Vulnerability Condition ---");
  const allUntreated = response.endangered_trees.every((t) => t.days_since_last_inspection >= 365);
  assert("All flagged endangered trees have been untreated for >= 365 days", allUntreated);

  // -------------------------------------------------------------------------
  // TEST 4: Symptom Vector Cutoff Constraint
  // -------------------------------------------------------------------------
  console.log("\n--- TEST 4: Pathological Vector Cutoff Constraint ---");
  const allSymptomMatch = response.endangered_trees.every((t) => t.similarity_percent >= 67.0); // 0.82 - 0.15 = 0.67
  assert("All endangered trees exhibit visual symptom similarity >= 67%", allSymptomMatch);

  // -------------------------------------------------------------------------
  // TEST 5: Quarantine Priority Tiering
  // -------------------------------------------------------------------------
  console.log("\n--- TEST 5: Quarantine Priority Tiering ---");
  const hasEmergency = response.endangered_trees.some((t) => t.quarantine_priority === "EMERGENCY_ISOLATE");
  const validPriorities = response.endangered_trees.every((t) =>
    ["EMERGENCY_ISOLATE", "HIGH_QUARANTINE", "MONITOR_BUFFER"].includes(t.quarantine_priority)
  );
  assert("Priorities correctly partitioned into valid quarantine levels", validPriorities);
  assert("Highest priority emergency quarantine cases identified", hasEmergency);

  // -------------------------------------------------------------------------
  // TEST 6: Strict Field Inspector Compliance Check
  // -------------------------------------------------------------------------
  console.log("\n--- TEST 6: Strict Field Inspector Compliance Check ---");
  const notesText = response.endangered_trees.map((t) => t.inspector_notes.toLowerCase()).join(" ");
  assert("Inspector notes strictly comply with role naming (zero 'arborist' occurrences)", !notesText.includes("arborist"));

  // -------------------------------------------------------------------------
  // TEST 7: Execution Latency Benchmark
  // -------------------------------------------------------------------------
  console.log("\n--- TEST 7: Latency Benchmark ---");
  assert("Hybrid Query 3 execution latency is sub-15ms", response.execution_stats.latency_ms < 15.0);

  console.log("\n================================================================================");
  console.log(`RESULTS: ${passed} / ${total} test assertions passed successfully.`);
  console.log("================================================================================\n");

  if (passed !== total) {
    process.exit(1);
  }
}

runQuery3Tests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
