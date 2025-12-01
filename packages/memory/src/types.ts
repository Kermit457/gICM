/**
 * AI Memory Types
 * Type definitions for persistent context storage
 */

import { z } from "zod";

// Memory entry schema
export const MemoryEntrySchema = z.object({
  id: z.string(),
  key: z.string(),
  value: z.unknown(),
  type: z.enum(["fact", "preference", "context", "decision", "outcome"]),
  confidence: z.number().min(0).max(1).default(1),
  source: z.string().optional(),
  tags: z.array(z.string()).default([]),
  expiresAt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  accessCount: z.number().default(0),
  lastAccessedAt: z.string().datetime().optional(),
});

export type MemoryEntry = z.infer<typeof MemoryEntrySchema>;

// Memory namespace for scoping
export const MemoryNamespaceSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  parentId: z.string().optional(),
  createdAt: z.string().datetime(),
});

export type MemoryNamespace = z.infer<typeof MemoryNamespaceSchema>;

// Memory config
export const MemoryConfigSchema = z.object({
  storagePath: z.string().default(".gicm/memory"),
  maxEntries: z.number().default(10000),
  defaultExpiration: z.number().optional(), // Days
  cleanupInterval: z.number().default(3600000), // 1 hour in ms
  enableCompression: z.boolean().default(false),
  encryptionKey: z.string().optional(),
});

export type MemoryConfig = z.infer<typeof MemoryConfigSchema>;

// Memory query
export interface MemoryQuery {
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

// Memory events
export interface MemoryEvents {
  stored: (entry: MemoryEntry) => void;
  retrieved: (entry: MemoryEntry) => void;
  updated: (entry: MemoryEntry) => void;
  deleted: (id: string) => void;
  expired: (entries: MemoryEntry[]) => void;
  error: (error: Error) => void;
}

// Memory stats
export interface MemoryStats {
  totalEntries: number;
  byType: Record<MemoryEntry["type"], number>;
  byNamespace: Record<string, number>;
  storageSize: number;
  oldestEntry: string | null;
  newestEntry: string | null;
  expiringSoon: number; // Entries expiring within 24 hours
}

// Input types for creating/updating memories
export interface CreateMemoryInput {
  key: string;
  value: unknown;
  type: MemoryEntry["type"];
  confidence?: number;
  source?: string;
  tags?: string[];
  expiresIn?: number; // Seconds
  namespace?: string;
}

export interface UpdateMemoryInput {
  value?: unknown;
  confidence?: number;
  tags?: string[];
  expiresIn?: number; // Seconds
}

// Default config values
export const DEFAULT_MEMORY_CONFIG: MemoryConfig = {
  storagePath: ".gicm/memory",
  maxEntries: 10000,
  cleanupInterval: 3600000,
  enableCompression: false,
};
