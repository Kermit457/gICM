/**
 * Reliability Module
 * Phase 12: Reliability & Resilience
 */

// Types & Schemas
export {
  // Circuit Breaker (12A)
  CircuitStateSchema,
  type CircuitState,
  CircuitBreakerConfigSchema,
  type CircuitBreakerConfig,
  CircuitStatsSchema,
  type CircuitStats,
  CircuitBreakerStateSchema,
  type CircuitBreakerState,

  // Retry Strategy (12B)
  RetryStrategyTypeSchema,
  type RetryStrategyType,
  RetryConfigSchema,
  type RetryConfig,
  RetryAttemptSchema,
  type RetryAttempt,
  RetryResultSchema,
  type RetryResult,

  // Timeout Manager (12C)
  TimeoutConfigSchema,
  type TimeoutConfig,
  TimeoutContextSchema,
  type TimeoutContext,
  TimeoutResultSchema,
  type TimeoutResult,

  // Health Aggregator (12D)
  HealthStatusSchema,
  type HealthStatus,
  HealthCheckTypeSchema,
  type HealthCheckType,
  ServiceHealthSchema,
  type ServiceHealth,
  DependencySchema,
  type Dependency,
  HealthAggregatorConfigSchema,
  type HealthAggregatorConfig,
  AggregatedHealthSchema,
  type AggregatedHealth,
  HealthHistoryEntrySchema,
  type HealthHistoryEntry,

  // Manager Config
  ReliabilityManagerConfigSchema,
  type ReliabilityManagerConfig,

  // Events
  type CircuitBreakerEvents,
  type RetryEvents,
  type TimeoutEvents,
  type HealthEvents,
  type ReliabilityEvents,
} from "./types.js";

// Circuit Breaker (12A)
export {
  CircuitBreaker,
  CircuitBreakerRegistry,
  CircuitOpenError,
  getCircuitBreakerRegistry,
  createCircuitBreakerRegistry,
  createCircuitBreaker,
} from "./circuit-breaker.js";

// Retry Strategy (12B)
export {
  RetryStrategy,
  RetryExhaustedError,
  createRetryStrategy,
  withRetry,
  retryWithBackoff,
  DEFAULT_RETRY_STRATEGIES,
} from "./retry-strategy.js";

// Timeout Manager (12C)
export {
  TimeoutManager,
  TimeoutError,
  getTimeoutManager,
  createTimeoutManager,
  withTimeout,
  raceWithTimeout,
  TIMEOUT_PRESETS,
} from "./timeout-manager.js";

// Health Aggregator (12D)
export {
  HealthAggregator,
  HealthCheckError,
  getHealthAggregator,
  createHealthAggregator,
} from "./health-aggregator.js";
