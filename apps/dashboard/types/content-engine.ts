// collections/posts.ts

export interface Post {
  id: string                    // auto-generated
  type: 'blog' | 'changelog' | 'guide' | 'agent-report'
  status: 'draft' | 'review' | 'published' | 'archived'
  
  // Content
  title: string
  slug: string                  // URL-safe, unique
  summary: string               // 150-160 chars for meta description
  content: string               // Markdown
  cover_image?: string          // URL to image
  
  // SEO
  tags: string[]                // ["solana", "bonding-curve", "icm"]
  canonical_url: string         // https://gicm.run/blog/{slug}
  keywords?: string[]           // Long-tail targets
  
  // Syndication tracking
  syndication: {
    devto?: { id: string; url: string; published_at: string }
    hashnode?: { id: string; url: string; published_at: string }
    paragraph?: { id: string; url: string; published_at: string }
  }
  
  // Meta
  author: string                // "gicm-team" or "mirko"
  created_at: string
  updated_at: string
  published_at?: string
}

// collections/rss_sources.ts

export interface RSSSource {
  id: string
  name: string                  // "Solana Blog"
  feed_url: string              // https://solana.com/news/rss.xml
  category: 'solana' | 'web3' | 'ai' | 'defi' | 'infra'
  enabled: boolean
  last_fetched?: string
}

// collections/rss_items.ts

export interface RSSItem {
  id: string
  source_id: string             // FK to RSSSource
  title: string
  url: string
  summary?: string
  published_at: string
  processed: boolean            // Has the engine seen this?
  relevance_score?: number      // 0-100, set by engine
}

// collections/agents.ts

export interface Agent {
  id: string
  name: string                  // e.g. "Momentum Scalper SOL"
  slug: string
  thesis: string                // One liner strategy
  strategy_type: 'scalp' | 'trend' | 'arbitrage' | 'mean-reversion'
  status: 'active' | 'paused' | 'deprecated'
  current_version: string
  markets: string[]             // ["SOL-USDC", "JUP-SOL"]
  data_feeds: string[]          // ["birdeye", "helius"]
}

export interface AgentMetric {
  id: string
  agent_id: string
  timeframe: 'daily' | 'weekly' | 'monthly'
  start_date: string
  end_date: string
  
  pnl_abs: number
  pnl_percent: number
  win_rate: number
  sharpe: number
  max_drawdown: number
  trade_count: number
  avg_trade_duration_sec: number
  
  fees_paid: number
  slippage_saved_usd?: number
}

export interface ModelUpdate {
  id: string
  agent_id: string
  version: string
  previous_version: string
  deployed_at: string
  
  changes_summary: string       // "Improved latency by 20ms"
  tech_details: string          // "Switched to gRPC stream..."
  
  impact_metrics?: {
    metric: string
    before: number
    after: number
  }[]
}
