/**
 * gICM HYPER BRAIN
 *
 * Knowledge ingestion, learning, and prediction system.
 */

import { EventEmitter } from "eventemitter3";
import { IngestOrchestrator, type IngestStats } from "./ingest/index.js";
import { ProcessingPipeline } from "./process/index.js";
import { StorageOrchestrator } from "./store/index.js";
import { RetrievalSystem, type RetrievalOptions } from "./retrieve/index.js";
import { LearningSystem } from "./learn/index.js";
import { PredictionEngine } from "./predict/index.js";
import { loadConfig, type BrainConfig } from "./config.js";
import { Logger } from "./utils/logger.js";
import type {
  KnowledgeItem,
  SearchResult,
  Pattern,
  Prediction,
  BrainStats,
  PredictionType,
} from "./types/index.js";

interface BrainEvents {
  "started": () => void;
  "stopped": () => void;
  "knowledge:added": (item: KnowledgeItem) => void;
  "pattern:discovered": (pattern: Pattern) => void;
  "prediction:made": (prediction: Prediction) => void;
  "error": (error: Error) => void;
}

export class HyperBrain extends EventEmitter<BrainEvents> {
  private config: BrainConfig;
  private logger: Logger;

  private ingest: IngestOrchestrator;
  private processing: ProcessingPipeline;
  private storage: StorageOrchestrator;
  private retrieval: RetrievalSystem;
  private learning: LearningSystem;
  private prediction: PredictionEngine;

  private isRunning = false;
  private startTime = 0;

  constructor(config: Partial<BrainConfig> = {}) {
    super();
    this.config = loadConfig(config);
    this.logger = new Logger("HyperBrain");

    // Initialize components
    this.ingest = new IngestOrchestrator();
    this.processing = new ProcessingPipeline();
    this.storage = new StorageOrchestrator({
      vectorStore: this.config.vectorDb,
      dataDir: "./data",
    });
    this.retrieval = new RetrievalSystem(
      this.storage,
      this.processing.getEmbedder()
    );
    this.learning = new LearningSystem(this.storage);
    this.prediction = new PredictionEngine(
      this.storage,
      this.retrieval,
      this.learning
    );

    // Wire up events
    this.setupEventHandlers();
  }

  /**
   * Start the HYPER BRAIN
   */
  async start(): Promise<void> {
    if (this.isRunning) return;

    this.logger.info("Starting HYPER BRAIN...");
    this.isRunning = true;
    this.startTime = Date.now();

    // Initialize storage
    await this.storage.init();

    // Start ingestion
    await this.ingest.start();

    this.emit("started");
    this.logger.info("HYPER BRAIN online!");
  }

  /**
   * Stop the HYPER BRAIN
   */
  async stop(): Promise<void> {
    if (!this.isRunning) return;

    this.logger.info("Stopping HYPER BRAIN...");

    this.ingest.stop();
    await this.storage.shutdown();

    this.isRunning = false;
    this.emit("stopped");
    this.logger.info("HYPER BRAIN offline");
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    // Process ingested items
    this.ingest.on("item:ingested", async (rawItem) => {
      try {
        const processed = await this.processing.process(rawItem);
        await this.storage.storeKnowledge(processed);
        this.emit("knowledge:added", processed);
      } catch (error) {
        this.logger.error(`Failed to process item: ${error}`);
      }
    });
  }

  // ============================================================================
  // INGESTION
  // ============================================================================

  /**
   * Force ingest from all sources
   */
  async ingestAll(): Promise<IngestStats> {
    return this.ingest.ingestAll();
  }

  /**
   * Ingest from specific source
   */
  async ingestSource(source: string): Promise<number> {
    return this.ingest.ingestSource(source);
  }

  /**
   * Get ingestion stats
   */
  getIngestStats(): IngestStats {
    return this.ingest.getStats();
  }

  // ============================================================================
  // SEARCH
  // ============================================================================

  /**
   * Search knowledge base
   */
  async search(query: string, limit: number = 10): Promise<SearchResult[]> {
    return this.retrieval.search(query, { limit, rerank: true });
  }

  /**
   * Advanced search with options
   */
  async advancedSearch(
    query: string,
    options: RetrievalOptions
  ): Promise<SearchResult[]> {
    return this.retrieval.hybridSearch(query, options);
  }

  /**
   * Get similar items
   */
  async getSimilar(itemId: string, limit: number = 10): Promise<SearchResult[]> {
    return this.retrieval.getSimilar(itemId, limit);
  }

  /**
   * Get by topic
   */
  getByTopic(topic: string, limit: number = 20): KnowledgeItem[] {
    return this.retrieval.getByTopic(topic, limit);
  }

  /**
   * Get recent items
   */
  getRecent(limit: number = 20): KnowledgeItem[] {
    return this.retrieval.getRecent(limit);
  }

  // ============================================================================
  // LEARNING
  // ============================================================================

  /**
   * Analyze and discover patterns
   */
  async analyzePatterns(): Promise<Pattern[]> {
    const patterns = await this.learning.analyzePatterns();
    for (const pattern of patterns) {
      this.emit("pattern:discovered", pattern);
    }
    return patterns;
  }

  /**
   * Get all patterns
   */
  getPatterns(): Pattern[] {
    return this.storage.getAllPatterns();
  }

  /**
   * Get pattern stats
   */
  getPatternStats(): { total: number; active: number; avgAccuracy: number } {
    return this.learning.getPatternStats();
  }

  // ============================================================================
  // PREDICTIONS
  // ============================================================================

  /**
   * Generate predictions
   */
  async predict(type: PredictionType, count: number = 5): Promise<Prediction[]> {
    const predictions = await this.prediction.predict(type, count);
    for (const pred of predictions) {
      this.emit("prediction:made", pred);
    }
    return predictions;
  }

  /**
   * Get all predictions
   */
  getPredictions(): Prediction[] {
    return this.storage.getAllPredictions();
  }

  /**
   * Get prediction stats
   */
  getPredictionStats(): {
    total: number;
    correct: number;
    accuracy: number;
    pending: number;
  } {
    return this.prediction.getStats();
  }

  /**
   * Evaluate pending predictions
   */
  async evaluatePredictions(): Promise<{ evaluated: number; correct: number }> {
    return this.prediction.evaluatePredictions();
  }

  // ============================================================================
  // STATS
  // ============================================================================

  /**
   * Get comprehensive brain stats
   */
  getStats(): BrainStats {
    const storageStats = this.storage.getStats();
    const ingestStats = this.ingest.getStats();
    const patternStats = this.learning.getPatternStats();
    const predictionStats = this.prediction.getStats();

    // Calculate knowledge by source and type
    const knowledge = this.storage.getAllKnowledge();
    const bySource: Record<string, number> = {};
    const byType: Record<string, number> = {};

    for (const item of knowledge) {
      bySource[item.source.name] = (bySource[item.source.name] || 0) + 1;
      byType[item.content.type] = (byType[item.content.type] || 0) + 1;
    }

    return {
      knowledge: {
        total: storageStats.knowledge,
        bySource,
        byType,
      },
      patterns: {
        total: patternStats.total,
        active: patternStats.active,
        accuracy: patternStats.avgAccuracy,
      },
      predictions: {
        total: predictionStats.total,
        correct: predictionStats.correct,
        accuracy: predictionStats.accuracy,
        pending: predictionStats.pending,
      },
      wins: {
        total: 0, // Will be filled by wins integration
        totalPoints: 0,
        currentStreak: 0,
        longestStreak: 0,
      },
      ingestion: {
        totalIngested: ingestStats.totalIngested,
        last24h: 0, // TODO: Calculate
        errors: ingestStats.errors,
        lastRun: ingestStats.lastRun,
      },
    };
  }

  /**
   * Get uptime
   */
  getUptime(): number {
    return this.isRunning ? Date.now() - this.startTime : 0;
  }

  /**
   * Check if running
   */
  isOnline(): boolean {
    return this.isRunning;
  }
}

// Re-exports
export * from "./types/index.js";
export { loadConfig } from "./config.js";
export { IngestOrchestrator } from "./ingest/index.js";
export { ProcessingPipeline } from "./process/index.js";
export { StorageOrchestrator } from "./store/index.js";
export { RetrievalSystem } from "./retrieve/index.js";
export { LearningSystem } from "./learn/index.js";
export { PredictionEngine } from "./predict/index.js";
export { BrainApiServer } from "./api/index.js";
