import { NextRequest, NextResponse } from "next/server";
import { saveUploadedImage, ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES } from "@/lib/storage";
import { extractVisualEmbedding } from "@/lib/embedding";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No image file provided in form data." },
        { status: 400 }
      );
    }

    // 1. Validate MIME type
    if (!ALLOWED_MIME_TYPES.has(file.type.toLowerCase())) {
      return NextResponse.json(
        {
          success: false,
          error: `Unsupported MIME type: '${file.type}'. Allowed types: image/jpeg, image/png, image/webp.`
        },
        { status: 415 }
      );
    }

    // 2. Validate file size cap (10MB)
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        {
          success: false,
          error: `File size ${(file.size / (1024 * 1024)).toFixed(2)}MB exceeds maximum 10MB limit.`
        },
        { status: 413 }
      );
    }

    // 3. Read buffer
    const arrayBuffer = await file.arrayBuffer();
    const rawBuffer = Buffer.from(arrayBuffer);

    // 4. Save to persistent storage with Exif stripping and SHA-256 deduplication
    const storageResult = await saveUploadedImage(rawBuffer, file.name, file.type);

    // 5. Extract 512-dimensional CLIP ViT-B/32 feature embedding
    const embeddingResult = await extractVisualEmbedding(rawBuffer, file.name);

    return NextResponse.json({
      success: true,
      message: "Inspection photograph securely ingested and vectorized.",
      file: {
        public_url: storageResult.publicUrl,
        file_name: storageResult.fileName,
        file_size_bytes: storageResult.fileSizeBytes,
        mime_type: storageResult.mimeType,
        sha256_hash: storageResult.sha256Hash,
        exif_stripped: storageResult.exifStripped
      },
      vector: {
        dimension: embeddingResult.dimension,
        l2_norm: embeddingResult.l2_norm,
        embedding_source: embeddingResult.source,
        embedding: embeddingResult.embedding
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process image upload." },
      { status: 500 }
    );
  }
}

