"use client";

export const dynamic = 'force-dynamic';

import { useState, useCallback, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Workflow,
  Plus,
  Trash2,
  ArrowDown,
  ArrowLeft,
  Save,
  Play,
  GripVertical,
  Settings,
  ChevronRight,
  AlertTriangle,
  Target,
  TrendingUp,
  Shield,
  Bot,
  FileText,
  Wallet,
  Search,
  Zap,
  Check,
  X,
} from "lucide-react";

// Step types available in the library
const STEP_LIBRARY = [
  {
    category: "Data Collection",
    steps: [
      {
        id: "hunter-agent",
        name: "Hunt Opportunities",
        icon: Target,
        color: "red",
        description: "Discover tokens from Twitter, GitHub, news sources",
        inputs: [
          { name: "source", type: "select", options: ["twitter", "github", "news"], default: "twitter" },
          { name: "limit", type: "number", default: 10 },
        ],
      },
      {
        id: "price-oracle",
        name: "Get Price Data",
        icon: TrendingUp,
        color: "green",
        description: "Fetch current price for a token",
        inputs: [
          { name: "token", type: "text", placeholder: "SOL, ETH, BTC" },
        ],
      },
      {
        id: "wallet-agent",
        name: "Check Wallet",
        icon: Wallet,
        color: "purple",
        description: "Get wallet balance and holdings",
        inputs: [
          { name: "asset", type: "text", default: "SOL" },
        ],
      },
    ],
  },
  {
    category: "Analysis",
    steps: [
      {
        id: "defi-agent",
        name: "DeFi Analysis",
        icon: TrendingUp,
        color: "blue",
        description: "Analyze token fundamentals and DeFi metrics",
        inputs: [
          { name: "data", type: "reference", description: "Results from previous step" },
        ],
      },
      {
        id: "audit-agent",
        name: "Security Audit",
        icon: Shield,
        color: "yellow",
        description: "Audit smart contract for vulnerabilities",
        inputs: [
          { name: "contract", type: "text", placeholder: "Contract address" },
        ],
      },
      {
        id: "decision-agent",
        name: "Decision Matrix",
        icon: Bot,
        color: "purple",
        description: "AI-powered trading decision with multi-persona analysis",
        inputs: [
          { name: "analysis", type: "reference", description: "Analysis data" },
        ],
      },
    ],
  },
  {
    category: "Content",
    steps: [
      {
        id: "seo-researcher",
        name: "Keyword Research",
        icon: Search,
        color: "blue",
        description: "Research SEO keywords for a topic",
        inputs: [
          { name: "topic", type: "text", placeholder: "Topic to research" },
        ],
      },
      {
        id: "blog-generator",
        name: "Generate Blog",
        icon: FileText,
        color: "green",
        description: "AI-generated SEO blog post",
        inputs: [
          { name: "keywords", type: "reference", description: "Keywords from research" },
          { name: "style", type: "select", options: ["technical", "casual", "news"], default: "technical" },
        ],
      },
      {
        id: "tweet-generator",
        name: "Generate Tweets",
        icon: FileText,
        color: "blue",
        description: "Extract tweets from content",
        inputs: [
          { name: "content", type: "reference", description: "Source content" },
          { name: "count", type: "number", default: 5 },
        ],
      },
    ],
  },
  {
    category: "Actions",
    steps: [
      {
        id: "swap-executor",
        name: "Execute Swap",
        icon: Zap,
        color: "orange",
        description: "Execute a token swap on DEX",
        inputs: [
          { name: "amount", type: "number", placeholder: "Amount to swap" },
          { name: "price", type: "reference", description: "Price from oracle" },
        ],
        riskLevel: "high",
      },
      {
        id: "report-generator",
        name: "Generate Report",
        icon: FileText,
        color: "teal",
        description: "Generate formatted report",
        inputs: [
          { name: "analysis", type: "reference", description: "Data to report on" },
          { name: "format", type: "select", options: ["markdown", "pdf", "html"], default: "markdown" },
        ],
      },
    ],
  },
];

// Helper to find step definition - avoids complex type inference issues
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function findStepDef(stepId: string): any {
  for (const category of STEP_LIBRARY) {
    const step = category.steps.find((s) => s.id === stepId);
    if (step) return step;
  }
  return undefined;
}

const COLOR_CLASSES: Record<string, { bg: string; border: string; text: string }> = {
  red: { bg: "bg-red-500/10", border: "border-red-500/30", text: "text-red-400" },
  blue: { bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-400" },
  green: { bg: "bg-green-500/10", border: "border-green-500/30", text: "text-green-400" },
  yellow: { bg: "bg-yellow-500/10", border: "border-yellow-500/30", text: "text-yellow-400" },
  purple: { bg: "bg-purple-500/10", border: "border-purple-500/30", text: "text-purple-400" },
  orange: { bg: "bg-orange-500/10", border: "border-orange-500/30", text: "text-orange-400" },
  teal: { bg: "bg-teal-500/10", border: "border-teal-500/30", text: "text-teal-400" },
};

interface PipelineStep {
  id: string;
  stepId: string;
  name: string;
  icon: typeof Target;
  color: string;
  inputs: Record<string, unknown>;
  dependsOn: string[];
}

interface StepLibraryItemProps {
  step: typeof STEP_LIBRARY[0]["steps"][0];
  onAdd: () => void;
}

function StepLibraryItem({ step, onAdd }: StepLibraryItemProps) {
  const Icon = step.icon;
  const colors = COLOR_CLASSES[step.color] || COLOR_CLASSES.blue;

  return (
    <div
      className={`p-3 rounded-lg border ${colors.bg} ${colors.border} cursor-pointer hover:opacity-80 transition-opacity`}
      onClick={onAdd}
    >
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`w-4 h-4 ${colors.text}`} />
        <span className="text-sm font-medium text-white">{step.name}</span>
        {"riskLevel" in step && (
          <span className="px-1.5 py-0.5 text-xs bg-orange-500/20 text-orange-400 rounded">
            {step.riskLevel}
          </span>
        )}
      </div>
      <p className="text-xs text-gray-500 line-clamp-2">{step.description}</p>
    </div>
  );
}

interface PipelineStepCardProps {
  step: PipelineStep;
  index: number;
  onRemove: () => void;
  onUpdateInput: (inputName: string, value: unknown) => void;
  availableRefs: Array<{ id: string; name: string }>;
}

function PipelineStepCard({
  step,
  index,
  onRemove,
  onUpdateInput,
  availableRefs,
}: PipelineStepCardProps) {
  const [expanded, setExpanded] = useState(true);
  const Icon = step.icon;
  const colors = COLOR_CLASSES[step.color] || COLOR_CLASSES.blue;

  const stepDef = findStepDef(step.stepId);
  const inputs = (stepDef?.inputs || []) as Array<{ name: string; type: string; default?: string; description?: string; placeholder?: string; options?: string[] }>;

  return (
    <div className={`bg-gicm-card border ${colors.border} rounded-xl overflow-hidden`}>
      {/* Header */}
      <div
        className={`flex items-center justify-between p-4 ${colors.bg} cursor-pointer`}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded bg-white/10">
            <GripVertical className="w-4 h-4 text-gray-400" />
          </div>
          <span className="text-sm font-medium text-gray-400">Step {index + 1}</span>
          <Icon className={`w-4 h-4 ${colors.text}`} />
          <span className="font-medium text-white">{step.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <ChevronRight
            className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? "rotate-90" : ""}`}
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="p-1 hover:bg-red-500/20 rounded transition-colors"
          >
            <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-400" />
          </button>
        </div>
      </div>

      {/* Configuration */}
      {expanded && inputs.length > 0 && (
        <div className="p-4 border-t border-gicm-border space-y-3">
          {inputs.map((input) => (
            <div key={input.name}>
              <label className="block text-sm text-gray-400 mb-1 capitalize">
                {input.name}
                {input.type === "reference" && (
                  <span className="text-xs text-gray-500 ml-2">
                    (from previous step)
                  </span>
                )}
              </label>
              {input.type === "text" && (
                <input
                  type="text"
                  value={(step.inputs[input.name] as string) || ""}
                  onChange={(e) => onUpdateInput(input.name, e.target.value)}
                  placeholder={"placeholder" in input ? input.placeholder : ""}
                  className="w-full px-3 py-2 bg-white/5 border border-gicm-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gicm-primary/50"
                />
              )}
              {input.type === "number" && (
                <input
                  type="number"
                  value={(step.inputs[input.name] as number) || input.default || 0}
                  onChange={(e) => onUpdateInput(input.name, parseFloat(e.target.value))}
                  className="w-full px-3 py-2 bg-white/5 border border-gicm-border rounded-lg text-white focus:outline-none focus:border-gicm-primary/50"
                />
              )}
              {input.type === "select" && "options" in input && (
                <select
                  value={(step.inputs[input.name] as string) || input.default || ""}
                  onChange={(e) => onUpdateInput(input.name, e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-gicm-border rounded-lg text-white focus:outline-none focus:border-gicm-primary/50"
                >
                  {input.options?.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              )}
              {input.type === "reference" && (
                <select
                  value={(step.inputs[input.name] as string) || ""}
                  onChange={(e) => onUpdateInput(input.name, e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-gicm-border rounded-lg text-white focus:outline-none focus:border-gicm-primary/50"
                >
                  <option value="">Select reference...</option>
                  {availableRefs.map((ref) => (
                    <option key={ref.id} value={`\${results.${ref.id}}`}>
                      {ref.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PipelineBuilderContent() {
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");

  const [pipelineId, setPipelineId] = useState<string | null>(null);
  const [pipelineName, setPipelineName] = useState("");
  const [pipelineDescription, setPipelineDescription] = useState("");
  const [steps, setSteps] = useState<PipelineStep[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Load existing pipeline for editing
  useEffect(() => {
    if (editId) {
      try {
        const pipelines = JSON.parse(localStorage.getItem("gicm-custom-pipelines") || "[]");
        const existing = pipelines.find((p: { id: string }) => p.id === editId);
        if (existing) {
          setPipelineId(existing.id);
          setPipelineName(existing.name);
          setPipelineDescription(existing.description || "");
          setIsEditing(true);
          // Reconstruct steps from saved data
          const reconstructedSteps: PipelineStep[] = existing.steps.map(
            (s: { id: string; tool: string; name: string; inputs: Record<string, unknown>; dependsOn?: string[] }) => {
              const stepDef = findStepDef(s.tool);
              return {
                id: s.id,
                stepId: s.tool,
                name: s.name,
                icon: stepDef?.icon || Workflow,
                color: stepDef?.color || "blue",
                inputs: s.inputs || {},
                dependsOn: s.dependsOn || [],
              };
            }
          );
          setSteps(reconstructedSteps);
        }
      } catch (e) {
        console.error("Failed to load pipeline for editing:", e);
      }
    }
  }, [editId]);

  const addStep = useCallback(
    (stepDef: typeof STEP_LIBRARY[0]["steps"][0]) => {
      const newStep: PipelineStep = {
        id: `step-${Date.now()}`,
        stepId: stepDef.id,
        name: stepDef.name,
        icon: stepDef.icon,
        color: stepDef.color,
        inputs: {},
        dependsOn: steps.length > 0 ? [steps[steps.length - 1].id] : [],
      };
      setSteps((prev) => [...prev, newStep]);
      setSaved(false);
    },
    [steps]
  );

  const removeStep = useCallback((stepId: string) => {
    setSteps((prev) => prev.filter((s) => s.id !== stepId));
    setSaved(false);
  }, []);

  const updateStepInput = useCallback((stepId: string, inputName: string, value: unknown) => {
    setSteps((prev) =>
      prev.map((s) =>
        s.id === stepId ? { ...s, inputs: { ...s.inputs, [inputName]: value } } : s
      )
    );
    setSaved(false);
  }, []);

  const getAvailableRefs = useCallback(
    (currentIndex: number) => {
      return steps.slice(0, currentIndex).map((s) => ({
        id: s.id.replace("step-", ""),
        name: s.name,
      }));
    },
    [steps]
  );

  const calculateRiskLevel = () => {
    const stepDefs = steps.map((s) => findStepDef(s.stepId));
    const hasHighRisk = stepDefs.some((sd) => sd && "riskLevel" in sd && sd.riskLevel === "high");
    const hasMediumRisk = stepDefs.some(
      (sd) => sd && "riskLevel" in sd && sd.riskLevel === "medium"
    );
    if (hasHighRisk) return "high";
    if (hasMediumRisk) return "medium";
    return "safe";
  };

  const handleSave = async () => {
    if (!pipelineName || steps.length === 0) return;

    setSaving(true);
    // Simulate save - in real implementation, this would POST to the API
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSaving(false);
    setSaved(true);

    // Store in localStorage for persistence
    const pipelines = JSON.parse(localStorage.getItem("gicm-custom-pipelines") || "[]");
    const now = new Date().toISOString();

    const pipelineData = {
      id: isEditing && pipelineId ? pipelineId : `custom-${Date.now()}`,
      name: pipelineName,
      description: pipelineDescription,
      category: "Custom",
      steps: steps.map((s) => ({
        id: s.id,
        tool: s.stepId,
        name: s.name,
        inputs: s.inputs,
        dependsOn: s.dependsOn,
      })),
      riskLevel: calculateRiskLevel(),
      isCustom: true,
      createdAt: isEditing ? (pipelines.find((p: { id: string }) => p.id === pipelineId)?.createdAt || now) : now,
      updatedAt: now,
    };

    if (isEditing && pipelineId) {
      // Update existing pipeline
      const index = pipelines.findIndex((p: { id: string }) => p.id === pipelineId);
      if (index !== -1) {
        pipelines[index] = pipelineData;
      }
    } else {
      // Add new pipeline
      pipelines.push(pipelineData);
      setPipelineId(pipelineData.id);
      setIsEditing(true);
    }

    localStorage.setItem("gicm-custom-pipelines", JSON.stringify(pipelines));
  };

  const riskLevel = calculateRiskLevel();
  const riskColors = {
    safe: "text-green-400 bg-green-500/20",
    medium: "text-yellow-400 bg-yellow-500/20",
    high: "text-orange-400 bg-orange-500/20",
  };

  return (
    <div className="min-h-screen bg-gicm-dark">
      {/* Header */}
      <div className="border-b border-gicm-border bg-gicm-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/pipelines"
                className="p-2 hover:bg-white/5 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-400" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  <Workflow className="w-5 h-5 text-gicm-primary" />
                  {isEditing ? "Edit Pipeline" : "Pipeline Builder"}
                </h1>
                <p className="text-sm text-gray-400">
                  {isEditing ? `Editing: ${pipelineName}` : "Create custom multi-step workflows"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {steps.length > 0 && (
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${riskColors[riskLevel]}`}>
                  {riskLevel} risk
                </span>
              )}
              <button
                onClick={handleSave}
                disabled={!pipelineName || steps.length === 0 || saving}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  !pipelineName || steps.length === 0
                    ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                    : saved
                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                    : "bg-gicm-primary text-black hover:bg-gicm-primary/90"
                }`}
              >
                {saving ? (
                  <>Saving...</>
                ) : saved ? (
                  <>
                    <Check className="w-4 h-4" />
                    Saved
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {isEditing ? "Update Pipeline" : "Save Pipeline"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Step Library (Left Panel) */}
          <div className="lg:col-span-1">
            <div className="bg-gicm-card border border-gicm-border rounded-xl p-6 sticky top-24">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-gicm-primary" />
                Step Library
              </h2>
              <p className="text-sm text-gray-400 mb-4">Click a step to add it to your pipeline</p>

              <div className="space-y-6 max-h-[60vh] overflow-y-auto">
                {STEP_LIBRARY.map((category) => (
                  <div key={category.category}>
                    <h3 className="text-sm font-medium text-gray-400 mb-2">
                      {category.category}
                    </h3>
                    <div className="space-y-2">
                      {category.steps.map((step) => (
                        <StepLibraryItem
                          key={step.id}
                          step={step}
                          onAdd={() => addStep(step)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pipeline Canvas (Main Panel) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Pipeline Info */}
            <div className="bg-gicm-card border border-gicm-border rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5 text-gicm-primary" />
                Pipeline Info
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Name *</label>
                  <input
                    type="text"
                    value={pipelineName}
                    onChange={(e) => setPipelineName(e.target.value)}
                    placeholder="e.g., Token Research Pipeline"
                    className="w-full px-4 py-2 bg-white/5 border border-gicm-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gicm-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Description</label>
                  <textarea
                    value={pipelineDescription}
                    onChange={(e) => setPipelineDescription(e.target.value)}
                    placeholder="What does this pipeline do?"
                    rows={2}
                    className="w-full px-4 py-2 bg-white/5 border border-gicm-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gicm-primary/50 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Steps */}
            <div className="bg-gicm-card border border-gicm-border rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Workflow className="w-5 h-5 text-gicm-primary" />
                Pipeline Steps
                {steps.length > 0 && (
                  <span className="text-sm text-gray-400 font-normal">
                    ({steps.length} step{steps.length !== 1 ? "s" : ""})
                  </span>
                )}
              </h2>

              {steps.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gicm-border rounded-xl">
                  <Workflow className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                  <p className="text-gray-400">No steps yet</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Click steps from the library to add them
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {steps.map((step, index) => (
                    <div key={step.id}>
                      <PipelineStepCard
                        step={step}
                        index={index}
                        onRemove={() => removeStep(step.id)}
                        onUpdateInput={(name, value) => updateStepInput(step.id, name, value)}
                        availableRefs={getAvailableRefs(index)}
                      />
                      {index < steps.length - 1 && (
                        <div className="flex justify-center py-2">
                          <ArrowDown className="w-5 h-5 text-gray-600" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Risk Warning */}
            {riskLevel === "high" && (
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-orange-400">High Risk Pipeline</p>
                  <p className="text-sm text-gray-400 mt-1">
                    This pipeline contains steps that execute trades or other high-risk operations.
                    It will require approval before execution.
                  </p>
                </div>
              </div>
            )}

            {/* Preview */}
            {steps.length > 0 && (
              <div className="bg-gicm-card border border-gicm-border rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Execution Flow</h2>
                <div className="flex items-center gap-2 flex-wrap">
                  {steps.map((step, index) => {
                    const colors = COLOR_CLASSES[step.color] || COLOR_CLASSES.blue;
                    return (
                      <div key={step.id} className="flex items-center">
                        <span
                          className={`px-3 py-1 text-sm rounded-lg ${colors.bg} ${colors.border} border ${colors.text}`}
                        >
                          {step.name}
                        </span>
                        {index < steps.length - 1 && (
                          <ChevronRight className="w-4 h-4 text-gray-600 mx-1" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PipelineBuilderLoading() {
  return (
    <div className="min-h-screen bg-gicm-dark flex items-center justify-center">
      <div className="text-gray-400">Loading Pipeline Builder...</div>
    </div>
  );
}

export default function PipelineBuilderPage() {
  return (
    <Suspense fallback={<PipelineBuilderLoading />}>
      <PipelineBuilderContent />
    </Suspense>
  );
}
