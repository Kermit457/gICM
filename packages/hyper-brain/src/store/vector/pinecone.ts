/**
 * Pinecone Vector Store Adapter
 *
 * Cloud-based vector store with scalable similarity search.
 * Requires @pinecone-database/pinecone package.
 */

import { Logger } from "../../utils/logger.js";
import type { EmbeddingGenerator } from "../../process/embeddings.js";
import type { KnowledgeItem, SearchResult } from "../../types/index.js";
import type { VectorStore } from "./index.js";

// Pinecone types (from @pinecone-database/pinecone)
interface PineconeVector {
  id: string;
  values: number[];
  metadata?: Record<string, unknown>;
}

interface PineconeQueryResult {
  matches: Array<{
    id: string;
    score: number;
    values?: number[];
    metadata?: Record<string, unknown>;
  }>;
}

interface PineconeIndex {
  namespace(name: string): PineconeNamespace;
  describeIndexStats(): Promise<{ namespaces?: Record<string, { vectorCount: number }> }>;
}

interface PineconeNamespace {
  upsert(vectors: PineconeVector[]): Promise<void>;
  query(params: {
    vector: number[];
    topK: number;
    includeMetadata?: boolean;
    includeValues?: boolean;
    filter?: Record<string, unknown>;
  }): Promise<PineconeQueryResult>;
  deleteOne(id: string): Promise<void>;
  deleteMany(ids: string[]): Promise<void>;
  deleteAll(): Promise<void>;
}

export interface PineconeConfig {
  apiKey: string;
  environment?: string; // Deprecated, use host instead
  host?: string; // Pinecone index host URL
  indexName: string;
  namespace?: string;
  dimension?: number; // Vector dimension (default: 1536 for OpenAI, 768 for Gemini)
}

export class PineconeVectorStore implements VectorStore {
  private logger = new Logger("PineconeVectorStore");
  private config: PineconeConfig;
  private client: any; // Pinecone client
  private index: PineconeIndex | null = null;
  private namespace: string;
  private localCache: Map<string, KnowledgeItem> = new Map();
  private initialized = false;

  constructor(config: PineconeConfig) {
    this.config = {
      dimension: 768, // Default for Gemini embeddings
      namespace: "default",
      ...config,
    };
    this.namespace = this.config.namespace!;
  }

  /**
   * Initialize Pinecone connection
   */
  async init(): Promise<void> {
    try {
      // Dynamic import to avoid bundling issues
      const { Pinecone } = await import("@pinecone-database/pinecone");

      this.client = new Pinecone({
        apiKey: this.config.apiKey,
      });

      // Get or create the index
      this.index = this.client.index(this.config.indexName) as PineconeIndex;

      // Verify connection
      const stats = await this.index!.describeIndexStats();
      const vectorCount = stats.namespaces?.[this.namespace]?.vectorCount ?? 0;

      this.initialized = true;
      this.logger.info(
        `Pinecone initialized: index=${this.config.indexName}, namespace=${this.namespace}, vectors=${vectorCount}`
      );
    } catch (error) {
      const err = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to initialize Pinecone: ${err}`);

      // Check if it's a missing package error
      if (err.includes("Cannot find module") || err.includes("MODULE_NOT_FOUND")) {
        throw new Error(
          "Pinecone package not installed. Run: pnpm add @pinecone-database/pinecone"
        );
      }

      throw error;
    }
  }

  /**
   * Add item to Pinecone
   */
  async add(item: KnowledgeItem): Promise<void> {
    this.ensureInitialized();

    const vector: PineconeVector = {
      id: item.id,
      values: item.embedding,
      metadata: this.serializeMetadata(item),
    };

    await this.index!.namespace(this.namespace).upsert([vector]);
    this.localCache.set(item.id, item);

    this.logger.debug(`Added vector: ${item.id}`);
  }

  /**
   * Add multiple items in batch
   */
  async addBatch(items: KnowledgeItem[]): Promise<void> {
    this.ensureInitialized();

    if (items.length === 0) return;

    // Pinecone supports batches of up to 100 vectors
    const batchSize = 100;
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const vectors: PineconeVector[] = batch.map((item) => ({
        id: item.id,
        values: item.embedding,
        metadata: this.serializeMetadata(item),
      }));

      await this.index!.namespace(this.namespace).upsert(vectors);

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
   * Delete item from Pinecone
   */
  delete(id: string): boolean {
    this.ensureInitialized();

    try {
      // Fire and forget - Pinecone delete is async
      this.index!.namespace(this.namespace).deleteOne(id);
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

    const result = await this.index!.namespace(this.namespace).query({
      vector: queryEmbedding,
      topK: limit * 2, // Over-fetch to filter by minScore
      includeMetadata: true,
      includeValues: false,
    });

    const results: SearchResult[] = [];

    for (const match of result.matches) {
      if (match.score < minScore) continue;

      // Reconstruct item from metadata
      const item = this.deserializeMetadata(match.id, match.metadata);
      if (item) {
        results.push({
          ...item,
          score: match.score,
        });
      }
    }

    return results.slice(0, limit);
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
   * Save (no-op for Pinecone - data is persisted automatically)
   */
  async save(): Promise<void> {
    // Pinecone auto-persists
    this.logger.debug("Pinecone auto-persists data");
  }

  /**
   * Clear all vectors in namespace
   */
  clear(): void {
    this.ensureInitialized();
    this.index!.namespace(this.namespace).deleteAll();
    this.localCache.clear();
    this.logger.info(`Cleared namespace: ${this.namespace}`);
  }

  /**
   * Shutdown (no-op for Pinecone)
   */
  async shutdown(): Promise<void> {
    this.localCache.clear();
    this.initialized = false;
    this.logger.info("Pinecone connection closed");
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private ensureInitialized(): void {
    if (!this.initialized || !this.index) {
      throw new Error("Pinecone not initialized. Call init() first.");
    }
  }

  /**
   * Serialize KnowledgeItem to Pinecone metadata
   * Note: Pinecone metadata has limitations (string, number, boolean, arrays of strings)
   */
  private serializeMetadata(item: KnowledgeItem): Record<string, unknown> {
    return {
      // Source
      source_type: item.source.type,
      source_name: item.source.name,
      source_url: item.source.url ?? "",
      source_credibility: item.source.credibility,

      // Content
      content_raw: item.content.raw.slice(0, 10000), // Pinecone has metadata size limits
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

      // Entities (serialized as JSON string)
      entities_json: JSON.stringify(item.entities),
      relationships_json: JSON.stringify(item.relationships),
    };
  }

  /**
   * Deserialize Pinecone metadata to KnowledgeItem
   */
  private deserializeMetadata(
    id: string,
    metadata?: Record<string, unknown>
  ): KnowledgeItem | null {
    if (!metadata) return null;

    try {
      // Parse entities and relationships from JSON strings
      let entities = [];
      let relationships = [];
      try {
        entities = JSON.parse((metadata.entities_json as string) || "[]");
        relationships = JSON.parse((metadata.relationships_json as string) || "[]");
      } catch {
        // Ignore parse errors
      }

      return {
        id,
        source: {
          type: metadata.source_type as any,
          name: metadata.source_name as string,
          url: metadata.source_url as string || undefined,
          credibility: metadata.source_credibility as number,
        },
        content: {
          raw: metadata.content_raw as string,
          summary: metadata.content_summary as string,
          type: metadata.content_type as any,
        },
        embedding: [], // Not stored in metadata, would need to query with includeValues
        entities,
        relationships,
        topics: (metadata.topics as string[]) || [],
        sentiment: metadata.sentiment as number,
        importance: metadata.importance as number,
        timestamp: metadata.timestamp as number,
        expiresAt: metadata.expiresAt as number || undefined,
        decayRate: metadata.decayRate as number,
        processed: metadata.processed as boolean,
        quality: metadata.quality as number,
      };
    } catch (error) {
      this.logger.error(`Failed to deserialize metadata for ${id}: ${error}`);
      return null;
    }
  }
}
