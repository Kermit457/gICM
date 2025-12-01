/**
 * High Availability Types
 * Phase 12A: Multi-Region Support
 */

import { z } from "zod";

// =============================================================================
// REGION CONFIGURATION
// =============================================================================

export const RegionSchema = z.enum([
  "us-east-1",
  "us-west-2",
  "eu-west-1",
  "eu-central-1",
  "ap-southeast-1",
  "ap-northeast-1",
]);
export type Region = z.infer<typeof RegionSchema>;

export const RegionStatusSchema = z.enum([
  "active",
  "standby",
  "degraded",
  "offline",
  "draining",
]);
export type RegionStatus = z.infer<typeof RegionStatusSchema>;

export const RegionConfigSchema = z.object({
  id: z.string(),
  region: RegionSchema,
  endpoint: z.string().url(),
  status: RegionStatusSchema,
  isPrimary: z.boolean(),
  weight: z.number().min(0).max(100).default(100),
  healthEndpoint: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});
export type RegionConfig = z.infer<typeof RegionConfigSchema>;

// =============================================================================
// HEALTH CHECK
// =============================================================================

export const HealthCheckTypeSchema = z.enum([
  "http",
  "tcp",
  "grpc",
  "custom",
]);
export type HealthCheckType = z.infer<typeof HealthCheckTypeSchema>;

export const HealthCheckResultSchema = z.object({
  region: RegionSchema,
  healthy: z.boolean(),
  latencyMs: z.number(),
  statusCode: z.number().optional(),
  message: z.string().optional(),
  checkedAt: z.string(),
  consecutiveFailures: z.number().default(0),
  lastSuccessAt: z.string().optional(),
  lastFailureAt: z.string().optional(),
});
export type HealthCheckResult = z.infer<typeof HealthCheckResultSchema>;

export const HealthCheckConfigSchema = z.object({
  type: HealthCheckTypeSchema,
  intervalMs: z.number().default(30000),
  timeoutMs: z.number().default(5000),
  unhealthyThreshold: z.number().default(3),
  healthyThreshold: z.number().default(2),
  path: z.string().default("/health"),
  expectedStatus: z.number().default(200),
});
export type HealthCheckConfig = z.infer<typeof HealthCheckConfigSchema>;

// =============================================================================
// LOAD BALANCING
// =============================================================================

export const LoadBalanceStrategySchema = z.enum([
  "round-robin",
  "weighted",
  "least-connections",
  "latency-based",
  "geo-proximity",
  "failover",
]);
export type LoadBalanceStrategy = z.infer<typeof LoadBalanceStrategySchema>;

export const RouteDecisionSchema = z.object({
  region: RegionSchema,
  endpoint: z.string(),
  reason: z.string(),
  fallbackRegions: z.array(RegionSchema),
  metadata: z.record(z.unknown()).optional(),
});
export type RouteDecision = z.infer<typeof RouteDecisionSchema>;

// =============================================================================
// FAILOVER
// =============================================================================

export const FailoverModeSchema = z.enum([
  "automatic",
  "manual",
  "semi-automatic",
]);
export type FailoverMode = z.infer<typeof FailoverModeSchema>;

export const FailoverEventSchema = z.object({
  id: z.string(),
  fromRegion: RegionSchema,
  toRegion: RegionSchema,
  reason: z.string(),
  triggeredBy: z.enum(["health-check", "manual", "scheduled", "capacity"]),
  startedAt: z.string(),
  completedAt: z.string().optional(),
  status: z.enum(["in-progress", "completed", "failed", "rolled-back"]),
  affectedPipelines: z.number().default(0),
  metadata: z.record(z.unknown()).optional(),
});
export type FailoverEvent = z.infer<typeof FailoverEventSchema>;

export const FailoverConfigSchema = z.object({
  mode: FailoverModeSchema.default("automatic"),
  triggerThreshold: z.number().default(3),
  cooldownMs: z.number().default(300000),
  maxFailoversPerHour: z.number().default(3),
  notifyOnFailover: z.boolean().default(true),
  requireApproval: z.boolean().default(false),
  rollbackOnFailure: z.boolean().default(true),
});
export type FailoverConfig = z.infer<typeof FailoverConfigSchema>;

// =============================================================================
// REPLICATION
// =============================================================================

export const ReplicationModeSchema = z.enum([
  "sync",
  "async",
  "semi-sync",
]);
export type ReplicationMode = z.infer<typeof ReplicationModeSchema>;

export const ReplicationStatusSchema = z.object({
  sourceRegion: RegionSchema,
  targetRegion: RegionSchema,
  mode: ReplicationModeSchema,
  lagMs: z.number(),
  bytesReplicated: z.number(),
  lastReplicatedAt: z.string(),
  healthy: z.boolean(),
  error: z.string().optional(),
});
export type ReplicationStatus = z.infer<typeof ReplicationStatusSchema>;

export const ReplicationConfigSchema = z.object({
  mode: ReplicationModeSchema.default("async"),
  targetRegions: z.array(RegionSchema),
  maxLagMs: z.number().default(5000),
  batchSize: z.number().default(100),
  retryAttempts: z.number().default(3),
  conflictResolution: z.enum(["last-write-wins", "merge", "manual"]).default("last-write-wins"),
});
export type ReplicationConfig = z.infer<typeof ReplicationConfigSchema>;

// =============================================================================
// SESSION AFFINITY
// =============================================================================

export const SessionAffinitySchema = z.object({
  enabled: z.boolean().default(false),
  ttlMs: z.number().default(3600000),
  cookieName: z.string().default("gicm_region"),
  strategy: z.enum(["cookie", "ip-hash", "header"]).default("cookie"),
});
export type SessionAffinity = z.infer<typeof SessionAffinitySchema>;

// =============================================================================
// HA MANAGER CONFIGURATION
// =============================================================================

export const HAManagerConfigSchema = z.object({
  regions: z.array(RegionConfigSchema),
  healthCheck: HealthCheckConfigSchema.optional(),
  loadBalancing: z.object({
    strategy: LoadBalanceStrategySchema.default("weighted"),
    stickySession: SessionAffinitySchema.optional(),
  }).optional(),
  failover: FailoverConfigSchema.optional(),
  replication: ReplicationConfigSchema.optional(),
  monitoring: z.object({
    enabled: z.boolean().default(true),
    metricsIntervalMs: z.number().default(60000),
    alertThresholds: z.object({
      latencyMs: z.number().default(500),
      errorRate: z.number().default(0.05),
      availabilityPercent: z.number().default(99.9),
    }).optional(),
  }).optional(),
});
export type HAManagerConfig = z.infer<typeof HAManagerConfigSchema>;

// =============================================================================
// HA STATE
// =============================================================================

export const HAStateSchema = z.object({
  primaryRegion: RegionSchema,
  activeRegions: z.array(RegionSchema),
  regionHealth: z.record(RegionSchema, HealthCheckResultSchema),
  replicationStatus: z.array(ReplicationStatusSchema),
  lastFailover: FailoverEventSchema.optional(),
  failoverCount24h: z.number().default(0),
  globalLatencyMs: z.number(),
  globalAvailability: z.number(),
  lastUpdated: z.string(),
});
export type HAState = z.infer<typeof HAStateSchema>;

// =============================================================================
// HA EVENTS
// =============================================================================

export interface HAEvents {
  "health:checked": (results: HealthCheckResult[]) => void;
  "health:degraded": (region: Region, result: HealthCheckResult) => void;
  "health:recovered": (region: Region, result: HealthCheckResult) => void;
  "failover:started": (event: FailoverEvent) => void;
  "failover:completed": (event: FailoverEvent) => void;
  "failover:failed": (event: FailoverEvent, error: Error) => void;
  "replication:lag": (status: ReplicationStatus) => void;
  "region:added": (config: RegionConfig) => void;
  "region:removed": (region: Region) => void;
  "region:status_changed": (region: Region, oldStatus: RegionStatus, newStatus: RegionStatus) => void;
}

// =============================================================================
// CONSTANTS
// =============================================================================

export const REGION_DISPLAY_NAMES: Record<Region, string> = {
  "us-east-1": "US East (N. Virginia)",
  "us-west-2": "US West (Oregon)",
  "eu-west-1": "EU (Ireland)",
  "eu-central-1": "EU (Frankfurt)",
  "ap-southeast-1": "Asia Pacific (Singapore)",
  "ap-northeast-1": "Asia Pacific (Tokyo)",
};

export const DEFAULT_HEALTH_CHECK_CONFIG: HealthCheckConfig = {
  type: "http",
  intervalMs: 30000,
  timeoutMs: 5000,
  unhealthyThreshold: 3,
  healthyThreshold: 2,
  path: "/health",
  expectedStatus: 200,
};

export const DEFAULT_FAILOVER_CONFIG: FailoverConfig = {
  mode: "automatic",
  triggerThreshold: 3,
  cooldownMs: 300000,
  maxFailoversPerHour: 3,
  notifyOnFailover: true,
  requireApproval: false,
  rollbackOnFailure: true,
};
