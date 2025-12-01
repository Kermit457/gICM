/**
 * Workflow Storage
 * File-based storage for workflows and executions
 */

import * as fs from "fs";
import * as path from "path";
import type {
  WorkflowDefinition,
  WorkflowExecution,
  WorkflowStorage,
} from "./types.js";

export class FileWorkflowStorage implements WorkflowStorage {
  private basePath: string;
  private workflowsPath: string;
  private executionsPath: string;

  constructor(basePath?: string) {
    this.basePath = basePath || path.join(process.cwd(), ".gicm");
    this.workflowsPath = path.join(this.basePath, "workflows");
    this.executionsPath = path.join(this.basePath, "workflow-executions");
    this.ensureDirectories();
  }

  private ensureDirectories(): void {
    if (!fs.existsSync(this.workflowsPath)) {
      fs.mkdirSync(this.workflowsPath, { recursive: true });
    }
    if (!fs.existsSync(this.executionsPath)) {
      fs.mkdirSync(this.executionsPath, { recursive: true });
    }
  }

  /**
   * Save workflow definition
   */
  async saveWorkflow(workflow: WorkflowDefinition): Promise<void> {
    const filePath = path.join(this.workflowsPath, `${workflow.id}.json`);
    const data = {
      ...workflow,
      updatedAt: new Date().toISOString(),
      createdAt: workflow.createdAt || new Date().toISOString(),
    };
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  }

  /**
   * Load workflow by ID
   */
  async loadWorkflow(id: string): Promise<WorkflowDefinition | null> {
    const filePath = path.join(this.workflowsPath, `${id}.json`);
    if (!fs.existsSync(filePath)) {
      return null;
    }
    const data = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(data) as WorkflowDefinition;
  }

  /**
   * List all workflows
   */
  async listWorkflows(): Promise<WorkflowDefinition[]> {
    if (!fs.existsSync(this.workflowsPath)) {
      return [];
    }

    const files = fs.readdirSync(this.workflowsPath).filter((f) => f.endsWith(".json"));
    const workflows: WorkflowDefinition[] = [];

    for (const file of files) {
      try {
        const data = fs.readFileSync(path.join(this.workflowsPath, file), "utf-8");
        workflows.push(JSON.parse(data) as WorkflowDefinition);
      } catch {
        // Skip invalid files
      }
    }

    return workflows.sort((a, b) => {
      const aDate = a.updatedAt || a.createdAt || "";
      const bDate = b.updatedAt || b.createdAt || "";
      return bDate.localeCompare(aDate);
    });
  }

  /**
   * Delete workflow
   */
  async deleteWorkflow(id: string): Promise<boolean> {
    const filePath = path.join(this.workflowsPath, `${id}.json`);
    if (!fs.existsSync(filePath)) {
      return false;
    }
    fs.unlinkSync(filePath);
    return true;
  }

  /**
   * Save execution record
   */
  async saveExecution(execution: WorkflowExecution): Promise<void> {
    const filePath = path.join(this.executionsPath, `${execution.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(execution, null, 2));

    // Also update index for quick listing
    await this.updateExecutionIndex(execution);
  }

  /**
   * Load execution by ID
   */
  async loadExecution(id: string): Promise<WorkflowExecution | null> {
    const filePath = path.join(this.executionsPath, `${id}.json`);
    if (!fs.existsSync(filePath)) {
      return null;
    }
    const data = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(data) as WorkflowExecution;
  }

  /**
   * List executions
   */
  async listExecutions(
    workflowId?: string,
    limit: number = 50
  ): Promise<WorkflowExecution[]> {
    const indexPath = path.join(this.executionsPath, "index.json");
    if (!fs.existsSync(indexPath)) {
      return [];
    }

    const index = JSON.parse(fs.readFileSync(indexPath, "utf-8")) as {
      executions: { id: string; workflowId: string; startedAt: string }[];
    };

    let filtered = index.executions;
    if (workflowId) {
      filtered = filtered.filter((e) => e.workflowId === workflowId);
    }

    // Sort by startedAt descending and limit
    filtered = filtered
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
      .slice(0, limit);

    // Load full execution records
    const executions: WorkflowExecution[] = [];
    for (const entry of filtered) {
      const exec = await this.loadExecution(entry.id);
      if (exec) {
        executions.push(exec);
      }
    }

    return executions;
  }

  /**
   * Update execution index for quick listing
   */
  private async updateExecutionIndex(execution: WorkflowExecution): Promise<void> {
    const indexPath = path.join(this.executionsPath, "index.json");
    let index: { executions: { id: string; workflowId: string; startedAt: string }[] };

    if (fs.existsSync(indexPath)) {
      index = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
    } else {
      index = { executions: [] };
    }

    // Remove existing entry and add updated one
    index.executions = index.executions.filter((e) => e.id !== execution.id);
    index.executions.push({
      id: execution.id,
      workflowId: execution.workflowId,
      startedAt: execution.startedAt,
    });

    // Keep only last 1000 entries
    if (index.executions.length > 1000) {
      index.executions = index.executions
        .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
        .slice(0, 1000);
    }

    fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
  }

  /**
   * Find workflow by name
   */
  async findWorkflowByName(name: string): Promise<WorkflowDefinition | null> {
    const workflows = await this.listWorkflows();
    return workflows.find((w) => w.name.toLowerCase() === name.toLowerCase()) || null;
  }
}
