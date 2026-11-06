import { NextRequest, NextResponse } from "next/server";
import { getTriageAlertById } from "@/lib/triage-engine";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const alert = getTriageAlertById(id);

    if (!alert) {
      return NextResponse.json(
        { success: false, error: `Alert with ID "${id}" not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      alert,
      sql_executed: `SELECT * FROM fn_get_triage_precedent_comparison('${id}');`
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to retrieve alert triage details" },
      { status: 500 }
    );
  }
}
