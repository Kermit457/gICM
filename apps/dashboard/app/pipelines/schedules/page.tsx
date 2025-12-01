"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Play,
  Pause,
  Trash2,
  Plus,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronRight,
  Settings,
  Zap,
  Timer,
  MoreVertical,
} from "lucide-react";
import { CronBuilder } from "@/components/schedules/CronBuilder";

const HUB_URL = process.env.NEXT_PUBLIC_HUB_URL || "http://localhost:3001";

// Types
interface Schedule {
  id: string;
  pipelineId: string;
  pipelineName: string;
  name: string;
  description?: string;
  cronExpression: string;
  timezone: string;
  enabled: boolean;
  status: "active" | "paused" | "disabled" | "error";
  nextRun: string | null;
  lastRun: string | null;
  lastStatus: "completed" | "failed" | "cancelled" | null;
  runCount: number;
  consecutiveFailures: number;
  createdAt: string;
}

interface ScheduleStats {
  totalSchedules: number;
  activeSchedules: number;
  pausedSchedules: number;
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  successRate: number;
}

interface ScheduledRun {
  scheduleId: string;
  scheduleName: string;
  pipelineName: string;
  scheduledTime: string;
  cronExpression: string;
}

// Mock data for development
const mockSchedules: Schedule[] = [
  {
    id: "1",
    pipelineId: "research-and-analyze",
    pipelineName: "Research & Analyze",
    name: "Daily Crypto Research",
    description: "Analyze top trending tokens every morning",
    cronExpression: "0 9 * * *",
    timezone: "America/New_York",
    enabled: true,
    status: "active",
    nextRun: new Date(Date.now() + 3600000 * 5).toISOString(),
    lastRun: new Date(Date.now() - 86400000).toISOString(),
    lastStatus: "completed",
    runCount: 45,
    consecutiveFailures: 0,
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
  },
  {
    id: "2",
    pipelineId: "content-generation",
    pipelineName: "Content Generation",
    name: "Weekly Blog Posts",
    description: "Generate SEO-optimized blog content",
    cronExpression: "0 10 * * 1",
    timezone: "UTC",
    enabled: true,
    status: "active",
    nextRun: new Date(Date.now() + 86400000 * 3).toISOString(),
    lastRun: new Date(Date.now() - 86400000 * 4).toISOString(),
    lastStatus: "completed",
    runCount: 12,
    consecutiveFailures: 0,
    createdAt: new Date(Date.now() - 86400000 * 60).toISOString(),
  },
  {
    id: "3",
    pipelineId: "security-audit",
    pipelineName: "Security Audit",
    name: "Nightly Security Scan",
    description: "Automated security analysis",
    cronExpression: "0 2 * * *",
    timezone: "UTC",
    enabled: false,
    status: "paused",
    nextRun: null,
    lastRun: new Date(Date.now() - 86400000 * 2).toISOString(),
    lastStatus: "failed",
    runCount: 8,
    consecutiveFailures: 3,
    createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
  },
];

const mockStats: ScheduleStats = {
  totalSchedules: 3,
  activeSchedules: 2,
  pausedSchedules: 1,
  totalRuns: 65,
  successfulRuns: 58,
  failedRuns: 7,
  successRate: 89.2,
};

// Cron to human readable
function cronToHuman(cron: string): string {
  const parts = cron.split(" ");
  if (parts.length !== 5) return cron;
  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

  if (minute === "*" && hour === "*") return "Every minute";
  if (minute.startsWith("*/")) return `Every ${minute.slice(2)} minutes`;
  if (minute !== "*" && hour === "*") return `Every hour at :${minute.padStart(2, "0")}`;
  if (minute !== "*" && hour !== "*" && dayOfMonth === "*" && dayOfWeek === "*")
    return `Daily at ${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;
  if (dayOfWeek !== "*" && dayOfMonth === "*") {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return `Weekly (${days[parseInt(dayOfWeek)] || dayOfWeek}) at ${hour}:${minute}`;
  }
  if (dayOfMonth !== "*") return `Monthly on ${dayOfMonth} at ${hour}:${minute}`;

  return cron;
}

// Status Badge
function StatusBadge({ status, lastStatus }: { status: Schedule["status"]; lastStatus: Schedule["lastStatus"] }) {
  if (status === "active") {
    return (
      <span className="flex items-center gap-1.5 px-2 py-1 bg-green-500/10 text-green-400 text-xs rounded-full">
        <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
        Active
      </span>
    );
  }
  if (status === "paused") {
    return (
      <span className="flex items-center gap-1.5 px-2 py-1 bg-yellow-500/10 text-yellow-400 text-xs rounded-full">
        <Pause className="w-3 h-3" />
        Paused
      </span>
    );
  }
  if (status === "error") {
    return (
      <span className="flex items-center gap-1.5 px-2 py-1 bg-red-500/10 text-red-400 text-xs rounded-full">
        <AlertTriangle className="w-3 h-3" />
        Error
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 px-2 py-1 bg-gray-500/10 text-gray-400 text-xs rounded-full">
      Disabled
    </span>
  );
}

// Schedule Card
function ScheduleCard({
  schedule,
  onToggle,
  onDelete,
  onTrigger,
}: {
  schedule: Schedule;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onTrigger: (id: string) => void;
}) {
  const [showActions, setShowActions] = useState(false);

  return (
    <div className="bg-gicm-card border border-gicm-border rounded-xl p-5 hover:border-gicm-primary/30 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h3 className="text-lg font-semibold text-white">{schedule.name}</h3>
            <StatusBadge status={schedule.status} lastStatus={schedule.lastStatus} />
          </div>
          <p className="text-sm text-gray-400">{schedule.pipelineName}</p>
          {schedule.description && (
            <p className="text-xs text-gray-500 mt-1">{schedule.description}</p>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => setShowActions(!showActions)}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            <MoreVertical className="w-4 h-4 text-gray-400" />
          </button>

          {showActions && (
            <div className="absolute right-0 top-full mt-1 w-40 bg-gicm-card border border-gicm-border rounded-lg shadow-xl z-10">
              <button
                onClick={() => {
                  onTrigger(schedule.id);
                  setShowActions(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-white/5"
              >
                <Play className="w-4 h-4" />
                Run Now
              </button>
              <button
                onClick={() => {
                  onToggle(schedule.id);
                  setShowActions(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-white/5"
              >
                {schedule.enabled ? (
                  <>
                    <Pause className="w-4 h-4" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Resume
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  onDelete(schedule.id);
                  setShowActions(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Schedule Info */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-400" />
          <div>
            <p className="text-xs text-gray-500">Schedule</p>
            <p className="text-sm text-white">{cronToHuman(schedule.cronExpression)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <div>
            <p className="text-xs text-gray-500">Next Run</p>
            <p className="text-sm text-white">
              {schedule.nextRun
                ? new Date(schedule.nextRun).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "—"}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="flex items-center justify-between pt-4 border-t border-gicm-border">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-gicm-primary" />
            <span className="text-xs text-gray-400">{schedule.runCount} runs</span>
          </div>
          {schedule.lastStatus && (
            <div className="flex items-center gap-1.5">
              {schedule.lastStatus === "completed" ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
              ) : (
                <XCircle className="w-3.5 h-3.5 text-red-400" />
              )}
              <span className="text-xs text-gray-400">
                Last: {schedule.lastStatus}
              </span>
            </div>
          )}
        </div>
        <code className="text-xs text-gray-500 font-mono">{schedule.cronExpression}</code>
      </div>
    </div>
  );
}

// Create Schedule Modal
function CreateScheduleModal({
  isOpen,
  onClose,
  onCreate,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (schedule: Partial<Schedule>) => void;
}) {
  const [name, setName] = useState("");
  const [pipelineId, setPipelineId] = useState("");
  const [cronExpression, setCronExpression] = useState("0 9 * * *");
  const [timezone, setTimezone] = useState("UTC");
  const [description, setDescription] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gicm-card border border-gicm-border rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b border-gicm-border">
          <h2 className="text-xl font-bold text-white">Create Schedule</h2>
          <p className="text-sm text-gray-400">Automate your pipeline execution</p>
        </div>

        <div className="p-5 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Schedule Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Daily Morning Analysis"
              className="w-full px-4 py-2.5 bg-black/30 border border-gicm-border rounded-lg text-white placeholder-gray-500 focus:border-gicm-primary focus:outline-none"
            />
          </div>

          {/* Pipeline */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Pipeline</label>
            <select
              value={pipelineId}
              onChange={(e) => setPipelineId(e.target.value)}
              className="w-full px-4 py-2.5 bg-black/30 border border-gicm-border rounded-lg text-white focus:border-gicm-primary focus:outline-none"
            >
              <option value="">Select a pipeline...</option>
              <option value="research-and-analyze">Research & Analyze</option>
              <option value="content-generation">Content Generation</option>
              <option value="security-audit">Security Audit</option>
              <option value="token-swap">Token Swap</option>
            </select>
          </div>

          {/* Cron Builder */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Schedule</label>
            <CronBuilder
              value={cronExpression}
              onChange={setCronExpression}
              timezone={timezone}
              onTimezoneChange={setTimezone}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this schedule do?"
              rows={2}
              className="w-full px-4 py-2.5 bg-black/30 border border-gicm-border rounded-lg text-white placeholder-gray-500 focus:border-gicm-primary focus:outline-none resize-none"
            />
          </div>
        </div>

        <div className="p-5 border-t border-gicm-border flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onCreate({
                name,
                pipelineId,
                pipelineName: pipelineId
                  .split("-")
                  .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                  .join(" "),
                cronExpression,
                timezone,
                description,
              });
              onClose();
            }}
            disabled={!name || !pipelineId}
            className="px-4 py-2 bg-gicm-primary text-black font-medium rounded-lg hover:bg-gicm-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Create Schedule
          </button>
        </div>
      </div>
    </div>
  );
}

// Main Page
export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [stats, setStats] = useState<ScheduleStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  // Fetch schedules
  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${HUB_URL}/api/schedules`);
      if (res.ok) {
        const data = await res.json();
        if (data.ok) {
          setSchedules(data.schedules);
          setStats(data.stats);
          setLoading(false);
          return;
        }
      }
    } catch (error) {
      console.error("Failed to fetch schedules:", error);
    }
    // Use mock data if API fails
    setSchedules(mockSchedules);
    setStats(mockStats);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  // Toggle schedule
  const handleToggle = async (id: string) => {
    setSchedules((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              enabled: !s.enabled,
              status: !s.enabled ? "active" : "paused",
              nextRun: !s.enabled ? new Date(Date.now() + 3600000).toISOString() : null,
            }
          : s
      )
    );
  };

  // Delete schedule
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this schedule?")) return;
    setSchedules((prev) => prev.filter((s) => s.id !== id));
  };

  // Trigger schedule
  const handleTrigger = async (id: string) => {
    alert(`Triggering schedule ${id}...`);
  };

  // Create schedule
  const handleCreate = (newSchedule: Partial<Schedule>) => {
    const schedule: Schedule = {
      id: `${Date.now()}`,
      pipelineId: newSchedule.pipelineId || "",
      pipelineName: newSchedule.pipelineName || "",
      name: newSchedule.name || "",
      description: newSchedule.description,
      cronExpression: newSchedule.cronExpression || "0 9 * * *",
      timezone: newSchedule.timezone || "UTC",
      enabled: true,
      status: "active",
      nextRun: new Date(Date.now() + 3600000).toISOString(),
      lastRun: null,
      lastStatus: null,
      runCount: 0,
      consecutiveFailures: 0,
      createdAt: new Date().toISOString(),
    };
    setSchedules((prev) => [schedule, ...prev]);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gicm-bg flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-gicm-primary mx-auto mb-3 animate-spin" />
          <p className="text-gray-400">Loading schedules...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gicm-bg text-white">
      {/* Header */}
      <div className="border-b border-gicm-border bg-gicm-card/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/pipelines"
                className="p-2 hover:bg-white/5 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-3">
                  <Timer className="w-7 h-7 text-gicm-primary" />
                  Pipeline Schedules
                </h1>
                <p className="text-gray-400 text-sm">
                  Automate pipeline execution with cron scheduling
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchSchedules}
                className="p-2 hover:bg-white/5 rounded-lg transition-colors"
              >
                <RefreshCw className="w-5 h-5 text-gray-400" />
              </button>
              <button
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gicm-primary text-black font-medium rounded-lg hover:bg-gicm-primary/90 transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Schedule
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <div className="bg-gicm-card border border-gicm-border rounded-xl p-4">
              <p className="text-sm text-gray-400 mb-1">Total Schedules</p>
              <p className="text-2xl font-bold text-white">{stats.totalSchedules}</p>
            </div>
            <div className="bg-gicm-card border border-gicm-border rounded-xl p-4">
              <p className="text-sm text-gray-400 mb-1">Active</p>
              <p className="text-2xl font-bold text-green-400">{stats.activeSchedules}</p>
            </div>
            <div className="bg-gicm-card border border-gicm-border rounded-xl p-4">
              <p className="text-sm text-gray-400 mb-1">Total Runs</p>
              <p className="text-2xl font-bold text-white">{stats.totalRuns}</p>
            </div>
            <div className="bg-gicm-card border border-gicm-border rounded-xl p-4">
              <p className="text-sm text-gray-400 mb-1">Success Rate</p>
              <p className="text-2xl font-bold text-gicm-primary">{stats.successRate}%</p>
            </div>
          </div>
        )}

        {/* Schedules Grid */}
        {schedules.length === 0 ? (
          <div className="text-center py-16">
            <Timer className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Schedules Yet</h3>
            <p className="text-gray-400 mb-6">
              Create your first schedule to automate pipeline execution
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="px-6 py-3 bg-gicm-primary text-black font-medium rounded-lg hover:bg-gicm-primary/90 transition-colors"
            >
              Create Schedule
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {schedules.map((schedule) => (
              <ScheduleCard
                key={schedule.id}
                schedule={schedule}
                onToggle={handleToggle}
                onDelete={handleDelete}
                onTrigger={handleTrigger}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <CreateScheduleModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreate={handleCreate}
      />
    </div>
  );
}
