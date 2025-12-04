/**
 * OPUS 67 v5.0 - Phase 3B: Long-Horizon Planning
 *
 * Multi-step task planning with dependency tracking, adaptive replanning,
 * and resource estimation for complex software engineering tasks.
 *
 * Inspired by:
 * - SWE-Agent's planning strategies
 * - OpenDevin's task decomposition
 * - Codex/GPT-4's multi-step reasoning
 */

import { EventEmitter } from 'eventemitter3';
import crypto from 'crypto';

// ============================================================================
// Types
// ============================================================================

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'blocked' | 'skipped';

export type TaskType =
  | 'research'        // Gather information
  | 'design'          // Create design/architecture
  | 'implement'       // Write code
  | 'test'            // Write/run tests
  | 'refactor'        // Refactor existing code
  | 'debug'           // Fix bugs
  | 'deploy'          // Deploy changes
  | 'verify'          // Verify correctness
  | 'document';       // Write documentation

export interface TaskNode {
  id: string;
  description: string;
  type: TaskType;
  status: TaskStatus;
  dependencies: string[]; // IDs of tasks that must complete first
  estimatedComplexity: number; // 1-10 scale
  estimatedTokens?: number;
  estimatedTimeSec?: number;
  actualTimeSec?: number;
  result?: unknown;
  error?: string;
  retries: number;
  maxRetries: number;
  context?: Record<string, unknown>;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export interface Plan {
  id: string;
  goal: string;
  tasks: Map<string, TaskNode>;
  rootTasks: string[]; // Tasks with no dependencies
  totalEstimatedComplexity: number;
  totalEstimatedTokens: number;
  totalEstimatedTimeSec: number;
  status: 'planning' | 'executing' | 'completed' | 'failed';
  currentTask?: string;
  progress: {
    completed: number;
    failed: number;
    total: number;
    percentComplete: number;
  };
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  adaptations: Array<{
    timestamp: Date;
    reason: string;
    changes: string;
  }>;
}

export interface PlanningConfig {
  maxTasksPerPlan: number;
  maxDependencyDepth: number;
  enableAdaptivePlanning: boolean;
  enableParallelExecution: boolean;
  defaultMaxRetries: number;
  complexityWeights: {
    research: number;
    design: number;
    implement: number;
    test: number;
    refactor: number;
    debug: number;
    deploy: number;
    verify: number;
    document: number;
  };
}

export interface ExecutionContext {
  planId: string;
  taskId: string;
  dependencies: Map<string, unknown>; // Results from dependent tasks
  attempt: number;
  budget?: {
    remainingTokens: number;
    remainingTimeSec: number;
  };
}

export type TaskExecutor = (task: TaskNode, context: ExecutionContext) => Promise<unknown>;

interface PlannerEvents {
  'plan:created': (plan: Plan) => void;
  'plan:started': (planId: string) => void;
  'plan:adapted': (planId: string, reason: string) => void;
  'plan:completed': (planId: string, success: boolean) => void;
  'task:started': (planId: string, taskId: string) => void;
  'task:progress': (planId: string, taskId: string, progress: number) => void;
  'task:completed': (planId: string, taskId: string, result: unknown) => void;
  'task:failed': (planId: string, taskId: string, error: string) => void;
  'task:retrying': (planId: string, taskId: string, attempt: number) => void;
  'error': (error: Error) => void;
}

// ============================================================================
// LongHorizonPlanner - Multi-Step Task Planning & Execution
// ============================================================================

export class LongHorizonPlanner extends EventEmitter<PlannerEvents> {
  private config: PlanningConfig;
  private plans: Map<string, Plan> = new Map();
  private taskExecutor?: TaskExecutor;

  constructor(config?: Partial<PlanningConfig>, executor?: TaskExecutor) {
    super();
    this.config = {
      maxTasksPerPlan: 50,
      maxDependencyDepth: 10,
      enableAdaptivePlanning: true,
      enableParallelExecution: true,
      defaultMaxRetries: 3,
      complexityWeights: {
        research: 3,
        design: 5,
        implement: 8,
        test: 4,
        refactor: 6,
        debug: 7,
        deploy: 5,
        verify: 3,
        document: 2
      },
      ...config
    };
    this.taskExecutor = executor;
  }

  // ==========================================================================
  // Planning
  // ==========================================================================

  /**
   * Create a new plan from a goal
   */
  createPlan(goal: string, tasks: Omit<TaskNode, 'id' | 'status' | 'retries' | 'createdAt'>[]): Plan {
    const planId = this.generateId();

    // Validate task count
    if (tasks.length > this.config.maxTasksPerPlan) {
      throw new Error(`Plan exceeds max tasks: ${tasks.length} > ${this.config.maxTasksPerPlan}`);
    }

    // Create task nodes
    const taskMap = new Map<string, TaskNode>();
    for (const taskData of tasks) {
      const taskId = this.generateId();
      const task: TaskNode = {
        id: taskId,
        status: 'pending',
        retries: 0,
        createdAt: new Date(),
        ...taskData
      };
      taskMap.set(taskId, task);
    }

    // Validate dependencies
    this.validateDependencies(taskMap);

    // Find root tasks (no dependencies)
    const rootTasks: string[] = [];
    for (const [taskId, task] of taskMap) {
      if (task.dependencies.length === 0) {
        rootTasks.push(taskId);
      }
    }

    if (rootTasks.length === 0 && taskMap.size > 0) {
      throw new Error('Plan has no root tasks (circular dependencies?)');
    }

    // Calculate estimates
    let totalComplexity = 0;
    let totalTokens = 0;
    let totalTime = 0;

    for (const task of taskMap.values()) {
      totalComplexity += task.estimatedComplexity;
      totalTokens += task.estimatedTokens || 0;
      totalTime += task.estimatedTimeSec || 0;
    }

    const plan: Plan = {
      id: planId,
      goal,
      tasks: taskMap,
      rootTasks,
      totalEstimatedComplexity: totalComplexity,
      totalEstimatedTokens: totalTokens,
      totalEstimatedTimeSec: totalTime,
      status: 'planning',
      progress: {
        completed: 0,
        failed: 0,
        total: taskMap.size,
        percentComplete: 0
      },
      createdAt: new Date(),
      adaptations: []
    };

    this.plans.set(planId, plan);
    this.emit('plan:created', plan);

    return plan;
  }

  /**
   * Validate task dependencies
   */
  private validateDependencies(tasks: Map<string, TaskNode>): void {
    // Check that all dependency IDs exist
    for (const task of tasks.values()) {
      for (const depId of task.dependencies) {
        if (!tasks.has(depId)) {
          throw new Error(`Task ${task.id} depends on non-existent task: ${depId}`);
        }
      }
    }

    // Check for circular dependencies using DFS
    const visited = new Set<string>();
    const stack = new Set<string>();

    const hasCycle = (taskId: string): boolean => {
      if (stack.has(taskId)) return true;
      if (visited.has(taskId)) return false;

      visited.add(taskId);
      stack.add(taskId);

      const task = tasks.get(taskId)!;
      for (const depId of task.dependencies) {
        if (hasCycle(depId)) {
          return true;
        }
      }

      stack.delete(taskId);
      return false;
    };

    for (const taskId of tasks.keys()) {
      if (hasCycle(taskId)) {
        throw new Error('Circular dependency detected in plan');
      }
    }

    // Check dependency depth
    const getDepth = (taskId: string, depth = 0): number => {
      if (depth > this.config.maxDependencyDepth) {
        throw new Error(`Dependency depth exceeds max: ${depth} > ${this.config.maxDependencyDepth}`);
      }

      const task = tasks.get(taskId)!;
      if (task.dependencies.length === 0) {
        return depth;
      }

      const depths = task.dependencies.map(depId => getDepth(depId, depth + 1));
      return Math.max(...depths);
    };

    for (const taskId of tasks.keys()) {
      getDepth(taskId);
    }
  }

  /**
   * Add a task to an existing plan
   */
  addTask(
    planId: string,
    task: Omit<TaskNode, 'id' | 'status' | 'retries' | 'createdAt'>
  ): string {
    const plan = this.plans.get(planId);
    if (!plan) {
      throw new Error(`Plan not found: ${planId}`);
    }

    if (plan.status !== 'planning') {
      throw new Error('Cannot add tasks to a plan that is already executing');
    }

    const taskId = this.generateId();
    const taskNode: TaskNode = {
      id: taskId,
      status: 'pending',
      retries: 0,
      createdAt: new Date(),
      ...task
    };

    plan.tasks.set(taskId, taskNode);
    plan.progress.total++;

    // Update root tasks if this task has no dependencies
    if (taskNode.dependencies.length === 0) {
      plan.rootTasks.push(taskId);
    }

    // Revalidate dependencies
    this.validateDependencies(plan.tasks);

    // Update estimates
    plan.totalEstimatedComplexity += taskNode.estimatedComplexity;
    plan.totalEstimatedTokens += taskNode.estimatedTokens || 0;
    plan.totalEstimatedTimeSec += taskNode.estimatedTimeSec || 0;

    return taskId;
  }

  /**
   * Adapt a plan by adding/modifying tasks
   */
  adaptPlan(planId: string, reason: string, changes: () => void): void {
    if (!this.config.enableAdaptivePlanning) {
      throw new Error('Adaptive planning is disabled');
    }

    const plan = this.plans.get(planId);
    if (!plan) {
      throw new Error(`Plan not found: ${planId}`);
    }

    changes();

    plan.adaptations.push({
      timestamp: new Date(),
      reason,
      changes: 'Dynamic adaptation performed'
    });

    this.emit('plan:adapted', planId, reason);
  }

  // ==========================================================================
  // Execution
  // ==========================================================================

  /**
   * Execute a plan
   */
  async executePlan(planId: string): Promise<boolean> {
    const plan = this.plans.get(planId);
    if (!plan) {
      throw new Error(`Plan not found: ${planId}`);
    }

    if (!this.taskExecutor) {
      throw new Error('No task executor configured');
    }

    plan.status = 'executing';
    plan.startedAt = new Date();
    this.emit('plan:started', planId);

    try {
      await this.executeTasksRecursive(plan, plan.rootTasks);

      plan.status = 'completed';
      plan.completedAt = new Date();
      plan.progress.percentComplete = 100;

      const success = plan.progress.failed === 0;
      this.emit('plan:completed', planId, success);

      return success;
    } catch (error) {
      plan.status = 'failed';
      plan.completedAt = new Date();
      this.emit('error', error instanceof Error ? error : new Error(String(error)));
      this.emit('plan:completed', planId, false);
      return false;
    }
  }

  /**
   * Execute tasks recursively with dependency resolution
   */
  private async executeTasksRecursive(plan: Plan, taskIds: string[]): Promise<void> {
    if (taskIds.length === 0) return;

    // Execute tasks in parallel if enabled
    if (this.config.enableParallelExecution) {
      await Promise.all(taskIds.map(taskId => this.executeTask(plan, taskId)));
    } else {
      for (const taskId of taskIds) {
        await this.executeTask(plan, taskId);
      }
    }

    // Find next tasks to execute (tasks whose dependencies are all completed)
    const nextTasks: string[] = [];
    for (const [taskId, task] of plan.tasks) {
      if (task.status === 'pending') {
        const allDepsCompleted = task.dependencies.every(depId => {
          const dep = plan.tasks.get(depId);
          return dep?.status === 'completed';
        });

        if (allDepsCompleted) {
          nextTasks.push(taskId);
        }
      }
    }

    if (nextTasks.length > 0) {
      await this.executeTasksRecursive(plan, nextTasks);
    }
  }

  /**
   * Execute a single task with retry logic
   */
  private async executeTask(plan: Plan, taskId: string): Promise<void> {
    const task = plan.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    if (task.status !== 'pending') {
      return; // Task already processed
    }

    task.status = 'in_progress';
    task.startedAt = new Date();
    plan.currentTask = taskId;
    this.emit('task:started', plan.id, taskId);

    // Gather results from dependencies
    const dependencyResults = new Map<string, unknown>();
    for (const depId of task.dependencies) {
      const dep = plan.tasks.get(depId);
      if (dep?.result !== undefined) {
        dependencyResults.set(depId, dep.result);
      }
    }

    // Create execution context
    const context: ExecutionContext = {
      planId: plan.id,
      taskId: task.id,
      dependencies: dependencyResults,
      attempt: task.retries + 1
    };

    // Execute with retries
    let lastError: string | undefined;
    while (task.retries <= task.maxRetries) {
      try {
        const result = await this.taskExecutor!(task, context);

        task.status = 'completed';
        task.result = result;
        task.completedAt = new Date();
        task.actualTimeSec = (task.completedAt.getTime() - task.startedAt!.getTime()) / 1000;

        plan.progress.completed++;
        plan.progress.percentComplete = Math.round(
          (plan.progress.completed / plan.progress.total) * 100
        );

        this.emit('task:completed', plan.id, taskId, result);
        return;
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
        task.retries++;

        if (task.retries <= task.maxRetries) {
          this.emit('task:retrying', plan.id, taskId, task.retries);
          context.attempt = task.retries + 1;
        }
      }
    }

    // All retries exhausted
    task.status = 'failed';
    task.error = lastError;
    task.completedAt = new Date();
    task.actualTimeSec = (task.completedAt.getTime() - task.startedAt!.getTime()) / 1000;

    plan.progress.failed++;
    plan.progress.percentComplete = Math.round(
      ((plan.progress.completed + plan.progress.failed) / plan.progress.total) * 100
    );

    this.emit('task:failed', plan.id, taskId, lastError || 'Unknown error');

    // Mark dependent tasks as blocked
    this.markDependentsAsBlocked(plan, taskId);
  }

  /**
   * Mark all tasks that depend on a failed task as blocked
   */
  private markDependentsAsBlocked(plan: Plan, failedTaskId: string): void {
    for (const task of plan.tasks.values()) {
      if (task.dependencies.includes(failedTaskId) && task.status === 'pending') {
        task.status = 'blocked';
      }
    }
  }

  // ==========================================================================
  // Utilities
  // ==========================================================================

  /**
   * Get a plan
   */
  getPlan(planId: string): Plan | undefined {
    return this.plans.get(planId);
  }

  /**
   * Get all plans
   */
  getAllPlans(): Plan[] {
    return Array.from(this.plans.values());
  }

  /**
   * Set task executor
   */
  setExecutor(executor: TaskExecutor): void {
    this.taskExecutor = executor;
  }

  /**
   * Get task execution order (topological sort)
   */
  getExecutionOrder(planId: string): string[] {
    const plan = this.plans.get(planId);
    if (!plan) return [];

    const order: string[] = [];
    const visited = new Set<string>();

    const visit = (taskId: string) => {
      if (visited.has(taskId)) return;
      visited.add(taskId);

      const task = plan.tasks.get(taskId)!;
      for (const depId of task.dependencies) {
        visit(depId);
      }

      order.push(taskId);
    };

    for (const taskId of plan.tasks.keys()) {
      visit(taskId);
    }

    return order;
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return crypto.randomBytes(8).toString('hex');
  }
}

// ============================================================================
// Factory
// ============================================================================

export function createLongHorizonPlanner(
  config?: Partial<PlanningConfig>,
  executor?: TaskExecutor
): LongHorizonPlanner {
  return new LongHorizonPlanner(config, executor);
}
