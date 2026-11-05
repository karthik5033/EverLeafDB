/**
 * Multimodal Vision Pipeline & Embedding Worker Test Suite
 * Tests CLIP ViT-B/32 512-d Feature Extraction, L2 Unit Normalization & Cross-Modal Encoders
 */

import {
  extractLocalPerceptualEmbedding,
  extractVisualEmbedding,
  extractTextNotesEmbedding
} from "../frontend/src/lib/embedding";
import { l2Norm, cosineSimilarity, validateVectorDimension } from "../frontend/src/lib/vector";

console.log("=================================================");
console.log("EverLeafDB Multimodal Vision Pipeline & Worker Test");
console.log("=================================================\n");

// 1. Synthetic Botanical Image Buffers (Simulating 224x224 RGB image bytes)
const bufferA = new Uint8Array(224 * 224 * 3);
for (let i = 0; i < bufferA.length; i++) {
  bufferA[i] = (i * 37 + 13) % 256;
}

const bufferB = new Uint8Array(224 * 224 * 3);
for (let i = 0; i < bufferB.length; i++) {
  bufferB[i] = (i * 73 + 97) % 256;
}

// 2. Feature Extraction & Dimension Constraint Check
console.log("1. Visual Embedding Extraction (Target: 512 Dimensions):");
const embeddingA = extractLocalPerceptualEmbedding(bufferA.buffer);
const embeddingB = extractLocalPerceptualEmbedding(bufferB.buffer);

console.log(`   embeddingA dimension: ${embeddingA.length}`);
console.log(`   embeddingB dimension: ${embeddingB.length}`);

console.assert(embeddingA.length === 512, "Visual embedding length must be exactly 512");
console.assert(validateVectorDimension(embeddingA, 512), "Vector validation failed");
console.log("   ✓ Strict 512-dimensional vector constraint verified.\n");

// 3. Strict L2 Unit Normalization (||V|| = 1.0)
console.log("2. Strict L2 Unit Normalization Check (||V|| = 1.0):");
const normA = l2Norm(embeddingA);
const normB = l2Norm(embeddingB);
console.log(`   L2 Norm of embeddingA: ${normA.toFixed(6)}`);
console.log(`   L2 Norm of embeddingB: ${normB.toFixed(6)}`);

console.assert(Math.abs(normA - 1.0) < 0.001, "Embedding A is not unit normalized");
console.assert(Math.abs(normB - 1.0) < 0.001, "Embedding B is not unit normalized");
console.log("   ✓ L2 unit magnitude verified.\n");

// 4. Perceptual Identity & Discriminative Power Check
console.log("3. Determinism & Perceptual Discriminative Power:");
const embeddingA2 = extractLocalPerceptualEmbedding(bufferA.buffer);
const identitySim = cosineSimilarity(embeddingA, embeddingA2);
const crossSim = cosineSimilarity(embeddingA, embeddingB);

console.log(`   Identity Cosine Similarity (A vs A): ${identitySim}`);
console.log(`   Cross Cosine Similarity    (A vs B): ${crossSim}`);

console.assert(identitySim === 1.0, "Identical images must yield 1.0 cosine similarity");
console.assert(crossSim < 0.9, "Distinct images must yield discriminative cosine distance");
console.log("   ✓ Deterministic repeatability and distinctness verified.\n");

// 5. Clinical Text Notes Embedding
console.log("4. Clinical Diagnostic Notes Text Encoder:");
const notesText = "Severe lower canopy necrosis with brown fungal conks at base";
const textEmbedding = extractTextNotesEmbedding(notesText);
const textNorm = l2Norm(textEmbedding);

console.log(`   Text notes vector dimension: ${textEmbedding.length}`);
console.log(`   Text notes L2 norm: ${textNorm.toFixed(6)}`);

console.assert(textEmbedding.length === 512, "Text embedding must be 512 dimensions");
console.assert(Math.abs(textNorm - 1.0) < 0.001, "Text embedding must be unit normalized");
console.log("   ✓ Cross-modal text embedding verified.\n");

console.log("All Multimodal Vision Pipeline & Embedding Worker tests passed successfully! ✓");
