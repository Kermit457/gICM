/**
 * Vitest Test Setup
 * Global test configuration and utilities
 */

import { vi, beforeEach, afterEach, afterAll } from "vitest";

// =============================================================================
// GLOBAL MOCKS
// =============================================================================

// Mock console methods to reduce noise in tests
vi.spyOn(console, "log").mockImplementation(() => {});
vi.spyOn(console, "info").mockImplementation(() => {});
vi.spyOn(console, "warn").mockImplementation(() => {});
// Keep console.error visible for debugging
// vi.spyOn(console, "error").mockImplementation(() => {});

// =============================================================================
// TEST LIFECYCLE HOOKS
// =============================================================================

beforeEach(() => {
  // Clear all mocks before each test
  vi.clearAllMocks();
});

afterEach(() => {
  // Note: We use clearAllMocks() instead of restoreAllMocks() to preserve
  // module-level mocks set up with vi.mock(). restoreAllMocks() would
  // restore those mocks to undefined, breaking tests that rely on them.
  // Individual tests can call vi.restoreAllMocks() if needed.
});

// =============================================================================
// GLOBAL TEST UTILITIES
// =============================================================================

/**
 * Wait for a specified number of milliseconds (advances fake timers)
 */
export async function wait(ms: number): Promise<void> {
  await vi.advanceTimersByTimeAsync(ms);
}

/**
 * Flush all pending promises
 */
export async function flushPromises(): Promise<void> {
  await new Promise((resolve) => setImmediate(resolve));
}

/**
 * Create a deferred promise for testing async behavior
 */
export function createDeferred<T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
} {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

/**
 * Assert that a function throws an error with a specific message
 */
export async function expectToThrow(
  fn: () => Promise<unknown> | unknown,
  expectedMessage?: string | RegExp
): Promise<void> {
  let threw = false;
  let error: unknown;
  try {
    await fn();
  } catch (e) {
    threw = true;
    error = e;
  }
  if (!threw) {
    throw new Error("Expected function to throw, but it did not");
  }
  if (expectedMessage && error instanceof Error) {
    if (typeof expectedMessage === "string") {
      if (!error.message.includes(expectedMessage)) {
        throw new Error(
          `Expected error message to include "${expectedMessage}", got "${error.message}"`
        );
      }
    } else if (!expectedMessage.test(error.message)) {
      throw new Error(
        `Expected error message to match ${expectedMessage}, got "${error.message}"`
      );
    }
  }
}

// =============================================================================
// MOCK FACTORIES
// =============================================================================

/**
 * Generate a unique ID for testing
 */
export function generateTestId(prefix = "test"): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Generate a timestamp for testing
 */
export function generateTestTimestamp(): Date {
  return new Date("2025-01-15T12:00:00.000Z");
}
