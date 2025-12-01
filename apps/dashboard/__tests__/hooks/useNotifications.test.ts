import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useNotifications, useNotificationPreferences } from "../../hooks/useNotifications";

describe("useNotifications", () => {
  beforeEach(() => {
    // Reset Notification permission
    // @ts-expect-error - Mocking
    global.Notification.permission = "default";
  });

  it("should detect notification support", () => {
    const { result } = renderHook(() => useNotifications());
    expect(result.current.supported).toBe(true);
  });

  it("should start with default permission", () => {
    const { result } = renderHook(() => useNotifications());
    expect(result.current.permission).toBe("default");
    expect(result.current.enabled).toBe(false);
  });

  it("should request permission successfully", async () => {
    const { result } = renderHook(() => useNotifications());

    let granted: boolean | undefined;
    await act(async () => {
      granted = await result.current.requestPermission();
    });

    expect(granted).toBe(true);
    expect(result.current.permission).toBe("granted");
    expect(result.current.enabled).toBe(true);
  });

  it("should not request permission if already granted", async () => {
    // @ts-expect-error - Mocking
    global.Notification.permission = "granted";

    const { result } = renderHook(() => useNotifications());

    let granted: boolean | undefined;
    await act(async () => {
      granted = await result.current.requestPermission();
    });

    expect(granted).toBe(true);
  });

  it("should return false if permission is denied", async () => {
    // @ts-expect-error - Mocking
    global.Notification.permission = "denied";

    const { result } = renderHook(() => useNotifications());

    let granted: boolean | undefined;
    await act(async () => {
      granted = await result.current.requestPermission();
    });

    expect(granted).toBe(false);
  });

  it("should create notification when permission is granted", async () => {
    // @ts-expect-error - Mocking
    global.Notification.permission = "granted";

    const { result } = renderHook(() => useNotifications());

    let notification: Notification | null = null;
    act(() => {
      notification = result.current.notify({
        title: "Test",
        body: "Test notification",
      });
    });

    expect(notification).not.toBeNull();
    expect(notification?.title).toBe("Test");
    expect(notification?.body).toBe("Test notification");
  });

  it("should not create notification when permission is not granted", () => {
    const { result } = renderHook(() => useNotifications());

    let notification: Notification | null = null;
    act(() => {
      notification = result.current.notify({
        title: "Test",
        body: "Test notification",
      });
    });

    expect(notification).toBeNull();
  });

  it("should have convenience methods for different notification types", async () => {
    // @ts-expect-error - Mocking
    global.Notification.permission = "granted";

    const { result } = renderHook(() => useNotifications());

    act(() => {
      result.current.notifyBrainStatus("started");
      result.current.notifyPipelineComplete("TestPipeline", true);
      result.current.notifyHighRisk("Trade", 85);
      result.current.notifyTrade("buy", "SOL", 10);
      result.current.notifyDiscovery("New Token", "Twitter");
    });

    // All notifications should be created without errors
    expect(true).toBe(true);
  });
});

describe("useNotificationPreferences", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should have default preferences", () => {
    const { result } = renderHook(() => useNotificationPreferences());

    expect(result.current.preferences.enabled).toBe(true);
    expect(result.current.preferences.sound).toBe(true);
    expect(result.current.preferences.brainAlerts).toBe(true);
    expect(result.current.preferences.pipelineAlerts).toBe(true);
    expect(result.current.preferences.highRiskAlerts).toBe(true);
    expect(result.current.preferences.tradeAlerts).toBe(false);
    expect(result.current.preferences.discoveryAlerts).toBe(false);
  });

  it("should update preferences", () => {
    const { result } = renderHook(() => useNotificationPreferences());

    act(() => {
      result.current.updatePreferences({ sound: false });
    });

    expect(result.current.preferences.sound).toBe(false);
    expect(result.current.preferences.enabled).toBe(true); // Unchanged
  });

  it("should persist preferences to localStorage", () => {
    const { result } = renderHook(() => useNotificationPreferences());

    act(() => {
      result.current.updatePreferences({ tradeAlerts: true });
    });

    const stored = localStorage.getItem("gicm-notification-prefs");
    expect(stored).not.toBeNull();

    const parsed = JSON.parse(stored!);
    expect(parsed.tradeAlerts).toBe(true);
  });

  it("should load preferences from localStorage", () => {
    localStorage.setItem(
      "gicm-notification-prefs",
      JSON.stringify({
        enabled: false,
        sound: false,
        brainAlerts: false,
        pipelineAlerts: false,
        highRiskAlerts: false,
        tradeAlerts: true,
        discoveryAlerts: true,
      })
    );

    const { result } = renderHook(() => useNotificationPreferences());

    // Need to wait for useEffect to run
    expect(result.current.preferences.enabled).toBe(false);
    expect(result.current.preferences.tradeAlerts).toBe(true);
  });
});
