/**
 * Feature Flags Types
 * Phase 15A: Feature Flags & Progressive Rollouts
 */

import { z } from "zod";

// =============================================================================
// Flag Types & Variations
// =============================================================================

export const FlagTypeSchema = z.enum([
  "boolean", // Simple on/off
  "string", // String variations
  "number", // Numeric variations
  "json", // Complex JSON variations
]);
export type FlagType = z.infer<typeof FlagTypeSchema>;

export const FlagVariationSchema = z.object({
  id: z.string(),
  value: z.unknown(),
  name: z.string(),
  description: z.string().optional(),
});
export type FlagVariation = z.infer<typeof FlagVariationSchema>;

export const FlagStatusSchema = z.enum([
  "active", // Flag is active and being evaluated
  "inactive", // Flag is turned off
  "archived", // Flag is archived (soft deleted)
]);
export type FlagStatus = z.infer<typeof FlagStatusSchema>;

// =============================================================================
// Targeting Rules
// =============================================================================

export const OperatorSchema = z.enum([
  "eq", // equals
  "neq", // not equals
  "gt", // greater than
  "gte", // greater than or equal
  "lt", // less than
  "lte", // less than or equal
  "contains", // string contains
  "not_contains", // string does not contain
  "starts_with", // string starts with
  "ends_with", // string ends with
  "matches", // regex match
  "in", // in list
  "not_in", // not in list
  "semver_eq", // semantic version equals
  "semver_gt", // semantic version greater than
  "semver_lt", // semantic version less than
]);
export type Operator = z.infer<typeof OperatorSchema>;

export const TargetingConditionSchema = z.object({
  attribute: z.string(),
  operator: OperatorSchema,
  value: z.unknown(),
  negate: z.boolean().default(false),
});
export type TargetingCondition = z.infer<typeof TargetingConditionSchema>;

export const TargetingRuleSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  description: z.string().optional(),
  conditions: z.array(TargetingConditionSchema).min(1),
  conditionLogic: z.enum(["and", "or"]).default("and"),
  variationId: z.string(),
  priority: z.number().default(0),
  enabled: z.boolean().default(true),
});
export type TargetingRule = z.infer<typeof TargetingRuleSchema>;

// =============================================================================
// Segments
// =============================================================================

export const SegmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  conditions: z.array(TargetingConditionSchema),
  conditionLogic: z.enum(["and", "or"]).default("and"),
  createdAt: z.number(),
  updatedAt: z.number(),
});
export type Segment = z.infer<typeof SegmentSchema>;

export const SegmentRuleSchema = z.object({
  id: z.string(),
  segmentId: z.string(),
  variationId: z.string(),
  priority: z.number().default(0),
  enabled: z.boolean().default(true),
});
export type SegmentRule = z.infer<typeof SegmentRuleSchema>;

// =============================================================================
// Percentage Rollout
// =============================================================================

export const RolloutWeightSchema = z.object({
  variationId: z.string(),
  weight: z.number().min(0).max(100),
});
export type RolloutWeight = z.infer<typeof RolloutWeightSchema>;

export const PercentageRolloutSchema = z.object({
  enabled: z.boolean().default(false),
  weights: z.array(RolloutWeightSchema),
  bucketBy: z.string().default("userId").describe("Attribute to bucket by for consistent assignment"),
  seed: z.string().optional().describe("Seed for hash function"),
});
export type PercentageRollout = z.infer<typeof PercentageRolloutSchema>;

// =============================================================================
// Scheduled Rollout
// =============================================================================

export const ScheduledChangeSchema = z.object({
  id: z.string(),
  scheduledAt: z.number(),
  action: z.enum(["enable", "disable", "update_rollout", "update_default"]),
  payload: z.record(z.unknown()).optional(),
  executed: z.boolean().default(false),
  executedAt: z.number().optional(),
});
export type ScheduledChange = z.infer<typeof ScheduledChangeSchema>;

// =============================================================================
// Flag Definition
// =============================================================================

export const FlagDefinitionSchema = z.object({
  id: z.string(),
  key: z.string().regex(/^[a-z][a-z0-9_-]*$/, "Key must be lowercase alphanumeric with underscores/hyphens"),
  name: z.string(),
  description: z.string().optional(),
  type: FlagTypeSchema,
  status: FlagStatusSchema.default("active"),

  // Variations
  variations: z.array(FlagVariationSchema).min(2),
  defaultVariationId: z.string(),
  offVariationId: z.string().describe("Variation to serve when flag is off"),

  // Targeting
  targetingRules: z.array(TargetingRuleSchema).default([]),
  segmentRules: z.array(SegmentRuleSchema).default([]),
  percentageRollout: PercentageRolloutSchema.optional(),

  // Individual targets (allowlist/blocklist)
  individualTargets: z.array(z.object({
    userId: z.string(),
    variationId: z.string(),
  })).default([]),

  // Prerequisites (flags that must be enabled)
  prerequisites: z.array(z.object({
    flagKey: z.string(),
    variationId: z.string(),
  })).default([]),

  // Scheduling
  scheduledChanges: z.array(ScheduledChangeSchema).default([]),

  // Metadata
  tags: z.array(z.string()).default([]),
  owner: z.string().optional(),
  environment: z.string().default("production"),
  project: z.string().optional(),

  // Audit
  createdAt: z.number(),
  updatedAt: z.number(),
  createdBy: z.string().optional(),
  updatedBy: z.string().optional(),
});
export type FlagDefinition = z.infer<typeof FlagDefinitionSchema>;

// =============================================================================
// Evaluation Context
// =============================================================================

export const EvaluationContextSchema = z.object({
  // User attributes
  userId: z.string().optional(),
  email: z.string().optional(),
  name: z.string().optional(),

  // Organization/team
  organizationId: z.string().optional(),
  teamId: z.string().optional(),

  // Device/platform
  platform: z.string().optional(),
  deviceType: z.string().optional(),
  browser: z.string().optional(),
  os: z.string().optional(),
  appVersion: z.string().optional(),

  // Location
  country: z.string().optional(),
  region: z.string().optional(),
  city: z.string().optional(),
  timezone: z.string().optional(),

  // Custom attributes
  custom: z.record(z.unknown()).default({}),

  // Request metadata
  requestId: z.string().optional(),
  timestamp: z.number().optional(),
});
export type EvaluationContext = z.infer<typeof EvaluationContextSchema>;

// =============================================================================
// Evaluation Result
// =============================================================================

export const EvaluationReasonSchema = z.enum([
  "off", // Flag is off
  "fallthrough", // Default variation
  "target_match", // Individual target matched
  "rule_match", // Targeting rule matched
  "segment_match", // Segment rule matched
  "percentage_rollout", // Percentage rollout
  "prerequisite_failed", // Prerequisite not met
  "error", // Evaluation error
  "stale", // Using stale/cached value
]);
export type EvaluationReason = z.infer<typeof EvaluationReasonSchema>;

export const EvaluationResultSchema = z.object({
  flagKey: z.string(),
  value: z.unknown(),
  variationId: z.string(),
  reason: EvaluationReasonSchema,
  ruleId: z.string().optional(),
  segmentId: z.string().optional(),
  isDefaultValue: z.boolean().default(false),
  evaluationTime: z.number().describe("Evaluation time in ms"),
  metadata: z.record(z.unknown()).optional(),
});
export type EvaluationResult = z.infer<typeof EvaluationResultSchema>;

// =============================================================================
// Flag Analytics
// =============================================================================

export const FlagEvaluationEventSchema = z.object({
  id: z.string(),
  timestamp: z.number(),
  flagKey: z.string(),
  variationId: z.string(),
  reason: EvaluationReasonSchema,
  context: EvaluationContextSchema.partial(),
  evaluationTime: z.number(),
});
export type FlagEvaluationEvent = z.infer<typeof FlagEvaluationEventSchema>;

export const FlagStatsSchema = z.object({
  flagKey: z.string(),
  totalEvaluations: z.number(),
  uniqueUsers: z.number(),
  variationCounts: z.record(z.number()),
  reasonCounts: z.record(z.number()),
  avgEvaluationTime: z.number(),
  lastEvaluatedAt: z.number().optional(),
});
export type FlagStats = z.infer<typeof FlagStatsSchema>;

// =============================================================================
// Configuration
// =============================================================================

export const FlagManagerConfigSchema = z.object({
  // Environment
  environment: z.string().default("production"),
  project: z.string().optional(),

  // Caching
  cacheEnabled: z.boolean().default(true),
  cacheTtlSeconds: z.number().default(60),
  staleTtlSeconds: z.number().default(300).describe("How long to serve stale data on error"),

  // Streaming/Polling
  streamingEnabled: z.boolean().default(false),
  pollingIntervalSeconds: z.number().default(30),

  // Analytics
  analyticsEnabled: z.boolean().default(true),
  analyticsSampleRate: z.number().min(0).max(1).default(1),
  analyticsFlushIntervalSeconds: z.number().default(60),

  // Defaults
  defaultOnError: z.boolean().default(false),

  // Bootstrap (initial flag values)
  bootstrap: z.record(z.unknown()).optional(),

  // Provider integration
  provider: z.enum(["memory", "launchdarkly", "unleash", "flagsmith", "custom"]).default("memory"),
  providerConfig: z.record(z.unknown()).optional(),
});
export type FlagManagerConfig = z.infer<typeof FlagManagerConfigSchema>;

// =============================================================================
// Events
// =============================================================================

export type FlagEvents = {
  // Flag Lifecycle
  flagCreated: (flag: FlagDefinition) => void;
  flagUpdated: (flag: FlagDefinition, changes: string[]) => void;
  flagDeleted: (flagKey: string) => void;
  flagStatusChanged: (flagKey: string, status: FlagStatus) => void;

  // Evaluation
  evaluated: (result: EvaluationResult, context: EvaluationContext) => void;
  evaluationError: (flagKey: string, error: Error, context: EvaluationContext) => void;

  // Targeting
  targetingRuleAdded: (flagKey: string, rule: TargetingRule) => void;
  targetingRuleRemoved: (flagKey: string, ruleId: string) => void;

  // Rollout
  rolloutUpdated: (flagKey: string, rollout: PercentageRollout) => void;

  // Scheduled
  scheduledChangeExecuted: (flagKey: string, change: ScheduledChange) => void;

  // Cache
  cacheUpdated: (flagKeys: string[]) => void;
  cacheMiss: (flagKey: string) => void;

  // Analytics
  analyticsFlush: (events: FlagEvaluationEvent[]) => void;

  // Errors
  error: (error: Error) => void;
};

// =============================================================================
// Storage Interface
// =============================================================================

export interface FlagStorage {
  // Flags
  getFlag(key: string): Promise<FlagDefinition | null>;
  saveFlag(flag: FlagDefinition): Promise<void>;
  deleteFlag(key: string): Promise<void>;
  listFlags(filters?: { status?: FlagStatus; environment?: string; project?: string; tags?: string[] }): Promise<FlagDefinition[]>;

  // Segments
  getSegment(id: string): Promise<Segment | null>;
  saveSegment(segment: Segment): Promise<void>;
  deleteSegment(id: string): Promise<void>;
  listSegments(): Promise<Segment[]>;

  // Analytics
  saveEvaluationEvent(event: FlagEvaluationEvent): Promise<void>;
  getEvaluationEvents(flagKey: string, startTime: number, endTime: number): Promise<FlagEvaluationEvent[]>;
  getStats(flagKey: string): Promise<FlagStats | null>;
}

// =============================================================================
// Provider Interface
// =============================================================================

export interface FlagProvider {
  readonly name: string;
  initialize(): Promise<void>;
  shutdown(): Promise<void>;
  getFlag(key: string): Promise<FlagDefinition | null>;
  getAllFlags(): Promise<FlagDefinition[]>;
  subscribe?(callback: (flags: FlagDefinition[]) => void): () => void;
}

// =============================================================================
// Helpers
// =============================================================================

export function createBooleanFlag(
  key: string,
  name: string,
  defaultValue: boolean = false
): Omit<FlagDefinition, "id" | "createdAt" | "updatedAt"> {
  return {
    key,
    name,
    type: "boolean",
    status: "active",
    variations: [
      { id: "true", value: true, name: "Enabled" },
      { id: "false", value: false, name: "Disabled" },
    ],
    defaultVariationId: defaultValue ? "true" : "false",
    offVariationId: "false",
    targetingRules: [],
    segmentRules: [],
    individualTargets: [],
    prerequisites: [],
    scheduledChanges: [],
    tags: [],
    environment: "production",
  };
}

export function createStringFlag(
  key: string,
  name: string,
  variations: Array<{ id: string; value: string; name: string }>,
  defaultVariationId: string
): Omit<FlagDefinition, "id" | "createdAt" | "updatedAt"> {
  return {
    key,
    name,
    type: "string",
    status: "active",
    variations: variations.map(v => ({ ...v, value: v.value })),
    defaultVariationId,
    offVariationId: variations[0]?.id ?? defaultVariationId,
    targetingRules: [],
    segmentRules: [],
    individualTargets: [],
    prerequisites: [],
    scheduledChanges: [],
    tags: [],
    environment: "production",
  };
}

export function createPercentageRollout(
  enabledPercent: number,
  bucketBy: string = "userId"
): PercentageRollout {
  return {
    enabled: true,
    weights: [
      { variationId: "true", weight: enabledPercent },
      { variationId: "false", weight: 100 - enabledPercent },
    ],
    bucketBy,
  };
}

export function createTargetingRule(
  attribute: string,
  operator: Operator,
  value: unknown,
  variationId: string
): Omit<TargetingRule, "id"> {
  return {
    conditions: [{ attribute, operator, value, negate: false }],
    conditionLogic: "and",
    variationId,
    priority: 0,
    enabled: true,
  };
}
