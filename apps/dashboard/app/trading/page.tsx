"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  PieChart,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Target,
  Percent,
  Wallet,
  Loader2,
} from "lucide-react";
import { tradingApi } from "@/lib/api/trading";
import { useWebSocket } from "@/hooks/useWebSocket";
import { ConnectionIndicator } from "@/components/ConnectionIndicator";

// Types
interface Trade {
  id: string;
  timestamp: number;
  type: "buy" | "sell";
  asset: string;
  amount: number;
  price: number;
  total: number;
  pnl?: number;
  pnlPercent?: number;
  status: "completed" | "pending" | "cancelled" | "failed";
}

interface PortfolioMetrics {
  totalValue: number;
  totalPnl: number;
  totalPnlPercent: number;
  dayPnl: number;
  dayPnlPercent: number;
  weekPnl: number;
  weekPnlPercent: number;
  winRate: number;
  totalTrades: number;
  avgTradeSize: number;
  bestTrade: number;
  worstTrade: number;
}

interface AssetAllocation {
  asset: string;
  value: number;
  percent: number;
  pnl: number;
  pnlPercent: number;
}

// Default empty state - data comes from trading API
const EMPTY_METRICS: PortfolioMetrics = {
  totalValue: 0,
  totalPnl: 0,
  totalPnlPercent: 0,
  dayPnl: 0,
  dayPnlPercent: 0,
  weekPnl: 0,
  weekPnlPercent: 0,
  winRate: 0,
  totalTrades: 0,
  avgTradeSize: 0,
  bestTrade: 0,
  worstTrade: 0,
};

function formatNumber(num: number): string {
  return new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
}

function formatTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return new Date(timestamp).toLocaleDateString();
}

function MetricCard({
  title,
  value,
  change,
  changePercent,
  icon: Icon,
}: {
  title: string;
  value: string;
  change?: number;
  changePercent?: number;
  icon: typeof TrendingUp;
}) {
  const isPositive = (change ?? 0) >= 0;

  return (
    <div className="bg-gicm-card border border-gicm-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-2">
        <Icon className="w-5 h-5 text-gicm-primary" />
        {change !== undefined && (
          <span className={`flex items-center gap-1 text-sm ${isPositive ? "text-green-400" : "text-red-400"}`}>
            {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {changePercent !== undefined && `${changePercent.toFixed(2)}%`}
          </span>
        )}
      </div>
      <p className="text-sm text-gray-400">{title}</p>
      <p className="text-2xl font-bold text-white mt-1">{value}</p>
      {change !== undefined && (
        <p className={`text-sm mt-1 ${isPositive ? "text-green-400" : "text-red-400"}`}>
          {isPositive ? "+" : ""}{formatNumber(change)}
        </p>
      )}
    </div>
  );
}

export default function TradingPage() {
  const [period, setPeriod] = useState<"day" | "week" | "month" | "all">("week");
  const [metrics, setMetrics] = useState<PortfolioMetrics>(EMPTY_METRICS);
  const [allocation, setAllocation] = useState<AssetAllocation[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [pnlHistory, setPnlHistory] = useState<{date: string; pnl: number}[]>([]);
  const [cumulativePnl, setCumulativePnl] = useState<{date: string; value: number}[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // WebSocket connection for real-time updates
  const ws = useWebSocket({
    autoReconnect: true,
    reconnectDelay: 3000,
    onEvent: (event) => {
      // Handle trading-related events
      if (event.type?.includes("trading") || event.type?.includes("portfolio") || event.type?.includes("trade")) {
        fetchData();
      }
    },
  });

  // Fetch data from trading API
  const fetchData = useCallback(async () => {
    try {
      const [statusRes, positionsRes, tradesRes, metricsRes, dailyPnlRes] = await Promise.all([
        tradingApi.getStatus(),
        tradingApi.getPositions(),
        tradingApi.getTradesToday(),
        tradingApi.getPortfolioMetrics(),
        tradingApi.getDailyPnL(7),
      ]);

      // Update metrics from status/portfolio API
      if (statusRes || metricsRes) {
        setIsLive(true);
        const totalValue = metricsRes?.totalValue ?? 0;
        setMetrics({
          totalValue: totalValue,
          totalPnl: metricsRes?.totalPnL ?? statusRes?.totalPnL ?? 0,
          totalPnlPercent: statusRes?.winRate ?? 0,
          dayPnl: statusRes?.dailyPnL ?? 0,
          dayPnlPercent: statusRes?.dailyPnL && totalValue > 0 ? (statusRes.dailyPnL / totalValue) * 100 : 0,
          weekPnl: statusRes?.weeklyPnL ?? 0,
          weekPnlPercent: statusRes?.weeklyPnL && totalValue > 0 ? (statusRes.weeklyPnL / totalValue) * 100 : 0,
          winRate: statusRes?.winRate ?? metricsRes?.winRate ?? 0,
          totalTrades: statusRes?.positions ?? 0,
          avgTradeSize: metricsRes?.avgTradeSize ?? 0,
          bestTrade: 0,
          worstTrade: 0,
        });
      }

      // Update positions/allocation
      if (positionsRes && Array.isArray(positionsRes) && positionsRes.length > 0) {
        const totalValue = positionsRes.reduce((sum, pos) => sum + pos.quantity * pos.currentPrice, 0);
        const newAllocation: AssetAllocation[] = positionsRes.map(pos => ({
          asset: pos.token,
          value: pos.quantity * pos.currentPrice,
          percent: totalValue > 0 ? (pos.quantity * pos.currentPrice / totalValue) * 100 : 0,
          pnl: pos.pnl,
          pnlPercent: pos.pnlPercent,
        }));
        setAllocation(newAllocation);
      }

      // Update trades
      if (tradesRes && Array.isArray(tradesRes) && tradesRes.length > 0) {
        const newTrades: Trade[] = tradesRes.map(trade => ({
          id: trade.id,
          timestamp: trade.timestamp,
          type: trade.type,
          asset: trade.asset,
          amount: trade.amount,
          price: trade.price,
          total: trade.total,
          pnl: trade.pnl,
          pnlPercent: trade.pnlPercent,
          status: trade.status,
        }));
        setTrades(newTrades);
      }

      // Update daily PnL history
      if (dailyPnlRes && Array.isArray(dailyPnlRes) && dailyPnlRes.length > 0) {
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const newPnlHistory = dailyPnlRes.map(d => ({
          date: days[new Date(d.date).getDay()],
          pnl: d.pnl,
        }));
        setPnlHistory(newPnlHistory);

        // Calculate cumulative
        let cumulative = 0;
        const newCumulative = dailyPnlRes.map((d, i) => {
          cumulative += d.pnl;
          return { date: `D${i + 1}`, value: cumulative };
        });
        setCumulativePnl(newCumulative);
      }
    } catch (error) {
      console.error("[Trading] Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchData();
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [fetchData]);

  // Adaptive polling based on WebSocket status
  useEffect(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }
    // Poll more frequently when WebSocket is disconnected
    const interval = ws.isConnected ? 30000 : 10000;
    pollingRef.current = setInterval(fetchData, interval);
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [ws.isConnected, fetchData]);

  const handleRefresh = () => {
    setLoading(true);
    fetchData();
  };

  const maxPnl = Math.max(...pnlHistory.map((d) => Math.abs(d.pnl)), 1);
  const maxCumulative = Math.max(...cumulativePnl.map((d) => d.value), 1);

  return (
    <div className="min-h-screen bg-gicm-dark p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <BarChart3 className="w-7 h-7 text-gicm-primary" />
              Trading Analytics
            </h1>
            <p className="text-gray-400 mt-1">
              Portfolio performance, PnL tracking, and trade history
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex bg-gicm-card rounded-lg p-1">
              {(["day", "week", "month", "all"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    period === p
                      ? "bg-gicm-primary text-black"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  {p === "all" ? "All" : p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
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
              className="p-2 hover:bg-gicm-card rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
              ) : (
                <RefreshCw className="w-5 h-5 text-gray-400" />
              )}
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <MetricCard
            title="Portfolio Value"
            value={`$${formatNumber(metrics.totalValue)}`}
            change={metrics.dayPnl}
            changePercent={metrics.dayPnlPercent}
            icon={Wallet}
          />
          <MetricCard
            title="Total PnL"
            value={`$${formatNumber(metrics.totalPnl)}`}
            changePercent={metrics.totalPnlPercent}
            change={metrics.totalPnl}
            icon={DollarSign}
          />
          <MetricCard
            title="Win Rate"
            value={`${metrics.winRate}%`}
            icon={Target}
          />
          <MetricCard
            title="Total Trades"
            value={metrics.totalTrades.toString()}
            icon={Activity}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Daily PnL Chart */}
          <div className="bg-gicm-card border border-gicm-border rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-gicm-primary" />
              Daily PnL
            </h2>
            <div className="h-48 flex items-end justify-between gap-2">
              {pnlHistory.map((d, i) => {
                const height = (Math.abs(d.pnl) / maxPnl) * 100;
                const isPositive = d.pnl >= 0;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center">
                    <div className="w-full flex flex-col items-center justify-end h-40">
                      <div
                        className={`w-full rounded-t transition-all ${
                          isPositive ? "bg-green-500/50 hover:bg-green-500" : "bg-red-500/50 hover:bg-red-500"
                        }`}
                        style={{ height: `${height}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 mt-2">{d.date}</span>
                    <span className={`text-xs ${isPositive ? "text-green-400" : "text-red-400"}`}>
                      {isPositive ? "+" : ""}{d.pnl}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cumulative PnL Chart */}
          <div className="bg-gicm-card border border-gicm-border rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-gicm-primary" />
              Cumulative PnL
            </h2>
            <div className="h-48 flex items-end justify-between gap-2">
              {cumulativePnl.map((d, i) => {
                const height = (d.value / maxCumulative) * 100;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center">
                    <div className="w-full flex flex-col items-center justify-end h-40">
                      <div
                        className="w-full bg-gicm-primary/50 hover:bg-gicm-primary rounded-t transition-all"
                        style={{ height: `${height}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 mt-2">{d.date}</span>
                    <span className="text-xs text-gicm-primary">${d.value}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Asset Allocation & Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Asset Allocation */}
          <div className="lg:col-span-2 bg-gicm-card border border-gicm-border rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-gicm-primary" />
              Asset Allocation
            </h2>
            <div className="space-y-4">
              {allocation.map((asset) => (
                <div key={asset.asset} className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gicm-primary/20 flex items-center justify-center">
                    <span className="text-sm font-bold text-gicm-primary">{asset.asset[0]}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-white">{asset.asset}</span>
                      <span className="text-white">${formatNumber(asset.value)}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex-1 h-2 bg-gicm-dark rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gicm-primary rounded-full"
                          style={{ width: `${asset.percent}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-400 w-12">{asset.percent}%</span>
                      <span className={`text-sm w-20 text-right ${asset.pnl >= 0 ? "text-green-400" : "text-red-400"}`}>
                        {asset.pnl >= 0 ? "+" : ""}{asset.pnlPercent.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trading Stats */}
          <div className="bg-gicm-card border border-gicm-border rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-gicm-primary" />
              Trading Stats
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gicm-border">
                <span className="text-gray-400">Avg Trade Size</span>
                <span className="text-white font-medium">${formatNumber(metrics.avgTradeSize)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gicm-border">
                <span className="text-gray-400">Best Trade</span>
                <span className="text-green-400 font-medium">+${formatNumber(metrics.bestTrade)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gicm-border">
                <span className="text-gray-400">Worst Trade</span>
                <span className="text-red-400 font-medium">${formatNumber(metrics.worstTrade)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gicm-border">
                <span className="text-gray-400">Week PnL</span>
                <span className={metrics.weekPnl >= 0 ? "text-green-400" : "text-red-400"}>
                  {metrics.weekPnl >= 0 ? "+" : ""}${formatNumber(metrics.weekPnl)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-400">Day PnL</span>
                <span className={metrics.dayPnl >= 0 ? "text-green-400" : "text-red-400"}>
                  {metrics.dayPnl >= 0 ? "+" : ""}${formatNumber(metrics.dayPnl)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Trades */}
        <div className="bg-gicm-card border border-gicm-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-gicm-primary" />
              Recent Trades
            </h2>
            <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-400 hover:text-white bg-white/5 rounded-lg transition-colors">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gicm-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Time</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Type</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Asset</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Amount</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Price</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Total</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">PnL</th>
                </tr>
              </thead>
              <tbody>
                {trades.map((trade) => (
                  <tr key={trade.id} className="border-b border-gicm-border/50 hover:bg-white/5">
                    <td className="py-3 px-4 text-sm text-gray-400">{formatTime(trade.timestamp)}</td>
                    <td className="py-3 px-4">
                      <span className={`flex items-center gap-1 text-sm ${
                        trade.type === "buy" ? "text-green-400" : "text-red-400"
                      }`}>
                        {trade.type === "buy" ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                        {trade.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-white font-medium">{trade.asset}</td>
                    <td className="py-3 px-4 text-right text-white">{formatNumber(trade.amount)}</td>
                    <td className="py-3 px-4 text-right text-gray-400">${trade.price < 0.01 ? trade.price.toFixed(6) : formatNumber(trade.price)}</td>
                    <td className="py-3 px-4 text-right text-white">${formatNumber(trade.total)}</td>
                    <td className="py-3 px-4 text-right">
                      {trade.pnl !== undefined ? (
                        <span className={trade.pnl >= 0 ? "text-green-400" : "text-red-400"}>
                          {trade.pnl >= 0 ? "+" : ""}${formatNumber(trade.pnl)}
                        </span>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
