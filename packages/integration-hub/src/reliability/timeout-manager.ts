/**
 * Timeout Manager
 * Phase 12C: Reliability & Resilience
 */

import { EventEmitter } from "eventemitter3";
import { randomUUID } from "crypto";
import {
  type TimeoutConfig,
  type TimeoutContext,
  type TimeoutResult,
  type TimeoutEvents,
  TimeoutConfigSchema,
} from "./types.js";

// ============================================================================
// Timeout Error
// ============================================================================

export class TimeoutError extends Error {
  constructor(
    public readonly operationId: string,
    public readonly timeout: number,
    public readonly elapsed: number
  ) {
    super(`Operation '${operationId}' timed out after ${elapsed}ms (limit: ${timeout}ms)`);
    this.name = "TimeoutError";
  }
}

// ============================================================================
// Timeout Manager Class
// ============================================================================

export class TimeoutManager extends EventEmitter<TimeoutEvents> {
  private config: Required<TimeoutConfig>;
  private activeContexts: Map<string, TimeoutContext> = new Map();

  constructor(config: Partial<TimeoutConfig> = {}) {
    super();
    this.config = TimeoutConfigSchema.parse(config) as Required<TimeoutConfig>;
  }

  // ============================================================================
  // Public API
  // ============================================================================

  /**
   * Execute a function with timeout
   */
  async execute<T>(
    fn: (signal: AbortSignal) => Promise<T>,
    options?: {
      operationId?: string;
      timeout?: number;
      parentContext?: TimeoutContext;
    }
  ): Promise<T> {
    const operationId = options?.operationId ?? randomUUID();
    const context = this.createContext(operationId, options?.timeout, options?.parentContext);

    this.activeContexts.set(operationId, context);
    this.emit("started", operationId, context.timeout);

    const abortController = new AbortController();
    context.abortController = abortController;

    // Set up timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      const timer = setTimeout(() => {
        abortController.abort();
        const elapsed = Date.now() - context.startTime.getTime();
        this.emit("timedOut", operationId);
        reject(new TimeoutError(operationId, context.timeout, elapsed));
      }, context.timeout);

      // Clean up timer on abort
      abortController.signal.addEventListener("abort", () => {
        clearTimeout(timer);
      });
    });

    try {
      const result = await Promise.race([fn(abortController.signal), timeoutPromise]);

      const elapsed = Date.now() - context.startTime.getTime();
      this.emit("completed", operationId, elapsed);

      return result;
    } finally {
      this.activeContexts.delete(operationId);
    }
  }

  /**
   * Execute with child context (inherits parent timeout budget)
   */
  async executeChild<T>(
    parentContext: TimeoutContext,
    fn: (signal: AbortSignal) => Promise<T>,
    options?: {
      operationId?: string;
      maxTimeout?: number;
    }
  ): Promise<T> {
    const remaining = this.getRemainingTime(parentContext);

    if (remaining <= 0) {
      throw new TimeoutError(
        options?.operationId ?? "child",
        0,
        parentContext.timeout
      );
    }

    // Calculate child timeout (respect budget)
    let childTimeout = remaining;
    if (this.config.cascadingBudget) {
      // Reserve some time for parent cleanup
      const reserve = remaining * (this.config.budgetReservePercent / 100);
      childTimeout = remaining - reserve;
    }

    // Apply max timeout if specified
    if (options?.maxTimeout) {
      childTimeout = Math.min(childTimeout, options.maxTimeout);
    }

    return this.execute(fn, {
      operationId: options?.operationId,
      timeout: childTimeout,
      parentContext,
    });
  }

  /**
   * Create a timeout context without executing
   */
  createContext(
    operationId: string,
    timeout?: number,
    parent?: TimeoutContext
  ): TimeoutContext {
    const now = new Date();
    let effectiveTimeout = timeout ?? this.getTimeout(operationId);

    // If parent exists, limit to remaining parent time
    if (parent) {
      const remaining = this.getRemainingTime(parent);
      effectiveTimeout = Math.min(effectiveTimeout, remaining);
    }

    return {
      operationId,
      parentId: parent?.operationId,
      timeout: effectiveTimeout,
      startTime: now,
      deadline: new Date(now.getTime() + effectiveTimeout),
      remainingMs: effectiveTimeout,
    };
  }

  /**
   * Get remaining time for a context
   */
  getRemainingTime(context: TimeoutContext): number {
    const elapsed = Date.now() - context.startTime.getTime();
    return Math.max(0, context.timeout - elapsed);
  }

  /**
   * Check if context has timed out
   */
  hasTimedOut(context: TimeoutContext): boolean {
    return this.getRemainingTime(context) <= 0;
  }

  /**
   * Cancel an active operation
   */
  cancel(operationId: string): boolean {
    const context = this.activeContexts.get(operationId);
    if (context?.abortController) {
      context.abortController.abort();
      this.activeContexts.delete(operationId);
      this.emit("cancelled", operationId);
      return true;
    }
    return false;
  }

  /**
   * Get timeout for an operation
   */
  getTimeout(operationId: string): number {
    if (this.config.operationTimeouts?.[operationId]) {
      return this.config.operationTimeouts[operationId];
    }
    return this.config.defaultTimeout;
  }

  /**
   * Set timeout for an operation
   */
  setTimeout(operationId: string, timeout: number): void {
    if (!this.config.operationTimeouts) {
      this.config.operationTimeouts = {};
    }
    this.config.operationTimeouts[operationId] = timeout;
  }

  /**
   * Get all active contexts
   */
  getActiveContexts(): TimeoutContext[] {
    return Array.from(this.activeContexts.values());
  }

  /**
   * Get results for completed/timed out operations
   */
  getResult(context: TimeoutContext): TimeoutResult {
    const elapsed = Date.now() - context.startTime.getTime();
    return {
      operationId: context.operationId,
      timedOut: elapsed >= context.timeout,
      elapsedMs: elapsed,
      remainingMs: Math.max(0, context.timeout - elapsed),
    };
  }

  /**
   * Wrap a function with timeout
   */
  wrap<T extends (signal: AbortSignal, ...args: unknown[]) => Promise<unknown>>(
    fn: T,
    options?: { operationId?: string; timeout?: number }
  ): (...args: Parameters<T> extends [AbortSignal, ...infer R] ? R : never) => Promise<
    Awaited<ReturnType<T>>
  > {
    return async (
      ...args: Parameters<T> extends [AbortSignal, ...infer R] ? R : never
    ): Promise<Awaited<ReturnType<T>>> => {
      return this.execute(
        (signal) => fn(signal, ...args) as Promise<Awaited<ReturnType<T>>>,
        options
      );
    };
  }

  /**
   * Create a deadline from duration
   */
  createDeadline(ms: number): Date {
    return new Date(Date.now() + ms);
  }

  /**
   * Check if deadline has passed
   */
  isDeadlinePassed(deadline: Date): boolean {
    return Date.now() >= deadline.getTime();
  }

  /**
   * Get summary of timeout manager
   */
  getSummary(): {
    activeOperations: number;
    defaultTimeout: number;
    customTimeouts: number;
  } {
    return {
      activeOperations: this.activeContexts.size,
      defaultTimeout: this.config.defaultTimeout,
      customTimeouts: Object.keys(this.config.operationTimeouts || {}).length,
    };
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Execute with timeout (standalone function)
 */
export async function withTimeout<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  timeout: number,
  operationId?: string
): Promise<T> {
  const manager = new TimeoutManager({ defaultTimeout: timeout });
  return manager.execute(fn, { operationId });
}

/**
 * Race multiple promises with overall timeout
 */
export async function raceWithTimeout<T>(
  promises: Promise<T>[],
  timeout: number
): Promise<T> {
  const abortController = new AbortController();

  const timeoutPromise = new Promise<never>((_, reject) => {
    const timer = setTimeout(() => {
      abortController.abort();
      reject(new TimeoutError("race", timeout, timeout));
    }, timeout);

    abortController.signal.addEventListener("abort", () => {
      clearTimeout(timer);
    });
  });

  try {
    return await Promise.race([...promises, timeoutPromise]);
  } finally {
    abortController.abort();
  }
}

// ============================================================================
// Singleton & Factory
// ============================================================================

let timeoutManagerInstance: TimeoutManager | null = null;

export function getTimeoutManager(config?: Partial<TimeoutConfig>): TimeoutManager {
  if (!timeoutManagerInstance) {
    timeoutManagerInstance = new TimeoutManager(config);
  }
  return timeoutManagerInstance;
}

export function createTimeoutManager(config?: Partial<TimeoutConfig>): TimeoutManager {
  return new TimeoutManager(config);
}

// Common timeout presets
export const TIMEOUT_PRESETS = {
  fast: 5000, // 5s - cache, local ops
  normal: 30000, // 30s - most API calls
  slow: 120000, // 2min - file operations, AI calls
  veryLong: 600000, // 10min - batch processing
} as const;
