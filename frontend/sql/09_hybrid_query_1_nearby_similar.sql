-- ============================================================================
-- EVERLEAFDB MUNICIPAL CANOPY INTELLIGENCE PLATFORM
-- Migration 09: Hybrid Query 1 — Spatial Proximity + High-Dimensional Vector Similarity
-- Engine: PostgreSQL 16+ / PostGIS 3.4+ / pgvector HNSW
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 01. HYBRID QUERY FUNCTION: fn_query1_nearby_visually_similar()
-- Description: Core Hybrid Benchmark Query 1:
--              Finds trees of the same botanical species within a dynamic spatial
--              buffer (ST_DWithin in meters, default 500m) whose visual symptoms
--              exhibit high cosine vector similarity to the query embedding.
-- Indexes Used:
--   - GiST R-Tree on trees.location_geom (idx_trees_location_gist)
--   - HNSW Graph on inspection_images.image_embedding (idx_inspection_images_vector_hnsw)
--   - B-Tree on trees.species_id
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_query1_nearby_visually_similar(
    p_target_lat FLOAT8,
    p_target_lng FLOAT8,
    p_target_species_id INT,
    p_query_vector VECTOR(512),
    p_radius_meters FLOAT8 DEFAULT 500.0,
    p_limit INT DEFAULT 5
)
RETURNS TABLE (
    tree_id UUID,
    tag_number VARCHAR(50),
    species_id INT,
    species_common VARCHAR(150),
    species_scientific VARCHAR(150),
    health_status tree_health_status,
    latitude FLOAT8,
    longitude FLOAT8,
    distance_meters NUMERIC,
    image_id UUID,
    photo_url VARCHAR(500),
    disease_name VARCHAR(120),
    similarity_percent NUMERIC,
    cosine_distance FLOAT8,
    inspector_notes TEXT
) AS $$
    SELECT 
        t.tree_id,
        t.tag_number,
        t.species_id,
        sp.common_name AS species_common,
        sp.scientific_name AS species_scientific,
        t.health_status,
        ST_Y(t.location_geom::geometry) AS latitude,
        ST_X(t.location_geom::geometry) AS longitude,
        ROUND(ST_Distance(
            t.location_geom, 
            ST_SetSRID(ST_MakePoint(p_target_lng, p_target_lat), 4326)::geography
        )::numeric, 1) AS distance_meters,
        img.image_id,
        img.file_path AS photo_url,
        COALESCE(dis.name, 'Under Clinical Evaluation') AS disease_name,
        ROUND(((1.0 - (img.image_embedding <=> p_query_vector)) * 100.0)::numeric, 2) AS similarity_percent,
        (img.image_embedding <=> p_query_vector) AS cosine_distance,
        COALESCE(d.notes, i.field_notes, 'Routine field inspection') AS inspector_notes
    FROM trees t
    JOIN species sp ON sp.species_id = t.species_id
    JOIN inspections i ON i.tree_id = t.tree_id
    JOIN inspection_images img ON img.inspection_id = i.inspection_id
    LEFT JOIN diagnoses d ON d.inspection_id = i.inspection_id
    LEFT JOIN diseases dis ON dis.disease_id = d.disease_id
    WHERE 
        t.species_id = p_target_species_id
        AND ST_DWithin(
            t.location_geom, 
            ST_SetSRID(ST_MakePoint(p_target_lng, p_target_lat), 4326)::geography, 
            p_radius_meters
        )
        AND img.image_embedding IS NOT NULL
    ORDER BY 
        img.image_embedding <=> p_query_vector ASC
    LIMIT p_limit;
$$ LANGUAGE sql STABLE;

-- ----------------------------------------------------------------------------
-- 02. EXPLAIN ANALYZE BENCHMARK TEMPLATE FOR QUERY 1
-- ----------------------------------------------------------------------------
-- EXPLAIN (ANALYZE, BUFFERS, COSTS)
-- SELECT * FROM fn_query1_nearby_visually_similar(
--     12.9716, 77.5946, 1, '[...512-d float array...]'::vector, 500.0, 5
-- );
