"use client";

import { useState } from "react";
import { Dna, Play, Square, RefreshCw, Loader2 } from "lucide-react";
import { type BrainStatus, type BrainMetrics } from "@/lib/api/opus67";

interface Opus67EvolutionProps {
  status: BrainStatus | null;
  metrics: BrainMetrics | null;
  onStart: () => Promise<boolean>;
  onStop: () => Promise<boolean>;
  onRunCycle: () => Promise<boolean>;
  disabled?: boolean;
}

export function Opus67Evolution({ status, metrics, onStart, onStop, onRunCycle, disabled }: Opus67EvolutionProps) {
  const [loading, setLoading] = useState<"start" | "stop" | "cycle" | null>(null);

  const handleStart = async () => {
    setLoading("start");
    try {
      await onStart();
    } finally {
      setLoading(null);
    }
  };

  const handleStop = async () => {
    setLoading("stop");
    try {
      await onStop();
    } finally {
      setLoading(null);
    }
  };

  const handleRunCycle = async () => {
    setLoading("cycle");
    try {
      await onRunCycle();
    } finally {
      setLoading(null);
    }
  };

  const isActive = status?.evolutionActive ?? false;
  const cycles = metrics?.evolution?.totalCycles ?? status?.evolutionCycles ?? 0;
  const successRate = metrics?.evolution
    ? ((metrics.evolution.successfulCycles / Math.max(metrics.evolution.totalCycles, 1)) * 100).toFixed(0)
    : "N/A";

  return (
    <div className="bg-gicm-card border border-gicm-border rounded-xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className={`p-2 rounded-lg ${isActive ? "bg-gicm-primary/10" : "bg-gray-500/10"}`}>
          <Dna className={`w-5 h-5 ${isActive ? "text-gicm-primary" : "text-gray-500"}`} />
        </div>
        <div>
          <h3 className="font-semibold">Evolution Engine</h3>
          <p className="text-sm text-gray-400">Self-improvement system</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isActive ? "bg-gicm-primary animate-pulse" : "bg-gray-500"}`} />
          <span className="text-sm text-gray-400">{isActive ? "Active" : "Paused"}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-3 rounded-lg bg-white/5 text-center">
          <div className="text-2xl font-bold text-gicm-primary">{cycles}</div>
          <div className="text-xs text-gray-400 mt-1">Total Cycles</div>
        </div>
        <div className="p-3 rounded-lg bg-white/5 text-center">
          <div className="text-2xl font-bold text-green-400">{successRate}%</div>
          <div className="text-xs text-gray-400 mt-1">Success Rate</div>
        </div>
        <div className="p-3 rounded-lg bg-white/5 text-center">
          <div className="text-2xl font-bold text-blue-400">{metrics?.evolution?.improvements ?? 0}</div>
          <div className="text-xs text-gray-400 mt-1">Improvements</div>
        </div>
      </div>

      <div className="flex gap-3">
        {isActive ? (
          <button
            onClick={handleStop}
            disabled={disabled || loading !== null}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/20 disabled:opacity-50 transition-colors"
          >
            {loading === "stop" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Square className="w-4 h-4" />
            )}
            Stop Evolution
          </button>
        ) : (
          <button
            onClick={handleStart}
            disabled={disabled || loading !== null}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gicm-primary/10 border border-gicm-primary/30 text-gicm-primary rounded-lg hover:bg-gicm-primary/20 disabled:opacity-50 transition-colors"
          >
            {loading === "start" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            Start Evolution
          </button>
        )}

        <button
          onClick={handleRunCycle}
          disabled={disabled || loading !== null}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-lg hover:bg-blue-500/20 disabled:opacity-50 transition-colors"
        >
          {loading === "cycle" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Run Cycle
        </button>
      </div>

      {metrics?.evolution?.lastCycleAt && (
        <div className="mt-4 text-xs text-gray-500 text-center">
          Last cycle: {new Date(metrics.evolution.lastCycleAt).toLocaleString()}
        </div>
      )}
    </div>
  );
}
