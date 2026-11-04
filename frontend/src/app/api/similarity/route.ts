import { NextRequest, NextResponse } from "next/server";
import { DISEASES } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { organ, specimen_type } = body;

    // Simulate pgvector HNSW search: ORDER BY image_embedding <=> $query_vector LIMIT 5
    const matches = [
      {
        rank: 1,
        disease_id: 1,
        disease_name: "Ganoderma Root & Butt Rot",
        pathogen: "Ganoderma lucidum",
        organ: organ || "leaf/bark",
        similarity_score: 0.892,
        cosine_distance: 0.108,
        precedent_tree_tag: "TREE-0914 (Cubbon Heritage)",
        outcome_status: "SUCCESSFUL",
        cured_at: "2025-08-14",
        recommended_protocol: "Propiconazole Root Drench + Crown Weight Reduction",
        estimated_cost: "$180",
        cure_rate: "88.2%",
        reference_image: "/specimen_trunk.jpg"
      },
      {
        rank: 2,
        disease_id: 2,
        disease_name: "Bacterial Wetwood Canker",
        pathogen: "Xanthomonas arboricola",
        organ: "trunk",
        similarity_score: 0.841,
        cosine_distance: 0.159,
        precedent_tree_tag: "TREE-0418 (Indiranagar Boulevard)",
        outcome_status: "SUCCESSFUL",
        cured_at: "2025-11-20",
        recommended_protocol: "Oxytetracycline Trunk Injection",
        estimated_cost: "$120",
        cure_rate: "91.5%",
        reference_image: "/specimen_leaf.jpg"
      },
      {
        rank: 3,
        disease_id: 3,
        disease_name: "Emerald Borer Beetle Infestation",
        pathogen: "Agrilus planipennis",
        organ: "bark",
        similarity_score: 0.795,
        cosine_distance: 0.205,
        precedent_tree_tag: "TREE-1205 (Lalbagh West Gate)",
        outcome_status: "IN_PROGRESS",
        cured_at: null,
        recommended_protocol: "Emamectin Benzoate Trunk Micro-Injection",
        estimated_cost: "$240",
        cure_rate: "84.0%",
        reference_image: "/specimen_trunk.jpg"
      },
      {
        rank: 4,
        disease_id: 4,
        disease_name: "Powdery Mildew Necrosis",
        pathogen: "Erysiphe alphitoides",
        organ: "leaf",
        similarity_score: 0.652,
        cosine_distance: 0.348,
        precedent_tree_tag: "TREE-2180 (Jayanagar Park)",
        outcome_status: "SUCCESSFUL",
        cured_at: "2026-02-10",
        recommended_protocol: "Potassium Bicarbonate Foliar Drench",
        estimated_cost: "$65",
        cure_rate: "96.8%",
        reference_image: "/specimen_leaf.jpg"
      }
    ];

    return NextResponse.json({
      success: true,
      index_engine: "pgvector HNSW (m=16, ef_search=64)",
      distance_metric: "cosine_distance (<=>)",
      embedding_dim: 512,
      latency_ms: 6.84,
      sql_executed: `SELECT d.common_name, d.standard_treatment, t.outcome_status, 1 - (img.image_embedding <=> $query_vec) AS similarity FROM inspection_images img JOIN diagnoses diag ON img.inspection_id = diag.inspection_id JOIN diseases d ON diag.disease_id = d.disease_id JOIN treatment_records t ON diag.diagnosis_id = t.diagnosis_id ORDER BY img.image_embedding <=> $query_vec LIMIT 4;`,
      results: matches
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Similarity search failed" }, { status: 500 });
  }
}

