import { NextRequest, NextResponse } from "next/server";
import { executeTreeMortalityDriversQuery } from "@/lib/mortality-analytics";

export async function GET() {
  const data = executeTreeMortalityDriversQuery();
  return NextResponse.json(data);
}

export async function POST() {
  const data = executeTreeMortalityDriversQuery();
  return NextResponse.json(data);
}
