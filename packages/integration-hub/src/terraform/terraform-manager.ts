/**
 * Terraform Manager
 * Phase 11C: Infrastructure as Code Integration
 */

import { EventEmitter } from "eventemitter3";
import { createHash, randomUUID } from "crypto";
import {
  type TerraformResourceType,
  type ProviderConfig,
  type PipelineResource,
  type ScheduleResource,
  type WebhookResource,
  type BudgetResource,
  type NotificationResource,
  type PluginResource,
  type ResourceState,
  type TerraformState,
  type ResourceChange,
  type ResourceChangeType,
  type TerraformPlan,
  type TerraformApplyResult,
  type HCLConfig,
  type TerraformManagerConfig,
  type TerraformEvents,
  TerraformManagerConfigSchema,
} from "./types.js";

// ============================================================================
// Type Aliases for Resources
// ============================================================================

type ResourceData =
  | PipelineResource
  | ScheduleResource
  | WebhookResource
  | BudgetResource
  | NotificationResource
  | PluginResource;

// ============================================================================
// Terraform Manager Class
// ============================================================================

export class TerraformManager extends EventEmitter<TerraformEvents> {
  private config: TerraformManagerConfig;
  private providerConfig: ProviderConfig | null = null;
  private state: TerraformState;
  private desiredState: Map<string, { type: TerraformResourceType; data: ResourceData }> = new Map();

  constructor(config: Partial<TerraformManagerConfig> = {}) {
    super();
    this.config = TerraformManagerConfigSchema.parse(config);

    // Initialize empty state
    this.state = {
      version: 1,
      serial: 0,
      lineage: randomUUID(),
      resources: [],
      outputs: {},
    };
  }

  // ============================================================================
  // Provider Configuration
  // ============================================================================

  /**
   * Configure the provider
   */
  configureProvider(config: ProviderConfig): void {
    this.providerConfig = config;
  }

  /**
   * Validate provider is configured
   */
  private ensureProvider(): void {
    if (!this.providerConfig) {
      throw new Error("Provider not configured. Call configureProvider() first.");
    }
  }

  // ============================================================================
  // Resource Definition
  // ============================================================================

  /**
   * Define a pipeline resource
   */
  definePipeline(name: string, resource: PipelineResource): void {
    this.desiredState.set(`integrationhub_pipeline.${name}`, {
      type: "integrationhub_pipeline",
      data: resource,
    });
  }

  /**
   * Define a schedule resource
   */
  defineSchedule(name: string, resource: ScheduleResource): void {
    this.desiredState.set(`integrationhub_schedule.${name}`, {
      type: "integrationhub_schedule",
      data: resource,
    });
  }

  /**
   * Define a webhook resource
   */
  defineWebhook(name: string, resource: WebhookResource): void {
    this.desiredState.set(`integrationhub_webhook.${name}`, {
      type: "integrationhub_webhook",
      data: resource,
    });
  }

  /**
   * Define a budget resource
   */
  defineBudget(name: string, resource: BudgetResource): void {
    this.desiredState.set(`integrationhub_budget.${name}`, {
      type: "integrationhub_budget",
      data: resource,
    });
  }

  /**
   * Define a notification resource
   */
  defineNotification(name: string, resource: NotificationResource): void {
    this.desiredState.set(`integrationhub_notification.${name}`, {
      type: "integrationhub_notification",
      data: resource,
    });
  }

  /**
   * Define a plugin resource
   */
  definePlugin(name: string, resource: PluginResource): void {
    this.desiredState.set(`integrationhub_plugin.${name}`, {
      type: "integrationhub_plugin",
      data: resource,
    });
  }

  // ============================================================================
  // Plan
  // ============================================================================

  /**
   * Generate a plan showing changes
   */
  async plan(): Promise<TerraformPlan> {
    this.ensureProvider();
    this.emit("planStarted");

    const changes: ResourceChange[] = [];
    const currentResources = new Map(
      this.state.resources.map((r) => [`${r.type}.${r.name}`, r])
    );

    // Refresh state if configured
    if (this.config.refreshOnPlan) {
      await this.refresh();
    }

    // Check for creates and updates
    for (const [key, desired] of this.desiredState) {
      const current = currentResources.get(key);

      if (!current) {
        // Create
        changes.push({
          type: desired.type,
          name: key.split(".")[1],
          action: "create",
          after: desired.data as Record<string, unknown>,
        });
      } else {
        // Check for updates
        const diff = this.calculateDiff(
          current.attributes as Record<string, unknown>,
          desired.data as Record<string, unknown>
        );
        if (diff.length > 0) {
          changes.push({
            type: desired.type,
            name: key.split(".")[1],
            action: "update",
            before: current.attributes as Record<string, unknown>,
            after: desired.data as Record<string, unknown>,
            diff,
          });
        } else {
          changes.push({
            type: desired.type,
            name: key.split(".")[1],
            action: "no-op",
          });
        }
      }

      currentResources.delete(key);
    }

    // Check for deletes (resources in state but not in desired)
    for (const [key, current] of currentResources) {
      changes.push({
        type: current.type,
        name: current.name,
        action: "delete",
        before: current.attributes as Record<string, unknown>,
      });
    }

    const plan: TerraformPlan = {
      version: 1,
      timestamp: new Date().toISOString(),
      changes,
      summary: {
        toCreate: changes.filter((c) => c.action === "create").length,
        toUpdate: changes.filter((c) => c.action === "update").length,
        toDelete: changes.filter((c) => c.action === "delete").length,
        toReplace: changes.filter((c) => c.action === "replace").length,
        unchanged: changes.filter((c) => c.action === "no-op").length,
      },
    };

    this.emit("planCompleted", plan);
    return plan;
  }

  // ============================================================================
  // Apply
  // ============================================================================

  /**
   * Apply changes from a plan
   */
  async apply(plan?: TerraformPlan): Promise<TerraformApplyResult> {
    this.ensureProvider();

    // Generate plan if not provided
    const executionPlan = plan || (await this.plan());
    this.emit("applyStarted", executionPlan);

    const startTime = Date.now();
    const results: TerraformApplyResult["results"] = [];

    let created = 0;
    let updated = 0;
    let deleted = 0;
    let failed = 0;

    // Group changes by action for ordering (deletes first, then creates, then updates)
    const deletes = executionPlan.changes.filter((c) => c.action === "delete");
    const creates = executionPlan.changes.filter((c) => c.action === "create");
    const updates = executionPlan.changes.filter((c) => c.action === "update");
    const replaces = executionPlan.changes.filter((c) => c.action === "replace");

    // Process deletes first
    for (const change of deletes) {
      const result = await this.applyDelete(change);
      results.push({ resource: `${change.type}.${change.name}`, action: "delete", result });
      if (result.success) {
        deleted++;
      } else {
        failed++;
      }
    }

    // Process creates
    for (const change of creates) {
      const result = await this.applyCreate(change);
      results.push({ resource: `${change.type}.${change.name}`, action: "create", result });
      if (result.success) {
        created++;
      } else {
        failed++;
      }
    }

    // Process updates
    for (const change of updates) {
      const result = await this.applyUpdate(change);
      results.push({ resource: `${change.type}.${change.name}`, action: "update", result });
      if (result.success) {
        updated++;
      } else {
        failed++;
      }
    }

    // Process replaces (delete then create)
    for (const change of replaces) {
      const deleteResult = await this.applyDelete(change);
      if (deleteResult.success) {
        const createResult = await this.applyCreate(change);
        results.push({ resource: `${change.type}.${change.name}`, action: "replace", result: createResult });
        if (createResult.success) {
          created++;
          deleted++;
        } else {
          failed++;
        }
      } else {
        results.push({ resource: `${change.type}.${change.name}`, action: "replace", result: deleteResult });
        failed++;
      }
    }

    // Save state
    await this.saveState();

    const applyResult: TerraformApplyResult = {
      success: failed === 0,
      results,
      summary: { created, updated, deleted, failed },
      duration: Date.now() - startTime,
    };

    this.emit("applyCompleted", applyResult);
    return applyResult;
  }

  // ============================================================================
  // State Management
  // ============================================================================

  /**
   * Refresh state from remote
   */
  async refresh(): Promise<void> {
    this.ensureProvider();

    // In a real implementation, this would fetch current state from the API
    // For now, we just emit the event
    this.emit("stateRefreshed");
  }

  /**
   * Import an existing resource into state
   */
  async import(
    type: TerraformResourceType,
    name: string,
    resourceId: string
  ): Promise<ResourceState> {
    this.ensureProvider();

    // Fetch resource from API
    const attributes = await this.fetchResource(type, resourceId);

    const resource: ResourceState = {
      id: resourceId,
      type,
      name,
      attributes,
      meta: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1,
        checksum: this.calculateChecksum(attributes),
      },
    };

    this.state.resources.push(resource);
    this.state.serial++;

    await this.saveState();

    return resource;
  }

  /**
   * Remove a resource from state (without deleting it)
   */
  removeFromState(type: TerraformResourceType, name: string): boolean {
    const key = `${type}.${name}`;
    const index = this.state.resources.findIndex(
      (r) => `${r.type}.${r.name}` === key
    );

    if (index >= 0) {
      this.state.resources.splice(index, 1);
      this.state.serial++;
      return true;
    }

    return false;
  }

  /**
   * Get current state
   */
  getState(): TerraformState {
    return { ...this.state };
  }

  /**
   * Load state from storage
   */
  async loadState(state: TerraformState): Promise<void> {
    this.state = state;
  }

  // ============================================================================
  // HCL Parsing & Generation
  // ============================================================================

  /**
   * Parse HCL configuration
   */
  parseHCL(hclContent: string): HCLConfig {
    // Simplified HCL parsing - in reality would use a proper HCL parser
    const config: HCLConfig = {
      resources: [],
      variables: {},
      outputs: {},
    };

    // Parse terraform block
    const terraformMatch = hclContent.match(/terraform\s*\{[\s\S]*?required_providers\s*\{([\s\S]*?)\}/);
    if (terraformMatch) {
      config.terraform = { requiredProviders: {} };
    }

    // Parse resources
    const resourceRegex = /resource\s+"(\w+)"\s+"(\w+)"\s*\{([\s\S]*?)\n\}/g;
    let match;
    while ((match = resourceRegex.exec(hclContent)) !== null) {
      const [, type, name, body] = match;
      config.resources?.push({
        type: "resource",
        labels: [type, name],
        attributes: this.parseHCLAttributes(body),
      });
    }

    // Parse variables
    const variableRegex = /variable\s+"(\w+)"\s*\{([\s\S]*?)\n\}/g;
    while ((match = variableRegex.exec(hclContent)) !== null) {
      const [, name, body] = match;
      const attrs = this.parseHCLAttributes(body);
      config.variables![name] = {
        type: attrs.type as string,
        default: attrs.default,
        description: attrs.description as string,
        sensitive: attrs.sensitive as boolean,
      };
    }

    // Parse outputs
    const outputRegex = /output\s+"(\w+)"\s*\{([\s\S]*?)\n\}/g;
    while ((match = outputRegex.exec(hclContent)) !== null) {
      const [, name, body] = match;
      const attrs = this.parseHCLAttributes(body);
      config.outputs![name] = {
        value: attrs.value as string,
        description: attrs.description as string,
        sensitive: attrs.sensitive as boolean,
      };
    }

    return config;
  }

  /**
   * Generate HCL from resources
   */
  generateHCL(): string {
    const lines: string[] = [];

    // Terraform block
    lines.push('terraform {');
    lines.push('  required_providers {');
    lines.push('    integrationhub = {');
    lines.push('      source  = "gicm/integrationhub"');
    lines.push(`      version = "~> ${this.config.providerVersion}"`);
    lines.push('    }');
    lines.push('  }');
    lines.push('}');
    lines.push('');

    // Provider block
    lines.push('provider "integrationhub" {');
    if (this.providerConfig) {
      lines.push(`  api_key = var.api_key`);
      if (this.providerConfig.organizationId) {
        lines.push(`  organization_id = "${this.providerConfig.organizationId}"`);
      }
    }
    lines.push('}');
    lines.push('');

    // Resources
    for (const [key, { type, data }] of this.desiredState) {
      const name = key.split(".")[1];
      lines.push(`resource "${type}" "${name}" {`);
      lines.push(this.attributesToHCL(data as Record<string, unknown>, 2));
      lines.push('}');
      lines.push('');
    }

    return lines.join('\n');
  }

  // ============================================================================
  // Validation
  // ============================================================================

  /**
   * Validate configuration
   */
  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check provider
    if (!this.providerConfig) {
      errors.push("Provider not configured");
    }

    // Check for duplicate names
    const names = new Set<string>();
    for (const key of this.desiredState.keys()) {
      if (names.has(key)) {
        errors.push(`Duplicate resource: ${key}`);
      }
      names.add(key);
    }

    // Validate resource references
    for (const [key, { type, data }] of this.desiredState) {
      if (type === "integrationhub_schedule") {
        const schedule = data as ScheduleResource;
        const pipelineKey = `integrationhub_pipeline.${schedule.pipelineId}`;
        if (!this.desiredState.has(pipelineKey) && !this.state.resources.find(r => r.id === schedule.pipelineId)) {
          errors.push(`Schedule ${key} references unknown pipeline: ${schedule.pipelineId}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private async applyCreate(change: ResourceChange): Promise<{ success: boolean; resourceId?: string; error?: string; duration: number }> {
    const startTime = Date.now();
    const resourceKey = `${change.type}.${change.name}`;

    this.emit("resourceCreating", change.type, change.name);

    try {
      // In reality, this would call the API
      const resourceId = randomUUID();

      // Add to state
      const resource: ResourceState = {
        id: resourceId,
        type: change.type,
        name: change.name,
        attributes: change.after || {},
        meta: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          version: 1,
          checksum: this.calculateChecksum(change.after || {}),
        },
      };

      this.state.resources.push(resource);
      this.state.serial++;

      this.emit("resourceCreated", change.type, change.name, resourceId);

      return {
        success: true,
        resourceId,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      this.emit("resourceError", change.type, change.name, error instanceof Error ? error : new Error(String(error)));
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime,
      };
    }
  }

  private async applyUpdate(change: ResourceChange): Promise<{ success: boolean; error?: string; duration: number }> {
    const startTime = Date.now();

    this.emit("resourceUpdating", change.type, change.name);

    try {
      // Find and update in state
      const index = this.state.resources.findIndex(
        (r) => r.type === change.type && r.name === change.name
      );

      if (index >= 0) {
        this.state.resources[index].attributes = change.after || {};
        this.state.resources[index].meta.updatedAt = new Date().toISOString();
        this.state.resources[index].meta.version++;
        this.state.resources[index].meta.checksum = this.calculateChecksum(change.after || {});
        this.state.serial++;
      }

      this.emit("resourceUpdated", change.type, change.name);

      return {
        success: true,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      this.emit("resourceError", change.type, change.name, error instanceof Error ? error : new Error(String(error)));
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime,
      };
    }
  }

  private async applyDelete(change: ResourceChange): Promise<{ success: boolean; error?: string; duration: number }> {
    const startTime = Date.now();

    this.emit("resourceDeleting", change.type, change.name);

    try {
      // Remove from state
      const index = this.state.resources.findIndex(
        (r) => r.type === change.type && r.name === change.name
      );

      if (index >= 0) {
        this.state.resources.splice(index, 1);
        this.state.serial++;
      }

      this.emit("resourceDeleted", change.type, change.name);

      return {
        success: true,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      this.emit("resourceError", change.type, change.name, error instanceof Error ? error : new Error(String(error)));
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime,
      };
    }
  }

  private async saveState(): Promise<void> {
    // In reality, this would persist state to configured backend
    this.emit("stateSaved");
  }

  private async fetchResource(type: TerraformResourceType, id: string): Promise<Record<string, unknown>> {
    // In reality, this would fetch from API
    return { id };
  }

  private calculateDiff(
    before: Record<string, unknown>,
    after: Record<string, unknown>
  ): { path: string; oldValue: unknown; newValue: unknown }[] {
    const diff: { path: string; oldValue: unknown; newValue: unknown }[] = [];

    const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);

    for (const key of allKeys) {
      const oldValue = before[key];
      const newValue = after[key];

      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        diff.push({ path: key, oldValue, newValue });
      }
    }

    return diff;
  }

  private calculateChecksum(data: Record<string, unknown>): string {
    return createHash("sha256").update(JSON.stringify(data)).digest("hex").slice(0, 16);
  }

  private parseHCLAttributes(body: string): Record<string, unknown> {
    const attributes: Record<string, unknown> = {};
    const attrRegex = /(\w+)\s*=\s*(".*?"|[^\n]+)/g;
    let match;

    while ((match = attrRegex.exec(body)) !== null) {
      const [, key, value] = match;
      let parsedValue: unknown = value.trim();

      // Remove quotes from strings
      if (typeof parsedValue === "string" && parsedValue.startsWith('"') && parsedValue.endsWith('"')) {
        parsedValue = parsedValue.slice(1, -1);
      }
      // Parse booleans
      else if (parsedValue === "true") {
        parsedValue = true;
      } else if (parsedValue === "false") {
        parsedValue = false;
      }
      // Parse numbers
      else if (!isNaN(Number(parsedValue))) {
        parsedValue = Number(parsedValue);
      }

      attributes[key] = parsedValue;
    }

    return attributes;
  }

  private attributesToHCL(attrs: Record<string, unknown>, indent: number): string {
    const spaces = " ".repeat(indent);
    const lines: string[] = [];

    for (const [key, value] of Object.entries(attrs)) {
      if (value === undefined || value === null) continue;

      if (typeof value === "string") {
        lines.push(`${spaces}${key} = "${value}"`);
      } else if (typeof value === "number" || typeof value === "boolean") {
        lines.push(`${spaces}${key} = ${value}`);
      } else if (Array.isArray(value)) {
        lines.push(`${spaces}${key} = ${JSON.stringify(value)}`);
      } else if (typeof value === "object") {
        lines.push(`${spaces}${key} {`);
        lines.push(this.attributesToHCL(value as Record<string, unknown>, indent + 2));
        lines.push(`${spaces}}`);
      }
    }

    return lines.join("\n");
  }

  /**
   * Get summary of terraform manager state
   */
  getSummary(): {
    resourceCount: number;
    desiredResourceCount: number;
    stateSerial: number;
    providerConfigured: boolean;
  } {
    return {
      resourceCount: this.state.resources.length,
      desiredResourceCount: this.desiredState.size,
      stateSerial: this.state.serial,
      providerConfigured: this.providerConfig !== null,
    };
  }
}

// ============================================================================
// Singleton & Factory
// ============================================================================

let terraformManagerInstance: TerraformManager | null = null;

export function getTerraformManager(): TerraformManager {
  if (!terraformManagerInstance) {
    terraformManagerInstance = new TerraformManager();
  }
  return terraformManagerInstance;
}

export function createTerraformManager(config: Partial<TerraformManagerConfig> = {}): TerraformManager {
  return new TerraformManager(config);
}
