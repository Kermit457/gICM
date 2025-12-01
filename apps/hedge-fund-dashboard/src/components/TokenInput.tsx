"use client";

import { useState } from "react";
import { Search, Loader2 } from "lucide-react";

interface TokenInputProps {
  onAnalyze: (token: string, mode: "full" | "fast" | "degen") => void;
  isLoading: boolean;
}

export function TokenInput({ onAnalyze, isLoading }: TokenInputProps) {
  const [token, setToken] = useState("");
  const [mode, setMode] = useState<"full" | "fast" | "degen">("full");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (token.trim()) {
      onAnalyze(token.trim().toUpperCase(), mode);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
          <input
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Enter token (SOL, BONK, WIF...)"
            className="w-full pl-10 pr-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
            disabled={isLoading}
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || !token.trim()}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:cursor-not-allowed rounded-lg font-medium text-white transition-colors flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Analyzing...
            </>
          ) : (
            "Analyze"
          )}
        </button>
      </div>

      <div className="flex gap-2">
        {(["full", "fast", "degen"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === m
                ? "bg-blue-600 text-white"
                : "bg-zinc-800 text-zinc-400 hover:text-white"
            }`}
          >
            {m === "full" && "Full Analysis (12 agents)"}
            {m === "fast" && "Quick Signal (3 agents)"}
            {m === "degen" && "Degen Mode (meme focus)"}
          </button>
        ))}
      </div>
    </form>
  );
}
