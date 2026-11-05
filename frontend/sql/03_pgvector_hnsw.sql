-- ============================================================================
-- EverLeafDB: pgvector Setup & High-Dimensional Indexing
-- Engine: pgvector (PostgreSQL 16) | Dimension: 512-dim (CLIP ViT-B/32)
-- Phase 5: Vector Columns, Cosine Operators & HNSW Graph Indexing
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 00. EXTENSION INITIALIZATION
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "vector";

-- ----------------------------------------------------------------------------
-- 01. 512-DIMENSIONAL VECTOR INTEGRITY & CONSTRAINTS
-- ----------------------------------------------------------------------------

-- Strict dimension verification on visual symptom embeddings (CLIP ViT-B/32)
ALTER TABLE inspection_images 
  DROP CONSTRAINT IF EXISTS chk_img_vector_dim,
  ADD CONSTRAINT chk_img_vector_dim 
  CHECK (array_length(image_embedding::real[], 1) = 512);

-- Strict dimension verification on optional clinical text notes embeddings
ALTER TABLE inspections 
  DROP CONSTRAINT IF EXISTS chk_notes_vector_dim,
  ADD CONSTRAINT chk_notes_vector_dim 
  CHECK (notes_embedding IS NULL OR array_length(notes_embedding::real[], 1) = 512);

-- ----------------------------------------------------------------------------
-- 02. HNSW (HIERARCHICAL NAVIGABLE SMALL WORLD) GRAPH INDEXES
-- Distance Operator: vector_cosine_ops (<=> Cosine Distance)
-- Configuration: m = 16 (bidirectional links per node), ef_construction = 64 (search depth during index build)
-- ----------------------------------------------------------------------------

-- Drop legacy or suboptimal indexes if existing
DROP INDEX IF EXISTS idx_inspection_images_vector_hnsw;
DROP INDEX IF EXISTS idx_inspections_notes_vector_hnsw;

-- Visual symptom photos HNSW index
CREATE INDEX idx_inspection_images_vector_hnsw 
ON inspection_images 
USING hnsw (image_embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Clinical notes text embedding HNSW index
CREATE INDEX idx_inspections_notes_vector_hnsw 
ON inspections 
USING hnsw (notes_embedding vector_cosine_ops)
WHERE notes_embedding IS NOT NULL
WITH (m = 16, ef_construction = 64);

-- ----------------------------------------------------------------------------
-- 04. STORED SIMILARITY & HYBRID QUERY PROCEDURES
-- ----------------------------------------------------------------------------

-- Procedure 1: Clinical Precedent Search by Visual Symptom Vector
CREATE OR REPLACE FUNCTION fn_match_disease_precedents(
    p_query_embedding vector(512),
    p_match_threshold NUMERIC DEFAULT 0.75,
    p_top_k INT DEFAULT 5,
    p_species_id INT DEFAULT NULL
)
RETURNS TABLE (
    rank INT,
    disease_id INT,
    disease_name VARCHAR(120),
    category VARCHAR(50),
    severity_level disease_severity,
    similarity_score NUMERIC,
    cosine_distance NUMERIC,
    precedent_tree_id UUID,
    precedent_image_id UUID,
    confirmed_outcome treatment_outcome,
    prescribed_treatment VARCHAR(120)
) AS $$
BEGIN
    RETURN QUERY
    WITH ranked_candidates AS (
        SELECT 
            d.disease_id,
            d.name AS disease_name,
            d.category,
            d.severity_level,
            ROUND((1 - (img.image_embedding <=> p_query_embedding))::numeric, 4) AS similarity_score,
            ROUND((img.image_embedding <=> p_query_embedding)::numeric, 4) AS cosine_distance,
            t.tree_id AS precedent_tree_id,
            img.image_id AS precedent_image_id,
            tr.outcome_status AS confirmed_outcome,
            treat.name AS prescribed_treatment,
            ROW_NUMBER() OVER (
                PARTITION BY d.disease_id 
                ORDER BY img.image_embedding <=> p_query_embedding ASC
            ) AS rn
        FROM inspection_images img
        JOIN inspections insp ON img.inspection_id = insp.inspection_id
        JOIN trees t ON insp.tree_id = t.tree_id
        LEFT JOIN diagnoses diag ON insp.inspection_id = diag.inspection_id
        LEFT JOIN diseases d ON diag.disease_id = d.disease_id
        LEFT JOIN treatment_records tr ON diag.diagnosis_id = tr.diagnosis_id
        LEFT JOIN treatments treat ON tr.treatment_id = treat.treatment_id
        WHERE (p_species_id IS NULL OR t.species_id = p_species_id)
          AND (1 - (img.image_embedding <=> p_query_embedding)) >= p_match_threshold
          AND d.disease_id IS NOT NULL
    )
    SELECT 
        ROW_NUMBER() OVER (ORDER BY rc.cosine_distance ASC)::int AS rank,
        rc.disease_id,
        rc.disease_name,
        rc.category,
        rc.severity_level,
        rc.similarity_score,
        rc.cosine_distance,
        rc.precedent_tree_id,
        rc.precedent_image_id,
        rc.confirmed_outcome,
        rc.prescribed_treatment
    FROM ranked_candidates rc
    WHERE rc.rn = 1
    ORDER BY rc.cosine_distance ASC
    LIMIT p_top_k;
END;
$$ LANGUAGE plpgsql STABLE;

-- Procedure 2: Hybrid Spatial GiST Candidate Pruning + pgvector HNSW Re-ranking
CREATE OR REPLACE FUNCTION fn_hybrid_spatial_vector_query(
    p_query_embedding vector(512),
    p_center_lng DOUBLE PRECISION,
    p_center_lat DOUBLE PRECISION,
    p_radius_meters DOUBLE PRECISION,
    p_min_similarity NUMERIC DEFAULT 0.70,
    p_top_k INT DEFAULT 5
)
RETURNS TABLE (
    tree_id UUID,
    species_id INT,
    distance_meters NUMERIC,
    similarity_score NUMERIC,
    cosine_distance NUMERIC,
    body_part organ_body_part,
    health_status tree_health_status,
    image_id UUID
) AS $$
DECLARE
    v_center GEOMETRY;
BEGIN
    v_center := ST_SetSRID(ST_Point(p_center_lng, p_center_lat), 4326);

    RETURN QUERY
    SELECT 
        t.tree_id,
        t.species_id,
        ROUND(ST_Distance(t.location_geom::geography, v_center::geography)::numeric, 2) AS distance_meters,
        ROUND((1 - (img.image_embedding <=> p_query_embedding))::numeric, 4) AS similarity_score,
        ROUND((img.image_embedding <=> p_query_embedding)::numeric, 4) AS cosine_distance,
        img.body_part,
        t.health_status,
        img.image_id
    FROM trees t
    JOIN inspections insp ON t.tree_id = insp.tree_id
    JOIN inspection_images img ON insp.inspection_id = img.inspection_id
    WHERE ST_DWithin(t.location_geom::geography, v_center::geography, p_radius_meters)
      AND (1 - (img.image_embedding <=> p_query_embedding)) >= p_min_similarity
    ORDER BY img.image_embedding <=> p_query_embedding ASC
    LIMIT p_top_k;
END;
$$ LANGUAGE plpgsql STABLE;

