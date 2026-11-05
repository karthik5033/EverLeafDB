import { NextRequest, NextResponse } from "next/server";
import { executeWardDiseaseSearchQuery } from "@/lib/hybrid-queries";
import { HISTORICAL_PRECEDENTS } from "@/lib/precedent-engine";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const wardId = searchParams.get("ward_id") || "ward_03";
  const speciesId = searchParams.get("species_id") ? parseInt(searchParams.get("species_id")!, 10) : 1;
  const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 5;

  const defaultVector = HISTORICAL_PRECEDENTS[0].embedding;
  const data = executeWardDiseaseSearchQuery({
    wardId,
    speciesId,
    queryVector: defaultVector,
    limit
  });

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { ward_id = "ward_03", species_id = 1, embedding, limit = 5 } = body;

    let queryVector: number[];
    if (embedding && Array.isArray(embedding) && embedding.length === 512) {
      queryVector = embedding;
    } else {
      queryVector = HISTORICAL_PRECEDENTS[0].embedding;
    }

    const data = executeWardDiseaseSearchQuery({
      wardId: ward_id,
      speciesId: Number(species_id),
      queryVector,
      limit: Number(limit)
    });

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to execute Hybrid Query 2 (Ward-Level Disease Search)" },
      { status: 500 }
    );
  }
}
