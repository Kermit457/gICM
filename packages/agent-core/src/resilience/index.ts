/**
 * Resilience utilities for gICM platform
 *
 * Provides:
 * - Retry with exponential backoff
 * - Circuit breaker pattern
 * - Timeout management
 * - Health monitoring
 * - LIVE mode trading guards
 */

// Retry
export { withRetry, calculateDelay, Retry } from "./retry.js";
export type { RetryConfig } from "./retry.js";

// Circuit Breaker
export {
  CircuitBreaker,
  CircuitBreakerOpenError,
  CircuitState,
} from "./circuit-breaker.js";
export type { CircuitBreakerConfig } from "./circuit-breaker.js";

// Timeout
export {
  withTimeout,
  TimeoutController,
  Deadline,
  TimeoutManager,
  TimeoutError,
  sleep,
  raceWithTimeout,
  sequenceWithTimeout,
} from "./timeout.js";
export type { TimeoutConfig, TimeoutStats } from "./timeout.js";

// Health Check
export { HealthMonitor, createHealthCheck } from "./health-check.js";
export type {
  HealthCheck,
  HealthStatus,
  HealthResult,
  CheckResult,
} from "./health-check.js";

// Health Aggregator
export {
  HealthAggregator,
  createHttpHealthCheck,
  createFunctionHealthCheck,
  mergeHealthResults,
} from "./health-aggregator.js";
export type {
  ServiceHealth,
  AggregatedHealth,
  ServiceConfig,
  AlertConfig,
  HealthAggregatorConfig,
} from "./health-aggregator.js";

// LIVE Mode Guards
export { LiveModeGuard } from "./live-guards.js";
export type {
  LiveModeConfig,
  TradeRequest,
  GuardResult,
  PendingApproval,
} from "./live-guards.js";

/**
 * Convenience function to wrap with both retry and circuit breaker
 */
import { withRetry, type RetryConfig } from "./retry.js";
import { CircuitBreaker } from "./circuit-breaker.js";

export async function withResilience<T>(
  fn: () => Promise<T>,
  options?: {
    retry?: Partial<RetryConfig>;
    circuitBreaker?: CircuitBreaker;
  }
): Promise<T> {
  const execute = async () => {
    if (options?.circuitBreaker) {
      return options.circuitBreaker.execute(fn);
    }
    return fn();
  };

  if (options?.retry) {
    return withRetry(execute, options.retry);
  }

  return execute();
}
