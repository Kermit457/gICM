/**
 * Ingestion Orchestrator
 *
 * Coordinates all data source ingestion.
 */

import { EventEmitter } from "eventemitter3";
import { Scheduler } from "./scheduler.js";
import { SourceRegistry, RawItem } from "./sources/index.js";
import { Logger } from "../utils/logger.js";
import type { KnowledgeItem } from "../types/index.js";

interface IngestEvents {
  "item:ingested": (item: RawItem) => void;
  "batch:complete": (source: string, count: number) => void;
  "error": (source: string, error: Error) => void;
}

export interface IngestStats {
  totalIngested: number;
  bySource: Record<string, number>;
  errors: number;
  lastRun: Record<string, number>;
}

export class IngestOrchestrator extends EventEmitter<IngestEvents> {
  private scheduler: Scheduler;
  private sources: SourceRegistry;
  private logger = new Logger("Ingest");
  private isRunning = false;

  private stats: IngestStats = {
    totalIngested: 0,
    bySource: {},
    errors: 0,
    lastRun: {},
  };

  // Store for raw items (processed items go to storage layer)
  private rawItems: RawItem[] = [];
  private maxRawItems = 10000;

  constructor() {
    super();
    this.scheduler = new Scheduler();
    this.sources = new SourceRegistry();
  }

  /**
   * Start ingestion
   */
  async start(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    this.logger.info("Starting HYPER BRAIN ingestion...");

    // Register all sources
    await this.sources.registerAll();

    // Schedule each source
    for (const source of this.sources.getAll()) {
      this.scheduler.schedule(
        source.name,
        source.interval,
        async () => { await this.ingestSource(source.name); }
      );
    }

    // Start scheduler
    this.scheduler.start();

    // Run initial ingestion
    await this.ingestAll();

    this.logger.info(`Ingestion started: ${this.sources.count()} sources`);
  }

  /**
   * Stop ingestion
   */
  stop(): void {
    this.scheduler.stop();
    this.isRunning = false;
    this.logger.info("Ingestion stopped");
  }

  /**
   * Ingest from a specific source
   */
  async ingestSource(sourceName: string): Promise<number> {
    const source = this.sources.get(sourceName);
    if (!source) {
      this.logger.error(`Unknown source: ${sourceName}`);
      return 0;
    }

    this.logger.info(`Ingesting: ${sourceName}`);

    try {
      // Fetch raw data
      const rawItems = await source.fetch();

      // Store items
      for (const item of rawItems) {
        this.addRawItem(item);
        this.emit("item:ingested", item);
      }

      // Update stats
      this.stats.totalIngested += rawItems.length;
      this.stats.bySource[sourceName] =
        (this.stats.bySource[sourceName] || 0) + rawItems.length;
      this.stats.lastRun[sourceName] = Date.now();

      this.emit("batch:complete", sourceName, rawItems.length);
      this.logger.info(`Ingested ${rawItems.length} items from ${sourceName}`);

      return rawItems.length;
    } catch (error) {
      this.stats.errors++;
      this.emit("error", sourceName, error as Error);
      this.logger.error(`Ingestion failed: ${sourceName} - ${error}`);
      return 0;
    }
  }

  /**
   * Force ingest all sources
   */
  async ingestAll(): Promise<IngestStats> {
    const sources = this.sources.getAll();

    this.logger.info(`Ingesting from ${sources.length} sources...`);

    // Run in parallel with concurrency limit
    const concurrency = 5;
    for (let i = 0; i < sources.length; i += concurrency) {
      const batch = sources.slice(i, i + concurrency);
      await Promise.all(batch.map((s) => this.ingestSource(s.name)));
    }

    this.logger.info(`Ingestion complete: ${this.stats.totalIngested} total items`);
    return this.getStats();
  }

  /**
   * Get ingestion stats
   */
  getStats(): IngestStats {
    return { ...this.stats };
  }

  /**
   * Get recent raw items
   */
  getRecentItems(count: number = 100): RawItem[] {
    return this.rawItems.slice(-count);
  }

  /**
   * Get raw items by source
   */
  getItemsBySource(source: string): RawItem[] {
    return this.rawItems.filter((item) => item.source === source);
  }

  /**
   * Search raw items
   */
  searchItems(query: string): RawItem[] {
    const lowerQuery = query.toLowerCase();
    return this.rawItems.filter(
      (item) =>
        item.content.toLowerCase().includes(lowerQuery) ||
        item.id.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Add raw item to store
   */
  private addRawItem(item: RawItem): void {
    this.rawItems.push(item);

    // Trim if exceeds max
    if (this.rawItems.length > this.maxRawItems) {
      this.rawItems = this.rawItems.slice(-this.maxRawItems);
    }
  }

  /**
   * Get source registry
   */
  getSources(): SourceRegistry {
    return this.sources;
  }
}

// Re-exports
export { Scheduler } from "./scheduler.js";
export { SourceRegistry, BaseSource } from "./sources/index.js";
export type { RawItem } from "./sources/index.js";
