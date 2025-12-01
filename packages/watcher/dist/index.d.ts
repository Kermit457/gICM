import { EventEmitter } from 'eventemitter3';
import { z } from 'zod';

/**
 * Watcher Types
 * Core type definitions for file watching and live sync
 */

declare const FileChangeSchema: z.ZodObject<{
    type: z.ZodEnum<["add", "change", "unlink"]>;
    path: z.ZodString;
    timestamp: z.ZodString;
    size: z.ZodOptional<z.ZodNumber>;
    hash: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    path: string;
    type: "add" | "change" | "unlink";
    timestamp: string;
    size?: number | undefined;
    hash?: string | undefined;
}, {
    path: string;
    type: "add" | "change" | "unlink";
    timestamp: string;
    size?: number | undefined;
    hash?: string | undefined;
}>;
type FileChange = z.infer<typeof FileChangeSchema>;
declare const WatcherStatusSchema: z.ZodEnum<["idle", "watching", "indexing", "stopped", "error"]>;
type WatcherStatus = z.infer<typeof WatcherStatusSchema>;
interface WatcherState {
    status: WatcherStatus;
    watchPath: string;
    startedAt?: string;
    lastChangeAt?: string;
    totalChanges: number;
    pendingIndex: number;
    error?: string;
}
interface WatcherConfig {
    path: string;
    autoIndex: boolean;
    debounceMs: number;
    ignorePatterns: string[];
    contextEngineUrl: string;
}
interface WatcherEvents {
    started: (state: WatcherState) => void;
    stopped: (state: WatcherState) => void;
    change: (change: FileChange) => void;
    indexed: (files: string[], duration: number) => void;
    error: (error: Error) => void;
}
interface IndexResult {
    success: boolean;
    filesIndexed: number;
    duration: number;
    error?: string;
}

/**
 * File Watcher
 * Main watcher class using chokidar for file system watching
 */

declare class FileWatcher extends EventEmitter<WatcherEvents> {
    private config;
    private watcher;
    private debouncer;
    private indexer;
    private state;
    private logger;
    private changesLogPath;
    private pidFilePath;
    constructor(config?: Partial<WatcherConfig>);
    /**
     * Start watching
     */
    start(): Promise<void>;
    /**
     * Stop watching
     */
    stop(): Promise<void>;
    /**
     * Get current state
     */
    getState(): WatcherState;
    /**
     * Get recent changes
     */
    getRecentChanges(limit?: number): FileChange[];
    /**
     * Handle a file change
     */
    private handleChange;
    /**
     * Handle debounced changes (batch)
     */
    private handleDebouncedChanges;
    /**
     * Log change to file
     */
    private logChange;
    /**
     * Rotate log file
     */
    private rotateLog;
    /**
     * Check if watcher process is already running
     */
    static isRunning(watchPath?: string): {
        running: boolean;
        pid?: number;
    };
}

/**
 * Debouncer
 * Debounce rapid file changes to avoid excessive re-indexing
 */

declare class Debouncer {
    private pending;
    private timer;
    private debounceMs;
    private callback;
    constructor(debounceMs: number, callback: (changes: FileChange[]) => void);
    /**
     * Add a change to be debounced
     */
    add(change: FileChange): void;
    /**
     * Flush all pending changes
     */
    flush(): void;
    /**
     * Get count of pending changes
     */
    getPendingCount(): number;
    /**
     * Cancel all pending changes
     */
    cancel(): void;
}

/**
 * Incremental Indexer
 * Handles partial re-indexing of changed files
 */

declare class IncrementalIndexer {
    private contextEngineUrl;
    constructor(contextEngineUrl: string);
    /**
     * Index a set of changed files
     */
    indexChanges(changes: FileChange[]): Promise<IndexResult>;
    /**
     * Get file type from extension
     */
    private getFileType;
    /**
     * Check if context engine is available
     */
    isAvailable(): Promise<boolean>;
}

/**
 * Supabase Sync
 * Sync file changes to Supabase for cloud storage and team collaboration
 */

interface SyncResult {
    success: boolean;
    synced: number;
    failed: number;
    error?: string;
}
interface SyncConfig {
    supabaseUrl: string;
    supabaseKey: string;
    tablePrefix?: string;
    projectId: string;
    teamId?: string;
    enableRealtime?: boolean;
}
/**
 * Supabase sync for file changes
 *
 * Required Supabase tables (run these SQL commands in Supabase):
 *
 * ```sql
 * -- File changes table
 * CREATE TABLE gicm_file_changes (
 *   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
 *   project_id TEXT NOT NULL,
 *   team_id TEXT,
 *   type TEXT NOT NULL CHECK (type IN ('add', 'change', 'unlink')),
 *   path TEXT NOT NULL,
 *   size INTEGER,
 *   timestamp TIMESTAMPTZ NOT NULL,
 *   synced_at TIMESTAMPTZ DEFAULT NOW(),
 *   synced_by TEXT
 * );
 *
 * -- Indexes
 * CREATE INDEX idx_changes_project ON gicm_file_changes(project_id);
 * CREATE INDEX idx_changes_team ON gicm_file_changes(team_id);
 * CREATE INDEX idx_changes_timestamp ON gicm_file_changes(timestamp DESC);
 *
 * -- Enable realtime
 * ALTER PUBLICATION supabase_realtime ADD TABLE gicm_file_changes;
 * ```
 */
declare class SupabaseSync {
    private client;
    private config;
    private tableName;
    private channel;
    private changeHandlers;
    constructor(config: SyncConfig);
    /**
     * Lazy initialize Supabase client
     */
    private getClient;
    /**
     * Sync file changes to Supabase
     */
    syncChanges(changes: FileChange[]): Promise<SyncResult>;
    /**
     * Get recent changes from Supabase (for team sync)
     */
    getRemoteChanges(since?: Date, limit?: number): Promise<FileChange[]>;
    /**
     * Subscribe to realtime changes (for team collaboration)
     */
    subscribeToChanges(handler: (change: FileChange) => void): Promise<void>;
    /**
     * Unsubscribe from realtime changes
     */
    unsubscribe(): void;
    /**
     * Check if Supabase is configured and available
     */
    isAvailable(): Promise<boolean>;
}
/**
 * Create SupabaseSync from environment variables
 */
declare function createSyncFromEnv(): SupabaseSync | null;

export { Debouncer, type FileChange, FileWatcher, IncrementalIndexer, type IndexResult, SupabaseSync, type SyncConfig, type SyncResult, type WatcherConfig, type WatcherEvents, type WatcherState, createSyncFromEnv };
