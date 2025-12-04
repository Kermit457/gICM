"use client";

import { useState, useEffect } from "react";
import {
  Activity,
  AlertTriangle,
  Bug,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Code,
  FileCode,
  Loader2,
  RefreshCw,
  Server,
  TestTube,
  XCircle,
  Zap,
} from "lucide-react";
import type { ScanResult } from "../api/platform-scan/route";

export default function DiagnosticsPage() {
  const [scan, setScan] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["summary", "services", "improvements"])
  );

  useEffect(() => {
    fetchScan();
  }, []);

  const fetchScan = async () => {
    try {
      const res = await fetch("/api/platform-scan");
      const data = await res.json();
      setScan(data);
    } catch (error) {
      console.error("Failed to fetch scan:", error);
    } finally {
      setLoading(false);
    }
  };

  const runScan = async () => {
    setScanning(true);
    try {
      const res = await fetch("/api/platform-scan", { method: "POST" });
      const data = await res.json();
      setScan(data);
    } catch (error) {
      console.error("Failed to run scan:", error);
    } finally {
      setScanning(false);
    }
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-gicm-primary" />
      </div>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "text-red-500 bg-red-500/10";
      case "high": return "text-orange-500 bg-orange-500/10";
      case "medium": return "text-yellow-500 bg-yellow-500/10";
      case "low": return "text-blue-500 bg-blue-500/10";
      default: return "text-gray-500 bg-gray-500/10";
    }
  };

  const getServiceStatus = (status: string) => {
    switch (status) {
      case "healthy": return { icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/10" };
      case "degraded": return { icon: AlertTriangle, color: "text-yellow-500", bg: "bg-yellow-500/10" };
      case "offline": return { icon: XCircle, color: "text-red-500", bg: "bg-red-500/10" };
      default: return { icon: Activity, color: "text-gray-500", bg: "bg-gray-500/10" };
    }
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <div className="min-h-screen bg-gicm-dark text-gicm-text p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Bug className="w-8 h-8 text-gicm-primary" />
            Platform Diagnostics
          </h1>
          <p className="text-gicm-muted mt-1">
            Scan results from {scan?.timestamp ? new Date(scan.timestamp).toLocaleString() : "N/A"}
          </p>
        </div>
        <button
          onClick={runScan}
          disabled={scanning}
          className="flex items-center gap-2 px-6 py-3 bg-gicm-primary text-black font-semibold rounded-lg hover:bg-gicm-primary/90 disabled:opacity-50 transition-all"
        >
          {scanning ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <RefreshCw className="w-5 h-5" />
          )}
          {scanning ? "Scanning..." : "Run Scan"}
        </button>
      </div>

      {scan && (
        <>
          {/* Health Score Banner */}
          <div className="bg-gicm-surface rounded-xl p-6 mb-6 border border-gicm-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`text-6xl font-bold ${getHealthScoreColor(scan.summary.healthScore)}`}>
                  {scan.summary.healthScore}
                </div>
                <div>
                  <div className="text-xl font-semibold text-white">Health Score</div>
                  <div className="text-gicm-muted">Based on TypeScript, tests, and code quality</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-2xl font-bold text-white">{scan.summary.totalPackages}</div>
                  <div className="text-gicm-muted text-sm">Packages</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-400">{scan.summary.typescriptErrors}</div>
                  <div className="text-gicm-muted text-sm">TS Errors</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-400">
                    {scan.summary.testsPassed}/{scan.summary.testsPassed + scan.summary.testsFailed}
                  </div>
                  <div className="text-gicm-muted text-sm">Tests Pass</div>
                </div>
              </div>
            </div>
          </div>

          {/* Services Status */}
          <Section
            title="Services"
            icon={Server}
            expanded={expandedSections.has("services")}
            onToggle={() => toggleSection("services")}
          >
            <div className="grid grid-cols-3 gap-4">
              {Object.entries(scan.services).map(([name, service]) => {
                const status = getServiceStatus(service.status);
                const StatusIcon = status.icon;
                return (
                  <div
                    key={name}
                    className={`p-4 rounded-lg border border-gicm-border ${status.bg}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <StatusIcon className={`w-5 h-5 ${status.color}`} />
                        <span className="font-medium text-white capitalize">{name}</span>
                      </div>
                      <span className={`text-sm ${status.color}`}>{service.status}</span>
                    </div>
                    {service.latency !== undefined && (
                      <div className="text-gicm-muted text-sm mt-2">
                        Latency: {service.latency}ms
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Section>

          {/* Improvements */}
          <Section
            title={`Improvements (${scan.improvements.length})`}
            icon={Zap}
            expanded={expandedSections.has("improvements")}
            onToggle={() => toggleSection("improvements")}
          >
            <div className="space-y-3">
              {scan.improvements.map((imp) => (
                <div
                  key={imp.id}
                  className="p-4 rounded-lg border border-gicm-border bg-gicm-dark/50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getSeverityColor(imp.severity)}`}>
                          {imp.severity.toUpperCase()}
                        </span>
                        <span className="text-gicm-muted text-sm">{imp.category}</span>
                      </div>
                      <div className="font-medium text-white">{imp.title}</div>
                      <div className="text-gicm-muted text-sm mt-1">{imp.description}</div>
                      {imp.file && (
                        <div className="text-gicm-primary text-sm mt-2 font-mono">{imp.file}</div>
                      )}
                      {imp.suggestion && (
                        <div className="mt-2 p-2 bg-gicm-surface rounded text-sm text-green-400">
                          💡 {imp.suggestion}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* TypeScript Errors */}
          <Section
            title={`TypeScript Errors (${scan.typescript.totalErrors})`}
            icon={FileCode}
            expanded={expandedSections.has("typescript")}
            onToggle={() => toggleSection("typescript")}
          >
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {scan.typescript.errors.map((error, i) => (
                <div
                  key={i}
                  className="p-3 rounded-lg border border-red-500/20 bg-red-500/5 font-mono text-sm"
                >
                  <div className="flex items-center gap-2 text-red-400">
                    <XCircle className="w-4 h-4 flex-shrink-0" />
                    <span className="font-medium">{error.code}</span>
                  </div>
                  <div className="text-gicm-text mt-1">{error.message}</div>
                  <div className="text-gicm-muted text-xs mt-1">
                    {error.file}:{error.line}
                  </div>
                </div>
              ))}
              {scan.typescript.totalErrors > scan.typescript.errors.length && (
                <div className="text-gicm-muted text-center py-2">
                  ... and {scan.typescript.totalErrors - scan.typescript.errors.length} more errors
                </div>
              )}
            </div>
          </Section>

          {/* Test Results */}
          <Section
            title="Test Results"
            icon={TestTube}
            expanded={expandedSections.has("tests")}
            onToggle={() => toggleSection("tests")}
          >
            <div className="grid grid-cols-3 gap-4">
              {Object.entries(scan.tests).map(([name, results]) => (
                <div
                  key={name}
                  className="p-4 rounded-lg border border-gicm-border bg-gicm-dark/50"
                >
                  <div className="font-medium text-white capitalize mb-3">
                    {name.replace(/([A-Z])/g, " $1").trim()}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span className="text-green-400">{results.passed}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-red-500" />
                      <span className="text-red-400">{results.failed}</span>
                    </div>
                  </div>
                  <div className="mt-3 h-2 bg-gicm-surface rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 transition-all"
                      style={{
                        width: results.total > 0
                          ? `${(results.passed / results.total) * 100}%`
                          : "0%",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Code Quality */}
          <Section
            title="Code Quality"
            icon={Code}
            expanded={expandedSections.has("quality")}
            onToggle={() => toggleSection("quality")}
          >
            <div className="grid grid-cols-3 gap-4">
              <QualityCard
                title="Console Statements"
                count={scan.codeQuality.consoleStatements.length}
                items={scan.codeQuality.consoleStatements}
                color="yellow"
              />
              <QualityCard
                title="TODO Comments"
                count={scan.codeQuality.todoComments.length}
                items={scan.codeQuality.todoComments}
                color="blue"
              />
              <QualityCard
                title="Deprecated Patterns"
                count={scan.codeQuality.deprecatedPatterns.length}
                items={scan.codeQuality.deprecatedPatterns}
                color="red"
              />
            </div>
          </Section>
        </>
      )}
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  icon: React.ElementType;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-gicm-surface rounded-xl border border-gicm-border mb-4 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-gicm-dark/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5 text-gicm-primary" />
          <span className="font-medium text-white">{title}</span>
        </div>
        {expanded ? (
          <ChevronDown className="w-5 h-5 text-gicm-muted" />
        ) : (
          <ChevronRight className="w-5 h-5 text-gicm-muted" />
        )}
      </button>
      {expanded && <div className="p-4 pt-0">{children}</div>}
    </div>
  );
}

function QualityCard({
  title,
  count,
  items,
  color,
}: {
  title: string;
  count: number;
  items: string[];
  color: "yellow" | "blue" | "red";
}) {
  const colorClasses = {
    yellow: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
    blue: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    red: "text-red-400 bg-red-500/10 border-red-500/20",
  };

  return (
    <div className={`p-4 rounded-lg border ${colorClasses[color]}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="font-medium text-white">{title}</span>
        <span className={colorClasses[color].split(" ")[0]}>{count}</span>
      </div>
      <div className="space-y-1 max-h-32 overflow-y-auto text-xs font-mono text-gicm-muted">
        {items.slice(0, 5).map((item, i) => (
          <div key={i} className="truncate">{item}</div>
        ))}
        {items.length > 5 && (
          <div className="text-gicm-primary">+{items.length - 5} more</div>
        )}
      </div>
    </div>
  );
}
