import { describe, it, expect, vi } from "vitest";

// Test autonomy data
const mockApprovalQueue = [
  {
    id: "req-1",
    action: "Execute DCA trade",
    category: "trading",
    riskScore: 45,
    requestedAt: Date.now() - 1800000,
    details: "Buy 10 SOL at market price",
    requester: "Trading Agent",
  },
  {
    id: "req-2",
    action: "Post tweet",
    category: "content",
    riskScore: 25,
    requestedAt: Date.now() - 3600000,
    details: "Market update tweet about SOL performance",
    requester: "Growth Engine",
  },
  {
    id: "req-3",
    action: "Deploy contract",
    category: "development",
    riskScore: 75,
    requestedAt: Date.now() - 7200000,
    details: "Deploy updated token contract to mainnet",
    requester: "Deployer Agent",
  },
];

const mockBoundaries = {
  financial: {
    maxAutoExpense: 50,
    maxDailySpend: 100,
    maxTradeSize: 500,
  },
  content: {
    maxAutoPostsPerDay: 10,
    maxAutoBlogsPerWeek: 3,
    requireApprovalForMentions: true,
  },
  development: {
    maxAutoCommitLines: 100,
    autoDeployToProduction: false,
    requireReviewForSecurity: true,
  },
};

describe("Autonomy Controls Page", () => {
  describe("Risk Classification", () => {
    it("should classify risk levels correctly", () => {
      const getRiskLevel = (score: number) => {
        if (score <= 20) return "safe";
        if (score <= 40) return "low";
        if (score <= 60) return "medium";
        if (score <= 80) return "high";
        return "critical";
      };

      expect(getRiskLevel(15)).toBe("safe");
      expect(getRiskLevel(30)).toBe("low");
      expect(getRiskLevel(45)).toBe("medium");
      expect(getRiskLevel(75)).toBe("high");
      expect(getRiskLevel(90)).toBe("critical");
    });

    it("should return correct colors for risk levels", () => {
      const getRiskColor = (score: number) => {
        if (score <= 20) return "bg-green-500/20 text-green-400";
        if (score <= 40) return "bg-blue-500/20 text-blue-400";
        if (score <= 60) return "bg-yellow-500/20 text-yellow-400";
        if (score <= 80) return "bg-orange-500/20 text-orange-400";
        return "bg-red-500/20 text-red-400";
      };

      expect(getRiskColor(15)).toContain("green");
      expect(getRiskColor(30)).toContain("blue");
      expect(getRiskColor(45)).toContain("yellow");
      expect(getRiskColor(75)).toContain("orange");
      expect(getRiskColor(90)).toContain("red");
    });
  });

  describe("Approval Queue", () => {
    it("should sort queue by risk score (descending)", () => {
      const sortByRisk = (queue: typeof mockApprovalQueue) => {
        return [...queue].sort((a, b) => b.riskScore - a.riskScore);
      };

      const sorted = sortByRisk(mockApprovalQueue);
      expect(sorted[0].riskScore).toBe(75);
      expect(sorted[1].riskScore).toBe(45);
      expect(sorted[2].riskScore).toBe(25);
    });

    it("should sort queue by time (oldest first)", () => {
      const sortByTime = (queue: typeof mockApprovalQueue) => {
        return [...queue].sort((a, b) => a.requestedAt - b.requestedAt);
      };

      const sorted = sortByTime(mockApprovalQueue);
      expect(sorted[0].id).toBe("req-3"); // oldest
      expect(sorted[2].id).toBe("req-1"); // newest
    });

    it("should filter queue by category", () => {
      const filterByCategory = (queue: typeof mockApprovalQueue, category: string) => {
        if (category === "all") return queue;
        return queue.filter((r) => r.category === category);
      };

      expect(filterByCategory(mockApprovalQueue, "all")).toHaveLength(3);
      expect(filterByCategory(mockApprovalQueue, "trading")).toHaveLength(1);
      expect(filterByCategory(mockApprovalQueue, "content")).toHaveLength(1);
      expect(filterByCategory(mockApprovalQueue, "development")).toHaveLength(1);
    });

    it("should count pending by category", () => {
      const countByCategory = (queue: typeof mockApprovalQueue) => {
        return queue.reduce(
          (acc, r) => {
            acc[r.category] = (acc[r.category] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        );
      };

      const counts = countByCategory(mockApprovalQueue);
      expect(counts["trading"]).toBe(1);
      expect(counts["content"]).toBe(1);
      expect(counts["development"]).toBe(1);
    });
  });

  describe("Decision Routing", () => {
    it("should determine correct decision based on autonomy level and risk", () => {
      const getDecision = (autonomyLevel: number, riskScore: number) => {
        const thresholds = {
          1: { autoExecute: 0, queueApproval: 20, escalate: 50 },
          2: { autoExecute: 20, queueApproval: 60, escalate: 80 },
          3: { autoExecute: 40, queueApproval: 80, escalate: 95 },
          4: { autoExecute: 60, queueApproval: 90, escalate: 100 },
        };

        const threshold = thresholds[autonomyLevel as keyof typeof thresholds];

        if (riskScore <= threshold.autoExecute) return "auto_execute";
        if (riskScore <= threshold.queueApproval) return "queue_approval";
        if (riskScore <= threshold.escalate) return "escalate";
        return "reject";
      };

      // Level 1 (manual): autoExecute: 0, queueApproval: 20, escalate: 50
      expect(getDecision(1, 0)).toBe("auto_execute");
      expect(getDecision(1, 10)).toBe("queue_approval");
      expect(getDecision(1, 30)).toBe("escalate");
      expect(getDecision(1, 60)).toBe("reject");

      // Level 2 (bounded): autoExecute: 20, queueApproval: 60, escalate: 80
      expect(getDecision(2, 15)).toBe("auto_execute");
      expect(getDecision(2, 45)).toBe("queue_approval");
      expect(getDecision(2, 75)).toBe("escalate");
      expect(getDecision(2, 90)).toBe("reject");

      // Level 3 (supervised): autoExecute: 40, queueApproval: 80, escalate: 95
      expect(getDecision(3, 30)).toBe("auto_execute");
      expect(getDecision(3, 60)).toBe("queue_approval");
      expect(getDecision(3, 90)).toBe("escalate");
      expect(getDecision(3, 99)).toBe("reject");

      // Level 4 (autonomous): autoExecute: 60, queueApproval: 90, escalate: 100
      expect(getDecision(4, 50)).toBe("auto_execute");
      expect(getDecision(4, 80)).toBe("queue_approval");
      expect(getDecision(4, 95)).toBe("escalate");
    });
  });

  describe("Boundary Validation", () => {
    it("should validate financial boundaries", () => {
      const validateFinancial = (amount: number, boundaries: typeof mockBoundaries.financial) => {
        if (amount > boundaries.maxTradeSize) return { valid: false, reason: "exceeds max trade size" };
        if (amount > boundaries.maxAutoExpense) return { valid: false, reason: "requires approval" };
        return { valid: true };
      };

      expect(validateFinancial(30, mockBoundaries.financial).valid).toBe(true);
      expect(validateFinancial(75, mockBoundaries.financial).valid).toBe(false);
      expect(validateFinancial(600, mockBoundaries.financial).reason).toBe("exceeds max trade size");
    });

    it("should validate content boundaries", () => {
      const validateContent = (
        postsToday: number,
        boundaries: typeof mockBoundaries.content
      ) => {
        if (postsToday >= boundaries.maxAutoPostsPerDay) {
          return { valid: false, reason: "daily limit reached" };
        }
        return { valid: true };
      };

      expect(validateContent(5, mockBoundaries.content).valid).toBe(true);
      expect(validateContent(10, mockBoundaries.content).valid).toBe(false);
    });
  });

  describe("Audit Log", () => {
    it("should format audit entries correctly", () => {
      const formatAuditEntry = (entry: {
        action: string;
        decision: string;
        timestamp: number;
        riskScore: number;
      }) => {
        const timeAgo = Math.floor((Date.now() - entry.timestamp) / 60000);
        return {
          ...entry,
          formattedTime: timeAgo < 60 ? `${timeAgo}m ago` : `${Math.floor(timeAgo / 60)}h ago`,
          decisionIcon: entry.decision === "approved" ? "check" : "x",
        };
      };

      const entry = {
        action: "Execute trade",
        decision: "approved",
        timestamp: Date.now() - 1800000, // 30 mins ago
        riskScore: 35,
      };

      const formatted = formatAuditEntry(entry);
      expect(formatted.formattedTime).toBe("30m ago");
      expect(formatted.decisionIcon).toBe("check");
    });
  });

  describe("Autonomy Levels", () => {
    it("should return correct level descriptions", () => {
      const getLevelDescription = (level: number) => {
        const descriptions: Record<number, string> = {
          1: "Manual - All actions require approval",
          2: "Bounded - Low-risk actions auto-execute",
          3: "Supervised - Most actions auto-execute, high-risk queued",
          4: "Autonomous - Full autonomy with minimal oversight",
        };
        return descriptions[level] || "Unknown level";
      };

      expect(getLevelDescription(1)).toContain("Manual");
      expect(getLevelDescription(2)).toContain("Bounded");
      expect(getLevelDescription(3)).toContain("Supervised");
      expect(getLevelDescription(4)).toContain("Autonomous");
    });

    it("should validate level changes", () => {
      const canChangeLevel = (currentLevel: number, newLevel: number) => {
        // Can only change by 1 level at a time
        return Math.abs(newLevel - currentLevel) === 1;
      };

      expect(canChangeLevel(2, 3)).toBe(true);
      expect(canChangeLevel(2, 4)).toBe(false);
      expect(canChangeLevel(3, 2)).toBe(true);
    });
  });
});
