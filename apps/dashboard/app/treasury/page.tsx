"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PiggyBank,
  BarChart3,
  Bot,
  AlertTriangle,
  Calendar,
  RefreshCw,
  ExternalLink,
  Database,
  Activity,
} from "lucide-react";
import { hubApi, type TreasuryStatus } from "../../lib/api/hub";
import { solanaApi, type WalletBalance } from "../../lib/api/solana";
import { supabaseApi, type TradingData } from "../../lib/api/supabase";
import { useWebSocket } from "@/hooks/useWebSocket";
import { ConnectionIndicator } from "@/components/ConnectionIndicator";

function formatCurrency(value: number, decimals = 2): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

function formatSOL(value: number): string {
  return `${value.toFixed(4)} SOL`;
}

function PortfolioCard({ treasury, wallet }: { treasury: TreasuryStatus | null; wallet: WalletBalance | null }) {
  const sol = wallet?.sol ?? treasury?.balances?.sol ?? 0;
  const usdc = wallet?.usdc ?? treasury?.balances?.usdc ?? 0;
  const solPrice = wallet?.solPrice ?? 230;
  const totalValue = wallet?.totalUsd ?? treasury?.totalValueUsd ?? (sol * solPrice + usdc);

  return (
    <div className="bg-gicm-card border border-gicm-border rounded-xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-gicm-primary/10">
          <Wallet className="w-5 h-5 text-gicm-primary" />
        </div>
        <div>
          <h3 className="font-semibold">Portfolio</h3>
          <p className="text-sm text-gray-400">On-chain holdings</p>
        </div>
        {wallet?.address && (
          <a
            href={`https://solscan.io/account/${wallet.address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto text-xs text-gray-500 hover:text-gicm-primary flex items-center gap-1"
          >
            {wallet.address.slice(0, 4)}...{wallet.address.slice(-4)}
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
        {wallet && (
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-gray-500">Live</span>
          </div>
        )}
      </div>
      <div className="text-4xl font-bold text-gicm-primary mb-4">
        {formatCurrency(totalValue)}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/30">
          <div className="text-sm text-purple-400 mb-1">SOL Balance</div>
          <div className="text-xl font-semibold">{formatSOL(sol)}</div>
          <div className="text-xs text-gray-500">{formatCurrency(sol * solPrice)} @ ${solPrice.toFixed(0)}</div>
        </div>
        <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
          <div className="text-sm text-green-400 mb-1">USDC Balance</div>
          <div className="text-xl font-semibold">{formatCurrency(usdc)}</div>
          <div className="text-xs text-gray-500">Stablecoin</div>
        </div>
      </div>
    </div>
  );
}

function AllocationChart({ treasury }: { treasury: TreasuryStatus | null }) {
  const allocations = treasury?.allocations ?? { trading: 0, operations: 0, growth: 0, reserve: 0 };
  const total = Object.values(allocations).reduce((a, b) => a + b, 0) || 1;

  const allocationItems = [
    { name: "Trading", value: allocations.trading, color: "gicm-primary" },
    { name: "Operations", value: allocations.operations, color: "blue-500" },
    { name: "Growth", value: allocations.growth, color: "green-500" },
    { name: "Reserve", value: allocations.reserve, color: "purple-500" },
  ];

  return (
    <div className="bg-gicm-card border border-gicm-border rounded-xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-gicm-primary/10">
          <BarChart3 className="w-5 h-5 text-gicm-primary" />
        </div>
        <div>
          <h3 className="font-semibold">Allocations</h3>
          <p className="text-sm text-gray-400">Fund distribution</p>
        </div>
      </div>
      <div className="space-y-4">
        {allocationItems.map((item) => {
          const percent = Math.round((item.value / total) * 100);
          return (
            <div key={item.name}>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400 flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full bg-${item.color}`} />
                  {item.name}
                </span>
                <span className="font-medium">{percent}%</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-${item.color} transition-all duration-500`}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RunwayCard({ treasury }: { treasury: TreasuryStatus | null }) {
  const runway = treasury?.runway ?? 0;
  const monthlyExpense = treasury?.expenses?.monthly ?? 0;
  const upcoming = treasury?.expenses?.upcoming ?? 0;

  const runwayColor = runway > 6 ? "text-green-400" : runway > 3 ? "text-yellow-400" : "text-red-400";

  return (
    <div className="bg-gicm-card border border-gicm-border rounded-xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-gicm-primary/10">
          <Calendar className="w-5 h-5 text-gicm-primary" />
        </div>
        <div>
          <h3 className="font-semibold">Runway</h3>
          <p className="text-sm text-gray-400">Operational buffer</p>
        </div>
      </div>
      <div className={`text-4xl font-bold ${runwayColor} mb-4`}>
        {runway.toFixed(1)} months
      </div>
      <div className="space-y-3">
        <div className="flex justify-between p-3 rounded-lg bg-red-500/10 border border-red-500/30">
          <span className="text-gray-400">Monthly Burn</span>
          <span className="text-red-400 font-medium">{formatCurrency(monthlyExpense)}</span>
        </div>
        <div className="flex justify-between p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
          <span className="text-gray-400">Upcoming Expenses</span>
          <span className="text-yellow-400 font-medium">{formatCurrency(upcoming)}</span>
        </div>
      </div>
      {runway < 3 && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <span className="text-red-400 text-sm">Low runway warning</span>
        </div>
      )}
    </div>
  );
}

function TradingStats({ treasury, trading }: { treasury: TreasuryStatus | null; trading: TradingData | null }) {
  const stats = trading?.stats ?? treasury?.trading ?? { activeBots: 0, totalPnL: 0, dailyPnL: 0, weeklyPnL: 0 };
  const hasSupabase = trading?.configured ?? false;

  const PnLIndicator = ({ value, label }: { value: number; label: string }) => {
    const isPositive = value >= 0;
    return (
      <div className={`p-4 rounded-lg ${isPositive ? "bg-green-500/10 border border-green-500/30" : "bg-red-500/10 border border-red-500/30"} text-center`}>
        <div className={`text-xl font-bold flex items-center justify-center gap-1 ${isPositive ? "text-green-400" : "text-red-400"}`}>
          {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          {isPositive ? "+" : ""}{formatCurrency(value)}
        </div>
        <div className="text-xs text-gray-400 mt-1">{label}</div>
      </div>
    );
  };

  return (
    <div className="bg-gicm-card border border-gicm-border rounded-xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-gicm-primary/10">
          <Bot className="w-5 h-5 text-gicm-primary" />
        </div>
        <div>
          <h3 className="font-semibold">Trading Performance</h3>
          <p className="text-sm text-gray-400">Bot P&L tracking</p>
        </div>
        {hasSupabase && (
          <div className="ml-auto flex items-center gap-2">
            <Database className="w-3 h-3 text-green-400" />
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-gray-500">Live</span>
          </div>
        )}
      </div>
      <div className="grid grid-cols-3 gap-4">
        <PnLIndicator value={stats.dailyPnL} label="Today" />
        <PnLIndicator value={stats.weeklyPnL} label="This Week" />
        <PnLIndicator value={stats.totalPnL} label="All Time" />
      </div>
      <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-between">
        <span className="text-gray-400">Active Positions</span>
        <span className="text-blue-400 font-semibold">{stats.activeBots}</span>
      </div>
      {trading && trading.trades.length > 0 && (
        <div className="mt-3 text-xs text-gray-500">
          {trading.trades.length} trades today
        </div>
      )}
    </div>
  );
}

function QuickStats({ treasury, wallet, trading }: { treasury: TreasuryStatus | null; wallet: WalletBalance | null; trading: TradingData | null }) {
  const totalValue = wallet?.totalUsd ?? treasury?.totalValueUsd ?? 0;
  const dailyPnL = trading?.stats?.dailyPnL ?? treasury?.trading?.dailyPnL ?? 0;
  const runway = treasury?.runway ?? 0;
  const solPrice = wallet?.solPrice ?? 230;

  const stats = [
    { label: "Total Value", value: formatCurrency(totalValue, 0), color: "gicm-primary", Icon: DollarSign },
    { label: "SOL Price", value: `$${solPrice.toFixed(0)}`, color: "purple", Icon: Activity },
    { label: "Today P&L", value: `${dailyPnL >= 0 ? "+" : ""}${formatCurrency(dailyPnL)}`, color: dailyPnL >= 0 ? "green" : "red", Icon: dailyPnL >= 0 ? TrendingUp : TrendingDown },
    { label: "Runway", value: runway > 0 ? `${runway.toFixed(1)}mo` : "-", color: runway > 3 ? "green" : "yellow", Icon: Calendar },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={`p-4 rounded-xl border ${
            stat.color === "gicm-primary" ? "bg-gicm-primary/10 border-gicm-primary/30" :
            stat.color === "purple" ? "bg-purple-500/10 border-purple-500/30" :
            stat.color === "green" ? "bg-green-500/10 border-green-500/30" :
            stat.color === "yellow" ? "bg-yellow-500/10 border-yellow-500/30" :
            "bg-red-500/10 border-red-500/30"
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <stat.Icon className={`w-4 h-4 ${
              stat.color === "gicm-primary" ? "text-gicm-primary" :
              stat.color === "purple" ? "text-purple-400" :
              stat.color === "green" ? "text-green-400" :
              stat.color === "yellow" ? "text-yellow-400" :
              "text-red-400"
            }`} />
            <span className="text-sm text-gray-400">{stat.label}</span>
          </div>
          <div className={`text-2xl font-bold ${
            stat.color === "gicm-primary" ? "text-gicm-primary" :
            stat.color === "purple" ? "text-purple-400" :
            stat.color === "green" ? "text-green-400" :
            stat.color === "yellow" ? "text-yellow-400" :
            "text-red-400"
          }`}>
            {stat.value}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function TreasuryPage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [treasury, setTreasury] = useState<TreasuryStatus | null>(null);
  const [wallet, setWallet] = useState<WalletBalance | null>(null);
  const [trading, setTrading] = useState<TradingData | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // WebSocket for real-time updates
  const ws = useWebSocket({
    autoReconnect: true,
    reconnectDelay: 3000,
    onEvent: (event) => {
      if (event.type?.includes("treasury") || event.type?.includes("wallet") || event.type?.includes("trading")) {
        fetchData();
      }
    },
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [treasuryData, walletData, tradingData] = await Promise.all([
      hubApi.getTreasury(),
      solanaApi.getWalletBalance(),
      supabaseApi.getTrading(),
    ]);
    setTreasury(treasuryData);
    setWallet(walletData);
    setTrading(tradingData);
    setLoading(false);
  }, []);

  useEffect(() => {
    setMounted(true);
    fetchData();
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [fetchData]);

  // Adaptive polling based on WebSocket connection
  useEffect(() => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    const interval = ws.isConnected ? 30000 : 10000;
    pollingRef.current = setInterval(fetchData, interval);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [ws.isConnected, fetchData]);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading Treasury...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gicm-primary/10">
              <DollarSign className="w-6 h-6 text-gicm-primary" />
            </div>
            Treasury - Financial Command
          </h1>
          <p className="text-gray-400 mt-1 ml-12">Portfolio management, trading bots & runway tracking</p>
        </div>
        <div className="flex items-center gap-4">
          <ConnectionIndicator status={ws.status} isRealtime={ws.isConnected} compact />
          <button
            onClick={() => fetchData()}
            className="flex items-center gap-2 px-4 py-2 bg-gicm-card border border-gicm-border hover:border-gicm-primary/30 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      <QuickStats treasury={treasury} wallet={wallet} trading={trading} />

      <div className="grid grid-cols-2 gap-6">
        <PortfolioCard treasury={treasury} wallet={wallet} />
        <AllocationChart treasury={treasury} />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <RunwayCard treasury={treasury} />
        <TradingStats treasury={treasury} trading={trading} />
      </div>

      {!treasury && !wallet && !loading && (
        <div className="bg-gicm-card border border-gicm-border rounded-xl p-6 text-center">
          <PiggyBank className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400">No wallet data available</p>
          <p className="text-sm text-gray-500 mt-2">
            Set <code className="px-1 py-0.5 bg-white/10 rounded">NEXT_PUBLIC_GICM_WALLET</code> to your Solana address
          </p>
        </div>
      )}
    </div>
  );
}
