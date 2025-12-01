import {
  AUDIT_CONFIG
} from "./chunk-TENKIGAJ.js";
import {
  Logger
} from "./chunk-ZB2ZVSPL.js";

// src/audit/audit-logger.ts
import { createHash } from "crypto";
var AuditLogger = class {
  logger;
  entries;
  maxEntries;
  retentionDays;
  lastHash;
  entryCount = 0;
  constructor(config = {}) {
    this.logger = new Logger("AuditLogger");
    this.entries = [];
    this.maxEntries = config.maxEntries ?? AUDIT_CONFIG.maxEntriesInMemory;
    this.retentionDays = config.retentionDays ?? AUDIT_CONFIG.retentionDays;
    this.lastHash = "";
  }
  /**
   * Log action received
   */
  logActionReceived(action) {
    return this.log("action_received", action.id, void 0, {
      type: action.type,
      engine: action.engine,
      category: action.category,
      description: action.description,
      estimatedValue: action.metadata.estimatedValue
    });
  }
  /**
   * Log risk assessment
   */
  logRiskAssessed(action, decision) {
    return this.log("risk_assessed", action.id, decision.id, {
      riskLevel: decision.assessment.level,
      riskScore: decision.assessment.score,
      factors: decision.assessment.factors.map((f) => ({
        name: f.name,
        value: f.value,
        exceeded: f.exceeded
      }))
    });
  }
  /**
   * Log decision made
   */
  logDecisionMade(decision) {
    return this.log("decision_made", decision.actionId, decision.id, {
      outcome: decision.outcome,
      reason: decision.reason,
      riskLevel: decision.assessment.level,
      riskScore: decision.assessment.score
    });
  }
  /**
   * Log action queued for approval
   */
  logQueuedApproval(request) {
    return this.log("queued_approval", request.decision.actionId, request.decision.id, {
      requestId: request.id,
      priority: request.priority,
      urgency: request.urgency,
      expiresAt: request.expiresAt
    });
  }
  /**
   * Log approval granted
   */
  logApproved(request) {
    return this.log("approved", request.decision.actionId, request.decision.id, {
      requestId: request.id,
      approvedBy: request.reviewedBy,
      feedback: request.feedback,
      waitTime: request.reviewedAt - request.createdAt
    });
  }
  /**
   * Log rejection
   */
  logRejected(request, reason) {
    return this.log("rejected", request.decision.actionId, request.decision.id, {
      requestId: request.id,
      rejectedBy: request.reviewedBy,
      reason
    });
  }
  /**
   * Log execution completed
   */
  logExecuted(result) {
    return this.log("executed", result.actionId, result.decisionId, {
      success: result.success,
      duration: result.duration,
      output: result.output
    });
  }
  /**
   * Log execution failed
   */
  logExecutionFailed(result) {
    return this.log("execution_failed", result.actionId, result.decisionId, {
      error: result.error,
      duration: result.duration,
      rolledBack: result.rolledBack
    });
  }
  /**
   * Log rollback
   */
  logRolledBack(actionId, decisionId) {
    return this.log("rolled_back", actionId, decisionId, {
      rolledBackAt: Date.now()
    });
  }
  /**
   * Log boundary violation
   */
  logBoundaryViolation(action, violations) {
    return this.log("boundary_violation", action.id, void 0, {
      violations,
      type: action.type,
      category: action.category
    });
  }
  /**
   * Log escalation
   */
  logEscalated(request) {
    return this.log("escalated", request.decision.actionId, request.decision.id, {
      requestId: request.id,
      reason: "Required immediate attention",
      riskLevel: request.decision.assessment.level
    });
  }
  /**
   * Get all entries
   */
  getEntries() {
    return [...this.entries];
  }
  /**
   * Get entries by action ID
   */
  getByActionId(actionId) {
    return this.entries.filter((e) => e.actionId === actionId);
  }
  /**
   * Get entries by type
   */
  getByType(type) {
    return this.entries.filter((e) => e.type === type);
  }
  /**
   * Get entries in time range
   */
  getByTimeRange(startTime, endTime) {
    return this.entries.filter(
      (e) => e.timestamp >= startTime && e.timestamp <= endTime
    );
  }
  /**
   * Verify integrity of audit chain
   */
  verifyIntegrity() {
    let previousHash = "";
    for (let i = 0; i < this.entries.length; i++) {
      const entry = this.entries[i];
      if (entry.previousHash !== previousHash) {
        return { valid: false, brokenAt: i };
      }
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
  getStats() {
    const byType = {};
    for (const entry of this.entries) {
      byType[entry.type] = (byType[entry.type] ?? 0) + 1;
    }
    return {
      totalEntries: this.entries.length,
      byType,
      oldestEntry: this.entries.length > 0 ? this.entries[0].timestamp : null,
      newestEntry: this.entries.length > 0 ? this.entries[this.entries.length - 1].timestamp : null
    };
  }
  /**
   * Clear all entries
   */
  clear() {
    this.entries = [];
    this.lastHash = "";
    this.logger.info("Audit log cleared");
  }
  /**
   * Export entries as JSON
   */
  export() {
    return JSON.stringify(this.entries, null, 2);
  }
  // Private methods
  log(type, actionId, decisionId, data) {
    this.entryCount++;
    const entry = {
      id: `aud_${Date.now()}_${this.entryCount}`,
      timestamp: Date.now(),
      type,
      actionId,
      decisionId,
      data,
      hash: "",
      previousHash: this.lastHash
    };
    entry.hash = this.calculateHash(entry);
    this.lastHash = entry.hash;
    this.entries.push(entry);
    this.cleanup();
    this.logger.debug(`Audit: ${type}`, { actionId, decisionId });
    return entry;
  }
  calculateHash(entry) {
    const content = JSON.stringify({
      id: entry.id,
      timestamp: entry.timestamp,
      type: entry.type,
      actionId: entry.actionId,
      decisionId: entry.decisionId,
      data: entry.data,
      previousHash: entry.previousHash
    });
    return createHash(AUDIT_CONFIG.hashAlgorithm).update(content).digest("hex");
  }
  cleanup() {
    const cutoffTime = Date.now() - this.retentionDays * 24 * 60 * 60 * 1e3;
    this.entries = this.entries.filter((e) => e.timestamp >= cutoffTime);
    if (this.entries.length > this.maxEntries) {
      this.entries = this.entries.slice(-this.maxEntries);
    }
  }
};

export {
  AuditLogger
};
//# sourceMappingURL=chunk-G7ZQ5H4K.js.map