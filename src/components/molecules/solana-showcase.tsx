"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrambleText } from "@/components/ui/scramble-text";
import {
  Zap,
  Shield,
  Code2,
  Rocket,
  TrendingUp,
  ArrowRight,
  Bot,
  Terminal,
  Plug,
} from "lucide-react";

const FEATURED_SOLANA_ITEMS = [
  {
    id: "solana-guardian-auditor",
    name: "Solana Guardian Auditor",
    type: "Agent",
    icon: Shield,
    description: "Security auditor for Solana programs with PDA validation, signer checks, and economic attack prevention",
    color: "from-red-500 to-orange-500",
    bgColor: "bg-red-50 dark:bg-red-900/10",
    borderColor: "border-red-200 dark:border-red-800/30",
    textColor: "text-red-600 dark:text-red-400",
  },
  {
    id: "icm-anchor-architect",
    name: "Anchor Architect",
    type: "Agent",
    icon: Code2,
    description: "Anchor framework specialist for bonding curves, PDAs, and CPI orchestration",
    color: "from-purple-500 to-pink-500",
    bgColor: "bg-purple-50 dark:bg-purple-900/10",
    borderColor: "border-purple-200 dark:border-purple-800/30",
    textColor: "text-purple-600 dark:text-purple-400",
  },
  {
    id: "solana-agent-kit",
    name: "Solana Agent Kit",
    type: "MCP",
    icon: Plug,
    description: "Complete Solana integration with RPC, wallet management, and transaction building",
    color: "from-lime-500 to-emerald-500",
    bgColor: "bg-lime-50 dark:bg-lime-900/10",
    borderColor: "border-lime-200 dark:border-lime-800/30",
    textColor: "text-lime-600 dark:text-lime-400",
  },
  {
    id: "helius-rpc",
    name: "Helius RPC",
    type: "MCP",
    icon: Zap,
    description: "High-performance Solana RPC with webhooks, enhanced APIs, and DAS support",
    color: "from-blue-500 to-cyan-500",
    bgColor: "bg-blue-50 dark:bg-blue-900/10",
    borderColor: "border-blue-200 dark:border-blue-800/30",
    textColor: "text-blue-600 dark:text-blue-400",
  },
  {
    id: "anchor-deployment",
    name: "Anchor Deployment",
    type: "Command",
    icon: Terminal,
    description: "Deploy Solana programs with Anchor framework, test validation, and network configs",
    color: "from-amber-500 to-yellow-500",
    bgColor: "bg-amber-50 dark:bg-amber-900/10",
    borderColor: "border-amber-200 dark:border-amber-800/30",
    textColor: "text-amber-600 dark:text-amber-400",
  },
  {
    id: "solana-security-audit",
    name: "Solana Security Audit",
    type: "Skill",
    icon: Shield,
    description: "Comprehensive security audit for Solana programs with automated vulnerability detection",
    color: "from-indigo-500 to-purple-500",
    bgColor: "bg-indigo-50 dark:bg-indigo-900/10",
    borderColor: "border-indigo-200 dark:border-indigo-800/30",
    textColor: "text-indigo-600 dark:text-indigo-400",
  },
];

const WEB3_USE_CASES = [
  {
    title: "DeFi Protocol Development",
    description: "Build AMMs, lending protocols, and yield aggregators on Solana",
    icon: TrendingUp,
    stats: "12 specialized tools",
  },
  {
    title: "NFT Marketplace & Minting",
    description: "Create NFT collections with Metaplex, compressed NFTs, and marketplace integration",
    icon: Rocket,
    stats: "8 ready-to-use agents",
  },
  {
    title: "Token Launch & Management",
    description: "Launch SPL tokens, manage liquidity, and implement tokenomics",
    icon: Zap,
    stats: "6 launch templates",
  },
  {
    title: "Web3 dApp Frontends",
    description: "Build production Web3 apps with wallet integration and real-time blockchain data",
    icon: Code2,
    stats: "15 UI components",
  },
];

export function SolanaShowcase() {
  const [hoverHeader, setHoverHeader] = useState(false);

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-10 py-8">
      {/* Header */}
      <div
        className="text-center mb-8"
        onMouseEnter={() => setHoverHeader(true)}
        onMouseLeave={() => setHoverHeader(false)}
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-lime-300/20 border border-lime-300/50 mb-4">
          <Zap className="w-5 h-5 text-lime-600" />
          <span className="text-lime-600 font-bold">
            {hoverHeader ? (
              <ScrambleText text="Solana Ecosystem" trigger="hover" duration={400} />
            ) : (
              "Solana Ecosystem"
            )}
          </span>
        </div>

        <h2 className="text-3xl md:text-4xl font-black text-black dark:text-white mb-3">
          Built for Solana Builders
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
          The most comprehensive AI dev stack for Solana development. From security audits to
          production deployment.
        </p>
      </div>

      {/* Featured Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
        {FEATURED_SOLANA_ITEMS.map((item) => {
          const Icon = item.icon;

          return (
            <Link key={item.id} href={`/items/${item.id}`}>
              <Card
                className={`p-5 hover:shadow-lg transition-all cursor-pointer group ${item.borderColor}`}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className={`w-12 h-12 rounded-lg ${item.bgColor} border ${item.borderColor} flex items-center justify-center flex-shrink-0`}
                  >
                    <Icon className={`w-6 h-6 ${item.textColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-black dark:text-white mb-1 group-hover:text-lime-600 dark:group-hover:text-lime-400 transition-colors">
                      {item.name}
                    </h3>
                    <Badge variant="outline" className="text-xs">
                      {item.type}
                    </Badge>
                  </div>
                </div>

                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">
                  {item.description}
                </p>

                <div className="flex items-center gap-2 text-xs font-medium text-lime-600 dark:text-lime-400 group-hover:gap-3 transition-all">
                  <span>View details</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Use Cases Section */}
      <div className="bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900/50 dark:to-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8">
        <h3 className="text-2xl font-black text-black dark:text-white mb-6 text-center">
          What You Can Build
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {WEB3_USE_CASES.map((useCase, idx) => {
            const Icon = useCase.icon;

            return (
              <div
                key={idx}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 hover:border-lime-300 dark:hover:border-lime-700 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-lime-100 dark:bg-lime-900/30 border border-lime-200 dark:border-lime-800 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-lime-600 dark:text-lime-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-black dark:text-white mb-1">
                      {useCase.title}
                    </h4>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                      {useCase.description}
                    </p>
                    <Badge variant="outline" className="text-xs bg-lime-50 dark:bg-lime-900/20 text-lime-700 dark:text-lime-400 border-lime-200 dark:border-lime-800">
                      {useCase.stats}
                    </Badge>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <Link href="/">
            <button className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-lime-600 text-white hover:bg-lime-700 transition-colors font-semibold">
              Browse All Solana Tools
              <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg">
          <div className="text-3xl font-black text-lime-600 dark:text-lime-400 mb-1">
            24
          </div>
          <div className="text-xs text-zinc-600 dark:text-zinc-400">
            Solana Agents
          </div>
        </div>

        <div className="text-center p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg">
          <div className="text-3xl font-black text-purple-600 dark:text-purple-400 mb-1">
            18
          </div>
          <div className="text-xs text-zinc-600 dark:text-zinc-400">
            DeFi Tools
          </div>
        </div>

        <div className="text-center p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg">
          <div className="text-3xl font-black text-blue-600 dark:text-blue-400 mb-1">
            12
          </div>
          <div className="text-xs text-zinc-600 dark:text-zinc-400">
            Security Auditors
          </div>
        </div>

        <div className="text-center p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg">
          <div className="text-3xl font-black text-amber-600 dark:text-amber-400 mb-1">
            100%
          </div>
          <div className="text-xs text-zinc-600 dark:text-zinc-400">
            Production Ready
          </div>
        </div>
      </div>
    </div>
  );
}
