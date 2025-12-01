/**
 * High Availability Manager
 * Phase 12A: Unified HA Orchestration
 */

import { EventEmitter } from "eventemitter3";
import type {
  Region,
  RegionConfig,
  RegionStatus,
  HAManagerConfig,
  HAState,
  HAEvents,
  HealthCheckResult,
  ReplicationStatus,
  FailoverEvent,
} from "./types.js";
import { HealthChecker, createHealthChecker } from "./health-checker.js";
import { LoadBalancer, createLoadBalancer } from "./load-balancer.js";
import { FailoverManager, createFailoverManager } from "./failover-manager.js";

// =============================================================================
// HA MANAGER
// =============================================================================

export class HAManager extends EventEmitter<HAEvents> {
  private config: HAManagerConfig;
  private healthChecker: HealthChecker;
  private loadBalancer: LoadBalancer;
  private failoverManager: FailoverManager;
  private replicationStatus: Map<string, ReplicationStatus> = new Map();
  private metricsInterval: NodeJS.Timeout | null = null;
  private started: boolean = false;

  constructor(config: HAManagerConfig) {
    super();
    this.config = config;

    // Initialize components
    this.healthChecker = createHealthChecker(config.healthCheck);
    this.loadBalancer = createLoadBalancer(config.loadBalancing?.strategy);
    this.failoverManager = createFailoverManager(config.failover);

    if (config.loadBalancing?.stickySession) {
      this.loadBalancer.setSessionAffinity(config.loadBalancing.stickySession);
    }

    // Wire up event handlers
    this.setupEventHandlers();

    // Add configured regions
    for (const regionConfig of config.regions) {
      this.addRegion(regionConfig);
    }
  }

  // ===========================================================================
  // SETUP
  // ===========================================================================

  private setupEventHandlers(): void {
    // Forward health check events
    this.healthChecker.on("health:checked", (results) => {
      this.emit("health:checked", results);

      // Update load balancer with health results
      for (const result of results) {
        this.loadBalancer.updateHealth(result.region, result);
        this.failoverManager.onHealthCheckResult(result.region, result);
      }
    });

    this.healthChecker.on("health:degraded", (region, result) => {
      this.emit("health:degraded", region, result);
      this.updateRegionStatus(region, "degraded");
    });

    this.healthChecker.on("health:recovered", (region, result) => {
      this.emit("health:recovered", region, result);
      this.updateRegionStatus(region, "active");
    });

    // Forward failover events
    this.failoverManager.on("failover:started", (event) => {
      this.emit("failover:started", event);
    });

    this.failoverManager.on("failover:completed", (event) => {
      this.emit("failover:completed", event);
    });

    this.failoverManager.on("failover:failed", (event, error) => {
      this.emit("failover:failed", event, error);
    });

    this.failoverManager.on("region:status_changed", (region, oldStatus, newStatus) => {
      this.emit("region:status_changed", region, oldStatus, newStatus);
    });
  }

  // ===========================================================================
  // REGION MANAGEMENT
  // ===========================================================================

  addRegion(regionConfig: RegionConfig): void {
    this.healthChecker.addRegion(regionConfig);
    this.loadBalancer.addRegion(regionConfig);
    this.failoverManager.addRegion(regionConfig);

    this.emit("region:added", regionConfig);
    console.log(`[HA] Region added: ${regionConfig.region} (${regionConfig.status})`);
  }

  removeRegion(region: Region): void {
    this.healthChecker.removeRegion(region);
    this.loadBalancer.removeRegion(region);
    this.failoverManager.removeRegion(region);

    this.emit("region:removed", region);
    console.log(`[HA] Region removed: ${region}`);
  }

  updateRegionStatus(region: Region, status: RegionStatus): void {
    const regionConfig = this.config.regions.find(r => r.region === region);
    if (regionConfig) {
      const oldStatus = regionConfig.status;
      regionConfig.status = status;
      this.emit("region:status_changed", region, oldStatus, status);
    }
  }

  // ===========================================================================
  // ROUTING
  // ===========================================================================

  route(options?: {
    clientIp?: string;
    sessionId?: string;
    preferredRegion?: Region;
    excludeRegions?: Region[];
  }) {
    return this.loadBalancer.route(options);
  }

  // ===========================================================================
  // FAILOVER
  // ===========================================================================

  async triggerFailover(toRegion: Region, reason?: string): Promise<FailoverEvent | null> {
    return this.failoverManager.manualFailover(toRegion, reason);
  }

  approveFailover(failoverId: string): FailoverEvent | null {
    return this.failoverManager.approveFailover(failoverId);
  }

  rejectFailover(failoverId: string, reason?: string): FailoverEvent | null {
    return this.failoverManager.rejectFailover(failoverId, reason);
  }

  // ===========================================================================
  // REPLICATION STATUS
  // ===========================================================================

  updateReplicationStatus(status: ReplicationStatus): void {
    const key = `${status.sourceRegion}->${status.targetRegion}`;
    this.replicationStatus.set(key, status);

    // Check for replication lag
    const maxLag = this.config.replication?.maxLagMs ?? 5000;
    if (status.lagMs > maxLag) {
      this.emit("replication:lag", status);
      console.warn(`[HA] Replication lag detected: ${status.sourceRegion} -> ${status.targetRegion} (${status.lagMs}ms)`);
    }
  }

  getReplicationStatus(): ReplicationStatus[] {
    return Array.from(this.replicationStatus.values());
  }

  // ===========================================================================
  // LIFECYCLE
  // ===========================================================================

  start(): void {
    if (this.started) {
      console.log("[HA] Manager already started");
      return;
    }

    console.log("[HA] Starting High Availability Manager");
    this.started = true;

    // Start health checks
    this.healthChecker.start();

    // Start metrics collection if enabled
    if (this.config.monitoring?.enabled) {
      this.startMetricsCollection();
    }
  }

  stop(): void {
    if (!this.started) {
      return;
    }

    console.log("[HA] Stopping High Availability Manager");
    this.started = false;

    this.healthChecker.stop();
    this.stopMetricsCollection();
  }

  private startMetricsCollection(): void {
    const interval = this.config.monitoring?.metricsIntervalMs ?? 60000;

    this.metricsInterval = setInterval(() => {
      const state = this.getState();

      // Check alert thresholds
      const thresholds = this.config.monitoring?.alertThresholds;
      if (thresholds) {
        if (state.globalLatencyMs > thresholds.latencyMs) {
          console.warn(`[HA] Alert: Global latency (${state.globalLatencyMs}ms) exceeds threshold (${thresholds.latencyMs}ms)`);
        }
        if (state.globalAvailability < thresholds.availabilityPercent) {
          console.warn(`[HA] Alert: Availability (${state.globalAvailability}%) below threshold (${thresholds.availabilityPercent}%)`);
        }
      }
    }, interval);
  }

  private stopMetricsCollection(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }
  }

  // ===========================================================================
  // STATE
  // ===========================================================================

  getState(): HAState {
    const healthResults = this.healthChecker.getAllResults();
    const regionHealth: Record<Region, HealthCheckResult> = {};

    for (const [region, result] of healthResults) {
      regionHealth[region] = result;
    }

    return {
      primaryRegion: this.failoverManager.getPrimaryRegion() ?? ("us-east-1" as Region),
      activeRegions: this.healthChecker.getHealthyRegions(),
      regionHealth: regionHealth as any,
      replicationStatus: this.getReplicationStatus(),
      lastFailover: this.failoverManager.getFailoverHistory(1)[0],
      failoverCount24h: this.failoverManager.getFailoverCount24h(),
      globalLatencyMs: this.healthChecker.getAverageLatency(),
      globalAvailability: this.healthChecker.getGlobalAvailability(),
      lastUpdated: new Date().toISOString(),
    };
  }

  getConfig(): HAManagerConfig {
    return { ...this.config };
  }

  isStarted(): boolean {
    return this.started;
  }

  // ===========================================================================
  // COMPONENT ACCESS
  // ===========================================================================

  getHealthChecker(): HealthChecker {
    return this.healthChecker;
  }

  getLoadBalancer(): LoadBalancer {
    return this.loadBalancer;
  }

  getFailoverManager(): FailoverManager {
    return this.failoverManager;
  }
}

// =============================================================================
// SINGLETON
// =============================================================================

let haManagerInstance: HAManager | null = null;

export function getHAManager(): HAManager | null {
  return haManagerInstance;
}

export function createHAManager(config: HAManagerConfig): HAManager {
  haManagerInstance = new HAManager(config);
  return haManagerInstance;
}

// =============================================================================
// DEFAULT CONFIGURATION
// =============================================================================

export const DEFAULT_HA_CONFIG: HAManagerConfig = {
  regions: [
    {
      id: "primary",
      region: "us-east-1",
      endpoint: "https://api-us-east.gicm.io",
      status: "active",
      isPrimary: true,
      weight: 100,
    },
    {
      id: "secondary",
      region: "eu-west-1",
      endpoint: "https://api-eu-west.gicm.io",
      status: "standby",
      isPrimary: false,
      weight: 80,
    },
    {
      id: "tertiary",
      region: "ap-northeast-1",
      endpoint: "https://api-ap-northeast.gicm.io",
      status: "standby",
      isPrimary: false,
      weight: 60,
    },
  ],
  healthCheck: {
    type: "http",
    intervalMs: 30000,
    timeoutMs: 5000,
    unhealthyThreshold: 3,
    healthyThreshold: 2,
    path: "/health",
    expectedStatus: 200,
  },
  loadBalancing: {
    strategy: "weighted",
    stickySession: {
      enabled: true,
      ttlMs: 3600000,
      cookieName: "gicm_region",
      strategy: "cookie",
    },
  },
  failover: {
    mode: "automatic",
    triggerThreshold: 3,
    cooldownMs: 300000,
    maxFailoversPerHour: 3,
    notifyOnFailover: true,
    requireApproval: false,
    rollbackOnFailure: true,
  },
  replication: {
    mode: "async",
    targetRegions: ["eu-west-1", "ap-northeast-1"],
    maxLagMs: 5000,
    batchSize: 100,
    retryAttempts: 3,
    conflictResolution: "last-write-wins",
  },
  monitoring: {
    enabled: true,
    metricsIntervalMs: 60000,
    alertThresholds: {
      latencyMs: 500,
      errorRate: 0.05,
      availabilityPercent: 99.9,
    },
  },
};
