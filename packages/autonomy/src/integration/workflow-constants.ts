/**
 * Constants for Claude Code Workflow Integration
 *
 * Defines risk scores, safe actions, and boundaries
 * for the ClaudeWorkflowAdapter.
 */

import { ClaudeCodeActionType } from "./workflow-types.js";

// ============================================================================
// Base Risk Scores (0-100)
// ============================================================================

export const CLAUDE_ACTION_BASE_RISK: Record<string, number> = {
  // Safe actions (0-15)
  [ClaudeCodeActionType.ADD_TEST]: 5,
  [ClaudeCodeActionType.FIX_LINT]: 5,
  [ClaudeCodeActionType.UPDATE_DOCS]: 10,
  [ClaudeCodeActionType.ADD_COMMENTS]: 5,
  [ClaudeCodeActionType.FORMAT_CODE]: 3,
  [ClaudeCodeActionType.ADD_TYPE]: 8,
  [ClaudeCodeActionType.UPDATE_README]: 10,
  [ClaudeCodeActionType.ADD_EXAMPLE]: 12,

  // Medium risk (20-45)
  [ClaudeCodeActionType.MODIFY_FUNCTION]: 30,
  [ClaudeCodeActionType.ADD_FEATURE]: 35,
  [ClaudeCodeActionType.REFACTOR]: 40,

  // High risk (50-70)
  [ClaudeCodeActionType.CHANGE_API]: 55,
  [ClaudeCodeActionType.MODIFY_CORE]: 65,
  [ClaudeCodeActionType.MODIFY_CONFIG]: 60,

  // Critical (80-100)
  [ClaudeCodeActionType.PRODUCTION_DEPLOY]: 85,
  [ClaudeCodeActionType.DELETE_DATA]: 95,
  [ClaudeCodeActionType.MODIFY_AUTH]: 90,
};

// ============================================================================
// Context Risk Modifiers
// ============================================================================

export const CONTEXT_RISK_MODIFIERS = {
  /** File is in core infrastructure */
  isCore: 20,
  /** Change affects public API */
  affectsPublicApi: 15,
  /** Change affects database */
  affectsDatabase: 25,
  /** Change affects authentication */
  affectsAuth: 30,
  /** Change affects production */
  affectsProduction: 35,
  /** Large change (>100 lines) */
  largeChange: 10,
  /** Multi-file change (>5 files) */
  multiFile: 15,
};

// ============================================================================
// Safe Actions (Auto-Execute)
// ============================================================================

export const SAFE_CLAUDE_ACTIONS = [
  ClaudeCodeActionType.ADD_TEST,
  ClaudeCodeActionType.FIX_LINT,
  ClaudeCodeActionType.UPDATE_DOCS,
  ClaudeCodeActionType.ADD_COMMENTS,
  ClaudeCodeActionType.FORMAT_CODE,
  ClaudeCodeActionType.ADD_TYPE,
  ClaudeCodeActionType.UPDATE_README,
  ClaudeCodeActionType.ADD_EXAMPLE,
];

// ============================================================================
// Dangerous Actions (Require Escalation)
// ============================================================================

export const DANGEROUS_CLAUDE_ACTIONS = [
  ClaudeCodeActionType.DELETE_DATA,
  ClaudeCodeActionType.MODIFY_AUTH,
  ClaudeCodeActionType.PRODUCTION_DEPLOY,
];

// ============================================================================
// Workflow Boundaries
// ============================================================================

export const DEFAULT_WORKFLOW_BOUNDARIES = {
  /** Max auto improvements per day */
  maxDailyAutoImprovements: 50,
  /** Max auto test additions per day */
  maxDailyAutoTests: 100,
  /** Max auto lint fixes per day */
  maxDailyAutoLintFixes: 200,
  /** Max auto doc updates per day */
  maxDailyAutoDocUpdates: 30,
  /** Max lines changed for auto-execute */
  maxAutoLinesChanged: 100,
  /** Max files changed for auto-execute */
  maxAutoFilesChanged: 5,
  /** Max concurrent workflows */
  maxConcurrentWorkflows: 3,
  /** Max steps in a workflow */
  maxWorkflowSteps: 10,
  /** Restricted paths require approval */
  restrictedPaths: [
    "src/core/",
    "src/config/",
    ".env",
    "packages/agent-core/src/",
    "packages/autonomy/src/core/",
    "packages/money-engine/src/core/",
  ],
  /** Restricted packages require approval */
  restrictedPackages: [
    "@gicm/agent-core",
    "@gicm/autonomy",
    "@gicm/money-engine",
    "@gicm/mcp-server",
  ],
};

// ============================================================================
// Improvement Value Scoring
// ============================================================================

export const IMPROVEMENT_VALUE: Record<string, number> = {
  [ClaudeCodeActionType.ADD_TEST]: 50,
  [ClaudeCodeActionType.FIX_LINT]: 5,
  [ClaudeCodeActionType.UPDATE_DOCS]: 25,
  [ClaudeCodeActionType.ADD_COMMENTS]: 10,
  [ClaudeCodeActionType.FORMAT_CODE]: 2,
  [ClaudeCodeActionType.ADD_TYPE]: 15,
  [ClaudeCodeActionType.MODIFY_FUNCTION]: 30,
  [ClaudeCodeActionType.ADD_FEATURE]: 100,
  [ClaudeCodeActionType.REFACTOR]: 40,
  [ClaudeCodeActionType.CHANGE_API]: 60,
};

// ============================================================================
// Risk Thresholds
// ============================================================================

export const RISK_THRESHOLDS = {
  /** Safe: auto-execute */
  safe: 20,
  /** Low: auto-execute with logging */
  low: 40,
  /** Medium: queue for approval */
  medium: 60,
  /** High: escalate */
  high: 80,
  /** Critical: reject or escalate */
  critical: 100,
};
