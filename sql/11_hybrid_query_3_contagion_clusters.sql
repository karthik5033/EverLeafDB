-- ============================================================================
-- EVERLEAFDB MUNICIPAL CANOPY INTELLIGENCE PLATFORM
-- Migration 11: Hybrid Query 3 — Contagion Risk Cluster Detection & Hazard Zones
-- Engine: PostgreSQL 16+ / PostGIS 3.4+ / pgvector HNSW
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 01. HYBRID QUERY FUNCTION: fn_query3_contagion_clusters()
-- Description: Core Hybrid Benchmark Query 3:
--              Identifies endangered trees situated within a spatial danger
--              radius (default 500m) of an active CRITICAL outbreak epicenter,
--              whose recent foliage photos match the outbreak symptom vector
--              (similarity >= 0.82) and have not received clinical treatment
--              within the past 365 days.
-- Indexes Used:
--   - GiST Spatial Index (idx_trees_location_gist)
--   - HNSW Graph Index (idx_inspection_images_vector_hnsw)
--   - B-Tree on alerts.status & severity (idx_alerts_status_severity)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_query3_contagion_clusters(
    p_danger_radius_meters FLOAT8 DEFAULT 500.0,
    p_similarity_threshold FLOAT8 DEFAULT 0.82,
    p_untreated_days INT DEFAULT 365
)
RETURNS TABLE (
    epicenter_alert_id UUID,
    epicenter_tree_id UUID,
    epicenter_tag VARCHAR(50),
    epicenter_lat FLOAT8,
    epicenter_lng FLOAT8,
    pathogen_disease VARCHAR(120),
    endangered_tree_id UUID,
    endangered_tag VARCHAR(50),
    endangered_species VARCHAR(150),
    distance_to_epicenter_meters NUMERIC,
    similarity_percent NUMERIC,
    cosine_distance FLOAT8,
    days_since_last_inspection INT,
    quarantine_priority VARCHAR(20),
    inspector_notes TEXT
) AS $$
    WITH active_epicenters AS (
        SELECT 
            a.alert_id,
            a.tree_id AS epic_tree_id,
            t.tag_number AS epic_tag,
            ST_Y(t.location_geom::geometry) AS epic_lat,
            ST_X(t.location_geom::geometry) AS epic_lng,
            t.location_geom AS epic_geom,
            t.species_id AS epic_species_id,
            a.detected_disease,
            img.image_embedding AS epic_vector
        FROM alerts a
        JOIN trees t ON t.tree_id = a.tree_id
        LEFT JOIN inspections i ON i.tree_id = t.tree_id
        LEFT JOIN inspection_images img ON img.inspection_id = i.inspection_id
        WHERE 
            a.severity = 'CRITICAL'
            AND a.status = 'PENDING'
            AND img.image_embedding IS NOT NULL
    )
    SELECT 
        e.alert_id AS epicenter_alert_id,
        e.epic_tree_id AS epicenter_tree_id,
        e.epic_tag AS epicenter_tag,
        e.epic_lat AS epicenter_lat,
        e.epic_lng AS epicenter_lng,
        e.detected_disease AS pathogen_disease,
        target_t.tree_id AS endangered_tree_id,
        target_t.tag_number AS endangered_tag,
        sp.common_name AS endangered_species,
        ROUND(ST_Distance(target_t.location_geom, e.epic_geom)::numeric, 1) AS distance_to_epicenter_meters,
        ROUND(((1.0 - (target_img.image_embedding <=> e.epic_vector)) * 100.0)::numeric, 2) AS similarity_percent,
        (target_img.image_embedding <=> e.epic_vector) AS cosine_distance,
        COALESCE(EXTRACT(DAY FROM (NOW() - target_t.last_inspected_at))::INT, 999) AS days_since_last_inspection,
        CASE 
            WHEN (1.0 - (target_img.image_embedding <=> e.epic_vector)) >= 0.88 THEN 'EMERGENCY_ISOLATE'
            WHEN (1.0 - (target_img.image_embedding <=> e.epic_vector)) >= 0.82 THEN 'HIGH_QUARANTINE'
            ELSE 'MONITOR_BUFFER'
        END AS quarantine_priority,
        COALESCE(target_i.field_notes, 'Asymptomatic or early incubation phase under contagion radius.') AS inspector_notes
    FROM active_epicenters e
    JOIN trees target_t ON target_t.tree_id <> e.epic_tree_id
    JOIN species sp ON sp.species_id = target_t.species_id
    JOIN inspections target_i ON target_i.tree_id = target_t.tree_id
    JOIN inspection_images target_img ON target_img.inspection_id = target_i.inspection_id
    WHERE 
        ST_DWithin(target_t.location_geom, e.epic_geom, p_danger_radius_meters)
        AND (1.0 - (target_img.image_embedding <=> e.epic_vector)) >= (p_similarity_threshold - 0.15)
        AND (
            target_t.last_inspected_at IS NULL 
            OR target_t.last_inspected_at < (NOW() - (p_untreated_days || ' days')::INTERVAL)
            OR target_t.health_status IN ('diseased', 'critical', 'under_treatment')
        )
    ORDER BY 
        distance_to_epicenter_meters ASC,
        (target_img.image_embedding <=> e.epic_vector) ASC;
$$ LANGUAGE sql STABLE;

-- ----------------------------------------------------------------------------
-- 02. GEOSPATIAL HAZARD CONTAGION ZONES VIEW (GeoJSON Polygonal Buffers)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_contagion_hazard_heat_zones AS
SELECT 
    a.alert_id,
    a.detected_disease,
    a.severity,
    t.tag_number AS epicenter_tag,
    ST_AsGeoJSON(ST_Buffer(t.location_geom, 500.0)::geometry) AS hazard_polygon_geojson,
    500.0 AS buffer_radius_meters,
    a.created_at
FROM alerts a
JOIN trees t ON t.tree_id = a.tree_id
WHERE a.severity = 'CRITICAL' AND a.status = 'PENDING';
