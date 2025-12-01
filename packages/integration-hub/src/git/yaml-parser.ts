/**
 * Pipeline YAML Parser
 *
 * Converts between Pipeline objects and YAML format
 */

import { parse as parseYAML, stringify as stringifyYAML } from "yaml";
import {
  PipelineYAMLSchema,
  type PipelineYAML,
  type PipelineYAMLStep,
} from "./types.js";

// =============================================================================
// PARSE YAML TO PIPELINE
// =============================================================================

export interface ParseResult {
  success: boolean;
  pipeline?: PipelineYAML;
  errors?: string[];
}

/**
 * Parse YAML string to PipelineYAML object
 */
export function parsePipelineYAML(yamlContent: string): ParseResult {
  try {
    const parsed = parseYAML(yamlContent);

    // Validate against schema
    const result = PipelineYAMLSchema.safeParse(parsed);

    if (!result.success) {
      return {
        success: false,
        errors: result.error.errors.map(
          (e) => `${e.path.join(".")}: ${e.message}`
        ),
      };
    }

    return {
      success: true,
      pipeline: result.data,
    };
  } catch (error) {
    return {
      success: false,
      errors: [error instanceof Error ? error.message : "Invalid YAML syntax"],
    };
  }
}

/**
 * Convert PipelineYAML to YAML string
 */
export function stringifyPipelineYAML(pipeline: PipelineYAML): string {
  return stringifyYAML(pipeline, {
    indent: 2,
    lineWidth: 120,
    defaultStringType: "QUOTE_DOUBLE",
    defaultKeyType: "PLAIN",
  });
}

// =============================================================================
// CONVERT TO/FROM INTERNAL PIPELINE FORMAT
// =============================================================================

export interface InternalPipeline {
  id: string;
  name: string;
  description?: string;
  schedule?: string;
  steps: InternalPipelineStep[];
  metadata?: Record<string, unknown>;
}

export interface InternalPipelineStep {
  id: string;
  name: string;
  toolId: string;
  config?: Record<string, unknown>;
  timeout?: number;
  retries?: number;
  condition?: string;
  dependsOn?: string[];
}

/**
 * Convert YAML pipeline to internal format
 */
export function yamlToInternal(
  yaml: PipelineYAML,
  existingId?: string
): InternalPipeline {
  return {
    id: existingId || generateId("pipeline"),
    name: yaml.name,
    description: yaml.description,
    schedule: yaml.schedule,
    steps: yaml.steps.map((step) => ({
      id: step.id || generateId("step"),
      name: step.name,
      toolId: step.tool,
      config: step.config as Record<string, unknown> | undefined,
      timeout: step.timeout,
      retries: step.retries,
      condition: step.condition,
      dependsOn: step.dependsOn,
    })),
    metadata: {
      trigger: yaml.trigger,
      env: yaml.env,
      notifications: yaml.notifications,
      budget: yaml.budget,
      yamlVersion: yaml.version,
    },
  };
}

/**
 * Convert internal pipeline to YAML format
 */
export function internalToYAML(pipeline: InternalPipeline): PipelineYAML {
  const metadata = pipeline.metadata || {};

  return {
    version: "1.0",
    name: pipeline.name,
    description: pipeline.description,
    schedule: pipeline.schedule,
    trigger: metadata.trigger as PipelineYAML["trigger"],
    env: metadata.env as Record<string, string> | undefined,
    steps: pipeline.steps.map((step) => ({
      id: step.id,
      name: step.name,
      tool: step.toolId,
      config: step.config,
      timeout: step.timeout,
      retries: step.retries,
      condition: step.condition,
      dependsOn: step.dependsOn,
    })),
    notifications: metadata.notifications as PipelineYAML["notifications"],
    budget: metadata.budget as PipelineYAML["budget"],
  };
}

// =============================================================================
// VALIDATION
// =============================================================================

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  path: string;
  message: string;
  severity: "error";
}

export interface ValidationWarning {
  path: string;
  message: string;
  severity: "warning";
}

/**
 * Validate a pipeline YAML with detailed feedback
 */
export function validatePipelineYAML(yaml: PipelineYAML): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Check for unique step IDs
  const stepIds = new Set<string>();
  for (const step of yaml.steps) {
    if (stepIds.has(step.id)) {
      errors.push({
        path: `steps.${step.id}`,
        message: `Duplicate step ID: ${step.id}`,
        severity: "error",
      });
    }
    stepIds.add(step.id);
  }

  // Check dependsOn references
  for (const step of yaml.steps) {
    if (step.dependsOn) {
      for (const dep of step.dependsOn) {
        if (!stepIds.has(dep)) {
          errors.push({
            path: `steps.${step.id}.dependsOn`,
            message: `Unknown dependency: ${dep}`,
            severity: "error",
          });
        }
      }
    }
  }

  // Check for circular dependencies
  const circularDeps = detectCircularDependencies(yaml.steps);
  if (circularDeps.length > 0) {
    errors.push({
      path: "steps",
      message: `Circular dependency detected: ${circularDeps.join(" -> ")}`,
      severity: "error",
    });
  }

  // Warn about missing descriptions
  if (!yaml.description) {
    warnings.push({
      path: "description",
      message: "Pipeline description is recommended",
      severity: "warning",
    });
  }

  // Warn about steps without timeout
  for (const step of yaml.steps) {
    if (!step.timeout) {
      warnings.push({
        path: `steps.${step.id}.timeout`,
        message: `Step "${step.name}" has no timeout set`,
        severity: "warning",
      });
    }
  }

  // Warn about no budget set
  if (!yaml.budget) {
    warnings.push({
      path: "budget",
      message: "No budget limits configured",
      severity: "warning",
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Detect circular dependencies in steps
 */
function detectCircularDependencies(steps: PipelineYAMLStep[]): string[] {
  const graph = new Map<string, string[]>();

  for (const step of steps) {
    graph.set(step.id, step.dependsOn || []);
  }

  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const path: string[] = [];

  function dfs(nodeId: string): string[] | null {
    visited.add(nodeId);
    recursionStack.add(nodeId);
    path.push(nodeId);

    const neighbors = graph.get(nodeId) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        const result = dfs(neighbor);
        if (result) return result;
      } else if (recursionStack.has(neighbor)) {
        // Found cycle
        const cycleStart = path.indexOf(neighbor);
        return [...path.slice(cycleStart), neighbor];
      }
    }

    path.pop();
    recursionStack.delete(nodeId);
    return null;
  }

  for (const step of steps) {
    if (!visited.has(step.id)) {
      const cycle = dfs(step.id);
      if (cycle) return cycle;
    }
  }

  return [];
}

// =============================================================================
// DIFF GENERATION
// =============================================================================

/**
 * Generate a human-readable diff between two pipeline YAMLs
 */
export function generatePipelineDiff(
  oldYaml: PipelineYAML | undefined,
  newYaml: PipelineYAML | undefined
): string {
  if (!oldYaml && !newYaml) return "";
  if (!oldYaml) return `+ New pipeline: ${newYaml!.name}`;
  if (!newYaml) return `- Deleted pipeline: ${oldYaml.name}`;

  const changes: string[] = [];

  // Name change
  if (oldYaml.name !== newYaml.name) {
    changes.push(`~ name: "${oldYaml.name}" -> "${newYaml.name}"`);
  }

  // Description change
  if (oldYaml.description !== newYaml.description) {
    changes.push(`~ description changed`);
  }

  // Schedule change
  if (oldYaml.schedule !== newYaml.schedule) {
    changes.push(
      `~ schedule: "${oldYaml.schedule || "none"}" -> "${newYaml.schedule || "none"}"`
    );
  }

  // Steps changes
  const oldStepIds = new Set(oldYaml.steps.map((s) => s.id));
  const newStepIds = new Set(newYaml.steps.map((s) => s.id));

  // Added steps
  for (const step of newYaml.steps) {
    if (!oldStepIds.has(step.id)) {
      changes.push(`+ step: ${step.name} (${step.id})`);
    }
  }

  // Removed steps
  for (const step of oldYaml.steps) {
    if (!newStepIds.has(step.id)) {
      changes.push(`- step: ${step.name} (${step.id})`);
    }
  }

  // Modified steps
  for (const newStep of newYaml.steps) {
    const oldStep = oldYaml.steps.find((s) => s.id === newStep.id);
    if (oldStep) {
      if (
        oldStep.name !== newStep.name ||
        oldStep.tool !== newStep.tool ||
        JSON.stringify(oldStep.config) !== JSON.stringify(newStep.config)
      ) {
        changes.push(`~ step modified: ${newStep.name} (${newStep.id})`);
      }
    }
  }

  return changes.length > 0
    ? changes.join("\n")
    : "No changes detected";
}

// =============================================================================
// HELPERS
// =============================================================================

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// =============================================================================
// EXAMPLE YAML TEMPLATES
// =============================================================================

export const EXAMPLE_PIPELINES = {
  basic: `version: "1.0"
name: "Basic Pipeline"
description: "A simple example pipeline"

steps:
  - id: step1
    name: "Fetch Data"
    tool: http_request
    config:
      url: "https://api.example.com/data"
      method: GET
    timeout: 30000

  - id: step2
    name: "Process Data"
    tool: transform
    config:
      template: "{{ step1.data | json }}"
    dependsOn:
      - step1
`,

  scheduled: `version: "1.0"
name: "Scheduled Report"
description: "Daily report generation"
schedule: "0 9 * * *"  # Every day at 9am

trigger:
  events:
    - schedule

steps:
  - id: gather
    name: "Gather Metrics"
    tool: analytics_query
    config:
      query: "SELECT * FROM metrics WHERE date = TODAY()"
    timeout: 60000

  - id: format
    name: "Format Report"
    tool: template_render
    config:
      template: "report.md"
    dependsOn:
      - gather

  - id: send
    name: "Send Email"
    tool: email_send
    config:
      to: "team@example.com"
      subject: "Daily Report"
    dependsOn:
      - format

notifications:
  onSuccess:
    - "https://hooks.slack.com/xxx"
  onFailure:
    - "https://hooks.slack.com/xxx"

budget:
  maxCostPerRun: 1.00
  maxDailyCost: 10.00
`,

  cicd: `version: "1.0"
name: "CI/CD Pipeline"
description: "Build and deploy on push to main"

trigger:
  events:
    - push
  branches:
    - main
  paths:
    - "src/**"
    - "package.json"

env:
  NODE_ENV: production
  DEPLOY_TARGET: vercel

steps:
  - id: test
    name: "Run Tests"
    tool: shell_exec
    config:
      command: "npm test"
    timeout: 300000

  - id: build
    name: "Build Project"
    tool: shell_exec
    config:
      command: "npm run build"
    dependsOn:
      - test
    timeout: 300000

  - id: deploy
    name: "Deploy"
    tool: vercel_deploy
    config:
      project: "my-app"
      production: true
    dependsOn:
      - build
    condition: "steps.build.success"
`,
};
