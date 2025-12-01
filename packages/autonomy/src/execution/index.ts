/**
 * Execution Module for Level 2 Autonomy
 *
 * Components for safe action execution with rollback support
 */

export {
  AutoExecutor,
  type AutoExecutorConfig,
  type AutoExecutorEvents,
} from "./auto-executor.js";
export { SafeActions, type ActionHandler, type SafeActionsConfig } from "./safe-actions.js";
export {
  RollbackManager,
  type RollbackHandler,
  type RollbackManagerConfig,
} from "./rollback-manager.js";
