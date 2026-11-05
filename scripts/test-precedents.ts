/**
 * EverLeafDB Phase 15: Case-Based Visual Similarity Search Engine Test Suite
 * Tests pgvector HNSW cosine ordering, relational clinical joins,
 * inspector note retrieval, and treatment outcome ranking.
 */

import {
  searchPrecedents,
  HISTORICAL_PRECEDENTS,
  PrecedentCase
} from "../frontend/src/lib/precedent-engine";
import { normalizeVector } from "../frontend/src/lib/vector";

async function runPrecedentTests() {
  console.log("================================================================================");
  console.log("EVERLEAFDB PHASE 15: CASE-BASED VISUAL SIMILARITY SEARCH TEST SUITE");
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
  // TEST 1: Nearest Neighbor Ordering (Cosine Distance Ascending)
  // -------------------------------------------------------------------------
  console.log("--- TEST 1: Nearest Neighbor Cosine Distance Ordering ---");
  const targetCase = HISTORICAL_PRECEDENTS[0];
  const queryVector = targetCase.embedding.map((v) => v + (Math.random() - 0.5) * 0.005);
  const normalizedQuery = normalizeVector(queryVector);

  const results = searchPrecedents(normalizedQuery, { limit: 5 });

  assert("Returns requested number of precedent cases", results.length > 0 && results.length <= 5);
  assert("Top rank (#1) matches the target precedent case", results[0].disease_id === targetCase.disease_id);
  assert("Top rank has highest similarity (> 95%)", results[0].similarity_percent >= 95.0);

  // Verify monotonicity of distances
  let isSorted = true;
  for (let i = 1; i < results.length; i++) {
    if (results[i].cosine_distance < results[i - 1].cosine_distance) {
      isSorted = false;
      break;
    }
  }
  assert("Results are strictly sorted by cosine distance in ascending order", isSorted);

  // -------------------------------------------------------------------------
  // TEST 2: Relational Clinical Join Integrity
  // -------------------------------------------------------------------------
  console.log("\n--- TEST 2: Relational Join Integrity Across Clinical History ---");
  const topMatch = results[0];

  assert("Precedent includes confirmed disease name", typeof topMatch.disease_name === "string" && topMatch.disease_name.length > 0);
  assert("Precedent includes disease severity level", ["LOW", "MODERATE", "HIGH", "CRITICAL"].includes(topMatch.severity_level));
  assert("Precedent includes inspector clinical observations", typeof topMatch.inspector_notes === "string" && topMatch.inspector_notes.length > 0);
  assert("Precedent includes prescribed treatment protocol", typeof topMatch.treatment_name === "string" && topMatch.treatment_name.length > 0);
  assert("Precedent includes historical outcome status", ["SUCCESSFUL", "FAILED", "UNDER_MONITORING"].includes(topMatch.outcome_status));
  assert("Precedent includes estimated cost", typeof topMatch.typical_cost === "number" && topMatch.typical_cost > 0);
  assert("Precedent includes cure duration days", typeof topMatch.cure_duration_days === "number" && topMatch.cure_duration_days > 0);

  // -------------------------------------------------------------------------
  // TEST 3: Strict Field Inspector Compliance Check
  // -------------------------------------------------------------------------
  console.log("\n--- TEST 3: Strict 'Field Inspector' Compliance Check ---");
  const notesText = results.map((r) => r.inspector_notes.toLowerCase()).join(" ");
  const containsForbiddenTitle = notesText.includes("arborist");
  assert("Inspector notes strictly comply with role naming (zero 'arborist' occurrences)", !containsForbiddenTitle);

  // -------------------------------------------------------------------------
  // TEST 4: Species-Specific Filtering
  // -------------------------------------------------------------------------
  console.log("\n--- TEST 4: Species-Specific Filter Query ---");
  const speciesFiltered = searchPrecedents(normalizedQuery, { species_id: 2, limit: 3 });
  assert("Filtered query returns precedents matching specified species_id=2", speciesFiltered.every((c) => c.species_id === 2));

  // -------------------------------------------------------------------------
  // TEST 5: Limit Clamping
  // -------------------------------------------------------------------------
  console.log("\n--- TEST 5: Limit Clamping ---");
  const clampedResults = searchPrecedents(normalizedQuery, { limit: 2 });
  assert("Clamped query returns exactly 2 records", clampedResults.length === 2);

  console.log("\n================================================================================");
  console.log(`RESULTS: ${passed} / ${total} test assertions passed successfully.`);
  console.log("================================================================================\n");

  if (passed !== total) {
    process.exit(1);
  }
}

runPrecedentTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
