/**
 * Plugin Manager Implementation
 * Phase 9D: Enterprise Plugin Architecture
 */

import { EventEmitter } from "eventemitter3";
import {
  PluginDefinition,
  PluginEvents,
  PluginManagerConfig,
  InstalledPlugin,
  PluginStatus,
  PluginHookType,
  PluginHook,
  PluginTool,
  PluginRoute,
  HookContext,
  ToolExecutionContext,
  PluginCapability,
} from "./types.js";

// ============================================================================
// PLUGIN MANAGER
// ============================================================================

export class PluginManager extends EventEmitter<PluginEvents> {
  private config: PluginManagerConfig;
  private definitions: Map<string, PluginDefinition> = new Map();
  private installed: Map<string, InstalledPlugin> = new Map();
  private hooks: Map<PluginHookType, Array<{ pluginId: string; hook: PluginHook }>> = new Map();
  private tools: Map<string, { pluginId: string; tool: PluginTool }> = new Map();
  private routes: Map<string, { pluginId: string; route: PluginRoute }> = new Map();

  constructor(config: Partial<PluginManagerConfig> = {}) {
    super();

    this.config = {
      pluginsDir: config.pluginsDir || "./plugins",
      autoEnable: config.autoEnable ?? false,
      sandboxed: config.sandboxed ?? true,
      maxPlugins: config.maxPlugins || 50,
      timeout: config.timeout || 30000,
    };
  }

  // ==========================================================================
  // REGISTRATION
  // ==========================================================================

  /**
   * Register a plugin definition
   */
  register(definition: PluginDefinition): void {
    const { id } = definition.metadata;

    if (this.definitions.has(id)) {
      throw new Error(`Plugin ${id} is already registered`);
    }

    // Validate definition
    this.validateDefinition(definition);

    this.definitions.set(id, definition);
    this.emit("plugin:registered", id);
  }

  /**
   * Unregister a plugin definition
   */
  unregister(pluginId: string): void {
    if (!this.definitions.has(pluginId)) {
      throw new Error(`Plugin ${pluginId} is not registered`);
    }

    // Ensure plugin is uninstalled first
    if (this.installed.has(pluginId)) {
      throw new Error(`Plugin ${pluginId} must be uninstalled before unregistering`);
    }

    this.definitions.delete(pluginId);
  }

  // ==========================================================================
  // INSTALLATION
  // ==========================================================================

  /**
   * Install a registered plugin
   */
  async install(pluginId: string, config?: Record<string, unknown>): Promise<InstalledPlugin> {
    const definition = this.definitions.get(pluginId);
    if (!definition) {
      throw new Error(`Plugin ${pluginId} is not registered`);
    }

    if (this.installed.has(pluginId)) {
      throw new Error(`Plugin ${pluginId} is already installed`);
    }

    if (this.installed.size >= this.config.maxPlugins) {
      throw new Error(`Maximum plugin limit (${this.config.maxPlugins}) reached`);
    }

    // Check dependencies
    await this.checkDependencies(definition);

    // Create installed plugin record
    const plugin: InstalledPlugin = {
      id: pluginId,
      metadata: definition.metadata,
      status: "installing",
      capabilities: definition.capabilities,
      config: config || {},
      installedAt: new Date(),
      stats: {
        hooksCalled: 0,
        toolsExecuted: 0,
        routesHit: 0,
        errors: 0,
      },
    };

    this.installed.set(pluginId, plugin);

    try {
      // Run installation hook
      if (definition.onInstall) {
        await this.runWithTimeout(definition.onInstall, this.config.timeout);
      }

      // Register plugin resources
      this.registerPluginResources(pluginId, definition);

      plugin.status = "installed";
      this.emit("plugin:installed", pluginId);

      // Auto-enable if configured
      if (this.config.autoEnable) {
        await this.enable(pluginId);
      }

      return plugin;
    } catch (error) {
      plugin.status = "error";
      plugin.lastError = error instanceof Error ? error.message : String(error);
      this.emit("plugin:error", pluginId, error as Error);
      throw error;
    }
  }

  /**
   * Uninstall a plugin
   */
  async uninstall(pluginId: string): Promise<void> {
    const plugin = this.installed.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} is not installed`);
    }

    const definition = this.definitions.get(pluginId);

    // Disable first if enabled
    if (plugin.status === "enabled") {
      await this.disable(pluginId);
    }

    plugin.status = "uninstalling";

    try {
      // Run uninstallation hook
      if (definition?.onUninstall) {
        await this.runWithTimeout(definition.onUninstall, this.config.timeout);
      }

      // Unregister plugin resources
      this.unregisterPluginResources(pluginId);

      this.installed.delete(pluginId);
      this.emit("plugin:uninstalled", pluginId);
    } catch (error) {
      plugin.status = "error";
      plugin.lastError = error instanceof Error ? error.message : String(error);
      this.emit("plugin:error", pluginId, error as Error);
      throw error;
    }
  }

  // ==========================================================================
  // ENABLE / DISABLE
  // ==========================================================================

  /**
   * Enable a plugin
   */
  async enable(pluginId: string): Promise<void> {
    const plugin = this.installed.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} is not installed`);
    }

    if (plugin.status === "enabled") {
      return; // Already enabled
    }

    const definition = this.definitions.get(pluginId);

    try {
      // Run enable hook
      if (definition?.onEnable) {
        await this.runWithTimeout(definition.onEnable, this.config.timeout);
      }

      plugin.status = "enabled";
      plugin.enabledAt = new Date();
      this.emit("plugin:enabled", pluginId);
    } catch (error) {
      plugin.status = "error";
      plugin.lastError = error instanceof Error ? error.message : String(error);
      this.emit("plugin:error", pluginId, error as Error);
      throw error;
    }
  }

  /**
   * Disable a plugin
   */
  async disable(pluginId: string): Promise<void> {
    const plugin = this.installed.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} is not installed`);
    }

    if (plugin.status !== "enabled") {
      return; // Not enabled
    }

    const definition = this.definitions.get(pluginId);

    try {
      // Run disable hook
      if (definition?.onDisable) {
        await this.runWithTimeout(definition.onDisable, this.config.timeout);
      }

      plugin.status = "disabled";
      plugin.enabledAt = undefined;
      this.emit("plugin:disabled", pluginId);
    } catch (error) {
      plugin.status = "error";
      plugin.lastError = error instanceof Error ? error.message : String(error);
      this.emit("plugin:error", pluginId, error as Error);
      throw error;
    }
  }

  // ==========================================================================
  // CONFIGURATION
  // ==========================================================================

  /**
   * Update plugin configuration
   */
  async configure(pluginId: string, config: Record<string, unknown>): Promise<void> {
    const plugin = this.installed.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} is not installed`);
    }

    const definition = this.definitions.get(pluginId);

    // Validate config against schema
    if (definition?.configSchema) {
      this.validateConfig(config, definition.configSchema.fields);
    }

    const oldConfig = { ...plugin.config };
    plugin.config = { ...plugin.config, ...config };

    try {
      // Run config change hook
      if (definition?.onConfigChange) {
        await definition.onConfigChange({ old: oldConfig, new: plugin.config });
      }

      this.emit("plugin:config_changed", pluginId, plugin.config);
    } catch (error) {
      // Rollback config
      plugin.config = oldConfig;
      throw error;
    }
  }

  // ==========================================================================
  // HOOKS
  // ==========================================================================

  /**
   * Execute hooks for a given type
   */
  async executeHooks(hookType: PluginHookType, context: Partial<HookContext>): Promise<unknown[]> {
    const hookEntries = this.hooks.get(hookType) || [];
    const results: unknown[] = [];

    // Sort by priority (lower = higher priority)
    const sorted = [...hookEntries].sort((a, b) => a.hook.priority - b.hook.priority);

    for (const entry of sorted) {
      const plugin = this.installed.get(entry.pluginId);

      // Skip if plugin not enabled
      if (!plugin || plugin.status !== "enabled") {
        continue;
      }

      try {
        const fullContext: HookContext = {
          pluginId: entry.pluginId,
          hookType,
          timestamp: Date.now(),
          data: context.data,
          metadata: context.metadata || {},
        };

        const result = await this.runWithTimeout(
          () => entry.hook.handler(fullContext),
          this.config.timeout
        );

        results.push(result);
        plugin.stats.hooksCalled++;
        this.emit("hook:executed", entry.pluginId, hookType);
      } catch (error) {
        plugin.stats.errors++;
        this.emit("plugin:error", entry.pluginId, error as Error);
        // Continue executing other hooks
      }
    }

    return results;
  }

  // ==========================================================================
  // TOOLS
  // ==========================================================================

  /**
   * Execute a plugin tool
   */
  async executeTool(toolId: string, context: Partial<ToolExecutionContext>): Promise<unknown> {
    const toolEntry = this.tools.get(toolId);
    if (!toolEntry) {
      throw new Error(`Tool ${toolId} not found`);
    }

    const plugin = this.installed.get(toolEntry.pluginId);
    if (!plugin || plugin.status !== "enabled") {
      throw new Error(`Plugin ${toolEntry.pluginId} is not enabled`);
    }

    const fullContext: ToolExecutionContext = {
      pluginId: toolEntry.pluginId,
      toolId,
      inputs: context.inputs || {},
      executionId: context.executionId || `exec_${Date.now()}`,
      pipelineId: context.pipelineId,
      stepId: context.stepId,
      userId: context.userId,
      orgId: context.orgId,
    };

    try {
      const result = await this.runWithTimeout(
        () => toolEntry.tool.execute(fullContext),
        this.config.timeout
      );

      plugin.stats.toolsExecuted++;
      this.emit("tool:executed", toolEntry.pluginId, toolId);

      return result;
    } catch (error) {
      plugin.stats.errors++;
      this.emit("plugin:error", toolEntry.pluginId, error as Error);
      throw error;
    }
  }

  /**
   * Get all available tools
   */
  getTools(): Array<{ pluginId: string; tool: PluginTool }> {
    return Array.from(this.tools.values()).filter(entry => {
      const plugin = this.installed.get(entry.pluginId);
      return plugin && plugin.status === "enabled";
    });
  }

  /**
   * Get tool by ID
   */
  getTool(toolId: string): PluginTool | undefined {
    return this.tools.get(toolId)?.tool;
  }

  // ==========================================================================
  // ROUTES
  // ==========================================================================

  /**
   * Get all plugin routes
   */
  getRoutes(): Array<{ pluginId: string; route: PluginRoute }> {
    return Array.from(this.routes.values()).filter(entry => {
      const plugin = this.installed.get(entry.pluginId);
      return plugin && plugin.status === "enabled";
    });
  }

  // ==========================================================================
  // QUERIES
  // ==========================================================================

  /**
   * Get all registered plugins
   */
  getRegistered(): PluginDefinition[] {
    return Array.from(this.definitions.values());
  }

  /**
   * Get all installed plugins
   */
  getInstalled(): InstalledPlugin[] {
    return Array.from(this.installed.values());
  }

  /**
   * Get plugin by ID
   */
  getPlugin(pluginId: string): InstalledPlugin | undefined {
    return this.installed.get(pluginId);
  }

  /**
   * Get plugins by capability
   */
  getByCapability(capability: PluginCapability): InstalledPlugin[] {
    return this.getInstalled().filter(p => p.capabilities.includes(capability));
  }

  /**
   * Get enabled plugins
   */
  getEnabled(): InstalledPlugin[] {
    return this.getInstalled().filter(p => p.status === "enabled");
  }

  /**
   * Check if plugin is installed
   */
  isInstalled(pluginId: string): boolean {
    return this.installed.has(pluginId);
  }

  /**
   * Check if plugin is enabled
   */
  isEnabled(pluginId: string): boolean {
    const plugin = this.installed.get(pluginId);
    return plugin?.status === "enabled";
  }

  // ==========================================================================
  // PRIVATE METHODS
  // ==========================================================================

  private validateDefinition(definition: PluginDefinition): void {
    const { metadata } = definition;

    if (!metadata.id || !metadata.name || !metadata.version) {
      throw new Error("Plugin must have id, name, and version");
    }

    // Validate version format (semver-like)
    if (!/^\d+\.\d+\.\d+/.test(metadata.version)) {
      throw new Error("Plugin version must be semver format (x.y.z)");
    }
  }

  private validateConfig(config: Record<string, unknown>, fields: any[]): void {
    for (const field of fields) {
      if (field.required && !(field.key in config)) {
        throw new Error(`Missing required config field: ${field.key}`);
      }

      const value = config[field.key];
      if (value !== undefined) {
        // Type validation
        switch (field.type) {
          case "number":
            if (typeof value !== "number") {
              throw new Error(`Config field ${field.key} must be a number`);
            }
            if (field.validation?.min !== undefined && value < field.validation.min) {
              throw new Error(`Config field ${field.key} must be >= ${field.validation.min}`);
            }
            if (field.validation?.max !== undefined && value > field.validation.max) {
              throw new Error(`Config field ${field.key} must be <= ${field.validation.max}`);
            }
            break;
          case "boolean":
            if (typeof value !== "boolean") {
              throw new Error(`Config field ${field.key} must be a boolean`);
            }
            break;
          case "string":
          case "secret":
            if (typeof value !== "string") {
              throw new Error(`Config field ${field.key} must be a string`);
            }
            if (field.validation?.pattern) {
              const regex = new RegExp(field.validation.pattern);
              if (!regex.test(value)) {
                throw new Error(`Config field ${field.key} doesn't match pattern`);
              }
            }
            break;
        }
      }
    }
  }

  private async checkDependencies(definition: PluginDefinition): Promise<void> {
    for (const dep of definition.dependencies || []) {
      const depPlugin = this.installed.get(dep.pluginId);

      if (!depPlugin) {
        if (dep.optional) {
          continue;
        }
        throw new Error(`Missing required dependency: ${dep.pluginId}`);
      }

      if (depPlugin.status !== "enabled") {
        if (dep.optional) {
          continue;
        }
        throw new Error(`Dependency ${dep.pluginId} is not enabled`);
      }
    }
  }

  private registerPluginResources(pluginId: string, definition: PluginDefinition): void {
    // Register hooks
    for (const hook of definition.hooks || []) {
      const hookList = this.hooks.get(hook.type) || [];
      hookList.push({ pluginId, hook });
      this.hooks.set(hook.type, hookList);
    }

    // Register tools
    for (const tool of definition.tools || []) {
      const toolId = `${pluginId}:${tool.id}`;
      this.tools.set(toolId, { pluginId, tool: { ...tool, id: toolId } });
    }

    // Register routes
    for (const route of definition.routes || []) {
      const routeKey = `${route.method}:${route.path}`;
      this.routes.set(routeKey, { pluginId, route });
    }
  }

  private unregisterPluginResources(pluginId: string): void {
    // Unregister hooks
    for (const [hookType, hooks] of this.hooks.entries()) {
      this.hooks.set(hookType, hooks.filter(h => h.pluginId !== pluginId));
    }

    // Unregister tools
    for (const [toolId, entry] of this.tools.entries()) {
      if (entry.pluginId === pluginId) {
        this.tools.delete(toolId);
      }
    }

    // Unregister routes
    for (const [routeKey, entry] of this.routes.entries()) {
      if (entry.pluginId === pluginId) {
        this.routes.delete(routeKey);
      }
    }
  }

  private async runWithTimeout<T>(fn: () => Promise<T>, timeout: number): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error("Plugin operation timed out")), timeout)
      ),
    ]);
  }
}

// ============================================================================
// SINGLETON & FACTORY
// ============================================================================

let pluginManagerInstance: PluginManager | null = null;

export function getPluginManager(): PluginManager {
  if (!pluginManagerInstance) {
    pluginManagerInstance = new PluginManager();
  }
  return pluginManagerInstance;
}

export function createPluginManager(config?: Partial<PluginManagerConfig>): PluginManager {
  return new PluginManager(config);
}
