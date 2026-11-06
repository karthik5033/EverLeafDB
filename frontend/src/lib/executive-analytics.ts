/**
 * EverLeafDB Phase 25: Executive Analytics & Ward Health Dashboard Engine
 *
 * Precomputes and serves municipal executive roll-up metrics:
 * 1. City-wide KPI cards (Total trees, Health Index %, Contagion Outbreaks, Overdue Queues)
 * 2. Health status categorical distribution for Donut Chart visualizations
 * 3. Species biodiversity distribution for Bar Chart visualizations
 * 4. Ward-by-ward comparative health matrix (leveraging Phase 24's Materialized View)
 * 5. One-click CSV and printable municipal report export generator
 */

import { TREES, WARDS, ALERTS, WORK_ORDERS, SPECIES_SEED } from "./db";
import { getWardHealthSummary, WardHealthSummaryRecord } from "./materialized-views";

export interface ExecutiveCityKpis {
  total_managed_trees: number;
  total_covered_wards: number;
  forest_health_index_pct: number;
  active_contagion_alerts: number;
  overdue_inspections_count: number;
  total_canopy_biomass_dbh_cm: number;
  city_avg_condition_score: number;
  active_work_orders_count: number;
  total_remediation_invested_usd: number;
  computed_at: string;
}

export interface HealthDistributionSlice {
  status: string;
  label: string;
  count: number;
  percentage: number;
  color_hex: string;
}

export interface SpeciesBiodiversityBar {
  species_id: number;
  common_name: string;
  scientific_name: string;
  population_count: number;
  biodiversity_percentage: number;
  avg_dbh_cm: number;
  avg_height_m: number;
  diseased_count: number;
}

export interface ExecutiveOverviewData {
  kpis: ExecutiveCityKpis;
  health_distribution: HealthDistributionSlice[];
  species_biodiversity: SpeciesBiodiversityBar[];
  ward_summaries: WardHealthSummaryRecord[];
  csv_export_string: string;
}

/**
 * Computes high-level city-wide KPIs.
 */
export function computeExecutiveKpis(): ExecutiveCityKpis {
  const totalTrees = TREES.length;
  const coveredWards = new Set(TREES.map((t) => t.ward_id)).size;

  const healthyCount = TREES.filter(
    (t) => t.health_status.toUpperCase() === "HEALTHY" || t.health_status.toUpperCase() === "EXCELLENT"
  ).length;

  const healthIndex = totalTrees > 0 ? Math.round((healthyCount / totalTrees) * 1000) / 10 : 0;

  const activeAlerts = ALERTS.filter((a) => a.status === "PENDING").length;

  const now = new Date();
  const threshold180Days = new Date(now.getTime() - 180 * 24 * 3600 * 1000);
  const overdueCount = TREES.filter((t) => {
    if (!t.last_inspected_at) return true;
    return new Date(t.last_inspected_at) < threshold180Days;
  }).length;

  const totalBiomassDbh = Math.round(TREES.reduce((sum, t) => sum + (t.dbh_cm || 0), 0) * 10) / 10;
  const avgCondition = totalTrees > 0
    ? Math.round((TREES.reduce((sum, t) => sum + (t.condition_score || 3), 0) / totalTrees) * 100) / 100
    : 0;

  const activeWorkOrders = WORK_ORDERS.filter(
    (w) => w.status === "PENDING" || w.status === "IN_PROGRESS" || w.status === "DISPATCHED"
  ).length;

  const totalRemediationCost = WORK_ORDERS.filter((w) => w.status === "COMPLETED")
    .reduce((sum, w) => sum + (w.cost_estimate_usd || 0), 0);

  return {
    total_managed_trees: totalTrees,
    total_covered_wards: coveredWards,
    forest_health_index_pct: healthIndex,
    active_contagion_alerts: activeAlerts,
    overdue_inspections_count: overdueCount,
    total_canopy_biomass_dbh_cm: totalBiomassDbh,
    city_avg_condition_score: avgCondition,
    active_work_orders_count: activeWorkOrders,
    total_remediation_invested_usd: totalRemediationCost,
    computed_at: new Date().toISOString()
  };
}

/**
 * Computes health status distribution slices for Donut Chart.
 */
export function computeHealthDistribution(): HealthDistributionSlice[] {
  const totalTrees = Math.max(TREES.length, 1);
  const categories: {
    status: string;
    label: string;
    color: string;
    filter: (s: string) => boolean;
  }[] = [
    {
      status: "HEALTHY",
      label: "Healthy & Vigorous",
      color: "#10b981", // Emerald-500
      filter: (s) => s === "HEALTHY" || s === "EXCELLENT"
    },
    {
      status: "WARNING",
      label: "Foliar / Moderate Stress",
      color: "#f59e0b", // Amber-500
      filter: (s) => s === "WARNING" || s === "MODERATE" || s === "MONITOR"
    },
    {
      status: "CRITICAL",
      label: "Critical Structural / Root Decay",
      color: "#ef4444", // Red-500
      filter: (s) => s === "CRITICAL" || s === "POOR" || s === "DISEASED"
    },
    {
      status: "DEAD",
      label: "Dead Specimen (Hazard)",
      color: "#64748b", // Slate-500
      filter: (s) => s === "DEAD"
    }
  ];

  return categories.map((cat) => {
    const count = TREES.filter((t) => cat.filter(t.health_status.toUpperCase())).length;
    const percentage = Math.round((count / totalTrees) * 1000) / 10;
    return {
      status: cat.status,
      label: cat.label,
      count: count,
      percentage: percentage,
      color_hex: cat.color
    };
  });
}

/**
 * Computes tree species biodiversity shares for Bar Chart.
 */
export function computeSpeciesBiodiversity(): SpeciesBiodiversityBar[] {
  const totalTrees = Math.max(TREES.length, 1);

  return SPECIES_SEED.map((sp) => {
    const specTrees = TREES.filter((t) => t.species_id === sp.species_id);
    const count = specTrees.length;
    const percentage = Math.round((count / totalTrees) * 1000) / 10;

    const totalDbh = specTrees.reduce((sum, t) => sum + (t.dbh_cm || 0), 0);
    const totalHeight = specTrees.reduce((sum, t) => sum + (t.height_m || 0), 0);
    const diseased = specTrees.filter(
      (t) => t.health_status.toUpperCase() === "CRITICAL" || t.health_status.toUpperCase() === "POOR"
    ).length;

    return {
      species_id: sp.species_id,
      common_name: sp.common_name,
      scientific_name: sp.scientific_name,
      population_count: count,
      biodiversity_percentage: percentage,
      avg_dbh_cm: count > 0 ? Math.round((totalDbh / count) * 10) / 10 : 0,
      avg_height_m: count > 0 ? Math.round((totalHeight / count) * 10) / 10 : 0,
      diseased_count: diseased
    };
  }).sort((a, b) => b.population_count - a.population_count);
}

/**
 * Generates structured CSV string formatted for municipal administrative exports.
 */
export function generateExecutiveCsvReport(wardSummaries: WardHealthSummaryRecord[]): string {
  const header = [
    "Ward ID",
    "Ward Name",
    "Zone",
    "Total Trees",
    "Healthy Trees",
    "Critical Trees",
    "Dead Trees",
    "Health Index (%)",
    "Avg Condition Score",
    "Active Alerts",
    "Outbreak Status",
    "Overdue Inspections",
    "Open Work Orders",
    "Total DBH Biomass (cm)",
    "Report Generated At"
  ].join(",");

  const rows = wardSummaries.map((w) => {
    return [
      `"${w.ward_id}"`,
      `"${w.ward_name}"`,
      `"${w.ward_zone}"`,
      w.total_trees,
      w.healthy_trees,
      w.critical_trees,
      w.dead_trees,
      w.health_index_pct,
      w.avg_condition_score,
      w.active_alerts_count,
      `"${w.active_outbreak_flag ? "ACTIVE_OUTBREAK" : "STABLE"}"`,
      w.overdue_inspections_count,
      w.open_work_orders_count,
      w.total_dbh_biomass_cm,
      `"${new Date().toISOString()}"`
    ].join(",");
  });

  return [header, ...rows].join("\n");
}

/**
 * Consolidated retriever for Executive Analytics Dashboard.
 */
export function getExecutiveOverviewData(): ExecutiveOverviewData {
  const kpis = computeExecutiveKpis();
  const healthDist = computeHealthDistribution();
  const speciesBio = computeSpeciesBiodiversity();
  const wardSummaryResult = getWardHealthSummary(true);
  const csvReport = generateExecutiveCsvReport(wardSummaryResult.data);

  return {
    kpis,
    health_distribution: healthDist,
    species_biodiversity: speciesBio,
    ward_summaries: wardSummaryResult.data,
    csv_export_string: csvReport
  };
}
