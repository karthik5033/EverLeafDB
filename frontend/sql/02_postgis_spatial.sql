-- ============================================================================
-- EverLeafDB: PostGIS Spatial Infrastructure & CRS Configuration
-- CRS: WGS 84 (EPSG:4326) | Units: Degrees / Geodesic Meters via Geography Cast
-- Phase 4: Spatial Infrastructure, GiST Indexing & Spatial Constraints
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 01. CRS & GEOMETRY INTEGRITY VERIFICATION
-- ----------------------------------------------------------------------------

-- Enforce SRID 4326 and valid geometry integrity on registered trees
ALTER TABLE trees 
  DROP CONSTRAINT IF EXISTS chk_tree_srid_4326,
  ADD CONSTRAINT chk_tree_srid_4326 CHECK (ST_SRID(location_geom) = 4326);

ALTER TABLE trees 
  DROP CONSTRAINT IF EXISTS chk_tree_geom_type,
  ADD CONSTRAINT chk_tree_geom_type CHECK (GeometryType(location_geom) = 'POINT');

-- Enforce SRID 4326 and valid polygons on municipal wards
ALTER TABLE wards 
  DROP CONSTRAINT IF EXISTS chk_ward_srid_4326,
  ADD CONSTRAINT chk_ward_srid_4326 CHECK (ST_SRID(boundary_geom) = 4326);

ALTER TABLE wards 
  DROP CONSTRAINT IF EXISTS chk_ward_geom_valid,
  ADD CONSTRAINT chk_ward_geom_valid CHECK (ST_IsValid(boundary_geom));

ALTER TABLE wards 
  DROP CONSTRAINT IF EXISTS chk_ward_geom_type,
  ADD CONSTRAINT chk_ward_geom_type CHECK (GeometryType(boundary_geom) IN ('POLYGON', 'MULTIPOLYGON'));

-- ----------------------------------------------------------------------------
-- 02. SPATIAL GIST (GENERALIZED SEARCH TREE) INDEXES
-- ----------------------------------------------------------------------------

-- Drop and recreate 2D GiST R-Tree bounding box spatial indexes
CREATE INDEX IF NOT EXISTS idx_trees_location_gist 
ON trees USING GIST (location_geom);

CREATE INDEX IF NOT EXISTS idx_wards_boundary_gist 
ON wards USING GIST (boundary_geom);

-- Geodetic Cast Index for lightning-fast ST_DWithin radial searches
CREATE INDEX IF NOT EXISTS idx_trees_location_geog_gist 
ON trees USING GIST ((location_geom::geography));

-- ----------------------------------------------------------------------------
-- 03. SPATIAL INTEGRITY TRIGGER: chk_tree_within_ward
-- Enforces that tree coordinates fall strictly inside its assigned ward polygon
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION fn_trg_verify_tree_within_ward()
RETURNS TRIGGER AS $$
DECLARE
    v_ward_boundary GEOMETRY;
    v_is_contained BOOLEAN;
    v_ward_name VARCHAR(100);
BEGIN
    -- Retrieve the boundary polygon for the assigned ward
    SELECT boundary_geom, name 
    INTO v_ward_boundary, v_ward_name
    FROM wards 
    WHERE ward_id = NEW.ward_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Foreign key violation: Ward ID % does not exist in administrative registry.', NEW.ward_id;
    END IF;

    -- Evaluate spatial containment via PostGIS ST_Contains()
    v_is_contained := ST_Contains(v_ward_boundary, NEW.location_geom);

    IF NOT v_is_contained THEN
        RAISE EXCEPTION 'Spatial Constraint Violation [chk_tree_within_ward]: Tree coordinates % fall outside the polygon boundary of assigned % (Ward ID %).',
            ST_AsText(NEW.location_geom),
            v_ward_name,
            NEW.ward_id
        USING ERRCODE = 'check_violation';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_verify_tree_within_ward ON trees;

CREATE TRIGGER trg_verify_tree_within_ward
BEFORE INSERT OR UPDATE OF location_geom, ward_id ON trees
FOR EACH ROW
EXECUTE FUNCTION fn_trg_verify_tree_within_ward();

-- ----------------------------------------------------------------------------
-- 04. STORED SPATIAL UTILITIES & PROCEDURES
-- ----------------------------------------------------------------------------

-- Utility 1: Calculate Exact Ward Area in Square Kilometers from Geodetic Polygon
CREATE OR REPLACE FUNCTION fn_calculate_ward_area_sq_km(p_boundary GEOMETRY)
RETURNS NUMERIC AS $$
BEGIN
    RETURN ROUND((ST_Area(p_boundary::geography) / 1000000.0)::numeric, 3);
END;
$$ LANGUAGE plpgsql IMMUTABLE STRICT;

-- Utility 2: Auto-detect Municipal Ward from Coordinate Point
CREATE OR REPLACE FUNCTION fn_detect_ward_for_coordinate(p_longitude DOUBLE PRECISION, p_latitude DOUBLE PRECISION)
RETURNS TABLE (
    ward_id INT,
    ward_number VARCHAR(20),
    ward_name VARCHAR(100),
    distance_to_boundary_m NUMERIC
) AS $$
DECLARE
    v_point GEOMETRY;
BEGIN
    v_point := ST_SetSRID(ST_Point(p_longitude, p_latitude), 4326);

    RETURN QUERY
    SELECT 
        w.ward_id,
        w.ward_number,
        w.name AS ward_name,
        ROUND(ST_Distance(w.boundary_geom::geography, v_point::geography)::numeric, 2) AS distance_to_boundary_m
    FROM wards w
    WHERE ST_Contains(w.boundary_geom, v_point)
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN QUERY
        SELECT 
            w.ward_id,
            w.ward_number,
            w.name AS ward_name,
            ROUND(ST_Distance(w.boundary_geom::geography, v_point::geography)::numeric, 2) AS distance_to_boundary_m
        FROM wards w
        ORDER BY w.boundary_geom <-> v_point ASC
        LIMIT 1;
    END IF;
END;
$$ LANGUAGE plpgsql STABLE;

-- Utility 3: Radial Proximity Search (ST_DWithin with exact distance in meters)
CREATE OR REPLACE FUNCTION fn_find_trees_within_radius(
    p_center_lng DOUBLE PRECISION,
    p_center_lat DOUBLE PRECISION,
    p_radius_meters DOUBLE PRECISION
)
RETURNS TABLE (
    tree_id UUID,
    species_id INT,
    health_status tree_health_status,
    distance_meters NUMERIC,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION
) AS $$
DECLARE
    v_center GEOMETRY;
BEGIN
    v_center := ST_SetSRID(ST_Point(p_center_lng, p_center_lat), 4326);

    RETURN QUERY
    SELECT 
        t.tree_id,
        t.species_id,
        t.health_status,
        ROUND(ST_Distance(t.location_geom::geography, v_center::geography)::numeric, 2) AS distance_meters,
        ST_Y(t.location_geom) AS latitude,
        ST_X(t.location_geom) AS longitude
    FROM trees t
    WHERE ST_DWithin(t.location_geom::geography, v_center::geography, p_radius_meters)
    ORDER BY distance_meters ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Utility 4: Spatial Density & Canopy Health Summary per Ward
CREATE OR REPLACE FUNCTION fn_get_ward_spatial_summary(p_ward_id INT)
RETURNS TABLE (
    ward_id INT,
    ward_name VARCHAR(100),
    area_sq_km NUMERIC,
    total_trees BIGINT,
    tree_density_per_sq_km NUMERIC,
    healthy_pct NUMERIC,
    critical_alerts BIGINT,
    centroid_geojson JSON
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        w.ward_id,
        w.name AS ward_name,
        COALESCE(w.area_sq_km, fn_calculate_ward_area_sq_km(w.boundary_geom)) AS area_sq_km,
        COUNT(t.tree_id) AS total_trees,
        ROUND(COUNT(t.tree_id)::numeric / NULLIF(COALESCE(w.area_sq_km, fn_calculate_ward_area_sq_km(w.boundary_geom)), 0), 1) AS tree_density_per_sq_km,
        ROUND(COUNT(CASE WHEN t.health_status = 'healthy' THEN 1 END) * 100.0 / NULLIF(COUNT(t.tree_id), 0), 2) AS healthy_pct,
        COUNT(DISTINCT a.alert_id) AS critical_alerts,
        ST_AsGeoJSON(ST_Centroid(w.boundary_geom))::json AS centroid_geojson
    FROM wards w
    LEFT JOIN trees t ON w.ward_id = t.ward_id
    LEFT JOIN alerts a ON t.tree_id = a.tree_id AND a.status = 'PENDING'
    WHERE w.ward_id = p_ward_id
    GROUP BY w.ward_id, w.name, w.area_sq_km, w.boundary_geom;
END;
$$ LANGUAGE plpgsql STABLE;

