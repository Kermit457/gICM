/**
 * Watcher Types
 * Core type definitions for file watching and live sync
 */

import { z } from "zod";

// File change types
export const ChangeTypeSchema = z.enum(["add", "change", "unlink"]);
export type ChangeType = z.infer<typeof ChangeTypeSchema>;

// File change event
export const FileChangeSchema = z.object({
  type: ChangeTypeSchema,
  path: z.string(),
  timestamp: z.string(),
  size: z.number().optional(),
  hash: z.string().optional(),
});
export type FileChange = z.infer<typeof FileChangeSchema>;

// Watcher status
export const WatcherStatusSchema = z.enum(["idle", "watching", "indexing", "stopped", "error"]);
export type WatcherStatus = z.infer<typeof WatcherStatusSchema>;

// Watcher state
export interface WatcherState {
  status: WatcherStatus;
  watchPath: string;
  startedAt?: string;
  lastChangeAt?: string;
  totalChanges: number;
  pendingIndex: number;
  error?: string;
}

// Watcher configuration
export interface WatcherConfig {
  path: string;
  autoIndex: boolean;
  debounceMs: number;
  ignorePatterns: string[];
  contextEngineUrl: string;
}

// Watcher events
export interface WatcherEvents {
  started: (state: WatcherState) => void;
  stopped: (state: WatcherState) => void;
  change: (change: FileChange) => void;
  indexed: (files: string[], duration: number) => void;
  error: (error: Error) => void;
}

// Index request
export interface IndexRequest {
  files: string[];
  full?: boolean;
}

// Index result
export interface IndexResult {
  success: boolean;
  filesIndexed: number;
  duration: number;
  error?: string;
}

// Default configuration
export const DEFAULT_WATCHER_CONFIG: WatcherConfig = {
  path: process.cwd(),
  autoIndex: true,
  debounceMs: 500,
  ignorePatterns: [
    "**/node_modules/**",
    "**/.git/**",
    "**/dist/**",
    "**/.next/**",
    "**/coverage/**",
    "**/*.log",
    "**/.gicm/watch.pid",
    "**/.gicm/changes.log",
  ],
  contextEngineUrl: "http://localhost:8000",
};
