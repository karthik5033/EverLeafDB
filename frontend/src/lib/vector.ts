/**
 * EverLeafDB High-Dimensional Vector Operations Engine
 * Spec: pgvector 512-dim float32 embeddings (CLIP ViT-B/32)
 * Phase 5: Vector Columns, Cosine Operators & HNSW Graph Indexing
 */

export type Vector512 = number[];

/**
 * Validates that a vector is strictly 512-dimensional
 */
export function validateVectorDimension(vec: number[], expectedDim = 512): boolean {
  return Array.isArray(vec) && vec.length === expectedDim && vec.every((n) => typeof n === "number" && !isNaN(n));
}

/**
 * Computes vector dot product: A · B = Σ (a_i * b_i)
 */
export function dotProduct(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`Dimension mismatch: vector A (${a.length}) vs vector B (${b.length})`);
  }
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += a[i] * b[i];
  }
  return sum;
}

/**
 * Computes L2 norm (magnitude) of a vector: ||V|| = √(Σ v_i^2)
 */
export function l2Norm(vec: number[]): number {
  let sum = 0;
  for (let i = 0; i < vec.length; i++) {
    sum += vec[i] * vec[i];
  }
  return Math.sqrt(sum);
}

/**
 * Normalizes vector to unit length (L2 norm = 1.0)
 */
export function normalizeVector(vec: number[]): number[] {
  const norm = l2Norm(vec);
  if (norm === 0) return vec.slice();
  return vec.map((v) => v / norm);
}

/**
 * PostGIS pgvector cosine distance operator: <=>
 * cosine_distance = 1.0 - (A · B / (||A|| * ||B||))
 * Range: [0.0, 2.0], where 0.0 means identical angle.
 */
export function cosineDistance(a: number[], b: number[]): number {
  const normA = l2Norm(a);
  const normB = l2Norm(b);
  if (normA === 0 || normB === 0) return 1.0;
  const sim = dotProduct(a, b) / (normA * normB);
  // Clamp for floating point inaccuracy
  const clampedSim = Math.max(-1.0, Math.min(1.0, sim));
  return Math.round((1.0 - clampedSim) * 10000) / 10000;
}

/**
 * Cosine similarity score: 1.0 - cosine_distance
 * Range: [-1.0, 1.0] (1.0 = identical direction)
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  return Math.round((1.0 - cosineDistance(a, b)) * 10000) / 10000;
}

/**
 * PostGIS pgvector Euclidean L2 distance operator: <->
 */
export function euclideanDistance(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`Dimension mismatch: vector A (${a.length}) vs vector B (${b.length})`);
  }
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return Math.round(Math.sqrt(sum) * 10000) / 10000;
}

/**
 * Deterministic pseudo-random 512-d unit vector generator for botanical testing
 * Uses Fowler–Noll–Vo hash to seed an LCG generator producing reproducible CLIP-like embeddings.
 */
export function generateBotanicalEmbedding(seedKey: string, dimension = 512): Vector512 {
  // FNV-1a hash
  let h = 2166136261;
  for (let i = 0; i < seedKey.length; i++) {
    h ^= seedKey.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }

  // Linear Congruential Generator
  let state = h >>> 0;
  const rawVec: number[] = new Array(dimension);

  for (let i = 0; i < dimension; i++) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    // Map to [-1.0, 1.0] range
    rawVec[i] = (state / 4294967296) * 2 - 1;
  }

  return normalizeVector(rawVec);
}

/**
 * Ranks candidate items using cosine distance matching pgvector HNSW index scan
 */
export function rankCandidatesByVector<T extends { embedding: Vector512 }>(
  candidates: T[],
  queryVector: Vector512,
  options: {
    topK?: number;
    minSimilarity?: number;
  } = {}
): Array<T & { cosine_distance: number; similarity_score: number }> {
  const { topK = 5, minSimilarity = 0.0 } = options;

  return candidates
    .map((candidate) => {
      const dist = cosineDistance(queryVector, candidate.embedding);
      const sim = Math.round((1.0 - dist) * 10000) / 10000;
      return {
        ...candidate,
        cosine_distance: dist,
        similarity_score: sim
      };
    })
    .filter((item) => item.similarity_score >= minSimilarity)
    .sort((a, b) => a.cosine_distance - b.cosine_distance)
    .slice(0, topK);
}
