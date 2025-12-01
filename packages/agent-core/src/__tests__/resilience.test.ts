/**
 * Resilience utilities tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  withRetry,
  calculateDelay,
  CircuitBreaker,
  CircuitBreakerOpenError,
  CircuitState,
  withResilience,
} from "../resilience/index.js";

describe("withRetry", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("returns result on first successful attempt", async () => {
    const fn = vi.fn().mockResolvedValue("success");

    const promise = withRetry(fn);
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result).toBe("success");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries on failure", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error("fail1"))
      .mockRejectedValueOnce(new Error("fail2"))
      .mockResolvedValue("success");

    const promise = withRetry(fn, { maxAttempts: 3 });
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result).toBe("success");
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("throws after max attempts", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("always fails"));

    const promise = withRetry(fn, { maxAttempts: 3 });

    // Handle the promise rejection properly
    let error: Error | null = null;
    promise.catch((e) => { error = e; });

    await vi.runAllTimersAsync();
    await vi.waitFor(() => expect(error).not.toBeNull());

    expect(error?.message).toBe("always fails");
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("calls onRetry callback", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error("fail"))
      .mockResolvedValue("success");

    const onRetry = vi.fn();

    const promise = withRetry(fn, { maxAttempts: 2, onRetry });
    await vi.runAllTimersAsync();
    await promise;

    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onRetry).toHaveBeenCalledWith(
      expect.any(Error),
      1,
      expect.any(Number)
    );
  });

  it("respects shouldRetry predicate", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("not retryable"));

    const shouldRetry = vi.fn().mockReturnValue(false);

    const promise = withRetry(fn, { maxAttempts: 3, shouldRetry });

    // Handle the promise rejection properly
    let error: Error | null = null;
    promise.catch((e) => { error = e; });

    await vi.runAllTimersAsync();
    await vi.waitFor(() => expect(error).not.toBeNull());

    expect(error?.message).toBe("not retryable");
    expect(fn).toHaveBeenCalledTimes(1);
    expect(shouldRetry).toHaveBeenCalledTimes(1);
  });
});

describe("calculateDelay", () => {
  it("calculates exponential delay", () => {
    const config = {
      maxAttempts: 3,
      initialDelay: 1000,
      maxDelay: 30000,
      backoffFactor: 2,
      jitter: false,
    };

    expect(calculateDelay(0, config)).toBe(1000);
    expect(calculateDelay(1, config)).toBe(2000);
    expect(calculateDelay(2, config)).toBe(4000);
    expect(calculateDelay(3, config)).toBe(8000);
  });

  it("caps at maxDelay", () => {
    const config = {
      maxAttempts: 10,
      initialDelay: 1000,
      maxDelay: 5000,
      backoffFactor: 2,
      jitter: false,
    };

    expect(calculateDelay(10, config)).toBe(5000);
  });

  it("adds jitter when enabled", () => {
    const config = {
      maxAttempts: 3,
      initialDelay: 1000,
      maxDelay: 30000,
      backoffFactor: 2,
      jitter: true,
    };

    const delays = Array.from({ length: 100 }, () => calculateDelay(0, config));
    const uniqueDelays = new Set(delays);

    // With jitter, delays should vary
    expect(uniqueDelays.size).toBeGreaterThan(1);

    // All delays should be within jitter range (750-1250 for 1000ms base)
    delays.forEach((delay) => {
      expect(delay).toBeGreaterThanOrEqual(750);
      expect(delay).toBeLessThanOrEqual(1250);
    });
  });
});

describe("CircuitBreaker", () => {
  let breaker: CircuitBreaker;

  beforeEach(() => {
    breaker = new CircuitBreaker({
      name: "test",
      failureThreshold: 3,
      successThreshold: 2,
      timeout: 1000,
    });
  });

  it("starts in CLOSED state", () => {
    expect(breaker.getState()).toBe(CircuitState.CLOSED);
  });

  it("executes function successfully", async () => {
    const result = await breaker.execute(() => Promise.resolve("success"));
    expect(result).toBe("success");
  });

  it("opens after failure threshold", async () => {
    const failFn = () => Promise.reject(new Error("fail"));

    // Trigger 3 failures
    await expect(breaker.execute(failFn)).rejects.toThrow("fail");
    await expect(breaker.execute(failFn)).rejects.toThrow("fail");
    await expect(breaker.execute(failFn)).rejects.toThrow("fail");

    expect(breaker.getState()).toBe(CircuitState.OPEN);
  });

  it("throws CircuitBreakerOpenError when open", async () => {
    // Force open
    breaker.forceOpen();

    await expect(breaker.execute(() => Promise.resolve())).rejects.toThrow(
      CircuitBreakerOpenError
    );
  });

  it("transitions to HALF_OPEN after timeout", async () => {
    vi.useFakeTimers();

    breaker.forceOpen();
    expect(breaker.getState()).toBe(CircuitState.OPEN);

    // Advance time past timeout
    vi.advanceTimersByTime(1500);

    // Try to execute - should transition to HALF_OPEN
    await breaker.execute(() => Promise.resolve());

    expect(breaker.getState()).toBe(CircuitState.HALF_OPEN);

    vi.useRealTimers();
  });

  it("closes after success threshold in HALF_OPEN", async () => {
    vi.useFakeTimers();

    breaker.forceOpen();
    vi.advanceTimersByTime(1500);

    // Execute successfully twice (successThreshold = 2)
    await breaker.execute(() => Promise.resolve());
    await breaker.execute(() => Promise.resolve());

    expect(breaker.getState()).toBe(CircuitState.CLOSED);

    vi.useRealTimers();
  });

  it("returns to OPEN on failure in HALF_OPEN", async () => {
    vi.useFakeTimers();

    breaker.forceOpen();
    vi.advanceTimersByTime(1500);

    // Trigger HALF_OPEN with success
    await breaker.execute(() => Promise.resolve());
    expect(breaker.getState()).toBe(CircuitState.HALF_OPEN);

    // Fail
    await expect(breaker.execute(() => Promise.reject(new Error("fail")))).rejects.toThrow();

    expect(breaker.getState()).toBe(CircuitState.OPEN);

    vi.useRealTimers();
  });

  it("resets failure count on success", async () => {
    const failFn = () => Promise.reject(new Error("fail"));
    const successFn = () => Promise.resolve("success");

    // 2 failures
    await expect(breaker.execute(failFn)).rejects.toThrow();
    await expect(breaker.execute(failFn)).rejects.toThrow();

    // Success should reset
    await breaker.execute(successFn);

    // 2 more failures shouldn't open (reset happened)
    await expect(breaker.execute(failFn)).rejects.toThrow();
    await expect(breaker.execute(failFn)).rejects.toThrow();

    expect(breaker.getState()).toBe(CircuitState.CLOSED);
  });

  it("calls onStateChange callback", async () => {
    const onStateChange = vi.fn();
    breaker = new CircuitBreaker({
      name: "test",
      failureThreshold: 1,
      onStateChange,
    });

    await expect(breaker.execute(() => Promise.reject(new Error()))).rejects.toThrow();

    expect(onStateChange).toHaveBeenCalledWith(CircuitState.CLOSED, CircuitState.OPEN);
  });

  it("calls onFailure callback", async () => {
    const onFailure = vi.fn();
    breaker = new CircuitBreaker({
      name: "test",
      onFailure,
    });

    const error = new Error("test error");
    await expect(breaker.execute(() => Promise.reject(error))).rejects.toThrow();

    expect(onFailure).toHaveBeenCalledWith(error);
  });

  it("provides stats", () => {
    const stats = breaker.getStats();

    expect(stats).toEqual({
      state: CircuitState.CLOSED,
      failures: 0,
      successes: 0,
      nextAttemptTime: null,
    });
  });

  it("can be manually reset", async () => {
    breaker.forceOpen();
    expect(breaker.getState()).toBe(CircuitState.OPEN);

    breaker.reset();
    expect(breaker.getState()).toBe(CircuitState.CLOSED);
  });
});

describe("withResilience", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("executes function without options", async () => {
    const result = await withResilience(() => Promise.resolve("success"));
    expect(result).toBe("success");
  });

  it("applies retry logic", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error("fail"))
      .mockResolvedValue("success");

    const promise = withResilience(fn, { retry: { maxAttempts: 2 } });
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result).toBe("success");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("applies circuit breaker logic", async () => {
    const breaker = new CircuitBreaker({ name: "test" });
    breaker.forceOpen();

    await expect(
      withResilience(() => Promise.resolve(), { circuitBreaker: breaker })
    ).rejects.toThrow(CircuitBreakerOpenError);
  });

  it("combines retry and circuit breaker", async () => {
    const breaker = new CircuitBreaker({ name: "test" });
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error("fail"))
      .mockResolvedValue("success");

    const promise = withResilience(fn, {
      retry: { maxAttempts: 2 },
      circuitBreaker: breaker,
    });
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result).toBe("success");
  });
});
