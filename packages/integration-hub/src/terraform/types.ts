/**
 * Terraform Provider Types
 * Phase 11C: Infrastructure as Code Integration
 */

import { z } from "zod";

// ============================================================================
// Resource Types
// ============================================================================

export const TerraformResourceTypeSchema = z.enum([
  "integrationhub_pipeline",
  "integrationhub_schedule",
  "integrationhub_webhook",
  "integrationhub_budget",
  "integrationhub_notification",
  "integrationhub_plugin",
]);
export type TerraformResourceType = z.infer<typeof TerraformResourceTypeSchema>;

// ============================================================================
// Provider Configuration
// ============================================================================

export const ProviderConfigSchema = z.object({
  apiKey: z.string(),
  baseUrl: z.string().url().default("https://api.integrationhub.io"),
  organizationId: z.string().optional(),
  timeout: z.number().default(30),
  maxRetries: z.number().default(3),
});
export type ProviderConfig = z.infer<typeof ProviderConfigSchema>;

// ============================================================================
// Pipeline Resource
// ============================================================================

export const PipelineStepResourceSchema = z.object({
  name: z.string(),
  type: z.enum(["llm", "transform", "condition", "parallel", "loop"]),
  config: z.record(z.unknown()).optional(),
  dependsOn: z.array(z.string()).optional(),
  timeout: z.number().optional(),
  retries: z.number().optional(),
});
export type PipelineStepResource = z.infer<typeof PipelineStepResourceSchema>;

export const PipelineResourceSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  steps: z.array(PipelineStepResourceSchema),
  variables: z.record(z.string()).optional(),
  metadata: z.record(z.string()).optional(),
  maxConcurrency: z.number().optional(),
  timeoutMinutes: z.number().optional(),
});
export type PipelineResource = z.infer<typeof PipelineResourceSchema>;

// ============================================================================
// Schedule Resource
// ============================================================================

export const ScheduleResourceSchema = z.object({
  pipelineId: z.string(),
  name: z.string(),
  cronExpression: z.string(),
  timezone: z.string().default("UTC"),
  enabled: z.boolean().default(true),
  inputs: z.record(z.unknown()).optional(),
  notifications: z.object({
    onSuccess: z.array(z.string()).optional(),
    onFailure: z.array(z.string()).optional(),
  }).optional(),
});
export type ScheduleResource = z.infer<typeof ScheduleResourceSchema>;

// ============================================================================
// Webhook Resource
// ============================================================================

export const WebhookResourceSchema = z.object({
  name: z.string(),
  url: z.string().url(),
  events: z.array(z.string()),
  secret: z.string().optional(),
  enabled: z.boolean().default(true),
  headers: z.record(z.string()).optional(),
  retryPolicy: z.object({
    maxRetries: z.number(),
    backoffMs: z.number(),
  }).optional(),
});
export type WebhookResource = z.infer<typeof WebhookResourceSchema>;

// ============================================================================
// Budget Resource
// ============================================================================

export const BudgetResourceSchema = z.object({
  name: z.string(),
  type: z.enum(["daily", "weekly", "monthly", "pipeline"]),
  limit: z.number(),
  currency: z.string().default("USD"),
  pipelineId: z.string().optional(),
  alertThresholds: z.array(z.number()).optional(), // e.g., [50, 75, 90]
  actions: z.object({
    onThreshold: z.enum(["notify", "throttle", "pause"]).optional(),
    onExceeded: z.enum(["notify", "pause", "block"]).optional(),
  }).optional(),
});
export type BudgetResource = z.infer<typeof BudgetResourceSchema>;

// ============================================================================
// Notification Resource
// ============================================================================

export const NotificationResourceSchema = z.object({
  name: z.string(),
  type: z.enum(["slack", "discord", "email", "webhook", "pagerduty"]),
  config: z.object({
    channel: z.string().optional(),
    url: z.string().optional(),
    emails: z.array(z.string()).optional(),
    integrationKey: z.string().optional(),
  }),
  events: z.array(z.string()),
  filters: z.object({
    severity: z.array(z.string()).optional(),
    pipelines: z.array(z.string()).optional(),
  }).optional(),
});
export type NotificationResource = z.infer<typeof NotificationResourceSchema>;

// ============================================================================
// Plugin Resource
// ============================================================================

export const PluginResourceSchema = z.object({
  name: z.string(),
  version: z.string(),
  enabled: z.boolean().default(true),
  config: z.record(z.unknown()).optional(),
  permissions: z.array(z.string()).optional(),
});
export type PluginResource = z.infer<typeof PluginResourceSchema>;

// ============================================================================
// State Management
// ============================================================================

export const ResourceStateSchema = z.object({
  id: z.string(),
  type: TerraformResourceTypeSchema,
  name: z.string(),
  attributes: z.record(z.unknown()),
  meta: z.object({
    createdAt: z.string(),
    updatedAt: z.string(),
    version: z.number(),
    checksum: z.string(),
  }),
  dependencies: z.array(z.string()).optional(),
});
export type ResourceState = z.infer<typeof ResourceStateSchema>;

export const TerraformStateSchema = z.object({
  version: z.number().default(1),
  serial: z.number(),
  lineage: z.string(),
  resources: z.array(ResourceStateSchema),
  outputs: z.record(z.object({
    value: z.unknown(),
    type: z.string(),
    sensitive: z.boolean().optional(),
  })).optional(),
});
export type TerraformState = z.infer<typeof TerraformStateSchema>;

// ============================================================================
// Plan & Apply
// ============================================================================

export const ResourceChangeTypeSchema = z.enum([
  "create",
  "update",
  "delete",
  "replace",
  "no-op",
]);
export type ResourceChangeType = z.infer<typeof ResourceChangeTypeSchema>;

export const ResourceChangeSchema = z.object({
  type: TerraformResourceTypeSchema,
  name: z.string(),
  action: ResourceChangeTypeSchema,
  before: z.record(z.unknown()).optional(),
  after: z.record(z.unknown()).optional(),
  diff: z.array(z.object({
    path: z.string(),
    oldValue: z.unknown(),
    newValue: z.unknown(),
  })).optional(),
});
export type ResourceChange = z.infer<typeof ResourceChangeSchema>;

export const TerraformPlanSchema = z.object({
  version: z.number(),
  timestamp: z.string(),
  changes: z.array(ResourceChangeSchema),
  summary: z.object({
    toCreate: z.number(),
    toUpdate: z.number(),
    toDelete: z.number(),
    toReplace: z.number(),
    unchanged: z.number(),
  }),
});
export type TerraformPlan = z.infer<typeof TerraformPlanSchema>;

export const ApplyResultSchema = z.object({
  success: z.boolean(),
  resourceId: z.string().optional(),
  error: z.string().optional(),
  duration: z.number(),
});
export type ApplyResult = z.infer<typeof ApplyResultSchema>;

export const TerraformApplyResultSchema = z.object({
  success: z.boolean(),
  results: z.array(z.object({
    resource: z.string(),
    action: ResourceChangeTypeSchema,
    result: ApplyResultSchema,
  })),
  summary: z.object({
    created: z.number(),
    updated: z.number(),
    deleted: z.number(),
    failed: z.number(),
  }),
  duration: z.number(),
});
export type TerraformApplyResult = z.infer<typeof TerraformApplyResultSchema>;

// ============================================================================
// HCL Configuration
// ============================================================================

export const HCLBlockSchema = z.object({
  type: z.string(),
  labels: z.array(z.string()),
  attributes: z.record(z.unknown()),
  blocks: z.array(z.lazy(() => HCLBlockSchema)).optional(),
});
export type HCLBlock = z.infer<typeof HCLBlockSchema>;

export const HCLConfigSchema = z.object({
  terraform: z.object({
    requiredProviders: z.record(z.object({
      source: z.string(),
      version: z.string(),
    })).optional(),
  }).optional(),
  provider: z.record(z.record(z.unknown())).optional(),
  resources: z.array(HCLBlockSchema).optional(),
  data: z.array(HCLBlockSchema).optional(),
  outputs: z.record(z.object({
    value: z.string(),
    description: z.string().optional(),
    sensitive: z.boolean().optional(),
  })).optional(),
  variables: z.record(z.object({
    type: z.string().optional(),
    default: z.unknown().optional(),
    description: z.string().optional(),
    sensitive: z.boolean().optional(),
    validation: z.object({
      condition: z.string(),
      errorMessage: z.string(),
    }).optional(),
  })).optional(),
});
export type HCLConfig = z.infer<typeof HCLConfigSchema>;

// ============================================================================
// Provider Manager Config
// ============================================================================

export const TerraformManagerConfigSchema = z.object({
  providerVersion: z.string().default("1.0.0"),
  stateBackend: z.enum(["local", "s3", "gcs", "azure", "http"]).default("local"),
  stateConfig: z.record(z.unknown()).optional(),
  autoApprove: z.boolean().default(false),
  parallelism: z.number().default(10),
  refreshOnPlan: z.boolean().default(true),
});
export type TerraformManagerConfig = z.infer<typeof TerraformManagerConfigSchema>;

// ============================================================================
// Events
// ============================================================================

export type TerraformEvents = {
  // Lifecycle
  planStarted: () => void;
  planCompleted: (plan: TerraformPlan) => void;
  applyStarted: (plan: TerraformPlan) => void;
  applyCompleted: (result: TerraformApplyResult) => void;

  // Resources
  resourceCreating: (type: TerraformResourceType, name: string) => void;
  resourceCreated: (type: TerraformResourceType, name: string, id: string) => void;
  resourceUpdating: (type: TerraformResourceType, name: string) => void;
  resourceUpdated: (type: TerraformResourceType, name: string) => void;
  resourceDeleting: (type: TerraformResourceType, name: string) => void;
  resourceDeleted: (type: TerraformResourceType, name: string) => void;

  // Errors
  error: (error: Error) => void;
  resourceError: (type: TerraformResourceType, name: string, error: Error) => void;

  // State
  stateRefreshed: () => void;
  stateSaved: () => void;
};

// ============================================================================
// Example Configurations
// ============================================================================

export const EXAMPLE_TERRAFORM_CONFIG = `
terraform {
  required_providers {
    integrationhub = {
      source  = "gicm/integrationhub"
      version = "~> 1.0"
    }
  }
}

provider "integrationhub" {
  api_key         = var.api_key
  organization_id = var.organization_id
}

variable "api_key" {
  type        = string
  description = "Integration Hub API key"
  sensitive   = true
}

variable "organization_id" {
  type        = string
  description = "Organization ID"
}

resource "integrationhub_pipeline" "content_generator" {
  name        = "content-generator"
  description = "Generates blog content from topics"

  step {
    name = "research"
    type = "llm"
    config = {
      model  = "claude-3-sonnet"
      prompt = "Research the topic: \${var.topic}"
    }
  }

  step {
    name       = "write"
    type       = "llm"
    depends_on = ["research"]
    config = {
      model  = "claude-3-opus"
      prompt = "Write a blog post based on: \${step.research.output}"
    }
  }

  step {
    name       = "review"
    type       = "llm"
    depends_on = ["write"]
    config = {
      model  = "claude-3-haiku"
      prompt = "Review and suggest improvements for: \${step.write.output}"
    }
  }

  variables = {
    topic = "AI in Healthcare"
  }

  max_concurrency = 1
  timeout_minutes = 30
}

resource "integrationhub_schedule" "daily_content" {
  pipeline_id     = integrationhub_pipeline.content_generator.id
  name            = "daily-content-schedule"
  cron_expression = "0 9 * * 1-5"
  timezone        = "America/New_York"
  enabled         = true

  inputs = {
    topic = "Daily AI News"
  }
}

resource "integrationhub_budget" "monthly_limit" {
  name     = "monthly-ai-budget"
  type     = "monthly"
  limit    = 500
  currency = "USD"

  alert_thresholds = [50, 75, 90]

  actions {
    on_threshold = "notify"
    on_exceeded  = "pause"
  }
}

resource "integrationhub_webhook" "pipeline_events" {
  name   = "pipeline-notifications"
  url    = "https://hooks.slack.com/services/xxx"
  events = ["pipeline.completed", "pipeline.failed"]

  headers = {
    Content-Type = "application/json"
  }

  retry_policy {
    max_retries = 3
    backoff_ms  = 1000
  }
}

output "pipeline_id" {
  value       = integrationhub_pipeline.content_generator.id
  description = "The ID of the content generator pipeline"
}

output "schedule_id" {
  value       = integrationhub_schedule.daily_content.id
  description = "The ID of the daily content schedule"
}
`;
