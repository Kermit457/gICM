/**
 * Timeout Manager for gICM platform
 *
 * Features:
 * - Promise-based timeout wrapper
 * - AbortController integration
 * - Cascading timeouts (parent → child propagation)
 * - Deadline management
 * - Timeout statistics
 */

import { z } from "zod";

// ============================================================================
// Types
// ============================================================================

export const TimeoutConfigSchema = z.object({
  /** Timeout duration in milliseconds */
  timeoutMs: z.number().min(0),
  /** Optional name for debugging */
  name: z.string().optional(),
  /** Custom error message */
  errorMessage: z.string().optional(),
  /** Callback when timeout occurs */
  onTimeout: z.function().args().returns(z.void()).optional(),
});

export type TimeoutConfig = z.infer<typeof TimeoutConfigSchema>;

export class TimeoutError extends Error {
  constructor(
    message: string,
    public readonly timeoutMs: number,
    public readonly operationName?: string
  ) {
    super(message);
    this.name = "TimeoutError";
  }
}

export interface TimeoutStats {
  totalOperations: number;
  timedOut: number;
  completed: number;
  averageDurationMs: number;
  maxDurationMs: number;
}

// ============================================================================
// withTimeout - Basic timeout wrapper
// ============================================================================

/**
 * Wrap a promise with a timeout
 *
 * @example
 * const result = await withTimeout(
 *   fetch('https://api.example.com/data'),
 *   { timeoutMs: 5000, name: 'api-fetch' }
 * );
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  config: TimeoutConfig
): Promise<T> {
  const { timeoutMs, name, errorMessage, onTimeout } = config;

  if (timeoutMs <= 0) {
    return promise;
  }

  let timeoutId: ReturnType<typeof setTimeout>;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      onTimeout?.();
      reject(
        new TimeoutError(
          errorMessage ?? `Operation${name ? ` "${name}"` : ""} timed out after ${timeoutMs}ms`,
          timeoutMs,
          name
        )
      );
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutId!);
    return result;
  } catch (error) {
    clearTimeout(timeoutId!);
    throw error;
  }
}

// ============================================================================
// TimeoutController - AbortController integration
// ============================================================================

/**
 * TimeoutController wraps AbortController with timeout functionality
 *
 * @example
 * const controller = new TimeoutController(5000);
 * const response = await fetch(url, { signal: controller.signal });
 * controller.clear(); // Cleanup if completed before timeout
 */
export class TimeoutController {
  private abortController: AbortController;
  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private _timedOut = false;

  constructor(
    public readonly timeoutMs: number,
    private readonly name?: string
  ) {
    this.abortController = new AbortController();

    if (timeoutMs > 0) {
      this.timeoutId = setTimeout(() => {
        this._timedOut = true;
        this.abortController.abort(
          new TimeoutError(
            `Operation${name ? ` "${name}"` : ""} timed out after ${timeoutMs}ms`,
            timeoutMs,
            name
          )
        );
      }, timeoutMs);
    }
  }

  get signal(): AbortSignal {
    return this.abortController.signal;
  }

  get timedOut(): boolean {
    return this._timedOut;
  }

  get aborted(): boolean {
    return this.abortController.signal.aborted;
  }

  /**
   * Clear the timeout - call when operation completes successfully
   */
  clear(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  /**
   * Manually abort the operation
   */
  abort(reason?: unknown): void {
    this.clear();
    this.abortController.abort(reason);
  }
}

// ============================================================================
// Deadline - Cascading timeout management
// ============================================================================

/**
 * Deadline represents an absolute point in time when an operation must complete.
 * Useful for propagating timeouts through nested operations.
 *
 * @example
 * const deadline = Deadline.after(5000); // 5 seconds from now
 *
 * // Pass to nested operations
 * await operationA(deadline.remaining());
 * await operationB(deadline.remaining());
 *
 * // Check if expired
 * if (deadline.expired) {
 *   throw new TimeoutError('Deadline exceeded', 5000);
 * }
 */
export class Deadline {
  private readonly expiresAt: number;

  private constructor(expiresAt: number) {
    this.expiresAt = expiresAt;
  }

  /**
   * Create a deadline that expires after the given duration
   */
  static after(ms: number): Deadline {
    return new Deadline(Date.now() + ms);
  }

  /**
   * Create a deadline at a specific timestamp
   */
  static at(timestamp: number): Deadline {
    return new Deadline(timestamp);
  }

  /**
   * Create a deadline that never expires
   */
  static never(): Deadline {
    return new Deadline(Number.MAX_SAFE_INTEGER);
  }

  /**
   * Get remaining time in milliseconds (0 if expired)
   */
  remaining(): number {
    return Math.max(0, this.expiresAt - Date.now());
  }

  /**
   * Check if the deadline has expired
   */
  get expired(): boolean {
    return Date.now() >= this.expiresAt;
  }

  /**
   * Get the absolute expiration timestamp
   */
  get expirationTime(): number {
    return this.expiresAt;
  }

  /**
   * Create a child deadline with a shorter timeout
   * The child will expire at whichever comes first: its own timeout or the parent deadline
   */
  child(maxMs: number): Deadline {
    const childExpires = Date.now() + maxMs;
    return new Deadline(Math.min(this.expiresAt, childExpires));
  }

  /**
   * Throw if expired
   */
  check(operationName?: string): void {
    if (this.expired) {
      throw new TimeoutError(
        `Deadline exceeded${operationName ? ` for "${operationName}"` : ""}`,
        0,
        operationName
      );
    }
  }

  /**
   * Wrap a promise with this deadline
   */
  async wrap<T>(promise: Promise<T>, name?: string): Promise<T> {
    const remaining = this.remaining();
    if (remaining <= 0) {
      throw new TimeoutError(
        `Deadline already expired${name ? ` for "${name}"` : ""}`,
        0,
        name
      );
    }
    return withTimeout(promise, { timeoutMs: remaining, name });
  }

  /**
   * Create a TimeoutController bound to this deadline
   */
  controller(name?: string): TimeoutController {
    return new TimeoutController(this.remaining(), name);
  }
}

// ============================================================================
// TimeoutManager - Centralized timeout tracking
// ============================================================================

/**
 * TimeoutManager tracks timeout statistics across operations
 *
 * @example
 * const manager = new TimeoutManager();
 *
 * // Execute with tracking
 * const result = await manager.execute(
 *   () => fetch('/api/data'),
 *   { timeoutMs: 5000, name: 'api-call' }
 * );
 *
 * // Get statistics
 * console.log(manager.stats);
 */
export class TimeoutManager {
  private operations: Array<{
    name?: string;
    durationMs: number;
    timedOut: boolean;
    timestamp: number;
  }> = [];

  private readonly maxHistory: number;

  constructor(maxHistory = 1000) {
    this.maxHistory = maxHistory;
  }

  /**
   * Execute a function with timeout tracking
   */
  async execute<T>(
    fn: () => Promise<T>,
    config: TimeoutConfig
  ): Promise<T> {
    const startTime = Date.now();
    let timedOut = false;

    try {
      const result = await withTimeout(fn(), {
        ...config,
        onTimeout: () => {
          timedOut = true;
          config.onTimeout?.();
        },
      });
      this.recordOperation(config.name, Date.now() - startTime, false);
      return result;
    } catch (error) {
      this.recordOperation(config.name, Date.now() - startTime, timedOut || error instanceof TimeoutError);
      throw error;
    }
  }

  /**
   * Execute with a deadline
   */
  async executeWithDeadline<T>(
    fn: () => Promise<T>,
    deadline: Deadline,
    name?: string
  ): Promise<T> {
    return this.execute(fn, {
      timeoutMs: deadline.remaining(),
      name,
    });
  }

  private recordOperation(name: string | undefined, durationMs: number, timedOut: boolean): void {
    this.operations.push({
      name,
      durationMs,
      timedOut,
      timestamp: Date.now(),
    });

    // Trim history if too large
    if (this.operations.length > this.maxHistory) {
      this.operations = this.operations.slice(-this.maxHistory);
    }
  }

  /**
   * Get timeout statistics
   */
  get stats(): TimeoutStats {
    if (this.operations.length === 0) {
      return {
        totalOperations: 0,
        timedOut: 0,
        completed: 0,
        averageDurationMs: 0,
        maxDurationMs: 0,
      };
    }

    const timedOut = this.operations.filter((op) => op.timedOut).length;
    const durations = this.operations.map((op) => op.durationMs);
    const totalDuration = durations.reduce((a, b) => a + b, 0);

    return {
      totalOperations: this.operations.length,
      timedOut,
      completed: this.operations.length - timedOut,
      averageDurationMs: totalDuration / this.operations.length,
      maxDurationMs: Math.max(...durations),
    };
  }

  /**
   * Get timeout rate (percentage of operations that timed out)
   */
  get timeoutRate(): number {
    if (this.operations.length === 0) return 0;
    return this.stats.timedOut / this.stats.totalOperations;
  }

  /**
   * Clear all recorded operations
   */
  clear(): void {
    this.operations = [];
  }

  /**
   * Get recent operations for debugging
   */
  getRecentOperations(count = 10): typeof this.operations {
    return this.operations.slice(-count);
  }
}

// ============================================================================
// Utility functions
// ============================================================================

/**
 * Sleep for a given duration, respecting an optional abort signal
 */
export function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason ?? new Error("Aborted"));
      return;
    }

    const timeoutId = setTimeout(resolve, ms);

    signal?.addEventListener("abort", () => {
      clearTimeout(timeoutId);
      reject(signal.reason ?? new Error("Aborted"));
    });
  });
}

/**
 * Race multiple promises with a timeout
 */
export async function raceWithTimeout<T>(
  promises: Promise<T>[],
  config: TimeoutConfig
): Promise<T> {
  return withTimeout(Promise.race(promises), config);
}

/**
 * Execute promises in sequence with per-operation timeout
 */
export async function sequenceWithTimeout<T>(
  operations: Array<() => Promise<T>>,
  perOperationTimeout: number,
  totalDeadline?: Deadline
): Promise<T[]> {
  const results: T[] = [];

  for (const [index, op] of operations.entries()) {
    // Check total deadline if provided
    if (totalDeadline?.expired) {
      throw new TimeoutError(
        `Sequence deadline expired at operation ${index}`,
        0
      );
    }

    // Use minimum of per-operation timeout and remaining deadline
    const effectiveTimeout = totalDeadline
      ? Math.min(perOperationTimeout, totalDeadline.remaining())
      : perOperationTimeout;

    const result = await withTimeout(op(), {
      timeoutMs: effectiveTimeout,
      name: `sequence-op-${index}`,
    });
    results.push(result);
  }

  return results;
}
