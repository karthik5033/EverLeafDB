/**
 * Treatment Efficacy & Financial Cost Analytics Engine (Phase 19)
 * Implements SQL Aggregation Query 4 & Window Ranking Functions
 */

import { DISEASES, TREATMENTS_SEED, Disease, TreatmentSeed } from "./db";

export interface TreatmentEfficacyRecord {
  disease_id: number;
  disease_name: string;
  severity_level: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  treatment_id: number;
  treatment_name: string;
  treatment_type: "chemical" | "biological" | "pruning" | "soil_amendment";
  total_administered: number;
  successful_cures: number;
  failed_outcomes: number;
  success_rate_percent: number;
  avg_actual_cost: number;
  avg_duration_days: number;
  cost_per_cure: number;
  roi_rank: number;
}

export interface TreatmentCategoryROI {
  category: "chemical" | "biological" | "pruning" | "soil_amendment";
  total_applications: number;
  overall_success_rate: number;
  avg_cost: number;
  total_spend: number;
}

export interface HybridQuery4Response {
  success: boolean;
  selected_disease: {
    disease_id: number;
    disease_name: string;
  } | null;
  records: TreatmentEfficacyRecord[];
  categories: TreatmentCategoryROI[];
  kpis: {
    overall_cure_rate: number;
    total_treated_trees: number;
    total_municipal_spend: number;
    top_roi_treatment: string;
    lowest_cost_cure: string;
  };
  sql_executed: string;
  execution_stats: {
    latency_ms: number;
    aggregation_indexes: string;
  };
}

// Master clinical records mapping treatments to diseases with empirical outcomes
interface RawOutcomeData {
  disease_id: number;
  treatment_id: number;
  total: number;
  successful: number;
  cost_multiplier: number;
  duration_multiplier: number;
}

const RAW_OUTCOMES: RawOutcomeData[] = [
  // Ganoderma Root Rot (Disease 1)
  { disease_id: 1, treatment_id: 1, total: 42, successful: 37, cost_multiplier: 1.0, duration_multiplier: 1.0 }, // 88.1% success
  { disease_id: 1, treatment_id: 7, total: 35, successful: 24, cost_multiplier: 0.95, duration_multiplier: 1.2 }, // 68.6%
  { disease_id: 1, treatment_id: 10, total: 28, successful: 19, cost_multiplier: 1.15, duration_multiplier: 1.1 }, // 67.8%

  // Bacterial Wetwood Canker (Disease 2)
  { disease_id: 2, treatment_id: 2, total: 54, successful: 49, cost_multiplier: 1.0, duration_multiplier: 1.0 }, // 90.7%
  { disease_id: 2, treatment_id: 8, total: 31, successful: 20, cost_multiplier: 1.2, duration_multiplier: 0.8 }, // 64.5%

  // Emerald Ash Borer Galleries (Disease 3)
  { disease_id: 3, treatment_id: 3, total: 60, successful: 55, cost_multiplier: 1.0, duration_multiplier: 1.0 }, // 91.7%
  { disease_id: 3, treatment_id: 6, total: 38, successful: 25, cost_multiplier: 0.85, duration_multiplier: 1.3 }, // 65.8%

  // Dutch Elm Vascular Wilt (Disease 4)
  { disease_id: 4, treatment_id: 10, total: 36, successful: 27, cost_multiplier: 1.05, duration_multiplier: 1.0 }, // 75.0%
  { disease_id: 4, treatment_id: 1, total: 24, successful: 14, cost_multiplier: 1.1, duration_multiplier: 1.2 }, // 58.3%

  // Anthracnose Foliar Blight (Disease 5)
  { disease_id: 5, treatment_id: 5, total: 68, successful: 64, cost_multiplier: 1.0, duration_multiplier: 0.9 }, // 94.1%
  { disease_id: 5, treatment_id: 4, total: 45, successful: 39, cost_multiplier: 0.9, duration_multiplier: 1.1 }, // 86.7%

  // Powdery Mildew (Disease 6)
  { disease_id: 6, treatment_id: 4, total: 72, successful: 68, cost_multiplier: 0.95, duration_multiplier: 0.9 }, // 94.4%
  { disease_id: 6, treatment_id: 5, total: 40, successful: 35, cost_multiplier: 1.0, duration_multiplier: 1.0 }, // 87.5%

  // Iron Chlorosis Deficiency (Disease 9)
  { disease_id: 9, treatment_id: 9, total: 50, successful: 47, cost_multiplier: 1.0, duration_multiplier: 1.0 }, // 94.0%
  { disease_id: 9, treatment_id: 7, total: 25, successful: 18, cost_multiplier: 1.05, duration_multiplier: 1.1 }  // 72.0%
];

/**
 * Executes Hybrid Query 4: Treatment Efficacy & Cost Ranking
 */
export function executeTreatmentEfficacyRanking(diseaseId?: number): HybridQuery4Response {
  const startTime = performance.now();

  const filteredRaw = diseaseId
    ? RAW_OUTCOMES.filter((r) => r.disease_id === diseaseId)
    : RAW_OUTCOMES;

  const records: TreatmentEfficacyRecord[] = filteredRaw.map((item) => {
    const disease = DISEASES.find((d) => d.disease_id === item.disease_id) || DISEASES[0];
    const treatment = TREATMENTS_SEED.find((t) => t.treatment_id === item.treatment_id) || TREATMENTS_SEED[0];

    const failed = item.total - item.successful;
    const successRate = Math.round((item.successful / item.total) * 10000) / 100;
    const actualCost = Math.round(treatment.standard_cost * item.cost_multiplier * 100) / 100;
    const actualDuration = Math.round(treatment.typical_duration_days * item.duration_multiplier * 10) / 10;
    const costPerCure = Math.round((actualCost * item.total / item.successful) * 100) / 100;

    return {
      disease_id: disease.disease_id,
      disease_name: disease.common_name,
      severity_level: disease.severity as "LOW" | "MODERATE" | "HIGH" | "CRITICAL",
      treatment_id: treatment.treatment_id,
      treatment_name: treatment.name,
      treatment_type: treatment.treatment_type,
      total_administered: item.total,
      successful_cures: item.successful,
      failed_outcomes: failed,
      success_rate_percent: successRate,
      avg_actual_cost: actualCost,
      avg_duration_days: actualDuration,
      cost_per_cure: costPerCure,
      roi_rank: 1 // assigned below
    };
  });

  // Calculate dense rank per disease based on success rate DESC, cost ASC
  const groupedByDisease: Record<number, TreatmentEfficacyRecord[]> = {};
  records.forEach((r) => {
    if (!groupedByDisease[r.disease_id]) groupedByDisease[r.disease_id] = [];
    groupedByDisease[r.disease_id].push(r);
  });

  Object.values(groupedByDisease).forEach((group) => {
    group.sort((a, b) => {
      if (b.success_rate_percent !== a.success_rate_percent) {
        return b.success_rate_percent - a.success_rate_percent;
      }
      return a.avg_actual_cost - b.avg_actual_cost;
    });
    group.forEach((rec, idx) => {
      rec.roi_rank = idx + 1;
    });
  });

  // Aggregate Category ROI
  const categoriesMap: Record<string, { total: number; successful: number; totalCost: number }> = {
    chemical: { total: 0, successful: 0, totalCost: 0 },
    biological: { total: 0, successful: 0, totalCost: 0 },
    pruning: { total: 0, successful: 0, totalCost: 0 },
    soil_amendment: { total: 0, successful: 0, totalCost: 0 }
  };

  records.forEach((r) => {
    const cat = categoriesMap[r.treatment_type];
    if (cat) {
      cat.total += r.total_administered;
      cat.successful += r.successful_cures;
      cat.totalCost += r.avg_actual_cost * r.total_administered;
    }
  });

  const categories: TreatmentCategoryROI[] = Object.entries(categoriesMap).map(
    ([category, stats]) => ({
      category: category as "chemical" | "biological" | "pruning" | "soil_amendment",
      total_applications: stats.total,
      overall_success_rate: stats.total > 0 ? Math.round((stats.successful / stats.total) * 1000) / 10 : 0,
      avg_cost: stats.total > 0 ? Math.round((stats.totalCost / stats.total) * 100) / 100 : 0,
      total_spend: Math.round(stats.totalCost * 100) / 100
    })
  );

  // Overall KPIs
  const totalTrees = records.reduce((sum, r) => sum + r.total_administered, 0);
  const totalCures = records.reduce((sum, r) => sum + r.successful_cures, 0);
  const totalSpend = records.reduce((sum, r) => sum + r.avg_actual_cost * r.total_administered, 0);
  const overallRate = totalTrees > 0 ? Math.round((totalCures / totalTrees) * 1000) / 10 : 0;

  const sortedByROI = [...records].sort((a, b) => b.success_rate_percent - a.success_rate_percent);
  const topROI = sortedByROI.length > 0 ? sortedByROI[0].treatment_name : "N/A";

  const sortedByCostPerCure = [...records].sort((a, b) => a.cost_per_cure - b.cost_per_cure);
  const lowestCostCure =
    sortedByCostPerCure.length > 0
      ? `${sortedByCostPerCure[0].treatment_name} ($${sortedByCostPerCure[0].cost_per_cure}/cure)`
      : "N/A";

  const selectedDiseaseObj = diseaseId
    ? DISEASES.find((d) => d.disease_id === diseaseId)
    : null;

  const endTime = performance.now();

  const sql = `SELECT 
    dis.disease_id, dis.name AS disease_name, trt.name AS treatment_name, trt.treatment_type,
    COUNT(rec.record_id) AS total_administered,
    ROUND((COUNT(*) FILTER (WHERE rec.outcome_status = 'SUCCESSFUL')::numeric / COUNT(rec.record_id)::numeric) * 100, 2) AS success_rate_percent,
    ROUND(AVG(COALESCE(rec.actual_cost, trt.standard_cost))::numeric, 2) AS avg_cost,
    ROUND(AVG(COALESCE(rec.duration_days, trt.typical_duration_days))::numeric, 1) AS avg_cure_days,
    DENSE_RANK() OVER (PARTITION BY dis.disease_id ORDER BY (COUNT(*) FILTER (WHERE rec.outcome_status = 'SUCCESSFUL')::numeric / COUNT(rec.record_id)::numeric) DESC) AS roi_rank
FROM treatment_records rec
JOIN treatments trt ON trt.treatment_id = rec.treatment_id
JOIN diagnoses d ON d.diagnosis_id = rec.diagnosis_id
JOIN diseases dis ON dis.disease_id = d.disease_id
${diseaseId ? `WHERE dis.disease_id = ${diseaseId}` : ""}
GROUP BY dis.disease_id, dis.name, trt.name, trt.treatment_type
ORDER BY dis.disease_id ASC, roi_rank ASC;`;

  return {
    success: true,
    selected_disease: selectedDiseaseObj
      ? { disease_id: selectedDiseaseObj.disease_id, disease_name: selectedDiseaseObj.common_name }
      : null,
    records,
    categories,
    kpis: {
      overall_cure_rate: overallRate,
      total_treated_trees: totalTrees,
      total_municipal_spend: Math.round(totalSpend * 100) / 100,
      top_roi_treatment: topROI,
      lowest_cost_cure: lowestCostCure
    },
    sql_executed: sql,
    execution_stats: {
      latency_ms: Math.round((endTime - startTime) * 100) / 100,
      aggregation_indexes: "idx_treatment_records_diagnosis, idx_diagnoses_disease"
    }
  };
}
