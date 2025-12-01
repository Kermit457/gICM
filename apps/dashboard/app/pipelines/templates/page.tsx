"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  Filter,
  Copy,
  Star,
  Clock,
  Users,
  Zap,
  Shield,
  TrendingUp,
  Brain,
  Wallet,
  Target,
  Package,
  BarChart3,
  Sparkles,
  ChevronDown,
  Check,
  ExternalLink,
} from "lucide-react";

// Template categories
const categories = [
  { id: "all", label: "All Templates", icon: Sparkles },
  { id: "trading", label: "Trading", icon: TrendingUp },
  { id: "research", label: "Research", icon: Brain },
  { id: "security", label: "Security", icon: Shield },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "automation", label: "Automation", icon: Zap },
];

// Pre-built pipeline templates
const templates = [
  {
    id: "token-analysis",
    name: "Token Analysis Pipeline",
    description: "Comprehensive token analysis with safety checks, sentiment analysis, and price prediction",
    category: "research",
    icon: Brain,
    steps: 5,
    estimatedTime: "2-3 min",
    uses: 1247,
    rating: 4.8,
    featured: true,
    tags: ["token", "analysis", "sentiment", "safety"],
    preview: [
      { name: "Token Safety Check", tool: "token_safety" },
      { name: "Market Data", tool: "market_data" },
      { name: "Sentiment Analysis", tool: "sentiment" },
      { name: "Technical Analysis", tool: "technical" },
      { name: "Final Report", tool: "report_generator" },
    ],
  },
  {
    id: "whale-tracker",
    name: "Whale Activity Monitor",
    description: "Track whale wallets and get alerts on significant movements",
    category: "trading",
    icon: Target,
    steps: 4,
    estimatedTime: "1-2 min",
    uses: 892,
    rating: 4.6,
    featured: true,
    tags: ["whale", "tracking", "alerts", "wallets"],
    preview: [
      { name: "Wallet Discovery", tool: "whale_finder" },
      { name: "Transaction Monitor", tool: "tx_monitor" },
      { name: "Pattern Analysis", tool: "pattern_analyzer" },
      { name: "Alert Generator", tool: "alert_system" },
    ],
  },
  {
    id: "smart-contract-audit",
    name: "Smart Contract Audit",
    description: "Automated security audit for Solidity and Rust smart contracts",
    category: "security",
    icon: Shield,
    steps: 6,
    estimatedTime: "5-10 min",
    uses: 634,
    rating: 4.9,
    featured: true,
    tags: ["audit", "security", "solidity", "rust"],
    preview: [
      { name: "Code Fetch", tool: "code_fetcher" },
      { name: "Static Analysis", tool: "static_analyzer" },
      { name: "Vulnerability Scan", tool: "vuln_scanner" },
      { name: "Gas Optimization", tool: "gas_analyzer" },
      { name: "Best Practices", tool: "best_practices" },
      { name: "Audit Report", tool: "report_generator" },
    ],
  },
  {
    id: "portfolio-rebalance",
    name: "Portfolio Rebalancer",
    description: "Analyze portfolio allocation and suggest rebalancing trades",
    category: "trading",
    icon: Wallet,
    steps: 4,
    estimatedTime: "1-2 min",
    uses: 567,
    rating: 4.5,
    tags: ["portfolio", "rebalance", "allocation", "trading"],
    preview: [
      { name: "Portfolio Scan", tool: "portfolio_scanner" },
      { name: "Risk Analysis", tool: "risk_analyzer" },
      { name: "Target Allocation", tool: "allocation_calc" },
      { name: "Trade Suggestions", tool: "trade_suggester" },
    ],
  },
  {
    id: "dex-arbitrage",
    name: "DEX Arbitrage Scanner",
    description: "Find arbitrage opportunities across multiple DEXs",
    category: "trading",
    icon: Zap,
    steps: 3,
    estimatedTime: "30 sec",
    uses: 2341,
    rating: 4.7,
    tags: ["arbitrage", "dex", "trading", "profit"],
    preview: [
      { name: "Price Aggregation", tool: "price_aggregator" },
      { name: "Opportunity Finder", tool: "arb_finder" },
      { name: "Profitability Check", tool: "profit_calculator" },
    ],
  },
  {
    id: "nft-rarity",
    name: "NFT Rarity Analyzer",
    description: "Calculate rarity scores and find undervalued NFTs",
    category: "analytics",
    icon: Package,
    steps: 4,
    estimatedTime: "2-3 min",
    uses: 423,
    rating: 4.4,
    tags: ["nft", "rarity", "valuation", "collections"],
    preview: [
      { name: "Collection Fetch", tool: "nft_fetcher" },
      { name: "Trait Analysis", tool: "trait_analyzer" },
      { name: "Rarity Scoring", tool: "rarity_calculator" },
      { name: "Value Assessment", tool: "value_estimator" },
    ],
  },
  {
    id: "social-sentiment",
    name: "Social Sentiment Tracker",
    description: "Monitor Twitter, Discord, and Telegram for project sentiment",
    category: "research",
    icon: Users,
    steps: 5,
    estimatedTime: "2-4 min",
    uses: 756,
    rating: 4.6,
    tags: ["sentiment", "social", "twitter", "discord"],
    preview: [
      { name: "Twitter Scan", tool: "twitter_scanner" },
      { name: "Discord Monitor", tool: "discord_monitor" },
      { name: "Telegram Tracker", tool: "telegram_tracker" },
      { name: "Sentiment Analysis", tool: "sentiment_analyzer" },
      { name: "Trend Report", tool: "trend_reporter" },
    ],
  },
  {
    id: "gas-optimizer",
    name: "Gas Cost Optimizer",
    description: "Analyze and optimize gas costs for smart contract deployments",
    category: "automation",
    icon: Zap,
    steps: 3,
    estimatedTime: "1 min",
    uses: 312,
    rating: 4.3,
    tags: ["gas", "optimization", "deployment", "cost"],
    preview: [
      { name: "Contract Analysis", tool: "contract_analyzer" },
      { name: "Gas Profiling", tool: "gas_profiler" },
      { name: "Optimization Tips", tool: "optimizer" },
    ],
  },
  {
    id: "yield-finder",
    name: "Yield Farming Scout",
    description: "Discover and compare yield farming opportunities across DeFi protocols",
    category: "trading",
    icon: TrendingUp,
    steps: 4,
    estimatedTime: "1-2 min",
    uses: 891,
    rating: 4.5,
    tags: ["yield", "farming", "defi", "apy"],
    preview: [
      { name: "Protocol Scanner", tool: "protocol_scanner" },
      { name: "APY Calculator", tool: "apy_calculator" },
      { name: "Risk Assessment", tool: "risk_assessor" },
      { name: "Opportunity Ranker", tool: "opportunity_ranker" },
    ],
  },
  {
    id: "airdrop-hunter",
    name: "Airdrop Hunter",
    description: "Find and track potential airdrops based on wallet activity",
    category: "research",
    icon: Target,
    steps: 4,
    estimatedTime: "2-3 min",
    uses: 1523,
    rating: 4.7,
    tags: ["airdrop", "hunter", "eligibility", "rewards"],
    preview: [
      { name: "Protocol Discovery", tool: "protocol_discovery" },
      { name: "Eligibility Check", tool: "eligibility_checker" },
      { name: "Activity Tracker", tool: "activity_tracker" },
      { name: "Airdrop Calendar", tool: "calendar_generator" },
    ],
  },
  {
    id: "liquidation-monitor",
    name: "Liquidation Monitor",
    description: "Monitor lending positions and get alerts before liquidation",
    category: "automation",
    icon: Shield,
    steps: 3,
    estimatedTime: "30 sec",
    uses: 445,
    rating: 4.8,
    tags: ["liquidation", "lending", "alerts", "defi"],
    preview: [
      { name: "Position Scanner", tool: "position_scanner" },
      { name: "Health Calculator", tool: "health_calculator" },
      { name: "Alert System", tool: "alert_generator" },
    ],
  },
  {
    id: "token-launch",
    name: "New Token Launch Analyzer",
    description: "Comprehensive analysis of newly launched tokens for early opportunities",
    category: "research",
    icon: Sparkles,
    steps: 6,
    estimatedTime: "3-5 min",
    uses: 678,
    rating: 4.6,
    tags: ["launch", "new", "analysis", "early"],
    preview: [
      { name: "Launch Detection", tool: "launch_detector" },
      { name: "Contract Scan", tool: "contract_scanner" },
      { name: "Liquidity Check", tool: "liquidity_checker" },
      { name: "Team Research", tool: "team_researcher" },
      { name: "Social Scan", tool: "social_scanner" },
      { name: "Risk Score", tool: "risk_scorer" },
    ],
  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
      <span className="text-sm text-gray-300">{rating.toFixed(1)}</span>
    </div>
  );
}

function TemplateCard({
  template,
  onClone,
}: {
  template: (typeof templates)[0];
  onClone: (id: string) => void;
}) {
  const [showPreview, setShowPreview] = useState(false);
  const Icon = template.icon;

  return (
    <div className="bg-gicm-card border border-gicm-border rounded-xl overflow-hidden hover:border-gicm-primary/50 transition-all group">
      {/* Header */}
      <div className="p-4 border-b border-gicm-border">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gicm-primary/20 flex items-center justify-center">
              <Icon className="w-5 h-5 text-gicm-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-white">{template.name}</h3>
                {template.featured && (
                  <span className="px-1.5 py-0.5 text-xs bg-yellow-500/20 text-yellow-400 rounded">
                    Featured
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 capitalize">{template.category}</p>
            </div>
          </div>
          <StarRating rating={template.rating} />
        </div>
        <p className="text-sm text-gray-400 line-clamp-2">{template.description}</p>
      </div>

      {/* Stats */}
      <div className="px-4 py-3 bg-black/20 flex items-center gap-4 text-xs text-gray-400">
        <div className="flex items-center gap-1">
          <Zap className="w-3.5 h-3.5" />
          <span>{template.steps} steps</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          <span>{template.estimatedTime}</span>
        </div>
        <div className="flex items-center gap-1">
          <Users className="w-3.5 h-3.5" />
          <span>{template.uses.toLocaleString()} uses</span>
        </div>
      </div>

      {/* Preview Toggle */}
      <div className="px-4 py-2 border-t border-gicm-border">
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors w-full"
        >
          <ChevronDown
            className={`w-4 h-4 transition-transform ${showPreview ? "rotate-180" : ""}`}
          />
          <span>Preview Steps</span>
        </button>
      </div>

      {/* Step Preview */}
      {showPreview && (
        <div className="px-4 py-3 border-t border-gicm-border bg-black/30">
          <div className="space-y-2">
            {template.preview.map((step, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm">
                <div className="w-5 h-5 rounded-full bg-gicm-primary/20 text-gicm-primary flex items-center justify-center text-xs font-medium">
                  {idx + 1}
                </div>
                <span className="text-gray-300">{step.name}</span>
                <span className="text-xs text-gray-500 ml-auto">{step.tool}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tags */}
      <div className="px-4 py-3 border-t border-gicm-border">
        <div className="flex flex-wrap gap-1.5">
          {template.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 text-xs bg-white/5 text-gray-400 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-gicm-border flex items-center gap-2">
        <button
          onClick={() => onClone(template.id)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gicm-primary text-black rounded-lg font-medium hover:bg-gicm-primary/90 transition-colors"
        >
          <Copy className="w-4 h-4" />
          Clone Template
        </button>
        <Link
          href={`/pipelines/builder?template=${template.id}`}
          className="px-4 py-2 border border-gicm-border text-gray-400 rounded-lg hover:bg-white/5 hover:text-white transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

export default function PipelineTemplatesPage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState<"popular" | "rating" | "newest">("popular");
  const [clonedId, setClonedId] = useState<string | null>(null);

  const filteredTemplates = useMemo(() => {
    let filtered = templates;

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter((t) => t.category === selectedCategory);
    }

    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(searchLower) ||
          t.description.toLowerCase().includes(searchLower) ||
          t.tags.some((tag) => tag.toLowerCase().includes(searchLower))
      );
    }

    // Sort
    switch (sortBy) {
      case "popular":
        filtered = [...filtered].sort((a, b) => b.uses - a.uses);
        break;
      case "rating":
        filtered = [...filtered].sort((a, b) => b.rating - a.rating);
        break;
      case "newest":
        // For demo, featured items are "newest"
        filtered = [...filtered].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
        break;
    }

    return filtered;
  }, [search, selectedCategory, sortBy]);

  const handleClone = (id: string) => {
    setClonedId(id);
    // In production, this would call an API to clone the template
    setTimeout(() => {
      setClonedId(null);
      // Navigate to builder with cloned template
      window.location.href = `/pipelines/builder?template=${id}&cloned=true`;
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gicm-bg text-white">
      {/* Header */}
      <div className="border-b border-gicm-border bg-gicm-card/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/pipelines"
              className="p-2 hover:bg-white/5 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Pipeline Templates</h1>
              <p className="text-gray-400 text-sm">
                Pre-built workflows ready to clone and customize
              </p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search templates..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-black/30 border border-gicm-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gicm-primary"
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 px-3 py-2 bg-black/30 border border-gicm-border rounded-lg">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="bg-transparent text-sm text-gray-300 focus:outline-none cursor-pointer"
                >
                  <option value="popular">Most Popular</option>
                  <option value="rating">Highest Rated</option>
                  <option value="newest">Newest</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar - Categories */}
          <div className="w-48 shrink-0 hidden lg:block">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Categories</h3>
            <nav className="space-y-1">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const isActive = selectedCategory === cat.id;
                const count = cat.id === "all"
                  ? templates.length
                  : templates.filter(t => t.category === cat.id).length;

                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                      isActive
                        ? "bg-gicm-primary/20 text-gicm-primary"
                        : "text-gray-400 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{cat.label}</span>
                    <span className="ml-auto text-xs opacity-60">{count}</span>
                  </button>
                );
              })}
            </nav>

            {/* Stats */}
            <div className="mt-6 p-4 bg-gicm-card border border-gicm-border rounded-xl">
              <h4 className="text-sm font-medium text-white mb-3">Template Stats</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-400">
                  <span>Total Templates</span>
                  <span className="text-white">{templates.length}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Total Uses</span>
                  <span className="text-white">
                    {templates.reduce((sum, t) => sum + t.uses, 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Avg Rating</span>
                  <span className="text-white">
                    {(templates.reduce((sum, t) => sum + t.rating, 0) / templates.length).toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Mobile Categories */}
            <div className="lg:hidden mb-4 overflow-x-auto">
              <div className="flex gap-2 pb-2">
                {categories.map((cat) => {
                  const Icon = cat.icon;
                  const isActive = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
                        isActive
                          ? "bg-gicm-primary text-black"
                          : "bg-gicm-card text-gray-400 hover:text-white"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Results Count */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-400">
                {filteredTemplates.length} template{filteredTemplates.length !== 1 ? "s" : ""} found
              </p>
            </div>

            {/* Template Grid */}
            {filteredTemplates.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onClone={handleClone}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gicm-card flex items-center justify-center">
                  <Search className="w-8 h-8 text-gray-500" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">No templates found</h3>
                <p className="text-gray-400 text-sm mb-4">
                  Try adjusting your search or filters
                </p>
                <button
                  onClick={() => {
                    setSearch("");
                    setSelectedCategory("all");
                  }}
                  className="px-4 py-2 bg-gicm-primary text-black rounded-lg font-medium hover:bg-gicm-primary/90 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Clone Success Toast */}
      {clonedId && (
        <div className="fixed bottom-4 right-4 flex items-center gap-3 px-4 py-3 bg-green-500/20 border border-green-500/30 text-green-400 rounded-lg animate-in slide-in-from-bottom-4">
          <Check className="w-5 h-5" />
          <span>Template cloned! Redirecting to builder...</span>
        </div>
      )}
    </div>
  );
}
