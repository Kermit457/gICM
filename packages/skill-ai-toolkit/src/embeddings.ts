/**
 * Embedding utilities
 * Generate and compare vector embeddings
 */

import { z } from 'zod';

// Types
export type EmbeddingProvider = 'openai' | 'voyage' | 'cohere' | 'local';

export interface EmbeddingResult {
  embedding: number[];
  model: string;
  dimensions: number;
  tokenCount?: number;
}

export interface SimilarityResult {
  score: number;
  index: number;
  id?: string;
}

export const EmbeddingConfigSchema = z.object({
  provider: z.enum(['openai', 'voyage', 'cohere', 'local']).default('openai'),
  model: z.string().optional(),
  dimensions: z.number().optional(),
  batchSize: z.number().default(100),
});

export type EmbeddingConfig = z.infer<typeof EmbeddingConfigSchema>;

// Provider-specific model defaults
const PROVIDER_DEFAULTS: Record<EmbeddingProvider, { model: string; dimensions: number }> = {
  openai: { model: 'text-embedding-3-small', dimensions: 1536 },
  voyage: { model: 'voyage-2', dimensions: 1024 },
  cohere: { model: 'embed-english-v3.0', dimensions: 1024 },
  local: { model: 'all-MiniLM-L6-v2', dimensions: 384 },
};

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`Vector dimensions must match: ${a.length} vs ${b.length}`);
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  return magnitude === 0 ? 0 : dotProduct / magnitude;
}

/**
 * Calculate euclidean distance between two vectors
 */
export function euclideanDistance(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`Vector dimensions must match: ${a.length} vs ${b.length}`);
  }

  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }

  return Math.sqrt(sum);
}

/**
 * Find most similar embeddings from a collection
 */
export function findSimilar(
  queryEmbedding: number[],
  embeddings: number[][],
  topK = 5,
  ids?: string[]
): SimilarityResult[] {
  const similarities = embeddings.map((emb, index) => ({
    score: cosineSimilarity(queryEmbedding, emb),
    index,
    id: ids?.[index],
  }));

  similarities.sort((a, b) => b.score - a.score);
  return similarities.slice(0, topK);
}

/**
 * Normalize an embedding vector to unit length
 */
export function normalizeEmbedding(embedding: number[]): number[] {
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  if (magnitude === 0) return embedding;
  return embedding.map(val => val / magnitude);
}

/**
 * Average multiple embeddings (e.g., for document-level embedding)
 */
export function averageEmbeddings(embeddings: number[][]): number[] {
  if (embeddings.length === 0) {
    throw new Error('Cannot average empty embedding array');
  }

  const dimensions = embeddings[0].length;
  const result = new Array(dimensions).fill(0);

  for (const embedding of embeddings) {
    for (let i = 0; i < dimensions; i++) {
      result[i] += embedding[i];
    }
  }

  return result.map(val => val / embeddings.length);
}

/**
 * Get provider configuration
 */
export function getProviderConfig(provider: EmbeddingProvider) {
  return PROVIDER_DEFAULTS[provider];
}

/**
 * Create embedding request body for different providers
 */
export function createEmbeddingRequest(
  texts: string[],
  config: Partial<EmbeddingConfig> = {}
): {
  url: string;
  body: Record<string, unknown>;
  headers: Record<string, string>;
} {
  const { provider, model } = EmbeddingConfigSchema.parse(config);
  const defaults = PROVIDER_DEFAULTS[provider];

  switch (provider) {
    case 'openai':
      return {
        url: 'https://api.openai.com/v1/embeddings',
        body: {
          model: model || defaults.model,
          input: texts,
        },
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ${OPENAI_API_KEY}',
        },
      };

    case 'voyage':
      return {
        url: 'https://api.voyageai.com/v1/embeddings',
        body: {
          model: model || defaults.model,
          input: texts,
        },
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ${VOYAGE_API_KEY}',
        },
      };

    case 'cohere':
      return {
        url: 'https://api.cohere.ai/v1/embed',
        body: {
          model: model || defaults.model,
          texts,
          input_type: 'search_document',
        },
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ${COHERE_API_KEY}',
        },
      };

    default:
      throw new Error(`Provider ${provider} not supported`);
  }
}

/**
 * Simple in-memory vector store
 */
export function createVectorStore() {
  const store: Map<string, { embedding: number[]; metadata: Record<string, unknown> }> = new Map();

  return {
    /**
     * Add embedding with ID and metadata
     */
    add(id: string, embedding: number[], metadata: Record<string, unknown> = {}) {
      store.set(id, { embedding: normalizeEmbedding(embedding), metadata });
    },

    /**
     * Search for similar embeddings
     */
    search(queryEmbedding: number[], topK = 5): Array<{
      id: string;
      score: number;
      metadata: Record<string, unknown>;
    }> {
      const normalized = normalizeEmbedding(queryEmbedding);
      const results: Array<{ id: string; score: number; metadata: Record<string, unknown> }> = [];

      store.forEach((value, id) => {
        const score = cosineSimilarity(normalized, value.embedding);
        results.push({ id, score, metadata: value.metadata });
      });

      results.sort((a, b) => b.score - a.score);
      return results.slice(0, topK);
    },

    /**
     * Get embedding by ID
     */
    get(id: string) {
      return store.get(id);
    },

    /**
     * Delete embedding by ID
     */
    delete(id: string) {
      return store.delete(id);
    },

    /**
     * Clear all embeddings
     */
    clear() {
      store.clear();
    },

    /**
     * Get store size
     */
    get size() {
      return store.size;
    },
  };
}
