/**
 * SDK Module
 * Phase 9E: SDK Generation
 */

// Types & Schemas
export {
  // Config
  SDKConfigSchema,
  type SDKConfig,

  // Pipeline
  PipelineStepSchema,
  type PipelineStep,
  PipelineSchema,
  type Pipeline,

  // Execution
  ExecutionStatusSchema,
  type ExecutionStatus,
  ExecutionSchema,
  type Execution,

  // Schedule
  ScheduleSchema,
  type Schedule,

  // Budget
  BudgetSchema,
  type Budget,

  // Webhook
  WebhookSchema,
  type Webhook,

  // Analytics
  AnalyticsSummarySchema,
  type AnalyticsSummary,

  // Queue
  QueueJobSchema,
  type QueueJob,

  // Organization
  OrganizationSchema,
  type Organization,
  MemberSchema,
  type Member,

  // Audit
  AuditEventSchema,
  type AuditEvent,

  // Input types
  CreatePipelineInputSchema,
  type CreatePipelineInput,
  ExecutePipelineInputSchema,
  type ExecutePipelineInput,
  CreateScheduleInputSchema,
  type CreateScheduleInput,
  CreateBudgetInputSchema,
  type CreateBudgetInput,
  CreateWebhookInputSchema,
  type CreateWebhookInput,
  CreateQueueJobInputSchema,
  type CreateQueueJobInput,
  InviteMemberInputSchema,
  type InviteMemberInput,
} from "./types.js";

// Client
export { IntegrationHubSDK, SDKError, createSDK } from "./client.js";
