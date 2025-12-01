/**
 * Base Engine Connector
 */

import type { EngineName, EngineState } from "../core/types.js";

export abstract class EngineConnector {
  protected name: EngineName;
  protected state: EngineState;
  protected eventHandlers: ((type: string, data: Record<string, unknown>) => void)[] = [];
  protected stateHandlers: ((state: EngineState) => void)[] = [];

  constructor(name: EngineName) {
    this.name = name;
    this.state = this.initState();
  }

  private initState(): EngineState {
    return {
      name: this.name,
      status: "stopped",
      health: {
        status: "healthy",
        lastCheck: Date.now(),
        uptime: 0,
        errors: 0,
      },
      metrics: {
        tasksCompleted: 0,
        tasksPerHour: 0,
        avgTaskDuration: 0,
      },
      connected: false,
      lastHeartbeat: 0,
      version: "1.0.0",
    };
  }

  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract sendCommand(command: string, params?: Record<string, unknown>): Promise<void>;
  abstract healthCheck(): Promise<boolean>;

  getState(): EngineState {
    return { ...this.state };
  }

  onEvent(handler: (type: string, data: Record<string, unknown>) => void): void {
    this.eventHandlers.push(handler);
  }

  onStateChange(handler: (state: EngineState) => void): void {
    this.stateHandlers.push(handler);
  }

  protected emitEvent(type: string, data: Record<string, unknown>): void {
    for (const handler of this.eventHandlers) {
      handler(type, data);
    }
  }

  protected updateState(updates: Partial<EngineState>): void {
    this.state = { ...this.state, ...updates };
    for (const handler of this.stateHandlers) {
      handler(this.state);
    }
  }
}
