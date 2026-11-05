import { NextRequest, NextResponse } from "next/server";
import { executeTreatmentEfficacyRanking } from "@/lib/treatment-analytics";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const diseaseId = searchParams.get("disease_id") ? parseInt(searchParams.get("disease_id")!, 10) : undefined;

  const data = executeTreatmentEfficacyRanking(diseaseId);
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const diseaseId = body.disease_id ? Number(body.disease_id) : undefined;

    const data = executeTreatmentEfficacyRanking(diseaseId);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to execute treatment efficacy analytics query" },
      { status: 500 }
    );
  }
}
