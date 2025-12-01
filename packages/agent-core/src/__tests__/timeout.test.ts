import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  withTimeout,
  TimeoutController,
  Deadline,
  TimeoutManager,
  TimeoutError,
  sleep,
  raceWithTimeout,
  sequenceWithTimeout,
} from "../resilience/timeout.js";

describe("withTimeout", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("resolves if promise completes before timeout", async () => {
    const promise = Promise.resolve("success");
    const result = await withTimeout(promise, { timeoutMs: 1000 });
    expect(result).toBe("success");
  });

  it("throws TimeoutError if promise exceeds timeout", async () => {
    const slowPromise = new Promise((resolve) => {
      setTimeout(() => resolve("too late"), 2000);
    });

    const promise = withTimeout(slowPromise, { timeoutMs: 1000 });
    let error: Error | null = null;
    promise.catch((e) => {
      error = e;
    });

    await vi.advanceTimersByTimeAsync(1001);

    expect(error).toBeInstanceOf(TimeoutError);
    expect((error as TimeoutError).timeoutMs).toBe(1000);
  });

  it("includes operation name in error", async () => {
    const slowPromise = new Promise((resolve) => {
      setTimeout(() => resolve("too late"), 2000);
    });

    const promise = withTimeout(slowPromise, {
      timeoutMs: 100,
      name: "test-op",
    });
    let error: TimeoutError | null = null;
    promise.catch((e) => {
      error = e;
    });

    await vi.advanceTimersByTimeAsync(101);

    expect(error?.operationName).toBe("test-op");
    expect(error?.message).toContain("test-op");
  });

  it("calls onTimeout callback when timeout occurs", async () => {
    const onTimeout = vi.fn();
    const slowPromise = new Promise((resolve) => {
      setTimeout(() => resolve("too late"), 2000);
    });

    const promise = withTimeout(slowPromise, {
      timeoutMs: 100,
      onTimeout,
    });
    promise.catch(() => {});

    await vi.advanceTimersByTimeAsync(101);

    expect(onTimeout).toHaveBeenCalled();
  });

  it("passes through rejections from original promise", async () => {
    const failingPromise = Promise.reject(new Error("original error"));

    await expect(
      withTimeout(failingPromise, { timeoutMs: 1000 })
    ).rejects.toThrow("original error");
  });

  it("returns immediately if timeoutMs is 0", async () => {
    const promise = Promise.resolve("instant");
    const result = await withTimeout(promise, { timeoutMs: 0 });
    expect(result).toBe("instant");
  });
});

describe("TimeoutController", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("provides an abort signal", () => {
    const controller = new TimeoutController(1000);
    expect(controller.signal).toBeInstanceOf(AbortSignal);
    expect(controller.aborted).toBe(false);
    controller.clear();
  });

  it("aborts after timeout", async () => {
    const controller = new TimeoutController(100, "test");
    expect(controller.timedOut).toBe(false);

    await vi.advanceTimersByTimeAsync(101);

    expect(controller.timedOut).toBe(true);
    expect(controller.aborted).toBe(true);
  });

  it("can be manually aborted", () => {
    const controller = new TimeoutController(1000);
    controller.abort(new Error("manual abort"));

    expect(controller.aborted).toBe(true);
    expect(controller.timedOut).toBe(false);
  });

  it("clear() prevents timeout", async () => {
    const controller = new TimeoutController(100);
    controller.clear();

    await vi.advanceTimersByTimeAsync(200);

    expect(controller.timedOut).toBe(false);
    expect(controller.aborted).toBe(false);
  });
});

describe("Deadline", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("creates deadline after given ms", () => {
    const deadline = Deadline.after(1000);
    expect(deadline.remaining()).toBe(1000);
    expect(deadline.expired).toBe(false);
  });

  it("expires after duration", async () => {
    const deadline = Deadline.after(100);

    await vi.advanceTimersByTimeAsync(101);

    expect(deadline.expired).toBe(true);
    expect(deadline.remaining()).toBe(0);
  });

  it("never() creates non-expiring deadline", () => {
    const deadline = Deadline.never();
    expect(deadline.expired).toBe(false);
    expect(deadline.remaining()).toBeGreaterThan(0);
  });

  it("child() creates shorter deadline", () => {
    const parent = Deadline.after(1000);
    const child = parent.child(500);

    expect(child.remaining()).toBeLessThanOrEqual(500);
  });

  it("child() respects parent deadline", async () => {
    const parent = Deadline.after(100);
    const child = parent.child(500);

    await vi.advanceTimersByTimeAsync(101);

    expect(child.expired).toBe(true);
  });

  it("check() throws when expired", async () => {
    const deadline = Deadline.after(100);

    await vi.advanceTimersByTimeAsync(101);

    expect(() => deadline.check("test-op")).toThrow(TimeoutError);
  });

  it("wrap() adds timeout to promise", async () => {
    const deadline = Deadline.after(100);
    const slowPromise = new Promise((resolve) => {
      setTimeout(() => resolve("slow"), 200);
    });

    const promise = deadline.wrap(slowPromise, "wrapped");
    let error: Error | null = null;
    promise.catch((e) => {
      error = e;
    });

    await vi.advanceTimersByTimeAsync(101);

    expect(error).toBeInstanceOf(TimeoutError);
  });

  it("controller() creates bound TimeoutController", () => {
    const deadline = Deadline.after(1000);
    const controller = deadline.controller("test");

    expect(controller.timeoutMs).toBeLessThanOrEqual(1000);
    controller.clear();
  });
});

describe("TimeoutManager", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("tracks successful operations", async () => {
    const manager = new TimeoutManager();

    await manager.execute(() => Promise.resolve("ok"), {
      timeoutMs: 1000,
      name: "test",
    });

    expect(manager.stats.totalOperations).toBe(1);
    expect(manager.stats.completed).toBe(1);
    expect(manager.stats.timedOut).toBe(0);
  });

  it("tracks timed out operations", async () => {
    const manager = new TimeoutManager();
    const slowOp = () =>
      new Promise((resolve) => {
        setTimeout(() => resolve("slow"), 200);
      });

    const promise = manager.execute(slowOp, { timeoutMs: 100 });
    promise.catch(() => {});

    await vi.advanceTimersByTimeAsync(101);

    expect(manager.stats.timedOut).toBe(1);
    expect(manager.timeoutRate).toBe(1);
  });

  it("calculates statistics correctly", async () => {
    vi.useRealTimers(); // Need real timers for timing stats
    const manager = new TimeoutManager();

    // Complete 3 successful operations
    await manager.execute(() => Promise.resolve(1), { timeoutMs: 1000 });
    await manager.execute(() => Promise.resolve(2), { timeoutMs: 1000 });
    await manager.execute(() => Promise.resolve(3), { timeoutMs: 1000 });

    expect(manager.stats.totalOperations).toBe(3);
    expect(manager.stats.completed).toBe(3);
    expect(manager.stats.averageDurationMs).toBeGreaterThanOrEqual(0);
  });

  it("clears history", async () => {
    const manager = new TimeoutManager();
    await manager.execute(() => Promise.resolve(1), { timeoutMs: 1000 });

    manager.clear();

    expect(manager.stats.totalOperations).toBe(0);
  });

  it("limits history size", async () => {
    const manager = new TimeoutManager(5);

    for (let i = 0; i < 10; i++) {
      await manager.execute(() => Promise.resolve(i), { timeoutMs: 1000 });
    }

    expect(manager.stats.totalOperations).toBe(5);
  });

  it("getRecentOperations returns last N operations", async () => {
    const manager = new TimeoutManager();

    for (let i = 0; i < 5; i++) {
      await manager.execute(() => Promise.resolve(i), {
        timeoutMs: 1000,
        name: `op-${i}`,
      });
    }

    const recent = manager.getRecentOperations(3);
    expect(recent.length).toBe(3);
    expect(recent[2].name).toBe("op-4");
  });
});

describe("sleep", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("resolves after given ms", async () => {
    const promise = sleep(100);
    let resolved = false;
    promise.then(() => {
      resolved = true;
    });

    await vi.advanceTimersByTimeAsync(99);
    expect(resolved).toBe(false);

    await vi.advanceTimersByTimeAsync(2);
    expect(resolved).toBe(true);
  });

  it("rejects when signal is aborted", async () => {
    const controller = new AbortController();
    const promise = sleep(100, controller.signal);

    controller.abort(new Error("cancelled"));

    await expect(promise).rejects.toThrow("cancelled");
  });

  it("rejects immediately if signal already aborted", async () => {
    const controller = new AbortController();
    controller.abort(new Error("pre-aborted"));

    await expect(sleep(100, controller.signal)).rejects.toThrow("pre-aborted");
  });
});

describe("raceWithTimeout", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns first resolved promise", async () => {
    const fast = Promise.resolve("fast");
    const slow = new Promise((r) => setTimeout(() => r("slow"), 100));

    const result = await raceWithTimeout([fast, slow], { timeoutMs: 1000 });
    expect(result).toBe("fast");
  });

  it("times out if no promise resolves in time", async () => {
    const slow1 = new Promise((r) => setTimeout(() => r("slow1"), 200));
    const slow2 = new Promise((r) => setTimeout(() => r("slow2"), 300));

    const promise = raceWithTimeout([slow1, slow2], { timeoutMs: 100 });
    let error: Error | null = null;
    promise.catch((e) => {
      error = e;
    });

    await vi.advanceTimersByTimeAsync(101);

    expect(error).toBeInstanceOf(TimeoutError);
  });
});

describe("sequenceWithTimeout", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("executes operations in sequence", async () => {
    vi.useRealTimers();
    const order: number[] = [];
    const ops = [
      async () => {
        order.push(1);
        return 1;
      },
      async () => {
        order.push(2);
        return 2;
      },
      async () => {
        order.push(3);
        return 3;
      },
    ];

    const results = await sequenceWithTimeout(ops, 1000);

    expect(order).toEqual([1, 2, 3]);
    expect(results).toEqual([1, 2, 3]);
  });

  it("fails if operation exceeds per-operation timeout", async () => {
    const ops = [
      () => Promise.resolve(1),
      () => new Promise((r) => setTimeout(() => r(2), 200)),
      () => Promise.resolve(3),
    ];

    const promise = sequenceWithTimeout(ops, 100);
    let error: Error | null = null;
    promise.catch((e) => {
      error = e;
    });

    await vi.advanceTimersByTimeAsync(101);

    expect(error).toBeInstanceOf(TimeoutError);
  });

  it("respects total deadline", async () => {
    vi.useRealTimers();
    const deadline = Deadline.after(50);

    const ops = [
      () =>
        new Promise<number>((r) => setTimeout(() => r(1), 20)),
      () =>
        new Promise<number>((r) => setTimeout(() => r(2), 20)),
      () =>
        new Promise<number>((r) => setTimeout(() => r(3), 20)),
    ];

    await expect(sequenceWithTimeout(ops, 1000, deadline)).rejects.toThrow(
      TimeoutError
    );
  });
});
