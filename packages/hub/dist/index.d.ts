import { EventEmitter } from 'eventemitter3';
import { HyperBrain } from '@gicm/hyper-brain';

/**
 * gICM Hub Shared Types
 */
type EngineName = "orchestrator" | "money" | "growth" | "product" | "brain";
type EngineStatus = "starting" | "running" | "paused" | "stopped" | "error";
interface EngineState {
    name: EngineName;
    status: EngineStatus;
    health: {
        status: "healthy" | "degraded" | "unhealthy";
        lastCheck: number;
        uptime: number;
        errors: number;
    };
    metrics: {
        tasksCompleted: number;
        tasksPerHour: number;
        avgTaskDuration: number;
    };
    connected: boolean;
    lastHeartbeat: number;
    version: string;
}
interface EngineCommand {
    engine: EngineName;
    command: "start" | "stop" | "pause" | "resume" | "restart";
    params?: Record<string, unknown>;
}
type EventCategory = "system" | "orchestrator" | "money" | "growth" | "product" | "brain" | "integration";
interface HubEvent {
    id: string;
    timestamp: number;
    source: EngineName | "hub";
    category: EventCategory;
    type: string;
    data: Record<string, unknown>;
    correlationId?: string;
    causationId?: string;
    processed: boolean;
    processedBy: string[];
}
interface Workflow {
    id: string;
    name: string;
    description: string;
    trigger: WorkflowTrigger;
    steps: WorkflowStep[];
    status: "active" | "paused" | "disabled";
    executions: number;
    lastExecuted?: number;
    avgDuration: number;
}
interface WorkflowTrigger {
    type: "event" | "schedule" | "manual";
    eventType?: string;
    eventFilter?: Record<string, unknown>;
    schedule?: string;
}
interface WorkflowStep {
    id: string;
    name: string;
    engine: EngineName;
    action: string;
    params: Record<string, unknown>;
    condition?: string;
    onError: "continue" | "stop" | "retry";
    retries?: number;
    timeout: number;
}
interface WorkflowExecution {
    id: string;
    workflowId: string;
    triggeredBy: string;
    triggerData?: Record<string, unknown>;
    status: "running" | "completed" | "failed" | "cancelled";
    currentStep: number;
    stepResults: StepResult[];
    startedAt: number;
    completedAt?: number;
    duration?: number;
}
interface StepResult {
    stepId: string;
    status: "success" | "failed" | "skipped";
    output?: unknown;
    error?: string;
    duration: number;
}
interface HubState {
    system: {
        startedAt: number;
        uptime: number;
        version: string;
    };
    engines: Record<EngineName, EngineState | undefined>;
    metrics: {
        eventsProcessed: number;
        workflowsExecuted: number;
        apiRequests: number;
        errors: number;
    };
    activity: {
        activeWorkflows: number;
        pendingTasks: number;
        recentEvents: HubEvent[];
    };
}
interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    timestamp: number;
}
interface WebSocketMessage {
    type: "event" | "state" | "command" | "response";
    payload: unknown;
    timestamp: number;
}

/**
 * Base Engine Connector
 */

declare abstract class EngineConnector {
    protected name: EngineName;
    protected state: EngineState;
    protected eventHandlers: ((type: string, data: Record<string, unknown>) => void)[];
    protected stateHandlers: ((state: EngineState) => void)[];
    constructor(name: EngineName);
    private initState;
    abstract connect(): Promise<void>;
    abstract disconnect(): Promise<void>;
    abstract sendCommand(command: string, params?: Record<string, unknown>): Promise<void>;
    abstract healthCheck(): Promise<boolean>;
    getState(): EngineState;
    onEvent(handler: (type: string, data: Record<string, unknown>) => void): void;
    onStateChange(handler: (state: EngineState) => void): void;
    protected emitEvent(type: string, data: Record<string, unknown>): void;
    protected updateState(updates: Partial<EngineState>): void;
}

/**
 * HYPER BRAIN Engine Connector
 *
 * Connects HYPER BRAIN to the Integration Hub.
 */

declare class HyperBrainConnector extends EngineConnector {
    private brain;
    private apiUrl;
    constructor(apiUrl?: string);
    /**
     * Set a direct reference to the HyperBrain instance
     */
    setBrain(brain: HyperBrain): void;
    /**
     * Setup event forwarding from HYPER BRAIN to Hub
     */
    private setupBrainEventForwarding;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    sendCommand(command: string, params?: Record<string, unknown>): Promise<void>;
    healthCheck(): Promise<boolean>;
    /**
     * Get brain stats (direct or via API)
     */
    getStats(): Promise<Record<string, unknown>>;
    /**
     * Search the brain (direct or via API)
     */
    search(query: string, limit?: number): Promise<unknown[]>;
}

/**
 * Engine Manager
 *
 * Manages connections to all gICM engines.
 */

declare class EngineManager {
    private logger;
    private engines;
    constructor();
    /**
     * Register an engine
     */
    registerEngine(name: EngineName, connector: EngineConnector): void;
    /**
     * Get engine state
     */
    getEngineState(name: EngineName): EngineState | undefined;
    /**
     * Get all engine states
     */
    getAllStates(): Record<EngineName, EngineState | undefined>;
    /**
     * Send command to engine
     */
    sendCommand(command: EngineCommand): Promise<boolean>;
    /**
     * Start all engines
     */
    startAll(): Promise<void>;
    /**
     * Stop all engines
     */
    stopAll(): Promise<void>;
    /**
     * Health check all engines
     */
    healthCheck(): Promise<Record<EngineName, boolean>>;
}
/**
 * Mock Engine Connector (for testing/demo)
 */
declare class MockEngineConnector extends EngineConnector {
    constructor(name: EngineName);
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    sendCommand(command: string, params?: Record<string, unknown>): Promise<void>;
    healthCheck(): Promise<boolean>;
}

/**
 * Event Bus
 *
 * Central event system for cross-engine communication.
 */

type EventHandler = (event: HubEvent) => void | Promise<void>;
declare class EventBus extends EventEmitter {
    private logger;
    private handlers;
    private eventLog;
    private maxLogSize;
    constructor();
    /**
     * Publish an event
     */
    publish(source: EngineName | "hub", category: EventCategory, type: string, data: Record<string, unknown>, options?: {
        correlationId?: string;
        causationId?: string;
    }): HubEvent;
    /**
     * Subscribe to events
     */
    subscribe(eventType: string, handler: EventHandler): () => void;
    /**
     * Subscribe to all events from an engine
     */
    subscribeToEngine(engine: EngineName, handler: EventHandler): () => void;
    /**
     * Subscribe to all events in a category
     */
    subscribeToCategory(category: EventCategory, handler: EventHandler): () => void;
    /**
     * Get recent events
     */
    getRecentEvents(count?: number): HubEvent[];
    /**
     * Get events by type
     */
    getEventsByType(type: string, count?: number): HubEvent[];
    /**
     * Get events by source
     */
    getEventsBySource(source: EngineName | "hub", count?: number): HubEvent[];
    /**
     * Clear event log
     */
    clearLog(): void;
    /**
     * Get stats
     */
    getStats(): {
        totalEvents: number;
        eventsBySource: Record<string, number>;
        eventsByCategory: Record<string, number>;
        handlersCount: number;
    };
}
declare const eventBus: EventBus;

/**
 * Cross-Engine Workflows
 *
 * Predefined workflows that coordinate multiple engines.
 */

/**
 * WORKFLOW: New Feature Announcement
 */
declare const NEW_FEATURE_ANNOUNCEMENT: Workflow;
/**
 * WORKFLOW: Profitable Trade Report
 */
declare const PROFITABLE_TRADE_REPORT: Workflow;
/**
 * WORKFLOW: Low Treasury Alert
 */
declare const LOW_TREASURY_ALERT: Workflow;
/**
 * WORKFLOW: Daily Summary
 */
declare const DAILY_SUMMARY: Workflow;
/**
 * WORKFLOW: Competitor Feature Response
 */
declare const COMPETITOR_RESPONSE: Workflow;
/**
 * All predefined workflows
 */
declare const PREDEFINED_WORKFLOWS: Workflow[];

/**
 * API Server
 *
 * REST + WebSocket API for Dashboard and external access.
 */

declare class ApiServer {
    private app;
    private logger;
    private wsClients;
    private getState;
    constructor(getState: () => HubState);
    start(port?: number): Promise<void>;
    stop(): Promise<void>;
    private setupRoutes;
    private setupWebSocket;
    private handleWsMessage;
    private broadcast;
}

/**
 * Unified System Starter
 *
 * Boots all gICM engines and wires them to the Integration Hub.
 */

interface UnifiedSystemConfig {
    hubPort: number;
    brainPort: number;
    enableBrain: boolean;
    mockOtherEngines: boolean;
    verbose: boolean;
}
declare class UnifiedSystem {
    private config;
    private logger;
    private hub;
    private brain;
    private brainApi;
    private isRunning;
    constructor(config?: Partial<UnifiedSystemConfig>);
    /**
     * Start the unified system
     */
    start(): Promise<void>;
    /**
     * Stop the unified system
     */
    stop(): Promise<void>;
    /**
     * Start HYPER BRAIN
     */
    private startBrain;
    /**
     * Wire HYPER BRAIN to Hub
     */
    private wireBrainToHub;
    /**
     * Get Hub instance
     */
    getHub(): IntegrationHub;
    /**
     * Get HYPER BRAIN instance
     */
    getBrain(): HyperBrain | null;
    /**
     * Print system status
     */
    printStatus(): void;
}

interface HubConfig {
    apiPort: number;
    enableApi: boolean;
    enableWorkflows: boolean;
    mockEngines?: boolean;
}
declare class IntegrationHub {
    private config;
    private logger;
    private engineManager;
    private apiServer;
    private workflows;
    private state;
    private isRunning;
    private startTime;
    constructor(config?: Partial<HubConfig>);
    private initState;
    private registerMockEngines;
    /**
     * Start the hub
     */
    start(): Promise<void>;
    /**
     * Stop the hub
     */
    stop(): Promise<void>;
    /**
     * Setup event handlers
     */
    private setupEventHandlers;
    /**
     * Check if event triggers any workflow
     */
    private checkWorkflowTriggers;
    /**
     * Execute a workflow
     */
    private executeWorkflow;
    /**
     * Get current state
     */
    getState(): HubState;
    /**
     * Get event bus instance
     */
    getEventBus(): EventBus;
    /**
     * Get engine manager
     */
    getEngineManager(): EngineManager;
    /**
     * Print status
     */
    printStatus(): void;
}

export { type ApiResponse, ApiServer, COMPETITOR_RESPONSE, DAILY_SUMMARY, type EngineCommand, EngineConnector, EngineManager, type EngineName, type EngineState, type EngineStatus, EventBus, type EventCategory, type HubConfig, type HubEvent, type HubState, HyperBrainConnector, IntegrationHub, LOW_TREASURY_ALERT, MockEngineConnector, NEW_FEATURE_ANNOUNCEMENT, PREDEFINED_WORKFLOWS, PROFITABLE_TRADE_REPORT, type StepResult, UnifiedSystem, type WebSocketMessage, type Workflow, type WorkflowExecution, type WorkflowStep, type WorkflowTrigger, eventBus };
