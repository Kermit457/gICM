/**
 * @gicm/watcher
 * Live file watching with auto-reindex for the gICM platform
 */

export { FileWatcher } from "./watcher.js";
export { Debouncer } from "./debouncer.js";
export { IncrementalIndexer } from "./incremental-indexer.js";
export { SupabaseSync, createSyncFromEnv } from "./supabase-sync.js";
export type { SyncResult, SyncConfig } from "./supabase-sync.js";
export type {
  WatcherConfig,
  WatcherState,
  WatcherEvents,
  FileChange,
  IndexResult,
} from "./types.js";
