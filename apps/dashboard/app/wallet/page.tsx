"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Clock,
  Search,
  Filter,
  ChevronRight,
  Coins,
  DollarSign,
  PieChart,
  Loader2,
} from "lucide-react";
import { hubApi } from "@/lib/api/hub";
import { tradingApi } from "@/lib/api/trading";
import { useWebSocket } from "@/hooks/useWebSocket";
import { ConnectionIndicator } from "@/components/ConnectionIndicator";

// Types
interface TokenBalance {
  symbol: string;
  name: string;
  balance: number;
  usdValue: number;
  price: number;
  change24h: number;
  icon?: string;
}

interface Transaction {
  id: string;
  type: "send" | "receive" | "swap";
  token: string;
  amount: number;
  usdValue: number;
  from?: string;
  to?: string;
  timestamp: number;
  status: "confirmed" | "pending" | "failed";
  txHash: string;
}

interface WalletData {
  sol: number;
  usdc: number;
  solPrice: number;
  totalUsd: number;
  address: string;
}

// Empty initial state - data comes from wallet API

// Use environment variable or fallback to mock
const WALLET_ADDRESS = process.env.NEXT_PUBLIC_GICM_WALLET?.slice(0, 8) + "..." + process.env.NEXT_PUBLIC_GICM_WALLET?.slice(-8) || "8xYz2...nM4qR9pL";
const FULL_ADDRESS = process.env.NEXT_PUBLIC_GICM_WALLET || "8xYz2kL9mN4qR9pLwS7tH3jK5xM2nP6rT8vQ1";

function formatNumber(num: number, decimals = 2): string {
  if (num >= 1e9) return (num / 1e9).toFixed(decimals) + "B";
  if (num >= 1e6) return (num / 1e6).toFixed(decimals) + "M";
  if (num >= 1e3) return (num / 1e3).toFixed(decimals) + "K";
  return num.toFixed(decimals);
}

function formatTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return new Date(timestamp).toLocaleDateString();
}

function TokenRow({ token }: { token: TokenBalance }) {
  const isPositive = token.change24h >= 0;

  return (
    <div className="flex items-center justify-between p-4 hover:bg-white/5 rounded-lg transition-colors">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-gicm-primary/20 flex items-center justify-center">
          <span className="text-sm font-bold text-gicm-primary">{token.symbol[0]}</span>
        </div>
        <div>
          <p className="font-medium text-white">{token.symbol}</p>
          <p className="text-sm text-gray-400">{token.name}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-medium text-white">{formatNumber(token.balance)} {token.symbol}</p>
        <p className="text-sm text-gray-400">${formatNumber(token.usdValue)}</p>
      </div>
      <div className="text-right w-24">
        <p className="font-medium text-white">${token.price < 0.01 ? token.price.toFixed(6) : token.price.toFixed(2)}</p>
        <p className={`text-sm flex items-center justify-end gap-1 ${isPositive ? "text-green-400" : "text-red-400"}`}>
          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {Math.abs(token.change24h)}%
        </p>
      </div>
    </div>
  );
}

function TransactionRow({ tx }: { tx: Transaction }) {
  const icons = {
    send: ArrowUpRight,
    receive: ArrowDownRight,
    swap: RefreshCw,
  };
  const colors = {
    send: "text-red-400 bg-red-500/20",
    receive: "text-green-400 bg-green-500/20",
    swap: "text-blue-400 bg-blue-500/20",
  };
  const Icon = icons[tx.type];

  return (
    <div className="flex items-center justify-between p-4 hover:bg-white/5 rounded-lg transition-colors">
      <div className="flex items-center gap-4">
        <div className={`p-2 rounded-lg ${colors[tx.type]}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <p className="font-medium text-white capitalize">{tx.type}</p>
          <p className="text-sm text-gray-400">{tx.token}</p>
        </div>
      </div>
      <div className="text-right">
        <p className={`font-medium ${tx.type === "receive" ? "text-green-400" : tx.type === "send" ? "text-red-400" : "text-white"}`}>
          {tx.type === "receive" ? "+" : tx.type === "send" ? "-" : ""}{formatNumber(tx.amount)}
        </p>
        <p className="text-sm text-gray-400">${formatNumber(tx.usdValue)}</p>
      </div>
      <div className="text-right">
        <p className="text-sm text-gray-400">{formatTime(tx.timestamp)}</p>
        <p className={`text-xs ${tx.status === "confirmed" ? "text-green-400" : tx.status === "pending" ? "text-yellow-400" : "text-red-400"}`}>
          {tx.status}
        </p>
      </div>
      <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
        <ExternalLink className="w-4 h-4 text-gray-400" />
      </button>
    </div>
  );
}

export default function WalletPage() {
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"tokens" | "transactions">("tokens");
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [isLive, setIsLive] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // WebSocket connection for real-time updates
  const ws = useWebSocket({
    autoReconnect: true,
    reconnectDelay: 3000,
    onEvent: (event) => {
      // Handle wallet-related events
      if (event.type?.includes("wallet") || event.type?.includes("trading") || event.type?.includes("balance")) {
        fetchData();
      }
    },
  });

  // Fetch real data from APIs
  const fetchData = useCallback(async () => {
    try {
      // Fetch from multiple sources in parallel
      const [walletRes, treasuryRes, positionsRes, tradesRes] = await Promise.all([
        fetch("/api/wallet").then(r => r.ok ? r.json() : null).catch(() => null),
        hubApi.getTreasury(),
        tradingApi.getPositions(),
        tradingApi.getTradesToday(),
      ]);

      const newBalances: TokenBalance[] = [];

      // Add SOL balance from wallet API
      if (walletRes && walletRes.sol > 0) {
        newBalances.push({
          symbol: "SOL",
          name: "Solana",
          balance: walletRes.sol,
          usdValue: walletRes.sol * walletRes.solPrice,
          price: walletRes.solPrice,
          change24h: 0, // Would need historical price data
        });
        setIsLive(true);
      }

      // Add USDC balance from wallet API
      if (walletRes && walletRes.usdc > 0) {
        newBalances.push({
          symbol: "USDC",
          name: "USD Coin",
          balance: walletRes.usdc,
          usdValue: walletRes.usdc,
          price: 1.00,
          change24h: 0,
        });
      }

      // Add balances from treasury API (hub)
      if (treasuryRes) {
        // Check if we already have SOL/USDC from wallet API
        const hasSol = newBalances.some(b => b.symbol === "SOL");
        const hasUsdc = newBalances.some(b => b.symbol === "USDC");

        if (!hasSol && treasuryRes.balances.sol > 0) {
          const solPrice = 230; // Default if not available
          newBalances.push({
            symbol: "SOL",
            name: "Solana",
            balance: treasuryRes.balances.sol,
            usdValue: treasuryRes.balances.sol * solPrice,
            price: solPrice,
            change24h: 0,
          });
        }

        if (!hasUsdc && treasuryRes.balances.usdc > 0) {
          newBalances.push({
            symbol: "USDC",
            name: "USD Coin",
            balance: treasuryRes.balances.usdc,
            usdValue: treasuryRes.balances.usdc,
            price: 1.00,
            change24h: 0,
          });
        }
      }

      // Add positions from trading API
      if (positionsRes && Array.isArray(positionsRes)) {
        positionsRes.forEach(pos => {
          // Avoid duplicates
          if (!newBalances.some(b => b.symbol === pos.token)) {
            newBalances.push({
              symbol: pos.token,
              name: pos.token,
              balance: pos.quantity,
              usdValue: pos.quantity * pos.currentPrice,
              price: pos.currentPrice,
              change24h: pos.pnlPercent || 0,
            });
          }
        });
      }

      // If we got real data, use it; otherwise fallback to mock
      if (newBalances.length > 0) {
        setBalances(newBalances);
      }

      // Transform trades to transactions
      if (tradesRes && Array.isArray(tradesRes) && tradesRes.length > 0) {
        const newTransactions: Transaction[] = tradesRes.map((trade, idx) => ({
          id: trade.id || `trade-${idx}`,
          type: trade.type === "buy" ? "receive" : "send",
          token: trade.asset,
          amount: trade.amount,
          usdValue: trade.total,
          timestamp: trade.timestamp,
          status: trade.status === "completed" ? "confirmed" : trade.status === "pending" ? "pending" : "failed",
          txHash: `${trade.id?.slice(0, 8)}...`,
        }));
        setTransactions(newTransactions);
      }

      setLastUpdated(Date.now());
    } catch (error) {
      console.error("[Wallet] Failed to fetch data:", error);
      // Keep mock data on error
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch and adaptive polling based on WebSocket status
  useEffect(() => {
    fetchData();
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [fetchData]);

  // Adjust polling based on WebSocket connection
  useEffect(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }
    // When WebSocket is connected, poll less frequently (30s for metrics only)
    // When disconnected, poll more frequently (10s)
    const interval = ws.isConnected ? 30000 : 10000;
    pollingRef.current = setInterval(fetchData, interval);
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [ws.isConnected, fetchData]);

  const totalValue = balances.reduce((sum, t) => sum + t.usdValue, 0);
  const totalChange = balances.reduce((sum, t) => sum + (t.usdValue * t.change24h / 100), 0);
  const totalChangePercent = totalValue > 0 ? (totalChange / (totalValue - totalChange)) * 100 : 0;

  const handleCopy = () => {
    navigator.clipboard.writeText(FULL_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRefresh = () => {
    setLoading(true);
    fetchData();
  };

  return (
    <div className="min-h-screen bg-gicm-dark p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <Wallet className="w-7 h-7 text-gicm-primary" />
              Wallet Dashboard
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-gray-400 font-mono">{WALLET_ADDRESS}</span>
              <button
                onClick={handleCopy}
                className="p-1 hover:bg-white/10 rounded transition-colors"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-400" />
                )}
              </button>
              <a
                href={`https://solscan.io/account/${FULL_ADDRESS}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 hover:bg-white/10 rounded transition-colors"
              >
                <ExternalLink className="w-4 h-4 text-gray-400" />
              </a>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* WebSocket Connection Status */}
            <ConnectionIndicator status={ws.status} isRealtime={ws.isConnected} compact />
            {isLive && (
              <div className="flex items-center gap-2 px-2 py-1 bg-green-500/20 border border-green-500/30 rounded-lg">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs text-green-400 font-medium">Data Live</span>
              </div>
            )}
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-gicm-primary text-black rounded-lg hover:bg-gicm-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Refresh
            </button>
          </div>
        </div>

        {/* Portfolio Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gicm-card border border-gicm-border rounded-xl p-6 md:col-span-2">
            <p className="text-sm text-gray-400 mb-2">Total Portfolio Value</p>
            <div className="flex items-baseline gap-4">
              <h2 className="text-4xl font-bold text-white">${formatNumber(totalValue)}</h2>
              <span className={`flex items-center gap-1 text-lg ${totalChange >= 0 ? "text-green-400" : "text-red-400"}`}>
                {totalChange >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                ${Math.abs(totalChange).toFixed(2)} ({totalChangePercent.toFixed(2)}%)
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-2">24h change</p>
          </div>

          <div className="bg-gicm-card border border-gicm-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-400">Allocation</p>
              <PieChart className="w-4 h-4 text-gray-400" />
            </div>
            <div className="space-y-2">
              {balances.slice(0, 4).map((token) => (
                <div key={token.symbol} className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">{token.symbol}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 bg-gicm-dark rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gicm-primary rounded-full"
                        style={{ width: `${(token.usdValue / totalValue) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-white w-12 text-right">
                      {((token.usdValue / totalValue) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gicm-border">
          <button
            onClick={() => setActiveTab("tokens")}
            className={`pb-3 px-1 text-sm font-medium transition-colors ${
              activeTab === "tokens"
                ? "text-gicm-primary border-b-2 border-gicm-primary"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4" />
              Tokens ({balances.length})
            </div>
          </button>
          <button
            onClick={() => setActiveTab("transactions")}
            className={`pb-3 px-1 text-sm font-medium transition-colors ${
              activeTab === "transactions"
                ? "text-gicm-primary border-b-2 border-gicm-primary"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Transactions
            </div>
          </button>
        </div>

        {/* Content */}
        <div className="bg-gicm-card border border-gicm-border rounded-xl">
          {activeTab === "tokens" ? (
            <div className="divide-y divide-gicm-border">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 text-sm text-gray-500">
                <span className="w-48">Token</span>
                <span className="text-right">Balance</span>
                <span className="text-right w-24">Price</span>
                <span className="w-8" />
              </div>
              {/* Rows */}
              {balances.map((token) => (
                <TokenRow key={token.symbol} token={token} />
              ))}
            </div>
          ) : (
            <div className="divide-y divide-gicm-border">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 text-sm text-gray-500">
                <span className="w-32">Type</span>
                <span className="text-right">Amount</span>
                <span className="text-right">Time</span>
                <span className="w-8" />
              </div>
              {/* Rows */}
              {transactions.map((tx) => (
                <TransactionRow key={tx.id} tx={tx} />
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          <button className="flex items-center justify-center gap-2 p-4 bg-gicm-card border border-gicm-border rounded-xl hover:border-gicm-primary/30 transition-colors">
            <ArrowUpRight className="w-5 h-5 text-gicm-primary" />
            <span className="text-white">Send</span>
          </button>
          <button className="flex items-center justify-center gap-2 p-4 bg-gicm-card border border-gicm-border rounded-xl hover:border-gicm-primary/30 transition-colors">
            <ArrowDownRight className="w-5 h-5 text-gicm-primary" />
            <span className="text-white">Receive</span>
          </button>
          <button className="flex items-center justify-center gap-2 p-4 bg-gicm-card border border-gicm-border rounded-xl hover:border-gicm-primary/30 transition-colors">
            <RefreshCw className="w-5 h-5 text-gicm-primary" />
            <span className="text-white">Swap</span>
          </button>
          <button className="flex items-center justify-center gap-2 p-4 bg-gicm-card border border-gicm-border rounded-xl hover:border-gicm-primary/30 transition-colors">
            <DollarSign className="w-5 h-5 text-gicm-primary" />
            <span className="text-white">Buy</span>
          </button>
        </div>
      </div>
    </div>
  );
}
