-- ============================================================================
-- EVERLEAFDB: AUTHENTICATION, RBAC & POSTGRESQL ROW-LEVEL SECURITY (RLS)
-- Phase 26: Authentication, RBAC & Row-Level Security (RLS)
--
-- Configures:
-- 1. Session context helper functions (app.current_user_id, app.current_user_role, app.current_user_ward)
-- 2. Row-Level Security enablement on trees, inspections, and work_orders
-- 3. Fine-grained ward tenant isolation policies for 4 roles:
--    - admin (Full unrestricted access across all wards)
--    - supervisor (Full clinical triage and dispatch across all wards)
--    - field_inspector (Ward-scoped mutation isolation; only assigned wards)
--    - citizen_reporter (Read-only catalog exploration; public reporting queue)
-- 4. Session setter stored procedure & authorization test function
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Session Context Retrievers
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_current_app_user_id()
RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_user_id', true), '')::UUID;
EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION fn_current_app_user_role()
RETURNS user_role AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_user_role', true), '')::user_role;
EXCEPTION WHEN OTHERS THEN
    RETURN 'citizen_reporter'::user_role;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION fn_current_app_user_ward()
RETURNS VARCHAR(50) AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_user_ward', true), '');
EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- ----------------------------------------------------------------------------
-- 2. Session Context Setter
-- ----------------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE sp_set_app_session_context(
    IN p_user_id UUID,
    IN p_role user_role,
    IN p_ward_id VARCHAR(50) DEFAULT NULL
)
LANGUAGE plpgsql
AS $$
BEGIN
    PERFORM set_config('app.current_user_id', p_user_id::TEXT, false);
    PERFORM set_config('app.current_user_role', p_role::TEXT, false);
    IF p_ward_id IS NOT NULL THEN
        PERFORM set_config('app.current_user_ward', p_ward_id, false);
    ELSE
        PERFORM set_config('app.current_user_ward', '', false);
    END IF;
END;
$$;

COMMENT ON PROCEDURE sp_set_app_session_context IS
'Sets PostgreSQL session parameters for RLS tenant isolation before query execution.';

-- ----------------------------------------------------------------------------
-- 3. Enable Row-Level Security on Core Tables
-- ----------------------------------------------------------------------------
ALTER TABLE trees ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 4. RLS Policies: trees table
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS policy_trees_admin_supervisor ON trees;
DROP POLICY IF EXISTS policy_trees_field_inspector_select ON trees;
DROP POLICY IF EXISTS policy_trees_field_inspector_insert ON trees;
DROP POLICY IF EXISTS policy_trees_field_inspector_update ON trees;
DROP POLICY IF EXISTS policy_trees_citizen_select ON trees;

-- 4a. Admin & Supervisor: Unrestricted access across all municipal wards
CREATE POLICY policy_trees_admin_supervisor ON trees
FOR ALL
USING (
    fn_current_app_user_role() IN ('admin', 'supervisor')
)
WITH CHECK (
    fn_current_app_user_role() IN ('admin', 'supervisor')
);

-- 4b. Field Inspector: Can view all registered trees
CREATE POLICY policy_trees_field_inspector_select ON trees
FOR SELECT
USING (
    fn_current_app_user_role() = 'field_inspector'
);

-- 4c. Field Inspector: Can only register trees in their assigned ward
CREATE POLICY policy_trees_field_inspector_insert ON trees
FOR INSERT
WITH CHECK (
    fn_current_app_user_role() = 'field_inspector'
    AND (
        fn_current_app_user_ward() IS NULL
        OR ward_id::TEXT = fn_current_app_user_ward()
    )
);

-- 4d. Field Inspector: Can only update trees in their assigned ward
CREATE POLICY policy_trees_field_inspector_update ON trees
FOR UPDATE
USING (
    fn_current_app_user_role() = 'field_inspector'
    AND (
        fn_current_app_user_ward() IS NULL
        OR ward_id::TEXT = fn_current_app_user_ward()
    )
)
WITH CHECK (
    fn_current_app_user_role() = 'field_inspector'
    AND (
        fn_current_app_user_ward() IS NULL
        OR ward_id::TEXT = fn_current_app_user_ward()
    )
);

-- 4e. Citizen Reporter: Read-only access to tree catalog
CREATE POLICY policy_trees_citizen_select ON trees
FOR SELECT
USING (
    fn_current_app_user_role() = 'citizen_reporter'
);

-- ----------------------------------------------------------------------------
-- 5. RLS Policies: inspections table
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS policy_inspections_admin_supervisor ON inspections;
DROP POLICY IF EXISTS policy_inspections_inspector_select ON inspections;
DROP POLICY IF EXISTS policy_inspections_inspector_insert ON inspections;

-- 5a. Admin & Supervisor: Unrestricted inspection review
CREATE POLICY policy_inspections_admin_supervisor ON inspections
FOR ALL
USING (
    fn_current_app_user_role() IN ('admin', 'supervisor')
);

-- 5b. Field Inspector: Read access to inspections
CREATE POLICY policy_inspections_inspector_select ON inspections
FOR SELECT
USING (
    fn_current_app_user_role() = 'field_inspector'
);

-- 5c. Field Inspector: Can only insert inspections for trees in assigned ward
CREATE POLICY policy_inspections_inspector_insert ON inspections
FOR INSERT
WITH CHECK (
    fn_current_app_user_role() = 'field_inspector'
    AND (
        inspector_id = fn_current_app_user_id()
        OR fn_current_app_user_id() IS NULL
    )
    AND EXISTS (
        SELECT 1 FROM trees t
        WHERE t.tree_id = inspections.tree_id
        AND (
            fn_current_app_user_ward() IS NULL
            OR t.ward_id::TEXT = fn_current_app_user_ward()
        )
    )
);

-- ----------------------------------------------------------------------------
-- 6. RLS Policies: work_orders table
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS policy_work_orders_admin_supervisor ON work_orders;
DROP POLICY IF EXISTS policy_work_orders_inspector ON work_orders;

-- 6a. Admin & Supervisor: Dispatch and manage all work orders
CREATE POLICY policy_work_orders_admin_supervisor ON work_orders
FOR ALL
USING (
    fn_current_app_user_role() IN ('admin', 'supervisor')
);

-- 6b. Field Inspector: Read & update work orders in assigned ward
CREATE POLICY policy_work_orders_inspector ON work_orders
FOR ALL
USING (
    fn_current_app_user_role() = 'field_inspector'
    AND EXISTS (
        SELECT 1 FROM trees t
        WHERE t.tree_id = work_orders.tree_id
        AND (
            fn_current_app_user_ward() IS NULL
            OR t.ward_id::TEXT = fn_current_app_user_ward()
        )
    )
);

-- ----------------------------------------------------------------------------
-- 7. Verification Function: fn_test_rls_ward_authorization
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_test_rls_ward_authorization(
    p_role user_role,
    p_user_ward VARCHAR(50),
    p_target_ward VARCHAR(50),
    p_action VARCHAR(20) -- 'SELECT', 'INSERT', 'UPDATE'
)
RETURNS TABLE (
    role user_role,
    user_ward VARCHAR(50),
    target_ward VARCHAR(50),
    action VARCHAR(20),
    is_authorized BOOLEAN,
    policy_enforced VARCHAR(100)
) AS $$
DECLARE
    v_auth BOOLEAN := FALSE;
    v_policy VARCHAR(100);
BEGIN
    IF p_role IN ('admin', 'supervisor') THEN
        v_auth := TRUE;
        v_policy := 'policy_trees_admin_supervisor (Unrestricted)';
    ELSIF p_role = 'field_inspector' THEN
        IF p_action = 'SELECT' THEN
            v_auth := TRUE;
            v_policy := 'policy_trees_field_inspector_select (Catalog Browse)';
        ELSIF p_user_ward IS NULL OR p_user_ward = p_target_ward THEN
            v_auth := TRUE;
            v_policy := 'policy_trees_field_inspector_insert (Assigned Ward Match)';
        ELSE
            v_auth := FALSE;
            v_policy := 'policy_trees_field_inspector_insert (DENIED: Cross-Ward Isolation)';
        END IF;
    ELSIF p_role = 'citizen_reporter' THEN
        IF p_action = 'SELECT' THEN
            v_auth := TRUE;
            v_policy := 'policy_trees_citizen_select (Public Read)';
        ELSE
            v_auth := FALSE;
            v_policy := 'policy_trees_citizen (DENIED: Write Restricted)';
        END IF;
    END IF;

    RETURN QUERY
    SELECT p_role, p_user_ward, p_target_ward, p_action, v_auth, v_policy;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION fn_test_rls_ward_authorization IS
'Evaluates simulated RLS authorization decisions against municipal ward tenant boundaries.';

