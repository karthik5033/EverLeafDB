-- ============================================================================
-- EVERLEAFDB MUNICIPAL CANOPY INTELLIGENCE PLATFORM
-- Migration 06: Database Triggers for Core Operational Integrity & Auditing
-- Engine: PostgreSQL 16+ / PL/pgSQL
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 01. TRIGGER FUNCTION: Update Tree Last Inspected Timestamp
-- Description: Synchronizes trees.last_inspected_at when a field inspection
--              is recorded. Enforces relational temporal integrity.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trg_fn_update_last_inspected()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE trees
    SET 
        last_inspected_at = NEW.inspected_at,
        -- If condition score is critical (1), set health_status to under_treatment
        health_status = CASE 
            WHEN NEW.condition_score = 1 AND health_status NOT IN ('dead', 'removed') THEN 'under_treatment'::tree_health_status
            ELSE health_status
        END
    WHERE tree_id = NEW.tree_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to inspections table
DROP TRIGGER IF EXISTS trg_inspections_update_last_inspected ON inspections;
CREATE TRIGGER trg_inspections_update_last_inspected
AFTER INSERT ON inspections
FOR EACH ROW
EXECUTE FUNCTION trg_fn_update_last_inspected();

-- ----------------------------------------------------------------------------
-- 02. TRIGGER FUNCTION: Immutable Relational Audit Trail
-- Description: Captures INSERT, UPDATE, DELETE operations on mission-critical
--              entities (trees, diagnoses, work_orders) into audit_log with
--              complete JSONB before/after state diffs.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trg_fn_audit_trail()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID := NULL;
    v_record_id UUID := NULL;
    v_old_values JSONB := NULL;
    v_new_values JSONB := NULL;
    v_user_setting TEXT;
BEGIN
    -- Extract current authenticated user ID from transaction session variable
    BEGIN
        v_user_setting := current_setting('app.current_user_id', true);
        IF v_user_setting IS NOT NULL AND v_user_setting <> '' THEN
            v_user_id := v_user_setting::UUID;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        v_user_id := NULL;
    END;

    -- Extract Primary Key UUID dynamically across supported tables
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        v_new_values := to_jsonb(NEW);
        v_record_id := COALESCE(
            (v_new_values ->> 'tree_id')::UUID,
            (v_new_values ->> 'diagnosis_id')::UUID,
            (v_new_values ->> 'order_id')::UUID
        );
    END IF;

    IF TG_OP IN ('UPDATE', 'DELETE') THEN
        v_old_values := to_jsonb(OLD);
        IF v_record_id IS NULL THEN
            v_record_id := COALESCE(
                (v_old_values ->> 'tree_id')::UUID,
                (v_old_values ->> 'diagnosis_id')::UUID,
                (v_old_values ->> 'order_id')::UUID
            );
        END IF;
    END IF;

    -- Insert immutable audit record
    INSERT INTO audit_log (
        user_id,
        action,
        table_name,
        record_id,
        old_values,
        new_values,
        performed_at
    ) VALUES (
        v_user_id,
        TG_OP,
        TG_TABLE_NAME,
        v_record_id,
        v_old_values,
        v_new_values,
        CURRENT_TIMESTAMP
    );

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 03. ATTACH AUDIT TRIGGERS TO TABLES
-- ----------------------------------------------------------------------------

-- A. Trees Audit Trigger
DROP TRIGGER IF EXISTS trg_trees_audit_trail ON trees;
CREATE TRIGGER trg_trees_audit_trail
AFTER INSERT OR UPDATE OR DELETE ON trees
FOR EACH ROW
EXECUTE FUNCTION trg_fn_audit_trail();

-- B. Diagnoses Audit Trigger
DROP TRIGGER IF EXISTS trg_diagnoses_audit_trail ON diagnoses;
CREATE TRIGGER trg_diagnoses_audit_trail
AFTER INSERT OR UPDATE OR DELETE ON diagnoses
FOR EACH ROW
EXECUTE FUNCTION trg_fn_audit_trail();

-- C. Work Orders Audit Trigger
DROP TRIGGER IF EXISTS trg_work_orders_audit_trail ON work_orders;
CREATE TRIGGER trg_work_orders_audit_trail
AFTER INSERT OR UPDATE OR DELETE ON work_orders
FOR EACH ROW
EXECUTE FUNCTION trg_fn_audit_trail();

-- ----------------------------------------------------------------------------
-- 04. UTILITY HELPER: Diff Inspection Function
-- Description: Computes JSONB key-level differences between old and new state
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_jsonb_diff(old_val JSONB, new_val JSONB)
RETURNS JSONB AS $$
SELECT jsonb_object_agg(key, value)
FROM (
    SELECT key, value
    FROM jsonb_each(new_val)
    WHERE NOT (old_val ? key) OR old_val -> key <> value
) diffs;
$$ LANGUAGE sql IMMUTABLE;

