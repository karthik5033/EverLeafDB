import { NextRequest, NextResponse } from "next/server";
import {
  getActiveSession,
  setActiveUserSession,
  SYSTEM_USERS
} from "@/lib/auth-rbac";

export async function GET(request: NextRequest) {
  try {
    const session = getActiveSession();
    return NextResponse.json({
      success: true,
      session,
      all_users: SYSTEM_USERS
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve active session" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { user_id } = body;

    if (!user_id) {
      return NextResponse.json(
        { success: false, error: "Missing required parameter: user_id" },
        { status: 400 }
      );
    }

    const session = setActiveUserSession(user_id);
    return NextResponse.json({
      success: true,
      session,
      message: `Switched active session to ${session.user.name} (${session.user.role}).`
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to switch user session" },
      { status: 404 }
    );
  }
}

