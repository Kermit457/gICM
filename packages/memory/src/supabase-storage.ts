/**
 * Supabase Memory Storage
 * Cloud-based persistent storage using Supabase
 */

import type {
  MemoryEntry,
  MemoryNamespace,
  MemoryQuery,
  MemoryStats,
} from "./types.js";
import type { IMemoryStorage } from "./storage-interface.js";

interface SupabaseConfig {
  url: string;
  key: string;
  tablePrefix?: string;
}

interface SupabaseClient {
  from: (table: string) => SupabaseQueryBuilder;
}

interface SupabaseQueryBuilder {
  select: (columns?: string) => SupabaseQueryBuilder;
  insert: (data: unknown) => SupabaseQueryBuilder;
  update: (data: unknown) => SupabaseQueryBuilder;
  upsert: (data: unknown) => SupabaseQueryBuilder;
  delete: () => SupabaseQueryBuilder;
  eq: (column: string, value: unknown) => SupabaseQueryBuilder;
  lt: (column: string, value: unknown) => SupabaseQueryBuilder;
  gte: (column: string, value: unknown) => SupabaseQueryBuilder;
  contains: (column: string, value: unknown) => SupabaseQueryBuilder;
  ilike: (column: string, pattern: string) => SupabaseQueryBuilder;
  order: (column: string, options?: { ascending?: boolean }) => SupabaseQueryBuilder;
  range: (from: number, to: number) => SupabaseQueryBuilder;
  single: () => SupabaseQueryBuilder;
  maybeSingle: () => SupabaseQueryBuilder;
  then: <T>(resolve: (result: { data: T | null; error: Error | null }) => void) => Promise<void>;
}

/**
 * Supabase-backed memory storage
 *
 * Required Supabase tables (run these SQL commands in Supabase):
 *
 * ```sql
 * -- Memory entries table
 * CREATE TABLE gicm_memory_entries (
 *   id TEXT PRIMARY KEY,
 *   key TEXT NOT NULL,
 *   value JSONB,
 *   type TEXT NOT NULL CHECK (type IN ('fact', 'preference', 'context', 'decision', 'outcome')),
 *   confidence REAL DEFAULT 1 CHECK (confidence >= 0 AND confidence <= 1),
 *   source TEXT,
 *   tags TEXT[] DEFAULT '{}',
 *   namespace TEXT DEFAULT 'default',
 *   expires_at TIMESTAMPTZ,
 *   created_at TIMESTAMPTZ DEFAULT NOW(),
 *   updated_at TIMESTAMPTZ DEFAULT NOW(),
 *   access_count INTEGER DEFAULT 0,
 *   last_accessed_at TIMESTAMPTZ,
 *   UNIQUE(namespace, key)
 * );
 *
 * -- Namespaces table
 * CREATE TABLE gicm_memory_namespaces (
 *   id TEXT PRIMARY KEY,
 *   name TEXT NOT NULL,
 *   description TEXT,
 *   parent_id TEXT,
 *   created_at TIMESTAMPTZ DEFAULT NOW()
 * );
 *
 * -- Indexes for fast queries
 * CREATE INDEX idx_entries_namespace ON gicm_memory_entries(namespace);
 * CREATE INDEX idx_entries_type ON gicm_memory_entries(type);
 * CREATE INDEX idx_entries_expires ON gicm_memory_entries(expires_at) WHERE expires_at IS NOT NULL;
 * CREATE INDEX idx_entries_tags ON gicm_memory_entries USING GIN(tags);
 *
 * -- Insert default namespace
 * INSERT INTO gicm_memory_namespaces (id, name, description)
 * VALUES ('default', 'Default', 'Default memory namespace');
 * ```
 */
export class SupabaseStorage implements IMemoryStorage {
  private client: SupabaseClient | null = null;
  private config: SupabaseConfig;
  private entriesTable: string;
  private namespacesTable: string;

  constructor(config: SupabaseConfig) {
    this.config = config;
    const prefix = config.tablePrefix || "gicm_memory";
    this.entriesTable = `${prefix}_entries`;
    this.namespacesTable = `${prefix}_namespaces`;
  }

  /**
   * Lazy initialize Supabase client
   */
  private async getClient(): Promise<SupabaseClient> {
    if (this.client) return this.client;

    try {
      const { createClient } = await import("@supabase/supabase-js");
      this.client = createClient(this.config.url, this.config.key) as unknown as SupabaseClient;
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
  private toMemoryEntry(row: Record<string, unknown>): MemoryEntry {
    return {
      id: row.id as string,
      key: row.key as string,
      value: row.value,
      type: row.type as MemoryEntry["type"],
      confidence: row.confidence as number,
      source: row.source as string | undefined,
      tags: (row.tags as string[]) || [],
      expiresAt: row.expires_at as string | undefined,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
      accessCount: row.access_count as number,
      lastAccessedAt: row.last_accessed_at as string | undefined,
    };
  }

  /**
   * Convert MemoryEntry to DB row
   */
  private toDbRow(entry: MemoryEntry, namespace: string): Record<string, unknown> {
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
      last_accessed_at: entry.lastAccessedAt,
    };
  }

  async store(entry: MemoryEntry, namespace: string = "default"): Promise<void> {
    const client = await this.getClient();
    const row = this.toDbRow(entry, namespace);

    const { error } = await client
      .from(this.entriesTable)
      .upsert(row) as { data: unknown; error: Error | null };

    if (error) {
      throw new Error(`Failed to store memory: ${error.message}`);
    }
  }

  async get(id: string, namespace: string = "default"): Promise<MemoryEntry | null> {
    const client = await this.getClient();

    const { data, error } = await client
      .from(this.entriesTable)
      .select("*")
      .eq("id", id)
      .eq("namespace", namespace)
      .maybeSingle() as { data: Record<string, unknown> | null; error: Error | null };

    if (error) {
      throw new Error(`Failed to get memory: ${error.message}`);
    }

    return data ? this.toMemoryEntry(data) : null;
  }

  async getByKey(key: string, namespace: string = "default"): Promise<MemoryEntry | null> {
    const client = await this.getClient();

    const { data, error } = await client
      .from(this.entriesTable)
      .select("*")
      .eq("key", key)
      .eq("namespace", namespace)
      .maybeSingle() as { data: Record<string, unknown> | null; error: Error | null };

    if (error) {
      throw new Error(`Failed to get memory by key: ${error.message}`);
    }

    return data ? this.toMemoryEntry(data) : null;
  }

  async update(entry: MemoryEntry, namespace: string = "default"): Promise<void> {
    await this.store(entry, namespace);
  }

  async delete(id: string, namespace: string = "default"): Promise<boolean> {
    const client = await this.getClient();

    const { error } = await client
      .from(this.entriesTable)
      .delete()
      .eq("id", id)
      .eq("namespace", namespace) as { data: unknown; error: Error | null };

    if (error) {
      throw new Error(`Failed to delete memory: ${error.message}`);
    }

    return true;
  }

  async query(q: MemoryQuery): Promise<MemoryEntry[]> {
    const client = await this.getClient();
    const namespace = q.namespace || "default";

    let query = client
      .from(this.entriesTable)
      .select("*")
      .eq("namespace", namespace);

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

    // Sort
    const sortBy = q.sortBy || "created_at";
    const sortColumn = sortBy === "createdAt" ? "created_at" :
                       sortBy === "updatedAt" ? "updated_at" :
                       sortBy === "accessCount" ? "access_count" : sortBy;
    query = query.order(sortColumn, { ascending: q.sortOrder === "asc" });

    // Pagination
    const offset = q.offset || 0;
    const limit = q.limit || 100;
    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query as { data: Record<string, unknown>[] | null; error: Error | null };

    if (error) {
      throw new Error(`Failed to query memories: ${error.message}`);
    }

    return (data || []).map((row) => this.toMemoryEntry(row));
  }

  async getNamespaces(): Promise<MemoryNamespace[]> {
    const client = await this.getClient();

    const { data, error } = await client
      .from(this.namespacesTable)
      .select("*") as { data: Record<string, unknown>[] | null; error: Error | null };

    if (error) {
      // Return default if table doesn't exist or other error
      return [
        {
          id: "default",
          name: "Default",
          description: "Default memory namespace",
          createdAt: new Date().toISOString(),
        },
      ];
    }

    return (data || []).map((row) => ({
      id: row.id as string,
      name: row.name as string,
      description: row.description as string | undefined,
      parentId: row.parent_id as string | undefined,
      createdAt: row.created_at as string,
    }));
  }

  async createNamespace(namespace: MemoryNamespace): Promise<void> {
    const client = await this.getClient();

    const { error } = await client
      .from(this.namespacesTable)
      .insert({
        id: namespace.id,
        name: namespace.name,
        description: namespace.description,
        parent_id: namespace.parentId,
        created_at: namespace.createdAt,
      }) as { data: unknown; error: Error | null };

    if (error) {
      throw new Error(`Failed to create namespace: ${error.message}`);
    }
  }

  async getStats(): Promise<MemoryStats> {
    const client = await this.getClient();

    // Get counts by type
    const { data: typeData } = await client
      .from(this.entriesTable)
      .select("type") as { data: { type: string }[] | null; error: Error | null };

    const byType: Record<MemoryEntry["type"], number> = {
      fact: 0,
      preference: 0,
      context: 0,
      decision: 0,
      outcome: 0,
    };

    const byNamespace: Record<string, number> = {};
    let totalEntries = 0;

    // Get all entries for stats (could be optimized with SQL aggregation)
    const { data: allData } = await client
      .from(this.entriesTable)
      .select("type, namespace, created_at") as { data: Record<string, unknown>[] | null; error: Error | null };

    let oldestEntry: string | null = null;
    let newestEntry: string | null = null;

    for (const row of allData || []) {
      totalEntries++;
      const type = row.type as MemoryEntry["type"];
      const ns = row.namespace as string;
      const createdAt = row.created_at as string;

      byType[type] = (byType[type] || 0) + 1;
      byNamespace[ns] = (byNamespace[ns] || 0) + 1;

      if (!oldestEntry || createdAt < oldestEntry) oldestEntry = createdAt;
      if (!newestEntry || createdAt > newestEntry) newestEntry = createdAt;
    }

    // Get expiring soon count
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const { data: expiringData } = await client
      .from(this.entriesTable)
      .select("id")
      .gte("expires_at", now.toISOString())
      .lt("expires_at", tomorrow.toISOString()) as { data: { id: string }[] | null; error: Error | null };

    return {
      totalEntries,
      byType,
      byNamespace,
      storageSize: 0, // Not applicable for cloud storage
      oldestEntry,
      newestEntry,
      expiringSoon: expiringData?.length || 0,
    };
  }

  async getExpiredEntries(): Promise<MemoryEntry[]> {
    const client = await this.getClient();
    const now = new Date().toISOString();

    const { data, error } = await client
      .from(this.entriesTable)
      .select("*")
      .lt("expires_at", now) as { data: Record<string, unknown>[] | null; error: Error | null };

    if (error) {
      return [];
    }

    return (data || []).map((row) => this.toMemoryEntry(row));
  }
}
