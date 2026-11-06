-- ============================================================================
-- EVERLEAFDB: WORK ORDER MANAGEMENT & CREW DISPATCH KANBAN
-- Phase 23: Work Order Management & Crew Dispatch Kanban (/work-orders)
--
-- Provides relational views and functions supporting the municipal field crew
-- Kanban board, status transitions, SLA monitoring, and contractor filtering.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- View: vw_work_orders_kanban
-- Consolidated relational view for Kanban board cards with spatial, botanical,
-- diagnostic, and crew attribution.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_work_orders_kanban AS
SELECT
    wo.order_id,
    wo.priority,
    wo.status AS work_order_status,
    wo.due_date,
    wo.created_at,
    wo.closed_at,
    
    -- SLA & Duration Metrics
    CASE
        WHEN wo.status IN ('COMPLETED', 'CANCELLED') THEN 0
        ELSE GREATEST(0, ROUND(EXTRACT(EPOCH FROM (wo.due_date::TIMESTAMP - CURRENT_TIMESTAMP)) / 3600)::INT)
    END AS sla_hours_remaining,
    CASE
        WHEN wo.status NOT IN ('COMPLETED', 'CANCELLED') AND CURRENT_DATE > wo.due_date THEN TRUE
        ELSE FALSE
    END AS is_overdue,
    ROUND(
        EXTRACT(EPOCH FROM (COALESCE(wo.closed_at, CURRENT_TIMESTAMP) - wo.created_at)) / 3600,
        1
    ) AS elapsed_hours,

    -- Crew & Contractor Attribution
    u.user_id AS supervisor_id,
    u.username AS supervisor_name,
    u.email AS supervisor_email,
    
    -- Tree & Botanical Specs
    t.tree_id,
    t.tag_number AS tree_tag,
    t.dbh_cm,
    t.height_m,
    t.health_status AS tree_health_status,
    t.condition_score,
    s.species_id,
    s.common_name AS species_common,
    s.scientific_name AS species_scientific,
    
    -- Spatial & Ward Attribution
    w.ward_id,
    w.name AS ward_name,
    w.zone AS ward_zone,
    ST_Y(t.location::geometry) AS latitude,
    ST_X(t.location::geometry) AS longitude,
    
    -- Diagnostic & Pathological Attribution
    diag.diagnosis_id,
    dis.disease_id,
    dis.common_name AS disease_name,
    dis.severity AS disease_severity,
    diag.confidence_source,
    diag.similarity_score,
    ROUND((diag.similarity_score * 100)::NUMERIC, 1) AS similarity_percent
FROM work_orders wo
JOIN trees t ON wo.tree_id = t.tree_id
JOIN species s ON t.species_id = s.species_id
JOIN wards w ON t.ward_id = w.ward_id
LEFT JOIN users u ON wo.assigned_to_user_id = u.user_id
LEFT JOIN diagnoses diag ON wo.diagnosis_id = diag.diagnosis_id
LEFT JOIN diseases dis ON diag.disease_id = dis.disease_id
ORDER BY
    CASE wo.priority
        WHEN 'EMERGENCY' THEN 1
        WHEN 'HIGH' THEN 2
        WHEN 'STANDARD' THEN 3
        WHEN 'MEDIUM' THEN 4
        WHEN 'LOW' THEN 5
        ELSE 6
    END ASC,
    wo.due_date ASC;

COMMENT ON VIEW vw_work_orders_kanban IS
'Consolidated relational view powering the municipal crew dispatch Kanban board.';

-- ----------------------------------------------------------------------------
-- Function: fn_transition_work_order_status
-- Atomically transitions a work order state, records timestamps, and logs audit.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_transition_work_order_status(
    p_order_id UUID,
    p_new_status work_order_status,
    p_actor_id UUID DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS TABLE (
    order_id UUID,
    old_status work_order_status,
    new_status work_order_status,
    closed_at TIMESTAMP WITH TIME ZONE,
    status_message TEXT
) AS $$
DECLARE
    v_old_status work_order_status;
    v_closed_at TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Pessimistic Lock on target work order
    SELECT status, work_orders.closed_at
    INTO v_old_status, v_closed_at
    FROM work_orders
    WHERE work_orders.order_id = p_order_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Work order % does not exist.', p_order_id;
    END IF;

    -- Compute closed_at timestamp
    IF p_new_status IN ('COMPLETED', 'CANCELLED') THEN
        v_closed_at := CURRENT_TIMESTAMP;
    ELSE
        v_closed_at := NULL;
    END IF;

    -- Update work order
    UPDATE work_orders
    SET
        status = p_new_status,
        closed_at = v_closed_at
    WHERE work_orders.order_id = p_order_id;

    -- Record Audit Trail
    INSERT INTO audit_log (
        user_id,
        action,
        table_name,
        record_id,
        old_values,
        new_values,
        performed_at
    ) VALUES (
        p_actor_id,
        'UPDATE',
        'work_orders',
        p_order_id::TEXT,
        jsonb_build_object('status', v_old_status),
        jsonb_build_object('status', p_new_status, 'closed_at', v_closed_at, 'notes', p_notes),
        CURRENT_TIMESTAMP
    );

    RETURN QUERY
    SELECT
        p_order_id,
        v_old_status,
        p_new_status,
        v_closed_at,
        format('Work order %s transitioned from %s to %s.', p_order_id, v_old_status, p_new_status);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_transition_work_order_status IS
'Safely transitions work order status, sets closed_at timestamp, and records audit trail.';

