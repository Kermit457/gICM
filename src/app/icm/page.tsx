"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  Shield,
  Eye,
  Zap,
  DollarSign,
  Users,
  Target,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Github,
  ExternalLink,
  Copy,
  Check,
  Rocket,
  Bot,
  Terminal,
  Plug,
  AlertTriangle,
  TrendingDown,
  Activity,
  Bell,
  Search,
  BarChart3,
  Clock
} from "lucide-react";
import { REGISTRY } from "@/lib/registry";
import { toast } from "sonner";

export default function ICMPage() {
  const [copiedCommand, setCopiedCommand] = useState(false);

  // Get ICM-specific agents from registry
  const icmAgents = REGISTRY.filter(item =>
    item.id === 'icm-analyst' ||
    item.id === 'icm-anchor-architect' ||
    item.id === 'whale-tracker' ||
    item.id === 'rug-detector' ||
    item.id === 'sentiment-analyzer' ||
    item.id === 'portfolio-manager' ||
    item.id === 'entry-optimizer' ||
    item.id === 'exit-coordinator' ||
    item.id === 'risk-manager' ||
    item.id === 'sniper-bot' ||
    item.id === 'liquidity-analyzer' ||
    item.id === 'smart-money-copier' ||
    item.id === 'chart-pattern-detector' ||
    item.id === 'news-monitor' ||
    item.id === 'multi-chain-scanner' ||
    item.id === 'arbitrage-finder' ||
    item.id === 'airdrop-hunter' ||
    item.id === 'influencer-tracker'
  );

  const copyInstallCommand = () => {
    navigator.clipboard.writeText('npx @gicm/cli add agent/icm-analyst');
    setCopiedCommand(true);
    toast.success('Install command copied!');
    setTimeout(() => setCopiedCommand(false), 2000);
  };

  // Mock live launch data
  const mockLaunches = [
    { ticker: "$DEGEN", platform: "Believe", marketCap: "$127K", change: "+3,247%", status: "graduating", risk: "low" },
    { ticker: "$MOON", platform: "Pump.fun", marketCap: "$84K", change: "+1,892%", status: "trending", risk: "medium" },
    { ticker: "$SCAM", platform: "LetsBONK", marketCap: "$12K", change: "-55%", status: "warning", risk: "high" },
    { ticker: "$ALPHA", platform: "ICM.RUN", marketCap: "$156K", change: "+4,103%", status: "graduated", risk: "low" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black">
      {/* Navigation */}
      <nav className="border-b border-white/10 bg-black/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-black text-white">
              gICM<span className="text-lime-300">.ai</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" className="text-white hover:text-lime-300">
                  Marketplace
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

      {/* Hero Section */}
      <section className="pt-20 pb-12 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <Badge className="bg-lime-300/20 text-lime-300 border-lime-300/50 mb-6 px-4 py-2 text-sm">
            <Activity className="w-4 h-4 mr-2" />
            Real-Time ICM Analytics Across ALL Platforms
          </Badge>

          <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight">
            Every ICM Launch.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-300 via-emerald-300 to-lime-400">
              One Dashboard.
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-zinc-300 max-w-3xl mx-auto mb-8">
            Track Believe, Pump.fun, LetsBONK, and 5+ ICM platforms.
            AI-powered rug detection, whale alerts, and portfolio tracking.
          </p>

          {/* Quick Install */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-12">
            <div className="flex items-center gap-2 bg-black/60 border border-lime-300/30 rounded-lg px-6 py-4">
              <code className="text-lime-300 font-mono text-sm md:text-base">
                npx @gicm/cli add agent/icm-analyst
              </code>
              <button
                onClick={copyInstallCommand}
                className="text-lime-300 hover:text-lime-400 transition-colors"
              >
                {copiedCommand ? <Check size={18} /> : <Copy size={18} />}
              </button>
            </div>
            <Link href="/workflow">
              <Button className="bg-lime-300 text-black hover:bg-lime-400 font-bold px-8 py-6 text-lg">
                Try Analytics Dashboard
                <ArrowRight className="ml-2" size={20} />
              </Button>
            </Link>
          </div>

          {/* Real ICM Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-lg p-6">
              <div className="text-3xl font-black text-white mb-1">$427M</div>
              <div className="text-sm text-zinc-400">ICM Market Cap</div>
            </div>
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-lg p-6">
              <div className="text-3xl font-black text-white mb-1">9,000+</div>
              <div className="text-sm text-zinc-400">Tokens Launched</div>
            </div>
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-lg p-6">
              <div className="text-3xl font-black text-white mb-1">{icmAgents.length}</div>
              <div className="text-sm text-zinc-400">AI Agents</div>
            </div>
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-lg p-6">
              <div className="text-3xl font-black text-white mb-1">8</div>
              <div className="text-sm text-zinc-400">Platforms Tracked</div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Coverage */}
      <section className="py-16 px-6 bg-gradient-to-b from-transparent to-lime-300/5">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black text-white text-center mb-4">
            We Aggregate Every Major ICM Platform
          </h2>
          <p className="text-lg text-zinc-400 text-center mb-12 max-w-2xl mx-auto">
            Stop switching between Believe, Pump.fun, and LetsBONK. Track all launches in one place.
          </p>

          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur border border-white/20 rounded-xl p-6">
              <h3 className="text-lg font-black text-white mb-2">Believe.app</h3>
              <p className="text-sm text-zinc-400 mb-3">$2.8B volume, @launchcoin integration</p>
              <Badge className="bg-lime-300/20 text-lime-300 text-xs">Live</Badge>
            </div>

            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur border border-white/20 rounded-xl p-6">
              <h3 className="text-lg font-black text-white mb-2">Pump.fun</h3>
              <p className="text-sm text-zinc-400 mb-3">Original memecoin launchpad</p>
              <Badge className="bg-lime-300/20 text-lime-300 text-xs">Live</Badge>
            </div>

            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur border border-white/20 rounded-xl p-6">
              <h3 className="text-lg font-black text-white mb-2">LetsBONK</h3>
              <p className="text-sm text-zinc-400 mb-3">50% of May 2025 launches</p>
              <Badge className="bg-lime-300/20 text-lime-300 text-xs">Live</Badge>
            </div>

            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur border border-white/20 rounded-xl p-6">
              <h3 className="text-lg font-black text-white mb-2">5+ More</h3>
              <p className="text-sm text-zinc-400 mb-3">ICM.RUN, Moon, Trends.fun, etc.</p>
              <Badge className="bg-zinc-700 text-zinc-300 text-xs">Tracking</Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Live Feed Mock */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl md:text-4xl font-black text-white mb-2">
                Live ICM Launches
              </h2>
              <p className="text-zinc-400">Real-time tracking across all platforms</p>
            </div>
            <Button variant="outline" className="border-lime-300/50 text-lime-300 hover:bg-lime-300/10">
              <Bell size={16} className="mr-2" />
              Set Alerts
            </Button>
          </div>

          <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="border-b border-white/10 bg-white/5">
                <tr>
                  <th className="text-left p-4 text-white font-bold text-sm">Token</th>
                  <th className="text-left p-4 text-white font-bold text-sm">Platform</th>
                  <th className="text-left p-4 text-white font-bold text-sm">Market Cap</th>
                  <th className="text-left p-4 text-white font-bold text-sm">24h Change</th>
                  <th className="text-left p-4 text-white font-bold text-sm">Status</th>
                  <th className="text-left p-4 text-white font-bold text-sm">Risk</th>
                </tr>
              </thead>
              <tbody>
                {mockLaunches.map((launch, i) => (
                  <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <div className="font-mono text-lime-300 font-bold">{launch.ticker}</div>
                    </td>
                    <td className="p-4 text-zinc-300">{launch.platform}</td>
                    <td className="p-4 text-white font-bold">{launch.marketCap}</td>
                    <td className="p-4">
                      <span className={launch.change.startsWith('+') ? 'text-lime-300' : 'text-red-400'}>
                        {launch.change}
                      </span>
                    </td>
                    <td className="p-4">
                      <Badge className={
                        launch.status === 'graduating' ? 'bg-lime-300/20 text-lime-300' :
                        launch.status === 'graduated' ? 'bg-emerald-500/20 text-emerald-300' :
                        launch.status === 'warning' ? 'bg-red-500/20 text-red-400' :
                        'bg-blue-500/20 text-blue-300'
                      }>
                        {launch.status}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        {launch.risk === 'low' && <div className="w-2 h-2 rounded-full bg-lime-300"></div>}
                        {launch.risk === 'medium' && <div className="w-2 h-2 rounded-full bg-yellow-400"></div>}
                        {launch.risk === 'high' && <div className="w-2 h-2 rounded-full bg-red-500"></div>}
                        <span className="text-zinc-400 text-sm capitalize">{launch.risk}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="text-center mt-6">
            <Link href="/workflow">
              <Button className="bg-lime-300 text-black hover:bg-lime-400 font-bold">
                <Search size={16} className="mr-2" />
                Analyze Launches with AI
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ICM Agent Showcase */}
      <section className="py-20 px-6 bg-gradient-to-b from-lime-300/5 to-transparent">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-black text-white text-center mb-4">
            18 Specialized ICM Agents
          </h2>
          <p className="text-xl text-zinc-400 text-center mb-16 max-w-2xl mx-auto">
            Purpose-built AI agents for every ICM trading scenario
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Sniper Bot */}
            <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-xl p-8 hover:border-lime-300/50 transition-all group">
              <div className="w-12 h-12 bg-lime-300/20 rounded-lg grid place-items-center mb-4 group-hover:bg-lime-300/30 transition-all">
                <Zap className="text-lime-300" size={24} />
              </div>
              <h3 className="text-2xl font-black text-white mb-3">Sniper Bot</h3>
              <p className="text-zinc-400 mb-4">
                Detects new launches instantly. Analyzes safety in &lt;5 seconds. First-block entry.
              </p>
              <div className="flex items-center text-lime-300 text-sm font-medium">
                <code className="bg-black/60 px-2 py-1 rounded text-xs">agent/sniper-bot</code>
              </div>
            </div>

            {/* Rug Detector */}
            <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-xl p-8 hover:border-lime-300/50 transition-all group">
              <div className="w-12 h-12 bg-lime-300/20 rounded-lg grid place-items-center mb-4 group-hover:bg-lime-300/30 transition-all">
                <Shield className="text-lime-300" size={24} />
              </div>
              <h3 className="text-2xl font-black text-white mb-3">Rug Detector</h3>
              <p className="text-zinc-400 mb-4">
                Real-time rug monitoring. Liquidity tracking, dev wallet alerts, emergency exits.
              </p>
              <div className="flex items-center text-lime-300 text-sm font-medium">
                <code className="bg-black/60 px-2 py-1 rounded text-xs">agent/rug-detector</code>
              </div>
            </div>

            {/* Whale Tracker */}
            <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-xl p-8 hover:border-lime-300/50 transition-all group">
              <div className="w-12 h-12 bg-lime-300/20 rounded-lg grid place-items-center mb-4 group-hover:bg-lime-300/30 transition-all">
                <Eye className="text-lime-300" size={24} />
              </div>
              <h3 className="text-2xl font-black text-white mb-3">Whale Tracker</h3>
              <p className="text-zinc-400 mb-4">
                Follow smart money. Track whale wallets, detect accumulation patterns.
              </p>
              <div className="flex items-center text-lime-300 text-sm font-medium">
                <code className="bg-black/60 px-2 py-1 rounded text-xs">agent/whale-tracker</code>
              </div>
            </div>

            {/* Sentiment Analyzer */}
            <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-xl p-8 hover:border-lime-300/50 transition-all group">
              <div className="w-12 h-12 bg-lime-300/20 rounded-lg grid place-items-center mb-4 group-hover:bg-lime-300/30 transition-all">
                <Users className="text-lime-300" size={24} />
              </div>
              <h3 className="text-2xl font-black text-white mb-3">Sentiment Analyzer</h3>
              <p className="text-zinc-400 mb-4">
                Twitter/Telegram sentiment tracking. Bot detection. Community health scoring.
              </p>
              <div className="flex items-center text-lime-300 text-sm font-medium">
                <code className="bg-black/60 px-2 py-1 rounded text-xs">agent/sentiment-analyzer</code>
              </div>
            </div>

            {/* Portfolio Manager */}
            <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-xl p-8 hover:border-lime-300/50 transition-all group">
              <div className="w-12 h-12 bg-lime-300/20 rounded-lg grid place-items-center mb-4 group-hover:bg-lime-300/30 transition-all">
                <BarChart3 className="text-lime-300" size={24} />
              </div>
              <h3 className="text-2xl font-black text-white mb-3">Portfolio Manager</h3>
              <p className="text-zinc-400 mb-4">
                Multi-wallet tracking. Real-time PnL. Risk-adjusted performance metrics.
              </p>
              <div className="flex items-center text-lime-300 text-sm font-medium">
                <code className="bg-black/60 px-2 py-1 rounded text-xs">agent/portfolio-manager</code>
              </div>
            </div>

            {/* Smart Money Copier */}
            <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-xl p-8 hover:border-lime-300/50 transition-all group">
              <div className="w-12 h-12 bg-lime-300/20 rounded-lg grid place-items-center mb-4 group-hover:bg-lime-300/30 transition-all">
                <Copy className="text-lime-300" size={24} />
              </div>
              <h3 className="text-2xl font-black text-white mb-3">Smart Money Copier</h3>
              <p className="text-zinc-400 mb-4">
                Auto-copy elite whale trades. Real-time execution. Performance tracking.
              </p>
              <div className="flex items-center text-lime-300 text-sm font-medium">
                <code className="bg-black/60 px-2 py-1 rounded text-xs">agent/smart-money-copier</code>
              </div>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link href="/">
              <Button variant="outline" className="border-lime-300/50 text-lime-300 hover:bg-lime-300/10">
                View All {icmAgents.length} ICM Agents
                <ArrowRight className="ml-2" size={16} />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* What is ICM? */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-black text-white text-center mb-6">
            What is ICM?
          </h2>
          <p className="text-xl text-zinc-400 text-center mb-12">
            Internet Capital Markets: Tokenize any idea via tweet, trade 24/7
          </p>

          <div className="bg-gradient-to-br from-lime-300/10 to-emerald-300/5 backdrop-blur border border-lime-300/30 rounded-2xl p-8 md:p-12">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-lime-300/20 rounded-full grid place-items-center flex-shrink-0 mt-1">
                  <span className="text-lime-300 font-bold text-sm">1</span>
                </div>
                <div>
                  <h3 className="text-white font-bold mb-2">Tweet to Create Token</h3>
                  <p className="text-zinc-300">
                    Reply "@launchcoin $TICKER" on X (Twitter). Token mints on Solana in seconds.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-lime-300/20 rounded-full grid place-items-center flex-shrink-0 mt-1">
                  <span className="text-lime-300 font-bold text-sm">2</span>
                </div>
                <div>
                  <h3 className="text-white font-bold mb-2">Bonding Curve Launch</h3>
                  <p className="text-zinc-300">
                    Price starts low with bonding curve. Early buyers get best price.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-lime-300/20 rounded-full grid place-items-center flex-shrink-0 mt-1">
                  <span className="text-lime-300 font-bold text-sm">3</span>
                </div>
                <div>
                  <h3 className="text-white font-bold mb-2">Graduate to DEX</h3>
                  <p className="text-zinc-300">
                    Hit $100K market cap → auto-list on Meteora/Raydium for deeper liquidity.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-lime-300/20 rounded-full grid place-items-center flex-shrink-0 mt-1">
                  <span className="text-lime-300 font-bold text-sm">⚠️</span>
                </div>
                <div>
                  <h3 className="text-white font-bold mb-2 flex items-center gap-2">
                    <AlertTriangle size={18} className="text-yellow-400" />
                    90% Fail - High Risk
                  </h3>
                  <p className="text-zinc-300">
                    Most ICM tokens go to zero. Extreme volatility. Only invest what you can lose.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-8">
            <p className="text-sm text-zinc-500">
              Market Stats: $427M total market cap • 9,000+ tokens launched • Solana-native
            </p>
          </div>
        </div>
      </section>

      {/* Quick Start */}
      <section className="py-20 px-6 bg-gradient-to-b from-lime-300/5 to-transparent">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-lime-300/10 to-emerald-300/5 backdrop-blur border border-lime-300/30 rounded-2xl p-12">
            <h2 className="text-3xl md:text-4xl font-black text-white text-center mb-6">
              Start Tracking ICM in 2 Minutes
            </h2>

            <div className="space-y-6 mb-8">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-lime-300/20 rounded-full grid place-items-center flex-shrink-0 mt-1">
                  <span className="text-lime-300 font-bold">1</span>
                </div>
                <div>
                  <h3 className="text-white font-bold mb-1">Install ICM Analyst</h3>
                  <code className="text-sm text-zinc-400 bg-black/60 px-3 py-1 rounded">
                    npx @gicm/cli add agent/icm-analyst
                  </code>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-lime-300/20 rounded-full grid place-items-center flex-shrink-0 mt-1">
                  <span className="text-lime-300 font-bold">2</span>
                </div>
                <div>
                  <h3 className="text-white font-bold mb-1">Configure APIs</h3>
                  <p className="text-sm text-zinc-400">
                    Add SOLANA_RPC_URL, BELIEVE_API_KEY (optional) to .env
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-lime-300/20 rounded-full grid place-items-center flex-shrink-0 mt-1">
                  <span className="text-lime-300 font-bold">3</span>
                </div>
                <div>
                  <h3 className="text-white font-bold mb-1">Start Analyzing</h3>
                  <p className="text-sm text-zinc-400">
                    Ask Claude: &quot;Show me top 10 Believe launches with liquidity &gt;$50k&quot;
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/workflow">
                <Button className="bg-lime-300 text-black hover:bg-lime-400 font-bold px-8 py-6 text-lg w-full sm:w-auto">
                  <Rocket className="mr-2" size={20} />
                  Try Analytics Dashboard
                </Button>
              </Link>
              <Link href="https://github.com/Kermit457/gICM" target="_blank">
                <Button variant="outline" className="border-white/20 text-white hover:border-lime-300 px-8 py-6 text-lg w-full sm:w-auto">
                  <Github className="mr-2" size={20} />
                  View on GitHub
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Resources */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-black text-white text-center mb-12">
            ICM Resources
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            <Link href="/" className="block">
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-8 hover:border-lime-300/50 transition-all group h-full">
                <Bot className="text-lime-300 mb-4" size={32} />
                <h3 className="text-xl font-black text-white mb-2">
                  {icmAgents.length} ICM Agents
                </h3>
                <p className="text-zinc-400 mb-4">
                  Browse specialized agents for ICM trading, research, and risk management
                </p>
                <div className="text-lime-300 text-sm font-medium group-hover:underline">
                  View Agents →
                </div>
              </div>
            </Link>

            <a href="https://www.nansen.ai/post/internet-capital-markets-icm-tokens-the-new-crypto-meta-in-2025" target="_blank" rel="noopener noreferrer" className="block">
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-8 hover:border-lime-300/50 transition-all group h-full">
                <Terminal className="text-lime-300 mb-4" size={32} />
                <h3 className="text-xl font-black text-white mb-2">
                  What is ICM?
                </h3>
                <p className="text-zinc-400 mb-4">
                  Nansen&apos;s guide to Internet Capital Markets and the 2025 meta
                </p>
                <div className="text-lime-300 text-sm font-medium group-hover:underline">
                  Read Guide →
                </div>
              </div>
            </a>

            <a href="https://github.com/Kermit457/gICM/blob/main/INSTALLATION.md" target="_blank" rel="noopener noreferrer" className="block">
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-8 hover:border-lime-300/50 transition-all group h-full">
                <Plug className="text-lime-300 mb-4" size={32} />
                <h3 className="text-xl font-black text-white mb-2">
                  Installation Guide
                </h3>
                <p className="text-zinc-400 mb-4">
                  3 installation methods, CLI reference, troubleshooting
                </p>
                <div className="text-lime-300 text-sm font-medium group-hover:underline">
                  Get Started →
                </div>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-20 px-6 bg-gradient-to-t from-lime-300/10 to-transparent">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
            Track Every ICM Launch
          </h2>
          <p className="text-xl text-zinc-300 mb-8">
            Don&apos;t miss the next 100x. Get real-time alerts across all platforms.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <button
              onClick={copyInstallCommand}
              className="bg-lime-300 text-black hover:bg-lime-400 font-bold px-8 py-4 rounded-lg transition-all flex items-center justify-center gap-2"
            >
              {copiedCommand ? <Check size={20} /> : <Copy size={20} />}
              {copiedCommand ? 'Copied!' : 'Copy Install Command'}
            </button>
            <Link href="/workflow">
              <Button className="bg-transparent border-2 border-lime-300 text-lime-300 hover:bg-lime-300/10 px-8 py-4 w-full sm:w-auto font-bold">
                Try Analytics Dashboard
              </Button>
            </Link>
          </div>

          <p className="text-sm text-zinc-500">
            ⚠️ ICM trading is extremely high-risk. 90% of tokens fail. gICM provides analysis tools, NOT financial advice. DYOR.
          </p>
        </div>
      </section>
    </div>
  );
}
