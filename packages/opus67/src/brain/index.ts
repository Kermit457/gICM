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

export {
  HybridReasoningEngine,
  createReasoningEngine,
  getReasoningEngine,
  type ThinkingMode,
  type ComplexityLevel,
  type ReasoningConfig,
  type ComplexityAnalysis,
  type ReasoningRequest,
  type ReasoningResponse
} from './reasoning.js';

export {
  PromptCacheManager,
  createPromptCache,
  getPromptCache,
  type CacheConfig,
  type CacheStatistics,
  type CachedPromptRequest,
  type CachedPromptResponse
} from '../cache/prompt-cache.js';

export {
  FileContextManager,
  createFileContext,
  getFileContext,
  type FileMetadata,
  type RelationType,
  type FileRelationship,
  type ConsistencyCheck,
  type FileContextConfig
} from './file-context.js';

export {
  SWEBenchPatterns,
  createSWEBenchPatterns,
  type EditLocation,
  type EditOperation,
  type MultiFileEdit,
  type EditResult,
  type SearchPattern,
  type SearchResult,
  type SWEBenchConfig
} from './swe-bench-patterns.js';

export {
  LongHorizonPlanner,
  createLongHorizonPlanner,
  type TaskStatus,
  type TaskType,
  type TaskNode,
  type Plan,
  type PlanningConfig,
  type ExecutionContext,
  type TaskExecutor
} from './long-horizon-planning.js';

export {
  VerificationLoop,
  createVerificationLoop,
  type VerificationType,
  type VerificationStatus,
  type VerificationStrategy,
  type VerificationRule,
  type VerificationContext,
  type VerificationRuleResult,
  type VerificationResult,
  type VerificationConfig
} from './verification-loops.js';

export {
  UnifiedBrain,
  createUnifiedBrain,
  type UnifiedBrainConfig,
  type ThinkRequest,
  type ThinkResponse,
  type EditCodeRequest,
  type EditCodeResponse,
  type PlanTaskRequest,
  type PlanTaskResponse,
  type DiscoverToolsRequest,
  type BrainStats
} from './unified-api.js';
