"use client";

import { useState } from "react";
import { Send, Loader2, MessageSquare, Clock, DollarSign, Cpu, Users } from "lucide-react";
import { type BrainResponse, type ModeName } from "@/lib/api/opus67";

interface Opus67QueryPanelProps {
  onQuery: (query: string, options?: { forceMode?: ModeName; forceCouncil?: boolean }) => Promise<BrainResponse | null>;
  currentMode: ModeName;
  disabled?: boolean;
}

export function Opus67QueryPanel({ onQuery, currentMode, disabled }: Opus67QueryPanelProps) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<BrainResponse | null>(null);
  const [forceCouncil, setForceCouncil] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || disabled || loading) return;

    setLoading(true);
    setResponse(null);

    try {
      const result = await onQuery(query, { forceCouncil });
      setResponse(result);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gicm-card border border-gicm-border rounded-xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-gicm-primary/10">
          <MessageSquare className="w-5 h-5 text-gicm-primary" />
        </div>
        <div>
          <h3 className="font-semibold">Query BRAIN</h3>
          <p className="text-sm text-gray-400">Process a query through OPUS 67</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter your query..."
            rows={3}
            className="w-full px-4 py-3 bg-white/5 border border-gicm-border rounded-lg focus:outline-none focus:border-gicm-primary resize-none"
            disabled={disabled || loading}
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={forceCouncil}
              onChange={(e) => setForceCouncil(e.target.checked)}
              className="rounded border-gicm-border bg-white/5"
              disabled={disabled || loading}
            />
            <span className="text-sm text-gray-400 flex items-center gap-1">
              <Users className="w-3 h-3" />
              Force Council Deliberation
            </span>
          </label>

          <button
            type="submit"
            disabled={!query.trim() || disabled || loading}
            className="flex items-center gap-2 px-4 py-2 bg-gicm-primary text-black font-medium rounded-lg hover:bg-gicm-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send Query
              </>
            )}
          </button>
        </div>
      </form>

      {response && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <div className="flex items-center gap-1">
              <Cpu className="w-3 h-3" />
              {response.model}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {response.latencyMs.toFixed(0)}ms
            </div>
            <div className="flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              ${response.cost.toFixed(4)}
            </div>
            <div className="px-2 py-0.5 rounded bg-gicm-primary/20 text-gicm-primary text-xs uppercase">
              {response.mode}
            </div>
          </div>

          <div className="p-4 rounded-lg bg-white/5 border border-gicm-border">
            <div className="text-sm text-gray-400 mb-2">Response</div>
            <div className="text-white whitespace-pre-wrap">{response.response}</div>
          </div>

          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="p-3 rounded-lg bg-white/5 text-center">
              <div className="text-gray-400">Confidence</div>
              <div className="font-medium">{(response.modeConfidence * 100).toFixed(0)}%</div>
            </div>
            <div className="p-3 rounded-lg bg-white/5 text-center">
              <div className="text-gray-400">Complexity</div>
              <div className="font-medium">{response.complexityScore}/10</div>
            </div>
            <div className="p-3 rounded-lg bg-white/5 text-center">
              <div className="text-gray-400">Tokens</div>
              <div className="font-medium">{response.tokensUsed.input + response.tokensUsed.output}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
