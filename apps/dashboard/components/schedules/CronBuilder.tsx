"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Clock,
  Calendar,
  Info,
  ChevronDown,
  Check,
} from "lucide-react";

// Cron presets with labels
const PRESETS = [
  { label: "Every minute", value: "* * * * *", description: "Runs every minute" },
  { label: "Every 5 minutes", value: "*/5 * * * *", description: "Runs every 5 minutes" },
  { label: "Every 15 minutes", value: "*/15 * * * *", description: "Runs every 15 minutes" },
  { label: "Every 30 minutes", value: "*/30 * * * *", description: "Runs every 30 minutes" },
  { label: "Hourly", value: "0 * * * *", description: "Runs at minute 0 every hour" },
  { label: "Every 2 hours", value: "0 */2 * * *", description: "Runs every 2 hours" },
  { label: "Every 4 hours", value: "0 */4 * * *", description: "Runs every 4 hours" },
  { label: "Every 6 hours", value: "0 */6 * * *", description: "Runs every 6 hours" },
  { label: "Daily at midnight", value: "0 0 * * *", description: "Runs at 00:00 every day" },
  { label: "Daily at 9 AM", value: "0 9 * * *", description: "Runs at 09:00 every day" },
  { label: "Daily at 6 PM", value: "0 18 * * *", description: "Runs at 18:00 every day" },
  { label: "Weekdays at 9 AM", value: "0 9 * * 1-5", description: "Runs Mon-Fri at 09:00" },
  { label: "Weekly (Sunday)", value: "0 0 * * 0", description: "Runs every Sunday at midnight" },
  { label: "Monthly (1st)", value: "0 0 1 * *", description: "Runs 1st of each month at midnight" },
] as const;

// Common timezones
const TIMEZONES = [
  { label: "UTC", value: "UTC" },
  { label: "US Eastern", value: "America/New_York" },
  { label: "US Pacific", value: "America/Los_Angeles" },
  { label: "US Central", value: "America/Chicago" },
  { label: "UK", value: "Europe/London" },
  { label: "Central Europe", value: "Europe/Berlin" },
  { label: "Japan", value: "Asia/Tokyo" },
  { label: "Singapore", value: "Asia/Singapore" },
  { label: "Australia", value: "Australia/Sydney" },
];

interface CronBuilderProps {
  value: string;
  onChange: (value: string) => void;
  timezone?: string;
  onTimezoneChange?: (tz: string) => void;
}

/**
 * Parse cron to human readable
 */
function cronToHuman(cron: string): string {
  const parts = cron.split(" ");
  if (parts.length !== 5) return cron;

  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

  // Every minute
  if (minute === "*" && hour === "*" && dayOfMonth === "*" && month === "*" && dayOfWeek === "*") {
    return "Every minute";
  }

  // Every N minutes
  if (minute.startsWith("*/") && hour === "*" && dayOfMonth === "*" && month === "*" && dayOfWeek === "*") {
    return `Every ${minute.slice(2)} minutes`;
  }

  // Hourly
  if (!minute.includes("*") && hour === "*" && dayOfMonth === "*" && month === "*" && dayOfWeek === "*") {
    return `Every hour at :${minute.padStart(2, "0")}`;
  }

  // Every N hours
  if (minute !== "*" && hour.startsWith("*/") && dayOfMonth === "*") {
    return `Every ${hour.slice(2)} hours at :${minute.padStart(2, "0")}`;
  }

  // Daily
  if (!minute.includes("*") && !hour.includes("*") && dayOfMonth === "*" && month === "*" && dayOfWeek === "*") {
    return `Daily at ${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;
  }

  // Weekdays
  if (!minute.includes("*") && !hour.includes("*") && dayOfMonth === "*" && month === "*" && dayOfWeek === "1-5") {
    return `Weekdays at ${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;
  }

  // Weekly
  if (!minute.includes("*") && !hour.includes("*") && dayOfMonth === "*" && month === "*" && !dayOfWeek.includes("*")) {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayName = days[parseInt(dayOfWeek)] || dayOfWeek;
    return `Weekly on ${dayName} at ${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;
  }

  // Monthly
  if (!minute.includes("*") && !hour.includes("*") && !dayOfMonth.includes("*") && month === "*" && dayOfWeek === "*") {
    const suffix = ["th", "st", "nd", "rd"][parseInt(dayOfMonth) % 10] || "th";
    return `Monthly on the ${dayOfMonth}${suffix} at ${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;
  }

  return cron;
}

/**
 * Calculate next run time from cron expression
 */
function getNextRun(cron: string, timezone: string): Date | null {
  try {
    const parts = cron.split(" ");
    if (parts.length !== 5) return null;

    const [minute, hour] = parts;
    const now = new Date();
    const next = new Date(now);
    next.setSeconds(0);
    next.setMilliseconds(0);

    // Simple logic for common patterns
    if (minute === "*") {
      next.setMinutes(next.getMinutes() + 1);
      return next;
    }

    if (minute.startsWith("*/")) {
      const interval = parseInt(minute.slice(2));
      const currentMinute = next.getMinutes();
      const nextMinute = Math.ceil((currentMinute + 1) / interval) * interval;
      if (nextMinute >= 60) {
        next.setHours(next.getHours() + 1);
        next.setMinutes(0);
      } else {
        next.setMinutes(nextMinute);
      }
      return next;
    }

    if (!minute.includes("*") && !hour.includes("*")) {
      next.setMinutes(parseInt(minute));
      next.setHours(parseInt(hour));
      if (next <= now) {
        next.setDate(next.getDate() + 1);
      }
      return next;
    }

    if (!minute.includes("*") && hour === "*") {
      next.setMinutes(parseInt(minute));
      if (next.getMinutes() <= now.getMinutes()) {
        next.setHours(next.getHours() + 1);
      }
      return next;
    }

    return null;
  } catch {
    return null;
  }
}

export function CronBuilder({
  value,
  onChange,
  timezone = "UTC",
  onTimezoneChange,
}: CronBuilderProps) {
  const [mode, setMode] = useState<"preset" | "custom">("preset");
  const [customParts, setCustomParts] = useState({
    minute: "*",
    hour: "*",
    dayOfMonth: "*",
    month: "*",
    dayOfWeek: "*",
  });
  const [showPresets, setShowPresets] = useState(false);
  const [showTimezones, setShowTimezones] = useState(false);

  // Parse value into parts on mount
  useEffect(() => {
    const parts = value.split(" ");
    if (parts.length === 5) {
      setCustomParts({
        minute: parts[0],
        hour: parts[1],
        dayOfMonth: parts[2],
        month: parts[3],
        dayOfWeek: parts[4],
      });
    }
  }, []);

  // Human readable description
  const humanReadable = useMemo(() => cronToHuman(value), [value]);

  // Next run time
  const nextRun = useMemo(() => getNextRun(value, timezone), [value, timezone]);

  // Check if current value matches a preset
  const currentPreset = PRESETS.find((p) => p.value === value);

  // Update cron from custom parts
  const updateFromParts = (newParts: typeof customParts) => {
    setCustomParts(newParts);
    const cronString = `${newParts.minute} ${newParts.hour} ${newParts.dayOfMonth} ${newParts.month} ${newParts.dayOfWeek}`;
    onChange(cronString);
  };

  return (
    <div className="space-y-4">
      {/* Mode Toggle */}
      <div className="flex items-center gap-2 p-1 bg-black/30 border border-gicm-border rounded-lg w-fit">
        <button
          onClick={() => setMode("preset")}
          className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
            mode === "preset"
              ? "bg-gicm-primary text-black font-medium"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Presets
        </button>
        <button
          onClick={() => setMode("custom")}
          className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
            mode === "custom"
              ? "bg-gicm-primary text-black font-medium"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Custom
        </button>
      </div>

      {mode === "preset" ? (
        /* Preset Selector */
        <div className="relative">
          <button
            onClick={() => setShowPresets(!showPresets)}
            className="w-full flex items-center justify-between px-4 py-3 bg-black/30 border border-gicm-border rounded-lg text-left hover:border-gicm-primary/50 transition-colors"
          >
            <div>
              <p className="text-white font-medium">
                {currentPreset?.label || "Select a schedule"}
              </p>
              {currentPreset && (
                <p className="text-sm text-gray-400">{currentPreset.description}</p>
              )}
            </div>
            <ChevronDown
              className={`w-5 h-5 text-gray-400 transition-transform ${
                showPresets ? "rotate-180" : ""
              }`}
            />
          </button>

          {showPresets && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-gicm-card border border-gicm-border rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto">
              {PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => {
                    onChange(preset.value);
                    setShowPresets(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/5 transition-colors ${
                    value === preset.value ? "bg-gicm-primary/10" : ""
                  }`}
                >
                  <div>
                    <p className="text-white">{preset.label}</p>
                    <p className="text-xs text-gray-500">{preset.value}</p>
                  </div>
                  {value === preset.value && (
                    <Check className="w-4 h-4 text-gicm-primary" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Custom Builder */
        <div className="space-y-4">
          <div className="grid grid-cols-5 gap-3">
            {/* Minute */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">Minute</label>
              <input
                type="text"
                value={customParts.minute}
                onChange={(e) =>
                  updateFromParts({ ...customParts, minute: e.target.value })
                }
                placeholder="*"
                className="w-full px-3 py-2 bg-black/30 border border-gicm-border rounded-lg text-white text-center focus:border-gicm-primary focus:outline-none"
              />
              <p className="text-xs text-gray-500 mt-1 text-center">0-59</p>
            </div>

            {/* Hour */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">Hour</label>
              <input
                type="text"
                value={customParts.hour}
                onChange={(e) =>
                  updateFromParts({ ...customParts, hour: e.target.value })
                }
                placeholder="*"
                className="w-full px-3 py-2 bg-black/30 border border-gicm-border rounded-lg text-white text-center focus:border-gicm-primary focus:outline-none"
              />
              <p className="text-xs text-gray-500 mt-1 text-center">0-23</p>
            </div>

            {/* Day of Month */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">Day</label>
              <input
                type="text"
                value={customParts.dayOfMonth}
                onChange={(e) =>
                  updateFromParts({ ...customParts, dayOfMonth: e.target.value })
                }
                placeholder="*"
                className="w-full px-3 py-2 bg-black/30 border border-gicm-border rounded-lg text-white text-center focus:border-gicm-primary focus:outline-none"
              />
              <p className="text-xs text-gray-500 mt-1 text-center">1-31</p>
            </div>

            {/* Month */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">Month</label>
              <input
                type="text"
                value={customParts.month}
                onChange={(e) =>
                  updateFromParts({ ...customParts, month: e.target.value })
                }
                placeholder="*"
                className="w-full px-3 py-2 bg-black/30 border border-gicm-border rounded-lg text-white text-center focus:border-gicm-primary focus:outline-none"
              />
              <p className="text-xs text-gray-500 mt-1 text-center">1-12</p>
            </div>

            {/* Day of Week */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">Weekday</label>
              <input
                type="text"
                value={customParts.dayOfWeek}
                onChange={(e) =>
                  updateFromParts({ ...customParts, dayOfWeek: e.target.value })
                }
                placeholder="*"
                className="w-full px-3 py-2 bg-black/30 border border-gicm-border rounded-lg text-white text-center focus:border-gicm-primary focus:outline-none"
              />
              <p className="text-xs text-gray-500 mt-1 text-center">0-6</p>
            </div>
          </div>

          {/* Cron syntax help */}
          <div className="p-3 bg-black/20 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-gray-400 space-y-1">
                <p>
                  <code className="text-gicm-primary">*</code> = any value,{" "}
                  <code className="text-gicm-primary">*/n</code> = every n,{" "}
                  <code className="text-gicm-primary">n-m</code> = range,{" "}
                  <code className="text-gicm-primary">n,m</code> = list
                </p>
                <p>
                  Example: <code className="text-white">0 9 * * 1-5</code> = Every
                  weekday at 9:00 AM
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Timezone Selector */}
      {onTimezoneChange && (
        <div className="relative">
          <label className="block text-sm text-gray-400 mb-2">Timezone</label>
          <button
            onClick={() => setShowTimezones(!showTimezones)}
            className="w-full flex items-center justify-between px-4 py-2.5 bg-black/30 border border-gicm-border rounded-lg text-left hover:border-gicm-primary/50 transition-colors"
          >
            <span className="text-white">
              {TIMEZONES.find((tz) => tz.value === timezone)?.label || timezone}
            </span>
            <ChevronDown
              className={`w-4 h-4 text-gray-400 transition-transform ${
                showTimezones ? "rotate-180" : ""
              }`}
            />
          </button>

          {showTimezones && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-gicm-card border border-gicm-border rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
              {TIMEZONES.map((tz) => (
                <button
                  key={tz.value}
                  onClick={() => {
                    onTimezoneChange(tz.value);
                    setShowTimezones(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-white/5 transition-colors ${
                    timezone === tz.value ? "bg-gicm-primary/10" : ""
                  }`}
                >
                  <span className="text-white">{tz.label}</span>
                  <span className="text-xs text-gray-500">{tz.value}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Current Cron & Next Run Preview */}
      <div className="p-4 bg-gicm-card border border-gicm-border rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gicm-primary" />
            <span className="text-sm text-gray-400">Schedule Summary</span>
          </div>
          <code className="px-2 py-1 bg-black/30 rounded text-xs text-gicm-primary font-mono">
            {value}
          </code>
        </div>

        <p className="text-white font-medium mb-2">{humanReadable}</p>

        {nextRun && (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Calendar className="w-4 h-4" />
            <span>
              Next run:{" "}
              <span className="text-white">
                {nextRun.toLocaleString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default CronBuilder;
