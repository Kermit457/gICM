/**
 * Bot Types
 *
 * Slack and Discord bot integration types
 */

import { z } from "zod";

// =============================================================================
// BOT PLATFORM
// =============================================================================

export const BotPlatformSchema = z.enum(["slack", "discord"]);
export type BotPlatform = z.infer<typeof BotPlatformSchema>;

// =============================================================================
// BOT CONFIG
// =============================================================================

export const SlackConfigSchema = z.object({
  platform: z.literal("slack"),
  botToken: z.string(), // xoxb-...
  appToken: z.string().optional(), // xapp-... for socket mode
  signingSecret: z.string(),
  defaultChannel: z.string().default("general"),
  socketMode: z.boolean().default(false),
});
export type SlackConfig = z.infer<typeof SlackConfigSchema>;

export const DiscordConfigSchema = z.object({
  platform: z.literal("discord"),
  botToken: z.string(),
  applicationId: z.string(),
  guildId: z.string().optional(), // For guild-specific commands
  defaultChannelId: z.string().optional(),
});
export type DiscordConfig = z.infer<typeof DiscordConfigSchema>;

export const BotConfigSchema = z.discriminatedUnion("platform", [
  SlackConfigSchema,
  DiscordConfigSchema,
]);
export type BotConfig = z.infer<typeof BotConfigSchema>;

// =============================================================================
// NOTIFICATION TYPES
// =============================================================================

export const NotificationSeveritySchema = z.enum(["info", "success", "warning", "error", "critical"]);
export type NotificationSeverity = z.infer<typeof NotificationSeveritySchema>;

export const NotificationCategorySchema = z.enum([
  "pipeline",
  "budget",
  "schedule",
  "system",
  "content",
  "trading",
  "security",
]);
export type NotificationCategory = z.infer<typeof NotificationCategorySchema>;

export const NotificationSchema = z.object({
  id: z.string(),
  title: z.string(),
  message: z.string(),
  severity: NotificationSeveritySchema,
  category: NotificationCategorySchema,
  data: z.record(z.unknown()).optional(),
  actions: z.array(z.object({
    id: z.string(),
    label: z.string(),
    style: z.enum(["primary", "secondary", "danger"]).default("primary"),
    value: z.string(),
  })).optional(),
  createdAt: z.string(),
});
export type Notification = z.infer<typeof NotificationSchema>;

// =============================================================================
// COMMAND TYPES
// =============================================================================

export const BotCommandSchema = z.object({
  name: z.string(),
  description: z.string(),
  category: z.enum(["pipeline", "budget", "analytics", "schedule", "system"]),
  options: z.array(z.object({
    name: z.string(),
    description: z.string(),
    type: z.enum(["string", "number", "boolean", "user", "channel"]),
    required: z.boolean().default(false),
    choices: z.array(z.object({
      name: z.string(),
      value: z.string(),
    })).optional(),
  })).optional(),
});
export type BotCommand = z.infer<typeof BotCommandSchema>;

export const CommandContextSchema = z.object({
  platform: BotPlatformSchema,
  userId: z.string(),
  userName: z.string(),
  channelId: z.string(),
  channelName: z.string().optional(),
  guildId: z.string().optional(), // Discord only
  messageId: z.string().optional(),
  threadId: z.string().optional(),
});
export type CommandContext = z.infer<typeof CommandContextSchema>;

export const CommandResponseSchema = z.object({
  text: z.string().optional(),
  blocks: z.array(z.unknown()).optional(), // Slack blocks / Discord embeds
  ephemeral: z.boolean().default(false), // Only visible to user
  attachments: z.array(z.object({
    filename: z.string(),
    content: z.string(), // Base64 or URL
    contentType: z.string().optional(),
  })).optional(),
});
export type CommandResponse = z.infer<typeof CommandResponseSchema>;

// =============================================================================
// CHANNEL SUBSCRIPTION
// =============================================================================

export const ChannelSubscriptionSchema = z.object({
  id: z.string(),
  platform: BotPlatformSchema,
  channelId: z.string(),
  channelName: z.string().optional(),
  categories: z.array(NotificationCategorySchema),
  minSeverity: NotificationSeveritySchema.default("info"),
  enabled: z.boolean().default(true),
  createdAt: z.string(),
  createdBy: z.string(),
});
export type ChannelSubscription = z.infer<typeof ChannelSubscriptionSchema>;

// =============================================================================
// INTERACTIVE MESSAGE
// =============================================================================

export const InteractionTypeSchema = z.enum([
  "button_click",
  "select_option",
  "modal_submit",
  "shortcut",
]);
export type InteractionType = z.infer<typeof InteractionTypeSchema>;

export const InteractionPayloadSchema = z.object({
  type: InteractionTypeSchema,
  actionId: z.string(),
  value: z.string().optional(),
  userId: z.string(),
  channelId: z.string(),
  messageId: z.string().optional(),
  data: z.record(z.unknown()).optional(),
});
export type InteractionPayload = z.infer<typeof InteractionPayloadSchema>;

// =============================================================================
// MESSAGE TEMPLATES
// =============================================================================

export const MessageTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: NotificationCategorySchema,
  slackTemplate: z.unknown().optional(), // Slack Block Kit template
  discordTemplate: z.unknown().optional(), // Discord embed template
  variables: z.array(z.string()), // Template variables like {{pipeline.name}}
});
export type MessageTemplate = z.infer<typeof MessageTemplateSchema>;

// =============================================================================
// BOT STATUS
// =============================================================================

export const BotStatusSchema = z.object({
  platform: BotPlatformSchema,
  connected: z.boolean(),
  connectedAt: z.string().optional(),
  workspaceId: z.string().optional(), // Slack workspace
  workspaceName: z.string().optional(),
  guildCount: z.number().optional(), // Discord
  channelCount: z.number().optional(),
  lastPing: z.string().optional(),
  latencyMs: z.number().optional(),
});
export type BotStatus = z.infer<typeof BotStatusSchema>;

// =============================================================================
// BOT MANAGER CONFIG
// =============================================================================

export const BotManagerConfigSchema = z.object({
  // Rate limiting
  maxNotificationsPerMinute: z.number().default(30),
  maxNotificationsPerHour: z.number().default(500),

  // Retry settings
  maxRetries: z.number().default(3),
  retryDelayMs: z.number().default(1000),

  // Deduplication
  dedupeWindowMs: z.number().default(60000), // 1 minute

  // Message queue
  queueEnabled: z.boolean().default(true),
  maxQueueSize: z.number().default(1000),
});
export type BotManagerConfig = z.infer<typeof BotManagerConfigSchema>;

// =============================================================================
// EVENTS
// =============================================================================

export interface BotEvents {
  "bot:connected": (platform: BotPlatform, status: BotStatus) => void;
  "bot:disconnected": (platform: BotPlatform, reason: string) => void;
  "bot:error": (platform: BotPlatform, error: Error) => void;
  "notification:sent": (platform: BotPlatform, notification: Notification, channelId: string) => void;
  "notification:failed": (platform: BotPlatform, notification: Notification, error: Error) => void;
  "command:received": (platform: BotPlatform, command: string, context: CommandContext) => void;
  "command:executed": (platform: BotPlatform, command: string, context: CommandContext) => void;
  "interaction:received": (platform: BotPlatform, interaction: InteractionPayload) => void;
  "subscription:added": (subscription: ChannelSubscription) => void;
  "subscription:removed": (subscriptionId: string) => void;
}

// =============================================================================
// BUILT-IN COMMANDS
// =============================================================================

export const BUILT_IN_COMMANDS: BotCommand[] = [
  {
    name: "status",
    description: "Get system status",
    category: "system",
  },
  {
    name: "pipelines",
    description: "List recent pipeline executions",
    category: "pipeline",
    options: [
      {
        name: "limit",
        description: "Number of pipelines to show",
        type: "number",
        required: false,
      },
      {
        name: "status",
        description: "Filter by status",
        type: "string",
        required: false,
        choices: [
          { name: "Running", value: "running" },
          { name: "Completed", value: "completed" },
          { name: "Failed", value: "failed" },
        ],
      },
    ],
  },
  {
    name: "execute",
    description: "Execute a pipeline",
    category: "pipeline",
    options: [
      {
        name: "pipeline",
        description: "Pipeline ID or name",
        type: "string",
        required: true,
      },
    ],
  },
  {
    name: "cancel",
    description: "Cancel a running pipeline",
    category: "pipeline",
    options: [
      {
        name: "execution",
        description: "Execution ID",
        type: "string",
        required: true,
      },
    ],
  },
  {
    name: "budget",
    description: "Get budget status",
    category: "budget",
    options: [
      {
        name: "period",
        description: "Time period",
        type: "string",
        required: false,
        choices: [
          { name: "Today", value: "day" },
          { name: "This Week", value: "week" },
          { name: "This Month", value: "month" },
        ],
      },
    ],
  },
  {
    name: "analytics",
    description: "Get analytics summary",
    category: "analytics",
    options: [
      {
        name: "period",
        description: "Time period",
        type: "string",
        required: false,
        choices: [
          { name: "Today", value: "day" },
          { name: "This Week", value: "week" },
          { name: "This Month", value: "month" },
        ],
      },
    ],
  },
  {
    name: "schedules",
    description: "List scheduled pipelines",
    category: "schedule",
  },
  {
    name: "subscribe",
    description: "Subscribe channel to notifications",
    category: "system",
    options: [
      {
        name: "category",
        description: "Notification category",
        type: "string",
        required: true,
        choices: [
          { name: "Pipeline", value: "pipeline" },
          { name: "Budget", value: "budget" },
          { name: "Schedule", value: "schedule" },
          { name: "System", value: "system" },
          { name: "All", value: "all" },
        ],
      },
      {
        name: "severity",
        description: "Minimum severity",
        type: "string",
        required: false,
        choices: [
          { name: "Info", value: "info" },
          { name: "Warning", value: "warning" },
          { name: "Error", value: "error" },
          { name: "Critical", value: "critical" },
        ],
      },
    ],
  },
  {
    name: "unsubscribe",
    description: "Unsubscribe channel from notifications",
    category: "system",
    options: [
      {
        name: "category",
        description: "Notification category",
        type: "string",
        required: true,
        choices: [
          { name: "Pipeline", value: "pipeline" },
          { name: "Budget", value: "budget" },
          { name: "Schedule", value: "schedule" },
          { name: "System", value: "system" },
          { name: "All", value: "all" },
        ],
      },
    ],
  },
  {
    name: "help",
    description: "Show available commands",
    category: "system",
  },
];

// =============================================================================
// SEVERITY COLORS
// =============================================================================

export const SEVERITY_COLORS = {
  info: "#2196F3",
  success: "#4CAF50",
  warning: "#FF9800",
  error: "#F44336",
  critical: "#9C27B0",
} as const;

// =============================================================================
// CATEGORY EMOJIS
// =============================================================================

export const CATEGORY_EMOJIS = {
  pipeline: ":gear:",
  budget: ":moneybag:",
  schedule: ":calendar:",
  system: ":robot_face:",
  content: ":memo:",
  trading: ":chart_with_upwards_trend:",
  security: ":shield:",
} as const;
