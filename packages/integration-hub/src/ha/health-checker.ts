/**
 * Health Checker
 * Phase 12A: Multi-Region Health Monitoring
 */

import { EventEmitter } from "eventemitter3";
import type {
  Region,
  RegionConfig,
  HealthCheckConfig,
  HealthCheckResult,
  HAEvents,
} from "./types.js";
import { DEFAULT_HEALTH_CHECK_CONFIG } from "./types.js";

// =============================================================================
// HEALTH CHECKER
// =============================================================================

export class HealthChecker extends EventEmitter<HAEvents> {
  private config: HealthCheckConfig;
  private regions: Map<Region, RegionConfig> = new Map();
  private results: Map<Region, HealthCheckResult> = new Map();
  private checkInterval: NodeJS.Timeout | null = null;
  private consecutiveFailures: Map<Region, number> = new Map();
  private consecutiveSuccesses: Map<Region, number> = new Map();

  constructor(config: Partial<HealthCheckConfig> = {}) {
    super();
    this.config = { ...DEFAULT_HEALTH_CHECK_CONFIG, ...config };
  }

  // ===========================================================================
  // REGION MANAGEMENT
  // ===========================================================================

  addRegion(regionConfig: RegionConfig): void {
    this.regions.set(regionConfig.region, regionConfig);
    this.consecutiveFailures.set(regionConfig.region, 0);
    this.consecutiveSuccesses.set(regionConfig.region, 0);
    console.log(`[HA] Added region for health checks: ${regionConfig.region}`);
  }

  removeRegion(region: Region): void {
    this.regions.delete(region);
    this.results.delete(region);
    this.consecutiveFailures.delete(region);
    this.consecutiveSuccesses.delete(region);
    console.log(`[HA] Removed region from health checks: ${region}`);
  }

  // ===========================================================================
  // HEALTH CHECK EXECUTION
  // ===========================================================================

  async checkRegion(region: Region): Promise<HealthCheckResult> {
    const regionConfig = this.regions.get(region);
    if (!regionConfig) {
      throw new Error(`Region not configured: ${region}`);
    }

    const startTime = Date.now();
    let healthy = false;
    let statusCode: number | undefined;
    let message: string | undefined;

    try {
      const healthEndpoint = regionConfig.healthEndpoint ||
        `${regionConfig.endpoint}${this.config.path}`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);

      try {
        const response = await fetch(healthEndpoint, {
          method: "GET",
          signal: controller.signal,
          headers: {
            "User-Agent": "gICM-HealthChecker/1.0",
            "Accept": "application/json",
          },
        });

        clearTimeout(timeout);
        statusCode = response.status;
        healthy = response.status === this.config.expectedStatus;

        if (!healthy) {
          const body = await response.text().catch(() => "");
          message = `Unexpected status: ${response.status}. ${body.slice(0, 100)}`;
        }
      } catch (fetchError) {
        clearTimeout(timeout);
        if (fetchError instanceof Error) {
          if (fetchError.name === "AbortError") {
            message = `Timeout after ${this.config.timeoutMs}ms`;
          } else {
            message = fetchError.message;
          }
        }
      }
    } catch (error) {
      message = error instanceof Error ? error.message : "Unknown error";
    }

    const latencyMs = Date.now() - startTime;
    const prevResult = this.results.get(region);
    const prevFailures = this.consecutiveFailures.get(region) || 0;

    // Update consecutive counters
    if (healthy) {
      this.consecutiveFailures.set(region, 0);
      this.consecutiveSuccesses.set(region, (this.consecutiveSuccesses.get(region) || 0) + 1);
    } else {
      this.consecutiveSuccesses.set(region, 0);
      this.consecutiveFailures.set(region, prevFailures + 1);
    }

    const result: HealthCheckResult = {
      region,
      healthy,
      latencyMs,
      statusCode,
      message,
      checkedAt: new Date().toISOString(),
      consecutiveFailures: this.consecutiveFailures.get(region) || 0,
      lastSuccessAt: healthy ? new Date().toISOString() : prevResult?.lastSuccessAt,
      lastFailureAt: !healthy ? new Date().toISOString() : prevResult?.lastFailureAt,
    };

    this.results.set(region, result);

    // Emit events for state transitions
    if (prevResult?.healthy && !healthy) {
      // Region became unhealthy
      if (result.consecutiveFailures >= this.config.unhealthyThreshold) {
        this.emit("health:degraded", region, result);
        console.log(`[HA] Region ${region} is DEGRADED (${result.consecutiveFailures} failures)`);
      }
    } else if (!prevResult?.healthy && healthy) {
      // Region recovered
      const successes = this.consecutiveSuccesses.get(region) || 0;
      if (successes >= this.config.healthyThreshold) {
        this.emit("health:recovered", region, result);
        console.log(`[HA] Region ${region} RECOVERED`);
      }
    }

    return result;
  }

  async checkAllRegions(): Promise<HealthCheckResult[]> {
    const regions = Array.from(this.regions.keys());
    const results = await Promise.all(
      regions.map(region => this.checkRegion(region).catch(error => ({
        region,
        healthy: false,
        latencyMs: 0,
        checkedAt: new Date().toISOString(),
        consecutiveFailures: (this.consecutiveFailures.get(region) || 0) + 1,
        message: error instanceof Error ? error.message : "Check failed",
      } as HealthCheckResult)))
    );

    this.emit("health:checked", results);
    return results;
  }

  // ===========================================================================
  // CONTINUOUS MONITORING
  // ===========================================================================

  start(): void {
    if (this.checkInterval) {
      console.log("[HA] Health checker already running");
      return;
    }

    console.log(`[HA] Starting health checker (interval: ${this.config.intervalMs}ms)`);

    // Initial check
    this.checkAllRegions().catch(err => {
      console.error("[HA] Initial health check failed:", err);
    });

    // Continuous checks
    this.checkInterval = setInterval(() => {
      this.checkAllRegions().catch(err => {
        console.error("[HA] Health check failed:", err);
      });
    }, this.config.intervalMs);
  }

  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log("[HA] Health checker stopped");
    }
  }

  // ===========================================================================
  // GETTERS
  // ===========================================================================

  getResult(region: Region): HealthCheckResult | undefined {
    return this.results.get(region);
  }

  getAllResults(): Map<Region, HealthCheckResult> {
    return new Map(this.results);
  }

  getHealthyRegions(): Region[] {
    return Array.from(this.results.entries())
      .filter(([_, result]) => result.healthy)
      .map(([region]) => region);
  }

  getUnhealthyRegions(): Region[] {
    return Array.from(this.results.entries())
      .filter(([_, result]) => !result.healthy)
      .map(([region]) => region);
  }

  isRegionHealthy(region: Region): boolean {
    const result = this.results.get(region);
    return result?.healthy ?? false;
  }

  getAverageLatency(): number {
    const results = Array.from(this.results.values()).filter(r => r.healthy);
    if (results.length === 0) return 0;
    return results.reduce((sum, r) => sum + r.latencyMs, 0) / results.length;
  }

  getGlobalAvailability(): number {
    const total = this.results.size;
    if (total === 0) return 100;
    const healthy = this.getHealthyRegions().length;
    return (healthy / total) * 100;
  }
}

// =============================================================================
// SINGLETON
// =============================================================================

let healthCheckerInstance: HealthChecker | null = null;

export function getHealthChecker(): HealthChecker {
  if (!healthCheckerInstance) {
    healthCheckerInstance = new HealthChecker();
  }
  return healthCheckerInstance;
}

export function createHealthChecker(config?: Partial<HealthCheckConfig>): HealthChecker {
  healthCheckerInstance = new HealthChecker(config);
  return healthCheckerInstance;
}
