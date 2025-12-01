"use client";

import type { AgentSignal } from "@/lib/api";

interface SentimentGaugeProps {
  signals: AgentSignal[];
}

export function SentimentGauge({ signals }: SentimentGaugeProps) {
  const bullish = signals.filter((s) => s.action === "bullish").length;
  const bearish = signals.filter((s) => s.action === "bearish").length;
  const neutral = signals.filter((s) => s.action === "neutral").length;
  const total = signals.length;

  const bullishPct = total > 0 ? (bullish / total) * 100 : 0;
  const bearishPct = total > 0 ? (bearish / total) * 100 : 0;
  const neutralPct = total > 0 ? (neutral / total) * 100 : 0;

  const avgConfidence =
    total > 0
      ? signals.reduce((sum, s) => sum + s.confidence, 0) / total
      : 0;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
      <h2 className="text-lg font-semibold text-white mb-4">Agent Consensus</h2>

      {/* Sentiment bar */}
      <div className="h-4 rounded-full overflow-hidden flex mb-4">
        {bullishPct > 0 && (
          <div
            className="bg-bullish transition-all"
            style={{ width: `${bullishPct}%` }}
          />
        )}
        {neutralPct > 0 && (
          <div
            className="bg-neutral transition-all"
            style={{ width: `${neutralPct}%` }}
          />
        )}
        {bearishPct > 0 && (
          <div
            className="bg-bearish transition-all"
            style={{ width: `${bearishPct}%` }}
          />
        )}
      </div>

      {/* Legend */}
      <div className="flex justify-between text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-bullish" />
          <span className="text-zinc-400">
            Bullish: {bullish} ({bullishPct.toFixed(0)}%)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-neutral" />
          <span className="text-zinc-400">
            Neutral: {neutral} ({neutralPct.toFixed(0)}%)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-bearish" />
          <span className="text-zinc-400">
            Bearish: {bearish} ({bearishPct.toFixed(0)}%)
          </span>
        </div>
      </div>

      {/* Average confidence */}
      <div className="mt-4 pt-4 border-t border-zinc-800">
        <div className="flex justify-between items-center">
          <span className="text-sm text-zinc-500">Avg Confidence</span>
          <span className="text-lg font-semibold text-white">
            {avgConfidence.toFixed(0)}%
          </span>
        </div>
        <div className="mt-2 h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all"
            style={{ width: `${avgConfidence}%` }}
          />
        </div>
      </div>
    </div>
  );
}
