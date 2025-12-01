// src/core/constants.ts
var RISK_FACTOR_WEIGHTS = {
  financialValue: 0.35,
  // How much money is involved
  reversibility: 0.2,
  // Can this be undone?
  categoryRisk: 0.15,
  // Base risk of this category
  urgency: 0.15,
  // Time sensitivity
  externalVisibility: 0.15
  // Public-facing actions
};
var RISK_SCORE_THRESHOLDS = {
  safe: 20,
  // 0-20: auto-execute
  low: 40,
  // 21-40: auto with logging
  medium: 60,
  // 41-60: queue for batch
  high: 80
  // 61-80: require approval
  // 81-100: critical - escalate immediately
};
var CATEGORY_BASE_RISK = {
  content: 15,
  // Low risk - tweets, blogs
  build: 35,
  // Medium risk - code changes
  trading: 55,
  // Higher risk - money involved
  deployment: 70,
  // High risk - production changes
  configuration: 85
  // Very high risk - system settings
};
var FINANCIAL_RISK_THRESHOLDS = {
  negligible: 10,
  // Under $10 - no risk added
  low: 50,
  // $10-50 - +10 risk
  medium: 100,
  // $50-100 - +20 risk
  high: 500,
  // $100-500 - +35 risk
  critical: 1e3
  // Over $1000 - +50 risk
};
var RISK_LEVEL_OUTCOMES = {
  safe: "auto_execute",
  low: "auto_execute",
  medium: "queue_approval",
  high: "queue_approval",
  critical: "escalate"
};
var ALWAYS_REQUIRE_APPROVAL = [
  "deployment",
  "configuration"
];
var SAFE_ACTION_TYPES = [
  "dca_buy",
  "tweet_post",
  "blog_draft",
  "small_commit",
  "log_activity"
];
var DANGEROUS_ACTION_TYPES = [
  "deploy_production",
  "delete_data",
  "transfer_funds",
  "change_api_keys",
  "modify_permissions"
];
var URGENCY_PRIORITY = {
  low: 1,
  normal: 2,
  high: 5,
  critical: 10
};
var ESCALATION_RULES = {
  ageHoursBeforeEscalation: 12,
  ageHoursBeforeAutoReject: 48,
  criticalRiskAutoEscalate: true,
  highValueAutoEscalate: 200
  // USD
};
var RATE_LIMITS = {
  maxActionsPerMinute: 30,
  maxNotificationsPerMinute: 10,
  maxAutoExecutionsPerHour: 100,
  cooldownAfterFailureMs: 6e4
  // 1 minute cooldown after failed action
};
var AUDIT_CONFIG = {
  hashAlgorithm: "sha256",
  retentionDays: 90,
  maxEntriesInMemory: 1e3
};

export {
  RISK_FACTOR_WEIGHTS,
  RISK_SCORE_THRESHOLDS,
  CATEGORY_BASE_RISK,
  FINANCIAL_RISK_THRESHOLDS,
  RISK_LEVEL_OUTCOMES,
  ALWAYS_REQUIRE_APPROVAL,
  SAFE_ACTION_TYPES,
  DANGEROUS_ACTION_TYPES,
  URGENCY_PRIORITY,
  ESCALATION_RULES,
  RATE_LIMITS,
  AUDIT_CONFIG
};
//# sourceMappingURL=chunk-TENKIGAJ.js.map