"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useWebSocket } from "@/hooks/useWebSocket";
import { ConnectionIndicator } from "@/components/ConnectionIndicator";
import {
  Target,
  Radar,
  Zap,
  Star,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Database,
  Activity,
  TrendingUp,
} from "lucide-react";
import { hubApi, type HunterStatus } from "../../lib/api/hub";
import { supabaseApi, type DiscoveriesData, type SignalsData } from "../../lib/api/supabase";

const SOURCE_ICONS: Record<string, string> = {
  github: "🐙",
  hackernews: "📰",
  twitter: "🐦",
  reddit: "🔴",
  producthunt: "🚀",
  devto: "📝",
  arxiv: "📚",
  discord: "💬",
  telegram: "✈️",
  tiktok: "🎵",
  lobsters: "🦞",
};

function SourcesGrid({ hunter }: { hunter: HunterStatus | null }) {
  const enabledSources = hunter?.enabledSources ?? [];
  const allSources = Object.keys(SOURCE_ICONS);

  return (
    <div className="bg-gicm-card border border-gicm-border rounded-xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-gicm-primary/10">
          <Radar className="w-5 h-5 text-gicm-primary" />
        </div>
        <div>
          <h3 className="font-semibold">Intelligence Sources</h3>
          <p className="text-sm text-gray-400">{enabledSources.length}/{allSources.length} active</p>
        </div>
      </div>
      <div className="grid grid-cols-6 gap-3">
        {allSources.map((source) => {
          const isEnabled = enabledSources.includes(source);
          return (
            <div
              key={source}
              className={`text-center p-3 rounded-lg transition-all ${
                isEnabled
                  ? "bg-gicm-primary/10 border border-gicm-primary/30"
                  : "bg-white/5 border border-transparent opacity-50"
              }`}
            >
              <div className="text-2xl mb-1">{SOURCE_ICONS[source]}</div>
              <div className="text-xs capitalize">{source}</div>
              {isEnabled && (
                <CheckCircle className="w-3 h-3 text-green-400 mx-auto mt-1" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatsCard({ hunter, discoveries, signals }: { hunter: HunterStatus | null; discoveries: DiscoveriesData | null; signals: SignalsData | null }) {
  const hasSupabase = discoveries?.configured || signals?.configured;
  const totalDiscoveries = discoveries?.stats?.total ?? hunter?.totalDiscoveries ?? 0;
  const totalSignals = signals?.stats?.total ?? hunter?.totalSignals ?? 0;
  const actionableSignals = signals?.stats?.queued ?? hunter?.actionableSignals ?? 0;

  return (
    <div className="bg-gicm-card border border-gicm-border rounded-xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-gicm-primary/10">
          <Zap className="w-5 h-5 text-gicm-primary" />
        </div>
        <div>
          <h3 className="font-semibold">Discovery Stats</h3>
          <p className="text-sm text-gray-400">Opportunity metrics</p>
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
        <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30 text-center">
          <div className="text-3xl font-bold text-blue-400">{totalDiscoveries}</div>
          <div className="text-xs text-gray-400 mt-1">Total Discoveries</div>
        </div>
        <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/30 text-center">
          <div className="text-3xl font-bold text-purple-400">{totalSignals}</div>
          <div className="text-xs text-gray-400 mt-1">Signals Generated</div>
        </div>
        <div className="p-4 rounded-lg bg-gicm-primary/10 border border-gicm-primary/30 text-center">
          <div className="text-3xl font-bold text-gicm-primary">{actionableSignals}</div>
          <div className="text-xs text-gray-400 mt-1">Actionable</div>
        </div>
      </div>
    </div>
  );
}

function RecentDiscoveries({ hunter, supabaseDiscoveries }: { hunter: HunterStatus | null; supabaseDiscoveries: DiscoveriesData | null }) {
  const hubDiscoveries = hunter?.recentDiscoveries ?? [];
  const hasSupabase = supabaseDiscoveries?.configured && supabaseDiscoveries.discoveries.length > 0;

  const discoveries = hasSupabase
    ? supabaseDiscoveries.discoveries.slice(0, 10).map((d) => ({
        id: d.id,
        title: d.title,
        source: d.source,
        category: d.type,
        relevanceScore: d.relevance ?? 0,
        url: d.url as string | undefined,
      }))
    : hubDiscoveries.map((d) => ({
        ...d,
        url: undefined as string | undefined,
      }));

  if (discoveries.length === 0) {
    return (
      <div className="bg-gicm-card border border-gicm-border rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-gicm-primary/10">
            <Target className="w-5 h-5 text-gicm-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Recent Discoveries</h3>
            <p className="text-sm text-gray-400">Latest opportunities</p>
          </div>
        </div>
        <div className="text-center py-8">
          <Radar className="w-12 h-12 text-gray-500 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-400">No discoveries yet</p>
          <p className="text-sm text-gray-500 mt-2">Hunter is scanning for opportunities...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gicm-card border border-gicm-border rounded-xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-gicm-primary/10">
          <Target className="w-5 h-5 text-gicm-primary" />
        </div>
        <div>
          <h3 className="font-semibold">Recent Discoveries</h3>
          <p className="text-sm text-gray-400">Latest opportunities</p>
        </div>
        {hasSupabase && (
          <div className="ml-auto flex items-center gap-2">
            <Database className="w-3 h-3 text-green-400" />
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-gray-500">Live</span>
          </div>
        )}
      </div>
      <div className="space-y-3">
        {discoveries.map((discovery) => (
          <div
            key={discovery.id}
            className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-transparent hover:border-gicm-primary/20 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="text-xl">{SOURCE_ICONS[discovery.source] ?? "📌"}</div>
              <div>
                <div className="font-medium line-clamp-1">{discovery.title}</div>
                <div className="text-xs text-gray-400">
                  {discovery.source} • {discovery.category}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 px-2 py-1 rounded bg-yellow-500/10 border border-yellow-500/30">
                <Star className="w-3 h-3 text-yellow-400" />
                <span className="text-sm font-medium text-yellow-400">{discovery.relevanceScore}</span>
              </div>
              {discovery.url && (
                <a
                  href={discovery.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-gicm-primary"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function QuickStats({ hunter, discoveries, signals }: { hunter: HunterStatus | null; discoveries: DiscoveriesData | null; signals: SignalsData | null }) {
  const sources = hunter?.enabledSources?.length ?? 0;
  const totalDiscoveries = discoveries?.stats?.total ?? hunter?.totalDiscoveries ?? 0;
  const totalSignals = signals?.stats?.total ?? hunter?.totalSignals ?? 0;
  const actionable = signals?.stats?.queued ?? hunter?.actionableSignals ?? 0;

  const stats = [
    { label: "Active Sources", value: `${sources}/11`, color: "gicm-primary", Icon: Radar },
    { label: "Discoveries", value: totalDiscoveries, color: "blue", Icon: Target },
    { label: "Signals", value: totalSignals, color: "purple", Icon: Activity },
    { label: "Actionable", value: actionable, color: "green", Icon: TrendingUp },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={`p-4 rounded-xl border ${
            stat.color === "gicm-primary" ? "bg-gicm-primary/10 border-gicm-primary/30" :
            stat.color === "blue" ? "bg-blue-500/10 border-blue-500/30" :
            stat.color === "purple" ? "bg-purple-500/10 border-purple-500/30" :
            "bg-green-500/10 border-green-500/30"
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <stat.Icon className={`w-4 h-4 ${
              stat.color === "gicm-primary" ? "text-gicm-primary" :
              stat.color === "blue" ? "text-blue-400" :
              stat.color === "purple" ? "text-purple-400" :
              "text-green-400"
            }`} />
            <span className="text-sm text-gray-400">{stat.label}</span>
          </div>
          <div className={`text-2xl font-bold ${
            stat.color === "gicm-primary" ? "text-gicm-primary" :
            stat.color === "blue" ? "text-blue-400" :
            stat.color === "purple" ? "text-purple-400" :
            "text-green-400"
          }`}>
            {stat.value}
          </div>
        </div>
      ))}
    </div>
  );
}

function StatusIndicator({ isRunning }: { isRunning: boolean }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
      isRunning ? "bg-green-500/10 text-green-400 border border-green-500/30" : "bg-red-500/10 text-red-400 border border-red-500/30"
    }`}>
      <div className={`w-2 h-2 rounded-full ${isRunning ? "bg-green-400 animate-pulse" : "bg-red-400"}`} />
      {isRunning ? "Scanning" : "Stopped"}
    </div>
  );
}

export default function HunterPage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hunter, setHunter] = useState<HunterStatus | null>(null);
  const [discoveries, setDiscoveries] = useState<DiscoveriesData | null>(null);
  const [signals, setSignals] = useState<SignalsData | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // WebSocket for real-time updates
  const ws = useWebSocket({
    autoReconnect: true,
    reconnectDelay: 3000,
    onEvent: (event) => {
      if (event.type?.includes("hunter") || event.type?.includes("discovery") || event.type?.includes("signal")) {
        fetchData();
      }
    },
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [hunterData, discoveriesData, signalsData] = await Promise.all([
      hubApi.getHunter().catch(() => null),
      supabaseApi.getDiscoveries().catch(() => null),
      supabaseApi.getSignals().catch(() => null),
    ]);
    setHunter(hunterData);
    setDiscoveries(discoveriesData);
    setSignals(signalsData);
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
        <div className="text-gray-500">Loading Hunter...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gicm-primary/10">
              <Target className="w-6 h-6 text-gicm-primary" />
            </div>
            Hunter Agent
          </h1>
          <p className="text-gray-400 mt-1 ml-12">Multi-source opportunity discovery & signal generation</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusIndicator isRunning={hunter?.isRunning ?? false} />
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

      <QuickStats hunter={hunter} discoveries={discoveries} signals={signals} />
      <SourcesGrid hunter={hunter} />

      <div className="grid grid-cols-2 gap-6">
        <StatsCard hunter={hunter} discoveries={discoveries} signals={signals} />
        <RecentDiscoveries hunter={hunter} supabaseDiscoveries={discoveries} />
      </div>

      {!hunter && !loading && (
        <div className="bg-gicm-card border border-gicm-border rounded-xl p-6 text-center">
          <Target className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400">Hunter Agent not connected</p>
          <p className="text-sm text-gray-500 mt-2">Start the Hunter to begin scanning for opportunities</p>
        </div>
      )}
    </div>
  );
}
