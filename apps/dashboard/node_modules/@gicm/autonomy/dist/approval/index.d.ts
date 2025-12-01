import { EventEmitter } from 'eventemitter3';
import { c as ApprovalRequest, D as Decision, U as Urgency, a as ActionCategory, R as RiskLevel, _ as NotificationChannel } from '../types-BSLNoyKE.js';
import 'zod';

/**
 * Approval Queue for Level 2 Autonomy
 *
 * Priority queue for pending approvals with:
 * - Priority ordering (risk level, urgency)
 * - Auto-expiration
 * - Batch operations
 */

interface ApprovalQueueConfig {
    maxPendingItems?: number;
    autoExpireHours?: number;
}
interface ApprovalQueueEvents {
    "item:added": (request: ApprovalRequest) => void;
    "item:approved": (request: ApprovalRequest, by: string) => void;
    "item:rejected": (request: ApprovalRequest, reason: string) => void;
    "item:expired": (request: ApprovalRequest) => void;
    "item:escalated": (request: ApprovalRequest) => void;
    "queue:changed": (count: number) => void;
}
declare class ApprovalQueue extends EventEmitter<ApprovalQueueEvents> {
    private logger;
    private queue;
    private maxPendingItems;
    private autoExpireHours;
    private expirationTimer;
    private requestCount;
    constructor(config?: ApprovalQueueConfig);
    /**
     * Add a decision to the approval queue
     */
    add(decision: Decision): ApprovalRequest;
    /**
     * Approve a request
     */
    approve(requestId: string, approvedBy?: string, feedback?: string): ApprovalRequest | null;
    /**
     * Reject a request
     */
    reject(requestId: string, reason: string, rejectedBy?: string): ApprovalRequest | null;
    /**
     * Get a request by ID
     */
    get(requestId: string): ApprovalRequest | undefined;
    /**
     * Get all pending requests, sorted by priority
     */
    getPending(): ApprovalRequest[];
    /**
     * Get pending requests by urgency
     */
    getByUrgency(urgency: Urgency): ApprovalRequest[];
    /**
     * Get queue statistics
     */
    getStats(): {
        total: number;
        pending: number;
        byUrgency: Record<Urgency, number>;
        oldestAge: number;
        avgWaitTime: number;
    };
    /**
     * Check for items that need escalation
     */
    checkEscalations(): ApprovalRequest[];
    /**
     * Mark notification as sent
     */
    markNotificationSent(requestId: string, channel: string): void;
    /**
     * Get count of pending items
     */
    get size(): number;
    /**
     * Clear all pending items
     */
    clear(): void;
    /**
     * Stop the queue (cleanup)
     */
    stop(): void;
    private calculatePriority;
    private riskLevelToScore;
    private removeLowestPriority;
    private startExpirationChecker;
    private checkExpirations;
}

/**
 * Batch Approval for Level 2 Autonomy
 *
 * Enables efficient batch review of pending approvals:
 * - Group by category, risk, or engine
 * - Approve/reject multiple items at once
 * - Summary statistics
 */

interface BatchSummary {
    total: number;
    byCategory: Record<ActionCategory, number>;
    byRisk: Record<RiskLevel, number>;
    byEngine: Record<string, number>;
    totalValue: number;
    oldestAge: number;
    avgScore: number;
}
interface BatchFilter {
    category?: ActionCategory;
    riskLevel?: RiskLevel;
    engine?: string;
    minScore?: number;
    maxScore?: number;
    olderThanHours?: number;
}
declare class BatchApproval {
    private logger;
    private queue;
    constructor(queue: ApprovalQueue);
    /**
     * Get summary of all pending items
     */
    getSummary(): BatchSummary;
    /**
     * Get items matching a filter
     */
    filter(filter: BatchFilter): ApprovalRequest[];
    /**
     * Approve all items matching a filter
     */
    approveFiltered(filter: BatchFilter, approvedBy?: string, feedback?: string): {
        approved: ApprovalRequest[];
        failed: string[];
    };
    /**
     * Reject all items matching a filter
     */
    rejectFiltered(filter: BatchFilter, reason: string, rejectedBy?: string): {
        rejected: ApprovalRequest[];
        failed: string[];
    };
    /**
     * Approve all safe/low risk items
     */
    approveAllSafe(approvedBy?: string): {
        approved: ApprovalRequest[];
    };
    /**
     * Reject all expired or very old items
     */
    cleanupOld(olderThanHours?: number): {
        rejected: ApprovalRequest[];
    };
    /**
     * Get items grouped by category
     */
    groupByCategory(): Record<ActionCategory, ApprovalRequest[]>;
    /**
     * Get items grouped by risk level
     */
    groupByRisk(): Record<RiskLevel, ApprovalRequest[]>;
    /**
     * Get quick actions for common batch operations
     */
    getQuickActions(): {
        approveSafe: () => {
            approved: ApprovalRequest[];
        };
        cleanupOld: () => {
            rejected: ApprovalRequest[];
        };
        approveAll: (by: string) => {
            approved: ApprovalRequest[];
            failed: string[];
        };
        rejectAll: (reason: string) => {
            rejected: ApprovalRequest[];
            failed: string[];
        };
    };
}

/**
 * Notification Manager for Level 2 Autonomy
 *
 * Sends alerts to Discord/Telegram for:
 * - New approval requests
 * - Escalations
 * - Daily summaries
 */

interface NotificationManagerConfig {
    channels: NotificationChannel[];
    rateLimitPerMinute?: number;
}
declare class NotificationManager {
    private logger;
    private channels;
    private rateLimitPerMinute;
    private messageCount;
    private lastResetTime;
    constructor(config: NotificationManagerConfig);
    /**
     * Notify about a new approval request
     */
    notifyApprovalNeeded(request: ApprovalRequest): Promise<boolean>;
    /**
     * Notify about an escalation
     */
    notifyEscalation(request: ApprovalRequest): Promise<boolean>;
    /**
     * Notify about approval decision
     */
    notifyApprovalDecision(request: ApprovalRequest, approved: boolean, reason?: string): Promise<boolean>;
    /**
     * Send daily summary
     */
    sendDailySummary(summary: {
        autoExecuted: number;
        queued: number;
        approved: number;
        rejected: number;
        escalated: number;
        totalValue: number;
    }): Promise<boolean>;
    /**
     * Check if notifications are configured
     */
    isConfigured(): boolean;
    /**
     * Get enabled channels
     */
    getEnabledChannels(): NotificationChannel[];
    private sendToAllChannels;
    private sendDiscord;
    private sendTelegram;
    private sendSlack;
    private formatApprovalRequest;
    private formatEscalation;
    private formatDecision;
    private getRiskEmoji;
    private getTitleColor;
    private checkRateLimit;
}

export { ApprovalQueue, type ApprovalQueueConfig, type ApprovalQueueEvents, BatchApproval, type BatchFilter, type BatchSummary, NotificationManager, type NotificationManagerConfig };
