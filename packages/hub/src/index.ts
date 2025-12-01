/**
 * gICM Integration Hub
 *
 * Central nervous system connecting all engines.
 */

import { eventBus } from "./bus/index.js";
import { EngineManager, MockEngineConnector } from "./engines/index.js";
import { ApiServer } from "./api/index.js";
import { PREDEFINED_WORKFLOWS } from "./coordinator/workflows.js";
import type { HubState, EngineName, Workflow, HubEvent } from "./core/types.js";
import { Logger } from "./utils/logger.js";

export interface HubConfig {
  apiPort: number;
  enableApi: boolean;
  enableWorkflows: boolean;
  mockEngines?: boolean;
}

const DEFAULT_CONFIG: HubConfig = {
  apiPort: 3100,
  enableApi: true,
  enableWorkflows: true,
  mockEngines: true,
};

export class IntegrationHub {
  private config: HubConfig;
  private logger: Logger;

  private engineManager: EngineManager;
  private apiServer: ApiServer;
  private workflows: Map<string, Workflow> = new Map();

  private state: HubState;
  private isRunning: boolean = false;
  private startTime: number = 0;

  constructor(config: Partial<HubConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.logger = new Logger("Hub");

    this.engineManager = new EngineManager();
    this.apiServer = new ApiServer(() => this.getState());

    this.state = this.initState();

    // Load predefined workflows
    if (this.config.enableWorkflows) {
      for (const workflow of PREDEFINED_WORKFLOWS) {
        this.workflows.set(workflow.id, workflow);
      }
    }

    // Register mock engines if enabled
    if (this.config.mockEngines) {
      this.registerMockEngines();
    }
  }

  private initState(): HubState {
    return {
      system: {
        startedAt: 0,
        uptime: 0,
        version: "1.0.0",
      },
      engines: {
        orchestrator: undefined,
        money: undefined,
        growth: undefined,
        product: undefined,
        brain: undefined,
      },
      metrics: {
        eventsProcessed: 0,
        workflowsExecuted: 0,
        apiRequests: 0,
        errors: 0,
      },
      activity: {
        activeWorkflows: 0,
        pendingTasks: 0,
        recentEvents: [],
      },
    };
  }

  private registerMockEngines(): void {
    const engines: EngineName[] = ["orchestrator", "money", "growth", "product", "brain"];
    for (const name of engines) {
      const connector = new MockEngineConnector(name);
      this.engineManager.registerEngine(name, connector);
    }
  }

  /**
   * Start the hub
   */
  async start(): Promise<void> {
    if (this.isRunning) return;

    this.logger.info("Starting gICM Integration Hub...");
    this.isRunning = true;
    this.startTime = Date.now();
    this.state.system.startedAt = this.startTime;

    // Setup event handlers
    this.setupEventHandlers();

    // Start API server
    if (this.config.enableApi) {
      await this.apiServer.start(this.config.apiPort);
    }

    // Start mock engines
    if (this.config.mockEngines) {
      await this.engineManager.startAll();
    }

    // Publish startup event
    eventBus.publish("hub", "system", "hub.started", {
      version: this.state.system.version,
      config: this.config,
    });

    this.logger.info("Integration Hub running");
    this.printStatus();
  }

  /**
   * Stop the hub
   */
  async stop(): Promise<void> {
    if (!this.isRunning) return;

    this.logger.info("Stopping Integration Hub...");

    // Stop all engines
    await this.engineManager.stopAll();

    // Stop API server
    await this.apiServer.stop();

    eventBus.publish("hub", "system", "hub.stopped", {});

    this.isRunning = false;
    this.logger.info("Integration Hub stopped");
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    // Track all events
    eventBus.subscribe("*", (event: HubEvent) => {
      this.state.metrics.eventsProcessed++;
      this.state.activity.recentEvents.unshift(event);
      if (this.state.activity.recentEvents.length > 100) {
        this.state.activity.recentEvents.pop();
      }
    });

    // Update uptime periodically
    setInterval(() => {
      this.state.system.uptime = Date.now() - this.startTime;
    }, 1000);

    // Handle workflow triggers
    if (this.config.enableWorkflows) {
      eventBus.subscribe("*", async (event: HubEvent) => {
        await this.checkWorkflowTriggers(event);
      });
    }
  }

  /**
   * Check if event triggers any workflow
   */
  private async checkWorkflowTriggers(event: HubEvent): Promise<void> {
    for (const [, workflow] of this.workflows) {
      if (workflow.status !== "active") continue;
      if (workflow.trigger.type !== "event") continue;
      if (workflow.trigger.eventType !== event.type) continue;

      this.logger.info(`Workflow triggered: ${workflow.name}`);
      await this.executeWorkflow(workflow, event);
    }
  }

  /**
   * Execute a workflow
   */
  private async executeWorkflow(workflow: Workflow, triggerData: HubEvent): Promise<void> {
    this.state.activity.activeWorkflows++;
    this.state.metrics.workflowsExecuted++;

    this.logger.info(`Executing workflow: ${workflow.name}`);

    // TODO: Implement full workflow execution
    workflow.executions++;
    workflow.lastExecuted = Date.now();

    this.state.activity.activeWorkflows--;
  }

  /**
   * Get current state
   */
  getState(): HubState {
    // Update engine states
    this.state.engines = this.engineManager.getAllStates();
    return { ...this.state };
  }

  /**
   * Get event bus instance
   */
  getEventBus() {
    return eventBus;
  }

  /**
   * Get engine manager
   */
  getEngineManager() {
    return this.engineManager;
  }

  /**
   * Print status
   */
  printStatus(): void {
    const state = this.getState();

    console.log("\n  gICM Integration Hub Status");
    console.log("=".repeat(50));
    console.log(`\n  System:`);
    console.log(`   Version: ${state.system.version}`);
    console.log(`   Uptime: ${Math.floor(state.system.uptime / 1000)}s`);
    console.log(`\n  Engines:`);
    for (const [name, engine] of Object.entries(state.engines)) {
      const status = engine?.status || "not connected";
      const icon = status === "running" ? "[OK]" : status === "stopped" ? "[--]" : "[!!]";
      console.log(`   ${icon} ${name}: ${status}`);
    }
    console.log(`\n  Metrics:`);
    console.log(`   Events processed: ${state.metrics.eventsProcessed}`);
    console.log(`   Workflows executed: ${state.metrics.workflowsExecuted}`);
    console.log(`\n  Workflows: ${this.workflows.size} active`);
    console.log(`\n  API: http://localhost:${this.config.apiPort}`);
    console.log(`   WebSocket: ws://localhost:${this.config.apiPort}/ws`);
    console.log("=".repeat(50) + "\n");
  }
}

// Exports
export * from "./core/types.js";
export * from "./bus/index.js";
export * from "./engines/index.js";
export * from "./coordinator/workflows.js";
export { ApiServer } from "./api/index.js";
export { UnifiedSystem } from "./system/unified-starter.js";
