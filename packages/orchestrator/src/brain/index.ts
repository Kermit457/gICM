/**
 * gICM Brain - The autonomous control center
 *
 * Exports:
 * - GoalSystem: Core values, metrics, decision thresholds
 * - DailyCycle: Autonomous daily operating schedule
 * - GicmBrain: Main autonomous controller
 * - SignalProcessor: Hunter discovery -> trading signal conversion
 * - Adapters: Engine connectors
 */

export {
  GoalSystemManager,
  goalSystem,
  type GoalSystem,
  type CoreValue,
  type MetricTarget,
  type Competitor,
} from "./goal-system.js";

export {
  DailyCycleManager,
  dailyCycle,
  type PhaseType,
  type PhaseResult,
  type ActionLog,
  type DailyCycleConfig,
  type EngineConnections,
} from "./daily-cycle.js";

export {
  GicmBrain,
  createGicmBrain,
  type GicmBrainConfig,
  type BrainStatus,
} from "./gicm-brain.js";

export {
  SignalProcessor,
  signalProcessor,
  type SignalType,
  type TradingSignal,
  type SignalBatch,
} from "./signal-processor.js";

export {
  createHunterAdapter,
  HunterAdapter,
  type HunterEngineConnection,
  type HunterAdapterConfig,
  type HunterStatus,
} from "./adapters/index.js";
