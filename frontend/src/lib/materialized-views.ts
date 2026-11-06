/**
 * EverLeafDB Phase 24: Materialized Views & Concurrent Refresh Automation
 *
 * Implements:
 * 1. Materialized view data contract & precomputed store: mv_ward_health_summary
 * 2. Non-blocking concurrent refresh simulation (REFRESH MATERIALIZED VIEW CONCURRENTLY)
 * 3. Empirical latency benchmarking comparing live relational aggregation vs. precomputed view
 * 4. Automated audit logging of refresh runs for operational telemetry
 */

import { WARDS, TREES, ALERTS, WORK_ORDERS, Tree } from "./db";
import { AUDIT_STORE } from "./audit";
import { AuditLog } from "../types/database";

export interface WardHealthSummaryRecord {
  ward_id: string;
  ward_name: string;
  ward_zone: string;
  total_trees: number;
  healthy_trees: number;
  critical_trees: number;
  dead_trees: number;
  avg_condition_score: number;
  health_index_pct: number;
  active_alerts_count: number;
  active_outbreak_flag: boolean;
  overdue_inspections_count: number;
  open_work_orders_count: number;
  total_dbh_biomass_cm: number;
  avg_height_m: number;
  refreshed_at: string;
}

export interface WardHealthBenchmarkResult {
  iterations: number;
  live_query_avg_ms: number;
  materialized_view_avg_ms: number;
  speedup_factor: number;
  meets_5ms_target: boolean;
}

// In-memory Materialized View Cache
let LAST_REFRESH_TIMESTAMP = new Date().toISOString();

function computeWardSummaryLive(): WardHealthSummaryRecord[] {
  const now = new Date();
  const thresholdDays = 180;
  const thresholdDate = new Date(now.getTime() - thresholdDays * 24 * 3600 * 1000);

  return WARDS.map((ward) => {
    const wardTrees = TREES.filter((t) => t.ward_id === ward.ward_id);
    const totalTrees = wardTrees.length;

    const healthyTrees = wardTrees.filter(
      (t) => t.health_status.toUpperCase() === "HEALTHY" || t.health_status.toUpperCase() === "EXCELLENT"
    ).length;

    const criticalTrees = wardTrees.filter(
      (t) => t.health_status.toUpperCase() === "CRITICAL" || t.health_status.toUpperCase() === "POOR"
    ).length;

    const deadTrees = wardTrees.filter(
      (t) => t.health_status.toUpperCase() === "DEAD"
    ).length;

    const conditionSum = wardTrees.reduce((sum, t) => sum + (t.condition_score || 3), 0);
    const avgCondition = totalTrees > 0 ? Math.round((conditionSum / totalTrees) * 100) / 100 : 0;
    const healthIndex = totalTrees > 0 ? Math.round((healthyTrees / totalTrees) * 1000) / 10 : 0;

    // Active pending alerts in this ward
    const activeAlerts = ALERTS.filter(
      (a) => a.ward_id === ward.ward_id && a.status === "PENDING"
    ).length;

    // Overdue inspections (> 180 days)
    const overdueCount = wardTrees.filter((t) => {
      if (!t.last_inspected_at) return true;
      return new Date(t.last_inspected_at) < thresholdDate;
    }).length;

    // Open work orders
    const openOrders = WORK_ORDERS.filter((wo) => {
      const tree = TREES.find((t) => t.tree_id === wo.tree_id);
      return tree?.ward_id === ward.ward_id && (wo.status === "PENDING" || wo.status === "IN_PROGRESS" || wo.status === "DISPATCHED");
    }).length;

    // Biomass metrics
    const totalDbh = Math.round(wardTrees.reduce((sum, t) => sum + (t.dbh_cm || 0), 0) * 10) / 10;
    const avgHeight = totalTrees > 0 ? Math.round((wardTrees.reduce((sum, t) => sum + (t.height_m || 0), 0) / totalTrees) * 10) / 10 : 0;

    return {
      ward_id: ward.ward_id,
      ward_name: ward.name,
      ward_zone: "Zone Central",
      total_trees: totalTrees,
      healthy_trees: healthyTrees,
      critical_trees: criticalTrees,
      dead_trees: deadTrees,
      avg_condition_score: avgCondition,
      health_index_pct: healthIndex,
      active_alerts_count: activeAlerts,
      active_outbreak_flag: activeAlerts >= 2,
      overdue_inspections_count: overdueCount,
      open_work_orders_count: openOrders,
      total_dbh_biomass_cm: totalDbh,
      avg_height_m: avgHeight,
      refreshed_at: LAST_REFRESH_TIMESTAMP
    };
  }).sort((a, b) => a.health_index_pct - b.health_index_pct);
}

// Initial precomputation of the Materialized View
export let MATERIALIZED_WARD_HEALTH_SUMMARY: WardHealthSummaryRecord[] = computeWardSummaryLive();

/**
 * Retrieves the ward health summary.
 * - When useMaterializedView is true (default), serves sub-millisecond precomputed data.
 * - When false, simulates the full unindexed relational aggregation scan.
 */
export function getWardHealthSummary(useMaterializedView: boolean = true): {
  data: WardHealthSummaryRecord[];
  execution_latency_ms: number;
  query_source: "MATERIALIZED_VIEW" | "LIVE_RELATIONAL_AGGREGATION";
  refreshed_at: string;
} {
  const start = performance.now();

  if (useMaterializedView) {
    // Fast path: precomputed materialized view read
    const copy = MATERIALIZED_WARD_HEALTH_SUMMARY.map((row) => ({ ...row }));
    const latency = performance.now() - start;

    return {
      data: copy,
      execution_latency_ms: Math.round(latency * 1000) / 1000,
      query_source: "MATERIALIZED_VIEW",
      refreshed_at: LAST_REFRESH_TIMESTAMP
    };
  }

  // Live aggregation scan: compute on the fly
  const liveData = computeWardSummaryLive();
  const latency = performance.now() - start;

  return {
    data: liveData,
    execution_latency_ms: Math.round(latency * 1000) / 1000,
    query_source: "LIVE_RELATIONAL_AGGREGATION",
    refreshed_at: new Date().toISOString()
  };
}

/**
 * Executes a simulated non-blocking REFRESH MATERIALIZED VIEW CONCURRENTLY.
 * Reads continue unimpeded while the snapshot is recomputed and swapped atomically.
 */
export function refreshWardHealthSummaryConcurrently(actorId: string = "cron_scheduler"): {
  success: boolean;
  rows_refreshed: number;
  duration_ms: number;
  refreshed_at: string;
  status: "COMPLETED";
} {
  const start = performance.now();
  LAST_REFRESH_TIMESTAMP = new Date().toISOString();

  // Recompute the snapshot
  const recomputed = computeWardSummaryLive();
  MATERIALIZED_WARD_HEALTH_SUMMARY = recomputed;

  const duration = performance.now() - start;
  const durationMs = Math.round(duration * 1000) / 1000;

  // Record Audit Trail
  const auditEntry: AuditLog = {
    log_id: AUDIT_STORE.length + 1,
    user_id: actorId,
    action: "UPDATE",
    table_name: "mv_ward_health_summary",
    record_id: "cron_refresh",
    old_values: null,
    new_values: {
      refresh_type: "CONCURRENT",
      rows_refreshed: recomputed.length,
      duration_ms: durationMs,
      status: "COMPLETED"
    },
    performed_at: LAST_REFRESH_TIMESTAMP
  };
  AUDIT_STORE.unshift(auditEntry);

  return {
    success: true,
    rows_refreshed: recomputed.length,
    duration_ms: durationMs,
    refreshed_at: LAST_REFRESH_TIMESTAMP,
    status: "COMPLETED"
  };
}

/**
 * Benchmarks the Materialized View against the live multi-table relational aggregation.
 */
export function benchmarkMaterializedViewVsLive(iterations: number = 30): WardHealthBenchmarkResult {
  // Benchmark live queries
  const liveTimes: number[] = [];
  for (let i = 0; i < iterations; i++) {
    const t0 = performance.now();
    computeWardSummaryLive();
    liveTimes.push(performance.now() - t0);
  }
  const avgLiveMs = liveTimes.reduce((a, b) => a + b, 0) / iterations;

  // Benchmark Materialized View queries
  const mvTimes: number[] = [];
  for (let i = 0; i < iterations; i++) {
    const t0 = performance.now();
    const _ = MATERIALIZED_WARD_HEALTH_SUMMARY.map(r => r.ward_id);
    mvTimes.push(performance.now() - t0);
  }
  const avgMvMs = mvTimes.reduce((a, b) => a + b, 0) / iterations;

  const speedup = Math.round((avgLiveMs / Math.max(avgMvMs, 0.0001)) * 100) / 100;

  return {
    iterations,
    live_query_avg_ms: Math.round(avgLiveMs * 1000) / 1000,
    materialized_view_avg_ms: Math.round(avgMvMs * 1000) / 1000,
    speedup_factor: speedup,
    meets_5ms_target: avgMvMs < 5.0
  };
}
