"use client";

import { useState, useEffect } from "react";
import {
  Target,
  TrendingUp,
  TrendingDown,
  Building2,
  Bitcoin,
  Flame,
  RefreshCw,
  ExternalLink,
  Clock,
  DollarSign,
  BarChart3,
  Activity,
  PieChart,
  Zap,
  Lightbulb,
  Star,
  Eye,
} from "lucide-react";
import Link from "next/link";
import { hubApi, type PredictionsStatus, type PredictionMarket } from "../../lib/api/hub";

type TabType = "politics" | "crypto" | "trending" | "watchlist";

const WATCHLIST_STORAGE_KEY = "gicm-predictions-watchlist";

function useWatchlist() {
  const [watchlist, setWatchlist] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Load from localStorage on mount
    try {
      const stored = localStorage.getItem(WATCHLIST_STORAGE_KEY);
      if (stored) {
        setWatchlist(new Set(JSON.parse(stored)));
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  const toggleWatchlist = (marketId: string) => {
    setWatchlist((prev) => {
      const next = new Set(prev);
      if (next.has(marketId)) {
        next.delete(marketId);
      } else {
        next.add(marketId);
      }
      // Save to localStorage
      try {
        localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify([...next]));
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  };

  const isWatched = (marketId: string) => watchlist.has(marketId);
  const watchlistCount = watchlist.size;

  return { watchlist, toggleWatchlist, isWatched, watchlistCount };
}

const CATEGORY_CONFIG: Record<string, { icon: React.ElementType; color: string; bgColor: string; borderColor: string }> = {
  politics: { icon: Building2, color: "text-purple-400", bgColor: "bg-purple-500/10", borderColor: "border-purple-500/30" },
  crypto: { icon: Bitcoin, color: "text-orange-400", bgColor: "bg-orange-500/10", borderColor: "border-orange-500/30" },
  macro: { icon: BarChart3, color: "text-blue-400", bgColor: "bg-blue-500/10", borderColor: "border-blue-500/30" },
  trending: { icon: Flame, color: "text-red-400", bgColor: "bg-red-500/10", borderColor: "border-red-500/30" },
  other: { icon: Activity, color: "text-gray-400", bgColor: "bg-gray-500/10", borderColor: "border-gray-500/30" },
};

const SOURCE_BADGES: Record<string, { label: string; color: string }> = {
  polymarket: { label: "Polymarket", color: "bg-blue-600/20 text-blue-300 border-blue-500/30" },
  kalshi: { label: "Kalshi", color: "bg-emerald-600/20 text-emerald-300 border-emerald-500/30" },
};

function formatNumber(num: number): string {
  if (num >= 1e9) return `$${(num / 1e9).toFixed(1)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(1)}M`;
  if (num >= 1e3) return `$${(num / 1e3).toFixed(1)}K`;
  return `$${num.toFixed(0)}`;
}

function formatTimeAgo(dateStr: string | undefined): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "Expired";
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays < 7) return `${diffDays}d`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w`;
  return `${Math.floor(diffDays / 30)}mo`;
}

// ============================================================================
// MARKETPLACE-STYLE COMPONENTS
// ============================================================================

function LiveSourcesCard({ predictions }: { predictions: PredictionsStatus | null }) {
  const polymarket = predictions?.sources.polymarket;
  const kalshi = predictions?.sources.kalshi;
  const totalMarkets = predictions?.stats.totalMarkets ?? 0;
  const totalVolume = predictions?.stats.totalVolume24h ?? 0;

  return (
    <div className="bg-gicm-card border border-gicm-border rounded-xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-gicm-primary/10">
          <Activity className="w-5 h-5 text-gicm-primary" />
        </div>
        <div>
          <h3 className="font-semibold">Live Data Sources</h3>
          <p className="text-sm text-gray-400">Real-time prediction market data</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-sm text-gray-400">Live</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-blue-400">Polymarket</span>
            <span className={`w-2 h-2 rounded-full ${polymarket?.active ? "bg-green-400 animate-pulse" : "bg-red-400"}`} />
          </div>
          <div className="text-2xl font-bold text-white">{polymarket?.marketCount ?? 0}</div>
          <div className="text-xs text-gray-400">{formatNumber(polymarket?.totalVolume ?? 0)} volume</div>
        </div>

        <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-emerald-400">Kalshi</span>
            <span className={`w-2 h-2 rounded-full ${kalshi?.active ? "bg-green-400 animate-pulse" : "bg-red-400"}`} />
          </div>
          <div className="text-2xl font-bold text-white">{kalshi?.marketCount ?? 0}</div>
          <div className="text-xs text-gray-400">{formatNumber(kalshi?.totalVolume ?? 0)} volume</div>
        </div>

        <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-purple-400">Total</span>
            <Zap className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white">{totalMarkets}</div>
          <div className="text-xs text-gray-400">{formatNumber(totalVolume)} 24h vol</div>
        </div>
      </div>
    </div>
  );
}

function CategoryBreakdown({ predictions }: { predictions: PredictionsStatus | null }) {
  const politics = predictions?.markets.politics.length ?? 0;
  const crypto = predictions?.markets.crypto.length ?? 0;
  const trending = predictions?.markets.trending.length ?? 0;
  const total = Math.max(politics + crypto, 1);

  const categories = [
    { name: "Politics", count: politics, percent: (politics / total) * 100, color: "purple", icon: Building2 },
    { name: "Crypto", count: crypto, percent: (crypto / total) * 100, color: "orange", icon: Bitcoin },
    { name: "Trending", count: trending, percent: 100, color: "red", icon: Flame },
  ];

  return (
    <div className="bg-gicm-card border border-gicm-border rounded-xl p-6 h-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-gicm-primary/10">
          <PieChart className="w-5 h-5 text-gicm-primary" />
        </div>
        <div>
          <h3 className="font-semibold">Category Breakdown</h3>
          <p className="text-sm text-gray-400">Markets by type</p>
        </div>
      </div>

      <div className="space-y-4">
        {categories.map((cat) => {
          const Icon = cat.icon;
          return (
            <div key={cat.name}>
              <div className="flex items-center justify-between text-sm mb-2">
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 text-${cat.color}-400`} />
                  <span className="text-white">{cat.name}</span>
                </div>
                <span className="text-gray-400">{cat.count} markets</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    cat.color === "purple" ? "bg-purple-500" :
                    cat.color === "orange" ? "bg-orange-500" :
                    "bg-red-500"
                  }`}
                  style={{ width: `${Math.min(cat.percent, 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TrendingFeed({ markets }: { markets: PredictionMarket[] }) {
  const sortedByChange = [...markets]
    .filter(m => m.priceChange24h !== 0)
    .sort((a, b) => Math.abs(b.priceChange24h) - Math.abs(a.priceChange24h))
    .slice(0, 10);

  return (
    <div className="bg-gicm-card border border-gicm-border rounded-xl p-6 h-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-gicm-primary/10">
          <TrendingUp className="w-5 h-5 text-gicm-primary" />
        </div>
        <div>
          <h3 className="font-semibold">Top Movers (24h)</h3>
          <p className="text-sm text-gray-400">Biggest price changes</p>
        </div>
      </div>

      <div className="space-y-2 max-h-[240px] overflow-y-auto pr-2">
        {sortedByChange.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No price changes yet</p>
          </div>
        ) : (
          sortedByChange.map((market) => {
            const isPositive = market.priceChange24h > 0;
            return (
              <a
                key={market.id}
                href={market.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors group"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`p-1.5 rounded ${isPositive ? "bg-green-500/10" : "bg-red-500/10"}`}>
                    {isPositive ? (
                      <TrendingUp className="w-3.5 h-3.5 text-green-400" />
                    ) : (
                      <TrendingDown className="w-3.5 h-3.5 text-red-400" />
                    )}
                  </div>
                  <span className="text-sm text-gray-300 truncate group-hover:text-white transition-colors">
                    {market.question}
                  </span>
                </div>
                <span className={`text-sm font-medium ml-3 ${isPositive ? "text-green-400" : "text-red-400"}`}>
                  {isPositive ? "+" : ""}{market.priceChange24h.toFixed(1)}%
                </span>
              </a>
            );
          })
        )}
      </div>
    </div>
  );
}

function QuickStats({ predictions }: { predictions: PredictionsStatus | null }) {
  const totalMarkets = predictions?.stats.totalMarkets ?? 0;
  const totalVolume = predictions?.stats.totalVolume24h ?? 0;
  const topMover = predictions?.stats.topMoverPercent ?? 0;
  const polyActive = predictions?.sources.polymarket.active ?? false;
  const kalshiActive = predictions?.sources.kalshi.active ?? false;
  const activeSources = (polyActive ? 1 : 0) + (kalshiActive ? 1 : 0);

  const stats = [
    { label: "Total Markets", value: totalMarkets.toString(), color: "blue", Icon: Target },
    { label: "24h Volume", value: formatNumber(totalVolume), color: "green", Icon: DollarSign },
    { label: "Top Mover", value: `${topMover > 0 ? "+" : ""}${topMover.toFixed(1)}%`, color: topMover >= 0 ? "green" : "red", Icon: TrendingUp },
    { label: "Active Sources", value: `${activeSources}/2`, color: "purple", Icon: Activity },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={`p-4 rounded-xl border ${
            stat.color === "blue" ? "bg-blue-500/10 border-blue-500/30" :
            stat.color === "green" ? "bg-green-500/10 border-green-500/30" :
            stat.color === "red" ? "bg-red-500/10 border-red-500/30" :
            "bg-purple-500/10 border-purple-500/30"
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <stat.Icon className={`w-4 h-4 ${
              stat.color === "blue" ? "text-blue-400" :
              stat.color === "green" ? "text-green-400" :
              stat.color === "red" ? "text-red-400" :
              "text-purple-400"
            }`} />
            <span className="text-sm text-gray-400">{stat.label}</span>
          </div>
          <div className={`text-2xl font-bold ${
            stat.color === "blue" ? "text-blue-400" :
            stat.color === "green" ? "text-green-400" :
            stat.color === "red" ? "text-red-400" :
            "text-purple-400"
          }`}>
            {stat.value}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// MARKET COMPONENTS
// ============================================================================

function ProbabilityBar({ yesPrice, noPrice }: { yesPrice: number; noPrice: number }) {
  const yesWidth = Math.max(0, Math.min(100, yesPrice));

  return (
    <div className="w-full">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-green-400 font-medium">Yes: {yesPrice.toFixed(0)}%</span>
        <span className="text-red-400 font-medium">No: {noPrice.toFixed(0)}%</span>
      </div>
      <div className="h-2 bg-red-500/30 rounded-full overflow-hidden">
        <div
          className="h-full bg-green-500 rounded-full transition-all duration-500"
          style={{ width: `${yesWidth}%` }}
        />
      </div>
    </div>
  );
}

function PriceChangeIndicator({ change }: { change: number }) {
  if (Math.abs(change) < 0.5) {
    return <span className="text-gray-400 text-sm">-</span>;
  }

  const isPositive = change > 0;
  return (
    <span className={`flex items-center gap-1 text-sm font-medium ${isPositive ? "text-green-400" : "text-red-400"}`}>
      {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {isPositive ? "+" : ""}{change.toFixed(1)}%
    </span>
  );
}

function MarketCard({
  market,
  isWatched,
  onToggleWatch
}: {
  market: PredictionMarket;
  isWatched: boolean;
  onToggleWatch: () => void;
}) {
  const categoryConfig = CATEGORY_CONFIG[market.category] || CATEGORY_CONFIG.other;
  const sourceBadge = SOURCE_BADGES[market.source];
  const CategoryIcon = categoryConfig.icon;

  // Create brainstorm URL with pre-filled topic
  const brainstormTopic = encodeURIComponent(
    `Prediction Market Analysis: "${market.question}"\n\nCurrent odds: Yes ${market.yesPrice}% / No ${market.noPrice}%\n24h Volume: ${formatNumber(market.volume24h)}\nLiquidity: ${formatNumber(market.liquidity)}\nSource: ${market.source}`
  );

  return (
    <div className={`bg-gicm-card border rounded-xl p-5 hover:border-gicm-primary/30 hover:shadow-lg hover:shadow-gicm-primary/5 transition-all ${
      isWatched ? "border-yellow-500/30 bg-yellow-500/5" : "border-gicm-border"
    }`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded ${categoryConfig.bgColor} border ${categoryConfig.borderColor}`}>
            <CategoryIcon className={`w-4 h-4 ${categoryConfig.color}`} />
          </div>
          <span className={`text-xs px-2 py-0.5 rounded border ${sourceBadge?.color || "bg-gray-500/20 text-gray-300"}`}>
            {sourceBadge?.label || market.source}
          </span>
          {isWatched && (
            <span className="text-xs px-2 py-0.5 rounded border bg-yellow-500/10 text-yellow-400 border-yellow-500/30">
              Watching
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.preventDefault();
              onToggleWatch();
            }}
            className={`transition-colors ${
              isWatched
                ? "text-yellow-400 hover:text-yellow-300"
                : "text-gray-400 hover:text-yellow-400"
            }`}
            title={isWatched ? "Remove from watchlist" : "Add to watchlist"}
          >
            <Star className={`w-4 h-4 ${isWatched ? "fill-current" : ""}`} />
          </button>
          <Link
            href={`/brainstorm?topic=${brainstormTopic}&method=six-hats`}
            className="text-gray-400 hover:text-yellow-400 transition-colors"
            title="Analyze with Brainstorm"
          >
            <Lightbulb className="w-4 h-4" />
          </Link>
          <a
            href={market.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-gicm-primary transition-colors"
            title="View on source"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      <h3 className="font-medium text-white mb-4 line-clamp-2 min-h-[48px]">{market.question}</h3>

      <ProbabilityBar yesPrice={market.yesPrice} noPrice={market.noPrice} />

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gicm-border">
        <div className="flex items-center gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <DollarSign className="w-3 h-3" />
            {formatNumber(market.volume24h)} 24h
          </span>
          <span className="flex items-center gap-1">
            <BarChart3 className="w-3 h-3" />
            {formatNumber(market.liquidity)}
          </span>
          {market.expiresAt && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatTimeAgo(market.expiresAt)}
            </span>
          )}
        </div>
        <PriceChangeIndicator change={market.priceChange24h} />
      </div>
    </div>
  );
}

function MarketTabs({
  activeTab,
  onTabChange,
  watchlistCount
}: {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  watchlistCount: number;
}) {
  const tabs: { id: TabType; label: string; icon: React.ElementType; color: string; count?: number }[] = [
    { id: "watchlist", label: "Watchlist", icon: Eye, color: "yellow", count: watchlistCount },
    { id: "politics", label: "Politics", icon: Building2, color: "purple" },
    { id: "crypto", label: "Crypto", icon: Bitcoin, color: "orange" },
    { id: "trending", label: "Trending", icon: Flame, color: "red" },
  ];

  return (
    <div className="flex items-center gap-2 bg-gicm-card border border-gicm-border rounded-lg p-1">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        const isWatchlist = tab.id === "watchlist";
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              isActive
                ? isWatchlist
                  ? "bg-yellow-500 text-black"
                  : "bg-gicm-primary text-black"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Icon className="w-4 h-4" />
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                isActive
                  ? "bg-black/20 text-current"
                  : "bg-yellow-500/20 text-yellow-400"
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function MarketGrid({
  markets,
  isWatched,
  onToggleWatch,
  isWatchlistTab
}: {
  markets: PredictionMarket[];
  isWatched: (id: string) => boolean;
  onToggleWatch: (id: string) => void;
  isWatchlistTab?: boolean;
}) {
  if (markets.length === 0) {
    return (
      <div className="bg-gicm-card border border-gicm-border rounded-xl p-8 text-center">
        {isWatchlistTab ? (
          <>
            <Star className="w-12 h-12 text-yellow-500/50 mx-auto mb-4" />
            <p className="text-gray-400">No markets in your watchlist</p>
            <p className="text-sm text-gray-500 mt-2">Click the star icon on any market to add it</p>
          </>
        ) : (
          <>
            <Target className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">No markets in this category</p>
            <p className="text-sm text-gray-500 mt-2">Check back later for new predictions</p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {markets.map((market) => (
        <MarketCard
          key={market.id}
          market={market}
          isWatched={isWatched(market.id)}
          onToggleWatch={() => onToggleWatch(market.id)}
        />
      ))}
    </div>
  );
}

function LastUpdated({ timestamp, loading }: { timestamp: string | null; loading: boolean }) {
  if (!timestamp) return null;

  const date = new Date(timestamp);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  let timeAgo = "just now";
  if (diffSec >= 60) {
    timeAgo = `${Math.floor(diffSec / 60)}m ago`;
  } else if (diffSec >= 10) {
    timeAgo = `${diffSec}s ago`;
  }

  return (
    <div className="flex items-center gap-2 text-xs text-gray-500">
      <span className={`w-2 h-2 rounded-full ${loading ? "bg-yellow-400 animate-pulse" : "bg-green-400"}`} />
      <span>Updated {timeAgo}</span>
    </div>
  );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function PredictionsPage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [predictions, setPredictions] = useState<PredictionsStatus | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("crypto");
  const { watchlist, toggleWatchlist, isWatched, watchlistCount } = useWatchlist();

  useEffect(() => {
    setMounted(true);

    const fetchData = async () => {
      setLoading(true);
      const data = await hubApi.getPredictions();
      setPredictions(data);
      setLoading(false);
    };

    fetchData();
    const timer = setInterval(fetchData, 30000);
    return () => clearInterval(timer);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading Predictions...</div>
      </div>
    );
  }

  const allMarkets = [
    ...(predictions?.markets.politics ?? []),
    ...(predictions?.markets.crypto ?? []),
    ...(predictions?.markets.trending ?? []),
  ];

  // Get markets for current tab (including watchlist filter)
  const currentMarkets = activeTab === "watchlist"
    ? allMarkets.filter((m) => watchlist.has(m.id))
    : predictions?.markets[activeTab] ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gicm-primary/10">
              <Target className="w-6 h-6 text-gicm-primary" />
            </div>
            Predictions
          </h1>
          <p className="text-gray-400 mt-1 ml-12">Real-time prediction markets from Polymarket & Kalshi</p>
        </div>
        <div className="flex items-center gap-4">
          <LastUpdated timestamp={predictions?.lastUpdated ?? null} loading={loading} />
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-4 py-2 bg-gicm-card border border-gicm-border hover:border-gicm-primary/30 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <QuickStats predictions={predictions} />

      {/* Live Sources Card */}
      <LiveSourcesCard predictions={predictions} />

      {/* Two-column: Category Breakdown + Trending Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CategoryBreakdown predictions={predictions} />
        <TrendingFeed markets={allMarkets} />
      </div>

      {/* Tab Navigation + Market Count */}
      <div className="flex items-center justify-between">
        <MarketTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          watchlistCount={watchlistCount}
        />
        <div className="text-sm text-gray-400">
          {activeTab === "watchlist" && watchlistCount > 0 && (
            <span className="text-yellow-400 mr-2">
              <Star className="w-3 h-3 inline mr-1" />
            </span>
          )}
          {currentMarkets.length} market{currentMarkets.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Market Grid */}
      <MarketGrid
        markets={currentMarkets}
        isWatched={isWatched}
        onToggleWatch={toggleWatchlist}
        isWatchlistTab={activeTab === "watchlist"}
      />

      {/* No Data State */}
      {!predictions && !loading && (
        <div className="bg-gicm-card border border-gicm-border rounded-xl p-8 text-center">
          <Target className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400">Predictions API not connected</p>
          <p className="text-sm text-gray-500 mt-2">Start the Integration Hub to fetch prediction market data</p>
          <p className="text-xs text-gray-600 mt-4 font-mono">gicm-hub start</p>
        </div>
      )}
    </div>
  );
}
