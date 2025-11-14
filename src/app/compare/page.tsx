"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  XCircle,
  MinusCircle,
  Github,
  ExternalLink,
  ArrowLeft,
  Trophy,
  Target,
  Zap,
  Shield
} from "lucide-react";
import { REGISTRY } from "@/lib/registry";
import { WORKFLOWS } from "@/lib/workflows";

export default function ComparePage() {
  const stats = {
    agents: REGISTRY.filter(item => item.kind === 'agent').length,
    skills: REGISTRY.filter(item => item.kind === 'skill').length,
    commands: REGISTRY.filter(item => item.kind === 'command').length,
    workflows: WORKFLOWS.length,
    mcps: REGISTRY.filter(item => item.kind === 'mcp').length,
    settings: REGISTRY.filter(item => item.kind === 'setting').length,
  };

  const totalPlugins = stats.agents + stats.skills + stats.commands + stats.mcps + stats.settings;

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black">
      {/* Navigation */}
      <nav className="border-b border-white/10 bg-black/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-black text-white">
              gICM<span className="text-lime-300">.ai</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" className="text-white hover:text-lime-300">
                  <ArrowLeft size={16} className="mr-2" />
                  Back to Marketplace
                </Button>
              </Link>
              <a href="https://github.com/Kermit457/gICM" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="border-white/20 text-white hover:border-lime-300">
                  <Github size={16} className="mr-2" />
                  GitHub
                </Button>
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-20 pb-12 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <Badge className="bg-lime-300/20 text-lime-300 border-lime-300/50 mb-6 px-4 py-2">
            <Trophy className="w-4 h-4 mr-2" />
            Competitive Analysis
          </Badge>

          <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight">
            Why gICM <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-300 to-emerald-300">Dominates</span>
          </h1>

          <p className="text-xl md:text-2xl text-zinc-300 max-w-3xl mx-auto mb-12">
            The only Claude Code marketplace built specifically for ICM launches, crypto trading, and Web3 development.
          </p>

          {/* Quick Stats Comparison */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-12">
            <div className="bg-gradient-to-br from-lime-300/10 to-emerald-300/5 backdrop-blur border border-lime-300/30 rounded-lg p-6">
              <div className="text-3xl font-black text-white mb-1">{totalPlugins}</div>
              <div className="text-sm text-zinc-400">Total Plugins</div>
              <Badge className="mt-2 bg-lime-300/20 text-lime-300 border-none text-xs">VERIFIED</Badge>
            </div>
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-lg p-6">
              <div className="text-3xl font-black text-white mb-1">{stats.agents}</div>
              <div className="text-sm text-zinc-400">Agents</div>
            </div>
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-lg p-6">
              <div className="text-3xl font-black text-white mb-1">{stats.workflows}</div>
              <div className="text-sm text-zinc-400">Workflows</div>
            </div>
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-lg p-6">
              <div className="text-3xl font-black text-white mb-1">88-92%</div>
              <div className="text-sm text-zinc-400">Token Savings</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Comparison Table */}
      <section className="py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-8 text-center">
            Feature Comparison
          </h2>

          <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5">
                    <th className="text-left p-6 text-white font-bold sticky left-0 bg-zinc-900/90 backdrop-blur">Feature</th>
                    <th className="text-center p-6 text-zinc-400 font-bold min-w-[120px]">
                      <div className="flex flex-col items-center gap-2">
                        <span>wshobson/agents</span>
                        <span className="text-xs font-normal text-zinc-500">19.2k ⭐</span>
                      </div>
                    </th>
                    <th className="text-center p-6 text-zinc-400 font-bold min-w-[120px]">
                      <div className="flex flex-col items-center gap-2">
                        <span>anthropics</span>
                        <span className="text-xs font-normal text-zinc-500">41.5k ⭐</span>
                      </div>
                    </th>
                    <th className="text-center p-6 text-zinc-400 font-bold min-w-[120px]">
                      <div className="flex flex-col items-center gap-2">
                        <span>davila7</span>
                        <span className="text-xs font-normal text-zinc-500">600+ templates</span>
                      </div>
                    </th>
                    <th className="text-center p-6 text-lime-300 font-bold min-w-[120px]">
                      <div className="flex flex-col items-center gap-2">
                        <span>gICM</span>
                        <Trophy className="w-4 h-4" />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="text-zinc-300">
                  {/* Infrastructure */}
                  <tr className="border-b border-white/5 bg-white/[0.02]">
                    <td colSpan={5} className="p-4 text-lime-300 font-bold text-sm uppercase tracking-wide">
                      Infrastructure
                    </td>
                  </tr>
                  <tr className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="p-6 sticky left-0 bg-zinc-900/90 backdrop-blur">Agent System</td>
                    <td className="p-6 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <CheckCircle2 className="text-lime-400" size={20} />
                        <span className="text-xs text-zinc-500">85 agents</span>
                      </div>
                    </td>
                    <td className="p-6 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <CheckCircle2 className="text-lime-400" size={20} />
                        <span className="text-xs text-zinc-500">9 agents</span>
                      </div>
                    </td>
                    <td className="p-6 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <CheckCircle2 className="text-lime-400" size={20} />
                        <span className="text-xs text-zinc-500">600+ templates</span>
                      </div>
                    </td>
                    <td className="p-6 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <CheckCircle2 className="text-lime-300" size={20} />
                        <span className="text-xs text-lime-400 font-bold">{stats.agents} agents</span>
                      </div>
                    </td>
                  </tr>
                  <tr className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="p-6 sticky left-0 bg-zinc-900/90 backdrop-blur">Skills Architecture</td>
                    <td className="p-6 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <CheckCircle2 className="text-lime-400" size={20} />
                        <span className="text-xs text-zinc-500">47 skills</span>
                      </div>
                    </td>
                    <td className="p-6 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <CheckCircle2 className="text-lime-400" size={20} />
                        <span className="text-xs text-zinc-500">Official</span>
                      </div>
                    </td>
                    <td className="p-6 text-center"><XCircle className="inline text-red-400" size={20} /></td>
                    <td className="p-6 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <CheckCircle2 className="text-lime-300" size={20} />
                        <span className="text-xs text-lime-400 font-bold">{stats.skills} skills</span>
                      </div>
                    </td>
                  </tr>
                  <tr className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="p-6 sticky left-0 bg-zinc-900/90 backdrop-blur">Commands/Tools</td>
                    <td className="p-6 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <CheckCircle2 className="text-lime-400" size={20} />
                        <span className="text-xs text-zinc-500">44 tools</span>
                      </div>
                    </td>
                    <td className="p-6 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <CheckCircle2 className="text-lime-400" size={20} />
                        <span className="text-xs text-zinc-500">Official</span>
                      </div>
                    </td>
                    <td className="p-6 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <CheckCircle2 className="text-lime-400" size={20} />
                        <span className="text-xs text-zinc-500">159+ commands</span>
                      </div>
                    </td>
                    <td className="p-6 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <CheckCircle2 className="text-lime-300" size={20} />
                        <span className="text-xs text-lime-400 font-bold">{stats.commands} commands</span>
                      </div>
                    </td>
                  </tr>
                  <tr className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="p-6 sticky left-0 bg-zinc-900/90 backdrop-blur">Workflow Orchestrators</td>
                    <td className="p-6 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <CheckCircle2 className="text-lime-400" size={20} />
                        <span className="text-xs text-zinc-500">15 workflows</span>
                      </div>
                    </td>
                    <td className="p-6 text-center"><XCircle className="inline text-red-400" size={20} /></td>
                    <td className="p-6 text-center"><XCircle className="inline text-red-400" size={20} /></td>
                    <td className="p-6 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <CheckCircle2 className="text-lime-300" size={20} />
                        <span className="text-xs text-lime-400 font-bold">{stats.workflows} workflows</span>
                      </div>
                    </td>
                  </tr>
                  <tr className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="p-6 sticky left-0 bg-zinc-900/90 backdrop-blur">MCP Integrations</td>
                    <td className="p-6 text-center"><MinusCircle className="inline text-zinc-600" size={20} /></td>
                    <td className="p-6 text-center"><MinusCircle className="inline text-zinc-600" size={20} /></td>
                    <td className="p-6 text-center"><MinusCircle className="inline text-zinc-600" size={20} /></td>
                    <td className="p-6 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <CheckCircle2 className="text-lime-300" size={20} />
                        <span className="text-xs text-lime-400 font-bold">{stats.mcps} MCPs</span>
                      </div>
                    </td>
                  </tr>
                  <tr className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="p-6 sticky left-0 bg-zinc-900/90 backdrop-blur">Progressive Disclosure</td>
                    <td className="p-6 text-center"><XCircle className="inline text-red-400" size={20} /></td>
                    <td className="p-6 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <CheckCircle2 className="text-lime-400" size={20} />
                        <span className="text-xs text-zinc-500">Official feature</span>
                      </div>
                    </td>
                    <td className="p-6 text-center"><XCircle className="inline text-red-400" size={20} /></td>
                    <td className="p-6 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <CheckCircle2 className="text-lime-300" size={20} />
                        <span className="text-xs text-lime-400 font-bold">88-92% savings</span>
                      </div>
                    </td>
                  </tr>

                  {/* ICM/Crypto Features */}
                  <tr className="border-b border-white/5 bg-white/[0.02]">
                    <td colSpan={5} className="p-4 text-lime-300 font-bold text-sm uppercase tracking-wide">
                      <div className="flex items-center gap-2">
                        <Target size={16} />
                        ICM & Crypto Features
                      </div>
                    </td>
                  </tr>
                  <tr className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="p-6 sticky left-0 bg-zinc-900/90 backdrop-blur">ICM/Crypto Focus</td>
                    <td className="p-6 text-center"><XCircle className="inline text-red-400" size={20} /></td>
                    <td className="p-6 text-center"><XCircle className="inline text-red-400" size={20} /></td>
                    <td className="p-6 text-center"><XCircle className="inline text-red-400" size={20} /></td>
                    <td className="p-6 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <CheckCircle2 className="text-lime-300" size={20} />
                        <Badge className="bg-lime-300/20 text-lime-300 border-none text-xs">ONLY ONE</Badge>
                      </div>
                    </td>
                  </tr>
                  <tr className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="p-6 sticky left-0 bg-zinc-900/90 backdrop-blur">Rug Detection</td>
                    <td className="p-6 text-center"><XCircle className="inline text-red-400" size={20} /></td>
                    <td className="p-6 text-center"><XCircle className="inline text-red-400" size={20} /></td>
                    <td className="p-6 text-center"><XCircle className="inline text-red-400" size={20} /></td>
                    <td className="p-6 text-center"><CheckCircle2 className="inline text-lime-300" size={20} /></td>
                  </tr>
                  <tr className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="p-6 sticky left-0 bg-zinc-900/90 backdrop-blur">Whale Tracking</td>
                    <td className="p-6 text-center"><XCircle className="inline text-red-400" size={20} /></td>
                    <td className="p-6 text-center"><XCircle className="inline text-red-400" size={20} /></td>
                    <td className="p-6 text-center"><XCircle className="inline text-red-400" size={20} /></td>
                    <td className="p-6 text-center"><CheckCircle2 className="inline text-lime-300" size={20} /></td>
                  </tr>
                  <tr className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="p-6 sticky left-0 bg-zinc-900/90 backdrop-blur">Pump.fun Integration</td>
                    <td className="p-6 text-center"><XCircle className="inline text-red-400" size={20} /></td>
                    <td className="p-6 text-center"><XCircle className="inline text-red-400" size={20} /></td>
                    <td className="p-6 text-center"><XCircle className="inline text-red-400" size={20} /></td>
                    <td className="p-6 text-center"><CheckCircle2 className="inline text-lime-300" size={20} /></td>
                  </tr>
                  <tr className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="p-6 sticky left-0 bg-zinc-900/90 backdrop-blur">Social Sentiment Analysis</td>
                    <td className="p-6 text-center"><XCircle className="inline text-red-400" size={20} /></td>
                    <td className="p-6 text-center"><XCircle className="inline text-red-400" size={20} /></td>
                    <td className="p-6 text-center"><XCircle className="inline text-red-400" size={20} /></td>
                    <td className="p-6 text-center"><CheckCircle2 className="inline text-lime-300" size={20} /></td>
                  </tr>
                  <tr className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="p-6 sticky left-0 bg-zinc-900/90 backdrop-blur">DexScreener API</td>
                    <td className="p-6 text-center"><XCircle className="inline text-red-400" size={20} /></td>
                    <td className="p-6 text-center"><XCircle className="inline text-red-400" size={20} /></td>
                    <td className="p-6 text-center"><XCircle className="inline text-red-400" size={20} /></td>
                    <td className="p-6 text-center"><CheckCircle2 className="inline text-lime-300" size={20} /></td>
                  </tr>
                  <tr className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="p-6 sticky left-0 bg-zinc-900/90 backdrop-blur">Community Growth Automation</td>
                    <td className="p-6 text-center"><XCircle className="inline text-red-400" size={20} /></td>
                    <td className="p-6 text-center"><XCircle className="inline text-red-400" size={20} /></td>
                    <td className="p-6 text-center"><XCircle className="inline text-red-400" size={20} /></td>
                    <td className="p-6 text-center"><CheckCircle2 className="inline text-lime-300" size={20} /></td>
                  </tr>
                  <tr className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="p-6 sticky left-0 bg-zinc-900/90 backdrop-blur">KOL Influence Scoring</td>
                    <td className="p-6 text-center"><XCircle className="inline text-red-400" size={20} /></td>
                    <td className="p-6 text-center"><XCircle className="inline text-red-400" size={20} /></td>
                    <td className="p-6 text-center"><XCircle className="inline text-red-400" size={20} /></td>
                    <td className="p-6 text-center"><CheckCircle2 className="inline text-lime-300" size={20} /></td>
                  </tr>

                  {/* Distribution */}
                  <tr className="border-b border-white/5 bg-white/[0.02]">
                    <td colSpan={5} className="p-4 text-lime-300 font-bold text-sm uppercase tracking-wide">
                      Distribution & Installation
                    </td>
                  </tr>
                  <tr className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="p-6 sticky left-0 bg-zinc-900/90 backdrop-blur">Claude Code Marketplace</td>
                    <td className="p-6 text-center"><CheckCircle2 className="inline text-lime-400" size={20} /></td>
                    <td className="p-6 text-center"><CheckCircle2 className="inline text-lime-400" size={20} /></td>
                    <td className="p-6 text-center"><CheckCircle2 className="inline text-lime-400" size={20} /></td>
                    <td className="p-6 text-center"><CheckCircle2 className="inline text-lime-300" size={20} /></td>
                  </tr>
                  <tr className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="p-6 sticky left-0 bg-zinc-900/90 backdrop-blur">Standalone CLI Tool</td>
                    <td className="p-6 text-center"><XCircle className="inline text-red-400" size={20} /></td>
                    <td className="p-6 text-center"><XCircle className="inline text-red-400" size={20} /></td>
                    <td className="p-6 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <CheckCircle2 className="text-lime-400" size={20} />
                        <span className="text-xs text-zinc-500">npx claude-code-templates</span>
                      </div>
                    </td>
                    <td className="p-6 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <CheckCircle2 className="text-lime-300" size={20} />
                        <span className="text-xs text-lime-400 font-bold">npx @gicm/cli</span>
                      </div>
                    </td>
                  </tr>
                  <tr className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="p-6 sticky left-0 bg-zinc-900/90 backdrop-blur">Web Interface</td>
                    <td className="p-6 text-center"><XCircle className="inline text-red-400" size={20} /></td>
                    <td className="p-6 text-center"><XCircle className="inline text-red-400" size={20} /></td>
                    <td className="p-6 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <CheckCircle2 className="text-lime-400" size={20} />
                        <span className="text-xs text-zinc-500">aitmpl.com</span>
                      </div>
                    </td>
                    <td className="p-6 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <CheckCircle2 className="text-lime-300" size={20} />
                        <span className="text-xs text-lime-400 font-bold">gicm-marketplace.vercel.app</span>
                      </div>
                    </td>
                  </tr>
                  <tr className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="p-6 sticky left-0 bg-zinc-900/90 backdrop-blur">NPM Package Published</td>
                    <td className="p-6 text-center"><XCircle className="inline text-red-400" size={20} /></td>
                    <td className="p-6 text-center"><XCircle className="inline text-red-400" size={20} /></td>
                    <td className="p-6 text-center"><CheckCircle2 className="inline text-lime-400" size={20} /></td>
                    <td className="p-6 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <CheckCircle2 className="text-lime-300" size={20} />
                        <span className="text-xs text-lime-400 font-bold">@gicm/cli@1.0.0</span>
                      </div>
                    </td>
                  </tr>

                  {/* Documentation */}
                  <tr className="border-b border-white/5 bg-white/[0.02]">
                    <td colSpan={5} className="p-4 text-lime-300 font-bold text-sm uppercase tracking-wide">
                      Documentation & Support
                    </td>
                  </tr>
                  <tr className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="p-6 sticky left-0 bg-zinc-900/90 backdrop-blur">Installation Guide</td>
                    <td className="p-6 text-center"><CheckCircle2 className="inline text-lime-400" size={20} /></td>
                    <td className="p-6 text-center"><CheckCircle2 className="inline text-lime-400" size={20} /></td>
                    <td className="p-6 text-center"><CheckCircle2 className="inline text-lime-400" size={20} /></td>
                    <td className="p-6 text-center"><CheckCircle2 className="inline text-lime-300" size={20} /></td>
                  </tr>
                  <tr className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="p-6 sticky left-0 bg-zinc-900/90 backdrop-blur">ICM/Crypto Documentation</td>
                    <td className="p-6 text-center"><XCircle className="inline text-red-400" size={20} /></td>
                    <td className="p-6 text-center"><XCircle className="inline text-red-400" size={20} /></td>
                    <td className="p-6 text-center"><XCircle className="inline text-red-400" size={20} /></td>
                    <td className="p-6 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <CheckCircle2 className="text-lime-300" size={20} />
                        <span className="text-xs text-lime-400 font-bold">CRYPTO.md (400+ lines)</span>
                      </div>
                    </td>
                  </tr>
                  <tr className="hover:bg-white/[0.02]">
                    <td className="p-6 sticky left-0 bg-zinc-900/90 backdrop-blur">Use Case Tutorials</td>
                    <td className="p-6 text-center"><MinusCircle className="inline text-zinc-600" size={20} /></td>
                    <td className="p-6 text-center"><MinusCircle className="inline text-zinc-600" size={20} /></td>
                    <td className="p-6 text-center"><MinusCircle className="inline text-zinc-600" size={20} /></td>
                    <td className="p-6 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <CheckCircle2 className="text-lime-300" size={20} />
                        <span className="text-xs text-lime-400 font-bold">6 detailed scenarios</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Key Advantages */}
      <section className="py-20 px-6 bg-gradient-to-b from-lime-300/5 to-transparent">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-black text-white text-center mb-12">
            Our Unique Advantages
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-lime-300/10 to-emerald-300/5 backdrop-blur border border-lime-300/30 rounded-xl p-8">
              <div className="w-12 h-12 bg-lime-300/20 rounded-lg grid place-items-center mb-4">
                <Target className="text-lime-300" size={24} />
              </div>
              <h3 className="text-2xl font-black text-white mb-3">ICM Specialization</h3>
              <p className="text-zinc-400 mb-4">
                The ONLY marketplace built specifically for ICM launches, rug detection, whale tracking, and crypto trading.
              </p>
              <Badge className="bg-lime-300/20 text-lime-300 border-none">NO COMPETITION</Badge>
            </div>

            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-8">
              <div className="w-12 h-12 bg-lime-300/20 rounded-lg grid place-items-center mb-4">
                <Zap className="text-lime-300" size={24} />
              </div>
              <h3 className="text-2xl font-black text-white mb-3">Progressive Disclosure</h3>
              <p className="text-zinc-400 mb-4">
                88-92% token savings with on-demand skill expansion. Load only what you need, when you need it.
              </p>
              <Badge className="bg-white/10 text-white border-none">VERIFIED SAVINGS</Badge>
            </div>

            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-8">
              <div className="w-12 h-12 bg-lime-300/20 rounded-lg grid place-items-center mb-4">
                <Shield className="text-lime-300" size={24} />
              </div>
              <h3 className="text-2xl font-black text-white mb-3">Production-Ready</h3>
              <p className="text-zinc-400 mb-4">
                Every agent is 400-500+ lines of real implementation, not templates. Battle-tested, not theoretical.
              </p>
              <Badge className="bg-white/10 text-white border-none">{totalPlugins} PLUGINS</Badge>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
            Ready to Dominate?
          </h2>
          <p className="text-xl text-zinc-300 mb-8">
            Join the only Claude Code marketplace built for crypto traders and ICM launchers.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/">
              <Button className="bg-lime-300 text-black hover:bg-lime-400 font-bold px-8 py-6 text-lg w-full sm:w-auto">
                Browse Marketplace
                <ArrowLeft className="ml-2 rotate-180" size={20} />
              </Button>
            </Link>
            <Link href="/icm">
              <Button variant="outline" className="border-white/20 text-white hover:border-lime-300 px-8 py-6 text-lg w-full sm:w-auto">
                View ICM Features
                <ExternalLink className="ml-2" size={16} />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
