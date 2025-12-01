import { z } from 'zod';

/**
 * Retry with exponential backoff
 */
interface RetryConfig {
    maxAttempts: number;
    initialDelay: number;
    maxDelay: number;
    backoffFactor: number;
    jitter: boolean;
    shouldRetry?: (error: Error, attempt: number) => boolean;
    onRetry?: (error: Error, attempt: number, delay: number) => void;
}
declare function calculateDelay(attempt: number, config: RetryConfig): number;
declare function withRetry<T>(fn: () => Promise<T>, config?: Partial<RetryConfig>): Promise<T>;
/**
 * Retry decorator for class methods
 */
declare function Retry(config?: Partial<RetryConfig>): (_target: unknown, _propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor;

/**
 * Circuit Breaker pattern to prevent cascade failures
 */
declare enum CircuitState {
    CLOSED = "CLOSED",
    OPEN = "OPEN",
    HALF_OPEN = "HALF_OPEN"
}
interface CircuitBreakerConfig {
    name: string;
    failureThreshold: number;
    successThreshold: number;
    timeout: number;
    onStateChange?: (from: CircuitState, to: CircuitState) => void;
    onFailure?: (error: Error) => void;
}
declare class CircuitBreakerOpenError extends Error {
    constructor(name: string);
}
declare class CircuitBreaker {
    private state;
    private failureCount;
    private successCount;
    private nextAttemptTime;
    private config;
    constructor(config: Partial<CircuitBreakerConfig> & {
        name: string;
    });
    execute<T>(fn: () => Promise<T>): Promise<T>;
    private canExecute;
    private onSuccess;
    private onFailure;
    private transition;
    getState(): CircuitState;
    getStats(): {
        state: CircuitState;
        failures: number;
        successes: number;
        nextAttemptTime: number | null;
    };
    reset(): void;
    forceOpen(): void;
}

/**
 * Timeout Manager for gICM platform
 *
 * Features:
 * - Promise-based timeout wrapper
 * - AbortController integration
 * - Cascading timeouts (parent → child propagation)
 * - Deadline management
 * - Timeout statistics
 */

declare const TimeoutConfigSchema: z.ZodObject<{
    /** Timeout duration in milliseconds */
    timeoutMs: z.ZodNumber;
    /** Optional name for debugging */
    name: z.ZodOptional<z.ZodString>;
    /** Custom error message */
    errorMessage: z.ZodOptional<z.ZodString>;
    /** Callback when timeout occurs */
    onTimeout: z.ZodOptional<z.ZodFunction<z.ZodTuple<[], z.ZodUnknown>, z.ZodVoid>>;
}, "strip", z.ZodTypeAny, {
    timeoutMs: number;
    name?: string | undefined;
    errorMessage?: string | undefined;
    onTimeout?: ((...args: unknown[]) => void) | undefined;
}, {
    timeoutMs: number;
    name?: string | undefined;
    errorMessage?: string | undefined;
    onTimeout?: ((...args: unknown[]) => void) | undefined;
}>;
type TimeoutConfig = z.infer<typeof TimeoutConfigSchema>;
declare class TimeoutError extends Error {
    readonly timeoutMs: number;
    readonly operationName?: string | undefined;
    constructor(message: string, timeoutMs: number, operationName?: string | undefined);
}
interface TimeoutStats {
    totalOperations: number;
    timedOut: number;
    completed: number;
    averageDurationMs: number;
    maxDurationMs: number;
}
/**
 * Wrap a promise with a timeout
 *
 * @example
 * const result = await withTimeout(
 *   fetch('https://api.example.com/data'),
 *   { timeoutMs: 5000, name: 'api-fetch' }
 * );
 */
declare function withTimeout<T>(promise: Promise<T>, config: TimeoutConfig): Promise<T>;
/**
 * TimeoutController wraps AbortController with timeout functionality
 *
 * @example
 * const controller = new TimeoutController(5000);
 * const response = await fetch(url, { signal: controller.signal });
 * controller.clear(); // Cleanup if completed before timeout
 */
declare class TimeoutController {
    readonly timeoutMs: number;
    private readonly name?;
    private abortController;
    private timeoutId;
    private _timedOut;
    constructor(timeoutMs: number, name?: string | undefined);
    get signal(): AbortSignal;
    get timedOut(): boolean;
    get aborted(): boolean;
    /**
     * Clear the timeout - call when operation completes successfully
     */
    clear(): void;
    /**
     * Manually abort the operation
     */
    abort(reason?: unknown): void;
}
/**
 * Deadline represents an absolute point in time when an operation must complete.
 * Useful for propagating timeouts through nested operations.
 *
 * @example
 * const deadline = Deadline.after(5000); // 5 seconds from now
 *
 * // Pass to nested operations
 * await operationA(deadline.remaining());
 * await operationB(deadline.remaining());
 *
 * // Check if expired
 * if (deadline.expired) {
 *   throw new TimeoutError('Deadline exceeded', 5000);
 * }
 */
declare class Deadline {
    private readonly expiresAt;
    private constructor();
    /**
     * Create a deadline that expires after the given duration
     */
    static after(ms: number): Deadline;
    /**
     * Create a deadline at a specific timestamp
     */
    static at(timestamp: number): Deadline;
    /**
     * Create a deadline that never expires
     */
    static never(): Deadline;
    /**
     * Get remaining time in milliseconds (0 if expired)
     */
    remaining(): number;
    /**
     * Check if the deadline has expired
     */
    get expired(): boolean;
    /**
     * Get the absolute expiration timestamp
     */
    get expirationTime(): number;
    /**
     * Create a child deadline with a shorter timeout
     * The child will expire at whichever comes first: its own timeout or the parent deadline
     */
    child(maxMs: number): Deadline;
    /**
     * Throw if expired
     */
    check(operationName?: string): void;
    /**
     * Wrap a promise with this deadline
     */
    wrap<T>(promise: Promise<T>, name?: string): Promise<T>;
    /**
     * Create a TimeoutController bound to this deadline
     */
    controller(name?: string): TimeoutController;
}
/**
 * TimeoutManager tracks timeout statistics across operations
 *
 * @example
 * const manager = new TimeoutManager();
 *
 * // Execute with tracking
 * const result = await manager.execute(
 *   () => fetch('/api/data'),
 *   { timeoutMs: 5000, name: 'api-call' }
 * );
 *
 * // Get statistics
 * console.log(manager.stats);
 */
declare class TimeoutManager {
    private operations;
    private readonly maxHistory;
    constructor(maxHistory?: number);
    /**
     * Execute a function with timeout tracking
     */
    execute<T>(fn: () => Promise<T>, config: TimeoutConfig): Promise<T>;
    /**
     * Execute with a deadline
     */
    executeWithDeadline<T>(fn: () => Promise<T>, deadline: Deadline, name?: string): Promise<T>;
    private recordOperation;
    /**
     * Get timeout statistics
     */
    get stats(): TimeoutStats;
    /**
     * Get timeout rate (percentage of operations that timed out)
     */
    get timeoutRate(): number;
    /**
     * Clear all recorded operations
     */
    clear(): void;
    /**
     * Get recent operations for debugging
     */
    getRecentOperations(count?: number): typeof this.operations;
}
/**
 * Sleep for a given duration, respecting an optional abort signal
 */
declare function sleep(ms: number, signal?: AbortSignal): Promise<void>;
/**
 * Race multiple promises with a timeout
 */
declare function raceWithTimeout<T>(promises: Promise<T>[], config: TimeoutConfig): Promise<T>;
/**
 * Execute promises in sequence with per-operation timeout
 */
declare function sequenceWithTimeout<T>(operations: Array<() => Promise<T>>, perOperationTimeout: number, totalDeadline?: Deadline): Promise<T[]>;

/**
 * Health monitoring for services
 */
interface HealthCheck {
    name: string;
    check: () => Promise<boolean>;
    critical?: boolean;
    timeout?: number;
}
type HealthStatus = "healthy" | "degraded" | "unhealthy";
interface CheckResult {
    status: "pass" | "fail";
    responseTime: number;
    error?: string;
    critical: boolean;
}
interface HealthResult {
    status: HealthStatus;
    checks: Record<string, CheckResult>;
    timestamp: string;
    uptime: number;
}
declare class HealthMonitor {
    private checks;
    private startTime;
    register(check: HealthCheck): void;
    unregister(name: string): void;
    runCheck(check: HealthCheck): Promise<CheckResult>;
    getStatus(): Promise<HealthResult>;
    isHealthy(): boolean;
    getUptime(): number;
    listChecks(): string[];
}
/**
 * Create a simple health check function
 */
declare function createHealthCheck(name: string, check: () => Promise<boolean>, options?: {
    critical?: boolean;
    timeout?: number;
}): HealthCheck;

/**
 * Health Aggregator for gICM platform
 *
 * Aggregates health status from multiple services/engines into a unified view.
 * Supports service discovery, dependency tracking, and alert thresholds.
 */

declare const ServiceHealthSchema: z.ZodObject<{
    serviceId: z.ZodString;
    name: z.ZodString;
    status: z.ZodEnum<["healthy", "degraded", "unhealthy", "unknown"]>;
    lastCheck: z.ZodNumber;
    lastHealthy: z.ZodOptional<z.ZodNumber>;
    responseTimeMs: z.ZodOptional<z.ZodNumber>;
    errorCount: z.ZodDefault<z.ZodNumber>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    status: "unknown" | "healthy" | "degraded" | "unhealthy";
    name: string;
    serviceId: string;
    lastCheck: number;
    errorCount: number;
    lastHealthy?: number | undefined;
    responseTimeMs?: number | undefined;
    metadata?: Record<string, unknown> | undefined;
}, {
    status: "unknown" | "healthy" | "degraded" | "unhealthy";
    name: string;
    serviceId: string;
    lastCheck: number;
    lastHealthy?: number | undefined;
    responseTimeMs?: number | undefined;
    errorCount?: number | undefined;
    metadata?: Record<string, unknown> | undefined;
}>;
type ServiceHealth = z.infer<typeof ServiceHealthSchema>;
declare const AggregatedHealthSchema: z.ZodObject<{
    overallStatus: z.ZodEnum<["healthy", "degraded", "unhealthy", "unknown"]>;
    services: z.ZodArray<z.ZodObject<{
        serviceId: z.ZodString;
        name: z.ZodString;
        status: z.ZodEnum<["healthy", "degraded", "unhealthy", "unknown"]>;
        lastCheck: z.ZodNumber;
        lastHealthy: z.ZodOptional<z.ZodNumber>;
        responseTimeMs: z.ZodOptional<z.ZodNumber>;
        errorCount: z.ZodDefault<z.ZodNumber>;
        metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, "strip", z.ZodTypeAny, {
        status: "unknown" | "healthy" | "degraded" | "unhealthy";
        name: string;
        serviceId: string;
        lastCheck: number;
        errorCount: number;
        lastHealthy?: number | undefined;
        responseTimeMs?: number | undefined;
        metadata?: Record<string, unknown> | undefined;
    }, {
        status: "unknown" | "healthy" | "degraded" | "unhealthy";
        name: string;
        serviceId: string;
        lastCheck: number;
        lastHealthy?: number | undefined;
        responseTimeMs?: number | undefined;
        errorCount?: number | undefined;
        metadata?: Record<string, unknown> | undefined;
    }>, "many">;
    summary: z.ZodObject<{
        healthy: z.ZodNumber;
        degraded: z.ZodNumber;
        unhealthy: z.ZodNumber;
        unknown: z.ZodNumber;
        total: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        unknown: number;
        healthy: number;
        degraded: number;
        unhealthy: number;
        total: number;
    }, {
        unknown: number;
        healthy: number;
        degraded: number;
        unhealthy: number;
        total: number;
    }>;
    dependencies: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodArray<z.ZodString, "many">>>;
    timestamp: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    timestamp: number;
    overallStatus: "unknown" | "healthy" | "degraded" | "unhealthy";
    services: {
        status: "unknown" | "healthy" | "degraded" | "unhealthy";
        name: string;
        serviceId: string;
        lastCheck: number;
        errorCount: number;
        lastHealthy?: number | undefined;
        responseTimeMs?: number | undefined;
        metadata?: Record<string, unknown> | undefined;
    }[];
    summary: {
        unknown: number;
        healthy: number;
        degraded: number;
        unhealthy: number;
        total: number;
    };
    dependencies?: Record<string, string[]> | undefined;
}, {
    timestamp: number;
    overallStatus: "unknown" | "healthy" | "degraded" | "unhealthy";
    services: {
        status: "unknown" | "healthy" | "degraded" | "unhealthy";
        name: string;
        serviceId: string;
        lastCheck: number;
        lastHealthy?: number | undefined;
        responseTimeMs?: number | undefined;
        errorCount?: number | undefined;
        metadata?: Record<string, unknown> | undefined;
    }[];
    summary: {
        unknown: number;
        healthy: number;
        degraded: number;
        unhealthy: number;
        total: number;
    };
    dependencies?: Record<string, string[]> | undefined;
}>;
type AggregatedHealth = z.infer<typeof AggregatedHealthSchema>;
interface ServiceConfig {
    id: string;
    name: string;
    /** Function to check health */
    healthCheck: () => Promise<HealthResult | boolean>;
    /** How often to check (ms) */
    interval?: number;
    /** Services this depends on */
    dependsOn?: string[];
    /** Is this service critical for overall health? */
    critical?: boolean;
    /** Timeout for health check (ms) */
    timeout?: number;
    /** Metadata about the service */
    metadata?: Record<string, unknown>;
}
interface AlertConfig {
    /** Callback when status changes */
    onStatusChange?: (serviceId: string, oldStatus: HealthStatus | "unknown", newStatus: HealthStatus | "unknown") => void;
    /** Callback when service becomes unhealthy */
    onUnhealthy?: (serviceId: string, health: ServiceHealth) => void;
    /** Callback when service recovers */
    onRecovered?: (serviceId: string, health: ServiceHealth) => void;
    /** Callback for overall status change */
    onOverallStatusChange?: (oldStatus: HealthStatus | "unknown", newStatus: HealthStatus | "unknown") => void;
}
interface HealthAggregatorConfig {
    /** Default check interval (ms) */
    defaultInterval?: number;
    /** Default timeout (ms) */
    defaultTimeout?: number;
    /** How long before marking service as unknown (ms) */
    staleThreshold?: number;
    /** Alert configuration */
    alerts?: AlertConfig;
}
/**
 * HealthAggregator collects and aggregates health from multiple services
 *
 * @example
 * const aggregator = new HealthAggregator();
 *
 * aggregator.registerService({
 *   id: 'money-engine',
 *   name: 'Money Engine',
 *   healthCheck: async () => moneyEngine.health(),
 *   critical: true,
 * });
 *
 * aggregator.registerService({
 *   id: 'growth-engine',
 *   name: 'Growth Engine',
 *   healthCheck: async () => growthEngine.health(),
 *   dependsOn: ['money-engine'],
 * });
 *
 * // Start automatic polling
 * aggregator.startPolling();
 *
 * // Get aggregated health
 * const health = aggregator.getHealth();
 */
declare class HealthAggregator {
    private services;
    private healthCache;
    private pollingIntervals;
    private lastOverallStatus;
    private readonly config;
    constructor(config?: HealthAggregatorConfig);
    /**
     * Register a service for health monitoring
     */
    registerService(service: ServiceConfig): void;
    /**
     * Unregister a service
     */
    unregisterService(serviceId: string): void;
    /**
     * Check health of a specific service
     */
    checkService(serviceId: string): Promise<ServiceHealth>;
    /**
     * Check all registered services
     */
    checkAll(): Promise<Map<string, ServiceHealth>>;
    /**
     * Get aggregated health status
     */
    getHealth(): AggregatedHealth;
    /**
     * Get health of a specific service (cached)
     */
    getServiceHealth(serviceId: string): ServiceHealth | undefined;
    /**
     * Check if all critical services are healthy
     */
    isCriticalHealthy(): boolean;
    /**
     * Get services that depend on a given service
     */
    getDependents(serviceId: string): string[];
    /**
     * Check if a service and its dependencies are healthy
     */
    isServiceReady(serviceId: string): boolean;
    /**
     * Start polling for a specific service
     */
    startPolling(serviceId: string): void;
    /**
     * Start polling for all services
     */
    startAllPolling(): void;
    /**
     * Stop polling for a specific service
     */
    stopPolling(serviceId: string): void;
    /**
     * Stop all polling
     */
    stopAllPolling(): void;
    /**
     * Get list of registered services
     */
    listServices(): string[];
    /**
     * Get service configuration
     */
    getServiceConfig(serviceId: string): ServiceConfig | undefined;
    private triggerAlerts;
}
/**
 * Create a simple health check that pings a URL
 */
declare function createHttpHealthCheck(url: string, options?: {
    timeout?: number;
    expectedStatus?: number;
}): () => Promise<boolean>;
/**
 * Create a health check that calls a function
 */
declare function createFunctionHealthCheck(fn: () => Promise<boolean> | boolean): () => Promise<boolean>;
/**
 * Merge multiple health results into one
 */
declare function mergeHealthResults(results: HealthResult[]): HealthResult;

/**
 * LIVE mode trading guards to prevent excessive losses
 */
interface LiveModeConfig {
    maxPositionUsd: number;
    maxDailyLossUsd: number;
    maxDrawdownPercent: number;
    requireApproval: boolean;
    coolDownAfterLossMs: number;
    allowedTokens?: string[];
    blockedTokens: string[];
}
interface TradeRequest {
    token: string;
    side: "buy" | "sell";
    amountUsd: number;
    source: string;
}
interface GuardResult {
    allowed: boolean;
    reason?: string;
    requiresApproval?: boolean;
    approvalId?: string;
    warnings: string[];
}
interface PendingApproval {
    id: string;
    request: TradeRequest;
    createdAt: number;
}
declare class LiveModeGuard {
    private config;
    private dailyPnL;
    private lastLossTime;
    private pendingApprovals;
    private dailyPnLResetTime;
    constructor(config?: Partial<LiveModeConfig>);
    checkTrade(request: TradeRequest): GuardResult;
    approveTradeById(approvalId: string): TradeRequest | null;
    rejectTradeById(approvalId: string): void;
    recordTradeResult(pnl: number): void;
    getStatus(): {
        dailyPnL: number;
        inCoolDown: boolean;
        coolDownRemainingMs: number;
        pendingApprovals: number;
        config: LiveModeConfig;
    };
    getPendingApprovals(): PendingApproval[];
    resetDailyPnL(): void;
    clearCoolDown(): void;
    private getNextMidnightUTC;
}

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

declare function withResilience<T>(fn: () => Promise<T>, options?: {
    retry?: Partial<RetryConfig>;
    circuitBreaker?: CircuitBreaker;
}): Promise<T>;

export { type AggregatedHealth, type AlertConfig, type CheckResult, CircuitBreaker, type CircuitBreakerConfig, CircuitBreakerOpenError, CircuitState, Deadline, type GuardResult, HealthAggregator, type HealthAggregatorConfig, type HealthCheck, HealthMonitor, type HealthResult, type HealthStatus, type LiveModeConfig, LiveModeGuard, type PendingApproval, Retry, type RetryConfig, type ServiceConfig, type ServiceHealth, type TimeoutConfig, TimeoutController, TimeoutError, TimeoutManager, type TimeoutStats, type TradeRequest, calculateDelay, createFunctionHealthCheck, createHealthCheck, createHttpHealthCheck, mergeHealthResults, raceWithTimeout, sequenceWithTimeout, sleep, withResilience, withRetry, withTimeout };
