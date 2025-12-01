/**
 * Failover Manager
 * Phase 12A: Automatic Region Failover
 */

import { EventEmitter } from "eventemitter3";
import type {
  Region,
  RegionConfig,
  FailoverConfig,
  FailoverEvent,
  HealthCheckResult,
  HAEvents,
} from "./types.js";
import { DEFAULT_FAILOVER_CONFIG } from "./types.js";

// =============================================================================
// FAILOVER MANAGER
// =============================================================================

export class FailoverManager extends EventEmitter<HAEvents> {
  private config: FailoverConfig;
  private regions: Map<Region, RegionConfig> = new Map();
  private primaryRegion: Region | null = null;
  private failoverHistory: FailoverEvent[] = [];
  private lastFailoverTime: number = 0;
  private pendingApprovals: Map<string, FailoverEvent> = new Map();
  private failureCounts: Map<Region, number> = new Map();

  constructor(config: Partial<FailoverConfig> = {}) {
    super();
    this.config = { ...DEFAULT_FAILOVER_CONFIG, ...config };
  }

  // ===========================================================================
  // CONFIGURATION
  // ===========================================================================

  setConfig(config: Partial<FailoverConfig>): void {
    this.config = { ...this.config, ...config };
    console.log("[FAILOVER] Configuration updated");
  }

  addRegion(regionConfig: RegionConfig): void {
    this.regions.set(regionConfig.region, regionConfig);
    this.failureCounts.set(regionConfig.region, 0);

    if (regionConfig.isPrimary) {
      this.primaryRegion = regionConfig.region;
      console.log(`[FAILOVER] Primary region set: ${regionConfig.region}`);
    }
  }

  removeRegion(region: Region): void {
    const config = this.regions.get(region);
    this.regions.delete(region);
    this.failureCounts.delete(region);

    if (config?.isPrimary && this.primaryRegion === region) {
      // Auto-elect new primary
      const candidates = Array.from(this.regions.values())
        .filter(r => r.status === "active" || r.status === "standby")
        .sort((a, b) => b.weight - a.weight);

      if (candidates.length > 0) {
        this.primaryRegion = candidates[0].region;
        candidates[0].isPrimary = true;
        console.log(`[FAILOVER] New primary elected: ${this.primaryRegion}`);
      } else {
        this.primaryRegion = null;
        console.warn("[FAILOVER] No eligible primary region available");
      }
    }
  }

  // ===========================================================================
  // HEALTH MONITORING
  // ===========================================================================

  onHealthCheckResult(region: Region, result: HealthCheckResult): void {
    if (result.healthy) {
      // Reset failure count
      this.failureCounts.set(region, 0);
    } else {
      // Increment failure count
      const current = this.failureCounts.get(region) ?? 0;
      const newCount = current + 1;
      this.failureCounts.set(region, newCount);

      console.log(`[FAILOVER] ${region} failure count: ${newCount}/${this.config.triggerThreshold}`);

      // Check if failover should be triggered
      if (newCount >= this.config.triggerThreshold && region === this.primaryRegion) {
        this.evaluateFailover(region, "health-check");
      }
    }
  }

  // ===========================================================================
  // FAILOVER EXECUTION
  // ===========================================================================

  async evaluateFailover(
    fromRegion: Region,
    triggeredBy: FailoverEvent["triggeredBy"]
  ): Promise<FailoverEvent | null> {
    // Check cooldown
    const now = Date.now();
    if (now - this.lastFailoverTime < this.config.cooldownMs) {
      console.log(`[FAILOVER] Cooldown active, skipping failover evaluation`);
      return null;
    }

    // Check max failovers per hour
    const recentFailovers = this.failoverHistory.filter(
      f => now - new Date(f.startedAt).getTime() < 3600000
    );
    if (recentFailovers.length >= this.config.maxFailoversPerHour) {
      console.warn(`[FAILOVER] Max failovers per hour (${this.config.maxFailoversPerHour}) reached`);
      return null;
    }

    // Find target region
    const targetRegion = this.selectFailoverTarget(fromRegion);
    if (!targetRegion) {
      console.error("[FAILOVER] No eligible failover target found");
      return null;
    }

    // Create failover event
    const event: FailoverEvent = {
      id: `fo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      fromRegion,
      toRegion: targetRegion,
      reason: `${triggeredBy}: Region ${fromRegion} became unhealthy`,
      triggeredBy,
      startedAt: new Date().toISOString(),
      status: "in-progress",
      affectedPipelines: 0,
    };

    // Check if approval required
    if (this.config.requireApproval && this.config.mode !== "automatic") {
      event.status = "in-progress";
      this.pendingApprovals.set(event.id, event);
      console.log(`[FAILOVER] Awaiting approval for failover: ${event.id}`);

      if (this.config.notifyOnFailover) {
        this.emit("failover:started", event);
      }

      return event;
    }

    // Execute failover
    return this.executeFailover(event);
  }

  async executeFailover(event: FailoverEvent): Promise<FailoverEvent> {
    console.log(`[FAILOVER] Executing failover: ${event.fromRegion} -> ${event.toRegion}`);

    this.emit("failover:started", event);

    try {
      // Update region statuses
      const fromConfig = this.regions.get(event.fromRegion);
      const toConfig = this.regions.get(event.toRegion);

      if (fromConfig) {
        fromConfig.status = "standby";
        fromConfig.isPrimary = false;
      }

      if (toConfig) {
        toConfig.status = "active";
        toConfig.isPrimary = true;
        this.primaryRegion = event.toRegion;
      }

      // Update region status events
      if (fromConfig) {
        this.emit("region:status_changed", event.fromRegion, "active", "standby");
      }
      if (toConfig) {
        this.emit("region:status_changed", event.toRegion, toConfig.status, "active");
      }

      // Mark as completed
      event.status = "completed";
      event.completedAt = new Date().toISOString();

      // Update tracking
      this.lastFailoverTime = Date.now();
      this.failoverHistory.push(event);
      this.pendingApprovals.delete(event.id);

      console.log(`[FAILOVER] Completed: ${event.toRegion} is now primary`);
      this.emit("failover:completed", event);

      return event;
    } catch (error) {
      event.status = "failed";
      event.completedAt = new Date().toISOString();

      console.error("[FAILOVER] Failed:", error);

      // Attempt rollback if configured
      if (this.config.rollbackOnFailure) {
        await this.rollbackFailover(event);
      }

      this.emit("failover:failed", event, error instanceof Error ? error : new Error(String(error)));
      return event;
    }
  }

  async rollbackFailover(event: FailoverEvent): Promise<void> {
    console.log(`[FAILOVER] Rolling back failover ${event.id}`);

    const fromConfig = this.regions.get(event.fromRegion);
    const toConfig = this.regions.get(event.toRegion);

    // Restore original state
    if (fromConfig) {
      fromConfig.status = "active";
      fromConfig.isPrimary = true;
      this.primaryRegion = event.fromRegion;
    }

    if (toConfig) {
      toConfig.status = "standby";
      toConfig.isPrimary = false;
    }

    event.status = "rolled-back";
    event.completedAt = new Date().toISOString();

    console.log(`[FAILOVER] Rollback completed, ${event.fromRegion} restored as primary`);
  }

  // ===========================================================================
  // APPROVAL WORKFLOW
  // ===========================================================================

  approveFailover(failoverId: string): FailoverEvent | null {
    const event = this.pendingApprovals.get(failoverId);
    if (!event) {
      console.warn(`[FAILOVER] Approval not found: ${failoverId}`);
      return null;
    }

    // Execute the failover
    this.executeFailover(event).catch(err => {
      console.error("[FAILOVER] Approved failover execution failed:", err);
    });

    return event;
  }

  rejectFailover(failoverId: string, reason?: string): FailoverEvent | null {
    const event = this.pendingApprovals.get(failoverId);
    if (!event) {
      console.warn(`[FAILOVER] Approval not found: ${failoverId}`);
      return null;
    }

    event.status = "failed";
    event.completedAt = new Date().toISOString();
    event.metadata = { ...event.metadata, rejectionReason: reason };

    this.pendingApprovals.delete(failoverId);
    this.failoverHistory.push(event);

    console.log(`[FAILOVER] Rejected: ${failoverId}. Reason: ${reason || "No reason provided"}`);

    return event;
  }

  // ===========================================================================
  // MANUAL FAILOVER
  // ===========================================================================

  async manualFailover(toRegion: Region, reason?: string): Promise<FailoverEvent | null> {
    if (!this.primaryRegion) {
      console.error("[FAILOVER] No primary region to failover from");
      return null;
    }

    if (toRegion === this.primaryRegion) {
      console.warn("[FAILOVER] Target region is already primary");
      return null;
    }

    const targetConfig = this.regions.get(toRegion);
    if (!targetConfig) {
      console.error(`[FAILOVER] Target region not configured: ${toRegion}`);
      return null;
    }

    const event: FailoverEvent = {
      id: `fo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      fromRegion: this.primaryRegion,
      toRegion,
      reason: reason || "Manual failover",
      triggeredBy: "manual",
      startedAt: new Date().toISOString(),
      status: "in-progress",
      affectedPipelines: 0,
    };

    return this.executeFailover(event);
  }

  // ===========================================================================
  // TARGET SELECTION
  // ===========================================================================

  private selectFailoverTarget(excludeRegion: Region): Region | null {
    const candidates = Array.from(this.regions.values())
      .filter(r => {
        if (r.region === excludeRegion) return false;
        if (r.status === "offline" || r.status === "draining") return false;
        // Don't select regions that are also failing
        const failures = this.failureCounts.get(r.region) ?? 0;
        if (failures >= this.config.triggerThreshold) return false;
        return true;
      })
      .sort((a, b) => b.weight - a.weight);

    return candidates[0]?.region ?? null;
  }

  // ===========================================================================
  // GETTERS
  // ===========================================================================

  getPrimaryRegion(): Region | null {
    return this.primaryRegion;
  }

  getFailoverHistory(limit: number = 10): FailoverEvent[] {
    return this.failoverHistory.slice(-limit);
  }

  getPendingApprovals(): FailoverEvent[] {
    return Array.from(this.pendingApprovals.values());
  }

  getFailoverCount24h(): number {
    const now = Date.now();
    return this.failoverHistory.filter(
      f => now - new Date(f.startedAt).getTime() < 86400000
    ).length;
  }

  getConfig(): FailoverConfig {
    return { ...this.config };
  }

  getStats(): {
    primaryRegion: Region | null;
    failoverCount24h: number;
    lastFailover: FailoverEvent | null;
    pendingApprovals: number;
    cooldownActive: boolean;
    cooldownRemainingMs: number;
  } {
    const now = Date.now();
    const cooldownRemaining = Math.max(0, this.config.cooldownMs - (now - this.lastFailoverTime));

    return {
      primaryRegion: this.primaryRegion,
      failoverCount24h: this.getFailoverCount24h(),
      lastFailover: this.failoverHistory[this.failoverHistory.length - 1] ?? null,
      pendingApprovals: this.pendingApprovals.size,
      cooldownActive: cooldownRemaining > 0,
      cooldownRemainingMs: cooldownRemaining,
    };
  }
}

// =============================================================================
// SINGLETON
// =============================================================================

let failoverManagerInstance: FailoverManager | null = null;

export function getFailoverManager(): FailoverManager {
  if (!failoverManagerInstance) {
    failoverManagerInstance = new FailoverManager();
  }
  return failoverManagerInstance;
}

export function createFailoverManager(config?: Partial<FailoverConfig>): FailoverManager {
  failoverManagerInstance = new FailoverManager(config);
  return failoverManagerInstance;
}
