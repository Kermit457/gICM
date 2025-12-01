import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  HealthAggregator,
  createFunctionHealthCheck,
  mergeHealthResults,
} from "../resilience/health-aggregator.js";
import type { HealthResult } from "../resilience/health-check.js";

describe("HealthAggregator", () => {
  let aggregator: HealthAggregator;

  beforeEach(() => {
    aggregator = new HealthAggregator({
      defaultInterval: 1000,
      defaultTimeout: 100,
      staleThreshold: 5000,
    });
  });

  afterEach(() => {
    aggregator.stopAllPolling();
  });

  describe("registerService", () => {
    it("registers a service", () => {
      aggregator.registerService({
        id: "test-service",
        name: "Test Service",
        healthCheck: async () => true,
      });

      expect(aggregator.listServices()).toContain("test-service");
    });

    it("initializes health cache as unknown", () => {
      aggregator.registerService({
        id: "test-service",
        name: "Test Service",
        healthCheck: async () => true,
      });

      const health = aggregator.getServiceHealth("test-service");
      expect(health?.status).toBe("unknown");
    });
  });

  describe("unregisterService", () => {
    it("removes a service", () => {
      aggregator.registerService({
        id: "test-service",
        name: "Test Service",
        healthCheck: async () => true,
      });

      aggregator.unregisterService("test-service");
      expect(aggregator.listServices()).not.toContain("test-service");
    });
  });

  describe("checkService", () => {
    it("returns healthy status on success", async () => {
      aggregator.registerService({
        id: "healthy-service",
        name: "Healthy Service",
        healthCheck: async () => true,
      });

      const health = await aggregator.checkService("healthy-service");
      expect(health.status).toBe("healthy");
      expect(health.errorCount).toBe(0);
    });

    it("returns unhealthy status on failure", async () => {
      aggregator.registerService({
        id: "unhealthy-service",
        name: "Unhealthy Service",
        healthCheck: async () => false,
      });

      const health = await aggregator.checkService("unhealthy-service");
      expect(health.status).toBe("unhealthy");
    });

    it("returns unhealthy status on error", async () => {
      aggregator.registerService({
        id: "error-service",
        name: "Error Service",
        healthCheck: async () => {
          throw new Error("Check failed");
        },
      });

      const health = await aggregator.checkService("error-service");
      expect(health.status).toBe("unhealthy");
      expect(health.metadata?.lastError).toBe("Check failed");
    });

    it("handles timeout", async () => {
      aggregator.registerService({
        id: "slow-service",
        name: "Slow Service",
        healthCheck: async () => {
          await new Promise((r) => setTimeout(r, 200));
          return true;
        },
        timeout: 50,
      });

      const health = await aggregator.checkService("slow-service");
      expect(health.status).toBe("unhealthy");
    });

    it("increments error count on failures", async () => {
      aggregator.registerService({
        id: "flaky-service",
        name: "Flaky Service",
        healthCheck: async () => false,
      });

      await aggregator.checkService("flaky-service");
      await aggregator.checkService("flaky-service");
      await aggregator.checkService("flaky-service");

      const health = aggregator.getServiceHealth("flaky-service");
      expect(health?.errorCount).toBe(3);
    });

    it("resets error count on success", async () => {
      let shouldFail = true;
      aggregator.registerService({
        id: "recovering-service",
        name: "Recovering Service",
        healthCheck: async () => !shouldFail,
      });

      await aggregator.checkService("recovering-service");
      await aggregator.checkService("recovering-service");
      expect(aggregator.getServiceHealth("recovering-service")?.errorCount).toBe(2);

      shouldFail = false;
      await aggregator.checkService("recovering-service");
      expect(aggregator.getServiceHealth("recovering-service")?.errorCount).toBe(0);
    });

    it("throws for unknown service", async () => {
      await expect(aggregator.checkService("unknown")).rejects.toThrow(
        "Service not found"
      );
    });

    it("handles HealthResult response", async () => {
      aggregator.registerService({
        id: "result-service",
        name: "Result Service",
        healthCheck: async (): Promise<HealthResult> => ({
          status: "degraded",
          checks: {},
          timestamp: new Date().toISOString(),
          uptime: 1000,
        }),
      });

      const health = await aggregator.checkService("result-service");
      expect(health.status).toBe("degraded");
    });
  });

  describe("checkAll", () => {
    it("checks all registered services", async () => {
      aggregator.registerService({
        id: "service-1",
        name: "Service 1",
        healthCheck: async () => true,
      });
      aggregator.registerService({
        id: "service-2",
        name: "Service 2",
        healthCheck: async () => true,
      });

      const results = await aggregator.checkAll();
      expect(results.size).toBe(2);
      expect(results.get("service-1")?.status).toBe("healthy");
      expect(results.get("service-2")?.status).toBe("healthy");
    });
  });

  describe("getHealth", () => {
    it("returns aggregated health", async () => {
      aggregator.registerService({
        id: "s1",
        name: "Service 1",
        healthCheck: async () => true,
      });
      aggregator.registerService({
        id: "s2",
        name: "Service 2",
        healthCheck: async () => false,
      });

      await aggregator.checkAll();
      const health = aggregator.getHealth();

      expect(health.summary.total).toBe(2);
      expect(health.summary.healthy).toBe(1);
      expect(health.summary.unhealthy).toBe(1);
    });

    it("returns unhealthy if any service is unhealthy", async () => {
      aggregator.registerService({
        id: "s1",
        name: "Service 1",
        healthCheck: async () => true,
      });
      aggregator.registerService({
        id: "s2",
        name: "Service 2",
        healthCheck: async () => false,
      });

      await aggregator.checkAll();
      const health = aggregator.getHealth();

      expect(health.overallStatus).toBe("unhealthy");
    });

    it("returns degraded if any service is degraded", async () => {
      aggregator.registerService({
        id: "s1",
        name: "Service 1",
        healthCheck: async () => true,
      });
      aggregator.registerService({
        id: "s2",
        name: "Service 2",
        healthCheck: async (): Promise<HealthResult> => ({
          status: "degraded",
          checks: {},
          timestamp: new Date().toISOString(),
          uptime: 1000,
        }),
      });

      await aggregator.checkAll();
      const health = aggregator.getHealth();

      expect(health.overallStatus).toBe("degraded");
    });

    it("returns healthy if all services are healthy", async () => {
      aggregator.registerService({
        id: "s1",
        name: "Service 1",
        healthCheck: async () => true,
      });
      aggregator.registerService({
        id: "s2",
        name: "Service 2",
        healthCheck: async () => true,
      });

      await aggregator.checkAll();
      const health = aggregator.getHealth();

      expect(health.overallStatus).toBe("healthy");
    });

    it("marks stale health as unknown", async () => {
      const staleAggregator = new HealthAggregator({
        staleThreshold: 10, // 10ms
      });

      staleAggregator.registerService({
        id: "s1",
        name: "Service 1",
        healthCheck: async () => true,
      });

      await staleAggregator.checkService("s1");
      await new Promise((r) => setTimeout(r, 20)); // Wait for stale

      const health = staleAggregator.getHealth();
      expect(health.services[0].status).toBe("unknown");
    });

    it("includes dependency map", async () => {
      aggregator.registerService({
        id: "db",
        name: "Database",
        healthCheck: async () => true,
      });
      aggregator.registerService({
        id: "api",
        name: "API",
        healthCheck: async () => true,
        dependsOn: ["db"],
      });

      const health = aggregator.getHealth();
      expect(health.dependencies?.api).toContain("db");
    });
  });

  describe("isCriticalHealthy", () => {
    it("returns true if all critical services are healthy", async () => {
      aggregator.registerService({
        id: "critical",
        name: "Critical",
        healthCheck: async () => true,
        critical: true,
      });
      aggregator.registerService({
        id: "optional",
        name: "Optional",
        healthCheck: async () => false,
      });

      await aggregator.checkAll();
      expect(aggregator.isCriticalHealthy()).toBe(true);
    });

    it("returns false if any critical service is unhealthy", async () => {
      aggregator.registerService({
        id: "critical",
        name: "Critical",
        healthCheck: async () => false,
        critical: true,
      });

      await aggregator.checkAll();
      expect(aggregator.isCriticalHealthy()).toBe(false);
    });
  });

  describe("dependencies", () => {
    it("getDependents returns services that depend on given service", () => {
      aggregator.registerService({
        id: "db",
        name: "Database",
        healthCheck: async () => true,
      });
      aggregator.registerService({
        id: "api",
        name: "API",
        healthCheck: async () => true,
        dependsOn: ["db"],
      });
      aggregator.registerService({
        id: "worker",
        name: "Worker",
        healthCheck: async () => true,
        dependsOn: ["db"],
      });

      const dependents = aggregator.getDependents("db");
      expect(dependents).toContain("api");
      expect(dependents).toContain("worker");
    });

    it("isServiceReady checks service and dependencies", async () => {
      aggregator.registerService({
        id: "db",
        name: "Database",
        healthCheck: async () => true,
      });
      aggregator.registerService({
        id: "api",
        name: "API",
        healthCheck: async () => true,
        dependsOn: ["db"],
      });

      await aggregator.checkAll();
      expect(aggregator.isServiceReady("api")).toBe(true);
    });

    it("isServiceReady returns false if dependency unhealthy", async () => {
      aggregator.registerService({
        id: "db",
        name: "Database",
        healthCheck: async () => false,
      });
      aggregator.registerService({
        id: "api",
        name: "API",
        healthCheck: async () => true,
        dependsOn: ["db"],
      });

      await aggregator.checkAll();
      expect(aggregator.isServiceReady("api")).toBe(false);
    });
  });

  describe("alerts", () => {
    it("calls onStatusChange when status changes", async () => {
      const onStatusChange = vi.fn();
      const alertAggregator = new HealthAggregator({
        alerts: { onStatusChange },
      });

      alertAggregator.registerService({
        id: "s1",
        name: "Service 1",
        healthCheck: async () => true,
      });

      await alertAggregator.checkService("s1");
      expect(onStatusChange).toHaveBeenCalledWith("s1", "unknown", "healthy");
    });

    it("calls onUnhealthy when service becomes unhealthy", async () => {
      const onUnhealthy = vi.fn();
      const alertAggregator = new HealthAggregator({
        alerts: { onUnhealthy },
      });

      alertAggregator.registerService({
        id: "s1",
        name: "Service 1",
        healthCheck: async () => false,
      });

      await alertAggregator.checkService("s1");
      expect(onUnhealthy).toHaveBeenCalled();
    });

    it("calls onRecovered when service recovers", async () => {
      const onRecovered = vi.fn();
      const alertAggregator = new HealthAggregator({
        alerts: { onRecovered },
      });

      let healthy = false;
      alertAggregator.registerService({
        id: "s1",
        name: "Service 1",
        healthCheck: async () => healthy,
      });

      await alertAggregator.checkService("s1"); // unhealthy
      healthy = true;
      await alertAggregator.checkService("s1"); // healthy

      expect(onRecovered).toHaveBeenCalled();
    });

    it("calls onOverallStatusChange when overall status changes", async () => {
      const onOverallStatusChange = vi.fn();
      const alertAggregator = new HealthAggregator({
        alerts: { onOverallStatusChange },
      });

      alertAggregator.registerService({
        id: "s1",
        name: "Service 1",
        healthCheck: async () => true,
      });

      await alertAggregator.checkService("s1");
      alertAggregator.getHealth(); // Triggers overall status check

      expect(onOverallStatusChange).toHaveBeenCalled();
    });
  });
});

describe("createFunctionHealthCheck", () => {
  it("creates a health check from sync function", async () => {
    const check = createFunctionHealthCheck(() => true);
    expect(await check()).toBe(true);
  });

  it("creates a health check from async function", async () => {
    const check = createFunctionHealthCheck(async () => {
      await new Promise((r) => setTimeout(r, 10));
      return true;
    });
    expect(await check()).toBe(true);
  });
});

describe("mergeHealthResults", () => {
  it("merges multiple health results", () => {
    const results: HealthResult[] = [
      {
        status: "healthy",
        checks: {
          check1: { status: "pass", responseTime: 10, critical: false },
        },
        timestamp: new Date().toISOString(),
        uptime: 1000,
      },
      {
        status: "healthy",
        checks: {
          check2: { status: "pass", responseTime: 20, critical: false },
        },
        timestamp: new Date().toISOString(),
        uptime: 2000,
      },
    ];

    const merged = mergeHealthResults(results);
    expect(merged.status).toBe("healthy");
    expect(merged.checks.check1).toBeDefined();
    expect(merged.checks.check2).toBeDefined();
    expect(merged.uptime).toBe(2000);
  });

  it("returns unhealthy if any critical check fails", () => {
    const results: HealthResult[] = [
      {
        status: "healthy",
        checks: {
          check1: { status: "pass", responseTime: 10, critical: false },
        },
        timestamp: new Date().toISOString(),
        uptime: 1000,
      },
      {
        status: "unhealthy",
        checks: {
          check2: { status: "fail", responseTime: 20, critical: true },
        },
        timestamp: new Date().toISOString(),
        uptime: 2000,
      },
    ];

    const merged = mergeHealthResults(results);
    expect(merged.status).toBe("unhealthy");
  });

  it("returns degraded if non-critical check fails", () => {
    const results: HealthResult[] = [
      {
        status: "healthy",
        checks: {
          check1: { status: "pass", responseTime: 10, critical: false },
        },
        timestamp: new Date().toISOString(),
        uptime: 1000,
      },
      {
        status: "degraded",
        checks: {
          check2: { status: "fail", responseTime: 20, critical: false },
        },
        timestamp: new Date().toISOString(),
        uptime: 2000,
      },
    ];

    const merged = mergeHealthResults(results);
    expect(merged.status).toBe("degraded");
  });
});
