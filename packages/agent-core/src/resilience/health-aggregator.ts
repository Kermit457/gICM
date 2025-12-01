/**
 * Health Aggregator for gICM platform
 *
 * Aggregates health status from multiple services/engines into a unified view.
 * Supports service discovery, dependency tracking, and alert thresholds.
 */

import { z } from "zod";
import type { HealthStatus, HealthResult } from "./health-check.js";

// ============================================================================
// Types
// ============================================================================

export const ServiceHealthSchema = z.object({
  serviceId: z.string(),
  name: z.string(),
  status: z.enum(["healthy", "degraded", "unhealthy", "unknown"]),
  lastCheck: z.number(),
  lastHealthy: z.number().optional(),
  responseTimeMs: z.number().optional(),
  errorCount: z.number().default(0),
  metadata: z.record(z.unknown()).optional(),
});

export type ServiceHealth = z.infer<typeof ServiceHealthSchema>;

export const AggregatedHealthSchema = z.object({
  overallStatus: z.enum(["healthy", "degraded", "unhealthy", "unknown"]),
  services: z.array(ServiceHealthSchema),
  summary: z.object({
    healthy: z.number(),
    degraded: z.number(),
    unhealthy: z.number(),
    unknown: z.number(),
    total: z.number(),
  }),
  dependencies: z.record(z.array(z.string())).optional(),
  timestamp: z.number(),
});

export type AggregatedHealth = z.infer<typeof AggregatedHealthSchema>;

export interface ServiceConfig {
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

export interface AlertConfig {
  /** Callback when status changes */
  onStatusChange?: (
    serviceId: string,
    oldStatus: HealthStatus | "unknown",
    newStatus: HealthStatus | "unknown"
  ) => void;
  /** Callback when service becomes unhealthy */
  onUnhealthy?: (serviceId: string, health: ServiceHealth) => void;
  /** Callback when service recovers */
  onRecovered?: (serviceId: string, health: ServiceHealth) => void;
  /** Callback for overall status change */
  onOverallStatusChange?: (
    oldStatus: HealthStatus | "unknown",
    newStatus: HealthStatus | "unknown"
  ) => void;
}

export interface HealthAggregatorConfig {
  /** Default check interval (ms) */
  defaultInterval?: number;
  /** Default timeout (ms) */
  defaultTimeout?: number;
  /** How long before marking service as unknown (ms) */
  staleThreshold?: number;
  /** Alert configuration */
  alerts?: AlertConfig;
}

// ============================================================================
// HealthAggregator
// ============================================================================

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
export class HealthAggregator {
  private services: Map<string, ServiceConfig> = new Map();
  private healthCache: Map<string, ServiceHealth> = new Map();
  private pollingIntervals: Map<string, ReturnType<typeof setInterval>> =
    new Map();
  private lastOverallStatus: HealthStatus | "unknown" = "unknown";
  private readonly config: Required<
    Omit<HealthAggregatorConfig, "alerts">
  > & { alerts?: AlertConfig };

  constructor(config?: HealthAggregatorConfig) {
    this.config = {
      defaultInterval: config?.defaultInterval ?? 30000, // 30 seconds
      defaultTimeout: config?.defaultTimeout ?? 5000, // 5 seconds
      staleThreshold: config?.staleThreshold ?? 60000, // 1 minute
      alerts: config?.alerts,
    };
  }

  /**
   * Register a service for health monitoring
   */
  registerService(service: ServiceConfig): void {
    this.services.set(service.id, {
      ...service,
      interval: service.interval ?? this.config.defaultInterval,
      timeout: service.timeout ?? this.config.defaultTimeout,
    });

    // Initialize health cache
    this.healthCache.set(service.id, {
      serviceId: service.id,
      name: service.name,
      status: "unknown",
      lastCheck: 0,
      errorCount: 0,
      metadata: service.metadata,
    });
  }

  /**
   * Unregister a service
   */
  unregisterService(serviceId: string): void {
    this.stopPolling(serviceId);
    this.services.delete(serviceId);
    this.healthCache.delete(serviceId);
  }

  /**
   * Check health of a specific service
   */
  async checkService(serviceId: string): Promise<ServiceHealth> {
    const service = this.services.get(serviceId);
    if (!service) {
      throw new Error(`Service not found: ${serviceId}`);
    }

    const startTime = Date.now();
    const previousHealth = this.healthCache.get(serviceId);
    const previousStatus = previousHealth?.status ?? "unknown";

    try {
      // Run health check with timeout
      const checkPromise = service.healthCheck();
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(
          () => reject(new Error("Health check timeout")),
          service.timeout ?? this.config.defaultTimeout
        );
      });

      const result = await Promise.race([checkPromise, timeoutPromise]);
      const responseTime = Date.now() - startTime;

      // Normalize result
      let status: HealthStatus;
      if (typeof result === "boolean") {
        status = result ? "healthy" : "unhealthy";
      } else {
        status = result.status;
      }

      const health: ServiceHealth = {
        serviceId,
        name: service.name,
        status,
        lastCheck: Date.now(),
        lastHealthy: status === "healthy" ? Date.now() : previousHealth?.lastHealthy,
        responseTimeMs: responseTime,
        errorCount: status === "healthy" ? 0 : (previousHealth?.errorCount ?? 0) + 1,
        metadata: service.metadata,
      };

      this.healthCache.set(serviceId, health);

      // Trigger alerts
      this.triggerAlerts(serviceId, previousStatus, status, health);

      return health;
    } catch (error) {
      const health: ServiceHealth = {
        serviceId,
        name: service.name,
        status: "unhealthy",
        lastCheck: Date.now(),
        lastHealthy: previousHealth?.lastHealthy,
        responseTimeMs: Date.now() - startTime,
        errorCount: (previousHealth?.errorCount ?? 0) + 1,
        metadata: {
          ...service.metadata,
          lastError: error instanceof Error ? error.message : String(error),
        },
      };

      this.healthCache.set(serviceId, health);

      // Trigger alerts
      this.triggerAlerts(serviceId, previousStatus, "unhealthy", health);

      return health;
    }
  }

  /**
   * Check all registered services
   */
  async checkAll(): Promise<Map<string, ServiceHealth>> {
    const results = new Map<string, ServiceHealth>();

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
  getHealth(): AggregatedHealth {
    const services: ServiceHealth[] = [];
    let healthy = 0;
    let degraded = 0;
    let unhealthy = 0;
    let unknown = 0;

    const now = Date.now();

    for (const [serviceId, health] of this.healthCache) {
      // Check if health data is stale
      const isStale = now - health.lastCheck > this.config.staleThreshold;
      const effectiveStatus = isStale ? "unknown" : health.status;

      const serviceHealth: ServiceHealth = {
        ...health,
        status: effectiveStatus,
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

    // Determine overall status
    let overallStatus: HealthStatus | "unknown";
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

    // Check for overall status change
    if (overallStatus !== this.lastOverallStatus) {
      this.config.alerts?.onOverallStatusChange?.(
        this.lastOverallStatus,
        overallStatus
      );
      this.lastOverallStatus = overallStatus;
    }

    // Build dependency map
    const dependencies: Record<string, string[]> = {};
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
        total: services.length,
      },
      dependencies: Object.keys(dependencies).length > 0 ? dependencies : undefined,
      timestamp: now,
    };
  }

  /**
   * Get health of a specific service (cached)
   */
  getServiceHealth(serviceId: string): ServiceHealth | undefined {
    return this.healthCache.get(serviceId);
  }

  /**
   * Check if all critical services are healthy
   */
  isCriticalHealthy(): boolean {
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
  getDependents(serviceId: string): string[] {
    const dependents: string[] = [];
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
  isServiceReady(serviceId: string): boolean {
    const service = this.services.get(serviceId);
    if (!service) return false;

    // Check own health
    const health = this.healthCache.get(serviceId);
    if (!health || health.status !== "healthy") {
      return false;
    }

    // Check dependencies
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
  startPolling(serviceId: string): void {
    const service = this.services.get(serviceId);
    if (!service) return;

    // Stop existing polling if any
    this.stopPolling(serviceId);

    // Initial check
    this.checkService(serviceId);

    // Start interval
    const interval = setInterval(() => {
      this.checkService(serviceId);
    }, service.interval ?? this.config.defaultInterval);

    this.pollingIntervals.set(serviceId, interval);
  }

  /**
   * Start polling for all services
   */
  startAllPolling(): void {
    for (const serviceId of this.services.keys()) {
      this.startPolling(serviceId);
    }
  }

  /**
   * Stop polling for a specific service
   */
  stopPolling(serviceId: string): void {
    const interval = this.pollingIntervals.get(serviceId);
    if (interval) {
      clearInterval(interval);
      this.pollingIntervals.delete(serviceId);
    }
  }

  /**
   * Stop all polling
   */
  stopAllPolling(): void {
    for (const serviceId of this.pollingIntervals.keys()) {
      this.stopPolling(serviceId);
    }
  }

  /**
   * Get list of registered services
   */
  listServices(): string[] {
    return Array.from(this.services.keys());
  }

  /**
   * Get service configuration
   */
  getServiceConfig(serviceId: string): ServiceConfig | undefined {
    return this.services.get(serviceId);
  }

  private triggerAlerts(
    serviceId: string,
    previousStatus: HealthStatus | "unknown",
    newStatus: HealthStatus | "unknown",
    health: ServiceHealth
  ): void {
    if (!this.config.alerts) return;

    // Status change
    if (previousStatus !== newStatus) {
      this.config.alerts.onStatusChange?.(serviceId, previousStatus, newStatus);

      // Unhealthy
      if (newStatus === "unhealthy") {
        this.config.alerts.onUnhealthy?.(serviceId, health);
      }

      // Recovered
      if (
        previousStatus === "unhealthy" &&
        (newStatus === "healthy" || newStatus === "degraded")
      ) {
        this.config.alerts.onRecovered?.(serviceId, health);
      }
    }
  }
}

// ============================================================================
// Utility functions
// ============================================================================

/**
 * Create a simple health check that pings a URL
 */
export function createHttpHealthCheck(
  url: string,
  options?: {
    timeout?: number;
    expectedStatus?: number;
  }
): () => Promise<boolean> {
  return async () => {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      options?.timeout ?? 5000
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

/**
 * Create a health check that calls a function
 */
export function createFunctionHealthCheck(
  fn: () => Promise<boolean> | boolean
): () => Promise<boolean> {
  return async () => {
    const result = await fn();
    return result;
  };
}

/**
 * Merge multiple health results into one
 */
export function mergeHealthResults(
  results: HealthResult[]
): HealthResult {
  let hasCriticalFailure = false;
  let hasNonCriticalFailure = false;
  const checks: Record<string, { status: "pass" | "fail"; responseTime: number; critical: boolean; error?: string }> = {};

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

  let status: HealthStatus;
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
    timestamp: new Date().toISOString(),
    uptime: Math.max(...results.map((r) => r.uptime)),
  };
}
