/**
 * High Availability Module
 * Phase 12A: Multi-Region Support
 */

// Types & Schemas
export {
  // Region
  RegionSchema,
  type Region,
  RegionStatusSchema,
  type RegionStatus,
  RegionConfigSchema,
  type RegionConfig,

  // Health Check
  HealthCheckTypeSchema,
  type HealthCheckType,
  HealthCheckResultSchema,
  type HealthCheckResult,
  HealthCheckConfigSchema,
  type HealthCheckConfig,

  // Load Balancing
  LoadBalanceStrategySchema,
  type LoadBalanceStrategy,
  RouteDecisionSchema,
  type RouteDecision,

  // Failover
  FailoverModeSchema,
  type FailoverMode,
  FailoverEventSchema,
  type FailoverEvent,
  FailoverConfigSchema,
  type FailoverConfig,

  // Replication
  ReplicationModeSchema,
  type ReplicationMode,
  ReplicationStatusSchema,
  type ReplicationStatus,
  ReplicationConfigSchema,
  type ReplicationConfig,

  // Session Affinity
  SessionAffinitySchema,
  type SessionAffinity,

  // Manager Config
  HAManagerConfigSchema,
  type HAManagerConfig,

  // State
  HAStateSchema,
  type HAState,

  // Events
  type HAEvents,

  // Constants
  REGION_DISPLAY_NAMES,
  DEFAULT_HEALTH_CHECK_CONFIG,
  DEFAULT_FAILOVER_CONFIG,
} from "./types.js";

// Health Checker
export {
  HealthChecker,
  getHealthChecker,
  createHealthChecker,
} from "./health-checker.js";

// Load Balancer
export {
  LoadBalancer,
  getLoadBalancer,
  createLoadBalancer,
} from "./load-balancer.js";

// Failover Manager
export {
  FailoverManager,
  getFailoverManager,
  createFailoverManager,
} from "./failover-manager.js";

// HA Manager
export {
  HAManager,
  getHAManager,
  createHAManager,
  DEFAULT_HA_CONFIG,
} from "./ha-manager.js";
