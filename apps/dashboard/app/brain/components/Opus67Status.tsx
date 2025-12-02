"use client";

import { Brain, Zap, Database, Clock, DollarSign, Activity, Wifi, WifiOff } from "lucide-react";
import { type BrainStatus, type BrainMetrics, type ConnectionStatus } from "@/lib/api/opus67";

interface Opus67StatusProps {
  status: BrainStatus | null;
  metrics: BrainMetrics | null;
  connectionStatus: ConnectionStatus;
  loading?: boolean;
}

export function Opus67Status({ status, metrics, connectionStatus, loading }: Opus67StatusProps) {
  if (loading) {
    return (
      <div className="bg-gicm-card border border-gicm-border rounded-xl p-6 animate-pulse">
        <div className="h-6 bg-white/10 rounded w-48 mb-4" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-white/10 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!status || connectionStatus === "disconnected") {
    return (
      <div className="bg-gicm-card border border-gicm-border rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-red-500/10">
            <WifiOff className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h3 className="font-semibold">OPUS 67 BRAIN</h3>
            <p className="text-sm text-red-400">
              {connectionStatus === "connecting" ? "Connecting..." : "Not connected"}
            </p>
          </div>
        </div>
        <p className="text-gray-500 text-sm">
          Unable to connect to OPUS 67 BRAIN server. Make sure it&apos;s running on port 3100.
        </p>
      </div>
    );
  }

  const formatUptime = (ms: number) => {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="bg-gicm-card border border-gicm-border rounded-xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className={`p-2 rounded-lg ${status.running ? "bg-gicm-primary/10" : "bg-yellow-500/10"}`}>
          <Brain className={`w-5 h-5 ${status.running ? "text-gicm-primary" : "text-yellow-400"}`} />
        </div>
        <div>
          <h3 className="font-semibold">OPUS 67 BRAIN</h3>
          <p className="text-sm text-gray-400">Self-evolving AI runtime</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${status.running ? "bg-green-400 animate-pulse" : "bg-yellow-400"}`} />
          <span className="text-sm text-gray-400">{status.running ? "Running" : "Stopped"}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Mode */}
        <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/30">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-gray-400">Mode</span>
          </div>
          <div className="text-xl font-bold text-purple-400 uppercase">{status.mode}</div>
        </div>

        {/* Requests */}
        <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-gray-400">Requests</span>
          </div>
          <div className="text-xl font-bold text-blue-400">{status.totalRequests}</div>
        </div>

        {/* Latency */}
        <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-green-400" />
            <span className="text-xs text-gray-400">Avg Latency</span>
          </div>
          <div className="text-xl font-bold text-green-400">{status.avgLatencyMs.toFixed(0)}ms</div>
        </div>

        {/* Cost */}
        <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/30">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-orange-400" />
            <span className="text-xs text-gray-400">Total Cost</span>
          </div>
          <div className="text-xl font-bold text-orange-400">${status.totalCost.toFixed(4)}</div>
        </div>
      </div>

      {/* Bottom row - Evolution & Memory */}
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="p-3 rounded-lg bg-white/5 border border-gicm-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-gicm-primary" />
            <span className="text-sm text-gray-400">Memory Nodes</span>
          </div>
          <span className="font-medium">{status.memoryNodes}</span>
        </div>
        <div className="p-3 rounded-lg bg-white/5 border border-gicm-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gicm-primary" />
            <span className="text-sm text-gray-400">Uptime</span>
          </div>
          <span className="font-medium">{formatUptime(status.uptime)}</span>
        </div>
      </div>

      {/* Evolution status */}
      {status.evolutionActive && (
        <div className="mt-4 p-3 rounded-lg bg-gicm-primary/10 border border-gicm-primary/30">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gicm-primary animate-pulse" />
            <span className="text-sm text-gicm-primary">Evolution active - {status.evolutionCycles} cycles completed</span>
          </div>
        </div>
      )}
    </div>
  );
}
