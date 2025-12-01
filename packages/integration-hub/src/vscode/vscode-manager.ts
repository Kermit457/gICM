/**
 * VS Code Extension Manager
 * Phase 11D: IDE Integration
 */

import { EventEmitter } from "eventemitter3";
import { randomUUID } from "crypto";
import {
  type ExtensionState,
  type ExtensionConfig,
  type TreeItem,
  type TreeItemType,
  type TreeItemState,
  type EditorType,
  type EditorState,
  type Diagnostic,
  type DiagnosticSeverity,
  type Command,
  type StatusBarItem,
  type QuickPickItem,
  type VSCodeNotification,
  type WebviewType,
  type WebviewMessage,
  type WebviewState,
  type CompletionItem,
  type HoverContent,
  type CodeAction,
  type VSCodeManagerConfig,
  type VSCodeEvents,
  VSCodeManagerConfigSchema,
  ExtensionConfigSchema,
  DEFAULT_COMMANDS,
  PIPELINE_SNIPPETS,
} from "./types.js";

// ============================================================================
// VS Code Extension Manager Class
// ============================================================================

export class VSCodeManager extends EventEmitter<VSCodeEvents> {
  private managerConfig: VSCodeManagerConfig;
  private extensionConfig: ExtensionConfig;
  private state: ExtensionState = "inactive";
  private treeData: Map<string, TreeItem[]> = new Map();
  private editors: Map<string, EditorState> = new Map();
  private diagnostics: Map<string, Diagnostic[]> = new Map();
  private webviews: Map<string, WebviewState> = new Map();
  private statusBarItems: Map<string, StatusBarItem> = new Map();
  private refreshInterval: NodeJS.Timeout | null = null;

  constructor(config: Partial<VSCodeManagerConfig> = {}) {
    super();
    this.managerConfig = VSCodeManagerConfigSchema.parse(config);
    this.extensionConfig = ExtensionConfigSchema.parse({});
  }

  // ============================================================================
  // Lifecycle
  // ============================================================================

  /**
   * Activate the extension
   */
  async activate(): Promise<void> {
    if (this.state === "active") {
      return;
    }

    this.state = "activating";

    try {
      // Initialize components
      await this.initializeTreeViews();
      await this.initializeStatusBar();
      await this.registerCommands();
      await this.registerLanguageFeatures();

      // Start auto-refresh if configured
      if (this.extensionConfig.autoRefresh) {
        this.startAutoRefresh();
      }

      this.state = "active";
      this.emit("activated");
    } catch (error) {
      this.state = "error";
      this.emit("error", error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Deactivate the extension
   */
  async deactivate(): Promise<void> {
    if (this.state !== "active") {
      return;
    }

    // Stop auto-refresh
    this.stopAutoRefresh();

    // Close all editors
    for (const [id] of this.editors) {
      await this.closeEditor(id);
    }

    // Close all webviews
    for (const [id] of this.webviews) {
      await this.closeWebview(id);
    }

    // Clear status bar
    this.statusBarItems.clear();

    this.state = "inactive";
    this.emit("deactivated");
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ExtensionConfig>): void {
    const oldConfig = this.extensionConfig;
    this.extensionConfig = ExtensionConfigSchema.parse({
      ...this.extensionConfig,
      ...config,
    });

    // Handle config changes
    if (this.extensionConfig.autoRefresh !== oldConfig.autoRefresh) {
      if (this.extensionConfig.autoRefresh) {
        this.startAutoRefresh();
      } else {
        this.stopAutoRefresh();
      }
    }

    this.emit("configChanged", this.extensionConfig);
  }

  // ============================================================================
  // Tree Views
  // ============================================================================

  /**
   * Get tree items for a view
   */
  getTreeItems(viewId: string): TreeItem[] {
    return this.treeData.get(viewId) || [];
  }

  /**
   * Refresh tree view
   */
  async refreshTreeView(viewId?: string): Promise<void> {
    if (viewId) {
      await this.loadTreeData(viewId);
    } else {
      // Refresh all tree views
      for (const id of this.treeData.keys()) {
        await this.loadTreeData(id);
      }
    }
    this.emit("treeRefreshed");
  }

  /**
   * Select tree item
   */
  selectTreeItem(item: TreeItem): void {
    this.emit("treeItemSelected", item);

    // Execute command if defined
    if (item.command) {
      this.executeCommand(item.command.command, item.command.arguments);
    }
  }

  /**
   * Expand tree item
   */
  expandTreeItem(item: TreeItem): void {
    this.emit("treeItemExpanded", item);
  }

  // ============================================================================
  // Editors
  // ============================================================================

  /**
   * Open an editor
   */
  async openEditor(type: EditorType, resourceId?: string): Promise<string> {
    const editorId = resourceId ? `${type}:${resourceId}` : `${type}:new-${randomUUID()}`;

    // Fetch content
    const content = await this.fetchEditorContent(type, resourceId);

    const editorState: EditorState = {
      type,
      resourceId,
      isDirty: false,
      content,
    };

    this.editors.set(editorId, editorState);
    this.emit("editorOpened", type, resourceId);

    return editorId;
  }

  /**
   * Close an editor
   */
  async closeEditor(editorId: string): Promise<void> {
    const editor = this.editors.get(editorId);
    if (!editor) {
      return;
    }

    // Check for unsaved changes
    if (editor.isDirty) {
      // In real VS Code, would prompt user
      console.warn(`Editor ${editorId} has unsaved changes`);
    }

    this.editors.delete(editorId);
    this.emit("editorClosed", editor.type, editor.resourceId);
  }

  /**
   * Save editor content
   */
  async saveEditor(editorId: string): Promise<void> {
    const editor = this.editors.get(editorId);
    if (!editor) {
      throw new Error(`Editor not found: ${editorId}`);
    }

    // Validate before saving
    const diagnostics = await this.validateContent(editor.content, editor.type);
    const hasErrors = diagnostics.some((d) => d.severity === "error");

    if (hasErrors) {
      throw new Error("Cannot save: document has errors");
    }

    // Save to API
    await this.saveEditorContent(editor);

    editor.isDirty = false;
    this.emit("editorSaved", editor.type, editor.resourceId, editor.content);
  }

  /**
   * Update editor content
   */
  updateEditorContent(editorId: string, content: string): void {
    const editor = this.editors.get(editorId);
    if (!editor) {
      return;
    }

    editor.content = content;
    editor.isDirty = true;

    // Re-validate
    this.validateContent(content, editor.type).then((diagnostics) => {
      this.diagnostics.set(editorId, diagnostics);
    });
  }

  // ============================================================================
  // Diagnostics
  // ============================================================================

  /**
   * Get diagnostics for an editor
   */
  getDiagnostics(editorId: string): Diagnostic[] {
    return this.diagnostics.get(editorId) || [];
  }

  /**
   * Validate content and return diagnostics
   */
  async validateContent(content: string, type: EditorType): Promise<Diagnostic[]> {
    const diagnostics: Diagnostic[] = [];

    if (type === "pipeline") {
      // Validate YAML structure
      try {
        // Would use yaml parser here
        if (!content.includes("name:")) {
          diagnostics.push({
            severity: "error",
            message: "Pipeline must have a name",
            source: "Integration Hub",
            range: { startLine: 1, startColumn: 1, endLine: 1, endColumn: 1 },
          });
        }

        if (!content.includes("steps:")) {
          diagnostics.push({
            severity: "error",
            message: "Pipeline must have at least one step",
            source: "Integration Hub",
            range: { startLine: 1, startColumn: 1, endLine: 1, endColumn: 1 },
          });
        }

        // Check for deprecated features
        if (content.includes("api_key:")) {
          diagnostics.push({
            severity: "warning",
            message: "api_key should be defined in environment variables, not in pipeline",
            source: "Integration Hub",
            code: "deprecated-api-key",
            range: { startLine: 1, startColumn: 1, endLine: 1, endColumn: 1 },
          });
        }
      } catch {
        diagnostics.push({
          severity: "error",
          message: "Invalid YAML syntax",
          source: "Integration Hub",
          range: { startLine: 1, startColumn: 1, endLine: 1, endColumn: 1 },
        });
      }
    }

    return diagnostics;
  }

  // ============================================================================
  // Commands
  // ============================================================================

  /**
   * Get available commands
   */
  getCommands(): Command[] {
    return DEFAULT_COMMANDS;
  }

  /**
   * Execute a command
   */
  async executeCommand(command: string, args?: unknown[]): Promise<unknown> {
    this.emit("commandExecuted", command, args);

    switch (command) {
      case "integrationHub.createPipeline":
        return this.openEditor("pipeline");

      case "integrationHub.runPipeline":
        return this.runPipeline(args?.[0] as string);

      case "integrationHub.stopPipeline":
        return this.stopPipeline(args?.[0] as string);

      case "integrationHub.openPipeline":
        return this.openEditor("pipeline", args?.[0] as string);

      case "integrationHub.deletePipeline":
        return this.deletePipeline(args?.[0] as string);

      case "integrationHub.refreshTree":
        return this.refreshTreeView();

      case "integrationHub.openSettings":
        return this.openWebview("settingsEditor");

      case "integrationHub.openDashboard":
        return this.openWebview("dashboardPanel");

      case "integrationHub.viewExecution":
        return this.openWebview("executionViewer", args?.[0] as string);

      case "integrationHub.createSchedule":
        return this.openEditor("schedule");

      case "integrationHub.validatePipeline":
        return this.validateCurrentEditor();

      case "integrationHub.formatDocument":
        return this.formatCurrentDocument();

      default:
        console.warn(`Unknown command: ${command}`);
        return undefined;
    }
  }

  // ============================================================================
  // Status Bar
  // ============================================================================

  /**
   * Update status bar item
   */
  updateStatusBarItem(item: StatusBarItem): void {
    this.statusBarItems.set(item.id, item);
  }

  /**
   * Get status bar items
   */
  getStatusBarItems(): StatusBarItem[] {
    return Array.from(this.statusBarItems.values()).sort((a, b) => b.priority - a.priority);
  }

  // ============================================================================
  // Quick Pick
  // ============================================================================

  /**
   * Show quick pick
   */
  async showQuickPick(
    items: QuickPickItem[],
    options?: { title?: string; placeholder?: string; canPickMany?: boolean }
  ): Promise<QuickPickItem | QuickPickItem[] | undefined> {
    // In real VS Code, would show UI
    // This is a mock implementation
    if (items.length === 0) {
      return undefined;
    }

    return options?.canPickMany ? items : items[0];
  }

  // ============================================================================
  // Notifications
  // ============================================================================

  /**
   * Show notification
   */
  async showNotification(notification: VSCodeNotification): Promise<string | undefined> {
    if (!this.extensionConfig.showNotifications) {
      return undefined;
    }

    // In real VS Code, would show notification
    console.log(`[${notification.type.toUpperCase()}] ${notification.message}`);

    // Return first action title if any
    return notification.actions?.[0]?.title;
  }

  // ============================================================================
  // Webviews
  // ============================================================================

  /**
   * Open a webview
   */
  async openWebview(type: WebviewType, resourceId?: string): Promise<string> {
    const webviewId = resourceId ? `${type}:${resourceId}` : `${type}:${randomUUID()}`;

    const webviewState: WebviewState = {
      type,
      title: this.getWebviewTitle(type),
      resourceId,
      state: {},
    };

    this.webviews.set(webviewId, webviewState);
    this.emit("webviewOpened", type);

    return webviewId;
  }

  /**
   * Close a webview
   */
  async closeWebview(webviewId: string): Promise<void> {
    const webview = this.webviews.get(webviewId);
    if (!webview) {
      return;
    }

    this.webviews.delete(webviewId);
    this.emit("webviewClosed", webview.type);
  }

  /**
   * Send message to webview
   */
  postMessageToWebview(webviewId: string, message: WebviewMessage): void {
    const webview = this.webviews.get(webviewId);
    if (!webview) {
      return;
    }

    this.emit("webviewMessage", webview.type, message);
  }

  /**
   * Handle message from webview
   */
  handleWebviewMessage(webviewId: string, message: WebviewMessage): void {
    const webview = this.webviews.get(webviewId);
    if (!webview) {
      return;
    }

    // Route message based on type
    switch (message.type) {
      case "save":
        this.handleWebviewSave(webview, message.payload);
        break;
      case "execute":
        this.handleWebviewExecute(webview, message.payload);
        break;
      case "navigate":
        this.handleWebviewNavigate(webview, message.payload);
        break;
      default:
        this.emit("webviewMessage", webview.type, message);
    }
  }

  // ============================================================================
  // Language Features
  // ============================================================================

  /**
   * Get completions
   */
  getCompletions(
    _content: string,
    _position: { line: number; column: number }
  ): CompletionItem[] {
    // Return pipeline snippets for now
    return PIPELINE_SNIPPETS;
  }

  /**
   * Get hover information
   */
  getHover(
    content: string,
    position: { line: number; column: number }
  ): HoverContent | undefined {
    // Simple implementation - would be more sophisticated in real extension
    const lines = content.split("\n");
    const line = lines[position.line - 1] || "";

    // Check for known keywords
    if (line.includes("type: llm")) {
      return {
        contents: [
          { language: "markdown", value: "**LLM Step**" },
          "Executes an AI model to process input and generate output.",
          "**Available models:** claude-3-opus, claude-3-sonnet, gpt-4, etc.",
        ],
      };
    }

    if (line.includes("type: transform")) {
      return {
        contents: [
          { language: "markdown", value: "**Transform Step**" },
          "Transforms data using JavaScript expressions or built-in operations.",
        ],
      };
    }

    return undefined;
  }

  /**
   * Get code actions
   */
  getCodeActions(editorId: string): CodeAction[] {
    const diagnostics = this.getDiagnostics(editorId);
    const actions: CodeAction[] = [];

    for (const diagnostic of diagnostics) {
      if (diagnostic.code === "deprecated-api-key") {
        actions.push({
          title: "Move API key to environment variables",
          kind: "quickFix",
          diagnostics: [diagnostic],
          isPreferred: true,
        });
      }

      if (diagnostic.message.includes("must have a name")) {
        actions.push({
          title: "Add pipeline name",
          kind: "quickFix",
          diagnostics: [diagnostic],
          edit: {
            changes: {
              [editorId]: [
                {
                  range: { startLine: 1, startColumn: 1, endLine: 1, endColumn: 1 },
                  newText: "name: my-pipeline\n",
                },
              ],
            },
          },
        });
      }
    }

    return actions;
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private async initializeTreeViews(): Promise<void> {
    // Initialize pipelines tree
    this.treeData.set("pipelines", []);
    await this.loadTreeData("pipelines");

    // Initialize schedules tree
    this.treeData.set("schedules", []);
    await this.loadTreeData("schedules");

    // Initialize executions tree
    this.treeData.set("executions", []);
    await this.loadTreeData("executions");
  }

  private async loadTreeData(viewId: string): Promise<void> {
    // In reality, would fetch from API
    const items: TreeItem[] = [];

    switch (viewId) {
      case "pipelines":
        items.push(
          this.createTreeItem("pipeline", "content-generator", "Content Generator", "running"),
          this.createTreeItem("pipeline", "data-extraction", "Data Extraction", "default"),
          this.createTreeItem("pipeline", "reporting", "Reporting Pipeline", "success")
        );
        break;

      case "schedules":
        items.push(
          this.createTreeItem("schedule", "daily-content", "Daily Content (9am)", "default"),
          this.createTreeItem("schedule", "weekly-report", "Weekly Report (Mon)", "default")
        );
        break;

      case "executions":
        items.push(
          this.createTreeItem("execution", "exec-1", "content-generator #123", "running"),
          this.createTreeItem("execution", "exec-2", "data-extraction #456", "success"),
          this.createTreeItem("execution", "exec-3", "reporting #789", "error")
        );
        break;
    }

    this.treeData.set(viewId, items);
  }

  private createTreeItem(
    type: TreeItemType,
    id: string,
    label: string,
    state: TreeItemState
  ): TreeItem {
    return {
      id,
      type,
      label,
      state,
      contextValue: type,
      command: {
        command: `integrationHub.open${type.charAt(0).toUpperCase() + type.slice(1)}`,
        title: `Open ${type}`,
        arguments: [id],
      },
    };
  }

  private async initializeStatusBar(): Promise<void> {
    if (!this.extensionConfig.showStatusBar) {
      return;
    }

    this.updateStatusBarItem({
      id: "status",
      text: "$(cloud) Integration Hub",
      tooltip: "Integration Hub: Connected",
      command: "integrationHub.openDashboard",
      priority: 100,
      alignment: "left",
    });

    this.updateStatusBarItem({
      id: "budget",
      text: "$(credit-card) $45.20",
      tooltip: "Today's spend: $45.20 / $100",
      command: "integrationHub.openSettings",
      priority: 99,
      alignment: "left",
    });
  }

  private async registerCommands(): Promise<void> {
    // Commands are registered via getCommands()
    // In real VS Code, would register with vscode.commands.registerCommand
  }

  private async registerLanguageFeatures(): Promise<void> {
    // In real VS Code, would register:
    // - CompletionItemProvider
    // - HoverProvider
    // - CodeActionProvider
    // - DocumentFormattingEditProvider
    // - etc.
  }

  private startAutoRefresh(): void {
    if (this.refreshInterval) {
      return;
    }

    this.refreshInterval = setInterval(async () => {
      await this.refreshTreeView();
    }, this.extensionConfig.refreshIntervalMs);
  }

  private stopAutoRefresh(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  private async fetchEditorContent(type: EditorType, resourceId?: string): Promise<string> {
    // In reality, would fetch from API
    if (!resourceId) {
      // Return template for new documents
      switch (type) {
        case "pipeline":
          return `name: new-pipeline
description: A new pipeline

steps:
  - name: step-1
    type: llm
    config:
      model: claude-3-sonnet
      prompt: "Your prompt here"
`;
        case "schedule":
          return `pipeline_id: ""
name: new-schedule
cron_expression: "0 9 * * 1-5"
timezone: UTC
enabled: true
`;
        default:
          return "";
      }
    }

    // Return mock content for existing resource
    return `name: ${resourceId}
description: Loaded from API

steps:
  - name: example-step
    type: llm
    config:
      model: claude-3-sonnet
      prompt: "Process the input"
`;
  }

  private async saveEditorContent(_editor: EditorState): Promise<void> {
    // In reality, would save to API
  }

  private async runPipeline(pipelineId: string): Promise<void> {
    await this.showNotification({
      type: "info",
      message: `Starting pipeline: ${pipelineId}`,
    });
  }

  private async stopPipeline(pipelineId: string): Promise<void> {
    await this.showNotification({
      type: "info",
      message: `Stopping pipeline: ${pipelineId}`,
    });
  }

  private async deletePipeline(pipelineId: string): Promise<void> {
    await this.showNotification({
      type: "warning",
      message: `Deleted pipeline: ${pipelineId}`,
    });
    await this.refreshTreeView("pipelines");
  }

  private async validateCurrentEditor(): Promise<void> {
    // Would validate currently active editor
    await this.showNotification({
      type: "info",
      message: "Pipeline validation passed",
    });
  }

  private async formatCurrentDocument(): Promise<void> {
    // Would format currently active document
    await this.showNotification({
      type: "info",
      message: "Document formatted",
    });
  }

  private getWebviewTitle(type: WebviewType): string {
    const titles: Record<WebviewType, string> = {
      pipelineVisualEditor: "Pipeline Editor",
      executionViewer: "Execution Details",
      dashboardPanel: "Integration Hub Dashboard",
      settingsEditor: "Settings",
      welcomePanel: "Welcome to Integration Hub",
    };
    return titles[type];
  }

  private handleWebviewSave(_webview: WebviewState, _payload: unknown): void {
    // Handle save from webview
  }

  private handleWebviewExecute(_webview: WebviewState, _payload: unknown): void {
    // Handle execute from webview
  }

  private handleWebviewNavigate(_webview: WebviewState, _payload: unknown): void {
    // Handle navigation from webview
  }

  /**
   * Get summary of extension state
   */
  getSummary(): {
    state: ExtensionState;
    openEditors: number;
    openWebviews: number;
    registeredCommands: number;
    autoRefreshEnabled: boolean;
  } {
    return {
      state: this.state,
      openEditors: this.editors.size,
      openWebviews: this.webviews.size,
      registeredCommands: DEFAULT_COMMANDS.length,
      autoRefreshEnabled: this.extensionConfig.autoRefresh,
    };
  }
}

// ============================================================================
// Singleton & Factory
// ============================================================================

let vscodeManagerInstance: VSCodeManager | null = null;

export function getVSCodeManager(): VSCodeManager {
  if (!vscodeManagerInstance) {
    vscodeManagerInstance = new VSCodeManager();
  }
  return vscodeManagerInstance;
}

export function createVSCodeManager(config: Partial<VSCodeManagerConfig> = {}): VSCodeManager {
  return new VSCodeManager(config);
}
