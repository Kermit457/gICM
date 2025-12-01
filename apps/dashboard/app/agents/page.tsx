"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Bot,
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Cpu,
  HardDrive,
  Wifi,
  WifiOff,
  RefreshCw,
  Play,
  Square,
  Settings,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Zap,
  Shield,
  Target,
  Wallet,
  FileText,
  Search,
  BarChart3,
  Loader2,
} from "lucide-react";
import { useWebSocket } from "../../hooks/useWebSocket";
import { hubApi } from "@/lib/api/hub";

// Agent types
interface AgentStatus {
  id: string;
  name: string;
  type: "trading" | "analysis" | "content" | "security" | "utility";
  status: "running" | "idle" | "error" | "stopped";
  uptime: number;
  lastActivity: number;
  tasksCompleted: number;
  tasksFailed: number;
  currentTask: string | null;
  metrics: {
    cpu: number;
    memory: number;
    requestsPerMin: number;
  };
  version: string;
}

// Empty initial state - data comes from hub API

const TYPE_ICONS: Record<string, typeof Bot> = {
  trading: Target,
  analysis: BarChart3,
  content: FileText,
  security: Shield,
  utility: Zap,
};

const TYPE_COLORS: Record<string, string> = {
  trading: "text-green-400 bg-green-500/20",
  analysis: "text-blue-400 bg-blue-500/20",
  content: "text-purple-400 bg-purple-500/20",
  security: "text-yellow-400 bg-yellow-500/20",
  utility: "text-gray-400 bg-gray-500/20",
};

const STATUS_COLORS: Record<string, string> = {
  running: "text-green-400",
  idle: "text-yellow-400",
  error: "text-red-400",
  stopped: "text-gray-500",
};

const STATUS_BG: Record<string, string> = {
  running: "bg-green-500/20",
  idle: "bg-yellow-500/20",
  error: "bg-red-500/20",
  stopped: "bg-gray-500/20",
};

function formatUptime(ms: number): string {
  if (ms === 0) return "Stopped";
  const hours = Math.floor(ms / 3600000);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ${hours % 24}h`;
  const minutes = Math.floor((ms % 3600000) / 60000);
  return `${hours}h ${minutes}m`;
}

function formatLastActivity(timestamp: number): string {
  const diff = Date.now() - timestamp;
  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

function AgentCard({ agent, onAction }: { agent: AgentStatus; onAction: (action: string) => void }) {
  const TypeIcon = TYPE_ICONS[agent.type] || Bot;
  const successRate = agent.tasksCompleted > 0
    ? ((agent.tasksCompleted / (agent.tasksCompleted + agent.tasksFailed)) * 100).toFixed(1)
    : "0";

  return (
    <div className="bg-gicm-card border border-gicm-border rounded-xl p-6 hover:border-gicm-primary/30 transition-all">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${TYPE_COLORS[agent.type]}`}>
            <TypeIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-white">{agent.name}</h3>
            <p className="text-sm text-gray-400 capitalize">{agent.type} Agent</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_BG[agent.status]} ${STATUS_COLORS[agent.status]}`}>
            {agent.status}
          </span>
          <span className="text-xs text-gray-500">v{agent.version}</span>
        </div>
      </div>

      {/* Current Task */}
      {agent.currentTask && (
        <div className="mb-4 p-3 bg-gicm-dark rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Current Task</p>
          <p className="text-sm text-white truncate">{agent.currentTask}</p>
        </div>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-500">CPU</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-gicm-dark rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${agent.metrics.cpu > 80 ? "bg-red-500" : agent.metrics.cpu > 50 ? "bg-yellow-500" : "bg-green-500"}`}
                style={{ width: `${agent.metrics.cpu}%` }}
              />
            </div>
            <span className="text-xs text-gray-400">{agent.metrics.cpu}%</span>
          </div>
        </div>
        <div>
          <p className="text-xs text-gray-500">Memory</p>
          <p className="text-sm text-white">{agent.metrics.memory}MB</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Req/min</p>
          <p className="text-sm text-white">{agent.metrics.requestsPerMin}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4 pt-4 border-t border-gicm-border">
        <div>
          <p className="text-xs text-gray-500">Uptime</p>
          <p className="text-sm text-white">{formatUptime(agent.uptime)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Tasks</p>
          <p className="text-sm text-white">
            <span className="text-green-400">{agent.tasksCompleted}</span>
            {agent.tasksFailed > 0 && (
              <span className="text-red-400 ml-1">/ {agent.tasksFailed}</span>
            )}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Success</p>
          <p className="text-sm text-white">{successRate}%</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {agent.status === "running" ? (
          <button
            onClick={() => onAction("stop")}
            className="flex-1 flex items-center justify-center gap-2 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
          >
            <Square className="w-4 h-4" />
            Stop
          </button>
        ) : (
          <button
            onClick={() => onAction("start")}
            className="flex-1 flex items-center justify-center gap-2 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors"
          >
            <Play className="w-4 h-4" />
            Start
          </button>
        )}
        <button
          onClick={() => onAction("configure")}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <Settings className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Last Activity */}
      <p className="text-xs text-gray-500 mt-3 text-center">
        Last activity: {formatLastActivity(agent.lastActivity)}
      </p>
    </div>
  );
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<AgentStatus[]>([]);
  const [filter, setFilter] = useState<"all" | "running" | "idle" | "stopped">("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch agent data from hub API
  const fetchData = useCallback(async () => {
    try {
      const [statusRes, brainRes] = await Promise.all([
        hubApi.getStatus(),
        hubApi.getBrain(),
      ]);

      // Transform hub engine health to agent status
      const enginesList = statusRes?.engines?.details || [];
      if (enginesList.length > 0) {
        const newAgents: AgentStatus[] = [];

        for (const engine of enginesList) {
          newAgents.push({
            id: engine.id,
            name: engine.id.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
            type: getAgentType(engine.id),
            status: engine.status === "healthy" ? "running" : engine.status === "degraded" ? "idle" : engine.connected ? "idle" : "stopped",
            uptime: engine.lastHeartbeat ? Date.now() - engine.lastHeartbeat : 0,
            lastActivity: engine.lastHeartbeat || Date.now(),
            tasksCompleted: 0,
            tasksFailed: 0,
            currentTask: null,
            metrics: { cpu: 0, memory: 0, requestsPerMin: 0 },
            version: "1.0.0",
          });
        }

        if (newAgents.length > 0) {
          setAgents(newAgents);
          setIsLive(true);
        }
      }

      // Update from brain status if available
      if (brainRes?.status?.engines) {
        setAgents(prev => prev.map(agent => {
          const brainEngine = brainRes.status.engines[agent.id as keyof typeof brainRes.status.engines];
          if (brainEngine !== undefined) {
            return {
              ...agent,
              status: brainEngine ? "running" : "stopped",
            };
          }
          return agent;
        }));
      }
    } catch (error) {
      console.error("[Agents] Failed to fetch data:", error);
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

  const ws = useWebSocket({
    onMessage: (message) => {
      if (message.type === "event" && message.payload) {
        const event = message.payload as { type: string; data?: AgentStatus };
        if (event.type === "agent:status" && event.data) {
          setAgents((prev) =>
            prev.map((a) => (a.id === event.data!.id ? event.data! : a))
          );
        }
      }
    },
  });

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

// Helper to determine agent type
function getAgentType(id: string): AgentStatus["type"] {
  if (id.includes("hunter") || id.includes("trading") || id.includes("wallet")) return "trading";
  if (id.includes("defi") || id.includes("decision") || id.includes("analysis")) return "analysis";
  if (id.includes("growth") || id.includes("content")) return "content";
  if (id.includes("audit") || id.includes("security")) return "security";
  return "utility";
}

  const filteredAgents = agents.filter((agent) => {
    if (filter !== "all" && agent.status !== filter) return false;
    if (typeFilter !== "all" && agent.type !== typeFilter) return false;
    return true;
  });

  const stats = {
    total: agents.length,
    running: agents.filter((a) => a.status === "running").length,
    idle: agents.filter((a) => a.status === "idle").length,
    stopped: agents.filter((a) => a.status === "stopped").length,
    errors: agents.filter((a) => a.status === "error").length,
  };

  const handleAgentAction = (agentId: string, action: string) => {
    console.log(`Action ${action} on agent ${agentId}`);
    // In real implementation, this would call the hub API
  };

  return (
    <div className="min-h-screen bg-gicm-dark p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <Bot className="w-7 h-7 text-gicm-primary" />
              Agent Health Dashboard
            </h1>
            <p className="text-gray-400 mt-1">
              Monitor and manage all running agents
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isLive && (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-sm text-gray-400">Live Data</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              {ws.isConnected ? (
                <Wifi className="w-4 h-4 text-green-400" />
              ) : (
                <WifiOff className="w-4 h-4 text-gray-500" />
              )}
              <span className={ws.isConnected ? "text-green-400" : "text-gray-500"}>
                {ws.isConnected ? "WS" : "Offline"}
              </span>
            </div>
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

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-gicm-card border border-gicm-border rounded-xl p-4">
            <p className="text-sm text-gray-400">Total Agents</p>
            <p className="text-2xl font-bold text-white">{stats.total}</p>
          </div>
          <div className="bg-gicm-card border border-gicm-border rounded-xl p-4">
            <p className="text-sm text-gray-400">Running</p>
            <p className="text-2xl font-bold text-green-400">{stats.running}</p>
          </div>
          <div className="bg-gicm-card border border-gicm-border rounded-xl p-4">
            <p className="text-sm text-gray-400">Idle</p>
            <p className="text-2xl font-bold text-yellow-400">{stats.idle}</p>
          </div>
          <div className="bg-gicm-card border border-gicm-border rounded-xl p-4">
            <p className="text-sm text-gray-400">Stopped</p>
            <p className="text-2xl font-bold text-gray-400">{stats.stopped}</p>
          </div>
          <div className="bg-gicm-card border border-gicm-border rounded-xl p-4">
            <p className="text-sm text-gray-400">Errors</p>
            <p className="text-2xl font-bold text-red-400">{stats.errors}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex gap-2">
            {["all", "running", "idle", "stopped"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as typeof filter)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  filter === f
                    ? "bg-gicm-primary text-black"
                    : "bg-gicm-card text-gray-400 hover:text-white"
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {["all", "trading", "analysis", "content", "security", "utility"].map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  typeFilter === t
                    ? "bg-gicm-primary text-black"
                    : "bg-gicm-card text-gray-400 hover:text-white"
                }`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Agent Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAgents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onAction={(action) => handleAgentAction(agent.id, action)}
            />
          ))}
        </div>

        {filteredAgents.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-400">
            <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
            {agents.length === 0 ? (
              <>
                <p>No agents connected</p>
                <p className="text-sm mt-2">Start the Integration Hub to see agent status</p>
              </>
            ) : (
              <p>No agents match the selected filters</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
