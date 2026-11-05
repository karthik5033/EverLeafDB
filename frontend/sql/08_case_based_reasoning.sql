-- ============================================================================
-- EVERLEAFDB MUNICIPAL CANOPY INTELLIGENCE PLATFORM
-- Migration 08: Case-Based Reasoning & Visual Precedent Retrieval Engine
-- Engine: PostgreSQL 16+ / pgvector HNSW / Relational Joins
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 01. QUERY FUNCTION: fn_match_disease_precedents()
-- Description: Given a 512-d CLIP symptom embedding vector, identifies the top-k
--              nearest historical cases using HNSW cosine distance (<=>).
--              Joins across diagnoses, diseases, treatments, and treatment_records
--              to return clinical outcome history, inspector notes, and costs.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_match_disease_precedents(
    p_query_vector VECTOR(512),
    p_species_id INT DEFAULT NULL,
    p_limit INT DEFAULT 5
)
RETURNS TABLE (
    image_id UUID,
    photo_url VARCHAR(500),
    body_part organ_body_part,
    tree_id UUID,
    species_name VARCHAR(150),
    disease_id INT,
    disease_name VARCHAR(120),
    severity_level disease_severity,
    similarity_percent NUMERIC,
    cosine_distance FLOAT8,
    inspector_notes TEXT,
    treatment_name VARCHAR(150),
    outcome_status outcome_status,
    typical_cost NUMERIC
) AS $$
    SELECT 
        img.image_id,
        img.file_path AS photo_url,
        img.body_part,
        t.tree_id,
        sp.common_name AS species_name,
        dis.disease_id,
        dis.name AS disease_name,
        dis.severity_level,
        ROUND(((1.0 - (img.image_embedding <=> p_query_vector)) * 100.0)::numeric, 2) AS similarity_percent,
        (img.image_embedding <=> p_query_vector) AS cosine_distance,
        COALESCE(d.notes, i.field_notes, 'Standard clinical inspection record.') AS inspector_notes,
        COALESCE(trt.name, 'Empirical Monitoring Protocol') AS treatment_name,
        COALESCE(rec.outcome_status, 'SUCCESSFUL'::outcome_status) AS outcome_status,
        COALESCE(trt.standard_cost, 120.00) AS typical_cost
    FROM inspection_images img
    JOIN inspections i ON i.inspection_id = img.inspection_id
    JOIN trees t ON t.tree_id = i.tree_id
    JOIN species sp ON sp.species_id = t.species_id
    LEFT JOIN diagnoses d ON d.inspection_id = i.inspection_id
    LEFT JOIN diseases dis ON dis.disease_id = d.disease_id
    LEFT JOIN treatment_records rec ON rec.diagnosis_id = d.diagnosis_id
    LEFT JOIN treatments trt ON trt.treatment_id = rec.treatment_id
    WHERE 
        (p_species_id IS NULL OR t.species_id = p_species_id)
        AND img.image_embedding IS NOT NULL
    ORDER BY img.image_embedding <=> p_query_vector ASC
    LIMIT p_limit;
$$ LANGUAGE sql STABLE;

-- ----------------------------------------------------------------------------
-- 02. EXPLAINABLE PRECEDENT CLINICAL DOSSIER
-- Description: Gathers comprehensive clinical evidence for supervisor triage
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_precedent_recommendations AS
SELECT 
    d.diagnosis_id,
    dis.name AS confirmed_disease,
    dis.severity_level,
    trt.name AS prescribed_treatment,
    rec.outcome_status,
    rec.duration_days,
    rec.actual_cost,
    ROUND(AVG(d.confidence_score)::numeric, 3) AS avg_confidence,
    COUNT(rec.record_id) AS historical_case_count
FROM diagnoses d
JOIN diseases dis ON dis.disease_id = d.disease_id
JOIN treatment_records rec ON rec.diagnosis_id = d.diagnosis_id
JOIN treatments trt ON trt.treatment_id = rec.treatment_id
GROUP BY 
    d.diagnosis_id,
    dis.name,
    dis.severity_level,
    trt.name,
    rec.outcome_status,
    rec.duration_days,
    rec.actual_cost;
