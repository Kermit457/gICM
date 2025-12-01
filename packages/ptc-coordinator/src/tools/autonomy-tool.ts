/**
 * Autonomy Engine PTC Tool Handler
 *
 * Provides risk classification and approval workflows for PTC pipelines.
 * Gates high-risk operations and enforces boundaries.
 */

import type { ToolDefinition, ToolHandler, SharedContext } from '../types.js';

// Tool Definition for risk classification
export const classifyRiskToolDefinition: ToolDefinition = {
  name: 'autonomy_classify_risk',
  description: `Classify the risk level of an action before execution.

Risk factors considered:
- Financial impact (35%)
- Reversibility (20%)
- Category (15%)
- Urgency (15%)
- Visibility (15%)

Returns risk score 0-100 and recommended action:
- auto_execute (0-20): Safe to proceed
- queue_approval (21-60): Needs human review
- escalate (61-80): Urgent review needed
- reject (81-100): Too risky, blocked`,
  input_schema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        description: 'JSON string describing the action to classify',
      },
      category: {
        type: 'string',
        description: 'Action category: financial, content, development, system',
        enum: ['financial', 'content', 'development', 'system'],
      },
      estimatedImpact: {
        type: 'string',
        description: 'Estimated financial impact in USD (if applicable)',
      },
    },
    required: ['action', 'category'],
  },
};

// Tool Definition for approval queue
export const checkApprovalToolDefinition: ToolDefinition = {
  name: 'autonomy_check_approval',
  description: `Check if an action has been approved or queue it for approval.

Use this before executing any action that was classified as requiring approval.`,
  input_schema: {
    type: 'object',
    properties: {
      actionId: {
        type: 'string',
        description: 'Unique ID for the action',
      },
      action: {
        type: 'string',
        description: 'JSON string describing the action',
      },
      riskScore: {
        type: 'string',
        description: 'Risk score from classify_risk',
      },
      timeout: {
        type: 'string',
        description: 'Timeout in seconds before auto-reject (default: 3600)',
      },
    },
    required: ['actionId', 'action'],
  },
};

// Tool Definition for boundary check
export const checkBoundariesToolDefinition: ToolDefinition = {
  name: 'autonomy_check_boundaries',
  description: `Check if an action is within operational boundaries.

Boundaries include:
- Daily spending limits
- Auto-post limits
- Trade size limits
- Blocked operations`,
  input_schema: {
    type: 'object',
    properties: {
      boundaryType: {
        type: 'string',
        description: 'Boundary type: financial, content, development',
        enum: ['financial', 'content', 'development'],
      },
      value: {
        type: 'string',
        description: 'Value to check against boundary',
      },
      accumulated: {
        type: 'string',
        description: 'Already accumulated value today (if applicable)',
      },
    },
    required: ['boundaryType', 'value'],
  },
};

// Tool Definition for audit logging
export const logAuditToolDefinition: ToolDefinition = {
  name: 'autonomy_log_audit',
  description: `Log an action to the audit trail.

Required for compliance and debugging.
Creates hash-chain integrity for tamper detection.`,
  input_schema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        description: 'JSON string describing the action',
      },
      result: {
        type: 'string',
        description: 'Result: success, failed, skipped, rejected',
        enum: ['success', 'failed', 'skipped', 'rejected'],
      },
      metadata: {
        type: 'string',
        description: 'Additional metadata JSON',
      },
    },
    required: ['action', 'result'],
  },
};

// Tool Definition for getting autonomy status
export const autonomyStatusToolDefinition: ToolDefinition = {
  name: 'autonomy_status',
  description: `Get current autonomy engine status.

Returns:
- Current autonomy level
- Active boundaries
- Pending approvals count
- Today's statistics`,
  input_schema: {
    type: 'object',
    properties: {},
    required: [],
  },
};

// Handler implementations
export const createClassifyRiskHandler = (
  autonomyEngineFactory?: () => Promise<{
    classifyRisk: (action: Record<string, unknown>) => Promise<{
      score: number;
      level: string;
      factors: Record<string, number>;
      recommendation: string;
    }>;
  }>
): ToolHandler => {
  return async (inputs: Record<string, unknown>, _context: SharedContext): Promise<unknown> => {
    const actionStr = inputs.action as string;
    const category = inputs.category as string;
    const estimatedImpactStr = inputs.estimatedImpact as string | undefined;

    try {
      const action = JSON.parse(actionStr);
      const estimatedImpact = estimatedImpactStr ? parseFloat(estimatedImpactStr) : 0;

      // Risk weights
      const weights = {
        financial: 0.35,
        reversibility: 0.20,
        category: 0.15,
        urgency: 0.15,
        visibility: 0.15,
      };

      // Calculate risk factors
      const factors: Record<string, number> = {};

      // Financial risk
      if (estimatedImpact > 0) {
        if (estimatedImpact < 50) factors.financial = 20;
        else if (estimatedImpact < 200) factors.financial = 40;
        else if (estimatedImpact < 500) factors.financial = 60;
        else if (estimatedImpact < 1000) factors.financial = 80;
        else factors.financial = 95;
      } else {
        factors.financial = 10;
      }

      // Category risk
      const categoryRisks: Record<string, number> = {
        financial: 70,
        development: 40,
        content: 25,
        system: 60,
      };
      factors.category = categoryRisks[category] || 50;

      // Reversibility (default assumption based on category)
      const reversibilityScores: Record<string, number> = {
        financial: 80, // Hard to reverse transactions
        development: 30, // Can revert commits
        content: 40, // Can unpublish
        system: 50,
      };
      factors.reversibility = reversibilityScores[category] || 50;

      // Urgency (default to medium)
      factors.urgency = 50;

      // Visibility
      const visibilityScores: Record<string, number> = {
        financial: 30, // Internal
        development: 60, // Affects code
        content: 80, // Public-facing
        system: 40,
      };
      factors.visibility = visibilityScores[category] || 50;

      // Calculate weighted score
      const score = Math.round(
        factors.financial * weights.financial +
        factors.reversibility * weights.reversibility +
        factors.category * weights.category +
        factors.urgency * weights.urgency +
        factors.visibility * weights.visibility
      );

      // Determine recommendation
      let recommendation: string;
      let level: string;

      if (score <= 20) {
        recommendation = 'auto_execute';
        level = 'safe';
      } else if (score <= 40) {
        recommendation = category === 'financial' ? 'queue_approval' : 'auto_execute';
        level = 'low';
      } else if (score <= 60) {
        recommendation = 'queue_approval';
        level = 'medium';
      } else if (score <= 80) {
        recommendation = 'escalate';
        level = 'high';
      } else {
        recommendation = 'reject';
        level = 'critical';
      }

      return {
        success: true,
        risk: {
          score,
          level,
          factors,
          recommendation,
        },
        action: {
          category,
          estimatedImpact,
          ...action,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Risk classification failed',
        risk: null,
      };
    }
  };
};

export const createCheckApprovalHandler = (): ToolHandler => {
  // In-memory approval queue (in production, use persistent storage)
  const approvalQueue = new Map<string, {
    action: Record<string, unknown>;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: number;
    expiresAt: number;
  }>();

  return async (inputs: Record<string, unknown>, _context: SharedContext): Promise<unknown> => {
    const actionId = inputs.actionId as string;
    const actionStr = inputs.action as string;
    const riskScoreStr = inputs.riskScore as string | undefined;
    const timeoutStr = (inputs.timeout as string) || '3600';

    const timeout = parseInt(timeoutStr, 10) * 1000;

    try {
      // Check if already in queue
      const existing = approvalQueue.get(actionId);

      if (existing) {
        // Check if expired
        if (Date.now() > existing.expiresAt) {
          approvalQueue.delete(actionId);
          return {
            success: false,
            approved: false,
            reason: 'Approval request expired',
            actionId,
          };
        }

        return {
          success: true,
          approved: existing.status === 'approved',
          status: existing.status,
          actionId,
          expiresIn: Math.round((existing.expiresAt - Date.now()) / 1000),
        };
      }

      // Queue for approval
      const action = JSON.parse(actionStr);
      const now = Date.now();

      approvalQueue.set(actionId, {
        action,
        status: 'pending',
        createdAt: now,
        expiresAt: now + timeout,
      });

      return {
        success: true,
        approved: false,
        status: 'pending',
        actionId,
        message: 'Action queued for approval',
        riskScore: riskScoreStr ? parseInt(riskScoreStr, 10) : undefined,
        expiresIn: timeout / 1000,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Approval check failed',
        approved: false,
      };
    }
  };
};

export const createCheckBoundariesHandler = (): ToolHandler => {
  // Default boundaries
  const boundaries = {
    financial: {
      maxAutoExpense: 50,
      maxDailySpend: 100,
      maxTradeSize: 500,
    },
    content: {
      maxAutoPostsPerDay: 10,
      maxAutoBlogsPerWeek: 3,
    },
    development: {
      maxAutoCommitLines: 100,
      autoDeployToProduction: false,
    },
  };

  // Track daily usage
  const dailyUsage = new Map<string, number>();

  return async (inputs: Record<string, unknown>, _context: SharedContext): Promise<unknown> => {
    const boundaryType = inputs.boundaryType as string;
    const valueStr = inputs.value as string;
    const accumulatedStr = inputs.accumulated as string | undefined;

    const value = parseFloat(valueStr);
    const accumulated = accumulatedStr ? parseFloat(accumulatedStr) : 0;

    try {
      const typeKey = boundaryType as keyof typeof boundaries;
      const typeBoundaries = boundaries[typeKey];

      if (!typeBoundaries) {
        return {
          success: false,
          error: `Unknown boundary type: ${boundaryType}`,
          withinBoundaries: false,
        };
      }

      const results: Array<{ check: string; limit: number; current: number; passed: boolean }> = [];
      let allPassed = true;

      if (boundaryType === 'financial') {
        const fb = typeBoundaries as typeof boundaries.financial;

        // Check max auto expense
        if (value > fb.maxAutoExpense) {
          results.push({
            check: 'maxAutoExpense',
            limit: fb.maxAutoExpense,
            current: value,
            passed: false,
          });
          allPassed = false;
        } else {
          results.push({
            check: 'maxAutoExpense',
            limit: fb.maxAutoExpense,
            current: value,
            passed: true,
          });
        }

        // Check daily limit
        const today = new Date().toDateString();
        const todaySpend = (dailyUsage.get(today) || 0) + accumulated;

        if (todaySpend + value > fb.maxDailySpend) {
          results.push({
            check: 'maxDailySpend',
            limit: fb.maxDailySpend,
            current: todaySpend + value,
            passed: false,
          });
          allPassed = false;
        } else {
          results.push({
            check: 'maxDailySpend',
            limit: fb.maxDailySpend,
            current: todaySpend + value,
            passed: true,
          });
        }

        // Check trade size
        if (value > fb.maxTradeSize) {
          results.push({
            check: 'maxTradeSize',
            limit: fb.maxTradeSize,
            current: value,
            passed: false,
          });
          allPassed = false;
        } else {
          results.push({
            check: 'maxTradeSize',
            limit: fb.maxTradeSize,
            current: value,
            passed: true,
          });
        }
      }

      if (boundaryType === 'content') {
        const cb = typeBoundaries as typeof boundaries.content;

        // Check daily posts
        const today = new Date().toDateString();
        const postsKey = `posts_${today}`;
        const todayPosts = dailyUsage.get(postsKey) || 0;

        if (todayPosts + value > cb.maxAutoPostsPerDay) {
          results.push({
            check: 'maxAutoPostsPerDay',
            limit: cb.maxAutoPostsPerDay,
            current: todayPosts + value,
            passed: false,
          });
          allPassed = false;
        } else {
          results.push({
            check: 'maxAutoPostsPerDay',
            limit: cb.maxAutoPostsPerDay,
            current: todayPosts + value,
            passed: true,
          });
        }
      }

      return {
        success: true,
        withinBoundaries: allPassed,
        boundaryType,
        value,
        accumulated,
        checks: results,
        boundaries: typeBoundaries,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Boundary check failed',
        withinBoundaries: false,
      };
    }
  };
};

export const createLogAuditHandler = (): ToolHandler => {
  // In-memory audit log (in production, use persistent storage)
  const auditLog: Array<{
    id: string;
    action: Record<string, unknown>;
    result: string;
    metadata: Record<string, unknown>;
    timestamp: string;
    hash: string;
    previousHash: string;
  }> = [];

  let previousHash = '0';

  return async (inputs: Record<string, unknown>, _context: SharedContext): Promise<unknown> => {
    const actionStr = inputs.action as string;
    const result = inputs.result as string;
    const metadataStr = inputs.metadata as string | undefined;

    try {
      const action = JSON.parse(actionStr);
      const metadata = metadataStr ? JSON.parse(metadataStr) : {};

      const entry = {
        id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        action,
        result,
        metadata,
        timestamp: new Date().toISOString(),
        hash: '', // Will be computed
        previousHash,
      };

      // Simple hash (in production, use crypto)
      const dataToHash = JSON.stringify({
        ...entry,
        hash: undefined,
      });
      entry.hash = Buffer.from(dataToHash).toString('base64').slice(0, 32);

      previousHash = entry.hash;
      auditLog.push(entry);

      // Keep only last 1000 entries in memory
      if (auditLog.length > 1000) {
        auditLog.shift();
      }

      return {
        success: true,
        logged: true,
        auditId: entry.id,
        hash: entry.hash,
        timestamp: entry.timestamp,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Audit logging failed',
        logged: false,
      };
    }
  };
};

export const createAutonomyStatusHandler = (
  autonomyEngineFactory?: () => Promise<{
    getStatus: () => Promise<{
      level: number;
      boundaries: Record<string, unknown>;
      pendingApprovals: number;
      todayStats: Record<string, number>;
    }>;
  }>
): ToolHandler => {
  return async (_inputs: Record<string, unknown>, _context: SharedContext): Promise<unknown> => {
    // Default status (when engine not available)
    const defaultStatus = {
      level: 2, // Bounded autonomy
      levelName: 'Bounded',
      boundaries: {
        financial: { maxAutoExpense: 50, maxDailySpend: 100, maxTradeSize: 500 },
        content: { maxAutoPostsPerDay: 10, maxAutoBlogsPerWeek: 3 },
        development: { maxAutoCommitLines: 100, autoDeployToProduction: false },
      },
      pendingApprovals: 0,
      todayStats: {
        actionsExecuted: 0,
        actionsApproved: 0,
        actionsRejected: 0,
        totalSpend: 0,
      },
    };

    try {
      if (autonomyEngineFactory) {
        const engine = await autonomyEngineFactory();
        const status = await engine.getStatus();

        return {
          success: true,
          autonomy: {
            level: status.level,
            levelName: ['Manual', 'Bounded', 'Supervised', 'Autonomous'][status.level - 1] || 'Unknown',
            boundaries: status.boundaries,
            pendingApprovals: status.pendingApprovals,
            todayStats: status.todayStats,
          },
          timestamp: new Date().toISOString(),
        };
      }

      return {
        success: true,
        autonomy: defaultStatus,
        timestamp: new Date().toISOString(),
        note: 'Using default autonomy configuration',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get autonomy status',
        autonomy: defaultStatus,
      };
    }
  };
};

// Export all autonomy tools
export const autonomyTools = {
  definitions: [
    classifyRiskToolDefinition,
    checkApprovalToolDefinition,
    checkBoundariesToolDefinition,
    logAuditToolDefinition,
    autonomyStatusToolDefinition,
  ],
  createHandlers: (autonomyEngineFactory?: () => Promise<any>) => ({
    'autonomy_classify_risk': createClassifyRiskHandler(autonomyEngineFactory),
    'autonomy_check_approval': createCheckApprovalHandler(),
    'autonomy_check_boundaries': createCheckBoundariesHandler(),
    'autonomy_log_audit': createLogAuditHandler(),
    'autonomy_status': createAutonomyStatusHandler(autonomyEngineFactory),
  }),
};
