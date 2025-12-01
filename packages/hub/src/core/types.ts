/**
 * gICM Hub Shared Types
 */

// ============================================================================
// ENGINES
// ============================================================================

export type EngineName = "orchestrator" | "money" | "growth" | "product" | "brain";
export type EngineStatus = "starting" | "running" | "paused" | "stopped" | "error";

export interface EngineState {
  name: EngineName;
  status: EngineStatus;

  // Health
  health: {
    status: "healthy" | "degraded" | "unhealthy";
    lastCheck: number;
    uptime: number;
    errors: number;
  };

  // Metrics
  metrics: {
    tasksCompleted: number;
    tasksPerHour: number;
    avgTaskDuration: number;
  };

  // Connection
  connected: boolean;
  lastHeartbeat: number;

  // Version
  version: string;
}

export interface EngineCommand {
  engine: EngineName;
  command: "start" | "stop" | "pause" | "resume" | "restart";
  params?: Record<string, unknown>;
}

// ============================================================================
// EVENTS
// ============================================================================

export type EventCategory =
  | "system"
  | "orchestrator"
  | "money"
  | "growth"
  | "product"
  | "brain"
  | "integration";

export interface HubEvent {
  id: string;
  timestamp: number;

  // Source
  source: EngineName | "hub";
  category: EventCategory;

  // Event
  type: string;
  data: Record<string, unknown>;

  // Metadata
  correlationId?: string;
  causationId?: string;

  // Processing
  processed: boolean;
  processedBy: string[];
}

// ============================================================================
// WORKFLOWS
// ============================================================================

export interface Workflow {
  id: string;
  name: string;
  description: string;

  // Trigger
  trigger: WorkflowTrigger;

  // Steps
  steps: WorkflowStep[];

  // Status
  status: "active" | "paused" | "disabled";

  // Stats
  executions: number;
  lastExecuted?: number;
  avgDuration: number;
}

export interface WorkflowTrigger {
  type: "event" | "schedule" | "manual";

  // Event trigger
  eventType?: string;
  eventFilter?: Record<string, unknown>;

  // Schedule trigger
  schedule?: string;  // Cron expression
}

export interface WorkflowStep {
  id: string;
  name: string;

  // Target
  engine: EngineName;
  action: string;
  params: Record<string, unknown>;

  // Conditions
  condition?: string;

  // Error handling
  onError: "continue" | "stop" | "retry";
  retries?: number;

  // Timeout
  timeout: number;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;

  // Trigger
  triggeredBy: string;
  triggerData?: Record<string, unknown>;

  // Status
  status: "running" | "completed" | "failed" | "cancelled";
  currentStep: number;

  // Results
  stepResults: StepResult[];

  // Timing
  startedAt: number;
  completedAt?: number;
  duration?: number;
}

export interface StepResult {
  stepId: string;
  status: "success" | "failed" | "skipped";
  output?: unknown;
  error?: string;
  duration: number;
}

// ============================================================================
// STATE
// ============================================================================

export interface HubState {
  // System
  system: {
    startedAt: number;
    uptime: number;
    version: string;
  };

  // Engines
  engines: Record<EngineName, EngineState | undefined>;

  // Metrics
  metrics: {
    eventsProcessed: number;
    workflowsExecuted: number;
    apiRequests: number;
    errors: number;
  };

  // Current activity
  activity: {
    activeWorkflows: number;
    pendingTasks: number;
    recentEvents: HubEvent[];
  };
}

// ============================================================================
// API
// ============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

export interface WebSocketMessage {
  type: "event" | "state" | "command" | "response";
  payload: unknown;
  timestamp: number;
}
