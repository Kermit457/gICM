/**
 * Multi-Region Types
 * Phase 15C: Multi-Region Support
 */

import { z } from "zod";

// =============================================================================
// Region Types
// =============================================================================

export const RegionIdSchema = z.string().regex(/^[a-z]{2,3}-[a-z]+-\d+$/, "Region ID format: us-east-1");
export type RegionId = z.infer<typeof RegionIdSchema>;

export const RegionStatusSchema = z.enum([
  "active", // Region is healthy and serving traffic
  "degraded", // Region has issues but still serving
  "draining", // Region is being drained for maintenance
  "inactive", // Region is offline
  "provisioning", // Region is being set up
]);
export type RegionStatus = z.infer<typeof RegionStatusSchema>;

export const RegionRoleSchema = z.enum([
  "primary", // Primary region for writes
  "secondary", // Secondary region for reads
  "standby", // Hot standby for failover
  "disaster_recovery", // DR site
]);
export type RegionRole = z.infer<typeof RegionRoleSchema>;

export const RegionDefinitionSchema = z.object({
  id: RegionIdSchema,
  name: z.string(),
  displayName: z.string().optional(),
  provider: z.enum(["aws", "gcp", "azure", "custom"]),
  role: RegionRoleSchema.default("secondary"),
  status: RegionStatusSchema.default("active"),

  // Location
  location: z.object({
    country: z.string(),
    city: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
  }),

  // Capacity
  capacity: z.object({
    maxConnections: z.number().default(10000),
    maxRPS: z.number().default(10000),
    currentLoad: z.number().default(0),
  }).optional(),

  // Endpoints
  endpoints: z.object({
    api: z.string().optional(),
    internal: z.string().optional(),
    database: z.string().optional(),
    cache: z.string().optional(),
  }).optional(),

  // Metadata
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
});
export type RegionDefinition = z.infer<typeof RegionDefinitionSchema>;

// =============================================================================
// Replication Types
// =============================================================================

export const ReplicationModeSchema = z.enum([
  "sync", // Synchronous replication (strong consistency)
  "async", // Asynchronous replication (eventual consistency)
  "semi_sync", // Semi-synchronous (ack from at least one replica)
]);
export type ReplicationMode = z.infer<typeof ReplicationModeSchema>;

export const ConflictResolutionSchema = z.enum([
  "last_write_wins", // LWW based on timestamp
  "first_write_wins", // FWW
  "merge", // Automatic merge
  "custom", // Custom resolver
  "manual", // Queue for manual resolution
]);
export type ConflictResolution = z.infer<typeof ConflictResolutionSchema>;

export const ReplicationConfigSchema = z.object({
  mode: ReplicationModeSchema.default("async"),
  conflictResolution: ConflictResolutionSchema.default("last_write_wins"),

  // Targets
  sourceRegion: RegionIdSchema,
  targetRegions: z.array(RegionIdSchema),

  // Filters
  includeCollections: z.array(z.string()).optional(),
  excludeCollections: z.array(z.string()).optional(),
  filter: z.string().optional().describe("Custom filter expression"),

  // Timing
  batchSize: z.number().default(100),
  batchIntervalMs: z.number().default(100),
  maxLagMs: z.number().default(5000).describe("Max acceptable replication lag"),

  // Retry
  retryAttempts: z.number().default(3),
  retryBackoffMs: z.number().default(1000),
});
export type ReplicationConfig = z.infer<typeof ReplicationConfigSchema>;

export const ReplicationStatusSchema = z.object({
  sourceRegion: RegionIdSchema,
  targetRegion: RegionIdSchema,
  status: z.enum(["active", "paused", "error", "catching_up"]),
  lagMs: z.number(),
  lastSyncedAt: z.number().optional(),
  pendingOperations: z.number(),
  bytesReplicated: z.number(),
  errors: z.array(z.object({
    timestamp: z.number(),
    message: z.string(),
    retryCount: z.number(),
  })).default([]),
});
export type ReplicationStatus = z.infer<typeof ReplicationStatusSchema>;

// =============================================================================
// Conflict Types
// =============================================================================

export const ConflictSchema = z.object({
  id: z.string(),
  timestamp: z.number(),
  collection: z.string(),
  documentId: z.string(),
  sourceRegion: RegionIdSchema,
  targetRegion: RegionIdSchema,
  sourceVersion: z.unknown(),
  targetVersion: z.unknown(),
  resolution: ConflictResolutionSchema.optional(),
  resolvedAt: z.number().optional(),
  resolvedBy: z.string().optional(),
  resolvedValue: z.unknown().optional(),
});
export type Conflict = z.infer<typeof ConflictSchema>;

// =============================================================================
// Routing Types
// =============================================================================

export const RoutingStrategySchema = z.enum([
  "latency", // Route to lowest latency region
  "geo", // Route based on geography
  "round_robin", // Round robin across regions
  "weighted", // Weighted distribution
  "failover", // Primary with failover
  "custom", // Custom routing logic
]);
export type RoutingStrategy = z.infer<typeof RoutingStrategySchema>;

export const RoutingRuleSchema = z.object({
  id: z.string(),
  name: z.string(),
  priority: z.number().default(0),
  enabled: z.boolean().default(true),

  // Conditions
  conditions: z.array(z.object({
    type: z.enum(["geo", "header", "path", "query", "custom"]),
    field: z.string(),
    operator: z.enum(["eq", "neq", "contains", "starts_with", "in"]),
    value: z.unknown(),
  })).default([]),

  // Action
  action: z.object({
    type: z.enum(["route", "redirect", "reject"]),
    regions: z.array(RegionIdSchema).optional(),
    weights: z.record(z.number()).optional(),
  }),
});
export type RoutingRule = z.infer<typeof RoutingRuleSchema>;

export const RoutingDecisionSchema = z.object({
  requestId: z.string(),
  timestamp: z.number(),
  sourceRegion: RegionIdSchema.optional(),
  targetRegion: RegionIdSchema,
  strategy: RoutingStrategySchema,
  ruleId: z.string().optional(),
  latencyMs: z.number().optional(),
  metadata: z.record(z.unknown()).optional(),
});
export type RoutingDecision = z.infer<typeof RoutingDecisionSchema>;

// =============================================================================
// Sync Types
// =============================================================================

export const SyncOperationSchema = z.object({
  id: z.string(),
  type: z.enum(["create", "update", "delete"]),
  collection: z.string(),
  documentId: z.string(),
  data: z.unknown().optional(),
  timestamp: z.number(),
  sourceRegion: RegionIdSchema,
  vectorClock: z.record(z.number()).optional(),
});
export type SyncOperation = z.infer<typeof SyncOperationSchema>;

export const SyncBatchSchema = z.object({
  id: z.string(),
  sourceRegion: RegionIdSchema,
  targetRegion: RegionIdSchema,
  operations: z.array(SyncOperationSchema),
  createdAt: z.number(),
  sentAt: z.number().optional(),
  ackedAt: z.number().optional(),
  status: z.enum(["pending", "sent", "acked", "failed"]),
});
export type SyncBatch = z.infer<typeof SyncBatchSchema>;

// =============================================================================
// Health Types
// =============================================================================

export const RegionHealthSchema = z.object({
  regionId: RegionIdSchema,
  timestamp: z.number(),
  status: RegionStatusSchema,
  latencyMs: z.number(),
  errorRate: z.number(),
  availability: z.number(),
  cpuUsage: z.number().optional(),
  memoryUsage: z.number().optional(),
  activeConnections: z.number().optional(),
  replicationLagMs: z.number().optional(),
});
export type RegionHealth = z.infer<typeof RegionHealthSchema>;

// =============================================================================
// Failover Types
// =============================================================================

export const FailoverTriggerSchema = z.enum([
  "manual", // Manual failover
  "health_check", // Automated based on health
  "latency", // Latency threshold exceeded
  "error_rate", // Error rate threshold exceeded
  "scheduled", // Scheduled maintenance
]);
export type FailoverTrigger = z.infer<typeof FailoverTriggerSchema>;

export const FailoverEventSchema = z.object({
  id: z.string(),
  timestamp: z.number(),
  trigger: FailoverTriggerSchema,
  fromRegion: RegionIdSchema,
  toRegion: RegionIdSchema,
  reason: z.string(),
  duration: z.number().optional(),
  status: z.enum(["initiated", "in_progress", "completed", "failed", "rolled_back"]),
  initiatedBy: z.string().optional(),
});
export type FailoverEvent = z.infer<typeof FailoverEventSchema>;

// =============================================================================
// Configuration
// =============================================================================

export const MultiRegionConfigSchema = z.object({
  // Current region
  currentRegion: RegionIdSchema,

  // Regions
  regions: z.array(RegionDefinitionSchema).min(1),

  // Replication
  replication: ReplicationConfigSchema.optional(),

  // Routing
  routing: z.object({
    strategy: RoutingStrategySchema.default("latency"),
    rules: z.array(RoutingRuleSchema).default([]),
    weights: z.record(z.number()).optional(),
  }).optional(),

  // Failover
  failover: z.object({
    enabled: z.boolean().default(true),
    healthCheckIntervalSeconds: z.number().default(10),
    failoverThreshold: z.number().default(3).describe("Consecutive failures before failover"),
    autoFailback: z.boolean().default(false),
    failbackDelaySeconds: z.number().default(300),
  }).optional(),

  // Sync
  sync: z.object({
    enabled: z.boolean().default(true),
    batchSize: z.number().default(100),
    flushIntervalMs: z.number().default(100),
  }).optional(),

  // Consistency
  consistency: z.object({
    readConsistency: z.enum(["eventual", "session", "strong"]).default("eventual"),
    writeConsistency: z.enum(["local", "quorum", "all"]).default("local"),
  }).optional(),
});
export type MultiRegionConfig = z.infer<typeof MultiRegionConfigSchema>;

// =============================================================================
// Events
// =============================================================================

export type MultiRegionEvents = {
  // Region Events
  regionAdded: (region: RegionDefinition) => void;
  regionRemoved: (regionId: RegionId) => void;
  regionStatusChanged: (regionId: RegionId, status: RegionStatus, previousStatus: RegionStatus) => void;
  regionRoleChanged: (regionId: RegionId, role: RegionRole, previousRole: RegionRole) => void;

  // Replication Events
  replicationStarted: (sourceRegion: RegionId, targetRegion: RegionId) => void;
  replicationStopped: (sourceRegion: RegionId, targetRegion: RegionId) => void;
  replicationLagWarning: (targetRegion: RegionId, lagMs: number) => void;
  replicationError: (targetRegion: RegionId, error: Error) => void;

  // Sync Events
  syncBatchSent: (batch: SyncBatch) => void;
  syncBatchAcked: (batchId: string) => void;
  syncBatchFailed: (batchId: string, error: Error) => void;

  // Conflict Events
  conflictDetected: (conflict: Conflict) => void;
  conflictResolved: (conflict: Conflict) => void;

  // Failover Events
  failoverInitiated: (event: FailoverEvent) => void;
  failoverCompleted: (event: FailoverEvent) => void;
  failoverFailed: (event: FailoverEvent, error: Error) => void;
  failbackInitiated: (event: FailoverEvent) => void;

  // Routing Events
  routingDecision: (decision: RoutingDecision) => void;

  // Health Events
  healthCheck: (health: RegionHealth) => void;
  regionUnhealthy: (regionId: RegionId, health: RegionHealth) => void;
  regionRecovered: (regionId: RegionId) => void;

  // Errors
  error: (error: Error) => void;
};

// =============================================================================
// Storage Interface
// =============================================================================

export interface MultiRegionStorage {
  // Regions
  getRegion(id: RegionId): Promise<RegionDefinition | null>;
  saveRegion(region: RegionDefinition): Promise<void>;
  deleteRegion(id: RegionId): Promise<void>;
  listRegions(): Promise<RegionDefinition[]>;

  // Replication Status
  getReplicationStatus(sourceRegion: RegionId, targetRegion: RegionId): Promise<ReplicationStatus | null>;
  saveReplicationStatus(status: ReplicationStatus): Promise<void>;

  // Conflicts
  saveConflict(conflict: Conflict): Promise<void>;
  getConflict(id: string): Promise<Conflict | null>;
  listConflicts(filters?: { resolved?: boolean }): Promise<Conflict[]>;

  // Sync Operations
  enqueueSyncOperation(operation: SyncOperation): Promise<void>;
  dequeueSyncOperations(targetRegion: RegionId, limit: number): Promise<SyncOperation[]>;
  ackSyncOperations(ids: string[]): Promise<void>;

  // Failover History
  saveFailoverEvent(event: FailoverEvent): Promise<void>;
  getFailoverHistory(limit?: number): Promise<FailoverEvent[]>;

  // Health
  saveRegionHealth(health: RegionHealth): Promise<void>;
  getRegionHealth(regionId: RegionId): Promise<RegionHealth | null>;
}

// =============================================================================
// Constants
// =============================================================================

export const DEFAULT_REGIONS = {
  "us-east-1": { name: "US East (N. Virginia)", provider: "aws" as const, location: { country: "US", city: "Virginia" } },
  "us-west-2": { name: "US West (Oregon)", provider: "aws" as const, location: { country: "US", city: "Oregon" } },
  "eu-west-1": { name: "EU (Ireland)", provider: "aws" as const, location: { country: "IE", city: "Dublin" } },
  "eu-central-1": { name: "EU (Frankfurt)", provider: "aws" as const, location: { country: "DE", city: "Frankfurt" } },
  "ap-southeast-1": { name: "Asia Pacific (Singapore)", provider: "aws" as const, location: { country: "SG", city: "Singapore" } },
  "ap-northeast-1": { name: "Asia Pacific (Tokyo)", provider: "aws" as const, location: { country: "JP", city: "Tokyo" } },
} as const;

export const REPLICATION_LAG_THRESHOLDS = {
  healthy: 100, // < 100ms
  warning: 1000, // 100ms - 1s
  critical: 5000, // > 5s
} as const;
