import { NextRequest, NextResponse } from "next/server";
import {
  evaluateRlsAccess,
  SYSTEM_USERS,
  getActiveSession
} from "@/lib/auth-rbac";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      action = "INSERT",
      resource = "trees",
      target_ward = "ward_03",
      user_id
    } = body;

    const user = user_id
      ? SYSTEM_USERS.find((u) => u.user_id === user_id)
      : getActiveSession().user;

    const decision = evaluateRlsAccess({
      action,
      resource,
      target_ward,
      user
    });

    return NextResponse.json({
      success: true,
      decision,
      sql_executed: `${decision.sql_session_stmt}\n-- Executing ${action} ON ${resource} in ward '${target_ward}';`
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to evaluate RLS policy" },
      { status: 500 }
    );
  }
}

