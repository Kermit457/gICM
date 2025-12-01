/**
 * Feature Flags Module
 * Phase 15A: Feature Flags & Progressive Rollouts
 */

// Types & Schemas
export {
  // Flag Types
  FlagTypeSchema,
  type FlagType,
  FlagVariationSchema,
  type FlagVariation,
  FlagStatusSchema,
  type FlagStatus,

  // Operators
  OperatorSchema,
  type Operator,

  // Targeting
  TargetingConditionSchema,
  type TargetingCondition,
  TargetingRuleSchema,
  type TargetingRule,

  // Segments
  SegmentSchema,
  type Segment,
  SegmentRuleSchema,
  type SegmentRule,

  // Rollout
  RolloutWeightSchema,
  type RolloutWeight,
  PercentageRolloutSchema,
  type PercentageRollout,

  // Scheduled
  ScheduledChangeSchema,
  type ScheduledChange,

  // Flag Definition
  FlagDefinitionSchema,
  type FlagDefinition,

  // Evaluation
  EvaluationContextSchema,
  type EvaluationContext,
  EvaluationReasonSchema,
  type EvaluationReason,
  EvaluationResultSchema,
  type EvaluationResult,

  // Analytics
  FlagEvaluationEventSchema,
  type FlagEvaluationEvent,
  FlagStatsSchema,
  type FlagStats,

  // Config
  FlagManagerConfigSchema,
  type FlagManagerConfig,

  // Events & Interfaces
  type FlagEvents,
  type FlagStorage,
  type FlagProvider,

  // Helpers
  createBooleanFlag,
  createStringFlag,
  createPercentageRollout,
  createTargetingRule,
} from "./types.js";

// Feature Flags Manager
export {
  FeatureFlagsManager,
  getFeatureFlagsManager,
  createFeatureFlagsManager,
} from "./feature-flags.js";
