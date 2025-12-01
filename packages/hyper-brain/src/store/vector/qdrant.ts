/**
 * Qdrant Vector Store Adapter
 *
 * Open-source vector database with filtering and payload support.
 * Requires @qdrant/js-client-rest package.
 */

import { Logger } from "../../utils/logger.js";
import type { EmbeddingGenerator } from "../../process/embeddings.js";
import type { KnowledgeItem, SearchResult } from "../../types/index.js";
import type { VectorStore } from "./index.js";

// Qdrant types (from @qdrant/js-client-rest)
interface QdrantPoint {
  id: string;
  vector: number[];
  payload?: Record<string, unknown>;
}

interface QdrantSearchResult {
  id: string;
  score: number;
  payload?: Record<string, unknown>;
  vector?: number[];
}

export interface QdrantConfig {
  url: string; // Qdrant server URL (e.g., "http://localhost:6333")
  apiKey?: string; // Optional API key for Qdrant Cloud
  collectionName: string;
  dimension?: number; // Vector dimension (default: 768 for Gemini)
  https?: boolean; // Use HTTPS
}

export class QdrantVectorStore implements VectorStore {
  private logger = new Logger("QdrantVectorStore");
  private config: QdrantConfig;
  private client: any; // QdrantClient
  private collectionName: string;
  private localCache: Map<string, KnowledgeItem> = new Map();
  private initialized = false;

  constructor(config: QdrantConfig) {
    this.config = {
      dimension: 768, // Default for Gemini embeddings
      ...config,
    };
    this.collectionName = this.config.collectionName;
  }

  /**
   * Initialize Qdrant connection
   */
  async init(): Promise<void> {
    try {
      // Dynamic import to avoid bundling issues
      const { QdrantClient } = await import("@qdrant/js-client-rest");

      this.client = new QdrantClient({
        url: this.config.url,
        apiKey: this.config.apiKey,
        https: this.config.https,
      });

      // Check if collection exists, create if not
      const collections = await this.client.getCollections();
      const exists = collections.collections.some(
        (c: { name: string }) => c.name === this.collectionName
      );

      if (!exists) {
        await this.client.createCollection(this.collectionName, {
          vectors: {
            size: this.config.dimension!,
            distance: "Cosine",
          },
        });
        this.logger.info(`Created collection: ${this.collectionName}`);
      }

      // Get collection info
      const info = await this.client.getCollection(this.collectionName);
      const vectorCount = info.points_count ?? 0;

      this.initialized = true;
      this.logger.info(
        `Qdrant initialized: collection=${this.collectionName}, vectors=${vectorCount}`
      );
    } catch (error) {
      const err = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to initialize Qdrant: ${err}`);

      // Check if it's a missing package error
      if (err.includes("Cannot find module") || err.includes("MODULE_NOT_FOUND")) {
        throw new Error(
          "Qdrant package not installed. Run: pnpm add @qdrant/js-client-rest"
        );
      }

      throw error;
    }
  }

  /**
   * Add item to Qdrant
   */
  async add(item: KnowledgeItem): Promise<void> {
    this.ensureInitialized();

    await this.client.upsert(this.collectionName, {
      wait: true,
      points: [
        {
          id: item.id,
          vector: item.embedding,
          payload: this.serializePayload(item),
        },
      ],
    });

    this.localCache.set(item.id, item);
    this.logger.debug(`Added vector: ${item.id}`);
  }

  /**
   * Add multiple items in batch
   */
  async addBatch(items: KnowledgeItem[]): Promise<void> {
    this.ensureInitialized();

    if (items.length === 0) return;

    // Qdrant supports large batches, but we'll chunk at 100 for safety
    const batchSize = 100;
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const points: QdrantPoint[] = batch.map((item) => ({
        id: item.id,
        vector: item.embedding,
        payload: this.serializePayload(item),
      }));

      await this.client.upsert(this.collectionName, {
        wait: true,
        points,
      });

      // Update local cache
      for (const item of batch) {
        this.localCache.set(item.id, item);
      }
    }

    this.logger.info(`Added ${items.length} vectors in batches`);
  }

  /**
   * Get item by ID (from local cache)
   */
  get(id: string): KnowledgeItem | undefined {
    return this.localCache.get(id);
  }

  /**
   * Delete item from Qdrant
   */
  delete(id: string): boolean {
    this.ensureInitialized();

    try {
      // Fire and forget - Qdrant delete is async
      this.client.delete(this.collectionName, {
        wait: false,
        points: [id],
      });
      this.localCache.delete(id);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Search by vector similarity
   */
  async search(
    queryEmbedding: number[],
    limit: number = 10,
    minScore: number = 0
  ): Promise<SearchResult[]> {
    this.ensureInitialized();

    const results = await this.client.search(this.collectionName, {
      vector: queryEmbedding,
      limit: limit * 2, // Over-fetch to filter by minScore
      with_payload: true,
      with_vector: false,
      score_threshold: minScore > 0 ? minScore : undefined,
    });

    const searchResults: SearchResult[] = [];

    for (const match of results as QdrantSearchResult[]) {
      if (match.score < minScore) continue;

      // Reconstruct item from payload
      const item = this.deserializePayload(match.id as string, match.payload);
      if (item) {
        searchResults.push({
          ...item,
          score: match.score,
        });
      }
    }

    return searchResults.slice(0, limit);
  }

  /**
   * Search by text query
   */
  async searchText(
    query: string,
    embedder: EmbeddingGenerator,
    limit: number = 10
  ): Promise<SearchResult[]> {
    const queryEmbedding = await embedder.embed(query);
    return this.search(queryEmbedding, limit);
  }

  /**
   * Filter by predicate (local cache only)
   */
  filter(predicate: (item: KnowledgeItem) => boolean): KnowledgeItem[] {
    return Array.from(this.localCache.values()).filter(predicate);
  }

  /**
   * Get all items (local cache only)
   */
  getAll(): KnowledgeItem[] {
    return Array.from(this.localCache.values());
  }

  /**
   * Get count (local cache)
   */
  count(): number {
    return this.localCache.size;
  }

  /**
   * Save (no-op for Qdrant - data is persisted automatically)
   */
  async save(): Promise<void> {
    // Qdrant auto-persists with wait: true
    this.logger.debug("Qdrant auto-persists data");
  }

  /**
   * Clear all vectors in collection
   */
  clear(): void {
    this.ensureInitialized();

    // Delete all points by recreating collection
    this.client
      .deleteCollection(this.collectionName)
      .then(() => {
        return this.client.createCollection(this.collectionName, {
          vectors: {
            size: this.config.dimension!,
            distance: "Cosine",
          },
        });
      })
      .catch((err: Error) => {
        this.logger.error(`Failed to clear collection: ${err.message}`);
      });

    this.localCache.clear();
    this.logger.info(`Cleared collection: ${this.collectionName}`);
  }

  /**
   * Shutdown
   */
  async shutdown(): Promise<void> {
    this.localCache.clear();
    this.initialized = false;
    this.logger.info("Qdrant connection closed");
  }

  // ============================================================================
  // FILTERING (Qdrant's powerful feature)
  // ============================================================================

  /**
   * Search with Qdrant filter conditions
   */
  async searchWithFilter(
    queryEmbedding: number[],
    filter: Record<string, unknown>,
    limit: number = 10
  ): Promise<SearchResult[]> {
    this.ensureInitialized();

    const results = await this.client.search(this.collectionName, {
      vector: queryEmbedding,
      limit,
      with_payload: true,
      filter,
    });

    const searchResults: SearchResult[] = [];

    for (const match of results as QdrantSearchResult[]) {
      const item = this.deserializePayload(match.id as string, match.payload);
      if (item) {
        searchResults.push({
          ...item,
          score: match.score,
        });
      }
    }

    return searchResults;
  }

  /**
   * Search by topic
   */
  async searchByTopic(
    queryEmbedding: number[],
    topic: string,
    limit: number = 10
  ): Promise<SearchResult[]> {
    return this.searchWithFilter(
      queryEmbedding,
      {
        must: [
          {
            key: "topics",
            match: { any: [topic] },
          },
        ],
      },
      limit
    );
  }

  /**
   * Search by source type
   */
  async searchBySource(
    queryEmbedding: number[],
    sourceType: string,
    limit: number = 10
  ): Promise<SearchResult[]> {
    return this.searchWithFilter(
      queryEmbedding,
      {
        must: [
          {
            key: "source_type",
            match: { value: sourceType },
          },
        ],
      },
      limit
    );
  }

  /**
   * Search recent items (within time range)
   */
  async searchRecent(
    queryEmbedding: number[],
    sinceTimestamp: number,
    limit: number = 10
  ): Promise<SearchResult[]> {
    return this.searchWithFilter(
      queryEmbedding,
      {
        must: [
          {
            key: "timestamp",
            range: { gte: sinceTimestamp },
          },
        ],
      },
      limit
    );
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private ensureInitialized(): void {
    if (!this.initialized || !this.client) {
      throw new Error("Qdrant not initialized. Call init() first.");
    }
  }

  /**
   * Serialize KnowledgeItem to Qdrant payload
   */
  private serializePayload(item: KnowledgeItem): Record<string, unknown> {
    return {
      // Source
      source_type: item.source.type,
      source_name: item.source.name,
      source_url: item.source.url ?? "",
      source_credibility: item.source.credibility,

      // Content
      content_raw: item.content.raw.slice(0, 30000), // Qdrant has larger payload limits
      content_summary: item.content.summary,
      content_type: item.content.type,

      // Classification
      topics: item.topics,
      sentiment: item.sentiment,
      importance: item.importance,

      // Temporal
      timestamp: item.timestamp,
      expiresAt: item.expiresAt ?? 0,
      decayRate: item.decayRate,

      // Meta
      processed: item.processed,
      quality: item.quality,

      // Entities (Qdrant supports nested objects)
      entities: item.entities,
      relationships: item.relationships,
    };
  }

  /**
   * Deserialize Qdrant payload to KnowledgeItem
   */
  private deserializePayload(
    id: string,
    payload?: Record<string, unknown>
  ): KnowledgeItem | null {
    if (!payload) return null;

    try {
      return {
        id,
        source: {
          type: payload.source_type as any,
          name: payload.source_name as string,
          url: (payload.source_url as string) || undefined,
          credibility: payload.source_credibility as number,
        },
        content: {
          raw: payload.content_raw as string,
          summary: payload.content_summary as string,
          type: payload.content_type as any,
        },
        embedding: [], // Not stored in payload
        entities: (payload.entities as any[]) || [],
        relationships: (payload.relationships as any[]) || [],
        topics: (payload.topics as string[]) || [],
        sentiment: payload.sentiment as number,
        importance: payload.importance as number,
        timestamp: payload.timestamp as number,
        expiresAt: (payload.expiresAt as number) || undefined,
        decayRate: payload.decayRate as number,
        processed: payload.processed as boolean,
        quality: payload.quality as number,
      };
    } catch (error) {
      this.logger.error(`Failed to deserialize payload for ${id}: ${error}`);
      return null;
    }
  }
}
