/**
 * Circuit Breaker
 * Phase 12A: Reliability & Resilience
 */

import { EventEmitter } from "eventemitter3";
import {
  type CircuitState,
  type CircuitBreakerConfig,
  type CircuitStats,
  type CircuitBreakerState,
  type CircuitBreakerEvents,
  CircuitBreakerConfigSchema,
} from "./types.js";

// ============================================================================
// Circuit Breaker Error
// ============================================================================

export class CircuitOpenError extends Error {
  constructor(
    public readonly circuitName: string,
    public readonly state: CircuitState,
    public readonly stats: CircuitStats
  ) {
    super(`Circuit breaker '${circuitName}' is ${state}`);
    this.name = "CircuitOpenError";
  }
}

// ============================================================================
// Circuit Breaker Class
// ============================================================================

export class CircuitBreaker extends EventEmitter<CircuitBreakerEvents> {
  private config: Required<CircuitBreakerConfig>;
  private state: CircuitState = "closed";
  private stats: CircuitStats;
  private halfOpenCalls: number = 0;
  private requestTimestamps: number[] = [];
  private failureTimestamps: number[] = [];
  private stateTimer: NodeJS.Timeout | null = null;

  constructor(config: CircuitBreakerConfig) {
    super();
    this.config = CircuitBreakerConfigSchema.parse(config) as Required<CircuitBreakerConfig>;

    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      rejectedRequests: 0,
      stateChangedAt: new Date(),
      consecutiveFailures: 0,
      consecutiveSuccesses: 0,
    };
  }

  // ============================================================================
  // Public API
  // ============================================================================

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if request is allowed
    if (!this.allowRequest()) {
      this.stats.rejectedRequests++;
      this.emit("requestRejected", this.config.name);
      throw new CircuitOpenError(this.config.name, this.state, this.stats);
    }

    const startTime = Date.now();

    try {
      const result = await fn();
      this.recordSuccess(Date.now() - startTime);
      return result;
    } catch (error) {
      this.recordFailure(error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Wrap a function with circuit breaker
   */
  wrap<T extends (...args: unknown[]) => Promise<unknown>>(
    fn: T
  ): (...args: Parameters<T>) => Promise<Awaited<ReturnType<T>>> {
    return async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
      return this.execute(() => fn(...args)) as Promise<Awaited<ReturnType<T>>>;
    };
  }

  /**
   * Get current state
   */
  getState(): CircuitBreakerState {
    return {
      name: this.config.name,
      state: this.state,
      stats: { ...this.stats },
      config: { ...this.config },
    };
  }

  /**
   * Manually open the circuit
   */
  open(): void {
    this.transitionTo("open");
  }

  /**
   * Manually close the circuit
   */
  close(): void {
    this.transitionTo("closed");
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      rejectedRequests: 0,
      stateChangedAt: new Date(),
      consecutiveFailures: 0,
      consecutiveSuccesses: 0,
    };
    this.requestTimestamps = [];
    this.failureTimestamps = [];
  }

  /**
   * Get error rate in rolling window
   */
  getErrorRate(): number {
    this.cleanupOldTimestamps();
    if (this.requestTimestamps.length < this.config.volumeThreshold) {
      return 0;
    }
    return (this.failureTimestamps.length / this.requestTimestamps.length) * 100;
  }

  /**
   * Check if circuit is allowing requests
   */
  isAllowing(): boolean {
    return this.allowRequest();
  }

  /**
   * Dispose of the circuit breaker
   */
  dispose(): void {
    if (this.stateTimer) {
      clearTimeout(this.stateTimer);
      this.stateTimer = null;
    }
    this.removeAllListeners();
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private allowRequest(): boolean {
    switch (this.state) {
      case "closed":
        return true;

      case "open":
        return false;

      case "half_open":
        // Allow limited requests in half-open state
        if (this.halfOpenCalls < this.config.halfOpenMaxCalls) {
          this.halfOpenCalls++;
          return true;
        }
        return false;

      default:
        return false;
    }
  }

  private recordSuccess(duration: number): void {
    const now = Date.now();
    this.requestTimestamps.push(now);
    this.stats.totalRequests++;
    this.stats.successfulRequests++;
    this.stats.lastSuccessTime = new Date();
    this.stats.consecutiveSuccesses++;
    this.stats.consecutiveFailures = 0;

    this.emit("requestSuccess", this.config.name, duration);

    // State transitions on success
    if (this.state === "half_open") {
      if (this.stats.consecutiveSuccesses >= this.config.successThreshold) {
        this.transitionTo("closed");
      }
    }

    this.cleanupOldTimestamps();
  }

  private recordFailure(error: Error): void {
    const now = Date.now();
    this.requestTimestamps.push(now);
    this.failureTimestamps.push(now);
    this.stats.totalRequests++;
    this.stats.failedRequests++;
    this.stats.lastFailureTime = new Date();
    this.stats.consecutiveFailures++;
    this.stats.consecutiveSuccesses = 0;

    this.emit("requestFailure", this.config.name, error);

    // State transitions on failure
    if (this.state === "closed") {
      // Check if we should open the circuit
      if (this.shouldTrip()) {
        this.transitionTo("open");
      }
    } else if (this.state === "half_open") {
      // Any failure in half-open state opens the circuit
      this.transitionTo("open");
    }

    this.cleanupOldTimestamps();
  }

  private shouldTrip(): boolean {
    // Need minimum volume before tripping
    if (this.requestTimestamps.length < this.config.volumeThreshold) {
      return false;
    }

    // Check consecutive failures
    if (this.stats.consecutiveFailures >= this.config.failureThreshold) {
      return true;
    }

    // Check error percentage
    const errorRate = this.getErrorRate();
    return errorRate >= this.config.errorPercentageThreshold;
  }

  private transitionTo(newState: CircuitState): void {
    if (this.state === newState) {
      return;
    }

    const oldState = this.state;
    this.state = newState;
    this.stats.stateChangedAt = new Date();

    // Clear any existing timer
    if (this.stateTimer) {
      clearTimeout(this.stateTimer);
      this.stateTimer = null;
    }

    this.emit("stateChanged", this.config.name, oldState, newState);

    switch (newState) {
      case "open":
        this.halfOpenCalls = 0;
        this.emit("opened", this.config.name, { ...this.stats });

        // Schedule transition to half-open
        this.stateTimer = setTimeout(() => {
          this.transitionTo("half_open");
        }, this.config.timeout);
        break;

      case "closed":
        this.stats.consecutiveFailures = 0;
        this.stats.consecutiveSuccesses = 0;
        this.emit("closed", this.config.name, { ...this.stats });
        break;

      case "half_open":
        this.halfOpenCalls = 0;
        this.stats.consecutiveSuccesses = 0;
        this.emit("halfOpen", this.config.name);
        break;
    }
  }

  private cleanupOldTimestamps(): void {
    const cutoff = Date.now() - this.config.rollingWindowMs;

    this.requestTimestamps = this.requestTimestamps.filter((ts) => ts > cutoff);
    this.failureTimestamps = this.failureTimestamps.filter((ts) => ts > cutoff);
  }
}

// ============================================================================
// Circuit Breaker Registry
// ============================================================================

export class CircuitBreakerRegistry extends EventEmitter<CircuitBreakerEvents> {
  private breakers: Map<string, CircuitBreaker> = new Map();
  private defaultConfig: Partial<CircuitBreakerConfig>;

  constructor(defaultConfig: Partial<CircuitBreakerConfig> = {}) {
    super();
    this.defaultConfig = defaultConfig;
  }

  /**
   * Get or create a circuit breaker
   */
  get(name: string, config?: Partial<CircuitBreakerConfig>): CircuitBreaker {
    let breaker = this.breakers.get(name);

    if (!breaker) {
      breaker = new CircuitBreaker({
        name,
        ...this.defaultConfig,
        ...config,
      } as CircuitBreakerConfig);

      // Forward events
      this.forwardEvents(breaker);

      this.breakers.set(name, breaker);
    }

    return breaker;
  }

  /**
   * Get all circuit breakers
   */
  getAll(): Map<string, CircuitBreaker> {
    return new Map(this.breakers);
  }

  /**
   * Get all circuit breaker states
   */
  getAllStates(): CircuitBreakerState[] {
    return Array.from(this.breakers.values()).map((b) => b.getState());
  }

  /**
   * Remove a circuit breaker
   */
  remove(name: string): boolean {
    const breaker = this.breakers.get(name);
    if (breaker) {
      breaker.dispose();
      this.breakers.delete(name);
      return true;
    }
    return false;
  }

  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    for (const breaker of this.breakers.values()) {
      breaker.resetStats();
      breaker.close();
    }
  }

  /**
   * Get summary of all circuit breakers
   */
  getSummary(): {
    total: number;
    closed: number;
    open: number;
    halfOpen: number;
  } {
    const states = this.getAllStates();
    return {
      total: states.length,
      closed: states.filter((s) => s.state === "closed").length,
      open: states.filter((s) => s.state === "open").length,
      halfOpen: states.filter((s) => s.state === "half_open").length,
    };
  }

  /**
   * Dispose of all circuit breakers
   */
  dispose(): void {
    for (const breaker of this.breakers.values()) {
      breaker.dispose();
    }
    this.breakers.clear();
    this.removeAllListeners();
  }

  private forwardEvents(breaker: CircuitBreaker): void {
    breaker.on("stateChanged", (...args) => this.emit("stateChanged", ...args));
    breaker.on("opened", (...args) => this.emit("opened", ...args));
    breaker.on("closed", (...args) => this.emit("closed", ...args));
    breaker.on("halfOpen", (...args) => this.emit("halfOpen", ...args));
    breaker.on("requestRejected", (...args) => this.emit("requestRejected", ...args));
    breaker.on("requestSuccess", (...args) => this.emit("requestSuccess", ...args));
    breaker.on("requestFailure", (...args) => this.emit("requestFailure", ...args));
  }
}

// ============================================================================
// Singleton & Factory
// ============================================================================

let registryInstance: CircuitBreakerRegistry | null = null;

export function getCircuitBreakerRegistry(
  config?: Partial<CircuitBreakerConfig>
): CircuitBreakerRegistry {
  if (!registryInstance) {
    registryInstance = new CircuitBreakerRegistry(config);
  }
  return registryInstance;
}

export function createCircuitBreakerRegistry(
  config?: Partial<CircuitBreakerConfig>
): CircuitBreakerRegistry {
  return new CircuitBreakerRegistry(config);
}

export function createCircuitBreaker(config: CircuitBreakerConfig): CircuitBreaker {
  return new CircuitBreaker(config);
}
