// src/storage.ts
import * as fs from "fs";
import * as path from "path";
var MemoryStorage = class {
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

export {
  MemoryStorage
};
//# sourceMappingURL=chunk-W6GRH7GJ.js.map