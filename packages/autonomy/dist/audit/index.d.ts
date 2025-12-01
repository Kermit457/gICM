import { b as Action, W as AuditEntry, D as Decision, c as ApprovalRequest, E as ExecutionResult, S as AuditEntryType } from '../types-BSLNoyKE.js';
import 'zod';

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

interface AuditLoggerConfig {
    /** Maximum entries to keep in memory */
    maxEntries?: number;
    /** Retention period in days */
    retentionDays?: number;
}
declare class AuditLogger {
    private logger;
    private entries;
    private maxEntries;
    private retentionDays;
    private lastHash;
    private entryCount;
    constructor(config?: AuditLoggerConfig);
    /**
     * Log action received
     */
    logActionReceived(action: Action): AuditEntry;
    /**
     * Log risk assessment
     */
    logRiskAssessed(action: Action, decision: Decision): AuditEntry;
    /**
     * Log decision made
     */
    logDecisionMade(decision: Decision): AuditEntry;
    /**
     * Log action queued for approval
     */
    logQueuedApproval(request: ApprovalRequest): AuditEntry;
    /**
     * Log approval granted
     */
    logApproved(request: ApprovalRequest): AuditEntry;
    /**
     * Log rejection
     */
    logRejected(request: ApprovalRequest, reason: string): AuditEntry;
    /**
     * Log execution completed
     */
    logExecuted(result: ExecutionResult): AuditEntry;
    /**
     * Log execution failed
     */
    logExecutionFailed(result: ExecutionResult): AuditEntry;
    /**
     * Log rollback
     */
    logRolledBack(actionId: string, decisionId: string): AuditEntry;
    /**
     * Log boundary violation
     */
    logBoundaryViolation(action: Action, violations: string[]): AuditEntry;
    /**
     * Log escalation
     */
    logEscalated(request: ApprovalRequest): AuditEntry;
    /**
     * Get all entries
     */
    getEntries(): AuditEntry[];
    /**
     * Get entries by action ID
     */
    getByActionId(actionId: string): AuditEntry[];
    /**
     * Get entries by type
     */
    getByType(type: AuditEntryType): AuditEntry[];
    /**
     * Get entries in time range
     */
    getByTimeRange(startTime: number, endTime: number): AuditEntry[];
    /**
     * Verify integrity of audit chain
     */
    verifyIntegrity(): {
        valid: boolean;
        brokenAt?: number;
    };
    /**
     * Get statistics
     */
    getStats(): {
        totalEntries: number;
        byType: Record<string, number>;
        oldestEntry: number | null;
        newestEntry: number | null;
    };
    /**
     * Clear all entries
     */
    clear(): void;
    /**
     * Export entries as JSON
     */
    export(): string;
    private log;
    private calculateHash;
    private cleanup;
}

export { AuditLogger, type AuditLoggerConfig };
