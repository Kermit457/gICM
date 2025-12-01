/**
 * Model Evaluator Types
 * Phase 16D: AI Operations - Model Evaluation & Benchmarking
 */

import { z } from "zod";

// =============================================================================
// Model Registry
// =============================================================================

export const ModelProviderSchema = z.enum([
  "openai",
  "anthropic",
  "google",
  "cohere",
  "mistral",
  "azure",
  "aws_bedrock",
  "groq",
  "together",
  "perplexity",
  "replicate",
  "huggingface",
  "local",
  "custom",
]);
export type ModelProvider = z.infer<typeof ModelProviderSchema>;

export const ModelCapabilitySchema = z.enum([
  "text_generation",
  "chat",
  "code_generation",
  "code_completion",
  "vision",
  "audio",
  "embedding",
  "function_calling",
  "structured_output",
  "reasoning",
  "multilingual",
]);
export type ModelCapability = z.infer<typeof ModelCapabilitySchema>;

export const ModelInfoSchema = z.object({
  id: z.string(),
  provider: ModelProviderSchema,
  name: z.string(),
  displayName: z.string().optional(),
  version: z.string().optional(),

  // Capabilities
  capabilities: z.array(ModelCapabilitySchema),

  // Specifications
  contextWindow: z.number(),
  maxOutputTokens: z.number().optional(),
  trainingCutoff: z.string().optional(),

  // Pricing
  inputPricePerMillion: z.number(),
  outputPricePerMillion: z.number(),

  // Performance characteristics
  avgLatencyMs: z.number().optional(),
  tokensPerSecond: z.number().optional(),

  // Status
  isAvailable: z.boolean().default(true),
  deprecatedAt: z.number().optional(),

  // Metadata
  tags: z.array(z.string()).default([]),
  notes: z.string().optional(),
});
export type ModelInfo = z.infer<typeof ModelInfoSchema>;

// =============================================================================
// Evaluation Tasks
// =============================================================================

export const EvalTaskTypeSchema = z.enum([
  "text_completion",
  "question_answering",
  "summarization",
  "translation",
  "code_generation",
  "code_review",
  "sentiment_analysis",
  "classification",
  "extraction",
  "reasoning",
  "math",
  "creative_writing",
  "instruction_following",
  "conversation",
  "custom",
]);
export type EvalTaskType = z.infer<typeof EvalTaskTypeSchema>;

export const EvalDifficultySchema = z.enum([
  "easy",
  "medium",
  "hard",
  "expert",
]);
export type EvalDifficulty = z.infer<typeof EvalDifficultySchema>;

export const EvalTaskSchema = z.object({
  id: z.string(),
  type: EvalTaskTypeSchema,
  name: z.string(),
  description: z.string().optional(),
  difficulty: EvalDifficultySchema.default("medium"),

  // Input
  prompt: z.string(),
  systemPrompt: z.string().optional(),
  context: z.string().optional(),

  // Expected output
  expectedOutput: z.string().optional(),
  acceptableOutputs: z.array(z.string()).optional(),
  evaluationCriteria: z.array(z.string()).optional(),

  // Evaluation config
  metrics: z.array(z.string()).default(["accuracy", "relevance"]),
  passingScore: z.number().default(0.7),

  // Constraints
  maxTokens: z.number().optional(),
  timeoutMs: z.number().optional(),

  // Metadata
  tags: z.array(z.string()).default([]),
  category: z.string().optional(),
  weight: z.number().default(1).describe("Weight in benchmark scoring"),
  createdAt: z.number(),
});
export type EvalTask = z.infer<typeof EvalTaskSchema>;

// =============================================================================
// Evaluation Metrics
// =============================================================================

export const MetricTypeSchema = z.enum([
  // Quality metrics
  "accuracy",
  "relevance",
  "coherence",
  "fluency",
  "completeness",
  "correctness",
  "creativity",

  // Code metrics
  "code_correctness",
  "code_quality",
  "test_pass_rate",

  // Similarity metrics
  "exact_match",
  "fuzzy_match",
  "semantic_similarity",
  "bleu",
  "rouge",

  // Performance metrics
  "latency",
  "throughput",
  "tokens_per_second",

  // Cost metrics
  "cost_per_request",
  "cost_per_token",

  // Safety metrics
  "toxicity",
  "bias",
  "hallucination_rate",

  // Custom
  "custom",
]);
export type MetricType = z.infer<typeof MetricTypeSchema>;

export const MetricResultSchema = z.object({
  metric: MetricTypeSchema,
  score: z.number().min(0).max(1),
  rawValue: z.unknown().optional(),
  details: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
});
export type MetricResult = z.infer<typeof MetricResultSchema>;

// =============================================================================
// Evaluation Results
// =============================================================================

export const EvalResultSchema = z.object({
  id: z.string(),
  taskId: z.string(),
  modelId: z.string(),
  timestamp: z.number(),

  // Input/Output
  prompt: z.string(),
  response: z.string(),
  expectedOutput: z.string().optional(),

  // Metrics
  metrics: z.array(MetricResultSchema),
  overallScore: z.number().min(0).max(1),
  passed: z.boolean(),

  // Performance
  inputTokens: z.number(),
  outputTokens: z.number(),
  latencyMs: z.number(),
  cost: z.number(),

  // Evaluation metadata
  evaluatorModel: z.string().optional(),
  humanEvaluated: z.boolean().default(false),
  humanScore: z.number().optional(),
  humanNotes: z.string().optional(),

  // Error handling
  error: z.string().optional(),
  timedOut: z.boolean().default(false),
});
export type EvalResult = z.infer<typeof EvalResultSchema>;

// =============================================================================
// Benchmarks
// =============================================================================

export const BenchmarkStatusSchema = z.enum([
  "draft",
  "ready",
  "running",
  "completed",
  "failed",
]);
export type BenchmarkStatus = z.infer<typeof BenchmarkStatusSchema>;

export const BenchmarkConfigSchema = z.object({
  // Evaluation settings
  runsPerTask: z.number().default(1),
  temperature: z.number().default(0),
  maxConcurrent: z.number().default(5),
  timeoutMs: z.number().default(60000),

  // Model selection
  useEvaluatorModel: z.boolean().default(true),
  evaluatorModelId: z.string().optional(),

  // Metrics
  primaryMetric: MetricTypeSchema.default("accuracy"),
  includePerformanceMetrics: z.boolean().default(true),
  includeCostMetrics: z.boolean().default(true),

  // Sampling
  sampleSize: z.number().optional().describe("Subset of tasks to run"),
  randomSeed: z.number().optional(),
});
export type BenchmarkConfig = z.infer<typeof BenchmarkConfigSchema>;

export const BenchmarkSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  status: BenchmarkStatusSchema,

  // Tasks
  taskIds: z.array(z.string()),
  taskCount: z.number(),

  // Models to evaluate
  modelIds: z.array(z.string()),

  // Configuration
  config: BenchmarkConfigSchema,

  // Progress
  completedTasks: z.number().default(0),
  totalTasks: z.number().default(0),
  startedAt: z.number().optional(),
  completedAt: z.number().optional(),

  // Metadata
  tags: z.array(z.string()).default([]),
  createdAt: z.number(),
  createdBy: z.string().optional(),
});
export type Benchmark = z.infer<typeof BenchmarkSchema>;

export const BenchmarkResultSchema = z.object({
  benchmarkId: z.string(),
  modelId: z.string(),
  calculatedAt: z.number(),

  // Aggregate scores
  overallScore: z.number(),
  passRate: z.number(),

  // Per-metric scores
  metricScores: z.record(MetricTypeSchema, z.number()),

  // Per-task-type scores
  taskTypeScores: z.record(EvalTaskTypeSchema, z.number()),

  // Per-difficulty scores
  difficultyScores: z.record(EvalDifficultySchema, z.number()),

  // Performance
  avgLatencyMs: z.number(),
  avgTokensPerSecond: z.number(),
  totalTokens: z.number(),
  totalCost: z.number(),

  // Individual results
  resultIds: z.array(z.string()),
  passedCount: z.number(),
  failedCount: z.number(),
  errorCount: z.number(),
});
export type BenchmarkResult = z.infer<typeof BenchmarkResultSchema>;

// =============================================================================
// Model Comparison
// =============================================================================

export const ModelRankingSchema = z.object({
  modelId: z.string(),
  rank: z.number(),
  score: z.number(),
  change: z.number().optional().describe("Change in rank from previous benchmark"),
});
export type ModelRanking = z.infer<typeof ModelRankingSchema>;

export const ComparisonResultSchema = z.object({
  id: z.string(),
  benchmarkId: z.string(),
  timestamp: z.number(),

  // Rankings
  overallRankings: z.array(ModelRankingSchema),
  rankingsByMetric: z.record(MetricTypeSchema, z.array(ModelRankingSchema)),
  rankingsByTaskType: z.record(EvalTaskTypeSchema, z.array(ModelRankingSchema)),

  // Best models
  bestOverall: z.string(),
  bestByCategory: z.record(z.string(), z.string()),

  // Trade-offs
  bestQualityPrice: z.string().optional().describe("Best quality/price ratio"),
  bestLatency: z.string().optional(),
  bestForProduction: z.string().optional(),

  // Statistical analysis
  significantDifferences: z.array(z.object({
    model1: z.string(),
    model2: z.string(),
    metric: MetricTypeSchema,
    pValue: z.number(),
    difference: z.number(),
  })),
});
export type ComparisonResult = z.infer<typeof ComparisonResultSchema>;

// =============================================================================
// Model Selection
// =============================================================================

export const SelectionCriteriaSchema = z.object({
  // Required capabilities
  requiredCapabilities: z.array(ModelCapabilitySchema).optional(),

  // Task type
  taskType: EvalTaskTypeSchema.optional(),

  // Quality thresholds
  minOverallScore: z.number().min(0).max(1).optional(),
  minMetricScores: z.record(MetricTypeSchema, z.number()).optional(),

  // Performance constraints
  maxLatencyMs: z.number().optional(),
  minTokensPerSecond: z.number().optional(),

  // Cost constraints
  maxCostPerRequest: z.number().optional(),
  maxCostPer1kTokens: z.number().optional(),

  // Preferences
  preferredProviders: z.array(ModelProviderSchema).optional(),
  excludedProviders: z.array(ModelProviderSchema).optional(),
  excludedModels: z.array(z.string()).optional(),

  // Optimization target
  optimizeFor: z.enum(["quality", "cost", "latency", "balanced"]).default("balanced"),
});
export type SelectionCriteria = z.infer<typeof SelectionCriteriaSchema>;

export const ModelRecommendationSchema = z.object({
  modelId: z.string(),
  score: z.number(),
  rank: z.number(),
  matchScore: z.number().describe("How well it matches criteria"),

  // Why recommended
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),

  // Trade-offs
  qualityScore: z.number(),
  costScore: z.number(),
  latencyScore: z.number(),

  // Estimated metrics
  estimatedLatencyMs: z.number().optional(),
  estimatedCostPerRequest: z.number().optional(),
  estimatedAccuracy: z.number().optional(),

  // Confidence
  confidence: z.number().min(0).max(1),
  dataPoints: z.number(),
});
export type ModelRecommendation = z.infer<typeof ModelRecommendationSchema>;

// =============================================================================
// Evaluation Datasets
// =============================================================================

export const DatasetSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),

  // Content
  taskType: EvalTaskTypeSchema,
  tasks: z.array(EvalTaskSchema),
  taskCount: z.number(),

  // Metadata
  source: z.string().optional(),
  version: z.string().optional(),
  tags: z.array(z.string()).default([]),
  language: z.string().default("en"),

  // Quality
  validated: z.boolean().default(false),
  validatedBy: z.string().optional(),
  validatedAt: z.number().optional(),

  // Stats
  avgDifficulty: z.number().optional(),
  difficultyDistribution: z.record(EvalDifficultySchema, z.number()).optional(),

  createdAt: z.number(),
  updatedAt: z.number(),
});
export type Dataset = z.infer<typeof DatasetSchema>;

// =============================================================================
// Configuration
// =============================================================================

export const ModelEvaluatorConfigSchema = z.object({
  // General
  enabled: z.boolean().default(true),

  // Default evaluator model
  defaultEvaluatorModel: z.string().default("gpt-4o"),

  // Concurrency
  maxConcurrentEvals: z.number().default(10),
  maxConcurrentBenchmarks: z.number().default(3),

  // Timeouts
  defaultTimeoutMs: z.number().default(60000),
  defaultTaskTimeoutMs: z.number().default(30000),

  // Caching
  cacheResults: z.boolean().default(true),
  cacheExpirationHours: z.number().default(24),

  // Auto-evaluation
  autoEvaluateNewModels: z.boolean().default(false),
  autoEvaluationDatasetId: z.string().optional(),

  // Thresholds
  defaultPassingScore: z.number().default(0.7),
  significanceLevel: z.number().default(0.05),

  // Cost limits
  maxCostPerBenchmark: z.number().optional(),
  maxCostPerDay: z.number().optional(),

  // Retention
  resultRetentionDays: z.number().default(90),
});
export type ModelEvaluatorConfig = z.infer<typeof ModelEvaluatorConfigSchema>;

// =============================================================================
// Events
// =============================================================================

export type ModelEvaluatorEvents = {
  // Models
  modelRegistered: (model: ModelInfo) => void;
  modelUpdated: (model: ModelInfo) => void;
  modelDeprecated: (modelId: string) => void;

  // Tasks
  taskCreated: (task: EvalTask) => void;
  taskUpdated: (task: EvalTask) => void;

  // Evaluation
  evaluationStarted: (taskId: string, modelId: string) => void;
  evaluationCompleted: (result: EvalResult) => void;
  evaluationFailed: (taskId: string, modelId: string, error: Error) => void;

  // Benchmarks
  benchmarkCreated: (benchmark: Benchmark) => void;
  benchmarkStarted: (benchmark: Benchmark) => void;
  benchmarkProgress: (benchmarkId: string, completed: number, total: number) => void;
  benchmarkCompleted: (benchmark: Benchmark, results: BenchmarkResult[]) => void;
  benchmarkFailed: (benchmark: Benchmark, error: Error) => void;

  // Comparisons
  comparisonGenerated: (comparison: ComparisonResult) => void;

  // Recommendations
  recommendationGenerated: (recommendations: ModelRecommendation[]) => void;

  // Errors
  error: (error: Error) => void;
};

// =============================================================================
// Storage Interface
// =============================================================================

export interface ModelEvaluatorStorage {
  // Models
  saveModel(model: ModelInfo): Promise<void>;
  getModel(id: string): Promise<ModelInfo | null>;
  listModels(filters?: {
    provider?: ModelProvider;
    capabilities?: ModelCapability[];
    available?: boolean;
  }): Promise<ModelInfo[]>;

  // Tasks
  saveTask(task: EvalTask): Promise<void>;
  getTask(id: string): Promise<EvalTask | null>;
  listTasks(filters?: {
    type?: EvalTaskType;
    difficulty?: EvalDifficulty;
    category?: string;
  }): Promise<EvalTask[]>;

  // Results
  saveResult(result: EvalResult): Promise<void>;
  getResult(id: string): Promise<EvalResult | null>;
  listResults(filters: {
    taskId?: string;
    modelId?: string;
    startTime?: number;
    endTime?: number;
  }): Promise<EvalResult[]>;

  // Benchmarks
  saveBenchmark(benchmark: Benchmark): Promise<void>;
  getBenchmark(id: string): Promise<Benchmark | null>;
  listBenchmarks(status?: BenchmarkStatus): Promise<Benchmark[]>;
  saveBenchmarkResult(result: BenchmarkResult): Promise<void>;
  getBenchmarkResults(benchmarkId: string): Promise<BenchmarkResult[]>;

  // Comparisons
  saveComparison(comparison: ComparisonResult): Promise<void>;
  getComparison(id: string): Promise<ComparisonResult | null>;

  // Datasets
  saveDataset(dataset: Dataset): Promise<void>;
  getDataset(id: string): Promise<Dataset | null>;
  listDatasets(): Promise<Dataset[]>;
}

// =============================================================================
// Built-in Evaluation Prompts
// =============================================================================

export const EVALUATION_PROMPTS = {
  accuracy: `Evaluate the accuracy of the following response compared to the expected output.

Expected: {{expected}}
Actual: {{actual}}

Rate the accuracy on a scale of 0 to 1, where:
- 0: Completely incorrect or irrelevant
- 0.5: Partially correct with significant errors
- 1: Fully correct and complete

Respond with just a number between 0 and 1.`,

  relevance: `Evaluate how relevant the response is to the given prompt.

Prompt: {{prompt}}
Response: {{response}}

Rate the relevance on a scale of 0 to 1, where:
- 0: Completely irrelevant
- 0.5: Somewhat relevant but off-topic in parts
- 1: Highly relevant and on-topic

Respond with just a number between 0 and 1.`,

  coherence: `Evaluate the coherence and logical flow of the following text.

Text: {{text}}

Rate the coherence on a scale of 0 to 1, where:
- 0: Incoherent, illogical, or contradictory
- 0.5: Somewhat coherent but with logical gaps
- 1: Highly coherent with clear logical flow

Respond with just a number between 0 and 1.`,

  fluency: `Evaluate the fluency and readability of the following text.

Text: {{text}}

Rate the fluency on a scale of 0 to 1, where:
- 0: Difficult to read, poor grammar/syntax
- 0.5: Readable but with some awkward phrasing
- 1: Excellent fluency, natural and easy to read

Respond with just a number between 0 and 1.`,

  code_correctness: `Evaluate the correctness of the following code solution.

Problem: {{problem}}
Code: {{code}}
Expected behavior: {{expected}}

Rate the correctness on a scale of 0 to 1, where:
- 0: Does not compile/run or produces wrong output
- 0.5: Partially works but has bugs
- 1: Fully correct and handles edge cases

Respond with just a number between 0 and 1.`,
};

// =============================================================================
// Common Datasets
// =============================================================================

export const BUILT_IN_DATASETS = {
  general_qa: {
    name: "General Q&A",
    description: "General knowledge question answering",
    taskType: "question_answering" as const,
  },
  code_generation: {
    name: "Code Generation",
    description: "Programming challenges and code generation tasks",
    taskType: "code_generation" as const,
  },
  summarization: {
    name: "Text Summarization",
    description: "Document and text summarization tasks",
    taskType: "summarization" as const,
  },
  reasoning: {
    name: "Logical Reasoning",
    description: "Logic puzzles and reasoning tasks",
    taskType: "reasoning" as const,
  },
  math: {
    name: "Math Problems",
    description: "Mathematical problem solving",
    taskType: "math" as const,
  },
};

// =============================================================================
// Helpers
// =============================================================================

export function calculateOverallScore(metrics: MetricResult[], weights?: Record<string, number>): number {
  if (metrics.length === 0) return 0;

  let totalWeight = 0;
  let weightedSum = 0;

  for (const metric of metrics) {
    const weight = weights?.[metric.metric] || 1;
    weightedSum += metric.score * weight;
    totalWeight += weight;
  }

  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}

export function calculatePassRate(results: EvalResult[]): number {
  if (results.length === 0) return 0;
  return results.filter((r) => r.passed).length / results.length;
}

export function compareModels(
  results: BenchmarkResult[],
  metric: MetricType
): ModelRanking[] {
  const scores = results.map((r) => ({
    modelId: r.modelId,
    score: r.metricScores[metric] || r.overallScore,
  }));

  scores.sort((a, b) => b.score - a.score);

  return scores.map((s, i) => ({
    modelId: s.modelId,
    rank: i + 1,
    score: s.score,
  }));
}

export function calculateStatisticalSignificance(
  scores1: number[],
  scores2: number[]
): { significant: boolean; pValue: number } {
  // Simplified t-test (would use proper statistical library in production)
  if (scores1.length < 2 || scores2.length < 2) {
    return { significant: false, pValue: 1 };
  }

  const mean1 = scores1.reduce((a, b) => a + b, 0) / scores1.length;
  const mean2 = scores2.reduce((a, b) => a + b, 0) / scores2.length;

  const variance1 = scores1.reduce((sum, x) => sum + Math.pow(x - mean1, 2), 0) / (scores1.length - 1);
  const variance2 = scores2.reduce((sum, x) => sum + Math.pow(x - mean2, 2), 0) / (scores2.length - 1);

  const pooledStdErr = Math.sqrt(variance1 / scores1.length + variance2 / scores2.length);

  if (pooledStdErr === 0) {
    return { significant: false, pValue: 1 };
  }

  const t = (mean1 - mean2) / pooledStdErr;
  const df = scores1.length + scores2.length - 2;

  // Approximate p-value (simplified)
  const pValue = Math.exp(-Math.abs(t) * Math.sqrt(df) / 2);

  return {
    significant: pValue < 0.05,
    pValue,
  };
}
