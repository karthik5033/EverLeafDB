import { NextRequest, NextResponse } from "next/server";
import { executeOverdueInspectionsQuery } from "@/lib/mortality-analytics";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const overdueDays = searchParams.get("overdue_days") ? parseInt(searchParams.get("overdue_days")!, 10) : 180;
  const wardId = searchParams.get("ward_id") || undefined;

  const data = executeOverdueInspectionsQuery({ overdueDays, wardId });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { overdue_days = 180, ward_id } = body;

    const data = executeOverdueInspectionsQuery({
      overdueDays: Number(overdue_days),
      wardId: ward_id
    });
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to execute overdue inspections query" },
      { status: 500 }
    );
  }
}
