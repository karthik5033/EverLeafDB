import { NextRequest, NextResponse } from "next/server";
import { executeContagionClustersQuery } from "@/lib/hybrid-queries";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const radius = searchParams.get("radius") ? parseFloat(searchParams.get("radius")!) : 500;
  const threshold = searchParams.get("threshold") ? parseFloat(searchParams.get("threshold")!) : 0.82;
  const days = searchParams.get("days") ? parseInt(searchParams.get("days")!, 10) : 365;

  const data = executeContagionClustersQuery({
    dangerRadiusMeters: radius,
    similarityThreshold: threshold,
    untreatedDays: days
  });

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { danger_radius_meters = 500, similarity_threshold = 0.82, untreated_days = 365 } = body;

    const data = executeContagionClustersQuery({
      dangerRadiusMeters: Number(danger_radius_meters),
      similarityThreshold: Number(similarity_threshold),
      untreatedDays: Number(untreated_days)
    });

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to execute Hybrid Query 3 (Contagion Clusters)" },
      { status: 500 }
    );
  }
}
