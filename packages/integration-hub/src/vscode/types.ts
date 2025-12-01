/**
 * VS Code Extension Types
 * Phase 11D: IDE Integration
 */

import { z } from "zod";

// ============================================================================
// Extension State
// ============================================================================

export const ExtensionStateSchema = z.enum([
  "inactive",
  "activating",
  "active",
  "error",
]);
export type ExtensionState = z.infer<typeof ExtensionStateSchema>;

// ============================================================================
// Configuration
// ============================================================================

export const ExtensionConfigSchema = z.object({
  apiKey: z.string().optional(),
  baseUrl: z.string().url().default("https://api.integrationhub.io"),
  organizationId: z.string().optional(),
  autoRefresh: z.boolean().default(true),
  refreshIntervalMs: z.number().default(30000),
  showNotifications: z.boolean().default(true),
  showStatusBar: z.boolean().default(true),
  defaultEditor: z.enum(["yaml", "visual"]).default("visual"),
  telemetry: z.boolean().default(true),
});
export type ExtensionConfig = z.infer<typeof ExtensionConfigSchema>;

// ============================================================================
// Tree View Items
// ============================================================================

export const TreeItemTypeSchema = z.enum([
  "pipeline",
  "schedule",
  "execution",
  "step",
  "budget",
  "webhook",
  "notification",
  "folder",
]);
export type TreeItemType = z.infer<typeof TreeItemTypeSchema>;

export const TreeItemStateSchema = z.enum([
  "default",
  "running",
  "success",
  "error",
  "warning",
  "disabled",
]);
export type TreeItemState = z.infer<typeof TreeItemStateSchema>;

export const TreeItemSchema = z.object({
  id: z.string(),
  type: TreeItemTypeSchema,
  label: z.string(),
  description: z.string().optional(),
  tooltip: z.string().optional(),
  state: TreeItemStateSchema.default("default"),
  icon: z.string().optional(),
  contextValue: z.string().optional(),
  children: z.array(z.lazy(() => TreeItemSchema)).optional(),
  command: z.object({
    command: z.string(),
    title: z.string(),
    arguments: z.array(z.unknown()).optional(),
  }).optional(),
});
export type TreeItem = z.infer<typeof TreeItemSchema>;

// ============================================================================
// Editor
// ============================================================================

export const EditorTypeSchema = z.enum([
  "pipeline",
  "schedule",
  "config",
  "execution",
]);
export type EditorType = z.infer<typeof EditorTypeSchema>;

export const EditorStateSchema = z.object({
  type: EditorTypeSchema,
  resourceId: z.string().optional(),
  isDirty: z.boolean().default(false),
  content: z.string(),
  cursor: z.object({
    line: z.number(),
    column: z.number(),
  }).optional(),
  selection: z.object({
    start: z.object({ line: z.number(), column: z.number() }),
    end: z.object({ line: z.number(), column: z.number() }),
  }).optional(),
});
export type EditorState = z.infer<typeof EditorStateSchema>;

// ============================================================================
// Diagnostics
// ============================================================================

export const DiagnosticSeveritySchema = z.enum([
  "error",
  "warning",
  "info",
  "hint",
]);
export type DiagnosticSeverity = z.infer<typeof DiagnosticSeveritySchema>;

export const DiagnosticSchema = z.object({
  severity: DiagnosticSeveritySchema,
  message: z.string(),
  source: z.string().default("Integration Hub"),
  code: z.string().optional(),
  range: z.object({
    startLine: z.number(),
    startColumn: z.number(),
    endLine: z.number(),
    endColumn: z.number(),
  }),
  relatedInformation: z.array(z.object({
    location: z.object({
      uri: z.string(),
      range: z.object({
        startLine: z.number(),
        startColumn: z.number(),
        endLine: z.number(),
        endColumn: z.number(),
      }),
    }),
    message: z.string(),
  })).optional(),
});
export type Diagnostic = z.infer<typeof DiagnosticSchema>;

// ============================================================================
// Commands
// ============================================================================

export const CommandSchema = z.object({
  command: z.string(),
  title: z.string(),
  category: z.string().default("Integration Hub"),
  icon: z.string().optional(),
  enablement: z.string().optional(),
  keybinding: z.object({
    key: z.string(),
    mac: z.string().optional(),
    when: z.string().optional(),
  }).optional(),
});
export type Command = z.infer<typeof CommandSchema>;

// ============================================================================
// Status Bar
// ============================================================================

export const StatusBarItemSchema = z.object({
  id: z.string(),
  text: z.string(),
  tooltip: z.string().optional(),
  command: z.string().optional(),
  color: z.string().optional(),
  backgroundColor: z.string().optional(),
  priority: z.number().default(0),
  alignment: z.enum(["left", "right"]).default("left"),
});
export type StatusBarItem = z.infer<typeof StatusBarItemSchema>;

// ============================================================================
// Quick Pick
// ============================================================================

export const QuickPickItemSchema = z.object({
  label: z.string(),
  description: z.string().optional(),
  detail: z.string().optional(),
  picked: z.boolean().optional(),
  alwaysShow: z.boolean().optional(),
  iconPath: z.string().optional(),
  buttons: z.array(z.object({
    iconPath: z.string(),
    tooltip: z.string(),
  })).optional(),
});
export type QuickPickItem = z.infer<typeof QuickPickItemSchema>;

// ============================================================================
// Notifications
// ============================================================================

export const NotificationTypeSchema = z.enum([
  "info",
  "warning",
  "error",
]);
export type VSCodeNotificationType = z.infer<typeof NotificationTypeSchema>;

export const NotificationActionSchema = z.object({
  title: z.string(),
  isCloseAffordance: z.boolean().optional(),
  command: z.string().optional(),
});
export type NotificationAction = z.infer<typeof NotificationActionSchema>;

export const VSCodeNotificationSchema = z.object({
  type: NotificationTypeSchema,
  message: z.string(),
  actions: z.array(NotificationActionSchema).optional(),
  modal: z.boolean().optional(),
});
export type VSCodeNotification = z.infer<typeof VSCodeNotificationSchema>;

// ============================================================================
// Webview
// ============================================================================

export const WebviewTypeSchema = z.enum([
  "pipelineVisualEditor",
  "executionViewer",
  "dashboardPanel",
  "settingsEditor",
  "welcomePanel",
]);
export type WebviewType = z.infer<typeof WebviewTypeSchema>;

export const WebviewMessageSchema = z.object({
  type: z.string(),
  payload: z.unknown(),
});
export type WebviewMessage = z.infer<typeof WebviewMessageSchema>;

export const WebviewStateSchema = z.object({
  type: WebviewTypeSchema,
  title: z.string(),
  resourceId: z.string().optional(),
  state: z.record(z.unknown()),
});
export type WebviewState = z.infer<typeof WebviewStateSchema>;

// ============================================================================
// Completion
// ============================================================================

export const CompletionItemKindSchema = z.enum([
  "text",
  "method",
  "function",
  "constructor",
  "field",
  "variable",
  "class",
  "interface",
  "module",
  "property",
  "keyword",
  "snippet",
  "value",
  "constant",
  "enum",
  "folder",
  "file",
]);
export type CompletionItemKind = z.infer<typeof CompletionItemKindSchema>;

export const CompletionItemSchema = z.object({
  label: z.string(),
  kind: CompletionItemKindSchema,
  detail: z.string().optional(),
  documentation: z.string().optional(),
  insertText: z.string().optional(),
  insertTextRules: z.number().optional(),
  sortText: z.string().optional(),
  filterText: z.string().optional(),
  preselect: z.boolean().optional(),
  commitCharacters: z.array(z.string()).optional(),
  additionalTextEdits: z.array(z.object({
    range: z.object({
      startLine: z.number(),
      startColumn: z.number(),
      endLine: z.number(),
      endColumn: z.number(),
    }),
    newText: z.string(),
  })).optional(),
});
export type CompletionItem = z.infer<typeof CompletionItemSchema>;

// ============================================================================
// Hover
// ============================================================================

export const HoverContentSchema = z.object({
  contents: z.array(z.union([
    z.string(),
    z.object({
      language: z.string(),
      value: z.string(),
    }),
  ])),
  range: z.object({
    startLine: z.number(),
    startColumn: z.number(),
    endLine: z.number(),
    endColumn: z.number(),
  }).optional(),
});
export type HoverContent = z.infer<typeof HoverContentSchema>;

// ============================================================================
// Code Actions
// ============================================================================

export const CodeActionKindSchema = z.enum([
  "quickFix",
  "refactor",
  "refactor.extract",
  "refactor.inline",
  "refactor.rewrite",
  "source",
  "source.organizeImports",
  "source.fixAll",
]);
export type CodeActionKind = z.infer<typeof CodeActionKindSchema>;

export const CodeActionSchema = z.object({
  title: z.string(),
  kind: CodeActionKindSchema,
  diagnostics: z.array(DiagnosticSchema).optional(),
  isPreferred: z.boolean().optional(),
  disabled: z.object({ reason: z.string() }).optional(),
  edit: z.object({
    changes: z.record(z.array(z.object({
      range: z.object({
        startLine: z.number(),
        startColumn: z.number(),
        endLine: z.number(),
        endColumn: z.number(),
      }),
      newText: z.string(),
    }))),
  }).optional(),
  command: z.object({
    command: z.string(),
    title: z.string(),
    arguments: z.array(z.unknown()).optional(),
  }).optional(),
});
export type CodeAction = z.infer<typeof CodeActionSchema>;

// ============================================================================
// Extension Manager Config
// ============================================================================

export const VSCodeManagerConfigSchema = z.object({
  extensionId: z.string().default("gicm.integration-hub"),
  version: z.string().default("1.0.0"),
  displayName: z.string().default("Integration Hub"),
  description: z.string().default("AI-powered pipeline orchestration"),
  enableDebugLogging: z.boolean().default(false),
});
export type VSCodeManagerConfig = z.infer<typeof VSCodeManagerConfigSchema>;

// ============================================================================
// Events
// ============================================================================

export type VSCodeEvents = {
  // Lifecycle
  activated: () => void;
  deactivated: () => void;
  configChanged: (config: ExtensionConfig) => void;

  // Editor
  editorOpened: (type: EditorType, resourceId?: string) => void;
  editorClosed: (type: EditorType, resourceId?: string) => void;
  editorSaved: (type: EditorType, resourceId?: string, content: string) => void;

  // Tree View
  treeItemSelected: (item: TreeItem) => void;
  treeItemExpanded: (item: TreeItem) => void;
  treeRefreshed: () => void;

  // Commands
  commandExecuted: (command: string, args?: unknown[]) => void;

  // Webview
  webviewOpened: (type: WebviewType) => void;
  webviewClosed: (type: WebviewType) => void;
  webviewMessage: (type: WebviewType, message: WebviewMessage) => void;

  // Errors
  error: (error: Error) => void;
};

// ============================================================================
// Default Commands
// ============================================================================

export const DEFAULT_COMMANDS: Command[] = [
  {
    command: "integrationHub.createPipeline",
    title: "Create Pipeline",
    category: "Integration Hub",
    icon: "$(add)",
    keybinding: { key: "ctrl+shift+p", mac: "cmd+shift+p", when: "editorFocus" },
  },
  {
    command: "integrationHub.runPipeline",
    title: "Run Pipeline",
    category: "Integration Hub",
    icon: "$(play)",
    keybinding: { key: "ctrl+shift+r", mac: "cmd+shift+r" },
  },
  {
    command: "integrationHub.stopPipeline",
    title: "Stop Pipeline",
    category: "Integration Hub",
    icon: "$(debug-stop)",
  },
  {
    command: "integrationHub.openPipeline",
    title: "Open Pipeline",
    category: "Integration Hub",
    icon: "$(file-code)",
  },
  {
    command: "integrationHub.deletePipeline",
    title: "Delete Pipeline",
    category: "Integration Hub",
    icon: "$(trash)",
  },
  {
    command: "integrationHub.refreshTree",
    title: "Refresh",
    category: "Integration Hub",
    icon: "$(refresh)",
  },
  {
    command: "integrationHub.openSettings",
    title: "Open Settings",
    category: "Integration Hub",
    icon: "$(gear)",
  },
  {
    command: "integrationHub.openDashboard",
    title: "Open Dashboard",
    category: "Integration Hub",
    icon: "$(dashboard)",
  },
  {
    command: "integrationHub.viewExecution",
    title: "View Execution",
    category: "Integration Hub",
    icon: "$(list-tree)",
  },
  {
    command: "integrationHub.createSchedule",
    title: "Create Schedule",
    category: "Integration Hub",
    icon: "$(calendar)",
  },
  {
    command: "integrationHub.validatePipeline",
    title: "Validate Pipeline",
    category: "Integration Hub",
    icon: "$(check)",
  },
  {
    command: "integrationHub.formatDocument",
    title: "Format Pipeline Document",
    category: "Integration Hub",
    icon: "$(symbol-misc)",
  },
];

// ============================================================================
// Pipeline YAML Snippets
// ============================================================================

export const PIPELINE_SNIPPETS: CompletionItem[] = [
  {
    label: "pipeline",
    kind: "snippet",
    detail: "Create a new pipeline",
    documentation: "Creates a new pipeline configuration with basic structure",
    insertText: `name: \${1:my-pipeline}
description: \${2:Pipeline description}
version: 1

steps:
  - name: \${3:step-name}
    type: \${4|llm,transform,condition,parallel,loop|}
    config:
      \${5:# configuration}
`,
  },
  {
    label: "step-llm",
    kind: "snippet",
    detail: "Add an LLM step",
    documentation: "Creates an LLM step for AI processing",
    insertText: `- name: \${1:llm-step}
  type: llm
  config:
    model: \${2|claude-3-sonnet,claude-3-opus,claude-3-haiku,gpt-4,gpt-4-turbo|}
    prompt: |
      \${3:Your prompt here}
    temperature: \${4:0.7}
    max_tokens: \${5:1000}
`,
  },
  {
    label: "step-transform",
    kind: "snippet",
    detail: "Add a transform step",
    documentation: "Creates a data transformation step",
    insertText: `- name: \${1:transform-step}
  type: transform
  config:
    operation: \${2|map,filter,reduce,flatten,merge|}
    input: \${3:\\$\\{previous.output\\}}
    expression: |
      \${4:// transformation logic}
`,
  },
  {
    label: "step-condition",
    kind: "snippet",
    detail: "Add a conditional step",
    documentation: "Creates a conditional branching step",
    insertText: `- name: \${1:condition-step}
  type: condition
  config:
    condition: \${2:\\$\\{previous.output.score > 0.5\\}}
    then: \${3:step-if-true}
    else: \${4:step-if-false}
`,
  },
  {
    label: "step-parallel",
    kind: "snippet",
    detail: "Add parallel execution",
    documentation: "Creates parallel step execution",
    insertText: `- name: \${1:parallel-step}
  type: parallel
  config:
    branches:
      - \${2:branch-a}
      - \${3:branch-b}
    wait_all: true
`,
  },
  {
    label: "step-loop",
    kind: "snippet",
    detail: "Add a loop step",
    documentation: "Creates a loop/iteration step",
    insertText: `- name: \${1:loop-step}
  type: loop
  config:
    items: \${2:\\$\\{input.items\\}}
    step: \${3:process-item}
    max_iterations: \${4:100}
    parallel: \${5:false}
`,
  },
  {
    label: "schedule",
    kind: "snippet",
    detail: "Add a schedule",
    documentation: "Creates a schedule configuration",
    insertText: `schedule:
  cron: "\${1:0 9 * * 1-5}"
  timezone: \${2:UTC}
  enabled: true
`,
  },
  {
    label: "budget",
    kind: "snippet",
    detail: "Add budget limits",
    documentation: "Creates budget configuration",
    insertText: `budget:
  daily_limit: \${1:100}
  monthly_limit: \${2:2000}
  alert_thresholds:
    - 50
    - 75
    - 90
`,
  },
];
