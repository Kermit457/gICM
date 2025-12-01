/**
 * Suggestion Engine
 * Phase 10A: Smart Pipeline Suggestions
 */

import { EventEmitter } from "eventemitter3";
import { randomUUID } from "crypto";
import {
  type IntelligenceConfig,
  type IntelligenceEvents,
  type Suggestion,
  type SuggestionType,
  type SuggestionPriority,
  type Optimization,
  type OptimizationCategory,
  type SimilarPipeline,
  type ErrorPattern,
  type AutoFix,
  type PipelineAnalysis,
  IntelligenceConfigSchema,
  OPTIMIZATION_TEMPLATES,
  COMMON_ERROR_PATTERNS,
} from "./types.js";

// ============================================================================
// TYPES
// ============================================================================

interface PipelineData {
  id: string;
  name: string;
  description?: string;
  steps: Array<{
    name: string;
    type: string;
    config: Record<string, unknown>;
    prompt?: string;
    model?: string;
  }>;
  config?: Record<string, unknown>;
}

interface ExecutionHistory {
  pipelineId: string;
  executions: Array<{
    id: string;
    status: "success" | "failure" | "cancelled";
    duration: number;
    tokenUsage: number;
    cost: number;
    error?: string;
    stepResults?: Array<{
      stepIndex: number;
      duration: number;
      tokens: number;
      error?: string;
    }>;
  }>;
}

// ============================================================================
// SUGGESTION ENGINE
// ============================================================================

export class SuggestionEngine extends EventEmitter<IntelligenceEvents> {
  private config: IntelligenceConfig;
  private suggestions: Map<string, Suggestion> = new Map();
  private analyses: Map<string, PipelineAnalysis> = new Map();
  private autoFixes: Map<string, AutoFix> = new Map();
  private pipelineCache: Map<string, PipelineData> = new Map();
  private executionCache: Map<string, ExecutionHistory> = new Map();

  constructor(config: Partial<IntelligenceConfig> = {}) {
    super();
    this.config = IntelligenceConfigSchema.parse(config);
  }

  // ==========================================================================
  // PIPELINE ANALYSIS
  // ==========================================================================

  async analyzePipeline(
    pipeline: PipelineData,
    history?: ExecutionHistory
  ): Promise<PipelineAnalysis> {
    if (!this.config.analysisEnabled) {
      throw new Error("Analysis is disabled");
    }

    this.emit("analysis:started", pipeline.id);

    // Cache pipeline data
    this.pipelineCache.set(pipeline.id, pipeline);
    if (history) {
      this.executionCache.set(pipeline.id, history);
    }

    // Run all analysis components
    const [suggestions, optimizations, similarPipelines, errorPatterns] =
      await Promise.all([
        this.generateSuggestions(pipeline, history),
        this.findOptimizations(pipeline, history),
        this.findSimilarPipelines(pipeline),
        this.analyzeErrorPatterns(pipeline, history),
      ]);

    // Calculate scores
    const scores = this.calculateScores(pipeline, history, optimizations);

    // Compute execution stats
    const executionStats = this.computeExecutionStats(history);

    const analysis: PipelineAnalysis = {
      pipelineId: pipeline.id,
      analyzedAt: new Date(),
      scores,
      suggestions: suggestions.slice(0, this.config.maxSuggestionsPerPipeline),
      optimizations,
      similarPipelines: similarPipelines.slice(0, this.config.maxSimilarPipelines),
      errorPatterns,
      executionStats,
    };

    this.analyses.set(pipeline.id, analysis);
    this.emit("analysis:completed", analysis);

    return analysis;
  }

  getAnalysis(pipelineId: string): PipelineAnalysis | undefined {
    return this.analyses.get(pipelineId);
  }

  // ==========================================================================
  // SUGGESTIONS
  // ==========================================================================

  private async generateSuggestions(
    pipeline: PipelineData,
    history?: ExecutionHistory
  ): Promise<Suggestion[]> {
    const suggestions: Suggestion[] = [];

    // Check for optimization opportunities
    if (pipeline.steps.length > 5) {
      suggestions.push(this.createSuggestion({
        type: "optimization",
        priority: "medium",
        title: "Consider breaking down pipeline",
        description: `Pipeline has ${pipeline.steps.length} steps. Consider splitting into smaller, focused pipelines for better maintainability.`,
        reasoning: "Pipelines with many steps are harder to debug and maintain. Smaller pipelines are more reusable.",
        pipelineId: pipeline.id,
        confidence: 0.75,
        estimatedImpact: { reliabilityGain: 15 },
      }));
    }

    // Check for missing error handling
    const hasRetryConfig = pipeline.steps.some(s => s.config?.retry);
    if (!hasRetryConfig && pipeline.steps.length > 2) {
      suggestions.push(this.createSuggestion({
        type: "reliability",
        priority: "high",
        title: "Add retry logic",
        description: "Pipeline lacks retry configuration. Add retry logic to handle transient failures.",
        reasoning: "LLM APIs can have intermittent failures. Retry logic improves reliability.",
        pipelineId: pipeline.id,
        confidence: 0.85,
        autoFixAvailable: true,
        autoFixConfig: { addRetry: true, maxRetries: 3, retryDelay: 1000 },
        estimatedImpact: { reliabilityGain: 25 },
      }));
    }

    // Check for expensive models on simple tasks
    for (let i = 0; i < pipeline.steps.length; i++) {
      const step = pipeline.steps[i];
      if (this.isExpensiveModel(step.model) && this.isSimpleTask(step)) {
        suggestions.push(this.createSuggestion({
          type: "cost_reduction",
          priority: "medium",
          title: `Use smaller model for "${step.name}"`,
          description: `Step "${step.name}" uses an expensive model but appears to be a simple task. Consider using a smaller model.`,
          reasoning: "Smaller models are faster and cheaper for classification, extraction, and simple generation tasks.",
          pipelineId: pipeline.id,
          stepIndex: i,
          confidence: 0.7,
          autoFixAvailable: true,
          autoFixConfig: { model: "claude-3-haiku-20240307" },
          estimatedImpact: { costReduction: 50, speedImprovement: 30 },
        }));
      }
    }

    // Check for long prompts
    for (let i = 0; i < pipeline.steps.length; i++) {
      const step = pipeline.steps[i];
      if (step.prompt && step.prompt.length > 2000) {
        suggestions.push(this.createSuggestion({
          type: "optimization",
          priority: "low",
          title: `Optimize prompt length in "${step.name}"`,
          description: `Prompt in step "${step.name}" is ${step.prompt.length} characters. Consider condensing for efficiency.`,
          reasoning: "Shorter prompts reduce token usage and cost while often maintaining quality.",
          pipelineId: pipeline.id,
          stepIndex: i,
          confidence: 0.65,
          estimatedImpact: { tokenSavings: Math.floor(step.prompt.length * 0.3) },
        }));
      }
    }

    // Check execution history for patterns
    if (history && history.executions.length >= 5) {
      const failureRate = history.executions.filter(e => e.status === "failure").length / history.executions.length;

      if (failureRate > 0.2) {
        suggestions.push(this.createSuggestion({
          type: "reliability",
          priority: "critical",
          title: "High failure rate detected",
          description: `Pipeline has a ${(failureRate * 100).toFixed(1)}% failure rate. Review error patterns and add error handling.`,
          reasoning: "High failure rates indicate systematic issues that should be addressed.",
          pipelineId: pipeline.id,
          confidence: 0.95,
        }));
      }

      // Check for cost outliers
      const costs = history.executions.map(e => e.cost);
      const avgCost = costs.reduce((a, b) => a + b, 0) / costs.length;
      const maxCost = Math.max(...costs);

      if (maxCost > avgCost * 3) {
        suggestions.push(this.createSuggestion({
          type: "cost_reduction",
          priority: "high",
          title: "Cost variance detected",
          description: `Some executions cost ${(maxCost / avgCost).toFixed(1)}x more than average. Consider adding cost limits.`,
          reasoning: "High cost variance may indicate runaway loops or inefficient paths.",
          pipelineId: pipeline.id,
          confidence: 0.8,
          autoFixAvailable: true,
          autoFixConfig: { maxCost: avgCost * 2 },
        }));
      }
    }

    // Check for security best practices
    const hasSecrets = pipeline.steps.some(s =>
      JSON.stringify(s.config).match(/password|secret|key|token|api_key/i)
    );
    if (hasSecrets) {
      suggestions.push(this.createSuggestion({
        type: "security",
        priority: "critical",
        title: "Potential hardcoded secrets",
        description: "Pipeline configuration may contain hardcoded secrets. Use environment variables instead.",
        reasoning: "Hardcoded secrets are a security risk and make rotation difficult.",
        pipelineId: pipeline.id,
        confidence: 0.9,
      }));
    }

    // Store suggestions
    for (const suggestion of suggestions) {
      if (suggestion.confidence >= this.config.minConfidenceThreshold) {
        this.suggestions.set(suggestion.id, suggestion);
        this.emit("suggestion:created", suggestion);
      }
    }

    return suggestions.filter(s => s.confidence >= this.config.minConfidenceThreshold);
  }

  private createSuggestion(data: Omit<Suggestion, "id" | "status" | "createdAt" | "autoFixAvailable"> & { autoFixAvailable?: boolean }): Suggestion {
    return {
      ...data,
      id: randomUUID(),
      status: "pending",
      autoFixAvailable: data.autoFixAvailable ?? false,
      createdAt: new Date(),
    };
  }

  getSuggestions(pipelineId?: string): Suggestion[] {
    const all = Array.from(this.suggestions.values());
    if (pipelineId) {
      return all.filter(s => s.pipelineId === pipelineId);
    }
    return all;
  }

  async applySuggestion(suggestionId: string): Promise<boolean> {
    const suggestion = this.suggestions.get(suggestionId);
    if (!suggestion || suggestion.status !== "pending") {
      return false;
    }

    if (!suggestion.autoFixAvailable) {
      throw new Error("This suggestion does not support auto-fix");
    }

    // Apply the fix (in real implementation, this would modify the pipeline)
    suggestion.status = "applied";
    suggestion.appliedAt = new Date();
    this.emit("suggestion:applied", suggestion);

    return true;
  }

  dismissSuggestion(suggestionId: string, reason?: string): boolean {
    const suggestion = this.suggestions.get(suggestionId);
    if (!suggestion || suggestion.status !== "pending") {
      return false;
    }

    suggestion.status = "dismissed";
    suggestion.dismissedAt = new Date();
    suggestion.dismissReason = reason;
    this.emit("suggestion:dismissed", suggestion);

    return true;
  }

  // ==========================================================================
  // OPTIMIZATIONS
  // ==========================================================================

  private async findOptimizations(
    pipeline: PipelineData,
    history?: ExecutionHistory
  ): Promise<Optimization[]> {
    const optimizations: Optimization[] = [];

    // Check for parallel execution opportunities
    const independentSteps = this.findIndependentSteps(pipeline);
    if (independentSteps.length > 1) {
      optimizations.push({
        id: randomUUID(),
        category: "parallel_execution",
        title: OPTIMIZATION_TEMPLATES.parallel_execution.title,
        description: `Steps ${independentSteps.join(", ")} can run in parallel`,
        currentValue: "Sequential execution",
        suggestedValue: "Parallel execution",
        estimatedSavings: {
          time: this.estimateParallelSavings(pipeline, independentSteps, history),
        },
        confidence: 0.85,
      });
    }

    // Check for caching opportunities
    const repeatableSteps = this.findRepeatableSteps(pipeline, history);
    if (repeatableSteps.length > 0) {
      optimizations.push({
        id: randomUUID(),
        category: "caching",
        title: OPTIMIZATION_TEMPLATES.caching.title,
        description: `Steps ${repeatableSteps.join(", ")} have repeated calls with same inputs`,
        currentValue: "No caching",
        suggestedValue: "Enable result caching",
        estimatedSavings: {
          tokens: this.estimateCachingSavings(history, repeatableSteps),
          cost: this.estimateCachingCostSavings(history, repeatableSteps),
        },
        confidence: 0.8,
      });
    }

    // Check model selection
    for (let i = 0; i < pipeline.steps.length; i++) {
      const step = pipeline.steps[i];
      const recommendedModel = this.recommendModel(step, history);
      if (recommendedModel && recommendedModel !== step.model) {
        optimizations.push({
          id: randomUUID(),
          category: "model_selection",
          title: `${OPTIMIZATION_TEMPLATES.model_selection.title} for "${step.name}"`,
          description: OPTIMIZATION_TEMPLATES.model_selection.description,
          currentValue: step.model || "default",
          suggestedValue: recommendedModel,
          estimatedSavings: {
            cost: this.estimateModelSavings(step.model, recommendedModel),
          },
          codeChange: {
            before: `model: "${step.model || "default"}"`,
            after: `model: "${recommendedModel}"`,
            stepIndex: i,
          },
          confidence: 0.75,
        });
      }
    }

    // Check for step consolidation
    const consolidatableSteps = this.findConsolidatableSteps(pipeline);
    if (consolidatableSteps.length > 0) {
      for (const group of consolidatableSteps) {
        optimizations.push({
          id: randomUUID(),
          category: "step_consolidation",
          title: OPTIMIZATION_TEMPLATES.step_consolidation.title,
          description: `Steps ${group.join(", ")} can be merged into a single step`,
          currentValue: `${group.length} separate steps`,
          suggestedValue: "1 consolidated step",
          estimatedSavings: {
            time: 500 * (group.length - 1),  // Estimated overhead per step
            tokens: 100 * (group.length - 1), // System prompt overhead
          },
          confidence: 0.7,
        });
      }
    }

    return optimizations;
  }

  // ==========================================================================
  // SIMILAR PIPELINES
  // ==========================================================================

  private async findSimilarPipelines(pipeline: PipelineData): Promise<SimilarPipeline[]> {
    const similar: SimilarPipeline[] = [];

    for (const [id, cached] of this.pipelineCache) {
      if (id === pipeline.id) continue;

      const similarity = this.calculateSimilarity(pipeline, cached);
      if (similarity >= this.config.similarityThreshold) {
        const matchedFeatures = this.getMatchedFeatures(pipeline, cached);
        const differingFeatures = this.getDifferingFeatures(pipeline, cached);

        const history = this.executionCache.get(id);
        const stats = history ? this.computeExecutionStats(history) : undefined;

        similar.push({
          pipelineId: id,
          pipelineName: cached.name,
          similarity,
          matchedFeatures,
          differingFeatures,
          performanceComparison: stats ? {
            avgDuration: stats.avgDuration,
            avgCost: stats.avgCost,
            successRate: stats.successRate,
          } : undefined,
        });
      }
    }

    // Sort by similarity
    similar.sort((a, b) => b.similarity - a.similarity);

    if (similar.length > 0) {
      this.emit("similar:found", pipeline.id, similar);
    }

    return similar;
  }

  private calculateSimilarity(a: PipelineData, b: PipelineData): number {
    let score = 0;
    let factors = 0;

    // Step count similarity
    const stepDiff = Math.abs(a.steps.length - b.steps.length);
    score += Math.max(0, 1 - stepDiff / 10);
    factors++;

    // Step type overlap
    const aTypes = new Set(a.steps.map(s => s.type));
    const bTypes = new Set(b.steps.map(s => s.type));
    const typeOverlap = [...aTypes].filter(t => bTypes.has(t)).length;
    score += typeOverlap / Math.max(aTypes.size, bTypes.size);
    factors++;

    // Name/description similarity (simple word overlap)
    const aWords = new Set((a.name + " " + (a.description || "")).toLowerCase().split(/\W+/));
    const bWords = new Set((b.name + " " + (b.description || "")).toLowerCase().split(/\W+/));
    const wordOverlap = [...aWords].filter(w => bWords.has(w) && w.length > 3).length;
    score += Math.min(1, wordOverlap / 5);
    factors++;

    return score / factors;
  }

  private getMatchedFeatures(a: PipelineData, b: PipelineData): string[] {
    const matched: string[] = [];

    const aTypes = new Set(a.steps.map(s => s.type));
    const bTypes = new Set(b.steps.map(s => s.type));

    for (const type of aTypes) {
      if (bTypes.has(type)) {
        matched.push(`Uses ${type} step`);
      }
    }

    if (a.steps.length === b.steps.length) {
      matched.push("Same number of steps");
    }

    return matched;
  }

  private getDifferingFeatures(a: PipelineData, b: PipelineData): string[] {
    const differing: string[] = [];

    const aTypes = new Set(a.steps.map(s => s.type));
    const bTypes = new Set(b.steps.map(s => s.type));

    for (const type of aTypes) {
      if (!bTypes.has(type)) {
        differing.push(`Only A has ${type}`);
      }
    }
    for (const type of bTypes) {
      if (!aTypes.has(type)) {
        differing.push(`Only B has ${type}`);
      }
    }

    return differing;
  }

  // ==========================================================================
  // ERROR PATTERNS
  // ==========================================================================

  private async analyzeErrorPatterns(
    pipeline: PipelineData,
    history?: ExecutionHistory
  ): Promise<ErrorPattern[]> {
    if (!history) return [];

    const patterns: ErrorPattern[] = [];
    const errorMessages = history.executions
      .filter(e => e.error)
      .map(e => e.error!);

    for (const template of COMMON_ERROR_PATTERNS) {
      const regex = new RegExp(template.pattern, "i");
      const matches = errorMessages.filter(msg => regex.test(msg));

      if (matches.length > 0) {
        patterns.push({
          ...template,
          id: randomUUID(),
          frequency: matches.length,
        });
      }
    }

    return patterns;
  }

  // ==========================================================================
  // AUTO-FIX
  // ==========================================================================

  async applyAutoFix(
    pipelineId: string,
    errorPatternId: string,
    fixIndex: number = 0
  ): Promise<AutoFix | null> {
    const analysis = this.analyses.get(pipelineId);
    if (!analysis) return null;

    const pattern = analysis.errorPatterns.find(p => p.id === errorPatternId);
    if (!pattern || !pattern.suggestedFixes[fixIndex]?.autoFixable) {
      return null;
    }

    const fix: AutoFix = {
      id: randomUUID(),
      errorPatternId,
      pipelineId,
      fixType: "config_change",
      originalConfig: {},  // Would store original
      fixedConfig: pattern.suggestedFixes[fixIndex].fixConfig || {},
      applied: true,
      appliedAt: new Date(),
      rollbackAvailable: true,
    };

    this.autoFixes.set(fix.id, fix);
    this.emit("autofix:applied", fix);

    return fix;
  }

  async rollbackAutoFix(fixId: string): Promise<boolean> {
    const fix = this.autoFixes.get(fixId);
    if (!fix || !fix.rollbackAvailable) {
      return false;
    }

    fix.applied = false;
    this.emit("autofix:rolled_back", fix);

    return true;
  }

  // ==========================================================================
  // HELPER METHODS
  // ==========================================================================

  private isExpensiveModel(model?: string): boolean {
    if (!model) return false;
    return model.includes("opus") || model.includes("gpt-4") || model.includes("sonnet");
  }

  private isSimpleTask(step: PipelineData["steps"][0]): boolean {
    const simpleTypes = ["classify", "extract", "summarize", "translate", "format"];
    if (simpleTypes.some(t => step.type.toLowerCase().includes(t))) return true;
    if (step.prompt && step.prompt.length < 500) return true;
    return false;
  }

  private findIndependentSteps(pipeline: PipelineData): number[] {
    // Simplified: assume steps with no {{variable}} references are independent
    const independent: number[] = [];
    for (let i = 0; i < pipeline.steps.length; i++) {
      const step = pipeline.steps[i];
      const configStr = JSON.stringify(step.config);
      if (!configStr.includes("{{") && !step.prompt?.includes("{{")) {
        independent.push(i);
      }
    }
    return independent;
  }

  private findRepeatableSteps(pipeline: PipelineData, history?: ExecutionHistory): number[] {
    // Would analyze execution history for repeated identical calls
    return [];
  }

  private findConsolidatableSteps(pipeline: PipelineData): number[][] {
    // Find consecutive steps of same type that could be merged
    const groups: number[][] = [];
    let currentGroup: number[] = [];
    let lastType = "";

    for (let i = 0; i < pipeline.steps.length; i++) {
      if (pipeline.steps[i].type === lastType) {
        currentGroup.push(i);
      } else {
        if (currentGroup.length > 1) {
          groups.push([...currentGroup]);
        }
        currentGroup = [i];
        lastType = pipeline.steps[i].type;
      }
    }

    if (currentGroup.length > 1) {
      groups.push(currentGroup);
    }

    return groups;
  }

  private recommendModel(step: PipelineData["steps"][0], history?: ExecutionHistory): string | null {
    if (this.isSimpleTask(step) && this.isExpensiveModel(step.model)) {
      return "claude-3-haiku-20240307";
    }
    return null;
  }

  private estimateParallelSavings(
    pipeline: PipelineData,
    independentSteps: number[],
    history?: ExecutionHistory
  ): number {
    if (!history || history.executions.length === 0) return 1000;

    // Estimate based on average step duration
    const avgDuration = history.executions.reduce((sum, e) => sum + e.duration, 0) / history.executions.length;
    const avgStepDuration = avgDuration / pipeline.steps.length;

    // Parallel execution could save (n-1) * avgStepDuration
    return Math.floor(avgStepDuration * (independentSteps.length - 1));
  }

  private estimateCachingSavings(history: ExecutionHistory | undefined, steps: number[]): number {
    if (!history) return 0;
    return 500 * steps.length;  // Estimated token savings per cached step
  }

  private estimateCachingCostSavings(history: ExecutionHistory | undefined, steps: number[]): number {
    if (!history) return 0;
    const avgCost = history.executions.reduce((sum, e) => sum + e.cost, 0) / history.executions.length;
    return avgCost * 0.1 * steps.length;  // ~10% savings per cached step
  }

  private estimateModelSavings(current?: string, recommended?: string): number {
    if (!current || !recommended) return 0;
    // Haiku is ~10x cheaper than Sonnet
    if (current.includes("sonnet") && recommended.includes("haiku")) {
      return 90;  // 90% cost reduction
    }
    return 0;
  }

  private calculateScores(
    pipeline: PipelineData,
    history: ExecutionHistory | undefined,
    optimizations: Optimization[]
  ): PipelineAnalysis["scores"] {
    let efficiency = 70;
    let reliability = 70;
    let costEffectiveness = 70;
    let maintainability = 70;

    // Adjust based on findings
    if (optimizations.length > 0) {
      efficiency -= optimizations.length * 5;
    }
    if (pipeline.steps.length > 10) {
      maintainability -= 20;
    }
    if (history) {
      const successRate = history.executions.filter(e => e.status === "success").length / history.executions.length;
      reliability = Math.round(successRate * 100);
    }

    const overall = Math.round((efficiency + reliability + costEffectiveness + maintainability) / 4);

    return {
      overall: Math.max(0, Math.min(100, overall)),
      efficiency: Math.max(0, Math.min(100, efficiency)),
      reliability: Math.max(0, Math.min(100, reliability)),
      costEffectiveness: Math.max(0, Math.min(100, costEffectiveness)),
      maintainability: Math.max(0, Math.min(100, maintainability)),
    };
  }

  private computeExecutionStats(history?: ExecutionHistory): PipelineAnalysis["executionStats"] {
    if (!history || history.executions.length === 0) {
      return {
        totalExecutions: 0,
        successRate: 0,
        avgDuration: 0,
        avgCost: 0,
        avgTokens: 0,
      };
    }

    const executions = history.executions;
    const successful = executions.filter(e => e.status === "success");

    return {
      totalExecutions: executions.length,
      successRate: (successful.length / executions.length) * 100,
      avgDuration: executions.reduce((sum, e) => sum + e.duration, 0) / executions.length,
      avgCost: executions.reduce((sum, e) => sum + e.cost, 0) / executions.length,
      avgTokens: executions.reduce((sum, e) => sum + e.tokenUsage, 0) / executions.length,
    };
  }
}

// ============================================================================
// SINGLETON & FACTORY
// ============================================================================

let instance: SuggestionEngine | null = null;

export function getSuggestionEngine(): SuggestionEngine {
  if (!instance) {
    instance = new SuggestionEngine();
  }
  return instance;
}

export function createSuggestionEngine(
  config: Partial<IntelligenceConfig> = {}
): SuggestionEngine {
  instance = new SuggestionEngine(config);
  return instance;
}
