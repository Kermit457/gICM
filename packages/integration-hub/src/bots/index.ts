/**
 * Bot Module
 *
 * Slack and Discord bot integration
 */

// Types
export {
  // Platform
  BotPlatformSchema,
  type BotPlatform,

  // Config
  SlackConfigSchema,
  DiscordConfigSchema,
  BotConfigSchema,
  type SlackConfig,
  type DiscordConfig,
  type BotConfig,

  // Notification
  NotificationSeveritySchema,
  NotificationCategorySchema,
  NotificationSchema,
  type NotificationSeverity,
  type NotificationCategory,
  type Notification,

  // Commands
  BotCommandSchema,
  CommandContextSchema,
  CommandResponseSchema,
  type BotCommand,
  type CommandContext,
  type CommandResponse,

  // Subscriptions
  ChannelSubscriptionSchema,
  type ChannelSubscription,

  // Interactions
  InteractionTypeSchema,
  InteractionPayloadSchema,
  type InteractionType,
  type InteractionPayload,

  // Templates
  MessageTemplateSchema,
  type MessageTemplate,

  // Status
  BotStatusSchema,
  type BotStatus,

  // Manager Config
  BotManagerConfigSchema,
  type BotManagerConfig,

  // Events
  type BotEvents,

  // Constants
  BUILT_IN_COMMANDS,
  SEVERITY_COLORS,
  CATEGORY_EMOJIS,
} from "./types.js";

// Slack Bot
export {
  SlackBot,
  getSlackBot,
  createSlackBot,
} from "./slack-bot.js";

// Discord Bot
export {
  DiscordBot,
  getDiscordBot,
  createDiscordBot,
} from "./discord-bot.js";

// Bot Manager
export {
  BotManager,
  getBotManager,
  createBotManager,
} from "./bot-manager.js";
