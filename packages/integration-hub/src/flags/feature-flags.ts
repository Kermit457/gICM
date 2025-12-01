/**
 * Feature Flags Manager Implementation
 * Phase 15A: Feature Flags & Progressive Rollouts
 */

import { EventEmitter } from "eventemitter3";
import { createHash } from "crypto";
import { randomUUID } from "crypto";
import {
  FlagDefinition,
  FlagDefinitionSchema,
  FlagStatus,
  FlagVariation,
  TargetingRule,
  TargetingCondition,
  Operator,
  Segment,
  SegmentSchema,
  PercentageRollout,
  ScheduledChange,
  EvaluationContext,
  EvaluationContextSchema,
  EvaluationResult,
  EvaluationReason,
  FlagEvaluationEvent,
  FlagStats,
  FlagManagerConfig,
  FlagManagerConfigSchema,
  FlagEvents,
  FlagStorage,
  FlagProvider,
} from "./types.js";

// =============================================================================
// In-Memory Storage
// =============================================================================

class InMemoryFlagStorage implements FlagStorage {
  private flags = new Map<string, FlagDefinition>();
  private segments = new Map<string, Segment>();
  private events = new Map<string, FlagEvaluationEvent[]>();
  private stats = new Map<string, FlagStats>();

  async getFlag(key: string): Promise<FlagDefinition | null> {
    return this.flags.get(key) ?? null;
  }

  async saveFlag(flag: FlagDefinition): Promise<void> {
    this.flags.set(flag.key, flag);
  }

  async deleteFlag(key: string): Promise<void> {
    this.flags.delete(key);
    this.events.delete(key);
    this.stats.delete(key);
  }

  async listFlags(filters?: {
    status?: FlagStatus;
    environment?: string;
    project?: string;
    tags?: string[];
  }): Promise<FlagDefinition[]> {
    let results = Array.from(this.flags.values());

    if (filters) {
      if (filters.status) {
        results = results.filter(f => f.status === filters.status);
      }
      if (filters.environment) {
        results = results.filter(f => f.environment === filters.environment);
      }
      if (filters.project) {
        results = results.filter(f => f.project === filters.project);
      }
      if (filters.tags && filters.tags.length > 0) {
        results = results.filter(f => filters.tags!.some(t => f.tags.includes(t)));
      }
    }

    return results;
  }

  async getSegment(id: string): Promise<Segment | null> {
    return this.segments.get(id) ?? null;
  }

  async saveSegment(segment: Segment): Promise<void> {
    this.segments.set(segment.id, segment);
  }

  async deleteSegment(id: string): Promise<void> {
    this.segments.delete(id);
  }

  async listSegments(): Promise<Segment[]> {
    return Array.from(this.segments.values());
  }

  async saveEvaluationEvent(event: FlagEvaluationEvent): Promise<void> {
    const events = this.events.get(event.flagKey) ?? [];
    events.push(event);
    // Keep only last 1000 events per flag
    if (events.length > 1000) {
      events.shift();
    }
    this.events.set(event.flagKey, events);

    // Update stats
    await this.updateStats(event);
  }

  private async updateStats(event: FlagEvaluationEvent): Promise<void> {
    const existing = this.stats.get(event.flagKey) ?? {
      flagKey: event.flagKey,
      totalEvaluations: 0,
      uniqueUsers: 0,
      variationCounts: {},
      reasonCounts: {},
      avgEvaluationTime: 0,
    };

    existing.totalEvaluations++;
    existing.variationCounts[event.variationId] = (existing.variationCounts[event.variationId] ?? 0) + 1;
    existing.reasonCounts[event.reason] = (existing.reasonCounts[event.reason] ?? 0) + 1;
    existing.avgEvaluationTime =
      (existing.avgEvaluationTime * (existing.totalEvaluations - 1) + event.evaluationTime) /
      existing.totalEvaluations;
    existing.lastEvaluatedAt = event.timestamp;

    this.stats.set(event.flagKey, existing);
  }

  async getEvaluationEvents(flagKey: string, startTime: number, endTime: number): Promise<FlagEvaluationEvent[]> {
    const events = this.events.get(flagKey) ?? [];
    return events.filter(e => e.timestamp >= startTime && e.timestamp <= endTime);
  }

  async getStats(flagKey: string): Promise<FlagStats | null> {
    return this.stats.get(flagKey) ?? null;
  }
}

// =============================================================================
// Condition Evaluator
// =============================================================================

function evaluateCondition(condition: TargetingCondition, context: EvaluationContext): boolean {
  const { attribute, operator, value, negate } = condition;

  // Get attribute value from context
  let attrValue: unknown;
  if (attribute in context) {
    attrValue = (context as Record<string, unknown>)[attribute];
  } else if (context.custom && attribute in context.custom) {
    attrValue = context.custom[attribute];
  } else {
    attrValue = undefined;
  }

  let result: boolean;

  switch (operator) {
    case "eq":
      result = attrValue === value;
      break;
    case "neq":
      result = attrValue !== value;
      break;
    case "gt":
      result = typeof attrValue === "number" && typeof value === "number" && attrValue > value;
      break;
    case "gte":
      result = typeof attrValue === "number" && typeof value === "number" && attrValue >= value;
      break;
    case "lt":
      result = typeof attrValue === "number" && typeof value === "number" && attrValue < value;
      break;
    case "lte":
      result = typeof attrValue === "number" && typeof value === "number" && attrValue <= value;
      break;
    case "contains":
      result = typeof attrValue === "string" && typeof value === "string" && attrValue.includes(value);
      break;
    case "not_contains":
      result = typeof attrValue === "string" && typeof value === "string" && !attrValue.includes(value);
      break;
    case "starts_with":
      result = typeof attrValue === "string" && typeof value === "string" && attrValue.startsWith(value);
      break;
    case "ends_with":
      result = typeof attrValue === "string" && typeof value === "string" && attrValue.endsWith(value);
      break;
    case "matches":
      try {
        result = typeof attrValue === "string" && typeof value === "string" && new RegExp(value).test(attrValue);
      } catch {
        result = false;
      }
      break;
    case "in":
      result = Array.isArray(value) && value.includes(attrValue);
      break;
    case "not_in":
      result = Array.isArray(value) && !value.includes(attrValue);
      break;
    case "semver_eq":
    case "semver_gt":
    case "semver_lt":
      result = compareSemver(String(attrValue), String(value), operator);
      break;
    default:
      result = false;
  }

  return negate ? !result : result;
}

function compareSemver(a: string, b: string, op: "semver_eq" | "semver_gt" | "semver_lt"): boolean {
  const parseVersion = (v: string): number[] => {
    return v.split(".").map(n => parseInt(n, 10) || 0);
  };

  const va = parseVersion(a);
  const vb = parseVersion(b);
  const maxLen = Math.max(va.length, vb.length);

  for (let i = 0; i < maxLen; i++) {
    const ai = va[i] ?? 0;
    const bi = vb[i] ?? 0;
    if (ai !== bi) {
      switch (op) {
        case "semver_eq":
          return false;
        case "semver_gt":
          return ai > bi;
        case "semver_lt":
          return ai < bi;
      }
    }
  }

  return op === "semver_eq";
}

function evaluateConditions(
  conditions: TargetingCondition[],
  logic: "and" | "or",
  context: EvaluationContext
): boolean {
  if (logic === "and") {
    return conditions.every(c => evaluateCondition(c, context));
  } else {
    return conditions.some(c => evaluateCondition(c, context));
  }
}

// =============================================================================
// Bucketing
// =============================================================================

function hashString(str: string, seed?: string): number {
  const hash = createHash("sha256");
  hash.update(seed ? `${seed}:${str}` : str);
  const digest = hash.digest("hex");
  // Convert first 8 hex chars to a number between 0-100
  const num = parseInt(digest.slice(0, 8), 16);
  return (num % 10000) / 100;
}

function getBucket(context: EvaluationContext, bucketBy: string, seed?: string): number {
  let bucketValue: string;

  if (bucketBy in context) {
    bucketValue = String((context as Record<string, unknown>)[bucketBy] ?? "");
  } else if (context.custom && bucketBy in context.custom) {
    bucketValue = String(context.custom[bucketBy] ?? "");
  } else {
    bucketValue = context.userId ?? context.requestId ?? randomUUID();
  }

  return hashString(bucketValue, seed);
}

function selectVariationByWeight(
  weights: Array<{ variationId: string; weight: number }>,
  bucket: number
): string | null {
  let cumulative = 0;
  for (const w of weights) {
    cumulative += w.weight;
    if (bucket < cumulative) {
      return w.variationId;
    }
  }
  return weights[weights.length - 1]?.variationId ?? null;
}

// =============================================================================
// Feature Flags Manager
// =============================================================================

export class FeatureFlagsManager extends EventEmitter<FlagEvents> {
  private config: FlagManagerConfig;
  private storage: FlagStorage;
  private cache = new Map<string, { flag: FlagDefinition; fetchedAt: number }>();
  private analyticsBuffer: FlagEvaluationEvent[] = [];
  private pollingInterval?: NodeJS.Timeout;
  private analyticsFlushInterval?: NodeJS.Timeout;
  private schedulerInterval?: NodeJS.Timeout;
  private running = false;

  constructor(config: Partial<FlagManagerConfig> = {}) {
    super();
    this.config = FlagManagerConfigSchema.parse(config);
    this.storage = new InMemoryFlagStorage();
  }

  // ---------------------------------------------------------------------------
  // Configuration
  // ---------------------------------------------------------------------------

  setStorage(storage: FlagStorage): void {
    this.storage = storage;
  }

  // ---------------------------------------------------------------------------
  // Flag CRUD
  // ---------------------------------------------------------------------------

  async createFlag(input: Omit<FlagDefinition, "id" | "createdAt" | "updatedAt">): Promise<FlagDefinition> {
    const now = Date.now();
    const flag = FlagDefinitionSchema.parse({
      ...input,
      id: randomUUID(),
      createdAt: now,
      updatedAt: now,
    });

    await this.storage.saveFlag(flag);
    this.invalidateCache(flag.key);
    this.emit("flagCreated", flag);
    return flag;
  }

  async getFlag(key: string): Promise<FlagDefinition | null> {
    // Check cache first
    if (this.config.cacheEnabled) {
      const cached = this.cache.get(key);
      const now = Date.now();

      if (cached) {
        const age = now - cached.fetchedAt;
        if (age < this.config.cacheTtlSeconds * 1000) {
          return cached.flag;
        }
        // Check stale TTL
        if (age < this.config.staleTtlSeconds * 1000) {
          // Refresh in background
          this.refreshCache(key).catch(() => {});
          return cached.flag;
        }
      }
    }

    const flag = await this.storage.getFlag(key);
    if (flag && this.config.cacheEnabled) {
      this.cache.set(key, { flag, fetchedAt: Date.now() });
    }
    return flag;
  }

  async updateFlag(key: string, updates: Partial<FlagDefinition>): Promise<FlagDefinition | null> {
    const existing = await this.storage.getFlag(key);
    if (!existing) return null;

    const changes: string[] = [];
    for (const [k, v] of Object.entries(updates)) {
      if (JSON.stringify((existing as Record<string, unknown>)[k]) !== JSON.stringify(v)) {
        changes.push(k);
      }
    }

    const updated = FlagDefinitionSchema.parse({
      ...existing,
      ...updates,
      id: existing.id,
      key: existing.key,
      createdAt: existing.createdAt,
      updatedAt: Date.now(),
    });

    await this.storage.saveFlag(updated);
    this.invalidateCache(key);

    if (updates.status && updates.status !== existing.status) {
      this.emit("flagStatusChanged", key, updates.status);
    }

    this.emit("flagUpdated", updated, changes);
    return updated;
  }

  async deleteFlag(key: string): Promise<boolean> {
    const existing = await this.storage.getFlag(key);
    if (!existing) return false;

    await this.storage.deleteFlag(key);
    this.invalidateCache(key);
    this.emit("flagDeleted", key);
    return true;
  }

  async listFlags(filters?: {
    status?: FlagStatus;
    environment?: string;
    project?: string;
    tags?: string[];
  }): Promise<FlagDefinition[]> {
    return this.storage.listFlags(filters);
  }

  // ---------------------------------------------------------------------------
  // Segments
  // ---------------------------------------------------------------------------

  async createSegment(input: Omit<Segment, "id" | "createdAt" | "updatedAt">): Promise<Segment> {
    const now = Date.now();
    const segment = SegmentSchema.parse({
      ...input,
      id: randomUUID(),
      createdAt: now,
      updatedAt: now,
    });

    await this.storage.saveSegment(segment);
    return segment;
  }

  async getSegment(id: string): Promise<Segment | null> {
    return this.storage.getSegment(id);
  }

  async listSegments(): Promise<Segment[]> {
    return this.storage.listSegments();
  }

  async deleteSegment(id: string): Promise<void> {
    await this.storage.deleteSegment(id);
  }

  // ---------------------------------------------------------------------------
  // Evaluation
  // ---------------------------------------------------------------------------

  async evaluate(flagKey: string, context: Partial<EvaluationContext> = {}): Promise<EvaluationResult> {
    const startTime = performance.now();
    const fullContext = EvaluationContextSchema.parse({
      ...context,
      timestamp: Date.now(),
    });

    try {
      const flag = await this.getFlag(flagKey);

      if (!flag) {
        return this.createErrorResult(flagKey, "off", startTime, "Flag not found");
      }

      // Check if flag is active
      if (flag.status !== "active") {
        const variation = this.getVariation(flag, flag.offVariationId);
        return this.createResult(flagKey, variation, "off", startTime);
      }

      // Check prerequisites
      for (const prereq of flag.prerequisites) {
        const prereqResult = await this.evaluate(prereq.flagKey, context);
        if (prereqResult.variationId !== prereq.variationId) {
          const variation = this.getVariation(flag, flag.offVariationId);
          return this.createResult(flagKey, variation, "prerequisite_failed", startTime);
        }
      }

      // Check individual targets
      if (fullContext.userId) {
        const target = flag.individualTargets.find(t => t.userId === fullContext.userId);
        if (target) {
          const variation = this.getVariation(flag, target.variationId);
          return this.createResult(flagKey, variation, "target_match", startTime);
        }
      }

      // Check targeting rules (by priority)
      const sortedRules = [...flag.targetingRules]
        .filter(r => r.enabled)
        .sort((a, b) => b.priority - a.priority);

      for (const rule of sortedRules) {
        if (evaluateConditions(rule.conditions, rule.conditionLogic, fullContext)) {
          const variation = this.getVariation(flag, rule.variationId);
          return this.createResult(flagKey, variation, "rule_match", startTime, rule.id);
        }
      }

      // Check segment rules
      for (const segmentRule of flag.segmentRules.filter(r => r.enabled)) {
        const segment = await this.storage.getSegment(segmentRule.segmentId);
        if (segment && evaluateConditions(segment.conditions, segment.conditionLogic, fullContext)) {
          const variation = this.getVariation(flag, segmentRule.variationId);
          return this.createResult(flagKey, variation, "segment_match", startTime, undefined, segment.id);
        }
      }

      // Check percentage rollout
      if (flag.percentageRollout?.enabled) {
        const bucket = getBucket(fullContext, flag.percentageRollout.bucketBy, flag.percentageRollout.seed);
        const variationId = selectVariationByWeight(flag.percentageRollout.weights, bucket);
        if (variationId) {
          const variation = this.getVariation(flag, variationId);
          return this.createResult(flagKey, variation, "percentage_rollout", startTime);
        }
      }

      // Fallthrough to default
      const variation = this.getVariation(flag, flag.defaultVariationId);
      return this.createResult(flagKey, variation, "fallthrough", startTime, undefined, undefined, true);
    } catch (error) {
      this.emit("evaluationError", flagKey, error instanceof Error ? error : new Error(String(error)), fullContext);
      return this.createErrorResult(flagKey, "error", startTime, String(error));
    }
  }

  // Convenience methods for typed evaluation
  async evaluateBoolean(flagKey: string, context: Partial<EvaluationContext> = {}, defaultValue = false): Promise<boolean> {
    const result = await this.evaluate(flagKey, context);
    return typeof result.value === "boolean" ? result.value : defaultValue;
  }

  async evaluateString(flagKey: string, context: Partial<EvaluationContext> = {}, defaultValue = ""): Promise<string> {
    const result = await this.evaluate(flagKey, context);
    return typeof result.value === "string" ? result.value : defaultValue;
  }

  async evaluateNumber(flagKey: string, context: Partial<EvaluationContext> = {}, defaultValue = 0): Promise<number> {
    const result = await this.evaluate(flagKey, context);
    return typeof result.value === "number" ? result.value : defaultValue;
  }

  async evaluateJSON<T>(flagKey: string, context: Partial<EvaluationContext> = {}, defaultValue: T): Promise<T> {
    const result = await this.evaluate(flagKey, context);
    return (result.value as T) ?? defaultValue;
  }

  private getVariation(flag: FlagDefinition, variationId: string): FlagVariation {
    const variation = flag.variations.find(v => v.id === variationId);
    if (!variation) {
      // Return first variation as fallback
      return flag.variations[0] ?? { id: "unknown", value: null, name: "Unknown" };
    }
    return variation;
  }

  private createResult(
    flagKey: string,
    variation: FlagVariation,
    reason: EvaluationReason,
    startTime: number,
    ruleId?: string,
    segmentId?: string,
    isDefaultValue = false
  ): EvaluationResult {
    const evaluationTime = performance.now() - startTime;
    const result: EvaluationResult = {
      flagKey,
      value: variation.value,
      variationId: variation.id,
      reason,
      ruleId,
      segmentId,
      isDefaultValue,
      evaluationTime,
    };

    this.recordEvaluation(result);
    return result;
  }

  private createErrorResult(
    flagKey: string,
    reason: EvaluationReason,
    startTime: number,
    error?: string
  ): EvaluationResult {
    const evaluationTime = performance.now() - startTime;
    return {
      flagKey,
      value: this.config.defaultOnError,
      variationId: "error",
      reason,
      isDefaultValue: true,
      evaluationTime,
      metadata: error ? { error } : undefined,
    };
  }

  // ---------------------------------------------------------------------------
  // Analytics
  // ---------------------------------------------------------------------------

  private recordEvaluation(result: EvaluationResult): void {
    if (!this.config.analyticsEnabled) return;

    // Sample
    if (Math.random() > this.config.analyticsSampleRate) return;

    const event: FlagEvaluationEvent = {
      id: randomUUID(),
      timestamp: Date.now(),
      flagKey: result.flagKey,
      variationId: result.variationId,
      reason: result.reason,
      context: {},
      evaluationTime: result.evaluationTime,
    };

    this.analyticsBuffer.push(event);
  }

  private async flushAnalytics(): Promise<void> {
    if (this.analyticsBuffer.length === 0) return;

    const events = [...this.analyticsBuffer];
    this.analyticsBuffer = [];

    for (const event of events) {
      await this.storage.saveEvaluationEvent(event);
    }

    this.emit("analyticsFlush", events);
  }

  async getStats(flagKey: string): Promise<FlagStats | null> {
    return this.storage.getStats(flagKey);
  }

  // ---------------------------------------------------------------------------
  // Cache Management
  // ---------------------------------------------------------------------------

  private invalidateCache(key: string): void {
    this.cache.delete(key);
  }

  private async refreshCache(key: string): Promise<void> {
    const flag = await this.storage.getFlag(key);
    if (flag) {
      this.cache.set(key, { flag, fetchedAt: Date.now() });
    }
  }

  async refreshAllCaches(): Promise<void> {
    const flags = await this.storage.listFlags({ status: "active" });
    const keys = flags.map(f => f.key);

    for (const flag of flags) {
      this.cache.set(flag.key, { flag, fetchedAt: Date.now() });
    }

    this.emit("cacheUpdated", keys);
  }

  // ---------------------------------------------------------------------------
  // Scheduled Changes
  // ---------------------------------------------------------------------------

  async addScheduledChange(
    flagKey: string,
    change: Omit<ScheduledChange, "id" | "executed">
  ): Promise<ScheduledChange> {
    const flag = await this.storage.getFlag(flagKey);
    if (!flag) {
      throw new Error(`Flag not found: ${flagKey}`);
    }

    const scheduledChange: ScheduledChange = {
      ...change,
      id: randomUUID(),
      executed: false,
    };

    await this.updateFlag(flagKey, {
      scheduledChanges: [...flag.scheduledChanges, scheduledChange],
    });

    return scheduledChange;
  }

  private async processScheduledChanges(): Promise<void> {
    const now = Date.now();
    const flags = await this.storage.listFlags({ status: "active" });

    for (const flag of flags) {
      const pendingChanges = flag.scheduledChanges.filter(
        c => !c.executed && c.scheduledAt <= now
      );

      for (const change of pendingChanges) {
        try {
          await this.executeScheduledChange(flag, change);
        } catch (error) {
          this.emit("error", error instanceof Error ? error : new Error(String(error)));
        }
      }
    }
  }

  private async executeScheduledChange(flag: FlagDefinition, change: ScheduledChange): Promise<void> {
    let updates: Partial<FlagDefinition> = {};

    switch (change.action) {
      case "enable":
        updates = { status: "active" };
        break;
      case "disable":
        updates = { status: "inactive" };
        break;
      case "update_rollout":
        if (change.payload?.rollout) {
          updates = { percentageRollout: change.payload.rollout as PercentageRollout };
        }
        break;
      case "update_default":
        if (change.payload?.defaultVariationId) {
          updates = { defaultVariationId: change.payload.defaultVariationId as string };
        }
        break;
    }

    // Mark as executed
    const updatedChanges = flag.scheduledChanges.map(c =>
      c.id === change.id ? { ...c, executed: true, executedAt: Date.now() } : c
    );

    await this.updateFlag(flag.key, {
      ...updates,
      scheduledChanges: updatedChanges,
    });

    this.emit("scheduledChangeExecuted", flag.key, { ...change, executed: true, executedAt: Date.now() });
  }

  // ---------------------------------------------------------------------------
  // Targeting Rules
  // ---------------------------------------------------------------------------

  async addTargetingRule(
    flagKey: string,
    rule: Omit<TargetingRule, "id">
  ): Promise<TargetingRule> {
    const flag = await this.storage.getFlag(flagKey);
    if (!flag) {
      throw new Error(`Flag not found: ${flagKey}`);
    }

    const fullRule: TargetingRule = {
      ...rule,
      id: randomUUID(),
    };

    await this.updateFlag(flagKey, {
      targetingRules: [...flag.targetingRules, fullRule],
    });

    this.emit("targetingRuleAdded", flagKey, fullRule);
    return fullRule;
  }

  async removeTargetingRule(flagKey: string, ruleId: string): Promise<boolean> {
    const flag = await this.storage.getFlag(flagKey);
    if (!flag) return false;

    const filtered = flag.targetingRules.filter(r => r.id !== ruleId);
    if (filtered.length === flag.targetingRules.length) return false;

    await this.updateFlag(flagKey, { targetingRules: filtered });
    this.emit("targetingRuleRemoved", flagKey, ruleId);
    return true;
  }

  // ---------------------------------------------------------------------------
  // Rollout Management
  // ---------------------------------------------------------------------------

  async updateRollout(flagKey: string, rollout: PercentageRollout): Promise<void> {
    await this.updateFlag(flagKey, { percentageRollout: rollout });
    this.emit("rolloutUpdated", flagKey, rollout);
  }

  async setRolloutPercentage(flagKey: string, enabledPercent: number): Promise<void> {
    const flag = await this.storage.getFlag(flagKey);
    if (!flag) {
      throw new Error(`Flag not found: ${flagKey}`);
    }

    // Assume boolean flag with "true" and "false" variations
    const rollout: PercentageRollout = {
      enabled: true,
      weights: [
        { variationId: "true", weight: enabledPercent },
        { variationId: "false", weight: 100 - enabledPercent },
      ],
      bucketBy: flag.percentageRollout?.bucketBy ?? "userId",
      seed: flag.percentageRollout?.seed,
    };

    await this.updateRollout(flagKey, rollout);
  }

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  async start(): Promise<void> {
    if (this.running) return;
    this.running = true;

    // Start polling
    if (this.config.pollingIntervalSeconds > 0) {
      this.pollingInterval = setInterval(() => {
        this.refreshAllCaches().catch(err => this.emit("error", err));
      }, this.config.pollingIntervalSeconds * 1000);
    }

    // Start analytics flush
    if (this.config.analyticsEnabled) {
      this.analyticsFlushInterval = setInterval(() => {
        this.flushAnalytics().catch(err => this.emit("error", err));
      }, this.config.analyticsFlushIntervalSeconds * 1000);
    }

    // Start scheduler for scheduled changes
    this.schedulerInterval = setInterval(() => {
      this.processScheduledChanges().catch(err => this.emit("error", err));
    }, 60000); // Check every minute

    // Initial cache load
    await this.refreshAllCaches();
  }

  async stop(): Promise<void> {
    this.running = false;

    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = undefined;
    }

    if (this.analyticsFlushInterval) {
      clearInterval(this.analyticsFlushInterval);
      this.analyticsFlushInterval = undefined;
    }

    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
      this.schedulerInterval = undefined;
    }

    // Final flush
    await this.flushAnalytics();
  }

  isRunning(): boolean {
    return this.running;
  }
}

// =============================================================================
// Factory Functions
// =============================================================================

let defaultManager: FeatureFlagsManager | null = null;

export function getFeatureFlagsManager(): FeatureFlagsManager {
  if (!defaultManager) {
    defaultManager = new FeatureFlagsManager();
  }
  return defaultManager;
}

export function createFeatureFlagsManager(config?: Partial<FlagManagerConfig>): FeatureFlagsManager {
  return new FeatureFlagsManager(config);
}
