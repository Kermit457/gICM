"use client";

import { useState, useEffect } from "react";
import {
  Store,
  Users,
  Zap,
  Package,
  Download,
  Search,
  TrendingUp,
  DollarSign,
  Coins,
  Activity,
  RefreshCw,
  Bot,
  Terminal,
  Cpu,
  Workflow,
  Layers,
  ArrowRight,
  Star,
  Copy,
  Check,
} from "lucide-react";
import { marketplaceApi, type LiveStats, type TokenSavings, type AnalyticsStats, type RegistryStats, type ActivityEvent } from "../../lib/api/marketplace";

function formatNumber(value: number): string {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toString();
}

function LiveStatsCard({ stats }: { stats: LiveStats | null }) {
  return (
    <div className="bg-gicm-card border border-gicm-border rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Activity className="w-5 h-5 text-gicm-primary animate-pulse" />
        Live Stats
      </h3>
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <div className="text-3xl font-bold text-blue-400">{stats?.totalBuilders ?? 0}</div>
          <div className="text-xs text-gray-400 mt-1">Total Builders</div>
        </div>
        <div className="text-center p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
          <div className="flex items-center justify-center gap-1">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <div className="text-3xl font-bold text-green-400">{stats?.activeNow ?? 0}</div>
          </div>
          <div className="text-xs text-gray-400 mt-1">Active Now</div>
        </div>
        <div className="text-center p-4 bg-gicm-primary/10 border border-gicm-primary/30 rounded-lg">
          <div className="text-3xl font-bold text-gicm-primary">{stats?.builtToday ?? 0}</div>
          <div className="text-xs text-gray-400 mt-1">Built Today</div>
        </div>
      </div>
      {stats?.trending && stats.trending.length > 0 && (
        <div className="mt-4">
          <div className="text-sm text-gray-400 mb-2">Trending</div>
          <div className="flex flex-wrap gap-2">
            {stats.trending.slice(0, 5).map((item) => (
              <span key={item.name} className="px-2 py-1 bg-white/5 rounded text-xs">
                {item.name} <span className="text-gicm-primary">({item.count})</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TokenSavingsCard({ savings }: { savings: TokenSavings | null }) {
  return (
    <div className="bg-gicm-card border border-gicm-border rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Coins className="w-5 h-5 text-gicm-primary" />
        Token Savings
      </h3>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
          <div className="text-2xl font-bold text-green-400">
            {savings?.formatted?.totalTokensSaved ?? "0"}
          </div>
          <div className="text-xs text-gray-400 mt-1">Total Tokens Saved</div>
        </div>
        <div className="text-center p-4 bg-gicm-primary/10 border border-gicm-primary/30 rounded-lg">
          <div className="text-2xl font-bold text-gicm-primary">
            {savings?.formatted?.totalCostSaved ?? "$0"}
          </div>
          <div className="text-xs text-gray-400 mt-1">Total Cost Saved</div>
        </div>
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-400">Today&apos;s Savings</span>
          <span className="text-green-400">{savings?.formatted?.costSavedToday ?? "$0"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Avg per Stack</span>
          <span className="text-blue-400">{formatNumber(savings?.avgTokensPerStack ?? 0)} tokens</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Savings Rate</span>
          <span className="text-purple-400">{((savings?.savingsRate ?? 0) * 100).toFixed(0)}%</span>
        </div>
      </div>
    </div>
  );
}

function RegistryCard({ registry }: { registry: RegistryStats | null }) {
  const byKind = registry?.byKind ?? { agents: 0, skills: 0, commands: 0, mcps: 0, workflows: 0 };

  const kindItems = [
    { name: "Agents", count: byKind.agents, icon: Bot, color: "text-gicm-primary" },
    { name: "Skills", count: byKind.skills, icon: Zap, color: "text-blue-400" },
    { name: "Commands", count: byKind.commands, icon: Terminal, color: "text-purple-400" },
    { name: "MCPs", count: byKind.mcps, icon: Cpu, color: "text-green-400" },
    { name: "Workflows", count: byKind.workflows, icon: Workflow, color: "text-orange-400" },
  ];

  return (
    <div className="bg-gicm-card border border-gicm-border rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Package className="w-5 h-5 text-gicm-primary" />
        Registry ({registry?.totalItems ?? 0} items)
      </h3>
      <div className="space-y-3">
        {kindItems.map((item) => {
          const percent = registry?.totalItems ? Math.round((item.count / registry.totalItems) * 100) : 0;
          return (
            <div key={item.name}>
              <div className="flex items-center justify-between text-sm mb-1">
                <div className="flex items-center gap-2">
                  <item.icon className={`w-4 h-4 ${item.color}`} />
                  <span className="text-gray-400">{item.name}</span>
                </div>
                <span className={`font-medium ${item.color}`}>{item.count}</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-current ${item.color} transition-all duration-500`}
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

function AnalyticsCard({ analytics }: { analytics: AnalyticsStats | null }) {
  return (
    <div className="bg-gicm-card border border-gicm-border rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-gicm-primary" />
        Analytics
      </h3>
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-400">{formatNumber(analytics?.totalEvents ?? 0)}</div>
          <div className="text-xs text-gray-400">Events</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-400">{analytics?.uniqueVisitors ?? 0}</div>
          <div className="text-xs text-gray-400">Visitors</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-400">{analytics?.bundleDownloads ?? 0}</div>
          <div className="text-xs text-gray-400">Downloads</div>
        </div>
      </div>
      {analytics?.popularItems && analytics.popularItems.length > 0 && (
        <div>
          <div className="text-sm text-gray-400 mb-2">Popular Items</div>
          <div className="space-y-2">
            {analytics.popularItems.slice(0, 3).map((item) => (
              <div key={item.id} className="flex items-center justify-between text-sm p-2 bg-white/5 rounded">
                <span className="truncate">{item.name}</span>
                <span className="text-gicm-primary">{item.views} views</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ActivityFeed({ feed }: { feed: ActivityEvent[] | null }) {
  if (!feed || feed.length === 0) {
    return (
      <div className="bg-gicm-card border border-gicm-border rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-gicm-primary" />
          Live Activity
        </h3>
        <div className="text-center py-8">
          <Activity className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400">No recent activity</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gicm-card border border-gicm-border rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Activity className="w-5 h-5 text-gicm-primary" />
        Live Activity
      </h3>
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {feed.slice(0, 10).map((event) => (
          <div key={event.id} className="flex items-start gap-3 p-2 bg-white/5 rounded-lg">
            <span className="text-lg">{event.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate">{event.message}</p>
              <p className="text-xs text-gray-500">{event.user} • {event.timestamp}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Featured Stacks (PTC + Tool Search)
const FEATURED_STACKS = [
  {
    id: "ptc-tool-search-stack",
    name: "PTC + Tool Search Tool",
    description: "Programmatic Tool Calling with dynamic tool discovery. 85% context reduction + 37% token savings.",
    items: ["ptc-coordinator", "tool-search-api", "pipeline-risk-classifier", "hunter-agent", "defi-agent", "decision-agent", "audit-agent", "wallet-agent", "context-engine-mcp", "autonomy-engine"],
    tags: ["PTC", "Tool Search", "Orchestration", "Advanced"],
    stats: { contextReduction: 85, tokenSavings: 37, agents: 513 },
    featured: true,
  },
  {
    id: "solana-launch-platform",
    name: "Solana Launch Platform",
    description: "Complete stack for building pump.fun-style launch platforms. 9 agents, 12 skills, 8 commands.",
    items: ["icm-anchor-architect", "frontend-fusion-engine", "web3-integration-maestro", "solana-guardian-auditor"],
    tags: ["Solana", "DeFi", "Launch Platform"],
    stats: { agents: 9, skills: 12, commands: 8 },
    featured: false,
  },
];

function FeaturedStacksSection() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyInstall = (stackId: string) => {
    navigator.clipboard.writeText(`npx @gicm/cli install-stack ${stackId}`);
    setCopiedId(stackId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="bg-gicm-card border border-gicm-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Layers className="w-5 h-5 text-gicm-primary" />
          Featured Stacks
        </h3>
        <a
          href="/tools"
          className="text-sm text-gicm-primary hover:underline flex items-center gap-1"
        >
          Tool Discovery <ArrowRight className="w-4 h-4" />
        </a>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {FEATURED_STACKS.map((stack) => (
          <div
            key={stack.id}
            className={`p-4 rounded-lg border ${
              stack.featured
                ? "bg-gradient-to-br from-gicm-primary/10 to-purple-500/10 border-gicm-primary/30"
                : "bg-white/5 border-gicm-border"
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold">{stack.name}</h4>
                  {stack.featured && (
                    <span className="px-2 py-0.5 text-xs bg-gicm-primary/20 text-gicm-primary rounded-full flex items-center gap-1">
                      <Star className="w-3 h-3" /> Featured
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-400 mt-1">{stack.description}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-1 mb-3">
              {stack.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 text-xs bg-white/10 rounded-full text-gray-400"
                >
                  {tag}
                </span>
              ))}
            </div>

            {stack.stats && (
              <div className="flex items-center gap-4 mb-3 text-xs">
                {stack.stats.contextReduction && (
                  <span className="text-green-400">
                    {stack.stats.contextReduction}% context reduction
                  </span>
                )}
                {stack.stats.tokenSavings && (
                  <span className="text-blue-400">
                    {stack.stats.tokenSavings}% token savings
                  </span>
                )}
                {stack.stats.agents && (
                  <span className="text-purple-400">
                    {stack.stats.agents}+ agents
                  </span>
                )}
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">{stack.items.length} items</span>
              <button
                onClick={() => copyInstall(stack.id)}
                className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs transition-colors"
              >
                {copiedId === stack.id ? (
                  <>
                    <Check className="w-3 h-3 text-green-400" />
                    <span className="text-green-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    Install
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function QuickStats({ stats, registry, analytics }: { stats: LiveStats | null; registry: RegistryStats | null; analytics: AnalyticsStats | null }) {
  return (
    <div className="grid grid-cols-4 gap-4">
      <div className="bg-gicm-card border border-gicm-border rounded-lg p-4">
        <div className="text-sm text-gray-400 mb-1">Registry Items</div>
        <div className="text-2xl font-bold text-gicm-primary">{registry?.totalItems ?? 0}</div>
      </div>
      <div className="bg-gicm-card border border-gicm-border rounded-lg p-4">
        <div className="text-sm text-gray-400 mb-1">Active Now</div>
        <div className="text-2xl font-bold text-green-400">{stats?.activeNow ?? 0}</div>
      </div>
      <div className="bg-gicm-card border border-gicm-border rounded-lg p-4">
        <div className="text-sm text-gray-400 mb-1">Built Today</div>
        <div className="text-2xl font-bold text-blue-400">{stats?.builtToday ?? 0}</div>
      </div>
      <div className="bg-gicm-card border border-gicm-border rounded-lg p-4">
        <div className="text-sm text-gray-400 mb-1">Downloads</div>
        <div className="text-2xl font-bold text-purple-400">{analytics?.bundleDownloads ?? 0}</div>
      </div>
    </div>
  );
}

export default function MarketplacePage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<LiveStats | null>(null);
  const [savings, setSavings] = useState<TokenSavings | null>(null);
  const [registry, setRegistry] = useState<RegistryStats | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsStats | null>(null);
  const [feed, setFeed] = useState<ActivityEvent[] | null>(null);

  useEffect(() => {
    setMounted(true);

    const fetchData = async () => {
      setLoading(true);
      const [statsData, savingsData, registryData, analyticsData, feedData] = await Promise.all([
        marketplaceApi.getLiveStats(),
        marketplaceApi.getTokenSavings(),
        marketplaceApi.getRegistry(),
        marketplaceApi.getAnalytics(),
        marketplaceApi.getLiveFeed(),
      ]);
      setStats(statsData);
      setSavings(savingsData);
      setRegistry(registryData);
      setAnalytics(analyticsData);
      setFeed(feedData);
      setLoading(false);
    };

    fetchData();
    const timer = setInterval(fetchData, 30000);
    return () => clearInterval(timer);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading Marketplace...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Store className="w-8 h-8 text-gicm-primary" />
            gICM Marketplace
          </h1>
          <p className="text-gray-400 mt-1">AI agents, skills, commands & workflows</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <QuickStats stats={stats} registry={registry} analytics={analytics} />

      {/* Featured Stacks - PTC + Tool Search */}
      <FeaturedStacksSection />

      <div className="grid grid-cols-2 gap-6">
        <LiveStatsCard stats={stats} />
        <TokenSavingsCard savings={savings} />
      </div>

      <div className="grid grid-cols-3 gap-6">
        <RegistryCard registry={registry} />
        <AnalyticsCard analytics={analytics} />
        <ActivityFeed feed={feed} />
      </div>
    </div>
  );
}
