/**
 * Constants for Level 2 Autonomy
 *
 * Risk weights, thresholds, and category defaults
 */

import type { ActionCategory, RiskLevel } from "./types.js";

// ============================================================================
// RISK SCORING
// ============================================================================

/**
 * Risk factors and their weights (must sum to 1.0)
 */
export const RISK_FACTOR_WEIGHTS = {
  financialValue: 0.35,      // How much money is involved
  reversibility: 0.20,       // Can this be undone?
  categoryRisk: 0.15,        // Base risk of this category
  urgency: 0.15,             // Time sensitivity
  externalVisibility: 0.15,  // Public-facing actions
} as const;

/**
 * Score thresholds for risk levels
 */
export const RISK_SCORE_THRESHOLDS = {
  safe: 20,      // 0-20: auto-execute
  low: 40,       // 21-40: auto with logging
  medium: 60,    // 41-60: queue for batch
  high: 80,      // 61-80: require approval
  // 81-100: critical - escalate immediately
} as const;

/**
 * Base risk scores by category
 */
export const CATEGORY_BASE_RISK: Record<ActionCategory, number> = {
  content: 15,       // Low risk - tweets, blogs
  build: 35,         // Medium risk - code changes
  trading: 55,       // Higher risk - money involved
  deployment: 70,    // High risk - production changes
  configuration: 85, // Very high risk - system settings
};

/**
 * Financial value thresholds for risk escalation
 */
export const FINANCIAL_RISK_THRESHOLDS = {
  negligible: 10,    // Under $10 - no risk added
  low: 50,           // $10-50 - +10 risk
  medium: 100,       // $50-100 - +20 risk
  high: 500,         // $100-500 - +35 risk
  critical: 1000,    // Over $1000 - +50 risk
} as const;

// ============================================================================
// DECISION ROUTING
// ============================================================================

/**
 * Default outcome by risk level for Level 2 autonomy
 */
export const RISK_LEVEL_OUTCOMES: Record<RiskLevel, string> = {
  safe: "auto_execute",
  low: "auto_execute",
  medium: "queue_approval",
  high: "queue_approval",
  critical: "escalate",
};

/**
 * Categories that always require approval regardless of score
 */
export const ALWAYS_REQUIRE_APPROVAL: ActionCategory[] = [
  "deployment",
  "configuration",
];

/**
 * Action types that can always auto-execute (override category risk)
 */
export const SAFE_ACTION_TYPES = [
  "dca_buy",
  "tweet_post",
  "blog_draft",
  "small_commit",
  "log_activity",
] as const;

/**
 * Action types that always require human approval
 */
export const DANGEROUS_ACTION_TYPES = [
  "deploy_production",
  "delete_data",
  "transfer_funds",
  "change_api_keys",
  "modify_permissions",
] as const;

// ============================================================================
// APPROVAL QUEUE
// ============================================================================

/**
 * Priority multipliers by urgency
 */
export const URGENCY_PRIORITY: Record<string, number> = {
  low: 1,
  normal: 2,
  high: 5,
  critical: 10,
};

/**
 * Escalation rules
 */
export const ESCALATION_RULES = {
  ageHoursBeforeEscalation: 12,
  ageHoursBeforeAutoReject: 48,
  criticalRiskAutoEscalate: true,
  highValueAutoEscalate: 200, // USD
} as const;

// ============================================================================
// RATE LIMITS
// ============================================================================

export const RATE_LIMITS = {
  maxActionsPerMinute: 30,
  maxNotificationsPerMinute: 10,
  maxAutoExecutionsPerHour: 100,
  cooldownAfterFailureMs: 60000, // 1 minute cooldown after failed action
} as const;

// ============================================================================
// AUDIT
// ============================================================================

export const AUDIT_CONFIG = {
  hashAlgorithm: "sha256",
  retentionDays: 90,
  maxEntriesInMemory: 1000,
} as const;
