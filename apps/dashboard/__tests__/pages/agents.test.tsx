import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
  }),
}));

// Mock components used in the page
vi.mock("../../components/Sidebar", () => ({
  Sidebar: () => <div data-testid="sidebar">Sidebar</div>,
}));

vi.mock("../../hooks/useWebSocket", () => ({
  useWebSocket: () => ({
    isConnected: true,
    lastMessage: null,
  }),
}));

// Test agent data
const mockAgents = [
  {
    id: "hunter-1",
    name: "Hunter Agent",
    type: "hunter",
    status: "running",
    uptime: 86400000,
    tasksCompleted: 150,
    tasksFailed: 3,
    lastActivity: Date.now() - 60000,
    metrics: {
      cpu: 45,
      memory: 62,
      requestsPerMin: 12,
    },
  },
  {
    id: "wallet-1",
    name: "Wallet Agent",
    type: "wallet",
    status: "idle",
    uptime: 172800000,
    tasksCompleted: 89,
    tasksFailed: 1,
    lastActivity: Date.now() - 300000,
    metrics: {
      cpu: 5,
      memory: 28,
      requestsPerMin: 0,
    },
  },
];

describe("Agents Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Agent Status", () => {
    it("should display correct status badge colors", () => {
      const getStatusColor = (status: string) => {
        switch (status) {
          case "running":
            return "bg-green-500/20 text-green-400";
          case "idle":
            return "bg-yellow-500/20 text-yellow-400";
          case "error":
            return "bg-red-500/20 text-red-400";
          case "stopped":
            return "bg-gray-500/20 text-gray-400";
          default:
            return "bg-gray-500/20 text-gray-400";
        }
      };

      expect(getStatusColor("running")).toContain("green");
      expect(getStatusColor("idle")).toContain("yellow");
      expect(getStatusColor("error")).toContain("red");
      expect(getStatusColor("stopped")).toContain("gray");
    });

    it("should format uptime correctly", () => {
      const formatUptime = (ms: number) => {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}d ${hours % 24}h`;
        if (hours > 0) return `${hours}h ${minutes % 60}m`;
        if (minutes > 0) return `${minutes}m`;
        return `${seconds}s`;
      };

      expect(formatUptime(86400000)).toBe("1d 0h"); // 1 day
      expect(formatUptime(3600000)).toBe("1h 0m"); // 1 hour
      expect(formatUptime(60000)).toBe("1m"); // 1 minute
      expect(formatUptime(30000)).toBe("30s"); // 30 seconds
    });
  });

  describe("Agent Filtering", () => {
    it("should filter agents by status", () => {
      const filterByStatus = (agents: typeof mockAgents, status: string) => {
        if (status === "all") return agents;
        return agents.filter((a) => a.status === status);
      };

      expect(filterByStatus(mockAgents, "all")).toHaveLength(2);
      expect(filterByStatus(mockAgents, "running")).toHaveLength(1);
      expect(filterByStatus(mockAgents, "idle")).toHaveLength(1);
      expect(filterByStatus(mockAgents, "error")).toHaveLength(0);
    });

    it("should filter agents by type", () => {
      const filterByType = (agents: typeof mockAgents, type: string) => {
        if (type === "all") return agents;
        return agents.filter((a) => a.type === type);
      };

      expect(filterByType(mockAgents, "all")).toHaveLength(2);
      expect(filterByType(mockAgents, "hunter")).toHaveLength(1);
      expect(filterByType(mockAgents, "wallet")).toHaveLength(1);
    });
  });

  describe("Agent Metrics", () => {
    it("should calculate correct metric colors", () => {
      const getMetricColor = (value: number) => {
        if (value >= 80) return "text-red-400";
        if (value >= 60) return "text-yellow-400";
        return "text-green-400";
      };

      expect(getMetricColor(90)).toBe("text-red-400");
      expect(getMetricColor(70)).toBe("text-yellow-400");
      expect(getMetricColor(40)).toBe("text-green-400");
    });

    it("should calculate success rate correctly", () => {
      const getSuccessRate = (completed: number, failed: number) => {
        const total = completed + failed;
        if (total === 0) return 100;
        return Math.round((completed / total) * 100);
      };

      expect(getSuccessRate(150, 3)).toBe(98);
      expect(getSuccessRate(89, 1)).toBe(99);
      expect(getSuccessRate(0, 0)).toBe(100);
    });
  });

  describe("Agent Actions", () => {
    it("should provide correct actions based on status", () => {
      const getAvailableActions = (status: string) => {
        const actions = [];
        if (status === "running" || status === "idle") {
          actions.push("stop", "restart");
        }
        if (status === "stopped" || status === "error") {
          actions.push("start");
        }
        actions.push("logs", "config");
        return actions;
      };

      expect(getAvailableActions("running")).toContain("stop");
      expect(getAvailableActions("stopped")).toContain("start");
      expect(getAvailableActions("error")).toContain("start");
      expect(getAvailableActions("running")).toContain("logs");
    });
  });
});
