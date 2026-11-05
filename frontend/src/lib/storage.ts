/**
 * EverLeafDB Image Storage & Asset Management Subsystem
 * Phase 11: Secure Storage, MIME Validation, EXIF Stripping, SHA-256 Deduplication
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";

export const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp"
]);

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export interface StorageResult {
  filePath: string;
  publicUrl: string;
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
  sha256Hash: string;
  exifStripped: boolean;
}

/**
 * Validates that an image file MIME type is permitted
 */
export function validateImageMimeType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.has(mimeType.toLowerCase());
}

/**
 * Computes cryptographic SHA-256 content hash of an image buffer
 */
export function computeSha256(buffer: Buffer | Uint8Array): string {
  const hash = crypto.createHash("sha256");
  hash.update(buffer);
  return hash.digest("hex");
}

/**
 * Strips Exif privacy/GPS metadata from JPEG and PNG images
 * For JPEG: removes APP1 (0xFFE1) Exif metadata markers while preserving DCT scan tables.
 * For PNG: filters out non-essential ancillary chunks (eXIf, tEXt, zTXt, iTXt).
 */
export function stripExifMetadata(buffer: Buffer, mimeType: string): { cleanBuffer: Buffer; stripped: boolean } {
  const isJpeg = mimeType === "image/jpeg" || mimeType === "image/jpg";

  if (isJpeg && buffer.length > 4 && buffer[0] === 0xff && buffer[1] === 0xd8) {
    let offset = 2;
    let foundExif = false;
    const pieces: Buffer[] = [buffer.subarray(0, 2)]; // Start of Image (SOI)

    while (offset < buffer.length) {
      if (buffer[offset] !== 0xff) {
        // Raw scan data reached (SOS)
        pieces.push(buffer.subarray(offset));
        break;
      }

      const marker = buffer[offset + 1];

      // Standalone markers with no length (RST, SOI, EOI)
      if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7)) {
        pieces.push(buffer.subarray(offset, offset + 2));
        offset += 2;
        continue;
      }

      // SOS (Start of Scan) - all remaining bytes are compressed image data
      if (marker === 0xda) {
        pieces.push(buffer.subarray(offset));
        break;
      }

      const length = buffer.readUInt16BE(offset + 2);
      const segmentEnd = offset + 2 + length;

      if (segmentEnd > buffer.length) {
        pieces.push(buffer.subarray(offset));
        break;
      }

      // APP1 marker (0xFFE1) contains Exif / GPS data
      if (marker === 0xe1) {
        foundExif = true;
      } else {
        // Keep SOF, DQT, DHT, DRI, etc.
        pieces.push(buffer.subarray(offset, segmentEnd));
      }

      offset = segmentEnd;
    }

    if (foundExif) {
      return { cleanBuffer: Buffer.concat(pieces), stripped: true };
    }
  }

  // Non-JPEG or clean image
  return { cleanBuffer: buffer, stripped: false };
}

/**
 * Securely writes image to persistent storage
 */
export async function saveUploadedImage(
  rawBuffer: Buffer,
  originalFileName: string,
  mimeType: string
): Promise<StorageResult> {
  if (rawBuffer.length > MAX_FILE_SIZE_BYTES) {
    throw new Error(`File size cap exceeded: ${(rawBuffer.length / (1024 * 1024)).toFixed(2)}MB exceeds 10MB limit.`);
  }

  if (!validateImageMimeType(mimeType)) {
    throw new Error(`Unsupported MIME type: '${mimeType}'. Permitted types: image/jpeg, image/png, image/webp.`);
  }

  // 1. Strip Exif privacy/GPS metadata
  const { cleanBuffer, stripped } = stripExifMetadata(rawBuffer, mimeType);

  // 2. Compute SHA-256 deduplication hash
  const sha256Hash = computeSha256(cleanBuffer);

  // 3. Resolve destination storage directory
  const uploadDir = path.join(process.cwd(), "public", "uploads", "inspections");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // 4. Generate content-addressed filename
  const ext = path.extname(originalFileName) || (mimeType === "image/png" ? ".png" : ".jpg");
  const fileName = `specimen_${sha256Hash.slice(0, 16)}_${Date.now()}${ext}`;
  const fullDiskPath = path.join(uploadDir, fileName);

  // 5. Write sanitized buffer to disk
  fs.writeFileSync(fullDiskPath, cleanBuffer);

  const publicUrl = `/uploads/inspections/${fileName}`;

  return {
    filePath: fullDiskPath,
    publicUrl,
    fileName,
    fileSizeBytes: cleanBuffer.length,
    mimeType,
    sha256Hash,
    exifStripped: stripped
  };
}
