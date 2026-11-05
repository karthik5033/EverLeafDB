/**
 * Real-Time Pathological Risk Detection Engine (Phase 14)
 * Mirrors PostgreSQL PL/pgSQL Trigger: trg_fn_detect_severe_disease_alert()
 */

import { ALERTS, Alert, DISEASES, TREES } from "./db";
import { cosineSimilarity } from "./vector";
import { recordAuditTrail } from "./audit";

export const SIMILARITY_THRESHOLD = 0.82; // Empirical threshold calibrated to minimize false-positives

export interface SeverePrecedent {
  disease_id: number;
  disease_name: string;
  species_id: number;
  severity: "CRITICAL";
  reference_embedding: number[];
}

// Generate canonical reference disease feature vectors (512-d unit vectors)
function createReferenceVector(seed: number): number[] {
  const vec = new Array(512).fill(0);
  for (let i = 0; i < 512; i++) {
    vec[i] = Math.sin((i + 1) * seed * 0.17) * Math.cos((i + 1) * 0.31);
  }
  // Normalize
  const norm = Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0));
  return vec.map((v) => v / norm);
}

// Canonical confirmed severe precedent embeddings across species
export const SEVERE_PRECEDENTS: SeverePrecedent[] = [
  {
    disease_id: 1,
    disease_name: "Ganoderma Root & Butt Rot",
    species_id: 1, // Heritage Banyan
    severity: "CRITICAL",
    reference_embedding: createReferenceVector(42)
  },
  {
    disease_id: 2,
    disease_name: "Bacterial Wetwood Canker",
    species_id: 2, // Neem Tree
    severity: "CRITICAL",
    reference_embedding: createReferenceVector(89)
  },
  {
    disease_id: 4,
    disease_name: "Dutch Elm Vascular Wilt",
    species_id: 4, // Gulmohar
    severity: "CRITICAL",
    reference_embedding: createReferenceVector(137)
  }
];

export interface RiskTriggerResult {
  alertTriggered: boolean;
  cosineSimilarity: number;
  matchedDisease: string | null;
  matchedDiseaseId: number | null;
  alert: Alert | null;
  executionTimeMs: number;
}

/**
 * Executes trg_fn_detect_severe_disease_alert() logic
 * Scans confirmed critical disease precedents of the same species.
 * If similarity >= 0.82, inserts into ALERTS and updates tree health_status.
 */
export function evaluateRiskTrigger(params: {
  treeId: string;
  imageEmbedding: number[];
  inspectorId?: string;
  photoUrl?: string;
}): RiskTriggerResult {
  const startTime = performance.now();

  const tree = TREES.find(
    (t) => (t as any).id === params.treeId || t.tag_number === params.treeId || t.tree_id === params.treeId
  );
  const speciesId = tree ? tree.species_id : 1;
  const wardId = tree ? tree.ward_id : "ward_03";

  // Filter precedents matching target species
  const relevantPrecedents = SEVERE_PRECEDENTS.filter((p) => p.species_id === speciesId);
  const precedentsToScan = relevantPrecedents.length > 0 ? relevantPrecedents : SEVERE_PRECEDENTS;

  let bestMatch: SeverePrecedent | null = null;
  let highestSimilarity = -1;

  for (const precedent of precedentsToScan) {
    const sim = cosineSimilarity(params.imageEmbedding, precedent.reference_embedding);
    if (sim > highestSimilarity) {
      highestSimilarity = sim;
      bestMatch = precedent;
    }
  }

  const alertTriggered = highestSimilarity >= SIMILARITY_THRESHOLD;
  let createdAlert: Alert | null = null;

  if (alertTriggered && bestMatch) {
    createdAlert = {
      alert_id: `ALT-${Math.floor(1000 + Math.random() * 9000)}`,
      tree_id: params.treeId,
      ward_id: String(wardId),
      severity: "CRITICAL",
      status: "PENDING",
      detected_disease: bestMatch.disease_name,
      cosine_similarity: Math.round(highestSimilarity * 1000) / 1000,
      created_at: new Date().toISOString(),
      assigned_inspector: params.inspectorId || "inspector_04"
    };

    // Prepend to alerts
    ALERTS.unshift(createdAlert);

    // Transition tree status to under_treatment
    if (tree && tree.health_status !== "DEAD" && (tree.health_status as string) !== "dead") {
      tree.health_status = "under_treatment";
      tree.active_alerts_count = (tree.active_alerts_count || 0) + 1;
    }

    // Capture in audit log
    recordAuditTrail({
      user_id: params.inspectorId || "00000000-0000-0000-0000-000000000004",
      action: "INSERT",
      table_name: "alerts",
      record_id: createdAlert.alert_id,
      new_values: {
        alert_id: createdAlert.alert_id,
        tree_id: createdAlert.tree_id,
        severity: createdAlert.severity,
        detected_disease: createdAlert.detected_disease,
        cosine_similarity: createdAlert.cosine_similarity
      }
    });
  }

  const endTime = performance.now();

  return {
    alertTriggered,
    cosineSimilarity: Math.max(0, highestSimilarity),
    matchedDisease: bestMatch ? bestMatch.disease_name : null,
    matchedDiseaseId: bestMatch ? bestMatch.disease_id : null,
    alert: createdAlert,
    executionTimeMs: Math.round((endTime - startTime) * 100) / 100
  };
}
