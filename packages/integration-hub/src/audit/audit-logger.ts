/**
 * Audit Logger Implementation
 * Phase 9B: Enterprise Security
 */

import { EventEmitter } from "eventemitter3";
import { createHash } from "crypto";
import {
  AuditEvent,
  AuditLoggerEvents,
  CreateAuditEvent,
  AuditQuery,
  AuditQueryResult,
  AuditCategory,
  AuditAction,
  AuditSeverity,
  AuditResult,
  AuditContext,
  AuditResource,
  AuditChange,
  AuditStats,
  AuditExportOptions,
  AuditRetentionPolicy,
  DEFAULT_RETENTION_DAYS,
  SEVERITY_LEVELS,
} from "./types.js";

// ============================================================================
// CONFIGURATION
// ============================================================================

export interface AuditLoggerConfig {
  // Storage
  storageType: "memory" | "database" | "external";
  databaseUrl?: string;
  externalEndpoint?: string;

  // Batching
  batchSize: number;
  batchIntervalMs: number;

  // Retention
  retentionPolicies?: AuditRetentionPolicy[];

  // Security
  enableIntegrityHash: boolean;
  hashAlgorithm: "sha256" | "sha512";

  // Performance
  asyncLogging: boolean;
  maxQueueSize: number;

  // Filtering
  minSeverity: AuditSeverity;
  excludeCategories?: AuditCategory[];
  excludeActions?: AuditAction[];

  // Export
  exportDir?: string;
}

const DEFAULT_CONFIG: AuditLoggerConfig = {
  storageType: "memory",
  batchSize: 100,
  batchIntervalMs: 5000,
  enableIntegrityHash: true,
  hashAlgorithm: "sha256",
  asyncLogging: true,
  maxQueueSize: 10000,
  minSeverity: "info",
};

// ============================================================================
// AUDIT LOGGER CLASS
// ============================================================================

export class AuditLogger extends EventEmitter<AuditLoggerEvents> {
  private config: AuditLoggerConfig;
  private events: AuditEvent[] = [];
  private queue: CreateAuditEvent[] = [];
  private lastHash: string | null = null;
  private batchTimer: ReturnType<typeof setInterval> | null = null;
  private isProcessing = false;

  constructor(config: Partial<AuditLoggerConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };

    if (this.config.asyncLogging) {
      this.startBatchProcessor();
    }
  }

  // ==========================================================================
  // LOGGING METHODS
  // ==========================================================================

  /**
   * Log an audit event
   */
  async log(input: CreateAuditEvent): Promise<AuditEvent> {
    // Check severity filter
    if (SEVERITY_LEVELS[input.severity] < SEVERITY_LEVELS[this.config.minSeverity]) {
      throw new Error(`Event severity ${input.severity} below minimum ${this.config.minSeverity}`);
    }

    // Check category exclusion
    if (this.config.excludeCategories?.includes(input.category)) {
      throw new Error(`Category ${input.category} is excluded`);
    }

    // Check action exclusion
    if (this.config.excludeActions?.includes(input.action)) {
      throw new Error(`Action ${input.action} is excluded`);
    }

    if (this.config.asyncLogging) {
      // Queue for batch processing
      if (this.queue.length >= this.config.maxQueueSize) {
        await this.processBatch();
      }
      this.queue.push(input);

      // Return placeholder event
      const event = this.createEvent(input);
      return event;
    } else {
      // Sync logging
      const event = this.createEvent(input);
      await this.storeEvent(event);
      return event;
    }
  }

  /**
   * Log a simple info event
   */
  async info(
    category: AuditCategory,
    action: AuditAction,
    description: string,
    context?: Partial<AuditContext>,
    resource?: AuditResource
  ): Promise<AuditEvent> {
    return this.log({
      category,
      action,
      severity: "info",
      result: "success",
      description,
      context: context || {},
      resource,
    });
  }

  /**
   * Log a warning event
   */
  async warn(
    category: AuditCategory,
    action: AuditAction,
    description: string,
    context?: Partial<AuditContext>,
    resource?: AuditResource
  ): Promise<AuditEvent> {
    return this.log({
      category,
      action,
      severity: "warning",
      result: "success",
      description,
      context: context || {},
      resource,
    });
  }

  /**
   * Log an error event
   */
  async error(
    category: AuditCategory,
    action: AuditAction,
    description: string,
    error: Error,
    context?: Partial<AuditContext>,
    resource?: AuditResource
  ): Promise<AuditEvent> {
    return this.log({
      category,
      action,
      severity: "error",
      result: "failure",
      description,
      errorCode: error.name,
      errorMessage: error.message,
      context: context || {},
      resource,
    });
  }

  /**
   * Log a security event
   */
  async security(
    action: AuditAction,
    description: string,
    severity: AuditSeverity = "warning",
    context?: Partial<AuditContext>,
    resource?: AuditResource
  ): Promise<AuditEvent> {
    return this.log({
      category: "security",
      action,
      severity,
      result: severity === "critical" ? "failure" : "success",
      description,
      context: context || {},
      resource,
    });
  }

  /**
   * Log a change event with diff
   */
  async change(
    category: AuditCategory,
    resourceType: string,
    resourceId: string,
    changes: AuditChange[],
    context?: Partial<AuditContext>
  ): Promise<AuditEvent> {
    const description = `Updated ${resourceType} ${resourceId}: ${changes.map(c => c.field).join(", ")}`;

    return this.log({
      category,
      action: "update",
      severity: "info",
      result: "success",
      description,
      context: context || {},
      resource: {
        type: resourceType,
        id: resourceId,
      },
      changes,
    });
  }

  // ==========================================================================
  // QUERY METHODS
  // ==========================================================================

  /**
   * Query audit events
   */
  async query(query: AuditQuery): Promise<AuditQueryResult> {
    let filtered = [...this.events];

    // Apply filters
    if (query.orgId) {
      filtered = filtered.filter(e => e.context.orgId === query.orgId);
    }
    if (query.userId) {
      filtered = filtered.filter(e => e.context.userId === query.userId);
    }
    if (query.category) {
      filtered = filtered.filter(e => e.category === query.category);
    }
    if (query.action) {
      filtered = filtered.filter(e => e.action === query.action);
    }
    if (query.severity) {
      filtered = filtered.filter(e => e.severity === query.severity);
    }
    if (query.result) {
      filtered = filtered.filter(e => e.result === query.result);
    }
    if (query.resourceType) {
      filtered = filtered.filter(e => e.resource?.type === query.resourceType);
    }
    if (query.resourceId) {
      filtered = filtered.filter(e => e.resource?.id === query.resourceId);
    }

    // Date range
    if (query.startDate) {
      filtered = filtered.filter(e => e.timestamp >= query.startDate!);
    }
    if (query.endDate) {
      filtered = filtered.filter(e => e.timestamp <= query.endDate!);
    }

    // Search
    if (query.search) {
      const searchLower = query.search.toLowerCase();
      filtered = filtered.filter(e =>
        e.description.toLowerCase().includes(searchLower) ||
        e.message?.toLowerCase().includes(searchLower) ||
        e.context.userEmail?.toLowerCase().includes(searchLower) ||
        e.resource?.name?.toLowerCase().includes(searchLower)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let compare = 0;
      switch (query.sortBy) {
        case "timestamp":
          compare = a.timestamp.getTime() - b.timestamp.getTime();
          break;
        case "severity":
          compare = SEVERITY_LEVELS[a.severity] - SEVERITY_LEVELS[b.severity];
          break;
        case "category":
          compare = a.category.localeCompare(b.category);
          break;
      }
      return query.sortOrder === "desc" ? -compare : compare;
    });

    // Pagination
    const total = filtered.length;
    const offset = query.offset || 0;
    const limit = query.limit || 100;
    const paginated = filtered.slice(offset, offset + limit);

    return {
      events: paginated,
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    };
  }

  /**
   * Get event by ID
   */
  async getEvent(id: string): Promise<AuditEvent | null> {
    return this.events.find(e => e.id === id) || null;
  }

  /**
   * Get recent events for a user
   */
  async getUserEvents(userId: string, limit = 50): Promise<AuditEvent[]> {
    const result = await this.query({
      userId,
      limit,
      sortBy: "timestamp",
      sortOrder: "desc",
    });
    return result.events;
  }

  /**
   * Get recent events for an organization
   */
  async getOrgEvents(orgId: string, limit = 100): Promise<AuditEvent[]> {
    const result = await this.query({
      orgId,
      limit,
      sortBy: "timestamp",
      sortOrder: "desc",
    });
    return result.events;
  }

  /**
   * Get security events
   */
  async getSecurityEvents(
    orgId?: string,
    severity?: AuditSeverity,
    limit = 100
  ): Promise<AuditEvent[]> {
    const result = await this.query({
      orgId,
      category: "security",
      severity,
      limit,
      sortBy: "timestamp",
      sortOrder: "desc",
    });
    return result.events;
  }

  // ==========================================================================
  // STATISTICS
  // ==========================================================================

  /**
   * Get audit statistics
   */
  async getStats(orgId?: string, days = 30): Promise<AuditStats> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const result = await this.query({
      orgId,
      startDate,
      limit: 10000,
    });

    const events = result.events;

    // Count by category
    const eventsByCategory: Record<string, number> = {};
    for (const e of events) {
      eventsByCategory[e.category] = (eventsByCategory[e.category] || 0) + 1;
    }

    // Count by severity
    const eventsBySeverity: Record<string, number> = {};
    for (const e of events) {
      eventsBySeverity[e.severity] = (eventsBySeverity[e.severity] || 0) + 1;
    }

    // Count by result
    const eventsByResult: Record<string, number> = {};
    for (const e of events) {
      eventsByResult[e.result] = (eventsByResult[e.result] || 0) + 1;
    }

    // Top users
    const userCounts: Record<string, { email?: string; count: number }> = {};
    for (const e of events) {
      if (e.context.userId) {
        if (!userCounts[e.context.userId]) {
          userCounts[e.context.userId] = { email: e.context.userEmail, count: 0 };
        }
        userCounts[e.context.userId].count++;
      }
    }
    const topUsers = Object.entries(userCounts)
      .map(([userId, data]) => ({ userId, email: data.email, eventCount: data.count }))
      .sort((a, b) => b.eventCount - a.eventCount)
      .slice(0, 10);

    // Top resources
    const resourceCounts: Record<string, number> = {};
    for (const e of events) {
      if (e.resource) {
        const key = `${e.resource.type}:${e.resource.id}`;
        resourceCounts[key] = (resourceCounts[key] || 0) + 1;
      }
    }
    const topResources = Object.entries(resourceCounts)
      .map(([key, count]) => {
        const [type, id] = key.split(":");
        return { resourceType: type, resourceId: id, eventCount: count };
      })
      .sort((a, b) => b.eventCount - a.eventCount)
      .slice(0, 10);

    // Recent activity (daily counts)
    const dailyCounts: Record<string, number> = {};
    for (const e of events) {
      const date = e.timestamp.toISOString().split("T")[0];
      dailyCounts[date] = (dailyCounts[date] || 0) + 1;
    }
    const recentActivity = Object.entries(dailyCounts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalEvents: events.length,
      eventsByCategory,
      eventsBySeverity,
      eventsByResult,
      topUsers,
      topResources,
      recentActivity,
    };
  }

  // ==========================================================================
  // EXPORT
  // ==========================================================================

  /**
   * Export audit logs
   */
  async export(options: AuditExportOptions): Promise<string> {
    const result = await this.query(options.query);

    let output: string;

    switch (options.format) {
      case "json":
        output = JSON.stringify(
          result.events.map(e => this.serializeForExport(e, options)),
          null,
          2
        );
        break;

      case "csv":
        output = this.exportToCSV(result.events, options);
        break;

      case "pdf":
        // PDF export would need a library - return JSON for now
        output = JSON.stringify(
          result.events.map(e => this.serializeForExport(e, options)),
          null,
          2
        );
        break;

      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }

    this.emit("event:exported", options.format, result.events.length);

    return output;
  }

  private serializeForExport(
    event: AuditEvent,
    options: AuditExportOptions
  ): Record<string, unknown> {
    const result: Record<string, unknown> = {
      id: event.id,
      timestamp: event.timestamp.toISOString(),
      category: event.category,
      action: event.action,
      severity: event.severity,
      result: event.result,
      description: event.description,
    };

    if (options.includeContext) {
      result.context = event.context;
    }

    if (options.includeChanges && event.changes) {
      result.changes = event.changes;
    }

    if (options.includeMetadata && event.metadata) {
      result.metadata = event.metadata;
    }

    if (event.resource) {
      result.resource = event.resource;
    }

    if (event.errorCode) {
      result.errorCode = event.errorCode;
      result.errorMessage = event.errorMessage;
    }

    return result;
  }

  private exportToCSV(events: AuditEvent[], options: AuditExportOptions): string {
    const headers = [
      "id",
      "timestamp",
      "category",
      "action",
      "severity",
      "result",
      "description",
      "userId",
      "userEmail",
      "orgId",
      "resourceType",
      "resourceId",
    ];

    const rows = events.map(e => [
      e.id,
      e.timestamp.toISOString(),
      e.category,
      e.action,
      e.severity,
      e.result,
      `"${e.description.replace(/"/g, '""')}"`,
      e.context.userId || "",
      e.context.userEmail || "",
      e.context.orgId || "",
      e.resource?.type || "",
      e.resource?.id || "",
    ]);

    return [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
  }

  // ==========================================================================
  // RETENTION
  // ==========================================================================

  /**
   * Apply retention policies
   */
  async applyRetention(): Promise<{ deleted: number; archived: number }> {
    const policies = this.config.retentionPolicies || this.getDefaultPolicies();
    let deleted = 0;
    let archived = 0;

    for (const policy of policies) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - policy.retentionDays);

      // Find events to process
      const toProcess = this.events.filter(
        e => e.category === policy.category && e.timestamp < cutoffDate
      );

      // Archive if configured
      if (policy.archiveAfterDays) {
        const archiveCutoff = new Date();
        archiveCutoff.setDate(archiveCutoff.getDate() - policy.archiveAfterDays);

        const toArchive = toProcess.filter(e => e.timestamp >= archiveCutoff);
        // In a real implementation, archive these events
        archived += toArchive.length;
      }

      // Delete
      const toDelete = policy.deleteAfterArchive
        ? toProcess
        : toProcess.filter(e => {
            if (policy.archiveAfterDays) {
              const archiveCutoff = new Date();
              archiveCutoff.setDate(archiveCutoff.getDate() - policy.archiveAfterDays);
              return e.timestamp < archiveCutoff;
            }
            return true;
          });

      this.events = this.events.filter(e => !toDelete.includes(e));
      deleted += toDelete.length;
    }

    this.emit("retention:applied", deleted, archived);

    return { deleted, archived };
  }

  private getDefaultPolicies(): AuditRetentionPolicy[] {
    return Object.entries(DEFAULT_RETENTION_DAYS).map(([category, days]) => ({
      category: category as AuditCategory,
      retentionDays: days,
    }));
  }

  // ==========================================================================
  // INTEGRITY
  // ==========================================================================

  /**
   * Verify event chain integrity
   */
  async verifyIntegrity(events?: AuditEvent[]): Promise<{
    valid: boolean;
    invalidEvents: string[];
  }> {
    const toVerify = events || this.events;
    const invalidEvents: string[] = [];

    let previousHash: string | null = null;

    for (const event of toVerify.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())) {
      if (!event.hash) {
        invalidEvents.push(event.id);
        continue;
      }

      // Verify hash matches
      const computedHash = this.computeHash(event);
      if (computedHash !== event.hash) {
        invalidEvents.push(event.id);
        continue;
      }

      // Verify chain
      if (previousHash && event.previousHash !== previousHash) {
        invalidEvents.push(event.id);
      }

      previousHash = event.hash;
    }

    return {
      valid: invalidEvents.length === 0,
      invalidEvents,
    };
  }

  // ==========================================================================
  // INTERNAL METHODS
  // ==========================================================================

  private createEvent(input: CreateAuditEvent): AuditEvent {
    const id = this.generateId();
    const timestamp = new Date();

    const event: AuditEvent = {
      id,
      timestamp,
      ...input,
      retentionDays: input.retentionDays || DEFAULT_RETENTION_DAYS[input.category],
    };

    if (this.config.enableIntegrityHash) {
      event.previousHash = this.lastHash || undefined;
      event.hash = this.computeHash(event);
      this.lastHash = event.hash;
    }

    return event;
  }

  private async storeEvent(event: AuditEvent): Promise<void> {
    switch (this.config.storageType) {
      case "memory":
        this.events.push(event);
        break;

      case "database":
        // In a real implementation, store to database
        this.events.push(event);
        break;

      case "external":
        // In a real implementation, send to external service
        this.events.push(event);
        break;
    }

    this.emit("event:logged", event);
  }

  private startBatchProcessor(): void {
    this.batchTimer = setInterval(() => {
      if (this.queue.length > 0 && !this.isProcessing) {
        this.processBatch().catch(err => this.emit("error", err));
      }
    }, this.config.batchIntervalMs);
  }

  private async processBatch(): Promise<void> {
    if (this.queue.length === 0 || this.isProcessing) return;

    this.isProcessing = true;

    try {
      const batch = this.queue.splice(0, this.config.batchSize);
      const events = batch.map(input => this.createEvent(input));

      for (const event of events) {
        await this.storeEvent(event);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  private computeHash(event: AuditEvent): string {
    const data = JSON.stringify({
      id: event.id,
      timestamp: event.timestamp.toISOString(),
      category: event.category,
      action: event.action,
      description: event.description,
      context: event.context,
      resource: event.resource,
      previousHash: event.previousHash,
    });

    return createHash(this.config.hashAlgorithm).update(data).digest("hex");
  }

  private generateId(): string {
    return `aud_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }

  // ==========================================================================
  // LIFECYCLE
  // ==========================================================================

  /**
   * Flush pending events
   */
  async flush(): Promise<void> {
    if (this.queue.length > 0) {
      await this.processBatch();
    }
  }

  /**
   * Stop the logger
   */
  async stop(): Promise<void> {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
      this.batchTimer = null;
    }
    await this.flush();
  }

  /**
   * Get queue size
   */
  getQueueSize(): number {
    return this.queue.length;
  }

  /**
   * Get total event count
   */
  getEventCount(): number {
    return this.events.length;
  }
}

// ============================================================================
// SINGLETON & FACTORY
// ============================================================================

let auditLoggerInstance: AuditLogger | null = null;

export function getAuditLogger(): AuditLogger {
  if (!auditLoggerInstance) {
    auditLoggerInstance = new AuditLogger();
  }
  return auditLoggerInstance;
}

export function createAuditLogger(config?: Partial<AuditLoggerConfig>): AuditLogger {
  return new AuditLogger(config);
}
