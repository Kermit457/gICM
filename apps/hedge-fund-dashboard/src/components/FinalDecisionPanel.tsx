"use client";

import { cn, getActionColor } from "@/lib/utils";
import type { AnalysisResult } from "@/lib/api";
import { Target, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";

interface FinalDecisionPanelProps {
  decision: AnalysisResult["final_decision"];
  token: string;
}

export function FinalDecisionPanel({ decision, token }: FinalDecisionPanelProps) {
  const isBuy = decision.action === "buy";
  const isSell = decision.action === "sell" || decision.action === "avoid";

  return (
    <div
      className={cn(
        "border-2 rounded-xl p-6",
        isBuy && "border-bullish bg-bullish/5",
        isSell && "border-bearish bg-bearish/5",
        !isBuy && !isSell && "border-neutral bg-neutral/5"
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">Final Decision</h2>
        <div
          className={cn(
            "px-4 py-2 rounded-lg text-lg font-bold uppercase flex items-center gap-2",
            getActionColor(decision.action)
          )}
        >
          {isBuy && <TrendingUp className="w-5 h-5" />}
          {isSell && <TrendingDown className="w-5 h-5" />}
          {decision.action}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-zinc-500 uppercase">Conviction</p>
          <p className="text-lg font-semibold text-white capitalize">
            {decision.conviction}
          </p>
        </div>
        <div>
          <p className="text-xs text-zinc-500 uppercase">Confidence</p>
          <p className="text-lg font-semibold text-white">{decision.confidence}%</p>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-xs text-zinc-500 uppercase mb-2">Reasoning</p>
        <p className="text-sm text-zinc-300 leading-relaxed">
          {decision.reasoning}
        </p>
      </div>

      {decision.execution_plan && (
        <div className="bg-zinc-800/50 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Target className="w-4 h-4" />
            Execution Plan
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div>
              <p className="text-zinc-500">Entry</p>
              <p className="text-white font-medium">
                {decision.execution_plan.entry_price}
              </p>
            </div>
            <div>
              <p className="text-zinc-500">Size</p>
              <p className="text-white font-medium">
                {decision.execution_plan.position_size_pct}
              </p>
            </div>
            <div>
              <p className="text-zinc-500">Stop Loss</p>
              <p className="text-bearish font-medium">
                {decision.execution_plan.stop_loss}
              </p>
            </div>
            <div>
              <p className="text-zinc-500">Take Profit</p>
              <p className="text-bullish font-medium">
                {decision.execution_plan.take_profit?.join(", ") || "N/A"}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 p-3 bg-zinc-800/30 rounded-lg flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-zinc-400">
          This is AI-generated analysis, not financial advice. Always do your own
          research before trading.
        </p>
      </div>
    </div>
  );
}
