import { describe, it, expect, vi, beforeEach } from "vitest";

// Test wallet data
const mockTokens = [
  {
    symbol: "SOL",
    name: "Solana",
    balance: 12.5,
    usdValue: 2500,
    price: 200,
    change24h: 5.2,
    icon: "/tokens/sol.svg",
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    balance: 1000,
    usdValue: 1000,
    price: 1,
    change24h: 0.01,
    icon: "/tokens/usdc.svg",
  },
];

const mockTransactions = [
  {
    id: "tx-1",
    type: "receive" as const,
    token: "SOL",
    amount: 5,
    from: "ABC...XYZ",
    to: "self",
    timestamp: Date.now() - 3600000,
    status: "confirmed" as const,
    signature: "sig123",
  },
  {
    id: "tx-2",
    type: "send" as const,
    token: "USDC",
    amount: 100,
    from: "self",
    to: "DEF...UVW",
    timestamp: Date.now() - 7200000,
    status: "confirmed" as const,
    signature: "sig456",
  },
];

describe("Wallet Page", () => {
  describe("Token Balances", () => {
    it("should calculate total portfolio value", () => {
      const getTotalValue = (tokens: typeof mockTokens) => {
        return tokens.reduce((sum, t) => sum + t.usdValue, 0);
      };

      expect(getTotalValue(mockTokens)).toBe(3500);
    });

    it("should format token balance correctly", () => {
      const formatBalance = (balance: number, decimals = 4) => {
        if (balance >= 1000000) {
          return `${(balance / 1000000).toFixed(2)}M`;
        }
        if (balance >= 1000) {
          return `${(balance / 1000).toFixed(2)}K`;
        }
        return balance.toFixed(decimals);
      };

      expect(formatBalance(12.5)).toBe("12.5000");
      expect(formatBalance(1500)).toBe("1.50K");
      expect(formatBalance(2500000)).toBe("2.50M");
    });

    it("should format USD value correctly", () => {
      const formatUSD = (value: number) => {
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(value);
      };

      expect(formatUSD(2500)).toBe("$2,500.00");
      expect(formatUSD(1000)).toBe("$1,000.00");
    });

    it("should show correct change indicator", () => {
      const getChangeColor = (change: number) => {
        if (change > 0) return "text-green-400";
        if (change < 0) return "text-red-400";
        return "text-gray-400";
      };

      expect(getChangeColor(5.2)).toBe("text-green-400");
      expect(getChangeColor(-3.1)).toBe("text-red-400");
      expect(getChangeColor(0)).toBe("text-gray-400");
    });
  });

  describe("Transactions", () => {
    it("should sort transactions by timestamp", () => {
      const sortByTimestamp = (txs: typeof mockTransactions) => {
        return [...txs].sort((a, b) => b.timestamp - a.timestamp);
      };

      const sorted = sortByTimestamp(mockTransactions);
      expect(sorted[0].id).toBe("tx-1");
    });

    it("should filter transactions by type", () => {
      const filterByType = (txs: typeof mockTransactions, type: string) => {
        if (type === "all") return txs;
        return txs.filter((tx) => tx.type === type);
      };

      expect(filterByType(mockTransactions, "all")).toHaveLength(2);
      expect(filterByType(mockTransactions, "receive")).toHaveLength(1);
      expect(filterByType(mockTransactions, "send")).toHaveLength(1);
    });

    it("should format relative time correctly", () => {
      const formatRelativeTime = (timestamp: number) => {
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}d ago`;
        if (hours > 0) return `${hours}h ago`;
        if (minutes > 0) return `${minutes}m ago`;
        return "just now";
      };

      const oneHourAgo = Date.now() - 3600000;
      expect(formatRelativeTime(oneHourAgo)).toBe("1h ago");
    });

    it("should show correct status badge", () => {
      const getStatusBadge = (status: string) => {
        switch (status) {
          case "confirmed":
            return { color: "bg-green-500/20 text-green-400", text: "Confirmed" };
          case "pending":
            return { color: "bg-yellow-500/20 text-yellow-400", text: "Pending" };
          case "failed":
            return { color: "bg-red-500/20 text-red-400", text: "Failed" };
          default:
            return { color: "bg-gray-500/20 text-gray-400", text: status };
        }
      };

      expect(getStatusBadge("confirmed").text).toBe("Confirmed");
      expect(getStatusBadge("pending").color).toContain("yellow");
      expect(getStatusBadge("failed").color).toContain("red");
    });
  });

  describe("Portfolio Allocation", () => {
    it("should calculate percentage allocation", () => {
      const getPercentage = (tokenValue: number, totalValue: number) => {
        if (totalValue === 0) return 0;
        return Math.round((tokenValue / totalValue) * 100);
      };

      const totalValue = mockTokens.reduce((sum, t) => sum + t.usdValue, 0);
      expect(getPercentage(2500, totalValue)).toBe(71); // SOL
      expect(getPercentage(1000, totalValue)).toBe(29); // USDC
    });

    it("should assign colors to tokens", () => {
      const tokenColors: Record<string, string> = {
        SOL: "#9945FF",
        USDC: "#2775CA",
        ETH: "#627EEA",
        BTC: "#F7931A",
      };

      expect(tokenColors["SOL"]).toBe("#9945FF");
      expect(tokenColors["USDC"]).toBe("#2775CA");
    });
  });

  describe("Address Formatting", () => {
    it("should truncate addresses correctly", () => {
      const truncateAddress = (address: string, chars = 4) => {
        if (address.length <= chars * 2 + 3) return address;
        return `${address.slice(0, chars)}...${address.slice(-chars)}`;
      };

      expect(truncateAddress("ABC123DEF456GHI789JKL")).toBe("ABC1...9JKL");
      expect(truncateAddress("short")).toBe("short");
    });
  });
});
