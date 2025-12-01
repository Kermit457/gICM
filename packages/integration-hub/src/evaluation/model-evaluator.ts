/**
 * Model Evaluator Implementation
 * Phase 16D: AI Operations - Model Evaluation & Benchmarking
 */

import { EventEmitter } from "eventemitter3";
import { randomUUID } from "crypto";
import {
  type ModelEvaluatorConfig,
  ModelEvaluatorConfigSchema,
  type ModelEvaluatorEvents,
  type ModelEvaluatorStorage,
  type ModelInfo,
  type ModelProvider,
  type ModelCapability,
  type EvalTask,
  type EvalTaskType,
  type EvalDifficulty,
  type EvalResult,
  type MetricResult,
  type MetricType,
  type Benchmark,
  type BenchmarkStatus,
  type BenchmarkConfig,
  type BenchmarkResult,
  type ComparisonResult,
  type ModelRanking,
  type SelectionCriteria,
  type ModelRecommendation,
  type Dataset,
  EVALUATION_PROMPTS,
  calculateOverallScore,
  calculatePassRate,
  compareModels,
  calculateStatisticalSignificance,
} from "./types.js";

// =============================================================================
// In-Memory Storage
// =============================================================================

class InMemoryModelEvaluatorStorage implements ModelEvaluatorStorage {
  private models: Map<string, ModelInfo> = new Map();
  private tasks: Map<string, EvalTask> = new Map();
  private results: Map<string, EvalResult> = new Map();
  private benchmarks: Map<string, Benchmark> = new Map();
  private benchmarkResults: Map<string, BenchmarkResult[]> = new Map();
  private comparisons: Map<string, ComparisonResult> = new Map();
  private datasets: Map<string, Dataset> = new Map();

  async saveModel(model: ModelInfo): Promise<void> {
    this.models.set(model.id, model);
  }

  async getModel(id: string): Promise<ModelInfo | null> {
    return this.models.get(id) || null;
  }

  async listModels(filters?: {
    provider?: ModelProvider;
    capabilities?: ModelCapability[];
    available?: boolean;
  }): Promise<ModelInfo[]> {
    return Array.from(this.models.values()).filter((m) => {
      if (filters?.provider && m.provider !== filters.provider) return false;
      if (filters?.capabilities && !filters.capabilities.every((c) => m.capabilities.includes(c))) return false;
      if (filters?.available !== undefined && m.isAvailable !== filters.available) return false;
      return true;
    });
  }

  async saveTask(task: EvalTask): Promise<void> {
    this.tasks.set(task.id, task);
  }

  async getTask(id: string): Promise<EvalTask | null> {
    return this.tasks.get(id) || null;
  }

  async listTasks(filters?: {
    type?: EvalTaskType;
    difficulty?: EvalDifficulty;
    category?: string;
  }): Promise<EvalTask[]> {
    return Array.from(this.tasks.values()).filter((t) => {
      if (filters?.type && t.type !== filters.type) return false;
      if (filters?.difficulty && t.difficulty !== filters.difficulty) return false;
      if (filters?.category && t.category !== filters.category) return false;
      return true;
    });
  }

  async saveResult(result: EvalResult): Promise<void> {
    this.results.set(result.id, result);
  }

  async getResult(id: string): Promise<EvalResult | null> {
    return this.results.get(id) || null;
  }

  async listResults(filters: {
    taskId?: string;
    modelId?: string;
    startTime?: number;
    endTime?: number;
  }): Promise<EvalResult[]> {
    return Array.from(this.results.values()).filter((r) => {
      if (filters.taskId && r.taskId !== filters.taskId) return false;
      if (filters.modelId && r.modelId !== filters.modelId) return false;
      if (filters.startTime && r.timestamp < filters.startTime) return false;
      if (filters.endTime && r.timestamp > filters.endTime) return false;
      return true;
    });
  }

  async saveBenchmark(benchmark: Benchmark): Promise<void> {
    this.benchmarks.set(benchmark.id, benchmark);
  }

  async getBenchmark(id: string): Promise<Benchmark | null> {
    return this.benchmarks.get(id) || null;
  }

  async listBenchmarks(status?: BenchmarkStatus): Promise<Benchmark[]> {
    return Array.from(this.benchmarks.values()).filter((b) => {
      if (status && b.status !== status) return false;
      return true;
    });
  }

  async saveBenchmarkResult(result: BenchmarkResult): Promise<void> {
    const existing = this.benchmarkResults.get(result.benchmarkId) || [];
    const index = existing.findIndex((r) => r.modelId === result.modelId);
    if (index >= 0) {
      existing[index] = result;
    } else {
      existing.push(result);
    }
    this.benchmarkResults.set(result.benchmarkId, existing);
  }

  async getBenchmarkResults(benchmarkId: string): Promise<BenchmarkResult[]> {
    return this.benchmarkResults.get(benchmarkId) || [];
  }

  async saveComparison(comparison: ComparisonResult): Promise<void> {
    this.comparisons.set(comparison.id, comparison);
  }

  async getComparison(id: string): Promise<ComparisonResult | null> {
    return this.comparisons.get(id) || null;
  }

  async saveDataset(dataset: Dataset): Promise<void> {
    this.datasets.set(dataset.id, dataset);
  }

  async getDataset(id: string): Promise<Dataset | null> {
    return this.datasets.get(id) || null;
  }

  async listDatasets(): Promise<Dataset[]> {
    return Array.from(this.datasets.values());
  }
}

// =============================================================================
// Model Evaluator
// =============================================================================

export class ModelEvaluator extends EventEmitter<ModelEvaluatorEvents> {
  private config: ModelEvaluatorConfig;
  private storage: ModelEvaluatorStorage;
  private runningBenchmarks: Set<string> = new Set();

  constructor(config: Partial<ModelEvaluatorConfig> = {}, storage?: ModelEvaluatorStorage) {
    super();
    this.config = ModelEvaluatorConfigSchema.parse(config);
    this.storage = storage || new InMemoryModelEvaluatorStorage();
  }

  // ===========================================================================
  // Model Management
  // ===========================================================================

  async registerModel(input: Omit<ModelInfo, "id">): Promise<ModelInfo> {
    const model: ModelInfo = {
      ...input,
      id: randomUUID(),
    };

    await this.storage.saveModel(model);
    this.emit("modelRegistered", model);
    return model;
  }

  async updateModel(id: string, updates: Partial<Omit<ModelInfo, "id">>): Promise<ModelInfo | null> {
    const model = await this.storage.getModel(id);
    if (!model) return null;

    const updated: ModelInfo = { ...model, ...updates };
    await this.storage.saveModel(updated);
    this.emit("modelUpdated", updated);
    return updated;
  }

  async deprecateModel(id: string): Promise<void> {
    const model = await this.storage.getModel(id);
    if (!model) return;

    model.isAvailable = false;
    model.deprecatedAt = Date.now();
    await this.storage.saveModel(model);
    this.emit("modelDeprecated", id);
  }

  async getModel(id: string): Promise<ModelInfo | null> {
    return this.storage.getModel(id);
  }

  async listModels(filters?: {
    provider?: ModelProvider;
    capabilities?: ModelCapability[];
    available?: boolean;
  }): Promise<ModelInfo[]> {
    return this.storage.listModels(filters);
  }

  // ===========================================================================
  // Task Management
  // ===========================================================================

  async createTask(input: Omit<EvalTask, "id" | "createdAt">): Promise<EvalTask> {
    const task: EvalTask = {
      ...input,
      id: randomUUID(),
      createdAt: Date.now(),
    };

    await this.storage.saveTask(task);
    this.emit("taskCreated", task);
    return task;
  }

  async updateTask(id: string, updates: Partial<Omit<EvalTask, "id" | "createdAt">>): Promise<EvalTask | null> {
    const task = await this.storage.getTask(id);
    if (!task) return null;

    const updated: EvalTask = { ...task, ...updates };
    await this.storage.saveTask(updated);
    this.emit("taskUpdated", updated);
    return updated;
  }

  async getTask(id: string): Promise<EvalTask | null> {
    return this.storage.getTask(id);
  }

  async listTasks(filters?: {
    type?: EvalTaskType;
    difficulty?: EvalDifficulty;
    category?: string;
  }): Promise<EvalTask[]> {
    return this.storage.listTasks(filters);
  }

  // ===========================================================================
  // Single Evaluation
  // ===========================================================================

  async evaluate(
    taskId: string,
    modelId: string,
    executeModel: (prompt: string, systemPrompt?: string) => Promise<{
      response: string;
      inputTokens: number;
      outputTokens: number;
      latencyMs: number;
      cost: number;
    }>,
    options?: {
      evaluatorExecute?: (prompt: string) => Promise<string>;
    }
  ): Promise<EvalResult> {
    const task = await this.storage.getTask(taskId);
    if (!task) throw new Error("Task not found");

    const model = await this.storage.getModel(modelId);
    if (!model) throw new Error("Model not found");

    this.emit("evaluationStarted", taskId, modelId);

    let response: string = "";
    let inputTokens = 0;
    let outputTokens = 0;
    let latencyMs = 0;
    let cost = 0;
    let error: string | undefined;
    let timedOut = false;

    try {
      // Execute model
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Timeout")), task.timeoutMs || this.config.defaultTaskTimeoutMs);
      });

      const result = await Promise.race([
        executeModel(task.prompt, task.systemPrompt),
        timeoutPromise,
      ]);

      response = result.response;
      inputTokens = result.inputTokens;
      outputTokens = result.outputTokens;
      latencyMs = result.latencyMs;
      cost = result.cost;
    } catch (e) {
      error = (e as Error).message;
      if (error === "Timeout") {
        timedOut = true;
      }
    }

    // Calculate metrics
    const metrics: MetricResult[] = [];

    if (!error && response) {
      for (const metricName of task.metrics) {
        const metric = metricName as MetricType;
        const score = await this.calculateMetric(
          metric,
          task,
          response,
          options?.evaluatorExecute
        );
        metrics.push(score);
      }
    }

    const overallScore = calculateOverallScore(metrics);
    const passed = overallScore >= task.passingScore;

    const result: EvalResult = {
      id: randomUUID(),
      taskId,
      modelId,
      timestamp: Date.now(),
      prompt: task.prompt,
      response,
      expectedOutput: task.expectedOutput,
      metrics,
      overallScore,
      passed,
      inputTokens,
      outputTokens,
      latencyMs,
      cost,
      evaluatorModel: this.config.defaultEvaluatorModel,
      humanEvaluated: false,
      error,
      timedOut,
    };

    await this.storage.saveResult(result);
    this.emit("evaluationCompleted", result);
    return result;
  }

  private async calculateMetric(
    metric: MetricType,
    task: EvalTask,
    response: string,
    evaluatorExecute?: (prompt: string) => Promise<string>
  ): Promise<MetricResult> {
    switch (metric) {
      case "exact_match":
        return {
          metric,
          score: task.expectedOutput === response ? 1 : 0,
        };

      case "fuzzy_match":
        return {
          metric,
          score: this.fuzzyMatch(task.expectedOutput || "", response),
        };

      case "latency":
        // Latency is tracked separately, normalized score
        return {
          metric,
          score: 1, // Will be calculated based on actual latency
        };

      case "accuracy":
      case "relevance":
      case "coherence":
      case "fluency":
        if (evaluatorExecute) {
          return this.llmEvaluate(metric, task, response, evaluatorExecute);
        }
        return { metric, score: 0.5, details: "No evaluator available" };

      default:
        return { metric, score: 0.5, details: "Metric not implemented" };
    }
  }

  private fuzzyMatch(expected: string, actual: string): number {
    const expectedLower = expected.toLowerCase().trim();
    const actualLower = actual.toLowerCase().trim();

    if (expectedLower === actualLower) return 1;
    if (actualLower.includes(expectedLower) || expectedLower.includes(actualLower)) return 0.8;

    // Simple word overlap
    const expectedWords = new Set(expectedLower.split(/\s+/));
    const actualWords = new Set(actualLower.split(/\s+/));
    const intersection = new Set([...expectedWords].filter((w) => actualWords.has(w)));

    return intersection.size / Math.max(expectedWords.size, actualWords.size);
  }

  private async llmEvaluate(
    metric: MetricType,
    task: EvalTask,
    response: string,
    evaluatorExecute: (prompt: string) => Promise<string>
  ): Promise<MetricResult> {
    const promptTemplate = EVALUATION_PROMPTS[metric as keyof typeof EVALUATION_PROMPTS];
    if (!promptTemplate) {
      return { metric, score: 0.5, details: "No evaluation prompt for metric" };
    }

    const evalPrompt = promptTemplate
      .replace("{{expected}}", task.expectedOutput || "")
      .replace("{{actual}}", response)
      .replace("{{prompt}}", task.prompt)
      .replace("{{response}}", response)
      .replace("{{text}}", response);

    try {
      const result = await evaluatorExecute(evalPrompt);
      const score = parseFloat(result.trim());

      if (isNaN(score) || score < 0 || score > 1) {
        return { metric, score: 0.5, details: "Invalid score from evaluator" };
      }

      return { metric, score };
    } catch (e) {
      return { metric, score: 0.5, details: `Evaluation failed: ${(e as Error).message}` };
    }
  }

  // ===========================================================================
  // Benchmarks
  // ===========================================================================

  async createBenchmark(input: {
    name: string;
    description?: string;
    taskIds: string[];
    modelIds: string[];
    config?: Partial<BenchmarkConfig>;
    tags?: string[];
    createdBy?: string;
  }): Promise<Benchmark> {
    const benchmark: Benchmark = {
      id: randomUUID(),
      name: input.name,
      description: input.description,
      status: "draft",
      taskIds: input.taskIds,
      taskCount: input.taskIds.length,
      modelIds: input.modelIds,
      config: {
        runsPerTask: 1,
        temperature: 0,
        maxConcurrent: 5,
        timeoutMs: 60000,
        useEvaluatorModel: true,
        primaryMetric: "accuracy",
        includePerformanceMetrics: true,
        includeCostMetrics: true,
        ...input.config,
      },
      completedTasks: 0,
      totalTasks: input.taskIds.length * input.modelIds.length * (input.config?.runsPerTask || 1),
      tags: input.tags || [],
      createdAt: Date.now(),
      createdBy: input.createdBy,
    };

    await this.storage.saveBenchmark(benchmark);
    this.emit("benchmarkCreated", benchmark);
    return benchmark;
  }

  async runBenchmark(
    benchmarkId: string,
    executeModel: (modelId: string, prompt: string, systemPrompt?: string) => Promise<{
      response: string;
      inputTokens: number;
      outputTokens: number;
      latencyMs: number;
      cost: number;
    }>,
    options?: {
      evaluatorExecute?: (prompt: string) => Promise<string>;
      onProgress?: (completed: number, total: number) => void;
    }
  ): Promise<BenchmarkResult[]> {
    const benchmark = await this.storage.getBenchmark(benchmarkId);
    if (!benchmark) throw new Error("Benchmark not found");

    if (this.runningBenchmarks.has(benchmarkId)) {
      throw new Error("Benchmark is already running");
    }

    this.runningBenchmarks.add(benchmarkId);

    // Update status
    benchmark.status = "running";
    benchmark.startedAt = Date.now();
    await this.storage.saveBenchmark(benchmark);
    this.emit("benchmarkStarted", benchmark);

    const results: Map<string, EvalResult[]> = new Map();

    try {
      // Initialize results map
      for (const modelId of benchmark.modelIds) {
        results.set(modelId, []);
      }

      // Run evaluations
      let completed = 0;
      const tasks = await Promise.all(benchmark.taskIds.map((id) => this.storage.getTask(id)));
      const validTasks = tasks.filter((t): t is EvalTask => t !== null);

      for (const task of validTasks) {
        for (const modelId of benchmark.modelIds) {
          for (let run = 0; run < benchmark.config.runsPerTask; run++) {
            try {
              const result = await this.evaluate(
                task.id,
                modelId,
                (prompt, systemPrompt) => executeModel(modelId, prompt, systemPrompt),
                { evaluatorExecute: options?.evaluatorExecute }
              );

              results.get(modelId)!.push(result);
            } catch (e) {
              // Create failed result
              const failedResult: EvalResult = {
                id: randomUUID(),
                taskId: task.id,
                modelId,
                timestamp: Date.now(),
                prompt: task.prompt,
                response: "",
                metrics: [],
                overallScore: 0,
                passed: false,
                inputTokens: 0,
                outputTokens: 0,
                latencyMs: 0,
                cost: 0,
                error: (e as Error).message,
                timedOut: false,
                humanEvaluated: false,
              };
              results.get(modelId)!.push(failedResult);
            }

            completed++;
            benchmark.completedTasks = completed;
            await this.storage.saveBenchmark(benchmark);

            this.emit("benchmarkProgress", benchmarkId, completed, benchmark.totalTasks);
            options?.onProgress?.(completed, benchmark.totalTasks);
          }
        }
      }

      // Calculate and save results for each model
      const benchmarkResults: BenchmarkResult[] = [];

      for (const [modelId, modelResults] of results) {
        const benchmarkResult = this.calculateBenchmarkResult(benchmarkId, modelId, modelResults);
        await this.storage.saveBenchmarkResult(benchmarkResult);
        benchmarkResults.push(benchmarkResult);
      }

      // Update benchmark status
      benchmark.status = "completed";
      benchmark.completedAt = Date.now();
      await this.storage.saveBenchmark(benchmark);

      this.emit("benchmarkCompleted", benchmark, benchmarkResults);
      return benchmarkResults;
    } catch (e) {
      benchmark.status = "failed";
      await this.storage.saveBenchmark(benchmark);
      this.emit("benchmarkFailed", benchmark, e as Error);
      throw e;
    } finally {
      this.runningBenchmarks.delete(benchmarkId);
    }
  }

  private calculateBenchmarkResult(
    benchmarkId: string,
    modelId: string,
    results: EvalResult[]
  ): BenchmarkResult {
    const passedResults = results.filter((r) => r.passed);
    const errorResults = results.filter((r) => r.error);

    // Aggregate metrics
    const metricScores: Partial<Record<MetricType, number>> = {};
    const metricCounts: Partial<Record<MetricType, number>> = {};

    for (const result of results) {
      for (const metric of result.metrics) {
        metricScores[metric.metric] = (metricScores[metric.metric] || 0) + metric.score;
        metricCounts[metric.metric] = (metricCounts[metric.metric] || 0) + 1;
      }
    }

    for (const metric of Object.keys(metricScores) as MetricType[]) {
      metricScores[metric] = metricScores[metric]! / (metricCounts[metric] || 1);
    }

    // Task type scores
    const taskTypeScores: Partial<Record<EvalTaskType, number>> = {};
    // Would need to load tasks to calculate this properly

    // Difficulty scores
    const difficultyScores: Partial<Record<EvalDifficulty, number>> = {};
    // Would need to load tasks to calculate this properly

    // Performance metrics
    const validResults = results.filter((r) => !r.error);
    const avgLatencyMs = validResults.length > 0
      ? validResults.reduce((sum, r) => sum + r.latencyMs, 0) / validResults.length
      : 0;
    const totalTokens = results.reduce((sum, r) => sum + r.inputTokens + r.outputTokens, 0);
    const totalCost = results.reduce((sum, r) => sum + r.cost, 0);
    const totalLatency = validResults.reduce((sum, r) => sum + r.latencyMs, 0);
    const avgTokensPerSecond = totalLatency > 0
      ? (totalTokens / totalLatency) * 1000
      : 0;

    return {
      benchmarkId,
      modelId,
      calculatedAt: Date.now(),
      overallScore: results.length > 0
        ? results.reduce((sum, r) => sum + r.overallScore, 0) / results.length
        : 0,
      passRate: calculatePassRate(results),
      metricScores: metricScores as Record<MetricType, number>,
      taskTypeScores: taskTypeScores as Record<EvalTaskType, number>,
      difficultyScores: difficultyScores as Record<EvalDifficulty, number>,
      avgLatencyMs,
      avgTokensPerSecond,
      totalTokens,
      totalCost,
      resultIds: results.map((r) => r.id),
      passedCount: passedResults.length,
      failedCount: results.length - passedResults.length - errorResults.length,
      errorCount: errorResults.length,
    };
  }

  async getBenchmark(id: string): Promise<Benchmark | null> {
    return this.storage.getBenchmark(id);
  }

  async listBenchmarks(status?: BenchmarkStatus): Promise<Benchmark[]> {
    return this.storage.listBenchmarks(status);
  }

  async getBenchmarkResults(benchmarkId: string): Promise<BenchmarkResult[]> {
    return this.storage.getBenchmarkResults(benchmarkId);
  }

  // ===========================================================================
  // Model Comparison
  // ===========================================================================

  async compareModels(benchmarkId: string): Promise<ComparisonResult> {
    const benchmark = await this.storage.getBenchmark(benchmarkId);
    if (!benchmark) throw new Error("Benchmark not found");

    const results = await this.storage.getBenchmarkResults(benchmarkId);
    if (results.length === 0) throw new Error("No benchmark results found");

    // Overall rankings
    const overallRankings = compareModels(results, benchmark.config.primaryMetric);

    // Rankings by metric
    const rankingsByMetric: Partial<Record<MetricType, ModelRanking[]>> = {};
    const metrics = Object.keys(results[0]?.metricScores || {}) as MetricType[];
    for (const metric of metrics) {
      rankingsByMetric[metric] = compareModels(results, metric);
    }

    // Rankings by task type
    const rankingsByTaskType: Partial<Record<EvalTaskType, ModelRanking[]>> = {};
    // Would need task type data to calculate

    // Best models
    const bestOverall = overallRankings[0]?.modelId || "";

    // Quality/price ratio
    const qualityPriceScores = results.map((r) => ({
      modelId: r.modelId,
      score: r.overallScore / (r.totalCost + 0.001), // Avoid division by zero
    }));
    qualityPriceScores.sort((a, b) => b.score - a.score);
    const bestQualityPrice = qualityPriceScores[0]?.modelId;

    // Best latency
    const latencyScores = [...results].sort((a, b) => a.avgLatencyMs - b.avgLatencyMs);
    const bestLatency = latencyScores[0]?.modelId;

    // Statistical significance
    const significantDifferences: ComparisonResult["significantDifferences"] = [];

    for (let i = 0; i < results.length; i++) {
      for (let j = i + 1; j < results.length; j++) {
        const allResults = await this.storage.listResults({});
        const scores1 = allResults
          .filter((r) => r.modelId === results[i].modelId)
          .map((r) => r.overallScore);
        const scores2 = allResults
          .filter((r) => r.modelId === results[j].modelId)
          .map((r) => r.overallScore);

        const { significant, pValue } = calculateStatisticalSignificance(scores1, scores2);

        if (significant) {
          significantDifferences.push({
            model1: results[i].modelId,
            model2: results[j].modelId,
            metric: benchmark.config.primaryMetric,
            pValue,
            difference: results[i].overallScore - results[j].overallScore,
          });
        }
      }
    }

    const comparison: ComparisonResult = {
      id: randomUUID(),
      benchmarkId,
      timestamp: Date.now(),
      overallRankings,
      rankingsByMetric: rankingsByMetric as Record<MetricType, ModelRanking[]>,
      rankingsByTaskType: rankingsByTaskType as Record<EvalTaskType, ModelRanking[]>,
      bestOverall,
      bestByCategory: {},
      bestQualityPrice,
      bestLatency,
      bestForProduction: bestQualityPrice, // Simple heuristic
      significantDifferences,
    };

    await this.storage.saveComparison(comparison);
    this.emit("comparisonGenerated", comparison);
    return comparison;
  }

  // ===========================================================================
  // Model Selection
  // ===========================================================================

  async recommendModels(criteria: SelectionCriteria): Promise<ModelRecommendation[]> {
    const allModels = await this.storage.listModels({ available: true });

    // Filter models by criteria
    let candidates = allModels.filter((model) => {
      // Required capabilities
      if (criteria.requiredCapabilities) {
        if (!criteria.requiredCapabilities.every((c) => model.capabilities.includes(c))) {
          return false;
        }
      }

      // Provider preferences
      if (criteria.preferredProviders && !criteria.preferredProviders.includes(model.provider)) {
        return false;
      }
      if (criteria.excludedProviders && criteria.excludedProviders.includes(model.provider)) {
        return false;
      }
      if (criteria.excludedModels && criteria.excludedModels.includes(model.id)) {
        return false;
      }

      // Performance constraints
      if (criteria.maxLatencyMs && model.avgLatencyMs && model.avgLatencyMs > criteria.maxLatencyMs) {
        return false;
      }
      if (criteria.minTokensPerSecond && model.tokensPerSecond && model.tokensPerSecond < criteria.minTokensPerSecond) {
        return false;
      }

      return true;
    });

    // Get benchmark results for candidates
    const benchmarks = await this.storage.listBenchmarks("completed");
    const modelResults: Map<string, BenchmarkResult[]> = new Map();

    for (const benchmark of benchmarks) {
      const results = await this.storage.getBenchmarkResults(benchmark.id);
      for (const result of results) {
        if (candidates.some((c) => c.id === result.modelId)) {
          const existing = modelResults.get(result.modelId) || [];
          existing.push(result);
          modelResults.set(result.modelId, existing);
        }
      }
    }

    // Score and rank candidates
    const recommendations: ModelRecommendation[] = candidates.map((model) => {
      const results = modelResults.get(model.id) || [];

      // Calculate scores
      const avgOverallScore = results.length > 0
        ? results.reduce((sum, r) => sum + r.overallScore, 0) / results.length
        : 0.5;
      const avgLatency = results.length > 0
        ? results.reduce((sum, r) => sum + r.avgLatencyMs, 0) / results.length
        : model.avgLatencyMs || 1000;
      const avgCost = results.length > 0
        ? results.reduce((sum, r) => sum + r.totalCost / r.resultIds.length, 0) / results.length
        : (model.inputPricePerMillion + model.outputPricePerMillion) / 2000; // Estimate

      // Apply score thresholds
      let matchScore = 1;
      if (criteria.minOverallScore && avgOverallScore < criteria.minOverallScore) {
        matchScore *= 0.5;
      }
      if (criteria.maxCostPerRequest && avgCost > criteria.maxCostPerRequest) {
        matchScore *= 0.5;
      }

      // Calculate component scores (0-1)
      const qualityScore = avgOverallScore;
      const costScore = 1 / (1 + avgCost * 10); // Normalize cost
      const latencyScore = 1 / (1 + avgLatency / 1000); // Normalize latency

      // Combined score based on optimization target
      let score: number;
      switch (criteria.optimizeFor) {
        case "quality":
          score = qualityScore * 0.7 + costScore * 0.15 + latencyScore * 0.15;
          break;
        case "cost":
          score = qualityScore * 0.3 + costScore * 0.5 + latencyScore * 0.2;
          break;
        case "latency":
          score = qualityScore * 0.3 + costScore * 0.2 + latencyScore * 0.5;
          break;
        default:
          score = qualityScore * 0.4 + costScore * 0.3 + latencyScore * 0.3;
      }

      score *= matchScore;

      // Generate strengths/weaknesses
      const strengths: string[] = [];
      const weaknesses: string[] = [];

      if (qualityScore > 0.8) strengths.push("High quality outputs");
      else if (qualityScore < 0.5) weaknesses.push("Lower quality outputs");

      if (costScore > 0.8) strengths.push("Cost-effective");
      else if (costScore < 0.3) weaknesses.push("Higher cost");

      if (latencyScore > 0.8) strengths.push("Fast response times");
      else if (latencyScore < 0.3) weaknesses.push("Slower response times");

      if (model.contextWindow > 100000) strengths.push("Large context window");
      if (model.capabilities.includes("function_calling")) strengths.push("Supports function calling");
      if (model.capabilities.includes("vision")) strengths.push("Multimodal (vision)");

      return {
        modelId: model.id,
        score,
        rank: 0, // Will be set after sorting
        matchScore,
        strengths,
        weaknesses,
        qualityScore,
        costScore,
        latencyScore,
        estimatedLatencyMs: avgLatency,
        estimatedCostPerRequest: avgCost,
        estimatedAccuracy: avgOverallScore,
        confidence: Math.min(results.length / 10, 1), // Higher confidence with more data
        dataPoints: results.length,
      };
    });

    // Sort and assign ranks
    recommendations.sort((a, b) => b.score - a.score);
    recommendations.forEach((r, i) => {
      r.rank = i + 1;
    });

    this.emit("recommendationGenerated", recommendations);
    return recommendations;
  }

  // ===========================================================================
  // Datasets
  // ===========================================================================

  async createDataset(input: Omit<Dataset, "id" | "taskCount" | "createdAt" | "updatedAt">): Promise<Dataset> {
    const dataset: Dataset = {
      ...input,
      id: randomUUID(),
      taskCount: input.tasks.length,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Save tasks
    for (const task of dataset.tasks) {
      await this.storage.saveTask(task);
    }

    await this.storage.saveDataset(dataset);
    return dataset;
  }

  async getDataset(id: string): Promise<Dataset | null> {
    return this.storage.getDataset(id);
  }

  async listDatasets(): Promise<Dataset[]> {
    return this.storage.listDatasets();
  }

  // ===========================================================================
  // Human Evaluation
  // ===========================================================================

  async addHumanEvaluation(
    resultId: string,
    score: number,
    notes?: string
  ): Promise<EvalResult | null> {
    const result = await this.storage.getResult(resultId);
    if (!result) return null;

    result.humanEvaluated = true;
    result.humanScore = score;
    result.humanNotes = notes;

    await this.storage.saveResult(result);
    return result;
  }

  // ===========================================================================
  // Utility Methods
  // ===========================================================================

  async getResults(filters: {
    taskId?: string;
    modelId?: string;
    startTime?: number;
    endTime?: number;
  }): Promise<EvalResult[]> {
    return this.storage.listResults(filters);
  }

  async getModelStats(modelId: string): Promise<{
    totalEvaluations: number;
    avgScore: number;
    passRate: number;
    avgLatencyMs: number;
    avgCost: number;
    byTaskType: Record<string, { count: number; avgScore: number }>;
  }> {
    const results = await this.storage.listResults({ modelId });

    if (results.length === 0) {
      return {
        totalEvaluations: 0,
        avgScore: 0,
        passRate: 0,
        avgLatencyMs: 0,
        avgCost: 0,
        byTaskType: {},
      };
    }

    const validResults = results.filter((r) => !r.error);

    return {
      totalEvaluations: results.length,
      avgScore: validResults.reduce((sum, r) => sum + r.overallScore, 0) / validResults.length,
      passRate: calculatePassRate(results),
      avgLatencyMs: validResults.reduce((sum, r) => sum + r.latencyMs, 0) / validResults.length,
      avgCost: results.reduce((sum, r) => sum + r.cost, 0) / results.length,
      byTaskType: {}, // Would need task data
    };
  }
}

// =============================================================================
// Singleton & Factory
// =============================================================================

let defaultEvaluator: ModelEvaluator | null = null;

export function getModelEvaluator(): ModelEvaluator {
  if (!defaultEvaluator) {
    defaultEvaluator = new ModelEvaluator();
  }
  return defaultEvaluator;
}

export function createModelEvaluator(
  config?: Partial<ModelEvaluatorConfig>,
  storage?: ModelEvaluatorStorage
): ModelEvaluator {
  return new ModelEvaluator(config, storage);
}
