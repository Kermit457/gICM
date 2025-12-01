"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Sliders,
  Wallet,
  TrendingUp,
  Package,
  Shield,
  Brain,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  XCircle,
  Activity,
  Clock,
  Zap,
  DollarSign,
  BarChart3,
  FileText,
  Target,
  Play,
  Pause,
  ChevronDown,
  Search,
  PenTool,
  Loader2,
  Wifi,
  WifiOff,
} from "lucide-react";
import {
  hubApi,
  type HubStatus,
  type HubEvent,
  type EngineHealth,
  type TreasuryStatus,
  type GrowthStatus,
  type ProductStatus,
  type AutonomyStatus,
  type BrainStatus,
  type HunterStatus,
} from "../../lib/api/hub";
import { useWebSocket, type ConnectionStatus } from "../../hooks/useWebSocket";

// Engine metrics types
interface EngineMetrics {
  treasury?: TreasuryStatus | null;
  growth?: GrowthStatus | null;
  product?: ProductStatus | null;
  autonomy?: AutonomyStatus | null;
  brain?: BrainStatus | null;
  hunter?: HunterStatus | null;
}

// Format currency
function formatCurrency(value: number): string {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

// Quick action definitions for each engine
interface QuickAction {
  id: string;
  label: string;
  icon: typeof Play;
  action: () => Promise<void>;
}

type ActionStatus = "idle" | "loading" | "success" | "error";

// Toast notification component
function Toast({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50 ${
      type === "success" ? "bg-green-500/90 text-white" : "bg-red-500/90 text-white"
    }`}>
      {type === "success" ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
}

// Engine configuration
const ENGINE_CONFIG = [
  {
    id: "brain",
    name: "Brain",
    icon: Brain,
    color: "purple",
    description: "Master orchestrator",
    link: "/brain",
  },
  {
    id: "money",
    name: "Treasury",
    icon: Wallet,
    color: "green",
    description: "Funds & allocations",
    link: "/treasury",
  },
  {
    id: "growth",
    name: "Growth",
    icon: TrendingUp,
    color: "blue",
    description: "Content & marketing",
    link: "/growth",
  },
  {
    id: "product",
    name: "Product",
    icon: Package,
    color: "orange",
    description: "Discovery & building",
    link: "/product",
  },
  {
    id: "autonomy",
    name: "Autonomy",
    icon: Shield,
    color: "yellow",
    description: "Approvals & audit",
    link: "/brain",
  },
  {
    id: "hunter",
    name: "Hunter",
    icon: Target,
    color: "red",
    description: "Opportunity discovery",
    link: "/hunter",
  },
];

// Color classes mapping
const COLOR_CLASSES = {
  green: {
    bg: "bg-green-500/10",
    border: "border-green-500/30",
    text: "text-green-400",
    dot: "bg-green-400",
  },
  blue: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    text: "text-blue-400",
    dot: "bg-blue-400",
  },
  purple: {
    bg: "bg-purple-500/10",
    border: "border-purple-500/30",
    text: "text-purple-400",
    dot: "bg-purple-400",
  },
  orange: {
    bg: "bg-orange-500/10",
    border: "border-orange-500/30",
    text: "text-orange-400",
    dot: "bg-orange-400",
  },
  yellow: {
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/30",
    text: "text-yellow-400",
    dot: "bg-yellow-400",
  },
  red: {
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    text: "text-red-400",
    dot: "bg-red-400",
  },
  gray: {
    bg: "bg-gray-500/10",
    border: "border-gray-500/30",
    text: "text-gray-400",
    dot: "bg-gray-400",
  },
};

// Status badge component
function StatusBadge({ status }: { status: "healthy" | "degraded" | "offline" | "unknown" }) {
  const statusConfig = {
    healthy: { icon: CheckCircle, label: "Healthy", color: "green" as const },
    degraded: { icon: AlertCircle, label: "Degraded", color: "yellow" as const },
    offline: { icon: XCircle, label: "Offline", color: "red" as const },
    unknown: { icon: AlertCircle, label: "Unknown", color: "gray" as const },
  };

  const config = statusConfig[status];
  const Icon = config.icon;
  const colors = COLOR_CLASSES[config.color];

  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full ${colors.bg} ${colors.border} border`}>
      <span className={`w-2 h-2 rounded-full ${colors.dot} ${status === "healthy" ? "animate-pulse" : ""}`} />
      <span className={`text-xs font-medium ${colors.text}`}>{config.label}</span>
    </div>
  );
}

// Get metrics display for each engine
function getEngineMetrics(engineId: string, metrics: EngineMetrics): { label: string; value: string }[] {
  switch (engineId) {
    case "brain":
      if (!metrics.brain) return [{ label: "Status", value: "—" }, { label: "Actions", value: "—" }];
      return [
        { label: "Phase", value: metrics.brain.currentPhase ?? "Idle" },
        { label: "Today", value: `${metrics.brain.metrics?.todayActions ?? 0} actions` },
      ];
    case "money":
      if (!metrics.treasury) return [{ label: "Value", value: "—" }, { label: "Runway", value: "—" }];
      return [
        { label: "Value", value: formatCurrency(metrics.treasury.totalValueUsd) },
        { label: "Runway", value: `${metrics.treasury.runway ?? 0} mo` },
      ];
    case "growth":
      if (!metrics.growth) return [{ label: "Posts", value: "—" }, { label: "Queue", value: "—" }];
      return [
        { label: "Posts", value: `${metrics.growth.metrics?.content?.postsPublished ?? 0}` },
        { label: "Queue", value: `${metrics.growth.upcomingContent?.tweets ?? 0} tweets` },
      ];
    case "product":
      if (!metrics.product) return [{ label: "Backlog", value: "—" }, { label: "Built", value: "—" }];
      return [
        { label: "Backlog", value: `${metrics.product.backlog?.total ?? 0}` },
        { label: "Built", value: `${metrics.product.metrics?.built ?? 0}` },
      ];
    case "autonomy":
      if (!metrics.autonomy) return [{ label: "Level", value: "—" }, { label: "Pending", value: "—" }];
      return [
        { label: "Level", value: `L${metrics.autonomy.level}` },
        { label: "Pending", value: `${metrics.autonomy.queue?.pending ?? 0}` },
      ];
    case "hunter":
      if (!metrics.hunter) return [{ label: "Signals", value: "—" }, { label: "Sources", value: "—" }];
      return [
        { label: "Signals", value: `${metrics.hunter.actionableSignals ?? 0}` },
        { label: "Sources", value: `${metrics.hunter.enabledSources?.length ?? 0}` },
      ];
    default:
      return [{ label: "Status", value: "—" }, { label: "Data", value: "—" }];
  }
}

// Get quick actions for each engine
function getEngineActions(
  engineId: string,
  brainRunning: boolean,
  onAction: (action: string, result: boolean) => void
): QuickAction[] {
  switch (engineId) {
    case "brain":
      return brainRunning
        ? [
            {
              id: "stop",
              label: "Stop Brain",
              icon: Pause,
              action: async () => {
                const res = await hubApi.stopBrain();
                onAction("Brain stopped", !!res?.ok);
              },
            },
          ]
        : [
            {
              id: "start",
              label: "Start Brain",
              icon: Play,
              action: async () => {
                const res = await hubApi.startBrain();
                onAction("Brain started", !!res?.ok);
              },
            },
          ];
    case "growth":
      return [
        {
          id: "tweet",
          label: "Generate Tweet",
          icon: PenTool,
          action: async () => {
            const res = await hubApi.generateContent("tweet");
            onAction("Tweet generated", !!res?.ok);
          },
        },
        {
          id: "blog",
          label: "Generate Blog",
          icon: FileText,
          action: async () => {
            const res = await hubApi.generateContent("blog");
            onAction("Blog generated", !!res?.ok);
          },
        },
      ];
    case "product":
      return [
        {
          id: "discovery",
          label: "Run Discovery",
          icon: Search,
          action: async () => {
            const res = await hubApi.runDiscovery();
            onAction("Discovery started", !!res?.ok);
          },
        },
      ];
    default:
      return [];
  }
}

// Engine card component
function EngineCard({
  engine,
  health,
  metrics,
  brainRunning,
  onAction,
}: {
  engine: typeof ENGINE_CONFIG[0];
  health?: { status: "healthy" | "degraded" | "offline"; connected: boolean; lastHeartbeat: number | null };
  metrics: EngineMetrics;
  brainRunning: boolean;
  onAction: (message: string, success: boolean) => void;
}) {
  const [showActions, setShowActions] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const Icon = engine.icon;
  const colors = COLOR_CLASSES[engine.color as keyof typeof COLOR_CLASSES];
  const status = health?.status ?? "unknown";
  const engineMetrics = getEngineMetrics(engine.id, metrics);
  const actions = getEngineActions(engine.id, brainRunning, onAction);

  const handleAction = async (action: QuickAction) => {
    setActionLoading(action.id);
    try {
      await action.action();
    } catch {
      onAction(`${action.label} failed`, false);
    } finally {
      setActionLoading(null);
      setShowActions(false);
    }
  };

  return (
    <div className={`bg-gicm-card border border-gicm-border rounded-xl p-5 hover:border-gicm-primary/50 transition-all relative`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-lg ${colors.bg} border ${colors.border}`}>
            <Icon className={`w-5 h-5 ${colors.text}`} />
          </div>
          <div>
            <h3 className="font-semibold text-white">{engine.name}</h3>
            <p className="text-xs text-gray-500">{engine.description}</p>
          </div>
        </div>
        <StatusBadge status={status as "healthy" | "degraded" | "offline" | "unknown"} />
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {engineMetrics.map((metric, idx) => (
          <div
            key={idx}
            className={`p-2 rounded-lg ${colors.bg} border ${colors.border}`}
          >
            <div className="text-xs text-gray-500">{metric.label}</div>
            <div className={`text-sm font-semibold ${colors.text}`}>{metric.value}</div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Link
          href={engine.link}
          className="flex-1 px-3 py-2 rounded-lg text-center text-sm font-medium bg-white/5 border border-gicm-border text-gray-300 hover:bg-white/10 hover:text-white transition-all"
        >
          View
        </Link>
        {actions.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setShowActions(!showActions)}
              className="px-3 py-2 rounded-lg text-sm font-medium bg-gicm-primary/10 border border-gicm-primary/30 text-gicm-primary hover:bg-gicm-primary/20 transition-all flex items-center gap-1"
            >
              <Zap className="w-4 h-4" />
              <ChevronDown className={`w-3 h-3 transition-transform ${showActions ? "rotate-180" : ""}`} />
            </button>
            {showActions && (
              <div className="absolute top-full right-0 mt-1 w-48 bg-gicm-card border border-gicm-border rounded-lg shadow-xl z-10 overflow-hidden">
                {actions.map((action) => {
                  const ActionIcon = action.icon;
                  const isLoading = actionLoading === action.id;
                  return (
                    <button
                      key={action.id}
                      onClick={() => handleAction(action)}
                      disabled={isLoading}
                      className="w-full px-4 py-2.5 text-left text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <ActionIcon className="w-4 h-4" />
                      )}
                      {action.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Connection status indicator
function ConnectionIndicator({ status, isRealtime }: { status: ConnectionStatus; isRealtime: boolean }) {
  const config = {
    connected: {
      icon: Wifi,
      label: "Real-time",
      color: "text-green-400",
      dot: "bg-green-400 animate-pulse",
    },
    connecting: {
      icon: Wifi,
      label: "Connecting...",
      color: "text-yellow-400",
      dot: "bg-yellow-400 animate-pulse",
    },
    disconnected: {
      icon: WifiOff,
      label: "Polling",
      color: "text-gray-400",
      dot: "bg-gray-400",
    },
    error: {
      icon: WifiOff,
      label: "Polling",
      color: "text-gray-400",
      dot: "bg-gray-400",
    },
  };

  const c = config[status];
  const Icon = c.icon;

  return (
    <div className="flex items-center gap-2">
      <span className={`w-2 h-2 rounded-full ${c.dot}`} />
      <Icon className={`w-4 h-4 ${c.color}`} />
      <span className={`text-sm ${c.color}`}>{c.label}</span>
    </div>
  );
}

// Activity feed component
function ActivityFeed({ events }: { events: HubEvent[] }) {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "trade":
      case "treasury":
        return <DollarSign className="w-4 h-4 text-green-400" />;
      case "content":
        return <FileText className="w-4 h-4 text-blue-400" />;
      case "build":
      case "discovery":
        return <Package className="w-4 h-4 text-orange-400" />;
      case "engine":
        return <Zap className="w-4 h-4 text-purple-400" />;
      case "brain":
        return <Brain className="w-4 h-4 text-purple-400" />;
      case "hunter":
      case "signal":
        return <Target className="w-4 h-4 text-red-400" />;
      default:
        return <Activity className="w-4 h-4 text-gray-400" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "trade":
      case "treasury":
        return "green";
      case "content":
        return "blue";
      case "build":
      case "discovery":
        return "orange";
      case "engine":
      case "brain":
        return "purple";
      case "hunter":
      case "signal":
        return "red";
      default:
        return "gray";
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  };

  const formatPayload = (event: HubEvent) => {
    const payload = event.payload;
    // Try to extract a meaningful message from the payload
    if (payload.message) return String(payload.message);
    if (payload.action) return `Action: ${payload.action}`;
    if (payload.status) return `Status: ${payload.status}`;
    if (payload.name) return String(payload.name);
    return event.type;
  };

  if (events.length === 0) {
    return (
      <div className="bg-gicm-card border border-gicm-border rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-gicm-primary/10">
            <Activity className="w-5 h-5 text-gicm-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Activity Feed</h3>
            <p className="text-sm text-gray-400">Real-time event stream</p>
          </div>
        </div>
        <div className="text-center py-8 text-gray-500">
          <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No events yet</p>
          <p className="text-xs mt-1">Events will appear here as engines operate</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gicm-card border border-gicm-border rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-gicm-primary/10">
          <Activity className="w-5 h-5 text-gicm-primary" />
        </div>
        <div>
          <h3 className="font-semibold">Activity Feed</h3>
          <p className="text-sm text-gray-400">Real-time event stream</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-sm text-gray-400">Live</span>
        </div>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {events.map((event) => {
          const color = getCategoryColor(event.category);
          const colors = COLOR_CLASSES[color as keyof typeof COLOR_CLASSES];
          return (
            <div
              key={event.id}
              className={`flex items-start gap-3 p-3 rounded-lg ${colors.bg} border ${colors.border}`}
            >
              <div className="mt-0.5">{getCategoryIcon(event.category)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium ${colors.text} uppercase`}>
                    {event.source}
                  </span>
                  <span className="text-xs text-gray-500">{event.type}</span>
                </div>
                <p className="text-sm text-gray-300 truncate mt-0.5">
                  {formatPayload(event)}
                </p>
              </div>
              <span className="text-xs text-gray-500 whitespace-nowrap">
                {formatTime(event.timestamp)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// System health summary
function SystemHealth({ status }: { status: HubStatus | null }) {
  const engineDetails = status?.engines?.details ?? [];
  const healthy = engineDetails.filter((e) => e.status === "healthy").length;
  const degraded = engineDetails.filter((e) => e.status === "degraded").length;
  const offline = engineDetails.filter((e) => e.status === "offline").length;
  const total = engineDetails.length || 5;

  const overallStatus =
    offline > 0 ? "degraded" : degraded > 0 ? "degraded" : healthy === total ? "healthy" : "unknown";

  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
        <div className="text-sm text-green-400 mb-1">Healthy</div>
        <div className="text-2xl font-bold text-white">{healthy}</div>
      </div>
      <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
        <div className="text-sm text-yellow-400 mb-1">Degraded</div>
        <div className="text-2xl font-bold text-white">{degraded}</div>
      </div>
      <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
        <div className="text-sm text-red-400 mb-1">Offline</div>
        <div className="text-2xl font-bold text-white">{offline}</div>
      </div>
      <div className={`p-4 rounded-lg ${
        overallStatus === "healthy"
          ? "bg-green-500/10 border-green-500/30"
          : overallStatus === "degraded"
          ? "bg-yellow-500/10 border-yellow-500/30"
          : "bg-gray-500/10 border-gray-500/30"
      } border`}>
        <div className={`text-sm ${
          overallStatus === "healthy"
            ? "text-green-400"
            : overallStatus === "degraded"
            ? "text-yellow-400"
            : "text-gray-400"
        } mb-1`}>System</div>
        <div className="text-2xl font-bold text-white capitalize">{overallStatus}</div>
      </div>
    </div>
  );
}

// Main page component
export default function CommandCenterPage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<HubStatus | null>(null);
  const [polledEvents, setPolledEvents] = useState<HubEvent[]>([]);
  const [metrics, setMetrics] = useState<EngineMetrics>({});
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const pollingRef = React.useRef<NodeJS.Timeout | null>(null);

  // WebSocket connection for real-time events
  const ws = useWebSocket({
    autoReconnect: true,
    reconnectDelay: 3000,
    maxReconnectAttempts: 10,
    heartbeat: true,
    onEvent: (event) => {
      // Real-time events are handled by WebSocket hook
      // No need to merge manually - ws.events contains all events
    },
  });

  // Merge WebSocket events with polled events, dedupe by id
  const events = React.useMemo(() => {
    const allEvents = [...ws.events, ...polledEvents];
    const seen = new Set<string>();
    const unique = allEvents.filter((e) => {
      if (seen.has(e.id)) return false;
      seen.add(e.id);
      return true;
    });
    // Sort by timestamp descending
    return unique.sort((a, b) => b.timestamp - a.timestamp).slice(0, 50);
  }, [ws.events, polledEvents]);

  const handleAction = (message: string, success: boolean) => {
    setToast({ message, type: success ? "success" : "error" });
    if (success) {
      // Refresh data after successful action
      setTimeout(fetchData, 500);
    }
  };

  const fetchData = useCallback(async () => {
    try {
      // Fetch all data in parallel
      const [statusData, eventsData, treasuryData, growthData, productData, autonomyData, brainData, hunterData] = await Promise.all([
        hubApi.getStatus(),
        hubApi.getEvents(20),
        hubApi.getTreasury(),
        hubApi.getGrowth(),
        hubApi.getProduct(),
        hubApi.getAutonomy(),
        hubApi.getBrain(),
        hubApi.getHunter(),
      ]);
      setStatus(statusData);
      setPolledEvents(eventsData?.events ?? []);
      setMetrics({
        treasury: treasuryData,
        growth: growthData,
        product: productData,
        autonomy: autonomyData,
        brain: brainData?.status,
        hunter: hunterData,
      });
      setLastRefresh(new Date());
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch and polling setup (fallback when WebSocket not connected)
  useEffect(() => {
    setMounted(true);
    fetchData();

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [fetchData]);

  // Start/stop polling based on WebSocket status
  useEffect(() => {
    if (!ws.isConnected) {
      // WebSocket not connected - use polling (every 10 seconds)
      if (!pollingRef.current) {
        pollingRef.current = setInterval(fetchData, 10000);
      }
    } else {
      // WebSocket connected - stop polling for events
      // Still poll metrics every 30 seconds since WebSocket only sends events
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
      pollingRef.current = setInterval(fetchData, 30000);
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [ws.isConnected, fetchData]);

  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="h-12 bg-gicm-card rounded-lg animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-gicm-card rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Map engine health from status
  const engineHealth = status?.engines?.details?.reduce(
    (acc, e) => ({ ...acc, [e.id]: e }),
    {} as Record<string, EngineHealth>
  ) ?? {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gicm-primary/10">
              <Sliders className="w-6 h-6 text-gicm-primary" />
            </div>
            Command Center
          </h1>
          <p className="text-gray-400 mt-1 ml-12">
            Unified control for all gICM engines
          </p>
        </div>
        <div className="flex items-center gap-4">
          <ConnectionIndicator status={ws.status} isRealtime={ws.isConnected} />
          {status?.running && (
            <div className="flex items-center gap-2 ml-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-sm text-gray-400">Hub</span>
            </div>
          )}
          <button
            onClick={() => {
              setLoading(true);
              fetchData();
            }}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            disabled={loading}
            title="Refresh data"
          >
            <RefreshCw className={`w-5 h-5 text-gray-400 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* System Health Summary */}
      <SystemHealth status={status} />

      {/* Engine Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {ENGINE_CONFIG.map((engine) => (
          <EngineCard
            key={engine.id}
            engine={engine}
            health={engineHealth[engine.id]}
            metrics={metrics}
            brainRunning={metrics.brain?.isRunning ?? false}
            onAction={handleAction}
          />
        ))}
      </div>

      {/* Activity Feed */}
      <ActivityFeed events={events} />

      {/* Footer Status */}
      <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t border-gicm-border">
        <span>
          Hub: {status?.running ? "Running" : "Stopped"} on port {status?.apiPort ?? 3001}
        </span>
        <span>
          Last updated: {lastRefresh?.toLocaleTimeString() ?? "Never"}
        </span>
        <span>
          {status?.workflows ?? 0} workflows registered
        </span>
      </div>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
