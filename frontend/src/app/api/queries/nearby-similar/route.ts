import { NextRequest, NextResponse } from "next/server";
import { executeNearbySimilarQuery } from "@/lib/hybrid-queries";
import { HISTORICAL_PRECEDENTS } from "@/lib/precedent-engine";
import { TREES } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const treeId = searchParams.get("tree_id");
  let lat = searchParams.get("lat") ? parseFloat(searchParams.get("lat")!) : 12.9716;
  let lng = searchParams.get("lng") ? parseFloat(searchParams.get("lng")!) : 77.5946;
  let speciesId = searchParams.get("species_id") ? parseInt(searchParams.get("species_id")!, 10) : 1;
  const radius = searchParams.get("radius") ? parseFloat(searchParams.get("radius")!) : 500;
  const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 5;

  if (treeId) {
    const targetTree = TREES.find((t) => t.tree_id === treeId || (t as any).id === treeId || t.tag_number === treeId);
    if (targetTree) {
      lat = targetTree.latitude;
      lng = targetTree.longitude;
      speciesId = targetTree.species_id;
    }
  }

  const defaultVector = HISTORICAL_PRECEDENTS[0].embedding;
  const data = executeNearbySimilarQuery({
    targetLat: lat,
    targetLng: lng,
    speciesId,
    queryVector: defaultVector,
    radiusMeters: Math.max(100, Math.min(2000, radius)),
    limit
  });

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      tree_id,
      lat,
      lng,
      species_id,
      radius_meters = 500,
      embedding,
      limit = 5
    } = body;

    let targetLat = lat != null ? Number(lat) : 12.9716;
    let targetLng = lng != null ? Number(lng) : 77.5946;
    let targetSpeciesId = species_id != null ? Number(species_id) : 1;

    if (tree_id) {
      const targetTree = TREES.find((t) => t.tree_id === tree_id || (t as any).id === tree_id || t.tag_number === tree_id);
      if (targetTree) {
        targetLat = targetTree.latitude;
        targetLng = targetTree.longitude;
        targetSpeciesId = targetTree.species_id;
      }
    }

    let queryVector: number[];
    if (embedding && Array.isArray(embedding) && embedding.length === 512) {
      queryVector = embedding;
    } else {
      queryVector = HISTORICAL_PRECEDENTS[0].embedding;
    }

    const data = executeNearbySimilarQuery({
      targetLat: targetLat,
      targetLng: targetLng,
      speciesId: targetSpeciesId,
      queryVector,
      radiusMeters: Math.max(100, Math.min(2000, Number(radius_meters))),
      limit: Number(limit)
    });

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to execute Hybrid Query 1 (Nearby Visually Similar)" },
      { status: 500 }
    );
  }
}

