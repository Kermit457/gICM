/**
 * Base Engine Adapter for Level 2 Autonomy
 *
 * Abstract base class for integrating engines with autonomy system.
 * Engines can optionally use autonomy by importing and creating an adapter.
 */

import { EventEmitter } from "eventemitter3";
import type {
  Action,
  Decision,
  ActionCategory,
  EngineType,
  Urgency,
  ExecutionResult,
} from "../core/types.js";
import { Logger } from "../utils/logger.js";

export interface EngineAdapterConfig {
  engineName: string;
  engineType: EngineType;
  defaultCategory: ActionCategory;
}

export interface EngineAdapterEvents {
  "action:submitted": (action: Action) => void;
  "decision:received": (decision: Decision) => void;
  "execution:completed": (result: ExecutionResult) => void;
}

/**
 * Base adapter that engines can extend or use directly
 */
export abstract class EngineAdapter extends EventEmitter<EngineAdapterEvents> {
  protected logger: Logger;
  protected config: EngineAdapterConfig;
  protected actionCount = 0;

  constructor(config: EngineAdapterConfig) {
    super();
    this.config = config;
    this.logger = new Logger(`Adapter:${config.engineName}`);
  }

  /**
   * Create an action from engine-specific data
   */
  createAction(params: {
    type: string;
    description: string;
    payload: Record<string, unknown>;
    estimatedValue?: number;
    reversible?: boolean;
    urgency?: Urgency;
    linesChanged?: number;
    filesChanged?: number;
  }): Action {
    this.actionCount++;

    const action: Action = {
      id: `${this.config.engineType}_${Date.now()}_${this.actionCount}`,
      engine: this.config.engineType,
      category: this.getCategoryForType(params.type),
      type: params.type,
      description: params.description,
      params: params.payload,
      metadata: {
        estimatedValue: params.estimatedValue,
        reversible: params.reversible ?? true,
        urgency: params.urgency ?? "normal",
        linesChanged: params.linesChanged,
        filesChanged: params.filesChanged,
      },
      timestamp: Date.now(),
    };

    this.emit("action:submitted", action);
    return action;
  }

  /**
   * Map action type to category (override in subclasses)
   */
  protected getCategoryForType(actionType: string): ActionCategory {
    return this.config.defaultCategory;
  }

  /**
   * Get engine name
   */
  getEngineName(): string {
    return this.config.engineName;
  }

  /**
   * Get engine type
   */
  getEngineType(): EngineType {
    return this.config.engineType;
  }

  /**
   * Get action count
   */
  getActionCount(): number {
    return this.actionCount;
  }
}
