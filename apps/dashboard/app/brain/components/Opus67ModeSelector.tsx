"use client";

import { useState } from "react";
import { Scan, Wrench, Eye, Building2, Bug, Sparkles, Check } from "lucide-react";
import { type ModeName } from "@/lib/api/opus67";

interface Opus67ModeSelectorProps {
  currentMode: ModeName;
  onModeChange: (mode: ModeName) => Promise<ModeName | null>;
  disabled?: boolean;
}

const MODES: { id: ModeName; label: string; icon: React.ReactNode; description: string; color: string }[] = [
  { id: "auto", label: "Auto", icon: <Sparkles className="w-4 h-4" />, description: "Automatic mode detection", color: "purple" },
  { id: "scan", label: "Scan", icon: <Scan className="w-4 h-4" />, description: "Fast scanning & analysis", color: "blue" },
  { id: "build", label: "Build", icon: <Wrench className="w-4 h-4" />, description: "Code generation", color: "green" },
  { id: "review", label: "Review", icon: <Eye className="w-4 h-4" />, description: "Code review & quality", color: "yellow" },
  { id: "architect", label: "Architect", icon: <Building2 className="w-4 h-4" />, description: "System design", color: "orange" },
  { id: "debug", label: "Debug", icon: <Bug className="w-4 h-4" />, description: "Bug hunting & fixing", color: "red" },
];

export function Opus67ModeSelector({ currentMode, onModeChange, disabled }: Opus67ModeSelectorProps) {
  const [loading, setLoading] = useState<ModeName | null>(null);

  const handleModeChange = async (mode: ModeName) => {
    if (mode === currentMode || disabled) return;

    setLoading(mode);
    try {
      await onModeChange(mode);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="bg-gicm-card border border-gicm-border rounded-xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-gicm-primary/10">
          <Sparkles className="w-5 h-5 text-gicm-primary" />
        </div>
        <div>
          <h3 className="font-semibold">Mode Selection</h3>
          <p className="text-sm text-gray-400">Choose operating mode</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {MODES.map((mode) => {
          const isActive = currentMode === mode.id;
          const isLoading = loading === mode.id;
          const colorClass = {
            purple: "bg-purple-500/10 border-purple-500/30 text-purple-400",
            blue: "bg-blue-500/10 border-blue-500/30 text-blue-400",
            green: "bg-green-500/10 border-green-500/30 text-green-400",
            yellow: "bg-yellow-500/10 border-yellow-500/30 text-yellow-400",
            orange: "bg-orange-500/10 border-orange-500/30 text-orange-400",
            red: "bg-red-500/10 border-red-500/30 text-red-400",
          }[mode.color];

          return (
            <button
              key={mode.id}
              onClick={() => handleModeChange(mode.id)}
              disabled={disabled || isLoading}
              className={`p-4 rounded-lg border transition-all text-left ${
                isActive
                  ? `${colorClass} ring-2 ring-offset-2 ring-offset-gicm-bg ring-current`
                  : "bg-white/5 border-gicm-border hover:border-gray-500 hover:bg-white/10"
              } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={isActive ? "" : "text-gray-400"}>{mode.icon}</div>
                {isActive && <Check className="w-4 h-4" />}
                {isLoading && (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                )}
              </div>
              <div className={`font-medium ${isActive ? "" : "text-white"}`}>{mode.label}</div>
              <div className="text-xs text-gray-500 mt-1">{mode.description}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
