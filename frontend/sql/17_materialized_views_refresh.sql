-- ============================================================================
-- EVERLEAFDB: MATERIALIZED VIEWS & CONCURRENT REFRESH AUTOMATION
-- Phase 24: Materialized Views & Concurrent Refresh Automation
--
-- Creates:
-- 1. Materialized View: mv_ward_health_summary
-- 2. Unique Index: idx_mv_ward_health_pk (Required for REFRESH CONCURRENTLY)
-- 3. Stored Procedure: sp_refresh_ward_health_summary_concurrently
-- 4. Benchmark Function: fn_benchmark_mv_vs_live_query
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Materialized View: mv_ward_health_summary
-- Precomputes municipal canopy health, active outbreaks, and overdue queues
-- to achieve sub-5ms dashboard queries across high-volume urban forest registries.
-- ----------------------------------------------------------------------------
DROP MATERIALIZED VIEW IF EXISTS mv_ward_health_summary CASCADE;

CREATE MATERIALIZED VIEW mv_ward_health_summary AS
SELECT
    w.ward_id,
    w.name AS ward_name,
    w.zone AS ward_zone,
    
    -- Tree Canopy Inventory Counts
    COUNT(t.tree_id)::INT AS total_trees,
    COUNT(CASE WHEN t.health_status IN ('HEALTHY', 'EXCELLENT') THEN 1 END)::INT AS healthy_trees,
    COUNT(CASE WHEN t.health_status IN ('CRITICAL', 'POOR') THEN 1 END)::INT AS critical_trees,
    COUNT(CASE WHEN t.health_status = 'DEAD' THEN 1 END)::INT AS dead_trees,
    
    -- Condition Metrics & Health Index
    COALESCE(ROUND(AVG(t.condition_score)::NUMERIC, 2), 0.00) AS avg_condition_score,
    COALESCE(
        ROUND(
            (COUNT(CASE WHEN t.health_status IN ('HEALTHY', 'EXCELLENT') THEN 1 END)::NUMERIC / 
             NULLIF(COUNT(t.tree_id), 0)) * 100,
            1
        ),
        0.0
    ) AS health_index_pct,
    
    -- Active Outbreaks & Biosecurity Risk Alerts
    COALESCE(COUNT(DISTINCT a.alert_id) FILTER (WHERE a.status = 'PENDING'), 0)::INT AS active_alerts_count,
    CASE
        WHEN COUNT(DISTINCT a.alert_id) FILTER (WHERE a.status = 'PENDING') >= 2 THEN TRUE
        ELSE FALSE
    END AS active_outbreak_flag,
    
    -- Operational Overdue Inspections (> 180 days since last transect)
    COALESCE(
        COUNT(CASE WHEN t.last_inspected_at IS NULL OR t.last_inspected_at < (CURRENT_DATE - INTERVAL '180 days') THEN 1 END),
        0
    )::INT AS overdue_inspections_count,
    
    -- Open Work Orders Queue
    COALESCE(
        COUNT(DISTINCT wo.order_id) FILTER (WHERE wo.status IN ('PENDING', 'IN_PROGRESS', 'DISPATCHED')),
        0
    )::INT AS open_work_orders_count,
    
    -- Total Ecological Biomass Aggregate
    COALESCE(ROUND(SUM(t.dbh_cm)::NUMERIC, 1), 0.0) AS total_dbh_biomass_cm,
    COALESCE(ROUND(AVG(t.height_m)::NUMERIC, 1), 0.0) AS avg_height_m,
    
    -- Timestamp of Materialized Cache Generation
    CURRENT_TIMESTAMP AS refreshed_at
FROM wards w
LEFT JOIN trees t ON w.ward_id = t.ward_id
LEFT JOIN alerts a ON t.tree_id = a.tree_id
LEFT JOIN work_orders wo ON t.tree_id = wo.tree_id
GROUP BY w.ward_id, w.name, w.zone
ORDER BY health_index_pct ASC, total_trees DESC;

COMMENT ON MATERIALIZED VIEW mv_ward_health_summary IS
'Precomputed municipal canopy health summary per ward enabling sub-5ms executive dashboard queries.';

-- ----------------------------------------------------------------------------
-- Unique Index: idx_mv_ward_health_pk
-- Mandatory requirement in PostgreSQL for non-blocking REFRESH CONCURRENTLY
-- ----------------------------------------------------------------------------
CREATE UNIQUE INDEX idx_mv_ward_health_pk ON mv_ward_health_summary(ward_id);

-- Secondary Performance Indices
CREATE INDEX idx_mv_ward_health_pct ON mv_ward_health_summary(health_index_pct ASC);
CREATE INDEX idx_mv_ward_outbreaks ON mv_ward_health_summary(active_outbreak_flag) WHERE active_outbreak_flag = TRUE;

-- ----------------------------------------------------------------------------
-- Stored Procedure: sp_refresh_ward_health_summary_concurrently
-- Executes non-blocking background refresh and records telemetry in audit_log
-- ----------------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE sp_refresh_ward_health_summary_concurrently(
    IN p_actor_id UUID DEFAULT NULL,
    OUT p_execution_status VARCHAR(50),
    OUT p_rows_refreshed INT,
    OUT p_duration_ms NUMERIC(10, 3)
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_start_time TIMESTAMP;
    v_end_time TIMESTAMP;
    v_row_count INT;
BEGIN
    v_start_time := clock_timestamp();
    p_execution_status := 'STARTED';

    -- Non-blocking concurrent refresh: reads continue without locks!
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_ward_health_summary;

    v_end_time := clock_timestamp();
    p_duration_ms := ROUND((EXTRACT(EPOCH FROM (v_end_time - v_start_time)) * 1000)::NUMERIC, 3);

    SELECT COUNT(*) INTO v_row_count FROM mv_ward_health_summary;
    p_rows_refreshed := v_row_count;
    p_execution_status := 'COMPLETED';

    -- Record Audit Trail
    INSERT INTO audit_log (
        user_id,
        action,
        table_name,
        record_id,
        old_values,
        new_values,
        performed_at
    ) VALUES (
        p_actor_id,
        'UPDATE',
        'mv_ward_health_summary',
        'cron_refresh',
        NULL,
        jsonb_build_object(
            'refresh_type', 'CONCURRENT',
            'rows_refreshed', p_rows_refreshed,
            'duration_ms', p_duration_ms,
            'status', p_execution_status
        ),
        CURRENT_TIMESTAMP
    );
END;
$$;

COMMENT ON PROCEDURE sp_refresh_ward_health_summary_concurrently IS
'Executes non-blocking REFRESH MATERIALIZED VIEW CONCURRENTLY and logs performance duration to audit_log.';

-- ----------------------------------------------------------------------------
-- Benchmark Function: fn_benchmark_mv_vs_live_query
-- Empirically compares the execution duration of the Materialized View
-- against the live multi-table relational aggregation query.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_benchmark_mv_vs_live_query(
    p_iterations INT DEFAULT 10
)
RETURNS TABLE (
    iterations INT,
    live_query_avg_ms NUMERIC(10, 3),
    materialized_view_avg_ms NUMERIC(10, 3),
    speedup_factor NUMERIC(8, 2),
    meets_5ms_target BOOLEAN
) AS $$
DECLARE
    v_start TIMESTAMP;
    v_live_total NUMERIC := 0;
    v_mv_total NUMERIC := 0;
    v_dummy_count INT;
    v_i INT;
    v_live_avg NUMERIC;
    v_mv_avg NUMERIC;
    v_speedup NUMERIC;
BEGIN
    -- Measure Live Query
    FOR v_i IN 1..p_iterations LOOP
        v_start := clock_timestamp();
        PERFORM
            w.ward_id,
            COUNT(t.tree_id),
            COUNT(CASE WHEN t.health_status IN ('HEALTHY', 'EXCELLENT') THEN 1 END),
            COUNT(DISTINCT a.alert_id) FILTER (WHERE a.status = 'PENDING')
        FROM wards w
        LEFT JOIN trees t ON w.ward_id = t.ward_id
        LEFT JOIN alerts a ON t.tree_id = a.tree_id
        LEFT JOIN work_orders wo ON t.tree_id = wo.tree_id
        GROUP BY w.ward_id, w.name, w.zone;
        v_live_total := v_live_total + (EXTRACT(EPOCH FROM (clock_timestamp() - v_start)) * 1000);
    END LOOP;

    -- Measure Materialized View
    FOR v_i IN 1..p_iterations LOOP
        v_start := clock_timestamp();
        PERFORM * FROM mv_ward_health_summary;
        v_mv_total := v_mv_total + (EXTRACT(EPOCH FROM (clock_timestamp() - v_start)) * 1000);
    END LOOP;

    v_live_avg := ROUND((v_live_total / p_iterations)::NUMERIC, 3);
    v_mv_avg := ROUND((v_mv_total / p_iterations)::NUMERIC, 3);
    v_speedup := ROUND((v_live_avg / GREATEST(v_mv_avg, 0.001))::NUMERIC, 2);

    RETURN QUERY
    SELECT
        p_iterations,
        v_live_avg,
        v_mv_avg,
        v_speedup,
        (v_mv_avg < 5.0);
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION fn_benchmark_mv_vs_live_query IS
'Measures performance improvement of materialized view vs unindexed live relational aggregation.';
