"use client";

import { useDashboardStore } from "@/lib/store";
import { api } from "@/lib/api";
import { Clock, Play } from "lucide-react";

const phases = [
  { id: "morning_scan", label: "Morning Scan", time: "06:00" },
  { id: "mid_day_review", label: "Mid-Day Review", time: "12:00" },
  { id: "evening_planning", label: "Evening Planning", time: "18:00" },
  { id: "night_summary", label: "Night Summary", time: "23:00" },
];

export function CurrentPhaseCard() {
  const brainStatus = useDashboardStore((s) => s.brainStatus);

  const handleTriggerPhase = async (phase: string) => {
    await api.triggerPhase(phase);
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center space-x-3 mb-4">
        <Clock className="w-5 h-5 text-blue-400" />
        <h2 className="text-lg font-semibold text-white">Daily Phases</h2>
      </div>

      <div className="space-y-3">
        {phases.map((phase) => {
          const isCurrent = brainStatus?.currentPhase === phase.id;

          return (
            <div
              key={phase.id}
              className={
                "flex items-center justify-between p-3 rounded-lg " +
                (isCurrent ? "bg-blue-900/50 border border-blue-500" : "bg-gray-700/50")
              }
            >
              <div className="flex items-center space-x-3">
                <div
                  className={
                    "w-2 h-2 rounded-full " +
                    (isCurrent ? "bg-blue-400 animate-pulse" : "bg-gray-500")
                  }
                />
                <div>
                  <p className="text-sm font-medium text-white">{phase.label}</p>
                  <p className="text-xs text-gray-400">{phase.time}</p>
                </div>
              </div>

              <button
                onClick={() => handleTriggerPhase(phase.id)}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded-lg"
                title={"Trigger " + phase.label}
              >
                <Play className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      {brainStatus?.todayFocus && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <p className="text-xs text-gray-500 mb-1">Today's Focus</p>
          <p className="text-sm text-white">{brainStatus.todayFocus}</p>
        </div>
      )}
    </div>
  );
}
