-- ============================================================================
-- EVERLEAFDB MUNICIPAL CANOPY INTELLIGENCE PLATFORM
-- Migration 10: Hybrid Query 2 — Ward-Level Disease Case Search & Curated Treatments
-- Engine: PostgreSQL 16+ / PostGIS 3.4+ / pgvector HNSW
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 01. HYBRID QUERY FUNCTION: fn_query2_ward_disease_search()
-- Description: Core Hybrid Benchmark Query 2:
--              Searches similar disease cases within an administrative ward
--              filtered strictly to SUCCESSFUL treatment outcomes.
-- Indexes Used:
--   - B-Tree on trees.ward_id
--   - B-Tree on trees.species_id
--   - B-Tree on treatment_records.outcome_status
--   - HNSW Graph on inspection_images.image_embedding
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_query2_ward_disease_search(
    p_ward_id INT,
    p_species_id INT,
    p_query_vector VECTOR(512),
    p_limit INT DEFAULT 5
)
RETURNS TABLE (
    tree_id UUID,
    tag_number VARCHAR(50),
    ward_id INT,
    ward_name VARCHAR(120),
    species_id INT,
    species_common VARCHAR(150),
    disease_id INT,
    disease_name VARCHAR(120),
    severity_level disease_severity,
    similarity_percent NUMERIC,
    cosine_distance FLOAT8,
    treatment_id INT,
    treatment_name VARCHAR(150),
    treatment_type treatment_type,
    outcome_status outcome_status,
    cure_duration_days INT,
    actual_cost NUMERIC,
    inspector_notes TEXT
) AS $$
    SELECT 
        t.tree_id,
        t.tag_number,
        w.ward_id,
        w.name AS ward_name,
        sp.species_id,
        sp.common_name AS species_common,
        dis.disease_id,
        dis.name AS disease_name,
        dis.severity_level,
        ROUND(((1.0 - (img.image_embedding <=> p_query_vector)) * 100.0)::numeric, 2) AS similarity_percent,
        (img.image_embedding <=> p_query_vector) AS cosine_distance,
        trt.treatment_id,
        trt.name AS treatment_name,
        trt.treatment_type,
        rec.outcome_status,
        COALESCE(rec.duration_days, trt.typical_duration_days) AS cure_duration_days,
        COALESCE(rec.actual_cost, trt.standard_cost) AS actual_cost,
        COALESCE(d.notes, i.field_notes, 'Successful therapeutic resolution.') AS inspector_notes
    FROM trees t
    JOIN wards w ON w.ward_id = t.ward_id
    JOIN species sp ON sp.species_id = t.species_id
    JOIN inspections i ON i.tree_id = t.tree_id
    JOIN inspection_images img ON img.inspection_id = i.inspection_id
    JOIN diagnoses d ON d.inspection_id = i.inspection_id
    JOIN diseases dis ON dis.disease_id = d.disease_id
    JOIN treatment_records rec ON rec.diagnosis_id = d.diagnosis_id
    JOIN treatments trt ON trt.treatment_id = rec.treatment_id
    WHERE 
        t.ward_id = p_ward_id
        AND t.species_id = p_species_id
        AND rec.outcome_status = 'SUCCESSFUL'::outcome_status
        AND img.image_embedding IS NOT NULL
    ORDER BY 
        img.image_embedding <=> p_query_vector ASC
    LIMIT p_limit;
$$ LANGUAGE sql STABLE;

-- ----------------------------------------------------------------------------
-- 02. WARD TREATMENT EFFICACY SUMMARY VIEW
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_ward_treatment_efficacy AS
SELECT 
    w.ward_id,
    w.name AS ward_name,
    dis.disease_id,
    dis.name AS disease_name,
    trt.name AS effective_treatment,
    COUNT(rec.record_id) AS successful_cases_count,
    ROUND(AVG(rec.actual_cost)::numeric, 2) AS avg_cost,
    ROUND(AVG(rec.duration_days)::numeric, 1) AS avg_cure_days
FROM treatment_records rec
JOIN treatments trt ON trt.treatment_id = rec.treatment_id
JOIN diagnoses d ON d.diagnosis_id = rec.diagnosis_id
JOIN diseases dis ON dis.disease_id = d.disease_id
JOIN inspections i ON i.inspection_id = d.inspection_id
JOIN trees t ON t.tree_id = i.tree_id
JOIN wards w ON w.ward_id = t.ward_id
WHERE rec.outcome_status = 'SUCCESSFUL'
GROUP BY 
    w.ward_id,
    w.name,
    dis.disease_id,
    dis.name,
    trt.name;
