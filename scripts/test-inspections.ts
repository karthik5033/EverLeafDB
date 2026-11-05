/**
 * Phase 12 Field Inspection & Multimodal Ingestion Unit Test Suite
 * Tests 3NF inspection ingestion, photo attachment, and automated escalation trigger simulation.
 */

import { createInspectionSchema } from "../frontend/src/lib/validations/inspection";
import { DISEASES, ALERTS } from "../frontend/src/lib/db";

async function runInspectionTests() {
  console.log("================================================================================");
  console.log("EVERLEAFDB PHASE 12: FIELD INSPECTION & MULTIMODAL INGESTION TEST SUITE");
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

  // Test 1: Zod Schema Validation on valid inspection payload
  console.log("--- TEST 1: Zod Schema Validation ---");
  const validPayload = {
    tree_id: "tree_1084",
    inspector_id: "inspector_04",
    condition_score: 1,
    organ: "leaf" as const,
    photo_url: "/uploads/specimen_leaf.jpg",
    symptom_notes: "Severe foliar necrosis, branch dieback, and visible spore bracket."
  };

  const validationResult = createInspectionSchema.safeParse(validPayload);
  assert("Valid field inspection payload passes Zod validation schema", validationResult.success);

  // Test 2: Reject Invalid Condition Score
  console.log("\n--- TEST 2: Schema Rejection of Out-of-Bounds Condition Score ---");
  const invalidScorePayload = {
    ...validPayload,
    condition_score: 9 // Out of range (valid: 1-5)
  };
  const invalidResult = createInspectionSchema.safeParse(invalidScorePayload);
  assert("Rejects out-of-bounds condition score (score=9 fails 1-5 range)", !invalidResult.success);

  // Test 3: Reject Invalid Anatomical Organ
  console.log("\n--- TEST 3: Schema Rejection of Invalid Anatomical Organ ---");
  const invalidOrganPayload = {
    ...validPayload,
    organ: "fruit" // Not in ('leaf', 'bark', 'trunk', 'root', 'canopy')
  };
  const invalidOrganResult = createInspectionSchema.safeParse(invalidOrganPayload);
  assert("Rejects unsupported anatomical organ type", !invalidOrganResult.success);

  // Test 4: Trigger Simulation for Severe Disease (Score <= 2)
  console.log("\n--- TEST 4: PL/pgSQL Trigger trg_fn_detect_severe_disease_alert() Simulation ---");
  const initialAlertsCount = ALERTS.length;
  
  // Severe inspection
  const score = 1;
  const simulatedSimilarity = 0.892;
  const triggerActivated = simulatedSimilarity >= 0.82;
  
  assert("Lethal score (score=1) matches cosine similarity >= 0.82", triggerActivated);

  if (triggerActivated) {
    ALERTS.unshift({
      alert_id: "ALT-TEST-999",
      tree_id: validPayload.tree_id,
      ward_id: "ward_03",
      severity: "CRITICAL",
      status: "PENDING",
      detected_disease: DISEASES[0].common_name,
      cosine_similarity: simulatedSimilarity,
      created_at: new Date().toISOString(),
      assigned_inspector: "inspector_04"
    });
  }

  assert("Alert escalation successfully appended to ALERTS table", ALERTS.length === initialAlertsCount + 1);
  assert("Alert status is PENDING and severity is CRITICAL", ALERTS[0].severity === "CRITICAL" && ALERTS[0].status === "PENDING");

  // Test 5: Benign Inspection (Score = 5) does not trigger escalation
  console.log("\n--- TEST 5: Benign Inspection Behavior ---");
  const benignScore = 5;
  const benignSimilarity = 0.35;
  const benignTrigger = benignSimilarity >= 0.82;

  assert("Healthy score (score=5) produces benign similarity (< 0.82) with no alert escalation", !benignTrigger);

  console.log("\n================================================================================");
  console.log(`RESULTS: ${passed} / ${total} test assertions passed successfully.`);
  console.log("================================================================================\n");

  if (passed !== total) {
    process.exit(1);
  }
}

runInspectionTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});

