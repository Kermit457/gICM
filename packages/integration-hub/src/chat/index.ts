/**
 * Chat Integration Module
 * Phase 11B: Slack/Discord Bot
 */

// Types & Schemas
export {
  // Platform
  ChatPlatformSchema,
  type ChatPlatform,
  ConnectionStatusSchema,
  type ConnectionStatus,

  // Credentials
  SlackCredentialsSchema,
  type SlackCredentials,
  DiscordCredentialsSchema,
  type DiscordCredentials,
  TelegramCredentialsSchema,
  type TelegramCredentials,
  TeamsCredentialsSchema,
  type TeamsCredentials,
  ChatCredentialsSchema,
  type ChatCredentials,

  // Channel & User
  ChatChannelSchema,
  type ChatChannel,
  ChatUserSchema,
  type ChatUser,

  // Messages
  MessageAttachmentSchema,
  type MessageAttachment,
  MessageBlockSchema,
  type MessageBlock,
  ChatMessageSchema,
  type ChatMessage,
  SendMessageOptionsSchema,
  type SendMessageOptions,

  // Commands & Interactions
  SlashCommandSchema,
  type SlashCommand,
  CommandInvocationSchema,
  type CommandInvocation,
  ButtonInteractionSchema,
  type ButtonInteraction,

  // Notifications
  NotificationTypeSchema,
  type NotificationType,
  NotificationTemplateSchema,
  type NotificationTemplate,
  NotificationConfigSchema,
  type NotificationConfig,

  // Bot Configuration
  BotConfigSchema,
  type BotConfig,
  ChatManagerConfigSchema,
  type ChatManagerConfig,

  // Events
  type ChatEvents,

  // Constants
  DEFAULT_NOTIFICATION_TEMPLATES,
} from "./types.js";

// Chat Manager
export {
  ChatManager,
  getChatManager,
  createChatManager,
} from "./chat-manager.js";
