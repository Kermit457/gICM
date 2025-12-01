/**
 * Batch Approval for Level 2 Autonomy
 *
 * Enables efficient batch review of pending approvals:
 * - Group by category, risk, or engine
 * - Approve/reject multiple items at once
 * - Summary statistics
 */

import type { ApprovalRequest, ActionCategory, RiskLevel } from "../core/types.js";
import { ApprovalQueue } from "./approval-queue.js";
import { Logger } from "../utils/logger.js";

export interface BatchSummary {
  total: number;
  byCategory: Record<ActionCategory, number>;
  byRisk: Record<RiskLevel, number>;
  byEngine: Record<string, number>;
  totalValue: number;
  oldestAge: number;
  avgScore: number;
}

export interface BatchFilter {
  category?: ActionCategory;
  riskLevel?: RiskLevel;
  engine?: string;
  minScore?: number;
  maxScore?: number;
  olderThanHours?: number;
}

export class BatchApproval {
  private logger: Logger;
  private queue: ApprovalQueue;

  constructor(queue: ApprovalQueue) {
    this.logger = new Logger("BatchApproval");
    this.queue = queue;
  }

  /**
   * Get summary of all pending items
   */
  getSummary(): BatchSummary {
    const pending = this.queue.getPending();
    const now = Date.now();

    const byCategory: Record<ActionCategory, number> = {
      trading: 0,
      content: 0,
      build: 0,
      deployment: 0,
      configuration: 0,
    };
    const byRisk: Record<RiskLevel, number> = {
      safe: 0,
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };
    const byEngine: Record<string, number> = {};

    let totalValue = 0;
    let totalScore = 0;
    let oldestAge = 0;

    for (const request of pending) {
      const action = request.decision.action;
      const assessment = request.decision.assessment;

      byCategory[action.category]++;
      byRisk[assessment.level]++;
      byEngine[action.engine] = (byEngine[action.engine] ?? 0) + 1;

      totalValue += action.metadata.estimatedValue ?? 0;
      totalScore += assessment.score;

      const age = now - request.createdAt;
      if (age > oldestAge) oldestAge = age;
    }

    return {
      total: pending.length,
      byCategory,
      byRisk,
      byEngine,
      totalValue,
      oldestAge,
      avgScore: pending.length > 0 ? totalScore / pending.length : 0,
    };
  }

  /**
   * Get items matching a filter
   */
  filter(filter: BatchFilter): ApprovalRequest[] {
    const pending = this.queue.getPending();
    const now = Date.now();

    return pending.filter((request) => {
      const action = request.decision.action;
      const assessment = request.decision.assessment;

      if (filter.category && action.category !== filter.category) return false;
      if (filter.riskLevel && assessment.level !== filter.riskLevel) return false;
      if (filter.engine && action.engine !== filter.engine) return false;
      if (filter.minScore && assessment.score < filter.minScore) return false;
      if (filter.maxScore && assessment.score > filter.maxScore) return false;

      if (filter.olderThanHours) {
        const ageHours = (now - request.createdAt) / (60 * 60 * 1000);
        if (ageHours < filter.olderThanHours) return false;
      }

      return true;
    });
  }

  /**
   * Approve all items matching a filter
   */
  approveFiltered(
    filter: BatchFilter,
    approvedBy = "batch",
    feedback?: string
  ): { approved: ApprovalRequest[]; failed: string[] } {
    const items = this.filter(filter);
    const approved: ApprovalRequest[] = [];
    const failed: string[] = [];

    for (const item of items) {
      const result = this.queue.approve(item.id, approvedBy, feedback);
      if (result) {
        approved.push(result);
      } else {
        failed.push(item.id);
      }
    }

    this.logger.info(`Batch approved ${approved.length} items`, {
      filter,
      failed: failed.length,
    });

    return { approved, failed };
  }

  /**
   * Reject all items matching a filter
   */
  rejectFiltered(
    filter: BatchFilter,
    reason: string,
    rejectedBy = "batch"
  ): { rejected: ApprovalRequest[]; failed: string[] } {
    const items = this.filter(filter);
    const rejected: ApprovalRequest[] = [];
    const failed: string[] = [];

    for (const item of items) {
      const result = this.queue.reject(item.id, reason, rejectedBy);
      if (result) {
        rejected.push(result);
      } else {
        failed.push(item.id);
      }
    }

    this.logger.info(`Batch rejected ${rejected.length} items`, {
      filter,
      reason,
      failed: failed.length,
    });

    return { rejected, failed };
  }

  /**
   * Approve all safe/low risk items
   */
  approveAllSafe(approvedBy = "batch"): { approved: ApprovalRequest[] } {
    const safeItems = this.filter({ riskLevel: "safe" });
    const lowItems = this.filter({ riskLevel: "low" });

    const approved: ApprovalRequest[] = [];

    for (const item of [...safeItems, ...lowItems]) {
      const result = this.queue.approve(item.id, approvedBy, "Auto-approved (low risk)");
      if (result) approved.push(result);
    }

    this.logger.info(`Auto-approved ${approved.length} safe/low risk items`);

    return { approved };
  }

  /**
   * Reject all expired or very old items
   */
  cleanupOld(olderThanHours = 48): { rejected: ApprovalRequest[] } {
    const oldItems = this.filter({ olderThanHours });
    const rejected: ApprovalRequest[] = [];

    for (const item of oldItems) {
      const result = this.queue.reject(item.id, `Auto-rejected: older than ${olderThanHours}h`);
      if (result) rejected.push(result);
    }

    this.logger.info(`Cleaned up ${rejected.length} old items`);

    return { rejected };
  }

  /**
   * Get items grouped by category
   */
  groupByCategory(): Record<ActionCategory, ApprovalRequest[]> {
    const pending = this.queue.getPending();
    const grouped: Record<ActionCategory, ApprovalRequest[]> = {
      trading: [],
      content: [],
      build: [],
      deployment: [],
      configuration: [],
    };

    for (const request of pending) {
      grouped[request.decision.action.category].push(request);
    }

    return grouped;
  }

  /**
   * Get items grouped by risk level
   */
  groupByRisk(): Record<RiskLevel, ApprovalRequest[]> {
    const pending = this.queue.getPending();
    const grouped: Record<RiskLevel, ApprovalRequest[]> = {
      safe: [],
      low: [],
      medium: [],
      high: [],
      critical: [],
    };

    for (const request of pending) {
      grouped[request.decision.assessment.level].push(request);
    }

    return grouped;
  }

  /**
   * Get quick actions for common batch operations
   */
  getQuickActions(): {
    approveSafe: () => { approved: ApprovalRequest[] };
    cleanupOld: () => { rejected: ApprovalRequest[] };
    approveAll: (by: string) => { approved: ApprovalRequest[]; failed: string[] };
    rejectAll: (reason: string) => { rejected: ApprovalRequest[]; failed: string[] };
  } {
    return {
      approveSafe: () => this.approveAllSafe(),
      cleanupOld: () => this.cleanupOld(),
      approveAll: (by) => this.approveFiltered({}, by),
      rejectAll: (reason) => this.rejectFiltered({}, reason),
    };
  }
}
