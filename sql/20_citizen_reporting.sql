-- ============================================================================
-- EVERLEAFDB: CITIZEN REPORTING PUBLIC PORTAL & HAZARD INGESTION
-- Phase 27: Citizen Reporting Public Portal (/report)
--
-- Creates:
-- 1. Table: citizen_reports (Public hazard submissions staging table)
-- 2. Spatial Trigger: trg_fn_assign_citizen_report_ward (PostGIS ST_Contains)
-- 3. View: vw_citizen_reports_triage (For supervisor review queue)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Table: citizen_reports
-- Public hazard reports submitted by citizens without authentication
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS citizen_reports (
    report_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tracking_code VARCHAR(20) NOT NULL UNIQUE,
    reporter_name VARCHAR(100) DEFAULT 'Anonymous Citizen',
    reporter_phone VARCHAR(20),
    reporter_email VARCHAR(120),
    location GEOMETRY(Point, 4326) NOT NULL,
    ward_id INT REFERENCES wards(ward_id) ON DELETE SET NULL,
    address_landmark VARCHAR(255),
    hazard_category VARCHAR(50) NOT NULL CHECK (
        hazard_category IN (
            'FALLING_BRANCH',
            'TRUNK_DECAY_FUNGUS',
            'ROOT_EXCAVATION_DAMAGE',
            'PEST_INFESTATION',
            'OVERHANGING_POWERLINE',
            'DEAD_TREE_HAZARD',
            'OTHER'
        )
    ),
    urgency_level VARCHAR(20) NOT NULL DEFAULT 'MODERATE' CHECK (
        urgency_level IN ('LOW', 'MODERATE', 'HIGH', 'EMERGENCY')
    ),
    description TEXT NOT NULL,
    photo_url TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING_TRIAGE' CHECK (
        status IN ('PENDING_TRIAGE', 'INVESTIGATING', 'ACTIONED', 'RESOLVED', 'DISMISSED')
    ),
    supervisor_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_citizen_reports_geom ON citizen_reports USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_citizen_reports_tracking ON citizen_reports(tracking_code);
CREATE INDEX IF NOT EXISTS idx_citizen_reports_status ON citizen_reports(status);
CREATE INDEX IF NOT EXISTS idx_citizen_reports_ward ON citizen_reports(ward_id);

COMMENT ON TABLE citizen_reports IS
'Public community tree hazard and pathological symptom reports awaiting municipal triage.';

-- ----------------------------------------------------------------------------
-- Spatial Trigger: trg_fn_assign_citizen_report_ward
-- Automatically identifies the municipal ward using PostGIS ST_Contains
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trg_fn_assign_citizen_report_ward()
RETURNS TRIGGER AS $$
DECLARE
    v_ward_id INT;
BEGIN
    -- Query ward polygon containing report coordinate
    SELECT w.ward_id INTO v_ward_id
    FROM wards w
    WHERE ST_Contains(w.boundary, NEW.location)
    LIMIT 1;

    IF v_ward_id IS NOT NULL THEN
        NEW.ward_id := v_ward_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_assign_citizen_report_ward ON citizen_reports;

CREATE TRIGGER trg_assign_citizen_report_ward
BEFORE INSERT ON citizen_reports
FOR EACH ROW
EXECUTE FUNCTION trg_fn_assign_citizen_report_ward();

COMMENT ON FUNCTION trg_fn_assign_citizen_report_ward IS
'Automatically tags citizen reports with the corresponding municipal ward via PostGIS point-in-polygon containment.';

-- ----------------------------------------------------------------------------
-- View: vw_citizen_reports_triage
-- Triage view for municipal supervisors to review incoming citizen reports
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_citizen_reports_triage AS
SELECT
    cr.report_id,
    cr.tracking_code,
    cr.reporter_name,
    cr.reporter_phone,
    cr.reporter_email,
    ST_Y(cr.location::geometry) AS latitude,
    ST_X(cr.location::geometry) AS longitude,
    cr.ward_id,
    w.name AS ward_name,
    w.zone AS ward_zone,
    cr.address_landmark,
    cr.hazard_category,
    cr.urgency_level,
    cr.description,
    cr.photo_url,
    cr.status,
    cr.supervisor_notes,
    cr.created_at,
    cr.resolved_at,
    ROUND(
        EXTRACT(EPOCH FROM (COALESCE(cr.resolved_at, CURRENT_TIMESTAMP) - cr.created_at)) / 3600,
        1
    ) AS elapsed_hours,
    CASE
        WHEN cr.status = 'PENDING_TRIAGE' AND CURRENT_TIMESTAMP > (cr.created_at + INTERVAL '24 hours') THEN TRUE
        ELSE FALSE
    END AS is_sla_breached
FROM citizen_reports cr
LEFT JOIN wards w ON cr.ward_id = w.ward_id
ORDER BY
    CASE cr.urgency_level
        WHEN 'EMERGENCY' THEN 1
        WHEN 'HIGH' THEN 2
        WHEN 'MODERATE' THEN 3
        WHEN 'LOW' THEN 4
        ELSE 5
    END ASC,
    cr.created_at DESC;

COMMENT ON VIEW vw_citizen_reports_triage IS
'Consolidated triage view for municipal tree supervisors to review incoming public hazard reports.';
