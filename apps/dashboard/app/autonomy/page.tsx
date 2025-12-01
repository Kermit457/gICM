"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Settings,
  History,
  ChevronRight,
  Sliders,
  Lock,
  Unlock,
  Eye,
  TrendingUp,
  DollarSign,
  FileText,
  Code,
  RefreshCw,
  Check,
  X,
  Info,
  Loader2,
} from "lucide-react";
import { hubApi } from "@/lib/api/hub";
import { useWebSocket } from "@/hooks/useWebSocket";
import { ConnectionIndicator } from "@/components/ConnectionIndicator";

// Types
interface ApprovalRequest {
  id: string;
  action: string;
  category: "trading" | "content" | "development" | "expense";
  description: string;
  riskScore: number;
  requestedAt: number;
  expiresAt: number;
  context: Record<string, unknown>;
  status: "pending" | "approved" | "rejected" | "expired";
}

interface AuditEntry {
  id: string;
  timestamp: number;
  action: string;
  decision: "auto_execute" | "queue_approval" | "escalate" | "reject";
  riskScore: number;
  outcome: "success" | "failure" | "pending";
  details: string;
}

interface Boundaries {
  financial: {
    maxAutoExpense: number;
    maxDailySpend: number;
    maxTradeSize: number;
  };
  content: {
    maxAutoPostsPerDay: number;
    maxAutoBlogsPerWeek: number;
  };
  development: {
    maxAutoCommitLines: number;
    autoDeployToProduction: boolean;
  };
}

// Empty initial state - data comes from autonomy API

const DEFAULT_BOUNDARIES: Boundaries = {
  financial: { maxAutoExpense: 50, maxDailySpend: 100, maxTradeSize: 500 },
  content: { maxAutoPostsPerDay: 10, maxAutoBlogsPerWeek: 3 },
  development: { maxAutoCommitLines: 100, autoDeployToProduction: false },
};

const CATEGORY_ICONS: Record<string, typeof Shield> = {
  trading: TrendingUp,
  content: FileText,
  development: Code,
  expense: DollarSign,
};

const CATEGORY_COLORS: Record<string, string> = {
  trading: "text-green-400 bg-green-500/20",
  content: "text-purple-400 bg-purple-500/20",
  development: "text-blue-400 bg-blue-500/20",
  expense: "text-yellow-400 bg-yellow-500/20",
};

function getRiskColor(score: number): string {
  if (score <= 20) return "text-green-400";
  if (score <= 40) return "text-blue-400";
  if (score <= 60) return "text-yellow-400";
  if (score <= 80) return "text-orange-400";
  return "text-red-400";
}

function getRiskBg(score: number): string {
  if (score <= 20) return "bg-green-500";
  if (score <= 40) return "bg-blue-500";
  if (score <= 60) return "bg-yellow-500";
  if (score <= 80) return "bg-orange-500";
  return "bg-red-500";
}

function formatTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return new Date(timestamp).toLocaleDateString();
}

function ApprovalCard({
  request,
  onApprove,
  onReject,
  isLoading,
}: {
  request: ApprovalRequest;
  onApprove: () => void;
  onReject: () => void;
  isLoading?: boolean;
}) {
  const Icon = CATEGORY_ICONS[request.category] || Shield;
  const timeLeft = Math.max(0, request.expiresAt - Date.now());
  const hoursLeft = Math.floor(timeLeft / 3600000);

  return (
    <div className="bg-gicm-card border border-gicm-border rounded-xl p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${CATEGORY_COLORS[request.category]}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-white">{request.action}</h3>
            <p className="text-sm text-gray-400 capitalize">{request.category}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(request.riskScore)} bg-white/5`}>
            Risk: {request.riskScore}
          </div>
        </div>
      </div>

      <p className="text-sm text-gray-300 mb-4">{request.description}</p>

      {/* Context */}
      <div className="bg-gicm-dark rounded-lg p-3 mb-4">
        <p className="text-xs text-gray-500 mb-2">Context</p>
        <div className="space-y-1">
          {Object.entries(request.context).map(([key, value]) => (
            <div key={key} className="flex justify-between text-sm">
              <span className="text-gray-400 capitalize">{key}</span>
              <span className="text-white">{String(value)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Risk Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Risk Score</span>
          <span>{request.riskScore}/100</span>
        </div>
        <div className="h-2 bg-gicm-dark rounded-full overflow-hidden">
          <div
            className={`h-full ${getRiskBg(request.riskScore)}`}
            style={{ width: `${request.riskScore}%` }}
          />
        </div>
      </div>

      {/* Expiry */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
        <Clock className="w-4 h-4" />
        <span>Expires in {hoursLeft}h</span>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onApprove}
          disabled={isLoading}
          className="flex-1 flex items-center justify-center gap-2 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Check className="w-4 h-4" />
          )}
          Approve
        </button>
        <button
          onClick={onReject}
          disabled={isLoading}
          className="flex-1 flex items-center justify-center gap-2 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <X className="w-4 h-4" />
          )}
          Reject
        </button>
      </div>
    </div>
  );
}

export default function AutonomyPage() {
  const [activeTab, setActiveTab] = useState<"queue" | "boundaries" | "audit">("queue");
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [boundaries, setBoundaries] = useState<Boundaries>(DEFAULT_BOUNDARIES);
  const [autonomyLevel, setAutonomyLevel] = useState(2);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // WebSocket connection for real-time updates
  const ws = useWebSocket({
    autoReconnect: true,
    reconnectDelay: 3000,
    onEvent: (event) => {
      // Handle autonomy-related events
      if (event.type?.includes("autonomy") || event.type?.includes("approval")) {
        fetchData();
      }
    },
  });

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  // Fetch data from API
  const fetchData = useCallback(async () => {
    try {
      const [queueRes, auditRes, boundariesRes, hubRes] = await Promise.all([
        fetch("/api/autonomy/queue").then((r) => r.ok ? r.json() : null).catch(() => null),
        fetch("/api/autonomy/audit").then((r) => r.ok ? r.json() : null).catch(() => null),
        fetch("/api/autonomy/boundaries").then((r) => r.ok ? r.json() : null).catch(() => null),
        hubApi.getAutonomy().catch(() => null),
      ]);

      let hasRealData = false;

      // Process queue data
      if (queueRes?.ok && queueRes.queue?.length > 0) {
        setRequests(queueRes.queue);
        hasRealData = true;
      } else if ((hubRes?.queue?.pending ?? 0) > 0) {
        // Hub returns queue counts, not actual requests - mark as having data
        hasRealData = true;
      }

      // Process audit data
      if (auditRes?.ok && auditRes.entries?.length > 0) {
        setAudit(auditRes.entries);
        hasRealData = true;
      }

      // Process boundaries data
      if (boundariesRes?.ok && boundariesRes.boundaries) {
        setBoundaries(boundariesRes.boundaries);
        hasRealData = true;
      }

      // Get autonomy level from hub
      if (hubRes?.level) {
        setAutonomyLevel(hubRes.level);
        hasRealData = true;
      }

      setIsLive(hasRealData);
    } catch (error) {
      console.error("Failed to fetch autonomy data:", error);
      setIsLive(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
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

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await fetch("/api/autonomy/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, feedback: "Approved via dashboard" }),
      });

      if (res.ok) {
        setRequests((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status: "approved" as const } : r))
        );
      }
    } catch (error) {
      console.error("Failed to approve request:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await fetch("/api/autonomy/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, reason: "Rejected via dashboard" }),
      });

      if (res.ok) {
        setRequests((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status: "rejected" as const } : r))
        );
      }
    } catch (error) {
      console.error("Failed to reject request:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateBoundaries = async (newBoundaries: Boundaries) => {
    setBoundaries(newBoundaries);
    try {
      await fetch("/api/autonomy/boundaries", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newBoundaries),
      });
    } catch (error) {
      console.error("Failed to update boundaries:", error);
    }
  };

  const stats = {
    pending: requests.filter((r) => r.status === "pending").length,
    approved: audit.filter((a) => a.decision === "auto_execute" && a.outcome === "success").length,
    rejected: audit.filter((a) => a.decision === "reject").length,
    avgRisk: Math.round(audit.reduce((sum, a) => sum + a.riskScore, 0) / audit.length),
  };

  return (
    <div className="min-h-screen bg-gicm-dark p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <Shield className="w-7 h-7 text-gicm-primary" />
              Autonomy Controls
            </h1>
            <p className="text-gray-400 mt-1">
              Manage approval queue, risk boundaries, and audit trail
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* WebSocket Connection Status */}
            <ConnectionIndicator status={ws.status} isRealtime={ws.isConnected} compact />
            {/* Data Live Indicator */}
            {isLive && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 border border-green-500/30 rounded-lg">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-xs text-green-400 font-medium">Data Live</span>
              </div>
            )}
            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="p-2 rounded-lg bg-gicm-card border border-gicm-border hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
              ) : (
                <RefreshCw className="w-5 h-5 text-gray-400" />
              )}
            </button>
            {/* Level Selector */}
            <div className="flex items-center gap-2 px-4 py-2 bg-gicm-card border border-gicm-border rounded-lg">
              <span className="text-sm text-gray-400">Level:</span>
              <select
                value={autonomyLevel}
                onChange={(e) => setAutonomyLevel(Number(e.target.value))}
                className="bg-transparent text-white font-medium focus:outline-none"
              >
                <option value={1}>1 - Manual</option>
                <option value={2}>2 - Bounded</option>
                <option value={3}>3 - Supervised</option>
                <option value={4}>4 - Autonomous</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gicm-card border border-gicm-border rounded-xl p-4">
            <p className="text-sm text-gray-400">Pending</p>
            <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
          </div>
          <div className="bg-gicm-card border border-gicm-border rounded-xl p-4">
            <p className="text-sm text-gray-400">Auto-Executed (24h)</p>
            <p className="text-2xl font-bold text-green-400">{stats.approved}</p>
          </div>
          <div className="bg-gicm-card border border-gicm-border rounded-xl p-4">
            <p className="text-sm text-gray-400">Rejected (24h)</p>
            <p className="text-2xl font-bold text-red-400">{stats.rejected}</p>
          </div>
          <div className="bg-gicm-card border border-gicm-border rounded-xl p-4">
            <p className="text-sm text-gray-400">Avg Risk Score</p>
            <p className={`text-2xl font-bold ${getRiskColor(stats.avgRisk)}`}>{stats.avgRisk}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gicm-border">
          <button
            onClick={() => setActiveTab("queue")}
            className={`pb-3 px-1 text-sm font-medium transition-colors ${
              activeTab === "queue"
                ? "text-gicm-primary border-b-2 border-gicm-primary"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Approval Queue
              {pendingCount > 0 && (
                <span className="px-1.5 py-0.5 text-xs bg-yellow-500/20 text-yellow-400 rounded-full">
                  {pendingCount}
                </span>
              )}
            </div>
          </button>
          <button
            onClick={() => setActiveTab("boundaries")}
            className={`pb-3 px-1 text-sm font-medium transition-colors ${
              activeTab === "boundaries"
                ? "text-gicm-primary border-b-2 border-gicm-primary"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4" />
              Boundaries
            </div>
          </button>
          <button
            onClick={() => setActiveTab("audit")}
            className={`pb-3 px-1 text-sm font-medium transition-colors ${
              activeTab === "audit"
                ? "text-gicm-primary border-b-2 border-gicm-primary"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <div className="flex items-center gap-2">
              <History className="w-4 h-4" />
              Audit Log
            </div>
          </button>
        </div>

        {/* Queue Tab */}
        {activeTab === "queue" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {requests.filter((r) => r.status === "pending").map((request) => (
              <ApprovalCard
                key={request.id}
                request={request}
                onApprove={() => handleApprove(request.id)}
                onReject={() => handleReject(request.id)}
                isLoading={actionLoading === request.id}
              />
            ))}
            {requests.filter((r) => r.status === "pending").length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-400">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No pending approvals</p>
                <p className="text-sm mt-2">All actions are being handled automatically</p>
              </div>
            )}
          </div>
        )}

        {/* Boundaries Tab */}
        {activeTab === "boundaries" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Financial */}
            <div className="bg-gicm-card border border-gicm-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-green-500/20">
                  <DollarSign className="w-5 h-5 text-green-400" />
                </div>
                <h3 className="font-semibold text-white">Financial</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Max Auto Expense ($)</label>
                  <input
                    type="number"
                    value={boundaries.financial.maxAutoExpense}
                    onChange={(e) => handleUpdateBoundaries({
                      ...boundaries,
                      financial: { ...boundaries.financial, maxAutoExpense: Number(e.target.value) },
                    })}
                    className="w-full px-3 py-2 bg-white/5 border border-gicm-border rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Max Daily Spend ($)</label>
                  <input
                    type="number"
                    value={boundaries.financial.maxDailySpend}
                    onChange={(e) => handleUpdateBoundaries({
                      ...boundaries,
                      financial: { ...boundaries.financial, maxDailySpend: Number(e.target.value) },
                    })}
                    className="w-full px-3 py-2 bg-white/5 border border-gicm-border rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Max Trade Size ($)</label>
                  <input
                    type="number"
                    value={boundaries.financial.maxTradeSize}
                    onChange={(e) => handleUpdateBoundaries({
                      ...boundaries,
                      financial: { ...boundaries.financial, maxTradeSize: Number(e.target.value) },
                    })}
                    className="w-full px-3 py-2 bg-white/5 border border-gicm-border rounded-lg text-white"
                  />
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="bg-gicm-card border border-gicm-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <FileText className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className="font-semibold text-white">Content</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Max Auto Posts/Day</label>
                  <input
                    type="number"
                    value={boundaries.content.maxAutoPostsPerDay}
                    onChange={(e) => handleUpdateBoundaries({
                      ...boundaries,
                      content: { ...boundaries.content, maxAutoPostsPerDay: Number(e.target.value) },
                    })}
                    className="w-full px-3 py-2 bg-white/5 border border-gicm-border rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Max Auto Blogs/Week</label>
                  <input
                    type="number"
                    value={boundaries.content.maxAutoBlogsPerWeek}
                    onChange={(e) => handleUpdateBoundaries({
                      ...boundaries,
                      content: { ...boundaries.content, maxAutoBlogsPerWeek: Number(e.target.value) },
                    })}
                    className="w-full px-3 py-2 bg-white/5 border border-gicm-border rounded-lg text-white"
                  />
                </div>
              </div>
            </div>

            {/* Development */}
            <div className="bg-gicm-card border border-gicm-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <Code className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="font-semibold text-white">Development</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Max Auto Commit Lines</label>
                  <input
                    type="number"
                    value={boundaries.development.maxAutoCommitLines}
                    onChange={(e) => handleUpdateBoundaries({
                      ...boundaries,
                      development: { ...boundaries.development, maxAutoCommitLines: Number(e.target.value) },
                    })}
                    className="w-full px-3 py-2 bg-white/5 border border-gicm-border rounded-lg text-white"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-400">Auto Deploy to Prod</label>
                  <button
                    onClick={() => handleUpdateBoundaries({
                      ...boundaries,
                      development: { ...boundaries.development, autoDeployToProduction: !boundaries.development.autoDeployToProduction },
                    })}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      boundaries.development.autoDeployToProduction ? "bg-gicm-primary" : "bg-gray-600"
                    }`}
                  >
                    <span
                      className={`block w-5 h-5 rounded-full bg-white transform transition-transform ${
                        boundaries.development.autoDeployToProduction ? "translate-x-6" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Audit Tab */}
        {activeTab === "audit" && (
          <div className="bg-gicm-card border border-gicm-border rounded-xl">
            <div className="divide-y divide-gicm-border">
              {audit.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${
                      entry.decision === "auto_execute" ? "bg-green-500/20" :
                      entry.decision === "queue_approval" ? "bg-yellow-500/20" :
                      entry.decision === "reject" ? "bg-red-500/20" : "bg-orange-500/20"
                    }`}>
                      {entry.decision === "auto_execute" ? <CheckCircle2 className="w-4 h-4 text-green-400" /> :
                       entry.decision === "queue_approval" ? <Clock className="w-4 h-4 text-yellow-400" /> :
                       entry.decision === "reject" ? <XCircle className="w-4 h-4 text-red-400" /> :
                       <AlertTriangle className="w-4 h-4 text-orange-400" />}
                    </div>
                    <div>
                      <p className="font-medium text-white">{entry.action}</p>
                      <p className="text-sm text-gray-400">{entry.details}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className={`text-sm font-medium ${getRiskColor(entry.riskScore)}`}>
                        Risk: {entry.riskScore}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">{entry.decision.replace("_", " ")}</p>
                    </div>
                    <div className="text-right w-20">
                      <p className={`text-sm ${
                        entry.outcome === "success" ? "text-green-400" :
                        entry.outcome === "failure" ? "text-red-400" : "text-yellow-400"
                      }`}>
                        {entry.outcome}
                      </p>
                      <p className="text-xs text-gray-500">{formatTime(entry.timestamp)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
