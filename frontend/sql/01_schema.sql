-- ============================================================================
-- EverLeafDB: High-Integrity 3NF Relational Schema & DDL Migration
-- Engines: PostgreSQL 16+ | PostGIS (SRID 4326) | pgvector (512-dim)
-- Phase 3: Relational 3NF Schema & TypeScript Type System
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 00. EXTENSION INITIALIZATION
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ----------------------------------------------------------------------------
-- 01. CUSTOM ENUM TYPES & DOMAINS
-- ----------------------------------------------------------------------------

DO $$ BEGIN
    CREATE TYPE tree_health_status AS ENUM (
        'healthy',
        'monitor',
        'diseased',
        'critical',
        'under_treatment',
        'dead',
        'removed'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE organ_body_part AS ENUM (
        'leaf',
        'bark',
        'trunk',
        'root',
        'canopy'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE disease_severity AS ENUM (
        'LOW',
        'MEDIUM',
        'MODERATE',
        'HIGH',
        'CRITICAL'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE treatment_outcome AS ENUM (
        'SUCCESSFUL',
        'PARTIAL',
        'FAILED',
        'ONGOING',
        'IN_PROGRESS'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE work_order_priority AS ENUM (
        'LOW',
        'STANDARD',
        'MEDIUM',
        'HIGH',
        'EMERGENCY'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE work_order_status AS ENUM (
        'PENDING',
        'DISPATCHED',
        'IN_PROGRESS',
        'COMPLETED',
        'CANCELLED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE alert_status AS ENUM (
        'PENDING',
        'REVIEWED',
        'ACTIONED',
        'DISMISSED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM (
        'admin',
        'supervisor',
        'field_inspector',
        'citizen_reporter'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ----------------------------------------------------------------------------
-- 02. CORE 3NF RELATIONAL TABLES (14 ENTITIES)
-- ----------------------------------------------------------------------------

-- Table 1: Botanical Species Catalog
CREATE TABLE IF NOT EXISTS species (
    species_id SERIAL PRIMARY KEY,
    scientific_name VARCHAR(120) NOT NULL UNIQUE,
    common_name VARCHAR(120) NOT NULL,
    typical_lifespan_years INT NOT NULL CHECK (typical_lifespan_years > 0),
    growth_rate VARCHAR(30) CHECK (growth_rate IN ('SLOW', 'MODERATE', 'FAST')),
    foliage_type VARCHAR(50) DEFAULT 'Deciduous',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table 2: Municipal Administrative Wards (Geospatial Polygons)
CREATE TABLE IF NOT EXISTS wards (
    ward_id SERIAL PRIMARY KEY,
    ward_number VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    boundary_geom GEOMETRY(Polygon, 4326) NOT NULL,
    area_sq_km NUMERIC(8, 3) CHECK (area_sq_km > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table 3: Application Users (Inspectors, Supervisors, Admins)
CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(120) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'field_inspector',
    assigned_ward_id INT REFERENCES wards(ward_id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table 4: Registered Urban Trees
CREATE TABLE IF NOT EXISTS trees (
    tree_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    species_id INT NOT NULL REFERENCES species(species_id) ON DELETE RESTRICT,
    ward_id INT NOT NULL REFERENCES wards(ward_id) ON DELETE RESTRICT,
    location_geom GEOMETRY(Point, 4326) NOT NULL,
    planted_date DATE NOT NULL CHECK (planted_date <= CURRENT_DATE),
    height_meters NUMERIC(5, 2) NOT NULL CHECK (height_meters > 0),
    girth_cm NUMERIC(6, 2) NOT NULL CHECK (girth_cm > 0),
    health_status tree_health_status NOT NULL DEFAULT 'healthy',
    last_inspected_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table 5: Periodic Tree Field Inspections
CREATE TABLE IF NOT EXISTS inspections (
    inspection_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tree_id UUID NOT NULL REFERENCES trees(tree_id) ON DELETE CASCADE,
    inspector_id UUID NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    inspected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    condition_score INT NOT NULL CHECK (condition_score BETWEEN 1 AND 5),
    field_notes TEXT,
    notes_embedding vector(512),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table 6: High-Dimensional Visual Symptom Photos & Embeddings
CREATE TABLE IF NOT EXISTS inspection_images (
    image_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inspection_id UUID NOT NULL REFERENCES inspections(inspection_id) ON DELETE CASCADE,
    file_path VARCHAR(512) NOT NULL,
    body_part organ_body_part NOT NULL DEFAULT 'leaf',
    image_embedding vector(512) NOT NULL,
    captured_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_vector_dim CHECK (array_length(image_embedding::real[], 1) = 512)
);

-- Table 7: Master Pathological Disease Library
CREATE TABLE IF NOT EXISTS diseases (
    disease_id SERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL UNIQUE,
    category VARCHAR(50) NOT NULL CHECK (category IN ('fungal', 'bacterial', 'viral', 'pest', 'nutrient')),
    severity_level disease_severity NOT NULL DEFAULT 'MEDIUM',
    symptoms_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table 8: Species-to-Disease Susceptibility Matrix (M:N Relationship)
CREATE TABLE IF NOT EXISTS species_disease_susceptibility (
    species_id INT NOT NULL REFERENCES species(species_id) ON DELETE CASCADE,
    disease_id INT NOT NULL REFERENCES diseases(disease_id) ON DELETE CASCADE,
    vulnerability_index VARCHAR(20) DEFAULT 'MODERATE' CHECK (vulnerability_index IN ('LOW', 'MODERATE', 'HIGH')),
    PRIMARY KEY (species_id, disease_id)
);

-- Table 9: Clinical Diagnoses Confirmed by Inspectors / Supervisors
CREATE TABLE IF NOT EXISTS diagnoses (
    diagnosis_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inspection_id UUID NOT NULL REFERENCES inspections(inspection_id) ON DELETE CASCADE,
    disease_id INT NOT NULL REFERENCES diseases(disease_id) ON DELETE RESTRICT,
    confirmed_by_id UUID NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    confidence_source VARCHAR(30) DEFAULT 'manual' CHECK (confidence_source IN ('manual', 'vector_suggested')),
    similarity_score NUMERIC(5, 4),
    diagnosed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table 10: Master Botanical Treatments & Interventions
CREATE TABLE IF NOT EXISTS treatments (
    treatment_id SERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL UNIQUE,
    treatment_type VARCHAR(50) NOT NULL CHECK (treatment_type IN ('chemical', 'biological', 'pruning', 'soil_amendment')),
    standard_cost NUMERIC(10, 2) NOT NULL CHECK (standard_cost >= 0),
    typical_duration_days INT NOT NULL CHECK (typical_duration_days > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table 11: Operational Treatment Administration Records
CREATE TABLE IF NOT EXISTS treatment_records (
    treatment_record_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    diagnosis_id UUID NOT NULL REFERENCES diagnoses(diagnosis_id) ON DELETE CASCADE,
    treatment_id INT NOT NULL REFERENCES treatments(treatment_id) ON DELETE RESTRICT,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE CHECK (end_date >= start_date),
    outcome_status treatment_outcome NOT NULL DEFAULT 'ONGOING',
    inspector_remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table 12: Field Crew Work Orders
CREATE TABLE IF NOT EXISTS work_orders (
    order_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tree_id UUID NOT NULL REFERENCES trees(tree_id) ON DELETE CASCADE,
    diagnosis_id UUID REFERENCES diagnoses(diagnosis_id) ON DELETE SET NULL,
    assigned_to_user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    priority work_order_priority NOT NULL DEFAULT 'MEDIUM',
    status work_order_status NOT NULL DEFAULT 'PENDING',
    due_date DATE NOT NULL,
    closed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table 13: Automated Risk Alerts Triggered by Vector Nearest Neighbors
CREATE TABLE IF NOT EXISTS alerts (
    alert_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tree_id UUID NOT NULL REFERENCES trees(tree_id) ON DELETE CASCADE,
    inspection_id UUID NOT NULL REFERENCES inspections(inspection_id) ON DELETE CASCADE,
    reason VARCHAR(255) NOT NULL,
    similarity_score NUMERIC(5, 4) NOT NULL,
    severity disease_severity NOT NULL DEFAULT 'CRITICAL',
    status alert_status NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table 14: Immutable Security & Relational Audit Trail
CREATE TABLE IF NOT EXISTS audit_log (
    log_id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    action VARCHAR(20) NOT NULL,
    table_name VARCHAR(60) NOT NULL,
    record_id UUID NOT NULL,
    old_values JSONB,
    new_values JSONB,
    performed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 03. HIGH-PERFORMANCE INDEXING SUITE (B-Tree, GiST Spatial, pgvector HNSW)
-- ----------------------------------------------------------------------------

-- Relational B-Tree Indexes
CREATE INDEX IF NOT EXISTS idx_trees_species_id ON trees(species_id);
CREATE INDEX IF NOT EXISTS idx_trees_ward_id ON trees(ward_id);
CREATE INDEX IF NOT EXISTS idx_trees_health_status ON trees(health_status);
CREATE INDEX IF NOT EXISTS idx_inspections_tree_id ON inspections(tree_id);
CREATE INDEX IF NOT EXISTS idx_inspections_inspector_id ON inspections(inspector_id);
CREATE INDEX IF NOT EXISTS idx_inspections_inspected_at ON inspections(inspected_at DESC);
CREATE INDEX IF NOT EXISTS idx_work_orders_tree_id ON work_orders(tree_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_assigned_status ON work_orders(assigned_to_user_id, status);
CREATE INDEX IF NOT EXISTS idx_alerts_status_severity ON alerts(status, severity);
CREATE INDEX IF NOT EXISTS idx_audit_log_record_table ON audit_log(table_name, record_id);

-- PostGIS GiST Spatial Indexes (R-Tree accelerated bounding box scans)
CREATE INDEX IF NOT EXISTS idx_trees_location_gist ON trees USING gist(location_geom);
CREATE INDEX IF NOT EXISTS idx_wards_boundary_gist ON wards USING gist(boundary_geom);

-- pgvector HNSW Graph Index (Cosine distance operator <=>)
CREATE INDEX IF NOT EXISTS idx_inspection_images_vector_hnsw 
ON inspection_images 
USING hnsw (image_embedding vector_cosine_ops) 
WITH (m = 16, ef_construction = 64);

