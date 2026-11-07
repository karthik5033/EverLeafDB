import { NextRequest, NextResponse } from "next/server";
import {
  updateCitizenReportStatus,
  CitizenReportStatus
} from "@/lib/citizen-reporting";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { status, supervisor_notes } = body;

    if (!status) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required 'status' field."
        },
        { status: 400 }
      );
    }

    const updated = updateCitizenReportStatus(
      id,
      status as CitizenReportStatus,
      supervisor_notes
    );

    return NextResponse.json({
      success: true,
      message: `Citizen report ${updated.tracking_code} updated to status '${status}'.`,
      report: updated
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update citizen report."
      },
      { status: 400 }
    );
  }
}

