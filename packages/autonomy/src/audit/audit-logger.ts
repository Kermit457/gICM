/**
 * Audit Logger for Level 2 Autonomy
 *
 * Logs all autonomy actions with hash chain for integrity:
 * - Action received
 * - Risk assessment
 * - Decision made
 * - Execution results
 * - Approvals/rejections
 */

import { createHash } from "crypto";
import type {
  Action,
  Decision,
  AuditEntry,
  AuditEntryType,
  ExecutionResult,
  ApprovalRequest,
} from "../core/types.js";
import { AUDIT_CONFIG } from "../core/constants.js";
import { Logger } from "../utils/logger.js";

export interface AuditLoggerConfig {
  /** Maximum entries to keep in memory */
  maxEntries?: number;
  /** Retention period in days */
  retentionDays?: number;
}

export class AuditLogger {
  private logger: Logger;
  private entries: AuditEntry[];
  private maxEntries: number;
  private retentionDays: number;
  private lastHash: string;
  private entryCount = 0;

  constructor(config: AuditLoggerConfig = {}) {
    this.logger = new Logger("AuditLogger");
    this.entries = [];
    this.maxEntries = config.maxEntries ?? AUDIT_CONFIG.maxEntriesInMemory;
    this.retentionDays = config.retentionDays ?? AUDIT_CONFIG.retentionDays;
    this.lastHash = "";
  }

  /**
   * Log action received
   */
  logActionReceived(action: Action): AuditEntry {
    return this.log("action_received", action.id, undefined, {
      type: action.type,
      engine: action.engine,
      category: action.category,
      description: action.description,
      estimatedValue: action.metadata.estimatedValue,
    });
  }

  /**
   * Log risk assessment
   */
  logRiskAssessed(action: Action, decision: Decision): AuditEntry {
    return this.log("risk_assessed", action.id, decision.id, {
      riskLevel: decision.assessment.level,
      riskScore: decision.assessment.score,
      factors: decision.assessment.factors.map((f) => ({
        name: f.name,
        value: f.value,
        exceeded: f.exceeded,
      })),
    });
  }

  /**
   * Log decision made
   */
  logDecisionMade(decision: Decision): AuditEntry {
    return this.log("decision_made", decision.actionId, decision.id, {
      outcome: decision.outcome,
      reason: decision.reason,
      riskLevel: decision.assessment.level,
      riskScore: decision.assessment.score,
    });
  }

  /**
   * Log action queued for approval
   */
  logQueuedApproval(request: ApprovalRequest): AuditEntry {
    return this.log("queued_approval", request.decision.actionId, request.decision.id, {
      requestId: request.id,
      priority: request.priority,
      urgency: request.urgency,
      expiresAt: request.expiresAt,
    });
  }

  /**
   * Log approval granted
   */
  logApproved(request: ApprovalRequest): AuditEntry {
    return this.log("approved", request.decision.actionId, request.decision.id, {
      requestId: request.id,
      approvedBy: request.reviewedBy,
      feedback: request.feedback,
      waitTime: request.reviewedAt! - request.createdAt,
    });
  }

  /**
   * Log rejection
   */
  logRejected(request: ApprovalRequest, reason: string): AuditEntry {
    return this.log("rejected", request.decision.actionId, request.decision.id, {
      requestId: request.id,
      rejectedBy: request.reviewedBy,
      reason,
    });
  }

  /**
   * Log execution completed
   */
  logExecuted(result: ExecutionResult): AuditEntry {
    return this.log("executed", result.actionId, result.decisionId, {
      success: result.success,
      duration: result.duration,
      output: result.output,
    });
  }

  /**
   * Log execution failed
   */
  logExecutionFailed(result: ExecutionResult): AuditEntry {
    return this.log("execution_failed", result.actionId, result.decisionId, {
      error: result.error,
      duration: result.duration,
      rolledBack: result.rolledBack,
    });
  }

  /**
   * Log rollback
   */
  logRolledBack(actionId: string, decisionId: string): AuditEntry {
    return this.log("rolled_back", actionId, decisionId, {
      rolledBackAt: Date.now(),
    });
  }

  /**
   * Log boundary violation
   */
  logBoundaryViolation(action: Action, violations: string[]): AuditEntry {
    return this.log("boundary_violation", action.id, undefined, {
      violations,
      type: action.type,
      category: action.category,
    });
  }

  /**
   * Log escalation
   */
  logEscalated(request: ApprovalRequest): AuditEntry {
    return this.log("escalated", request.decision.actionId, request.decision.id, {
      requestId: request.id,
      reason: "Required immediate attention",
      riskLevel: request.decision.assessment.level,
    });
  }

  /**
   * Get all entries
   */
  getEntries(): AuditEntry[] {
    return [...this.entries];
  }

  /**
   * Get entries by action ID
   */
  getByActionId(actionId: string): AuditEntry[] {
    return this.entries.filter((e) => e.actionId === actionId);
  }

  /**
   * Get entries by type
   */
  getByType(type: AuditEntryType): AuditEntry[] {
    return this.entries.filter((e) => e.type === type);
  }

  /**
   * Get entries in time range
   */
  getByTimeRange(startTime: number, endTime: number): AuditEntry[] {
    return this.entries.filter(
      (e) => e.timestamp >= startTime && e.timestamp <= endTime
    );
  }

  /**
   * Verify integrity of audit chain
   */
  verifyIntegrity(): { valid: boolean; brokenAt?: number } {
    let previousHash = "";

    for (let i = 0; i < this.entries.length; i++) {
      const entry = this.entries[i];

      // Check previous hash link
      if (entry.previousHash !== previousHash) {
        return { valid: false, brokenAt: i };
      }

      // Verify entry hash
      const expectedHash = this.calculateHash(entry);
      if (entry.hash !== expectedHash) {
        return { valid: false, brokenAt: i };
      }

      previousHash = entry.hash;
    }

    return { valid: true };
  }

  /**
   * Get statistics
   */
  getStats(): {
    totalEntries: number;
    byType: Record<string, number>;
    oldestEntry: number | null;
    newestEntry: number | null;
  } {
    const byType: Record<string, number> = {};

    for (const entry of this.entries) {
      byType[entry.type] = (byType[entry.type] ?? 0) + 1;
    }

    return {
      totalEntries: this.entries.length,
      byType,
      oldestEntry: this.entries.length > 0 ? this.entries[0].timestamp : null,
      newestEntry:
        this.entries.length > 0
          ? this.entries[this.entries.length - 1].timestamp
          : null,
    };
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.entries = [];
    this.lastHash = "";
    this.logger.info("Audit log cleared");
  }

  /**
   * Export entries as JSON
   */
  export(): string {
    return JSON.stringify(this.entries, null, 2);
  }

  // Private methods

  private log(
    type: AuditEntryType,
    actionId: string,
    decisionId: string | undefined,
    data: Record<string, unknown>
  ): AuditEntry {
    this.entryCount++;

    const entry: AuditEntry = {
      id: `aud_${Date.now()}_${this.entryCount}`,
      timestamp: Date.now(),
      type,
      actionId,
      decisionId,
      data,
      hash: "",
      previousHash: this.lastHash,
    };

    entry.hash = this.calculateHash(entry);
    this.lastHash = entry.hash;

    this.entries.push(entry);

    // Cleanup old entries
    this.cleanup();

    this.logger.debug(`Audit: ${type}`, { actionId, decisionId });

    return entry;
  }

  private calculateHash(entry: AuditEntry): string {
    const content = JSON.stringify({
      id: entry.id,
      timestamp: entry.timestamp,
      type: entry.type,
      actionId: entry.actionId,
      decisionId: entry.decisionId,
      data: entry.data,
      previousHash: entry.previousHash,
    });

    return createHash(AUDIT_CONFIG.hashAlgorithm).update(content).digest("hex");
  }

  private cleanup(): void {
    // Remove old entries
    const cutoffTime =
      Date.now() - this.retentionDays * 24 * 60 * 60 * 1000;
    this.entries = this.entries.filter((e) => e.timestamp >= cutoffTime);

    // Enforce max entries
    if (this.entries.length > this.maxEntries) {
      this.entries = this.entries.slice(-this.maxEntries);
    }
  }
}
