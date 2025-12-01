/**
 * PTC Coordinator Types
 *
 * Programmatic Tool Calling - Orchestrate tools via code generation
 * instead of individual API calls (37% token reduction)
 */

import { z } from 'zod';

// ============================================================================
// Tool Definitions
// ============================================================================

export const ToolDefinitionSchema = z.object({
  name: z.string(),
  description: z.string(),
  input_schema: z.object({
    type: z.literal('object'),
    properties: z.record(z.object({
      type: z.string(),
      description: z.string(),
      enum: z.array(z.string()).optional(),
    })),
    required: z.array(z.string()),
  }),
});

export type ToolDefinition = z.infer<typeof ToolDefinitionSchema>;

// ============================================================================
// Pipeline Types
// ============================================================================

export const PipelineStepSchema = z.object({
  id: z.string(),
  tool: z.string(),
  inputs: z.record(z.union([z.string(), z.number(), z.boolean(), z.null()])),
  dependsOn: z.array(z.string()).optional(),
  condition: z.string().optional(), // JS expression
  retries: z.number().optional(),
  timeout: z.number().optional(),
});

export type PipelineStep = z.infer<typeof PipelineStepSchema>;

export const PipelineSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  version: z.string().default('1.0.0'),
  steps: z.array(PipelineStepSchema),
  inputs: z.record(z.object({
    type: z.string(),
    description: z.string(),
    required: z.boolean().optional(),
    default: z.unknown().optional(),
  })).optional(),
  outputs: z.array(z.string()).optional(),
  metadata: z.object({
    category: z.string().optional(),
    tags: z.array(z.string()).optional(),
    riskLevel: z.enum(['safe', 'low', 'medium', 'high', 'critical']).optional(),
    estimatedDuration: z.number().optional(), // ms
  }).optional(),
});

export type Pipeline = z.infer<typeof PipelineSchema>;

// ============================================================================
// Execution Context
// ============================================================================

export const SharedContextSchema = z.object({
  // Input parameters from user
  inputs: z.record(z.unknown()),
  // Results from completed steps
  results: z.record(z.unknown()),
  // Accumulated state
  state: z.record(z.unknown()),
  // Execution metadata
  meta: z.object({
    startTime: z.number(),
    currentStep: z.string().optional(),
    completedSteps: z.array(z.string()),
    errors: z.array(z.object({
      step: z.string(),
      error: z.string(),
      timestamp: z.number(),
    })),
  }),
});

export type SharedContext = z.infer<typeof SharedContextSchema>;

// ============================================================================
// Execution Results
// ============================================================================

export const StepResultSchema = z.object({
  stepId: z.string(),
  status: z.enum(['success', 'error', 'skipped']),
  output: z.unknown().optional(),
  error: z.string().optional(),
  duration: z.number(),
  timestamp: z.number(),
});

export type StepResult = z.infer<typeof StepResultSchema>;

export const PipelineResultSchema = z.object({
  pipelineId: z.string(),
  status: z.enum(['success', 'partial', 'error']),
  steps: z.array(StepResultSchema),
  finalOutput: z.unknown().optional(),
  totalDuration: z.number(),
  startTime: z.number(),
  endTime: z.number(),
  context: SharedContextSchema,
});

export type PipelineResult = z.infer<typeof PipelineResultSchema>;

// ============================================================================
// Validation Results
// ============================================================================

export const ValidationResultSchema = z.object({
  valid: z.boolean(),
  errors: z.array(z.object({
    path: z.string(),
    message: z.string(),
  })),
  warnings: z.array(z.object({
    path: z.string(),
    message: z.string(),
  })),
  riskScore: z.number().min(0).max(100),
  estimatedTokens: z.number(),
});

export type ValidationResult = z.infer<typeof ValidationResultSchema>;

// ============================================================================
// Tool Registry
// ============================================================================

export interface ToolHandler {
  (inputs: Record<string, unknown>, context: SharedContext): Promise<unknown>;
}

export interface ToolRegistry {
  tools: Map<string, ToolDefinition>;
  handlers: Map<string, ToolHandler>;

  register(tool: ToolDefinition, handler: ToolHandler): void;
  get(name: string): { tool: ToolDefinition; handler: ToolHandler } | undefined;
  has(name: string): boolean;
  list(): ToolDefinition[];
}

// ============================================================================
// Coordinator Events
// ============================================================================

export interface PTCEvents {
  'pipeline:start': (pipeline: Pipeline, context: SharedContext) => void;
  'pipeline:complete': (result: PipelineResult) => void;
  'pipeline:error': (error: Error, pipeline: Pipeline) => void;
  'step:start': (step: PipelineStep, context: SharedContext) => void;
  'step:complete': (result: StepResult, context: SharedContext) => void;
  'step:error': (error: Error, step: PipelineStep) => void;
  'step:skip': (step: PipelineStep, reason: string) => void;
}

// ============================================================================
// Coordinator Config
// ============================================================================

export interface PTCConfig {
  maxConcurrency: number;
  defaultTimeout: number;
  maxRetries: number;
  enableAuditLog: boolean;
  sandboxed: boolean;
}

export const DEFAULT_PTC_CONFIG: PTCConfig = {
  maxConcurrency: 5,
  defaultTimeout: 30000,
  maxRetries: 2,
  enableAuditLog: true,
  sandboxed: true,
};
