/**
 * Local Vector Store
 *
 * In-memory vector store with file persistence.
 */

import { promises as fs } from "fs";
import { join } from "path";
import { Logger } from "../../utils/logger.js";
import { EmbeddingGenerator } from "../../process/embeddings.js";
import type { KnowledgeItem, SearchResult } from "../../types/index.js";

interface VectorEntry {
  id: string;
  embedding: number[];
  item: KnowledgeItem;
}

export class LocalVectorStore {
  private vectors: Map<string, VectorEntry> = new Map();
  private logger = new Logger("VectorStore");
  private dataPath: string;
  private dirty = false;
  private saveInterval: NodeJS.Timeout | null = null;

  constructor(dataDir: string = "./data") {
    this.dataPath = join(dataDir, "vectors.json");
  }

  /**
   * Initialize store
   */
  async init(): Promise<void> {
    await this.load();

    // Auto-save every 30 seconds if dirty
    this.saveInterval = setInterval(async () => {
      if (this.dirty) {
        await this.save();
        this.dirty = false;
      }
    }, 30000);

    this.logger.info(`Vector store initialized: ${this.vectors.size} vectors`);
  }

  /**
   * Add item to store
   */
  async add(item: KnowledgeItem): Promise<void> {
    this.vectors.set(item.id, {
      id: item.id,
      embedding: item.embedding,
      item,
    });
    this.dirty = true;
  }

  /**
   * Add multiple items
   */
  async addBatch(items: KnowledgeItem[]): Promise<void> {
    for (const item of items) {
      await this.add(item);
    }
  }

  /**
   * Get item by ID
   */
  get(id: string): KnowledgeItem | undefined {
    return this.vectors.get(id)?.item;
  }

  /**
   * Delete item
   */
  delete(id: string): boolean {
    const deleted = this.vectors.delete(id);
    if (deleted) this.dirty = true;
    return deleted;
  }

  /**
   * Search by vector similarity
   */
  async search(
    queryEmbedding: number[],
    limit: number = 10,
    minScore: number = 0
  ): Promise<SearchResult[]> {
    const results: { entry: VectorEntry; score: number }[] = [];

    for (const entry of this.vectors.values()) {
      const score = EmbeddingGenerator.cosineSimilarity(
        queryEmbedding,
        entry.embedding
      );

      if (score >= minScore) {
        results.push({ entry, score });
      }
    }

    // Sort by score descending
    results.sort((a, b) => b.score - a.score);

    // Return top results
    return results.slice(0, limit).map(({ entry, score }) => ({
      ...entry.item,
      score,
    }));
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
   * Filter by metadata
   */
  filter(predicate: (item: KnowledgeItem) => boolean): KnowledgeItem[] {
    const results: KnowledgeItem[] = [];
    for (const entry of this.vectors.values()) {
      if (predicate(entry.item)) {
        results.push(entry.item);
      }
    }
    return results;
  }

  /**
   * Get all items
   */
  getAll(): KnowledgeItem[] {
    return Array.from(this.vectors.values()).map((e) => e.item);
  }

  /**
   * Get item count
   */
  count(): number {
    return this.vectors.size;
  }

  /**
   * Load from disk
   */
  private async load(): Promise<void> {
    try {
      const data = await fs.readFile(this.dataPath, "utf-8");
      const entries: VectorEntry[] = JSON.parse(data);

      for (const entry of entries) {
        this.vectors.set(entry.id, entry);
      }

      this.logger.info(`Loaded ${entries.length} vectors from disk`);
    } catch (error) {
      // File doesn't exist yet, that's OK
      this.logger.debug("No existing vector store found");
    }
  }

  /**
   * Save to disk
   */
  async save(): Promise<void> {
    try {
      const entries = Array.from(this.vectors.values());

      // Ensure directory exists
      const dir = this.dataPath.split("/").slice(0, -1).join("/");
      await fs.mkdir(dir, { recursive: true });

      await fs.writeFile(this.dataPath, JSON.stringify(entries, null, 2));
      this.logger.info(`Saved ${entries.length} vectors to disk`);
    } catch (error) {
      this.logger.error(`Failed to save vectors: ${error}`);
    }
  }

  /**
   * Clear store
   */
  clear(): void {
    this.vectors.clear();
    this.dirty = true;
  }

  /**
   * Shutdown
   */
  async shutdown(): Promise<void> {
    if (this.saveInterval) {
      clearInterval(this.saveInterval);
    }
    if (this.dirty) {
      await this.save();
    }
  }
}
