/**
 * EverLeafDB Phase 26: Authentication, RBAC & Row-Level Security (RLS) Engine
 *
 * Implements:
 * 1. 4-tier Role-Based Access Control:
 *    - admin (Full municipal administrative authority)
 *    - supervisor (Clinical diagnosis verification & work order dispatch across all wards)
 *    - field_inspector (Ward-scoped mutation isolation; inspections & registrations in assigned ward only)
 *    - citizen_reporter (Read-only catalog exploration; public hazard submission)
 * 2. Session state tracking with JWT claim simulation
 * 3. PostgreSQL session variable injection:
 *    SET LOCAL app.current_user_id = '...';
 *    SET LOCAL app.current_user_role = '...';
 *    SET LOCAL app.current_user_ward = '...';
 * 4. Deterministic RLS policy evaluation preventing unauthorized cross-ward operations
 */

export type UserRole = "admin" | "supervisor" | "field_inspector" | "citizen_reporter";

export interface SystemUser {
  user_id: string;
  username: string;
  email: string;
  name: string;
  role: UserRole;
  title: string;
  assigned_ward_id: string | null;
  assigned_ward_name: string | null;
  avatar_url?: string;
  permissions: {
    can_view_catalog: boolean;
    can_insert_trees: boolean;
    can_insert_inspections: boolean;
    can_triage_alerts: boolean;
    can_dispatch_orders: boolean;
    can_manage_users: boolean;
    can_export_reports: boolean;
  };
}

export interface SessionContext {
  user: SystemUser;
  token: string;
  expires_at: string;
  sql_session_context: {
    set_user_id: string;
    set_user_role: string;
    set_user_ward: string;
  };
}

export interface RlsAuthorizationDecision {
  is_authorized: boolean;
  policy_enforced: string;
  action: "SELECT" | "INSERT" | "UPDATE" | "DELETE" | "DISPATCH";
  resource: "trees" | "inspections" | "work_orders" | "alerts";
  user_role: UserRole;
  user_ward: string | null;
  target_ward: string;
  reason: string;
  sql_session_stmt: string;
}

// Pre-seeded system users for simulated authentication
export const SYSTEM_USERS: SystemUser[] = [
  {
    user_id: "00000000-0000-0000-0000-000000000001",
    username: "admin_ramanathan",
    email: "admin@everleaf.gov.in",
    name: "Dr. S. Ramanathan",
    role: "admin",
    title: "Chief Municipal Forester & System Administrator",
    assigned_ward_id: null, // Full city-wide access
    assigned_ward_name: "All 198 Metropolitan Wards",
    permissions: {
      can_view_catalog: true,
      can_insert_trees: true,
      can_insert_inspections: true,
      can_triage_alerts: true,
      can_dispatch_orders: true,
      can_manage_users: true,
      can_export_reports: true
    }
  },
  {
    user_id: "00000000-0000-0000-0000-000000000002",
    username: "supervisor_rajesh",
    email: "rajesh.supervisor@everleaf.gov.in",
    name: "Dr. Rajesh Kumar",
    role: "supervisor",
    title: "Municipal Tree Supervisor (Clinical Triage)",
    assigned_ward_id: null, // Full city-wide triage authority
    assigned_ward_name: "City-Wide Clinical Jurisdiction",
    permissions: {
      can_view_catalog: true,
      can_insert_trees: true,
      can_insert_inspections: true,
      can_triage_alerts: true,
      can_dispatch_orders: true,
      can_manage_users: false,
      can_export_reports: true
    }
  },
  {
    user_id: "00000000-0000-0000-0000-000000000003",
    username: "inspector_vikram",
    email: "vikram.mehta@everleaf.gov.in",
    name: "Vikram Mehta",
    role: "field_inspector",
    title: "Field Inspector (Ward 03 - Cubbon Park)",
    assigned_ward_id: "ward_03",
    assigned_ward_name: "Cubbon Park Heritage (Ward 03)",
    permissions: {
      can_view_catalog: true,
      can_insert_trees: true, // Only in ward_03
      can_insert_inspections: true, // Only in ward_03
      can_triage_alerts: false,
      can_dispatch_orders: false,
      can_manage_users: false,
      can_export_reports: false
    }
  },
  {
    user_id: "00000000-0000-0000-0000-000000000004",
    username: "inspector_priya",
    email: "priya.sharma@everleaf.gov.in",
    name: "Priya Sharma",
    role: "field_inspector",
    title: "Field Inspector (Ward 02 - Malleswaram)",
    assigned_ward_id: "ward_02",
    assigned_ward_name: "Malleswaram Canopy (Ward 02)",
    permissions: {
      can_view_catalog: true,
      can_insert_trees: true, // Only in ward_02
      can_insert_inspections: true, // Only in ward_02
      can_triage_alerts: false,
      can_dispatch_orders: false,
      can_manage_users: false,
      can_export_reports: false
    }
  },
  {
    user_id: "00000000-0000-0000-0000-000000000005",
    username: "citizen_ananya",
    email: "ananya.sen@gmail.com",
    name: "Ananya Sen",
    role: "citizen_reporter",
    title: "Citizen Reporter / Neighborhood Canopy Steward",
    assigned_ward_id: null,
    assigned_ward_name: "Public Citizen Domain",
    permissions: {
      can_view_catalog: true,
      can_insert_trees: false,
      can_insert_inspections: false,
      can_triage_alerts: false,
      can_dispatch_orders: false,
      can_manage_users: false,
      can_export_reports: false
    }
  }
];

// Active global session (defaults to Dr. S. Ramanathan Admin)
let ACTIVE_USER: SystemUser = SYSTEM_USERS[0];

/**
 * Retrieves the currently active user session context with SQL session parameters.
 */
export function getActiveSession(): SessionContext {
  const expiresAt = new Date(Date.now() + 8 * 3600 * 1000).toISOString();
  const token = `jwt_mock_${ACTIVE_USER.role}_${ACTIVE_USER.user_id.slice(-4)}`;

  return {
    user: ACTIVE_USER,
    token,
    expires_at: expiresAt,
    sql_session_context: {
      set_user_id: `SET LOCAL app.current_user_id = '${ACTIVE_USER.user_id}';`,
      set_user_role: `SET LOCAL app.current_user_role = '${ACTIVE_USER.role}';`,
      set_user_ward: ACTIVE_USER.assigned_ward_id
        ? `SET LOCAL app.current_user_ward = '${ACTIVE_USER.assigned_ward_id}';`
        : `SET LOCAL app.current_user_ward = '';`
    }
  };
}

/**
 * Switches the active session to a specific user by user_id.
 */
export function setActiveUserSession(userId: string): SessionContext {
  const found = SYSTEM_USERS.find((u) => u.user_id === userId || u.username === userId);
  if (!found) {
    throw new Error(`User with ID or username "${userId}" not found.`);
  }
  ACTIVE_USER = found;
  return getActiveSession();
}

/**
 * Evaluates PostgreSQL Row-Level Security (RLS) policies against a proposed operation.
 */
export function evaluateRlsAccess(params: {
  action: "SELECT" | "INSERT" | "UPDATE" | "DELETE" | "DISPATCH";
  resource: "trees" | "inspections" | "work_orders" | "alerts";
  target_ward: string;
  user?: SystemUser;
}): RlsAuthorizationDecision {
  const user = params.user || ACTIVE_USER;
  const { action, resource, target_ward } = params;

  const sqlStmt = `
SET LOCAL app.current_user_id = '${user.user_id}';
SET LOCAL app.current_user_role = '${user.role}';
SET LOCAL app.current_user_ward = '${user.assigned_ward_id || ""}';
  `.trim();

  // Rule 1: Admin & Supervisor have unrestricted access across all municipal wards
  if (user.role === "admin" || user.role === "supervisor") {
    return {
      is_authorized: true,
      policy_enforced: `policy_${resource}_admin_supervisor (Unrestricted)`,
      action,
      resource,
      user_role: user.role,
      user_ward: user.assigned_ward_id,
      target_ward,
      reason: `User has role "${user.role}" with city-wide administrative authority.`,
      sql_session_stmt: sqlStmt
    };
  }

  // Rule 2: Citizen Reporter can only browse (SELECT) public trees; cannot modify internal records
  if (user.role === "citizen_reporter") {
    if (action === "SELECT" && resource === "trees") {
      return {
        is_authorized: true,
        policy_enforced: "policy_trees_citizen_select (Public Read-Only)",
        action,
        resource,
        user_role: user.role,
        user_ward: user.assigned_ward_id,
        target_ward,
        reason: "Citizens are granted public read-only access to urban tree canopy data.",
        sql_session_stmt: sqlStmt
      };
    }
    return {
      is_authorized: false,
      policy_enforced: `policy_${resource}_citizen (Access Denied)`,
      action,
      resource,
      user_role: user.role,
      user_ward: user.assigned_ward_id,
      target_ward,
      reason: `Citizen reporters cannot execute ${action} on ${resource}.`,
      sql_session_stmt: sqlStmt
    };
  }

  // Rule 3: Field Inspector (Tenant Ward Isolation)
  if (user.role === "field_inspector") {
    // Reading trees or inspections is permitted city-wide for botanical awareness
    if (action === "SELECT") {
      return {
        is_authorized: true,
        policy_enforced: `policy_${resource}_field_inspector_select (Catalog Browse)`,
        action,
        resource,
        user_role: user.role,
        user_ward: user.assigned_ward_id,
        target_ward,
        reason: "Field inspectors can browse trees city-wide for reference and similarity.",
        sql_session_stmt: sqlStmt
      };
    }

    // Mutations (INSERT, UPDATE) strictly require target_ward === assigned_ward_id
    if (user.assigned_ward_id === target_ward) {
      return {
        is_authorized: true,
        policy_enforced: `policy_${resource}_field_inspector_insert (Assigned Ward Match)`,
        action,
        resource,
        user_role: user.role,
        user_ward: user.assigned_ward_id,
        target_ward,
        reason: `Target ward ${target_ward} matches inspector's assigned jurisdiction.`,
        sql_session_stmt: sqlStmt
      };
    }

    // Unauthorized cross-ward write rejected by RLS
    return {
      is_authorized: false,
      policy_enforced: `policy_${resource}_field_inspector_insert (DENIED: Cross-Ward Isolation)`,
      action,
      resource,
      user_role: user.role,
      user_ward: user.assigned_ward_id,
      target_ward,
      reason: `RLS SECURITY VIOLATION: Inspector is assigned to "${user.assigned_ward_id}", but attempted write in "${target_ward}".`,
      sql_session_stmt: sqlStmt
    };
  }

  return {
    is_authorized: false,
    policy_enforced: "policy_default_deny",
    action,
    resource,
    user_role: user.role,
    user_ward: user.assigned_ward_id,
    target_ward,
    reason: "No matching RLS policy permitted this operation.",
    sql_session_stmt: sqlStmt
  };
}

