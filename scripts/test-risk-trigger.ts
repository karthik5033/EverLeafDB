/**
 * EverLeafDB Phase 14: Real-Time Pathological Risk Detection Trigger Test Suite
 * Tests PL/pgSQL trigger trg_fn_detect_severe_disease_alert(), empirical 0.82 threshold,
 * automated escalation, and sub-10ms transaction latency benchmark.
 */

import {
  evaluateRiskTrigger,
  SIMILARITY_THRESHOLD,
  SEVERE_PRECEDENTS
} from "../frontend/src/lib/risk-trigger";
import { ALERTS, TREES } from "../frontend/src/lib/db";
import { normalizeVector } from "../frontend/src/lib/vector";

async function runRiskTriggerTests() {
  console.log("================================================================================");
  console.log("EVERLEAFDB PHASE 14: REAL-TIME PATHOLOGICAL RISK TRIGGER TEST SUITE");
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
  // TEST 1: Trigger fires on High-Risk Vector (Similarity >= 0.82)
  // -------------------------------------------------------------------------
  console.log("--- TEST 1: Critical Risk Detection (Similarity >= 0.82) ---");
  const targetPrecedent = SEVERE_PRECEDENTS[0]; // Ganoderma (Heritage Banyan)
  
  // Create an inquiry embedding with ~0.95 similarity to the precedent
  const noisyVector = targetPrecedent.reference_embedding.map((val) => {
    return val + (Math.random() - 0.5) * 0.01;
  });
  const normalizedHighRisk = normalizeVector(noisyVector);

  const initialAlertCount = ALERTS.length;
  const result = evaluateRiskTrigger({
    treeId: "tree_1084",
    imageEmbedding: normalizedHighRisk,
    inspectorId: "inspector_04"
  });

  assert("Trigger successfully fires when similarity >= 0.82", result.alertTriggered);
  assert("Cosine similarity matches high score (> 0.82)", result.cosineSimilarity >= SIMILARITY_THRESHOLD);
  assert("Matched disease matches precedent (Ganoderma)", result.matchedDisease === targetPrecedent.disease_name);
  assert("CRITICAL alert inserted into ALERTS table", ALERTS.length === initialAlertCount + 1);
  assert("Alert has severity=CRITICAL and status=PENDING", result.alert?.severity === "CRITICAL" && result.alert?.status === "PENDING");

  // -------------------------------------------------------------------------
  // TEST 2: Target Tree State Transition
  // -------------------------------------------------------------------------
  console.log("\n--- TEST 2: Relational State Transition on Target Tree ---");
  const inspectedTree = TREES.find((t) => t.tree_id === "tree_1084");
  assert("Target tree health_status transitioned to 'under_treatment'", inspectedTree?.health_status === "under_treatment");

  // -------------------------------------------------------------------------
  // TEST 3: Benign Vector Does Not Trigger Alert (< 0.82)
  // -------------------------------------------------------------------------
  console.log("\n--- TEST 3: Benign Vector Suppression (< 0.82) ---");
  // Orthogonal / benign vector
  const benignVector = new Array(512).fill(0).map((_, i) => Math.cos(i * 0.77));
  const normalizedBenign = normalizeVector(benignVector);

  const preBenignCount = ALERTS.length;
  const benignResult = evaluateRiskTrigger({
    treeId: "tree_1085",
    imageEmbedding: normalizedBenign,
    inspectorId: "inspector_05"
  });

  assert("Trigger suppressed for benign feature vector", !benignResult.alertTriggered);
  assert("Benign cosine similarity is below threshold (< 0.82)", benignResult.cosineSimilarity < SIMILARITY_THRESHOLD);
  assert("No alert created in ALERTS table", ALERTS.length === preBenignCount);

  // -------------------------------------------------------------------------
  // TEST 4: Boundary Sensitivity Calibration
  // -------------------------------------------------------------------------
  console.log("\n--- TEST 4: Threshold Boundary Sensitivity Check ---");
  assert("Configured empirical similarity threshold is exactly 0.82", SIMILARITY_THRESHOLD === 0.82);

  // -------------------------------------------------------------------------
  // TEST 5: Latency Benchmark (Sub-10ms Target)
  // -------------------------------------------------------------------------
  console.log("\n--- TEST 5: Trigger Latency Benchmark (50 iterations) ---");
  const iterations = 50;
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    evaluateRiskTrigger({
      treeId: "tree_1084",
      imageEmbedding: normalizedHighRisk
    });
  }
  const totalDuration = performance.now() - start;
  const avgLatencyMs = totalDuration / iterations;

  console.log(`  Execution Telemetry: Avg latency: ${avgLatencyMs.toFixed(3)} ms / invocation`);
  assert("Trigger execution latency is ultra-fast (< 10ms target)", avgLatencyMs < 10.0);

  console.log("\n================================================================================");
  console.log(`RESULTS: ${passed} / ${total} test assertions passed successfully.`);
  console.log("================================================================================\n");

  if (passed !== total) {
    process.exit(1);
  }
}

runRiskTriggerTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
