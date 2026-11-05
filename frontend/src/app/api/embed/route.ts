import { NextRequest, NextResponse } from "next/server";
import { extractVisualEmbedding, extractTextNotesEmbedding } from "@/lib/embedding";
import { l2Norm } from "@/lib/vector";

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";

    // 1. JSON payload with text notes or image URL
    if (contentType.includes("application/json")) {
      const body = await request.json();
      const { text, notes, image_url } = body;

      if (text || notes) {
        const textPayload = text || notes;
        const embedding = extractTextNotesEmbedding(textPayload);
        return NextResponse.json({
          success: true,
          type: "text_notes_embedding",
          dimension: embedding.length,
          l2_norm: Math.round(l2Norm(embedding) * 10000) / 10000,
          model: "CLIP ViT-B/32 (Text Encoder)",
          embedding
        });
      }

      if (image_url) {
        // Fetch remote or local image
        const imgRes = await fetch(image_url);
        const arrayBuf = await imgRes.arrayBuffer();
        const res = await extractVisualEmbedding(arrayBuf);
        return NextResponse.json({
          success: true,
          type: "image_visual_embedding",
          ...res
        });
      }
    }

    // 2. Multipart form data with uploaded image file
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;

      if (!file) {
        return NextResponse.json(
          { success: false, error: "No file attached to multipart request." },
          { status: 400 }
        );
      }

      const buffer = await file.arrayBuffer();
      const res = await extractVisualEmbedding(buffer, file.name);

      return NextResponse.json({
        success: true,
        type: "image_visual_embedding",
        fileName: file.name,
        fileSize: file.size,
        ...res
      });
    }

    // 3. Raw binary body
    const arrayBuffer = await request.arrayBuffer();
    if (arrayBuffer.byteLength > 0) {
      const res = await extractVisualEmbedding(arrayBuffer);
      return NextResponse.json({
        success: true,
        type: "binary_image_embedding",
        ...res
      });
    }

    return NextResponse.json(
      { success: false, error: "Unsupported request format. Provide multipart image or JSON." },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Embedding generation failed" },
      { status: 500 }
    );
  }
}
