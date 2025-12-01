/**
 * Prompt Manager Types
 * Phase 16C: AI Operations - Prompt Template Management
 */

import { z } from "zod";

// =============================================================================
// Prompt Templates
// =============================================================================

export const PromptTypeSchema = z.enum([
  "system",
  "user",
  "assistant",
  "function",
  "tool",
  "completion",
  "chat",
  "few_shot",
  "chain_of_thought",
]);
export type PromptType = z.infer<typeof PromptTypeSchema>;

export const PromptStatusSchema = z.enum([
  "draft",
  "review",
  "active",
  "deprecated",
  "archived",
]);
export type PromptStatus = z.infer<typeof PromptStatusSchema>;

export const VariableTypeSchema = z.enum([
  "string",
  "number",
  "boolean",
  "array",
  "object",
  "json",
]);
export type VariableType = z.infer<typeof VariableTypeSchema>;

export const PromptVariableSchema = z.object({
  name: z.string(),
  type: VariableTypeSchema,
  description: z.string().optional(),
  required: z.boolean().default(true),
  defaultValue: z.unknown().optional(),
  validation: z.object({
    minLength: z.number().optional(),
    maxLength: z.number().optional(),
    pattern: z.string().optional(),
    enum: z.array(z.unknown()).optional(),
    min: z.number().optional(),
    max: z.number().optional(),
  }).optional(),
  examples: z.array(z.unknown()).optional(),
});
export type PromptVariable = z.infer<typeof PromptVariableSchema>;

export const PromptTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string().describe("URL-friendly identifier"),
  description: z.string().optional(),
  type: PromptTypeSchema,
  status: PromptStatusSchema.default("draft"),

  // Content
  content: z.string().describe("Template with {{variable}} placeholders"),
  systemPrompt: z.string().optional(),
  fewShotExamples: z.array(z.object({
    input: z.string(),
    output: z.string(),
    explanation: z.string().optional(),
  })).optional(),

  // Variables
  variables: z.array(PromptVariableSchema).default([]),

  // Model constraints
  recommendedModels: z.array(z.string()).optional(),
  maxTokens: z.number().optional(),
  temperature: z.number().min(0).max(2).optional(),
  topP: z.number().min(0).max(1).optional(),

  // Metadata
  tags: z.array(z.string()).default([]),
  category: z.string().optional(),
  author: z.string().optional(),

  // Versioning
  version: z.string().default("1.0.0"),
  parentId: z.string().optional().describe("ID of parent template if forked"),
  changelog: z.string().optional(),

  // Analytics
  usageCount: z.number().default(0),
  avgTokens: z.number().optional(),
  avgLatencyMs: z.number().optional(),
  successRate: z.number().optional(),

  // Timestamps
  createdAt: z.number(),
  updatedAt: z.number(),
  publishedAt: z.number().optional(),
  deprecatedAt: z.number().optional(),
});
export type PromptTemplate = z.infer<typeof PromptTemplateSchema>;

// =============================================================================
// Prompt Versions
// =============================================================================

export const PromptVersionSchema = z.object({
  id: z.string(),
  templateId: z.string(),
  version: z.string(),
  content: z.string(),
  systemPrompt: z.string().optional(),
  fewShotExamples: z.array(z.object({
    input: z.string(),
    output: z.string(),
    explanation: z.string().optional(),
  })).optional(),
  variables: z.array(PromptVariableSchema),
  changelog: z.string().optional(),
  author: z.string().optional(),
  createdAt: z.number(),

  // Performance at this version
  usageCount: z.number().default(0),
  avgTokens: z.number().optional(),
  avgLatencyMs: z.number().optional(),
  successRate: z.number().optional(),
});
export type PromptVersion = z.infer<typeof PromptVersionSchema>;

// =============================================================================
// Prompt Execution
// =============================================================================

export const PromptExecutionSchema = z.object({
  id: z.string(),
  templateId: z.string(),
  version: z.string(),
  timestamp: z.number(),

  // Input
  variables: z.record(z.unknown()),
  renderedPrompt: z.string(),

  // Model
  model: z.string(),
  provider: z.string(),

  // Output
  response: z.string().optional(),
  functionCalls: z.array(z.object({
    name: z.string(),
    arguments: z.record(z.unknown()),
    result: z.unknown().optional(),
  })).optional(),

  // Metrics
  inputTokens: z.number(),
  outputTokens: z.number(),
  totalTokens: z.number(),
  latencyMs: z.number(),
  cost: z.number(),

  // Quality
  success: z.boolean(),
  errorCode: z.string().optional(),
  errorMessage: z.string().optional(),

  // Feedback
  rating: z.number().min(1).max(5).optional(),
  feedback: z.string().optional(),
  flagged: z.boolean().default(false),
  flagReason: z.string().optional(),

  // Context
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  experimentId: z.string().optional(),
  variantId: z.string().optional(),
});
export type PromptExecution = z.infer<typeof PromptExecutionSchema>;

// =============================================================================
// A/B Testing
// =============================================================================

export const ExperimentStatusSchema = z.enum([
  "draft",
  "running",
  "paused",
  "completed",
  "cancelled",
]);
export type ExperimentStatus = z.infer<typeof ExperimentStatusSchema>;

export const ExperimentVariantSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  templateId: z.string(),
  version: z.string(),
  weight: z.number().min(0).max(100).describe("Percentage of traffic"),

  // Metrics
  impressions: z.number().default(0),
  conversions: z.number().default(0),
  avgRating: z.number().optional(),
  avgLatencyMs: z.number().optional(),
  avgTokens: z.number().optional(),
  avgCost: z.number().optional(),
  successRate: z.number().optional(),
});
export type ExperimentVariant = z.infer<typeof ExperimentVariantSchema>;

export const ExperimentSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  hypothesis: z.string().optional(),

  // Status
  status: ExperimentStatusSchema,

  // Variants
  variants: z.array(ExperimentVariantSchema).min(2),
  controlVariantId: z.string().describe("ID of the control/baseline variant"),

  // Configuration
  sampleSize: z.number().optional().describe("Target sample size per variant"),
  confidenceLevel: z.number().default(0.95),
  minimumDetectableEffect: z.number().default(0.05).describe("Minimum effect size to detect"),

  // Targeting
  targetAudience: z.object({
    userIds: z.array(z.string()).optional(),
    userPercentage: z.number().min(0).max(100).optional(),
    conditions: z.array(z.object({
      field: z.string(),
      operator: z.enum(["eq", "neq", "gt", "lt", "in", "contains"]),
      value: z.unknown(),
    })).optional(),
  }).optional(),

  // Metrics
  primaryMetric: z.enum(["conversion", "rating", "latency", "cost", "tokens", "success_rate"]),
  secondaryMetrics: z.array(z.enum(["conversion", "rating", "latency", "cost", "tokens", "success_rate"])).optional(),

  // Timestamps
  createdAt: z.number(),
  startedAt: z.number().optional(),
  endedAt: z.number().optional(),
  scheduledStart: z.number().optional(),
  scheduledEnd: z.number().optional(),

  // Results
  winningVariantId: z.string().optional(),
  statisticalSignificance: z.number().optional(),
  conclusionNotes: z.string().optional(),
});
export type Experiment = z.infer<typeof ExperimentSchema>;

export const ExperimentResultSchema = z.object({
  experimentId: z.string(),
  calculatedAt: z.number(),

  // Per variant
  variantResults: z.array(z.object({
    variantId: z.string(),
    impressions: z.number(),
    conversions: z.number(),
    conversionRate: z.number(),
    avgRating: z.number().optional(),
    avgLatencyMs: z.number(),
    avgTokens: z.number(),
    avgCost: z.number(),
    successRate: z.number(),
  })),

  // Statistical analysis
  isSignificant: z.boolean(),
  pValue: z.number(),
  confidenceInterval: z.object({
    lower: z.number(),
    upper: z.number(),
  }),
  effectSize: z.number(),

  // Recommendation
  recommendedVariant: z.string().optional(),
  recommendation: z.string(),
});
export type ExperimentResult = z.infer<typeof ExperimentResultSchema>;

// =============================================================================
// Prompt Chains
// =============================================================================

export const ChainStepSchema = z.object({
  id: z.string(),
  name: z.string(),
  templateId: z.string(),
  order: z.number(),

  // Input mapping
  inputMapping: z.record(z.string()).describe("Map chain context to template variables"),

  // Output handling
  outputKey: z.string().describe("Key to store output in chain context"),
  parseOutput: z.enum(["text", "json", "lines", "regex"]).default("text"),
  parseConfig: z.object({
    regex: z.string().optional(),
    jsonPath: z.string().optional(),
  }).optional(),

  // Conditions
  condition: z.string().optional().describe("JavaScript expression to evaluate"),
  skipOnFailure: z.boolean().default(false),
  retryOnFailure: z.number().default(0),

  // Branching
  nextStepOnSuccess: z.string().optional(),
  nextStepOnFailure: z.string().optional(),
});
export type ChainStep = z.infer<typeof ChainStepSchema>;

export const PromptChainSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  status: PromptStatusSchema,

  // Steps
  steps: z.array(ChainStepSchema),
  startStepId: z.string(),

  // Global variables
  inputVariables: z.array(PromptVariableSchema),
  outputMapping: z.record(z.string()).describe("Map final context to chain output"),

  // Configuration
  maxSteps: z.number().default(10),
  timeoutMs: z.number().default(60000),
  parallelExecution: z.boolean().default(false),

  // Metadata
  tags: z.array(z.string()).default([]),
  author: z.string().optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
});
export type PromptChain = z.infer<typeof PromptChainSchema>;

export const ChainExecutionSchema = z.object({
  id: z.string(),
  chainId: z.string(),
  timestamp: z.number(),

  // Input/Output
  input: z.record(z.unknown()),
  output: z.record(z.unknown()).optional(),
  context: z.record(z.unknown()),

  // Steps
  stepExecutions: z.array(z.object({
    stepId: z.string(),
    templateId: z.string(),
    startedAt: z.number(),
    completedAt: z.number().optional(),
    status: z.enum(["pending", "running", "completed", "failed", "skipped"]),
    input: z.record(z.unknown()),
    output: z.unknown().optional(),
    error: z.string().optional(),
    tokens: z.number().optional(),
    cost: z.number().optional(),
  })),

  // Metrics
  totalSteps: z.number(),
  completedSteps: z.number(),
  totalTokens: z.number(),
  totalCost: z.number(),
  totalLatencyMs: z.number(),

  // Status
  status: z.enum(["pending", "running", "completed", "failed", "cancelled"]),
  error: z.string().optional(),
});
export type ChainExecution = z.infer<typeof ChainExecutionSchema>;

// =============================================================================
// Prompt Optimization
// =============================================================================

export const OptimizationGoalSchema = z.enum([
  "reduce_tokens",
  "improve_quality",
  "reduce_latency",
  "reduce_cost",
  "improve_consistency",
]);
export type OptimizationGoal = z.infer<typeof OptimizationGoalSchema>;

export const PromptOptimizationSchema = z.object({
  id: z.string(),
  templateId: z.string(),
  timestamp: z.number(),

  // Goal
  goal: OptimizationGoalSchema,

  // Original
  originalContent: z.string(),
  originalTokens: z.number(),
  originalMetrics: z.object({
    avgLatencyMs: z.number().optional(),
    avgCost: z.number().optional(),
    successRate: z.number().optional(),
    avgRating: z.number().optional(),
  }),

  // Optimized
  optimizedContent: z.string(),
  optimizedTokens: z.number(),
  estimatedImprovement: z.object({
    tokenReduction: z.number().optional(),
    latencyReduction: z.number().optional(),
    costReduction: z.number().optional(),
    qualityImprovement: z.number().optional(),
  }),

  // Techniques applied
  techniques: z.array(z.enum([
    "compression",
    "deduplication",
    "simplification",
    "restructuring",
    "few_shot_reduction",
    "instruction_refinement",
  ])),

  // Validation
  validationStatus: z.enum(["pending", "passed", "failed"]),
  validationNotes: z.string().optional(),

  // Applied
  applied: z.boolean().default(false),
  appliedAt: z.number().optional(),
  actualImprovement: z.object({
    tokenReduction: z.number().optional(),
    latencyReduction: z.number().optional(),
    costReduction: z.number().optional(),
    qualityChange: z.number().optional(),
  }).optional(),
});
export type PromptOptimization = z.infer<typeof PromptOptimizationSchema>;

// =============================================================================
// Prompt Library
// =============================================================================

export const PromptCollectionSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  templateIds: z.array(z.string()),
  chainIds: z.array(z.string()).default([]),
  isPublic: z.boolean().default(false),
  author: z.string().optional(),
  tags: z.array(z.string()).default([]),
  createdAt: z.number(),
  updatedAt: z.number(),
});
export type PromptCollection = z.infer<typeof PromptCollectionSchema>;

// =============================================================================
// Configuration
// =============================================================================

export const PromptManagerConfigSchema = z.object({
  // General
  enabled: z.boolean().default(true),

  // Versioning
  autoVersionOnEdit: z.boolean().default(true),
  maxVersionsToKeep: z.number().default(50),

  // Validation
  validateVariablesOnRender: z.boolean().default(true),
  strictVariableValidation: z.boolean().default(false),

  // Caching
  cacheRenderedPrompts: z.boolean().default(true),
  cacheTTLSeconds: z.number().default(300),

  // Experiments
  defaultConfidenceLevel: z.number().default(0.95),
  minSampleSizePerVariant: z.number().default(100),

  // Optimization
  autoOptimizationEnabled: z.boolean().default(false),
  optimizationThreshold: z.number().default(1000).describe("Min tokens to suggest optimization"),

  // Analytics
  trackExecutions: z.boolean().default(true),
  executionRetentionDays: z.number().default(30),

  // Rate limiting
  maxRendersPerMinute: z.number().default(1000),
});
export type PromptManagerConfig = z.infer<typeof PromptManagerConfigSchema>;

// =============================================================================
// Events
// =============================================================================

export type PromptManagerEvents = {
  // Templates
  templateCreated: (template: PromptTemplate) => void;
  templateUpdated: (template: PromptTemplate) => void;
  templatePublished: (template: PromptTemplate) => void;
  templateDeprecated: (template: PromptTemplate) => void;
  templateDeleted: (templateId: string) => void;

  // Versions
  versionCreated: (version: PromptVersion) => void;

  // Execution
  promptRendered: (templateId: string, variables: Record<string, unknown>) => void;
  promptExecuted: (execution: PromptExecution) => void;
  executionFailed: (execution: PromptExecution, error: Error) => void;

  // Experiments
  experimentCreated: (experiment: Experiment) => void;
  experimentStarted: (experiment: Experiment) => void;
  experimentCompleted: (experiment: Experiment, result: ExperimentResult) => void;
  variantSelected: (experimentId: string, variantId: string, userId?: string) => void;

  // Chains
  chainExecutionStarted: (execution: ChainExecution) => void;
  chainStepCompleted: (chainId: string, stepId: string) => void;
  chainExecutionCompleted: (execution: ChainExecution) => void;
  chainExecutionFailed: (execution: ChainExecution, error: Error) => void;

  // Optimization
  optimizationSuggested: (optimization: PromptOptimization) => void;
  optimizationApplied: (optimization: PromptOptimization) => void;

  // Errors
  error: (error: Error) => void;
};

// =============================================================================
// Storage Interface
// =============================================================================

export interface PromptStorage {
  // Templates
  saveTemplate(template: PromptTemplate): Promise<void>;
  getTemplate(id: string): Promise<PromptTemplate | null>;
  getTemplateBySlug(slug: string): Promise<PromptTemplate | null>;
  listTemplates(options?: {
    status?: PromptStatus;
    type?: PromptType;
    category?: string;
    tags?: string[];
  }): Promise<PromptTemplate[]>;
  deleteTemplate(id: string): Promise<void>;

  // Versions
  saveVersion(version: PromptVersion): Promise<void>;
  getVersion(id: string): Promise<PromptVersion | null>;
  listVersions(templateId: string): Promise<PromptVersion[]>;

  // Executions
  saveExecution(execution: PromptExecution): Promise<void>;
  getExecution(id: string): Promise<PromptExecution | null>;
  listExecutions(templateId: string, options?: {
    limit?: number;
    startTime?: number;
    endTime?: number;
  }): Promise<PromptExecution[]>;

  // Experiments
  saveExperiment(experiment: Experiment): Promise<void>;
  getExperiment(id: string): Promise<Experiment | null>;
  listExperiments(status?: ExperimentStatus): Promise<Experiment[]>;

  // Chains
  saveChain(chain: PromptChain): Promise<void>;
  getChain(id: string): Promise<PromptChain | null>;
  listChains(): Promise<PromptChain[]>;
  saveChainExecution(execution: ChainExecution): Promise<void>;
  getChainExecution(id: string): Promise<ChainExecution | null>;

  // Collections
  saveCollection(collection: PromptCollection): Promise<void>;
  getCollection(id: string): Promise<PromptCollection | null>;
  listCollections(): Promise<PromptCollection[]>;

  // Optimizations
  saveOptimization(optimization: PromptOptimization): Promise<void>;
  getOptimizations(templateId: string): Promise<PromptOptimization[]>;
}

// =============================================================================
// Helpers
// =============================================================================

export function parseTemplateVariables(content: string): string[] {
  const regex = /\{\{([^}]+)\}\}/g;
  const variables: string[] = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    const varName = match[1].trim().split("|")[0].trim(); // Handle filters like {{var|default}}
    if (!variables.includes(varName)) {
      variables.push(varName);
    }
  }
  return variables;
}

export function renderTemplate(
  content: string,
  variables: Record<string, unknown>,
  options: { strict?: boolean } = {}
): string {
  return content.replace(/\{\{([^}]+)\}\}/g, (match, expr) => {
    const parts = expr.trim().split("|");
    const varName = parts[0].trim();
    const defaultValue = parts[1]?.trim();

    if (varName in variables) {
      const value = variables[varName];
      return String(value);
    }

    if (defaultValue !== undefined) {
      return defaultValue;
    }

    if (options.strict) {
      throw new Error(`Missing required variable: ${varName}`);
    }

    return match;
  });
}

export function validateVariables(
  variables: Record<string, unknown>,
  definitions: PromptVariable[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const def of definitions) {
    const value = variables[def.name];

    // Check required
    if (def.required && (value === undefined || value === null)) {
      errors.push(`Missing required variable: ${def.name}`);
      continue;
    }

    if (value === undefined || value === null) continue;

    // Type checking
    switch (def.type) {
      case "string":
        if (typeof value !== "string") {
          errors.push(`${def.name} must be a string`);
        } else if (def.validation) {
          if (def.validation.minLength && value.length < def.validation.minLength) {
            errors.push(`${def.name} must be at least ${def.validation.minLength} characters`);
          }
          if (def.validation.maxLength && value.length > def.validation.maxLength) {
            errors.push(`${def.name} must be at most ${def.validation.maxLength} characters`);
          }
          if (def.validation.pattern && !new RegExp(def.validation.pattern).test(value)) {
            errors.push(`${def.name} does not match required pattern`);
          }
        }
        break;

      case "number":
        if (typeof value !== "number") {
          errors.push(`${def.name} must be a number`);
        } else if (def.validation) {
          if (def.validation.min !== undefined && value < def.validation.min) {
            errors.push(`${def.name} must be at least ${def.validation.min}`);
          }
          if (def.validation.max !== undefined && value > def.validation.max) {
            errors.push(`${def.name} must be at most ${def.validation.max}`);
          }
        }
        break;

      case "boolean":
        if (typeof value !== "boolean") {
          errors.push(`${def.name} must be a boolean`);
        }
        break;

      case "array":
        if (!Array.isArray(value)) {
          errors.push(`${def.name} must be an array`);
        }
        break;

      case "object":
      case "json":
        if (typeof value !== "object" || value === null || Array.isArray(value)) {
          errors.push(`${def.name} must be an object`);
        }
        break;
    }

    // Enum validation
    if (def.validation?.enum && !def.validation.enum.includes(value)) {
      errors.push(`${def.name} must be one of: ${def.validation.enum.join(", ")}`);
    }
  }

  return { valid: errors.length === 0, errors };
}

export function incrementVersion(version: string, type: "major" | "minor" | "patch" = "patch"): string {
  const parts = version.split(".").map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) {
    return "1.0.0";
  }

  switch (type) {
    case "major":
      return `${parts[0] + 1}.0.0`;
    case "minor":
      return `${parts[0]}.${parts[1] + 1}.0`;
    case "patch":
    default:
      return `${parts[0]}.${parts[1]}.${parts[2] + 1}`;
  }
}
