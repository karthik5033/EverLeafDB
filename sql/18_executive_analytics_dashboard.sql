-- ============================================================================
-- EVERLEAFDB: EXECUTIVE ANALYTICS & WARD HEALTH DASHBOARD
-- Phase 25: Executive Analytics & Ward Health Dashboard (/analytics)
--
-- Provides relational views and functions supporting the executive overview:
-- 1. vw_executive_city_kpis: High-level municipal canopy roll-up KPIs
-- 2. vw_health_status_distribution: Donut chart data for health categories
-- 3. vw_species_biodiversity_distribution: Bar chart data for botanical breakdown
-- 4. fn_generate_executive_csv_export: Structured CSV export generator
-- ============================================================================

-- ----------------------------------------------------------------------------
-- View: vw_executive_city_kpis
-- Roll-up view providing municipal leaders with city-wide urban forest metrics
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_executive_city_kpis AS
SELECT
    COUNT(t.tree_id)::INT AS total_managed_trees,
    COUNT(DISTINCT t.ward_id)::INT AS total_covered_wards,
    COALESCE(
        ROUND(
            (COUNT(CASE WHEN t.health_status IN ('HEALTHY', 'EXCELLENT') THEN 1 END)::NUMERIC / 
             NULLIF(COUNT(t.tree_id), 0)) * 100,
            1
        ),
        0.0
    ) AS forest_health_index_pct,
    COALESCE(
        (SELECT COUNT(*)::INT FROM alerts WHERE status = 'PENDING'),
        0
    ) AS active_contagion_alerts,
    COALESCE(
        COUNT(CASE WHEN t.last_inspected_at IS NULL OR t.last_inspected_at < (CURRENT_DATE - INTERVAL '180 days') THEN 1 END)::INT,
        0
    ) AS overdue_inspections_count,
    COALESCE(ROUND(SUM(t.dbh_cm)::NUMERIC, 1), 0.0) AS total_canopy_biomass_dbh_cm,
    COALESCE(ROUND(AVG(t.condition_score)::NUMERIC, 2), 0.00) AS city_avg_condition_score,
    COALESCE(
        (SELECT COUNT(*)::INT FROM work_orders WHERE status IN ('PENDING', 'IN_PROGRESS', 'DISPATCHED')),
        0
    ) AS active_work_orders_count,
    COALESCE(
        (SELECT SUM(cost_estimate_usd)::NUMERIC FROM work_orders WHERE status = 'COMPLETED'),
        0.00
    ) AS total_remediation_invested_usd,
    CURRENT_TIMESTAMP AS computed_at
FROM trees t;

COMMENT ON VIEW vw_executive_city_kpis IS
'High-level municipal overview KPIs for executive tree managers and city administrators.';

-- ----------------------------------------------------------------------------
-- View: vw_health_status_distribution
-- Powers the Executive Donut Chart with health status categories and percentages
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_health_status_distribution AS
WITH status_counts AS (
    SELECT
        t.health_status,
        COUNT(*)::INT AS tree_count,
        ROUND((COUNT(*)::NUMERIC / (SELECT COUNT(*) FROM trees)) * 100, 1) AS percentage_share
    FROM trees t
    GROUP BY t.health_status
)
SELECT
    health_status,
    tree_count,
    percentage_share,
    CASE health_status
        WHEN 'HEALTHY' THEN '#10b981'   -- Emerald
        WHEN 'EXCELLENT' THEN '#059669' -- Dark Emerald
        WHEN 'WARNING' THEN '#f59e0b'   -- Amber
        WHEN 'CRITICAL' THEN '#ef4444'  -- Red
        WHEN 'POOR' THEN '#f97316'      -- Orange
        WHEN 'DEAD' THEN '#64748b'      -- Slate
        ELSE '#94a3b8'
    END AS status_color_hex
FROM status_counts
ORDER BY
    CASE health_status
        WHEN 'HEALTHY' THEN 1
        WHEN 'EXCELLENT' THEN 2
        WHEN 'WARNING' THEN 3
        WHEN 'CRITICAL' THEN 4
        WHEN 'POOR' THEN 5
        WHEN 'DEAD' THEN 6
        ELSE 7
    END ASC;

COMMENT ON VIEW vw_health_status_distribution IS
'Health status categorical breakdown and percentages for executive donut visualization.';

-- ----------------------------------------------------------------------------
-- View: vw_species_biodiversity_distribution
-- Powers the Executive Bar Chart with botanical biodiversity shares
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_species_biodiversity_distribution AS
SELECT
    s.species_id,
    s.common_name,
    s.scientific_name,
    COUNT(t.tree_id)::INT AS population_count,
    ROUND(
        (COUNT(t.tree_id)::NUMERIC / NULLIF((SELECT COUNT(*) FROM trees), 0)) * 100,
        1
    ) AS biodiversity_percentage,
    COALESCE(ROUND(AVG(t.dbh_cm)::NUMERIC, 1), 0.0) AS avg_dbh_cm,
    COALESCE(ROUND(AVG(t.height_m)::NUMERIC, 1), 0.0) AS avg_height_m,
    COUNT(CASE WHEN t.health_status IN ('CRITICAL', 'POOR') THEN 1 END)::INT AS diseased_count
FROM species s
LEFT JOIN trees t ON s.species_id = t.species_id
GROUP BY s.species_id, s.common_name, s.scientific_name
ORDER BY population_count DESC;

COMMENT ON VIEW vw_species_biodiversity_distribution IS
'Species population counts and biodiversity percentages for executive bar charts.';

-- ----------------------------------------------------------------------------
-- Function: fn_generate_executive_csv_export
-- Generates a comprehensive tabular dataset for municipal report generation
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_generate_executive_csv_export()
RETURNS TABLE (
    ward_id VARCHAR(50),
    ward_name VARCHAR(100),
    zone VARCHAR(50),
    total_trees INT,
    healthy_trees INT,
    critical_trees INT,
    dead_trees INT,
    health_index_pct NUMERIC(5, 1),
    avg_condition_score NUMERIC(4, 2),
    active_alerts INT,
    outbreak_status VARCHAR(20),
    overdue_inspections INT,
    open_work_orders INT,
    total_dbh_biomass_cm NUMERIC(10, 1),
    report_generated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        mv.ward_id::VARCHAR(50),
        mv.ward_name::VARCHAR(100),
        mv.ward_zone::VARCHAR(50),
        mv.total_trees,
        mv.healthy_trees,
        mv.critical_trees,
        mv.dead_trees,
        mv.health_index_pct,
        mv.avg_condition_score,
        mv.active_alerts_count,
        CASE WHEN mv.active_outbreak_flag THEN 'ACTIVE_OUTBREAK' ELSE 'STABLE' END::VARCHAR(20),
        mv.overdue_inspections_count,
        mv.open_work_orders_count,
        mv.total_dbh_biomass_cm,
        CURRENT_TIMESTAMP
    FROM mv_ward_health_summary mv
    ORDER BY mv.health_index_pct ASC;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION fn_generate_executive_csv_export IS
'Generates formatted municipal summary rows for automated PDF/CSV report exports.';

