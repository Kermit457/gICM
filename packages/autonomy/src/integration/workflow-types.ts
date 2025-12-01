/**
 * Types for Claude Code Workflow Integration
 *
 * Defines action types, contexts, and tracking structures
 * for routing Claude Code actions through the autonomy system.
 */

import { z } from "zod";

// ============================================================================
// Claude Code Action Types
// ============================================================================

export const ClaudeCodeActionType = {
  // Safe actions (auto-execute)
  ADD_TEST: "claude_add_test",
  FIX_LINT: "claude_fix_lint",
  UPDATE_DOCS: "claude_update_docs",
  ADD_COMMENTS: "claude_add_comments",
  FORMAT_CODE: "claude_format_code",
  ADD_TYPE: "claude_add_type",
  UPDATE_README: "claude_update_readme",
  ADD_EXAMPLE: "claude_add_example",

  // Medium risk (may queue)
  MODIFY_FUNCTION: "claude_modify_function",
  ADD_FEATURE: "claude_add_feature",
  REFACTOR: "claude_refactor",

  // High risk (queue/escalate)
  CHANGE_API: "claude_change_api",
  MODIFY_CORE: "claude_modify_core",
  MODIFY_CONFIG: "claude_modify_config",

  // Critical (escalate/reject)
  PRODUCTION_DEPLOY: "claude_production_deploy",
  DELETE_DATA: "claude_delete_data",
  MODIFY_AUTH: "claude_modify_auth",
} as const;

export type ClaudeCodeActionType =
  (typeof ClaudeCodeActionType)[keyof typeof ClaudeCodeActionType];

// ============================================================================
// Context Schemas
// ============================================================================

export const ClaudeCodeContextSchema = z.object({
  /** File being modified */
  filePath: z.string(),
  /** Package name if in a package */
  packageName: z.string().optional(),
  /** Is this a core infrastructure file? */
  isCore: z.boolean().default(false),
  /** Is this a test file? */
  isTest: z.boolean().default(false),
  /** Lines added */
  linesAdded: z.number().default(0),
  /** Lines removed */
  linesRemoved: z.number().default(0),
  /** Affects public API? */
  affectsPublicApi: z.boolean().default(false),
  /** Affects database? */
  affectsDatabase: z.boolean().default(false),
  /** Affects authentication? */
  affectsAuth: z.boolean().default(false),
  /** Affects production? */
  affectsProduction: z.boolean().default(false),
  /** Number of files changed */
  filesChanged: z.number().default(1),
});

export type ClaudeCodeContext = z.infer<typeof ClaudeCodeContextSchema>;

// ============================================================================
// Workflow Action Types
// ============================================================================

export const WorkflowActionType = {
  WORKFLOW_CREATE: "workflow_create",
  WORKFLOW_RUN: "workflow_run",
  WORKFLOW_STEP: "workflow_step",
  WORKFLOW_COMPLETE: "workflow_complete",
} as const;

export type WorkflowActionType =
  (typeof WorkflowActionType)[keyof typeof WorkflowActionType];

export const WorkflowContextSchema = z.object({
  workflowId: z.string(),
  workflowName: z.string(),
  executionId: z.string().optional(),
  stepId: z.string().optional(),
  stepAgent: z.string().optional(),
  aggregateRiskScore: z.number().default(0),
  steps: z
    .array(
      z.object({
        agent: z.string(),
        riskScore: z.number(),
      })
    )
    .optional(),
});

export type WorkflowContext = z.infer<typeof WorkflowContextSchema>;

// ============================================================================
// Improvement Tracking
// ============================================================================

export const DailyImprovementSchema = z.object({
  id: z.string(),
  actionType: z.string(),
  title: z.string(),
  description: z.string().optional(),
  value: z.number().default(1),
  autoExecuted: z.boolean(),
  timestamp: z.number(),
  filePath: z.string().optional(),
  packageName: z.string().optional(),
});

export type DailyImprovement = z.infer<typeof DailyImprovementSchema>;

export const ImprovementStatsSchema = z.object({
  date: z.string(),
  totalImprovements: z.number(),
  autoExecuted: z.number(),
  queued: z.number(),
  escalated: z.number(),
  totalValue: z.number(),
  byType: z.record(z.number()),
  byPackage: z.record(z.number()),
});

export type ImprovementStats = z.infer<typeof ImprovementStatsSchema>;

// ============================================================================
// Adapter Events
// ============================================================================

export interface WorkflowAdapterEvents {
  "improvement:recorded": (improvement: DailyImprovement) => void;
  "win:published": (improvement: DailyImprovement) => void;
  "boundary:exceeded": (type: string, current: number, limit: number) => void;
  "action:safe": (actionType: string, riskScore: number) => void;
  "action:risky": (actionType: string, riskScore: number) => void;
}
