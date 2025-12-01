/**
 * @gicm/memory
 * AI Memory - Persistent context storage across sessions
 */

// Main Memory class
export { Memory } from "./memory.js";

// Storage backends
export { MemoryStorage } from "./storage.js";
export { SupabaseStorage } from "./supabase-storage.js";

// Storage interface and factory
export type { IMemoryStorage, StorageType, StorageOptions } from "./storage-interface.js";
export { createStorage, getStorageTypeFromEnv } from "./storage-factory.js";

// Types
export type {
  MemoryConfig,
  MemoryEntry,
  MemoryEvents,
  MemoryQuery,
  MemoryStats,
  MemoryNamespace,
  CreateMemoryInput,
  UpdateMemoryInput,
} from "./types.js";
export { DEFAULT_MEMORY_CONFIG, MemoryEntrySchema } from "./types.js";
