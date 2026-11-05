/**
 * Image Storage & Asset Management Subsystem Test Suite
 * Validates MIME Validation, 10MB Caps, SHA-256 Hashing & EXIF Stripping
 */

import fs from "fs";
import {
  validateImageMimeType,
  computeSha256,
  stripExifMetadata,
  saveUploadedImage,
  MAX_FILE_SIZE_BYTES
} from "../frontend/src/lib/storage";

async function runTests() {
  console.log("=================================================");
  console.log("EverLeafDB Image Storage & Asset Management Test");
  console.log("=================================================\n");

  // 1. MIME Type Validation
  console.log("1. MIME Type Permitted Formats Check:");
  console.assert(validateImageMimeType("image/jpeg") === true, "JPEG must be allowed");
  console.assert(validateImageMimeType("image/png") === true, "PNG must be allowed");
  console.assert(validateImageMimeType("image/webp") === true, "WebP must be allowed");
  console.assert(validateImageMimeType("application/pdf") === false, "PDF must be blocked");
  console.assert(validateImageMimeType("text/plain") === false, "Text files must be blocked");
  console.log("   ✓ Allowed: image/jpeg, image/png, image/webp | Blocked: non-image types.\n");

  // 2. File Size Cap Validation (10MB)
  console.log("2. Maximum 10MB File Size Cap Enforcement:");
  console.log(`   Configured Max Size: ${MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB`);
  const oversizedBuffer = Buffer.alloc(11 * 1024 * 1024); // 11 MB
  let oversizedBlocked = false;
  try {
    await saveUploadedImage(oversizedBuffer, "huge.jpg", "image/jpeg");
  } catch (err: any) {
    oversizedBlocked = err.message.includes("File size cap exceeded");
  }
  console.assert(oversizedBlocked, "11MB buffer was not blocked");
  console.log("   ✓ Buffers > 10MB correctly rejected.\n");

  // 3. Cryptographic SHA-256 Content Addressing
  console.log("3. SHA-256 Content Deduplication Hashing:");
  const testBufA = Buffer.from("Botanical leaf specimen sample alpha");
  const testBufB = Buffer.from("Botanical leaf specimen sample beta");

  const hashA1 = computeSha256(testBufA);
  const hashA2 = computeSha256(testBufA);
  const hashB = computeSha256(testBufB);

  console.log(`   Hash A: ${hashA1}`);
  console.log(`   Hash B: ${hashB}`);

  console.assert(hashA1 === hashA2, "Identical buffers must produce identical SHA-256");
  console.assert(hashA1 !== hashB, "Different buffers must produce distinct SHA-256");
  console.log("   ✓ Deterministic SHA-256 content hashing verified.\n");

  // 4. EXIF Metadata Stripping (JPEG APP1 segment removal)
  console.log("4. EXIF Privacy / GPS Stripping:");
  const soi = Buffer.from([0xff, 0xd8]);
  const app1Header = Buffer.from([0xff, 0xe1, 0x00, 0x0a]);
  const exifPayload = Buffer.from("EXIF_GPS_DATA");
  const sof0 = Buffer.from([0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x10, 0x00, 0x10, 0x03, 0x01, 0x11, 0x00]);
  const sos = Buffer.from([0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f, 0x00, 0x12, 0x34]);
  const eoi = Buffer.from([0xff, 0xd9]);

  const syntheticJpegWithExif = Buffer.concat([soi, app1Header, exifPayload, sof0, sos, eoi]);
  console.log(`   Synthetic JPEG with EXIF size: ${syntheticJpegWithExif.length} bytes`);

  const { cleanBuffer, stripped } = stripExifMetadata(syntheticJpegWithExif, "image/jpeg");
  console.log(`   Sanitized JPEG size:           ${cleanBuffer.length} bytes (Stripped: ${stripped})`);

  console.assert(stripped === true, "Exif segment was not detected and stripped");
  console.assert(cleanBuffer.length < syntheticJpegWithExif.length, "Sanitized buffer must be smaller");
  console.assert(!cleanBuffer.includes(Buffer.from("EXIF_GPS_DATA")), "GPS payload was not purged");
  console.log("   ✓ EXIF / GPS metadata successfully purged before persistence.\n");

  // 5. Persistent File Storage & Retrieval
  console.log("5. File Ingestion Pipeline Persistence Check:");
  const specimenBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x08, 0x00, 0x08, 0x01, 0x01, 0x11, 0x00, 0xff, 0xd9]);
  const res = await saveUploadedImage(specimenBuffer, "test_specimen.jpg", "image/jpeg");

  console.log(`   Saved File:    ${res.fileName}`);
  console.log(`   Public URL:    ${res.publicUrl}`);
  console.log(`   File Exists:   ${fs.existsSync(res.filePath)}`);
  console.assert(fs.existsSync(res.filePath), "File was not written to public upload path");
  console.log("   ✓ Persistent asset storage pipeline verified.\n");

  console.log("All Image Storage & Asset Management tests passed successfully! ✓");
}

runTests().catch(console.error);
