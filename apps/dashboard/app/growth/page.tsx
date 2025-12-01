"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useWebSocket } from "@/hooks/useWebSocket";
import { ConnectionIndicator } from "@/components/ConnectionIndicator";
import {
  TrendingUp,
  Users,
  Eye,
  FileText,
  Twitter,
  MessageCircle,
  Search,
  Globe,
  Calendar,
  BarChart3,
  RefreshCw,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { hubApi, type GrowthStatus } from "../../lib/api/hub";

function formatNumber(value: number): string {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toString();
}

function TrafficCard({ growth }: { growth: GrowthStatus | null }) {
  const traffic = growth?.metrics?.traffic ?? { daily: 0, weekly: 0, monthly: 0 };

  return (
    <div className="bg-gicm-card border border-gicm-border rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Eye className="w-5 h-5 text-gicm-primary" />
        Website Traffic
      </h3>
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-4 bg-white/5 rounded-lg">
          <div className="text-3xl font-bold text-gicm-primary">{formatNumber(traffic.daily)}</div>
          <div className="text-xs text-gray-400 mt-1">Today</div>
        </div>
        <div className="text-center p-4 bg-white/5 rounded-lg">
          <div className="text-3xl font-bold text-blue-400">{formatNumber(traffic.weekly)}</div>
          <div className="text-xs text-gray-400 mt-1">This Week</div>
        </div>
        <div className="text-center p-4 bg-white/5 rounded-lg">
          <div className="text-3xl font-bold text-purple-400">{formatNumber(traffic.monthly)}</div>
          <div className="text-xs text-gray-400 mt-1">This Month</div>
        </div>
      </div>
    </div>
  );
}

function ContentCard({ growth }: { growth: GrowthStatus | null }) {
  const content = growth?.metrics?.content ?? { postsPublished: 0, totalViews: 0, avgEngagement: 0 };

  return (
    <div className="bg-gicm-card border border-gicm-border rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <FileText className="w-5 h-5 text-gicm-primary" />
        Content Performance
      </h3>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Posts Published</span>
          <span className="text-2xl font-bold">{content.postsPublished}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Total Views</span>
          <span className="text-2xl font-bold text-blue-400">{formatNumber(content.totalViews)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Avg. Engagement</span>
          <span className="text-2xl font-bold text-green-400">{content.avgEngagement.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
}

function SocialCard({ growth }: { growth: GrowthStatus | null }) {
  const social = growth?.metrics?.social ?? { twitterFollowers: 0, discordMembers: 0 };

  return (
    <div className="bg-gicm-card border border-gicm-border rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Users className="w-5 h-5 text-gicm-primary" />
        Social Growth
      </h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 text-blue-400 mb-2">
            <Twitter className="w-5 h-5" />
            <span className="text-sm">Twitter</span>
          </div>
          <div className="text-2xl font-bold">{formatNumber(social.twitterFollowers)}</div>
          <div className="text-xs text-gray-400">followers</div>
        </div>
        <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 text-purple-400 mb-2">
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm">Discord</span>
          </div>
          <div className="text-2xl font-bold">{formatNumber(social.discordMembers)}</div>
          <div className="text-xs text-gray-400">members</div>
        </div>
      </div>
    </div>
  );
}

function SEOCard({ growth }: { growth: GrowthStatus | null }) {
  const seo = growth?.metrics?.seo ?? { avgPosition: 0, indexedPages: 0, backlinks: 0 };

  const positionColor = seo.avgPosition <= 10 ? "text-green-400" : seo.avgPosition <= 30 ? "text-yellow-400" : "text-red-400";

  return (
    <div className="bg-gicm-card border border-gicm-border rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Search className="w-5 h-5 text-gicm-primary" />
        SEO Performance
      </h3>
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className={`text-2xl font-bold ${positionColor}`}>#{seo.avgPosition.toFixed(0)}</div>
          <div className="text-xs text-gray-400 mt-1">Avg Position</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-400">{formatNumber(seo.indexedPages)}</div>
          <div className="text-xs text-gray-400 mt-1">Indexed Pages</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-400">{formatNumber(seo.backlinks)}</div>
          <div className="text-xs text-gray-400 mt-1">Backlinks</div>
        </div>
      </div>
    </div>
  );
}

function UpcomingContent({ growth }: { growth: GrowthStatus | null }) {
  const upcoming = growth?.upcomingContent ?? { blogPosts: 0, tweets: 0 };

  return (
    <div className="bg-gicm-card border border-gicm-border rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Calendar className="w-5 h-5 text-gicm-primary" />
        Content Calendar
      </h3>
      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-gicm-primary" />
            <span>Blog Posts Scheduled</span>
          </div>
          <span className="text-xl font-bold">{upcoming.blogPosts}</span>
        </div>
        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
          <div className="flex items-center gap-3">
            <Twitter className="w-5 h-5 text-blue-400" />
            <span>Tweets Queued</span>
          </div>
          <span className="text-xl font-bold">{upcoming.tweets}</span>
        </div>
      </div>
      <div className="mt-4 text-sm text-gray-500 text-center">
        Target: 3 blog posts/week, 5 tweets/day
      </div>
    </div>
  );
}

function QuickStats({ growth }: { growth: GrowthStatus | null }) {
  const traffic = growth?.metrics?.traffic?.daily ?? 0;
  const posts = growth?.metrics?.content?.postsPublished ?? 0;
  const followers = growth?.metrics?.social?.twitterFollowers ?? 0;
  const position = growth?.metrics?.seo?.avgPosition ?? 0;

  return (
    <div className="grid grid-cols-4 gap-4">
      <div className="bg-gicm-card border border-gicm-border rounded-lg p-4">
        <div className="text-sm text-gray-400 mb-1">Daily Visitors</div>
        <div className="text-2xl font-bold text-gicm-primary">{formatNumber(traffic)}</div>
      </div>
      <div className="bg-gicm-card border border-gicm-border rounded-lg p-4">
        <div className="text-sm text-gray-400 mb-1">Posts Published</div>
        <div className="text-2xl font-bold text-blue-400">{posts}</div>
      </div>
      <div className="bg-gicm-card border border-gicm-border rounded-lg p-4">
        <div className="text-sm text-gray-400 mb-1">Twitter Followers</div>
        <div className="text-2xl font-bold text-purple-400">{formatNumber(followers)}</div>
      </div>
      <div className="bg-gicm-card border border-gicm-border rounded-lg p-4">
        <div className="text-sm text-gray-400 mb-1">Avg SEO Position</div>
        <div className={`text-2xl font-bold ${position <= 10 ? "text-green-400" : "text-yellow-400"}`}>
          #{position.toFixed(0) || "-"}
        </div>
      </div>
    </div>
  );
}

export default function GrowthPage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [growth, setGrowth] = useState<GrowthStatus | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // WebSocket for real-time updates
  const ws = useWebSocket({
    autoReconnect: true,
    reconnectDelay: 3000,
    onEvent: (event) => {
      if (event.type?.includes("growth") || event.type?.includes("content") || event.type?.includes("social")) {
        fetchData();
      }
    },
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    const data = await hubApi.getGrowth().catch(() => null);
    setGrowth(data);
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
        <div className="text-gray-500">Loading Growth...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-gicm-primary" />
            Growth Engine
          </h1>
          <p className="text-gray-400 mt-1">Content marketing, social media & SEO automation</p>
        </div>
        <div className="flex items-center gap-3">
          <ConnectionIndicator status={ws.status} isRealtime={ws.isConnected} compact />
          <button
            onClick={() => fetchData()}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      <QuickStats growth={growth} />

      <div className="grid grid-cols-2 gap-6">
        <TrafficCard growth={growth} />
        <ContentCard growth={growth} />
      </div>

      <div className="grid grid-cols-3 gap-6">
        <SocialCard growth={growth} />
        <SEOCard growth={growth} />
        <UpcomingContent growth={growth} />
      </div>

      {!growth && !loading && (
        <div className="bg-gicm-card border border-gicm-border rounded-xl p-6 text-center">
          <Globe className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400">Growth data not available</p>
          <p className="text-sm text-gray-500 mt-2">Start the Growth Engine to see live metrics</p>
        </div>
      )}
    </div>
  );
}
