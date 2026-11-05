/**
 * Case-Based Visual Similarity Search Engine (Phase 15)
 * Explains visual symptom matches with historical clinical outcomes, inspector notes,
 * and treatment success rates.
 */

import { cosineDistance, cosineSimilarity, normalizeVector } from "./vector";
import { DISEASES, TREATMENTS_SEED } from "./db";

export interface PrecedentCase {
  image_id: string;
  photo_url: string;
  body_part: "leaf" | "bark" | "trunk" | "root" | "canopy";
  tree_id: string;
  tree_tag: string;
  species_id: number;
  species_name: string;
  disease_id: number;
  disease_name: string;
  severity_level: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  similarity_percent: number;
  cosine_distance: number;
  inspector_notes: string;
  treatment_id: number;
  treatment_name: string;
  treatment_type: "chemical" | "biological" | "pruning" | "soil_amendment";
  outcome_status: "SUCCESSFUL" | "FAILED" | "UNDER_MONITORING";
  typical_cost: number;
  cure_duration_days: number;
  embedding: number[];
}

// Generate distinct canonical unit vectors for historical clinical cases
function generateCaseVector(seed: number): number[] {
  const vec = new Array(512).fill(0);
  for (let i = 0; i < 512; i++) {
    vec[i] = Math.sin((i + 1) * seed * 0.17) * Math.cos((i + 1) * 0.31);
  }
  return normalizeVector(vec);
}

// Seed historical clinical precedents
export const HISTORICAL_PRECEDENTS: PrecedentCase[] = [
  {
    image_id: "img_prec_01",
    photo_url: "/specimen_leaf.jpg",
    body_part: "leaf",
    tree_id: "tree_1084",
    tree_tag: "TREE-1084",
    species_id: 1, // Heritage Banyan
    species_name: "Heritage Banyan",
    disease_id: 1,
    disease_name: "Ganoderma Root & Butt Rot",
    severity_level: "CRITICAL",
    similarity_percent: 0,
    cosine_distance: 0,
    inspector_notes: "Severe lower foliage necrosis and bracket conk mycelium at basal root flare. Prompt soil drenching stabilized vascular water transport within 30 days.",
    treatment_id: 1,
    treatment_name: "Propiconazole Root Drench + Crown Weight Reduction",
    treatment_type: "chemical",
    outcome_status: "SUCCESSFUL",
    typical_cost: 180.0,
    cure_duration_days: 30,
    embedding: generateCaseVector(42)
  },
  {
    image_id: "img_prec_02",
    photo_url: "/specimen_trunk.jpg",
    body_part: "trunk",
    tree_id: "tree_3042",
    tree_tag: "TREE-3042",
    species_id: 2, // Neem Tree
    species_name: "Neem Tree",
    disease_id: 2,
    disease_name: "Bacterial Wetwood Canker",
    severity_level: "CRITICAL",
    similarity_percent: 0,
    cosine_distance: 0,
    inspector_notes: "Dark exuding sap with anaerobic bacterial fermentation from cortical split. Targeted antibiotic trunk micro-injections arrested bleeding canker.",
    treatment_id: 2,
    treatment_name: "Oxytetracycline Trunk Micro-Injection + Bark Debridement",
    treatment_type: "chemical",
    outcome_status: "SUCCESSFUL",
    typical_cost: 120.0,
    cure_duration_days: 21,
    embedding: generateCaseVector(89)
  },
  {
    image_id: "img_prec_03",
    photo_url: "/specimen_leaf.jpg",
    body_part: "leaf",
    tree_id: "tree_4190",
    tree_tag: "TREE-4190",
    species_id: 4, // Gulmohar
    species_name: "Gulmohar",
    disease_id: 4,
    disease_name: "Dutch Elm Vascular Wilt",
    severity_level: "CRITICAL",
    similarity_percent: 0,
    cosine_distance: 0,
    inspector_notes: "Rapid unilateral vascular flagging and xylem vessel clogging. Delayed therapeutic response necessitated root isolation trenching.",
    treatment_id: 10,
    treatment_name: "Macro-Infusion Systemic Fungicide Injection",
    treatment_type: "chemical",
    outcome_status: "FAILED",
    typical_cost: 290.0,
    cure_duration_days: 45,
    embedding: generateCaseVector(137)
  },
  {
    image_id: "img_prec_04",
    photo_url: "/specimen_leaf.jpg",
    body_part: "leaf",
    tree_id: "tree_2091",
    tree_tag: "TREE-2091",
    species_id: 3, // Rain Tree
    species_name: "Rain Tree",
    disease_id: 5,
    disease_name: "Anthracnose Foliar Blight",
    severity_level: "MODERATE",
    similarity_percent: 0,
    cosine_distance: 0,
    inspector_notes: "Irregular tan blotches bordering leaf veins following monsoon rains. Copper hydroxide foliar misting completely resolved fungal sporulation.",
    treatment_id: 5,
    treatment_name: "Copper Hydroxide Micronized Spray + Canopy Airflow Thinning",
    treatment_type: "chemical",
    outcome_status: "SUCCESSFUL",
    typical_cost: 75.0,
    cure_duration_days: 14,
    embedding: generateCaseVector(211)
  },
  {
    image_id: "img_prec_05",
    photo_url: "/specimen_trunk.jpg",
    body_part: "bark",
    tree_id: "tree_5012",
    tree_tag: "TREE-5012",
    species_id: 2, // Neem Tree
    species_name: "Neem Tree",
    disease_id: 3,
    disease_name: "Emerald Ash Borer Galleries",
    severity_level: "HIGH",
    similarity_percent: 0,
    cosine_distance: 0,
    inspector_notes: "D-shaped exit apertures and serpentine frass-packed galleries under bark. Emamectin benzoate injection prevented larval girdling.",
    treatment_id: 3,
    treatment_name: "Emamectin Benzoate Trunk Micro-Injection",
    treatment_type: "chemical",
    outcome_status: "SUCCESSFUL",
    typical_cost: 240.0,
    cure_duration_days: 14,
    embedding: generateCaseVector(307)
  }
];

/**
 * Searches historical precedents ordered by pgvector cosine distance: img.image_embedding <=> queryVector
 */
export function searchPrecedents(
  queryVector: number[],
  options?: {
    species_id?: number;
    limit?: number;
  }
): PrecedentCase[] {
  const limit = options?.limit || 5;

  let candidates = [...HISTORICAL_PRECEDENTS];
  if (options?.species_id) {
    const speciesFiltered = candidates.filter((c) => c.species_id === options.species_id);
    if (speciesFiltered.length > 0) candidates = speciesFiltered;
  }

  const scoredCases = candidates.map((c) => {
    const dist = cosineDistance(queryVector, c.embedding);
    const sim = Math.max(0, 1 - dist);
    return {
      ...c,
      cosine_distance: Math.round(dist * 1000) / 1000,
      similarity_percent: Math.round(sim * 10000) / 100
    };
  });

  // Sort ascending by cosine distance (nearest neighbors first)
  scoredCases.sort((a, b) => a.cosine_distance - b.cosine_distance);

  return scoredCases.slice(0, limit);
}

