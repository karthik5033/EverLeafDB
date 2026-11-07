import { NextRequest, NextResponse } from "next/server";
import { resetDemoDataState } from "@/lib/demo-sandbox";

export async function POST(request: NextRequest) {
  try {
    const result = resetDemoDataState();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to reset demo database state."
      },
      { status: 500 }
    );
  }
}
