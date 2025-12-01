/**
 * ClaudeWorkflowAdapter - Deep Autonomy Integration
 *
 * Routes Claude Code actions through the autonomy system for:
 * - Auto-execution of safe improvements
 * - Queuing risky changes for approval
 * - Tracking daily improvements and wins
 */

import { EventEmitter } from "eventemitter3";
import type { Action, ActionCategory } from "../core/types.js";
import {
  ClaudeCodeActionType,
  ClaudeCodeContextSchema,
  DailyImprovementSchema,
  type ClaudeCodeContext,
  type DailyImprovement,
  type ImprovementStats,
  type WorkflowAdapterEvents,
  type WorkflowContext,
} from "./workflow-types.js";
import {
  CLAUDE_ACTION_BASE_RISK,
  CONTEXT_RISK_MODIFIERS,
  SAFE_CLAUDE_ACTIONS,
  DANGEROUS_CLAUDE_ACTIONS,
  DEFAULT_WORKFLOW_BOUNDARIES,
  IMPROVEMENT_VALUE,
  RISK_THRESHOLDS,
} from "./workflow-constants.js";

// Simple ID generator
function generateId(): string {
  return `wf_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export class ClaudeWorkflowAdapter {
  private dailyImprovements: DailyImprovement[] = [];
  private dailyCounters: Record<string, number> = {};
  private lastResetDate: string = "";
  private emitter = new EventEmitter<WorkflowAdapterEvents>();
  private boundaries = { ...DEFAULT_WORKFLOW_BOUNDARIES };
  private actionCount = 0;

  constructor() {
    this.resetDailyCounters();
  }

  // ============================================================================
  // Adapter Info
  // ============================================================================

  getEngineName(): string {
    return "ClaudeWorkflow";
  }

  getEngineType(): string {
    return "workflow";
  }

  getCategoryForType(actionType: string): ActionCategory {
    if (actionType.includes("deploy")) return "deployment";
    if (actionType.includes("config")) return "configuration";
    if (actionType.includes("test") || actionType.includes("lint"))
      return "content";
    return "build";
  }

  // ============================================================================
  // Action Creator
  // ============================================================================

  private createAction(params: {
    type: string;
    description: string;
    value?: number;
    reversible?: boolean;
    externallyVisible?: boolean;
    metadata?: Record<string, unknown>;
  }): Action {
    this.actionCount++;

    const action: Action = {
      id: generateId(),
      engine: "product", // Use product engine type for workflow actions
      category: this.getCategoryForType(params.type),
      type: params.type,
      description: params.description,
      params: params.metadata || {},
      metadata: {
        estimatedValue: params.value,
        reversible: params.reversible ?? true,
        urgency: "normal",
      },
      timestamp: Date.now(),
    };

    return action;
  }

  // ============================================================================
  // Claude Code Action Creators
  // ============================================================================

  createEditAction(params: {
    actionType: string;
    title: string;
    description?: string;
    context: Partial<ClaudeCodeContext>;
  }): Action {
    const context = ClaudeCodeContextSchema.parse({
      filePath: params.context.filePath || "",
      ...params.context,
    });
    const riskScore = this.calculateClaudeRisk(params.actionType, context);

    return this.createAction({
      type: params.actionType,
      description: params.title,
      value: this.getImprovementValue(params.actionType),
      reversible: this.isReversibleAction(params.actionType),
      metadata: {
        ...params,
        context,
        riskScore,
        isSafe: this.isSafeAction(params.actionType, context, riskScore),
      },
    });
  }

  createAddTestAction(params: {
    testFile: string;
    targetFile: string;
    testCount?: number;
  }): Action {
    return this.createEditAction({
      actionType: ClaudeCodeActionType.ADD_TEST,
      title: `Add ${params.testCount || 1} tests for ${params.targetFile}`,
      context: {
        filePath: params.testFile,
        isTest: true,
        linesAdded: (params.testCount || 1) * 20,
      },
    });
  }

  createFixLintAction(params: {
    filePath: string;
    issueCount?: number;
  }): Action {
    return this.createEditAction({
      actionType: ClaudeCodeActionType.FIX_LINT,
      title: `Fix ${params.issueCount || 1} lint issues in ${params.filePath}`,
      context: {
        filePath: params.filePath,
        linesAdded: params.issueCount || 1,
        linesRemoved: params.issueCount || 1,
      },
    });
  }

  createUpdateDocsAction(params: {
    filePath: string;
    description?: string;
  }): Action {
    return this.createEditAction({
      actionType: ClaudeCodeActionType.UPDATE_DOCS,
      title: `Update docs: ${params.description || params.filePath}`,
      context: {
        filePath: params.filePath,
      },
    });
  }

  createModifyFunctionAction(params: {
    filePath: string;
    functionName: string;
    linesChanged: number;
    context?: Partial<ClaudeCodeContext>;
  }): Action {
    return this.createEditAction({
      actionType: ClaudeCodeActionType.MODIFY_FUNCTION,
      title: `Modify function ${params.functionName}`,
      context: {
        ...params.context,
        filePath: params.filePath,
        linesAdded: params.linesChanged,
      },
    });
  }

  createDeployAction(params: {
    environment: "staging" | "production";
    service?: string;
  }): Action {
    const actionType =
      params.environment === "production"
        ? ClaudeCodeActionType.PRODUCTION_DEPLOY
        : ClaudeCodeActionType.MODIFY_CONFIG;

    return this.createEditAction({
      actionType,
      title: `Deploy to ${params.environment}${params.service ? `: ${params.service}` : ""}`,
      context: {
        filePath: "deployment",
        affectsProduction: params.environment === "production",
      },
    });
  }

  // ============================================================================
  // Workflow Action Creators
  // ============================================================================

  createWorkflowRunAction(params: WorkflowContext): Action {
    const aggregateRisk = params.steps
      ? Math.max(...params.steps.map((s) => s.riskScore))
      : params.aggregateRiskScore;

    return this.createAction({
      type: "workflow_run",
      description: `Run workflow: ${params.workflowName}`,
      value: 10,
      reversible: true,
      metadata: {
        ...params,
        aggregateRiskScore: aggregateRisk,
      },
    });
  }

  // ============================================================================
  // Risk Calculation
  // ============================================================================

  calculateClaudeRisk(actionType: string, context: ClaudeCodeContext): number {
    let risk = CLAUDE_ACTION_BASE_RISK[actionType] || 50;

    if (context.isCore) risk += CONTEXT_RISK_MODIFIERS.isCore;
    if (context.affectsPublicApi) risk += CONTEXT_RISK_MODIFIERS.affectsPublicApi;
    if (context.affectsDatabase) risk += CONTEXT_RISK_MODIFIERS.affectsDatabase;
    if (context.affectsAuth) risk += CONTEXT_RISK_MODIFIERS.affectsAuth;
    if (context.affectsProduction) risk += CONTEXT_RISK_MODIFIERS.affectsProduction;
    if (context.linesAdded + context.linesRemoved > 100)
      risk += CONTEXT_RISK_MODIFIERS.largeChange;
    if (context.filesChanged > 5) risk += CONTEXT_RISK_MODIFIERS.multiFile;

    if (this.isRestrictedPath(context.filePath)) risk += 25;
    if (context.packageName && this.isRestrictedPackage(context.packageName))
      risk += 20;

    return Math.min(100, risk);
  }

  isSafeAction(
    actionType: string,
    context: ClaudeCodeContext,
    riskScore: number
  ): boolean {
    if ((DANGEROUS_CLAUDE_ACTIONS as readonly string[]).includes(actionType))
      return false;
    if (riskScore > RISK_THRESHOLDS.safe) return false;
    if (context.affectsProduction) return false;
    if (context.affectsAuth) return false;
    if (context.linesAdded + context.linesRemoved > this.boundaries.maxAutoLinesChanged)
      return false;
    if (context.filesChanged > this.boundaries.maxAutoFilesChanged) return false;
    if (!this.checkDailyLimit(actionType)) return false;

    return (SAFE_CLAUDE_ACTIONS as readonly string[]).includes(actionType);
  }

  private isRestrictedPath(filePath: string): boolean {
    return this.boundaries.restrictedPaths.some((p) => filePath.includes(p));
  }

  private isRestrictedPackage(packageName: string): boolean {
    return this.boundaries.restrictedPackages.includes(packageName);
  }

  private isReversibleAction(actionType: string): boolean {
    const nonReversible = [
      ClaudeCodeActionType.DELETE_DATA,
      ClaudeCodeActionType.PRODUCTION_DEPLOY,
    ] as readonly string[];
    return !nonReversible.includes(actionType);
  }

  private getImprovementValue(actionType: string): number {
    return IMPROVEMENT_VALUE[actionType] || 10;
  }

  // ============================================================================
  // Daily Tracking
  // ============================================================================

  private resetDailyCounters(): void {
    const today = new Date().toISOString().split("T")[0];
    if (this.lastResetDate !== today) {
      this.dailyCounters = {};
      this.dailyImprovements = [];
      this.lastResetDate = today;
    }
  }

  private checkDailyLimit(actionType: string): boolean {
    this.resetDailyCounters();

    const current = this.dailyCounters[actionType] || 0;
    let limit: number;

    switch (actionType) {
      case ClaudeCodeActionType.ADD_TEST:
        limit = this.boundaries.maxDailyAutoTests;
        break;
      case ClaudeCodeActionType.FIX_LINT:
        limit = this.boundaries.maxDailyAutoLintFixes;
        break;
      case ClaudeCodeActionType.UPDATE_DOCS:
        limit = this.boundaries.maxDailyAutoDocUpdates;
        break;
      default:
        limit = this.boundaries.maxDailyAutoImprovements;
    }

    if (current >= limit) {
      this.emitter.emit("boundary:exceeded", actionType, current, limit);
      return false;
    }

    return true;
  }

  private incrementDailyCounter(actionType: string): void {
    this.dailyCounters[actionType] = (this.dailyCounters[actionType] || 0) + 1;
  }

  // ============================================================================
  // Improvement Recording
  // ============================================================================

  recordImprovement(action: Action, autoExecuted: boolean): DailyImprovement {
    this.resetDailyCounters();
    this.incrementDailyCounter(action.type);

    const params = action.params as Record<string, unknown>;
    const context = params.context as ClaudeCodeContext | undefined;

    const improvement = DailyImprovementSchema.parse({
      id: generateId(),
      actionType: action.type,
      title: action.description,
      description: params.description as string | undefined,
      value: action.metadata?.estimatedValue || this.getImprovementValue(action.type),
      autoExecuted,
      timestamp: Date.now(),
      filePath: context?.filePath,
      packageName: context?.packageName,
    });

    this.dailyImprovements.push(improvement);
    this.emitter.emit("improvement:recorded", improvement);

    const riskScore = (params.riskScore as number) || 50;
    if (riskScore <= RISK_THRESHOLDS.safe) {
      this.emitter.emit("action:safe", action.type, riskScore);
    } else {
      this.emitter.emit("action:risky", action.type, riskScore);
    }

    return improvement;
  }

  getImprovementStats(): ImprovementStats {
    this.resetDailyCounters();

    const byType: Record<string, number> = {};
    const byPackage: Record<string, number> = {};

    for (const imp of this.dailyImprovements) {
      byType[imp.actionType] = (byType[imp.actionType] || 0) + 1;
      if (imp.packageName) {
        byPackage[imp.packageName] = (byPackage[imp.packageName] || 0) + 1;
      }
    }

    return {
      date: this.lastResetDate,
      totalImprovements: this.dailyImprovements.length,
      autoExecuted: this.dailyImprovements.filter((i) => i.autoExecuted).length,
      queued: this.dailyImprovements.filter((i) => !i.autoExecuted).length,
      escalated: 0,
      totalValue: this.dailyImprovements.reduce((sum, i) => sum + i.value, 0),
      byType,
      byPackage,
    };
  }

  getDailyImprovements(): DailyImprovement[] {
    this.resetDailyCounters();
    return [...this.dailyImprovements];
  }

  // ============================================================================
  // Boundary Management
  // ============================================================================

  updateBoundaries(
    newBoundaries: Partial<typeof DEFAULT_WORKFLOW_BOUNDARIES>
  ): void {
    this.boundaries = { ...this.boundaries, ...newBoundaries };
  }

  getBoundaries(): typeof DEFAULT_WORKFLOW_BOUNDARIES {
    return { ...this.boundaries };
  }

  // ============================================================================
  // Event Emitter
  // ============================================================================

  on<K extends keyof WorkflowAdapterEvents>(
    event: K,
    listener: WorkflowAdapterEvents[K]
  ): this {
    this.emitter.on(event, listener as (...args: unknown[]) => void);
    return this;
  }

  off<K extends keyof WorkflowAdapterEvents>(
    event: K,
    listener: WorkflowAdapterEvents[K]
  ): this {
    this.emitter.off(event, listener as (...args: unknown[]) => void);
    return this;
  }

  getActionCount(): number {
    return this.actionCount;
  }
}

// Singleton
let workflowAdapter: ClaudeWorkflowAdapter | null = null;

export function getWorkflowAdapter(): ClaudeWorkflowAdapter {
  if (!workflowAdapter) {
    workflowAdapter = new ClaudeWorkflowAdapter();
  }
  return workflowAdapter;
}
