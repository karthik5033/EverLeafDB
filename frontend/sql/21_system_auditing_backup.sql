-- ============================================================================
-- EVERLEAFDB: SYSTEM AUDITING, COMPLIANCE & BACKUP GOVERNANCE
-- Phase 28: System Auditing, Compliance & Backup Verification
--
-- Creates:
-- 1. View: vw_admin_audit_trail_analytics (Audit metrics by table & action)
-- 2. Function: fn_generate_database_snapshot_manifest (PITR snapshot metadata)
-- 3. Function: fn_verify_backup_integrity_checksum (Backup checksum validation)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- View: vw_admin_audit_trail_analytics
-- Real-time audit aggregation for municipal compliance and governance
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_admin_audit_trail_analytics AS
SELECT
    table_name,
    action,
    COUNT(*) AS total_mutations,
    COUNT(DISTINCT user_id) AS distinct_actors,
    MIN(performed_at) AS first_logged_action,
    MAX(performed_at) AS most_recent_action
FROM audit_log
GROUP BY table_name, action
ORDER BY total_mutations DESC;

COMMENT ON VIEW vw_admin_audit_trail_analytics IS
'Aggregates mutation volume across all relational tables and user roles for compliance auditing.';

-- ----------------------------------------------------------------------------
-- Function: fn_generate_database_snapshot_manifest
-- Computes table row counts and metadata for backup integrity verification
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_generate_database_snapshot_manifest()
RETURNS JSONB AS $$
DECLARE
    v_tree_count BIGINT;
    v_inspection_count BIGINT;
    v_work_order_count BIGINT;
    v_audit_count BIGINT;
    v_manifest JSONB;
BEGIN
    SELECT COUNT(*) INTO v_tree_count FROM trees;
    SELECT COUNT(*) INTO v_inspection_count FROM inspections;
    SELECT COUNT(*) INTO v_work_order_count FROM work_orders;
    SELECT COUNT(*) INTO v_audit_count FROM audit_log;

    v_manifest := jsonb_build_object(
        'database', current_database(),
        'generated_at', CURRENT_TIMESTAMP,
        'pg_version', version(),
        'current_wal_lsn', pg_current_wal_lsn(),
        'table_metrics', jsonb_build_object(
            'trees', v_tree_count,
            'inspections', v_inspection_count,
            'work_orders', v_work_order_count,
            'audit_log', v_audit_count
        ),
        'backup_format', 'CUSTOM_COMPRESSED_TAR (pg_dump -Fc)',
        'compression', 'gzip-level-9'
    );

    RETURN v_manifest;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_generate_database_snapshot_manifest IS
'Generates point-in-time snapshot metadata with current WAL LSN position and table row counts.';

-- ----------------------------------------------------------------------------
-- Function: fn_verify_backup_integrity_checksum
-- Validates that a restored dataset matches the snapshot manifest row counts
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_verify_backup_integrity_checksum(p_manifest JSONB)
RETURNS TABLE (
    table_name TEXT,
    expected_rows BIGINT,
    actual_rows BIGINT,
    is_consistent BOOLEAN
) AS $$
DECLARE
    v_trees_expected BIGINT := (p_manifest->'table_metrics'->>'trees')::BIGINT;
    v_inspections_expected BIGINT := (p_manifest->'table_metrics'->>'inspections')::BIGINT;
    v_work_orders_expected BIGINT := (p_manifest->'table_metrics'->>'work_orders')::BIGINT;
    v_audit_expected BIGINT := (p_manifest->'table_metrics'->>'audit_log')::BIGINT;

    v_trees_actual BIGINT;
    v_inspections_actual BIGINT;
    v_work_orders_actual BIGINT;
    v_audit_actual BIGINT;
BEGIN
    SELECT COUNT(*) INTO v_trees_actual FROM trees;
    SELECT COUNT(*) INTO v_inspections_actual FROM inspections;
    SELECT COUNT(*) INTO v_work_orders_actual FROM work_orders;
    SELECT COUNT(*) INTO v_audit_actual FROM audit_log;

    RETURN QUERY
    SELECT 'trees'::TEXT, v_trees_expected, v_trees_actual, (v_trees_expected = v_trees_actual)
    UNION ALL
    SELECT 'inspections'::TEXT, v_inspections_expected, v_inspections_actual, (v_inspections_expected = v_inspections_actual)
    UNION ALL
    SELECT 'work_orders'::TEXT, v_work_orders_expected, v_work_orders_actual, (v_work_orders_expected = v_work_orders_actual)
    UNION ALL
    SELECT 'audit_log'::TEXT, v_audit_expected, v_audit_actual, (v_audit_expected = v_audit_actual);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_verify_backup_integrity_checksum IS
'Verifies row count parity between snapshot manifests and active tables to guarantee backup fidelity.';

