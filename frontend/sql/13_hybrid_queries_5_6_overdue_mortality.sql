-- ============================================================================
-- EVERLEAFDB MUNICIPAL CANOPY INTELLIGENCE PLATFORM
-- Migration 13: Hybrid Query 5 & 6 — Overdue Inspections & Tree Mortality Analytics
-- Engine: PostgreSQL 16+ / SQL Aggregation & Window Functions
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 01. QUERY 5: fn_query5_overdue_inspections()
-- Description: Core Benchmark Query 5:
--              Retrieves trees overdue for clinical field inspection (> 180 days),
--              grouped by administrative ward and ranked by days overdue.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_query5_overdue_inspections(
    p_overdue_days INT DEFAULT 180,
    p_ward_id INT DEFAULT NULL
)
RETURNS TABLE (
    tree_id UUID,
    tag_number VARCHAR(50),
    ward_id INT,
    ward_name VARCHAR(120),
    species_id INT,
    species_common VARCHAR(150),
    health_status tree_health_status,
    planted_date DATE,
    last_inspected_at TIMESTAMP WITH TIME ZONE,
    days_overdue INT,
    overdue_severity VARCHAR(20),
    ward_rank BIGINT
) AS $$
    SELECT 
        t.tree_id,
        t.tag_number,
        w.ward_id,
        w.name AS ward_name,
        sp.species_id,
        sp.common_name AS species_common,
        t.health_status,
        t.planted_date,
        t.last_inspected_at,
        EXTRACT(DAY FROM (NOW() - COALESCE(t.last_inspected_at, t.planted_date::timestamp)))::INT AS days_overdue,
        CASE 
            WHEN EXTRACT(DAY FROM (NOW() - COALESCE(t.last_inspected_at, t.planted_date::timestamp))) >= 365 THEN 'CRITICAL_OVERDUE'
            WHEN EXTRACT(DAY FROM (NOW() - COALESCE(t.last_inspected_at, t.planted_date::timestamp))) >= 270 THEN 'HIGH_OVERDUE'
            ELSE 'MODERATE_OVERDUE'
        END AS overdue_severity,
        ROW_NUMBER() OVER (
            PARTITION BY w.ward_id 
            ORDER BY EXTRACT(DAY FROM (NOW() - COALESCE(t.last_inspected_at, t.planted_date::timestamp))) DESC
        ) AS ward_rank
    FROM trees t
    JOIN wards w ON w.ward_id = t.ward_id
    JOIN species sp ON sp.species_id = t.species_id
    WHERE 
        t.health_status NOT IN ('dead', 'removed')
        AND (p_ward_id IS NULL OR t.ward_id = p_ward_id)
        AND (
            t.last_inspected_at IS NULL 
            OR t.last_inspected_at < (NOW() - (p_overdue_days || ' days')::INTERVAL)
        )
    ORDER BY 
        days_overdue DESC;
$$ LANGUAGE sql STABLE;

-- ----------------------------------------------------------------------------
-- 02. QUERY 6: fn_query6_tree_mortality_drivers()
-- Description: Core Benchmark Query 6:
--              Computes average lifespan at removal/mortality per botanical species
--              and isolates the top fatal disease driver using SQL window functions.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_query6_tree_mortality_drivers()
RETURNS TABLE (
    species_id INT,
    species_common VARCHAR(150),
    species_scientific VARCHAR(150),
    typical_lifespan_years INT,
    observed_mortality_count BIGINT,
    avg_lifespan_at_death_years NUMERIC,
    lifespan_deficit_years NUMERIC,
    top_fatal_disease VARCHAR(120),
    fatal_cases_attributed BIGINT,
    fatal_pathogen_percentage NUMERIC
) AS $$
    WITH mortality_base AS (
        SELECT 
            t.tree_id,
            t.species_id,
            sp.common_name AS species_common,
            sp.scientific_name AS species_scientific,
            sp.typical_lifespan_years,
            EXTRACT(YEAR FROM AGE(COALESCE(t.last_inspected_at, t.created_at), t.planted_date)) AS actual_lifespan,
            dis.name AS disease_name
        FROM trees t
        JOIN species sp ON sp.species_id = t.species_id
        LEFT JOIN diagnoses d ON d.inspection_id IN (SELECT inspection_id FROM inspections WHERE tree_id = t.tree_id)
        LEFT JOIN diseases dis ON dis.disease_id = d.disease_id
        WHERE t.health_status IN ('dead', 'removed', 'critical')
    ),
    disease_counts AS (
        SELECT 
            species_id,
            species_common,
            species_scientific,
            typical_lifespan_years,
            disease_name,
            COUNT(*) AS pathogen_fatal_count,
            ROW_NUMBER() OVER (PARTITION BY species_id ORDER BY COUNT(*) DESC) AS pathogen_rank
        FROM mortality_base
        WHERE disease_name IS NOT NULL
        GROUP BY species_id, species_common, species_scientific, typical_lifespan_years, disease_name
    ),
    species_stats AS (
        SELECT 
            species_id,
            COUNT(DISTINCT tree_id) AS total_mortalities,
            ROUND(AVG(actual_lifespan)::numeric, 1) AS avg_death_age
        FROM mortality_base
        GROUP BY species_id
    )
    SELECT 
        dc.species_id,
        dc.species_common,
        dc.species_scientific,
        dc.typical_lifespan_years,
        st.total_mortalities AS observed_mortality_count,
        st.avg_death_age AS avg_lifespan_at_death_years,
        ROUND((dc.typical_lifespan_years - st.avg_death_age)::numeric, 1) AS lifespan_deficit_years,
        dc.disease_name AS top_fatal_disease,
        dc.pathogen_fatal_count AS fatal_cases_attributed,
        ROUND((dc.pathogen_fatal_count::numeric / NULLIF(st.total_mortalities, 0)::numeric) * 100.0, 1) AS fatal_pathogen_percentage
    FROM disease_counts dc
    JOIN species_stats st ON st.species_id = dc.species_id
    WHERE dc.pathogen_rank = 1
    ORDER BY st.total_mortalities DESC;
$$ LANGUAGE sql STABLE;

-- ----------------------------------------------------------------------------
-- 03. VIEW: vw_canopy_overdue_ward_summary
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_canopy_overdue_ward_summary AS
SELECT 
    w.ward_id,
    w.name AS ward_name,
    COUNT(t.tree_id) AS total_trees,
    COUNT(t.tree_id) FILTER (WHERE t.last_inspected_at IS NULL OR t.last_inspected_at < NOW() - INTERVAL '180 days') AS overdue_count,
    ROUND((
        COUNT(t.tree_id) FILTER (WHERE t.last_inspected_at IS NULL OR t.last_inspected_at < NOW() - INTERVAL '180 days')::numeric /
        NULLIF(COUNT(t.tree_id), 0)::numeric
    ) * 100.0, 1) AS overdue_rate_percent,
    MAX(EXTRACT(DAY FROM (NOW() - COALESCE(t.last_inspected_at, t.planted_date::timestamp))))::INT AS max_days_uninspected
FROM wards w
LEFT JOIN trees t ON t.ward_id = w.ward_id AND t.health_status NOT IN ('dead', 'removed')
GROUP BY w.ward_id, w.name
ORDER BY overdue_count DESC;
