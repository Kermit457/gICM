/**
 * Retry Strategy
 * Phase 12B: Reliability & Resilience
 */

import { EventEmitter } from "eventemitter3";
import {
  type RetryConfig,
  type RetryStrategyType,
  type RetryAttempt,
  type RetryResult,
  type RetryEvents,
  RetryConfigSchema,
} from "./types.js";

// ============================================================================
// Retry Exhausted Error
// ============================================================================

export class RetryExhaustedError extends Error {
  constructor(
    public readonly attempts: RetryAttempt[],
    public readonly lastError: unknown
  ) {
    super(`Retry exhausted after ${attempts.length} attempts`);
    this.name = "RetryExhaustedError";
  }
}

// ============================================================================
// Retry Strategy Class
// ============================================================================

export class RetryStrategy extends EventEmitter<RetryEvents> {
  private config: Required<RetryConfig>;
  private retryBudgetUsed: number = 0;
  private budgetResetTime: number = Date.now();

  constructor(config: Partial<RetryConfig> = {}) {
    super();
    this.config = RetryConfigSchema.parse(config) as Required<RetryConfig>;
  }

  // ============================================================================
  // Public API
  // ============================================================================

  /**
   * Execute a function with retry logic
   */
  async execute<T>(fn: () => Promise<T>): Promise<RetryResult> {
    const attempts: RetryAttempt[] = [];
    const startTime = Date.now();
    let lastError: unknown;

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      // Check retry budget
      if (attempt > 0 && !this.checkBudget()) {
        this.emit("budgetExhausted");
        return {
          success: false,
          error: new RetryExhaustedError(attempts, lastError),
          attempts,
          totalTime: Date.now() - startTime,
        };
      }

      // Calculate delay for retry
      const delay = attempt > 0 ? this.calculateDelay(attempt) : 0;

      // Wait before retry
      if (delay > 0) {
        this.emit("retrying", attempt, delay, lastError);
        if (this.config.onRetry) {
          this.config.onRetry(attempt, lastError);
        }
        await this.sleep(delay);
      }

      try {
        const result = await fn();

        const attemptRecord: RetryAttempt = {
          attempt,
          delay,
          timestamp: new Date(),
        };
        attempts.push(attemptRecord);

        this.emit("success", attempt);

        return {
          success: true,
          result,
          attempts,
          totalTime: Date.now() - startTime,
        };
      } catch (error) {
        lastError = error;

        const attemptRecord: RetryAttempt = {
          attempt,
          delay,
          error,
          timestamp: new Date(),
        };
        attempts.push(attemptRecord);

        // Check if error is retryable
        if (!this.isRetryable(error)) {
          return {
            success: false,
            error,
            attempts,
            totalTime: Date.now() - startTime,
          };
        }

        // Consume retry budget
        if (attempt > 0) {
          this.consumeBudget();
        }
      }
    }

    this.emit("exhausted", attempts);

    return {
      success: false,
      error: new RetryExhaustedError(attempts, lastError),
      attempts,
      totalTime: Date.now() - startTime,
    };
  }

  /**
   * Wrap a function with retry logic
   */
  wrap<T extends (...args: unknown[]) => Promise<unknown>>(
    fn: T
  ): (...args: Parameters<T>) => Promise<RetryResult> {
    return async (...args: Parameters<T>): Promise<RetryResult> => {
      return this.execute(() => fn(...args));
    };
  }

  /**
   * Execute with automatic unwrap (throws on failure)
   */
  async executeOrThrow<T>(fn: () => Promise<T>): Promise<T> {
    const result = await this.execute(fn);

    if (!result.success) {
      throw result.error;
    }

    return result.result as T;
  }

  /**
   * Calculate delay for a given attempt
   */
  calculateDelay(attempt: number): number {
    let delay: number;

    switch (this.config.strategy) {
      case "fixed":
        delay = this.config.baseDelayMs;
        break;

      case "linear":
        delay = this.config.baseDelayMs * attempt;
        break;

      case "exponential":
        delay = this.config.baseDelayMs * Math.pow(2, attempt - 1);
        break;

      case "exponential_jitter":
        delay = this.config.baseDelayMs * Math.pow(2, attempt - 1);
        const jitter = delay * this.config.jitterFactor * (Math.random() * 2 - 1);
        delay = delay + jitter;
        break;

      default:
        delay = this.config.baseDelayMs;
    }

    return Math.min(delay, this.config.maxDelayMs);
  }

  /**
   * Get remaining retry budget
   */
  getRemainingBudget(): number | undefined {
    if (!this.config.retryBudgetPerMinute) {
      return undefined;
    }

    this.refreshBudget();
    return Math.max(0, this.config.retryBudgetPerMinute - this.retryBudgetUsed);
  }

  /**
   * Reset retry budget
   */
  resetBudget(): void {
    this.retryBudgetUsed = 0;
    this.budgetResetTime = Date.now();
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private isRetryable(error: unknown): boolean {
    const errorName = error instanceof Error ? error.name : String(error);
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Check non-retryable errors first
    if (this.config.nonRetryableErrors?.length) {
      for (const pattern of this.config.nonRetryableErrors) {
        if (errorName.includes(pattern) || errorMessage.includes(pattern)) {
          return false;
        }
      }
    }

    // If retryable errors are specified, check against them
    if (this.config.retryableErrors?.length) {
      for (const pattern of this.config.retryableErrors) {
        if (errorName.includes(pattern) || errorMessage.includes(pattern)) {
          return true;
        }
      }
      return false; // Not in retryable list
    }

    // Default: retry all errors
    return true;
  }

  private checkBudget(): boolean {
    if (!this.config.retryBudgetPerMinute) {
      return true;
    }

    this.refreshBudget();
    return this.retryBudgetUsed < this.config.retryBudgetPerMinute;
  }

  private consumeBudget(): void {
    if (this.config.retryBudgetPerMinute) {
      this.retryBudgetUsed++;
    }
  }

  private refreshBudget(): void {
    const now = Date.now();
    if (now - this.budgetResetTime >= 60000) {
      this.retryBudgetUsed = 0;
      this.budgetResetTime = now;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ============================================================================
// Retry Decorators / Helpers
// ============================================================================

/**
 * Create a retry wrapper for a function
 */
export function withRetry<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  config?: Partial<RetryConfig>
): (...args: Parameters<T>) => Promise<Awaited<ReturnType<T>>> {
  const strategy = new RetryStrategy(config);

  return async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
    const result = await strategy.execute(() => fn(...args));

    if (!result.success) {
      throw result.error;
    }

    return result.result as Awaited<ReturnType<T>>;
  };
}

/**
 * Retry with exponential backoff (convenience function)
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options?: {
    maxRetries?: number;
    baseDelay?: number;
    maxDelay?: number;
  }
): Promise<T> {
  const strategy = new RetryStrategy({
    maxRetries: options?.maxRetries ?? 3,
    baseDelayMs: options?.baseDelay ?? 1000,
    maxDelayMs: options?.maxDelay ?? 30000,
    strategy: "exponential_jitter",
  });

  return strategy.executeOrThrow(fn);
}

// ============================================================================
// Singleton & Factory
// ============================================================================

export function createRetryStrategy(config?: Partial<RetryConfig>): RetryStrategy {
  return new RetryStrategy(config);
}

// Default strategies
export const DEFAULT_RETRY_STRATEGIES: Record<string, Partial<RetryConfig>> = {
  // Aggressive retry for transient failures
  aggressive: {
    maxRetries: 5,
    strategy: "exponential_jitter",
    baseDelayMs: 100,
    maxDelayMs: 5000,
    jitterFactor: 0.3,
  },

  // Conservative retry for external APIs
  conservative: {
    maxRetries: 3,
    strategy: "exponential",
    baseDelayMs: 1000,
    maxDelayMs: 30000,
    jitterFactor: 0.2,
  },

  // Quick retry for cache operations
  quick: {
    maxRetries: 2,
    strategy: "fixed",
    baseDelayMs: 100,
    maxDelayMs: 500,
  },

  // No retry
  none: {
    maxRetries: 0,
  },
};
