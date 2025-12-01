"use client";

import { useDashboardStore } from "@/lib/store";
import { BarChart3, CheckCircle, AlertTriangle } from "lucide-react";

export function MetricsCard() {
  const brainStatus = useDashboardStore((s) => s.brainStatus);

  const metrics = brainStatus?.metrics || {
    todayPhases: 0,
    todayActions: 0,
    todayErrors: 0,
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center space-x-3 mb-4">
        <BarChart3 className="w-5 h-5 text-purple-400" />
        <h2 className="text-lg font-semibold text-white">Today's Metrics</h2>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-2 bg-blue-900/50 rounded-full flex items-center justify-center">
            <span className="text-xl font-bold text-blue-400">
              {metrics.todayPhases}
            </span>
          </div>
          <p className="text-xs text-gray-400">Phases</p>
        </div>

        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-2 bg-green-900/50 rounded-full flex items-center justify-center">
            <span className="text-xl font-bold text-green-400">
              {metrics.todayActions}
            </span>
          </div>
          <p className="text-xs text-gray-400">Actions</p>
        </div>

        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-2 bg-red-900/50 rounded-full flex items-center justify-center">
            <span className="text-xl font-bold text-red-400">
              {metrics.todayErrors}
            </span>
          </div>
          <p className="text-xs text-gray-400">Errors</p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">Engines Connected</span>
          <div className="flex items-center space-x-1">
            {["money", "growth", "product", "trading"].map((engine) => {
              const connected = brainStatus?.engines[engine as keyof typeof brainStatus.engines];
              return (
                <div
                  key={engine}
                  className={
                    "w-2 h-2 rounded-full " +
                    (connected ? "bg-green-400" : "bg-gray-600")
                  }
                  title={engine + ": " + (connected ? "connected" : "offline")}
                />
              );
            })}
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          {metrics.todayErrors === 0 ? (
            <>
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-green-400">All systems operational</span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
              <span className="text-yellow-400">
                {metrics.todayErrors} error{metrics.todayErrors !== 1 ? "s" : ""} today
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
