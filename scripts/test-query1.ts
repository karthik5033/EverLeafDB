/**
 * EverLeafDB Phase 16: Hybrid Query 1 Test Suite
 * Tests PostGIS ST_DWithin spatial buffer + pgvector cosine similarity ordering + species filter.
 */

import { executeNearbySimilarQuery } from "../frontend/src/lib/hybrid-queries";
import { HISTORICAL_PRECEDENTS } from "../frontend/src/lib/precedent-engine";
import { TREES } from "../frontend/src/lib/db";

async function runQuery1Tests() {
  console.log("================================================================================");
  console.log("EVERLEAFDB PHASE 16: HYBRID QUERY 1 (SPATIAL + VECTOR) TEST SUITE");
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

  const focalTree = TREES[0]; // Heritage Banyan at Cubbon Park (lat: 12.9716, lng: 77.5946)
  const queryVector = HISTORICAL_PRECEDENTS[0].embedding;

  // -------------------------------------------------------------------------
  // TEST 1: Basic Hybrid Query Execution
  // -------------------------------------------------------------------------
  console.log("--- TEST 1: Basic Hybrid Query 1 Execution ---");
  const response500 = executeNearbySimilarQuery({
    targetLat: focalTree.latitude,
    targetLng: focalTree.longitude,
    speciesId: focalTree.species_id,
    queryVector,
    radiusMeters: 500,
    limit: 5
  });

  assert("Query execution succeeds", response500.success);
  assert("Target metadata returned accurately", response500.target.species_id === focalTree.species_id);
  assert("Results array populated", response500.results.length > 0);

  // -------------------------------------------------------------------------
  // TEST 2: Spatial Buffer Constraint (ST_DWithin <= radius)
  // -------------------------------------------------------------------------
  console.log("\n--- TEST 2: Spatial Proximity Constraint (ST_DWithin) ---");
  const allWithin500 = response500.results.every((r) => r.distance_meters <= 500.0);
  assert("All returned trees are within specified 500m radius buffer", allWithin500);

  // -------------------------------------------------------------------------
  // TEST 3: Radius Scaling Verification (100m vs 2000m)
  // -------------------------------------------------------------------------
  console.log("\n--- TEST 3: Dynamic Radius Scaling (100m vs 2000m) ---");
  const response100 = executeNearbySimilarQuery({
    targetLat: focalTree.latitude,
    targetLng: focalTree.longitude,
    speciesId: focalTree.species_id,
    queryVector,
    radiusMeters: 100,
    limit: 10
  });

  const response2000 = executeNearbySimilarQuery({
    targetLat: focalTree.latitude,
    targetLng: focalTree.longitude,
    speciesId: focalTree.species_id,
    queryVector,
    radiusMeters: 2000,
    limit: 10
  });

  assert(
    "Candidates at 100m <= Candidates at 500m <= Candidates at 2000m",
    response100.spatial_filter_count <= response500.spatial_filter_count &&
      response500.spatial_filter_count <= response2000.spatial_filter_count
  );

  // -------------------------------------------------------------------------
  // TEST 4: Botanical Species Filtering
  // -------------------------------------------------------------------------
  console.log("\n--- TEST 4: Species Isolation Constraint ---");
  const targetSpeciesId = focalTree.species_id;
  const allMatchSpecies = response500.results.every((r) => r.species_id === targetSpeciesId);
  assert("All returned trees strictly match target species_id", allMatchSpecies);

  // -------------------------------------------------------------------------
  // TEST 5: Vector Cosine Ordering (Ascending Cosine Distance)
  // -------------------------------------------------------------------------
  console.log("\n--- TEST 5: Vector Cosine Distance Ascending Order ---");
  let isSorted = true;
  for (let i = 1; i < response500.results.length; i++) {
    if (response500.results[i].cosine_distance < response500.results[i - 1].cosine_distance) {
      isSorted = false;
      break;
    }
  }
  assert("Results are strictly sorted by cosine distance in ascending order", isSorted);

  // -------------------------------------------------------------------------
  // TEST 6: Strict Role Compliance (Zero forbidden title occurrences)
  // -------------------------------------------------------------------------
  console.log("\n--- TEST 6: Strict Field Inspector Compliance Check ---");
  const combinedText = response500.results.map((r) => r.inspector_notes.toLowerCase()).join(" ");
  assert("Notes strictly use 'Field Inspector' (zero 'arborist' occurrences)", !combinedText.includes("arborist"));

  // -------------------------------------------------------------------------
  // TEST 7: Query Latency Benchmark
  // -------------------------------------------------------------------------
  console.log("\n--- TEST 7: Latency Benchmark ---");
  assert("Hybrid query execution latency is sub-15ms", response500.execution_stats.latency_ms < 15.0);

  console.log("\n================================================================================");
  console.log(`RESULTS: ${passed} / ${total} test assertions passed successfully.`);
  console.log("================================================================================\n");

  if (passed !== total) {
    process.exit(1);
  }
}

runQuery1Tests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});

