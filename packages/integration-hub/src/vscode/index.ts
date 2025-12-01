/**
 * VS Code Extension Module
 * Phase 11D: IDE Integration
 */

// Types & Schemas
export {
  // Extension State
  ExtensionStateSchema,
  type ExtensionState,

  // Configuration
  ExtensionConfigSchema,
  type ExtensionConfig,

  // Tree View
  TreeItemTypeSchema,
  type TreeItemType,
  TreeItemStateSchema,
  type TreeItemState,
  TreeItemSchema,
  type TreeItem,

  // Editor
  EditorTypeSchema,
  type EditorType,
  EditorStateSchema,
  type EditorState,

  // Diagnostics
  DiagnosticSeveritySchema,
  type DiagnosticSeverity,
  DiagnosticSchema,
  type Diagnostic,

  // Commands
  CommandSchema,
  type Command,

  // Status Bar
  StatusBarItemSchema,
  type StatusBarItem,

  // Quick Pick
  QuickPickItemSchema,
  type QuickPickItem,

  // Notifications
  NotificationTypeSchema,
  type VSCodeNotificationType,
  NotificationActionSchema,
  type NotificationAction,
  VSCodeNotificationSchema,
  type VSCodeNotification,

  // Webview
  WebviewTypeSchema,
  type WebviewType,
  WebviewMessageSchema,
  type WebviewMessage,
  WebviewStateSchema,
  type WebviewState,

  // Completion
  CompletionItemKindSchema,
  type CompletionItemKind,
  CompletionItemSchema,
  type CompletionItem,

  // Hover
  HoverContentSchema,
  type HoverContent,

  // Code Actions
  CodeActionKindSchema,
  type CodeActionKind,
  CodeActionSchema,
  type CodeAction,

  // Config
  VSCodeManagerConfigSchema,
  type VSCodeManagerConfig,

  // Events
  type VSCodeEvents,

  // Constants
  DEFAULT_COMMANDS,
  PIPELINE_SNIPPETS,
} from "./types.js";

// VS Code Manager
export {
  VSCodeManager,
  getVSCodeManager,
  createVSCodeManager,
} from "./vscode-manager.js";
