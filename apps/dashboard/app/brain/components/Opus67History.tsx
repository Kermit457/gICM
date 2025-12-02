"use client";

import { Clock, Cpu, DollarSign, ChevronRight } from "lucide-react";
import { type BrainResponse } from "@/lib/api/opus67";

interface Opus67HistoryProps {
  history: BrainResponse[];
  loading?: boolean;
}

export function Opus67History({ history, loading }: Opus67HistoryProps) {
  if (loading) {
    return (
      <div className="bg-gicm-card border border-gicm-border rounded-xl p-6 animate-pulse">
        <div className="h-6 bg-white/10 rounded w-32 mb-4" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-white/10 rounded-lg mb-2" />
        ))}
      </div>
    );
  }

  return (
    <div className="bg-gicm-card border border-gicm-border rounded-xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-gicm-primary/10">
          <Clock className="w-5 h-5 text-gicm-primary" />
        </div>
        <div>
          <h3 className="font-semibold">Response History</h3>
          <p className="text-sm text-gray-400">Recent queries</p>
        </div>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No queries yet</p>
          <p className="text-sm text-gray-600 mt-1">Send a query to see history</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
          {history.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-lg bg-white/5 border border-gicm-border hover:border-gicm-primary/30 transition-colors group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{item.query}</p>
                  <p className="text-sm text-gray-400 mt-1 line-clamp-2">{item.response}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
              </div>

              <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Cpu className="w-3 h-3" />
                  {item.model}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {item.latencyMs.toFixed(0)}ms
                </div>
                <div className="flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  ${item.cost.toFixed(4)}
                </div>
                <span className="px-2 py-0.5 rounded bg-gicm-primary/10 text-gicm-primary uppercase">
                  {item.mode}
                </span>
                <span className="ml-auto">
                  {new Date(item.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
