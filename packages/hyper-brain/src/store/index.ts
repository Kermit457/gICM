/**
 * Storage Orchestrator
 *
 * Coordinates all storage systems.
 */

import { createVectorStore, type VectorStore, type VectorStoreType } from "./vector/index.js";
import { MemoryStore } from "./memory/index.js";
import { Logger } from "../utils/logger.js";
import type { KnowledgeItem, SearchResult, Pattern, Prediction } from "../types/index.js";
import type { EmbeddingGenerator } from "../process/embeddings.js";

export interface StorageConfig {
  vectorStore: VectorStoreType;
  dataDir: string;
}

export class StorageOrchestrator {
  private vectorStore: VectorStore;
  private memoryStore: MemoryStore;
  private logger = new Logger("Storage");
  private initialized = false;

  constructor(config: Partial<StorageConfig> = {}) {
    const dataDir = config.dataDir || "./data";

    this.vectorStore = createVectorStore(config.vectorStore || "local", {
      dataDir,
    });
    this.memoryStore = new MemoryStore(dataDir);
  }

  /**
   * Initialize all stores
   */
  async init(): Promise<void> {
    if (this.initialized) return;

    await this.vectorStore.init();
    await this.memoryStore.init();

    this.initialized = true;
    this.logger.info("Storage orchestrator initialized");
  }

  // ============================================================================
  // KNOWLEDGE
  // ============================================================================

  /**
   * Store knowledge item
   */
  async storeKnowledge(item: KnowledgeItem): Promise<void> {
    await this.vectorStore.add(item);
  }

  /**
   * Store multiple knowledge items
   */
  async storeKnowledgeBatch(items: KnowledgeItem[]): Promise<void> {
    await this.vectorStore.addBatch(items);
  }

  /**
   * Get knowledge item by ID
   */
  getKnowledge(id: string): KnowledgeItem | undefined {
    return this.vectorStore.get(id);
  }

  /**
   * Search knowledge by text
   */
  async searchKnowledge(
    query: string,
    embedder: EmbeddingGenerator,
    limit: number = 10
  ): Promise<SearchResult[]> {
    return this.vectorStore.searchText(query, embedder, limit);
  }

  /**
   * Search knowledge by embedding
   */
  async searchByEmbedding(
    embedding: number[],
    limit: number = 10
  ): Promise<SearchResult[]> {
    return this.vectorStore.search(embedding, limit);
  }

  /**
   * Filter knowledge
   */
  filterKnowledge(predicate: (item: KnowledgeItem) => boolean): KnowledgeItem[] {
    return this.vectorStore.filter(predicate);
  }

  /**
   * Get all knowledge
   */
  getAllKnowledge(): KnowledgeItem[] {
    return this.vectorStore.getAll();
  }

  /**
   * Get knowledge count
   */
  getKnowledgeCount(): number {
    return this.vectorStore.count();
  }

  // ============================================================================
  // PATTERNS
  // ============================================================================

  /**
   * Store pattern
   */
  storePattern(pattern: Pattern): void {
    this.memoryStore.addPattern(pattern);
  }

  /**
   * Get pattern
   */
  getPattern(id: string): Pattern | undefined {
    return this.memoryStore.getPattern(id);
  }

  /**
   * Get all patterns
   */
  getAllPatterns(): Pattern[] {
    return this.memoryStore.getAllPatterns();
  }

  /**
   * Update pattern
   */
  updatePattern(id: string, updates: Partial<Pattern>): boolean {
    return this.memoryStore.updatePattern(id, updates);
  }

  // ============================================================================
  // PREDICTIONS
  // ============================================================================

  /**
   * Store prediction
   */
  storePrediction(prediction: Prediction): void {
    this.memoryStore.addPrediction(prediction);
  }

  /**
   * Get prediction
   */
  getPrediction(id: string): Prediction | undefined {
    return this.memoryStore.getPrediction(id);
  }

  /**
   * Get all predictions
   */
  getAllPredictions(): Prediction[] {
    return this.memoryStore.getAllPredictions();
  }

  /**
   * Get pending predictions
   */
  getPendingPredictions(): Prediction[] {
    return this.memoryStore.getPendingPredictions();
  }

  /**
   * Update prediction outcome
   */
  updatePredictionOutcome(
    id: string,
    outcome: { correct: boolean; actual: string }
  ): boolean {
    return this.memoryStore.updatePredictionOutcome(id, outcome);
  }

  // ============================================================================
  // MEMORY
  // ============================================================================

  /**
   * Set short-term memory
   */
  setShortTerm<T>(key: string, value: T, ttl?: number): void {
    this.memoryStore.setShortTerm(key, value, ttl);
  }

  /**
   * Get short-term memory
   */
  getShortTerm<T>(key: string): T | undefined {
    return this.memoryStore.getShortTerm<T>(key);
  }

  /**
   * Set long-term memory
   */
  setLongTerm<T>(key: string, value: T): void {
    this.memoryStore.setLongTerm(key, value);
  }

  /**
   * Get long-term memory
   */
  getLongTerm<T>(key: string): T | undefined {
    return this.memoryStore.getLongTerm<T>(key);
  }

  // ============================================================================
  // STATS & LIFECYCLE
  // ============================================================================

  /**
   * Get storage stats
   */
  getStats(): {
    knowledge: number;
    patterns: number;
    predictions: number;
    memory: { shortTerm: number; longTerm: number };
  } {
    const memStats = this.memoryStore.getStats();
    return {
      knowledge: this.vectorStore.count(),
      patterns: memStats.patterns,
      predictions: memStats.predictions,
      memory: {
        shortTerm: memStats.shortTerm,
        longTerm: memStats.longTerm,
      },
    };
  }

  /**
   * Save all data
   */
  async save(): Promise<void> {
    await this.vectorStore.save();
    await this.memoryStore.saveAll();
  }

  /**
   * Shutdown
   */
  async shutdown(): Promise<void> {
    await this.vectorStore.shutdown();
    await this.memoryStore.shutdown();
    this.logger.info("Storage orchestrator shut down");
  }
}

// Re-exports
export { createVectorStore, LocalVectorStore } from "./vector/index.js";
export { MemoryStore } from "./memory/index.js";
export type { VectorStore, VectorStoreType };
