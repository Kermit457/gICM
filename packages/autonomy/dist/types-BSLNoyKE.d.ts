import { z } from 'zod';

/**
 * Core Types for Level 2 Autonomy
 *
 * Zod schemas + TypeScript types for actions, decisions, boundaries
 */

declare const RiskLevelSchema: z.ZodEnum<["safe", "low", "medium", "high", "critical"]>;
type RiskLevel = z.infer<typeof RiskLevelSchema>;
declare const DecisionOutcomeSchema: z.ZodEnum<["auto_execute", "queue_approval", "escalate", "reject"]>;
type DecisionOutcome = z.infer<typeof DecisionOutcomeSchema>;
declare const ActionCategorySchema: z.ZodEnum<["trading", "content", "build", "deployment", "configuration"]>;
type ActionCategory = z.infer<typeof ActionCategorySchema>;
declare const EngineTypeSchema: z.ZodEnum<["money", "growth", "product", "orchestrator"]>;
type EngineType = z.infer<typeof EngineTypeSchema>;
declare const UrgencySchema: z.ZodEnum<["low", "normal", "high", "critical"]>;
type Urgency = z.infer<typeof UrgencySchema>;
declare const ActionMetadataSchema: z.ZodObject<{
    estimatedValue: z.ZodOptional<z.ZodNumber>;
    reversible: z.ZodBoolean;
    urgency: z.ZodEnum<["low", "normal", "high", "critical"]>;
    dependencies: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    linesChanged: z.ZodOptional<z.ZodNumber>;
    filesChanged: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    reversible: boolean;
    urgency: "low" | "high" | "critical" | "normal";
    estimatedValue?: number | undefined;
    dependencies?: string[] | undefined;
    linesChanged?: number | undefined;
    filesChanged?: number | undefined;
}, {
    reversible: boolean;
    urgency: "low" | "high" | "critical" | "normal";
    estimatedValue?: number | undefined;
    dependencies?: string[] | undefined;
    linesChanged?: number | undefined;
    filesChanged?: number | undefined;
}>;
type ActionMetadata = z.infer<typeof ActionMetadataSchema>;
declare const ActionSchema: z.ZodObject<{
    id: z.ZodString;
    engine: z.ZodEnum<["money", "growth", "product", "orchestrator"]>;
    category: z.ZodEnum<["trading", "content", "build", "deployment", "configuration"]>;
    type: z.ZodString;
    description: z.ZodString;
    params: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    metadata: z.ZodObject<{
        estimatedValue: z.ZodOptional<z.ZodNumber>;
        reversible: z.ZodBoolean;
        urgency: z.ZodEnum<["low", "normal", "high", "critical"]>;
        dependencies: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        linesChanged: z.ZodOptional<z.ZodNumber>;
        filesChanged: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        reversible: boolean;
        urgency: "low" | "high" | "critical" | "normal";
        estimatedValue?: number | undefined;
        dependencies?: string[] | undefined;
        linesChanged?: number | undefined;
        filesChanged?: number | undefined;
    }, {
        reversible: boolean;
        urgency: "low" | "high" | "critical" | "normal";
        estimatedValue?: number | undefined;
        dependencies?: string[] | undefined;
        linesChanged?: number | undefined;
        filesChanged?: number | undefined;
    }>;
    timestamp: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    params: Record<string, unknown>;
    type: string;
    id: string;
    engine: "money" | "growth" | "product" | "orchestrator";
    category: "content" | "trading" | "build" | "deployment" | "configuration";
    description: string;
    metadata: {
        reversible: boolean;
        urgency: "low" | "high" | "critical" | "normal";
        estimatedValue?: number | undefined;
        dependencies?: string[] | undefined;
        linesChanged?: number | undefined;
        filesChanged?: number | undefined;
    };
    timestamp: number;
}, {
    params: Record<string, unknown>;
    type: string;
    id: string;
    engine: "money" | "growth" | "product" | "orchestrator";
    category: "content" | "trading" | "build" | "deployment" | "configuration";
    description: string;
    metadata: {
        reversible: boolean;
        urgency: "low" | "high" | "critical" | "normal";
        estimatedValue?: number | undefined;
        dependencies?: string[] | undefined;
        linesChanged?: number | undefined;
        filesChanged?: number | undefined;
    };
    timestamp: number;
}>;
type Action = z.infer<typeof ActionSchema>;
declare const RiskFactorSchema: z.ZodObject<{
    name: z.ZodString;
    weight: z.ZodNumber;
    value: z.ZodNumber;
    threshold: z.ZodNumber;
    exceeded: z.ZodBoolean;
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    value: number;
    name: string;
    weight: number;
    threshold: number;
    exceeded: boolean;
    reason: string;
}, {
    value: number;
    name: string;
    weight: number;
    threshold: number;
    exceeded: boolean;
    reason: string;
}>;
type RiskFactor = z.infer<typeof RiskFactorSchema>;
declare const RiskAssessmentSchema: z.ZodObject<{
    actionId: z.ZodString;
    level: z.ZodEnum<["safe", "low", "medium", "high", "critical"]>;
    score: z.ZodNumber;
    factors: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        weight: z.ZodNumber;
        value: z.ZodNumber;
        threshold: z.ZodNumber;
        exceeded: z.ZodBoolean;
        reason: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        value: number;
        name: string;
        weight: number;
        threshold: number;
        exceeded: boolean;
        reason: string;
    }, {
        value: number;
        name: string;
        weight: number;
        threshold: number;
        exceeded: boolean;
        reason: string;
    }>, "many">;
    recommendation: z.ZodEnum<["auto_execute", "queue_approval", "escalate", "reject"]>;
    constraints: z.ZodArray<z.ZodString, "many">;
    timestamp: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    actionId: string;
    timestamp: number;
    level: "safe" | "low" | "medium" | "high" | "critical";
    score: number;
    factors: {
        value: number;
        name: string;
        weight: number;
        threshold: number;
        exceeded: boolean;
        reason: string;
    }[];
    recommendation: "auto_execute" | "queue_approval" | "escalate" | "reject";
    constraints: string[];
}, {
    actionId: string;
    timestamp: number;
    level: "safe" | "low" | "medium" | "high" | "critical";
    score: number;
    factors: {
        value: number;
        name: string;
        weight: number;
        threshold: number;
        exceeded: boolean;
        reason: string;
    }[];
    recommendation: "auto_execute" | "queue_approval" | "escalate" | "reject";
    constraints: string[];
}>;
type RiskAssessment = z.infer<typeof RiskAssessmentSchema>;
declare const DecisionSchema: z.ZodObject<{
    id: z.ZodString;
    actionId: z.ZodString;
    action: z.ZodObject<{
        id: z.ZodString;
        engine: z.ZodEnum<["money", "growth", "product", "orchestrator"]>;
        category: z.ZodEnum<["trading", "content", "build", "deployment", "configuration"]>;
        type: z.ZodString;
        description: z.ZodString;
        params: z.ZodRecord<z.ZodString, z.ZodUnknown>;
        metadata: z.ZodObject<{
            estimatedValue: z.ZodOptional<z.ZodNumber>;
            reversible: z.ZodBoolean;
            urgency: z.ZodEnum<["low", "normal", "high", "critical"]>;
            dependencies: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            linesChanged: z.ZodOptional<z.ZodNumber>;
            filesChanged: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            reversible: boolean;
            urgency: "low" | "high" | "critical" | "normal";
            estimatedValue?: number | undefined;
            dependencies?: string[] | undefined;
            linesChanged?: number | undefined;
            filesChanged?: number | undefined;
        }, {
            reversible: boolean;
            urgency: "low" | "high" | "critical" | "normal";
            estimatedValue?: number | undefined;
            dependencies?: string[] | undefined;
            linesChanged?: number | undefined;
            filesChanged?: number | undefined;
        }>;
        timestamp: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        params: Record<string, unknown>;
        type: string;
        id: string;
        engine: "money" | "growth" | "product" | "orchestrator";
        category: "content" | "trading" | "build" | "deployment" | "configuration";
        description: string;
        metadata: {
            reversible: boolean;
            urgency: "low" | "high" | "critical" | "normal";
            estimatedValue?: number | undefined;
            dependencies?: string[] | undefined;
            linesChanged?: number | undefined;
            filesChanged?: number | undefined;
        };
        timestamp: number;
    }, {
        params: Record<string, unknown>;
        type: string;
        id: string;
        engine: "money" | "growth" | "product" | "orchestrator";
        category: "content" | "trading" | "build" | "deployment" | "configuration";
        description: string;
        metadata: {
            reversible: boolean;
            urgency: "low" | "high" | "critical" | "normal";
            estimatedValue?: number | undefined;
            dependencies?: string[] | undefined;
            linesChanged?: number | undefined;
            filesChanged?: number | undefined;
        };
        timestamp: number;
    }>;
    assessment: z.ZodObject<{
        actionId: z.ZodString;
        level: z.ZodEnum<["safe", "low", "medium", "high", "critical"]>;
        score: z.ZodNumber;
        factors: z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            weight: z.ZodNumber;
            value: z.ZodNumber;
            threshold: z.ZodNumber;
            exceeded: z.ZodBoolean;
            reason: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            value: number;
            name: string;
            weight: number;
            threshold: number;
            exceeded: boolean;
            reason: string;
        }, {
            value: number;
            name: string;
            weight: number;
            threshold: number;
            exceeded: boolean;
            reason: string;
        }>, "many">;
        recommendation: z.ZodEnum<["auto_execute", "queue_approval", "escalate", "reject"]>;
        constraints: z.ZodArray<z.ZodString, "many">;
        timestamp: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        actionId: string;
        timestamp: number;
        level: "safe" | "low" | "medium" | "high" | "critical";
        score: number;
        factors: {
            value: number;
            name: string;
            weight: number;
            threshold: number;
            exceeded: boolean;
            reason: string;
        }[];
        recommendation: "auto_execute" | "queue_approval" | "escalate" | "reject";
        constraints: string[];
    }, {
        actionId: string;
        timestamp: number;
        level: "safe" | "low" | "medium" | "high" | "critical";
        score: number;
        factors: {
            value: number;
            name: string;
            weight: number;
            threshold: number;
            exceeded: boolean;
            reason: string;
        }[];
        recommendation: "auto_execute" | "queue_approval" | "escalate" | "reject";
        constraints: string[];
    }>;
    outcome: z.ZodEnum<["auto_execute", "queue_approval", "escalate", "reject"]>;
    reason: z.ZodString;
    policyId: z.ZodOptional<z.ZodString>;
    approvedBy: z.ZodOptional<z.ZodString>;
    approvedAt: z.ZodOptional<z.ZodNumber>;
    executedAt: z.ZodOptional<z.ZodNumber>;
    rollbackAvailable: z.ZodBoolean;
    timestamp: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    id: string;
    actionId: string;
    timestamp: number;
    action: {
        params: Record<string, unknown>;
        type: string;
        id: string;
        engine: "money" | "growth" | "product" | "orchestrator";
        category: "content" | "trading" | "build" | "deployment" | "configuration";
        description: string;
        metadata: {
            reversible: boolean;
            urgency: "low" | "high" | "critical" | "normal";
            estimatedValue?: number | undefined;
            dependencies?: string[] | undefined;
            linesChanged?: number | undefined;
            filesChanged?: number | undefined;
        };
        timestamp: number;
    };
    reason: string;
    assessment: {
        actionId: string;
        timestamp: number;
        level: "safe" | "low" | "medium" | "high" | "critical";
        score: number;
        factors: {
            value: number;
            name: string;
            weight: number;
            threshold: number;
            exceeded: boolean;
            reason: string;
        }[];
        recommendation: "auto_execute" | "queue_approval" | "escalate" | "reject";
        constraints: string[];
    };
    outcome: "auto_execute" | "queue_approval" | "escalate" | "reject";
    rollbackAvailable: boolean;
    policyId?: string | undefined;
    approvedBy?: string | undefined;
    approvedAt?: number | undefined;
    executedAt?: number | undefined;
}, {
    id: string;
    actionId: string;
    timestamp: number;
    action: {
        params: Record<string, unknown>;
        type: string;
        id: string;
        engine: "money" | "growth" | "product" | "orchestrator";
        category: "content" | "trading" | "build" | "deployment" | "configuration";
        description: string;
        metadata: {
            reversible: boolean;
            urgency: "low" | "high" | "critical" | "normal";
            estimatedValue?: number | undefined;
            dependencies?: string[] | undefined;
            linesChanged?: number | undefined;
            filesChanged?: number | undefined;
        };
        timestamp: number;
    };
    reason: string;
    assessment: {
        actionId: string;
        timestamp: number;
        level: "safe" | "low" | "medium" | "high" | "critical";
        score: number;
        factors: {
            value: number;
            name: string;
            weight: number;
            threshold: number;
            exceeded: boolean;
            reason: string;
        }[];
        recommendation: "auto_execute" | "queue_approval" | "escalate" | "reject";
        constraints: string[];
    };
    outcome: "auto_execute" | "queue_approval" | "escalate" | "reject";
    rollbackAvailable: boolean;
    policyId?: string | undefined;
    approvedBy?: string | undefined;
    approvedAt?: number | undefined;
    executedAt?: number | undefined;
}>;
type Decision = z.infer<typeof DecisionSchema>;
declare const FinancialBoundariesSchema: z.ZodObject<{
    maxAutoExpense: z.ZodDefault<z.ZodNumber>;
    maxQueuedExpense: z.ZodDefault<z.ZodNumber>;
    maxDailySpend: z.ZodDefault<z.ZodNumber>;
    maxTradeSize: z.ZodDefault<z.ZodNumber>;
    maxDailyTradingLossPercent: z.ZodDefault<z.ZodNumber>;
    minTreasuryBalance: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    maxAutoExpense: number;
    maxQueuedExpense: number;
    maxDailySpend: number;
    maxTradeSize: number;
    maxDailyTradingLossPercent: number;
    minTreasuryBalance: number;
}, {
    maxAutoExpense?: number | undefined;
    maxQueuedExpense?: number | undefined;
    maxDailySpend?: number | undefined;
    maxTradeSize?: number | undefined;
    maxDailyTradingLossPercent?: number | undefined;
    minTreasuryBalance?: number | undefined;
}>;
type FinancialBoundaries = z.infer<typeof FinancialBoundariesSchema>;
declare const ContentBoundariesSchema: z.ZodObject<{
    maxAutoPostsPerDay: z.ZodDefault<z.ZodNumber>;
    maxAutoBlogsPerWeek: z.ZodDefault<z.ZodNumber>;
    requireReviewForTopics: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    maxAutoPostsPerDay: number;
    maxAutoBlogsPerWeek: number;
    requireReviewForTopics: string[];
}, {
    maxAutoPostsPerDay?: number | undefined;
    maxAutoBlogsPerWeek?: number | undefined;
    requireReviewForTopics?: string[] | undefined;
}>;
type ContentBoundaries = z.infer<typeof ContentBoundariesSchema>;
declare const DevelopmentBoundariesSchema: z.ZodObject<{
    maxAutoCommitLines: z.ZodDefault<z.ZodNumber>;
    maxAutoFilesChanged: z.ZodDefault<z.ZodNumber>;
    requireReviewForPaths: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    autoDeployToStaging: z.ZodDefault<z.ZodBoolean>;
    autoDeployToProduction: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    maxAutoCommitLines: number;
    maxAutoFilesChanged: number;
    requireReviewForPaths: string[];
    autoDeployToStaging: boolean;
    autoDeployToProduction: boolean;
}, {
    maxAutoCommitLines?: number | undefined;
    maxAutoFilesChanged?: number | undefined;
    requireReviewForPaths?: string[] | undefined;
    autoDeployToStaging?: boolean | undefined;
    autoDeployToProduction?: boolean | undefined;
}>;
type DevelopmentBoundaries = z.infer<typeof DevelopmentBoundariesSchema>;
declare const TradingBoundariesSchema: z.ZodObject<{
    allowedBots: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    allowedTokens: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    maxPositionPercent: z.ZodDefault<z.ZodNumber>;
    requireApprovalForNewTokens: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    allowedBots: string[];
    allowedTokens: string[];
    maxPositionPercent: number;
    requireApprovalForNewTokens: boolean;
}, {
    allowedBots?: string[] | undefined;
    allowedTokens?: string[] | undefined;
    maxPositionPercent?: number | undefined;
    requireApprovalForNewTokens?: boolean | undefined;
}>;
type TradingBoundaries = z.infer<typeof TradingBoundariesSchema>;
declare const TimeBoundariesSchema: z.ZodObject<{
    activeHoursStart: z.ZodDefault<z.ZodNumber>;
    activeHoursEnd: z.ZodDefault<z.ZodNumber>;
    quietHoursStart: z.ZodDefault<z.ZodNumber>;
    quietHoursEnd: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    activeHoursStart: number;
    activeHoursEnd: number;
    quietHoursStart: number;
    quietHoursEnd: number;
}, {
    activeHoursStart?: number | undefined;
    activeHoursEnd?: number | undefined;
    quietHoursStart?: number | undefined;
    quietHoursEnd?: number | undefined;
}>;
type TimeBoundaries = z.infer<typeof TimeBoundariesSchema>;
declare const BoundariesSchema: z.ZodObject<{
    financial: z.ZodObject<{
        maxAutoExpense: z.ZodDefault<z.ZodNumber>;
        maxQueuedExpense: z.ZodDefault<z.ZodNumber>;
        maxDailySpend: z.ZodDefault<z.ZodNumber>;
        maxTradeSize: z.ZodDefault<z.ZodNumber>;
        maxDailyTradingLossPercent: z.ZodDefault<z.ZodNumber>;
        minTreasuryBalance: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        maxAutoExpense: number;
        maxQueuedExpense: number;
        maxDailySpend: number;
        maxTradeSize: number;
        maxDailyTradingLossPercent: number;
        minTreasuryBalance: number;
    }, {
        maxAutoExpense?: number | undefined;
        maxQueuedExpense?: number | undefined;
        maxDailySpend?: number | undefined;
        maxTradeSize?: number | undefined;
        maxDailyTradingLossPercent?: number | undefined;
        minTreasuryBalance?: number | undefined;
    }>;
    content: z.ZodObject<{
        maxAutoPostsPerDay: z.ZodDefault<z.ZodNumber>;
        maxAutoBlogsPerWeek: z.ZodDefault<z.ZodNumber>;
        requireReviewForTopics: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        maxAutoPostsPerDay: number;
        maxAutoBlogsPerWeek: number;
        requireReviewForTopics: string[];
    }, {
        maxAutoPostsPerDay?: number | undefined;
        maxAutoBlogsPerWeek?: number | undefined;
        requireReviewForTopics?: string[] | undefined;
    }>;
    development: z.ZodObject<{
        maxAutoCommitLines: z.ZodDefault<z.ZodNumber>;
        maxAutoFilesChanged: z.ZodDefault<z.ZodNumber>;
        requireReviewForPaths: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        autoDeployToStaging: z.ZodDefault<z.ZodBoolean>;
        autoDeployToProduction: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        maxAutoCommitLines: number;
        maxAutoFilesChanged: number;
        requireReviewForPaths: string[];
        autoDeployToStaging: boolean;
        autoDeployToProduction: boolean;
    }, {
        maxAutoCommitLines?: number | undefined;
        maxAutoFilesChanged?: number | undefined;
        requireReviewForPaths?: string[] | undefined;
        autoDeployToStaging?: boolean | undefined;
        autoDeployToProduction?: boolean | undefined;
    }>;
    trading: z.ZodObject<{
        allowedBots: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        allowedTokens: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        maxPositionPercent: z.ZodDefault<z.ZodNumber>;
        requireApprovalForNewTokens: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        allowedBots: string[];
        allowedTokens: string[];
        maxPositionPercent: number;
        requireApprovalForNewTokens: boolean;
    }, {
        allowedBots?: string[] | undefined;
        allowedTokens?: string[] | undefined;
        maxPositionPercent?: number | undefined;
        requireApprovalForNewTokens?: boolean | undefined;
    }>;
    time: z.ZodObject<{
        activeHoursStart: z.ZodDefault<z.ZodNumber>;
        activeHoursEnd: z.ZodDefault<z.ZodNumber>;
        quietHoursStart: z.ZodDefault<z.ZodNumber>;
        quietHoursEnd: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        activeHoursStart: number;
        activeHoursEnd: number;
        quietHoursStart: number;
        quietHoursEnd: number;
    }, {
        activeHoursStart?: number | undefined;
        activeHoursEnd?: number | undefined;
        quietHoursStart?: number | undefined;
        quietHoursEnd?: number | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    content: {
        maxAutoPostsPerDay: number;
        maxAutoBlogsPerWeek: number;
        requireReviewForTopics: string[];
    };
    trading: {
        allowedBots: string[];
        allowedTokens: string[];
        maxPositionPercent: number;
        requireApprovalForNewTokens: boolean;
    };
    financial: {
        maxAutoExpense: number;
        maxQueuedExpense: number;
        maxDailySpend: number;
        maxTradeSize: number;
        maxDailyTradingLossPercent: number;
        minTreasuryBalance: number;
    };
    development: {
        maxAutoCommitLines: number;
        maxAutoFilesChanged: number;
        requireReviewForPaths: string[];
        autoDeployToStaging: boolean;
        autoDeployToProduction: boolean;
    };
    time: {
        activeHoursStart: number;
        activeHoursEnd: number;
        quietHoursStart: number;
        quietHoursEnd: number;
    };
}, {
    content: {
        maxAutoPostsPerDay?: number | undefined;
        maxAutoBlogsPerWeek?: number | undefined;
        requireReviewForTopics?: string[] | undefined;
    };
    trading: {
        allowedBots?: string[] | undefined;
        allowedTokens?: string[] | undefined;
        maxPositionPercent?: number | undefined;
        requireApprovalForNewTokens?: boolean | undefined;
    };
    financial: {
        maxAutoExpense?: number | undefined;
        maxQueuedExpense?: number | undefined;
        maxDailySpend?: number | undefined;
        maxTradeSize?: number | undefined;
        maxDailyTradingLossPercent?: number | undefined;
        minTreasuryBalance?: number | undefined;
    };
    development: {
        maxAutoCommitLines?: number | undefined;
        maxAutoFilesChanged?: number | undefined;
        requireReviewForPaths?: string[] | undefined;
        autoDeployToStaging?: boolean | undefined;
        autoDeployToProduction?: boolean | undefined;
    };
    time: {
        activeHoursStart?: number | undefined;
        activeHoursEnd?: number | undefined;
        quietHoursStart?: number | undefined;
        quietHoursEnd?: number | undefined;
    };
}>;
type Boundaries = z.infer<typeof BoundariesSchema>;
declare const DailyUsageSchema: z.ZodObject<{
    trades: z.ZodDefault<z.ZodNumber>;
    content: z.ZodDefault<z.ZodNumber>;
    builds: z.ZodDefault<z.ZodNumber>;
    spending: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    trades: number;
    content: number;
    builds: number;
    spending: number;
}, {
    trades?: number | undefined;
    content?: number | undefined;
    builds?: number | undefined;
    spending?: number | undefined;
}>;
type DailyUsage = z.infer<typeof DailyUsageSchema>;
declare const BoundaryCheckResultSchema: z.ZodObject<{
    passed: z.ZodBoolean;
    violations: z.ZodArray<z.ZodString, "many">;
    warnings: z.ZodArray<z.ZodString, "many">;
    usageToday: z.ZodObject<{
        trades: z.ZodDefault<z.ZodNumber>;
        content: z.ZodDefault<z.ZodNumber>;
        builds: z.ZodDefault<z.ZodNumber>;
        spending: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        trades: number;
        content: number;
        builds: number;
        spending: number;
    }, {
        trades?: number | undefined;
        content?: number | undefined;
        builds?: number | undefined;
        spending?: number | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    passed: boolean;
    violations: string[];
    warnings: string[];
    usageToday: {
        trades: number;
        content: number;
        builds: number;
        spending: number;
    };
}, {
    passed: boolean;
    violations: string[];
    warnings: string[];
    usageToday: {
        trades?: number | undefined;
        content?: number | undefined;
        builds?: number | undefined;
        spending?: number | undefined;
    };
}>;
type BoundaryCheckResult = z.infer<typeof BoundaryCheckResultSchema>;
declare const ApprovalStatusSchema: z.ZodEnum<["pending", "approved", "rejected", "expired"]>;
type ApprovalStatus = z.infer<typeof ApprovalStatusSchema>;
declare const ApprovalRequestSchema: z.ZodObject<{
    id: z.ZodString;
    decision: z.ZodObject<{
        id: z.ZodString;
        actionId: z.ZodString;
        action: z.ZodObject<{
            id: z.ZodString;
            engine: z.ZodEnum<["money", "growth", "product", "orchestrator"]>;
            category: z.ZodEnum<["trading", "content", "build", "deployment", "configuration"]>;
            type: z.ZodString;
            description: z.ZodString;
            params: z.ZodRecord<z.ZodString, z.ZodUnknown>;
            metadata: z.ZodObject<{
                estimatedValue: z.ZodOptional<z.ZodNumber>;
                reversible: z.ZodBoolean;
                urgency: z.ZodEnum<["low", "normal", "high", "critical"]>;
                dependencies: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                linesChanged: z.ZodOptional<z.ZodNumber>;
                filesChanged: z.ZodOptional<z.ZodNumber>;
            }, "strip", z.ZodTypeAny, {
                reversible: boolean;
                urgency: "low" | "high" | "critical" | "normal";
                estimatedValue?: number | undefined;
                dependencies?: string[] | undefined;
                linesChanged?: number | undefined;
                filesChanged?: number | undefined;
            }, {
                reversible: boolean;
                urgency: "low" | "high" | "critical" | "normal";
                estimatedValue?: number | undefined;
                dependencies?: string[] | undefined;
                linesChanged?: number | undefined;
                filesChanged?: number | undefined;
            }>;
            timestamp: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            params: Record<string, unknown>;
            type: string;
            id: string;
            engine: "money" | "growth" | "product" | "orchestrator";
            category: "content" | "trading" | "build" | "deployment" | "configuration";
            description: string;
            metadata: {
                reversible: boolean;
                urgency: "low" | "high" | "critical" | "normal";
                estimatedValue?: number | undefined;
                dependencies?: string[] | undefined;
                linesChanged?: number | undefined;
                filesChanged?: number | undefined;
            };
            timestamp: number;
        }, {
            params: Record<string, unknown>;
            type: string;
            id: string;
            engine: "money" | "growth" | "product" | "orchestrator";
            category: "content" | "trading" | "build" | "deployment" | "configuration";
            description: string;
            metadata: {
                reversible: boolean;
                urgency: "low" | "high" | "critical" | "normal";
                estimatedValue?: number | undefined;
                dependencies?: string[] | undefined;
                linesChanged?: number | undefined;
                filesChanged?: number | undefined;
            };
            timestamp: number;
        }>;
        assessment: z.ZodObject<{
            actionId: z.ZodString;
            level: z.ZodEnum<["safe", "low", "medium", "high", "critical"]>;
            score: z.ZodNumber;
            factors: z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                weight: z.ZodNumber;
                value: z.ZodNumber;
                threshold: z.ZodNumber;
                exceeded: z.ZodBoolean;
                reason: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                value: number;
                name: string;
                weight: number;
                threshold: number;
                exceeded: boolean;
                reason: string;
            }, {
                value: number;
                name: string;
                weight: number;
                threshold: number;
                exceeded: boolean;
                reason: string;
            }>, "many">;
            recommendation: z.ZodEnum<["auto_execute", "queue_approval", "escalate", "reject"]>;
            constraints: z.ZodArray<z.ZodString, "many">;
            timestamp: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            actionId: string;
            timestamp: number;
            level: "safe" | "low" | "medium" | "high" | "critical";
            score: number;
            factors: {
                value: number;
                name: string;
                weight: number;
                threshold: number;
                exceeded: boolean;
                reason: string;
            }[];
            recommendation: "auto_execute" | "queue_approval" | "escalate" | "reject";
            constraints: string[];
        }, {
            actionId: string;
            timestamp: number;
            level: "safe" | "low" | "medium" | "high" | "critical";
            score: number;
            factors: {
                value: number;
                name: string;
                weight: number;
                threshold: number;
                exceeded: boolean;
                reason: string;
            }[];
            recommendation: "auto_execute" | "queue_approval" | "escalate" | "reject";
            constraints: string[];
        }>;
        outcome: z.ZodEnum<["auto_execute", "queue_approval", "escalate", "reject"]>;
        reason: z.ZodString;
        policyId: z.ZodOptional<z.ZodString>;
        approvedBy: z.ZodOptional<z.ZodString>;
        approvedAt: z.ZodOptional<z.ZodNumber>;
        executedAt: z.ZodOptional<z.ZodNumber>;
        rollbackAvailable: z.ZodBoolean;
        timestamp: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        id: string;
        actionId: string;
        timestamp: number;
        action: {
            params: Record<string, unknown>;
            type: string;
            id: string;
            engine: "money" | "growth" | "product" | "orchestrator";
            category: "content" | "trading" | "build" | "deployment" | "configuration";
            description: string;
            metadata: {
                reversible: boolean;
                urgency: "low" | "high" | "critical" | "normal";
                estimatedValue?: number | undefined;
                dependencies?: string[] | undefined;
                linesChanged?: number | undefined;
                filesChanged?: number | undefined;
            };
            timestamp: number;
        };
        reason: string;
        assessment: {
            actionId: string;
            timestamp: number;
            level: "safe" | "low" | "medium" | "high" | "critical";
            score: number;
            factors: {
                value: number;
                name: string;
                weight: number;
                threshold: number;
                exceeded: boolean;
                reason: string;
            }[];
            recommendation: "auto_execute" | "queue_approval" | "escalate" | "reject";
            constraints: string[];
        };
        outcome: "auto_execute" | "queue_approval" | "escalate" | "reject";
        rollbackAvailable: boolean;
        policyId?: string | undefined;
        approvedBy?: string | undefined;
        approvedAt?: number | undefined;
        executedAt?: number | undefined;
    }, {
        id: string;
        actionId: string;
        timestamp: number;
        action: {
            params: Record<string, unknown>;
            type: string;
            id: string;
            engine: "money" | "growth" | "product" | "orchestrator";
            category: "content" | "trading" | "build" | "deployment" | "configuration";
            description: string;
            metadata: {
                reversible: boolean;
                urgency: "low" | "high" | "critical" | "normal";
                estimatedValue?: number | undefined;
                dependencies?: string[] | undefined;
                linesChanged?: number | undefined;
                filesChanged?: number | undefined;
            };
            timestamp: number;
        };
        reason: string;
        assessment: {
            actionId: string;
            timestamp: number;
            level: "safe" | "low" | "medium" | "high" | "critical";
            score: number;
            factors: {
                value: number;
                name: string;
                weight: number;
                threshold: number;
                exceeded: boolean;
                reason: string;
            }[];
            recommendation: "auto_execute" | "queue_approval" | "escalate" | "reject";
            constraints: string[];
        };
        outcome: "auto_execute" | "queue_approval" | "escalate" | "reject";
        rollbackAvailable: boolean;
        policyId?: string | undefined;
        approvedBy?: string | undefined;
        approvedAt?: number | undefined;
        executedAt?: number | undefined;
    }>;
    priority: z.ZodNumber;
    urgency: z.ZodEnum<["low", "normal", "high", "critical"]>;
    expiresAt: z.ZodNumber;
    notificationsSent: z.ZodArray<z.ZodString, "many">;
    status: z.ZodEnum<["pending", "approved", "rejected", "expired"]>;
    reviewedBy: z.ZodOptional<z.ZodString>;
    reviewedAt: z.ZodOptional<z.ZodNumber>;
    feedback: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    status: "approved" | "rejected" | "pending" | "expired";
    id: string;
    urgency: "low" | "high" | "critical" | "normal";
    decision: {
        id: string;
        actionId: string;
        timestamp: number;
        action: {
            params: Record<string, unknown>;
            type: string;
            id: string;
            engine: "money" | "growth" | "product" | "orchestrator";
            category: "content" | "trading" | "build" | "deployment" | "configuration";
            description: string;
            metadata: {
                reversible: boolean;
                urgency: "low" | "high" | "critical" | "normal";
                estimatedValue?: number | undefined;
                dependencies?: string[] | undefined;
                linesChanged?: number | undefined;
                filesChanged?: number | undefined;
            };
            timestamp: number;
        };
        reason: string;
        assessment: {
            actionId: string;
            timestamp: number;
            level: "safe" | "low" | "medium" | "high" | "critical";
            score: number;
            factors: {
                value: number;
                name: string;
                weight: number;
                threshold: number;
                exceeded: boolean;
                reason: string;
            }[];
            recommendation: "auto_execute" | "queue_approval" | "escalate" | "reject";
            constraints: string[];
        };
        outcome: "auto_execute" | "queue_approval" | "escalate" | "reject";
        rollbackAvailable: boolean;
        policyId?: string | undefined;
        approvedBy?: string | undefined;
        approvedAt?: number | undefined;
        executedAt?: number | undefined;
    };
    priority: number;
    expiresAt: number;
    notificationsSent: string[];
    createdAt: number;
    reviewedBy?: string | undefined;
    reviewedAt?: number | undefined;
    feedback?: string | undefined;
}, {
    status: "approved" | "rejected" | "pending" | "expired";
    id: string;
    urgency: "low" | "high" | "critical" | "normal";
    decision: {
        id: string;
        actionId: string;
        timestamp: number;
        action: {
            params: Record<string, unknown>;
            type: string;
            id: string;
            engine: "money" | "growth" | "product" | "orchestrator";
            category: "content" | "trading" | "build" | "deployment" | "configuration";
            description: string;
            metadata: {
                reversible: boolean;
                urgency: "low" | "high" | "critical" | "normal";
                estimatedValue?: number | undefined;
                dependencies?: string[] | undefined;
                linesChanged?: number | undefined;
                filesChanged?: number | undefined;
            };
            timestamp: number;
        };
        reason: string;
        assessment: {
            actionId: string;
            timestamp: number;
            level: "safe" | "low" | "medium" | "high" | "critical";
            score: number;
            factors: {
                value: number;
                name: string;
                weight: number;
                threshold: number;
                exceeded: boolean;
                reason: string;
            }[];
            recommendation: "auto_execute" | "queue_approval" | "escalate" | "reject";
            constraints: string[];
        };
        outcome: "auto_execute" | "queue_approval" | "escalate" | "reject";
        rollbackAvailable: boolean;
        policyId?: string | undefined;
        approvedBy?: string | undefined;
        approvedAt?: number | undefined;
        executedAt?: number | undefined;
    };
    priority: number;
    expiresAt: number;
    notificationsSent: string[];
    createdAt: number;
    reviewedBy?: string | undefined;
    reviewedAt?: number | undefined;
    feedback?: string | undefined;
}>;
type ApprovalRequest = z.infer<typeof ApprovalRequestSchema>;
declare const ExecutionResultSchema: z.ZodObject<{
    actionId: z.ZodString;
    decisionId: z.ZodString;
    success: z.ZodBoolean;
    output: z.ZodOptional<z.ZodUnknown>;
    error: z.ZodOptional<z.ZodString>;
    executedAt: z.ZodNumber;
    duration: z.ZodNumber;
    rolledBack: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    actionId: string;
    executedAt: number;
    decisionId: string;
    success: boolean;
    duration: number;
    rolledBack: boolean;
    output?: unknown;
    error?: string | undefined;
}, {
    actionId: string;
    executedAt: number;
    decisionId: string;
    success: boolean;
    duration: number;
    output?: unknown;
    error?: string | undefined;
    rolledBack?: boolean | undefined;
}>;
type ExecutionResult = z.infer<typeof ExecutionResultSchema>;
declare const RollbackCheckpointSchema: z.ZodObject<{
    id: z.ZodString;
    actionId: z.ZodString;
    decisionId: z.ZodString;
    state: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    createdAt: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    id: string;
    actionId: string;
    createdAt: number;
    decisionId: string;
    state: Record<string, unknown>;
}, {
    id: string;
    actionId: string;
    createdAt: number;
    decisionId: string;
    state: Record<string, unknown>;
}>;
type RollbackCheckpoint = z.infer<typeof RollbackCheckpointSchema>;
declare const AuditEntryTypeSchema: z.ZodEnum<["action_received", "risk_assessed", "decision_made", "queued_approval", "approved", "rejected", "executed", "execution_failed", "rolled_back", "boundary_violation", "escalated"]>;
type AuditEntryType = z.infer<typeof AuditEntryTypeSchema>;
declare const AuditEntrySchema: z.ZodObject<{
    id: z.ZodString;
    timestamp: z.ZodNumber;
    type: z.ZodEnum<["action_received", "risk_assessed", "decision_made", "queued_approval", "approved", "rejected", "executed", "execution_failed", "rolled_back", "boundary_violation", "escalated"]>;
    actionId: z.ZodString;
    decisionId: z.ZodOptional<z.ZodString>;
    data: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    hash: z.ZodString;
    previousHash: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "approved" | "executed" | "rejected" | "escalated" | "action_received" | "risk_assessed" | "decision_made" | "queued_approval" | "execution_failed" | "rolled_back" | "boundary_violation";
    id: string;
    actionId: string;
    timestamp: number;
    data: Record<string, unknown>;
    hash: string;
    previousHash: string;
    decisionId?: string | undefined;
}, {
    type: "approved" | "executed" | "rejected" | "escalated" | "action_received" | "risk_assessed" | "decision_made" | "queued_approval" | "execution_failed" | "rolled_back" | "boundary_violation";
    id: string;
    actionId: string;
    timestamp: number;
    data: Record<string, unknown>;
    hash: string;
    previousHash: string;
    decisionId?: string | undefined;
}>;
type AuditEntry = z.infer<typeof AuditEntrySchema>;
declare const NotificationChannelTypeSchema: z.ZodEnum<["discord", "telegram", "slack", "email"]>;
type NotificationChannelType = z.infer<typeof NotificationChannelTypeSchema>;
declare const NotificationChannelSchema: z.ZodObject<{
    type: z.ZodEnum<["discord", "telegram", "slack", "email"]>;
    enabled: z.ZodBoolean;
    config: z.ZodObject<{
        webhookUrl: z.ZodOptional<z.ZodString>;
        botToken: z.ZodOptional<z.ZodString>;
        chatId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        webhookUrl?: string | undefined;
        botToken?: string | undefined;
        chatId?: string | undefined;
    }, {
        webhookUrl?: string | undefined;
        botToken?: string | undefined;
        chatId?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    type: "discord" | "telegram" | "slack" | "email";
    enabled: boolean;
    config: {
        webhookUrl?: string | undefined;
        botToken?: string | undefined;
        chatId?: string | undefined;
    };
}, {
    type: "discord" | "telegram" | "slack" | "email";
    enabled: boolean;
    config: {
        webhookUrl?: string | undefined;
        botToken?: string | undefined;
        chatId?: string | undefined;
    };
}>;
type NotificationChannel = z.infer<typeof NotificationChannelSchema>;
declare const AutonomyConfigSchema: z.ZodObject<{
    enabled: z.ZodDefault<z.ZodBoolean>;
    level: z.ZodDefault<z.ZodNumber>;
    boundaries: z.ZodObject<{
        financial: z.ZodObject<{
            maxAutoExpense: z.ZodDefault<z.ZodNumber>;
            maxQueuedExpense: z.ZodDefault<z.ZodNumber>;
            maxDailySpend: z.ZodDefault<z.ZodNumber>;
            maxTradeSize: z.ZodDefault<z.ZodNumber>;
            maxDailyTradingLossPercent: z.ZodDefault<z.ZodNumber>;
            minTreasuryBalance: z.ZodDefault<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            maxAutoExpense: number;
            maxQueuedExpense: number;
            maxDailySpend: number;
            maxTradeSize: number;
            maxDailyTradingLossPercent: number;
            minTreasuryBalance: number;
        }, {
            maxAutoExpense?: number | undefined;
            maxQueuedExpense?: number | undefined;
            maxDailySpend?: number | undefined;
            maxTradeSize?: number | undefined;
            maxDailyTradingLossPercent?: number | undefined;
            minTreasuryBalance?: number | undefined;
        }>;
        content: z.ZodObject<{
            maxAutoPostsPerDay: z.ZodDefault<z.ZodNumber>;
            maxAutoBlogsPerWeek: z.ZodDefault<z.ZodNumber>;
            requireReviewForTopics: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            maxAutoPostsPerDay: number;
            maxAutoBlogsPerWeek: number;
            requireReviewForTopics: string[];
        }, {
            maxAutoPostsPerDay?: number | undefined;
            maxAutoBlogsPerWeek?: number | undefined;
            requireReviewForTopics?: string[] | undefined;
        }>;
        development: z.ZodObject<{
            maxAutoCommitLines: z.ZodDefault<z.ZodNumber>;
            maxAutoFilesChanged: z.ZodDefault<z.ZodNumber>;
            requireReviewForPaths: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
            autoDeployToStaging: z.ZodDefault<z.ZodBoolean>;
            autoDeployToProduction: z.ZodDefault<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            maxAutoCommitLines: number;
            maxAutoFilesChanged: number;
            requireReviewForPaths: string[];
            autoDeployToStaging: boolean;
            autoDeployToProduction: boolean;
        }, {
            maxAutoCommitLines?: number | undefined;
            maxAutoFilesChanged?: number | undefined;
            requireReviewForPaths?: string[] | undefined;
            autoDeployToStaging?: boolean | undefined;
            autoDeployToProduction?: boolean | undefined;
        }>;
        trading: z.ZodObject<{
            allowedBots: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
            allowedTokens: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
            maxPositionPercent: z.ZodDefault<z.ZodNumber>;
            requireApprovalForNewTokens: z.ZodDefault<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            allowedBots: string[];
            allowedTokens: string[];
            maxPositionPercent: number;
            requireApprovalForNewTokens: boolean;
        }, {
            allowedBots?: string[] | undefined;
            allowedTokens?: string[] | undefined;
            maxPositionPercent?: number | undefined;
            requireApprovalForNewTokens?: boolean | undefined;
        }>;
        time: z.ZodObject<{
            activeHoursStart: z.ZodDefault<z.ZodNumber>;
            activeHoursEnd: z.ZodDefault<z.ZodNumber>;
            quietHoursStart: z.ZodDefault<z.ZodNumber>;
            quietHoursEnd: z.ZodDefault<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            activeHoursStart: number;
            activeHoursEnd: number;
            quietHoursStart: number;
            quietHoursEnd: number;
        }, {
            activeHoursStart?: number | undefined;
            activeHoursEnd?: number | undefined;
            quietHoursStart?: number | undefined;
            quietHoursEnd?: number | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        content: {
            maxAutoPostsPerDay: number;
            maxAutoBlogsPerWeek: number;
            requireReviewForTopics: string[];
        };
        trading: {
            allowedBots: string[];
            allowedTokens: string[];
            maxPositionPercent: number;
            requireApprovalForNewTokens: boolean;
        };
        financial: {
            maxAutoExpense: number;
            maxQueuedExpense: number;
            maxDailySpend: number;
            maxTradeSize: number;
            maxDailyTradingLossPercent: number;
            minTreasuryBalance: number;
        };
        development: {
            maxAutoCommitLines: number;
            maxAutoFilesChanged: number;
            requireReviewForPaths: string[];
            autoDeployToStaging: boolean;
            autoDeployToProduction: boolean;
        };
        time: {
            activeHoursStart: number;
            activeHoursEnd: number;
            quietHoursStart: number;
            quietHoursEnd: number;
        };
    }, {
        content: {
            maxAutoPostsPerDay?: number | undefined;
            maxAutoBlogsPerWeek?: number | undefined;
            requireReviewForTopics?: string[] | undefined;
        };
        trading: {
            allowedBots?: string[] | undefined;
            allowedTokens?: string[] | undefined;
            maxPositionPercent?: number | undefined;
            requireApprovalForNewTokens?: boolean | undefined;
        };
        financial: {
            maxAutoExpense?: number | undefined;
            maxQueuedExpense?: number | undefined;
            maxDailySpend?: number | undefined;
            maxTradeSize?: number | undefined;
            maxDailyTradingLossPercent?: number | undefined;
            minTreasuryBalance?: number | undefined;
        };
        development: {
            maxAutoCommitLines?: number | undefined;
            maxAutoFilesChanged?: number | undefined;
            requireReviewForPaths?: string[] | undefined;
            autoDeployToStaging?: boolean | undefined;
            autoDeployToProduction?: boolean | undefined;
        };
        time: {
            activeHoursStart?: number | undefined;
            activeHoursEnd?: number | undefined;
            quietHoursStart?: number | undefined;
            quietHoursEnd?: number | undefined;
        };
    }>;
    notifications: z.ZodObject<{
        channels: z.ZodDefault<z.ZodArray<z.ZodObject<{
            type: z.ZodEnum<["discord", "telegram", "slack", "email"]>;
            enabled: z.ZodBoolean;
            config: z.ZodObject<{
                webhookUrl: z.ZodOptional<z.ZodString>;
                botToken: z.ZodOptional<z.ZodString>;
                chatId: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                webhookUrl?: string | undefined;
                botToken?: string | undefined;
                chatId?: string | undefined;
            }, {
                webhookUrl?: string | undefined;
                botToken?: string | undefined;
                chatId?: string | undefined;
            }>;
        }, "strip", z.ZodTypeAny, {
            type: "discord" | "telegram" | "slack" | "email";
            enabled: boolean;
            config: {
                webhookUrl?: string | undefined;
                botToken?: string | undefined;
                chatId?: string | undefined;
            };
        }, {
            type: "discord" | "telegram" | "slack" | "email";
            enabled: boolean;
            config: {
                webhookUrl?: string | undefined;
                botToken?: string | undefined;
                chatId?: string | undefined;
            };
        }>, "many">>;
        rateLimitPerMinute: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        channels: {
            type: "discord" | "telegram" | "slack" | "email";
            enabled: boolean;
            config: {
                webhookUrl?: string | undefined;
                botToken?: string | undefined;
                chatId?: string | undefined;
            };
        }[];
        rateLimitPerMinute: number;
    }, {
        channels?: {
            type: "discord" | "telegram" | "slack" | "email";
            enabled: boolean;
            config: {
                webhookUrl?: string | undefined;
                botToken?: string | undefined;
                chatId?: string | undefined;
            };
        }[] | undefined;
        rateLimitPerMinute?: number | undefined;
    }>;
    approval: z.ZodObject<{
        maxPendingItems: z.ZodDefault<z.ZodNumber>;
        autoExpireHours: z.ZodDefault<z.ZodNumber>;
        notifyOnNewItem: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        maxPendingItems: number;
        autoExpireHours: number;
        notifyOnNewItem: boolean;
    }, {
        maxPendingItems?: number | undefined;
        autoExpireHours?: number | undefined;
        notifyOnNewItem?: boolean | undefined;
    }>;
    audit: z.ZodObject<{
        retentionDays: z.ZodDefault<z.ZodNumber>;
        storageDir: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        retentionDays: number;
        storageDir: string;
    }, {
        retentionDays?: number | undefined;
        storageDir?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    boundaries: {
        content: {
            maxAutoPostsPerDay: number;
            maxAutoBlogsPerWeek: number;
            requireReviewForTopics: string[];
        };
        trading: {
            allowedBots: string[];
            allowedTokens: string[];
            maxPositionPercent: number;
            requireApprovalForNewTokens: boolean;
        };
        financial: {
            maxAutoExpense: number;
            maxQueuedExpense: number;
            maxDailySpend: number;
            maxTradeSize: number;
            maxDailyTradingLossPercent: number;
            minTreasuryBalance: number;
        };
        development: {
            maxAutoCommitLines: number;
            maxAutoFilesChanged: number;
            requireReviewForPaths: string[];
            autoDeployToStaging: boolean;
            autoDeployToProduction: boolean;
        };
        time: {
            activeHoursStart: number;
            activeHoursEnd: number;
            quietHoursStart: number;
            quietHoursEnd: number;
        };
    };
    audit: {
        retentionDays: number;
        storageDir: string;
    };
    level: number;
    enabled: boolean;
    notifications: {
        channels: {
            type: "discord" | "telegram" | "slack" | "email";
            enabled: boolean;
            config: {
                webhookUrl?: string | undefined;
                botToken?: string | undefined;
                chatId?: string | undefined;
            };
        }[];
        rateLimitPerMinute: number;
    };
    approval: {
        maxPendingItems: number;
        autoExpireHours: number;
        notifyOnNewItem: boolean;
    };
}, {
    boundaries: {
        content: {
            maxAutoPostsPerDay?: number | undefined;
            maxAutoBlogsPerWeek?: number | undefined;
            requireReviewForTopics?: string[] | undefined;
        };
        trading: {
            allowedBots?: string[] | undefined;
            allowedTokens?: string[] | undefined;
            maxPositionPercent?: number | undefined;
            requireApprovalForNewTokens?: boolean | undefined;
        };
        financial: {
            maxAutoExpense?: number | undefined;
            maxQueuedExpense?: number | undefined;
            maxDailySpend?: number | undefined;
            maxTradeSize?: number | undefined;
            maxDailyTradingLossPercent?: number | undefined;
            minTreasuryBalance?: number | undefined;
        };
        development: {
            maxAutoCommitLines?: number | undefined;
            maxAutoFilesChanged?: number | undefined;
            requireReviewForPaths?: string[] | undefined;
            autoDeployToStaging?: boolean | undefined;
            autoDeployToProduction?: boolean | undefined;
        };
        time: {
            activeHoursStart?: number | undefined;
            activeHoursEnd?: number | undefined;
            quietHoursStart?: number | undefined;
            quietHoursEnd?: number | undefined;
        };
    };
    audit: {
        retentionDays?: number | undefined;
        storageDir?: string | undefined;
    };
    notifications: {
        channels?: {
            type: "discord" | "telegram" | "slack" | "email";
            enabled: boolean;
            config: {
                webhookUrl?: string | undefined;
                botToken?: string | undefined;
                chatId?: string | undefined;
            };
        }[] | undefined;
        rateLimitPerMinute?: number | undefined;
    };
    approval: {
        maxPendingItems?: number | undefined;
        autoExpireHours?: number | undefined;
        notifyOnNewItem?: boolean | undefined;
    };
    level?: number | undefined;
    enabled?: boolean | undefined;
}>;
type AutonomyConfig = z.infer<typeof AutonomyConfigSchema>;

export { AutonomyConfigSchema as $, type AutonomyConfig as A, type Boundaries as B, ContentBoundariesSchema as C, type Decision as D, type ExecutionResult as E, FinancialBoundariesSchema as F, BoundariesSchema as G, DailyUsageSchema as H, BoundaryCheckResultSchema as I, type BoundaryCheckResult as J, ApprovalStatusSchema as K, type ApprovalStatus as L, ApprovalRequestSchema as M, ExecutionResultSchema as N, RollbackCheckpointSchema as O, type RollbackCheckpoint as P, AuditEntryTypeSchema as Q, type RiskLevel as R, type AuditEntryType as S, TradingBoundariesSchema as T, type Urgency as U, AuditEntrySchema as V, type AuditEntry as W, NotificationChannelTypeSchema as X, type NotificationChannelType as Y, NotificationChannelSchema as Z, type NotificationChannel as _, type ActionCategory as a, type Action as b, type ApprovalRequest as c, type DailyUsage as d, RiskLevelSchema as e, DecisionOutcomeSchema as f, type DecisionOutcome as g, ActionCategorySchema as h, EngineTypeSchema as i, type EngineType as j, UrgencySchema as k, ActionMetadataSchema as l, type ActionMetadata as m, ActionSchema as n, RiskFactorSchema as o, type RiskFactor as p, RiskAssessmentSchema as q, type RiskAssessment as r, DecisionSchema as s, type FinancialBoundaries as t, type ContentBoundaries as u, DevelopmentBoundariesSchema as v, type DevelopmentBoundaries as w, type TradingBoundaries as x, TimeBoundariesSchema as y, type TimeBoundaries as z };
