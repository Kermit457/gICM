/**
 * Chat Integration Types
 * Phase 11B: Slack/Discord Bot
 */

import { z } from "zod";

// ============================================================================
// Platform Types
// ============================================================================

export const ChatPlatformSchema = z.enum(["slack", "discord", "telegram", "teams"]);
export type ChatPlatform = z.infer<typeof ChatPlatformSchema>;

export const ConnectionStatusSchema = z.enum([
  "connected",
  "disconnected",
  "connecting",
  "error",
]);
export type ConnectionStatus = z.infer<typeof ConnectionStatusSchema>;

// ============================================================================
// Credentials
// ============================================================================

export const SlackCredentialsSchema = z.object({
  botToken: z.string().startsWith("xoxb-"),
  appToken: z.string().startsWith("xapp-").optional(),
  signingSecret: z.string().optional(),
  clientId: z.string().optional(),
  clientSecret: z.string().optional(),
});
export type SlackCredentials = z.infer<typeof SlackCredentialsSchema>;

export const DiscordCredentialsSchema = z.object({
  botToken: z.string(),
  applicationId: z.string(),
  publicKey: z.string().optional(),
});
export type DiscordCredentials = z.infer<typeof DiscordCredentialsSchema>;

export const TelegramCredentialsSchema = z.object({
  botToken: z.string(),
  webhookSecret: z.string().optional(),
});
export type TelegramCredentials = z.infer<typeof TelegramCredentialsSchema>;

export const TeamsCredentialsSchema = z.object({
  appId: z.string(),
  appPassword: z.string(),
  tenantId: z.string().optional(),
});
export type TeamsCredentials = z.infer<typeof TeamsCredentialsSchema>;

export const ChatCredentialsSchema = z.union([
  z.object({ platform: z.literal("slack"), credentials: SlackCredentialsSchema }),
  z.object({ platform: z.literal("discord"), credentials: DiscordCredentialsSchema }),
  z.object({ platform: z.literal("telegram"), credentials: TelegramCredentialsSchema }),
  z.object({ platform: z.literal("teams"), credentials: TeamsCredentialsSchema }),
]);
export type ChatCredentials = z.infer<typeof ChatCredentialsSchema>;

// ============================================================================
// Channel & User
// ============================================================================

export const ChatChannelSchema = z.object({
  id: z.string(),
  platform: ChatPlatformSchema,
  name: z.string(),
  type: z.enum(["channel", "dm", "group", "thread"]),
  isPrivate: z.boolean().default(false),
  memberCount: z.number().optional(),
  createdAt: z.date().optional(),
});
export type ChatChannel = z.infer<typeof ChatChannelSchema>;

export const ChatUserSchema = z.object({
  id: z.string(),
  platform: ChatPlatformSchema,
  username: z.string(),
  displayName: z.string().optional(),
  email: z.string().email().optional(),
  avatarUrl: z.string().url().optional(),
  isBot: z.boolean().default(false),
  timezone: z.string().optional(),
});
export type ChatUser = z.infer<typeof ChatUserSchema>;

// ============================================================================
// Messages
// ============================================================================

export const MessageAttachmentSchema = z.object({
  type: z.enum(["image", "file", "video", "audio", "link"]),
  url: z.string().url(),
  name: z.string().optional(),
  size: z.number().optional(),
  mimeType: z.string().optional(),
  thumbnailUrl: z.string().url().optional(),
});
export type MessageAttachment = z.infer<typeof MessageAttachmentSchema>;

export const MessageBlockSchema = z.object({
  type: z.enum(["text", "code", "quote", "divider", "header", "button", "select"]),
  content: z.string().optional(),
  language: z.string().optional(), // For code blocks
  url: z.string().optional(), // For buttons
  options: z.array(z.object({ label: z.string(), value: z.string() })).optional(),
});
export type MessageBlock = z.infer<typeof MessageBlockSchema>;

export const ChatMessageSchema = z.object({
  id: z.string(),
  platform: ChatPlatformSchema,
  channelId: z.string(),
  userId: z.string(),
  content: z.string(),
  blocks: z.array(MessageBlockSchema).optional(),
  attachments: z.array(MessageAttachmentSchema).optional(),
  threadId: z.string().optional(),
  replyToId: z.string().optional(),
  timestamp: z.date(),
  editedAt: z.date().optional(),
  reactions: z.record(z.array(z.string())).optional(), // emoji -> userIds
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export const SendMessageOptionsSchema = z.object({
  channelId: z.string(),
  content: z.string(),
  blocks: z.array(MessageBlockSchema).optional(),
  threadId: z.string().optional(),
  ephemeral: z.boolean().optional(), // Only visible to one user
  targetUserId: z.string().optional(), // For ephemeral messages
});
export type SendMessageOptions = z.infer<typeof SendMessageOptionsSchema>;

// ============================================================================
// Commands & Interactions
// ============================================================================

export const SlashCommandSchema = z.object({
  name: z.string().regex(/^[\w-]+$/),
  description: z.string().max(100),
  options: z.array(z.object({
    name: z.string(),
    description: z.string(),
    type: z.enum(["string", "integer", "boolean", "user", "channel"]),
    required: z.boolean().default(false),
    choices: z.array(z.object({ name: z.string(), value: z.string() })).optional(),
  })).optional(),
  handler: z.string(), // Pipeline ID to execute
});
export type SlashCommand = z.infer<typeof SlashCommandSchema>;

export const CommandInvocationSchema = z.object({
  id: z.string(),
  command: z.string(),
  args: z.record(z.unknown()),
  userId: z.string(),
  channelId: z.string(),
  platform: ChatPlatformSchema,
  timestamp: z.date(),
  responseUrl: z.string().url().optional(),
});
export type CommandInvocation = z.infer<typeof CommandInvocationSchema>;

export const ButtonInteractionSchema = z.object({
  id: z.string(),
  actionId: z.string(),
  value: z.string().optional(),
  userId: z.string(),
  channelId: z.string(),
  messageId: z.string(),
  platform: ChatPlatformSchema,
  timestamp: z.date(),
});
export type ButtonInteraction = z.infer<typeof ButtonInteractionSchema>;

// ============================================================================
// Notification Templates
// ============================================================================

export const NotificationTypeSchema = z.enum([
  "pipeline_started",
  "pipeline_completed",
  "pipeline_failed",
  "step_completed",
  "step_failed",
  "approval_required",
  "budget_warning",
  "budget_exceeded",
  "anomaly_detected",
  "custom",
]);
export type NotificationType = z.infer<typeof NotificationTypeSchema>;

export const NotificationTemplateSchema = z.object({
  id: z.string(),
  type: NotificationTypeSchema,
  platform: ChatPlatformSchema,
  title: z.string(),
  bodyTemplate: z.string(), // Handlebars-style template
  color: z.string().optional(), // For embeds/attachments
  includeDetails: z.boolean().default(true),
  actions: z.array(z.object({
    label: z.string(),
    actionId: z.string(),
    style: z.enum(["primary", "secondary", "danger"]).optional(),
  })).optional(),
});
export type NotificationTemplate = z.infer<typeof NotificationTemplateSchema>;

export const NotificationConfigSchema = z.object({
  channelId: z.string(),
  platform: ChatPlatformSchema,
  enabledTypes: z.array(NotificationTypeSchema),
  mentionUsers: z.array(z.string()).optional(),
  mentionRoles: z.array(z.string()).optional(),
  quietHours: z.object({
    enabled: z.boolean(),
    start: z.string(), // HH:mm
    end: z.string(),
    timezone: z.string(),
  }).optional(),
});
export type NotificationConfig = z.infer<typeof NotificationConfigSchema>;

// ============================================================================
// Bot Configuration
// ============================================================================

export const BotConfigSchema = z.object({
  id: z.string(),
  platform: ChatPlatformSchema,
  name: z.string(),
  status: ConnectionStatusSchema,
  credentials: z.unknown(), // Platform-specific
  commands: z.array(SlashCommandSchema).optional(),
  notifications: z.array(NotificationConfigSchema).optional(),
  allowedChannels: z.array(z.string()).optional(),
  adminUsers: z.array(z.string()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type BotConfig = z.infer<typeof BotConfigSchema>;

export const ChatManagerConfigSchema = z.object({
  bots: z.array(BotConfigSchema).optional(),
  defaultPlatform: ChatPlatformSchema.optional(),
  commandPrefix: z.string().default("/"),
  maxRetries: z.number().default(3),
  retryDelayMs: z.number().default(1000),
  rateLimitPerMinute: z.number().default(30),
});
export type ChatManagerConfig = z.infer<typeof ChatManagerConfigSchema>;

// ============================================================================
// Events
// ============================================================================

export type ChatEvents = {
  // Connection
  connected: (platform: ChatPlatform) => void;
  disconnected: (platform: ChatPlatform, reason: string) => void;
  error: (platform: ChatPlatform, error: Error) => void;

  // Messages
  messageReceived: (message: ChatMessage) => void;
  messageSent: (message: ChatMessage) => void;
  messageEdited: (message: ChatMessage) => void;
  messageDeleted: (messageId: string, channelId: string) => void;

  // Interactions
  commandReceived: (invocation: CommandInvocation) => void;
  buttonClicked: (interaction: ButtonInteraction) => void;

  // Notifications
  notificationSent: (type: NotificationType, channelId: string) => void;
  notificationFailed: (type: NotificationType, error: Error) => void;
};

// ============================================================================
// Default Templates
// ============================================================================

export const DEFAULT_NOTIFICATION_TEMPLATES: NotificationTemplate[] = [
  {
    id: "pipeline_started",
    type: "pipeline_started",
    platform: "slack",
    title: "Pipeline Started",
    bodyTemplate: `Pipeline **{{pipelineName}}** has started execution.
- Execution ID: \`{{executionId}}\`
- Triggered by: {{triggeredBy}}
- Steps: {{stepCount}}`,
    color: "#3498db",
    includeDetails: true,
  },
  {
    id: "pipeline_completed",
    type: "pipeline_completed",
    platform: "slack",
    title: "Pipeline Completed",
    bodyTemplate: `Pipeline **{{pipelineName}}** completed successfully!
- Duration: {{duration}}
- Cost: {{cost}}
- Output: {{outputPreview}}`,
    color: "#2ecc71",
    includeDetails: true,
    actions: [
      { label: "View Results", actionId: "view_results", style: "primary" },
    ],
  },
  {
    id: "pipeline_failed",
    type: "pipeline_failed",
    platform: "slack",
    title: "Pipeline Failed",
    bodyTemplate: `Pipeline **{{pipelineName}}** failed!
- Error: {{errorMessage}}
- Failed Step: {{failedStep}}
- Execution ID: \`{{executionId}}\``,
    color: "#e74c3c",
    includeDetails: true,
    actions: [
      { label: "View Logs", actionId: "view_logs", style: "primary" },
      { label: "Retry", actionId: "retry_pipeline", style: "secondary" },
    ],
  },
  {
    id: "approval_required",
    type: "approval_required",
    platform: "slack",
    title: "Approval Required",
    bodyTemplate: `Pipeline **{{pipelineName}}** requires approval to continue.
- Step: {{stepName}}
- Requested by: {{requestedBy}}
- Reason: {{reason}}`,
    color: "#f39c12",
    includeDetails: true,
    actions: [
      { label: "Approve", actionId: "approve", style: "primary" },
      { label: "Reject", actionId: "reject", style: "danger" },
    ],
  },
  {
    id: "budget_warning",
    type: "budget_warning",
    platform: "slack",
    title: "Budget Warning",
    bodyTemplate: `Budget threshold reached for **{{budgetName}}**
- Current Spend: {{currentSpend}}
- Limit: {{limit}}
- Usage: {{percentUsed}}%`,
    color: "#f39c12",
    includeDetails: true,
  },
  {
    id: "anomaly_detected",
    type: "anomaly_detected",
    platform: "slack",
    title: "Anomaly Detected",
    bodyTemplate: `Anomaly detected in **{{metricName}}**
- Type: {{anomalyType}}
- Severity: {{severity}}
- Value: {{value}} (expected: {{expected}})`,
    color: "#9b59b6",
    includeDetails: true,
    actions: [
      { label: "Investigate", actionId: "investigate", style: "primary" },
      { label: "Dismiss", actionId: "dismiss", style: "secondary" },
    ],
  },
];
