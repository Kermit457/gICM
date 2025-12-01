/**
 * Storage Factory
 * Creates storage backend based on configuration
 */

import type { IMemoryStorage, StorageOptions, StorageType } from "./storage-interface.js";
import type { MemoryConfig } from "./types.js";

/**
 * Create a storage backend based on options
 */
export async function createStorage(options: StorageOptions): Promise<IMemoryStorage> {
  switch (options.type) {
    case "supabase": {
      if (!options.supabaseUrl || !options.supabaseKey) {
        throw new Error("Supabase storage requires supabaseUrl and supabaseKey");
      }
      const { SupabaseStorage } = await import("./supabase-storage.js");
      return new SupabaseStorage({
        url: options.supabaseUrl,
        key: options.supabaseKey,
        tablePrefix: options.supabaseTablePrefix,
      });
    }

    case "file":
    default: {
      const { MemoryStorage } = await import("./storage.js");
      const config: MemoryConfig = {
        storagePath: options.storagePath || ".gicm/memory",
        maxEntries: 10000,
        cleanupInterval: 3600000,
        enableCompression: false,
      };
      return new MemoryStorage(config);
    }
  }
}

/**
 * Get storage type from environment
 */
export function getStorageTypeFromEnv(): StorageOptions {
  const type = (process.env.GICM_MEMORY_STORAGE || "file") as StorageType;

  if (type === "supabase") {
    return {
      type: "supabase",
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseKey: process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY,
      supabaseTablePrefix: process.env.GICM_MEMORY_TABLE_PREFIX || "gicm_memory",
    };
  }

  return {
    type: "file",
    storagePath: process.env.GICM_MEMORY_PATH || ".gicm/memory",
  };
}
