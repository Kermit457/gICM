/**
 * AI Memory
 * Main memory class providing persistent context storage across sessions
 */

import { EventEmitter } from "eventemitter3";
import pino from "pino";
import { randomUUID } from "crypto";
import type {
  MemoryConfig,
  MemoryEntry,
  MemoryEvents,
  MemoryQuery,
  MemoryStats,
  CreateMemoryInput,
  UpdateMemoryInput,
  MemoryNamespace,
} from "./types.js";
import { DEFAULT_MEMORY_CONFIG, MemoryEntrySchema } from "./types.js";
import { MemoryStorage } from "./storage.js";

export class Memory extends EventEmitter<MemoryEvents> {
  private config: MemoryConfig;
  private storage: MemoryStorage;
  private logger: pino.Logger;
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(config: Partial<MemoryConfig> = {}) {
    super();
    this.config = { ...DEFAULT_MEMORY_CONFIG, ...config };
    this.storage = new MemoryStorage(this.config);
    this.logger = pino({
      level: "info",
      transport: {
        target: "pino-pretty",
        options: { colorize: true },
      },
    });
  }

  /**
   * Start the memory system (including cleanup timer)
   */
  start(): void {
    this.startCleanupTimer();
    this.logger.info("Memory system started");
  }

  /**
   * Stop the memory system
   */
  stop(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.logger.info("Memory system stopped");
  }

  /**
   * Remember something
   */
  async remember(input: CreateMemoryInput): Promise<MemoryEntry> {
    const now = new Date().toISOString();
    const entry: MemoryEntry = {
      id: randomUUID(),
      key: input.key,
      value: input.value,
      type: input.type,
      confidence: input.confidence ?? 1,
      source: input.source,
      tags: input.tags || [],
      createdAt: now,
      updatedAt: now,
      accessCount: 0,
    };

    // Set expiration if provided
    if (input.expiresIn) {
      const expiresAt = new Date(Date.now() + input.expiresIn * 1000);
      entry.expiresAt = expiresAt.toISOString();
    } else if (this.config.defaultExpiration) {
      const expiresAt = new Date(
        Date.now() + this.config.defaultExpiration * 24 * 60 * 60 * 1000
      );
      entry.expiresAt = expiresAt.toISOString();
    }

    // Validate entry
    MemoryEntrySchema.parse(entry);

    // Store
    const namespace = input.namespace || "default";
    await this.storage.store(entry, namespace);

    this.logger.info({ key: entry.key, type: entry.type }, "Memory stored");
    this.emit("stored", entry);

    return entry;
  }

  /**
   * Recall a memory by key
   */
  async recall(key: string, namespace: string = "default"): Promise<MemoryEntry | null> {
    const entry = await this.storage.getByKey(key, namespace);
    if (!entry) {
      return null;
    }

    // Check if expired
    if (entry.expiresAt && new Date(entry.expiresAt) < new Date()) {
      await this.forget(entry.id, namespace);
      return null;
    }

    // Update access stats
    entry.accessCount++;
    entry.lastAccessedAt = new Date().toISOString();
    await this.storage.update(entry, namespace);

    this.emit("retrieved", entry);
    return entry;
  }

  /**
   * Recall a memory by ID
   */
  async recallById(id: string, namespace: string = "default"): Promise<MemoryEntry | null> {
    const entry = await this.storage.get(id, namespace);
    if (!entry) {
      return null;
    }

    // Check if expired
    if (entry.expiresAt && new Date(entry.expiresAt) < new Date()) {
      await this.forget(id, namespace);
      return null;
    }

    // Update access stats
    entry.accessCount++;
    entry.lastAccessedAt = new Date().toISOString();
    await this.storage.update(entry, namespace);

    this.emit("retrieved", entry);
    return entry;
  }

  /**
   * Update a memory
   */
  async update(
    key: string,
    updates: UpdateMemoryInput,
    namespace: string = "default"
  ): Promise<MemoryEntry | null> {
    const entry = await this.storage.getByKey(key, namespace);
    if (!entry) {
      return null;
    }

    // Apply updates
    if (updates.value !== undefined) {
      entry.value = updates.value;
    }
    if (updates.confidence !== undefined) {
      entry.confidence = updates.confidence;
    }
    if (updates.tags !== undefined) {
      entry.tags = updates.tags;
    }
    if (updates.expiresIn !== undefined) {
      const expiresAt = new Date(Date.now() + updates.expiresIn * 1000);
      entry.expiresAt = expiresAt.toISOString();
    }

    entry.updatedAt = new Date().toISOString();

    await this.storage.update(entry, namespace);

    this.logger.info({ key: entry.key }, "Memory updated");
    this.emit("updated", entry);

    return entry;
  }

  /**
   * Forget a memory
   */
  async forget(idOrKey: string, namespace: string = "default"): Promise<boolean> {
    // Try by ID first
    let deleted = await this.storage.delete(idOrKey, namespace);

    // If not found, try by key
    if (!deleted) {
      const entry = await this.storage.getByKey(idOrKey, namespace);
      if (entry) {
        deleted = await this.storage.delete(entry.id, namespace);
      }
    }

    if (deleted) {
      this.logger.info({ id: idOrKey }, "Memory forgotten");
      this.emit("deleted", idOrKey);
    }

    return deleted;
  }

  /**
   * Search memories
   */
  async search(query: MemoryQuery): Promise<MemoryEntry[]> {
    const entries = await this.storage.query(query);

    // Filter out expired entries
    const now = new Date();
    return entries.filter((e) => {
      if (e.expiresAt && new Date(e.expiresAt) < now) {
        return false;
      }
      return true;
    });
  }

  /**
   * Get all facts
   */
  async getFacts(namespace: string = "default"): Promise<MemoryEntry[]> {
    return this.search({ type: "fact", namespace });
  }

  /**
   * Get all preferences
   */
  async getPreferences(namespace: string = "default"): Promise<MemoryEntry[]> {
    return this.search({ type: "preference", namespace });
  }

  /**
   * Get memories by tags
   */
  async getByTags(tags: string[], namespace: string = "default"): Promise<MemoryEntry[]> {
    return this.search({ tags, namespace });
  }

  /**
   * Get recent decisions
   */
  async getRecentDecisions(
    limit: number = 10,
    namespace: string = "default"
  ): Promise<MemoryEntry[]> {
    return this.search({
      type: "decision",
      namespace,
      limit,
      sortBy: "createdAt",
      sortOrder: "desc",
    });
  }

  /**
   * Get memory stats
   */
  async getStats(): Promise<MemoryStats> {
    return this.storage.getStats();
  }

  /**
   * Create a namespace
   */
  async createNamespace(
    name: string,
    description?: string,
    parentId?: string
  ): Promise<MemoryNamespace> {
    const namespace: MemoryNamespace = {
      id: name.toLowerCase().replace(/\s+/g, "-"),
      name,
      description,
      parentId,
      createdAt: new Date().toISOString(),
    };

    await this.storage.createNamespace(namespace);
    return namespace;
  }

  /**
   * Get all namespaces
   */
  async getNamespaces(): Promise<MemoryNamespace[]> {
    return this.storage.getNamespaces();
  }

  /**
   * Start cleanup timer for expired entries
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(async () => {
      await this.cleanup();
    }, this.config.cleanupInterval);
  }

  /**
   * Clean up expired entries
   */
  private async cleanup(): Promise<void> {
    const expired = await this.storage.getExpiredEntries();
    if (expired.length === 0) {
      return;
    }

    this.logger.info({ count: expired.length }, "Cleaning up expired memories");

    for (const entry of expired) {
      await this.storage.delete(entry.id);
    }

    this.emit("expired", expired);
  }

  /**
   * Export all memories for a namespace
   */
  async export(namespace: string = "default"): Promise<MemoryEntry[]> {
    return this.search({ namespace, limit: this.config.maxEntries });
  }

  /**
   * Import memories into a namespace
   */
  async import(entries: MemoryEntry[], namespace: string = "default"): Promise<number> {
    let imported = 0;
    for (const entry of entries) {
      await this.storage.store(entry, namespace);
      imported++;
    }
    this.logger.info({ count: imported, namespace }, "Memories imported");
    return imported;
  }
}
