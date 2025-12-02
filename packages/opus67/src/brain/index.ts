/**
 * OPUS 67 BRAIN Module
 * Unified orchestrator for the complete v3 stack
 */

export {
  BrainRuntime,
  brainRuntime,
  createBrainRuntime,
  type BrainConfig,
  type BrainRequest,
  type BrainResponse,
  type BrainStatus
} from './brain-runtime.js';

export {
  BrainAPI,
  brainAPI,
  createBrainAPI,
  type ApiRequest,
  type ApiResponse,
  type WebSocketMessage
} from './brain-api.js';

export {
  createBrainServer,
  startBrainServer,
  type ServerConfig
} from './server.js';
