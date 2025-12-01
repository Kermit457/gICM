// src/supabase-storage.ts
var SupabaseStorage = class {
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

export {
  SupabaseStorage
};
//# sourceMappingURL=chunk-VGHZG52Y.js.map