"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useNotifications } from "../../hooks/useNotifications";
import { useWebSocket } from "../../hooks/useWebSocket";
import {
  Play,
  Pause,
  Square,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  ChevronRight,
  Plus,
  Settings,
  Workflow,
  Bot,
  Zap,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Copy,
  Check,
  Activity,
  History,
  Trash2,
  Pencil,
  Star,
  LayoutTemplate,
} from "lucide-react";

// Hub API configuration
const HUB_URL = process.env.NEXT_PUBLIC_HUB_URL || "http://localhost:3100";

// Types
interface StepProgress {
  id: string;
  name: string;
  status: "pending" | "running" | "completed" | "failed" | "skipped";
  startedAt: number | null;
  completedAt: number | null;
  output: any | null;
  error: string | null;
}

interface PipelineExecution {
  id: string;
  pipelineId: string;
  pipelineName: string;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  progress: number;
  currentStep: string | null;
  steps: StepProgress[];
  startedAt: number;
  completedAt: number | null;
  duration: number;
  result: any | null;
  error: string | null;
}

interface PipelineTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  steps: Array<{
    id: string;
    tool: string;
    name: string;
    inputs: Record<string, unknown>;
    dependsOn?: string[];
  }>;
  riskLevel: "safe" | "low" | "medium" | "high" | "critical";
}

// Custom pipeline type (saved by user)
interface CustomPipeline extends PipelineTemplate {
  isCustom: true;
  createdAt: string;
  updatedAt: string;
}

// Load custom pipelines from localStorage
function loadCustomPipelines(): CustomPipeline[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem("gicm-custom-pipelines");
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

// Save custom pipelines to localStorage
function saveCustomPipelines(pipelines: CustomPipeline[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("gicm-custom-pipelines", JSON.stringify(pipelines));
}

// Sample pipeline templates
const PIPELINE_TEMPLATES: PipelineTemplate[] = [
  {
    id: "research-analyze",
    name: "Research & Analyze",
    description: "Discover tokens, analyze fundamentals, and generate investment report",
    category: "Trading",
    steps: [
      { id: "hunt", tool: "hunter-agent", name: "Hunt Opportunities", inputs: { source: "twitter" } },
      { id: "analyze", tool: "defi-agent", name: "Analyze DeFi", inputs: { data: "${results.hunt}" }, dependsOn: ["hunt"] },
      { id: "decide", tool: "decision-agent", name: "Decision Matrix", inputs: { analysis: "${results.analyze}" }, dependsOn: ["analyze"] },
    ],
    riskLevel: "low",
  },
  {
    id: "content-pipeline",
    name: "Content Generation",
    description: "Generate SEO blog post, extract tweets, and schedule publishing",
    category: "Growth",
    steps: [
      { id: "research", tool: "seo-researcher", name: "Keyword Research", inputs: { topic: "crypto" } },
      { id: "blog", tool: "blog-generator", name: "Generate Blog", inputs: { keywords: "${results.research}" }, dependsOn: ["research"] },
      { id: "tweets", tool: "tweet-generator", name: "Extract Tweets", inputs: { content: "${results.blog}" }, dependsOn: ["blog"] },
    ],
    riskLevel: "safe",
  },
  {
    id: "security-audit",
    name: "Security Audit",
    description: "Audit smart contract for vulnerabilities and generate report",
    category: "Security",
    steps: [
      { id: "scan", tool: "audit-agent", name: "Scan Contract", inputs: { contract: "" } },
      { id: "analyze", tool: "security-analyzer", name: "Analyze Findings", inputs: { scan: "${results.scan}" }, dependsOn: ["scan"] },
      { id: "report", tool: "report-generator", name: "Generate Report", inputs: { analysis: "${results.analyze}" }, dependsOn: ["analyze"] },
    ],
    riskLevel: "medium",
  },
  {
    id: "dca-trade",
    name: "DCA Trading",
    description: "Execute dollar-cost averaging trade with risk management",
    category: "Trading",
    steps: [
      { id: "check", tool: "wallet-agent", name: "Check Balance", inputs: { asset: "SOL" } },
      { id: "price", tool: "price-oracle", name: "Get Price", inputs: { token: "SOL" }, dependsOn: ["check"] },
      { id: "trade", tool: "swap-executor", name: "Execute Trade", inputs: { amount: "${inputs.amount}", price: "${results.price}" }, dependsOn: ["price"] },
    ],
    riskLevel: "high",
  },
];

const STATUS_COLORS: Record<string, string> = {
  pending: "text-gray-400",
  running: "text-blue-400",
  completed: "text-green-400",
  failed: "text-red-400",
  cancelled: "text-yellow-400",
  skipped: "text-gray-500",
};

const STATUS_BG: Record<string, string> = {
  pending: "bg-gray-500/20",
  running: "bg-blue-500/20",
  completed: "bg-green-500/20",
  failed: "bg-red-500/20",
  cancelled: "bg-yellow-500/20",
  skipped: "bg-gray-500/10",
};

const RISK_COLORS: Record<string, string> = {
  safe: "text-green-400 bg-green-500/20",
  low: "text-blue-400 bg-blue-500/20",
  medium: "text-yellow-400 bg-yellow-500/20",
  high: "text-orange-400 bg-orange-500/20",
  critical: "text-red-400 bg-red-500/20",
};

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case "pending":
      return <Clock className="w-4 h-4" />;
    case "running":
      return <Loader2 className="w-4 h-4 animate-spin" />;
    case "completed":
      return <CheckCircle2 className="w-4 h-4" />;
    case "failed":
      return <XCircle className="w-4 h-4" />;
    case "cancelled":
      return <Square className="w-4 h-4" />;
    case "skipped":
      return <ChevronRight className="w-4 h-4" />;
    default:
      return <Clock className="w-4 h-4" />;
  }
}

function PipelineCard({
  template,
  onExecute,
  onEdit,
  onDelete,
  isCustom = false,
}: {
  template: PipelineTemplate;
  onExecute: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  isCustom?: boolean;
}) {
  return (
    <div className={`bg-gicm-card border rounded-xl p-6 hover:border-gicm-primary/30 transition-all ${
      isCustom ? "border-gicm-primary/20" : "border-gicm-border"
    }`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isCustom ? "bg-purple-500/10" : "bg-gicm-primary/10"}`}>
            {isCustom ? (
              <Star className="w-5 h-5 text-purple-400" />
            ) : (
              <Workflow className="w-5 h-5 text-gicm-primary" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-white">{template.name}</h3>
            <p className="text-sm text-gray-400">
              {template.category}
              {isCustom && <span className="ml-2 text-purple-400">(Custom)</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${RISK_COLORS[template.riskLevel]}`}>
            {template.riskLevel}
          </span>
          {isCustom && (
            <div className="flex items-center gap-1">
              {onEdit && (
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit(); }}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                  title="Edit pipeline"
                >
                  <Pencil className="w-3.5 h-3.5 text-gray-400" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(); }}
                  className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors"
                  title="Delete pipeline"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <p className="text-sm text-gray-400 mb-4">{template.description}</p>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {template.steps.map((step, i) => (
          <div key={step.id} className="flex items-center">
            <span className="text-xs text-gray-500 bg-gicm-dark px-2 py-1 rounded">
              {step.name}
            </span>
            {i < template.steps.length - 1 && (
              <ArrowRight className="w-3 h-3 text-gray-600 mx-1" />
            )}
          </div>
        ))}
      </div>

      <button
        onClick={onExecute}
        className="w-full flex items-center justify-center gap-2 py-2 bg-gicm-primary/20 hover:bg-gicm-primary/30 text-gicm-primary rounded-lg transition-colors"
      >
        <Play className="w-4 h-4" />
        Execute Pipeline
      </button>
    </div>
  );
}

function ExecutionMonitor({
  execution,
  onCancel,
}: {
  execution: PipelineExecution;
  onCancel: () => void;
}) {
  return (
    <div className="bg-gicm-card border border-gicm-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${STATUS_BG[execution.status]}`}>
            <StatusIcon status={execution.status} />
          </div>
          <div>
            <h3 className="font-semibold text-white">{execution.pipelineName}</h3>
            <p className="text-sm text-gray-400">
              {execution.status === "running"
                ? `Step: ${execution.currentStep || "Starting..."}`
                : execution.status}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">
            {Math.round(execution.duration / 1000)}s
          </span>
          {(execution.status === "pending" || execution.status === "running") && (
            <button
              onClick={onCancel}
              className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
            >
              <Square className="w-4 h-4 text-red-400" />
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="h-2 bg-gicm-dark rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              execution.status === "failed" ? "bg-red-500" : "bg-gicm-primary"
            }`}
            style={{ width: `${execution.progress}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs text-gray-500">Progress</span>
          <span className="text-xs text-gray-400">{execution.progress}%</span>
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-2">
        {execution.steps.map((step) => (
          <div
            key={step.id}
            className={`flex items-center justify-between p-3 rounded-lg ${STATUS_BG[step.status]}`}
          >
            <div className="flex items-center gap-3">
              <StatusIcon status={step.status} />
              <span className={`text-sm ${STATUS_COLORS[step.status]}`}>
                {step.name}
              </span>
            </div>
            {step.completedAt && step.startedAt && (
              <span className="text-xs text-gray-500">
                {Math.round((step.completedAt - step.startedAt) / 1000)}s
              </span>
            )}
            {step.error && (
              <span className="text-xs text-red-400 truncate max-w-[200px]">
                {step.error}
              </span>
            )}
          </div>
        ))}
      </div>

      {execution.error && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <div className="flex items-center gap-2 text-red-400">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm">{execution.error}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PipelinesPage() {
  const [activeTab, setActiveTab] = useState<"templates" | "executions">("templates");
  const [executions, setExecutions] = useState<PipelineExecution[]>([]);
  const [currentExecution, setCurrentExecution] = useState<PipelineExecution | null>(null);
  const [loading, setLoading] = useState(false);
  const [pollingEnabled, setPollingEnabled] = useState(false);
  const [customPipelines, setCustomPipelines] = useState<CustomPipeline[]>([]);

  // Notifications for pipeline events
  const { notifyPipelineComplete } = useNotifications();
  const prevExecutionStatus = useRef<string | null>(null);

  // WebSocket for real-time updates
  const ws = useWebSocket({
    onMessage: (message) => {
      if (message.type === "event" && message.payload) {
        const event = message.payload as { type: string; data?: PipelineExecution };
        if (event.type === "pipeline:status" && event.data) {
          setCurrentExecution(event.data);
          // Check if status changed to completed/failed
          if (
            prevExecutionStatus.current === "running" &&
            (event.data.status === "completed" || event.data.status === "failed")
          ) {
            notifyPipelineComplete(
              event.data.pipelineName,
              event.data.status === "completed"
            );
            fetchExecutions();
          }
          prevExecutionStatus.current = event.data.status;
        }
      }
    },
  });

  // Load custom pipelines on mount
  useEffect(() => {
    setCustomPipelines(loadCustomPipelines());
  }, []);

  // Delete custom pipeline
  const deleteCustomPipeline = useCallback((id: string) => {
    const updated = customPipelines.filter((p) => p.id !== id);
    setCustomPipelines(updated);
    saveCustomPipelines(updated);
  }, [customPipelines]);

  // Fetch executions list
  const fetchExecutions = useCallback(async () => {
    try {
      const res = await fetch(`${HUB_URL}/api/pipelines/executions?limit=10`);
      if (res.ok) {
        const data = await res.json();
        if (data.ok) {
          setExecutions(data.executions);
        }
      }
    } catch (error) {
      console.error("Failed to fetch executions:", error);
    }
  }, []);

  // Fetch current execution status
  const fetchExecutionStatus = useCallback(async (executionId: string) => {
    try {
      const res = await fetch(`${HUB_URL}/api/pipelines/${executionId}/status`);
      if (res.ok) {
        const data = await res.json();
        if (data.ok) {
          setCurrentExecution(data.execution);
          // Stop polling if execution is complete
          if (["completed", "failed", "cancelled"].includes(data.execution.status)) {
            setPollingEnabled(false);
            fetchExecutions(); // Refresh executions list
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch execution status:", error);
    }
  }, [fetchExecutions]);

  // Execute a pipeline
  const executePipeline = async (template: PipelineTemplate) => {
    setLoading(true);
    try {
      const res = await fetch(`${HUB_URL}/api/pipelines/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pipeline: {
            id: template.id,
            name: template.name,
            description: template.description,
            steps: template.steps,
          },
          inputs: {},
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.ok) {
          setPollingEnabled(true);
          setActiveTab("executions");
          // Start polling for status
          fetchExecutionStatus(data.executionId);
        }
      }
    } catch (error) {
      console.error("Failed to execute pipeline:", error);
    } finally {
      setLoading(false);
    }
  };

  // Cancel execution
  const cancelExecution = async (executionId: string) => {
    try {
      const res = await fetch(`${HUB_URL}/api/pipelines/${executionId}/cancel`, {
        method: "POST",
      });
      if (res.ok) {
        fetchExecutionStatus(executionId);
      }
    } catch (error) {
      console.error("Failed to cancel execution:", error);
    }
  };

  // Polling effect
  useEffect(() => {
    fetchExecutions();
  }, [fetchExecutions]);

  useEffect(() => {
    if (pollingEnabled && currentExecution) {
      const interval = setInterval(() => {
        fetchExecutionStatus(currentExecution.id);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [pollingEnabled, currentExecution, fetchExecutionStatus]);

  return (
    <div className="min-h-screen bg-gicm-dark p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <Workflow className="w-7 h-7 text-gicm-primary" />
              PTC Pipelines
            </h1>
            <p className="text-gray-400 mt-1">
              Programmatic Tool Calling - Orchestrate multi-step workflows
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchExecutions}
              className="p-2 hover:bg-gicm-card rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5 text-gray-400" />
            </button>
            <Link
              href="/pipelines/analytics"
              className="p-2 hover:bg-gicm-card rounded-lg transition-colors"
              title="Analytics"
            >
              <Activity className="w-5 h-5 text-gray-400" />
            </Link>
            <Link
              href="/pipelines/webhooks"
              className="p-2 hover:bg-gicm-card rounded-lg transition-colors"
              title="Webhooks"
            >
              <Settings className="w-5 h-5 text-gray-400" />
            </Link>
            <Link
              href="/pipelines/templates"
              className="flex items-center gap-2 px-3 py-2 border border-gicm-border text-gray-300 rounded-lg hover:bg-gicm-card hover:text-white transition-colors text-sm"
            >
              <LayoutTemplate className="w-4 h-4" />
              Templates
            </Link>
            <Link
              href="/pipelines/builder"
              className="flex items-center gap-2 px-3 py-2 bg-gicm-primary text-black rounded-lg hover:bg-gicm-primary/90 transition-colors font-medium text-sm"
            >
              <Plus className="w-4 h-4" />
              New Pipeline
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gicm-border">
          <button
            onClick={() => setActiveTab("templates")}
            className={`pb-3 px-1 text-sm font-medium transition-colors ${
              activeTab === "templates"
                ? "text-gicm-primary border-b-2 border-gicm-primary"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4" />
              Templates
            </div>
          </button>
          <button
            onClick={() => setActiveTab("executions")}
            className={`pb-3 px-1 text-sm font-medium transition-colors ${
              activeTab === "executions"
                ? "text-gicm-primary border-b-2 border-gicm-primary"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Executions
              {executions.filter((e) => e.status === "running").length > 0 && (
                <span className="px-1.5 py-0.5 text-xs bg-blue-500/20 text-blue-400 rounded-full">
                  {executions.filter((e) => e.status === "running").length}
                </span>
              )}
            </div>
          </button>
        </div>

        {/* Templates Tab */}
        {activeTab === "templates" && (
          <div className="space-y-8">
            {/* Custom Pipelines Section */}
            {customPipelines.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Star className="w-5 h-5 text-purple-400" />
                  Your Custom Pipelines
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {customPipelines.map((pipeline) => (
                    <PipelineCard
                      key={pipeline.id}
                      template={pipeline}
                      isCustom
                      onExecute={() => executePipeline(pipeline)}
                      onEdit={() => window.location.href = `/pipelines/builder?edit=${pipeline.id}`}
                      onDelete={() => {
                        if (confirm(`Delete pipeline "${pipeline.name}"?`)) {
                          deleteCustomPipeline(pipeline.id);
                        }
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Template Pipelines Section */}
            <div>
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Bot className="w-5 h-5 text-gicm-primary" />
                Pipeline Templates
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {PIPELINE_TEMPLATES.map((template) => (
                  <PipelineCard
                    key={template.id}
                    template={template}
                    onExecute={() => executePipeline(template)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Executions Tab */}
        {activeTab === "executions" && (
          <div className="space-y-6">
            {/* Current Execution Monitor */}
            {currentExecution && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-gicm-primary" />
                  Live Execution
                </h2>
                <ExecutionMonitor
                  execution={currentExecution}
                  onCancel={() => cancelExecution(currentExecution.id)}
                />
              </div>
            )}

            {/* Execution History */}
            <div>
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <History className="w-5 h-5 text-gray-400" />
                Recent Executions
              </h2>
              {executions.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Workflow className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No pipeline executions yet</p>
                  <p className="text-sm mt-2">
                    Execute a pipeline template to see results here
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {executions.map((exec) => (
                    <div
                      key={exec.id}
                      className="flex items-center justify-between p-4 bg-gicm-card border border-gicm-border rounded-xl hover:border-gicm-primary/30 transition-colors cursor-pointer"
                      onClick={() => {
                        setCurrentExecution(exec as PipelineExecution);
                        if (exec.status === "running") {
                          setPollingEnabled(true);
                        }
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${STATUS_BG[exec.status]}`}>
                          <StatusIcon status={exec.status} />
                        </div>
                        <div>
                          <h3 className="font-medium text-white">{exec.pipelineName}</h3>
                          <p className="text-sm text-gray-400">
                            {new Date(exec.startedAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className={`text-sm font-medium ${STATUS_COLORS[exec.status]}`}>
                            {exec.status}
                          </p>
                          <p className="text-xs text-gray-500">
                            {Math.round(exec.duration / 1000)}s
                          </p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-500" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Stats Bar */}
        <div className="mt-8 p-4 bg-gicm-card border border-gicm-border rounded-xl">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-gray-400">
                  Completed: {executions.filter((e) => e.status === "completed").length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full" />
                <span className="text-gray-400">
                  Failed: {executions.filter((e) => e.status === "failed").length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                <span className="text-gray-400">
                  Running: {executions.filter((e) => e.status === "running").length}
                </span>
              </div>
            </div>
            <div className="text-gray-500">
              37% token savings with PTC orchestration
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
