import {
  MemoryStorage
} from "./chunk-W6GRH7GJ.js";
import {
  SupabaseStorage
} from "./chunk-VGHZG52Y.js";

// src/memory.ts
import { EventEmitter } from "eventemitter3";
import pino from "pino";
import { randomUUID } from "crypto";

// src/types.ts
import { z } from "zod";
var MemoryEntrySchema = z.object({
  id: z.string(),
  key: z.string(),
  value: z.unknown(),
  type: z.enum(["fact", "preference", "context", "decision", "outcome"]),
  confidence: z.number().min(0).max(1).default(1),
  source: z.string().optional(),
  tags: z.array(z.string()).default([]),
  expiresAt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  accessCount: z.number().default(0),
  lastAccessedAt: z.string().datetime().optional()
});
var MemoryNamespaceSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  parentId: z.string().optional(),
  createdAt: z.string().datetime()
});
var MemoryConfigSchema = z.object({
  storagePath: z.string().default(".gicm/memory"),
  maxEntries: z.number().default(1e4),
  defaultExpiration: z.number().optional(),
  // Days
  cleanupInterval: z.number().default(36e5),
  // 1 hour in ms
  enableCompression: z.boolean().default(false),
  encryptionKey: z.string().optional()
});
var DEFAULT_MEMORY_CONFIG = {
  storagePath: ".gicm/memory",
  maxEntries: 1e4,
  cleanupInterval: 36e5,
  enableCompression: false
};

// src/memory.ts
var Memory = class extends EventEmitter {
  config;
  storage;
  logger;
  cleanupTimer = null;
  constructor(config = {}) {
    super();
    this.config = { ...DEFAULT_MEMORY_CONFIG, ...config };
    this.storage = new MemoryStorage(this.config);
    this.logger = pino({
      level: "info",
      transport: {
        target: "pino-pretty",
        options: { colorize: true }
      }
    });
  }
  /**
   * Start the memory system (including cleanup timer)
   */
  start() {
    this.startCleanupTimer();
    this.logger.info("Memory system started");
  }
  /**
   * Stop the memory system
   */
  stop() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.logger.info("Memory system stopped");
  }
  /**
   * Remember something
   */
  async remember(input) {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const entry = {
      id: randomUUID(),
      key: input.key,
      value: input.value,
      type: input.type,
      confidence: input.confidence ?? 1,
      source: input.source,
      tags: input.tags || [],
      createdAt: now,
      updatedAt: now,
      accessCount: 0
    };
    if (input.expiresIn) {
      const expiresAt = new Date(Date.now() + input.expiresIn * 1e3);
      entry.expiresAt = expiresAt.toISOString();
    } else if (this.config.defaultExpiration) {
      const expiresAt = new Date(
        Date.now() + this.config.defaultExpiration * 24 * 60 * 60 * 1e3
      );
      entry.expiresAt = expiresAt.toISOString();
    }
    MemoryEntrySchema.parse(entry);
    const namespace = input.namespace || "default";
    await this.storage.store(entry, namespace);
    this.logger.info({ key: entry.key, type: entry.type }, "Memory stored");
    this.emit("stored", entry);
    return entry;
  }
  /**
   * Recall a memory by key
   */
  async recall(key, namespace = "default") {
    const entry = await this.storage.getByKey(key, namespace);
    if (!entry) {
      return null;
    }
    if (entry.expiresAt && new Date(entry.expiresAt) < /* @__PURE__ */ new Date()) {
      await this.forget(entry.id, namespace);
      return null;
    }
    entry.accessCount++;
    entry.lastAccessedAt = (/* @__PURE__ */ new Date()).toISOString();
    await this.storage.update(entry, namespace);
    this.emit("retrieved", entry);
    return entry;
  }
  /**
   * Recall a memory by ID
   */
  async recallById(id, namespace = "default") {
    const entry = await this.storage.get(id, namespace);
    if (!entry) {
      return null;
    }
    if (entry.expiresAt && new Date(entry.expiresAt) < /* @__PURE__ */ new Date()) {
      await this.forget(id, namespace);
      return null;
    }
    entry.accessCount++;
    entry.lastAccessedAt = (/* @__PURE__ */ new Date()).toISOString();
    await this.storage.update(entry, namespace);
    this.emit("retrieved", entry);
    return entry;
  }
  /**
   * Update a memory
   */
  async update(key, updates, namespace = "default") {
    const entry = await this.storage.getByKey(key, namespace);
    if (!entry) {
      return null;
    }
    if (updates.value !== void 0) {
      entry.value = updates.value;
    }
    if (updates.confidence !== void 0) {
      entry.confidence = updates.confidence;
    }
    if (updates.tags !== void 0) {
      entry.tags = updates.tags;
    }
    if (updates.expiresIn !== void 0) {
      const expiresAt = new Date(Date.now() + updates.expiresIn * 1e3);
      entry.expiresAt = expiresAt.toISOString();
    }
    entry.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    await this.storage.update(entry, namespace);
    this.logger.info({ key: entry.key }, "Memory updated");
    this.emit("updated", entry);
    return entry;
  }
  /**
   * Forget a memory
   */
  async forget(idOrKey, namespace = "default") {
    let deleted = await this.storage.delete(idOrKey, namespace);
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
  async search(query) {
    const entries = await this.storage.query(query);
    const now = /* @__PURE__ */ new Date();
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
  async getFacts(namespace = "default") {
    return this.search({ type: "fact", namespace });
  }
  /**
   * Get all preferences
   */
  async getPreferences(namespace = "default") {
    return this.search({ type: "preference", namespace });
  }
  /**
   * Get memories by tags
   */
  async getByTags(tags, namespace = "default") {
    return this.search({ tags, namespace });
  }
  /**
   * Get recent decisions
   */
  async getRecentDecisions(limit = 10, namespace = "default") {
    return this.search({
      type: "decision",
      namespace,
      limit,
      sortBy: "createdAt",
      sortOrder: "desc"
    });
  }
  /**
   * Get memory stats
   */
  async getStats() {
    return this.storage.getStats();
  }
  /**
   * Create a namespace
   */
  async createNamespace(name, description, parentId) {
    const namespace = {
      id: name.toLowerCase().replace(/\s+/g, "-"),
      name,
      description,
      parentId,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    await this.storage.createNamespace(namespace);
    return namespace;
  }
  /**
   * Get all namespaces
   */
  async getNamespaces() {
    return this.storage.getNamespaces();
  }
  /**
   * Start cleanup timer for expired entries
   */
  startCleanupTimer() {
    this.cleanupTimer = setInterval(async () => {
      await this.cleanup();
    }, this.config.cleanupInterval);
  }
  /**
   * Clean up expired entries
   */
  async cleanup() {
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
  async export(namespace = "default") {
    return this.search({ namespace, limit: this.config.maxEntries });
  }
  /**
   * Import memories into a namespace
   */
  async import(entries, namespace = "default") {
    let imported = 0;
    for (const entry of entries) {
      await this.storage.store(entry, namespace);
      imported++;
    }
    this.logger.info({ count: imported, namespace }, "Memories imported");
    return imported;
  }
};

// src/storage-factory.ts
async function createStorage(options) {
  switch (options.type) {
    case "supabase": {
      if (!options.supabaseUrl || !options.supabaseKey) {
        throw new Error("Supabase storage requires supabaseUrl and supabaseKey");
      }
      const { SupabaseStorage: SupabaseStorage2 } = await import("./supabase-storage-4LT6A2DI.js");
      return new SupabaseStorage2({
        url: options.supabaseUrl,
        key: options.supabaseKey,
        tablePrefix: options.supabaseTablePrefix
      });
    }
    case "file":
    default: {
      const { MemoryStorage: MemoryStorage2 } = await import("./storage-6WP26MED.js");
      const config = {
        storagePath: options.storagePath || ".gicm/memory",
        maxEntries: 1e4,
        cleanupInterval: 36e5,
        enableCompression: false
      };
      return new MemoryStorage2(config);
    }
  }
}
function getStorageTypeFromEnv() {
  const type = process.env.GICM_MEMORY_STORAGE || "file";
  if (type === "supabase") {
    return {
      type: "supabase",
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseKey: process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY,
      supabaseTablePrefix: process.env.GICM_MEMORY_TABLE_PREFIX || "gicm_memory"
    };
  }
  return {
    type: "file",
    storagePath: process.env.GICM_MEMORY_PATH || ".gicm/memory"
  };
}
export {
  DEFAULT_MEMORY_CONFIG,
  Memory,
  MemoryEntrySchema,
  MemoryStorage,
  SupabaseStorage,
  createStorage,
  getStorageTypeFromEnv
};
//# sourceMappingURL=index.js.map