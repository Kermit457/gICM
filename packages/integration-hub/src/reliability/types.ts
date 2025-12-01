/**
 * Reliability Types
 * Phase 12: Reliability & Resilience
 */

import { z } from "zod";

// ============================================================================
// Circuit Breaker (12A)
// ============================================================================

export const CircuitStateSchema = z.enum(["closed", "open", "half_open"]);
export type CircuitState = z.infer<typeof CircuitStateSchema>;

export const CircuitBreakerConfigSchema = z.object({
  name: z.string(),
  failureThreshold: z.number().min(1).default(5),
  successThreshold: z.number().min(1).default(3),
  timeout: z.number().min(1000).default(30000), // Time in OPEN before trying HALF_OPEN
  volumeThreshold: z.number().min(1).default(10), // Min requests before tripping
  errorPercentageThreshold: z.number().min(0).max(100).default(50),
  rollingWindowMs: z.number().default(60000), // Window for calculating error rate
  halfOpenMaxCalls: z.number().min(1).default(3), // Max calls in HALF_OPEN
});
export type CircuitBreakerConfig = z.infer<typeof CircuitBreakerConfigSchema>;

export const CircuitStatsSchema = z.object({
  totalRequests: z.number(),
  successfulRequests: z.number(),
  failedRequests: z.number(),
  rejectedRequests: z.number(),
  lastFailureTime: z.date().optional(),
  lastSuccessTime: z.date().optional(),
  stateChangedAt: z.date(),
  consecutiveFailures: z.number(),
  consecutiveSuccesses: z.number(),
});
export type CircuitStats = z.infer<typeof CircuitStatsSchema>;

export const CircuitBreakerStateSchema = z.object({
  name: z.string(),
  state: CircuitStateSchema,
  stats: CircuitStatsSchema,
  config: CircuitBreakerConfigSchema,
});
export type CircuitBreakerState = z.infer<typeof CircuitBreakerStateSchema>;

// ============================================================================
// Retry Strategy (12B)
// ============================================================================

export const RetryStrategyTypeSchema = z.enum([
  "fixed",
  "linear",
  "exponential",
  "exponential_jitter",
]);
export type RetryStrategyType = z.infer<typeof RetryStrategyTypeSchema>;

export const RetryConfigSchema = z.object({
  maxRetries: z.number().min(0).default(3),
  strategy: RetryStrategyTypeSchema.default("exponential_jitter"),
  baseDelayMs: z.number().min(0).default(1000),
  maxDelayMs: z.number().min(0).default(30000),
  jitterFactor: z.number().min(0).max(1).default(0.2),
  retryableErrors: z.array(z.string()).optional(), // Error codes/names to retry
  nonRetryableErrors: z.array(z.string()).optional(), // Error codes to never retry
  retryBudgetPerMinute: z.number().optional(), // Max retries per minute
  onRetry: z.function().args(z.number(), z.unknown()).optional(),
});
export type RetryConfig = z.infer<typeof RetryConfigSchema>;

export const RetryAttemptSchema = z.object({
  attempt: z.number(),
  delay: z.number(),
  error: z.unknown().optional(),
  timestamp: z.date(),
});
export type RetryAttempt = z.infer<typeof RetryAttemptSchema>;

export const RetryResultSchema = z.object({
  success: z.boolean(),
  result: z.unknown().optional(),
  error: z.unknown().optional(),
  attempts: z.array(RetryAttemptSchema),
  totalTime: z.number(),
});
export type RetryResult = z.infer<typeof RetryResultSchema>;

// ============================================================================
// Timeout Manager (12C)
// ============================================================================

export const TimeoutConfigSchema = z.object({
  defaultTimeout: z.number().min(0).default(30000),
  operationTimeouts: z.record(z.number()).optional(), // Per-operation overrides
  cascadingBudget: z.boolean().default(true), // Reduce timeout for child operations
  budgetReservePercent: z.number().min(0).max(50).default(10), // Reserve for cleanup
});
export type TimeoutConfig = z.infer<typeof TimeoutConfigSchema>;

export const TimeoutContextSchema = z.object({
  operationId: z.string(),
  parentId: z.string().optional(),
  timeout: z.number(),
  startTime: z.date(),
  deadline: z.date(),
  remainingMs: z.number(),
  abortController: z.instanceof(AbortController).optional(),
});
export type TimeoutContext = z.infer<typeof TimeoutContextSchema>;

export const TimeoutResultSchema = z.object({
  operationId: z.string(),
  timedOut: z.boolean(),
  elapsedMs: z.number(),
  remainingMs: z.number(),
});
export type TimeoutResult = z.infer<typeof TimeoutResultSchema>;

// ============================================================================
// Health Aggregator (12D)
// ============================================================================

export const HealthStatusSchema = z.enum([
  "healthy",
  "degraded",
  "unhealthy",
  "unknown",
]);
export type HealthStatus = z.infer<typeof HealthStatusSchema>;

export const HealthCheckTypeSchema = z.enum([
  "liveness",
  "readiness",
  "startup",
  "deep",
]);
export type HealthCheckType = z.infer<typeof HealthCheckTypeSchema>;

export const ServiceHealthSchema = z.object({
  name: z.string(),
  status: HealthStatusSchema,
  latency: z.number().optional(),
  lastCheck: z.date(),
  message: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});
export type ServiceHealth = z.infer<typeof ServiceHealthSchema>;

export const DependencySchema = z.object({
  name: z.string(),
  type: z.enum(["required", "optional"]),
  checkFn: z.function().returns(z.promise(z.boolean())).optional(),
  timeout: z.number().default(5000),
  weight: z.number().min(0).max(1).default(1), // Impact on overall health
});
export type Dependency = z.infer<typeof DependencySchema>;

export const HealthAggregatorConfigSchema = z.object({
  checkInterval: z.number().default(30000),
  unhealthyThreshold: z.number().default(3), // Consecutive failures
  healthyThreshold: z.number().default(2), // Consecutive successes to recover
  historySize: z.number().default(100),
  dependencies: z.array(DependencySchema).optional(),
});
export type HealthAggregatorConfig = z.infer<typeof HealthAggregatorConfigSchema>;

export const AggregatedHealthSchema = z.object({
  status: HealthStatusSchema,
  services: z.array(ServiceHealthSchema),
  dependencies: z.array(ServiceHealthSchema),
  uptime: z.number(),
  lastUpdated: z.date(),
  version: z.string().optional(),
});
export type AggregatedHealth = z.infer<typeof AggregatedHealthSchema>;

export const HealthHistoryEntrySchema = z.object({
  timestamp: z.date(),
  status: HealthStatusSchema,
  services: z.record(HealthStatusSchema),
});
export type HealthHistoryEntry = z.infer<typeof HealthHistoryEntrySchema>;

// ============================================================================
// Reliability Manager Config
// ============================================================================

export const ReliabilityManagerConfigSchema = z.object({
  defaultCircuitBreaker: CircuitBreakerConfigSchema.optional(),
  defaultRetry: RetryConfigSchema.optional(),
  defaultTimeout: TimeoutConfigSchema.optional(),
  healthAggregator: HealthAggregatorConfigSchema.optional(),
});
export type ReliabilityManagerConfig = z.infer<typeof ReliabilityManagerConfigSchema>;

// ============================================================================
// Events
// ============================================================================

export type CircuitBreakerEvents = {
  stateChanged: (name: string, from: CircuitState, to: CircuitState) => void;
  opened: (name: string, stats: CircuitStats) => void;
  closed: (name: string, stats: CircuitStats) => void;
  halfOpen: (name: string) => void;
  requestRejected: (name: string) => void;
  requestSuccess: (name: string, duration: number) => void;
  requestFailure: (name: string, error: Error) => void;
};

export type RetryEvents = {
  retrying: (attempt: number, delay: number, error: unknown) => void;
  exhausted: (attempts: RetryAttempt[]) => void;
  success: (attempt: number) => void;
  budgetExhausted: () => void;
};

export type TimeoutEvents = {
  started: (operationId: string, timeout: number) => void;
  completed: (operationId: string, elapsed: number) => void;
  timedOut: (operationId: string) => void;
  cancelled: (operationId: string) => void;
};

export type HealthEvents = {
  statusChanged: (from: HealthStatus, to: HealthStatus) => void;
  serviceHealthChanged: (service: string, status: HealthStatus) => void;
  checkCompleted: (health: AggregatedHealth) => void;
  checkFailed: (error: Error) => void;
};

export type ReliabilityEvents = CircuitBreakerEvents &
  RetryEvents &
  TimeoutEvents &
  HealthEvents & {
    error: (error: Error) => void;
  };
