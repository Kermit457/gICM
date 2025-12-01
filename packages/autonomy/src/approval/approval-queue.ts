/**
 * Approval Queue for Level 2 Autonomy
 *
 * Priority queue for pending approvals with:
 * - Priority ordering (risk level, urgency)
 * - Auto-expiration
 * - Batch operations
 */

import { EventEmitter } from "eventemitter3";
import type {
  Decision,
  ApprovalRequest,
  ApprovalStatus,
  Urgency,
} from "../core/types.js";
import { URGENCY_PRIORITY, ESCALATION_RULES } from "../core/constants.js";
import { Logger } from "../utils/logger.js";

export interface ApprovalQueueConfig {
  maxPendingItems?: number;
  autoExpireHours?: number;
}

export interface ApprovalQueueEvents {
  "item:added": (request: ApprovalRequest) => void;
  "item:approved": (request: ApprovalRequest, by: string) => void;
  "item:rejected": (request: ApprovalRequest, reason: string) => void;
  "item:expired": (request: ApprovalRequest) => void;
  "item:escalated": (request: ApprovalRequest) => void;
  "queue:changed": (count: number) => void;
}

export class ApprovalQueue extends EventEmitter<ApprovalQueueEvents> {
  private logger: Logger;
  private queue: Map<string, ApprovalRequest>;
  private maxPendingItems: number;
  private autoExpireHours: number;
  private expirationTimer: ReturnType<typeof setInterval> | null = null;
  private requestCount = 0;

  constructor(config: ApprovalQueueConfig = {}) {
    super();
    this.logger = new Logger("ApprovalQueue");
    this.queue = new Map();
    this.maxPendingItems = config.maxPendingItems ?? 50;
    this.autoExpireHours = config.autoExpireHours ?? 24;

    // Start expiration checker
    this.startExpirationChecker();
  }

  /**
   * Add a decision to the approval queue
   */
  add(decision: Decision): ApprovalRequest {
    this.requestCount++;

    const request: ApprovalRequest = {
      id: `apr_${Date.now()}_${this.requestCount}`,
      decision,
      priority: this.calculatePriority(decision),
      urgency: decision.action.metadata.urgency,
      expiresAt: Date.now() + this.autoExpireHours * 60 * 60 * 1000,
      notificationsSent: [],
      status: "pending",
      createdAt: Date.now(),
    };

    // Check queue limit
    if (this.queue.size >= this.maxPendingItems) {
      // Remove lowest priority expired or oldest
      this.removeLowestPriority();
    }

    this.queue.set(request.id, request);

    this.logger.info(`Added to queue: ${decision.action.type}`, {
      requestId: request.id,
      priority: request.priority,
      urgency: request.urgency,
    });

    this.emit("item:added", request);
    this.emit("queue:changed", this.queue.size);

    return request;
  }

  /**
   * Approve a request
   */
  approve(requestId: string, approvedBy = "human", feedback?: string): ApprovalRequest | null {
    const request = this.queue.get(requestId);
    if (!request) {
      this.logger.warn(`Request not found: ${requestId}`);
      return null;
    }

    request.status = "approved";
    request.reviewedBy = approvedBy;
    request.reviewedAt = Date.now();
    request.feedback = feedback;

    // Update decision
    request.decision.approvedBy = approvedBy;
    request.decision.approvedAt = Date.now();
    request.decision.outcome = "auto_execute"; // Now approved for execution

    this.queue.delete(requestId);

    this.logger.info(`Approved: ${request.decision.action.type}`, {
      requestId,
      approvedBy,
    });

    this.emit("item:approved", request, approvedBy);
    this.emit("queue:changed", this.queue.size);

    return request;
  }

  /**
   * Reject a request
   */
  reject(requestId: string, reason: string, rejectedBy = "human"): ApprovalRequest | null {
    const request = this.queue.get(requestId);
    if (!request) {
      this.logger.warn(`Request not found: ${requestId}`);
      return null;
    }

    request.status = "rejected";
    request.reviewedBy = rejectedBy;
    request.reviewedAt = Date.now();
    request.feedback = reason;

    // Update decision
    request.decision.outcome = "reject";

    this.queue.delete(requestId);

    this.logger.info(`Rejected: ${request.decision.action.type}`, {
      requestId,
      reason,
    });

    this.emit("item:rejected", request, reason);
    this.emit("queue:changed", this.queue.size);

    return request;
  }

  /**
   * Get a request by ID
   */
  get(requestId: string): ApprovalRequest | undefined {
    return this.queue.get(requestId);
  }

  /**
   * Get all pending requests, sorted by priority
   */
  getPending(): ApprovalRequest[] {
    return Array.from(this.queue.values())
      .filter((r) => r.status === "pending")
      .sort((a, b) => b.priority - a.priority);
  }

  /**
   * Get pending requests by urgency
   */
  getByUrgency(urgency: Urgency): ApprovalRequest[] {
    return this.getPending().filter((r) => r.urgency === urgency);
  }

  /**
   * Get queue statistics
   */
  getStats(): {
    total: number;
    pending: number;
    byUrgency: Record<Urgency, number>;
    oldestAge: number;
    avgWaitTime: number;
  } {
    const pending = this.getPending();
    const byUrgency: Record<Urgency, number> = {
      low: 0,
      normal: 0,
      high: 0,
      critical: 0,
    };

    let totalAge = 0;
    const now = Date.now();

    for (const request of pending) {
      byUrgency[request.urgency]++;
      totalAge += now - request.createdAt;
    }

    const oldestAge =
      pending.length > 0 ? now - pending[pending.length - 1].createdAt : 0;
    const avgWaitTime = pending.length > 0 ? totalAge / pending.length : 0;

    return {
      total: this.queue.size,
      pending: pending.length,
      byUrgency,
      oldestAge,
      avgWaitTime,
    };
  }

  /**
   * Check for items that need escalation
   */
  checkEscalations(): ApprovalRequest[] {
    const escalated: ApprovalRequest[] = [];
    const now = Date.now();

    for (const request of this.queue.values()) {
      if (request.status !== "pending") continue;

      const ageHours = (now - request.createdAt) / (60 * 60 * 1000);

      // Check age-based escalation
      if (ageHours >= ESCALATION_RULES.ageHoursBeforeEscalation) {
        if (!request.notificationsSent.includes("escalation")) {
          request.notificationsSent.push("escalation");
          escalated.push(request);
          this.emit("item:escalated", request);
        }
      }

      // Check auto-reject
      if (ageHours >= ESCALATION_RULES.ageHoursBeforeAutoReject) {
        this.reject(request.id, "Auto-rejected due to age");
      }

      // Check critical risk escalation
      if (
        ESCALATION_RULES.criticalRiskAutoEscalate &&
        request.decision.assessment.level === "critical"
      ) {
        if (!request.notificationsSent.includes("critical_escalation")) {
          request.notificationsSent.push("critical_escalation");
          escalated.push(request);
          this.emit("item:escalated", request);
        }
      }
    }

    return escalated;
  }

  /**
   * Mark notification as sent
   */
  markNotificationSent(requestId: string, channel: string): void {
    const request = this.queue.get(requestId);
    if (request && !request.notificationsSent.includes(channel)) {
      request.notificationsSent.push(channel);
    }
  }

  /**
   * Get count of pending items
   */
  get size(): number {
    return this.getPending().length;
  }

  /**
   * Clear all pending items
   */
  clear(): void {
    this.queue.clear();
    this.emit("queue:changed", 0);
  }

  /**
   * Stop the queue (cleanup)
   */
  stop(): void {
    if (this.expirationTimer) {
      clearInterval(this.expirationTimer);
      this.expirationTimer = null;
    }
  }

  // Private methods

  private calculatePriority(decision: Decision): number {
    const urgencyScore = URGENCY_PRIORITY[decision.action.metadata.urgency] ?? 1;
    const riskScore = this.riskLevelToScore(decision.assessment.level);
    const valueScore = Math.min(
      (decision.action.metadata.estimatedValue ?? 0) / 10,
      10
    );

    return urgencyScore * 10 + riskScore + valueScore;
  }

  private riskLevelToScore(level: string): number {
    const scores: Record<string, number> = {
      safe: 1,
      low: 2,
      medium: 5,
      high: 8,
      critical: 10,
    };
    return scores[level] ?? 5;
  }

  private removeLowestPriority(): void {
    const pending = this.getPending();
    if (pending.length === 0) return;

    // Remove lowest priority (last in sorted array)
    const lowest = pending[pending.length - 1];
    this.queue.delete(lowest.id);
    this.emit("item:expired", lowest);
    this.logger.info(`Removed lowest priority item: ${lowest.id}`);
  }

  private startExpirationChecker(): void {
    // Check every hour
    this.expirationTimer = setInterval(() => {
      this.checkExpirations();
      this.checkEscalations();
    }, 60 * 60 * 1000);
  }

  private checkExpirations(): void {
    const now = Date.now();
    const expired: string[] = [];

    for (const [id, request] of this.queue) {
      if (request.status === "pending" && request.expiresAt < now) {
        expired.push(id);
        request.status = "expired";
        this.emit("item:expired", request);
      }
    }

    for (const id of expired) {
      this.queue.delete(id);
    }

    if (expired.length > 0) {
      this.logger.info(`Expired ${expired.length} items`);
      this.emit("queue:changed", this.queue.size);
    }
  }
}
