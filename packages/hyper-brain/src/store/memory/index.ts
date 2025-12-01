/**
 * Memory Store
 *
 * Short-term and long-term memory management.
 */

import { promises as fs } from "fs";
import { join } from "path";
import { Logger } from "../../utils/logger.js";
import type { Pattern, Prediction } from "../../types/index.js";

interface MemoryEntry<T> {
  key: string;
  value: T;
  createdAt: number;
  accessedAt: number;
  accessCount: number;
  ttl?: number; // Time to live in ms
}

export class MemoryStore {
  private shortTerm: Map<string, MemoryEntry<unknown>> = new Map();
  private longTerm: Map<string, MemoryEntry<unknown>> = new Map();
  private patterns: Map<string, Pattern> = new Map();
  private predictions: Map<string, Prediction> = new Map();

  private logger = new Logger("Memory");
  private dataDir: string;

  constructor(dataDir: string = "./data") {
    this.dataDir = dataDir;
  }

  /**
   * Initialize memory store
   */
  async init(): Promise<void> {
    await this.loadPatterns();
    await this.loadPredictions();
    this.logger.info("Memory store initialized");
  }

  // ============================================================================
  // SHORT-TERM MEMORY
  // ============================================================================

  /**
   * Set short-term memory
   */
  setShortTerm<T>(key: string, value: T, ttl: number = 3600000): void {
    this.shortTerm.set(key, {
      key,
      value,
      createdAt: Date.now(),
      accessedAt: Date.now(),
      accessCount: 0,
      ttl,
    });
  }

  /**
   * Get short-term memory
   */
  getShortTerm<T>(key: string): T | undefined {
    const entry = this.shortTerm.get(key);
    if (!entry) return undefined;

    // Check TTL
    if (entry.ttl && Date.now() - entry.createdAt > entry.ttl) {
      this.shortTerm.delete(key);
      return undefined;
    }

    entry.accessedAt = Date.now();
    entry.accessCount++;
    return entry.value as T;
  }

  /**
   * Clear expired short-term memory
   */
  cleanupShortTerm(): number {
    let cleaned = 0;
    const now = Date.now();

    for (const [key, entry] of this.shortTerm) {
      if (entry.ttl && now - entry.createdAt > entry.ttl) {
        this.shortTerm.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }

  // ============================================================================
  // LONG-TERM MEMORY
  // ============================================================================

  /**
   * Set long-term memory
   */
  setLongTerm<T>(key: string, value: T): void {
    this.longTerm.set(key, {
      key,
      value,
      createdAt: Date.now(),
      accessedAt: Date.now(),
      accessCount: 0,
    });
  }

  /**
   * Get long-term memory
   */
  getLongTerm<T>(key: string): T | undefined {
    const entry = this.longTerm.get(key);
    if (!entry) return undefined;

    entry.accessedAt = Date.now();
    entry.accessCount++;
    return entry.value as T;
  }

  /**
   * Promote from short-term to long-term
   */
  promote(key: string): boolean {
    const entry = this.shortTerm.get(key);
    if (!entry) return false;

    this.longTerm.set(key, { ...entry, ttl: undefined });
    this.shortTerm.delete(key);
    return true;
  }

  // ============================================================================
  // PATTERNS
  // ============================================================================

  /**
   * Add pattern
   */
  addPattern(pattern: Pattern): void {
    this.patterns.set(pattern.id, pattern);
  }

  /**
   * Get pattern
   */
  getPattern(id: string): Pattern | undefined {
    return this.patterns.get(id);
  }

  /**
   * Get all patterns
   */
  getAllPatterns(): Pattern[] {
    return Array.from(this.patterns.values());
  }

  /**
   * Update pattern
   */
  updatePattern(id: string, updates: Partial<Pattern>): boolean {
    const pattern = this.patterns.get(id);
    if (!pattern) return false;

    Object.assign(pattern, updates);
    return true;
  }

  /**
   * Save patterns to disk
   */
  async savePatterns(): Promise<void> {
    const path = join(this.dataDir, "patterns.json");
    const data = Array.from(this.patterns.values());
    await fs.mkdir(this.dataDir, { recursive: true });
    await fs.writeFile(path, JSON.stringify(data, null, 2));
    this.logger.info(`Saved ${data.length} patterns`);
  }

  /**
   * Load patterns from disk
   */
  private async loadPatterns(): Promise<void> {
    try {
      const path = join(this.dataDir, "patterns.json");
      const data = await fs.readFile(path, "utf-8");
      const patterns: Pattern[] = JSON.parse(data);
      for (const pattern of patterns) {
        this.patterns.set(pattern.id, pattern);
      }
      this.logger.info(`Loaded ${patterns.length} patterns`);
    } catch {
      // File doesn't exist yet
    }
  }

  // ============================================================================
  // PREDICTIONS
  // ============================================================================

  /**
   * Add prediction
   */
  addPrediction(prediction: Prediction): void {
    this.predictions.set(prediction.id, prediction);
  }

  /**
   * Get prediction
   */
  getPrediction(id: string): Prediction | undefined {
    return this.predictions.get(id);
  }

  /**
   * Get all predictions
   */
  getAllPredictions(): Prediction[] {
    return Array.from(this.predictions.values());
  }

  /**
   * Get pending predictions (not yet evaluated)
   */
  getPendingPredictions(): Prediction[] {
    return Array.from(this.predictions.values()).filter((p) => !p.outcome);
  }

  /**
   * Update prediction outcome
   */
  updatePredictionOutcome(
    id: string,
    outcome: { correct: boolean; actual: string }
  ): boolean {
    const prediction = this.predictions.get(id);
    if (!prediction) return false;

    prediction.outcome = {
      ...outcome,
      evaluatedAt: Date.now(),
    };
    return true;
  }

  /**
   * Save predictions to disk
   */
  async savePredictions(): Promise<void> {
    const path = join(this.dataDir, "predictions.json");
    const data = Array.from(this.predictions.values());
    await fs.mkdir(this.dataDir, { recursive: true });
    await fs.writeFile(path, JSON.stringify(data, null, 2));
    this.logger.info(`Saved ${data.length} predictions`);
  }

  /**
   * Load predictions from disk
   */
  private async loadPredictions(): Promise<void> {
    try {
      const path = join(this.dataDir, "predictions.json");
      const data = await fs.readFile(path, "utf-8");
      const predictions: Prediction[] = JSON.parse(data);
      for (const prediction of predictions) {
        this.predictions.set(prediction.id, prediction);
      }
      this.logger.info(`Loaded ${predictions.length} predictions`);
    } catch {
      // File doesn't exist yet
    }
  }

  // ============================================================================
  // STATS
  // ============================================================================

  /**
   * Get memory stats
   */
  getStats(): {
    shortTerm: number;
    longTerm: number;
    patterns: number;
    predictions: number;
  } {
    return {
      shortTerm: this.shortTerm.size,
      longTerm: this.longTerm.size,
      patterns: this.patterns.size,
      predictions: this.predictions.size,
    };
  }

  /**
   * Save all to disk
   */
  async saveAll(): Promise<void> {
    await this.savePatterns();
    await this.savePredictions();
  }

  /**
   * Shutdown
   */
  async shutdown(): Promise<void> {
    await this.saveAll();
    this.logger.info("Memory store shut down");
  }
}
