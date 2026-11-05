-- ============================================================================
-- EVERLEAFDB MUNICIPAL CANOPY INTELLIGENCE PLATFORM
-- Migration 12: Hybrid Query 4 — Treatment Efficacy & Cost Ranking Analytics
-- Engine: PostgreSQL 16+ / SQL Aggregation & Window Functions
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 01. QUERY FUNCTION: fn_query4_treatment_efficacy_ranking()
-- Description: Core Benchmark Query 4:
--              Aggregates historical treatment outcomes across diseases,
--              calculating success percentages, average monetary expenditures,
--              cure windows, and cost-per-successful-cure ROI ranking.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_query4_treatment_efficacy_ranking(
    p_disease_id INT DEFAULT NULL
)
RETURNS TABLE (
    disease_id INT,
    disease_name VARCHAR(120),
    severity_level disease_severity,
    treatment_id INT,
    treatment_name VARCHAR(150),
    treatment_type treatment_type,
    total_administered INT,
    successful_cures INT,
    failed_outcomes INT,
    success_rate_percent NUMERIC,
    avg_actual_cost NUMERIC,
    avg_duration_days NUMERIC,
    cost_per_cure NUMERIC,
    roi_rank BIGINT
) AS $$
    SELECT 
        dis.disease_id,
        dis.name AS disease_name,
        dis.severity_level,
        trt.treatment_id,
        trt.name AS treatment_name,
        trt.treatment_type,
        COUNT(rec.record_id)::INT AS total_administered,
        COUNT(*) FILTER (WHERE rec.outcome_status = 'SUCCESSFUL')::INT AS successful_cures,
        COUNT(*) FILTER (WHERE rec.outcome_status = 'FAILED')::INT AS failed_outcomes,
        ROUND((
            COUNT(*) FILTER (WHERE rec.outcome_status = 'SUCCESSFUL')::numeric / 
            NULLIF(COUNT(rec.record_id), 0)::numeric
        ) * 100.0, 2) AS success_rate_percent,
        ROUND(AVG(COALESCE(rec.actual_cost, trt.standard_cost))::numeric, 2) AS avg_actual_cost,
        ROUND(AVG(COALESCE(rec.duration_days, trt.typical_duration_days))::numeric, 1) AS avg_duration_days,
        ROUND((
            SUM(COALESCE(rec.actual_cost, trt.standard_cost))::numeric / 
            NULLIF(COUNT(*) FILTER (WHERE rec.outcome_status = 'SUCCESSFUL'), 0)::numeric
        ), 2) AS cost_per_cure,
        DENSE_RANK() OVER (
            PARTITION BY dis.disease_id 
            ORDER BY 
                (COUNT(*) FILTER (WHERE rec.outcome_status = 'SUCCESSFUL')::numeric / NULLIF(COUNT(rec.record_id), 0)::numeric) DESC,
                AVG(COALESCE(rec.actual_cost, trt.standard_cost)) ASC
        ) AS roi_rank
    FROM treatment_records rec
    JOIN treatments trt ON trt.treatment_id = rec.treatment_id
    JOIN diagnoses d ON d.diagnosis_id = rec.diagnosis_id
    JOIN diseases dis ON dis.disease_id = d.disease_id
    WHERE (p_disease_id IS NULL OR dis.disease_id = p_disease_id)
    GROUP BY 
        dis.disease_id,
        dis.name,
        dis.severity_level,
        trt.treatment_id,
        trt.name,
        trt.treatment_type
    ORDER BY 
        dis.disease_id ASC,
        roi_rank ASC;
$$ LANGUAGE sql STABLE;

-- ----------------------------------------------------------------------------
-- 02. VIEW: vw_municipal_treatment_roi_summary
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_municipal_treatment_roi_summary AS
SELECT 
    trt.treatment_type,
    COUNT(rec.record_id) AS total_applications,
    ROUND(AVG(rec.actual_cost)::numeric, 2) AS avg_cost_per_tree,
    ROUND((
        COUNT(*) FILTER (WHERE rec.outcome_status = 'SUCCESSFUL')::numeric / 
        NULLIF(COUNT(*), 0)::numeric
    ) * 100.0, 1) AS overall_success_rate,
    SUM(rec.actual_cost) AS total_municipal_spend
FROM treatment_records rec
JOIN treatments trt ON trt.treatment_id = rec.treatment_id
GROUP BY trt.treatment_type
ORDER BY overall_success_rate DESC;
