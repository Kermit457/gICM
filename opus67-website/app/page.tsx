"use client";

import dynamic from "next/dynamic";

const SkillGalaxy = dynamic(() => import("../components/skill-galaxy"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] md:h-[600px] lg:h-[800px] flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-4">Loading 3D Galaxy...</div>
        <div className="text-gray-500">Initializing Three.js scene</div>
      </div>
    </div>
  ),
});

export default function Home() {
  return (
    <main className="bg-black text-white">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 md:px-6 lg:px-8 py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-950/5 to-black" />

        <div className="relative z-10 max-w-6xl mx-auto w-full text-center space-y-12">
          {/* Version Badge */}
          <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full glass border border-blue-500/20">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-sm font-medium text-blue-400">v4.1 — 130 Skills • 48 MCPs • 82 Agents</span>
          </div>

          {/* Main Headline */}
          <div className="space-y-8">
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight">
              Claude + <span className="text-blue-500">Superpowers</span>
            </h1>
            <p className="text-lg md:text-xl lg:text-2xl text-gray-400 max-w-3xl mx-auto">
              4ms routing. 566x faster. 56% token savings.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-blue-500 mb-2 tabular-nums">4ms</div>
              <div className="text-sm text-gray-500">routing</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-blue-400 mb-2 tabular-nums">566x</div>
              <div className="text-sm text-gray-500">faster</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-blue-500 mb-2 tabular-nums">56%</div>
              <div className="text-sm text-gray-500">savings</div>
            </div>
          </div>

          {/* Install Command */}
          <div className="max-w-md mx-auto">
            <div className="glass rounded-2xl p-6 border border-blue-500/20">
              <code className="text-blue-400 text-base md:text-lg font-mono">npx create-opus67@latest</code>
            </div>
          </div>

          {/* CTA Button */}
          <div>
            <button className="px-10 py-4 bg-blue-500 hover:bg-blue-600 rounded-xl text-white font-semibold text-lg transition-colors">
              Get Started Free
            </button>
          </div>
        </div>
      </section>

      {/* Problem vs Solution */}
      <section className="py-24 px-4 md:px-6 lg:px-8 bg-[#050505]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">
            The <span className="text-blue-500">Problem</span>
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Without */}
            <div className="glass rounded-3xl p-8 border border-red-500/20 space-y-6 h-full">
              <div className="text-red-400 text-xs font-semibold uppercase tracking-wider">Without OPUS 67</div>
              <h3 className="text-2xl font-bold">Slow LLM Routing</h3>
              <div className="space-y-5">
                {[
                  { title: "1200ms routing", desc: "Claude Opus is slow" },
                  { title: "$0.05 per query", desc: "Expensive API calls" },
                  { title: "Token waste", desc: "Burns your budget" }
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-red-400 text-sm">✗</span>
                    </div>
                    <div>
                      <div className="font-semibold text-red-300">{item.title}</div>
                      <div className="text-sm text-gray-500">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* With */}
            <div className="glass rounded-3xl p-8 border border-blue-500/30 space-y-6 h-full glow-blue">
              <div className="text-blue-500 text-xs font-semibold uppercase tracking-wider">With OPUS 67</div>
              <h3 className="text-2xl font-bold">Lightning Fast</h3>
              <div className="space-y-5">
                {[
                  { title: "4ms routing", desc: "566x faster" },
                  { title: "$0.00 per query", desc: "100% FREE" },
                  { title: "56% savings", desc: "Smart context" }
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-blue-500 text-sm">✓</span>
                    </div>
                    <div>
                      <div className="font-semibold text-blue-400">{item.title}</div>
                      <div className="text-sm text-gray-400">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benchmark */}
      <section className="py-24 px-4 md:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">
            Live <span className="text-blue-500">Benchmark</span>
          </h2>

          <div className="glass rounded-3xl p-10 border border-blue-500/20 space-y-8">
            {/* OPUS 67 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <span className="text-2xl">⚡</span>
                  </div>
                  <span className="font-semibold text-lg">OPUS 67</span>
                </div>
                <span className="text-blue-500 font-bold text-xl tabular-nums">4ms</span>
              </div>
              <div className="h-8 bg-gray-900/50 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full" style={{ width: '100%' }} />
              </div>
            </div>

            {/* Claude Opus */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center">
                    <span className="text-2xl">🐌</span>
                  </div>
                  <span className="font-semibold text-lg">Claude Opus</span>
                </div>
                <span className="text-orange-400 font-bold text-xl tabular-nums">1200ms</span>
              </div>
              <div className="h-8 bg-gray-900/50 rounded-full overflow-hidden">
                <div className="h-full bg-orange-500 rounded-full" style={{ width: '15%' }} />
              </div>
            </div>

            {/* o1-preview */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                    <span className="text-2xl">🐢</span>
                  </div>
                  <span className="font-semibold text-lg">o1-preview</span>
                </div>
                <span className="text-red-400 font-bold text-xl tabular-nums">3000ms</span>
              </div>
              <div className="h-8 bg-gray-900/50 rounded-full overflow-hidden">
                <div className="h-full bg-red-500 rounded-full" style={{ width: '8%' }} />
              </div>
            </div>

            <div className="pt-8 border-t border-gray-800 text-center">
              <div className="text-3xl font-bold text-blue-500 mb-2">566x Faster</div>
              <div className="text-gray-400">than o1-preview</div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-24 px-4 md:px-6 lg:px-8 bg-[#050505]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">
            Real <span className="text-blue-500">Performance</span>
          </h2>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { value: "100%", label: "Routing Accuracy" },
              { value: "96%", label: "Code Compiles" },
              { value: "56%", label: "Token Savings" },
              { value: "$135K", label: "Saved/Year" }
            ].map((stat, i) => (
              <div key={i} className="glass rounded-3xl p-8 border border-white/10 text-center space-y-3">
                <div className="text-4xl font-bold text-blue-500 tabular-nums">{stat.value}</div>
                <div className="text-sm text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3D Skill Galaxy */}
      <section className="py-24 px-4 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold">
              Explore 130 <span className="text-blue-500">Skills</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Interactive 3D skill galaxy. Rotate, zoom, and discover.
            </p>
          </div>

          <div className="rounded-3xl overflow-hidden">
            <SkillGalaxy />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-4 md:px-6 lg:px-8 bg-[#050505]">
        <div className="max-w-6xl mx-auto text-center space-y-12">
          <div className="space-y-8">
            <h2 className="text-5xl md:text-6xl font-bold">
              Ready to <span className="text-blue-500">upgrade</span>?
            </h2>
            <p className="text-xl text-gray-400">
              Join developers saving $135K/year with OPUS 67
            </p>
          </div>

          <div className="max-w-md mx-auto">
            <div className="glass rounded-2xl p-6 border border-blue-500/20">
              <code className="text-blue-400 text-base md:text-lg font-mono">npx create-opus67@latest</code>
            </div>
          </div>

          <button className="px-10 py-4 bg-blue-500 hover:bg-blue-600 rounded-xl text-white font-semibold text-lg transition-colors">
            Get Started Free
          </button>
        </div>
      </section>
    </main>
  );
}
