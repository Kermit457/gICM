/**
 * Multi-Region Manager Implementation
 * Phase 15C: Multi-Region Support
 */

import { EventEmitter } from "eventemitter3";
import { randomUUID } from "crypto";
import {
  RegionId,
  RegionStatus,
  RegionRole,
  RegionDefinition,
  RegionDefinitionSchema,
  ReplicationConfig,
  ReplicationStatus,
  Conflict,
  ConflictResolution,
  RoutingStrategy,
  RoutingRule,
  RoutingDecision,
  SyncOperation,
  SyncBatch,
  RegionHealth,
  FailoverTrigger,
  FailoverEvent,
  MultiRegionConfig,
  MultiRegionConfigSchema,
  MultiRegionEvents,
  MultiRegionStorage,
  REPLICATION_LAG_THRESHOLDS,
} from "./types.js";

// =============================================================================
// In-Memory Storage
// =============================================================================

class InMemoryMultiRegionStorage implements MultiRegionStorage {
  private regions = new Map<RegionId, RegionDefinition>();
  private replicationStatus = new Map<string, ReplicationStatus>();
  private conflicts = new Map<string, Conflict>();
  private syncQueue = new Map<RegionId, SyncOperation[]>();
  private failoverHistory: FailoverEvent[] = [];
  private healthData = new Map<RegionId, RegionHealth>();

  private getReplicationKey(source: RegionId, target: RegionId): string {
    return `${source}:${target}`;
  }

  async getRegion(id: RegionId): Promise<RegionDefinition | null> {
    return this.regions.get(id) ?? null;
  }

  async saveRegion(region: RegionDefinition): Promise<void> {
    this.regions.set(region.id, region);
  }

  async deleteRegion(id: RegionId): Promise<void> {
    this.regions.delete(id);
  }

  async listRegions(): Promise<RegionDefinition[]> {
    return Array.from(this.regions.values());
  }

  async getReplicationStatus(sourceRegion: RegionId, targetRegion: RegionId): Promise<ReplicationStatus | null> {
    return this.replicationStatus.get(this.getReplicationKey(sourceRegion, targetRegion)) ?? null;
  }

  async saveReplicationStatus(status: ReplicationStatus): Promise<void> {
    this.replicationStatus.set(this.getReplicationKey(status.sourceRegion, status.targetRegion), status);
  }

  async saveConflict(conflict: Conflict): Promise<void> {
    this.conflicts.set(conflict.id, conflict);
  }

  async getConflict(id: string): Promise<Conflict | null> {
    return this.conflicts.get(id) ?? null;
  }

  async listConflicts(filters?: { resolved?: boolean }): Promise<Conflict[]> {
    let results = Array.from(this.conflicts.values());
    if (filters?.resolved !== undefined) {
      results = results.filter(c => (c.resolvedAt !== undefined) === filters.resolved);
    }
    return results;
  }

  async enqueueSyncOperation(operation: SyncOperation): Promise<void> {
    // Enqueue for all target regions except source
    for (const region of this.regions.values()) {
      if (region.id === operation.sourceRegion) continue;
      const queue = this.syncQueue.get(region.id) ?? [];
      queue.push(operation);
      this.syncQueue.set(region.id, queue);
    }
  }

  async dequeueSyncOperations(targetRegion: RegionId, limit: number): Promise<SyncOperation[]> {
    const queue = this.syncQueue.get(targetRegion) ?? [];
    const ops = queue.splice(0, limit);
    this.syncQueue.set(targetRegion, queue);
    return ops;
  }

  async ackSyncOperations(ids: string[]): Promise<void> {
    // In memory, operations are removed on dequeue
  }

  async saveFailoverEvent(event: FailoverEvent): Promise<void> {
    this.failoverHistory.unshift(event);
    if (this.failoverHistory.length > 100) {
      this.failoverHistory.pop();
    }
  }

  async getFailoverHistory(limit = 50): Promise<FailoverEvent[]> {
    return this.failoverHistory.slice(0, limit);
  }

  async saveRegionHealth(health: RegionHealth): Promise<void> {
    this.healthData.set(health.regionId, health);
  }

  async getRegionHealth(regionId: RegionId): Promise<RegionHealth | null> {
    return this.healthData.get(regionId) ?? null;
  }
}

// =============================================================================
// Multi-Region Manager
// =============================================================================

export class MultiRegionManager extends EventEmitter<MultiRegionEvents> {
  private config: MultiRegionConfig;
  private storage: MultiRegionStorage;
  private healthCheckInterval?: NodeJS.Timeout;
  private syncInterval?: NodeJS.Timeout;
  private failedHealthChecks = new Map<RegionId, number>();
  private running = false;

  constructor(config: Partial<MultiRegionConfig> & { currentRegion: RegionId; regions: RegionDefinition[] }) {
    super();
    this.config = MultiRegionConfigSchema.parse(config);
    this.storage = new InMemoryMultiRegionStorage();

    // Initialize regions
    for (const region of this.config.regions) {
      this.storage.saveRegion(region);
    }
  }

  // ---------------------------------------------------------------------------
  // Configuration
  // ---------------------------------------------------------------------------

  setStorage(storage: MultiRegionStorage): void {
    this.storage = storage;
  }

  getCurrentRegion(): RegionId {
    return this.config.currentRegion;
  }

  // ---------------------------------------------------------------------------
  // Region Management
  // ---------------------------------------------------------------------------

  async addRegion(region: Omit<RegionDefinition, "createdAt" | "updatedAt">): Promise<RegionDefinition> {
    const now = Date.now();
    const fullRegion = RegionDefinitionSchema.parse({
      ...region,
      createdAt: now,
      updatedAt: now,
    });

    await this.storage.saveRegion(fullRegion);
    this.emit("regionAdded", fullRegion);
    return fullRegion;
  }

  async getRegion(id: RegionId): Promise<RegionDefinition | null> {
    return this.storage.getRegion(id);
  }

  async updateRegion(id: RegionId, updates: Partial<RegionDefinition>): Promise<RegionDefinition | null> {
    const existing = await this.storage.getRegion(id);
    if (!existing) return null;

    const previousStatus = existing.status;
    const previousRole = existing.role;

    const updated = RegionDefinitionSchema.parse({
      ...existing,
      ...updates,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: Date.now(),
    });

    await this.storage.saveRegion(updated);

    if (updates.status && updates.status !== previousStatus) {
      this.emit("regionStatusChanged", id, updates.status, previousStatus);
    }

    if (updates.role && updates.role !== previousRole) {
      this.emit("regionRoleChanged", id, updates.role, previousRole);
    }

    return updated;
  }

  async removeRegion(id: RegionId): Promise<boolean> {
    const existing = await this.storage.getRegion(id);
    if (!existing) return false;

    // Don't allow removing current region
    if (id === this.config.currentRegion) {
      throw new Error("Cannot remove current region");
    }

    await this.storage.deleteRegion(id);
    this.emit("regionRemoved", id);
    return true;
  }

  async listRegions(): Promise<RegionDefinition[]> {
    return this.storage.listRegions();
  }

  async getActiveRegions(): Promise<RegionDefinition[]> {
    const regions = await this.storage.listRegions();
    return regions.filter(r => r.status === "active" || r.status === "degraded");
  }

  async getPrimaryRegion(): Promise<RegionDefinition | null> {
    const regions = await this.storage.listRegions();
    return regions.find(r => r.role === "primary") ?? null;
  }

  // ---------------------------------------------------------------------------
  // Routing
  // ---------------------------------------------------------------------------

  async routeRequest(context: {
    path?: string;
    headers?: Record<string, string>;
    geo?: { country?: string; region?: string; city?: string };
    clientLatencies?: Record<RegionId, number>;
  }): Promise<RoutingDecision> {
    const requestId = randomUUID();
    const startTime = Date.now();

    const strategy = this.config.routing?.strategy ?? "latency";
    const rules = this.config.routing?.rules ?? [];
    const activeRegions = await this.getActiveRegions();

    if (activeRegions.length === 0) {
      throw new Error("No active regions available");
    }

    let targetRegion: RegionId | undefined;
    let matchedRuleId: string | undefined;

    // Check routing rules first
    for (const rule of rules.filter(r => r.enabled).sort((a, b) => b.priority - a.priority)) {
      if (this.matchesRoutingRule(rule, context)) {
        if (rule.action.type === "route" && rule.action.regions?.length) {
          targetRegion = rule.action.regions.find(r => activeRegions.some(ar => ar.id === r));
          matchedRuleId = rule.id;
          break;
        }
      }
    }

    // Fall back to strategy if no rule matched
    if (!targetRegion) {
      targetRegion = await this.selectRegionByStrategy(strategy, activeRegions, context);
    }

    const decision: RoutingDecision = {
      requestId,
      timestamp: startTime,
      sourceRegion: context.geo?.region as RegionId | undefined,
      targetRegion: targetRegion ?? activeRegions[0].id,
      strategy,
      ruleId: matchedRuleId,
      latencyMs: Date.now() - startTime,
    };

    this.emit("routingDecision", decision);
    return decision;
  }

  private matchesRoutingRule(
    rule: RoutingRule,
    context: { path?: string; headers?: Record<string, string>; geo?: { country?: string; region?: string; city?: string } }
  ): boolean {
    if (rule.conditions.length === 0) return true;

    return rule.conditions.every(cond => {
      let value: unknown;

      switch (cond.type) {
        case "geo":
          value = context.geo?.[cond.field as keyof typeof context.geo];
          break;
        case "header":
          value = context.headers?.[cond.field];
          break;
        case "path":
          value = context.path;
          break;
        default:
          return false;
      }

      switch (cond.operator) {
        case "eq":
          return value === cond.value;
        case "neq":
          return value !== cond.value;
        case "contains":
          return typeof value === "string" && typeof cond.value === "string" && value.includes(cond.value);
        case "starts_with":
          return typeof value === "string" && typeof cond.value === "string" && value.startsWith(cond.value);
        case "in":
          return Array.isArray(cond.value) && cond.value.includes(value);
        default:
          return false;
      }
    });
  }

  private async selectRegionByStrategy(
    strategy: RoutingStrategy,
    regions: RegionDefinition[],
    context: { clientLatencies?: Record<RegionId, number>; geo?: { country?: string; region?: string } }
  ): Promise<RegionId> {
    switch (strategy) {
      case "latency":
        if (context.clientLatencies) {
          const sorted = regions.sort((a, b) => {
            const latA = context.clientLatencies![a.id] ?? Infinity;
            const latB = context.clientLatencies![b.id] ?? Infinity;
            return latA - latB;
          });
          return sorted[0].id;
        }
        // Fall through to geo if no latencies

      case "geo":
        if (context.geo?.country) {
          const sameCountry = regions.find(r => r.location.country === context.geo!.country);
          if (sameCountry) return sameCountry.id;
        }
        // Fall through to failover

      case "failover":
        const primary = regions.find(r => r.role === "primary" && r.status === "active");
        if (primary) return primary.id;
        const secondary = regions.find(r => r.status === "active");
        return secondary?.id ?? regions[0].id;

      case "round_robin":
        const idx = Math.floor(Math.random() * regions.length);
        return regions[idx].id;

      case "weighted":
        const weights = this.config.routing?.weights ?? {};
        const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
        if (totalWeight === 0) return regions[0].id;

        let random = Math.random() * totalWeight;
        for (const region of regions) {
          random -= weights[region.id] ?? 0;
          if (random <= 0) return region.id;
        }
        return regions[0].id;

      default:
        return regions[0].id;
    }
  }

  // ---------------------------------------------------------------------------
  // Replication
  // ---------------------------------------------------------------------------

  async enqueueReplication(operation: Omit<SyncOperation, "id" | "timestamp" | "sourceRegion">): Promise<void> {
    const fullOp: SyncOperation = {
      ...operation,
      id: randomUUID(),
      timestamp: Date.now(),
      sourceRegion: this.config.currentRegion,
    };

    await this.storage.enqueueSyncOperation(fullOp);
  }

  async getReplicationStatus(targetRegion: RegionId): Promise<ReplicationStatus | null> {
    return this.storage.getReplicationStatus(this.config.currentRegion, targetRegion);
  }

  async getAllReplicationStatus(): Promise<ReplicationStatus[]> {
    const regions = await this.storage.listRegions();
    const statuses: ReplicationStatus[] = [];

    for (const region of regions) {
      if (region.id === this.config.currentRegion) continue;
      const status = await this.storage.getReplicationStatus(this.config.currentRegion, region.id);
      if (status) {
        statuses.push(status);
      }
    }

    return statuses;
  }

  private async processSyncQueue(): Promise<void> {
    const regions = await this.storage.listRegions();

    for (const region of regions) {
      if (region.id === this.config.currentRegion) continue;
      if (region.status !== "active" && region.status !== "degraded") continue;

      const batchSize = this.config.sync?.batchSize ?? 100;
      const operations = await this.storage.dequeueSyncOperations(region.id, batchSize);

      if (operations.length === 0) continue;

      const batch: SyncBatch = {
        id: randomUUID(),
        sourceRegion: this.config.currentRegion,
        targetRegion: region.id,
        operations,
        createdAt: Date.now(),
        status: "pending",
      };

      // In real implementation, send to target region
      // For now, just emit event
      batch.status = "sent";
      batch.sentAt = Date.now();
      this.emit("syncBatchSent", batch);

      // Simulate ack
      batch.status = "acked";
      batch.ackedAt = Date.now();
      this.emit("syncBatchAcked", batch.id);

      // Update replication status
      const status: ReplicationStatus = {
        sourceRegion: this.config.currentRegion,
        targetRegion: region.id,
        status: "active",
        lagMs: Date.now() - operations[operations.length - 1].timestamp,
        lastSyncedAt: Date.now(),
        pendingOperations: 0,
        bytesReplicated: JSON.stringify(operations).length,
        errors: [],
      };

      await this.storage.saveReplicationStatus(status);

      // Check lag thresholds
      if (status.lagMs > REPLICATION_LAG_THRESHOLDS.critical) {
        this.emit("replicationLagWarning", region.id, status.lagMs);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Conflict Resolution
  // ---------------------------------------------------------------------------

  async detectConflict(
    collection: string,
    documentId: string,
    sourceVersion: unknown,
    targetVersion: unknown,
    targetRegion: RegionId
  ): Promise<Conflict> {
    const conflict: Conflict = {
      id: randomUUID(),
      timestamp: Date.now(),
      collection,
      documentId,
      sourceRegion: this.config.currentRegion,
      targetRegion,
      sourceVersion,
      targetVersion,
    };

    await this.storage.saveConflict(conflict);
    this.emit("conflictDetected", conflict);
    return conflict;
  }

  async resolveConflict(
    conflictId: string,
    resolution: ConflictResolution,
    resolvedValue: unknown,
    resolvedBy?: string
  ): Promise<Conflict | null> {
    const conflict = await this.storage.getConflict(conflictId);
    if (!conflict) return null;

    const resolved: Conflict = {
      ...conflict,
      resolution,
      resolvedAt: Date.now(),
      resolvedBy,
      resolvedValue,
    };

    await this.storage.saveConflict(resolved);
    this.emit("conflictResolved", resolved);
    return resolved;
  }

  async listConflicts(resolved?: boolean): Promise<Conflict[]> {
    return this.storage.listConflicts({ resolved });
  }

  // ---------------------------------------------------------------------------
  // Failover
  // ---------------------------------------------------------------------------

  async initiateFailover(
    fromRegion: RegionId,
    toRegion: RegionId,
    trigger: FailoverTrigger,
    reason: string,
    initiatedBy?: string
  ): Promise<FailoverEvent> {
    const event: FailoverEvent = {
      id: randomUUID(),
      timestamp: Date.now(),
      trigger,
      fromRegion,
      toRegion,
      reason,
      status: "initiated",
      initiatedBy,
    };

    await this.storage.saveFailoverEvent(event);
    this.emit("failoverInitiated", event);

    try {
      // Update region roles
      await this.updateRegion(fromRegion, { role: "standby", status: "draining" });
      await this.updateRegion(toRegion, { role: "primary", status: "active" });

      event.status = "completed";
      event.duration = Date.now() - event.timestamp;
      await this.storage.saveFailoverEvent(event);
      this.emit("failoverCompleted", event);
    } catch (error) {
      event.status = "failed";
      await this.storage.saveFailoverEvent(event);
      this.emit("failoverFailed", event, error instanceof Error ? error : new Error(String(error)));
      throw error;
    }

    return event;
  }

  async getFailoverHistory(limit?: number): Promise<FailoverEvent[]> {
    return this.storage.getFailoverHistory(limit);
  }

  // ---------------------------------------------------------------------------
  // Health Checks
  // ---------------------------------------------------------------------------

  async checkRegionHealth(regionId: RegionId): Promise<RegionHealth> {
    const region = await this.storage.getRegion(regionId);
    if (!region) {
      throw new Error(`Region not found: ${regionId}`);
    }

    // In real implementation, ping the region endpoints
    // For now, generate simulated health data
    const health: RegionHealth = {
      regionId,
      timestamp: Date.now(),
      status: region.status,
      latencyMs: Math.random() * 100 + 10, // 10-110ms
      errorRate: Math.random() * 0.01, // 0-1%
      availability: 99.9 + Math.random() * 0.1, // 99.9-100%
      cpuUsage: Math.random() * 50 + 20, // 20-70%
      memoryUsage: Math.random() * 40 + 30, // 30-70%
      activeConnections: Math.floor(Math.random() * 1000),
    };

    await this.storage.saveRegionHealth(health);
    this.emit("healthCheck", health);

    return health;
  }

  async getRegionHealth(regionId: RegionId): Promise<RegionHealth | null> {
    return this.storage.getRegionHealth(regionId);
  }

  private async runHealthChecks(): Promise<void> {
    const regions = await this.storage.listRegions();

    for (const region of regions) {
      try {
        const health = await this.checkRegionHealth(region.id);

        // Check if region is unhealthy
        const isUnhealthy = health.errorRate > 0.05 || health.availability < 99;

        if (isUnhealthy) {
          const failCount = (this.failedHealthChecks.get(region.id) ?? 0) + 1;
          this.failedHealthChecks.set(region.id, failCount);

          if (failCount >= (this.config.failover?.failoverThreshold ?? 3)) {
            this.emit("regionUnhealthy", region.id, health);

            // Auto-failover if enabled
            if (this.config.failover?.enabled && region.role === "primary") {
              const standby = regions.find(r => r.role === "standby" && r.status === "active");
              if (standby) {
                await this.initiateFailover(
                  region.id,
                  standby.id,
                  "health_check",
                  `Region ${region.id} failed ${failCount} consecutive health checks`
                );
              }
            }
          }
        } else {
          const prevFailCount = this.failedHealthChecks.get(region.id) ?? 0;
          if (prevFailCount > 0) {
            this.failedHealthChecks.set(region.id, 0);
            this.emit("regionRecovered", region.id);
          }
        }
      } catch (error) {
        this.emit("error", error instanceof Error ? error : new Error(String(error)));
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  async start(): Promise<void> {
    if (this.running) return;
    this.running = true;

    // Start health checks
    if (this.config.failover?.enabled) {
      const interval = (this.config.failover.healthCheckIntervalSeconds ?? 10) * 1000;
      this.healthCheckInterval = setInterval(() => {
        this.runHealthChecks().catch(err => this.emit("error", err));
      }, interval);
    }

    // Start sync processing
    if (this.config.sync?.enabled) {
      const interval = this.config.sync.flushIntervalMs ?? 100;
      this.syncInterval = setInterval(() => {
        this.processSyncQueue().catch(err => this.emit("error", err));
      }, interval);
    }
  }

  async stop(): Promise<void> {
    this.running = false;

    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
    }

    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = undefined;
    }
  }

  isRunning(): boolean {
    return this.running;
  }
}

// =============================================================================
// Factory Functions
// =============================================================================

let defaultManager: MultiRegionManager | null = null;

export function getMultiRegionManager(): MultiRegionManager {
  if (!defaultManager) {
    throw new Error("MultiRegionManager not initialized. Call createMultiRegionManager first.");
  }
  return defaultManager;
}

export function createMultiRegionManager(
  config: Partial<MultiRegionConfig> & { currentRegion: RegionId; regions: RegionDefinition[] }
): MultiRegionManager {
  defaultManager = new MultiRegionManager(config);
  return defaultManager;
}
