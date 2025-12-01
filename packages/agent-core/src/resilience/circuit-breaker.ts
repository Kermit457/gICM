/**
 * Circuit Breaker pattern to prevent cascade failures
 */

export enum CircuitState {
  CLOSED = "CLOSED",
  OPEN = "OPEN",
  HALF_OPEN = "HALF_OPEN",
}

export interface CircuitBreakerConfig {
  name: string;
  failureThreshold: number;
  successThreshold: number;
  timeout: number;
  onStateChange?: (from: CircuitState, to: CircuitState) => void;
  onFailure?: (error: Error) => void;
}

const DEFAULT_CONFIG: Omit<CircuitBreakerConfig, "name"> = {
  failureThreshold: 5,
  successThreshold: 2,
  timeout: 60000,
};

export class CircuitBreakerOpenError extends Error {
  constructor(name: string) {
    super(`Circuit breaker "${name}" is OPEN`);
    this.name = "CircuitBreakerOpenError";
  }
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private nextAttemptTime = 0;
  private config: CircuitBreakerConfig;

  constructor(config: Partial<CircuitBreakerConfig> & { name: string }) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if we should allow the request
    if (!this.canExecute()) {
      throw new CircuitBreakerOpenError(this.config.name);
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  private canExecute(): boolean {
    switch (this.state) {
      case CircuitState.CLOSED:
        return true;

      case CircuitState.OPEN:
        // Check if timeout has passed
        if (Date.now() >= this.nextAttemptTime) {
          this.transition(CircuitState.HALF_OPEN);
          return true;
        }
        return false;

      case CircuitState.HALF_OPEN:
        return true;

      default:
        return false;
    }
  }

  private onSuccess(): void {
    switch (this.state) {
      case CircuitState.HALF_OPEN:
        this.successCount++;
        if (this.successCount >= this.config.successThreshold) {
          this.transition(CircuitState.CLOSED);
        }
        break;

      case CircuitState.CLOSED:
        // Reset failure count on success
        this.failureCount = 0;
        break;
    }
  }

  private onFailure(error: Error): void {
    if (this.config.onFailure) {
      this.config.onFailure(error);
    }

    switch (this.state) {
      case CircuitState.CLOSED:
        this.failureCount++;
        if (this.failureCount >= this.config.failureThreshold) {
          this.transition(CircuitState.OPEN);
        }
        break;

      case CircuitState.HALF_OPEN:
        // Single failure in half-open returns to open
        this.transition(CircuitState.OPEN);
        break;
    }
  }

  private transition(newState: CircuitState): void {
    const oldState = this.state;
    this.state = newState;

    // Reset counters
    this.failureCount = 0;
    this.successCount = 0;

    // Set next attempt time for OPEN state
    if (newState === CircuitState.OPEN) {
      this.nextAttemptTime = Date.now() + this.config.timeout;
    }

    // Notify
    if (this.config.onStateChange) {
      this.config.onStateChange(oldState, newState);
    }
  }

  getState(): CircuitState {
    return this.state;
  }

  getStats(): {
    state: CircuitState;
    failures: number;
    successes: number;
    nextAttemptTime: number | null;
  } {
    return {
      state: this.state,
      failures: this.failureCount,
      successes: this.successCount,
      nextAttemptTime:
        this.state === CircuitState.OPEN ? this.nextAttemptTime : null,
    };
  }

  reset(): void {
    this.transition(CircuitState.CLOSED);
  }

  forceOpen(): void {
    this.transition(CircuitState.OPEN);
  }
}
