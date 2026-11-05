/**
 * EverLeafDB Phase 17: Hybrid Query 2 Test Suite
 * Tests Ward-Level Disease Case Search: ward_id + species_id + outcome_status='SUCCESSFUL' + pgvector cosine rank.
 */

import { executeWardDiseaseSearchQuery } from "../frontend/src/lib/hybrid-queries";
import { HISTORICAL_PRECEDENTS } from "../frontend/src/lib/precedent-engine";
import { WARDS } from "../frontend/src/lib/db";

async function runQuery2Tests() {
  console.log("================================================================================");
  console.log("EVERLEAFDB PHASE 17: HYBRID QUERY 2 (WARD-LEVEL DISEASE SEARCH) TEST SUITE");
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

  const queryVector = HISTORICAL_PRECEDENTS[0].embedding;
  const targetWard = WARDS[0]; // Cubbon Park Heritage
  const targetSpeciesId = 1; // Neem Tree

  // -------------------------------------------------------------------------
  // TEST 1: Basic Hybrid Query 2 Execution
  // -------------------------------------------------------------------------
  console.log("--- TEST 1: Basic Hybrid Query 2 Execution ---");
  const response = executeWardDiseaseSearchQuery({
    wardId: targetWard.ward_id,
    speciesId: targetSpeciesId,
    queryVector,
    limit: 5
  });

  assert("Query execution succeeds", response.success);
  assert("Target ward metadata returned accurately", response.ward.ward_id === targetWard.ward_id);
  assert("Results array populated with matched cases", response.results.length > 0);

  // -------------------------------------------------------------------------
  // TEST 2: Administrative Ward Isolation
  // -------------------------------------------------------------------------
  console.log("\n--- TEST 2: Administrative Ward Isolation ---");
  const allMatchWard = response.results.every((r) => r.ward_id === targetWard.ward_id);
  assert("All returned cases are isolated to the specified ward", allMatchWard);

  // -------------------------------------------------------------------------
  // TEST 3: Species Isolation
  // -------------------------------------------------------------------------
  console.log("\n--- TEST 3: Botanical Species Isolation ---");
  const allMatchSpecies = response.results.every((r) => r.species_id === targetSpeciesId);
  assert("All returned cases strictly match the specified species_id", allMatchSpecies);

  // -------------------------------------------------------------------------
  // TEST 4: Curative Treatment Outcome Constraint (SUCCESSFUL only)
  // -------------------------------------------------------------------------
  console.log("\n--- TEST 4: Efficacy Constraint (Strictly SUCCESSFUL Outcomes) ---");
  const allSuccessful = response.results.every((r) => r.outcome_status === "SUCCESSFUL");
  assert("All returned cases strictly have outcome_status = 'SUCCESSFUL'", allSuccessful);

  // -------------------------------------------------------------------------
  // TEST 5: Vector Cosine Ordering (Ascending Cosine Distance)
  // -------------------------------------------------------------------------
  console.log("\n--- TEST 5: Vector Cosine Distance Ascending Order ---");
  let isSorted = true;
  for (let i = 1; i < response.results.length; i++) {
    if (response.results[i].cosine_distance < response.results[i - 1].cosine_distance) {
      isSorted = false;
      break;
    }
  }
  assert("Results are strictly sorted by cosine distance in ascending order", isSorted);

  // -------------------------------------------------------------------------
  // TEST 6: Top Effective Treatment Recommendation Efficacy
  // -------------------------------------------------------------------------
  console.log("\n--- TEST 6: Top Treatment Recommendation ---");
  assert("Top effective treatment summary generated", response.top_effective_treatment !== null);
  assert("Top treatment includes average cost and cure duration", 
    response.top_effective_treatment?.avg_cost !== undefined && response.top_effective_treatment?.cure_days !== undefined);

  // -------------------------------------------------------------------------
  // TEST 7: Strict Role Compliance (Zero forbidden title occurrences)
  // -------------------------------------------------------------------------
  console.log("\n--- TEST 7: Strict Field Inspector Compliance Check ---");
  const notesText = response.results.map((r) => r.inspector_notes.toLowerCase()).join(" ");
  assert("Case notes strictly use 'Field Inspector' (zero 'arborist' occurrences)", !notesText.includes("arborist"));

  // -------------------------------------------------------------------------
  // TEST 8: Execution Latency Benchmark
  // -------------------------------------------------------------------------
  console.log("\n--- TEST 8: Latency Benchmark ---");
  assert("Hybrid Query 2 execution latency is sub-15ms", response.execution_stats.latency_ms < 15.0);

  console.log("\n================================================================================");
  console.log(`RESULTS: ${passed} / ${total} test assertions passed successfully.`);
  console.log("================================================================================\n");

  if (passed !== total) {
    process.exit(1);
  }
}

runQuery2Tests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
