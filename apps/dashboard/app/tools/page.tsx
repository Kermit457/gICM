"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Wrench,
  Zap,
  Bot,
  Filter,
  ArrowRight,
  Star,
  Download,
  RefreshCw,
  Copy,
  Check,
  Terminal,
  Box,
  Workflow,
  Clock,
  TrendingUp,
} from "lucide-react";

// Types
interface ToolDefinition {
  name: string;
  description: string;
  input_schema: {
    type: string;
    properties: Record<string, { type: string; description: string }>;
    required: string[];
  };
}

interface ToolResult {
  tool: ToolDefinition;
  metadata: {
    id: string;
    kind: string;
    category: string;
    tags: string[];
    install: string;
    platforms: string[];
    qualityScore: number;
    installs: number;
  };
  score: number;
}

interface SearchResponse {
  tools: ToolDefinition[];
  results: ToolResult[];
  meta: {
    query: string;
    totalMatches: number;
    searchTime: number;
    platform?: string;
    kind?: string;
  };
}

const KIND_ICONS: Record<string, typeof Bot> = {
  agent: Bot,
  tool: Wrench,
  block: Box,
  template: Workflow,
  integration: Zap,
  skill: Star,
};

const KIND_COLORS: Record<string, string> = {
  agent: "text-gicm-primary",
  tool: "text-blue-400",
  block: "text-purple-400",
  template: "text-green-400",
  integration: "text-orange-400",
  skill: "text-pink-400",
};

function SearchBar({
  query,
  setQuery,
  onSearch,
  loading,
}: {
  query: string;
  setQuery: (q: string) => void;
  onSearch: () => void;
  loading: boolean;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex-1 relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSearch()}
          placeholder="Search tools... (e.g., 'Solana token analysis', 'security audit')"
          className="w-full pl-12 pr-4 py-3 bg-gicm-card border border-gicm-border rounded-xl focus:outline-none focus:border-gicm-primary/50 transition-colors"
        />
      </div>
      <button
        onClick={onSearch}
        disabled={loading}
        className="px-6 py-3 bg-gicm-primary text-white rounded-xl hover:bg-gicm-primary/80 transition-colors flex items-center gap-2 disabled:opacity-50"
      >
        {loading ? (
          <RefreshCw className="w-5 h-5 animate-spin" />
        ) : (
          <Search className="w-5 h-5" />
        )}
        Search
      </button>
    </div>
  );
}

function Filters({
  kind,
  setKind,
  platform,
  setPlatform,
}: {
  kind: string;
  setKind: (k: string) => void;
  platform: string;
  setPlatform: (p: string) => void;
}) {
  const kinds = ["all", "agent", "tool", "block", "template", "integration", "skill"];
  const platforms = ["all", "claude", "gemini", "openai"];

  return (
    <div className="flex gap-4 items-center">
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-gray-400" />
        <span className="text-sm text-gray-400">Filter:</span>
      </div>
      <select
        value={kind}
        onChange={(e) => setKind(e.target.value)}
        className="px-3 py-2 bg-gicm-card border border-gicm-border rounded-lg text-sm focus:outline-none focus:border-gicm-primary/50"
      >
        {kinds.map((k) => (
          <option key={k} value={k}>
            {k === "all" ? "All Types" : k.charAt(0).toUpperCase() + k.slice(1)}
          </option>
        ))}
      </select>
      <select
        value={platform}
        onChange={(e) => setPlatform(e.target.value)}
        className="px-3 py-2 bg-gicm-card border border-gicm-border rounded-lg text-sm focus:outline-none focus:border-gicm-primary/50"
      >
        {platforms.map((p) => (
          <option key={p} value={p}>
            {p === "all" ? "All Platforms" : p.charAt(0).toUpperCase() + p.slice(1)}
          </option>
        ))}
      </select>
    </div>
  );
}

function ToolCard({ result }: { result: ToolResult }) {
  const [copied, setCopied] = useState(false);
  const Icon = KIND_ICONS[result.metadata.kind] || Wrench;
  const color = KIND_COLORS[result.metadata.kind] || "text-gray-400";

  const copyInstall = () => {
    navigator.clipboard.writeText(result.metadata.install);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-gicm-card border border-gicm-border rounded-xl p-5 hover:border-gicm-primary/30 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-white/5 ${color}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold">{result.tool.name.replace(/_/g, " ")}</h3>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className={`capitalize ${color}`}>{result.metadata.kind}</span>
              <span>•</span>
              <span>{result.metadata.category}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
          <Star className="w-3 h-3 text-yellow-400" />
          <span className="text-xs font-medium text-yellow-400">
            {result.metadata.qualityScore}
          </span>
        </div>
      </div>

      <p className="text-sm text-gray-400 mb-4 line-clamp-2">
        {result.tool.description.split(":")[1] || result.tool.description}
      </p>

      <div className="flex flex-wrap gap-1 mb-4">
        {result.metadata.tags.slice(0, 4).map((tag) => (
          <span
            key={tag}
            className="px-2 py-0.5 text-xs bg-white/5 rounded-full text-gray-400"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Download className="w-3 h-3" />
            {result.metadata.installs.toLocaleString()}
          </span>
          <span className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            Score: {Math.round(result.score)}
          </span>
        </div>
        <button
          onClick={copyInstall}
          className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-green-400" />
              <span className="text-green-400">Copied!</span>
            </>
          ) : (
            <>
              <Terminal className="w-3 h-3" />
              Install
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function SearchMeta({ meta }: { meta: SearchResponse["meta"] | null }) {
  if (!meta) return null;

  return (
    <div className="flex items-center gap-4 text-sm text-gray-500">
      <span className="flex items-center gap-1">
        <Search className="w-4 h-4" />
        {meta.totalMatches} results
      </span>
      <span className="flex items-center gap-1">
        <Clock className="w-4 h-4" />
        {meta.searchTime.toFixed(2)}ms
      </span>
      {meta.platform && meta.platform !== "all" && (
        <span className="px-2 py-0.5 bg-blue-500/10 rounded text-blue-400 text-xs">
          {meta.platform}
        </span>
      )}
      {meta.kind && meta.kind !== "all" && (
        <span className="px-2 py-0.5 bg-purple-500/10 rounded text-purple-400 text-xs">
          {meta.kind}
        </span>
      )}
    </div>
  );
}

function ToolDefinitionsPanel({ tools }: { tools: ToolDefinition[] }) {
  const [copied, setCopied] = useState(false);

  const copyDefinitions = () => {
    navigator.clipboard.writeText(JSON.stringify(tools, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (tools.length === 0) return null;

  return (
    <div className="bg-gicm-card border border-gicm-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Terminal className="w-5 h-5 text-gicm-primary" />
          Tool Definitions (Claude-compatible)
        </h3>
        <button
          onClick={copyDefinitions}
          className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-green-400" />
              <span className="text-green-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              Copy JSON
            </>
          )}
        </button>
      </div>
      <div className="bg-black/30 rounded-lg p-4 overflow-x-auto max-h-64 overflow-y-auto">
        <pre className="text-xs text-gray-400 font-mono">
          {JSON.stringify(tools, null, 2)}
        </pre>
      </div>
      <p className="text-xs text-gray-500 mt-3">
        These tool definitions can be used directly with Claude's API. Copy and paste into your tools array.
      </p>
    </div>
  );
}

function QuickStats({ results }: { results: ToolResult[] }) {
  const byKind = results.reduce(
    (acc, r) => {
      acc[r.metadata.kind] = (acc[r.metadata.kind] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const avgScore = results.length
    ? Math.round(results.reduce((sum, r) => sum + r.metadata.qualityScore, 0) / results.length)
    : 0;

  return (
    <div className="grid grid-cols-4 gap-4">
      <div className="bg-gicm-card border border-gicm-border rounded-xl p-4">
        <div className="text-sm text-gray-400 mb-1">Results</div>
        <div className="text-2xl font-bold text-gicm-primary">{results.length}</div>
      </div>
      <div className="bg-gicm-card border border-gicm-border rounded-xl p-4">
        <div className="text-sm text-gray-400 mb-1">Agents</div>
        <div className="text-2xl font-bold text-blue-400">{byKind.agent || 0}</div>
      </div>
      <div className="bg-gicm-card border border-gicm-border rounded-xl p-4">
        <div className="text-sm text-gray-400 mb-1">Tools</div>
        <div className="text-2xl font-bold text-purple-400">{byKind.tool || 0}</div>
      </div>
      <div className="bg-gicm-card border border-gicm-border rounded-xl p-4">
        <div className="text-sm text-gray-400 mb-1">Avg Quality</div>
        <div className="text-2xl font-bold text-green-400">{avgScore}</div>
      </div>
    </div>
  );
}

export default function ToolsPage() {
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("all");
  const [platform, setPlatform] = useState("all");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<SearchResponse | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        query: query.trim(),
        limit: "10",
      });
      if (kind !== "all") params.set("kind", kind);
      if (platform !== "all") params.set("platform", platform);

      const res = await fetch(`/api/tools/search?${params}`);
      if (res.ok) {
        const data = await res.json();
        setResponse(data);
      }
    } catch (error) {
      console.error("Search error:", error);
    }
    setLoading(false);
  }, [query, kind, platform]);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading Tools...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gicm-primary/10">
              <Search className="w-6 h-6 text-gicm-primary" />
            </div>
            Tool Search Tool
          </h1>
          <p className="text-gray-400 mt-1 ml-12">
            Discover tools from 513+ agents with 85% context reduction
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-full text-sm text-green-400">
          <Zap className="w-4 h-4" />
          PTC Ready
        </div>
      </div>

      {/* Search */}
      <div className="space-y-4">
        <SearchBar
          query={query}
          setQuery={setQuery}
          onSearch={handleSearch}
          loading={loading}
        />
        <Filters
          kind={kind}
          setKind={setKind}
          platform={platform}
          setPlatform={setPlatform}
        />
      </div>

      {/* Results */}
      {response && (
        <>
          <SearchMeta meta={response.meta} />
          <QuickStats results={response.results} />

          <div className="grid grid-cols-2 gap-4">
            {response.results.map((result) => (
              <ToolCard key={result.metadata.id} result={result} />
            ))}
          </div>

          <ToolDefinitionsPanel tools={response.tools} />
        </>
      )}

      {/* Empty State */}
      {!response && !loading && (
        <div className="bg-gicm-card border border-gicm-border rounded-xl p-12 text-center">
          <Search className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Search for Tools</h3>
          <p className="text-gray-400 max-w-md mx-auto mb-6">
            Enter a query to discover relevant tools from the gICM marketplace.
            Results include Claude-compatible tool definitions.
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {[
              "Solana token analysis",
              "Security audit",
              "Twitter automation",
              "Portfolio management",
              "Content generation",
            ].map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => {
                  setQuery(suggestion);
                  handleSearch();
                }}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm transition-colors flex items-center gap-2"
              >
                {suggestion}
                <ArrowRight className="w-3 h-3" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
