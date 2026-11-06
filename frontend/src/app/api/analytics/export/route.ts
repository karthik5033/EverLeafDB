import { NextRequest, NextResponse } from "next/server";
import { getWardHealthSummary } from "@/lib/materialized-views";
import { generateExecutiveCsvReport } from "@/lib/executive-analytics";

export async function GET(request: NextRequest) {
  try {
    const summary = getWardHealthSummary(true);
    const csvContent = generateExecutiveCsvReport(summary.data);

    const dateStr = new Date().toISOString().split("T")[0];
    const filename = `everleafdb_executive_canopy_report_${dateStr}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate CSV export" },
      { status: 500 }
    );
  }
}
