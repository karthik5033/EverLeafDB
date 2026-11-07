import { NextRequest, NextResponse } from "next/server";
import {
  submitCitizenReport,
  lookupCitizenReport,
  listCitizenReports,
  CreateCitizenReportInput
} from "@/lib/citizen-reporting";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const trackingCode = searchParams.get("code");

    // Case 1: Public tracking lookup by code
    if (trackingCode) {
      const report = lookupCitizenReport(trackingCode);
      if (!report) {
        return NextResponse.json(
          {
            success: false,
            error: `No report found matching tracking code '${trackingCode}'. Please verify your code.`
          },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        report
      });
    }

    // Case 2: Supervisor triage queue filter list
    const wardId = searchParams.get("ward_id") || undefined;
    const status = searchParams.get("status") || undefined;
    const urgency = searchParams.get("urgency") || undefined;
    const search = searchParams.get("search") || undefined;

    const reports = listCitizenReports({
      ward_id: wardId,
      status,
      urgency,
      search
    });

    return NextResponse.json({
      success: true,
      count: reports.length,
      reports
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to process citizen reports request."
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateCitizenReportInput = await request.json();

    if (!body.description || !body.address_landmark || body.latitude === undefined || body.longitude === undefined || !body.hazard_category) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: description, address_landmark, hazard_category, latitude, and longitude are required."
        },
        { status: 400 }
      );
    }

    const report = submitCitizenReport(body);

    return NextResponse.json(
      {
        success: true,
        message: "Community tree hazard report submitted successfully.",
        report
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to submit citizen report."
      },
      { status: 400 }
    );
  }
}
