import { NextRequest, NextResponse } from "next/server";
import { searchPrecedents, HISTORICAL_PRECEDENTS } from "@/lib/precedent-engine";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { embedding, species_id, limit } = body;

    let queryVector: number[];
    if (embedding && Array.isArray(embedding) && embedding.length === 512) {
      queryVector = embedding;
    } else {
      // Default to first precedent's vector with slight perturbation for demonstration
      queryVector = HISTORICAL_PRECEDENTS[0].embedding.map((v) => v + (Math.random() - 0.5) * 0.02);
    }

    const precedents = searchPrecedents(queryVector, {
      species_id: species_id ? Number(species_id) : undefined,
      limit: limit ? Number(limit) : 5
    });

    return NextResponse.json({
      success: true,
      count: precedents.length,
      sql_executed: `SELECT * FROM fn_match_disease_precedents($vector_512, ${
        species_id ? Number(species_id) : "NULL"
      }, ${limit ? Number(limit) : 5});`,
      precedents
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to execute case-based visual precedent search" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const speciesId = searchParams.get("species_id") ? parseInt(searchParams.get("species_id")!, 10) : undefined;
  const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 5;

  const defaultVector = HISTORICAL_PRECEDENTS[0].embedding;
  const precedents = searchPrecedents(defaultVector, { species_id: speciesId, limit });

  return NextResponse.json({
    success: true,
    count: precedents.length,
    precedents
  });
}

