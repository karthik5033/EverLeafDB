-- ============================================================================
-- EVERLEAFDB MUNICIPAL CANOPY INTELLIGENCE PLATFORM
-- Migration 07: Real-Time Pathological Risk Detection Trigger (Active DB AI)
-- Engine: PostgreSQL 16+ / PL/pgSQL / pgvector HNSW
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 01. TRIGGER FUNCTION: trg_fn_detect_severe_disease_alert()
-- Description: Executes an autonomous HNSW cosine vector search inside the
--              transaction boundary whenever an inspection photo is saved.
--              If cosine similarity >= 0.82 against a confirmed critical disease
--              precedent of the same species, it autonomously inserts a
--              CRITICAL alert and transitions the specimen to 'under_treatment'.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trg_fn_detect_severe_disease_alert()
RETURNS TRIGGER AS $$
DECLARE
    v_tree_id UUID;
    v_ward_id INT;
    v_species_id INT;
    v_matched_disease_id INT := NULL;
    v_matched_disease_name VARCHAR(120) := NULL;
    v_min_distance FLOAT8 := 1.0;
    v_similarity FLOAT8 := 0.0;
    v_alert_id UUID;
    c_SIMILARITY_THRESHOLD CONSTANT FLOAT8 := 0.82; -- Calibrated empirical threshold
    c_DISTANCE_THRESHOLD CONSTANT FLOAT8 := 0.18;   -- (1.0 - 0.82)
BEGIN
    -- Guard: Only proceed if an image embedding vector is provided
    IF NEW.image_embedding IS NULL THEN
        RETURN NEW;
    END IF;

    -- Retrieve tree, ward, and species metadata for the inspected specimen
    SELECT 
        i.tree_id,
        t.ward_id,
        t.species_id
    INTO 
        v_tree_id,
        v_ward_id,
        v_species_id
    FROM inspections i
    JOIN trees t ON t.tree_id = i.tree_id
    WHERE i.inspection_id = NEW.inspection_id;

    IF v_tree_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Tune HNSW index scan work memory for real-time sub-10ms trigger latency
    SET LOCAL hnsw.ef_search = 64;

    -- Perform HNSW cosine similarity search (<=> operator) against historical confirmed
    -- severe disease precedents of the same species
    SELECT 
        d.disease_id,
        dis.name,
        (ref_img.image_embedding <=> NEW.image_embedding) AS cosine_dist
    INTO 
        v_matched_disease_id,
        v_matched_disease_name,
        v_min_distance
    FROM inspection_images ref_img
    JOIN inspections ref_i ON ref_i.inspection_id = ref_img.inspection_id
    JOIN diagnoses d ON d.inspection_id = ref_i.inspection_id
    JOIN diseases dis ON dis.disease_id = d.disease_id
    JOIN trees ref_t ON ref_t.tree_id = ref_i.tree_id
    WHERE 
        ref_t.species_id = v_species_id
        AND dis.severity_level = 'CRITICAL'
        AND ref_img.image_id <> NEW.image_id
    ORDER BY ref_img.image_embedding <=> NEW.image_embedding ASC
    LIMIT 1;

    -- Calculate cosine similarity: similarity = 1 - cosine_distance
    IF v_min_distance IS NOT NULL THEN
        v_similarity := 1.0 - v_min_distance;
    ELSE
        v_similarity := 0.0;
    END IF;

    -- If visual similarity meets or exceeds empirical 0.82 threshold:
    IF v_similarity >= c_SIMILARITY_THRESHOLD THEN
        -- 1. Insert high-priority outbreak alert
        INSERT INTO alerts (
            tree_id,
            ward_id,
            severity,
            status,
            created_at
        ) VALUES (
            v_tree_id,
            v_ward_id,
            'CRITICAL',
            'PENDING',
            CURRENT_TIMESTAMP
        )
        RETURNING alert_id INTO v_alert_id;

        -- 2. Transition target tree health status to 'under_treatment'
        UPDATE trees
        SET health_status = 'under_treatment'
        WHERE tree_id = v_tree_id 
          AND health_status NOT IN ('dead', 'removed');

        -- 3. Emit notification for supervisor triage dispatch
        RAISE NOTICE 'EVERLEAF-TRIGGER: Critical outbreak detected on tree %! Disease: % (Similarity: %). Alert: %',
            v_tree_id, v_matched_disease_name, round(v_similarity::numeric, 4), v_alert_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 02. ATTACH TRIGGER TO INSPECTION_IMAGES
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_inspection_images_risk_detection ON inspection_images;
CREATE TRIGGER trg_inspection_images_risk_detection
AFTER INSERT ON inspection_images
FOR EACH ROW
EXECUTE FUNCTION trg_fn_detect_severe_disease_alert();

-- ----------------------------------------------------------------------------
-- 03. BENCHMARKING FUNCTION: Latency & Parameter Sweep
-- Description: Simulates trigger execution times across HNSW ef_search sweeps
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_benchmark_risk_trigger(
    p_test_vector VECTOR(512),
    p_iterations INT DEFAULT 10
)
RETURNS TABLE (
    ef_search_param INT,
    avg_latency_ms NUMERIC,
    min_latency_ms NUMERIC,
    max_latency_ms NUMERIC
) AS $$
DECLARE
    v_ef INT;
    v_start TIMESTAMP;
    v_end TIMESTAMP;
    v_diff NUMERIC;
    v_total NUMERIC;
    v_min NUMERIC;
    v_max NUMERIC;
    v_iter INT;
    v_dummy RECORD;
BEGIN
    FOR v_ef IN SELECT unnest(ARRAY[16, 32, 64, 128]) LOOP
        EXECUTE format('SET LOCAL hnsw.ef_search = %s;', v_ef);
        v_total := 0;
        v_min := 999999;
        v_max := 0;

        FOR v_iter IN 1..p_iterations LOOP
            v_start := clock_timestamp();

            SELECT 
                ref_img.image_id,
                (ref_img.image_embedding <=> p_test_vector) AS dist
            INTO v_dummy
            FROM inspection_images ref_img
            ORDER BY ref_img.image_embedding <=> p_test_vector ASC
            LIMIT 1;

            v_end := clock_timestamp();
            v_diff := (EXTRACT(EPOCH FROM (v_end - v_start)) * 1000.0);

            v_total := v_total + v_diff;
            IF v_diff < v_min THEN v_min := v_diff; END IF;
            IF v_diff > v_max THEN v_max := v_diff; END IF;
        END LOOP;

        ef_search_param := v_ef;
        avg_latency_ms := round((v_total / p_iterations)::numeric, 3);
        min_latency_ms := round(v_min::numeric, 3);
        max_latency_ms := round(v_max::numeric, 3);
        RETURN NEXT;
    END LOOP;
END;
$$ LANGUAGE plpgsql;
