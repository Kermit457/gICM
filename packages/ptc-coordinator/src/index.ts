/**
 * @gicm/ptc-coordinator
 *
 * Programmatic Tool Calling (PTC) Coordinator
 *
 * Orchestrate gICM agents via generated code pipelines instead of
 * individual tool calls. Achieves 37% token reduction by batching
 * tool invocations and only surfacing final results.
 *
 * @example
 * ```typescript
 * import { PTCCoordinator, PIPELINE_TEMPLATES } from '@gicm/ptc-coordinator';
 *
 * const coordinator = new PTCCoordinator();
 *
 * // Register tools
 * coordinator.registerTool(
 *   { name: 'hunter', description: '...', input_schema: {...} },
 *   async (inputs, context) => {
 *     // Tool implementation
 *   }
 * );
 *
 * // Execute a pipeline
 * const result = await coordinator.execute(
 *   PIPELINE_TEMPLATES['research-and-analyze'],
 *   { query: 'Solana memecoins' }
 * );
 * ```
 */

export { PTCCoordinator } from './coordinator.js';

export type {
  // Pipeline types
  Pipeline,
  PipelineStep,
  PipelineResult,
  StepResult,
  SharedContext,
  ValidationResult,

  // Tool types
  ToolDefinition,
  ToolHandler,
  ToolRegistry,

  // Config
  PTCConfig,
  PTCEvents,
} from './types.js';

export {
  DEFAULT_PTC_CONFIG,

  // Schemas for validation
  PipelineSchema,
  PipelineStepSchema,
  ToolDefinitionSchema,
  SharedContextSchema,
  StepResultSchema,
  PipelineResultSchema,
  ValidationResultSchema,
} from './types.js';

export {
  // Templates
  PIPELINE_TEMPLATES,
  getTemplate,
  listTemplates,
  listTemplatesByCategory,

  // Individual templates
  researchAndAnalyze,
  swapToken,
  contentGeneration,
  securityAudit,
  portfolioAnalysis,
} from './templates/index.js';

// Tool handlers for gICM engines
export {
  // Hunter Agent tools
  hunterTools,
  hunterToolDefinition,
  hunterScoreToolDefinition,
  hunterFilterToolDefinition,

  // Money Engine tools
  moneyEngineTools,
  dcaTradeToolDefinition,
  treasuryStatusToolDefinition,
  expenseStatusToolDefinition,
  healthCheckToolDefinition,

  // Growth Engine tools
  growthEngineTools,
  blogGenerateToolDefinition,
  tweetGenerateToolDefinition,
  keywordResearchToolDefinition,
  seoAnalyzeToolDefinition,
  contentCalendarToolDefinition,
  discordAnnounceToolDefinition,

  // Autonomy tools
  autonomyTools,
  classifyRiskToolDefinition,
  checkApprovalToolDefinition,
  checkBoundariesToolDefinition,
  logAuditToolDefinition,
  autonomyStatusToolDefinition,

  // Utility functions
  getAllToolDefinitions,
  createAllHandlers,
  toolCategories,
  pipelineTemplates,
} from './tools/index.js';
