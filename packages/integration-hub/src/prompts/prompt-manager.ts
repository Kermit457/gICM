/**
 * Prompt Manager Implementation
 * Phase 16C: AI Operations - Prompt Template Management
 */

import { EventEmitter } from "eventemitter3";
import { randomUUID } from "crypto";
import {
  type PromptManagerConfig,
  PromptManagerConfigSchema,
  type PromptManagerEvents,
  type PromptStorage,
  type PromptTemplate,
  type PromptStatus,
  type PromptType,
  type PromptVariable,
  type PromptVersion,
  type PromptExecution,
  type Experiment,
  type ExperimentStatus,
  type ExperimentVariant,
  type ExperimentResult,
  type PromptChain,
  type ChainExecution,
  type PromptOptimization,
  type OptimizationGoal,
  type PromptCollection,
  parseTemplateVariables,
  renderTemplate,
  validateVariables,
  incrementVersion,
} from "./types.js";

// =============================================================================
// In-Memory Storage
// =============================================================================

class InMemoryPromptStorage implements PromptStorage {
  private templates: Map<string, PromptTemplate> = new Map();
  private versions: Map<string, PromptVersion> = new Map();
  private executions: Map<string, PromptExecution> = new Map();
  private experiments: Map<string, Experiment> = new Map();
  private chains: Map<string, PromptChain> = new Map();
  private chainExecutions: Map<string, ChainExecution> = new Map();
  private collections: Map<string, PromptCollection> = new Map();
  private optimizations: Map<string, PromptOptimization> = new Map();

  async saveTemplate(template: PromptTemplate): Promise<void> {
    this.templates.set(template.id, template);
  }

  async getTemplate(id: string): Promise<PromptTemplate | null> {
    return this.templates.get(id) || null;
  }

  async getTemplateBySlug(slug: string): Promise<PromptTemplate | null> {
    for (const template of this.templates.values()) {
      if (template.slug === slug) return template;
    }
    return null;
  }

  async listTemplates(options?: {
    status?: PromptStatus;
    type?: PromptType;
    category?: string;
    tags?: string[];
  }): Promise<PromptTemplate[]> {
    return Array.from(this.templates.values()).filter((t) => {
      if (options?.status && t.status !== options.status) return false;
      if (options?.type && t.type !== options.type) return false;
      if (options?.category && t.category !== options.category) return false;
      if (options?.tags && !options.tags.some((tag) => t.tags.includes(tag))) return false;
      return true;
    });
  }

  async deleteTemplate(id: string): Promise<void> {
    this.templates.delete(id);
  }

  async saveVersion(version: PromptVersion): Promise<void> {
    this.versions.set(version.id, version);
  }

  async getVersion(id: string): Promise<PromptVersion | null> {
    return this.versions.get(id) || null;
  }

  async listVersions(templateId: string): Promise<PromptVersion[]> {
    return Array.from(this.versions.values())
      .filter((v) => v.templateId === templateId)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  async saveExecution(execution: PromptExecution): Promise<void> {
    this.executions.set(execution.id, execution);
  }

  async getExecution(id: string): Promise<PromptExecution | null> {
    return this.executions.get(id) || null;
  }

  async listExecutions(
    templateId: string,
    options?: { limit?: number; startTime?: number; endTime?: number }
  ): Promise<PromptExecution[]> {
    let results = Array.from(this.executions.values())
      .filter((e) => e.templateId === templateId)
      .filter((e) => !options?.startTime || e.timestamp >= options.startTime)
      .filter((e) => !options?.endTime || e.timestamp <= options.endTime)
      .sort((a, b) => b.timestamp - a.timestamp);

    if (options?.limit) {
      results = results.slice(0, options.limit);
    }

    return results;
  }

  async saveExperiment(experiment: Experiment): Promise<void> {
    this.experiments.set(experiment.id, experiment);
  }

  async getExperiment(id: string): Promise<Experiment | null> {
    return this.experiments.get(id) || null;
  }

  async listExperiments(status?: ExperimentStatus): Promise<Experiment[]> {
    return Array.from(this.experiments.values()).filter((e) => {
      if (status && e.status !== status) return false;
      return true;
    });
  }

  async saveChain(chain: PromptChain): Promise<void> {
    this.chains.set(chain.id, chain);
  }

  async getChain(id: string): Promise<PromptChain | null> {
    return this.chains.get(id) || null;
  }

  async listChains(): Promise<PromptChain[]> {
    return Array.from(this.chains.values());
  }

  async saveChainExecution(execution: ChainExecution): Promise<void> {
    this.chainExecutions.set(execution.id, execution);
  }

  async getChainExecution(id: string): Promise<ChainExecution | null> {
    return this.chainExecutions.get(id) || null;
  }

  async saveCollection(collection: PromptCollection): Promise<void> {
    this.collections.set(collection.id, collection);
  }

  async getCollection(id: string): Promise<PromptCollection | null> {
    return this.collections.get(id) || null;
  }

  async listCollections(): Promise<PromptCollection[]> {
    return Array.from(this.collections.values());
  }

  async saveOptimization(optimization: PromptOptimization): Promise<void> {
    this.optimizations.set(optimization.id, optimization);
  }

  async getOptimizations(templateId: string): Promise<PromptOptimization[]> {
    return Array.from(this.optimizations.values()).filter((o) => o.templateId === templateId);
  }
}

// =============================================================================
// Prompt Manager
// =============================================================================

export class PromptManager extends EventEmitter<PromptManagerEvents> {
  private config: PromptManagerConfig;
  private storage: PromptStorage;
  private promptCache: Map<string, { rendered: string; timestamp: number }> = new Map();

  constructor(config: Partial<PromptManagerConfig> = {}, storage?: PromptStorage) {
    super();
    this.config = PromptManagerConfigSchema.parse(config);
    this.storage = storage || new InMemoryPromptStorage();
  }

  // ===========================================================================
  // Template Management
  // ===========================================================================

  async createTemplate(input: {
    name: string;
    slug?: string;
    description?: string;
    type: PromptType;
    content: string;
    systemPrompt?: string;
    fewShotExamples?: { input: string; output: string; explanation?: string }[];
    variables?: PromptVariable[];
    recommendedModels?: string[];
    maxTokens?: number;
    temperature?: number;
    topP?: number;
    tags?: string[];
    category?: string;
    author?: string;
  }): Promise<PromptTemplate> {
    const slug = input.slug || this.generateSlug(input.name);

    // Check for duplicate slug
    const existing = await this.storage.getTemplateBySlug(slug);
    if (existing) {
      throw new Error(`Template with slug "${slug}" already exists`);
    }

    // Extract variables from content if not provided
    const extractedVars = parseTemplateVariables(input.content);
    const variables = input.variables || extractedVars.map((name) => ({
      name,
      type: "string" as const,
      required: true,
    }));

    const template: PromptTemplate = {
      id: randomUUID(),
      name: input.name,
      slug,
      description: input.description,
      type: input.type,
      status: "draft",
      content: input.content,
      systemPrompt: input.systemPrompt,
      fewShotExamples: input.fewShotExamples,
      variables,
      recommendedModels: input.recommendedModels,
      maxTokens: input.maxTokens,
      temperature: input.temperature,
      topP: input.topP,
      tags: input.tags || [],
      category: input.category,
      author: input.author,
      version: "1.0.0",
      usageCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await this.storage.saveTemplate(template);

    // Create initial version
    await this.createVersion(template, "Initial version");

    this.emit("templateCreated", template);
    return template;
  }

  async updateTemplate(
    id: string,
    updates: Partial<{
      name: string;
      description: string;
      content: string;
      systemPrompt: string;
      fewShotExamples: { input: string; output: string; explanation?: string }[];
      variables: PromptVariable[];
      recommendedModels: string[];
      maxTokens: number;
      temperature: number;
      topP: number;
      tags: string[];
      category: string;
    }>,
    changelog?: string
  ): Promise<PromptTemplate | null> {
    const template = await this.storage.getTemplate(id);
    if (!template) return null;

    // Check if content changed (for versioning)
    const contentChanged = updates.content && updates.content !== template.content;

    const updated: PromptTemplate = {
      ...template,
      ...updates,
      updatedAt: Date.now(),
    };

    // Auto-version on content change
    if (contentChanged && this.config.autoVersionOnEdit) {
      updated.version = incrementVersion(template.version);
      await this.createVersion(updated, changelog || "Content updated");
    }

    await this.storage.saveTemplate(updated);
    this.emit("templateUpdated", updated);
    return updated;
  }

  async publishTemplate(id: string): Promise<PromptTemplate | null> {
    const template = await this.storage.getTemplate(id);
    if (!template) return null;

    template.status = "active";
    template.publishedAt = Date.now();
    template.updatedAt = Date.now();

    await this.storage.saveTemplate(template);
    this.emit("templatePublished", template);
    return template;
  }

  async deprecateTemplate(id: string): Promise<PromptTemplate | null> {
    const template = await this.storage.getTemplate(id);
    if (!template) return null;

    template.status = "deprecated";
    template.deprecatedAt = Date.now();
    template.updatedAt = Date.now();

    await this.storage.saveTemplate(template);
    this.emit("templateDeprecated", template);
    return template;
  }

  async deleteTemplate(id: string): Promise<boolean> {
    const template = await this.storage.getTemplate(id);
    if (!template) return false;

    await this.storage.deleteTemplate(id);
    this.emit("templateDeleted", id);
    return true;
  }

  async getTemplate(id: string): Promise<PromptTemplate | null> {
    return this.storage.getTemplate(id);
  }

  async getTemplateBySlug(slug: string): Promise<PromptTemplate | null> {
    return this.storage.getTemplateBySlug(slug);
  }

  async listTemplates(options?: {
    status?: PromptStatus;
    type?: PromptType;
    category?: string;
    tags?: string[];
  }): Promise<PromptTemplate[]> {
    return this.storage.listTemplates(options);
  }

  // ===========================================================================
  // Version Management
  // ===========================================================================

  private async createVersion(template: PromptTemplate, changelog?: string): Promise<PromptVersion> {
    const version: PromptVersion = {
      id: randomUUID(),
      templateId: template.id,
      version: template.version,
      content: template.content,
      systemPrompt: template.systemPrompt,
      fewShotExamples: template.fewShotExamples,
      variables: template.variables,
      changelog,
      author: template.author,
      createdAt: Date.now(),
      usageCount: 0,
    };

    await this.storage.saveVersion(version);
    this.emit("versionCreated", version);

    // Clean up old versions
    await this.cleanupOldVersions(template.id);

    return version;
  }

  private async cleanupOldVersions(templateId: string): Promise<void> {
    const versions = await this.storage.listVersions(templateId);
    if (versions.length <= this.config.maxVersionsToKeep) return;

    const toDelete = versions.slice(this.config.maxVersionsToKeep);
    // In a real implementation, we'd delete these versions
    // For in-memory, the list is already sorted by createdAt desc
  }

  async listVersions(templateId: string): Promise<PromptVersion[]> {
    return this.storage.listVersions(templateId);
  }

  async getVersion(id: string): Promise<PromptVersion | null> {
    return this.storage.getVersion(id);
  }

  async rollbackToVersion(templateId: string, versionId: string): Promise<PromptTemplate | null> {
    const version = await this.storage.getVersion(versionId);
    if (!version || version.templateId !== templateId) return null;

    return this.updateTemplate(templateId, {
      content: version.content,
      systemPrompt: version.systemPrompt,
      fewShotExamples: version.fewShotExamples,
      variables: version.variables,
    }, `Rollback to version ${version.version}`);
  }

  // ===========================================================================
  // Prompt Rendering
  // ===========================================================================

  async render(
    templateIdOrSlug: string,
    variables: Record<string, unknown>,
    options: { version?: string; strict?: boolean } = {}
  ): Promise<{ rendered: string; template: PromptTemplate }> {
    // Try by ID first, then by slug
    let template = await this.storage.getTemplate(templateIdOrSlug);
    if (!template) {
      template = await this.storage.getTemplateBySlug(templateIdOrSlug);
    }

    if (!template) {
      throw new Error(`Template not found: ${templateIdOrSlug}`);
    }

    // Validate variables
    if (this.config.validateVariablesOnRender) {
      const validation = validateVariables(variables, template.variables);
      if (!validation.valid) {
        if (this.config.strictVariableValidation || options.strict) {
          throw new Error(`Variable validation failed: ${validation.errors.join(", ")}`);
        }
      }
    }

    // Check cache
    const cacheKey = `${template.id}:${JSON.stringify(variables)}`;
    if (this.config.cacheRenderedPrompts) {
      const cached = this.promptCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.config.cacheTTLSeconds * 1000) {
        return { rendered: cached.rendered, template };
      }
    }

    // Render
    const rendered = renderTemplate(template.content, variables, { strict: options.strict });

    // Update cache
    if (this.config.cacheRenderedPrompts) {
      this.promptCache.set(cacheKey, { rendered, timestamp: Date.now() });
    }

    // Update usage count
    template.usageCount = (template.usageCount || 0) + 1;
    template.updatedAt = Date.now();
    await this.storage.saveTemplate(template);

    this.emit("promptRendered", template.id, variables);
    return { rendered, template };
  }

  async renderWithSystem(
    templateIdOrSlug: string,
    variables: Record<string, unknown>,
    options: { version?: string; strict?: boolean } = {}
  ): Promise<{
    systemPrompt: string | undefined;
    userPrompt: string;
    template: PromptTemplate;
  }> {
    const { rendered, template } = await this.render(templateIdOrSlug, variables, options);

    let systemPrompt = template.systemPrompt;
    if (systemPrompt) {
      systemPrompt = renderTemplate(systemPrompt, variables, { strict: options.strict });
    }

    return {
      systemPrompt,
      userPrompt: rendered,
      template,
    };
  }

  // ===========================================================================
  // Execution Tracking
  // ===========================================================================

  async trackExecution(input: {
    templateId: string;
    version: string;
    variables: Record<string, unknown>;
    renderedPrompt: string;
    model: string;
    provider: string;
    response?: string;
    functionCalls?: { name: string; arguments: Record<string, unknown>; result?: unknown }[];
    inputTokens: number;
    outputTokens: number;
    latencyMs: number;
    cost: number;
    success: boolean;
    errorCode?: string;
    errorMessage?: string;
    userId?: string;
    sessionId?: string;
    experimentId?: string;
    variantId?: string;
  }): Promise<PromptExecution> {
    const execution: PromptExecution = {
      id: randomUUID(),
      templateId: input.templateId,
      version: input.version,
      timestamp: Date.now(),
      variables: input.variables,
      renderedPrompt: input.renderedPrompt,
      model: input.model,
      provider: input.provider,
      response: input.response,
      functionCalls: input.functionCalls,
      inputTokens: input.inputTokens,
      outputTokens: input.outputTokens,
      totalTokens: input.inputTokens + input.outputTokens,
      latencyMs: input.latencyMs,
      cost: input.cost,
      success: input.success,
      errorCode: input.errorCode,
      errorMessage: input.errorMessage,
      userId: input.userId,
      sessionId: input.sessionId,
      experimentId: input.experimentId,
      variantId: input.variantId,
      flagged: false,
    };

    await this.storage.saveExecution(execution);

    // Update template metrics
    const template = await this.storage.getTemplate(input.templateId);
    if (template) {
      const executions = await this.storage.listExecutions(input.templateId, { limit: 100 });
      template.avgTokens = executions.reduce((sum, e) => sum + e.totalTokens, 0) / executions.length;
      template.avgLatencyMs = executions.reduce((sum, e) => sum + e.latencyMs, 0) / executions.length;
      template.successRate = executions.filter((e) => e.success).length / executions.length;
      await this.storage.saveTemplate(template);
    }

    // Update experiment metrics if part of experiment
    if (input.experimentId && input.variantId) {
      await this.updateExperimentMetrics(input.experimentId, input.variantId, execution);
    }

    this.emit("promptExecuted", execution);
    return execution;
  }

  async rateExecution(executionId: string, rating: number, feedback?: string): Promise<void> {
    const execution = await this.storage.getExecution(executionId);
    if (!execution) throw new Error("Execution not found");

    execution.rating = rating;
    execution.feedback = feedback;
    await this.storage.saveExecution(execution);
  }

  async flagExecution(executionId: string, reason: string): Promise<void> {
    const execution = await this.storage.getExecution(executionId);
    if (!execution) throw new Error("Execution not found");

    execution.flagged = true;
    execution.flagReason = reason;
    await this.storage.saveExecution(execution);
  }

  // ===========================================================================
  // A/B Testing
  // ===========================================================================

  async createExperiment(input: {
    name: string;
    description?: string;
    hypothesis?: string;
    variants: {
      name: string;
      description?: string;
      templateId: string;
      version: string;
      weight: number;
    }[];
    controlVariantIndex?: number;
    sampleSize?: number;
    confidenceLevel?: number;
    minimumDetectableEffect?: number;
    primaryMetric: "conversion" | "rating" | "latency" | "cost" | "tokens" | "success_rate";
    secondaryMetrics?: ("conversion" | "rating" | "latency" | "cost" | "tokens" | "success_rate")[];
    targetAudience?: {
      userIds?: string[];
      userPercentage?: number;
    };
    scheduledStart?: number;
    scheduledEnd?: number;
  }): Promise<Experiment> {
    const variants: ExperimentVariant[] = input.variants.map((v) => ({
      id: randomUUID(),
      name: v.name,
      description: v.description,
      templateId: v.templateId,
      version: v.version,
      weight: v.weight,
      impressions: 0,
      conversions: 0,
    }));

    const experiment: Experiment = {
      id: randomUUID(),
      name: input.name,
      description: input.description,
      hypothesis: input.hypothesis,
      status: "draft",
      variants,
      controlVariantId: variants[input.controlVariantIndex || 0].id,
      sampleSize: input.sampleSize,
      confidenceLevel: input.confidenceLevel || this.config.defaultConfidenceLevel,
      minimumDetectableEffect: input.minimumDetectableEffect || 0.05,
      targetAudience: input.targetAudience,
      primaryMetric: input.primaryMetric,
      secondaryMetrics: input.secondaryMetrics,
      createdAt: Date.now(),
      scheduledStart: input.scheduledStart,
      scheduledEnd: input.scheduledEnd,
    };

    await this.storage.saveExperiment(experiment);
    this.emit("experimentCreated", experiment);
    return experiment;
  }

  async startExperiment(id: string): Promise<Experiment | null> {
    const experiment = await this.storage.getExperiment(id);
    if (!experiment) return null;

    experiment.status = "running";
    experiment.startedAt = Date.now();
    await this.storage.saveExperiment(experiment);

    this.emit("experimentStarted", experiment);
    return experiment;
  }

  async pauseExperiment(id: string): Promise<Experiment | null> {
    const experiment = await this.storage.getExperiment(id);
    if (!experiment) return null;

    experiment.status = "paused";
    await this.storage.saveExperiment(experiment);
    return experiment;
  }

  async completeExperiment(id: string, winningVariantId?: string, conclusionNotes?: string): Promise<Experiment | null> {
    const experiment = await this.storage.getExperiment(id);
    if (!experiment) return null;

    experiment.status = "completed";
    experiment.endedAt = Date.now();
    experiment.winningVariantId = winningVariantId;
    experiment.conclusionNotes = conclusionNotes;

    // Calculate statistical significance
    const result = await this.calculateExperimentResults(experiment);
    experiment.statisticalSignificance = result.pValue;

    await this.storage.saveExperiment(experiment);
    this.emit("experimentCompleted", experiment, result);
    return experiment;
  }

  async selectVariant(experimentId: string, userId?: string): Promise<ExperimentVariant | null> {
    const experiment = await this.storage.getExperiment(experimentId);
    if (!experiment || experiment.status !== "running") return null;

    // Check target audience
    if (experiment.targetAudience) {
      if (experiment.targetAudience.userIds && userId) {
        if (!experiment.targetAudience.userIds.includes(userId)) {
          return null;
        }
      }
      if (experiment.targetAudience.userPercentage) {
        // Simple hash-based bucketing
        const bucket = userId ? this.hashToBucket(userId) : Math.random() * 100;
        if (bucket > experiment.targetAudience.userPercentage) {
          return null;
        }
      }
    }

    // Weighted random selection
    const totalWeight = experiment.variants.reduce((sum, v) => sum + v.weight, 0);
    let random = Math.random() * totalWeight;

    for (const variant of experiment.variants) {
      random -= variant.weight;
      if (random <= 0) {
        // Update impressions
        variant.impressions++;
        await this.storage.saveExperiment(experiment);
        this.emit("variantSelected", experimentId, variant.id, userId);
        return variant;
      }
    }

    return experiment.variants[0];
  }

  private hashToBucket(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash) % 100;
  }

  private async updateExperimentMetrics(
    experimentId: string,
    variantId: string,
    execution: PromptExecution
  ): Promise<void> {
    const experiment = await this.storage.getExperiment(experimentId);
    if (!experiment) return;

    const variant = experiment.variants.find((v) => v.id === variantId);
    if (!variant) return;

    // Update metrics
    const executions = await this.storage.listExecutions(variant.templateId);
    const variantExecs = executions.filter((e) => e.variantId === variantId);

    if (variantExecs.length > 0) {
      variant.avgLatencyMs = variantExecs.reduce((sum, e) => sum + e.latencyMs, 0) / variantExecs.length;
      variant.avgTokens = variantExecs.reduce((sum, e) => sum + e.totalTokens, 0) / variantExecs.length;
      variant.avgCost = variantExecs.reduce((sum, e) => sum + e.cost, 0) / variantExecs.length;
      variant.successRate = variantExecs.filter((e) => e.success).length / variantExecs.length;
      variant.avgRating = variantExecs.filter((e) => e.rating).reduce((sum, e) => sum + (e.rating || 0), 0) /
        (variantExecs.filter((e) => e.rating).length || 1);
    }

    await this.storage.saveExperiment(experiment);
  }

  async calculateExperimentResults(experiment: Experiment): Promise<ExperimentResult> {
    const variantResults = await Promise.all(
      experiment.variants.map(async (variant) => {
        const executions = await this.storage.listExecutions(variant.templateId);
        const variantExecs = executions.filter((e) => e.variantId === variant.id);

        return {
          variantId: variant.id,
          impressions: variant.impressions,
          conversions: variant.conversions,
          conversionRate: variant.impressions > 0 ? variant.conversions / variant.impressions : 0,
          avgRating: variant.avgRating,
          avgLatencyMs: variant.avgLatencyMs || 0,
          avgTokens: variant.avgTokens || 0,
          avgCost: variant.avgCost || 0,
          successRate: variant.successRate || 0,
        };
      })
    );

    // Simple statistical significance calculation (chi-square approximation)
    const control = variantResults.find((v) => experiment.variants.find((ev) => ev.id === v.variantId)?.id === experiment.controlVariantId);
    const treatment = variantResults.find((v) => v.variantId !== experiment.controlVariantId);

    let pValue = 1;
    let effectSize = 0;
    let isSignificant = false;

    if (control && treatment && control.impressions > 0 && treatment.impressions > 0) {
      // Calculate effect size
      const getMetricValue = (r: typeof control) => {
        switch (experiment.primaryMetric) {
          case "conversion": return r.conversionRate;
          case "rating": return r.avgRating || 0;
          case "latency": return -r.avgLatencyMs; // Lower is better
          case "cost": return -r.avgCost; // Lower is better
          case "tokens": return -r.avgTokens; // Lower is better
          case "success_rate": return r.successRate;
          default: return 0;
        }
      };

      const controlValue = getMetricValue(control);
      const treatmentValue = getMetricValue(treatment);
      effectSize = controlValue !== 0 ? (treatmentValue - controlValue) / Math.abs(controlValue) : 0;

      // Simplified p-value (would need proper statistical test in production)
      const totalSamples = control.impressions + treatment.impressions;
      pValue = Math.max(0.001, Math.exp(-Math.abs(effectSize) * Math.sqrt(totalSamples) / 2));
      isSignificant = pValue < (1 - experiment.confidenceLevel);
    }

    const recommendedVariant = isSignificant && treatment && effectSize > 0
      ? treatment.variantId
      : control?.variantId;

    return {
      experimentId: experiment.id,
      calculatedAt: Date.now(),
      variantResults,
      isSignificant,
      pValue,
      confidenceInterval: {
        lower: effectSize - 1.96 * Math.abs(effectSize) / 2,
        upper: effectSize + 1.96 * Math.abs(effectSize) / 2,
      },
      effectSize,
      recommendedVariant,
      recommendation: isSignificant
        ? `Variant "${experiment.variants.find((v) => v.id === recommendedVariant)?.name}" shows statistically significant improvement.`
        : `No statistically significant difference detected. Consider running longer or increasing sample size.`,
    };
  }

  // ===========================================================================
  // Prompt Chains
  // ===========================================================================

  async createChain(input: {
    name: string;
    description?: string;
    steps: {
      name: string;
      templateId: string;
      inputMapping: Record<string, string>;
      outputKey: string;
      parseOutput?: "text" | "json" | "lines" | "regex";
      parseConfig?: { regex?: string; jsonPath?: string };
      condition?: string;
      skipOnFailure?: boolean;
      retryOnFailure?: number;
    }[];
    inputVariables: PromptVariable[];
    outputMapping?: Record<string, string>;
    maxSteps?: number;
    timeoutMs?: number;
    tags?: string[];
    author?: string;
  }): Promise<PromptChain> {
    const steps = input.steps.map((s, i) => ({
      id: randomUUID(),
      name: s.name,
      templateId: s.templateId,
      order: i,
      inputMapping: s.inputMapping,
      outputKey: s.outputKey,
      parseOutput: s.parseOutput || ("text" as const),
      parseConfig: s.parseConfig,
      condition: s.condition,
      skipOnFailure: s.skipOnFailure || false,
      retryOnFailure: s.retryOnFailure || 0,
    }));

    const chain: PromptChain = {
      id: randomUUID(),
      name: input.name,
      description: input.description,
      status: "draft",
      steps,
      startStepId: steps[0]?.id || "",
      inputVariables: input.inputVariables,
      outputMapping: input.outputMapping || {},
      maxSteps: input.maxSteps || 10,
      timeoutMs: input.timeoutMs || 60000,
      parallelExecution: false,
      tags: input.tags || [],
      author: input.author,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await this.storage.saveChain(chain);
    return chain;
  }

  async executeChain(
    chainId: string,
    input: Record<string, unknown>,
    executePrompt: (templateId: string, variables: Record<string, unknown>) => Promise<{
      response: string;
      tokens: number;
      cost: number;
    }>
  ): Promise<ChainExecution> {
    const chain = await this.storage.getChain(chainId);
    if (!chain) throw new Error("Chain not found");

    const execution: ChainExecution = {
      id: randomUUID(),
      chainId,
      timestamp: Date.now(),
      input,
      context: { ...input },
      stepExecutions: [],
      totalSteps: chain.steps.length,
      completedSteps: 0,
      totalTokens: 0,
      totalCost: 0,
      totalLatencyMs: 0,
      status: "running",
    };

    this.emit("chainExecutionStarted", execution);

    try {
      const sortedSteps = [...chain.steps].sort((a, b) => a.order - b.order);

      for (const step of sortedSteps) {
        if (execution.completedSteps >= chain.maxSteps) break;

        // Check condition
        if (step.condition) {
          try {
            // Simple condition evaluation (would use a proper expression evaluator in production)
            const conditionResult = this.evaluateCondition(step.condition, execution.context);
            if (!conditionResult) {
              execution.stepExecutions.push({
                stepId: step.id,
                templateId: step.templateId,
                startedAt: Date.now(),
                completedAt: Date.now(),
                status: "skipped",
                input: {},
              });
              continue;
            }
          } catch {
            // If condition evaluation fails, proceed with step
          }
        }

        // Map inputs
        const stepInput: Record<string, unknown> = {};
        for (const [varName, contextKey] of Object.entries(step.inputMapping)) {
          stepInput[varName] = execution.context[contextKey];
        }

        const stepExecution = {
          stepId: step.id,
          templateId: step.templateId,
          startedAt: Date.now(),
          status: "running" as const,
          input: stepInput,
        };
        execution.stepExecutions.push(stepExecution);

        try {
          const result = await executePrompt(step.templateId, stepInput);

          stepExecution.completedAt = Date.now();
          stepExecution.status = "completed";
          stepExecution.output = result.response;
          stepExecution.tokens = result.tokens;
          stepExecution.cost = result.cost;

          // Parse output
          let parsedOutput: unknown = result.response;
          if (step.parseOutput === "json") {
            try {
              parsedOutput = JSON.parse(result.response);
            } catch {
              // Keep as string if JSON parse fails
            }
          } else if (step.parseOutput === "lines") {
            parsedOutput = result.response.split("\n").filter((l) => l.trim());
          } else if (step.parseOutput === "regex" && step.parseConfig?.regex) {
            const match = result.response.match(new RegExp(step.parseConfig.regex));
            parsedOutput = match ? match[1] || match[0] : result.response;
          }

          // Store in context
          execution.context[step.outputKey] = parsedOutput;

          execution.completedSteps++;
          execution.totalTokens += result.tokens;
          execution.totalCost += result.cost;
          execution.totalLatencyMs += (stepExecution.completedAt - stepExecution.startedAt);

          this.emit("chainStepCompleted", chainId, step.id);
        } catch (error) {
          stepExecution.completedAt = Date.now();
          stepExecution.status = "failed";
          stepExecution.error = (error as Error).message;

          if (!step.skipOnFailure) {
            execution.status = "failed";
            execution.error = `Step "${step.name}" failed: ${(error as Error).message}`;
            break;
          }
        }
      }

      if (execution.status !== "failed") {
        execution.status = "completed";

        // Map output
        execution.output = {};
        for (const [outputKey, contextKey] of Object.entries(chain.outputMapping)) {
          execution.output[outputKey] = execution.context[contextKey];
        }
      }
    } catch (error) {
      execution.status = "failed";
      execution.error = (error as Error).message;
      this.emit("chainExecutionFailed", execution, error as Error);
    }

    await this.storage.saveChainExecution(execution);

    if (execution.status === "completed") {
      this.emit("chainExecutionCompleted", execution);
    }

    return execution;
  }

  private evaluateCondition(condition: string, context: Record<string, unknown>): boolean {
    // Simple condition evaluation - in production, use a proper expression parser
    try {
      const fn = new Function(...Object.keys(context), `return ${condition}`);
      return Boolean(fn(...Object.values(context)));
    } catch {
      return true;
    }
  }

  // ===========================================================================
  // Optimization
  // ===========================================================================

  async suggestOptimization(
    templateId: string,
    goal: OptimizationGoal
  ): Promise<PromptOptimization | null> {
    const template = await this.storage.getTemplate(templateId);
    if (!template) return null;

    const executions = await this.storage.listExecutions(templateId, { limit: 100 });
    if (executions.length < 10) return null;

    const avgTokens = executions.reduce((sum, e) => sum + e.totalTokens, 0) / executions.length;
    const avgLatency = executions.reduce((sum, e) => sum + e.latencyMs, 0) / executions.length;
    const avgCost = executions.reduce((sum, e) => sum + e.cost, 0) / executions.length;
    const successRate = executions.filter((e) => e.success).length / executions.length;
    const avgRating = executions.filter((e) => e.rating).reduce((sum, e) => sum + (e.rating || 0), 0) /
      (executions.filter((e) => e.rating).length || 1);

    // Simple optimization suggestions
    let optimizedContent = template.content;
    const techniques: PromptOptimization["techniques"] = [];

    if (goal === "reduce_tokens" || goal === "reduce_cost") {
      // Remove redundant whitespace
      optimizedContent = optimizedContent.replace(/\s+/g, " ").trim();
      techniques.push("compression");

      // Remove duplicate instructions (simplified)
      const lines = optimizedContent.split("\n");
      const uniqueLines = [...new Set(lines)];
      if (uniqueLines.length < lines.length) {
        optimizedContent = uniqueLines.join("\n");
        techniques.push("deduplication");
      }
    }

    const optimization: PromptOptimization = {
      id: randomUUID(),
      templateId,
      timestamp: Date.now(),
      goal,
      originalContent: template.content,
      originalTokens: avgTokens,
      originalMetrics: {
        avgLatencyMs: avgLatency,
        avgCost: avgCost,
        successRate,
        avgRating,
      },
      optimizedContent,
      optimizedTokens: Math.round(avgTokens * 0.9), // Estimate
      estimatedImprovement: {
        tokenReduction: Math.round(avgTokens * 0.1),
        costReduction: avgCost * 0.1,
      },
      techniques,
      validationStatus: "pending",
      applied: false,
    };

    await this.storage.saveOptimization(optimization);
    this.emit("optimizationSuggested", optimization);
    return optimization;
  }

  async applyOptimization(optimizationId: string): Promise<boolean> {
    const optimizations = await this.storage.getOptimizations("");
    const optimization = optimizations.find((o) => o.id === optimizationId);
    if (!optimization) return false;

    await this.updateTemplate(optimization.templateId, {
      content: optimization.optimizedContent,
    }, "Applied optimization");

    optimization.applied = true;
    optimization.appliedAt = Date.now();
    await this.storage.saveOptimization(optimization);

    this.emit("optimizationApplied", optimization);
    return true;
  }

  // ===========================================================================
  // Utilities
  // ===========================================================================

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }
}

// =============================================================================
// Singleton & Factory
// =============================================================================

let defaultManager: PromptManager | null = null;

export function getPromptManager(): PromptManager {
  if (!defaultManager) {
    defaultManager = new PromptManager();
  }
  return defaultManager;
}

export function createPromptManager(
  config?: Partial<PromptManagerConfig>,
  storage?: PromptStorage
): PromptManager {
  return new PromptManager(config, storage);
}
