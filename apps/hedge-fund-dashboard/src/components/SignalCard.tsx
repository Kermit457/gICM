"use client";

import { cn, getActionColor } from "@/lib/utils";
import type { AgentSignal } from "@/lib/api";
import { TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface SignalCardProps {
  signal: AgentSignal;
}

export function SignalCard({ signal }: SignalCardProps) {
  const [expanded, setExpanded] = useState(false);

  const ActionIcon = {
    bullish: TrendingUp,
    bearish: TrendingDown,
    neutral: Minus,
  }[signal.action];

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center",
              signal.action === "bullish" && "bg-bullish/20",
              signal.action === "bearish" && "bg-bearish/20",
              signal.action === "neutral" && "bg-neutral/20"
            )}
          >
            <ActionIcon
              className={cn(
                "w-5 h-5",
                signal.action === "bullish" && "text-bullish",
                signal.action === "bearish" && "text-bearish",
                signal.action === "neutral" && "text-neutral"
              )}
            />
          </div>
          <div>
            <h3 className="font-semibold text-white">{signal.agent}</h3>
            <div className="flex items-center gap-2 text-sm">
              <span
                className={cn(
                  "px-2 py-0.5 rounded text-xs font-medium uppercase border",
                  getActionColor(signal.action)
                )}
              >
                {signal.action}
              </span>
              <span className="text-zinc-400">{signal.confidence}% confidence</span>
            </div>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-zinc-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-zinc-500" />
        )}
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-zinc-800 space-y-3">
          <div>
            <h4 className="text-xs font-medium text-zinc-500 uppercase mb-1">
              Reasoning
            </h4>
            <p className="text-sm text-zinc-300">{signal.reasoning}</p>
          </div>

          {signal.key_metrics.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-zinc-500 uppercase mb-1">
                Key Metrics
              </h4>
              <div className="flex flex-wrap gap-1">
                {signal.key_metrics.map((metric, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 bg-zinc-800 rounded text-xs text-zinc-300"
                  >
                    {metric}
                  </span>
                ))}
              </div>
            </div>
          )}

          {signal.risks.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-zinc-500 uppercase mb-1">
                Risks
              </h4>
              <ul className="text-sm text-zinc-400 list-disc list-inside">
                {signal.risks.map((risk, i) => (
                  <li key={i}>{risk}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
