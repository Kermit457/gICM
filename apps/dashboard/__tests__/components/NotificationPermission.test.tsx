import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import {
  NotificationBanner,
  NotificationIndicator,
  NotificationSettings,
} from "../../components/NotificationPermission";

// Mock the hooks
vi.mock("../../hooks/useNotifications", () => ({
  useNotifications: vi.fn(() => ({
    supported: true,
    permission: "default",
    enabled: false,
    requestPermission: vi.fn().mockResolvedValue("granted"),
    notify: vi.fn(),
    notifyBrainStatus: vi.fn(),
    notifyPipelineComplete: vi.fn(),
    notifyHighRisk: vi.fn(),
    notifyTrade: vi.fn(),
    notifyDiscovery: vi.fn(),
    closeAll: vi.fn(),
  })),
  useNotificationPreferences: vi.fn(() => ({
    preferences: {
      enabled: true,
      sound: true,
      brainAlerts: true,
      pipelineAlerts: true,
      highRiskAlerts: true,
      tradeAlerts: true,
      discoveryAlerts: true,
    },
    updatePreferences: vi.fn(),
  })),
}));

describe("NotificationBanner", () => {
  it("renders when permission is default", () => {
    render(<NotificationBanner />);
    expect(screen.getByText("Enable Notifications")).toBeInTheDocument();
  });

  it("calls onDismiss when Not now is clicked", () => {
    const onDismiss = vi.fn();
    render(<NotificationBanner onDismiss={onDismiss} />);

    fireEvent.click(screen.getByText("Not now"));
    expect(onDismiss).toHaveBeenCalled();
  });

  it("calls requestPermission when Enable is clicked", async () => {
    const { useNotifications } = await import("../../hooks/useNotifications");
    const mockRequestPermission = vi.fn().mockResolvedValue("granted");
    vi.mocked(useNotifications).mockReturnValue({
      supported: true,
      permission: "default",
      enabled: false,
      requestPermission: mockRequestPermission,
      notify: vi.fn(),
      notifyBrainStatus: vi.fn(),
      notifyPipelineComplete: vi.fn(),
      notifyHighRisk: vi.fn(),
      notifyTrade: vi.fn(),
      notifyDiscovery: vi.fn(),
      closeAll: vi.fn(),
    });

    render(<NotificationBanner />);
    fireEvent.click(screen.getByText("Enable"));

    await waitFor(() => {
      expect(mockRequestPermission).toHaveBeenCalled();
    });
  });
});

describe("NotificationIndicator", () => {
  it("shows bell icon when supported", async () => {
    const { useNotifications } = await import("../../hooks/useNotifications");
    vi.mocked(useNotifications).mockReturnValue({
      supported: true,
      permission: "default",
      enabled: false,
      requestPermission: vi.fn(),
      notify: vi.fn(),
      notifyBrainStatus: vi.fn(),
      notifyPipelineComplete: vi.fn(),
      notifyHighRisk: vi.fn(),
      notifyTrade: vi.fn(),
      notifyDiscovery: vi.fn(),
      closeAll: vi.fn(),
    });

    render(<NotificationIndicator />);
    // Should render without crashing
    expect(document.querySelector("svg")).toBeInTheDocument();
  });

  it("shows disabled state when not enabled", async () => {
    const { useNotifications } = await import("../../hooks/useNotifications");
    vi.mocked(useNotifications).mockReturnValue({
      supported: true,
      permission: "granted",
      enabled: false,
      requestPermission: vi.fn(),
      notify: vi.fn(),
      notifyBrainStatus: vi.fn(),
      notifyPipelineComplete: vi.fn(),
      notifyHighRisk: vi.fn(),
      notifyTrade: vi.fn(),
      notifyDiscovery: vi.fn(),
      closeAll: vi.fn(),
    });

    const { container } = render(<NotificationIndicator />);
    expect(container.querySelector(".text-gray-400")).toBeInTheDocument();
  });
});

describe("NotificationSettings", () => {
  it("renders settings panel", () => {
    render(<NotificationSettings />);
    expect(screen.getByText("Notification Settings")).toBeInTheDocument();
  });

  it("shows unsupported message when notifications not supported", async () => {
    const { useNotifications } = await import("../../hooks/useNotifications");
    vi.mocked(useNotifications).mockReturnValue({
      supported: false,
      permission: "default",
      enabled: false,
      requestPermission: vi.fn(),
      notify: vi.fn(),
      notifyBrainStatus: vi.fn(),
      notifyPipelineComplete: vi.fn(),
      notifyHighRisk: vi.fn(),
      notifyTrade: vi.fn(),
      notifyDiscovery: vi.fn(),
      closeAll: vi.fn(),
    });

    render(<NotificationSettings />);
    expect(screen.getByText("Notifications Not Supported")).toBeInTheDocument();
  });
});
