"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useOpus67 } from "@/hooks/useOpus67";
import { ConnectionIndicator } from "@/components/ConnectionIndicator";
import {
  Brain,
  Wallet,
  TrendingUp,
  Package,
  Search,
  Shield,
  CheckCircle,
  XCircle,
  AlertCircle,
  HelpCircle,
  Clock,
  Target,
  Zap,
  RefreshCw,
  Activity,
  Sparkles,
  Database,
  ExternalLink,
  Lightbulb,
  ChevronRight,
  ChevronDown,
  Cpu,
} from "lucide-react";
import { hubApi, type BrainStatus, type AutonomyStatus, type EngineStatus, type KnowledgeItem, type BrainStats, type Pattern, type Prediction } from "../../lib/api/hub";
import { brainApi } from "../../lib/api/brain";
import { ActivityFeed } from "../../components/brain/ActivityFeed";
import {
  Opus67Status,
  Opus67ModeSelector,
  Opus67QueryPanel,
  Opus67History,
  Opus67Evolution,
} from "./components";

interface PhaseInfo {
  name: string;
  icon: string;
  description: string;
  color: string;
}

const PHASES: PhaseInfo[] = [
  { name: "Morning Scan", icon: "🌅", description: "Scanning opportunities & market data", color: "text-blue-400" },
  { name: "Decision Planning", icon: "🎯", description: "Evaluating options & planning actions", color: "text-purple-400" },
  { name: "Execution", icon: "⚡", description: "Executing approved actions", color: "text-gicm-primary" },
  { name: "Reflection", icon: "📊", description: "Analyzing results & learning", color: "text-orange-400" },
  { name: "Maintenance", icon: "🔧", description: "System maintenance & cleanup", color: "text-gray-400" },
];

function getPhaseIndex(hour: number): number {
  if (hour < 4) return 0;
  if (hour < 6) return 1;
  if (hour < 20) return 2;
  if (hour < 22) return 3;
  return 4;
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case "running":
    case "healthy":
      return <CheckCircle className="w-5 h-5 text-green-400" />;
    case "stopped":
    case "idle":
      return <XCircle className="w-5 h-5 text-yellow-400" />;
    case "error":
      return <AlertCircle className="w-5 h-5 text-red-400" />;
    default:
      return <HelpCircle className="w-5 h-5 text-gray-500" />;
  }
}

function PhaseIndicator({ currentPhase }: { currentPhase: number }) {
  return (
    <div className="bg-gicm-card border border-gicm-border rounded-xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-gicm-primary/10">
          <Clock className="w-5 h-5 text-gicm-primary" />
        </div>
        <div>
          <h3 className="font-semibold">Daily Cycle</h3>
          <p className="text-sm text-gray-400">Autonomous phase progression</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-sm text-gray-400">Active</span>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2">
        {PHASES.map((phase, idx) => (
          <div
            key={phase.name}
            className={`flex-1 text-center p-3 rounded-lg transition-all ${
              idx === currentPhase
                ? "bg-gicm-primary/20 border border-gicm-primary"
                : idx < currentPhase
                ? "bg-green-500/10 border border-green-500/30"
                : "bg-white/5 border border-transparent"
            }`}
          >
            <div className="text-2xl mb-1">{phase.icon}</div>
            <div className={`text-xs font-medium ${idx === currentPhase ? phase.color : "text-gray-400"}`}>
              {phase.name}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 text-center">
        <p className={`text-sm ${PHASES[currentPhase].color}`}>
          {PHASES[currentPhase].description}
        </p>
      </div>
    </div>
  );
}

function AutonomyCard({ autonomy }: { autonomy: AutonomyStatus | null }) {
  const level = autonomy?.level ?? 2;
  const stats = autonomy?.stats ?? { autoExecuted: 0, queued: 0, pending: 0 };

  return (
    <Link href="/autonomy" className="block group">
      <div className="bg-gicm-card border border-gicm-border rounded-xl p-6 h-full transition-all hover:border-gicm-primary/30 hover:shadow-lg hover:shadow-gicm-primary/5">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-gicm-primary/10">
            <Shield className="w-5 h-5 text-gicm-primary" />
          </div>
          <div>
            <h3 className="font-semibold group-hover:text-gicm-primary transition-colors">Autonomy System</h3>
            <p className="text-sm text-gray-400">Decision routing & approval</p>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-500 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/30 text-center">
            <div className="text-3xl font-bold text-purple-400">L{level}</div>
            <div className="text-xs text-gray-400 mt-1">Autonomy Level</div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm p-2 rounded bg-green-500/10 border border-green-500/30">
              <span className="text-gray-400">Auto-executed</span>
              <span className="text-green-400 font-medium">{stats.autoExecuted}</span>
            </div>
            <div className="flex justify-between text-sm p-2 rounded bg-yellow-500/10 border border-yellow-500/30">
              <span className="text-gray-400">Queued</span>
              <span className="text-yellow-400 font-medium">{stats.queued}</span>
            </div>
            <div className="flex justify-between text-sm p-2 rounded bg-orange-500/10 border border-orange-500/30">
              <span className="text-gray-400">Pending</span>
              <span className="text-orange-400 font-medium">{stats.pending}</span>
            </div>
          </div>
        </div>
        {stats.pending > 0 && (
          <div className="mt-4 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
            <div className="flex items-center gap-2 text-orange-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              {stats.pending} action{stats.pending > 1 ? "s" : ""} awaiting approval
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}

interface EngineInfo {
  id: string;
  name: string;
  icon: React.ReactNode;
  status: string;
  description: string;
  color: string;
  href: string;
}

function EngineHealthGrid({ engines }: { engines: Record<string, EngineStatus> | null }) {
  const engineList: EngineInfo[] = [
    { id: "money", name: "Money Engine", icon: <Wallet className="w-6 h-6" />, status: engines?.money?.status ?? "unknown", description: "Treasury & trading", color: "green", href: "/treasury" },
    { id: "growth", name: "Growth Engine", icon: <TrendingUp className="w-6 h-6" />, status: engines?.growth?.status ?? "unknown", description: "Content & social", color: "blue", href: "/growth" },
    { id: "product", name: "Product Engine", icon: <Package className="w-6 h-6" />, status: engines?.product?.status ?? "unknown", description: "Discovery & building", color: "purple", href: "/product" },
    { id: "hunter", name: "Hunter Agent", icon: <Search className="w-6 h-6" />, status: engines?.hunter?.status ?? "unknown", description: "Opportunity scanning", color: "orange", href: "/hunter" },
    { id: "autonomy", name: "Autonomy", icon: <Shield className="w-6 h-6" />, status: engines?.autonomy?.status ?? "unknown", description: "Decision routing", color: "red", href: "/autonomy" },
  ];

  return (
    <div className="bg-gicm-card border border-gicm-border rounded-xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-gicm-primary/10">
          <Zap className="w-5 h-5 text-gicm-primary" />
        </div>
        <div>
          <h3 className="font-semibold">Engine Health</h3>
          <p className="text-sm text-gray-400">System component status</p>
        </div>
      </div>
      <div className="grid grid-cols-5 gap-4">
        {engineList.map((engine) => {
          const isRunning = engine.status === "running" || engine.status === "healthy";
          return (
            <Link
              key={engine.id}
              href={engine.href}
              className={`text-center p-4 rounded-lg transition-all border group cursor-pointer hover:scale-105 ${
                isRunning
                  ? `bg-${engine.color}-500/10 border-${engine.color}-500/30 hover:border-${engine.color}-400`
                  : "bg-white/5 border-transparent opacity-50 hover:opacity-100"
              }`}
            >
              <div className={`flex justify-center mb-2 ${isRunning ? `text-${engine.color}-400` : "text-gray-500"}`}>
                {engine.icon}
              </div>
              <div className="font-medium text-sm mb-1 group-hover:text-white">{engine.name}</div>
              <div className="flex justify-center mb-2">
                <StatusIcon status={engine.status} />
              </div>
              <div className="text-xs text-gray-500 group-hover:text-gray-400">{engine.description}</div>
              <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronRight className="w-4 h-4 mx-auto text-gray-400" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function GoalProgress({ brain }: { brain: BrainStatus | null }) {
  const goals = brain?.goals ?? { daily: [], weekly: [], monthly: [] };

  const calculateProgress = (goalList: Array<{ completed: boolean }>) => {
    if (!goalList.length) return 0;
    return Math.round((goalList.filter(g => g.completed).length / goalList.length) * 100);
  };

  const dailyProgress = calculateProgress(goals.daily);
  const weeklyProgress = calculateProgress(goals.weekly);
  const monthlyProgress = calculateProgress(goals.monthly);

  return (
    <div className="bg-gicm-card border border-gicm-border rounded-xl p-6 h-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-gicm-primary/10">
          <Target className="w-5 h-5 text-gicm-primary" />
        </div>
        <div>
          <h3 className="font-semibold">Goal Progress</h3>
          <p className="text-sm text-gray-400">Daily, weekly & monthly targets</p>
        </div>
      </div>
      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-gicm-primary" /> Daily Goals
            </span>
            <span className="text-gicm-primary font-medium">{dailyProgress}%</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gicm-primary transition-all duration-500"
              style={{ width: `${dailyProgress}%` }}
            />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-400" /> Weekly Goals
            </span>
            <span className="text-blue-400 font-medium">{weeklyProgress}%</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-400 transition-all duration-500"
              style={{ width: `${weeklyProgress}%` }}
            />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-400" /> Monthly Goals
            </span>
            <span className="text-purple-400 font-medium">{monthlyProgress}%</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-400 transition-all duration-500"
              style={{ width: `${monthlyProgress}%` }}
            />
          </div>
        </div>
      </div>
      {goals.daily.length === 0 && goals.weekly.length === 0 && goals.monthly.length === 0 && (
        <p className="text-gray-500 text-sm text-center mt-4">
          No goals configured. Start the Brain to set goals.
        </p>
      )}
    </div>
  );
}

// ============================================================================
// HYPER BRAIN COMPONENTS
// ============================================================================

const SOURCE_ICONS: Record<string, string> = {
  github: "🐙",
  hackernews: "📰",
  twitter: "🐦",
  arxiv: "📚",
  producthunt: "🚀",
  pumpfun: "🎰",
  helius: "🔗",
  onchain: "⛓️",
};

function HyperBrainStats({ stats }: { stats: BrainStats | null }) {
  if (!stats) return null;

  return (
    <div className="bg-gicm-card border border-gicm-border rounded-xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-purple-500/10">
          <Database className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <h3 className="font-semibold">HYPER BRAIN Knowledge</h3>
          <p className="text-sm text-gray-400">Ingested intelligence</p>
        </div>
        <div className="ml-auto flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
            <span className="text-sm text-gray-400">Active</span>
          </div>
          <Link href="/events" className="text-sm text-gicm-primary hover:text-gicm-primary/80 flex items-center gap-1">
            View Events <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/30 text-center">
          <div className="text-3xl font-bold text-purple-400">{stats.knowledge.total}</div>
          <div className="text-xs text-gray-400 mt-1">Knowledge Items</div>
        </div>
        <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30 text-center">
          <div className="text-3xl font-bold text-blue-400">{stats.knowledge.recent24h}</div>
          <div className="text-xs text-gray-400 mt-1">Last 24h</div>
        </div>
        <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/30 text-center">
          <div className="text-3xl font-bold text-orange-400">{stats.patterns.total}</div>
          <div className="text-xs text-gray-400 mt-1">Patterns</div>
        </div>
        <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30 text-center">
          <div className="text-3xl font-bold text-green-400">{stats.predictions.pending}</div>
          <div className="text-xs text-gray-400 mt-1">Predictions</div>
        </div>
      </div>

      {/* Source breakdown */}
      <div className="mt-4 pt-4 border-t border-gicm-border">
        <div className="text-xs text-gray-400 mb-2">Knowledge by Source</div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(stats.knowledge.bySource).map(([source, count]) => (
            <div key={source} className="flex items-center gap-1 px-2 py-1 rounded bg-white/5 text-xs">
              <span>{SOURCE_ICONS[source] ?? "📌"}</span>
              <span className="text-gray-400">{source}:</span>
              <span className="text-white font-medium">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function KnowledgeFeed({ items }: { items: KnowledgeItem[] }) {
  if (items.length === 0) {
    return (
      <div className="bg-gicm-card border border-gicm-border rounded-xl p-6 h-full">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-gicm-primary/10">
            <Sparkles className="w-5 h-5 text-gicm-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Knowledge Feed</h3>
            <p className="text-sm text-gray-400">Recent intelligence</p>
          </div>
        </div>
        <div className="text-center py-8">
          <Brain className="w-12 h-12 text-gray-500 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-400">No knowledge ingested yet</p>
          <p className="text-sm text-gray-500 mt-2">HYPER BRAIN is learning...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gicm-card border border-gicm-border rounded-xl p-6 h-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-gicm-primary/10">
          <Sparkles className="w-5 h-5 text-gicm-primary" />
        </div>
        <div>
          <h3 className="font-semibold">Knowledge Feed</h3>
          <p className="text-sm text-gray-400">Recent intelligence ({items.length} items)</p>
        </div>
        <Link href="/brainstorm" className="ml-auto text-sm text-gicm-primary hover:text-gicm-primary/80 flex items-center gap-1">
          Brainstorm <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
        {items.map((item) => {
          const hasUrl = item.source.url && item.source.url.startsWith("http");
          const ItemWrapper = hasUrl ? "a" : "div";
          const itemProps = hasUrl ? { href: item.source.url, target: "_blank", rel: "noopener noreferrer" } : {};

          return (
            <ItemWrapper
              key={item.id}
              {...itemProps}
              className={`block p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-transparent hover:border-gicm-primary/20 transition-all ${hasUrl ? "cursor-pointer group" : ""}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{SOURCE_ICONS[item.source.name] ?? "📌"}</span>
                  <span className="text-xs text-gray-400 capitalize">{item.source.name}</span>
                  <span className="text-xs text-gray-500">•</span>
                  <span className="text-xs text-gray-500">
                    {new Date(item.timestamp).toLocaleTimeString()}
                  </span>
                  {hasUrl && <ExternalLink className="w-3 h-3 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />}
                </div>
                <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-yellow-500/10 border border-yellow-500/30">
                  <span className="text-xs font-medium text-yellow-400">{item.importance}/10</span>
                </div>
              </div>
              <p className="text-sm text-gray-300 line-clamp-2 group-hover:text-white transition-colors">{item.content.summary}</p>
              {item.topics.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {item.topics.slice(0, 5).map((topic) => (
                    <span key={topic} className="text-xs px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300">
                      {topic}
                    </span>
                  ))}
                </div>
              )}
            </ItemWrapper>
          );
        })}
      </div>
    </div>
  );
}

function PatternsCard({ patterns }: { patterns: Pattern[] }) {
  if (patterns.length === 0) return null;

  return (
    <div className="bg-gicm-card border border-gicm-border rounded-xl p-6 h-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-orange-500/10">
          <Lightbulb className="w-5 h-5 text-orange-400" />
        </div>
        <div>
          <h3 className="font-semibold">Discovered Patterns</h3>
          <p className="text-sm text-gray-400">{patterns.length} patterns found</p>
        </div>
        <Link href="/analytics" className="ml-auto text-sm text-gicm-primary hover:text-gicm-primary/80 flex items-center gap-1">
          Analytics <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      <div className="space-y-3">
        {patterns.slice(0, 5).map((pattern) => (
          <div key={pattern.id} className="p-3 rounded-lg bg-white/5 border border-orange-500/20">
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-sm text-white">{pattern.name}</span>
              <span className="text-xs text-orange-400">{(pattern.confidence * 100).toFixed(0)}% conf</span>
            </div>
            <p className="text-xs text-gray-400 line-clamp-2">{pattern.description}</p>
            <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
              <span>{pattern.occurrences} occurrences</span>
              <span>•</span>
              <span>{(pattern.accuracy * 100).toFixed(0)}% accuracy</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PredictionsCard({ predictions }: { predictions: Prediction[] }) {
  const pending = predictions.filter((p) => p.status === "pending");

  if (pending.length === 0) return null;

  return (
    <div className="bg-gicm-card border border-gicm-border rounded-xl p-6 h-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-green-500/10">
          <Target className="w-5 h-5 text-green-400" />
        </div>
        <div>
          <h3 className="font-semibold">HYPER BRAIN Predictions</h3>
          <p className="text-sm text-gray-400">{pending.length} active predictions</p>
        </div>
        <Link href="/predictions" className="ml-auto text-sm text-gicm-primary hover:text-gicm-primary/80 flex items-center gap-1">
          Markets <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      <div className="space-y-3">
        {pending.slice(0, 5).map((pred) => (
          <div key={pred.id} className="p-3 rounded-lg bg-white/5 border border-green-500/20">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs px-2 py-0.5 rounded bg-green-500/10 text-green-400 capitalize">
                {pred.type}
              </span>
              <span className="text-xs text-green-400">{(pred.prediction.probability * 100).toFixed(0)}% prob</span>
            </div>
            <p className="text-sm text-white mb-1">{pred.subject}</p>
            <p className="text-xs text-gray-400 line-clamp-2">{pred.prediction.outcome}</p>
            <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
              <span>Timeframe: {pred.prediction.timeframe}</span>
              <span>•</span>
              <span>{(pred.prediction.confidence * 100).toFixed(0)}% confidence</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// ORIGINAL COMPONENTS
// ============================================================================

function QuickStats({ brain, autonomy }: { brain: BrainStatus | null; autonomy: AutonomyStatus | null }) {
  const stats = [
    { label: "Decisions Today", value: brain?.decisionsToday ?? 0, color: "blue", Icon: Brain, href: "/brain" },
    { label: "Actions Queued", value: autonomy?.stats?.queued ?? 0, color: "yellow", Icon: Clock, href: "/autonomy" },
    { label: "Auto-Executed", value: autonomy?.stats?.autoExecuted ?? 0, color: "green", Icon: Zap, href: "/autonomy" },
    { label: "Cycle", value: `#${brain?.cycleNumber ?? 1}`, color: "purple", Icon: Activity, href: "/events" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Link
          key={stat.label}
          href={stat.href}
          className={`p-4 rounded-xl border transition-all hover:scale-105 group ${
            stat.color === "blue" ? "bg-blue-500/10 border-blue-500/30 hover:border-blue-400" :
            stat.color === "yellow" ? "bg-yellow-500/10 border-yellow-500/30 hover:border-yellow-400" :
            stat.color === "green" ? "bg-green-500/10 border-green-500/30 hover:border-green-400" :
            "bg-purple-500/10 border-purple-500/30 hover:border-purple-400"
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <stat.Icon className={`w-4 h-4 ${
              stat.color === "blue" ? "text-blue-400" :
              stat.color === "yellow" ? "text-yellow-400" :
              stat.color === "green" ? "text-green-400" :
              "text-purple-400"
            }`} />
            <span className="text-sm text-gray-400 group-hover:text-gray-300">{stat.label}</span>
          </div>
          <div className={`text-2xl font-bold ${
            stat.color === "blue" ? "text-blue-400" :
            stat.color === "yellow" ? "text-yellow-400" :
            stat.color === "green" ? "text-green-400" :
            "text-purple-400"
          }`}>
            {stat.value}
          </div>
        </Link>
      ))}
    </div>
  );
}

export default function BrainPage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [brain, setBrain] = useState<BrainStatus | null>(null);
  const [autonomy, setAutonomy] = useState<AutonomyStatus | null>(null);
  const [engines, setEngines] = useState<Record<string, EngineStatus> | null>(null);
  const [currentPhase, setCurrentPhase] = useState(2);
  const [opus67Expanded, setOpus67Expanded] = useState(true);

  // HYPER BRAIN state
  const [brainStats, setBrainStats] = useState<BrainStats | null>(null);
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeItem[]>([]);
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);

  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // OPUS 67 hook
  const opus67 = useOpus67({ autoConnect: true });

  // WebSocket for real-time updates
  const ws = useWebSocket({
    autoReconnect: true,
    reconnectDelay: 3000,
    onEvent: (event) => {
      if (event.type?.includes("brain") || event.type?.includes("knowledge") || event.type?.includes("engine")) {
        fetchData();
      }
    },
  });

  const fetchData = useCallback(async () => {
    setLoading(true);

    // Fetch Hub data
    const [brainData, autonomyData, statusData] = await Promise.all([
      hubApi.getBrain().catch(() => null),
      hubApi.getAutonomy().catch(() => null),
      hubApi.getStatus().catch(() => null),
    ]);
    // Extract data from wrapped responses
    setBrain(brainData?.status ?? null);
    setAutonomy(autonomyData);
    if (statusData?.engines?.details) {
      const enginesMap: Record<string, EngineStatus> = {};
      // API returns { engines: { status: {...}, details: EngineHealth[] } }
      for (const e of statusData.engines.details) {
        enginesMap[e.id] = {
          id: e.id,
          status: e.status === "healthy" ? "running" : e.status === "degraded" ? "error" : "stopped",
          lastUpdate: e.lastHeartbeat ?? undefined,
        };
      }
      setEngines(enginesMap);
    }

    // Fetch HYPER BRAIN data
    const [stats, recent, patternData, predictionData] = await Promise.all([
      brainApi.stats().catch(() => null),
      brainApi.recent(20).catch(() => null),
      brainApi.patterns().catch(() => null),
      brainApi.predictions().catch(() => null),
    ]);
    setBrainStats(stats);
    setKnowledgeItems(recent ?? []);
    setPatterns(patternData ?? []);
    setPredictions(predictionData ?? []);

    setLoading(false);
  }, []);

  useEffect(() => {
    setMounted(true);
    const hour = new Date().getUTCHours();
    setCurrentPhase(getPhaseIndex(hour));

    const phaseTimer = setInterval(() => {
      const h = new Date().getUTCHours();
      setCurrentPhase(getPhaseIndex(h));
    }, 60000);

    fetchData();

    return () => {
      clearInterval(phaseTimer);
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [fetchData]);

  // Adaptive polling based on WebSocket connection
  useEffect(() => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    const interval = ws.isConnected ? 30000 : 10000;
    pollingRef.current = setInterval(fetchData, interval);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [ws.isConnected, fetchData]);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading Brain...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gicm-primary/10">
              <Brain className="w-6 h-6 text-gicm-primary" />
            </div>
            Brain - Mission Control
          </h1>
          <p className="text-gray-400 mt-1 ml-12">Daily cycle management & autonomous decision making</p>
        </div>
        <div className="flex items-center gap-4">
          <ConnectionIndicator status={ws.status} isRealtime={ws.isConnected} compact />
          <button
            onClick={() => fetchData()}
            className="flex items-center gap-2 px-4 py-2 bg-gicm-card border border-gicm-border hover:border-gicm-primary/30 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      <QuickStats brain={brain} autonomy={autonomy} />
      <PhaseIndicator currentPhase={currentPhase} />

      {/* OPUS 67 Section */}
      <div className="bg-gicm-card border border-gicm-border rounded-xl overflow-hidden">
        <button
          onClick={() => setOpus67Expanded(!opus67Expanded)}
          className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500/20 to-blue-500/20">
              <Cpu className="w-5 h-5 text-purple-400" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold flex items-center gap-2">
                OPUS 67
                <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-400">v3</span>
              </h3>
              <p className="text-sm text-gray-400">Multi-model router & evolution engine</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${
                opus67.connectionStatus === "connected" ? "bg-green-400 animate-pulse" :
                opus67.connectionStatus === "connecting" ? "bg-yellow-400 animate-pulse" :
                "bg-gray-500"
              }`} />
              <span className="text-sm text-gray-400 capitalize">{opus67.connectionStatus}</span>
            </div>
            <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${opus67Expanded ? "rotate-180" : ""}`} />
          </div>
        </button>

        {opus67Expanded && (
          <div className="p-6 pt-0 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Opus67Status
                status={opus67.status}
                metrics={opus67.metrics}
                connectionStatus={opus67.connectionStatus}
                loading={opus67.connectionStatus === "connecting"}
              />
              <Opus67ModeSelector
                currentMode={opus67.currentMode}
                onModeChange={opus67.setMode}
                disabled={opus67.connectionStatus !== "connected"}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Opus67QueryPanel
                onQuery={opus67.query}
                currentMode={opus67.currentMode}
                disabled={opus67.connectionStatus !== "connected"}
              />
              <Opus67Evolution
                status={opus67.status}
                metrics={opus67.metrics}
                onStart={opus67.startEvolution}
                onStop={opus67.stopEvolution}
                onRunCycle={opus67.runEvolutionCycle}
                disabled={opus67.connectionStatus !== "connected"}
              />
            </div>

            <Opus67History
              history={opus67.history}
              loading={opus67.connectionStatus === "connecting"}
            />
          </div>
        )}
      </div>

      {/* HYPER BRAIN Section */}
      <HyperBrainStats stats={brainStats} />

      {/* Real-time Activity & Knowledge */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Feed - Real-time events from all engines */}
        <div className="lg:col-span-1 bg-gicm-card border border-gicm-border rounded-xl p-6 h-[500px]">
          <ActivityFeed
            limit={30}
            showFilters={true}
            autoRefresh={true}
            className="h-full"
          />
        </div>

        {/* Knowledge Feed - Ingested intelligence */}
        <div className="lg:col-span-1">
          <KnowledgeFeed items={knowledgeItems} />
        </div>

        {/* Patterns & Predictions */}
        <div className="lg:col-span-1 space-y-6">
          <PatternsCard patterns={patterns} />
          <PredictionsCard predictions={predictions} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AutonomyCard autonomy={autonomy} />
        <GoalProgress brain={brain} />
      </div>

      <EngineHealthGrid engines={engines} />
    </div>
  );
}
