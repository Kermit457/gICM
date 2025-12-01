/**
 * Test Setup Helpers
 *
 * Common setup and teardown utilities for tests
 */

import { vi, beforeEach, afterEach } from "vitest";

// Suppress console output during tests
export function suppressConsole() {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "debug").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });
}

// Mock fetch globally
export function mockFetch(responses: Record<string, unknown> = {}) {
  const mockFetchFn = vi.fn(async (url: string) => {
    const response = responses[url] ?? { ok: true, json: async () => ({}) };
    return {
      ok: true,
      status: 200,
      json: async () => response,
      text: async () => JSON.stringify(response),
      ...response,
    };
  });

  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetchFn);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  return mockFetchFn;
}

// Create isolated test environment
export function createTestEnvironment() {
  // Set test environment variables
  process.env.NODE_ENV = "test";
  process.env.GICM_DRY_RUN = "true";

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });
}

// Wait for async operations
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  timeout = 5000,
  interval = 100
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await condition()) return;
    await new Promise((r) => setTimeout(r, interval));
  }
  throw new Error(`waitFor timed out after ${timeout}ms`);
}

// Create mock event emitter
export function createMockEmitter() {
  const handlers = new Map<string, Set<(...args: unknown[]) => void>>();

  return {
    on(event: string, handler: (...args: unknown[]) => void) {
      if (!handlers.has(event)) handlers.set(event, new Set());
      handlers.get(event)!.add(handler);
    },
    off(event: string, handler: (...args: unknown[]) => void) {
      handlers.get(event)?.delete(handler);
    },
    emit(event: string, ...args: unknown[]) {
      handlers.get(event)?.forEach((h) => h(...args));
    },
    removeAllListeners() {
      handlers.clear();
    },
  };
}
