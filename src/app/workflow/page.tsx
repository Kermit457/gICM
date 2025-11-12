"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles, Loader2, Check, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBundleStore } from "@/lib/store/bundle";
import type { RegistryItem } from "@/types/registry";
import { formatProductName } from "@/lib/utils";

interface WorkflowRecommendation {
  items: RegistryItem[];
  reasoning: string;
  totalTokenSavings: number;
  breakdown: {
    agents: number;
    skills: number;
    commands: number;
    mcps: number;
  };
}

export default function WorkflowPage() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<WorkflowRecommendation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { addItem, hasItem } = useBundleStore();

  const examples = [
    "I need a full-stack DeFi project with Solana backend and Next.js frontend",
    "Build a smart contract audit and security testing workflow",
    "Create a Web3 development environment with testing and deployment tools",
    "Set up an AI-powered code review and optimization pipeline",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);
    setRecommendation(null);

    try {
      // Get or create session ID
      let sessionId = sessionStorage.getItem('gicm-session-id');
      if (!sessionId) {
        sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem('gicm-session-id', sessionId);
      }

      const res = await fetch('/api/workflow/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, sessionId }),
      });

      const data = await res.json();

      // Handle rate limit
      if (res.status === 429) {
        setError(data.message || 'Rate limit exceeded. Please try again later.');
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate workflow');
      }

      setRecommendation(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = (item: RegistryItem) => {
    if (!hasItem(item.id)) {
      addItem(item);
    }
  };

  const handleAddAll = () => {
    if (recommendation) {
      recommendation.items.forEach(item => {
        if (!hasItem(item.id)) {
          addItem(item);
        }
      });
    }
  };

  return (
    <div className="min-h-screen radial-burst">
      {/* Header */}
      <div className="border-b border-black/20 bg-white/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-black/80 hover:text-black transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Marketplace
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 md:px-10 py-8 space-y-6">
        {/* Hero Section */}
        <div className="rounded-xl border border-black/20 bg-white/90 backdrop-blur p-8 text-center space-y-4">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-lime-500 to-emerald-500 text-white grid place-items-center mx-auto">
            <Sparkles className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-black">AI Workflow Builder</h1>
            <p className="text-black/60 mt-2">
              Describe your project in plain English, and Claude will recommend the perfect stack
            </p>
          </div>
        </div>

        {/* Input Form */}
        <div className="rounded-xl border border-black/20 bg-white/90 backdrop-blur p-6 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="prompt" className="block text-sm font-semibold text-black mb-2">
                Describe your project or workflow
              </label>
              <textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., I'm building a DeFi lending protocol on Solana with a React frontend. I need tools for smart contract development, testing, security auditing, and frontend integration..."
                className="w-full h-32 px-4 py-3 rounded-lg border border-black/20 bg-white text-black placeholder:text-black/40 focus:border-lime-500 focus:ring-2 focus:ring-lime-500/20 outline-none resize-none"
                disabled={loading}
              />
            </div>

            <Button
              type="submit"
              disabled={!prompt.trim() || loading}
              className="w-full bg-gradient-to-r from-lime-500 to-emerald-500 hover:from-lime-600 hover:to-emerald-600 text-black font-bold"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Claude is analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Generate Stack
                </>
              )}
            </Button>
          </form>

          {/* Examples */}
          <div className="pt-4 border-t border-black/10">
            <p className="text-xs font-semibold text-black/60 mb-2">Try these examples:</p>
            <div className="space-y-2">
              {examples.map((example, i) => (
                <button
                  key={i}
                  onClick={() => setPrompt(example)}
                  disabled={loading}
                  className="w-full text-left text-sm text-black/60 hover:text-black hover:bg-black/5 p-2 rounded transition-colors"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-50 p-6 text-center">
            <p className="text-red-600 font-medium">{error}</p>
          </div>
        )}

        {/* Recommendations */}
        {recommendation && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="rounded-xl border border-black/20 bg-white/90 backdrop-blur p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-black">Recommended Stack</h2>
                <Button
                  onClick={handleAddAll}
                  className="bg-lime-500 hover:bg-lime-600 text-black font-bold"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add All to Stack
                </Button>
              </div>

              {/* Reasoning */}
              <div className="p-4 rounded-lg bg-lime-500/10 border border-lime-500/20 mb-4">
                <p className="text-sm text-black/80 leading-relaxed">{recommendation.reasoning}</p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="p-3 rounded-lg bg-black/5">
                  <div className="text-2xl font-black text-black">{recommendation.items.length}</div>
                  <div className="text-xs text-black/60">Total Items</div>
                </div>
                <div className="p-3 rounded-lg bg-lime-500/10">
                  <div className="text-2xl font-black text-black">{recommendation.breakdown.agents}</div>
                  <div className="text-xs text-black/60">Agents</div>
                </div>
                <div className="p-3 rounded-lg bg-emerald-500/10">
                  <div className="text-2xl font-black text-black">{recommendation.breakdown.skills}</div>
                  <div className="text-xs text-black/60">Skills</div>
                </div>
                <div className="p-3 rounded-lg bg-teal-500/10">
                  <div className="text-2xl font-black text-black">{recommendation.breakdown.commands}</div>
                  <div className="text-xs text-black/60">Commands</div>
                </div>
                <div className="p-3 rounded-lg bg-cyan-500/10">
                  <div className="text-2xl font-black text-lime-600">{recommendation.totalTokenSavings}%</div>
                  <div className="text-xs text-black/60">Token Savings</div>
                </div>
              </div>
            </div>

            {/* Items List */}
            <div className="rounded-xl border border-black/20 bg-white/90 backdrop-blur p-6 space-y-3">
              <h3 className="text-lg font-bold text-black">Items in This Stack</h3>
              {recommendation.items.map((item) => {
                const inBundle = hasItem(item.id);
                return (
                  <div
                    key={item.id}
                    className={`flex items-start gap-4 p-4 rounded-lg border transition-colors ${
                      inBundle
                        ? "border-lime-500 bg-lime-500/10"
                        : "border-black/10 bg-white hover:border-lime-500/50"
                    }`}
                  >
                    <div className="h-12 w-12 rounded-xl bg-black text-lime-300 grid place-items-center font-black text-lg flex-shrink-0">
                      g
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-black">{formatProductName(item.name)}</h3>
                          <span className="px-2 py-0.5 rounded bg-black/10 text-black text-xs font-medium uppercase">
                            {item.kind}
                          </span>
                        </div>
                        <Button
                          onClick={() => handleAddItem(item)}
                          disabled={inBundle}
                          size="sm"
                          variant={inBundle ? "default" : "outline"}
                        >
                          {inBundle ? (
                            <>
                              <Check className="h-4 w-4 mr-1" />
                              Added
                            </>
                          ) : (
                            <>
                              <Plus className="h-4 w-4 mr-1" />
                              Add
                            </>
                          )}
                        </Button>
                      </div>
                      <p className="text-sm text-black/60 mt-2">{item.description}</p>
                      {item.tokenSavings && (
                        <p className="text-sm text-lime-600 font-medium mt-1">
                          {item.tokenSavings}% token savings
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
