"use client";

import { useDashboardStore } from "@/lib/store";
import { api } from "@/lib/api";
import { Brain, Play, Square, RefreshCw } from "lucide-react";

export function BrainStatusCard() {
  const { brainStatus, fetchBrainStatus, loading } = useDashboardStore();

  const handleStart = async () => {
    await api.startBrain();
    fetchBrainStatus();
  };

  const handleStop = async () => {
    await api.stopBrain();
    fetchBrainStatus();
  };

  if (!brainStatus) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 animate-pulse">
        <div className="h-6 bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-gray-700 rounded w-2/3"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div
            className={
              "w-10 h-10 rounded-lg flex items-center justify-center " +
              (brainStatus.isRunning ? "bg-green-600" : "bg-gray-600")
            }
          >
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">gICM Brain</h2>
            <p className="text-sm text-gray-400">v{brainStatus.version}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={fetchBrainStatus}
            disabled={loading.brain}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg"
          >
            <RefreshCw className={"w-4 h-4 " + (loading.brain ? "animate-spin" : "")} />
          </button>

          {brainStatus.isRunning ? (
            <button
              onClick={handleStop}
              className="flex items-center px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm"
            >
              <Square className="w-4 h-4 mr-2" />
              Stop
            </button>
          ) : (
            <button
              onClick={handleStart}
              className="flex items-center px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm"
            >
              <Play className="w-4 h-4 mr-2" />
              Start
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Status</span>
          <span
            className={
              "text-sm font-medium " +
              (brainStatus.isRunning ? "text-green-400" : "text-gray-400")
            }
          >
            {brainStatus.isRunning ? "Running" : "Stopped"}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Mode</span>
          <span
            className={
              "text-sm font-medium " +
              (brainStatus.dryRun ? "text-yellow-400" : "text-green-400")
            }
          >
            {brainStatus.dryRun ? "Dry Run" : "Live"}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Autonomy</span>
          <span className="text-sm font-medium text-white">
            Level {brainStatus.autonomyLevel} - {brainStatus.autonomyDescription}
          </span>
        </div>

        <div className="pt-3 border-t border-gray-700">
          <p className="text-xs text-gray-500 mb-1">Prime Directive</p>
          <p className="text-sm text-blue-400">{brainStatus.primeDirective}</p>
        </div>
      </div>
    </div>
  );
}
