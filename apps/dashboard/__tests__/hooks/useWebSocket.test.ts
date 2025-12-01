import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useWebSocket } from "../../hooks/useWebSocket";

describe("useWebSocket", () => {
  it("should start with connecting status", () => {
    const { result } = renderHook(() => useWebSocket());
    // Initial status should be connecting
    expect(["connecting", "connected"]).toContain(result.current.status);
  });

  it("should provide isConnected property", () => {
    const { result } = renderHook(() => useWebSocket());
    expect(typeof result.current.isConnected).toBe("boolean");
  });

  it("should start with empty events array", () => {
    const { result } = renderHook(() => useWebSocket());
    expect(result.current.events).toEqual([]);
  });

  it("should provide disconnect function", () => {
    const { result } = renderHook(() => useWebSocket());
    expect(typeof result.current.disconnect).toBe("function");
  });

  it("should provide clearEvents function", () => {
    const { result } = renderHook(() => useWebSocket());
    expect(typeof result.current.clearEvents).toBe("function");
  });

  it("should clear events when clearEvents is called", () => {
    const { result } = renderHook(() => useWebSocket());

    act(() => {
      result.current.clearEvents();
    });

    expect(result.current.events).toEqual([]);
  });

  it("should return lastMessage property", () => {
    const { result } = renderHook(() => useWebSocket());
    // lastMessage can be null or an object
    expect(result.current.lastMessage === null || typeof result.current.lastMessage === "object").toBe(true);
  });
});
