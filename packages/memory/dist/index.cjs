"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/storage.ts
var storage_exports = {};
__export(storage_exports, {
  MemoryStorage: () => MemoryStorage
});
var fs, path, MemoryStorage;
var init_storage = __esm({
  "src/storage.ts"() {
    "use strict";
    fs = __toESM(require("fs"), 1);
    path = __toESM(require("path"), 1);
    MemoryStorage = class {
      basePath;
      entriesPath;
      namespacesPath;
      indexPath;
      constructor(config) {
        this.basePath = config.storagePath;
        this.entriesPath = path.join(this.basePath, "entries");
        this.namespacesPath = path.join(this.basePath, "namespaces");
        this.indexPath = path.join(this.basePath, "index.json");
        this.ensureDirectories();
      }
      /**
       * Ensure storage directories exist
       */
      ensureDirectories() {
        [this.basePath, this.entriesPath, this.namespacesPath].forEach((dir) => {
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }
        });
      }
      /**
       * Store a memory entry
       */
      async store(entry, namespace = "default") {
        const nsPath = path.join(this.entriesPath, namespace);
        if (!fs.existsSync(nsPath)) {
          fs.mkdirSync(nsPath, { recursive: true });
        }
        const filePath = path.join(nsPath, `${entry.id}.json`);
        fs.writeFileSync(filePath, JSON.stringify(entry, null, 2));
        await this.updateIndex(entry, namespace, "add");
      }
      /**
       * Retrieve a memory entry by ID
       */
      async get(id, namespace = "default") {
        const filePath = path.join(this.entriesPath, namespace, `${id}.json`);
        if (!fs.existsSync(filePath)) {
          return null;
        }
        const content = fs.readFileSync(filePath, "utf-8");
        return JSON.parse(content);
      }
      /**
       * Retrieve a memory entry by key
       */
      async getByKey(key, namespace = "default") {
        const index = await this.loadIndex();
        const entry = index.keyIndex[`${namespace}:${key}`];
        if (!entry) {
          return null;
        }
        return this.get(entry.id, namespace);
      }
      /**
       * Update a memory entry
       */
      async update(entry, namespace = "default") {
        await this.store(entry, namespace);
      }
      /**
       * Delete a memory entry
       */
      async delete(id, namespace = "default") {
        const filePath = path.join(this.entriesPath, namespace, `${id}.json`);
        if (!fs.existsSync(filePath)) {
          return false;
        }
        const entry = await this.get(id, namespace);
        fs.unlinkSync(filePath);
        if (entry) {
          await this.updateIndex(entry, namespace, "remove");
        }
        return true;
      }
      /**
       * Query memory entries
       */
      async query(q) {
        const namespace = q.namespace || "default";
        const nsPath = path.join(this.entriesPath, namespace);
        if (!fs.existsSync(nsPath)) {
          return [];
        }
        const files = fs.readdirSync(nsPath).filter((f) => f.endsWith(".json"));
        let entries = [];
        for (const file of files) {
          const content = fs.readFileSync(path.join(nsPath, file), "utf-8");
          const entry = JSON.parse(content);
          if (q.key && entry.key !== q.key) continue;
          if (q.keyPattern && !new RegExp(q.keyPattern).test(entry.key)) continue;
          if (q.type && entry.type !== q.type) continue;
          if (q.minConfidence && entry.confidence < q.minConfidence) continue;
          if (q.tags && q.tags.length > 0) {
            const hasAllTags = q.tags.every((tag) => entry.tags.includes(tag));
            if (!hasAllTags) continue;
          }
          entries.push(entry);
        }
        const sortBy = q.sortBy || "createdAt";
        const sortOrder = q.sortOrder || "desc";
        entries.sort((a, b) => {
          const aVal = a[sortBy];
          const bVal = b[sortBy];
          if (sortOrder === "asc") {
            return aVal < bVal ? -1 : 1;
          }
          return aVal > bVal ? -1 : 1;
        });
        const offset = q.offset || 0;
        const limit = q.limit || 100;
        return entries.slice(offset, offset + limit);
      }
      /**
       * Get all namespaces
       */
      async getNamespaces() {
        const nsFile = path.join(this.namespacesPath, "namespaces.json");
        if (!fs.existsSync(nsFile)) {
          return [
            {
              id: "default",
              name: "Default",
              description: "Default memory namespace",
              createdAt: (/* @__PURE__ */ new Date()).toISOString()
            }
          ];
        }
        const content = fs.readFileSync(nsFile, "utf-8");
        return JSON.parse(content);
      }
      /**
       * Create a namespace
       */
      async createNamespace(namespace) {
        const namespaces = await this.getNamespaces();
        namespaces.push(namespace);
        const nsFile = path.join(this.namespacesPath, "namespaces.json");
        fs.writeFileSync(nsFile, JSON.stringify(namespaces, null, 2));
      }
      /**
       * Get memory stats
       */
      async getStats() {
        const index = await this.loadIndex();
        const now = Date.now();
        const oneDayFromNow = now + 24 * 60 * 60 * 1e3;
        let expiringSoon = 0;
        for (const entry of Object.values(index.keyIndex)) {
          if (entry.expiresAt) {
            const expiresAt = new Date(entry.expiresAt).getTime();
            if (expiresAt > now && expiresAt < oneDayFromNow) {
              expiringSoon++;
            }
          }
        }
        let storageSize = 0;
        const calculateSize = (dir) => {
          if (!fs.existsSync(dir)) return;
          const items = fs.readdirSync(dir);
          for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
              calculateSize(fullPath);
            } else {
              storageSize += stat.size;
            }
          }
        };
        calculateSize(this.basePath);
        return {
          totalEntries: index.totalEntries,
          byType: index.byType,
          byNamespace: index.byNamespace,
          storageSize,
          oldestEntry: index.oldestEntry,
          newestEntry: index.newestEntry,
          expiringSoon
        };
      }
      /**
       * Get expired entries
       */
      async getExpiredEntries() {
        const index = await this.loadIndex();
        const now = (/* @__PURE__ */ new Date()).toISOString();
        const expired = [];
        for (const [key, entry] of Object.entries(index.keyIndex)) {
          if (entry.expiresAt && entry.expiresAt < now) {
            const [namespace] = key.split(":");
            const fullEntry = await this.get(entry.id, namespace);
            if (fullEntry) {
              expired.push(fullEntry);
            }
          }
        }
        return expired;
      }
      /**
       * Load index from disk
       */
      async loadIndex() {
        if (!fs.existsSync(this.indexPath)) {
          return this.createEmptyIndex();
        }
        const content = fs.readFileSync(this.indexPath, "utf-8");
        return JSON.parse(content);
      }
      /**
       * Save index to disk
       */
      async saveIndex(index) {
        fs.writeFileSync(this.indexPath, JSON.stringify(index, null, 2));
      }
      /**
       * Create empty index
       */
      createEmptyIndex() {
        return {
          totalEntries: 0,
          keyIndex: {},
          byType: {
            fact: 0,
            preference: 0,
            context: 0,
            decision: 0,
            outcome: 0
          },
          byNamespace: {},
          oldestEntry: null,
          newestEntry: null
        };
      }
      /**
       * Update index
       */
      async updateIndex(entry, namespace, action) {
        const index = await this.loadIndex();
        const key = `${namespace}:${entry.key}`;
        if (action === "add") {
          const isNew = !index.keyIndex[key];
          index.keyIndex[key] = {
            id: entry.id,
            type: entry.type,
            expiresAt: entry.expiresAt
          };
          if (isNew) {
            index.totalEntries++;
            index.byType[entry.type] = (index.byType[entry.type] || 0) + 1;
            index.byNamespace[namespace] = (index.byNamespace[namespace] || 0) + 1;
          }
          if (!index.oldestEntry || entry.createdAt < index.oldestEntry) {
            index.oldestEntry = entry.createdAt;
          }
          if (!index.newestEntry || entry.createdAt > index.newestEntry) {
            index.newestEntry = entry.createdAt;
          }
        } else {
          const existing = index.keyIndex[key];
          if (existing) {
            delete index.keyIndex[key];
            index.totalEntries--;
            index.byType[entry.type] = Math.max(0, (index.byType[entry.type] || 0) - 1);
            index.byNamespace[namespace] = Math.max(
              0,
              (index.byNamespace[namespace] || 0) - 1
            );
          }
        }
        await this.saveIndex(index);
      }
    };
  }
});

// src/supabase-storage.ts
var supabase_storage_exports = {};
__export(supabase_storage_exports, {
  SupabaseStorage: () => SupabaseStorage
});
var SupabaseStorage;
var init_supabase_storage = __esm({
  "src/supabase-storage.ts"() {
    "use strict";
    SupabaseStorage = class {
      client = null;
      config;
      entriesTable;
      namespacesTable;
      constructor(config) {
        this.config = config;
        const prefix = config.tablePrefix || "gicm_memory";
        this.entriesTable = `${prefix}_entries`;
        this.namespacesTable = `${prefix}_namespaces`;
      }
      /**
       * Lazy initialize Supabase client
       */
      async getClient() {
        if (this.client) return this.client;
        try {
          const { createClient } = await import("@supabase/supabase-js");
          this.client = createClient(this.config.url, this.config.key);
          return this.client;
        } catch {
          throw new Error(
            "Supabase client not available. Install @supabase/supabase-js: pnpm add @supabase/supabase-js"
          );
        }
      }
      /**
       * Convert DB row to MemoryEntry
       */
      toMemoryEntry(row) {
        return {
          id: row.id,
          key: row.key,
          value: row.value,
          type: row.type,
          confidence: row.confidence,
          source: row.source,
          tags: row.tags || [],
          expiresAt: row.expires_at,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          accessCount: row.access_count,
          lastAccessedAt: row.last_accessed_at
        };
      }
      /**
       * Convert MemoryEntry to DB row
       */
      toDbRow(entry, namespace) {
        return {
          id: entry.id,
          key: entry.key,
          value: entry.value,
          type: entry.type,
          confidence: entry.confidence,
          source: entry.source,
          tags: entry.tags,
          namespace,
          expires_at: entry.expiresAt,
          created_at: entry.createdAt,
          updated_at: entry.updatedAt,
          access_count: entry.accessCount,
          last_accessed_at: entry.lastAccessedAt
        };
      }
      async store(entry, namespace = "default") {
        const client = await this.getClient();
        const row = this.toDbRow(entry, namespace);
        const { error } = await client.from(this.entriesTable).upsert(row);
        if (error) {
          throw new Error(`Failed to store memory: ${error.message}`);
        }
      }
      async get(id, namespace = "default") {
        const client = await this.getClient();
        const { data, error } = await client.from(this.entriesTable).select("*").eq("id", id).eq("namespace", namespace).maybeSingle();
        if (error) {
          throw new Error(`Failed to get memory: ${error.message}`);
        }
        return data ? this.toMemoryEntry(data) : null;
      }
      async getByKey(key, namespace = "default") {
        const client = await this.getClient();
        const { data, error } = await client.from(this.entriesTable).select("*").eq("key", key).eq("namespace", namespace).maybeSingle();
        if (error) {
          throw new Error(`Failed to get memory by key: ${error.message}`);
        }
        return data ? this.toMemoryEntry(data) : null;
      }
      async update(entry, namespace = "default") {
        await this.store(entry, namespace);
      }
      async delete(id, namespace = "default") {
        const client = await this.getClient();
        const { error } = await client.from(this.entriesTable).delete().eq("id", id).eq("namespace", namespace);
        if (error) {
          throw new Error(`Failed to delete memory: ${error.message}`);
        }
        return true;
      }
      async query(q) {
        const client = await this.getClient();
        const namespace = q.namespace || "default";
        let query = client.from(this.entriesTable).select("*").eq("namespace", namespace);
        if (q.key) {
          query = query.eq("key", q.key);
        }
        if (q.keyPattern) {
          query = query.ilike("key", `%${q.keyPattern}%`);
        }
        if (q.type) {
          query = query.eq("type", q.type);
        }
        if (q.minConfidence) {
          query = query.gte("confidence", q.minConfidence);
        }
        if (q.tags && q.tags.length > 0) {
          query = query.contains("tags", q.tags);
        }
        const sortBy = q.sortBy || "created_at";
        const sortColumn = sortBy === "createdAt" ? "created_at" : sortBy === "updatedAt" ? "updated_at" : sortBy === "accessCount" ? "access_count" : sortBy;
        query = query.order(sortColumn, { ascending: q.sortOrder === "asc" });
        const offset = q.offset || 0;
        const limit = q.limit || 100;
        query = query.range(offset, offset + limit - 1);
        const { data, error } = await query;
        if (error) {
          throw new Error(`Failed to query memories: ${error.message}`);
        }
        return (data || []).map((row) => this.toMemoryEntry(row));
      }
      async getNamespaces() {
        const client = await this.getClient();
        const { data, error } = await client.from(this.namespacesTable).select("*");
        if (error) {
          return [
            {
              id: "default",
              name: "Default",
              description: "Default memory namespace",
              createdAt: (/* @__PURE__ */ new Date()).toISOString()
            }
          ];
        }
        return (data || []).map((row) => ({
          id: row.id,
          name: row.name,
          description: row.description,
          parentId: row.parent_id,
          createdAt: row.created_at
        }));
      }
      async createNamespace(namespace) {
        const client = await this.getClient();
        const { error } = await client.from(this.namespacesTable).insert({
          id: namespace.id,
          name: namespace.name,
          description: namespace.description,
          parent_id: namespace.parentId,
          created_at: namespace.createdAt
        });
        if (error) {
          throw new Error(`Failed to create namespace: ${error.message}`);
        }
      }
      async getStats() {
        const client = await this.getClient();
        const { data: typeData } = await client.from(this.entriesTable).select("type");
        const byType = {
          fact: 0,
          preference: 0,
          context: 0,
          decision: 0,
          outcome: 0
        };
        const byNamespace = {};
        let totalEntries = 0;
        const { data: allData } = await client.from(this.entriesTable).select("type, namespace, created_at");
        let oldestEntry = null;
        let newestEntry = null;
        for (const row of allData || []) {
          totalEntries++;
          const type = row.type;
          const ns = row.namespace;
          const createdAt = row.created_at;
          byType[type] = (byType[type] || 0) + 1;
          byNamespace[ns] = (byNamespace[ns] || 0) + 1;
          if (!oldestEntry || createdAt < oldestEntry) oldestEntry = createdAt;
          if (!newestEntry || createdAt > newestEntry) newestEntry = createdAt;
        }
        const now = /* @__PURE__ */ new Date();
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1e3);
        const { data: expiringData } = await client.from(this.entriesTable).select("id").gte("expires_at", now.toISOString()).lt("expires_at", tomorrow.toISOString());
        return {
          totalEntries,
          byType,
          byNamespace,
          storageSize: 0,
          // Not applicable for cloud storage
          oldestEntry,
          newestEntry,
          expiringSoon: expiringData?.length || 0
        };
      }
      async getExpiredEntries() {
        const client = await this.getClient();
        const now = (/* @__PURE__ */ new Date()).toISOString();
        const { data, error } = await client.from(this.entriesTable).select("*").lt("expires_at", now);
        if (error) {
          return [];
        }
        return (data || []).map((row) => this.toMemoryEntry(row));
      }
    };
  }
});

// src/index.ts
var index_exports = {};
__export(index_exports, {
  DEFAULT_MEMORY_CONFIG: () => DEFAULT_MEMORY_CONFIG,
  Memory: () => Memory,
  MemoryEntrySchema: () => MemoryEntrySchema,
  MemoryStorage: () => MemoryStorage,
  SupabaseStorage: () => SupabaseStorage,
  createStorage: () => createStorage,
  getStorageTypeFromEnv: () => getStorageTypeFromEnv
});
module.exports = __toCommonJS(index_exports);

// src/memory.ts
var import_eventemitter3 = require("eventemitter3");
var import_pino = __toESM(require("pino"), 1);
var import_crypto = require("crypto");

// src/types.ts
var import_zod = require("zod");
var MemoryEntrySchema = import_zod.z.object({
  id: import_zod.z.string(),
  key: import_zod.z.string(),
  value: import_zod.z.unknown(),
  type: import_zod.z.enum(["fact", "preference", "context", "decision", "outcome"]),
  confidence: import_zod.z.number().min(0).max(1).default(1),
  source: import_zod.z.string().optional(),
  tags: import_zod.z.array(import_zod.z.string()).default([]),
  expiresAt: import_zod.z.string().datetime().optional(),
  createdAt: import_zod.z.string().datetime(),
  updatedAt: import_zod.z.string().datetime(),
  accessCount: import_zod.z.number().default(0),
  lastAccessedAt: import_zod.z.string().datetime().optional()
});
var MemoryNamespaceSchema = import_zod.z.object({
  id: import_zod.z.string(),
  name: import_zod.z.string(),
  description: import_zod.z.string().optional(),
  parentId: import_zod.z.string().optional(),
  createdAt: import_zod.z.string().datetime()
});
var MemoryConfigSchema = import_zod.z.object({
  storagePath: import_zod.z.string().default(".gicm/memory"),
  maxEntries: import_zod.z.number().default(1e4),
  defaultExpiration: import_zod.z.number().optional(),
  // Days
  cleanupInterval: import_zod.z.number().default(36e5),
  // 1 hour in ms
  enableCompression: import_zod.z.boolean().default(false),
  encryptionKey: import_zod.z.string().optional()
});
var DEFAULT_MEMORY_CONFIG = {
  storagePath: ".gicm/memory",
  maxEntries: 1e4,
  cleanupInterval: 36e5,
  enableCompression: false
};

// src/memory.ts
init_storage();
var Memory = class extends import_eventemitter3.EventEmitter {
  config;
  storage;
  logger;
  cleanupTimer = null;
  constructor(config = {}) {
    super();
    this.config = { ...DEFAULT_MEMORY_CONFIG, ...config };
    this.storage = new MemoryStorage(this.config);
    this.logger = (0, import_pino.default)({
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
      id: (0, import_crypto.randomUUID)(),
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

// src/index.ts
init_storage();
init_supabase_storage();

// src/storage-factory.ts
async function createStorage(options) {
  switch (options.type) {
    case "supabase": {
      if (!options.supabaseUrl || !options.supabaseKey) {
        throw new Error("Supabase storage requires supabaseUrl and supabaseKey");
      }
      const { SupabaseStorage: SupabaseStorage2 } = await Promise.resolve().then(() => (init_supabase_storage(), supabase_storage_exports));
      return new SupabaseStorage2({
        url: options.supabaseUrl,
        key: options.supabaseKey,
        tablePrefix: options.supabaseTablePrefix
      });
    }
    case "file":
    default: {
      const { MemoryStorage: MemoryStorage2 } = await Promise.resolve().then(() => (init_storage(), storage_exports));
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DEFAULT_MEMORY_CONFIG,
  Memory,
  MemoryEntrySchema,
  MemoryStorage,
  SupabaseStorage,
  createStorage,
  getStorageTypeFromEnv
});
//# sourceMappingURL=index.cjs.map