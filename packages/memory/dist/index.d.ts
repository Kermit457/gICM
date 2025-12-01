import { EventEmitter } from 'eventemitter3';
import { z } from 'zod';

/**
 * AI Memory Types
 * Type definitions for persistent context storage
 */

declare const MemoryEntrySchema: z.ZodObject<{
    id: z.ZodString;
    key: z.ZodString;
    value: z.ZodUnknown;
    type: z.ZodEnum<["fact", "preference", "context", "decision", "outcome"]>;
    confidence: z.ZodDefault<z.ZodNumber>;
    source: z.ZodOptional<z.ZodString>;
    tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    expiresAt: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    accessCount: z.ZodDefault<z.ZodNumber>;
    lastAccessedAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: string;
    key: string;
    type: "fact" | "preference" | "context" | "decision" | "outcome";
    confidence: number;
    tags: string[];
    createdAt: string;
    updatedAt: string;
    accessCount: number;
    value?: unknown;
    source?: string | undefined;
    expiresAt?: string | undefined;
    lastAccessedAt?: string | undefined;
}, {
    id: string;
    key: string;
    type: "fact" | "preference" | "context" | "decision" | "outcome";
    createdAt: string;
    updatedAt: string;
    value?: unknown;
    confidence?: number | undefined;
    source?: string | undefined;
    tags?: string[] | undefined;
    expiresAt?: string | undefined;
    accessCount?: number | undefined;
    lastAccessedAt?: string | undefined;
}>;
type MemoryEntry = z.infer<typeof MemoryEntrySchema>;
declare const MemoryNamespaceSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    parentId: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: string;
    name: string;
    description?: string | undefined;
    parentId?: string | undefined;
}, {
    id: string;
    createdAt: string;
    name: string;
    description?: string | undefined;
    parentId?: string | undefined;
}>;
type MemoryNamespace = z.infer<typeof MemoryNamespaceSchema>;
declare const MemoryConfigSchema: z.ZodObject<{
    storagePath: z.ZodDefault<z.ZodString>;
    maxEntries: z.ZodDefault<z.ZodNumber>;
    defaultExpiration: z.ZodOptional<z.ZodNumber>;
    cleanupInterval: z.ZodDefault<z.ZodNumber>;
    enableCompression: z.ZodDefault<z.ZodBoolean>;
    encryptionKey: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    storagePath: string;
    maxEntries: number;
    cleanupInterval: number;
    enableCompression: boolean;
    defaultExpiration?: number | undefined;
    encryptionKey?: string | undefined;
}, {
    storagePath?: string | undefined;
    maxEntries?: number | undefined;
    defaultExpiration?: number | undefined;
    cleanupInterval?: number | undefined;
    enableCompression?: boolean | undefined;
    encryptionKey?: string | undefined;
}>;
type MemoryConfig = z.infer<typeof MemoryConfigSchema>;
interface MemoryQuery {
    key?: string;
    keyPattern?: string;
    type?: MemoryEntry["type"];
    tags?: string[];
    minConfidence?: number;
    namespace?: string;
    limit?: number;
    offset?: number;
    sortBy?: "createdAt" | "updatedAt" | "accessCount" | "confidence";
    sortOrder?: "asc" | "desc";
}
interface MemoryEvents {
    stored: (entry: MemoryEntry) => void;
    retrieved: (entry: MemoryEntry) => void;
    updated: (entry: MemoryEntry) => void;
    deleted: (id: string) => void;
    expired: (entries: MemoryEntry[]) => void;
    error: (error: Error) => void;
}
interface MemoryStats {
    totalEntries: number;
    byType: Record<MemoryEntry["type"], number>;
    byNamespace: Record<string, number>;
    storageSize: number;
    oldestEntry: string | null;
    newestEntry: string | null;
    expiringSoon: number;
}
interface CreateMemoryInput {
    key: string;
    value: unknown;
    type: MemoryEntry["type"];
    confidence?: number;
    source?: string;
    tags?: string[];
    expiresIn?: number;
    namespace?: string;
}
interface UpdateMemoryInput {
    value?: unknown;
    confidence?: number;
    tags?: string[];
    expiresIn?: number;
}
declare const DEFAULT_MEMORY_CONFIG: MemoryConfig;

/**
 * AI Memory
 * Main memory class providing persistent context storage across sessions
 */

declare class Memory extends EventEmitter<MemoryEvents> {
    private config;
    private storage;
    private logger;
    private cleanupTimer;
    constructor(config?: Partial<MemoryConfig>);
    /**
     * Start the memory system (including cleanup timer)
     */
    start(): void;
    /**
     * Stop the memory system
     */
    stop(): void;
    /**
     * Remember something
     */
    remember(input: CreateMemoryInput): Promise<MemoryEntry>;
    /**
     * Recall a memory by key
     */
    recall(key: string, namespace?: string): Promise<MemoryEntry | null>;
    /**
     * Recall a memory by ID
     */
    recallById(id: string, namespace?: string): Promise<MemoryEntry | null>;
    /**
     * Update a memory
     */
    update(key: string, updates: UpdateMemoryInput, namespace?: string): Promise<MemoryEntry | null>;
    /**
     * Forget a memory
     */
    forget(idOrKey: string, namespace?: string): Promise<boolean>;
    /**
     * Search memories
     */
    search(query: MemoryQuery): Promise<MemoryEntry[]>;
    /**
     * Get all facts
     */
    getFacts(namespace?: string): Promise<MemoryEntry[]>;
    /**
     * Get all preferences
     */
    getPreferences(namespace?: string): Promise<MemoryEntry[]>;
    /**
     * Get memories by tags
     */
    getByTags(tags: string[], namespace?: string): Promise<MemoryEntry[]>;
    /**
     * Get recent decisions
     */
    getRecentDecisions(limit?: number, namespace?: string): Promise<MemoryEntry[]>;
    /**
     * Get memory stats
     */
    getStats(): Promise<MemoryStats>;
    /**
     * Create a namespace
     */
    createNamespace(name: string, description?: string, parentId?: string): Promise<MemoryNamespace>;
    /**
     * Get all namespaces
     */
    getNamespaces(): Promise<MemoryNamespace[]>;
    /**
     * Start cleanup timer for expired entries
     */
    private startCleanupTimer;
    /**
     * Clean up expired entries
     */
    private cleanup;
    /**
     * Export all memories for a namespace
     */
    export(namespace?: string): Promise<MemoryEntry[]>;
    /**
     * Import memories into a namespace
     */
    import(entries: MemoryEntry[], namespace?: string): Promise<number>;
}

/**
 * Memory Storage Interface
 * Abstract storage interface for pluggable backends
 */

/**
 * Storage backend interface - implement this to add new storage types
 */
interface IMemoryStorage {
    /** Store a memory entry */
    store(entry: MemoryEntry, namespace?: string): Promise<void>;
    /** Get entry by ID */
    get(id: string, namespace?: string): Promise<MemoryEntry | null>;
    /** Get entry by key */
    getByKey(key: string, namespace?: string): Promise<MemoryEntry | null>;
    /** Update an entry */
    update(entry: MemoryEntry, namespace?: string): Promise<void>;
    /** Delete an entry */
    delete(id: string, namespace?: string): Promise<boolean>;
    /** Query entries */
    query(q: MemoryQuery): Promise<MemoryEntry[]>;
    /** Get all namespaces */
    getNamespaces(): Promise<MemoryNamespace[]>;
    /** Create namespace */
    createNamespace(namespace: MemoryNamespace): Promise<void>;
    /** Get stats */
    getStats(): Promise<MemoryStats>;
    /** Get expired entries */
    getExpiredEntries(): Promise<MemoryEntry[]>;
}
/**
 * Storage types enum
 */
type StorageType = "file" | "supabase" | "memory";
/**
 * Factory for creating storage backends
 */
interface StorageOptions {
    type: StorageType;
    storagePath?: string;
    supabaseUrl?: string;
    supabaseKey?: string;
    supabaseTablePrefix?: string;
}

/**
 * Memory Storage
 * File-based persistent storage for memory entries
 */

declare class MemoryStorage implements IMemoryStorage {
    private basePath;
    private entriesPath;
    private namespacesPath;
    private indexPath;
    constructor(config: MemoryConfig);
    /**
     * Ensure storage directories exist
     */
    private ensureDirectories;
    /**
     * Store a memory entry
     */
    store(entry: MemoryEntry, namespace?: string): Promise<void>;
    /**
     * Retrieve a memory entry by ID
     */
    get(id: string, namespace?: string): Promise<MemoryEntry | null>;
    /**
     * Retrieve a memory entry by key
     */
    getByKey(key: string, namespace?: string): Promise<MemoryEntry | null>;
    /**
     * Update a memory entry
     */
    update(entry: MemoryEntry, namespace?: string): Promise<void>;
    /**
     * Delete a memory entry
     */
    delete(id: string, namespace?: string): Promise<boolean>;
    /**
     * Query memory entries
     */
    query(q: MemoryQuery): Promise<MemoryEntry[]>;
    /**
     * Get all namespaces
     */
    getNamespaces(): Promise<MemoryNamespace[]>;
    /**
     * Create a namespace
     */
    createNamespace(namespace: MemoryNamespace): Promise<void>;
    /**
     * Get memory stats
     */
    getStats(): Promise<MemoryStats>;
    /**
     * Get expired entries
     */
    getExpiredEntries(): Promise<MemoryEntry[]>;
    /**
     * Load index from disk
     */
    private loadIndex;
    /**
     * Save index to disk
     */
    private saveIndex;
    /**
     * Create empty index
     */
    private createEmptyIndex;
    /**
     * Update index
     */
    private updateIndex;
}

/**
 * Supabase Memory Storage
 * Cloud-based persistent storage using Supabase
 */

interface SupabaseConfig {
    url: string;
    key: string;
    tablePrefix?: string;
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
declare class SupabaseStorage implements IMemoryStorage {
    private client;
    private config;
    private entriesTable;
    private namespacesTable;
    constructor(config: SupabaseConfig);
    /**
     * Lazy initialize Supabase client
     */
    private getClient;
    /**
     * Convert DB row to MemoryEntry
     */
    private toMemoryEntry;
    /**
     * Convert MemoryEntry to DB row
     */
    private toDbRow;
    store(entry: MemoryEntry, namespace?: string): Promise<void>;
    get(id: string, namespace?: string): Promise<MemoryEntry | null>;
    getByKey(key: string, namespace?: string): Promise<MemoryEntry | null>;
    update(entry: MemoryEntry, namespace?: string): Promise<void>;
    delete(id: string, namespace?: string): Promise<boolean>;
    query(q: MemoryQuery): Promise<MemoryEntry[]>;
    getNamespaces(): Promise<MemoryNamespace[]>;
    createNamespace(namespace: MemoryNamespace): Promise<void>;
    getStats(): Promise<MemoryStats>;
    getExpiredEntries(): Promise<MemoryEntry[]>;
}

/**
 * Storage Factory
 * Creates storage backend based on configuration
 */

/**
 * Create a storage backend based on options
 */
declare function createStorage(options: StorageOptions): Promise<IMemoryStorage>;
/**
 * Get storage type from environment
 */
declare function getStorageTypeFromEnv(): StorageOptions;

export { type CreateMemoryInput, DEFAULT_MEMORY_CONFIG, type IMemoryStorage, Memory, type MemoryConfig, type MemoryEntry, MemoryEntrySchema, type MemoryEvents, type MemoryNamespace, type MemoryQuery, type MemoryStats, MemoryStorage, type StorageOptions, type StorageType, SupabaseStorage, type UpdateMemoryInput, createStorage, getStorageTypeFromEnv };
