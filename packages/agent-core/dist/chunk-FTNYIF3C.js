// src/resilience/retry.ts
var DEFAULT_CONFIG = {
  maxAttempts: 3,
  initialDelay: 1e3,
  maxDelay: 3e4,
  backoffFactor: 2,
  jitter: true
};
function calculateDelay(attempt, config) {
  let delay = config.initialDelay * Math.pow(config.backoffFactor, attempt);
  delay = Math.min(delay, config.maxDelay);
  if (config.jitter) {
    const jitterRange = delay * 0.25;
    delay = delay - jitterRange + Math.random() * jitterRange * 2;
  }
  return Math.floor(delay);
}
async function withRetry(fn, config) {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  let lastError = new Error("No attempts made");
  for (let attempt = 0; attempt < cfg.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (cfg.shouldRetry && !cfg.shouldRetry(lastError, attempt)) {
        throw lastError;
      }
      if (attempt >= cfg.maxAttempts - 1) {
        throw lastError;
      }
      const delay = calculateDelay(attempt, cfg);
      if (cfg.onRetry) {
        cfg.onRetry(lastError, attempt + 1, delay);
      }
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}
function Retry(config) {
  return function(_target, _propertyKey, descriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = async function(...args) {
      return withRetry(() => originalMethod.apply(this, args), config);
    };
    return descriptor;
  };
}

// src/resilience/circuit-breaker.ts
var CircuitState = /* @__PURE__ */ ((CircuitState2) => {
  CircuitState2["CLOSED"] = "CLOSED";
  CircuitState2["OPEN"] = "OPEN";
  CircuitState2["HALF_OPEN"] = "HALF_OPEN";
  return CircuitState2;
})(CircuitState || {});
var DEFAULT_CONFIG2 = {
  failureThreshold: 5,
  successThreshold: 2,
  timeout: 6e4
};
var CircuitBreakerOpenError = class extends Error {
  constructor(name) {
    super(`Circuit breaker "${name}" is OPEN`);
    this.name = "CircuitBreakerOpenError";
  }
};
var CircuitBreaker = class {
  state = "CLOSED" /* CLOSED */;
  failureCount = 0;
  successCount = 0;
  nextAttemptTime = 0;
  config;
  constructor(config) {
    this.config = { ...DEFAULT_CONFIG2, ...config };
  }
  async execute(fn) {
    if (!this.canExecute()) {
      throw new CircuitBreakerOpenError(this.config.name);
    }
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }
  canExecute() {
    switch (this.state) {
      case "CLOSED" /* CLOSED */:
        return true;
      case "OPEN" /* OPEN */:
        if (Date.now() >= this.nextAttemptTime) {
          this.transition("HALF_OPEN" /* HALF_OPEN */);
          return true;
        }
        return false;
      case "HALF_OPEN" /* HALF_OPEN */:
        return true;
      default:
        return false;
    }
  }
  onSuccess() {
    switch (this.state) {
      case "HALF_OPEN" /* HALF_OPEN */:
        this.successCount++;
        if (this.successCount >= this.config.successThreshold) {
          this.transition("CLOSED" /* CLOSED */);
        }
        break;
      case "CLOSED" /* CLOSED */:
        this.failureCount = 0;
        break;
    }
  }
  onFailure(error) {
    if (this.config.onFailure) {
      this.config.onFailure(error);
    }
    switch (this.state) {
      case "CLOSED" /* CLOSED */:
        this.failureCount++;
        if (this.failureCount >= this.config.failureThreshold) {
          this.transition("OPEN" /* OPEN */);
        }
        break;
      case "HALF_OPEN" /* HALF_OPEN */:
        this.transition("OPEN" /* OPEN */);
        break;
    }
  }
  transition(newState) {
    const oldState = this.state;
    this.state = newState;
    this.failureCount = 0;
    this.successCount = 0;
    if (newState === "OPEN" /* OPEN */) {
      this.nextAttemptTime = Date.now() + this.config.timeout;
    }
    if (this.config.onStateChange) {
      this.config.onStateChange(oldState, newState);
    }
  }
  getState() {
    return this.state;
  }
  getStats() {
    return {
      state: this.state,
      failures: this.failureCount,
      successes: this.successCount,
      nextAttemptTime: this.state === "OPEN" /* OPEN */ ? this.nextAttemptTime : null
    };
  }
  reset() {
    this.transition("CLOSED" /* CLOSED */);
  }
  forceOpen() {
    this.transition("OPEN" /* OPEN */);
  }
};

// src/resilience/timeout.ts
import { z } from "zod";
var TimeoutConfigSchema = z.object({
  /** Timeout duration in milliseconds */
  timeoutMs: z.number().min(0),
  /** Optional name for debugging */
  name: z.string().optional(),
  /** Custom error message */
  errorMessage: z.string().optional(),
  /** Callback when timeout occurs */
  onTimeout: z.function().args().returns(z.void()).optional()
});
var TimeoutError = class extends Error {
  constructor(message, timeoutMs, operationName) {
    super(message);
    this.timeoutMs = timeoutMs;
    this.operationName = operationName;
    this.name = "TimeoutError";
  }
};
async function withTimeout(promise, config) {
  const { timeoutMs, name, errorMessage, onTimeout } = config;
  if (timeoutMs <= 0) {
    return promise;
  }
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      onTimeout?.();
      reject(
        new TimeoutError(
          errorMessage ?? `Operation${name ? ` "${name}"` : ""} timed out after ${timeoutMs}ms`,
          timeoutMs,
          name
        )
      );
    }, timeoutMs);
  });
  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutId);
    return result;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}
var TimeoutController = class {
  constructor(timeoutMs, name) {
    this.timeoutMs = timeoutMs;
    this.name = name;
    this.abortController = new AbortController();
    if (timeoutMs > 0) {
      this.timeoutId = setTimeout(() => {
        this._timedOut = true;
        this.abortController.abort(
          new TimeoutError(
            `Operation${name ? ` "${name}"` : ""} timed out after ${timeoutMs}ms`,
            timeoutMs,
            name
          )
        );
      }, timeoutMs);
    }
  }
  abortController;
  timeoutId = null;
  _timedOut = false;
  get signal() {
    return this.abortController.signal;
  }
  get timedOut() {
    return this._timedOut;
  }
  get aborted() {
    return this.abortController.signal.aborted;
  }
  /**
   * Clear the timeout - call when operation completes successfully
   */
  clear() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
  /**
   * Manually abort the operation
   */
  abort(reason) {
    this.clear();
    this.abortController.abort(reason);
  }
};
var Deadline = class _Deadline {
  expiresAt;
  constructor(expiresAt) {
    this.expiresAt = expiresAt;
  }
  /**
   * Create a deadline that expires after the given duration
   */
  static after(ms) {
    return new _Deadline(Date.now() + ms);
  }
  /**
   * Create a deadline at a specific timestamp
   */
  static at(timestamp) {
    return new _Deadline(timestamp);
  }
  /**
   * Create a deadline that never expires
   */
  static never() {
    return new _Deadline(Number.MAX_SAFE_INTEGER);
  }
  /**
   * Get remaining time in milliseconds (0 if expired)
   */
  remaining() {
    return Math.max(0, this.expiresAt - Date.now());
  }
  /**
   * Check if the deadline has expired
   */
  get expired() {
    return Date.now() >= this.expiresAt;
  }
  /**
   * Get the absolute expiration timestamp
   */
  get expirationTime() {
    return this.expiresAt;
  }
  /**
   * Create a child deadline with a shorter timeout
   * The child will expire at whichever comes first: its own timeout or the parent deadline
   */
  child(maxMs) {
    const childExpires = Date.now() + maxMs;
    return new _Deadline(Math.min(this.expiresAt, childExpires));
  }
  /**
   * Throw if expired
   */
  check(operationName) {
    if (this.expired) {
      throw new TimeoutError(
        `Deadline exceeded${operationName ? ` for "${operationName}"` : ""}`,
        0,
        operationName
      );
    }
  }
  /**
   * Wrap a promise with this deadline
   */
  async wrap(promise, name) {
    const remaining = this.remaining();
    if (remaining <= 0) {
      throw new TimeoutError(
        `Deadline already expired${name ? ` for "${name}"` : ""}`,
        0,
        name
      );
    }
    return withTimeout(promise, { timeoutMs: remaining, name });
  }
  /**
   * Create a TimeoutController bound to this deadline
   */
  controller(name) {
    return new TimeoutController(this.remaining(), name);
  }
};
var TimeoutManager = class {
  operations = [];
  maxHistory;
  constructor(maxHistory = 1e3) {
    this.maxHistory = maxHistory;
  }
  /**
   * Execute a function with timeout tracking
   */
  async execute(fn, config) {
    const startTime = Date.now();
    let timedOut = false;
    try {
      const result = await withTimeout(fn(), {
        ...config,
        onTimeout: () => {
          timedOut = true;
          config.onTimeout?.();
        }
      });
      this.recordOperation(config.name, Date.now() - startTime, false);
      return result;
    } catch (error) {
      this.recordOperation(config.name, Date.now() - startTime, timedOut || error instanceof TimeoutError);
      throw error;
    }
  }
  /**
   * Execute with a deadline
   */
  async executeWithDeadline(fn, deadline, name) {
    return this.execute(fn, {
      timeoutMs: deadline.remaining(),
      name
    });
  }
  recordOperation(name, durationMs, timedOut) {
    this.operations.push({
      name,
      durationMs,
      timedOut,
      timestamp: Date.now()
    });
    if (this.operations.length > this.maxHistory) {
      this.operations = this.operations.slice(-this.maxHistory);
    }
  }
  /**
   * Get timeout statistics
   */
  get stats() {
    if (this.operations.length === 0) {
      return {
        totalOperations: 0,
        timedOut: 0,
        completed: 0,
        averageDurationMs: 0,
        maxDurationMs: 0
      };
    }
    const timedOut = this.operations.filter((op) => op.timedOut).length;
    const durations = this.operations.map((op) => op.durationMs);
    const totalDuration = durations.reduce((a, b) => a + b, 0);
    return {
      totalOperations: this.operations.length,
      timedOut,
      completed: this.operations.length - timedOut,
      averageDurationMs: totalDuration / this.operations.length,
      maxDurationMs: Math.max(...durations)
    };
  }
  /**
   * Get timeout rate (percentage of operations that timed out)
   */
  get timeoutRate() {
    if (this.operations.length === 0) return 0;
    return this.stats.timedOut / this.stats.totalOperations;
  }
  /**
   * Clear all recorded operations
   */
  clear() {
    this.operations = [];
  }
  /**
   * Get recent operations for debugging
   */
  getRecentOperations(count = 10) {
    return this.operations.slice(-count);
  }
};
function sleep(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason ?? new Error("Aborted"));
      return;
    }
    const timeoutId = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(timeoutId);
      reject(signal.reason ?? new Error("Aborted"));
    });
  });
}
async function raceWithTimeout(promises, config) {
  return withTimeout(Promise.race(promises), config);
}
async function sequenceWithTimeout(operations, perOperationTimeout, totalDeadline) {
  const results = [];
  for (const [index, op] of operations.entries()) {
    if (totalDeadline?.expired) {
      throw new TimeoutError(
        `Sequence deadline expired at operation ${index}`,
        0
      );
    }
    const effectiveTimeout = totalDeadline ? Math.min(perOperationTimeout, totalDeadline.remaining()) : perOperationTimeout;
    const result = await withTimeout(op(), {
      timeoutMs: effectiveTimeout,
      name: `sequence-op-${index}`
    });
    results.push(result);
  }
  return results;
}

// src/resilience/health-check.ts
var DEFAULT_TIMEOUT = 5e3;
var HealthMonitor = class {
  checks = /* @__PURE__ */ new Map();
  startTime = Date.now();
  register(check) {
    this.checks.set(check.name, {
      ...check,
      timeout: check.timeout ?? DEFAULT_TIMEOUT,
      critical: check.critical ?? false
    });
  }
  unregister(name) {
    this.checks.delete(name);
  }
  async runCheck(check) {
    const startTime = Date.now();
    try {
      const result = await Promise.race([
        check.check(),
        new Promise(
          (_, reject) => setTimeout(
            () => reject(new Error("Health check timeout")),
            check.timeout ?? DEFAULT_TIMEOUT
          )
        )
      ]);
      return {
        status: result ? "pass" : "fail",
        responseTime: Date.now() - startTime,
        critical: check.critical ?? false
      };
    } catch (error) {
      return {
        status: "fail",
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
        critical: check.critical ?? false
      };
    }
  }
  async getStatus() {
    const results = {};
    let hasCriticalFailure = false;
    let hasNonCriticalFailure = false;
    const checkPromises = Array.from(this.checks.entries()).map(
      async ([name, check]) => {
        const result = await this.runCheck(check);
        results[name] = result;
        if (result.status === "fail") {
          if (result.critical) {
            hasCriticalFailure = true;
          } else {
            hasNonCriticalFailure = true;
          }
        }
      }
    );
    await Promise.all(checkPromises);
    let status;
    if (hasCriticalFailure) {
      status = "unhealthy";
    } else if (hasNonCriticalFailure) {
      status = "degraded";
    } else {
      status = "healthy";
    }
    return {
      status,
      checks: results,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      uptime: Date.now() - this.startTime
    };
  }
  isHealthy() {
    return true;
  }
  getUptime() {
    return Date.now() - this.startTime;
  }
  listChecks() {
    return Array.from(this.checks.keys());
  }
};
function createHealthCheck(name, check, options) {
  return {
    name,
    check,
    critical: options?.critical ?? false,
    timeout: options?.timeout ?? DEFAULT_TIMEOUT
  };
}

// src/resilience/health-aggregator.ts
import { z as z2 } from "zod";
var ServiceHealthSchema = z2.object({
  serviceId: z2.string(),
  name: z2.string(),
  status: z2.enum(["healthy", "degraded", "unhealthy", "unknown"]),
  lastCheck: z2.number(),
  lastHealthy: z2.number().optional(),
  responseTimeMs: z2.number().optional(),
  errorCount: z2.number().default(0),
  metadata: z2.record(z2.unknown()).optional()
});
var AggregatedHealthSchema = z2.object({
  overallStatus: z2.enum(["healthy", "degraded", "unhealthy", "unknown"]),
  services: z2.array(ServiceHealthSchema),
  summary: z2.object({
    healthy: z2.number(),
    degraded: z2.number(),
    unhealthy: z2.number(),
    unknown: z2.number(),
    total: z2.number()
  }),
  dependencies: z2.record(z2.array(z2.string())).optional(),
  timestamp: z2.number()
});
var HealthAggregator = class {
  services = /* @__PURE__ */ new Map();
  healthCache = /* @__PURE__ */ new Map();
  pollingIntervals = /* @__PURE__ */ new Map();
  lastOverallStatus = "unknown";
  config;
  constructor(config) {
    this.config = {
      defaultInterval: config?.defaultInterval ?? 3e4,
      // 30 seconds
      defaultTimeout: config?.defaultTimeout ?? 5e3,
      // 5 seconds
      staleThreshold: config?.staleThreshold ?? 6e4,
      // 1 minute
      alerts: config?.alerts
    };
  }
  /**
   * Register a service for health monitoring
   */
  registerService(service) {
    this.services.set(service.id, {
      ...service,
      interval: service.interval ?? this.config.defaultInterval,
      timeout: service.timeout ?? this.config.defaultTimeout
    });
    this.healthCache.set(service.id, {
      serviceId: service.id,
      name: service.name,
      status: "unknown",
      lastCheck: 0,
      errorCount: 0,
      metadata: service.metadata
    });
  }
  /**
   * Unregister a service
   */
  unregisterService(serviceId) {
    this.stopPolling(serviceId);
    this.services.delete(serviceId);
    this.healthCache.delete(serviceId);
  }
  /**
   * Check health of a specific service
   */
  async checkService(serviceId) {
    const service = this.services.get(serviceId);
    if (!service) {
      throw new Error(`Service not found: ${serviceId}`);
    }
    const startTime = Date.now();
    const previousHealth = this.healthCache.get(serviceId);
    const previousStatus = previousHealth?.status ?? "unknown";
    try {
      const checkPromise = service.healthCheck();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error("Health check timeout")),
          service.timeout ?? this.config.defaultTimeout
        );
      });
      const result = await Promise.race([checkPromise, timeoutPromise]);
      const responseTime = Date.now() - startTime;
      let status;
      if (typeof result === "boolean") {
        status = result ? "healthy" : "unhealthy";
      } else {
        status = result.status;
      }
      const health = {
        serviceId,
        name: service.name,
        status,
        lastCheck: Date.now(),
        lastHealthy: status === "healthy" ? Date.now() : previousHealth?.lastHealthy,
        responseTimeMs: responseTime,
        errorCount: status === "healthy" ? 0 : (previousHealth?.errorCount ?? 0) + 1,
        metadata: service.metadata
      };
      this.healthCache.set(serviceId, health);
      this.triggerAlerts(serviceId, previousStatus, status, health);
      return health;
    } catch (error) {
      const health = {
        serviceId,
        name: service.name,
        status: "unhealthy",
        lastCheck: Date.now(),
        lastHealthy: previousHealth?.lastHealthy,
        responseTimeMs: Date.now() - startTime,
        errorCount: (previousHealth?.errorCount ?? 0) + 1,
        metadata: {
          ...service.metadata,
          lastError: error instanceof Error ? error.message : String(error)
        }
      };
      this.healthCache.set(serviceId, health);
      this.triggerAlerts(serviceId, previousStatus, "unhealthy", health);
      return health;
    }
  }
  /**
   * Check all registered services
   */
  async checkAll() {
    const results = /* @__PURE__ */ new Map();
    await Promise.all(
      Array.from(this.services.keys()).map(async (serviceId) => {
        const health = await this.checkService(serviceId);
        results.set(serviceId, health);
      })
    );
    return results;
  }
  /**
   * Get aggregated health status
   */
  getHealth() {
    const services = [];
    let healthy = 0;
    let degraded = 0;
    let unhealthy = 0;
    let unknown = 0;
    const now = Date.now();
    for (const [serviceId, health] of this.healthCache) {
      const isStale = now - health.lastCheck > this.config.staleThreshold;
      const effectiveStatus = isStale ? "unknown" : health.status;
      const serviceHealth = {
        ...health,
        status: effectiveStatus
      };
      services.push(serviceHealth);
      switch (effectiveStatus) {
        case "healthy":
          healthy++;
          break;
        case "degraded":
          degraded++;
          break;
        case "unhealthy":
          unhealthy++;
          break;
        default:
          unknown++;
      }
    }
    let overallStatus;
    const hasCriticalUnhealthy = services.some((s) => {
      const config = this.services.get(s.serviceId);
      return config?.critical && s.status === "unhealthy";
    });
    if (hasCriticalUnhealthy || unhealthy > 0) {
      overallStatus = "unhealthy";
    } else if (degraded > 0 || unknown > 0) {
      overallStatus = "degraded";
    } else if (healthy > 0) {
      overallStatus = "healthy";
    } else {
      overallStatus = "unknown";
    }
    if (overallStatus !== this.lastOverallStatus) {
      this.config.alerts?.onOverallStatusChange?.(
        this.lastOverallStatus,
        overallStatus
      );
      this.lastOverallStatus = overallStatus;
    }
    const dependencies = {};
    for (const [id, service] of this.services) {
      if (service.dependsOn && service.dependsOn.length > 0) {
        dependencies[id] = service.dependsOn;
      }
    }
    return {
      overallStatus,
      services,
      summary: {
        healthy,
        degraded,
        unhealthy,
        unknown,
        total: services.length
      },
      dependencies: Object.keys(dependencies).length > 0 ? dependencies : void 0,
      timestamp: now
    };
  }
  /**
   * Get health of a specific service (cached)
   */
  getServiceHealth(serviceId) {
    return this.healthCache.get(serviceId);
  }
  /**
   * Check if all critical services are healthy
   */
  isCriticalHealthy() {
    for (const [serviceId, config] of this.services) {
      if (config.critical) {
        const health = this.healthCache.get(serviceId);
        if (!health || health.status !== "healthy") {
          return false;
        }
      }
    }
    return true;
  }
  /**
   * Get services that depend on a given service
   */
  getDependents(serviceId) {
    const dependents = [];
    for (const [id, config] of this.services) {
      if (config.dependsOn?.includes(serviceId)) {
        dependents.push(id);
      }
    }
    return dependents;
  }
  /**
   * Check if a service and its dependencies are healthy
   */
  isServiceReady(serviceId) {
    const service = this.services.get(serviceId);
    if (!service) return false;
    const health = this.healthCache.get(serviceId);
    if (!health || health.status !== "healthy") {
      return false;
    }
    if (service.dependsOn) {
      for (const depId of service.dependsOn) {
        const depHealth = this.healthCache.get(depId);
        if (!depHealth || depHealth.status !== "healthy") {
          return false;
        }
      }
    }
    return true;
  }
  /**
   * Start polling for a specific service
   */
  startPolling(serviceId) {
    const service = this.services.get(serviceId);
    if (!service) return;
    this.stopPolling(serviceId);
    this.checkService(serviceId);
    const interval = setInterval(() => {
      this.checkService(serviceId);
    }, service.interval ?? this.config.defaultInterval);
    this.pollingIntervals.set(serviceId, interval);
  }
  /**
   * Start polling for all services
   */
  startAllPolling() {
    for (const serviceId of this.services.keys()) {
      this.startPolling(serviceId);
    }
  }
  /**
   * Stop polling for a specific service
   */
  stopPolling(serviceId) {
    const interval = this.pollingIntervals.get(serviceId);
    if (interval) {
      clearInterval(interval);
      this.pollingIntervals.delete(serviceId);
    }
  }
  /**
   * Stop all polling
   */
  stopAllPolling() {
    for (const serviceId of this.pollingIntervals.keys()) {
      this.stopPolling(serviceId);
    }
  }
  /**
   * Get list of registered services
   */
  listServices() {
    return Array.from(this.services.keys());
  }
  /**
   * Get service configuration
   */
  getServiceConfig(serviceId) {
    return this.services.get(serviceId);
  }
  triggerAlerts(serviceId, previousStatus, newStatus, health) {
    if (!this.config.alerts) return;
    if (previousStatus !== newStatus) {
      this.config.alerts.onStatusChange?.(serviceId, previousStatus, newStatus);
      if (newStatus === "unhealthy") {
        this.config.alerts.onUnhealthy?.(serviceId, health);
      }
      if (previousStatus === "unhealthy" && (newStatus === "healthy" || newStatus === "degraded")) {
        this.config.alerts.onRecovered?.(serviceId, health);
      }
    }
  }
};
function createHttpHealthCheck(url, options) {
  return async () => {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      options?.timeout ?? 5e3
    );
    try {
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);
      return response.status === (options?.expectedStatus ?? 200);
    } catch {
      clearTimeout(timeout);
      return false;
    }
  };
}
function createFunctionHealthCheck(fn) {
  return async () => {
    const result = await fn();
    return result;
  };
}
function mergeHealthResults(results) {
  let hasCriticalFailure = false;
  let hasNonCriticalFailure = false;
  const checks = {};
  for (const result of results) {
    for (const [name, check] of Object.entries(result.checks)) {
      checks[name] = check;
      if (check.status === "fail") {
        if (check.critical) {
          hasCriticalFailure = true;
        } else {
          hasNonCriticalFailure = true;
        }
      }
    }
  }
  let status;
  if (hasCriticalFailure) {
    status = "unhealthy";
  } else if (hasNonCriticalFailure) {
    status = "degraded";
  } else {
    status = "healthy";
  }
  return {
    status,
    checks,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    uptime: Math.max(...results.map((r) => r.uptime))
  };
}

// src/resilience/live-guards.ts
var DEFAULT_CONFIG3 = {
  maxPositionUsd: 1e3,
  maxDailyLossUsd: 100,
  maxDrawdownPercent: 10,
  requireApproval: true,
  coolDownAfterLossMs: 36e5,
  // 1 hour
  blockedTokens: []
};
var LiveModeGuard = class {
  config;
  dailyPnL = 0;
  lastLossTime = 0;
  pendingApprovals = /* @__PURE__ */ new Map();
  dailyPnLResetTime;
  constructor(config) {
    this.config = { ...DEFAULT_CONFIG3, ...config };
    this.dailyPnLResetTime = this.getNextMidnightUTC();
  }
  checkTrade(request) {
    const warnings = [];
    if (Date.now() > this.dailyPnLResetTime) {
      this.dailyPnL = 0;
      this.dailyPnLResetTime = this.getNextMidnightUTC();
    }
    if (this.lastLossTime > 0) {
      const coolDownRemaining = this.lastLossTime + this.config.coolDownAfterLossMs - Date.now();
      if (coolDownRemaining > 0) {
        return {
          allowed: false,
          reason: `In cool-down period after loss. ${Math.ceil(coolDownRemaining / 6e4)} minutes remaining.`,
          warnings
        };
      }
    }
    if (this.config.blockedTokens.includes(request.token)) {
      return {
        allowed: false,
        reason: `Token ${request.token} is blocked`,
        warnings
      };
    }
    if (this.config.allowedTokens && !this.config.allowedTokens.includes(request.token)) {
      return {
        allowed: false,
        reason: `Token ${request.token} not in allowed list`,
        warnings
      };
    }
    if (request.amountUsd > this.config.maxPositionUsd) {
      return {
        allowed: false,
        reason: `Position $${request.amountUsd} exceeds max $${this.config.maxPositionUsd}`,
        warnings
      };
    }
    if (this.dailyPnL < -this.config.maxDailyLossUsd) {
      return {
        allowed: false,
        reason: `Daily loss limit reached: $${Math.abs(this.dailyPnL).toFixed(2)}`,
        warnings
      };
    }
    if (request.amountUsd > this.config.maxPositionUsd * 0.5) {
      warnings.push(
        `Large position: ${(request.amountUsd / this.config.maxPositionUsd * 100).toFixed(0)}% of max`
      );
    }
    if (this.dailyPnL < -this.config.maxDailyLossUsd * 0.5) {
      warnings.push(
        `Approaching daily loss limit: $${Math.abs(this.dailyPnL).toFixed(2)} of $${this.config.maxDailyLossUsd}`
      );
    }
    if (this.config.requireApproval) {
      const approvalId = `${request.token}-${request.side}-${Date.now()}`;
      this.pendingApprovals.set(approvalId, {
        id: approvalId,
        request,
        createdAt: Date.now()
      });
      return {
        allowed: false,
        requiresApproval: true,
        approvalId,
        reason: `Requires human approval (ID: ${approvalId})`,
        warnings
      };
    }
    return { allowed: true, warnings };
  }
  approveTradeById(approvalId) {
    const approval = this.pendingApprovals.get(approvalId);
    if (approval) {
      this.pendingApprovals.delete(approvalId);
      return approval.request;
    }
    return null;
  }
  rejectTradeById(approvalId) {
    this.pendingApprovals.delete(approvalId);
  }
  recordTradeResult(pnl) {
    this.dailyPnL += pnl;
    if (pnl < 0) {
      this.lastLossTime = Date.now();
    }
  }
  getStatus() {
    const inCoolDown = this.lastLossTime > 0 && Date.now() < this.lastLossTime + this.config.coolDownAfterLossMs;
    return {
      dailyPnL: this.dailyPnL,
      inCoolDown,
      coolDownRemainingMs: inCoolDown ? this.lastLossTime + this.config.coolDownAfterLossMs - Date.now() : 0,
      pendingApprovals: this.pendingApprovals.size,
      config: this.config
    };
  }
  getPendingApprovals() {
    return Array.from(this.pendingApprovals.values());
  }
  resetDailyPnL() {
    this.dailyPnL = 0;
    this.dailyPnLResetTime = this.getNextMidnightUTC();
  }
  clearCoolDown() {
    this.lastLossTime = 0;
  }
  getNextMidnightUTC() {
    const now = /* @__PURE__ */ new Date();
    const tomorrow = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() + 1,
        0,
        0,
        0,
        0
      )
    );
    return tomorrow.getTime();
  }
};

// src/resilience/index.ts
async function withResilience(fn, options) {
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

export {
  calculateDelay,
  withRetry,
  Retry,
  CircuitState,
  CircuitBreakerOpenError,
  CircuitBreaker,
  TimeoutError,
  withTimeout,
  TimeoutController,
  Deadline,
  TimeoutManager,
  sleep,
  raceWithTimeout,
  sequenceWithTimeout,
  HealthMonitor,
  createHealthCheck,
  HealthAggregator,
  createHttpHealthCheck,
  createFunctionHealthCheck,
  mergeHealthResults,
  LiveModeGuard,
  withResilience
};
//# sourceMappingURL=chunk-FTNYIF3C.js.map