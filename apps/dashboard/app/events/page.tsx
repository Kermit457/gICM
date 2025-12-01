"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Activity,
  Brain,
  Wallet,
  TrendingUp,
  Package,
  Target,
  Shield,
  Clock,
  Filter,
  RefreshCw,
  ChevronDown,
  AlertCircle,
  CheckCircle,
  Info,
  XCircle,
} from "lucide-react";
import { hubApi, type HubEvent } from "../../lib/api/hub";
import { useWebSocket } from "@/hooks/useWebSocket";
import { ConnectionIndicator } from "@/components/ConnectionIndicator";

const SOURCE_CONFIG: Record<string, { icon: React.ElementType; color: string }> = {
  brain: { icon: Brain, color: "text-purple-400" },
  money: { icon: Wallet, color: "text-green-400" },
  growth: { icon: TrendingUp, color: "text-blue-400" },
  product: { icon: Package, color: "text-orange-400" },
  hunter: { icon: Target, color: "text-gicm-primary" },
  autonomy: { icon: Shield, color: "text-yellow-400" },
};

const CATEGORY_CONFIG: Record<string, { color: string; bgColor: string }> = {
  action: { color: "text-gicm-primary", bgColor: "bg-gicm-primary/10" },
  decision: { color: "text-purple-400", bgColor: "bg-purple-500/10" },
  discovery: { color: "text-blue-400", bgColor: "bg-blue-500/10" },
  error: { color: "text-red-400", bgColor: "bg-red-500/10" },
  success: { color: "text-green-400", bgColor: "bg-green-500/10" },
  info: { color: "text-gray-400", bgColor: "bg-gray-500/10" },
};

function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return date.toLocaleDateString();
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString();
}

function EventIcon({ category }: { category: string }) {
  switch (category) {
    case "error":
      return <XCircle className="w-4 h-4" />;
    case "success":
      return <CheckCircle className="w-4 h-4" />;
    case "action":
      return <Activity className="w-4 h-4" />;
    default:
      return <Info className="w-4 h-4" />;
  }
}

function EventCard({ event }: { event: HubEvent }) {
  const [expanded, setExpanded] = useState(false);
  const sourceConfig = SOURCE_CONFIG[event.source] ?? { icon: Activity, color: "text-gray-400" };
  const categoryConfig = CATEGORY_CONFIG[event.category] ?? CATEGORY_CONFIG.info;
  const SourceIcon = sourceConfig.icon;

  return (
    <div className="bg-gicm-card border border-gicm-border rounded-lg overflow-hidden">
      <div
        className="p-4 flex items-start gap-4 cursor-pointer hover:bg-white/5 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className={`p-2 rounded-lg ${categoryConfig.bgColor}`}>
          <SourceIcon className={`w-5 h-5 ${sourceConfig.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs px-2 py-0.5 rounded ${categoryConfig.bgColor} ${categoryConfig.color}`}>
              {event.category}
            </span>
            <span className="text-xs text-gray-500">{event.source}</span>
          </div>
          <div className="font-medium">{event.type}</div>
          <div className="text-sm text-gray-400 flex items-center gap-2 mt-1">
            <Clock className="w-3 h-3" />
            {formatTimestamp(event.timestamp)} • {formatTime(event.timestamp)}
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${expanded ? "rotate-180" : ""}`} />
      </div>
      {expanded && (
        <div className="px-4 pb-4 border-t border-gicm-border">
          <div className="mt-3 p-3 bg-black/30 rounded-lg font-mono text-xs overflow-x-auto">
            <pre>{JSON.stringify(event.payload, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterBar({
  sources,
  categories,
  selectedSource,
  selectedCategory,
  onSourceChange,
  onCategoryChange,
}: {
  sources: string[];
  categories: string[];
  selectedSource: string;
  selectedCategory: string;
  onSourceChange: (source: string) => void;
  onCategoryChange: (category: string) => void;
}) {
  return (
    <div className="flex items-center gap-4 p-4 bg-gicm-card border border-gicm-border rounded-lg">
      <div className="flex items-center gap-2 text-gray-400">
        <Filter className="w-4 h-4" />
        <span className="text-sm">Filters:</span>
      </div>
      <select
        value={selectedSource}
        onChange={(e) => onSourceChange(e.target.value)}
        className="bg-white/5 border border-gicm-border rounded px-3 py-1.5 text-sm"
      >
        <option value="">All Sources</option>
        {sources.map((source) => (
          <option key={source} value={source}>
            {source}
          </option>
        ))}
      </select>
      <select
        value={selectedCategory}
        onChange={(e) => onCategoryChange(e.target.value)}
        className="bg-white/5 border border-gicm-border rounded px-3 py-1.5 text-sm"
      >
        <option value="">All Categories</option>
        {categories.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </select>
    </div>
  );
}

function EventStats({ events }: { events: HubEvent[] }) {
  const bySource = events.reduce((acc, e) => {
    acc[e.source] = (acc[e.source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const byCategory = events.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-gicm-card border border-gicm-border rounded-lg p-4">
        <h4 className="text-sm text-gray-400 mb-3">By Source</h4>
        <div className="space-y-2">
          {Object.entries(bySource).map(([source, count]) => {
            const config = SOURCE_CONFIG[source] ?? { icon: Activity, color: "text-gray-400" };
            const Icon = config.icon;
            return (
              <div key={source} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${config.color}`} />
                  <span className="capitalize">{source}</span>
                </div>
                <span className="font-medium">{count}</span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="bg-gicm-card border border-gicm-border rounded-lg p-4">
        <h4 className="text-sm text-gray-400 mb-3">By Category</h4>
        <div className="space-y-2">
          {Object.entries(byCategory).map(([category, count]) => {
            const config = CATEGORY_CONFIG[category] ?? CATEGORY_CONFIG.info;
            return (
              <div key={category} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <EventIcon category={category} />
                  <span className={`capitalize ${config.color}`}>{category}</span>
                </div>
                <span className="font-medium">{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function EventsPage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<HubEvent[]>([]);
  const [selectedSource, setSelectedSource] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // WebSocket for real-time updates
  const ws = useWebSocket({
    autoReconnect: true,
    reconnectDelay: 3000,
    onEvent: (event) => {
      // Add new events to the list in real-time
      setEvents((prev) => {
        // Avoid duplicates
        if (prev.some((e) => e.id === event.id)) return prev;
        return [event, ...prev].slice(0, 100); // Keep max 100 events
      });
    },
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    const data = await hubApi.getEvents(100);
    setEvents(data?.events ?? []);
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
  // Events page polls faster since it's real-time focused
  useEffect(() => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    const interval = ws.isConnected ? 30000 : 5000; // 5s fallback for events
    pollingRef.current = setInterval(fetchData, interval);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [ws.isConnected, fetchData]);

  const sources = [...new Set(events.map((e) => e.source))];
  const categories = [...new Set(events.map((e) => e.category))];

  const filteredEvents = events.filter((e) => {
    if (selectedSource && e.source !== selectedSource) return false;
    if (selectedCategory && e.category !== selectedCategory) return false;
    return true;
  });

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading Events...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Activity className="w-8 h-8 text-gicm-primary" />
            Event Stream
          </h1>
          <p className="text-gray-400 mt-1">Real-time audit trail of all system events</p>
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

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-gicm-card border border-gicm-border rounded-lg p-4">
          <div className="text-sm text-gray-400 mb-1">Total Events</div>
          <div className="text-2xl font-bold text-gicm-primary">{events.length}</div>
        </div>
        <div className="bg-gicm-card border border-gicm-border rounded-lg p-4">
          <div className="text-sm text-gray-400 mb-1">Sources</div>
          <div className="text-2xl font-bold text-blue-400">{sources.length}</div>
        </div>
        <div className="bg-gicm-card border border-gicm-border rounded-lg p-4">
          <div className="text-sm text-gray-400 mb-1">Categories</div>
          <div className="text-2xl font-bold text-purple-400">{categories.length}</div>
        </div>
        <div className="bg-gicm-card border border-gicm-border rounded-lg p-4">
          <div className="text-sm text-gray-400 mb-1">Filtered</div>
          <div className="text-2xl font-bold text-green-400">{filteredEvents.length}</div>
        </div>
      </div>

      <EventStats events={events} />

      <FilterBar
        sources={sources}
        categories={categories}
        selectedSource={selectedSource}
        selectedCategory={selectedCategory}
        onSourceChange={setSelectedSource}
        onCategoryChange={setSelectedCategory}
      />

      <div className="space-y-3">
        {filteredEvents.length === 0 ? (
          <div className="bg-gicm-card border border-gicm-border rounded-xl p-8 text-center">
            <Activity className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">No events found</p>
            <p className="text-sm text-gray-500 mt-2">
              {events.length === 0
                ? "Start the Integration Hub to see events"
                : "Try adjusting your filters"}
            </p>
          </div>
        ) : (
          filteredEvents.map((event) => <EventCard key={event.id} event={event} />)
        )}
      </div>
    </div>
  );
}
