/**
 * Memory Storage Interface
 * Abstract storage interface for pluggable backends
 */

import type {
  MemoryEntry,
  MemoryNamespace,
  MemoryQuery,
  MemoryStats,
} from "./types.js";

/**
 * Storage backend interface - implement this to add new storage types
 */
export interface IMemoryStorage {
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
export type StorageType = "file" | "supabase" | "memory";

/**
 * Factory for creating storage backends
 */
export interface StorageOptions {
  type: StorageType;
  storagePath?: string;       // For file storage
  supabaseUrl?: string;       // For supabase
  supabaseKey?: string;       // For supabase
  supabaseTablePrefix?: string; // For supabase (default: 'gicm_memory')
}
