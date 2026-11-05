import { NextRequest, NextResponse } from "next/server";
import { Inspection, DISEASES, ALERTS, Alert } from "@/lib/db";
import { createInspectionSchema, inspectionQuerySchema } from "@/lib/validations/inspection";
import { recordAuditTrail, triggerUpdateLastInspected } from "@/lib/audit";

// Runtime inspections storage
const INSPECTIONS: Inspection[] = [
  {
    inspection_id: "INSP-9821",
    tree_id: "tree_1084",
    inspector_id: "inspector_04",
    condition_score: 1,
    organ: "leaf",
    photo_url: "/specimen_leaf.jpg",
    symptom_notes: "Severe lower foliage necrosis and canopy chlorosis. Possible mycelium at base.",
    inspected_at: "2026-11-04T18:24:00Z",
    matched_disease: "Ganoderma Root & Butt Rot",
    cosine_similarity: 0.892,
    escalation_triggered: true
  },
  {
    inspection_id: "INSP-9815",
    tree_id: "tree_3042",
    inspector_id: "inspector_05",
    condition_score: 2,
    organ: "trunk",
    photo_url: "/specimen_trunk.jpg",
    symptom_notes: "Dark exuding sap from trunk bark cracks with foul odor.",
    inspected_at: "2026-11-02T16:20:00Z",
    matched_disease: "Bacterial Wetwood Canker",
    cosine_similarity: 0.841,
    escalation_triggered: false
  }
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const treeId = searchParams.get("tree_id");

  let results = [...INSPECTIONS];
  if (treeId) {
    results = results.filter((i) => i.tree_id === treeId);
  }

  return NextResponse.json({
    success: true,
    count: results.length,
    sql_executed: `SELECT i.*, img.photo_url FROM inspections i LEFT JOIN inspection_images img ON i.inspection_id = img.inspection_id ${
      treeId ? `WHERE i.tree_id = '${treeId}'` : ""
    } ORDER BY i.inspected_at DESC;`,
    inspections: results
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tree_id, condition_score, organ, symptom_notes, photo_url } = body;

    const inspectionId = `INSP-${Math.floor(1000 + Math.random() * 9000)}`;
    const score = Number(condition_score) || 3;

    // Simulate CLIP ViT-B/32 512-d feature extraction & pgvector HNSW search
    let matchedDisease = DISEASES[0].common_name;
    let similarity = 0.892;
    if (score >= 4) {
      similarity = 0.42; // Low similarity to lethal disease
      matchedDisease = "None / Benign Foliage Variation";
    } else if (score === 3) {
      similarity = 0.74;
      matchedDisease = DISEASES[3].common_name;
    } else if (score === 2) {
      similarity = 0.84;
      matchedDisease = DISEASES[1].common_name;
    } else {
      similarity = 0.892;
      matchedDisease = DISEASES[0].common_name;
    }

    // PL/pgSQL Trigger: trg_fn_detect_severe_disease_alert()
    // Evaluates: IF similarity >= 0.82 THEN INSERT INTO alerts ...
    const triggerActivated = similarity >= 0.82;
    let generatedAlert: Alert | null = null;

    if (triggerActivated) {
      generatedAlert = {
        alert_id: `ALT-${Math.floor(1000 + Math.random() * 9000)}`,
        tree_id: tree_id || "tree_1084",
        ward_id: "ward_03",
        severity: "CRITICAL",
        status: "PENDING",
        detected_disease: matchedDisease,
        cosine_similarity: similarity,
        created_at: new Date().toISOString(),
        assigned_inspector: "inspector_04"
      };
      ALERTS.unshift(generatedAlert);
    }

    const newInspection: Inspection = {
      inspection_id: inspectionId,
      tree_id: tree_id || "tree_1084",
      inspector_id: "inspector_04",
      condition_score: score,
      organ: organ || "leaf",
      photo_url: photo_url || "/specimen_leaf.jpg",
      symptom_notes: symptom_notes || "Field capture ingested via mobile terminal.",
      inspected_at: new Date().toISOString(),
      matched_disease: matchedDisease,
      cosine_similarity: similarity,
      escalation_triggered: triggerActivated
    };

    INSPECTIONS.unshift(newInspection);

    // Phase 13 Trigger 1: Synchronize trees.last_inspected_at via trg_fn_update_last_inspected()
    const triggerSyncResult = triggerUpdateLastInspected(
      newInspection.tree_id,
      newInspection.inspected_at,
      score,
      newInspection.inspector_id
    );

    // Phase 13 Trigger 2: Capture inspection insertion into audit_log via trg_fn_audit_trail()
    const inspectionAudit = recordAuditTrail({
      user_id: newInspection.inspector_id,
      action: "INSERT",
      table_name: "inspections",
      record_id: newInspection.inspection_id,
      new_values: {
        inspection_id: newInspection.inspection_id,
        tree_id: newInspection.tree_id,
        condition_score: score,
        organ: newInspection.organ,
        symptom_notes: newInspection.symptom_notes
      }
    });

    return NextResponse.json(
      {
        success: true,
        message: triggerActivated
          ? "Inspection ingested. CRITICAL OUTBREAK TRIGGER ACTIVATED: Auto-escalated to alerts table."
          : "Inspection recorded successfully.",
        trigger_state: {
          function: "trg_fn_detect_severe_disease_alert()",
          cosine_similarity: similarity,
          threshold: 0.82,
          action: triggerActivated ? "INSERT INTO alerts (severity='CRITICAL')" : "NO_ACTION"
        },
        triggers_executed: [
          {
            name: "trg_fn_update_last_inspected()",
            target_tree: newInspection.tree_id,
            new_last_inspected_at: newInspection.inspected_at,
            status_updated: triggerSyncResult.tree?.health_status
          },
          {
            name: "trg_fn_audit_trail()",
            table_name: "inspections",
            log_id: inspectionAudit.log_id,
            action: "INSERT"
          }
        ],
        sql_executed: `INSERT INTO inspections (inspection_id, tree_id, condition_score, organ, notes) VALUES ('${inspectionId}', '${newInspection.tree_id}', ${score}, '${newInspection.organ}', '${newInspection.symptom_notes}');`,
        inspection: newInspection,
        alert: generatedAlert
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to process inspection ingestion" },
      { status: 500 }
    );
  }
}

