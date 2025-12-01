/**
 * Health Aggregator
 * Phase 12D: Reliability & Resilience
 */

import { EventEmitter } from "eventemitter3";
import {
  type HealthStatus,
  type HealthCheckType,
  type ServiceHealth,
  type Dependency,
  type HealthAggregatorConfig,
  type AggregatedHealth,
  type HealthHistoryEntry,
  type HealthEvents,
  HealthAggregatorConfigSchema,
} from "./types.js";

// ============================================================================
// Health Check Error
// ============================================================================

export class HealthCheckError extends Error {
  constructor(
    public readonly service: string,
    public readonly checkType: HealthCheckType,
    message: string
  ) {
    super(`Health check failed for ${service} (${checkType}): ${message}`);
    this.name = "HealthCheckError";
  }
}

// ============================================================================
// Health Aggregator Class
// ============================================================================

export class HealthAggregator extends EventEmitter<HealthEvents> {
  private config: Required<HealthAggregatorConfig>;
  private services: Map<string, ServiceHealth> = new Map();
  private dependencies: Map<string, ServiceHealth> = new Map();
  private history: HealthHistoryEntry[] = [];
  private consecutiveFailures: Map<string, number> = new Map();
  private consecutiveSuccesses: Map<string, number> = new Map();
  private checkInterval: NodeJS.Timeout | null = null;
  private startTime: Date;
  private currentStatus: HealthStatus = "unknown";

  constructor(config: Partial<HealthAggregatorConfig> = {}) {
    super();
    this.config = HealthAggregatorConfigSchema.parse(config) as Required<HealthAggregatorConfig>;
    this.startTime = new Date();

    // Register dependencies from config
    if (this.config.dependencies) {
      for (const dep of this.config.dependencies) {
        this.registerDependency(dep);
      }
    }
  }

  // ============================================================================
  // Public API
  // ============================================================================

  /**
   * Start periodic health checks
   */
  start(): void {
    if (this.checkInterval) {
      return;
    }

    // Initial check
    this.runChecks();

    // Schedule periodic checks
    this.checkInterval = setInterval(() => {
      this.runChecks();
    }, this.config.checkInterval);
  }

  /**
   * Stop periodic health checks
   */
  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Register a service health check
   */
  registerService(
    name: string,
    checkFn?: () => Promise<boolean>,
    options?: { timeout?: number }
  ): void {
    this.services.set(name, {
      name,
      status: "unknown",
      lastCheck: new Date(),
    });

    if (checkFn) {
      // Store check function for later use
      (this.services.get(name) as ServiceHealth & { checkFn: () => Promise<boolean> }).checkFn =
        checkFn;
      (this.services.get(name) as ServiceHealth & { timeout: number }).timeout =
        options?.timeout ?? 5000;
    }
  }

  /**
   * Register a dependency
   */
  registerDependency(dependency: Dependency): void {
    this.dependencies.set(dependency.name, {
      name: dependency.name,
      status: "unknown",
      lastCheck: new Date(),
      metadata: {
        type: dependency.type,
        weight: dependency.weight,
        timeout: dependency.timeout,
      },
    });

    if (dependency.checkFn) {
      (this.dependencies.get(dependency.name) as ServiceHealth & { checkFn: () => Promise<boolean> }).checkFn =
        dependency.checkFn;
    }
  }

  /**
   * Update service health manually
   */
  updateServiceHealth(
    name: string,
    status: HealthStatus,
    options?: { latency?: number; message?: string; metadata?: Record<string, unknown> }
  ): void {
    const service = this.services.get(name);
    const oldStatus = service?.status;

    const newHealth: ServiceHealth = {
      name,
      status,
      latency: options?.latency,
      lastCheck: new Date(),
      message: options?.message,
      metadata: options?.metadata,
    };

    this.services.set(name, newHealth);

    if (oldStatus !== status) {
      this.emit("serviceHealthChanged", name, status);
    }

    // Recalculate overall health
    this.calculateOverallHealth();
  }

  /**
   * Get aggregated health
   */
  getHealth(): AggregatedHealth {
    return {
      status: this.currentStatus,
      services: Array.from(this.services.values()),
      dependencies: Array.from(this.dependencies.values()),
      uptime: Date.now() - this.startTime.getTime(),
      lastUpdated: new Date(),
    };
  }

  /**
   * Get health for a specific type
   */
  async checkHealth(type: HealthCheckType = "liveness"): Promise<AggregatedHealth> {
    switch (type) {
      case "liveness":
        // Quick check - is the process alive?
        return {
          status: "healthy",
          services: [],
          dependencies: [],
          uptime: Date.now() - this.startTime.getTime(),
          lastUpdated: new Date(),
        };

      case "readiness":
        // Check required dependencies
        await this.checkRequiredDependencies();
        return this.getHealth();

      case "startup":
        // Check all services are initialized
        await this.runChecks();
        return this.getHealth();

      case "deep":
        // Full health check
        await this.runChecks();
        return this.getHealth();

      default:
        return this.getHealth();
    }
  }

  /**
   * Get health history
   */
  getHistory(limit?: number): HealthHistoryEntry[] {
    const entries = [...this.history];
    if (limit) {
      return entries.slice(-limit);
    }
    return entries;
  }

  /**
   * Check if system is healthy
   */
  isHealthy(): boolean {
    return this.currentStatus === "healthy";
  }

  /**
   * Check if system is at least degraded (not unhealthy)
   */
  isOperational(): boolean {
    return this.currentStatus === "healthy" || this.currentStatus === "degraded";
  }

  /**
   * Get uptime in milliseconds
   */
  getUptime(): number {
    return Date.now() - this.startTime.getTime();
  }

  /**
   * Get summary
   */
  getSummary(): {
    status: HealthStatus;
    services: { total: number; healthy: number; unhealthy: number };
    dependencies: { total: number; healthy: number; unhealthy: number };
    uptime: number;
  } {
    const serviceStatuses = Array.from(this.services.values());
    const depStatuses = Array.from(this.dependencies.values());

    return {
      status: this.currentStatus,
      services: {
        total: serviceStatuses.length,
        healthy: serviceStatuses.filter((s) => s.status === "healthy").length,
        unhealthy: serviceStatuses.filter((s) => s.status === "unhealthy").length,
      },
      dependencies: {
        total: depStatuses.length,
        healthy: depStatuses.filter((s) => s.status === "healthy").length,
        unhealthy: depStatuses.filter((s) => s.status === "unhealthy").length,
      },
      uptime: this.getUptime(),
    };
  }

  /**
   * Dispose
   */
  dispose(): void {
    this.stop();
    this.services.clear();
    this.dependencies.clear();
    this.history = [];
    this.removeAllListeners();
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private async runChecks(): Promise<void> {
    try {
      // Check all services
      await Promise.all(
        Array.from(this.services.entries()).map(async ([name, service]) => {
          await this.checkService(name, service);
        })
      );

      // Check all dependencies
      await Promise.all(
        Array.from(this.dependencies.entries()).map(async ([name, dep]) => {
          await this.checkDependency(name, dep);
        })
      );

      // Calculate overall health
      this.calculateOverallHealth();

      // Record history
      this.recordHistory();

      // Emit event
      this.emit("checkCompleted", this.getHealth());
    } catch (error) {
      this.emit("checkFailed", error instanceof Error ? error : new Error(String(error)));
    }
  }

  private async checkService(name: string, service: ServiceHealth): Promise<void> {
    const checkFn = (service as ServiceHealth & { checkFn?: () => Promise<boolean> }).checkFn;
    const timeout = (service as ServiceHealth & { timeout?: number }).timeout ?? 5000;

    if (!checkFn) {
      return; // No check function, status is managed externally
    }

    const startTime = Date.now();

    try {
      const result = await this.withTimeout(checkFn(), timeout);
      const latency = Date.now() - startTime;

      if (result) {
        this.recordSuccess(name, "service", latency);
      } else {
        this.recordFailure(name, "service", "Check returned false");
      }
    } catch (error) {
      const latency = Date.now() - startTime;
      this.recordFailure(
        name,
        "service",
        error instanceof Error ? error.message : "Unknown error",
        latency
      );
    }
  }

  private async checkDependency(name: string, dep: ServiceHealth): Promise<void> {
    const checkFn = (dep as ServiceHealth & { checkFn?: () => Promise<boolean> }).checkFn;
    const timeout = (dep.metadata?.timeout as number) ?? 5000;

    if (!checkFn) {
      return; // No check function, status is managed externally
    }

    const startTime = Date.now();

    try {
      const result = await this.withTimeout(checkFn(), timeout);
      const latency = Date.now() - startTime;

      if (result) {
        this.recordSuccess(name, "dependency", latency);
      } else {
        this.recordFailure(name, "dependency", "Check returned false");
      }
    } catch (error) {
      const latency = Date.now() - startTime;
      this.recordFailure(
        name,
        "dependency",
        error instanceof Error ? error.message : "Unknown error",
        latency
      );
    }
  }

  private async checkRequiredDependencies(): Promise<void> {
    const required = Array.from(this.dependencies.entries()).filter(
      ([, dep]) => dep.metadata?.type === "required"
    );

    await Promise.all(
      required.map(async ([name, dep]) => {
        await this.checkDependency(name, dep);
      })
    );
  }

  private recordSuccess(name: string, type: "service" | "dependency", latency: number): void {
    const map = type === "service" ? this.services : this.dependencies;
    const existing = map.get(name);

    const failures = this.consecutiveFailures.get(name) ?? 0;
    const successes = (this.consecutiveSuccesses.get(name) ?? 0) + 1;

    this.consecutiveSuccesses.set(name, successes);
    this.consecutiveFailures.set(name, 0);

    // Determine new status
    let newStatus: HealthStatus = existing?.status ?? "unknown";

    if (successes >= this.config.healthyThreshold) {
      newStatus = "healthy";
    } else if (failures > 0) {
      newStatus = "degraded";
    }

    const oldStatus = existing?.status;
    const newHealth: ServiceHealth = {
      ...existing,
      name,
      status: newStatus,
      latency,
      lastCheck: new Date(),
      message: undefined,
    };

    map.set(name, newHealth);

    if (oldStatus !== newStatus) {
      this.emit("serviceHealthChanged", name, newStatus);
    }
  }

  private recordFailure(
    name: string,
    type: "service" | "dependency",
    message: string,
    latency?: number
  ): void {
    const map = type === "service" ? this.services : this.dependencies;
    const existing = map.get(name);

    const failures = (this.consecutiveFailures.get(name) ?? 0) + 1;

    this.consecutiveFailures.set(name, failures);
    this.consecutiveSuccesses.set(name, 0);

    // Determine new status
    let newStatus: HealthStatus = existing?.status ?? "unknown";

    if (failures >= this.config.unhealthyThreshold) {
      newStatus = "unhealthy";
    } else {
      newStatus = "degraded";
    }

    const oldStatus = existing?.status;
    const newHealth: ServiceHealth = {
      ...existing,
      name,
      status: newStatus,
      latency,
      lastCheck: new Date(),
      message,
    };

    map.set(name, newHealth);

    if (oldStatus !== newStatus) {
      this.emit("serviceHealthChanged", name, newStatus);
    }
  }

  private calculateOverallHealth(): void {
    const oldStatus = this.currentStatus;

    // Get all statuses with weights
    const allHealth: { status: HealthStatus; weight: number; required: boolean }[] = [];

    for (const service of this.services.values()) {
      allHealth.push({
        status: service.status,
        weight: 1,
        required: false,
      });
    }

    for (const dep of this.dependencies.values()) {
      allHealth.push({
        status: dep.status,
        weight: (dep.metadata?.weight as number) ?? 1,
        required: dep.metadata?.type === "required",
      });
    }

    if (allHealth.length === 0) {
      this.currentStatus = "healthy";
      return;
    }

    // Check required dependencies first
    const requiredUnhealthy = allHealth.filter(
      (h) => h.required && h.status === "unhealthy"
    );

    if (requiredUnhealthy.length > 0) {
      this.currentStatus = "unhealthy";
    } else {
      // Calculate weighted health score
      let totalWeight = 0;
      let healthyWeight = 0;
      let degradedWeight = 0;

      for (const h of allHealth) {
        totalWeight += h.weight;
        if (h.status === "healthy") {
          healthyWeight += h.weight;
        } else if (h.status === "degraded") {
          degradedWeight += h.weight;
        }
      }

      const healthScore = (healthyWeight + degradedWeight * 0.5) / totalWeight;

      if (healthScore >= 0.9) {
        this.currentStatus = "healthy";
      } else if (healthScore >= 0.5) {
        this.currentStatus = "degraded";
      } else {
        this.currentStatus = "unhealthy";
      }
    }

    if (oldStatus !== this.currentStatus) {
      this.emit("statusChanged", oldStatus, this.currentStatus);
    }
  }

  private recordHistory(): void {
    const entry: HealthHistoryEntry = {
      timestamp: new Date(),
      status: this.currentStatus,
      services: {},
    };

    for (const [name, service] of this.services) {
      entry.services[name] = service.status;
    }

    for (const [name, dep] of this.dependencies) {
      entry.services[`dep:${name}`] = dep.status;
    }

    this.history.push(entry);

    // Trim history
    if (this.history.length > this.config.historySize) {
      this.history = this.history.slice(-this.config.historySize);
    }
  }

  private async withTimeout<T>(promise: Promise<T>, timeout: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Timeout")), timeout);
      }),
    ]);
  }
}

// ============================================================================
// Singleton & Factory
// ============================================================================

let healthAggregatorInstance: HealthAggregator | null = null;

export function getHealthAggregator(
  config?: Partial<HealthAggregatorConfig>
): HealthAggregator {
  if (!healthAggregatorInstance) {
    healthAggregatorInstance = new HealthAggregator(config);
  }
  return healthAggregatorInstance;
}

export function createHealthAggregator(
  config?: Partial<HealthAggregatorConfig>
): HealthAggregator {
  return new HealthAggregator(config);
}
