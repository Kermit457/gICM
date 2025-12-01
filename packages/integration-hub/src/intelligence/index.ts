/**
 * Intelligence Module
 * Phase 10: Intelligence & Automation
 */

// Types & Schemas
export {
  // Suggestion types
  SuggestionTypeSchema,
  type SuggestionType,
  SuggestionPrioritySchema,
  type SuggestionPriority,
  SuggestionStatusSchema,
  type SuggestionStatus,
  SuggestionSchema,
  type Suggestion,

  // Similar pipeline
  SimilarPipelineSchema,
  type SimilarPipeline,

  // Optimization
  OptimizationCategorySchema,
  type OptimizationCategory,
  OptimizationSchema,
  type Optimization,

  // Error patterns & auto-fix
  ErrorPatternSchema,
  type ErrorPattern,
  AutoFixSchema,
  type AutoFix,

  // Analysis
  PipelineAnalysisSchema,
  type PipelineAnalysis,

  // Config
  IntelligenceConfigSchema,
  type IntelligenceConfig,

  // Events
  type IntelligenceEvents,

  // Constants
  OPTIMIZATION_TEMPLATES,
  COMMON_ERROR_PATTERNS,
} from "./types.js";

// Suggestion Engine
export {
  SuggestionEngine,
  getSuggestionEngine,
  createSuggestionEngine,
} from "./suggestion-engine.js";

// Anomaly Detector
export {
  AnomalyDetector,
  getAnomalyDetector,
  createAnomalyDetector,

  // Types
  AnomalyTypeSchema,
  type AnomalyType,
  AnomalySeveritySchema,
  type AnomalySeverity,
  AnomalyStatusSchema,
  type AnomalyStatus,
  AnomalySchema,
  type Anomaly,
  IncidentSchema,
  type Incident,
  AnomalyDetectorConfigSchema,
  type AnomalyDetectorConfig,
  type AnomalyDetectorEvents,
} from "./anomaly-detector.js";

// Natural Language Builder
export {
  NLBuilder,
  getNLBuilder,
  createNLBuilder,

  // Types
  NLRequestSchema,
  type NLRequest,
  GeneratedStepSchema,
  type GeneratedStep,
  GeneratedPipelineSchema,
  type GeneratedPipeline,
  RefinementSchema,
  type Refinement,
  ConversationMessageSchema,
  type ConversationMessage,
  BuilderSessionSchema,
  type BuilderSession,
  NLBuilderConfigSchema,
  type NLBuilderConfig,
  type NLBuilderEvents,
} from "./nl-builder.js";

// Predictive Analytics
export {
  PredictiveAnalytics,
  getPredictiveAnalytics,
  createPredictiveAnalytics,

  // Types
  PredictionTypeSchema,
  type PredictionType,
  PredictionConfidenceSchema,
  type PredictionConfidence,
  PredictionSchema,
  type Prediction,
  ForecastSchema,
  type Forecast,
  CapacityPlanSchema,
  type CapacityPlan,
  UsageTrendSchema,
  type UsageTrend,
  PredictiveAnalyticsConfigSchema,
  type PredictiveAnalyticsConfig,
  type PredictiveAnalyticsEvents,
} from "./predictive-analytics.js";
