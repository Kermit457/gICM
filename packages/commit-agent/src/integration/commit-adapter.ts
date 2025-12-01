/**
 * Commit Engine Adapter for Autonomy Integration
 *
 * Routes git operations through the autonomy system for risk assessment
 */

import { EventEmitter } from "eventemitter3";
import type { DiffSummary, CommitRiskAssessment } from "../core/types.js";
import { RISK_THRESHOLDS } from "../core/constants.js";

// Re-define minimal types to avoid circular dependency with @gicm/autonomy
type ActionCategory = "trading" | "content" | "build" | "deployment" | "configuration";
type EngineType = "money" | "growth" | "product" | "orchestrator";
type Urgency = "low" | "normal" | "high" | "critical";
type DecisionOutcome = "auto_execute" | "queue_approval" | "escalate" | "reject";

interface ActionMetadata {
  estimatedValue?: number;
  reversible: boolean;
  urgency: Urgency;
  dependencies?: string[];
  linesChanged?: number;
  filesChanged?: number;
}

interface Action {
  id: string;
  engine: EngineType;
  category: ActionCategory;
  type: string;
  description: string;
  params: Record<string, unknown>;
  metadata: ActionMetadata;
  timestamp: number;
}

export interface CommitActionParams {
  message: string;
  diff: DiffSummary;
  risk: CommitRiskAssessment;
  amend?: boolean;
}

export interface PushActionParams {
  remote: string;
  branch: string;
  force?: boolean;
  commitCount?: number;
}

export interface PRActionParams {
  title: string;
  body: string;
  base: string;
  draft?: boolean;
}

export interface CommitAdapterEvents {
  "action:submitted": (action: Action) => void;
  "decision:received": (decision: { action: Action; outcome: DecisionOutcome; reason: string }) => void;
}

export interface CommitAdapterConfig {
  engineName?: string;
  autoExecuteMaxScore?: number;
  queueApprovalMaxScore?: number;
  escalateMaxScore?: number;
}

/**
 * Adapter for integrating commit operations with autonomy system
 */
export class CommitEngineAdapter extends EventEmitter<CommitAdapterEvents> {
  private config: Required<CommitAdapterConfig>;
  private actionCount = 0;

  constructor(config: CommitAdapterConfig = {}) {
    super();
    this.config = {
      engineName: config.engineName ?? "commit-agent",
      autoExecuteMaxScore: config.autoExecuteMaxScore ?? RISK_THRESHOLDS.autoExecuteMax,
      queueApprovalMaxScore: config.queueApprovalMaxScore ?? RISK_THRESHOLDS.queueApprovalMax,
      escalateMaxScore: config.escalateMaxScore ?? RISK_THRESHOLDS.escalateMax,
    };
  }

  /**
   * Create an action for committing changes
   */
  createCommitAction(params: CommitActionParams): Action {
    const totalLines = params.diff.totalLinesAdded + params.diff.totalLinesRemoved;

    return this.createAction({
      type: params.amend ? "git_commit_amend" : "git_commit",
      description: `Commit: ${params.message.substring(0, 50)}${params.message.length > 50 ? "..." : ""}`,
      payload: {
        message: params.message,
        files: params.diff.files.map((f) => f.path),
        linesAdded: params.diff.totalLinesAdded,
        linesRemoved: params.diff.totalLinesRemoved,
        isBreaking: params.risk.isBreakingChange,
        criticalPaths: params.risk.criticalPaths,
      },
      linesChanged: totalLines,
      filesChanged: params.diff.totalFilesChanged,
      reversible: !params.amend, // Regular commits can be reverted
      urgency: params.risk.isBreakingChange ? "high" : "normal",
    });
  }

  /**
   * Create an action for pushing changes
   */
  createPushAction(params: PushActionParams): Action {
    return this.createAction({
      type: params.force ? "git_push_force" : "git_push",
      description: `Push to ${params.remote}/${params.branch}${params.force ? " (force)" : ""}`,
      payload: {
        remote: params.remote,
        branch: params.branch,
        force: params.force ?? false,
        commitCount: params.commitCount ?? 1,
      },
      reversible: false, // Push cannot be easily undone
      urgency: params.force ? "critical" : "normal",
    });
  }

  /**
   * Create an action for creating a PR
   */
  createPRAction(params: PRActionParams): Action {
    return this.createAction({
      type: params.draft ? "git_pr_draft" : "git_pr_create",
      description: `Create PR: ${params.title.substring(0, 50)}${params.title.length > 50 ? "..." : ""}`,
      payload: {
        title: params.title,
        body: params.body,
        base: params.base,
        draft: params.draft ?? false,
      },
      reversible: true, // PRs can be closed
      urgency: "normal",
    });
  }

  /**
   * Determine decision outcome based on risk score
   */
  getDecisionOutcome(riskScore: number): DecisionOutcome {
    if (riskScore <= this.config.autoExecuteMaxScore) {
      return "auto_execute";
    }
    if (riskScore <= this.config.queueApprovalMaxScore) {
      return "queue_approval";
    }
    if (riskScore <= this.config.escalateMaxScore) {
      return "escalate";
    }
    return "reject";
  }

  /**
   * Check if an action should auto-execute
   */
  shouldAutoExecute(action: Action): boolean {
    // Force push always requires approval
    if (action.type === "git_push_force") {
      return false;
    }

    // Commits with many lines/files need approval
    const meta = action.metadata;
    if (meta.linesChanged && meta.linesChanged > 300) {
      return false;
    }
    if (meta.filesChanged && meta.filesChanged > 10) {
      return false;
    }

    return true;
  }

  /**
   * Create a generic action
   */
  private createAction(params: {
    type: string;
    description: string;
    payload: Record<string, unknown>;
    estimatedValue?: number;
    reversible?: boolean;
    urgency?: Urgency;
    linesChanged?: number;
    filesChanged?: number;
  }): Action {
    this.actionCount++;

    const action: Action = {
      id: `commit_${Date.now()}_${this.actionCount}`,
      engine: "orchestrator" as EngineType, // Commit agent is orchestrator type
      category: this.getCategoryForType(params.type),
      type: params.type,
      description: params.description,
      params: params.payload,
      metadata: {
        estimatedValue: params.estimatedValue,
        reversible: params.reversible ?? true,
        urgency: params.urgency ?? "normal",
        linesChanged: params.linesChanged,
        filesChanged: params.filesChanged,
      },
      timestamp: Date.now(),
    };

    this.emit("action:submitted", action);
    return action;
  }

  /**
   * Map action type to category
   */
  private getCategoryForType(actionType: string): ActionCategory {
    if (actionType === "git_push_force" || actionType.includes("pr")) {
      return "deployment";
    }
    if (actionType.includes("commit")) {
      return "build";
    }
    return "build";
  }

  /**
   * Get engine name
   */
  getEngineName(): string {
    return this.config.engineName;
  }

  /**
   * Get action count
   */
  getActionCount(): number {
    return this.actionCount;
  }
}
