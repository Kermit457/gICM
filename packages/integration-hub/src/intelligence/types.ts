/**
 * Intelligence Module Types
 * Phase 10: Intelligence & Automation
 */

import { z } from "zod";

// ============================================================================
// SUGGESTION TYPES
// ============================================================================

export const SuggestionTypeSchema = z.enum([
  "optimization",      // Performance improvements
  "cost_reduction",    // Cost saving opportunities
  "error_fix",         // Fix for common errors
  "best_practice",     // Industry best practices
  "security",          // Security improvements
  "reliability",       // Reliability enhancements
  "similar_pipeline",  // Similar existing pipelines
]);
export type SuggestionType = z.infer<typeof SuggestionTypeSchema>;

export const SuggestionPrioritySchema = z.enum(["low", "medium", "high", "critical"]);
export type SuggestionPriority = z.infer<typeof SuggestionPrioritySchema>;

export const SuggestionStatusSchema = z.enum([
  "pending",
  "applied",
  "dismissed",
  "expired",
]);
export type SuggestionStatus = z.infer<typeof SuggestionStatusSchema>;

export const SuggestionSchema = z.object({
  id: z.string(),
  type: SuggestionTypeSchema,
  priority: SuggestionPrioritySchema,
  status: SuggestionStatusSchema,
  title: z.string(),
  description: z.string(),
  reasoning: z.string(),
  pipelineId: z.string().optional(),
  stepIndex: z.number().optional(),

  // Impact estimates
  estimatedImpact: z.object({
    costReduction: z.number().optional(),      // percentage
    speedImprovement: z.number().optional(),   // percentage
    reliabilityGain: z.number().optional(),    // percentage
    tokenSavings: z.number().optional(),       // absolute
  }).optional(),

  // Auto-fix capability
  autoFixAvailable: z.boolean(),
  autoFixConfig: z.record(z.unknown()).optional(),

  // Metadata
  confidence: z.number().min(0).max(1),
  createdAt: z.date(),
  expiresAt: z.date().optional(),
  appliedAt: z.date().optional(),
  dismissedAt: z.date().optional(),
  dismissReason: z.string().optional(),
});
export type Suggestion = z.infer<typeof SuggestionSchema>;

// ============================================================================
// SIMILAR PIPELINE
// ============================================================================

export const SimilarPipelineSchema = z.object({
  pipelineId: z.string(),
  pipelineName: z.string(),
  similarity: z.number().min(0).max(1),  // 0-1 score
  matchedFeatures: z.array(z.string()),
  differingFeatures: z.array(z.string()),
  performanceComparison: z.object({
    avgDuration: z.number(),
    avgCost: z.number(),
    successRate: z.number(),
  }).optional(),
});
export type SimilarPipeline = z.infer<typeof SimilarPipelineSchema>;

// ============================================================================
// OPTIMIZATION RECOMMENDATION
// ============================================================================

export const OptimizationCategorySchema = z.enum([
  "prompt_efficiency",    // Reduce token usage in prompts
  "step_consolidation",   // Merge redundant steps
  "parallel_execution",   // Run steps in parallel
  "caching",              // Add caching for repeated calls
  "model_selection",      // Use appropriate model for task
  "retry_strategy",       // Optimize retry logic
  "batching",             // Batch similar operations
  "early_termination",    // Add early exit conditions
]);
export type OptimizationCategory = z.infer<typeof OptimizationCategorySchema>;

export const OptimizationSchema = z.object({
  id: z.string(),
  category: OptimizationCategorySchema,
  title: z.string(),
  description: z.string(),
  currentValue: z.string(),
  suggestedValue: z.string(),
  estimatedSavings: z.object({
    tokens: z.number().optional(),
    cost: z.number().optional(),
    time: z.number().optional(),  // ms
  }),
  codeChange: z.object({
    before: z.string(),
    after: z.string(),
    stepIndex: z.number().optional(),
  }).optional(),
  confidence: z.number().min(0).max(1),
});
export type Optimization = z.infer<typeof OptimizationSchema>;

// ============================================================================
// ERROR PATTERNS & AUTO-FIX
// ============================================================================

export const ErrorPatternSchema = z.object({
  id: z.string(),
  pattern: z.string(),           // Regex or string pattern
  errorType: z.string(),
  frequency: z.number(),         // How often this occurs
  description: z.string(),
  commonCauses: z.array(z.string()),
  suggestedFixes: z.array(z.object({
    title: z.string(),
    description: z.string(),
    autoFixable: z.boolean(),
    fixConfig: z.record(z.unknown()).optional(),
  })),
});
export type ErrorPattern = z.infer<typeof ErrorPatternSchema>;

export const AutoFixSchema = z.object({
  id: z.string(),
  errorPatternId: z.string(),
  pipelineId: z.string(),
  stepIndex: z.number().optional(),
  fixType: z.enum(["config_change", "step_modification", "retry_config", "model_change", "prompt_edit"]),
  originalConfig: z.record(z.unknown()),
  fixedConfig: z.record(z.unknown()),
  applied: z.boolean(),
  appliedAt: z.date().optional(),
  rollbackAvailable: z.boolean(),
});
export type AutoFix = z.infer<typeof AutoFixSchema>;

// ============================================================================
// PIPELINE ANALYSIS
// ============================================================================

export const PipelineAnalysisSchema = z.object({
  pipelineId: z.string(),
  analyzedAt: z.date(),

  // Health scores (0-100)
  scores: z.object({
    overall: z.number(),
    efficiency: z.number(),
    reliability: z.number(),
    costEffectiveness: z.number(),
    maintainability: z.number(),
  }),

  // Findings
  suggestions: z.array(SuggestionSchema),
  optimizations: z.array(OptimizationSchema),
  similarPipelines: z.array(SimilarPipelineSchema),
  errorPatterns: z.array(ErrorPatternSchema),

  // Stats
  executionStats: z.object({
    totalExecutions: z.number(),
    successRate: z.number(),
    avgDuration: z.number(),
    avgCost: z.number(),
    avgTokens: z.number(),
  }),
});
export type PipelineAnalysis = z.infer<typeof PipelineAnalysisSchema>;

// ============================================================================
// CONFIGURATION
// ============================================================================

export const IntelligenceConfigSchema = z.object({
  // Analysis settings
  analysisEnabled: z.boolean().default(true),
  autoAnalyzeNewPipelines: z.boolean().default(true),
  analysisIntervalHours: z.number().default(24),

  // Suggestions
  suggestionsEnabled: z.boolean().default(true),
  minConfidenceThreshold: z.number().min(0).max(1).default(0.7),
  maxSuggestionsPerPipeline: z.number().default(10),

  // Auto-fix
  autoFixEnabled: z.boolean().default(false),  // Opt-in
  autoFixMinConfidence: z.number().min(0).max(1).default(0.9),
  autoFixCategories: z.array(z.string()).default([]),

  // Similar pipelines
  similarityThreshold: z.number().min(0).max(1).default(0.7),
  maxSimilarPipelines: z.number().default(5),

  // LLM settings
  llmModel: z.string().default("claude-3-haiku-20240307"),
  maxAnalysisTokens: z.number().default(4000),
});
export type IntelligenceConfig = z.infer<typeof IntelligenceConfigSchema>;

// ============================================================================
// EVENTS
// ============================================================================

export interface IntelligenceEvents {
  "analysis:started": (pipelineId: string) => void;
  "analysis:completed": (analysis: PipelineAnalysis) => void;
  "suggestion:created": (suggestion: Suggestion) => void;
  "suggestion:applied": (suggestion: Suggestion) => void;
  "suggestion:dismissed": (suggestion: Suggestion) => void;
  "autofix:applied": (fix: AutoFix) => void;
  "autofix:rolled_back": (fix: AutoFix) => void;
  "similar:found": (pipelineId: string, similar: SimilarPipeline[]) => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const OPTIMIZATION_TEMPLATES: Record<OptimizationCategory, {
  title: string;
  description: string;
  checkFn: string;
}> = {
  prompt_efficiency: {
    title: "Optimize Prompt Length",
    description: "Reduce token usage by streamlining prompts",
    checkFn: "checkPromptEfficiency",
  },
  step_consolidation: {
    title: "Consolidate Steps",
    description: "Merge similar or redundant pipeline steps",
    checkFn: "checkStepConsolidation",
  },
  parallel_execution: {
    title: "Enable Parallel Execution",
    description: "Run independent steps concurrently",
    checkFn: "checkParallelOpportunities",
  },
  caching: {
    title: "Add Result Caching",
    description: "Cache repeated LLM calls with same inputs",
    checkFn: "checkCachingOpportunities",
  },
  model_selection: {
    title: "Optimize Model Selection",
    description: "Use cost-effective models for simpler tasks",
    checkFn: "checkModelSelection",
  },
  retry_strategy: {
    title: "Improve Retry Strategy",
    description: "Optimize retry logic to reduce failures",
    checkFn: "checkRetryStrategy",
  },
  batching: {
    title: "Batch Operations",
    description: "Combine multiple similar operations",
    checkFn: "checkBatchingOpportunities",
  },
  early_termination: {
    title: "Add Early Exit",
    description: "Skip unnecessary steps based on conditions",
    checkFn: "checkEarlyTermination",
  },
};

export const COMMON_ERROR_PATTERNS: Omit<ErrorPattern, "id" | "frequency">[] = [
  {
    pattern: "rate_limit|429|too many requests",
    errorType: "rate_limit",
    description: "API rate limit exceeded",
    commonCauses: [
      "Too many concurrent requests",
      "Burst of requests without backoff",
      "Missing rate limiting on client side",
    ],
    suggestedFixes: [
      {
        title: "Add exponential backoff",
        description: "Implement exponential backoff with jitter",
        autoFixable: true,
        fixConfig: { retryDelay: "exponential", maxRetries: 3 },
      },
      {
        title: "Add request queuing",
        description: "Queue requests to respect rate limits",
        autoFixable: true,
        fixConfig: { enableQueue: true, maxConcurrent: 5 },
      },
    ],
  },
  {
    pattern: "timeout|ETIMEDOUT|deadline exceeded",
    errorType: "timeout",
    description: "Request timed out",
    commonCauses: [
      "Long-running LLM inference",
      "Network latency",
      "Timeout too short for task",
    ],
    suggestedFixes: [
      {
        title: "Increase timeout",
        description: "Extend timeout for complex operations",
        autoFixable: true,
        fixConfig: { timeout: 120000 },
      },
      {
        title: "Break into smaller steps",
        description: "Split long operations into smaller chunks",
        autoFixable: false,
      },
    ],
  },
  {
    pattern: "context.length|max.tokens|token limit",
    errorType: "token_limit",
    description: "Token limit exceeded",
    commonCauses: [
      "Prompt too long",
      "Input data too large",
      "Accumulated context in conversation",
    ],
    suggestedFixes: [
      {
        title: "Truncate input",
        description: "Limit input size to fit context window",
        autoFixable: true,
        fixConfig: { maxInputTokens: 3000 },
      },
      {
        title: "Use larger context model",
        description: "Switch to model with larger context window",
        autoFixable: true,
        fixConfig: { model: "claude-3-sonnet-20240229" },
      },
    ],
  },
  {
    pattern: "invalid.json|JSON.parse|Unexpected token",
    errorType: "json_parse",
    description: "Failed to parse JSON response",
    commonCauses: [
      "LLM returned malformed JSON",
      "Missing JSON mode instruction",
      "Response truncated",
    ],
    suggestedFixes: [
      {
        title: "Add JSON mode",
        description: "Force JSON output format",
        autoFixable: true,
        fixConfig: { outputFormat: "json" },
      },
      {
        title: "Add JSON validation prompt",
        description: "Include explicit JSON formatting instructions",
        autoFixable: true,
      },
    ],
  },
  {
    pattern: "authentication|unauthorized|401|invalid.key",
    errorType: "auth_error",
    description: "Authentication failed",
    commonCauses: [
      "Invalid or expired API key",
      "Missing credentials",
      "Wrong environment",
    ],
    suggestedFixes: [
      {
        title: "Check API key",
        description: "Verify API key is valid and not expired",
        autoFixable: false,
      },
    ],
  },
];
