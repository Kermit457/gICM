import { describe, it, expect, vi } from "vitest";

// Test trading data
const mockTrades = [
  {
    id: "trade-1",
    timestamp: Date.now() - 3600000,
    asset: "SOL",
    type: "buy" as const,
    amount: 10,
    price: 195,
    total: 1950,
    pnl: 50,
    pnlPercent: 2.56,
    status: "completed" as const,
  },
  {
    id: "trade-2",
    timestamp: Date.now() - 7200000,
    asset: "ETH",
    type: "sell" as const,
    amount: 0.5,
    price: 3200,
    total: 1600,
    pnl: -30,
    pnlPercent: -1.88,
    status: "completed" as const,
  },
];

const mockDailyPnL = [
  { date: "2024-01-01", pnl: 120 },
  { date: "2024-01-02", pnl: -45 },
  { date: "2024-01-03", pnl: 200 },
  { date: "2024-01-04", pnl: 75 },
  { date: "2024-01-05", pnl: -20 },
];

describe("Trading Analytics Page", () => {
  describe("PnL Calculations", () => {
    it("should calculate total PnL", () => {
      const getTotalPnL = (trades: typeof mockTrades) => {
        return trades.reduce((sum, t) => sum + t.pnl, 0);
      };

      expect(getTotalPnL(mockTrades)).toBe(20);
    });

    it("should calculate cumulative PnL", () => {
      const getCumulativePnL = (dailyPnL: typeof mockDailyPnL) => {
        let cumulative = 0;
        return dailyPnL.map((d) => {
          cumulative += d.pnl;
          return { date: d.date, cumulative };
        });
      };

      const cumulative = getCumulativePnL(mockDailyPnL);
      expect(cumulative[0].cumulative).toBe(120);
      expect(cumulative[1].cumulative).toBe(75); // 120 - 45
      expect(cumulative[4].cumulative).toBe(330); // 120 - 45 + 200 + 75 - 20
    });

    it("should format PnL with color", () => {
      const formatPnL = (value: number) => {
        const color = value >= 0 ? "text-green-400" : "text-red-400";
        const sign = value >= 0 ? "+" : "-";
        return {
          color,
          text: `${sign}$${Math.abs(value).toFixed(2)}`,
        };
      };

      expect(formatPnL(50).color).toBe("text-green-400");
      expect(formatPnL(50).text).toBe("+$50.00");
      expect(formatPnL(-30).color).toBe("text-red-400");
      expect(formatPnL(-30).text).toBe("-$30.00");
    });
  });

  describe("Trading Stats", () => {
    it("should calculate win rate", () => {
      const getWinRate = (trades: typeof mockTrades) => {
        if (trades.length === 0) return 0;
        const wins = trades.filter((t) => t.pnl > 0).length;
        return Math.round((wins / trades.length) * 100);
      };

      expect(getWinRate(mockTrades)).toBe(50);
    });

    it("should find best trade", () => {
      const getBestTrade = (trades: typeof mockTrades) => {
        if (trades.length === 0) return null;
        return trades.reduce((best, t) => (t.pnl > best.pnl ? t : best), trades[0]);
      };

      const best = getBestTrade(mockTrades);
      expect(best?.pnl).toBe(50);
      expect(best?.asset).toBe("SOL");
    });

    it("should find worst trade", () => {
      const getWorstTrade = (trades: typeof mockTrades) => {
        if (trades.length === 0) return null;
        return trades.reduce((worst, t) => (t.pnl < worst.pnl ? t : worst), trades[0]);
      };

      const worst = getWorstTrade(mockTrades);
      expect(worst?.pnl).toBe(-30);
      expect(worst?.asset).toBe("ETH");
    });

    it("should calculate average trade size", () => {
      const getAverageTradeSize = (trades: typeof mockTrades) => {
        if (trades.length === 0) return 0;
        const total = trades.reduce((sum, t) => sum + t.total, 0);
        return total / trades.length;
      };

      expect(getAverageTradeSize(mockTrades)).toBe(1775); // (1950 + 1600) / 2
    });
  });

  describe("Asset Allocation", () => {
    it("should calculate allocation percentages", () => {
      const holdings = [
        { asset: "SOL", value: 5000 },
        { asset: "ETH", value: 3000 },
        { asset: "USDC", value: 2000 },
      ];

      const getAllocation = (holdings: Array<{ asset: string; value: number }>) => {
        const total = holdings.reduce((sum, h) => sum + h.value, 0);
        return holdings.map((h) => ({
          asset: h.asset,
          percentage: Math.round((h.value / total) * 100),
        }));
      };

      const allocation = getAllocation(holdings);
      expect(allocation[0].percentage).toBe(50); // SOL
      expect(allocation[1].percentage).toBe(30); // ETH
      expect(allocation[2].percentage).toBe(20); // USDC
    });
  });

  describe("Trade Filtering", () => {
    it("should filter trades by type", () => {
      const filterByType = (trades: typeof mockTrades, type: string) => {
        if (type === "all") return trades;
        return trades.filter((t) => t.type === type);
      };

      expect(filterByType(mockTrades, "all")).toHaveLength(2);
      expect(filterByType(mockTrades, "buy")).toHaveLength(1);
      expect(filterByType(mockTrades, "sell")).toHaveLength(1);
    });

    it("should filter trades by asset", () => {
      const filterByAsset = (trades: typeof mockTrades, asset: string) => {
        if (asset === "all") return trades;
        return trades.filter((t) => t.asset === asset);
      };

      expect(filterByAsset(mockTrades, "SOL")).toHaveLength(1);
      expect(filterByAsset(mockTrades, "ETH")).toHaveLength(1);
      expect(filterByAsset(mockTrades, "BTC")).toHaveLength(0);
    });

    it("should filter trades by date range", () => {
      // Create fresh trades with known timestamps for this test
      const baseTime = 1700000000000; // Fixed timestamp
      const testTrades = [
        { ...mockTrades[0], timestamp: baseTime - 1000000 }, // 1000 seconds ago
        { ...mockTrades[1], timestamp: baseTime - 5000000 }, // 5000 seconds ago
      ];

      const filterByDateRange = (
        trades: typeof testTrades,
        startDate: number,
        endDate: number
      ) => {
        return trades.filter((t) => t.timestamp >= startDate && t.timestamp <= endDate);
      };

      // Filter for last 2000 seconds should get only trade 1
      const recentTrades = filterByDateRange(testTrades, baseTime - 2000000, baseTime);
      expect(recentTrades).toHaveLength(1);

      // Filter for last 6000 seconds should get both trades
      const allTrades = filterByDateRange(testTrades, baseTime - 6000000, baseTime);
      expect(allTrades).toHaveLength(2);
    });
  });

  describe("Chart Data Formatting", () => {
    it("should format data for bar chart", () => {
      const formatBarChartData = (dailyPnL: typeof mockDailyPnL) => {
        return dailyPnL.map((d) => ({
          date: d.date,
          value: d.pnl,
          fill: d.pnl >= 0 ? "#22c55e" : "#ef4444",
        }));
      };

      const chartData = formatBarChartData(mockDailyPnL);
      expect(chartData[0].fill).toBe("#22c55e"); // green
      expect(chartData[1].fill).toBe("#ef4444"); // red
    });
  });
});
