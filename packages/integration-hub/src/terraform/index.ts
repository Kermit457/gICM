/**
 * Terraform Integration Module
 * Phase 11C: Infrastructure as Code
 */

// Types & Schemas
export {
  // Resource Types
  TerraformResourceTypeSchema,
  type TerraformResourceType,

  // Provider Config
  ProviderConfigSchema,
  type ProviderConfig,

  // Pipeline Resource
  PipelineStepResourceSchema,
  type PipelineStepResource,
  PipelineResourceSchema,
  type PipelineResource,

  // Schedule Resource
  ScheduleResourceSchema,
  type ScheduleResource,

  // Webhook Resource
  WebhookResourceSchema,
  type WebhookResource,

  // Budget Resource
  BudgetResourceSchema,
  type BudgetResource,

  // Notification Resource
  NotificationResourceSchema,
  type NotificationResource,

  // Plugin Resource
  PluginResourceSchema,
  type PluginResource,

  // State Management
  ResourceStateSchema,
  type ResourceState,
  TerraformStateSchema,
  type TerraformState,

  // Plan & Apply
  ResourceChangeTypeSchema,
  type ResourceChangeType,
  ResourceChangeSchema,
  type ResourceChange,
  TerraformPlanSchema,
  type TerraformPlan,
  ApplyResultSchema,
  type ApplyResult,
  TerraformApplyResultSchema,
  type TerraformApplyResult,

  // HCL
  HCLBlockSchema,
  type HCLBlock,
  HCLConfigSchema,
  type HCLConfig,

  // Config
  TerraformManagerConfigSchema,
  type TerraformManagerConfig,

  // Events
  type TerraformEvents,

  // Examples
  EXAMPLE_TERRAFORM_CONFIG,
} from "./types.js";

// Terraform Manager
export {
  TerraformManager,
  getTerraformManager,
  createTerraformManager,
} from "./terraform-manager.js";
