/**
 * Memory Storage
 * File-based persistent storage for memory entries
 */

import * as fs from "fs";
import * as path from "path";
import type {
  MemoryEntry,
  MemoryNamespace,
  MemoryQuery,
  MemoryStats,
  MemoryConfig,
} from "./types.js";
import type { IMemoryStorage } from "./storage-interface.js";

export class MemoryStorage implements IMemoryStorage {
  private basePath: string;
  private entriesPath: string;
  private namespacesPath: string;
  private indexPath: string;

  constructor(config: MemoryConfig) {
    this.basePath = config.storagePath;
    this.entriesPath = path.join(this.basePath, "entries");
    this.namespacesPath = path.join(this.basePath, "namespaces");
    this.indexPath = path.join(this.basePath, "index.json");

    this.ensureDirectories();
  }

  /**
   * Ensure storage directories exist
   */
  private ensureDirectories(): void {
    [this.basePath, this.entriesPath, this.namespacesPath].forEach((dir) => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * Store a memory entry
   */
  async store(entry: MemoryEntry, namespace: string = "default"): Promise<void> {
    const nsPath = path.join(this.entriesPath, namespace);
    if (!fs.existsSync(nsPath)) {
      fs.mkdirSync(nsPath, { recursive: true });
    }

    const filePath = path.join(nsPath, `${entry.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(entry, null, 2));

    // Update index
    await this.updateIndex(entry, namespace, "add");
  }

  /**
   * Retrieve a memory entry by ID
   */
  async get(id: string, namespace: string = "default"): Promise<MemoryEntry | null> {
    const filePath = path.join(this.entriesPath, namespace, `${id}.json`);
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const content = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(content) as MemoryEntry;
  }

  /**
   * Retrieve a memory entry by key
   */
  async getByKey(key: string, namespace: string = "default"): Promise<MemoryEntry | null> {
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
  async update(entry: MemoryEntry, namespace: string = "default"): Promise<void> {
    await this.store(entry, namespace);
  }

  /**
   * Delete a memory entry
   */
  async delete(id: string, namespace: string = "default"): Promise<boolean> {
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
  async query(q: MemoryQuery): Promise<MemoryEntry[]> {
    const namespace = q.namespace || "default";
    const nsPath = path.join(this.entriesPath, namespace);

    if (!fs.existsSync(nsPath)) {
      return [];
    }

    const files = fs.readdirSync(nsPath).filter((f) => f.endsWith(".json"));
    let entries: MemoryEntry[] = [];

    for (const file of files) {
      const content = fs.readFileSync(path.join(nsPath, file), "utf-8");
      const entry = JSON.parse(content) as MemoryEntry;

      // Apply filters
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

    // Sort
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

    // Pagination
    const offset = q.offset || 0;
    const limit = q.limit || 100;
    return entries.slice(offset, offset + limit);
  }

  /**
   * Get all namespaces
   */
  async getNamespaces(): Promise<MemoryNamespace[]> {
    const nsFile = path.join(this.namespacesPath, "namespaces.json");
    if (!fs.existsSync(nsFile)) {
      return [
        {
          id: "default",
          name: "Default",
          description: "Default memory namespace",
          createdAt: new Date().toISOString(),
        },
      ];
    }
    const content = fs.readFileSync(nsFile, "utf-8");
    return JSON.parse(content) as MemoryNamespace[];
  }

  /**
   * Create a namespace
   */
  async createNamespace(namespace: MemoryNamespace): Promise<void> {
    const namespaces = await this.getNamespaces();
    namespaces.push(namespace);

    const nsFile = path.join(this.namespacesPath, "namespaces.json");
    fs.writeFileSync(nsFile, JSON.stringify(namespaces, null, 2));
  }

  /**
   * Get memory stats
   */
  async getStats(): Promise<MemoryStats> {
    const index = await this.loadIndex();
    const now = Date.now();
    const oneDayFromNow = now + 24 * 60 * 60 * 1000;

    let expiringSoon = 0;
    for (const entry of Object.values(index.keyIndex)) {
      if (entry.expiresAt) {
        const expiresAt = new Date(entry.expiresAt).getTime();
        if (expiresAt > now && expiresAt < oneDayFromNow) {
          expiringSoon++;
        }
      }
    }

    // Calculate storage size
    let storageSize = 0;
    const calculateSize = (dir: string): void => {
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
      expiringSoon,
    };
  }

  /**
   * Get expired entries
   */
  async getExpiredEntries(): Promise<MemoryEntry[]> {
    const index = await this.loadIndex();
    const now = new Date().toISOString();
    const expired: MemoryEntry[] = [];

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
  private async loadIndex(): Promise<MemoryIndex> {
    if (!fs.existsSync(this.indexPath)) {
      return this.createEmptyIndex();
    }

    const content = fs.readFileSync(this.indexPath, "utf-8");
    return JSON.parse(content) as MemoryIndex;
  }

  /**
   * Save index to disk
   */
  private async saveIndex(index: MemoryIndex): Promise<void> {
    fs.writeFileSync(this.indexPath, JSON.stringify(index, null, 2));
  }

  /**
   * Create empty index
   */
  private createEmptyIndex(): MemoryIndex {
    return {
      totalEntries: 0,
      keyIndex: {},
      byType: {
        fact: 0,
        preference: 0,
        context: 0,
        decision: 0,
        outcome: 0,
      },
      byNamespace: {},
      oldestEntry: null,
      newestEntry: null,
    };
  }

  /**
   * Update index
   */
  private async updateIndex(
    entry: MemoryEntry,
    namespace: string,
    action: "add" | "remove"
  ): Promise<void> {
    const index = await this.loadIndex();
    const key = `${namespace}:${entry.key}`;

    if (action === "add") {
      // Check if updating existing
      const isNew = !index.keyIndex[key];

      index.keyIndex[key] = {
        id: entry.id,
        type: entry.type,
        expiresAt: entry.expiresAt,
      };

      if (isNew) {
        index.totalEntries++;
        index.byType[entry.type] = (index.byType[entry.type] || 0) + 1;
        index.byNamespace[namespace] = (index.byNamespace[namespace] || 0) + 1;
      }

      // Update oldest/newest
      if (!index.oldestEntry || entry.createdAt < index.oldestEntry) {
        index.oldestEntry = entry.createdAt;
      }
      if (!index.newestEntry || entry.createdAt > index.newestEntry) {
        index.newestEntry = entry.createdAt;
      }
    } else {
      // Remove
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
}

// Index structure for fast lookups
interface MemoryIndex {
  totalEntries: number;
  keyIndex: Record<string, { id: string; type: MemoryEntry["type"]; expiresAt?: string }>;
  byType: Record<MemoryEntry["type"], number>;
  byNamespace: Record<string, number>;
  oldestEntry: string | null;
  newestEntry: string | null;
}
