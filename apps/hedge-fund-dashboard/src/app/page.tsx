"use client";

import { useState } from "react";
import { TokenInput } from "@/components/TokenInput";
import { SignalCard } from "@/components/SignalCard";
import { MarketDataPanel } from "@/components/MarketDataPanel";
import { FinalDecisionPanel } from "@/components/FinalDecisionPanel";
import { SentimentGauge } from "@/components/SentimentGauge";
import { analyzeToken, type AnalysisResult } from "@/lib/api";
import { Bot, Zap, Brain } from "lucide-react";

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async (token: string, mode: "full" | "fast" | "degen") => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await analyzeToken(token, "solana", mode);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">AI Hedge Fund</h1>
              <p className="text-xs text-zinc-500">12 agents | Famous investor personas</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            API Connected
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Token Input */}
        <div className="mb-8">
          <TokenInput onAnalyze={handleAnalyze} isLoading={isLoading} />
        </div>

        {/* Error */}
        {error && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-zinc-700 rounded-full animate-spin border-t-blue-500" />
              <Bot className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-blue-500" />
            </div>
            <p className="mt-4 text-zinc-400">Running 12 AI agents...</p>
            <p className="text-sm text-zinc-600">
              Warren Buffett, Michael Burry, Ansem, and more
            </p>
          </div>
        )}

        {/* Results */}
        {result && !isLoading && (
          <div className="space-y-6">
            {/* Token header */}
            <div className="flex items-center gap-4">
              <h2 className="text-3xl font-bold text-white">{result.token}</h2>
              <span className="px-3 py-1 bg-zinc-800 rounded-full text-sm text-zinc-400">
                {result.chain}
              </span>
            </div>

            {/* Market data */}
            <MarketDataPanel data={result.market_data} />

            {/* Two column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: Final decision + Sentiment */}
              <div className="lg:col-span-1 space-y-6">
                <FinalDecisionPanel
                  decision={result.final_decision}
                  token={result.token}
                />
                <SentimentGauge signals={result.agent_signals} />
              </div>

              {/* Right: Agent signals */}
              <div className="lg:col-span-2">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  Agent Signals ({result.agent_signals.length})
                </h3>
                <div className="space-y-3">
                  {result.agent_signals.map((signal, i) => (
                    <SignalCard key={i} signal={signal} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!result && !isLoading && !error && (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-600/20 flex items-center justify-center">
              <Brain className="w-10 h-10 text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Multi-Agent Trading Analysis
            </h2>
            <p className="text-zinc-400 max-w-md mx-auto mb-8">
              Enter a token symbol to get analysis from 12 AI agents including
              Warren Buffett, Michael Burry, Ansem-style pump trader, and more.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {["SOL", "BONK", "WIF", "JUP", "FARTCOIN"].map((token) => (
                <button
                  key={token}
                  onClick={() => handleAnalyze(token, "full")}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm text-zinc-300 transition-colors"
                >
                  {token}
                </button>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-zinc-600">
          <p>AI Hedge Fund by gICM | Not financial advice</p>
        </div>
      </footer>
    </div>
  );
}
