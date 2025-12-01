/**
 * Multi-Region Module
 * Phase 15C: Multi-Region Support
 */

// Types & Schemas
export {
  // Region Types
  RegionIdSchema,
  type RegionId,
  RegionStatusSchema,
  type RegionStatus as MultiRegionStatus,
  RegionRoleSchema,
  type RegionRole,
  RegionDefinitionSchema,
  type RegionDefinition,

  // Replication
  ReplicationModeSchema,
  type ReplicationMode as MultiRegionReplicationMode,
  ConflictResolutionSchema,
  type ConflictResolution,
  ReplicationConfigSchema,
  type ReplicationConfig as MultiRegionReplicationConfig,
  ReplicationStatusSchema,
  type ReplicationStatus as MultiRegionReplicationStatus,

  // Conflicts
  ConflictSchema,
  type Conflict as MultiRegionConflict,

  // Routing
  RoutingStrategySchema,
  type RoutingStrategy,
  RoutingRuleSchema,
  type RoutingRule,
  RoutingDecisionSchema,
  type RoutingDecision,

  // Sync
  SyncOperationSchema,
  type SyncOperation,
  SyncBatchSchema,
  type SyncBatch,

  // Health
  RegionHealthSchema,
  type RegionHealth,

  // Failover
  FailoverTriggerSchema,
  type FailoverTrigger,
  FailoverEventSchema,
  type FailoverEvent as MultiRegionFailoverEvent,

  // Config
  MultiRegionConfigSchema,
  type MultiRegionConfig,

  // Events & Interfaces
  type MultiRegionEvents,
  type MultiRegionStorage,

  // Constants
  DEFAULT_REGIONS,
  REPLICATION_LAG_THRESHOLDS,
} from "./types.js";

// Multi-Region Manager
export {
  MultiRegionManager,
  getMultiRegionManager,
  createMultiRegionManager,
} from "./region-manager.js";
