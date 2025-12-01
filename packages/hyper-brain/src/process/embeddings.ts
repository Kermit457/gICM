/**
 * Embedding Generator
 *
 * Generates vector embeddings for semantic search.
 */

import { Logger } from "../utils/logger.js";

export class EmbeddingGenerator {
  private logger = new Logger("Embeddings");
  private cache: Map<string, number[]> = new Map();
  private model: string;

  constructor(model: string = "text-embedding-3-small") {
    this.model = model;
  }

  /**
   * Generate embedding for text
   */
  async embed(text: string): Promise<number[]> {
    // Check cache
    const cacheKey = this.hashText(text);
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Generate embedding
    const embedding = await this.generateEmbedding(text);

    // Cache
    this.cache.set(cacheKey, embedding);

    return embedding;
  }

  /**
   * Embed multiple texts in batch
   */
  async embedBatch(texts: string[]): Promise<number[][]> {
    return Promise.all(texts.map((t) => this.embed(t)));
  }

  /**
   * Generate embedding using API
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      // Return mock embedding for development
      this.logger.warn("OpenAI API key not set, using mock embedding");
      return this.mockEmbedding(text);
    }

    try {
      const response = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.model,
          input: text.slice(0, 8000), // Truncate if too long
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API returned ${response.status}`);
      }

      const data = await response.json() as {
        data: Array<{ embedding: number[] }>;
      };

      return data.data[0].embedding;
    } catch (error) {
      this.logger.error(`Embedding failed: ${error}`);
      return this.mockEmbedding(text);
    }
  }

  /**
   * Generate mock embedding for development
   */
  private mockEmbedding(text: string): number[] {
    // Generate deterministic mock embedding based on text hash
    const dimensions = 1536; // text-embedding-3-small dimensions
    const embedding: number[] = [];
    let hash = 0;

    for (let i = 0; i < text.length; i++) {
      hash = (hash << 5) - hash + text.charCodeAt(i);
      hash = hash & hash;
    }

    const rng = this.seededRandom(hash);
    for (let i = 0; i < dimensions; i++) {
      embedding.push(rng() * 2 - 1); // -1 to 1
    }

    // Normalize
    const magnitude = Math.sqrt(
      embedding.reduce((sum, val) => sum + val * val, 0)
    );
    return embedding.map((val) => val / magnitude);
  }

  /**
   * Seeded random number generator
   */
  private seededRandom(seed: number): () => number {
    return () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };
  }

  /**
   * Calculate cosine similarity between embeddings
   */
  static cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error("Embeddings must have same dimensions");
    }

    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      magnitudeA += a[i] * a[i];
      magnitudeB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));
  }

  /**
   * Simple text hash for caching
   */
  private hashText(text: string): string {
    let hash = 0;
    for (let i = 0; i < Math.min(text.length, 1000); i++) {
      hash = (hash << 5) - hash + text.charCodeAt(i);
      hash = hash & hash;
    }
    return hash.toString();
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  getCacheSize(): number {
    return this.cache.size;
  }
}
