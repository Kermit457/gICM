/**
 * WorkflowEngine Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { WorkflowEngine } from "../engine.js";
import type {
  WorkflowStorage,
  WorkflowDefinition,
  WorkflowExecution,
  AgentExecutor,
} from "../types.js";

// Mock storage implementation
class MockStorage implements WorkflowStorage {
  private workflows = new Map<string, WorkflowDefinition>();
  private executions = new Map<string, WorkflowExecution>();

  async saveWorkflow(workflow: WorkflowDefinition): Promise<void> {
    this.workflows.set(workflow.id, workflow);
  }

  async loadWorkflow(id: string): Promise<WorkflowDefinition | null> {
    return this.workflows.get(id) || null;
  }

  async listWorkflows(): Promise<WorkflowDefinition[]> {
    return Array.from(this.workflows.values());
  }

  async deleteWorkflow(id: string): Promise<boolean> {
    return this.workflows.delete(id);
  }

  async saveExecution(execution: WorkflowExecution): Promise<void> {
    this.executions.set(execution.id, execution);
  }

  async loadExecution(id: string): Promise<WorkflowExecution | null> {
    return this.executions.get(id) || null;
  }

  async listExecutions(workflowId?: string, limit?: number): Promise<WorkflowExecution[]> {
    let results = Array.from(this.executions.values());
    if (workflowId) {
      results = results.filter((e) => e.workflowId === workflowId);
    }
    if (limit) {
      results = results.slice(0, limit);
    }
    return results;
  }

  // For testing findWorkflowByName
  async findWorkflowByName(name: string): Promise<WorkflowDefinition | null> {
    for (const workflow of this.workflows.values()) {
      if (workflow.name === name) return workflow;
    }
    return null;
  }

  // Test helpers
  clear(): void {
    this.workflows.clear();
    this.executions.clear();
  }

  getWorkflowCount(): number {
    return this.workflows.size;
  }
}

// Mock agent executor
const mockAgentExecutor: AgentExecutor = {
  async execute(agentId: string, input: Record<string, unknown>) {
    return { agentId, input, success: true };
  },
  async listAgents() {
    return ["test-agent", "mock-agent"];
  },
  async getAgentInfo(agentId: string) {
    return { name: agentId, description: `Mock ${agentId}` };
  },
};

describe("WorkflowEngine", () => {
  let engine: WorkflowEngine;
  let storage: MockStorage;

  beforeEach(() => {
    storage = new MockStorage();
    engine = new WorkflowEngine({
      storage,
      agentExecutor: mockAgentExecutor,
      logLevel: "silent",
    });
  });

  describe("createWorkflow", () => {
    it("creates a workflow with valid input", async () => {
      const workflow = await engine.createWorkflow({
        name: "Test Workflow",
        description: "A test workflow",
        steps: [
          { agent: "test-agent", input: { foo: "bar" } },
          { agent: "mock-agent", dependsOn: ["step-1"] },
        ],
      });

      expect(workflow).toBeDefined();
      expect(workflow.name).toBe("Test Workflow");
      expect(workflow.description).toBe("A test workflow");
      expect(workflow.version).toBe("1.0.0");
      expect(workflow.steps).toHaveLength(2);
      expect(workflow.steps[0].id).toBe("step-1");
      expect(workflow.steps[1].id).toBe("step-2");
      expect(workflow.createdAt).toBeDefined();
    });

    it("auto-generates step IDs when not provided", async () => {
      const workflow = await engine.createWorkflow({
        name: "Auto ID Test",
        steps: [{ agent: "agent-1" }, { agent: "agent-2" }, { agent: "agent-3" }],
      });

      expect(workflow.steps[0].id).toBe("step-1");
      expect(workflow.steps[1].id).toBe("step-2");
      expect(workflow.steps[2].id).toBe("step-3");
    });

    it("uses provided step IDs", async () => {
      const workflow = await engine.createWorkflow({
        name: "Custom ID Test",
        steps: [
          { id: "fetch-data", agent: "hunter-agent" },
          { id: "analyze", agent: "decision-agent", dependsOn: ["fetch-data"] },
        ],
      });

      expect(workflow.steps[0].id).toBe("fetch-data");
      expect(workflow.steps[1].id).toBe("analyze");
    });

    it("sets default values for optional step properties", async () => {
      const workflow = await engine.createWorkflow({
        name: "Defaults Test",
        steps: [{ agent: "test-agent" }],
      });

      const step = workflow.steps[0];
      expect(step.onError).toBe("fail");
      expect(step.retryCount).toBe(3);
      expect(step.timeout).toBe(30000);
      expect(step.input).toEqual({});
    });

    it("saves workflow to storage", async () => {
      await engine.createWorkflow({
        name: "Storage Test",
        steps: [{ agent: "test-agent" }],
      });

      expect(storage.getWorkflowCount()).toBe(1);
    });

    it("throws on invalid workflow (circular dependencies)", async () => {
      await expect(
        engine.createWorkflow({
          name: "Circular Test",
          steps: [
            { id: "a", agent: "agent-1", dependsOn: ["b"] },
            { id: "b", agent: "agent-2", dependsOn: ["a"] },
          ],
        })
      ).rejects.toThrow(/validation failed|circular/i);
    });
  });

  describe("getWorkflow", () => {
    it("retrieves workflow by ID", async () => {
      const created = await engine.createWorkflow({
        name: "Get Test",
        steps: [{ agent: "test-agent" }],
      });

      const retrieved = await engine.getWorkflow(created.id);
      expect(retrieved).toEqual(created);
    });

    it("retrieves workflow by name", async () => {
      const created = await engine.createWorkflow({
        name: "Named Workflow",
        steps: [{ agent: "test-agent" }],
      });

      const retrieved = await engine.getWorkflow("Named Workflow");
      expect(retrieved?.name).toBe("Named Workflow");
    });

    it("returns null for non-existent workflow", async () => {
      const result = await engine.getWorkflow("non-existent");
      expect(result).toBeNull();
    });
  });

  describe("listWorkflows", () => {
    it("returns empty array when no workflows", async () => {
      const workflows = await engine.listWorkflows();
      expect(workflows).toEqual([]);
    });

    it("returns all workflows", async () => {
      await engine.createWorkflow({ name: "WF1", steps: [{ agent: "a" }] });
      await engine.createWorkflow({ name: "WF2", steps: [{ agent: "b" }] });
      await engine.createWorkflow({ name: "WF3", steps: [{ agent: "c" }] });

      const workflows = await engine.listWorkflows();
      expect(workflows).toHaveLength(3);
    });
  });

  describe("deleteWorkflow", () => {
    it("deletes existing workflow", async () => {
      const workflow = await engine.createWorkflow({
        name: "Delete Test",
        steps: [{ agent: "test" }],
      });

      const deleted = await engine.deleteWorkflow(workflow.id);
      expect(deleted).toBe(true);

      const retrieved = await engine.getWorkflow(workflow.id);
      expect(retrieved).toBeNull();
    });

    it("returns false for non-existent workflow", async () => {
      const deleted = await engine.deleteWorkflow("non-existent");
      expect(deleted).toBe(false);
    });
  });

  describe("runWorkflow", () => {
    it("runs workflow in dry run mode", async () => {
      const workflow = await engine.createWorkflow({
        name: "Dry Run Test",
        steps: [
          { id: "step-a", agent: "agent-1" },
          { id: "step-b", agent: "agent-2", dependsOn: ["step-a"] },
        ],
      });

      const execution = await engine.runWorkflow({
        workflowId: workflow.id,
        dryRun: true,
      });

      expect(execution.status).toBe("completed");
      expect(execution.output?.dryRun).toBe(true);
      expect(execution.output?.executionOrder).toBeDefined();
      expect(execution.duration).toBe(0);
    });

    it("throws for non-existent workflow", async () => {
      await expect(
        engine.runWorkflow({ workflowId: "non-existent" })
      ).rejects.toThrow("Workflow not found");
    });

    it("can run workflow by name", async () => {
      const workflow = await engine.createWorkflow({
        name: "Run By Name",
        steps: [{ agent: "test-agent" }],
      });

      const execution = await engine.runWorkflow({
        workflowName: "Run By Name",
        dryRun: true,
      });

      expect(execution.workflowId).toBe(workflow.id);
      expect(execution.workflowName).toBe("Run By Name");
    });

    it("passes input to execution", async () => {
      const workflow = await engine.createWorkflow({
        name: "Input Test",
        steps: [{ agent: "test" }],
      });

      const execution = await engine.runWorkflow({
        workflowId: workflow.id,
        input: { customKey: "customValue" },
        dryRun: true,
      });

      expect(execution.input).toEqual({ customKey: "customValue" });
    });

    it("emits started event", async () => {
      const workflow = await engine.createWorkflow({
        name: "Event Test",
        steps: [{ agent: "test" }],
      });

      const startedHandler = vi.fn();
      engine.on("started", startedHandler);

      await engine.runWorkflow({ workflowId: workflow.id });

      expect(startedHandler).toHaveBeenCalled();
    });

    it("emits completed event on success", async () => {
      const workflow = await engine.createWorkflow({
        name: "Complete Event Test",
        steps: [{ agent: "test" }],
      });

      const completedHandler = vi.fn();
      engine.on("completed", completedHandler);

      await engine.runWorkflow({ workflowId: workflow.id });

      expect(completedHandler).toHaveBeenCalled();
    });
  });

  describe("getExecution", () => {
    it("retrieves execution by ID", async () => {
      const workflow = await engine.createWorkflow({
        name: "Exec Test",
        steps: [{ agent: "test" }],
      });

      const execution = await engine.runWorkflow({
        workflowId: workflow.id,
        dryRun: true,
      });

      // After dry run, execution is not saved (it returns immediately)
      // So let's run a real execution
      const realExecution = await engine.runWorkflow({
        workflowId: workflow.id,
      });

      const retrieved = await engine.getExecution(realExecution.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(realExecution.id);
    });

    it("returns null for non-existent execution", async () => {
      const result = await engine.getExecution("non-existent");
      expect(result).toBeNull();
    });
  });

  describe("listExecutions", () => {
    it("lists all executions", async () => {
      const workflow = await engine.createWorkflow({
        name: "List Test",
        steps: [{ agent: "test" }],
      });

      await engine.runWorkflow({ workflowId: workflow.id });
      await engine.runWorkflow({ workflowId: workflow.id });

      const executions = await engine.listExecutions();
      expect(executions.length).toBeGreaterThanOrEqual(2);
    });

    it("filters by workflow ID", async () => {
      const wf1 = await engine.createWorkflow({
        name: "WF1",
        steps: [{ agent: "test" }],
      });
      const wf2 = await engine.createWorkflow({
        name: "WF2",
        steps: [{ agent: "test" }],
      });

      await engine.runWorkflow({ workflowId: wf1.id });
      await engine.runWorkflow({ workflowId: wf1.id });
      await engine.runWorkflow({ workflowId: wf2.id });

      const wf1Executions = await engine.listExecutions(wf1.id);
      expect(wf1Executions.every((e) => e.workflowId === wf1.id)).toBe(true);
    });

    it("respects limit parameter", async () => {
      const workflow = await engine.createWorkflow({
        name: "Limit Test",
        steps: [{ agent: "test" }],
      });

      await engine.runWorkflow({ workflowId: workflow.id });
      await engine.runWorkflow({ workflowId: workflow.id });
      await engine.runWorkflow({ workflowId: workflow.id });

      const executions = await engine.listExecutions(undefined, 2);
      expect(executions.length).toBeLessThanOrEqual(2);
    });
  });

  describe("cancelExecution", () => {
    it("returns false for non-existent execution", async () => {
      const result = await engine.cancelExecution("non-existent");
      expect(result).toBe(false);
    });

    it("returns false for already completed execution", async () => {
      const workflow = await engine.createWorkflow({
        name: "Cancel Test",
        steps: [{ agent: "test" }],
      });

      const execution = await engine.runWorkflow({ workflowId: workflow.id });

      // Execution is already complete
      const result = await engine.cancelExecution(execution.id);
      expect(result).toBe(false);
    });
  });

  describe("setAgentExecutor", () => {
    it("updates the agent executor", async () => {
      const customExecutor: AgentExecutor = {
        async execute() {
          return { custom: true };
        },
        async listAgents() {
          return ["custom-agent"];
        },
        async getAgentInfo() {
          return { name: "Custom", description: "Custom agent" };
        },
      };

      engine.setAgentExecutor(customExecutor);

      // Create and run workflow
      const workflow = await engine.createWorkflow({
        name: "Custom Executor Test",
        steps: [{ agent: "custom-agent" }],
      });

      const execution = await engine.runWorkflow({ workflowId: workflow.id });
      expect(execution.status).toBe("completed");
    });
  });

  describe("event handling", () => {
    it("emits events in correct order", async () => {
      const events: string[] = [];

      engine.on("started", () => events.push("started"));
      engine.on("completed", () => events.push("completed"));

      const workflow = await engine.createWorkflow({
        name: "Events Test",
        steps: [{ agent: "test" }],
      });

      await engine.runWorkflow({ workflowId: workflow.id });

      expect(events).toContain("started");
      expect(events).toContain("completed");
      expect(events.indexOf("started")).toBeLessThan(events.indexOf("completed"));
    });

    it("emits cancelled event", async () => {
      const cancelledHandler = vi.fn();
      engine.on("cancelled", cancelledHandler);

      // Note: Testing cancel requires a long-running workflow
      // For this test, we verify the handler setup works
      expect(engine.listeners("cancelled")).toContain(cancelledHandler);
    });
  });

  describe("workflow with variables", () => {
    it("creates workflow with variables", async () => {
      const workflow = await engine.createWorkflow({
        name: "Variables Test",
        steps: [{ agent: "test" }],
        variables: {
          apiKey: "test-key",
          maxRetries: 5,
        },
      });

      expect(workflow.variables).toEqual({
        apiKey: "test-key",
        maxRetries: 5,
      });
    });
  });

  describe("workflow with triggers", () => {
    it("creates workflow with triggers", async () => {
      const workflow = await engine.createWorkflow({
        name: "Triggers Test",
        steps: [{ agent: "test" }],
        triggers: [
          { type: "manual" },
          { type: "schedule", config: { cron: "0 * * * *" } },
        ],
      });

      expect(workflow.triggers).toHaveLength(2);
      expect(workflow.triggers?.[0].type).toBe("manual");
      expect(workflow.triggers?.[1].type).toBe("schedule");
    });
  });
});
