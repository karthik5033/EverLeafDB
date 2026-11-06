-- ============================================================================
-- EVERLEAFDB: CLINICAL DIAGNOSIS & SUPERVISOR TRIAGE VIEWS & HELPERS
-- Phase 21: Clinical Diagnosis & Supervisor Triage Interface (/alerts)
--
-- Provides relational views and functions supporting the municipal supervisor
-- clinical triage queue, side-by-side visual comparison with top precedents,
-- and disease diagnostic confirmation workflows.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- View: vw_supervisor_triage_queue
-- Consolidated supervisor triage queue joining alerts, trees, species, wards,
-- inspections, and primary inspection images.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_supervisor_triage_queue AS
SELECT
    a.alert_id,
    a.severity,
    a.status AS alert_status,
    a.reason AS alert_reason,
    a.similarity_score,
    ROUND((a.similarity_score * 100)::NUMERIC, 1) AS similarity_percent,
    a.created_at AS alert_created_at,
    
    -- Tree & Botanical Specs
    t.tree_id,
    t.tag_number AS tree_tag,
    t.dbh_cm,
    t.height_m,
    t.health_status AS tree_health_status,
    t.condition_score,
    s.species_id,
    s.common_name AS species_common,
    s.scientific_name AS species_scientific,
    
    -- Spatial & Ward Attribution
    w.ward_id,
    w.name AS ward_name,
    w.zone AS ward_zone,
    ST_Y(t.location::geometry) AS latitude,
    ST_X(t.location::geometry) AS longitude,
    
    -- Field Inspection Context
    i.inspection_id,
    i.inspected_at,
    u.username AS inspector_name,
    u.email AS inspector_email,
    i.notes AS inspector_notes,
    
    -- Primary Suspicious Specimen Image
    img.image_id AS suspicious_image_id,
    img.image_url AS suspicious_image_url,
    img.body_part AS suspicious_body_part,
    img.created_at AS image_captured_at
FROM alerts a
JOIN trees t ON a.tree_id = t.tree_id
JOIN species s ON t.species_id = s.species_id
JOIN wards w ON t.ward_id = w.ward_id
JOIN inspections i ON a.inspection_id = i.inspection_id
JOIN users u ON i.inspector_id = u.user_id
LEFT JOIN LATERAL (
    SELECT
        ii.image_id,
        ii.image_url,
        ii.body_part,
        ii.created_at
    FROM inspection_images ii
    WHERE ii.inspection_id = i.inspection_id
    ORDER BY ii.created_at ASC
    LIMIT 1
) img ON TRUE
ORDER BY
    CASE a.severity
        WHEN 'CRITICAL' THEN 1
        WHEN 'HIGH' THEN 2
        WHEN 'WARNING' THEN 3
        WHEN 'MODERATE' THEN 4
        WHEN 'LOW' THEN 5
        ELSE 6
    END ASC,
    a.created_at DESC;

COMMENT ON VIEW vw_supervisor_triage_queue IS
'Consolidated triage queue for municipal supervisors to review and resolve automated risk alerts.';

-- ----------------------------------------------------------------------------
-- Function: fn_get_triage_precedent_comparison
-- Retrieves side-by-side comparison data between a specific alert and the
-- closest historical clinical precedent retrieved via pgvector HNSW similarity.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_get_triage_precedent_comparison(
    p_alert_id UUID
)
RETURNS TABLE (
    -- Alert details
    alert_id UUID,
    severity disease_severity,
    alert_status alert_status,
    detected_disease VARCHAR(120),
    similarity_score NUMERIC(5, 4),
    similarity_percent NUMERIC(5, 1),
    
    -- Target Specimen Details
    tree_id UUID,
    tree_tag VARCHAR(50),
    species_name VARCHAR(120),
    ward_name VARCHAR(100),
    inspector_name VARCHAR(100),
    inspector_notes TEXT,
    specimen_image_url TEXT,
    specimen_body_part VARCHAR(30),
    
    -- Top Precedent Match Details
    precedent_image_id UUID,
    precedent_image_url TEXT,
    precedent_body_part VARCHAR(30),
    precedent_tree_tag VARCHAR(50),
    precedent_disease_id INT,
    precedent_disease_name VARCHAR(120),
    precedent_pathogen_type VARCHAR(50),
    precedent_similarity_percent NUMERIC(5, 1),
    precedent_inspector_notes TEXT,
    precedent_treatment_name VARCHAR(120),
    precedent_treatment_type VARCHAR(50),
    precedent_outcome treatment_outcome,
    precedent_cost NUMERIC(10, 2),
    precedent_duration_days INT
) AS $$
BEGIN
    RETURN QUERY
    WITH target_alert AS (
        SELECT
            a.alert_id AS t_alert_id,
            a.severity AS t_severity,
            a.status AS t_status,
            a.reason AS t_reason,
            a.similarity_score AS t_score,
            t.tree_id AS t_tree_id,
            t.tag_number AS t_tree_tag,
            s.common_name AS t_species_name,
            w.name AS t_ward_name,
            u.username AS t_inspector_name,
            i.notes AS t_inspector_notes,
            img.image_url AS t_specimen_image_url,
            img.body_part AS t_specimen_body_part,
            img.embedding AS t_embedding
        FROM alerts a
        JOIN trees t ON a.tree_id = t.tree_id
        JOIN species s ON t.species_id = s.species_id
        JOIN wards w ON t.ward_id = w.ward_id
        JOIN inspections i ON a.inspection_id = i.inspection_id
        JOIN users u ON i.inspector_id = u.user_id
        LEFT JOIN LATERAL (
            SELECT ii.image_url, ii.body_part, ii.embedding
            FROM inspection_images ii
            WHERE ii.inspection_id = i.inspection_id
            ORDER BY ii.created_at ASC
            LIMIT 1
        ) img ON TRUE
        WHERE a.alert_id = p_alert_id
    ),
    top_precedent AS (
        SELECT
            ref_img.image_id AS p_img_id,
            ref_img.image_url AS p_img_url,
            ref_img.body_part AS p_body_part,
            ref_t.tag_number AS p_tree_tag,
            d.disease_id AS p_disease_id,
            d.common_name AS p_disease_name,
            d.pathogen_type AS p_pathogen_type,
            ROUND(((1 - (ref_img.embedding <=> ta.t_embedding)) * 100)::NUMERIC, 1) AS p_sim_percent,
            ref_i.notes AS p_notes,
            trt.name AS p_trt_name,
            trt.treatment_type AS p_trt_type,
            tr.outcome_status AS p_outcome,
            trt.standard_cost AS p_cost,
            trt.typical_duration_days AS p_duration
        FROM target_alert ta
        CROSS JOIN inspection_images ref_img
        JOIN inspections ref_i ON ref_img.inspection_id = ref_i.inspection_id
        JOIN trees ref_t ON ref_i.tree_id = ref_t.tree_id
        JOIN diagnoses diag ON diag.inspection_id = ref_i.inspection_id
        JOIN diseases d ON diag.disease_id = d.disease_id
        LEFT JOIN treatment_records tr ON tr.diagnosis_id = diag.diagnosis_id
        LEFT JOIN treatments trt ON tr.treatment_id = trt.treatment_id
        WHERE ref_img.embedding IS NOT NULL
          AND ta.t_embedding IS NOT NULL
        ORDER BY ref_img.embedding <=> ta.t_embedding ASC
        LIMIT 1
    )
    SELECT
        ta.t_alert_id,
        ta.t_severity,
        ta.t_status,
        ta.t_reason,
        ta.t_score,
        ROUND((ta.t_score * 100)::NUMERIC, 1),
        ta.t_tree_id,
        ta.t_tree_tag,
        ta.t_species_name,
        ta.t_ward_name,
        ta.t_inspector_name,
        ta.t_inspector_notes,
        ta.t_specimen_image_url,
        ta.t_specimen_body_part,
        tp.p_img_id,
        tp.p_img_url,
        tp.p_body_part,
        tp.p_tree_tag,
        tp.p_disease_id,
        tp.p_disease_name,
        tp.p_pathogen_type,
        tp.p_sim_percent,
        tp.p_notes,
        tp.p_trt_name,
        tp.p_trt_type,
        tp.p_outcome,
        tp.p_cost,
        tp.p_duration
    FROM target_alert ta
    LEFT JOIN top_precedent tp ON TRUE;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION fn_get_triage_precedent_comparison IS
'Compares a suspicious alert specimen against the top matching clinical precedent for supervisor evaluation.';

