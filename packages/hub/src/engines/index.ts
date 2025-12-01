/**
 * Engine Manager
 *
 * Manages connections to all gICM engines.
 */

import type { EngineName, EngineState, EngineCommand } from "../core/types.js";
import { eventBus } from "../bus/index.js";
import { Logger } from "../utils/logger.js";
import { EngineConnector } from "./base-connector.js";

// Re-export base connector
export { EngineConnector } from "./base-connector.js";

export class EngineManager {
  private logger: Logger;
  private engines: Map<EngineName, EngineConnector> = new Map();

  constructor() {
    this.logger = new Logger("EngineManager");
  }

  /**
   * Register an engine
   */
  registerEngine(name: EngineName, connector: EngineConnector): void {
    this.engines.set(name, connector);

    // Subscribe to engine events
    connector.onEvent((type, data) => {
      eventBus.publish(name, name, type, data);
    });

    // Subscribe to state changes
    connector.onStateChange((state) => {
      eventBus.publish(name, "system", `${name}.state.changed`, { state });
    });

    this.logger.info(`Registered engine: ${name}`);
  }

  /**
   * Get engine state
   */
  getEngineState(name: EngineName): EngineState | undefined {
    return this.engines.get(name)?.getState();
  }

  /**
   * Get all engine states
   */
  getAllStates(): Record<EngineName, EngineState | undefined> {
    const states: Record<string, EngineState | undefined> = {};
    for (const [name, connector] of this.engines) {
      states[name] = connector.getState();
    }
    return states as Record<EngineName, EngineState | undefined>;
  }

  /**
   * Send command to engine
   */
  async sendCommand(command: EngineCommand): Promise<boolean> {
    const connector = this.engines.get(command.engine);
    if (!connector) {
      this.logger.error(`Engine not found: ${command.engine}`);
      return false;
    }

    try {
      await connector.sendCommand(command.command, command.params);

      eventBus.publish("hub", "system", "engine.command.sent", {
        engine: command.engine,
        command: command.command,
      });

      return true;
    } catch (error) {
      this.logger.error(`Command failed: ${error}`);
      return false;
    }
  }

  /**
   * Start all engines
   */
  async startAll(): Promise<void> {
    for (const [name] of this.engines) {
      await this.sendCommand({ engine: name, command: "start" });
    }
  }

  /**
   * Stop all engines
   */
  async stopAll(): Promise<void> {
    for (const [name] of this.engines) {
      await this.sendCommand({ engine: name, command: "stop" });
    }
  }

  /**
   * Health check all engines
   */
  async healthCheck(): Promise<Record<EngineName, boolean>> {
    const results: Record<string, boolean> = {};

    for (const [name, connector] of this.engines) {
      results[name] = await connector.healthCheck();
    }

    return results as Record<EngineName, boolean>;
  }
}

/**
 * Mock Engine Connector (for testing/demo)
 */
export class MockEngineConnector extends EngineConnector {
  constructor(name: EngineName) {
    super(name);
  }

  async connect(): Promise<void> {
    this.updateState({
      connected: true,
      status: "running",
      lastHeartbeat: Date.now(),
    });
  }

  async disconnect(): Promise<void> {
    this.updateState({
      connected: false,
      status: "stopped",
    });
  }

  async sendCommand(command: string, params?: Record<string, unknown>): Promise<void> {
    switch (command) {
      case "start":
        this.updateState({ status: "running" });
        break;
      case "stop":
        this.updateState({ status: "stopped" });
        break;
      case "pause":
        this.updateState({ status: "paused" });
        break;
      case "resume":
        this.updateState({ status: "running" });
        break;
    }
  }

  async healthCheck(): Promise<boolean> {
    this.updateState({
      health: {
        ...this.state.health,
        lastCheck: Date.now(),
      },
    });
    return this.state.status === "running";
  }
}

// Export brain connector
export { HyperBrainConnector } from "./brain-connector.js";
