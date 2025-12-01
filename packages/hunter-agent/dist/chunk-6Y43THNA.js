// src/sources/github-hunter.ts
import { createHash, randomUUID } from "crypto";

// src/types.ts
import { z } from "zod";
var HuntSourceSchema = z.enum([
  // Social/Tech
  "github",
  "hackernews",
  "twitter",
  "reddit",
  "producthunt",
  "arxiv",
  "lobsters",
  "devto",
  "tiktok",
  // DeFi/Crypto
  "defillama",
  "geckoterminal",
  "feargreed",
  "binance",
  "coingecko",
  // Market data, trending, categories
  "coinmarketcap",
  // 2.4M assets, historical OHLCV, global metrics
  "lunarcrush",
  // Social sentiment metrics
  // Solana-Specific (FREE)
  "rugcheck",
  // Token safety scanner (FREE, no auth)
  "pumpfun",
  // Memecoin launches (FREE, no auth)
  "vybe",
  // Enterprise Solana data (FREE tier, API key)
  // Prediction Markets
  "polymarket",
  "kalshi",
  // Economic/Financial
  "fred",
  "sec",
  "finnhub",
  // Alternative
  "npm",
  "rss"
  // NEW: Aggregated news feeds
]);
var RawDiscoverySchema = z.object({
  sourceId: z.string(),
  sourceUrl: z.string().url(),
  title: z.string(),
  description: z.string().optional(),
  author: z.string().optional(),
  authorUrl: z.string().optional(),
  publishedAt: z.date().optional(),
  // Metrics (source-dependent)
  metrics: z.object({
    stars: z.number().optional(),
    forks: z.number().optional(),
    watchers: z.number().optional(),
    openIssues: z.number().optional(),
    points: z.number().optional(),
    comments: z.number().optional(),
    likes: z.number().optional(),
    reposts: z.number().optional(),
    views: z.number().optional()
  }),
  // Source-specific metadata
  metadata: z.record(z.unknown()).optional()
});
var HuntDiscoverySchema = z.object({
  id: z.string(),
  source: HuntSourceSchema,
  sourceId: z.string(),
  sourceUrl: z.string().url(),
  title: z.string(),
  description: z.string().optional(),
  author: z.string().optional(),
  authorUrl: z.string().optional(),
  publishedAt: z.date().optional(),
  discoveredAt: z.date(),
  // Categorization
  category: z.enum(["web3", "ai", "defi", "nft", "tooling", "other"]).optional(),
  tags: z.array(z.string()).default([]),
  language: z.string().optional(),
  // Metrics
  metrics: z.object({
    stars: z.number().optional(),
    forks: z.number().optional(),
    watchers: z.number().optional(),
    openIssues: z.number().optional(),
    points: z.number().optional(),
    comments: z.number().optional(),
    likes: z.number().optional(),
    reposts: z.number().optional(),
    views: z.number().optional()
  }),
  // Relevance factors (computed locally)
  relevanceFactors: z.object({
    hasWeb3Keywords: z.boolean().default(false),
    hasAIKeywords: z.boolean().default(false),
    hasSolanaKeywords: z.boolean().default(false),
    hasEthereumKeywords: z.boolean().default(false),
    hasTypeScript: z.boolean().default(false),
    recentActivity: z.boolean().default(false),
    highEngagement: z.boolean().default(false),
    isShowHN: z.boolean().default(false)
  }),
  // Raw metadata for later processing
  rawMetadata: z.record(z.unknown()).optional(),
  // Fingerprint for deduplication
  fingerprint: z.string()
});
var GitHubRepoSchema = z.object({
  id: z.number(),
  node_id: z.string(),
  name: z.string(),
  full_name: z.string(),
  owner: z.object({
    login: z.string(),
    avatar_url: z.string().optional(),
    html_url: z.string()
  }),
  html_url: z.string(),
  description: z.string().nullable(),
  fork: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
  pushed_at: z.string(),
  homepage: z.string().nullable(),
  size: z.number(),
  stargazers_count: z.number(),
  watchers_count: z.number(),
  language: z.string().nullable(),
  forks_count: z.number(),
  open_issues_count: z.number(),
  license: z.object({ name: z.string() }).nullable(),
  topics: z.array(z.string()).default([]),
  visibility: z.string().optional(),
  default_branch: z.string().optional()
});
var HNItemSchema = z.object({
  id: z.number(),
  type: z.enum(["story", "comment", "job", "poll", "pollopt"]),
  by: z.string().optional(),
  time: z.number(),
  title: z.string().optional(),
  url: z.string().optional(),
  text: z.string().optional(),
  score: z.number().optional(),
  descendants: z.number().optional(),
  kids: z.array(z.number()).optional()
});
var TwitterTweetSchema = z.object({
  id: z.string(),
  text: z.string(),
  created_at: z.string().optional(),
  author: z.object({
    id: z.string(),
    username: z.string(),
    name: z.string(),
    followers_count: z.number().optional()
  }).optional(),
  public_metrics: z.object({
    retweet_count: z.number(),
    reply_count: z.number(),
    like_count: z.number(),
    quote_count: z.number().optional(),
    impression_count: z.number().optional()
  }).optional(),
  urls: z.array(z.string()).optional()
});
var RELEVANCE_KEYWORDS = {
  web3: [
    "web3",
    "blockchain",
    "crypto",
    "cryptocurrency",
    "token",
    "smart contract",
    "decentralized",
    "dapp",
    "defi",
    "nft",
    "dao",
    "wallet",
    "on-chain",
    "onchain"
  ],
  ai: [
    "ai",
    "artificial intelligence",
    "machine learning",
    "ml",
    "llm",
    "large language model",
    "gpt",
    "claude",
    "langchain",
    "agent",
    "chatbot",
    "neural",
    "transformer",
    "embedding"
  ],
  solana: [
    "solana",
    "$sol",
    "spl token",
    "anchor",
    "metaplex",
    "phantom",
    "solflare",
    "jupiter",
    "raydium"
  ],
  ethereum: [
    "ethereum",
    "$eth",
    "erc20",
    "erc721",
    "erc1155",
    "solidity",
    "hardhat",
    "foundry",
    "uniswap",
    "openzeppelin"
  ],
  typescript: ["typescript", "ts", "tsx", "deno", "bun"]
};
var DEFAULT_SCHEDULES = {
  // Social/Tech
  github: "0 */4 * * *",
  // Every 4 hours
  hackernews: "0 */2 * * *",
  // Every 2 hours
  twitter: "*/30 * * * *",
  // Every 30 minutes
  reddit: "0 */3 * * *",
  // Every 3 hours
  producthunt: "0 */6 * * *",
  // Every 6 hours
  arxiv: "0 0 * * *",
  // Once daily (rate limited)
  lobsters: "0 */4 * * *",
  // Every 4 hours
  devto: "0 */6 * * *",
  // Every 6 hours
  tiktok: "0 */4 * * *",
  // Every 4 hours (Apify rate limited)
  // DeFi/Crypto
  defillama: "0 */2 * * *",
  // Every 2 hours (real-time TVL)
  geckoterminal: "*/15 * * * *",
  // Every 15 minutes (new pools)
  feargreed: "0 */6 * * *",
  // Every 6 hours (daily index)
  binance: "*/5 * * * *",
  // Every 5 minutes (price moves)
  coingecko: "*/10 * * * *",
  // Every 10 minutes (trending, market data)
  coinmarketcap: "*/15 * * * *",
  // Every 15 minutes (price moves, global data)
  lunarcrush: "*/15 * * * *",
  // Every 15 minutes (social sentiment)
  // Solana-Specific (FREE)
  rugcheck: "*/2 * * * *",
  // Every 2 minutes (safety scans, no limit)
  pumpfun: "*/1 * * * *",
  // Every minute (new memecoin launches)
  vybe: "*/5 * * * *",
  // Every 5 minutes (4 req/min limit)
  // Prediction Markets
  polymarket: "*/10 * * * *",
  // Every 10 minutes (active markets)
  kalshi: "*/10 * * * *",
  // Every 10 minutes (active markets)
  // Economic/Financial
  fred: "0 8 * * *",
  // Daily at 8am (economic data releases)
  sec: "0 */4 * * *",
  // Every 4 hours (filings)
  finnhub: "0 */2 * * *",
  // Every 2 hours (congress trades)
  // Alternative
  npm: "0 0 * * 0",
  // Weekly on Sundays (package trends)
  rss: "*/30 * * * *"
  // Every 30 minutes (aggregated news)
};

// src/sources/github-hunter.ts
var GITHUB_API = "https://api.github.com";
var SEARCH_TOPICS = [
  "solana",
  "ethereum",
  "web3",
  "defi",
  "ai-agents",
  "llm",
  "langchain",
  "blockchain"
];
var GitHubHunter = class {
  source = "github";
  token;
  config;
  constructor(config) {
    this.config = config;
    this.token = config.apiKey ?? config.apiToken ?? process.env.GITHUB_TOKEN ?? "";
  }
  async hunt() {
    const discoveries = [];
    for (const topic of SEARCH_TOPICS) {
      const repos = await this.searchTrendingByTopic(topic);
      discoveries.push(...repos.map((r) => this.repoToRawDiscovery(r)));
    }
    const recentHot = await this.searchRecentHotRepos();
    discoveries.push(...recentHot.map((r) => this.repoToRawDiscovery(r)));
    const seen = /* @__PURE__ */ new Set();
    return discoveries.filter((d) => {
      if (seen.has(d.sourceUrl)) return false;
      seen.add(d.sourceUrl);
      return true;
    });
  }
  transform(raw) {
    const text = `${raw.title} ${raw.description ?? ""}`.toLowerCase();
    const metadata = raw.metadata;
    return {
      id: randomUUID(),
      source: "github",
      sourceId: raw.sourceId,
      sourceUrl: raw.sourceUrl,
      title: raw.title,
      description: raw.description,
      author: raw.author,
      authorUrl: raw.authorUrl,
      publishedAt: raw.publishedAt,
      discoveredAt: /* @__PURE__ */ new Date(),
      category: this.categorize(text, metadata?.topics ?? []),
      tags: metadata?.topics ?? [],
      language: metadata?.language ?? void 0,
      metrics: raw.metrics,
      relevanceFactors: {
        hasWeb3Keywords: this.hasKeywords(text, RELEVANCE_KEYWORDS.web3),
        hasAIKeywords: this.hasKeywords(text, RELEVANCE_KEYWORDS.ai),
        hasSolanaKeywords: this.hasKeywords(text, RELEVANCE_KEYWORDS.solana),
        hasEthereumKeywords: this.hasKeywords(text, RELEVANCE_KEYWORDS.ethereum),
        hasTypeScript: this.hasKeywords(text, RELEVANCE_KEYWORDS.typescript) || metadata?.language?.toLowerCase() === "typescript",
        recentActivity: this.isRecentlyActive(metadata),
        highEngagement: (raw.metrics.stars ?? 0) > 100 || (raw.metrics.forks ?? 0) > 20,
        isShowHN: false
      },
      rawMetadata: metadata,
      fingerprint: this.generateFingerprint(raw)
    };
  }
  async searchTrendingByTopic(topic) {
    const sevenDaysAgo = /* @__PURE__ */ new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const dateStr = sevenDaysAgo.toISOString().split("T")[0];
    const minStars = this.config.filters?.minStars ?? 10;
    const query = encodeURIComponent(
      `topic:${topic} created:>${dateStr} stars:>=${minStars}`
    );
    const response = await this.fetchGitHub(
      `/search/repositories?q=${query}&sort=stars&order=desc&per_page=30`
    );
    if (!response.ok) {
      console.error(`[GitHubHunter] Search failed for topic ${topic}:`, response.status);
      return [];
    }
    const data = await response.json();
    return data.items ?? [];
  }
  async searchRecentHotRepos() {
    const threeDaysAgo = /* @__PURE__ */ new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const dateStr = threeDaysAgo.toISOString().split("T")[0];
    const query = encodeURIComponent(`created:>${dateStr} stars:>=50`);
    const response = await this.fetchGitHub(
      `/search/repositories?q=${query}&sort=stars&order=desc&per_page=50`
    );
    if (!response.ok) {
      console.error("[GitHubHunter] Recent hot search failed:", response.status);
      return [];
    }
    const data = await response.json();
    return data.items ?? [];
  }
  async fetchGitHub(path) {
    const headers = {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "gICM-Hunter"
    };
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }
    return fetch(`${GITHUB_API}${path}`, { headers });
  }
  repoToRawDiscovery(repo) {
    return {
      sourceId: String(repo.id),
      sourceUrl: repo.html_url,
      title: repo.full_name,
      description: repo.description ?? void 0,
      author: repo.owner.login,
      authorUrl: repo.owner.html_url,
      publishedAt: new Date(repo.created_at),
      metrics: {
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        watchers: repo.watchers_count,
        openIssues: repo.open_issues_count
      },
      metadata: repo
    };
  }
  categorize(text, topics) {
    const allText = `${text} ${topics.join(" ")}`.toLowerCase();
    if (this.hasKeywords(allText, ["defi", "lending", "dex", "swap", "yield"])) {
      return "defi";
    }
    if (this.hasKeywords(allText, ["nft", "metaplex", "opensea", "collectible"])) {
      return "nft";
    }
    if (this.hasKeywords(allText, RELEVANCE_KEYWORDS.web3)) {
      return "web3";
    }
    if (this.hasKeywords(allText, RELEVANCE_KEYWORDS.ai)) {
      return "ai";
    }
    if (this.hasKeywords(allText, ["cli", "tool", "sdk", "library", "framework"])) {
      return "tooling";
    }
    return "other";
  }
  hasKeywords(text, keywords) {
    const lowerText = text.toLowerCase();
    return keywords.some((kw) => lowerText.includes(kw.toLowerCase()));
  }
  isRecentlyActive(repo) {
    if (!repo?.pushed_at) return false;
    const lastPush = new Date(repo.pushed_at);
    const daysSinceLastPush = (Date.now() - lastPush.getTime()) / (1e3 * 60 * 60 * 24);
    return daysSinceLastPush < 7;
  }
  generateFingerprint(raw) {
    const key = `github:${raw.sourceUrl}`;
    return createHash("sha256").update(key).digest("hex").slice(0, 32);
  }
};

// src/sources/hackernews-hunter.ts
import { createHash as createHash2, randomUUID as randomUUID2 } from "crypto";
var HN_API = "https://hacker-news.firebaseio.com/v0";
var HackerNewsHunter = class {
  source = "hackernews";
  config;
  constructor(config) {
    this.config = config;
  }
  async hunt() {
    const discoveries = [];
    const topStories = await this.fetchTopStories(100);
    discoveries.push(...topStories);
    const showHN = await this.fetchShowHN(50);
    discoveries.push(...showHN);
    const seen = /* @__PURE__ */ new Set();
    return discoveries.filter((d) => {
      if (seen.has(d.sourceId)) return false;
      seen.add(d.sourceId);
      return true;
    });
  }
  transform(raw) {
    const text = `${raw.title} ${raw.description ?? ""}`.toLowerCase();
    const metadata = raw.metadata;
    const isShowHN = raw.title.toLowerCase().startsWith("show hn:");
    return {
      id: randomUUID2(),
      source: "hackernews",
      sourceId: raw.sourceId,
      sourceUrl: raw.sourceUrl,
      title: raw.title,
      description: raw.description,
      author: raw.author,
      authorUrl: raw.authorUrl,
      publishedAt: raw.publishedAt,
      discoveredAt: /* @__PURE__ */ new Date(),
      category: this.categorize(text),
      tags: this.extractTags(text),
      language: void 0,
      metrics: raw.metrics,
      relevanceFactors: {
        hasWeb3Keywords: this.hasKeywords(text, RELEVANCE_KEYWORDS.web3),
        hasAIKeywords: this.hasKeywords(text, RELEVANCE_KEYWORDS.ai),
        hasSolanaKeywords: this.hasKeywords(text, RELEVANCE_KEYWORDS.solana),
        hasEthereumKeywords: this.hasKeywords(text, RELEVANCE_KEYWORDS.ethereum),
        hasTypeScript: this.hasKeywords(text, RELEVANCE_KEYWORDS.typescript),
        recentActivity: this.isRecent(metadata),
        highEngagement: (raw.metrics.points ?? 0) > 100 || (raw.metrics.comments ?? 0) > 50,
        isShowHN
      },
      rawMetadata: metadata,
      fingerprint: this.generateFingerprint(raw)
    };
  }
  async fetchTopStories(limit) {
    const response = await fetch(`${HN_API}/topstories.json`);
    if (!response.ok) {
      console.error("[HackerNewsHunter] Failed to fetch top stories");
      return [];
    }
    const ids = await response.json();
    const topIds = ids.slice(0, limit);
    return this.fetchItems(topIds);
  }
  async fetchShowHN(limit) {
    const response = await fetch(`${HN_API}/showstories.json`);
    if (!response.ok) {
      console.error("[HackerNewsHunter] Failed to fetch Show HN stories");
      return [];
    }
    const ids = await response.json();
    const topIds = ids.slice(0, limit);
    return this.fetchItems(topIds);
  }
  async fetchItems(ids) {
    const discoveries = [];
    const batchSize = 20;
    for (let i = 0; i < ids.length; i += batchSize) {
      const batch = ids.slice(i, i + batchSize);
      const items = await Promise.all(batch.map((id) => this.fetchItem(id)));
      for (const item of items) {
        if (!item || item.type !== "story") continue;
        if (!this.passesFilters(item)) continue;
        discoveries.push(this.itemToRawDiscovery(item));
      }
    }
    return discoveries;
  }
  async fetchItem(id) {
    try {
      const response = await fetch(`${HN_API}/item/${id}.json`);
      if (!response.ok) return null;
      return await response.json();
    } catch {
      return null;
    }
  }
  passesFilters(item) {
    const minPoints = this.config.filters?.minPoints ?? 20;
    const minEngagement = this.config.filters?.minEngagement ?? 5;
    if ((item.score ?? 0) < minPoints) return false;
    if ((item.descendants ?? 0) < minEngagement) return false;
    const text = `${item.title ?? ""} ${item.text ?? ""}`.toLowerCase();
    const keywords = this.config.filters?.keywords ?? [
      ...RELEVANCE_KEYWORDS.web3,
      ...RELEVANCE_KEYWORDS.ai
    ];
    const matchesKeywords = keywords.some(
      (kw) => text.includes(kw.toLowerCase())
    );
    if ((item.score ?? 0) >= 100) return true;
    return matchesKeywords;
  }
  itemToRawDiscovery(item) {
    const hnUrl = `https://news.ycombinator.com/item?id=${item.id}`;
    return {
      sourceId: String(item.id),
      sourceUrl: item.url ?? hnUrl,
      title: item.title ?? "Untitled",
      description: item.text ?? void 0,
      author: item.by,
      authorUrl: item.by ? `https://news.ycombinator.com/user?id=${item.by}` : void 0,
      publishedAt: new Date(item.time * 1e3),
      metrics: {
        points: item.score,
        comments: item.descendants
      },
      metadata: item
    };
  }
  categorize(text) {
    if (this.hasKeywords(text, ["defi", "lending", "dex", "swap", "yield"])) {
      return "defi";
    }
    if (this.hasKeywords(text, ["nft", "collectible", "opensea"])) {
      return "nft";
    }
    if (this.hasKeywords(text, RELEVANCE_KEYWORDS.web3)) {
      return "web3";
    }
    if (this.hasKeywords(text, RELEVANCE_KEYWORDS.ai)) {
      return "ai";
    }
    if (this.hasKeywords(text, ["cli", "tool", "sdk", "library", "framework"])) {
      return "tooling";
    }
    return "other";
  }
  extractTags(text) {
    const tags = [];
    if (this.hasKeywords(text, RELEVANCE_KEYWORDS.web3)) tags.push("web3");
    if (this.hasKeywords(text, RELEVANCE_KEYWORDS.ai)) tags.push("ai");
    if (this.hasKeywords(text, RELEVANCE_KEYWORDS.solana)) tags.push("solana");
    if (this.hasKeywords(text, RELEVANCE_KEYWORDS.ethereum)) tags.push("ethereum");
    if (text.includes("show hn:")) tags.push("show-hn");
    return tags;
  }
  hasKeywords(text, keywords) {
    const lowerText = text.toLowerCase();
    return keywords.some((kw) => lowerText.includes(kw.toLowerCase()));
  }
  isRecent(item) {
    if (!item?.time) return false;
    const postTime = new Date(item.time * 1e3);
    const hoursSincePost = (Date.now() - postTime.getTime()) / (1e3 * 60 * 60);
    return hoursSincePost < 24;
  }
  generateFingerprint(raw) {
    const key = `hackernews:${raw.sourceId}`;
    return createHash2("sha256").update(key).digest("hex").slice(0, 32);
  }
};

// src/sources/twitter-hunter.ts
import { createHash as createHash3, randomUUID as randomUUID3 } from "crypto";
var APIFY_API = "https://api.apify.com/v2";
var DEFAULT_SEARCH_KEYWORDS = [
  "solana dev",
  "ethereum dev",
  "web3 tool",
  "ai agent crypto",
  "defi protocol",
  "$SOL alpha",
  "blockchain framework"
];
var TwitterHunter = class {
  source = "twitter";
  config;
  apifyToken;
  constructor(config) {
    this.config = config;
    this.apifyToken = config.apifyToken ?? config.apiToken ?? process.env.APIFY_TOKEN ?? "";
  }
  async hunt() {
    if (!this.apifyToken) {
      console.warn(
        "[TwitterHunter] No Apify token configured. Set APIFY_TOKEN env var."
      );
      return [];
    }
    const discoveries = [];
    const keywords = this.config.searchKeywords ?? DEFAULT_SEARCH_KEYWORDS;
    for (const keyword of keywords) {
      try {
        const tweets = await this.searchTweets(keyword);
        discoveries.push(...tweets.map((t) => this.tweetToRawDiscovery(t)));
      } catch (error) {
        console.error(`[TwitterHunter] Failed to search for "${keyword}":`, error);
      }
    }
    const seen = /* @__PURE__ */ new Set();
    return discoveries.filter((d) => {
      if (seen.has(d.sourceId)) return false;
      seen.add(d.sourceId);
      return true;
    });
  }
  transform(raw) {
    const text = `${raw.title} ${raw.description ?? ""}`.toLowerCase();
    const metadata = raw.metadata;
    return {
      id: randomUUID3(),
      source: "twitter",
      sourceId: raw.sourceId,
      sourceUrl: raw.sourceUrl,
      title: raw.title,
      description: raw.description,
      author: raw.author,
      authorUrl: raw.authorUrl,
      publishedAt: raw.publishedAt,
      discoveredAt: /* @__PURE__ */ new Date(),
      category: this.categorize(text),
      tags: this.extractTags(text),
      language: void 0,
      metrics: raw.metrics,
      relevanceFactors: {
        hasWeb3Keywords: this.hasKeywords(text, RELEVANCE_KEYWORDS.web3),
        hasAIKeywords: this.hasKeywords(text, RELEVANCE_KEYWORDS.ai),
        hasSolanaKeywords: this.hasKeywords(text, RELEVANCE_KEYWORDS.solana),
        hasEthereumKeywords: this.hasKeywords(text, RELEVANCE_KEYWORDS.ethereum),
        hasTypeScript: this.hasKeywords(text, RELEVANCE_KEYWORDS.typescript),
        recentActivity: this.isRecent(metadata),
        highEngagement: (raw.metrics.likes ?? 0) > 50 || (raw.metrics.reposts ?? 0) > 20,
        isShowHN: false
      },
      rawMetadata: metadata,
      fingerprint: this.generateFingerprint(raw)
    };
  }
  async searchTweets(query) {
    const actorId = "apidojo~tweet-scraper";
    const runInput = {
      searchTerms: [query],
      maxTweets: 50,
      addUserInfo: true
      // Optional filters
      // minLikes: this.config.minLikes ?? 10,
      // minRetweets: this.config.minReposts ?? 5,
    };
    const runResponse = await fetch(
      `${APIFY_API}/acts/${actorId}/runs?token=${this.apifyToken}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(runInput)
      }
    );
    if (!runResponse.ok) {
      throw new Error(`Apify run failed: ${runResponse.status}`);
    }
    const runData = await runResponse.json();
    const runId = runData.data?.id;
    if (!runId) {
      throw new Error("No run ID returned from Apify");
    }
    const maxWaitMs = 6e4;
    const startTime = Date.now();
    while (Date.now() - startTime < maxWaitMs) {
      const statusResponse = await fetch(
        `${APIFY_API}/actor-runs/${runId}?token=${this.apifyToken}`
      );
      if (!statusResponse.ok) break;
      const statusData = await statusResponse.json();
      const status = statusData.data?.status;
      if (status === "SUCCEEDED") {
        const datasetId = statusData.data?.defaultDatasetId;
        if (!datasetId) return [];
        const resultsResponse = await fetch(
          `${APIFY_API}/datasets/${datasetId}/items?token=${this.apifyToken}`
        );
        if (!resultsResponse.ok) return [];
        return await resultsResponse.json();
      }
      if (status === "FAILED" || status === "ABORTED") {
        console.error(`[TwitterHunter] Apify run ${status}`);
        return [];
      }
      await new Promise((resolve) => setTimeout(resolve, 5e3));
    }
    console.warn("[TwitterHunter] Apify run timed out");
    return [];
  }
  tweetToRawDiscovery(tweet) {
    const tweetUrl = tweet.url ?? `https://twitter.com/${tweet.author?.userName ?? "unknown"}/status/${tweet.id}`;
    const title = tweet.text.length > 100 ? tweet.text.slice(0, 100) + "..." : tweet.text;
    return {
      sourceId: tweet.id,
      sourceUrl: tweetUrl,
      title,
      description: tweet.text,
      author: tweet.author?.userName,
      authorUrl: tweet.author?.userName ? `https://twitter.com/${tweet.author.userName}` : void 0,
      publishedAt: tweet.createdAt ? new Date(tweet.createdAt) : void 0,
      metrics: {
        likes: tweet.likeCount,
        reposts: tweet.retweetCount,
        comments: tweet.replyCount,
        views: tweet.viewCount
      },
      metadata: tweet
    };
  }
  categorize(text) {
    if (this.hasKeywords(text, ["defi", "lending", "dex", "swap", "yield"])) {
      return "defi";
    }
    if (this.hasKeywords(text, ["nft", "collectible", "mint", "pfp"])) {
      return "nft";
    }
    if (this.hasKeywords(text, RELEVANCE_KEYWORDS.web3)) {
      return "web3";
    }
    if (this.hasKeywords(text, RELEVANCE_KEYWORDS.ai)) {
      return "ai";
    }
    if (this.hasKeywords(text, ["sdk", "api", "framework", "tool"])) {
      return "tooling";
    }
    return "other";
  }
  extractTags(text) {
    const tags = [];
    if (this.hasKeywords(text, RELEVANCE_KEYWORDS.web3)) tags.push("web3");
    if (this.hasKeywords(text, RELEVANCE_KEYWORDS.ai)) tags.push("ai");
    if (this.hasKeywords(text, RELEVANCE_KEYWORDS.solana)) tags.push("solana");
    if (this.hasKeywords(text, RELEVANCE_KEYWORDS.ethereum)) tags.push("ethereum");
    const hashtags = text.match(/#\w+/g) ?? [];
    tags.push(
      ...hashtags.map((h) => h.slice(1).toLowerCase()).slice(0, 5)
    );
    return [...new Set(tags)];
  }
  hasKeywords(text, keywords) {
    const lowerText = text.toLowerCase();
    return keywords.some((kw) => lowerText.includes(kw.toLowerCase()));
  }
  isRecent(tweet) {
    if (!tweet?.createdAt) return false;
    const postTime = new Date(tweet.createdAt);
    const hoursSincePost = (Date.now() - postTime.getTime()) / (1e3 * 60 * 60);
    return hoursSincePost < 6;
  }
  generateFingerprint(raw) {
    const key = `twitter:${raw.sourceId}`;
    return createHash3("sha256").update(key).digest("hex").slice(0, 32);
  }
};
var NitterHunter = class {
  source = "twitter";
  nitterInstances = [
    "https://nitter.net",
    "https://nitter.it",
    "https://nitter.privacydev.net"
  ];
  constructor(_config) {
  }
  async hunt() {
    console.warn(
      "[NitterHunter] Nitter is less reliable. Consider using Apify for production."
    );
    return [];
  }
  transform(raw) {
    return {
      id: randomUUID3(),
      source: "twitter",
      sourceId: raw.sourceId,
      sourceUrl: raw.sourceUrl,
      title: raw.title,
      description: raw.description,
      author: raw.author,
      authorUrl: raw.authorUrl,
      publishedAt: raw.publishedAt,
      discoveredAt: /* @__PURE__ */ new Date(),
      category: "other",
      tags: [],
      language: void 0,
      metrics: raw.metrics,
      relevanceFactors: {
        hasWeb3Keywords: false,
        hasAIKeywords: false,
        hasSolanaKeywords: false,
        hasEthereumKeywords: false,
        hasTypeScript: false,
        recentActivity: false,
        highEngagement: false,
        isShowHN: false
      },
      rawMetadata: raw.metadata,
      fingerprint: this.generateFingerprint(raw)
    };
  }
  generateFingerprint(raw) {
    const key = `twitter:${raw.sourceId}`;
    return createHash3("sha256").update(key).digest("hex").slice(0, 32);
  }
};

// src/sources/reddit-hunter.ts
import { createHash as createHash4, randomUUID as randomUUID4 } from "crypto";
var REDDIT_API = "https://www.reddit.com";
var TARGET_SUBREDDITS = [
  // AI/ML
  "MachineLearning",
  "LocalLLaMA",
  "artificial",
  "deeplearning",
  // Crypto/Web3
  "CryptoCurrency",
  "solana",
  "ethereum",
  "defi",
  // Development
  "programming",
  "webdev",
  "typescript",
  "node",
  "rust",
  // Startups/Products
  "startups",
  "SideProject",
  "coolgithubprojects"
];
var RedditHunter = class {
  source = "reddit";
  config;
  constructor(config) {
    this.config = config;
  }
  async hunt() {
    const discoveries = [];
    for (const subreddit of TARGET_SUBREDDITS) {
      try {
        const posts = await this.fetchSubreddit(subreddit);
        discoveries.push(...posts);
        await new Promise((r) => setTimeout(r, 1e3));
      } catch (error) {
        console.error(`[RedditHunter] Failed to fetch r/${subreddit}:`, error);
      }
    }
    const seen = /* @__PURE__ */ new Set();
    return discoveries.filter((d) => {
      if (seen.has(d.sourceId)) return false;
      seen.add(d.sourceId);
      return true;
    });
  }
  transform(raw) {
    const text = `${raw.title} ${raw.description ?? ""}`.toLowerCase();
    const metadata = raw.metadata;
    return {
      id: randomUUID4(),
      source: "reddit",
      sourceId: raw.sourceId,
      sourceUrl: raw.sourceUrl,
      title: raw.title,
      description: raw.description,
      author: raw.author,
      authorUrl: raw.authorUrl,
      publishedAt: raw.publishedAt,
      discoveredAt: /* @__PURE__ */ new Date(),
      category: this.categorize(text),
      tags: this.extractTags(text, metadata?.subreddit),
      language: void 0,
      metrics: raw.metrics,
      relevanceFactors: {
        hasWeb3Keywords: this.hasKeywords(text, RELEVANCE_KEYWORDS.web3),
        hasAIKeywords: this.hasKeywords(text, RELEVANCE_KEYWORDS.ai),
        hasSolanaKeywords: this.hasKeywords(text, RELEVANCE_KEYWORDS.solana),
        hasEthereumKeywords: this.hasKeywords(text, RELEVANCE_KEYWORDS.ethereum),
        hasTypeScript: this.hasKeywords(text, RELEVANCE_KEYWORDS.typescript),
        recentActivity: this.isRecent(metadata),
        highEngagement: (raw.metrics.points ?? 0) > 100 || (raw.metrics.comments ?? 0) > 50,
        isShowHN: false
      },
      rawMetadata: metadata,
      fingerprint: this.generateFingerprint(raw)
    };
  }
  async fetchSubreddit(subreddit) {
    const discoveries = [];
    for (const sort of ["hot", "new"]) {
      try {
        const response = await fetch(
          `${REDDIT_API}/r/${subreddit}/${sort}.json?limit=25`,
          {
            headers: {
              "User-Agent": "gICM-Hunter/1.0 (Tech Discovery Bot)"
            }
          }
        );
        if (!response.ok) continue;
        const data = await response.json();
        for (const child of data.data.children) {
          const post = child.data;
          if (!this.passesFilters(post)) continue;
          discoveries.push(this.postToRawDiscovery(post));
        }
      } catch {
      }
    }
    return discoveries;
  }
  passesFilters(post) {
    const minPoints = this.config.filters?.minPoints ?? 10;
    const minEngagement = this.config.filters?.minEngagement ?? 3;
    if (post.score < minPoints) return false;
    if (post.num_comments < minEngagement) return false;
    const text = `${post.title} ${post.selftext ?? ""}`.toLowerCase();
    const keywords = this.config.filters?.keywords ?? [
      ...RELEVANCE_KEYWORDS.web3,
      ...RELEVANCE_KEYWORDS.ai,
      "github",
      "open source",
      "tool",
      "library",
      "framework",
      "sdk"
    ];
    const matchesKeywords = keywords.some((kw) => text.includes(kw.toLowerCase()));
    if (post.score >= 100) return true;
    return matchesKeywords;
  }
  postToRawDiscovery(post) {
    const redditUrl = `https://reddit.com${post.permalink}`;
    return {
      sourceId: post.id,
      sourceUrl: post.url.startsWith("http") ? post.url : redditUrl,
      title: `[r/${post.subreddit}] ${post.title}`,
      description: post.selftext?.slice(0, 500),
      author: post.author,
      authorUrl: `https://reddit.com/user/${post.author}`,
      publishedAt: new Date(post.created_utc * 1e3),
      metrics: {
        points: post.score,
        comments: post.num_comments
      },
      metadata: post
    };
  }
  categorize(text) {
    if (this.hasKeywords(text, ["defi", "lending", "dex", "swap", "yield"])) {
      return "defi";
    }
    if (this.hasKeywords(text, ["nft", "collectible"])) {
      return "nft";
    }
    if (this.hasKeywords(text, RELEVANCE_KEYWORDS.web3)) {
      return "web3";
    }
    if (this.hasKeywords(text, RELEVANCE_KEYWORDS.ai)) {
      return "ai";
    }
    if (this.hasKeywords(text, ["cli", "tool", "sdk", "library", "framework"])) {
      return "tooling";
    }
    return "other";
  }
  extractTags(text, subreddit) {
    const tags = [];
    if (subreddit) tags.push(`r/${subreddit.toLowerCase()}`);
    if (this.hasKeywords(text, RELEVANCE_KEYWORDS.web3)) tags.push("web3");
    if (this.hasKeywords(text, RELEVANCE_KEYWORDS.ai)) tags.push("ai");
    if (this.hasKeywords(text, RELEVANCE_KEYWORDS.solana)) tags.push("solana");
    if (this.hasKeywords(text, RELEVANCE_KEYWORDS.ethereum)) tags.push("ethereum");
    return tags;
  }
  hasKeywords(text, keywords) {
    const lowerText = text.toLowerCase();
    return keywords.some((kw) => lowerText.includes(kw.toLowerCase()));
  }
  isRecent(post) {
    if (!post?.created_utc) return false;
    const postTime = new Date(post.created_utc * 1e3);
    const hoursSincePost = (Date.now() - postTime.getTime()) / (1e3 * 60 * 60);
    return hoursSincePost < 24;
  }
  generateFingerprint(raw) {
    const key = `reddit:${raw.sourceId}`;
    return createHash4("sha256").update(key).digest("hex").slice(0, 32);
  }
};

// src/sources/producthunt-hunter.ts
import { createHash as createHash5, randomUUID as randomUUID5 } from "crypto";
var PH_API = "https://api.producthunt.com/v2/api/graphql";
var POSTS_QUERY = `
query GetPosts($first: Int!, $order: PostsOrder!) {
  posts(first: $first, order: $order) {
    edges {
      node {
        id
        name
        tagline
        description
        url
        website
        votesCount
        commentsCount
        createdAt
        makers {
          name
          username
        }
        topics {
          edges {
            node {
              name
            }
          }
        }
      }
    }
  }
}`;
var ProductHuntHunter = class {
  source = "producthunt";
  config;
  apiToken;
  constructor(config) {
    this.config = config;
    this.apiToken = config.apiToken;
  }
  async hunt() {
    const discoveries = [];
    for (const order of ["NEWEST", "VOTES"]) {
      try {
        const posts = await this.fetchPosts(order, 50);
        discoveries.push(...posts);
      } catch (error) {
        console.error(`[ProductHuntHunter] Failed to fetch ${order}:`, error);
      }
    }
    const seen = /* @__PURE__ */ new Set();
    return discoveries.filter((d) => {
      if (seen.has(d.sourceId)) return false;
      seen.add(d.sourceId);
      return true;
    });
  }
  transform(raw) {
    const text = `${raw.title} ${raw.description ?? ""}`.toLowerCase();
    const metadata = raw.metadata;
    const topics = metadata?.topics?.map((t) => t.name.toLowerCase()) ?? [];
    return {
      id: randomUUID5(),
      source: "producthunt",
      sourceId: raw.sourceId,
      sourceUrl: raw.sourceUrl,
      title: raw.title,
      description: raw.description,
      author: raw.author,
      authorUrl: raw.authorUrl,
      publishedAt: raw.publishedAt,
      discoveredAt: /* @__PURE__ */ new Date(),
      category: this.categorize(text, topics),
      tags: this.extractTags(text, topics),
      language: void 0,
      metrics: raw.metrics,
      relevanceFactors: {
        hasWeb3Keywords: this.hasKeywords(text, RELEVANCE_KEYWORDS.web3),
        hasAIKeywords: this.hasKeywords(text, RELEVANCE_KEYWORDS.ai),
        hasSolanaKeywords: this.hasKeywords(text, RELEVANCE_KEYWORDS.solana),
        hasEthereumKeywords: this.hasKeywords(text, RELEVANCE_KEYWORDS.ethereum),
        hasTypeScript: this.hasKeywords(text, RELEVANCE_KEYWORDS.typescript),
        recentActivity: this.isRecent(metadata),
        highEngagement: (raw.metrics.points ?? 0) > 200,
        isShowHN: false
      },
      rawMetadata: metadata,
      fingerprint: this.generateFingerprint(raw)
    };
  }
  async fetchPosts(order, limit) {
    if (!this.apiToken) {
      return this.fetchFromRSS();
    }
    const response = await fetch(PH_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiToken}`
      },
      body: JSON.stringify({
        query: POSTS_QUERY,
        variables: { first: limit, order }
      })
    });
    if (!response.ok) {
      console.error("[ProductHuntHunter] API request failed, using RSS fallback");
      return this.fetchFromRSS();
    }
    const data = await response.json();
    const posts = data.data?.posts?.edges ?? [];
    return posts.map((edge) => this.nodeToRawDiscovery(edge.node)).filter((d) => this.passesFilters(d));
  }
  async fetchFromRSS() {
    try {
      const response = await fetch("https://www.producthunt.com/feed?category=undefined", {
        headers: {
          "User-Agent": "gICM-Hunter/1.0 (Tech Discovery Bot)"
        }
      });
      if (!response.ok) return [];
      const text = await response.text();
      const discoveries = [];
      const itemRegex = /<item>([\s\S]*?)<\/item>/g;
      let match;
      while ((match = itemRegex.exec(text)) !== null) {
        const item = match[1];
        const title = this.extractXMLTag(item, "title");
        const link = this.extractXMLTag(item, "link");
        const description = this.extractXMLTag(item, "description");
        const pubDate = this.extractXMLTag(item, "pubDate");
        if (title && link) {
          discoveries.push({
            sourceId: createHash5("md5").update(link).digest("hex"),
            sourceUrl: link,
            title: `[PH] ${title}`,
            description: description?.slice(0, 500),
            publishedAt: pubDate ? new Date(pubDate) : void 0,
            metrics: {
              points: 0,
              comments: 0
            }
          });
        }
      }
      return discoveries.filter((d) => this.passesFilters(d));
    } catch {
      return [];
    }
  }
  extractXMLTag(xml, tag) {
    const regex = new RegExp(`<${tag}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}>([\\s\\S]*?)<\\/${tag}>`);
    const match = regex.exec(xml);
    return match?.[1] ?? match?.[2];
  }
  nodeToRawDiscovery(node) {
    const makers = node.makers ?? [];
    const topics = (node.topics?.edges ?? []).map((e) => ({ name: e.node.name }));
    return {
      sourceId: node.id,
      sourceUrl: node.url,
      title: `[PH] ${node.name}: ${node.tagline}`,
      description: node.description,
      author: makers[0]?.name,
      authorUrl: makers[0] ? `https://producthunt.com/@${makers[0].username}` : void 0,
      publishedAt: new Date(node.createdAt),
      metrics: {
        points: node.votesCount,
        comments: node.commentsCount
      },
      metadata: { ...node, topics }
    };
  }
  passesFilters(discovery) {
    const text = `${discovery.title} ${discovery.description ?? ""}`.toLowerCase();
    const keywords = this.config.filters?.keywords ?? [
      ...RELEVANCE_KEYWORDS.web3,
      ...RELEVANCE_KEYWORDS.ai,
      "developer",
      "api",
      "sdk",
      "open source",
      "automation"
    ];
    return keywords.some((kw) => text.includes(kw.toLowerCase()));
  }
  categorize(text, topics) {
    if (topics.includes("web3") || this.hasKeywords(text, RELEVANCE_KEYWORDS.web3)) {
      return "web3";
    }
    if (topics.includes("artificial intelligence") || this.hasKeywords(text, RELEVANCE_KEYWORDS.ai)) {
      return "ai";
    }
    if (this.hasKeywords(text, ["defi", "lending", "swap"])) {
      return "defi";
    }
    if (topics.includes("developer tools") || this.hasKeywords(text, ["cli", "sdk", "api"])) {
      return "tooling";
    }
    return "other";
  }
  extractTags(text, topics) {
    const tags = topics.slice(0, 5);
    if (this.hasKeywords(text, RELEVANCE_KEYWORDS.web3)) tags.push("web3");
    if (this.hasKeywords(text, RELEVANCE_KEYWORDS.ai)) tags.push("ai");
    return [...new Set(tags)];
  }
  hasKeywords(text, keywords) {
    const lowerText = text.toLowerCase();
    return keywords.some((kw) => lowerText.includes(kw.toLowerCase()));
  }
  isRecent(post) {
    if (!post?.createdAt) return false;
    const postTime = new Date(post.createdAt);
    const hoursSincePost = (Date.now() - postTime.getTime()) / (1e3 * 60 * 60);
    return hoursSincePost < 48;
  }
  generateFingerprint(raw) {
    const key = `producthunt:${raw.sourceId}`;
    return createHash5("sha256").update(key).digest("hex").slice(0, 32);
  }
};

// src/sources/arxiv-hunter.ts
import { createHash as createHash6, randomUUID as randomUUID6 } from "crypto";
var ARXIV_API = "http://export.arxiv.org/api/query";
var TARGET_CATEGORIES = [
  "cs.AI",
  // Artificial Intelligence
  "cs.LG",
  // Machine Learning
  "cs.CL",
  // Computation and Language (NLP)
  "cs.CV",
  // Computer Vision
  "cs.CR",
  // Cryptography and Security
  "cs.DC",
  // Distributed Computing
  "cs.NE",
  // Neural and Evolutionary Computing
  "stat.ML"
  // Machine Learning (stat)
];
var SEARCH_QUERIES = [
  "blockchain",
  "smart contract",
  "decentralized",
  "large language model",
  "transformer",
  "attention mechanism",
  "AI agent",
  "reinforcement learning",
  "zero knowledge",
  "zkSNARK"
];
var ArxivHunter = class {
  source = "arxiv";
  config;
  constructor(config) {
    this.config = config;
  }
  async hunt() {
    const discoveries = [];
    for (const category of TARGET_CATEGORIES.slice(0, 5)) {
      try {
        const papers = await this.fetchCategory(category, 20);
        discoveries.push(...papers);
        await new Promise((r) => setTimeout(r, 3e3));
      } catch (error) {
        console.error(`[ArxivHunter] Failed to fetch ${category}:`, error);
      }
    }
    for (const query of SEARCH_QUERIES.slice(0, 3)) {
      try {
        const papers = await this.searchPapers(query, 10);
        discoveries.push(...papers);
        await new Promise((r) => setTimeout(r, 3e3));
      } catch (error) {
        console.error(`[ArxivHunter] Failed to search "${query}":`, error);
      }
    }
    const seen = /* @__PURE__ */ new Set();
    return discoveries.filter((d) => {
      if (seen.has(d.sourceId)) return false;
      seen.add(d.sourceId);
      return true;
    });
  }
  transform(raw) {
    const text = `${raw.title} ${raw.description ?? ""}`.toLowerCase();
    const metadata = raw.metadata;
    return {
      id: randomUUID6(),
      source: "arxiv",
      sourceId: raw.sourceId,
      sourceUrl: raw.sourceUrl,
      title: raw.title,
      description: raw.description,
      author: raw.author,
      authorUrl: raw.authorUrl,
      publishedAt: raw.publishedAt,
      discoveredAt: /* @__PURE__ */ new Date(),
      category: this.categorize(text, metadata?.categories ?? []),
      tags: this.extractTags(text, metadata?.categories ?? []),
      language: void 0,
      metrics: raw.metrics,
      relevanceFactors: {
        hasWeb3Keywords: this.hasKeywords(text, RELEVANCE_KEYWORDS.web3),
        hasAIKeywords: this.hasKeywords(text, RELEVANCE_KEYWORDS.ai),
        hasSolanaKeywords: this.hasKeywords(text, RELEVANCE_KEYWORDS.solana),
        hasEthereumKeywords: this.hasKeywords(text, RELEVANCE_KEYWORDS.ethereum),
        hasTypeScript: false,
        recentActivity: this.isRecent(metadata),
        highEngagement: false,
        // ArXiv doesn't have engagement metrics
        isShowHN: false
      },
      rawMetadata: metadata,
      fingerprint: this.generateFingerprint(raw)
    };
  }
  async fetchCategory(category, maxResults) {
    const params = new URLSearchParams({
      search_query: `cat:${category}`,
      start: "0",
      max_results: String(maxResults),
      sortBy: "submittedDate",
      sortOrder: "descending"
    });
    const response = await fetch(`${ARXIV_API}?${params}`);
    if (!response.ok) return [];
    const xml = await response.text();
    return this.parseAtomFeed(xml);
  }
  async searchPapers(query, maxResults) {
    const params = new URLSearchParams({
      search_query: `all:${query}`,
      start: "0",
      max_results: String(maxResults),
      sortBy: "submittedDate",
      sortOrder: "descending"
    });
    const response = await fetch(`${ARXIV_API}?${params}`);
    if (!response.ok) return [];
    const xml = await response.text();
    return this.parseAtomFeed(xml);
  }
  parseAtomFeed(xml) {
    const discoveries = [];
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
    let match;
    while ((match = entryRegex.exec(xml)) !== null) {
      const entry = match[1];
      const id = this.extractTag(entry, "id");
      const title = this.extractTag(entry, "title")?.replace(/\s+/g, " ").trim();
      const summary = this.extractTag(entry, "summary")?.replace(/\s+/g, " ").trim();
      const published = this.extractTag(entry, "published");
      const updated = this.extractTag(entry, "updated");
      const authorRegex = /<author>[\s\S]*?<name>(.*?)<\/name>[\s\S]*?<\/author>/g;
      const authors = [];
      let authorMatch;
      while ((authorMatch = authorRegex.exec(entry)) !== null) {
        authors.push(authorMatch[1]);
      }
      const categoryRegex = /category term="([^"]+)"/g;
      const categories = [];
      let catMatch;
      while ((catMatch = categoryRegex.exec(entry)) !== null) {
        categories.push(catMatch[1]);
      }
      const pdfMatch = /href="([^"]+)" title="pdf"/i.exec(entry);
      const pdfLink = pdfMatch?.[1];
      if (id && title) {
        const arxivId = id.replace("http://arxiv.org/abs/", "");
        if (!this.passesFilters(title, summary ?? "", categories)) continue;
        discoveries.push({
          sourceId: arxivId,
          sourceUrl: id,
          title: `[ArXiv] ${title}`,
          description: summary?.slice(0, 800),
          author: authors.slice(0, 3).join(", "),
          authorUrl: `https://arxiv.org/search/?query=${encodeURIComponent(authors[0] ?? "")}&searchtype=author`,
          publishedAt: published ? new Date(published) : void 0,
          metrics: {
            views: 0
          },
          metadata: {
            id: arxivId,
            title,
            summary,
            authors,
            published,
            updated,
            link: id,
            categories,
            pdfLink
          }
        });
      }
    }
    return discoveries;
  }
  extractTag(xml, tag) {
    const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`);
    const match = regex.exec(xml);
    return match?.[1];
  }
  passesFilters(title, summary, categories) {
    const text = `${title} ${summary}`.toLowerCase();
    if (categories.some((c) => TARGET_CATEGORIES.includes(c))) {
      return true;
    }
    const keywords = [
      ...RELEVANCE_KEYWORDS.ai,
      ...RELEVANCE_KEYWORDS.web3,
      "zero knowledge",
      "zksnark",
      "zkstark",
      "mpc",
      "homomorphic"
    ];
    return keywords.some((kw) => text.includes(kw.toLowerCase()));
  }
  categorize(text, categories) {
    if (categories.includes("cs.CR") || this.hasKeywords(text, RELEVANCE_KEYWORDS.web3)) {
      return "web3";
    }
    if (categories.some((c) => ["cs.AI", "cs.LG", "cs.CL", "cs.CV", "cs.NE", "stat.ML"].includes(c)) || this.hasKeywords(text, RELEVANCE_KEYWORDS.ai)) {
      return "ai";
    }
    return "other";
  }
  extractTags(text, categories) {
    const tags = categories.slice(0, 3);
    if (this.hasKeywords(text, RELEVANCE_KEYWORDS.web3)) tags.push("web3");
    if (this.hasKeywords(text, RELEVANCE_KEYWORDS.ai)) tags.push("ai");
    if (this.hasKeywords(text, ["llm", "large language model", "gpt", "transformer"])) {
      tags.push("llm");
    }
    if (this.hasKeywords(text, ["zero knowledge", "zksnark", "zkstark"])) {
      tags.push("zk");
    }
    return [...new Set(tags)];
  }
  hasKeywords(text, keywords) {
    const lowerText = text.toLowerCase();
    return keywords.some((kw) => lowerText.includes(kw.toLowerCase()));
  }
  isRecent(entry) {
    if (!entry?.published) return false;
    const pubTime = new Date(entry.published);
    const daysSincePub = (Date.now() - pubTime.getTime()) / (1e3 * 60 * 60 * 24);
    return daysSincePub < 7;
  }
  generateFingerprint(raw) {
    const key = `arxiv:${raw.sourceId}`;
    return createHash6("sha256").update(key).digest("hex").slice(0, 32);
  }
};

// src/sources/lobsters-hunter.ts
import { createHash as createHash7, randomUUID as randomUUID7 } from "crypto";
var LOBSTERS_API = "https://lobste.rs";
var LobstersHunter = class {
  source = "lobsters";
  config;
  constructor(config) {
    this.config = config;
  }
  async hunt() {
    const discoveries = [];
    try {
      const hottest = await this.fetchHottest();
      discoveries.push(...hottest);
    } catch (error) {
      console.error("[LobstersHunter] Failed to fetch hottest:", error);
    }
    try {
      const newest = await this.fetchNewest();
      discoveries.push(...newest);
    } catch (error) {
      console.error("[LobstersHunter] Failed to fetch newest:", error);
    }
    const tags = ["ai", "crypto", "rust", "programming", "web", "security"];
    for (const tag of tags) {
      try {
        const tagged = await this.fetchByTag(tag);
        discoveries.push(...tagged);
        await new Promise((r) => setTimeout(r, 500));
      } catch (error) {
        console.error(`[LobstersHunter] Failed to fetch tag ${tag}:`, error);
      }
    }
    const seen = /* @__PURE__ */ new Set();
    return discoveries.filter((d) => {
      if (seen.has(d.sourceId)) return false;
      seen.add(d.sourceId);
      return true;
    });
  }
  transform(raw) {
    const text = `${raw.title} ${raw.description ?? ""}`.toLowerCase();
    const metadata = raw.metadata;
    return {
      id: randomUUID7(),
      source: "lobsters",
      sourceId: raw.sourceId,
      sourceUrl: raw.sourceUrl,
      title: raw.title,
      description: raw.description,
      author: raw.author,
      authorUrl: raw.authorUrl,
      publishedAt: raw.publishedAt,
      discoveredAt: /* @__PURE__ */ new Date(),
      category: this.categorize(text, metadata?.tags ?? []),
      tags: this.extractTags(text, metadata?.tags ?? []),
      language: void 0,
      metrics: raw.metrics,
      relevanceFactors: {
        hasWeb3Keywords: this.hasKeywords(text, RELEVANCE_KEYWORDS.web3),
        hasAIKeywords: this.hasKeywords(text, RELEVANCE_KEYWORDS.ai),
        hasSolanaKeywords: this.hasKeywords(text, RELEVANCE_KEYWORDS.solana),
        hasEthereumKeywords: this.hasKeywords(text, RELEVANCE_KEYWORDS.ethereum),
        hasTypeScript: this.hasKeywords(text, RELEVANCE_KEYWORDS.typescript),
        recentActivity: this.isRecent(metadata),
        highEngagement: (raw.metrics.points ?? 0) > 30 || (raw.metrics.comments ?? 0) > 20,
        isShowHN: false
      },
      rawMetadata: metadata,
      fingerprint: this.generateFingerprint(raw)
    };
  }
  async fetchHottest() {
    const response = await fetch(`${LOBSTERS_API}/hottest.json`, {
      headers: { "User-Agent": "gICM-Hunter/1.0" }
    });
    if (!response.ok) return [];
    const stories = await response.json();
    return stories.filter((s) => this.passesFilters(s)).map((s) => this.storyToRawDiscovery(s));
  }
  async fetchNewest() {
    const response = await fetch(`${LOBSTERS_API}/newest.json`, {
      headers: { "User-Agent": "gICM-Hunter/1.0" }
    });
    if (!response.ok) return [];
    const stories = await response.json();
    return stories.filter((s) => this.passesFilters(s)).map((s) => this.storyToRawDiscovery(s));
  }
  async fetchByTag(tag) {
    const response = await fetch(`${LOBSTERS_API}/t/${tag}.json`, {
      headers: { "User-Agent": "gICM-Hunter/1.0" }
    });
    if (!response.ok) return [];
    const stories = await response.json();
    return stories.filter((s) => this.passesFilters(s)).map((s) => this.storyToRawDiscovery(s));
  }
  passesFilters(story) {
    const minPoints = this.config.filters?.minPoints ?? 5;
    if (story.score < minPoints) return false;
    const text = `${story.title} ${story.description ?? ""} ${story.tags.join(" ")}`.toLowerCase();
    const keywords = this.config.filters?.keywords ?? [
      ...RELEVANCE_KEYWORDS.web3,
      ...RELEVANCE_KEYWORDS.ai,
      "rust",
      "typescript",
      "security",
      "distributed",
      "open source"
    ];
    const matchesKeywords = keywords.some((kw) => text.includes(kw.toLowerCase()));
    if (story.score >= 20) return true;
    return matchesKeywords;
  }
  storyToRawDiscovery(story) {
    return {
      sourceId: story.short_id,
      sourceUrl: story.url || story.short_id_url,
      title: `[Lobsters] ${story.title}`,
      description: story.description || void 0,
      author: story.submitter_user.username,
      authorUrl: `https://lobste.rs/~${story.submitter_user.username}`,
      publishedAt: new Date(story.created_at),
      metrics: {
        points: story.score,
        comments: story.comment_count
      },
      metadata: story
    };
  }
  categorize(text, tags) {
    if (tags.includes("crypto") || this.hasKeywords(text, RELEVANCE_KEYWORDS.web3)) {
      return "web3";
    }
    if (tags.includes("ai") || tags.includes("ml") || this.hasKeywords(text, RELEVANCE_KEYWORDS.ai)) {
      return "ai";
    }
    if (tags.some((t) => ["programming", "rust", "go", "python", "javascript"].includes(t))) {
      return "tooling";
    }
    return "other";
  }
  extractTags(text, storyTags) {
    const tags = storyTags.slice(0, 5);
    if (this.hasKeywords(text, RELEVANCE_KEYWORDS.web3)) tags.push("web3");
    if (this.hasKeywords(text, RELEVANCE_KEYWORDS.ai)) tags.push("ai");
    return [...new Set(tags)];
  }
  hasKeywords(text, keywords) {
    const lowerText = text.toLowerCase();
    return keywords.some((kw) => lowerText.includes(kw.toLowerCase()));
  }
  isRecent(story) {
    if (!story?.created_at) return false;
    const postTime = new Date(story.created_at);
    const hoursSincePost = (Date.now() - postTime.getTime()) / (1e3 * 60 * 60);
    return hoursSincePost < 24;
  }
  generateFingerprint(raw) {
    const key = `lobsters:${raw.sourceId}`;
    return createHash7("sha256").update(key).digest("hex").slice(0, 32);
  }
};

// src/sources/devto-hunter.ts
import { createHash as createHash8, randomUUID as randomUUID8 } from "crypto";
var DEVTO_API = "https://dev.to/api";
var TARGET_TAGS = [
  "ai",
  "machinelearning",
  "webdev",
  "typescript",
  "javascript",
  "rust",
  "blockchain",
  "web3",
  "solana",
  "ethereum",
  "crypto",
  "opensource",
  "programming",
  "devops",
  "security"
];
var DevToHunter = class {
  source = "devto";
  config;
  constructor(config) {
    this.config = config;
  }
  async hunt() {
    const discoveries = [];
    try {
      const top = await this.fetchArticles("top", 30);
      discoveries.push(...top);
    } catch (error) {
      console.error("[DevToHunter] Failed to fetch top:", error);
    }
    try {
      const latest = await this.fetchArticles("latest", 30);
      discoveries.push(...latest);
    } catch (error) {
      console.error("[DevToHunter] Failed to fetch latest:", error);
    }
    for (const tag of TARGET_TAGS.slice(0, 5)) {
      try {
        const tagged = await this.fetchByTag(tag, 15);
        discoveries.push(...tagged);
        await new Promise((r) => setTimeout(r, 300));
      } catch (error) {
        console.error(`[DevToHunter] Failed to fetch tag ${tag}:`, error);
      }
    }
    const seen = /* @__PURE__ */ new Set();
    return discoveries.filter((d) => {
      if (seen.has(d.sourceId)) return false;
      seen.add(d.sourceId);
      return true;
    });
  }
  transform(raw) {
    const text = `${raw.title} ${raw.description ?? ""}`.toLowerCase();
    const metadata = raw.metadata;
    return {
      id: randomUUID8(),
      source: "devto",
      sourceId: raw.sourceId,
      sourceUrl: raw.sourceUrl,
      title: raw.title,
      description: raw.description,
      author: raw.author,
      authorUrl: raw.authorUrl,
      publishedAt: raw.publishedAt,
      discoveredAt: /* @__PURE__ */ new Date(),
      category: this.categorize(text, metadata?.tag_list ?? []),
      tags: this.extractTags(text, metadata?.tag_list ?? []),
      language: void 0,
      metrics: raw.metrics,
      relevanceFactors: {
        hasWeb3Keywords: this.hasKeywords(text, RELEVANCE_KEYWORDS.web3),
        hasAIKeywords: this.hasKeywords(text, RELEVANCE_KEYWORDS.ai),
        hasSolanaKeywords: this.hasKeywords(text, RELEVANCE_KEYWORDS.solana),
        hasEthereumKeywords: this.hasKeywords(text, RELEVANCE_KEYWORDS.ethereum),
        hasTypeScript: this.hasKeywords(text, RELEVANCE_KEYWORDS.typescript),
        recentActivity: this.isRecent(metadata),
        highEngagement: (raw.metrics.likes ?? 0) > 50,
        isShowHN: false
      },
      rawMetadata: metadata,
      fingerprint: this.generateFingerprint(raw)
    };
  }
  async fetchArticles(type, perPage) {
    const response = await fetch(
      `${DEVTO_API}/articles?per_page=${perPage}&state=rising${type === "top" ? "&top=7" : ""}`,
      {
        headers: {
          "User-Agent": "gICM-Hunter/1.0",
          Accept: "application/json"
        }
      }
    );
    if (!response.ok) return [];
    const articles = await response.json();
    return articles.filter((a) => this.passesFilters(a)).map((a) => this.articleToRawDiscovery(a));
  }
  async fetchByTag(tag, perPage) {
    const response = await fetch(`${DEVTO_API}/articles?tag=${tag}&per_page=${perPage}`, {
      headers: {
        "User-Agent": "gICM-Hunter/1.0",
        Accept: "application/json"
      }
    });
    if (!response.ok) return [];
    const articles = await response.json();
    return articles.filter((a) => this.passesFilters(a)).map((a) => this.articleToRawDiscovery(a));
  }
  passesFilters(article) {
    const minReactions = this.config.filters?.minPoints ?? 10;
    if (article.positive_reactions_count < minReactions) return false;
    const text = `${article.title} ${article.description ?? ""} ${article.tag_list.join(" ")}`.toLowerCase();
    const keywords = this.config.filters?.keywords ?? [
      ...RELEVANCE_KEYWORDS.web3,
      ...RELEVANCE_KEYWORDS.ai,
      "tutorial",
      "guide",
      "tool",
      "library",
      "framework",
      "open source"
    ];
    const matchesKeywords = keywords.some((kw) => text.includes(kw.toLowerCase()));
    if (article.positive_reactions_count >= 100) return true;
    if (article.tag_list.some((t) => TARGET_TAGS.includes(t.toLowerCase()))) return true;
    return matchesKeywords;
  }
  articleToRawDiscovery(article) {
    return {
      sourceId: String(article.id),
      sourceUrl: article.url,
      title: `[DevTo] ${article.title}`,
      description: article.description,
      author: article.user.name,
      authorUrl: `https://dev.to/${article.user.username}`,
      publishedAt: new Date(article.published_at),
      metrics: {
        likes: article.positive_reactions_count,
        comments: article.comments_count,
        views: article.public_reactions_count
      },
      metadata: article
    };
  }
  categorize(text, tags) {
    const tagSet = new Set(tags.map((t) => t.toLowerCase()));
    if (tagSet.has("blockchain") || tagSet.has("web3") || tagSet.has("crypto") || this.hasKeywords(text, RELEVANCE_KEYWORDS.web3)) {
      return "web3";
    }
    if (tagSet.has("ai") || tagSet.has("machinelearning") || this.hasKeywords(text, RELEVANCE_KEYWORDS.ai)) {
      return "ai";
    }
    if (tagSet.has("defi")) {
      return "defi";
    }
    if (tags.some((t) => ["programming", "typescript", "javascript", "rust", "python"].includes(t.toLowerCase()))) {
      return "tooling";
    }
    return "other";
  }
  extractTags(text, articleTags) {
    const tags = articleTags.slice(0, 5);
    if (this.hasKeywords(text, RELEVANCE_KEYWORDS.web3)) tags.push("web3");
    if (this.hasKeywords(text, RELEVANCE_KEYWORDS.ai)) tags.push("ai");
    return [...new Set(tags)];
  }
  hasKeywords(text, keywords) {
    const lowerText = text.toLowerCase();
    return keywords.some((kw) => lowerText.includes(kw.toLowerCase()));
  }
  isRecent(article) {
    if (!article?.published_at) return false;
    const pubTime = new Date(article.published_at);
    const hoursSincePub = (Date.now() - pubTime.getTime()) / (1e3 * 60 * 60);
    return hoursSincePub < 48;
  }
  generateFingerprint(raw) {
    const key = `devto:${raw.sourceId}`;
    return createHash8("sha256").update(key).digest("hex").slice(0, 32);
  }
};

// src/sources/tiktok-hunter.ts
import { createHash as createHash9, randomUUID as randomUUID9 } from "crypto";
var APIFY_API2 = "https://api.apify.com/v2";
var TARGET_HASHTAGS = [
  // Crypto
  "crypto",
  "bitcoin",
  "ethereum",
  "solana",
  "defi",
  "web3",
  "nft",
  "altcoin",
  "cryptotok",
  "cryptonews",
  // AI
  "ai",
  "chatgpt",
  "artificialintelligence",
  "machinelearning",
  "aitools",
  // Tech/Dev
  "coding",
  "programming",
  "tech",
  "startup",
  "developer"
];
var TikTokHunter = class {
  source = "tiktok";
  config;
  apifyToken;
  constructor(config) {
    this.config = config;
    this.apifyToken = config.apiToken ?? process.env.APIFY_TOKEN;
  }
  async hunt() {
    if (!this.apifyToken) {
      console.error("[TikTokHunter] No Apify token configured");
      return [];
    }
    const discoveries = [];
    for (const hashtag of TARGET_HASHTAGS.slice(0, 5)) {
      try {
        const videos = await this.searchHashtag(hashtag);
        discoveries.push(...videos);
        await new Promise((r) => setTimeout(r, 2e3));
      } catch (error) {
        console.error(`[TikTokHunter] Failed to search #${hashtag}:`, error);
      }
    }
    const seen = /* @__PURE__ */ new Set();
    return discoveries.filter((d) => {
      if (seen.has(d.sourceId)) return false;
      seen.add(d.sourceId);
      return true;
    });
  }
  transform(raw) {
    const text = `${raw.title} ${raw.description ?? ""}`.toLowerCase();
    const metadata = raw.metadata;
    const hashtags = metadata?.hashtags?.map((h) => h.name.toLowerCase()) ?? [];
    return {
      id: randomUUID9(),
      source: "tiktok",
      sourceId: raw.sourceId,
      sourceUrl: raw.sourceUrl,
      title: raw.title,
      description: raw.description,
      author: raw.author,
      authorUrl: raw.authorUrl,
      publishedAt: raw.publishedAt,
      discoveredAt: /* @__PURE__ */ new Date(),
      category: this.categorize(text, hashtags),
      tags: this.extractTags(text, hashtags),
      language: void 0,
      metrics: raw.metrics,
      relevanceFactors: {
        hasWeb3Keywords: this.hasKeywords(text, RELEVANCE_KEYWORDS.web3),
        hasAIKeywords: this.hasKeywords(text, RELEVANCE_KEYWORDS.ai),
        hasSolanaKeywords: this.hasKeywords(text, RELEVANCE_KEYWORDS.solana),
        hasEthereumKeywords: this.hasKeywords(text, RELEVANCE_KEYWORDS.ethereum),
        hasTypeScript: false,
        recentActivity: this.isRecent(metadata),
        highEngagement: (raw.metrics.views ?? 0) > 1e5 || (raw.metrics.likes ?? 0) > 1e4,
        isShowHN: false
      },
      rawMetadata: metadata,
      fingerprint: this.generateFingerprint(raw)
    };
  }
  async searchHashtag(hashtag) {
    const runUrl = `${APIFY_API2}/acts/clockworks~tiktok-scraper/run-sync-get-dataset-items`;
    const response = await fetch(runUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apifyToken}`
      },
      body: JSON.stringify({
        hashtags: [hashtag],
        resultsPerPage: 30,
        profileScrapeSections: ["videos"],
        profileSorting: "latest",
        excludePinnedPosts: false,
        searchSection: "",
        maxProfilesPerQuery: 5,
        scrapeRelatedVideos: false,
        shouldDownloadVideos: false,
        shouldDownloadCovers: false
      })
    });
    if (!response.ok) {
      const error = await response.text();
      console.error(`[TikTokHunter] Apify error for #${hashtag}:`, error);
      return [];
    }
    const videos = await response.json();
    return videos.filter((v) => this.passesFilters(v)).map((v) => this.videoToRawDiscovery(v, hashtag));
  }
  passesFilters(video) {
    const minViews = this.config.filters?.minPoints ?? 1e4;
    if (video.playCount < minViews) return false;
    const text = `${video.text} ${video.hashtags?.map((h) => h.name).join(" ") ?? ""}`.toLowerCase();
    const keywords = this.config.filters?.keywords ?? [
      ...RELEVANCE_KEYWORDS.web3,
      ...RELEVANCE_KEYWORDS.ai,
      "alpha",
      "gem",
      "100x",
      "pump",
      "launch",
      "airdrop"
    ];
    const matchesKeywords = keywords.some((kw) => text.includes(kw.toLowerCase()));
    if (video.playCount >= 1e6 || video.diggCount >= 1e5) return true;
    return matchesKeywords;
  }
  videoToRawDiscovery(video, hashtag) {
    const text = video.text.slice(0, 200);
    const username = video.authorMeta.name;
    return {
      sourceId: video.id,
      sourceUrl: video.webVideoUrl,
      title: `[TikTok #${hashtag}] @${username}: ${text}`,
      description: video.text,
      author: video.authorMeta.nickName || video.authorMeta.name,
      authorUrl: `https://tiktok.com/@${username}`,
      publishedAt: new Date(video.createTime * 1e3),
      metrics: {
        views: video.playCount,
        likes: video.diggCount,
        comments: video.commentCount,
        reposts: video.shareCount
      },
      metadata: video
    };
  }
  categorize(text, hashtags) {
    const hastagSet = new Set(hashtags);
    if (hastagSet.has("crypto") || hastagSet.has("bitcoin") || hastagSet.has("solana") || hastagSet.has("ethereum") || this.hasKeywords(text, RELEVANCE_KEYWORDS.web3)) {
      return "web3";
    }
    if (hastagSet.has("ai") || hastagSet.has("chatgpt") || this.hasKeywords(text, RELEVANCE_KEYWORDS.ai)) {
      return "ai";
    }
    if (hastagSet.has("defi") || this.hasKeywords(text, ["defi", "yield", "lending"])) {
      return "defi";
    }
    if (hastagSet.has("nft")) {
      return "nft";
    }
    return "other";
  }
  extractTags(text, hashtags) {
    const tags = hashtags.slice(0, 5);
    if (this.hasKeywords(text, RELEVANCE_KEYWORDS.web3)) tags.push("web3");
    if (this.hasKeywords(text, RELEVANCE_KEYWORDS.ai)) tags.push("ai");
    if (this.hasKeywords(text, ["alpha", "gem", "100x"])) tags.push("alpha");
    return [...new Set(tags)];
  }
  hasKeywords(text, keywords) {
    const lowerText = text.toLowerCase();
    return keywords.some((kw) => lowerText.includes(kw.toLowerCase()));
  }
  isRecent(video) {
    if (!video?.createTime) return false;
    const postTime = new Date(video.createTime * 1e3);
    const hoursSincePost = (Date.now() - postTime.getTime()) / (1e3 * 60 * 60);
    return hoursSincePost < 24;
  }
  generateFingerprint(raw) {
    const key = `tiktok:${raw.sourceId}`;
    return createHash9("sha256").update(key).digest("hex").slice(0, 32);
  }
};

// src/sources/defillama-hunter.ts
import { createHash as createHash10, randomUUID as randomUUID10 } from "crypto";
var DEFILLAMA_API = "https://api.llama.fi";
var YIELDS_API = "https://yields.llama.fi";
var TARGET_CHAINS = [
  "Solana",
  "Ethereum",
  "Arbitrum",
  "Base",
  "Optimism",
  "BSC",
  "Polygon",
  "Avalanche"
];
var TARGET_CATEGORIES2 = [
  "Dexes",
  "Lending",
  "Liquid Staking",
  "Bridge",
  "Yield",
  "Derivatives",
  "CDP",
  "Yield Aggregator",
  "Leveraged Farming"
];
var DeFiLlamaHunter = class {
  source = "defillama";
  config;
  constructor(config) {
    this.config = config;
  }
  async hunt() {
    const discoveries = [];
    try {
      const protocols = await this.fetchProtocols();
      const filtered = this.filterProtocols(protocols);
      discoveries.push(...filtered.map((p) => this.protocolToRawDiscovery(p)));
    } catch (error) {
      console.error("[DeFiLlamaHunter] Failed to fetch protocols:", error);
    }
    try {
      const yields = await this.fetchYields();
      const topYields = this.filterYields(yields);
      discoveries.push(...topYields.map((y) => this.yieldToRawDiscovery(y)));
    } catch (error) {
      console.error("[DeFiLlamaHunter] Failed to fetch yields:", error);
    }
    const seen = /* @__PURE__ */ new Set();
    return discoveries.filter((d) => {
      if (seen.has(d.sourceId)) return false;
      seen.add(d.sourceId);
      return true;
    });
  }
  transform(raw) {
    const text = `${raw.title} ${raw.description ?? ""}`.toLowerCase();
    const metadata = raw.metadata;
    return {
      id: randomUUID10(),
      source: "defillama",
      sourceId: raw.sourceId,
      sourceUrl: raw.sourceUrl,
      title: raw.title,
      description: raw.description,
      author: raw.author,
      authorUrl: raw.authorUrl,
      publishedAt: raw.publishedAt,
      discoveredAt: /* @__PURE__ */ new Date(),
      category: this.categorize(text, metadata),
      tags: this.extractTags(text, metadata),
      language: void 0,
      metrics: raw.metrics,
      relevanceFactors: {
        hasWeb3Keywords: true,
        // DeFi is always web3
        hasAIKeywords: this.hasKeywords(text, RELEVANCE_KEYWORDS.ai),
        hasSolanaKeywords: this.hasKeywords(text, RELEVANCE_KEYWORDS.solana),
        hasEthereumKeywords: this.hasKeywords(text, RELEVANCE_KEYWORDS.ethereum),
        hasTypeScript: false,
        recentActivity: this.hasSignificantChange(metadata),
        highEngagement: (raw.metrics.points ?? 0) > 1e6,
        // $1M+ TVL
        isShowHN: false
      },
      rawMetadata: metadata,
      fingerprint: this.generateFingerprint(raw)
    };
  }
  async fetchProtocols() {
    const response = await fetch(`${DEFILLAMA_API}/protocols`, {
      headers: { "User-Agent": "gICM-Hunter/1.0" }
    });
    if (!response.ok) {
      throw new Error(`DeFiLlama API error: ${response.status}`);
    }
    return response.json();
  }
  async fetchYields() {
    const response = await fetch(`${YIELDS_API}/pools`, {
      headers: { "User-Agent": "gICM-Hunter/1.0" }
    });
    if (!response.ok) {
      throw new Error(`DeFiLlama Yields API error: ${response.status}`);
    }
    const data = await response.json();
    return data.data ?? [];
  }
  filterProtocols(protocols) {
    const minTvl = this.config.filters?.minPoints ?? 1e5;
    const minChange = 5;
    return protocols.filter((p) => {
      if (p.tvl < minTvl) return false;
      if (!p.chains.some((c) => TARGET_CHAINS.includes(c))) return false;
      if (!TARGET_CATEGORIES2.includes(p.category)) return false;
      const hasSignificantChange = Math.abs(p.change_1d ?? 0) > minChange || Math.abs(p.change_7d ?? 0) > minChange * 2;
      if (p.tvl > 1e7) return true;
      return hasSignificantChange;
    });
  }
  filterYields(yields) {
    const minTvl = 5e4;
    const minApy = 5;
    return yields.filter((y) => {
      if (y.tvlUsd < minTvl) return false;
      if (!TARGET_CHAINS.includes(y.chain)) return false;
      if (y.apy < minApy) return false;
      if (y.apy > 1e3) return false;
      return true;
    }).sort((a, b) => {
      const scoreA = a.tvlUsd * Math.min(a.apy, 100);
      const scoreB = b.tvlUsd * Math.min(b.apy, 100);
      return scoreB - scoreA;
    }).slice(0, 50);
  }
  protocolToRawDiscovery(protocol) {
    const changeStr = protocol.change_1d ? `${protocol.change_1d > 0 ? "+" : ""}${protocol.change_1d.toFixed(1)}%` : "";
    return {
      sourceId: `defillama:protocol:${protocol.id}`,
      sourceUrl: protocol.url || `https://defillama.com/protocol/${protocol.id}`,
      title: `[DeFi] ${protocol.name} - $${this.formatNumber(protocol.tvl)} TVL ${changeStr}`,
      description: protocol.description || `${protocol.category} on ${protocol.chains.join(", ")}`,
      author: protocol.name,
      authorUrl: protocol.twitter ? `https://twitter.com/${protocol.twitter}` : void 0,
      publishedAt: void 0,
      metrics: {
        points: protocol.tvl,
        views: protocol.mcap
      },
      metadata: protocol
    };
  }
  yieldToRawDiscovery(pool) {
    return {
      sourceId: `defillama:yield:${pool.pool}`,
      sourceUrl: `https://defillama.com/yields/pool/${pool.pool}`,
      title: `[Yield] ${pool.project} ${pool.symbol} - ${pool.apy.toFixed(1)}% APY on ${pool.chain}`,
      description: `TVL: $${this.formatNumber(pool.tvlUsd)} | ${pool.stablecoin ? "Stablecoin" : "Volatile"} | IL Risk: ${pool.ilRisk}`,
      author: pool.project,
      publishedAt: void 0,
      metrics: {
        points: pool.tvlUsd,
        likes: pool.apy
      },
      metadata: pool
    };
  }
  categorize(text, metadata) {
    if ("category" in (metadata ?? {})) {
      const cat = metadata.category?.toLowerCase();
      if (cat?.includes("dex") || cat?.includes("swap")) return "defi";
      if (cat?.includes("lending") || cat?.includes("cdp")) return "defi";
    }
    if ("apy" in (metadata ?? {})) return "defi";
    return "defi";
  }
  extractTags(text, metadata) {
    const tags = ["defi", "tvl"];
    if (metadata && "chains" in metadata) {
      tags.push(...metadata.chains.slice(0, 3).map((c) => c.toLowerCase()));
      if (metadata.category) {
        tags.push(metadata.category.toLowerCase());
      }
    }
    if (metadata && "chain" in metadata) {
      tags.push(metadata.chain.toLowerCase());
      tags.push("yield");
      if (metadata.stablecoin) tags.push("stablecoin");
    }
    return [...new Set(tags)];
  }
  hasKeywords(text, keywords) {
    const lowerText = text.toLowerCase();
    return keywords.some((kw) => lowerText.includes(kw.toLowerCase()));
  }
  hasSignificantChange(metadata) {
    if (!metadata) return false;
    if ("change_1d" in metadata) {
      return Math.abs(metadata.change_1d ?? 0) > 5;
    }
    if ("apyPct1D" in metadata) {
      return Math.abs(metadata.apyPct1D ?? 0) > 10;
    }
    return false;
  }
  formatNumber(num) {
    if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
    return num.toFixed(0);
  }
  generateFingerprint(raw) {
    const key = `defillama:${raw.sourceId}`;
    return createHash10("sha256").update(key).digest("hex").slice(0, 32);
  }
};

// src/sources/geckoterminal-hunter.ts
import { createHash as createHash11, randomUUID as randomUUID11 } from "crypto";
var GECKOTERMINAL_API = "https://api.geckoterminal.com/api/v2";
var TARGET_NETWORKS = [
  "solana",
  "eth",
  "base",
  "arbitrum",
  "bsc",
  "polygon",
  "optimism",
  "avalanche"
];
var GeckoTerminalHunter = class {
  source = "geckoterminal";
  config;
  constructor(config) {
    this.config = config;
  }
  async hunt() {
    const discoveries = [];
    for (const network of TARGET_NETWORKS.slice(0, 4)) {
      try {
        const newPools = await this.fetchNewPools(network);
        discoveries.push(...newPools.map((p) => this.poolToRawDiscovery(p, network, "new")));
        await new Promise((r) => setTimeout(r, 2100));
      } catch (error) {
        console.error(`[GeckoTerminalHunter] Failed to fetch new pools for ${network}:`, error);
      }
    }
    for (const network of TARGET_NETWORKS.slice(0, 4)) {
      try {
        const trendingPools = await this.fetchTrendingPools(network);
        discoveries.push(...trendingPools.map((p) => this.poolToRawDiscovery(p, network, "trending")));
        await new Promise((r) => setTimeout(r, 2100));
      } catch (error) {
        console.error(`[GeckoTerminalHunter] Failed to fetch trending pools for ${network}:`, error);
      }
    }
    const seen = /* @__PURE__ */ new Set();
    return discoveries.filter((d) => {
      if (seen.has(d.sourceId)) return false;
      seen.add(d.sourceId);
      return true;
    });
  }
  transform(raw) {
    const text = `${raw.title} ${raw.description ?? ""}`.toLowerCase();
    const metadata = raw.metadata;
    return {
      id: randomUUID11(),
      source: "geckoterminal",
      sourceId: raw.sourceId,
      sourceUrl: raw.sourceUrl,
      title: raw.title,
      description: raw.description,
      author: raw.author,
      authorUrl: raw.authorUrl,
      publishedAt: raw.publishedAt,
      discoveredAt: /* @__PURE__ */ new Date(),
      category: "defi",
      tags: this.extractTags(text, metadata),
      language: void 0,
      metrics: raw.metrics,
      relevanceFactors: {
        hasWeb3Keywords: true,
        hasAIKeywords: this.hasKeywords(text, RELEVANCE_KEYWORDS.ai),
        hasSolanaKeywords: metadata?.network === "solana" || this.hasKeywords(text, RELEVANCE_KEYWORDS.solana),
        hasEthereumKeywords: metadata?.network === "eth" || this.hasKeywords(text, RELEVANCE_KEYWORDS.ethereum),
        hasTypeScript: false,
        recentActivity: this.isNewPool(metadata?.pool),
        highEngagement: (raw.metrics.views ?? 0) > 1e5,
        // $100K+ volume
        isShowHN: false
      },
      rawMetadata: metadata,
      fingerprint: this.generateFingerprint(raw)
    };
  }
  async fetchNewPools(network) {
    const response = await fetch(
      `${GECKOTERMINAL_API}/networks/${network}/new_pools?page=1`,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "gICM-Hunter/1.0"
        }
      }
    );
    if (!response.ok) {
      throw new Error(`GeckoTerminal API error: ${response.status}`);
    }
    const data = await response.json();
    return this.filterPools(data.data ?? []);
  }
  async fetchTrendingPools(network) {
    const response = await fetch(
      `${GECKOTERMINAL_API}/networks/${network}/trending_pools?page=1`,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "gICM-Hunter/1.0"
        }
      }
    );
    if (!response.ok) {
      throw new Error(`GeckoTerminal API error: ${response.status}`);
    }
    const data = await response.json();
    return this.filterPools(data.data ?? []);
  }
  filterPools(pools) {
    const minLiquidity = this.config.filters?.minPoints ?? 1e4;
    const minVolume = 1e3;
    return pools.filter((pool) => {
      const liquidity = parseFloat(pool.attributes.reserve_in_usd || "0");
      const volume24h = parseFloat(pool.attributes.volume_usd?.h24 || "0");
      if (liquidity < minLiquidity) return false;
      if (volume24h < minVolume) return false;
      const txns = pool.attributes.transactions?.h24;
      if (txns && txns.sells === 0 && txns.buys > 10) return false;
      return true;
    });
  }
  poolToRawDiscovery(pool, network, type) {
    const attrs = pool.attributes;
    const liquidity = parseFloat(attrs.reserve_in_usd || "0");
    const volume24h = parseFloat(attrs.volume_usd?.h24 || "0");
    const priceChange24h = parseFloat(attrs.price_change_percentage?.h24 || "0");
    const txns = attrs.transactions?.h24;
    const priceChangeStr = priceChange24h !== 0 ? `${priceChange24h > 0 ? "+" : ""}${priceChange24h.toFixed(1)}%` : "";
    const createdAt = attrs.pool_created_at ? new Date(attrs.pool_created_at) : void 0;
    const isNew = createdAt && Date.now() - createdAt.getTime() < 24 * 60 * 60 * 1e3;
    return {
      sourceId: `geckoterminal:${pool.id}`,
      sourceUrl: `https://www.geckoterminal.com/${network}/pools/${attrs.address}`,
      title: `[${type === "new" ? "NEW" : "HOT"}] ${attrs.name} on ${network.toUpperCase()} ${priceChangeStr}`,
      description: `Liquidity: $${this.formatNumber(liquidity)} | Vol 24h: $${this.formatNumber(volume24h)} | ${txns ? `Buys: ${txns.buys} Sells: ${txns.sells}` : ""}${isNew ? " | JUST LAUNCHED" : ""}`,
      author: network,
      authorUrl: `https://www.geckoterminal.com/${network}`,
      publishedAt: createdAt,
      metrics: {
        points: liquidity,
        views: volume24h,
        likes: txns?.buys ?? 0,
        comments: txns?.sells ?? 0
      },
      metadata: { pool, network, type }
    };
  }
  extractTags(text, metadata) {
    const tags = ["dex", "pool"];
    if (metadata) {
      tags.push(metadata.network);
      tags.push(metadata.type);
      const dexId = metadata.pool.relationships?.dex?.data?.id;
      if (dexId) {
        const dexName = dexId.split("_").pop();
        if (dexName) tags.push(dexName);
      }
    }
    if (this.hasKeywords(text, ["meme", "pepe", "doge", "shib", "bonk", "wif"])) {
      tags.push("memecoin");
    }
    return [...new Set(tags)];
  }
  hasKeywords(text, keywords) {
    const lowerText = text.toLowerCase();
    return keywords.some((kw) => lowerText.includes(kw.toLowerCase()));
  }
  isNewPool(pool) {
    if (!pool?.attributes.pool_created_at) return false;
    const created = new Date(pool.attributes.pool_created_at);
    const hoursSinceCreation = (Date.now() - created.getTime()) / (1e3 * 60 * 60);
    return hoursSinceCreation < 24;
  }
  formatNumber(num) {
    if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
    return num.toFixed(0);
  }
  generateFingerprint(raw) {
    const key = `geckoterminal:${raw.sourceId}`;
    return createHash11("sha256").update(key).digest("hex").slice(0, 32);
  }
};

// src/sources/feargreed-hunter.ts
import { createHash as createHash12, randomUUID as randomUUID12 } from "crypto";
var FEAR_GREED_API = "https://api.alternative.me/fng";
var FearGreedHunter = class {
  source = "feargreed";
  config;
  constructor(config) {
    this.config = config;
  }
  async hunt() {
    const discoveries = [];
    try {
      const response = await fetch(`${FEAR_GREED_API}/?limit=30&format=json`, {
        headers: { "User-Agent": "gICM-Hunter/1.0" }
      });
      if (!response.ok) {
        throw new Error(`Fear & Greed API error: ${response.status}`);
      }
      const data = await response.json();
      if (data.data && data.data.length > 0) {
        const current = data.data[0];
        discoveries.push(this.createDiscovery(current, "current", data.data));
        if (data.data.length >= 7) {
          const weekAgo = data.data[6];
          const weekChange = parseInt(current.value) - parseInt(weekAgo.value);
          if (Math.abs(weekChange) >= 15) {
            discoveries.push(this.createTrendDiscovery(current, weekAgo, weekChange));
          }
        }
        const value = parseInt(current.value);
        if (value <= 25 || value >= 75) {
          discoveries.push(this.createExtremeDiscovery(current));
        }
      }
    } catch (error) {
      console.error("[FearGreedHunter] Failed to fetch data:", error);
    }
    return discoveries;
  }
  transform(raw) {
    const metadata = raw.metadata;
    return {
      id: randomUUID12(),
      source: "feargreed",
      sourceId: raw.sourceId,
      sourceUrl: raw.sourceUrl,
      title: raw.title,
      description: raw.description,
      author: raw.author,
      authorUrl: raw.authorUrl,
      publishedAt: raw.publishedAt,
      discoveredAt: /* @__PURE__ */ new Date(),
      category: "other",
      tags: this.extractTags(metadata),
      language: void 0,
      metrics: raw.metrics,
      relevanceFactors: {
        hasWeb3Keywords: true,
        hasAIKeywords: false,
        hasSolanaKeywords: false,
        hasEthereumKeywords: false,
        hasTypeScript: false,
        recentActivity: true,
        highEngagement: this.isExtreme(metadata?.current),
        isShowHN: false
      },
      rawMetadata: metadata,
      fingerprint: this.generateFingerprint(raw)
    };
  }
  createDiscovery(current, type, history) {
    const value = parseInt(current.value);
    const signal = this.getSignal(value);
    const emoji = this.getEmoji(value);
    const avg7d = this.calculateAverage(history.slice(0, 7));
    const avg30d = this.calculateAverage(history);
    return {
      sourceId: `feargreed:${type}:${current.timestamp}`,
      sourceUrl: "https://alternative.me/crypto/fear-and-greed-index/",
      title: `${emoji} Crypto Fear & Greed: ${value} (${current.value_classification}) - Signal: ${signal}`,
      description: `Current: ${value}/100 | 7d Avg: ${avg7d.toFixed(0)} | 30d Avg: ${avg30d.toFixed(0)} | ${this.getTradingAdvice(value)}`,
      author: "Alternative.me",
      authorUrl: "https://alternative.me",
      publishedAt: new Date(parseInt(current.timestamp) * 1e3),
      metrics: {
        points: value,
        views: avg7d,
        likes: avg30d
      },
      metadata: { current, type, history }
    };
  }
  createTrendDiscovery(current, previous, change) {
    const direction = change > 0 ? "UP" : "DOWN";
    const emoji = change > 0 ? "\u{1F4C8}" : "\u{1F4C9}";
    return {
      sourceId: `feargreed:trend:${current.timestamp}`,
      sourceUrl: "https://alternative.me/crypto/fear-and-greed-index/",
      title: `${emoji} Fear & Greed ${direction} ${Math.abs(change)} points in 7 days`,
      description: `From ${previous.value} (${previous.value_classification}) to ${current.value} (${current.value_classification}). ${change > 0 ? "Sentiment improving - caution on FOMO" : "Sentiment deteriorating - watch for buying opportunity"}`,
      author: "Alternative.me",
      publishedAt: new Date(parseInt(current.timestamp) * 1e3),
      metrics: {
        points: Math.abs(change),
        views: parseInt(current.value)
      },
      metadata: { current, previous, change, type: "trend" }
    };
  }
  createExtremeDiscovery(current) {
    const value = parseInt(current.value);
    const isExtremeFear = value <= 25;
    const emoji = isExtremeFear ? "\u{1F7E2}" : "\u{1F534}";
    const signal = isExtremeFear ? "CONTRARIAN BUY SIGNAL" : "CONTRARIAN SELL SIGNAL";
    return {
      sourceId: `feargreed:extreme:${current.timestamp}`,
      sourceUrl: "https://alternative.me/crypto/fear-and-greed-index/",
      title: `${emoji} EXTREME ${isExtremeFear ? "FEAR" : "GREED"}: ${value}/100 - ${signal}`,
      description: isExtremeFear ? "Historically, extreme fear readings (below 25) have been good buying opportunities. Warren Buffett: 'Be greedy when others are fearful.'" : "Historically, extreme greed readings (above 75) often precede corrections. Consider taking profits or reducing exposure.",
      author: "Alternative.me",
      publishedAt: new Date(parseInt(current.timestamp) * 1e3),
      metrics: {
        points: value
      },
      metadata: { current, type: "extreme", isExtremeFear }
    };
  }
  getSignal(value) {
    if (value <= 25) return "BUY";
    if (value <= 45) return "ACCUMULATE";
    if (value <= 55) return "HOLD";
    if (value <= 75) return "CAUTION";
    return "SELL";
  }
  getEmoji(value) {
    if (value <= 25) return "\u{1F631}";
    if (value <= 45) return "\u{1F630}";
    if (value <= 55) return "\u{1F610}";
    if (value <= 75) return "\u{1F60A}";
    return "\u{1F911}";
  }
  getTradingAdvice(value) {
    if (value <= 25) return "Extreme fear = potential buying opportunity";
    if (value <= 45) return "Fear present - consider DCA accumulation";
    if (value <= 55) return "Neutral sentiment - market indecision";
    if (value <= 75) return "Greed rising - be cautious with new positions";
    return "Extreme greed = consider taking profits";
  }
  calculateAverage(data) {
    if (data.length === 0) return 50;
    const sum = data.reduce((acc, d) => acc + parseInt(d.value), 0);
    return sum / data.length;
  }
  isExtreme(data) {
    if (!data) return false;
    const value = parseInt(data.value);
    return value <= 25 || value >= 75;
  }
  extractTags(metadata) {
    const tags = ["sentiment", "fear-greed"];
    if (metadata?.current) {
      const value = parseInt(metadata.current.value);
      tags.push(metadata.current.value_classification.toLowerCase().replace(" ", "-"));
      if (value <= 25) tags.push("extreme-fear", "buy-signal");
      else if (value >= 75) tags.push("extreme-greed", "sell-signal");
    }
    if (metadata?.type === "trend") tags.push("trend-change");
    if (metadata?.type === "extreme") tags.push("extreme-reading");
    return tags;
  }
  generateFingerprint(raw) {
    const key = `feargreed:${raw.sourceId}`;
    return createHash12("sha256").update(key).digest("hex").slice(0, 32);
  }
};

// src/sources/binance-hunter.ts
import { createHash as createHash13, randomUUID as randomUUID13 } from "crypto";
var BINANCE_API = "https://data-api.binance.vision/api/v3";
var TRACKED_PAIRS = [
  // Major crypto
  "BTCUSDT",
  "ETHUSDT",
  "SOLUSDT",
  "BNBUSDT",
  // Solana ecosystem
  "BONKUSDT",
  "WIFUSDT",
  "JUPUSDT",
  "RAYUSDT",
  "PYTHUSDT",
  // AI tokens
  "RENDERUSDT",
  "TAOUSDT",
  "FETUSDT",
  "AGIXUSDT",
  // DeFi
  "UNIUSDT",
  "AAVEUSDT",
  "MKRUSDT",
  "COMPUSDT",
  // Layer 2
  "ARBUSDT",
  "OPUSDT",
  "MATICUSDT",
  // Memecoins
  "DOGEUSDT",
  "SHIBUSDT",
  "PEPEUSDT",
  "FLOKIUSDT"
];
var BinanceHunter = class {
  source = "binance";
  config;
  constructor(config) {
    this.config = config;
  }
  async hunt() {
    const discoveries = [];
    try {
      const tickers = await this.fetch24hrTickers();
      const significant = this.filterSignificantMoves(tickers);
      discoveries.push(...significant.map((t) => this.tickerToDiscovery(t)));
      const volumeAnomalies = this.findVolumeAnomalies(tickers);
      discoveries.push(...volumeAnomalies.map((t) => this.volumeAnomalyToDiscovery(t)));
    } catch (error) {
      console.error("[BinanceHunter] Failed to fetch data:", error);
    }
    const seen = /* @__PURE__ */ new Set();
    return discoveries.filter((d) => {
      if (seen.has(d.sourceId)) return false;
      seen.add(d.sourceId);
      return true;
    });
  }
  transform(raw) {
    const text = `${raw.title} ${raw.description ?? ""}`.toLowerCase();
    const metadata = raw.metadata;
    return {
      id: randomUUID13(),
      source: "binance",
      sourceId: raw.sourceId,
      sourceUrl: raw.sourceUrl,
      title: raw.title,
      description: raw.description,
      author: raw.author,
      authorUrl: raw.authorUrl,
      publishedAt: raw.publishedAt,
      discoveredAt: /* @__PURE__ */ new Date(),
      category: this.categorize(metadata?.symbol),
      tags: this.extractTags(text, metadata),
      language: void 0,
      metrics: raw.metrics,
      relevanceFactors: {
        hasWeb3Keywords: true,
        hasAIKeywords: this.isAIToken(metadata?.symbol),
        hasSolanaKeywords: this.isSolanaToken(metadata?.symbol),
        hasEthereumKeywords: this.hasKeywords(text, RELEVANCE_KEYWORDS.ethereum),
        hasTypeScript: false,
        recentActivity: true,
        highEngagement: metadata?.type === "volume_anomaly" || Math.abs(raw.metrics.likes ?? 0) > 10,
        isShowHN: false
      },
      rawMetadata: metadata,
      fingerprint: this.generateFingerprint(raw)
    };
  }
  async fetch24hrTickers() {
    const response = await fetch(`${BINANCE_API}/ticker/24hr`, {
      headers: { "User-Agent": "gICM-Hunter/1.0" }
    });
    if (!response.ok) {
      throw new Error(`Binance API error: ${response.status}`);
    }
    const allTickers = await response.json();
    return allTickers.filter((t) => TRACKED_PAIRS.includes(t.symbol));
  }
  filterSignificantMoves(tickers) {
    const threshold = this.config.filters?.minPoints ?? 5;
    return tickers.filter((t) => {
      const changePercent = parseFloat(t.priceChangePercent);
      return Math.abs(changePercent) >= threshold;
    });
  }
  findVolumeAnomalies(tickers) {
    const volumeThreshold = 1e8;
    return tickers.filter((t) => {
      const volume = parseFloat(t.quoteVolume);
      return volume > volumeThreshold;
    });
  }
  tickerToDiscovery(ticker) {
    const changePercent = parseFloat(ticker.priceChangePercent);
    const price = parseFloat(ticker.lastPrice);
    const volume = parseFloat(ticker.quoteVolume);
    const emoji = changePercent > 0 ? "\u{1F7E2}" : "\u{1F534}";
    const symbol = ticker.symbol.replace("USDT", "");
    return {
      sourceId: `binance:ticker:${ticker.symbol}:${ticker.closeTime}`,
      sourceUrl: `https://www.binance.com/en/trade/${symbol}_USDT`,
      title: `${emoji} [CEX] ${symbol}: $${this.formatPrice(price)} (${changePercent > 0 ? "+" : ""}${changePercent.toFixed(2)}%)`,
      description: `24h Vol: $${this.formatNumber(volume)} | High: $${parseFloat(ticker.highPrice).toFixed(4)} | Low: $${parseFloat(ticker.lowPrice).toFixed(4)} | Trades: ${ticker.count.toLocaleString()}`,
      author: "Binance",
      authorUrl: "https://www.binance.com",
      publishedAt: new Date(ticker.closeTime),
      metrics: {
        points: price,
        views: volume,
        likes: changePercent,
        comments: ticker.count
      },
      metadata: { ...ticker, type: "price_move", symbol }
    };
  }
  volumeAnomalyToDiscovery(ticker) {
    const volume = parseFloat(ticker.quoteVolume);
    const changePercent = parseFloat(ticker.priceChangePercent);
    const symbol = ticker.symbol.replace("USDT", "");
    return {
      sourceId: `binance:volume:${ticker.symbol}:${ticker.closeTime}`,
      sourceUrl: `https://www.binance.com/en/trade/${symbol}_USDT`,
      title: `\u{1F4CA} [VOLUME] ${symbol}: $${this.formatNumber(volume)} in 24h`,
      description: `Unusually high volume detected. Price ${changePercent > 0 ? "up" : "down"} ${Math.abs(changePercent).toFixed(2)}%. Total trades: ${ticker.count.toLocaleString()}`,
      author: "Binance",
      authorUrl: "https://www.binance.com",
      publishedAt: new Date(ticker.closeTime),
      metrics: {
        points: volume,
        views: ticker.count,
        likes: changePercent
      },
      metadata: { ...ticker, type: "volume_anomaly", symbol }
    };
  }
  categorize(symbol) {
    if (!symbol) return "web3";
    if (this.isAIToken(symbol)) return "ai";
    if (this.isSolanaToken(symbol)) return "web3";
    return "web3";
  }
  extractTags(text, metadata) {
    const tags = ["binance", "cex", "trading"];
    if (metadata?.symbol) {
      tags.push(metadata.symbol.toLowerCase());
      if (this.isSolanaToken(metadata.symbol)) tags.push("solana");
      if (this.isAIToken(metadata.symbol)) tags.push("ai");
      if (this.isMemeToken(metadata.symbol)) tags.push("memecoin");
    }
    if (metadata?.type) {
      tags.push(metadata.type);
    }
    return [...new Set(tags)];
  }
  isSolanaToken(symbol) {
    if (!symbol) return false;
    const solanaTokens = ["SOL", "BONK", "WIF", "JUP", "RAY", "PYTH", "JTO", "ORCA"];
    return solanaTokens.some((t) => symbol.toUpperCase().includes(t));
  }
  isAIToken(symbol) {
    if (!symbol) return false;
    const aiTokens = ["RENDER", "TAO", "FET", "AGIX", "OCEAN", "NMR"];
    return aiTokens.some((t) => symbol.toUpperCase().includes(t));
  }
  isMemeToken(symbol) {
    if (!symbol) return false;
    const memeTokens = ["DOGE", "SHIB", "PEPE", "FLOKI", "BONK", "WIF"];
    return memeTokens.some((t) => symbol.toUpperCase().includes(t));
  }
  hasKeywords(text, keywords) {
    const lowerText = text.toLowerCase();
    return keywords.some((kw) => lowerText.includes(kw.toLowerCase()));
  }
  formatPrice(price) {
    if (price >= 1e3) return price.toFixed(2);
    if (price >= 1) return price.toFixed(4);
    if (price >= 0.01) return price.toFixed(6);
    return price.toFixed(8);
  }
  formatNumber(num) {
    if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
    return num.toFixed(0);
  }
  generateFingerprint(raw) {
    const key = `binance:${raw.sourceId}`;
    return createHash13("sha256").update(key).digest("hex").slice(0, 32);
  }
};

// src/sources/coingecko-hunter.ts
import { createHash as createHash14 } from "crypto";
var COINGECKO_BASE_URL = "https://api.coingecko.com/api/v3";
var THRESHOLDS = {
  PRICE_CHANGE_SIGNIFICANT: 5,
  // 5% move is notable
  PRICE_CHANGE_MAJOR: 10,
  // 10% move is major
  MARKET_CAP_RANK_TOP: 100,
  // Track top 100 coins
  TRENDING_SCORE_MIN: 0,
  // Include all trending (already filtered by CG)
  VOLUME_SPIKE_MULTIPLIER: 2,
  // 2x average volume
  CATEGORY_GROWTH_SIGNIFICANT: 3
  // 3% category growth
};
var CoinGeckoHunter = class {
  source = "coingecko";
  config;
  lastGlobalData = null;
  constructor(config) {
    this.config = config;
  }
  async hunt() {
    const discoveries = [];
    try {
      const [trending, topMovers, categories, globalData] = await Promise.all([
        this.fetchTrending(),
        this.fetchTopMovers(),
        this.fetchHotCategories(),
        this.fetchGlobalData()
      ]);
      for (const coin of trending) {
        const discovery = this.createCoinDiscovery(coin, "trending");
        if (discovery) discoveries.push(discovery);
      }
      for (const coin of topMovers) {
        const discovery = this.createMarketDiscovery(coin);
        if (discovery) discoveries.push(discovery);
      }
      for (const category of categories) {
        const discovery = this.createCategoryDiscovery(category);
        if (discovery) discoveries.push(discovery);
      }
      if (globalData) {
        const globalDiscovery = this.createGlobalDiscovery(globalData);
        if (globalDiscovery) discoveries.push(globalDiscovery);
        this.lastGlobalData = globalData;
      }
    } catch (error) {
      console.error("[CoinGeckoHunter] Hunt failed:", error);
    }
    return discoveries;
  }
  async fetchTrending() {
    try {
      const response = await fetch(`${COINGECKO_BASE_URL}/search/trending`, {
        headers: this.getHeaders()
      });
      if (!response.ok) {
        console.warn(`[CoinGecko] Trending fetch failed: ${response.status}`);
        return [];
      }
      const data = await response.json();
      return data.coins || [];
    } catch (error) {
      console.error("[CoinGecko] Trending error:", error);
      return [];
    }
  }
  async fetchTopMovers() {
    try {
      const response = await fetch(
        `${COINGECKO_BASE_URL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h`,
        { headers: this.getHeaders() }
      );
      if (!response.ok) {
        console.warn(`[CoinGecko] Markets fetch failed: ${response.status}`);
        return [];
      }
      const coins = await response.json();
      return coins.filter(
        (coin) => Math.abs(coin.price_change_percentage_24h) >= THRESHOLDS.PRICE_CHANGE_SIGNIFICANT
      );
    } catch (error) {
      console.error("[CoinGecko] Markets error:", error);
      return [];
    }
  }
  async fetchHotCategories() {
    try {
      const response = await fetch(`${COINGECKO_BASE_URL}/coins/categories`, {
        headers: this.getHeaders()
      });
      if (!response.ok) {
        console.warn(`[CoinGecko] Categories fetch failed: ${response.status}`);
        return [];
      }
      const categories = await response.json();
      return categories.filter(
        (cat) => Math.abs(cat.market_cap_change_24h) >= THRESHOLDS.CATEGORY_GROWTH_SIGNIFICANT
      ).slice(0, 10);
    } catch (error) {
      console.error("[CoinGecko] Categories error:", error);
      return [];
    }
  }
  async fetchGlobalData() {
    try {
      const response = await fetch(`${COINGECKO_BASE_URL}/global`, {
        headers: this.getHeaders()
      });
      if (!response.ok) {
        console.warn(`[CoinGecko] Global fetch failed: ${response.status}`);
        return null;
      }
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error("[CoinGecko] Global error:", error);
      return null;
    }
  }
  getHeaders() {
    const headers = {
      Accept: "application/json"
    };
    if (this.config.apiKey) {
      headers["x-cg-pro-api-key"] = this.config.apiKey;
    }
    return headers;
  }
  createCoinDiscovery(coin, type) {
    const item = coin.item;
    const priceChange = item.data?.price_change_percentage_24h?.usd || 0;
    return {
      sourceId: `coingecko-trending-${item.id}`,
      sourceUrl: `https://www.coingecko.com/en/coins/${item.slug}`,
      title: `\u{1F525} ${item.name} (${item.symbol.toUpperCase()}) Trending on CoinGecko`,
      description: `Ranked #${item.score + 1} in trending. Market cap rank: #${item.market_cap_rank || "N/A"}. ${priceChange > 0 ? `+${priceChange.toFixed(2)}%` : `${priceChange.toFixed(2)}%`} in 24h.`,
      publishedAt: /* @__PURE__ */ new Date(),
      metrics: {
        points: item.score,
        views: item.market_cap_rank
      },
      metadata: {
        type: "trending_coin",
        coinId: item.id,
        symbol: item.symbol,
        name: item.name,
        marketCapRank: item.market_cap_rank,
        trendingScore: item.score,
        priceBtc: item.price_btc,
        priceUsd: item.data?.price,
        priceChange24h: priceChange,
        marketCap: item.data?.market_cap,
        volume: item.data?.total_volume
      }
    };
  }
  createMarketDiscovery(coin) {
    const changePercent = coin.price_change_percentage_24h;
    const direction = changePercent > 0 ? "\u{1F4C8}" : "\u{1F4C9}";
    const isMajor = Math.abs(changePercent) >= THRESHOLDS.PRICE_CHANGE_MAJOR;
    return {
      sourceId: `coingecko-market-${coin.id}-${Date.now()}`,
      sourceUrl: `https://www.coingecko.com/en/coins/${coin.id}`,
      title: `${direction} ${coin.name} ${isMajor ? "MAJOR MOVE:" : ""} ${changePercent > 0 ? "+" : ""}${changePercent.toFixed(2)}%`,
      description: `${coin.symbol.toUpperCase()} is ${changePercent > 0 ? "up" : "down"} ${Math.abs(changePercent).toFixed(2)}% in 24h. Price: $${coin.current_price.toLocaleString()}. Market cap: $${(coin.market_cap / 1e9).toFixed(2)}B (#${coin.market_cap_rank}).`,
      publishedAt: new Date(coin.last_updated),
      metrics: {
        views: coin.market_cap_rank,
        likes: Math.round(coin.total_volume / 1e6)
        // Volume in millions as engagement proxy
      },
      metadata: {
        type: "price_move",
        coinId: coin.id,
        symbol: coin.symbol,
        name: coin.name,
        price: coin.current_price,
        priceChange24h: changePercent,
        marketCap: coin.market_cap,
        marketCapRank: coin.market_cap_rank,
        volume24h: coin.total_volume,
        high24h: coin.high_24h,
        low24h: coin.low_24h,
        ath: coin.ath,
        athChangePercent: coin.ath_change_percentage,
        isMajorMove: isMajor
      }
    };
  }
  createCategoryDiscovery(category) {
    const changePercent = category.market_cap_change_24h;
    const direction = changePercent > 0 ? "\u{1F680}" : "\u2B07\uFE0F";
    return {
      sourceId: `coingecko-category-${category.id}-${Date.now()}`,
      sourceUrl: `https://www.coingecko.com/en/categories/${category.id}`,
      title: `${direction} ${category.name} Category ${changePercent > 0 ? "+" : ""}${changePercent.toFixed(2)}% (24h)`,
      description: `${category.name} sector ${changePercent > 0 ? "growing" : "declining"}. Total market cap: $${(category.market_cap / 1e9).toFixed(2)}B. 24h volume: $${(category.volume_24h / 1e9).toFixed(2)}B.`,
      publishedAt: new Date(category.updated_at),
      metrics: {
        views: Math.round(category.market_cap / 1e9),
        likes: Math.round(category.volume_24h / 1e6)
      },
      metadata: {
        type: "category_move",
        categoryId: category.id,
        categoryName: category.name,
        marketCap: category.market_cap,
        marketCapChange24h: changePercent,
        volume24h: category.volume_24h,
        topCoins: category.top_3_coins,
        content: category.content
      }
    };
  }
  createGlobalDiscovery(global) {
    const changePercent = global.market_cap_change_percentage_24h_usd;
    if (this.lastGlobalData && Math.abs(changePercent) < THRESHOLDS.PRICE_CHANGE_SIGNIFICANT) {
      return null;
    }
    const totalMarketCap = global.total_market_cap.usd / 1e12;
    const btcDominance = global.market_cap_percentage.btc;
    const ethDominance = global.market_cap_percentage.eth;
    return {
      sourceId: `coingecko-global-${global.updated_at}`,
      sourceUrl: "https://www.coingecko.com/en/global-charts",
      title: `\u{1F30D} Crypto Market ${changePercent > 0 ? "+" : ""}${changePercent.toFixed(2)}% | $${totalMarketCap.toFixed(2)}T Total`,
      description: `Global crypto market cap: $${totalMarketCap.toFixed(2)}T (${changePercent > 0 ? "+" : ""}${changePercent.toFixed(2)}% 24h). BTC dominance: ${btcDominance.toFixed(1)}%. ETH dominance: ${ethDominance.toFixed(1)}%. Active cryptos: ${global.active_cryptocurrencies.toLocaleString()}.`,
      publishedAt: new Date(global.updated_at * 1e3),
      metrics: {
        views: global.active_cryptocurrencies,
        likes: global.markets
      },
      metadata: {
        type: "global_market",
        totalMarketCapUsd: global.total_market_cap.usd,
        totalVolumeUsd: global.total_volume.usd,
        marketCapChange24h: changePercent,
        btcDominance,
        ethDominance,
        activeCryptocurrencies: global.active_cryptocurrencies,
        markets: global.markets,
        dominanceBreakdown: global.market_cap_percentage
      }
    };
  }
  transform(raw) {
    const text = `${raw.title} ${raw.description || ""}`.toLowerCase();
    const metadata = raw.metadata || {};
    const hasWeb3Keywords = RELEVANCE_KEYWORDS.web3.some(
      (k) => text.includes(k.toLowerCase())
    );
    const hasAIKeywords = RELEVANCE_KEYWORDS.ai.some(
      (k) => text.includes(k.toLowerCase())
    );
    const hasSolanaKeywords = RELEVANCE_KEYWORDS.solana.some(
      (k) => text.includes(k.toLowerCase())
    );
    const hasEthereumKeywords = RELEVANCE_KEYWORDS.ethereum.some(
      (k) => text.includes(k.toLowerCase())
    );
    const marketCapRank = typeof metadata.marketCapRank === "number" ? metadata.marketCapRank : null;
    const highEngagement = marketCapRank !== null && marketCapRank <= 50 || metadata.isMajorMove === true || metadata.type === "trending_coin";
    let category = "web3";
    if (metadata.categoryName) {
      const catName = String(metadata.categoryName).toLowerCase();
      if (catName.includes("defi") || catName.includes("lending")) {
        category = "defi";
      } else if (catName.includes("nft") || catName.includes("gaming")) {
        category = "nft";
      } else if (catName.includes("ai") || catName.includes("artificial")) {
        category = "ai";
      }
    }
    const tags = ["crypto", "market-data"];
    if (metadata.type === "trending_coin") tags.push("trending");
    if (metadata.type === "price_move") tags.push("price-action");
    if (metadata.type === "category_move") tags.push("sector-rotation");
    if (metadata.type === "global_market") tags.push("macro");
    if (metadata.symbol) tags.push(String(metadata.symbol).toLowerCase());
    if (hasSolanaKeywords) tags.push("solana");
    if (hasEthereumKeywords) tags.push("ethereum");
    const fingerprint = createHash14("md5").update(`${raw.sourceId}-${raw.title}`).digest("hex").slice(0, 16);
    return {
      id: `coingecko-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      source: this.source,
      sourceId: raw.sourceId,
      sourceUrl: raw.sourceUrl,
      title: raw.title,
      description: raw.description,
      publishedAt: raw.publishedAt,
      discoveredAt: /* @__PURE__ */ new Date(),
      category,
      tags,
      metrics: raw.metrics,
      relevanceFactors: {
        hasWeb3Keywords,
        hasAIKeywords,
        hasSolanaKeywords,
        hasEthereumKeywords,
        hasTypeScript: false,
        recentActivity: true,
        // Always recent from CoinGecko
        highEngagement,
        isShowHN: false
      },
      rawMetadata: raw.metadata,
      fingerprint
    };
  }
};

// src/sources/coinmarketcap-hunter.ts
import { createHash as createHash15 } from "crypto";
var CMC_BASE_URL = "https://pro-api.coinmarketcap.com/v1";
var THRESHOLDS2 = {
  PRICE_CHANGE_SIGNIFICANT: 5,
  // 5% move is notable
  PRICE_CHANGE_MAJOR: 10,
  // 10% move is major
  MARKET_CAP_RANK_TOP: 100,
  // Track top 100 coins
  VOLUME_SPIKE_MULTIPLIER: 2
  // 2x average volume
};
var CoinMarketCapHunter = class {
  source = "coinmarketcap";
  config;
  lastGlobalData = null;
  constructor(config) {
    this.config = config;
    if (!config.apiKey) {
      console.warn(
        "[CoinMarketCapHunter] No API key provided. Set COINMARKETCAP_API_KEY in environment."
      );
    }
  }
  async hunt() {
    if (!this.config.apiKey) {
      console.warn("[CoinMarketCapHunter] Skipping hunt - no API key");
      return [];
    }
    const discoveries = [];
    try {
      const [listings, globalData] = await Promise.all([
        this.fetchListings(),
        this.fetchGlobalMetrics()
      ]);
      const topMovers = listings.filter(
        (coin) => Math.abs(coin.quote.USD.percent_change_24h) >= THRESHOLDS2.PRICE_CHANGE_SIGNIFICANT
      );
      for (const coin of topMovers) {
        const discovery = this.createCoinDiscovery(coin);
        if (discovery) discoveries.push(discovery);
      }
      if (globalData) {
        const globalDiscovery = this.createGlobalDiscovery(globalData);
        if (globalDiscovery) discoveries.push(globalDiscovery);
        this.lastGlobalData = globalData;
      }
    } catch (error) {
      console.error("[CoinMarketCapHunter] Hunt failed:", error);
    }
    return discoveries;
  }
  async fetchListings() {
    try {
      const response = await fetch(
        `${CMC_BASE_URL}/cryptocurrency/listings/latest?limit=100&convert=USD`,
        { headers: this.getHeaders() }
      );
      if (!response.ok) {
        const errorText = await response.text();
        console.warn(
          `[CoinMarketCap] Listings fetch failed: ${response.status} - ${errorText}`
        );
        return [];
      }
      const data = await response.json();
      if (data.status.error_code !== 0) {
        console.warn(
          `[CoinMarketCap] API error: ${data.status.error_message}`
        );
        return [];
      }
      return data.data || [];
    } catch (error) {
      console.error("[CoinMarketCap] Listings error:", error);
      return [];
    }
  }
  async fetchGlobalMetrics() {
    try {
      const response = await fetch(
        `${CMC_BASE_URL}/global-metrics/quotes/latest?convert=USD`,
        { headers: this.getHeaders() }
      );
      if (!response.ok) {
        console.warn(
          `[CoinMarketCap] Global metrics fetch failed: ${response.status}`
        );
        return null;
      }
      const data = await response.json();
      if (data.status.error_code !== 0) {
        console.warn(
          `[CoinMarketCap] API error: ${data.status.error_message}`
        );
        return null;
      }
      return data.data;
    } catch (error) {
      console.error("[CoinMarketCap] Global metrics error:", error);
      return null;
    }
  }
  /**
   * Fetch historical OHLCV data for a specific coin
   * Note: This uses additional API credits
   */
  async fetchHistoricalOHLCV(symbol, days = 30) {
    if (!this.config.apiKey) {
      console.warn("[CoinMarketCap] No API key for OHLCV fetch");
      return null;
    }
    try {
      const endDate = /* @__PURE__ */ new Date();
      const startDate = /* @__PURE__ */ new Date();
      startDate.setDate(startDate.getDate() - days);
      const response = await fetch(
        `${CMC_BASE_URL}/cryptocurrency/ohlcv/historical?symbol=${symbol}&time_start=${startDate.toISOString()}&time_end=${endDate.toISOString()}&convert=USD`,
        { headers: this.getHeaders() }
      );
      if (!response.ok) {
        console.warn(
          `[CoinMarketCap] OHLCV fetch failed: ${response.status}`
        );
        return null;
      }
      const data = await response.json();
      if (data.status.error_code !== 0) {
        console.warn(`[CoinMarketCap] OHLCV error: ${data.status.error_message}`);
        return null;
      }
      return data.data?.quotes?.map((q) => ({
        timestamp: q.time_open,
        open: q.quote.USD.open,
        high: q.quote.USD.high,
        low: q.quote.USD.low,
        close: q.quote.USD.close,
        volume: q.quote.USD.volume,
        market_cap: q.quote.USD.market_cap
      })) || null;
    } catch (error) {
      console.error("[CoinMarketCap] OHLCV error:", error);
      return null;
    }
  }
  /**
   * Fetch current prices for specific symbols
   */
  async fetchPrices(symbols) {
    const prices = /* @__PURE__ */ new Map();
    if (!this.config.apiKey || symbols.length === 0) {
      return prices;
    }
    try {
      const response = await fetch(
        `${CMC_BASE_URL}/cryptocurrency/quotes/latest?symbol=${symbols.join(",")}&convert=USD`,
        { headers: this.getHeaders() }
      );
      if (!response.ok) {
        console.warn(`[CoinMarketCap] Prices fetch failed: ${response.status}`);
        return prices;
      }
      const data = await response.json();
      if (data.status.error_code !== 0) {
        console.warn(`[CoinMarketCap] Prices error: ${data.status.error_message}`);
        return prices;
      }
      for (const [symbol, coinData] of Object.entries(data.data || {})) {
        const coin = coinData;
        prices.set(symbol, {
          price: coin.quote.USD.price,
          change24h: coin.quote.USD.percent_change_24h,
          marketCap: coin.quote.USD.market_cap
        });
      }
      return prices;
    } catch (error) {
      console.error("[CoinMarketCap] Prices error:", error);
      return prices;
    }
  }
  getHeaders() {
    return {
      Accept: "application/json",
      "X-CMC_PRO_API_KEY": this.config.apiKey || ""
    };
  }
  createCoinDiscovery(coin) {
    const changePercent = coin.quote.USD.percent_change_24h;
    const direction = changePercent > 0 ? "\u{1F4C8}" : "\u{1F4C9}";
    const isMajor = Math.abs(changePercent) >= THRESHOLDS2.PRICE_CHANGE_MAJOR;
    const platformTag = coin.platform?.name ? ` on ${coin.platform.name}` : "";
    return {
      sourceId: `cmc-coin-${coin.id}-${Date.now()}`,
      sourceUrl: `https://coinmarketcap.com/currencies/${coin.slug}/`,
      title: `${direction} ${coin.name} (${coin.symbol}) ${isMajor ? "MAJOR MOVE:" : ""} ${changePercent > 0 ? "+" : ""}${changePercent.toFixed(2)}%`,
      description: `${coin.symbol} is ${changePercent > 0 ? "up" : "down"} ${Math.abs(changePercent).toFixed(2)}% in 24h${platformTag}. Price: $${coin.quote.USD.price.toLocaleString(void 0, { maximumFractionDigits: 6 })}. Market cap: $${(coin.quote.USD.market_cap / 1e9).toFixed(2)}B (#${coin.cmc_rank}). Volume: $${(coin.quote.USD.volume_24h / 1e6).toFixed(2)}M.`,
      publishedAt: new Date(coin.quote.USD.last_updated),
      metrics: {
        views: coin.cmc_rank,
        likes: Math.round(coin.quote.USD.volume_24h / 1e6)
      },
      metadata: {
        type: "price_move",
        source: "coinmarketcap",
        coinId: coin.id,
        symbol: coin.symbol,
        name: coin.name,
        slug: coin.slug,
        price: coin.quote.USD.price,
        priceChange1h: coin.quote.USD.percent_change_1h,
        priceChange24h: changePercent,
        priceChange7d: coin.quote.USD.percent_change_7d,
        priceChange30d: coin.quote.USD.percent_change_30d,
        marketCap: coin.quote.USD.market_cap,
        marketCapRank: coin.cmc_rank,
        volume24h: coin.quote.USD.volume_24h,
        volumeChange24h: coin.quote.USD.volume_change_24h,
        circulatingSupply: coin.circulating_supply,
        totalSupply: coin.total_supply,
        maxSupply: coin.max_supply,
        fullyDilutedMarketCap: coin.quote.USD.fully_diluted_market_cap,
        marketCapDominance: coin.quote.USD.market_cap_dominance,
        platform: coin.platform?.name,
        tokenAddress: coin.platform?.token_address,
        tags: coin.tags,
        isMajorMove: isMajor
      }
    };
  }
  createGlobalDiscovery(global) {
    const changePercent = global.quote.USD.total_market_cap_yesterday_percentage_change;
    if (this.lastGlobalData && Math.abs(changePercent) < THRESHOLDS2.PRICE_CHANGE_SIGNIFICANT) {
      return null;
    }
    const totalMarketCap = global.quote.USD.total_market_cap / 1e12;
    return {
      sourceId: `cmc-global-${Date.now()}`,
      sourceUrl: "https://coinmarketcap.com/charts/",
      title: `\u{1F30D} Crypto Market ${changePercent > 0 ? "+" : ""}${changePercent.toFixed(2)}% | $${totalMarketCap.toFixed(2)}T Total (CMC)`,
      description: `Global crypto market cap: $${totalMarketCap.toFixed(2)}T (${changePercent > 0 ? "+" : ""}${changePercent.toFixed(2)}% 24h). BTC dominance: ${global.btc_dominance.toFixed(1)}%. ETH dominance: ${global.eth_dominance.toFixed(1)}%. DeFi market cap: $${(global.defi_market_cap / 1e9).toFixed(2)}B (${global.defi_24h_percentage_change > 0 ? "+" : ""}${global.defi_24h_percentage_change.toFixed(2)}%). Active cryptos: ${global.active_cryptocurrencies.toLocaleString()}.`,
      publishedAt: new Date(global.last_updated),
      metrics: {
        views: global.active_cryptocurrencies,
        likes: global.active_exchanges
      },
      metadata: {
        type: "global_market",
        source: "coinmarketcap",
        totalMarketCapUsd: global.quote.USD.total_market_cap,
        totalVolumeUsd: global.quote.USD.total_volume_24h,
        marketCapChange24h: changePercent,
        btcDominance: global.btc_dominance,
        ethDominance: global.eth_dominance,
        btcDominanceChange: global.btc_dominance - global.btc_dominance_yesterday,
        ethDominanceChange: global.eth_dominance - global.eth_dominance_yesterday,
        defiMarketCap: global.defi_market_cap,
        defiChange24h: global.defi_24h_percentage_change,
        stablecoinMarketCap: global.stablecoin_market_cap,
        stablecoinChange24h: global.stablecoin_24h_percentage_change,
        derivativesVolume24h: global.derivatives_volume_24h,
        activeCryptocurrencies: global.active_cryptocurrencies,
        activeExchanges: global.active_exchanges,
        activeMarketPairs: global.active_market_pairs
      }
    };
  }
  transform(raw) {
    const text = `${raw.title} ${raw.description || ""}`.toLowerCase();
    const metadata = raw.metadata || {};
    const hasWeb3Keywords = RELEVANCE_KEYWORDS.web3.some(
      (k) => text.includes(k.toLowerCase())
    );
    const hasAIKeywords = RELEVANCE_KEYWORDS.ai.some(
      (k) => text.includes(k.toLowerCase())
    );
    const hasSolanaKeywords = RELEVANCE_KEYWORDS.solana.some((k) => text.includes(k.toLowerCase())) || metadata.platform === "Solana";
    const hasEthereumKeywords = RELEVANCE_KEYWORDS.ethereum.some(
      (k) => text.includes(k.toLowerCase())
    ) || metadata.platform === "Ethereum";
    const marketCapRank = typeof metadata.marketCapRank === "number" ? metadata.marketCapRank : null;
    const highEngagement = marketCapRank !== null && marketCapRank <= 50 || metadata.isMajorMove === true;
    let category = "web3";
    const tags = metadata.tags || [];
    if (tags.some((t) => t.includes("defi") || t.includes("lending"))) {
      category = "defi";
    } else if (tags.some((t) => t.includes("nft") || t.includes("gaming"))) {
      category = "nft";
    } else if (tags.some((t) => t.includes("ai") || t.includes("artificial"))) {
      category = "ai";
    }
    const discoveryTags = ["crypto", "market-data", "coinmarketcap"];
    if (metadata.type === "price_move") discoveryTags.push("price-action");
    if (metadata.type === "global_market") discoveryTags.push("macro");
    if (metadata.symbol)
      discoveryTags.push(String(metadata.symbol).toLowerCase());
    if (hasSolanaKeywords) discoveryTags.push("solana");
    if (hasEthereumKeywords) discoveryTags.push("ethereum");
    const fingerprint = createHash15("md5").update(`${raw.sourceId}-${raw.title}`).digest("hex").slice(0, 16);
    return {
      id: `cmc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      source: "coinmarketcap",
      // Will be added to HuntSourceSchema
      sourceId: raw.sourceId,
      sourceUrl: raw.sourceUrl,
      title: raw.title,
      description: raw.description,
      publishedAt: raw.publishedAt,
      discoveredAt: /* @__PURE__ */ new Date(),
      category,
      tags: discoveryTags,
      metrics: raw.metrics,
      relevanceFactors: {
        hasWeb3Keywords,
        hasAIKeywords,
        hasSolanaKeywords,
        hasEthereumKeywords,
        hasTypeScript: false,
        recentActivity: true,
        highEngagement,
        isShowHN: false
      },
      rawMetadata: raw.metadata,
      fingerprint
    };
  }
};

// src/sources/lunarcrush-hunter.ts
import { createHash as createHash16 } from "crypto";
var LUNARCRUSH_API_V2 = "https://lunarcrush.com/api/v2";
var LUNARCRUSH_API_V3 = "https://lunarcrush.com/api3";
var THRESHOLDS3 = {
  GALAXY_SCORE_HIGH: 70,
  // Top tier social health
  GALAXY_SCORE_LOW: 30,
  // Concerning social health
  SOCIAL_VOLUME_SPIKE: 50,
  // 50% increase in 24h
  SENTIMENT_BULLISH: 60,
  // Strong positive sentiment
  SENTIMENT_BEARISH: -40,
  // Strong negative sentiment
  ALT_RANK_TOP: 50,
  // Top 50 by social
  INFLUENCER_FOLLOWERS_MIN: 1e4
};
var LunarCrushHunter = class {
  source = "lunarcrush";
  config;
  lastSocialVolumes = /* @__PURE__ */ new Map();
  constructor(config) {
    this.config = config;
  }
  async hunt() {
    const discoveries = [];
    if (!this.config.apiKey) {
      console.warn("[LunarCrush] API key required for full functionality");
      return this.huntPublicData();
    }
    try {
      const [topCoins, feedItems] = await Promise.all([
        this.fetchTopCoins(),
        this.fetchSocialFeed()
      ]);
      for (const coin of topCoins) {
        const discoveries_for_coin = this.processCoin(coin);
        discoveries.push(...discoveries_for_coin);
      }
      for (const item of feedItems) {
        const discovery = this.createFeedDiscovery(item);
        if (discovery) discoveries.push(discovery);
      }
      for (const coin of topCoins) {
        this.lastSocialVolumes.set(coin.symbol, coin.social_volume);
      }
    } catch (error) {
      console.error("[LunarCrushHunter] Hunt failed:", error);
    }
    return discoveries;
  }
  async huntPublicData() {
    const discoveries = [];
    try {
      const response = await fetch(
        `${LUNARCRUSH_API_V3}/coins?sort=galaxy_score&limit=20`,
        { headers: { Accept: "application/json" } }
      );
      if (response.ok) {
        const data = await response.json();
        const coins = data.data || [];
        for (const coin of coins) {
          if (coin.galaxy_score >= THRESHOLDS3.GALAXY_SCORE_HIGH) {
            discoveries.push(this.createHighSocialDiscovery(coin));
          }
        }
      }
    } catch (error) {
      console.warn("[LunarCrush] Public endpoint failed:", error);
    }
    return discoveries;
  }
  async fetchTopCoins() {
    try {
      const response = await fetch(
        `${LUNARCRUSH_API_V2}/assets?sort=galaxy_score&limit=50`,
        {
          headers: this.getHeaders()
        }
      );
      if (!response.ok) {
        console.warn(`[LunarCrush] Top coins fetch failed: ${response.status}`);
        return [];
      }
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error("[LunarCrush] Top coins error:", error);
      return [];
    }
  }
  async fetchSocialFeed() {
    try {
      const response = await fetch(
        `${LUNARCRUSH_API_V2}/feeds?limit=50&sources=twitter,reddit,news`,
        {
          headers: this.getHeaders()
        }
      );
      if (!response.ok) {
        console.warn(`[LunarCrush] Feed fetch failed: ${response.status}`);
        return [];
      }
      const data = await response.json();
      const items = data.data || [];
      return items.filter(
        (item) => item.social_score >= 50 || item.influencer_followers && item.influencer_followers >= THRESHOLDS3.INFLUENCER_FOLLOWERS_MIN
      );
    } catch (error) {
      console.error("[LunarCrush] Feed error:", error);
      return [];
    }
  }
  getHeaders() {
    return {
      Accept: "application/json",
      Authorization: `Bearer ${this.config.apiKey}`
    };
  }
  processCoin(coin) {
    const discoveries = [];
    if (coin.galaxy_score >= THRESHOLDS3.GALAXY_SCORE_HIGH) {
      discoveries.push(this.createHighSocialDiscovery(coin));
    }
    if (coin.galaxy_score <= THRESHOLDS3.GALAXY_SCORE_LOW && coin.alt_rank <= 100) {
      discoveries.push(this.createLowSocialDiscovery(coin));
    }
    const prevVolume = this.lastSocialVolumes.get(coin.symbol);
    if (prevVolume && coin.social_volume_change_24h >= THRESHOLDS3.SOCIAL_VOLUME_SPIKE) {
      discoveries.push(this.createVolumeSpikeDiscovery(coin));
    }
    if (coin.sentiment >= THRESHOLDS3.SENTIMENT_BULLISH) {
      discoveries.push(this.createSentimentDiscovery(coin, "bullish"));
    } else if (coin.sentiment <= THRESHOLDS3.SENTIMENT_BEARISH) {
      discoveries.push(this.createSentimentDiscovery(coin, "bearish"));
    }
    return discoveries;
  }
  createHighSocialDiscovery(coin) {
    return {
      sourceId: `lunarcrush-high-${coin.symbol}-${Date.now()}`,
      sourceUrl: `https://lunarcrush.com/coins/${coin.symbol.toLowerCase()}`,
      title: `\u{1F31F} ${coin.name} (${coin.symbol}) High Social Activity - Galaxy Score: ${coin.galaxy_score}`,
      description: `${coin.name} ranks #${coin.alt_rank} by social metrics. Galaxy Score: ${coin.galaxy_score}/100. Social Volume: ${coin.social_volume?.toLocaleString() || "N/A"} mentions. Sentiment: ${this.formatSentiment(coin.sentiment)}. Price: $${coin.price?.toFixed(4)} (${coin.percent_change_24h > 0 ? "+" : ""}${coin.percent_change_24h?.toFixed(2)}% 24h).`,
      publishedAt: new Date(coin.time * 1e3),
      metrics: {
        points: coin.galaxy_score,
        likes: coin.social_volume,
        comments: coin.social_contributors
      },
      metadata: {
        type: "high_social",
        symbol: coin.symbol,
        name: coin.name,
        galaxyScore: coin.galaxy_score,
        altRank: coin.alt_rank,
        socialVolume: coin.social_volume,
        socialScore: coin.social_score,
        sentiment: coin.sentiment,
        socialDominance: coin.social_dominance,
        twitterVolume: coin.twitter_volume,
        redditVolume: coin.reddit_volume,
        price: coin.price,
        priceChange24h: coin.percent_change_24h,
        marketCap: coin.market_cap
      }
    };
  }
  createLowSocialDiscovery(coin) {
    return {
      sourceId: `lunarcrush-low-${coin.symbol}-${Date.now()}`,
      sourceUrl: `https://lunarcrush.com/coins/${coin.symbol.toLowerCase()}`,
      title: `\u26A0\uFE0F ${coin.name} (${coin.symbol}) Low Social Activity - Galaxy Score: ${coin.galaxy_score}`,
      description: `Warning: ${coin.name} showing weak social metrics. Galaxy Score dropped to ${coin.galaxy_score}/100. Alt Rank: #${coin.alt_rank}. Could indicate declining interest or accumulation phase.`,
      publishedAt: new Date(coin.time * 1e3),
      metrics: {
        points: coin.galaxy_score,
        likes: coin.social_volume
      },
      metadata: {
        type: "low_social",
        symbol: coin.symbol,
        name: coin.name,
        galaxyScore: coin.galaxy_score,
        altRank: coin.alt_rank,
        socialVolume: coin.social_volume,
        sentiment: coin.sentiment
      }
    };
  }
  createVolumeSpikeDiscovery(coin) {
    return {
      sourceId: `lunarcrush-spike-${coin.symbol}-${Date.now()}`,
      sourceUrl: `https://lunarcrush.com/coins/${coin.symbol.toLowerCase()}`,
      title: `\u{1F4C8} ${coin.name} (${coin.symbol}) Social Volume Spike +${coin.social_volume_change_24h.toFixed(0)}%`,
      description: `${coin.name} social mentions surged ${coin.social_volume_change_24h.toFixed(0)}% in 24h. Current volume: ${coin.social_volume?.toLocaleString()}. Twitter: ${coin.twitter_volume_change_24h > 0 ? "+" : ""}${coin.twitter_volume_change_24h?.toFixed(0)}%. Reddit: ${coin.reddit_volume_change_24h > 0 ? "+" : ""}${coin.reddit_volume_change_24h?.toFixed(0)}%.`,
      publishedAt: new Date(coin.time * 1e3),
      metrics: {
        points: Math.round(coin.social_volume_change_24h),
        likes: coin.social_volume
      },
      metadata: {
        type: "volume_spike",
        symbol: coin.symbol,
        name: coin.name,
        volumeChange24h: coin.social_volume_change_24h,
        socialVolume: coin.social_volume,
        twitterVolumeChange: coin.twitter_volume_change_24h,
        redditVolumeChange: coin.reddit_volume_change_24h,
        galaxyScore: coin.galaxy_score
      }
    };
  }
  createSentimentDiscovery(coin, type) {
    const emoji = type === "bullish" ? "\u{1F7E2}" : "\u{1F534}";
    return {
      sourceId: `lunarcrush-sentiment-${coin.symbol}-${Date.now()}`,
      sourceUrl: `https://lunarcrush.com/coins/${coin.symbol.toLowerCase()}`,
      title: `${emoji} ${coin.name} (${coin.symbol}) Strong ${type === "bullish" ? "Bullish" : "Bearish"} Sentiment: ${coin.sentiment}`,
      description: `${coin.name} showing ${type} social sentiment of ${coin.sentiment}/100. Social score: ${coin.social_score}. Contributors: ${coin.social_contributors?.toLocaleString()}. Galaxy Score: ${coin.galaxy_score}/100.`,
      publishedAt: new Date(coin.time * 1e3),
      metrics: {
        points: Math.abs(coin.sentiment),
        likes: coin.social_score
      },
      metadata: {
        type: `${type}_sentiment`,
        symbol: coin.symbol,
        name: coin.name,
        sentiment: coin.sentiment,
        sentimentType: type,
        socialScore: coin.social_score,
        socialContributors: coin.social_contributors,
        galaxyScore: coin.galaxy_score
      }
    };
  }
  createFeedDiscovery(item) {
    const sourceEmoji = this.getSourceEmoji(item.type);
    const sentimentEmoji = item.sentiment >= 0 ? "\u{1F7E2}" : "\u{1F534}";
    return {
      sourceId: `lunarcrush-feed-${item.id}`,
      sourceUrl: item.url,
      title: `${sourceEmoji} ${item.title || item.body.slice(0, 80)}...`,
      description: `${item.body.slice(0, 300)}${item.body.length > 300 ? "..." : ""} | Sentiment: ${sentimentEmoji} ${item.sentiment} | Score: ${item.social_score}${item.influencer_name ? ` | By @${item.influencer_name} (${item.influencer_followers?.toLocaleString()} followers)` : ""}`,
      author: item.influencer_name,
      publishedAt: new Date(item.time * 1e3),
      metrics: {
        points: item.social_score,
        likes: item.influencer_followers || 0
      },
      metadata: {
        type: "social_post",
        postType: item.type,
        symbol: item.symbol,
        sentiment: item.sentiment,
        socialScore: item.social_score,
        influencerId: item.influencer_id,
        influencerName: item.influencer_name,
        influencerFollowers: item.influencer_followers
      }
    };
  }
  getSourceEmoji(type) {
    switch (type) {
      case "tweet":
        return "\u{1F426}";
      case "reddit":
        return "\u{1F534}";
      case "news":
        return "\u{1F4F0}";
      case "youtube":
        return "\u25B6\uFE0F";
      default:
        return "\u{1F4AC}";
    }
  }
  formatSentiment(sentiment) {
    if (sentiment >= 60) return `Very Bullish (${sentiment})`;
    if (sentiment >= 20) return `Bullish (${sentiment})`;
    if (sentiment >= -20) return `Neutral (${sentiment})`;
    if (sentiment >= -60) return `Bearish (${sentiment})`;
    return `Very Bearish (${sentiment})`;
  }
  transform(raw) {
    const text = `${raw.title} ${raw.description || ""}`.toLowerCase();
    const metadata = raw.metadata;
    const hasWeb3Keywords = RELEVANCE_KEYWORDS.web3.some(
      (k) => text.includes(k.toLowerCase())
    );
    const hasAIKeywords = RELEVANCE_KEYWORDS.ai.some(
      (k) => text.includes(k.toLowerCase())
    );
    const hasSolanaKeywords = RELEVANCE_KEYWORDS.solana.some(
      (k) => text.includes(k.toLowerCase())
    );
    const hasEthereumKeywords = RELEVANCE_KEYWORDS.ethereum.some(
      (k) => text.includes(k.toLowerCase())
    );
    const galaxyScore = metadata.galaxyScore || 0;
    const socialScore = metadata.socialScore || 0;
    const highEngagement = galaxyScore >= THRESHOLDS3.GALAXY_SCORE_HIGH || socialScore >= 80;
    let category = "web3";
    if (hasAIKeywords) category = "ai";
    if (text.includes("nft") || text.includes("collectible")) category = "nft";
    if (text.includes("defi") || text.includes("yield") || text.includes("lending"))
      category = "defi";
    const tags = ["social-sentiment", "lunarcrush"];
    const symbol = metadata.symbol;
    if (symbol) tags.push(symbol.toLowerCase());
    const type = metadata.type;
    if (type === "high_social") tags.push("trending");
    if (type === "volume_spike") tags.push("viral");
    if (type?.includes("sentiment")) tags.push("sentiment");
    if (type === "social_post") {
      const postType = metadata.postType;
      if (postType) tags.push(postType);
    }
    if (hasSolanaKeywords) tags.push("solana");
    if (hasEthereumKeywords) tags.push("ethereum");
    const fingerprint = createHash16("md5").update(`${raw.sourceId}-${raw.title}`).digest("hex").slice(0, 16);
    return {
      id: `lunarcrush-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      source: this.source,
      sourceId: raw.sourceId,
      sourceUrl: raw.sourceUrl,
      title: raw.title,
      description: raw.description,
      author: raw.author,
      publishedAt: raw.publishedAt,
      discoveredAt: /* @__PURE__ */ new Date(),
      category,
      tags,
      metrics: raw.metrics,
      relevanceFactors: {
        hasWeb3Keywords: true,
        // Always crypto-related
        hasAIKeywords,
        hasSolanaKeywords,
        hasEthereumKeywords,
        hasTypeScript: false,
        recentActivity: true,
        highEngagement,
        isShowHN: false
      },
      rawMetadata: raw.metadata,
      fingerprint
    };
  }
};

// src/sources/rugcheck-hunter.ts
import { createHash as createHash17 } from "crypto";
var RUGCHECK_BASE_URL = "https://api.rugcheck.xyz/v1";
var THRESHOLDS4 = {
  SAFE_SCORE: 80,
  // Score >= 80 is considered safe
  RISKY_SCORE: 50,
  // Score < 50 is risky
  DANGER_SCORE: 30
  // Score < 30 is dangerous
};
var RugCheckHunter = class {
  source = "rugcheck";
  config;
  constructor(config) {
    this.config = config;
  }
  async hunt() {
    const discoveries = [];
    try {
      const [trending, newTokens, verified] = await Promise.all([
        this.fetchTrendingTokens(),
        this.fetchNewTokens(),
        this.fetchVerifiedTokens()
      ]);
      for (const token of trending.slice(0, 10)) {
        const discovery = this.createTrendingDiscovery(token);
        if (discovery) discoveries.push(discovery);
      }
      for (const token of newTokens.slice(0, 20)) {
        const discovery = this.createNewTokenDiscovery(token);
        if (discovery) discoveries.push(discovery);
      }
      for (const token of verified.slice(0, 5)) {
        const discovery = this.createVerifiedDiscovery(token);
        if (discovery) discoveries.push(discovery);
      }
    } catch (error) {
      console.error("[RugCheckHunter] Hunt failed:", error);
    }
    return discoveries;
  }
  /**
   * Get detailed safety report for a specific token
   */
  async getTokenReport(mint) {
    try {
      const response = await fetch(
        `${RUGCHECK_BASE_URL}/tokens/${mint}/report`,
        { headers: { Accept: "application/json" } }
      );
      if (!response.ok) {
        console.warn(`[RugCheck] Report fetch failed: ${response.status}`);
        return null;
      }
      return await response.json();
    } catch (error) {
      console.error("[RugCheck] Report error:", error);
      return null;
    }
  }
  /**
   * Get quick safety summary for a token
   */
  async getTokenSummary(mint) {
    try {
      const response = await fetch(
        `${RUGCHECK_BASE_URL}/tokens/${mint}/report/summary`,
        { headers: { Accept: "application/json" } }
      );
      if (!response.ok) {
        console.warn(`[RugCheck] Summary fetch failed: ${response.status}`);
        return null;
      }
      return await response.json();
    } catch (error) {
      console.error("[RugCheck] Summary error:", error);
      return null;
    }
  }
  /**
   * Check if a token is safe (score >= 80)
   */
  async isTokenSafe(mint) {
    const summary = await this.getTokenSummary(mint);
    if (!summary) {
      return { safe: false, score: 0, risks: ["Unable to fetch data"], rugged: false };
    }
    return {
      safe: summary.score >= THRESHOLDS4.SAFE_SCORE && !summary.rugged,
      score: summary.score,
      risks: summary.risks,
      rugged: summary.rugged
    };
  }
  async fetchTrendingTokens() {
    try {
      const response = await fetch(`${RUGCHECK_BASE_URL}/stats/trending`, {
        headers: { Accept: "application/json" }
      });
      if (!response.ok) {
        console.warn(`[RugCheck] Trending fetch failed: ${response.status}`);
        return [];
      }
      return await response.json();
    } catch (error) {
      console.error("[RugCheck] Trending error:", error);
      return [];
    }
  }
  async fetchNewTokens() {
    try {
      const response = await fetch(`${RUGCHECK_BASE_URL}/stats/new_tokens`, {
        headers: { Accept: "application/json" }
      });
      if (!response.ok) {
        console.warn(`[RugCheck] New tokens fetch failed: ${response.status}`);
        return [];
      }
      return await response.json();
    } catch (error) {
      console.error("[RugCheck] New tokens error:", error);
      return [];
    }
  }
  async fetchVerifiedTokens() {
    try {
      const response = await fetch(`${RUGCHECK_BASE_URL}/stats/verified`, {
        headers: { Accept: "application/json" }
      });
      if (!response.ok) {
        console.warn(`[RugCheck] Verified fetch failed: ${response.status}`);
        return [];
      }
      return await response.json();
    } catch (error) {
      console.error("[RugCheck] Verified error:", error);
      return [];
    }
  }
  createTrendingDiscovery(token) {
    const safetyEmoji = this.getSafetyEmoji(token.score);
    const safetyLabel = this.getSafetyLabel(token.score);
    return {
      sourceId: `rugcheck-trending-${token.mint}`,
      sourceUrl: `https://rugcheck.xyz/tokens/${token.mint}`,
      title: `${safetyEmoji} ${token.name} (${token.symbol}) - ${safetyLabel} | Score: ${token.score}/100`,
      description: `Trending on RugCheck. Safety score: ${token.score}/100. Views: ${token.views?.toLocaleString() || "N/A"}. Community votes: ${token.votes || 0}.`,
      publishedAt: /* @__PURE__ */ new Date(),
      metrics: {
        points: token.score,
        views: token.views,
        likes: token.votes
      },
      metadata: {
        type: "trending_safety",
        source: "rugcheck",
        mint: token.mint,
        name: token.name,
        symbol: token.symbol,
        safetyScore: token.score,
        safetyLabel,
        views: token.views,
        votes: token.votes,
        isSafe: token.score >= THRESHOLDS4.SAFE_SCORE,
        isRisky: token.score < THRESHOLDS4.RISKY_SCORE
      }
    };
  }
  createNewTokenDiscovery(token) {
    const safetyEmoji = token.score ? this.getSafetyEmoji(token.score) : "\u{1F195}";
    const safetyLabel = token.score ? this.getSafetyLabel(token.score) : "UNSCANNED";
    return {
      sourceId: `rugcheck-new-${token.mint}`,
      sourceUrl: `https://rugcheck.xyz/tokens/${token.mint}`,
      title: `${safetyEmoji} NEW: ${token.name} (${token.symbol}) - ${safetyLabel}`,
      description: `New token detected. ${token.score ? `Safety score: ${token.score}/100.` : "Not yet scanned."} Created: ${new Date(token.createdAt).toLocaleString()}.`,
      publishedAt: new Date(token.createdAt),
      metrics: {
        points: token.score || 0
      },
      metadata: {
        type: "new_token",
        source: "rugcheck",
        mint: token.mint,
        name: token.name,
        symbol: token.symbol,
        safetyScore: token.score,
        safetyLabel,
        createdAt: token.createdAt,
        isNew: true,
        needsScan: !token.score
      }
    };
  }
  createVerifiedDiscovery(token) {
    return {
      sourceId: `rugcheck-verified-${token.mint}`,
      sourceUrl: `https://rugcheck.xyz/tokens/${token.mint}`,
      title: `\u2705 VERIFIED: ${token.name} (${token.symbol}) - Score: ${token.score}/100`,
      description: `Verified safe token. Safety score: ${token.score}/100. Community-vetted and approved.`,
      publishedAt: /* @__PURE__ */ new Date(),
      metrics: {
        points: token.score,
        views: token.views,
        likes: token.votes
      },
      metadata: {
        type: "verified_safe",
        source: "rugcheck",
        mint: token.mint,
        name: token.name,
        symbol: token.symbol,
        safetyScore: token.score,
        verified: true,
        views: token.views,
        votes: token.votes
      }
    };
  }
  getSafetyEmoji(score) {
    if (score >= THRESHOLDS4.SAFE_SCORE) return "\u2705";
    if (score >= THRESHOLDS4.RISKY_SCORE) return "\u26A0\uFE0F";
    if (score >= THRESHOLDS4.DANGER_SCORE) return "\u{1F534}";
    return "\u2620\uFE0F";
  }
  getSafetyLabel(score) {
    if (score >= THRESHOLDS4.SAFE_SCORE) return "SAFE";
    if (score >= THRESHOLDS4.RISKY_SCORE) return "MODERATE RISK";
    if (score >= THRESHOLDS4.DANGER_SCORE) return "HIGH RISK";
    return "DANGER";
  }
  transform(raw) {
    const text = `${raw.title} ${raw.description || ""}`.toLowerCase();
    const metadata = raw.metadata || {};
    const hasWeb3Keywords = true;
    const hasAIKeywords = RELEVANCE_KEYWORDS.ai.some(
      (k) => text.includes(k.toLowerCase())
    );
    const hasSolanaKeywords = true;
    const highEngagement = metadata.verified === true || metadata.isSafe === true || metadata.views > 1e3;
    let category = "web3";
    if (metadata.type === "verified_safe") category = "defi";
    const tags = ["solana", "safety", "rugcheck"];
    if (metadata.verified) tags.push("verified");
    if (metadata.isSafe) tags.push("safe");
    if (metadata.isRisky) tags.push("risky");
    if (metadata.isNew) tags.push("new-token");
    if (metadata.symbol) tags.push(String(metadata.symbol).toLowerCase());
    const fingerprint = createHash17("md5").update(`${raw.sourceId}-${raw.title}`).digest("hex").slice(0, 16);
    return {
      id: `rugcheck-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      source: "rugcheck",
      sourceId: raw.sourceId,
      sourceUrl: raw.sourceUrl,
      title: raw.title,
      description: raw.description,
      publishedAt: raw.publishedAt,
      discoveredAt: /* @__PURE__ */ new Date(),
      category,
      tags,
      metrics: raw.metrics,
      relevanceFactors: {
        hasWeb3Keywords,
        hasAIKeywords,
        hasSolanaKeywords,
        hasEthereumKeywords: false,
        hasTypeScript: false,
        recentActivity: true,
        highEngagement,
        isShowHN: false
      },
      rawMetadata: raw.metadata,
      fingerprint
    };
  }
};

// src/sources/pumpfun-hunter.ts
import { createHash as createHash18 } from "crypto";
var PUMPFUN_BASE_URL = "https://frontend-api.pump.fun";
var THRESHOLDS5 = {
  HIGH_MARKET_CAP: 1e5,
  // $100k market cap
  MEDIUM_MARKET_CAP: 1e4,
  // $10k market cap
  HIGH_REPLIES: 50,
  // Many community replies
  GRADUATED: true
  // Completed bonding curve
};
var PumpFunHunter = class {
  source = "pumpfun";
  config;
  lastKingOfTheHill = null;
  constructor(config) {
    this.config = config;
  }
  async hunt() {
    const discoveries = [];
    try {
      const [newCoins, kingOfTheHill] = await Promise.all([
        this.fetchNewCoins(),
        this.fetchKingOfTheHill()
      ]);
      for (const coin of newCoins.slice(0, 20)) {
        const discovery = this.createCoinDiscovery(coin, "new");
        if (discovery) discoveries.push(discovery);
      }
      if (kingOfTheHill && kingOfTheHill.mint !== this.lastKingOfTheHill) {
        const kingDiscovery = this.createKingDiscovery(kingOfTheHill);
        if (kingDiscovery) discoveries.push(kingDiscovery);
        this.lastKingOfTheHill = kingOfTheHill.mint;
      }
      const graduated = newCoins.filter((c) => c.complete);
      for (const coin of graduated.slice(0, 5)) {
        const discovery = this.createCoinDiscovery(coin, "graduated");
        if (discovery) discoveries.push(discovery);
      }
    } catch (error) {
      console.error("[PumpFunHunter] Hunt failed:", error);
    }
    return discoveries;
  }
  /**
   * Fetch latest coins from Pump.fun
   */
  async fetchNewCoins(limit = 50) {
    try {
      const response = await fetch(
        `${PUMPFUN_BASE_URL}/coins?offset=0&limit=${limit}&sort=created_timestamp&order=DESC&includeNsfw=false`,
        {
          headers: {
            Accept: "application/json",
            "User-Agent": "gICM-Hunter/1.0"
          }
        }
      );
      if (!response.ok) {
        console.warn(`[PumpFun] Coins fetch failed: ${response.status}`);
        return [];
      }
      return await response.json();
    } catch (error) {
      console.error("[PumpFun] Coins error:", error);
      return [];
    }
  }
  /**
   * Fetch specific coin details
   */
  async getCoinDetails(mint) {
    try {
      const response = await fetch(`${PUMPFUN_BASE_URL}/coins/${mint}`, {
        headers: {
          Accept: "application/json",
          "User-Agent": "gICM-Hunter/1.0"
        }
      });
      if (!response.ok) {
        console.warn(`[PumpFun] Coin details fetch failed: ${response.status}`);
        return null;
      }
      return await response.json();
    } catch (error) {
      console.error("[PumpFun] Coin details error:", error);
      return null;
    }
  }
  /**
   * Fetch current king of the hill
   */
  async fetchKingOfTheHill() {
    try {
      const response = await fetch(`${PUMPFUN_BASE_URL}/coins/king-of-the-hill`, {
        headers: {
          Accept: "application/json",
          "User-Agent": "gICM-Hunter/1.0"
        }
      });
      if (!response.ok) {
        console.warn(`[PumpFun] King fetch failed: ${response.status}`);
        return null;
      }
      return await response.json();
    } catch (error) {
      console.error("[PumpFun] King error:", error);
      return null;
    }
  }
  /**
   * Calculate bonding curve progress
   */
  getBondingCurveProgress(coin) {
    if (coin.complete) return 100;
    const targetSol = 85;
    const currentSol = coin.virtual_sol_reserves / 1e9;
    return Math.min(100, currentSol / targetSol * 100);
  }
  /**
   * Calculate estimated market cap from reserves
   */
  getEstimatedMarketCap(coin) {
    if (coin.usd_market_cap) return coin.usd_market_cap;
    if (coin.market_cap) return coin.market_cap;
    const solPrice = 200;
    const virtualSol = coin.virtual_sol_reserves / 1e9;
    return virtualSol * solPrice * 2;
  }
  createCoinDiscovery(coin, type) {
    const progress = this.getBondingCurveProgress(coin);
    const marketCap = this.getEstimatedMarketCap(coin);
    const createdAt = new Date(coin.created_timestamp);
    if (coin.nsfw) return null;
    const emoji = type === "graduated" ? "\u{1F393}" : progress > 50 ? "\u{1F680}" : "\u{1F195}";
    const statusLabel = coin.complete ? "GRADUATED (Raydium)" : `${progress.toFixed(0)}% to Raydium`;
    return {
      sourceId: `pumpfun-${type}-${coin.mint}`,
      sourceUrl: `https://pump.fun/${coin.mint}`,
      title: `${emoji} ${coin.name} (${coin.symbol}) - ${statusLabel}`,
      description: `${coin.description?.slice(0, 200) || "New memecoin on Pump.fun"}. Market cap: ~$${(marketCap / 1e3).toFixed(1)}k. ${coin.reply_count ? `${coin.reply_count} replies.` : ""} ${coin.twitter ? "Has Twitter." : ""} ${coin.telegram ? "Has Telegram." : ""}`,
      author: coin.creator,
      publishedAt: createdAt,
      metrics: {
        views: coin.reply_count || 0,
        likes: coin.complete ? 100 : Math.floor(progress)
      },
      metadata: {
        type: type === "graduated" ? "graduated_token" : "new_launch",
        source: "pumpfun",
        mint: coin.mint,
        name: coin.name,
        symbol: coin.symbol,
        description: coin.description,
        creator: coin.creator,
        bondingCurve: coin.bonding_curve,
        bondingCurveProgress: progress,
        complete: coin.complete,
        raydiumPool: coin.raydium_pool,
        marketCap,
        virtualSolReserves: coin.virtual_sol_reserves,
        virtualTokenReserves: coin.virtual_token_reserves,
        totalSupply: coin.total_supply,
        imageUri: coin.image_uri,
        twitter: coin.twitter,
        telegram: coin.telegram,
        website: coin.website,
        replyCount: coin.reply_count,
        createdTimestamp: coin.created_timestamp,
        isGraduated: coin.complete,
        hasRaydiumPool: !!coin.raydium_pool
      }
    };
  }
  createKingDiscovery(coin) {
    const marketCap = this.getEstimatedMarketCap(coin);
    return {
      sourceId: `pumpfun-king-${coin.mint}-${Date.now()}`,
      sourceUrl: `https://pump.fun/${coin.mint}`,
      title: `\u{1F451} NEW KING: ${coin.name} (${coin.symbol}) - Top of Pump.fun`,
      description: `${coin.name} is now King of the Hill on Pump.fun! Market cap: ~$${(marketCap / 1e3).toFixed(1)}k. ${coin.description?.slice(0, 150) || ""}`,
      author: coin.creator,
      publishedAt: /* @__PURE__ */ new Date(),
      metrics: {
        views: coin.reply_count || 0,
        likes: 100
      },
      metadata: {
        type: "king_of_the_hill",
        source: "pumpfun",
        mint: coin.mint,
        name: coin.name,
        symbol: coin.symbol,
        creator: coin.creator,
        marketCap,
        complete: coin.complete,
        raydiumPool: coin.raydium_pool,
        twitter: coin.twitter,
        telegram: coin.telegram,
        isKing: true
      }
    };
  }
  transform(raw) {
    const text = `${raw.title} ${raw.description || ""}`.toLowerCase();
    const metadata = raw.metadata || {};
    const hasWeb3Keywords = true;
    const hasSolanaKeywords = true;
    const hasAIKeywords = RELEVANCE_KEYWORDS.ai.some(
      (k) => text.includes(k.toLowerCase())
    );
    const highEngagement = metadata.isKing === true || metadata.isGraduated === true || metadata.marketCap > THRESHOLDS5.HIGH_MARKET_CAP;
    let category = "web3";
    if (metadata.isGraduated) category = "defi";
    const tags = ["solana", "memecoin", "pumpfun"];
    if (metadata.isGraduated) tags.push("graduated", "raydium");
    if (metadata.isKing) tags.push("king-of-the-hill");
    if (metadata.twitter) tags.push("has-twitter");
    if (metadata.telegram) tags.push("has-telegram");
    if (metadata.symbol) tags.push(String(metadata.symbol).toLowerCase());
    const fingerprint = createHash18("md5").update(`${raw.sourceId}-${raw.title}`).digest("hex").slice(0, 16);
    return {
      id: `pumpfun-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      source: "pumpfun",
      sourceId: raw.sourceId,
      sourceUrl: raw.sourceUrl,
      title: raw.title,
      description: raw.description,
      author: raw.author,
      publishedAt: raw.publishedAt,
      discoveredAt: /* @__PURE__ */ new Date(),
      category,
      tags,
      metrics: raw.metrics,
      relevanceFactors: {
        hasWeb3Keywords,
        hasAIKeywords,
        hasSolanaKeywords,
        hasEthereumKeywords: false,
        hasTypeScript: false,
        recentActivity: true,
        highEngagement,
        isShowHN: false
      },
      rawMetadata: raw.metadata,
      fingerprint
    };
  }
};

// src/sources/vybe-hunter.ts
import { createHash as createHash19 } from "crypto";
var VYBE_BASE_URL = "https://api.vybenetwork.xyz";
var VybeHunter = class {
  source = "vybe";
  config;
  apiKey;
  constructor(config) {
    this.config = config;
    this.apiKey = config.apiKey || process.env.VYBE_API_KEY || null;
    if (!this.apiKey) {
      console.warn(
        "[VybeHunter] No API key provided. Set VYBE_API_KEY in environment or config."
      );
    }
  }
  async hunt() {
    if (!this.apiKey) {
      console.warn("[VybeHunter] Skipping hunt - no API key");
      return [];
    }
    const discoveries = [];
    try {
      const trackedWallets = this.config.filters?.keywords || [];
      for (const wallet of trackedWallets.slice(0, 3)) {
        if (wallet.length === 44 || wallet.length === 43) {
          const pnl = await this.fetchWalletPnL(wallet);
          if (pnl) {
            const discovery = this.createPnLDiscovery(pnl);
            if (discovery) discoveries.push(discovery);
          }
        }
      }
    } catch (error) {
      console.error("[VybeHunter] Hunt failed:", error);
    }
    return discoveries;
  }
  /**
   * Get wallet PnL and trading stats
   */
  async fetchWalletPnL(address) {
    if (!this.apiKey) return null;
    try {
      const response = await fetch(
        `${VYBE_BASE_URL}/account/wallet-pnl?address=${address}`,
        { headers: this.getHeaders() }
      );
      if (!response.ok) {
        console.warn(`[Vybe] Wallet PnL fetch failed: ${response.status}`);
        return null;
      }
      return await response.json();
    } catch (error) {
      console.error("[Vybe] Wallet PnL error:", error);
      return null;
    }
  }
  /**
   * Get token balances for a wallet
   */
  async fetchTokenBalances(address) {
    if (!this.apiKey) return [];
    try {
      const response = await fetch(
        `${VYBE_BASE_URL}/account/token-balances?address=${address}`,
        { headers: this.getHeaders() }
      );
      if (!response.ok) {
        console.warn(`[Vybe] Token balances fetch failed: ${response.status}`);
        return [];
      }
      const data = await response.json();
      return data.balances || data || [];
    } catch (error) {
      console.error("[Vybe] Token balances error:", error);
      return [];
    }
  }
  /**
   * Get top holders for a token
   */
  async fetchTokenHolders(mint) {
    if (!this.apiKey) return [];
    try {
      const response = await fetch(
        `${VYBE_BASE_URL}/tokens/top-holders?mint=${mint}`,
        { headers: this.getHeaders() }
      );
      if (!response.ok) {
        console.warn(`[Vybe] Token holders fetch failed: ${response.status}`);
        return [];
      }
      const data = await response.json();
      return data.holders || data || [];
    } catch (error) {
      console.error("[Vybe] Token holders error:", error);
      return [];
    }
  }
  /**
   * Get token details
   */
  async fetchTokenDetails(mint) {
    if (!this.apiKey) return null;
    try {
      const response = await fetch(
        `${VYBE_BASE_URL}/tokens/token-details?mint=${mint}`,
        { headers: this.getHeaders() }
      );
      if (!response.ok) {
        console.warn(`[Vybe] Token details fetch failed: ${response.status}`);
        return null;
      }
      return await response.json();
    } catch (error) {
      console.error("[Vybe] Token details error:", error);
      return null;
    }
  }
  /**
   * Get recent trades for a token
   */
  async fetchTokenTrades(mint, limit = 50) {
    if (!this.apiKey) return [];
    try {
      const response = await fetch(
        `${VYBE_BASE_URL}/tokens/token-trades?mint=${mint}&limit=${limit}`,
        { headers: this.getHeaders() }
      );
      if (!response.ok) {
        console.warn(`[Vybe] Token trades fetch failed: ${response.status}`);
        return [];
      }
      const data = await response.json();
      return data.trades || data || [];
    } catch (error) {
      console.error("[Vybe] Token trades error:", error);
      return [];
    }
  }
  /**
   * Get TVL for a program
   */
  async fetchProgramTVL(programId) {
    if (!this.apiKey) return null;
    try {
      const response = await fetch(
        `${VYBE_BASE_URL}/programs/program-tvl?program_id=${programId}`,
        { headers: this.getHeaders() }
      );
      if (!response.ok) {
        console.warn(`[Vybe] Program TVL fetch failed: ${response.status}`);
        return null;
      }
      return await response.json();
    } catch (error) {
      console.error("[Vybe] Program TVL error:", error);
      return null;
    }
  }
  /**
   * Get Pyth Oracle price
   */
  async fetchPythPrice(symbol) {
    if (!this.apiKey) return null;
    try {
      const response = await fetch(
        `${VYBE_BASE_URL}/prices/pyth-price?symbol=${symbol}`,
        { headers: this.getHeaders() }
      );
      if (!response.ok) {
        console.warn(`[Vybe] Pyth price fetch failed: ${response.status}`);
        return null;
      }
      return await response.json();
    } catch (error) {
      console.error("[Vybe] Pyth price error:", error);
      return null;
    }
  }
  /**
   * Get market data
   */
  async fetchMarkets() {
    if (!this.apiKey) return [];
    try {
      const response = await fetch(`${VYBE_BASE_URL}/prices/markets`, {
        headers: this.getHeaders()
      });
      if (!response.ok) {
        console.warn(`[Vybe] Markets fetch failed: ${response.status}`);
        return [];
      }
      const data = await response.json();
      return data.markets || data || [];
    } catch (error) {
      console.error("[Vybe] Markets error:", error);
      return [];
    }
  }
  /**
   * Check if wallet is profitable
   */
  async isWalletProfitable(address) {
    const pnl = await this.fetchWalletPnL(address);
    if (!pnl) {
      return { profitable: false, totalPnL: 0, winRate: 0, trades: 0 };
    }
    return {
      profitable: pnl.total_pnl > 0,
      totalPnL: pnl.total_pnl,
      winRate: pnl.win_rate,
      trades: pnl.total_trades
    };
  }
  /**
   * Get concentration risk for a token
   */
  async getConcentrationRisk(mint) {
    const holders = await this.fetchTokenHolders(mint);
    if (holders.length === 0) {
      return { topHolderPercent: 0, top10Percent: 0, whaleCount: 0, risk: "high" };
    }
    const topHolderPercent = holders[0]?.percentage || 0;
    const top10Percent = holders.slice(0, 10).reduce((sum, h) => sum + h.percentage, 0);
    const whaleCount = holders.filter((h) => h.percentage > 5).length;
    let risk = "low";
    if (topHolderPercent > 50 || top10Percent > 80) risk = "high";
    else if (topHolderPercent > 20 || top10Percent > 60) risk = "medium";
    return { topHolderPercent, top10Percent, whaleCount, risk };
  }
  getHeaders() {
    return {
      Accept: "application/json",
      Authorization: `Bearer ${this.apiKey}`
    };
  }
  createPnLDiscovery(pnl) {
    const profitEmoji = pnl.total_pnl > 0 ? "\u{1F4B0}" : "\u{1F4C9}";
    const pnlFormatted = pnl.total_pnl > 0 ? `+$${pnl.total_pnl.toLocaleString()}` : `-$${Math.abs(pnl.total_pnl).toLocaleString()}`;
    return {
      sourceId: `vybe-pnl-${pnl.address}-${Date.now()}`,
      sourceUrl: `https://vybeapp.xyz/wallet/${pnl.address}`,
      title: `${profitEmoji} Wallet ${pnl.address.slice(0, 8)}... PnL: ${pnlFormatted}`,
      description: `Total PnL: ${pnlFormatted}. Win rate: ${(pnl.win_rate * 100).toFixed(1)}%. Trades: ${pnl.total_trades}. Largest win: $${pnl.largest_win.toLocaleString()}. Largest loss: $${Math.abs(pnl.largest_loss).toLocaleString()}.`,
      publishedAt: new Date(pnl.last_updated),
      metrics: {
        points: Math.round(pnl.win_rate * 100),
        likes: pnl.profitable_trades
      },
      metadata: {
        type: "wallet_pnl",
        source: "vybe",
        address: pnl.address,
        realizedPnl: pnl.realized_pnl,
        unrealizedPnl: pnl.unrealized_pnl,
        totalPnl: pnl.total_pnl,
        winRate: pnl.win_rate,
        totalTrades: pnl.total_trades,
        profitableTrades: pnl.profitable_trades,
        averageTradeSize: pnl.average_trade_size,
        largestWin: pnl.largest_win,
        largestLoss: pnl.largest_loss,
        isProfitable: pnl.total_pnl > 0
      }
    };
  }
  transform(raw) {
    const text = `${raw.title} ${raw.description || ""}`.toLowerCase();
    const metadata = raw.metadata || {};
    const hasWeb3Keywords = true;
    const hasSolanaKeywords = true;
    const hasAIKeywords = RELEVANCE_KEYWORDS.ai.some(
      (k) => text.includes(k.toLowerCase())
    );
    const highEngagement = metadata.isProfitable === true || metadata.winRate > 0.6;
    let category = "defi";
    const tags = ["solana", "wallet", "analytics", "vybe"];
    if (metadata.isProfitable) tags.push("profitable");
    if (metadata.winRate > 0.6) tags.push("high-win-rate");
    const fingerprint = createHash19("md5").update(`${raw.sourceId}-${raw.title}`).digest("hex").slice(0, 16);
    return {
      id: `vybe-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      source: "vybe",
      sourceId: raw.sourceId,
      sourceUrl: raw.sourceUrl,
      title: raw.title,
      description: raw.description,
      publishedAt: raw.publishedAt,
      discoveredAt: /* @__PURE__ */ new Date(),
      category,
      tags,
      metrics: raw.metrics,
      relevanceFactors: {
        hasWeb3Keywords,
        hasAIKeywords,
        hasSolanaKeywords,
        hasEthereumKeywords: false,
        hasTypeScript: false,
        recentActivity: true,
        highEngagement,
        isShowHN: false
      },
      rawMetadata: raw.metadata,
      fingerprint
    };
  }
};

// src/sources/polymarket-hunter.ts
import { createHash as createHash20, randomUUID as randomUUID14 } from "crypto";
var POLYMARKET_API = "https://gamma-api.polymarket.com";
var CRYPTO_KEYWORDS = [
  "bitcoin",
  "btc",
  "ethereum",
  "eth",
  "solana",
  "sol",
  "crypto",
  "cryptocurrency",
  "blockchain",
  "defi",
  "nft",
  "web3",
  "binance",
  "coinbase",
  "sec",
  "etf"
];
var PolymarketHunter = class {
  source = "polymarket";
  config;
  constructor(config) {
    this.config = config;
  }
  async hunt() {
    const discoveries = [];
    try {
      const markets = await this.fetchMarkets();
      const filtered = this.filterMarkets(markets);
      discoveries.push(...filtered.map((m) => this.marketToRawDiscovery(m)));
    } catch (error) {
      console.error("[PolymarketHunter] Failed to fetch markets:", error);
    }
    const seen = /* @__PURE__ */ new Set();
    return discoveries.filter((d) => {
      if (seen.has(d.sourceId)) return false;
      seen.add(d.sourceId);
      return true;
    });
  }
  transform(raw) {
    const text = `${raw.title} ${raw.description ?? ""}`.toLowerCase();
    const metadata = raw.metadata;
    return {
      id: randomUUID14(),
      source: "polymarket",
      sourceId: raw.sourceId,
      sourceUrl: raw.sourceUrl,
      title: raw.title,
      description: raw.description,
      author: "Polymarket",
      authorUrl: "https://polymarket.com",
      publishedAt: raw.publishedAt,
      discoveredAt: /* @__PURE__ */ new Date(),
      category: this.categorize(text),
      tags: this.extractTags(text, metadata),
      language: "en",
      metrics: raw.metrics,
      relevanceFactors: {
        hasWeb3Keywords: this.hasKeywords(text, RELEVANCE_KEYWORDS.web3),
        hasAIKeywords: this.hasKeywords(text, RELEVANCE_KEYWORDS.ai),
        hasSolanaKeywords: this.hasKeywords(text, RELEVANCE_KEYWORDS.solana),
        hasEthereumKeywords: this.hasKeywords(text, RELEVANCE_KEYWORDS.ethereum),
        hasTypeScript: false,
        recentActivity: (metadata?.volume24hr ?? 0) > 1e4,
        highEngagement: (raw.metrics.points ?? 0) > 1e5,
        isShowHN: false
      },
      rawMetadata: metadata,
      fingerprint: this.generateFingerprint(raw)
    };
  }
  async fetchMarkets() {
    const response = await fetch(`${POLYMARKET_API}/markets?active=true&limit=100`, {
      headers: {
        "User-Agent": "gICM-Hunter/1.0",
        Accept: "application/json"
      }
    });
    if (!response.ok) {
      throw new Error(`Polymarket API error: ${response.status}`);
    }
    const data = await response.json();
    return Array.isArray(data) ? data : data.markets ?? [];
  }
  filterMarkets(markets) {
    const minVolume = this.config.filters?.minPoints ?? 1e4;
    const minLiquidity = 5e3;
    return markets.filter((m) => {
      if (!m.active || m.closed) return false;
      if (m.volume < minVolume) return false;
      if (m.liquidity < minLiquidity) return false;
      const text = m.question.toLowerCase();
      if (this.config.filters?.keywords?.length) {
        const hasKeyword = this.config.filters.keywords.some(
          (kw) => text.includes(kw.toLowerCase())
        );
        if (!hasKeyword) return false;
      }
      return true;
    }).sort((a, b) => {
      return (b.volume24hr ?? 0) - (a.volume24hr ?? 0);
    }).slice(0, 50);
  }
  marketToRawDiscovery(market) {
    const prices = market.outcomePrices?.map((p) => parseFloat(p) * 100) ?? [];
    const priceStr = prices.length >= 2 ? `Yes: ${prices[0].toFixed(0)}% / No: ${prices[1].toFixed(0)}%` : "";
    return {
      sourceId: `polymarket:${market.id}`,
      sourceUrl: `https://polymarket.com/event/${market.slug}`,
      title: `[Prediction] ${market.question}`,
      description: `${priceStr} | Volume: $${this.formatNumber(market.volume)} | Liquidity: $${this.formatNumber(market.liquidity)}`,
      author: "Polymarket",
      authorUrl: "https://polymarket.com",
      publishedAt: market.endDate ? new Date(market.endDate) : void 0,
      metrics: {
        points: market.volume,
        views: market.volume24hr,
        likes: market.liquidity
      },
      metadata: market
    };
  }
  categorize(text) {
    if (this.hasKeywords(text, CRYPTO_KEYWORDS)) return "defi";
    if (this.hasKeywords(text, RELEVANCE_KEYWORDS.ai)) return "ai";
    return "other";
  }
  extractTags(text, metadata) {
    const tags = ["prediction-market", "polymarket"];
    if (this.hasKeywords(text, CRYPTO_KEYWORDS)) tags.push("crypto");
    if (text.includes("bitcoin") || text.includes("btc")) tags.push("bitcoin");
    if (text.includes("ethereum") || text.includes("eth")) tags.push("ethereum");
    if (text.includes("solana") || text.includes("sol")) tags.push("solana");
    if (text.includes("election") || text.includes("president")) tags.push("politics");
    if (text.includes("etf")) tags.push("etf");
    if (text.includes("sec")) tags.push("sec");
    if (text.includes("fed") || text.includes("interest rate")) tags.push("macro");
    return [...new Set(tags)];
  }
  hasKeywords(text, keywords) {
    const lowerText = text.toLowerCase();
    return keywords.some((kw) => lowerText.includes(kw.toLowerCase()));
  }
  formatNumber(num) {
    if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
    return num.toFixed(0);
  }
  generateFingerprint(raw) {
    const key = `polymarket:${raw.sourceId}`;
    return createHash20("sha256").update(key).digest("hex").slice(0, 32);
  }
};

// src/sources/kalshi-hunter.ts
import { createHash as createHash21, randomUUID as randomUUID15 } from "crypto";
var KALSHI_API = "https://api.elections.kalshi.com/trade-api/v2";
var KALSHI_WEB = "https://kalshi.com";
var TARGET_CATEGORIES3 = [
  "Economics",
  "Financials",
  "Politics",
  "Technology",
  "Climate",
  "Science",
  "Entertainment",
  "Sports"
];
var FINANCE_KEYWORDS = [
  "bitcoin",
  "btc",
  "ethereum",
  "eth",
  "crypto",
  "fed",
  "interest rate",
  "inflation",
  "gdp",
  "unemployment",
  "stock",
  "s&p",
  "nasdaq",
  "treasury",
  "yield",
  "recession",
  "cpi",
  "fomc",
  "sec",
  "etf"
];
var KalshiHunter = class {
  source = "kalshi";
  config;
  constructor(config) {
    this.config = config;
  }
  async hunt() {
    const discoveries = [];
    try {
      const markets = await this.fetchMarkets();
      const filtered = this.filterMarkets(markets);
      discoveries.push(...filtered.map((m) => this.marketToRawDiscovery(m)));
    } catch (error) {
      console.error("[KalshiHunter] Failed to fetch markets:", error);
    }
    const seen = /* @__PURE__ */ new Set();
    return discoveries.filter((d) => {
      if (seen.has(d.sourceId)) return false;
      seen.add(d.sourceId);
      return true;
    });
  }
  transform(raw) {
    const text = `${raw.title} ${raw.description ?? ""}`.toLowerCase();
    const metadata = raw.metadata;
    return {
      id: randomUUID15(),
      source: "kalshi",
      sourceId: raw.sourceId,
      sourceUrl: raw.sourceUrl,
      title: raw.title,
      description: raw.description,
      author: "Kalshi",
      authorUrl: "https://kalshi.com",
      publishedAt: raw.publishedAt,
      discoveredAt: /* @__PURE__ */ new Date(),
      category: this.categorize(text),
      tags: this.extractTags(text, metadata),
      language: "en",
      metrics: raw.metrics,
      relevanceFactors: {
        hasWeb3Keywords: this.hasKeywords(text, RELEVANCE_KEYWORDS.web3),
        hasAIKeywords: this.hasKeywords(text, RELEVANCE_KEYWORDS.ai),
        hasSolanaKeywords: this.hasKeywords(text, RELEVANCE_KEYWORDS.solana),
        hasEthereumKeywords: this.hasKeywords(text, RELEVANCE_KEYWORDS.ethereum),
        hasTypeScript: false,
        recentActivity: (metadata?.volume_24h ?? 0) > 1e3,
        highEngagement: (raw.metrics.points ?? 0) > 1e4,
        isShowHN: false
      },
      rawMetadata: metadata,
      fingerprint: this.generateFingerprint(raw)
    };
  }
  async fetchMarkets() {
    const response = await fetch(`${KALSHI_API}/markets?status=open&limit=200`, {
      headers: {
        "User-Agent": "gICM-Hunter/1.0",
        Accept: "application/json"
      }
    });
    if (!response.ok) {
      const altResponse = await fetch(
        `https://trading-api.kalshi.com/trade-api/v2/markets?status=open&limit=200`,
        {
          headers: {
            "User-Agent": "gICM-Hunter/1.0",
            Accept: "application/json"
          }
        }
      );
      if (!altResponse.ok) {
        throw new Error(`Kalshi API error: ${response.status}`);
      }
      const altData = await altResponse.json();
      return altData.markets ?? [];
    }
    const data = await response.json();
    return data.markets ?? [];
  }
  filterMarkets(markets) {
    const minVolume = this.config.filters?.minPoints ?? 100;
    const minOpenInterest = 50;
    return markets.filter((m) => {
      if (m.status !== "open") return false;
      if (m.volume < minVolume) return false;
      if (m.open_interest < minOpenInterest) return false;
      if (m.category && !TARGET_CATEGORIES3.some((c) => m.category.includes(c))) {
        return false;
      }
      const text = m.title.toLowerCase();
      if (this.config.filters?.keywords?.length) {
        const hasKeyword = this.config.filters.keywords.some(
          (kw) => text.includes(kw.toLowerCase())
        );
        if (!hasKeyword) return false;
      }
      return true;
    }).sort((a, b) => {
      return (b.volume_24h ?? 0) - (a.volume_24h ?? 0);
    }).slice(0, 50);
  }
  marketToRawDiscovery(market) {
    const yesPrice = market.yes_bid > 0 ? market.yes_bid : market.last_price;
    const noPrice = market.no_bid > 0 ? market.no_bid : 100 - market.last_price;
    const priceStr = `Yes: ${yesPrice}\xA2 / No: ${noPrice}\xA2`;
    const priceChange = market.last_price - market.previous_price;
    const changeStr = priceChange !== 0 ? ` (${priceChange > 0 ? "+" : ""}${priceChange}\xA2)` : "";
    return {
      sourceId: `kalshi:${market.ticker}`,
      sourceUrl: `${KALSHI_WEB}/markets/${market.ticker}`,
      title: `[Prediction] ${market.title}`,
      description: `${priceStr}${changeStr} | Volume: ${this.formatNumber(market.volume)} contracts | Open Interest: ${this.formatNumber(market.open_interest)}`,
      author: "Kalshi",
      authorUrl: KALSHI_WEB,
      publishedAt: market.expiration_time ? new Date(market.expiration_time) : void 0,
      metrics: {
        points: market.volume,
        views: market.volume_24h,
        likes: market.open_interest
      },
      metadata: market
    };
  }
  categorize(text) {
    if (this.hasKeywords(text, FINANCE_KEYWORDS)) return "defi";
    if (this.hasKeywords(text, RELEVANCE_KEYWORDS.ai)) return "ai";
    return "other";
  }
  extractTags(text, metadata) {
    const tags = ["prediction-market", "kalshi"];
    if (metadata?.category) {
      tags.push(metadata.category.toLowerCase());
    }
    if (this.hasKeywords(text, ["bitcoin", "btc"])) tags.push("bitcoin");
    if (this.hasKeywords(text, ["ethereum", "eth"])) tags.push("ethereum");
    if (this.hasKeywords(text, ["crypto"])) tags.push("crypto");
    if (this.hasKeywords(text, ["fed", "fomc", "interest rate"])) tags.push("fed");
    if (this.hasKeywords(text, ["inflation", "cpi"])) tags.push("inflation");
    if (this.hasKeywords(text, ["gdp", "recession"])) tags.push("macro");
    if (this.hasKeywords(text, ["election", "president", "congress"])) tags.push("politics");
    if (this.hasKeywords(text, ["sec", "etf"])) tags.push("regulatory");
    return [...new Set(tags)];
  }
  hasKeywords(text, keywords) {
    const lowerText = text.toLowerCase();
    return keywords.some((kw) => lowerText.includes(kw.toLowerCase()));
  }
  formatNumber(num) {
    if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
    return num.toFixed(0);
  }
  generateFingerprint(raw) {
    const key = `kalshi:${raw.sourceId}`;
    return createHash21("sha256").update(key).digest("hex").slice(0, 32);
  }
};

// src/sources/fred-hunter.ts
import { createHash as createHash22, randomUUID as randomUUID16 } from "crypto";
var FRED_API = "https://api.stlouisfed.org/fred";
var KEY_SERIES = [
  // Interest Rates & Fed Policy
  { id: "FEDFUNDS", name: "Fed Funds Rate", category: "rates", threshold: 0.25 },
  { id: "T10Y2Y", name: "10Y-2Y Treasury Spread", category: "rates", threshold: 0.1 },
  { id: "T10YIE", name: "10Y Breakeven Inflation", category: "inflation", threshold: 0.1 },
  // Inflation
  { id: "CPIAUCSL", name: "Consumer Price Index", category: "inflation", threshold: 0.5 },
  { id: "PCEPI", name: "PCE Price Index", category: "inflation", threshold: 0.3 },
  // Employment
  { id: "UNRATE", name: "Unemployment Rate", category: "employment", threshold: 0.2 },
  { id: "PAYEMS", name: "Nonfarm Payrolls", category: "employment", threshold: 100 },
  { id: "ICSA", name: "Initial Jobless Claims", category: "employment", threshold: 2e4 },
  // Economic Activity
  { id: "GDP", name: "Real GDP", category: "gdp", threshold: 0.5 },
  { id: "DGORDER", name: "Durable Goods Orders", category: "manufacturing", threshold: 1 },
  { id: "INDPRO", name: "Industrial Production", category: "manufacturing", threshold: 0.5 },
  // Consumer & Housing
  { id: "UMCSENT", name: "Consumer Sentiment", category: "sentiment", threshold: 2 },
  { id: "HOUST", name: "Housing Starts", category: "housing", threshold: 50 },
  // Money Supply
  { id: "M2SL", name: "M2 Money Supply", category: "money", threshold: 100 },
  // Leading Indicators
  { id: "USSLIND", name: "Leading Index", category: "leading", threshold: 0.2 }
];
var FREDHunter = class {
  source = "fred";
  config;
  apiKey;
  constructor(config) {
    this.config = config;
    this.apiKey = config.apiKey ?? process.env.FRED_API_KEY ?? "";
  }
  async hunt() {
    if (!this.apiKey) {
      console.warn("[FREDHunter] No API key configured. Get one at https://fred.stlouisfed.org/docs/api/api_key.html");
      return [];
    }
    const discoveries = [];
    for (const series of KEY_SERIES) {
      try {
        const data = await this.fetchSeries(series.id);
        if (data) {
          const discovery = this.analyzeSeriesData(series, data);
          if (discovery) {
            discoveries.push(discovery);
          }
        }
        await new Promise((r) => setTimeout(r, 600));
      } catch (error) {
        console.error(`[FREDHunter] Failed to fetch ${series.id}:`, error);
      }
    }
    return discoveries;
  }
  transform(raw) {
    const text = `${raw.title} ${raw.description ?? ""}`.toLowerCase();
    const metadata = raw.metadata;
    return {
      id: randomUUID16(),
      source: "fred",
      sourceId: raw.sourceId,
      sourceUrl: raw.sourceUrl,
      title: raw.title,
      description: raw.description,
      author: raw.author,
      authorUrl: raw.authorUrl,
      publishedAt: raw.publishedAt,
      discoveredAt: /* @__PURE__ */ new Date(),
      category: "other",
      tags: this.extractTags(metadata),
      language: void 0,
      metrics: raw.metrics,
      relevanceFactors: {
        hasWeb3Keywords: false,
        hasAIKeywords: false,
        hasSolanaKeywords: false,
        hasEthereumKeywords: false,
        hasTypeScript: false,
        recentActivity: true,
        highEngagement: Math.abs(metadata?.change ?? 0) > (metadata?.series.threshold ?? 0),
        isShowHN: false
      },
      rawMetadata: metadata,
      fingerprint: this.generateFingerprint(raw)
    };
  }
  async fetchSeries(seriesId) {
    const seriesResponse = await fetch(
      `${FRED_API}/series?series_id=${seriesId}&api_key=${this.apiKey}&file_type=json`,
      { headers: { "User-Agent": "gICM-Hunter/1.0" } }
    );
    if (!seriesResponse.ok) return null;
    const seriesData = await seriesResponse.json();
    const series = seriesData.seriess?.[0];
    const obsResponse = await fetch(
      `${FRED_API}/series/observations?series_id=${seriesId}&api_key=${this.apiKey}&file_type=json&sort_order=desc&limit=10`,
      { headers: { "User-Agent": "gICM-Hunter/1.0" } }
    );
    if (!obsResponse.ok) return null;
    const obsData = await obsResponse.json();
    const observations = obsData.observations ?? [];
    return { series, observations };
  }
  analyzeSeriesData(seriesConfig, data) {
    const { series, observations } = data;
    if (observations.length < 2) return null;
    const validObs = observations.filter((o) => o.value !== ".");
    if (validObs.length < 2) return null;
    const latest = parseFloat(validObs[0].value);
    const previous = parseFloat(validObs[1].value);
    const change = latest - previous;
    const changePercent = change / previous * 100;
    if (Math.abs(change) < seriesConfig.threshold) return null;
    const direction = change > 0 ? "\u{1F4C8}" : "\u{1F4C9}";
    const signal = this.getSignal(seriesConfig, change);
    return {
      sourceId: `fred:${seriesConfig.id}:${validObs[0].date}`,
      sourceUrl: `https://fred.stlouisfed.org/series/${seriesConfig.id}`,
      title: `${direction} [ECON] ${seriesConfig.name}: ${latest.toFixed(2)} (${change > 0 ? "+" : ""}${changePercent.toFixed(1)}%)`,
      description: `${series.title} changed from ${previous.toFixed(2)} to ${latest.toFixed(2)}. ${signal}`,
      author: "Federal Reserve",
      authorUrl: "https://fred.stlouisfed.org",
      publishedAt: new Date(validObs[0].date),
      metrics: {
        points: latest,
        views: Math.abs(change),
        likes: Math.abs(changePercent)
      },
      metadata: {
        series: seriesConfig,
        seriesInfo: series,
        latest,
        previous,
        change,
        changePercent,
        observations: validObs.slice(0, 5)
      }
    };
  }
  getSignal(series, change) {
    const signals = {
      rates: {
        up: "Rising rates = bearish for risk assets, bullish USD",
        down: "Falling rates = bullish for risk assets, bearish USD"
      },
      inflation: {
        up: "Rising inflation = Fed may stay hawkish",
        down: "Falling inflation = Fed may ease policy"
      },
      employment: {
        up: series.id === "UNRATE" ? "Rising unemployment = recession risk, Fed may ease" : "Strong employment = economy resilient",
        down: series.id === "UNRATE" ? "Falling unemployment = labor market tight" : "Weak employment = slowdown risk"
      },
      gdp: {
        up: "GDP growth = economic expansion",
        down: "GDP decline = recession risk"
      },
      sentiment: {
        up: "Consumer confidence rising = bullish",
        down: "Consumer confidence falling = bearish"
      },
      money: {
        up: "M2 expansion = inflationary, liquidity increasing",
        down: "M2 contraction = deflationary, liquidity decreasing"
      },
      leading: {
        up: "Leading indicators up = expansion ahead",
        down: "Leading indicators down = contraction ahead"
      }
    };
    const direction = change > 0 ? "up" : "down";
    return signals[series.category]?.[direction] || "";
  }
  extractTags(metadata) {
    const tags = ["economics", "macro", "fred"];
    if (metadata?.series) {
      tags.push(metadata.series.category);
      tags.push(metadata.series.id.toLowerCase());
      if (Math.abs(metadata.change) > metadata.series.threshold * 2) {
        tags.push("significant-change");
      }
    }
    return tags;
  }
  generateFingerprint(raw) {
    const key = `fred:${raw.sourceId}`;
    return createHash22("sha256").update(key).digest("hex").slice(0, 32);
  }
};

// src/sources/sec-hunter.ts
import { createHash as createHash23, randomUUID as randomUUID17 } from "crypto";
var SEC_SUBMISSIONS = "https://data.sec.gov/submissions";
var IMPORTANT_FORMS = [
  "4",
  // Insider transactions
  "13F-HR",
  // Institutional holdings (quarterly)
  "8-K",
  // Material events
  "SC 13G",
  // Beneficial ownership (passive)
  "SC 13D",
  // Beneficial ownership (active)
  "S-1",
  // IPO registration
  "10-K",
  // Annual report
  "10-Q"
  // Quarterly report
];
var TRACKED_CIKS = [
  "1067983",
  // Berkshire Hathaway (Buffett)
  "1649339",
  // Bridgewater Associates
  "1350694",
  // Renaissance Technologies
  "1037389",
  // Soros Fund Management
  "1061768",
  // Citadel Advisors
  "1336528",
  // Tiger Global
  "1103804",
  // BlackRock
  "886982",
  // Goldman Sachs
  "1166559",
  // JPMorgan
  "1364742"
  // ARK Investment
];
var CRYPTO_TICKERS = [
  "COIN",
  "MSTR",
  "RIOT",
  "MARA",
  "CLSK",
  "HUT",
  "BITF",
  "BTBT",
  "GBTC",
  "BITO",
  "ARKB",
  "IBIT"
];
var SECHunter = class {
  source = "sec";
  config;
  constructor(config) {
    this.config = config;
  }
  async hunt() {
    const discoveries = [];
    for (const cik of TRACKED_CIKS.slice(0, 5)) {
      try {
        const filings = await this.fetchCompanyFilings(cik);
        const recent = this.filterRecentFilings(filings);
        discoveries.push(...recent.map((f) => this.filingToRawDiscovery(f, filings.name)));
        await new Promise((r) => setTimeout(r, 150));
      } catch (error) {
        console.error(`[SECHunter] Failed to fetch CIK ${cik}:`, error);
      }
    }
    try {
      const form4s = await this.fetchLatestForm4s();
      discoveries.push(...form4s);
    } catch (error) {
      console.error("[SECHunter] Failed to fetch Form 4s:", error);
    }
    const seen = /* @__PURE__ */ new Set();
    return discoveries.filter((d) => {
      if (seen.has(d.sourceId)) return false;
      seen.add(d.sourceId);
      return true;
    });
  }
  transform(raw) {
    const text = `${raw.title} ${raw.description ?? ""}`.toLowerCase();
    const metadata = raw.metadata;
    return {
      id: randomUUID17(),
      source: "sec",
      sourceId: raw.sourceId,
      sourceUrl: raw.sourceUrl,
      title: raw.title,
      description: raw.description,
      author: raw.author,
      authorUrl: raw.authorUrl,
      publishedAt: raw.publishedAt,
      discoveredAt: /* @__PURE__ */ new Date(),
      category: this.categorize(metadata?.form),
      tags: this.extractTags(text, metadata),
      language: void 0,
      metrics: raw.metrics,
      relevanceFactors: {
        hasWeb3Keywords: this.isCryptoRelated(text),
        hasAIKeywords: this.hasKeywords(text, ["ai", "artificial intelligence", "machine learning"]),
        hasSolanaKeywords: this.hasKeywords(text, ["solana"]),
        hasEthereumKeywords: this.hasKeywords(text, ["ethereum"]),
        hasTypeScript: false,
        recentActivity: true,
        highEngagement: this.isHighValueFiling(metadata?.form, text),
        isShowHN: false
      },
      rawMetadata: metadata,
      fingerprint: this.generateFingerprint(raw)
    };
  }
  async fetchCompanyFilings(cik) {
    const paddedCik = cik.padStart(10, "0");
    const response = await fetch(`${SEC_SUBMISSIONS}/CIK${paddedCik}.json`, {
      headers: {
        "User-Agent": "gICM-Hunter info@gicm.io",
        Accept: "application/json"
      }
    });
    if (!response.ok) {
      throw new Error(`SEC API error: ${response.status}`);
    }
    return response.json();
  }
  async fetchLatestForm4s() {
    const today = /* @__PURE__ */ new Date();
    const year = today.getFullYear();
    const quarter = `QTR${Math.ceil((today.getMonth() + 1) / 3)}`;
    try {
      const indexUrl = `https://www.sec.gov/Archives/edgar/full-index/${year}/${quarter}/master.idx`;
      const response = await fetch(indexUrl, {
        headers: {
          "User-Agent": "gICM-Hunter info@gicm.io"
        }
      });
      if (!response.ok) return [];
      const text = await response.text();
      const lines = text.split("\n").filter((l) => l.includes("|4|"));
      const recentForm4s = lines.slice(-50);
      const discoveries = [];
      for (const line of recentForm4s) {
        const parts = line.split("|");
        if (parts.length >= 5) {
          const [cik, company, form, date, path] = parts;
          if (this.isInterestingCompany(company)) {
            discoveries.push({
              sourceId: `sec:form4:${path.trim()}`,
              sourceUrl: `https://www.sec.gov/Archives/${path.trim()}`,
              title: `[INSIDER] ${company.trim()} - Form 4 Filed`,
              description: `Insider transaction reported for ${company.trim()}. Check for buys/sells.`,
              author: company.trim(),
              publishedAt: new Date(date),
              metrics: {
                points: 1
              },
              metadata: { form: "4", company: company.trim(), cik, date }
            });
          }
        }
      }
      return discoveries;
    } catch (error) {
      console.error("[SECHunter] Form 4 index fetch failed:", error);
      return [];
    }
  }
  filterRecentFilings(company) {
    const filings = company.filings.recent;
    const results = [];
    const sevenDaysAgo = /* @__PURE__ */ new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    for (let i = 0; i < Math.min(filings.accessionNumber.length, 20); i++) {
      const form = filings.form[i];
      const filingDate = new Date(filings.filingDate[i]);
      if (filingDate < sevenDaysAgo) continue;
      if (!IMPORTANT_FORMS.includes(form)) continue;
      results.push({
        accessionNumber: filings.accessionNumber[i],
        filingDate: filings.filingDate[i],
        reportDate: filings.reportDate[i],
        form,
        primaryDocument: filings.primaryDocument[i],
        primaryDocDescription: filings.primaryDocDescription[i],
        size: 0,
        isXBRL: 0,
        isInlineXBRL: 0
      });
    }
    return results;
  }
  filingToRawDiscovery(filing, companyName) {
    const formType = this.getFormDescription(filing.form);
    const emoji = this.getFormEmoji(filing.form);
    return {
      sourceId: `sec:${filing.accessionNumber}`,
      sourceUrl: `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${companyName}&type=${filing.form}&dateb=&owner=include&count=10`,
      title: `${emoji} [${filing.form}] ${companyName} - ${formType}`,
      description: filing.primaryDocDescription || `${formType} filed on ${filing.filingDate}`,
      author: companyName,
      authorUrl: `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&company=${encodeURIComponent(companyName)}`,
      publishedAt: new Date(filing.filingDate),
      metrics: {
        points: this.getFormImportance(filing.form)
      },
      metadata: { ...filing, company: companyName }
    };
  }
  getFormDescription(form) {
    const descriptions = {
      "4": "Insider Transaction",
      "13F-HR": "Institutional Holdings Report",
      "8-K": "Material Event",
      "SC 13G": "Beneficial Ownership (Passive)",
      "SC 13D": "Beneficial Ownership (Active)",
      "S-1": "IPO Registration",
      "10-K": "Annual Report",
      "10-Q": "Quarterly Report"
    };
    return descriptions[form] || form;
  }
  getFormEmoji(form) {
    const emojis = {
      "4": "\u{1F464}",
      "13F-HR": "\u{1F3E6}",
      "8-K": "\u26A1",
      "SC 13G": "\u{1F4CA}",
      "SC 13D": "\u{1F3AF}",
      "S-1": "\u{1F680}",
      "10-K": "\u{1F4D1}",
      "10-Q": "\u{1F4CB}"
    };
    return emojis[form] || "\u{1F4C4}";
  }
  getFormImportance(form) {
    const importance = {
      "SC 13D": 10,
      // Active ownership = big moves
      "13F-HR": 9,
      // Institutional holdings
      "4": 8,
      // Insider trades
      "8-K": 7,
      // Material events
      "S-1": 6,
      // IPOs
      "SC 13G": 5,
      // Passive ownership
      "10-K": 4,
      "10-Q": 3
    };
    return importance[form] || 1;
  }
  categorize(form) {
    if (form === "4" || form === "SC 13D" || form === "SC 13G") return "other";
    if (form === "13F-HR") return "other";
    return "other";
  }
  extractTags(text, metadata) {
    const tags = ["sec", "filing"];
    if (metadata?.form) {
      tags.push(metadata.form.toLowerCase().replace(/[^a-z0-9]/g, ""));
      if (metadata.form === "4") tags.push("insider-trade");
      if (metadata.form === "13F-HR") tags.push("institutional");
    }
    if (this.isCryptoRelated(text)) tags.push("crypto");
    if (this.hasKeywords(text, ["berkshire", "buffett"])) tags.push("buffett");
    if (this.hasKeywords(text, ["blackrock", "ishares"])) tags.push("blackrock");
    return tags;
  }
  isCryptoRelated(text) {
    const cryptoKeywords = [
      "bitcoin",
      "btc",
      "ethereum",
      "eth",
      "crypto",
      "blockchain",
      "coinbase",
      "microstrategy",
      "riot",
      "marathon",
      "cleanspark",
      "grayscale",
      "bitwise",
      "ark"
    ];
    return cryptoKeywords.some((kw) => text.toLowerCase().includes(kw));
  }
  isInterestingCompany(company) {
    const lowerCompany = company.toLowerCase();
    if (CRYPTO_TICKERS.some((t) => lowerCompany.includes(t.toLowerCase()))) return true;
    const interestingKeywords = [
      "apple",
      "microsoft",
      "google",
      "amazon",
      "nvidia",
      "meta",
      "tesla",
      "coinbase",
      "microstrategy",
      "blackrock",
      "fidelity",
      "vanguard",
      "goldman",
      "jpmorgan",
      "morgan stanley"
    ];
    return interestingKeywords.some((kw) => lowerCompany.includes(kw));
  }
  isHighValueFiling(form, text) {
    if (!form) return false;
    if (["SC 13D", "13F-HR", "4"].includes(form)) return true;
    if (form === "8-K" && text?.toLowerCase().includes("acquisition")) return true;
    return false;
  }
  hasKeywords(text, keywords) {
    const lowerText = text.toLowerCase();
    return keywords.some((kw) => lowerText.includes(kw.toLowerCase()));
  }
  generateFingerprint(raw) {
    const key = `sec:${raw.sourceId}`;
    return createHash23("sha256").update(key).digest("hex").slice(0, 32);
  }
};

// src/sources/finnhub-hunter.ts
import { createHash as createHash24, randomUUID as randomUUID18 } from "crypto";
var FINNHUB_API = "https://finnhub.io/api/v1";
var TRACKED_SYMBOLS = [
  // Crypto-related
  "COIN",
  "MSTR",
  "RIOT",
  "MARA",
  "CLSK",
  "HUT",
  // Big tech
  "AAPL",
  "MSFT",
  "GOOGL",
  "AMZN",
  "NVDA",
  "META",
  "TSLA",
  // AI plays
  "AMD",
  "INTC",
  "CRM",
  "PLTR",
  "AI",
  "SNOW",
  // ETFs
  "QQQ",
  "SPY",
  "IWM",
  "ARKK"
];
var FinnhubHunter = class {
  source = "finnhub";
  config;
  apiKey;
  constructor(config) {
    this.config = config;
    this.apiKey = config.apiKey ?? process.env.FINNHUB_API_KEY ?? "";
  }
  async hunt() {
    if (!this.apiKey) {
      console.warn("[FinnhubHunter] No API key. Get one at https://finnhub.io/register");
      return [];
    }
    const discoveries = [];
    try {
      const congressTrades = await this.fetchCongressTrades();
      discoveries.push(...congressTrades.map((t) => this.congressTradeToDiscovery(t)));
    } catch (error) {
      console.error("[FinnhubHunter] Failed to fetch congress trades:", error);
    }
    for (const symbol of TRACKED_SYMBOLS.slice(0, 10)) {
      try {
        const insiders = await this.fetchInsiderTransactions(symbol);
        const recent = insiders.filter((t) => this.isRecent(t.filingDate));
        discoveries.push(...recent.map((t) => this.insiderToDiscovery(t)));
        await new Promise((r) => setTimeout(r, 1100));
      } catch (error) {
        console.error(`[FinnhubHunter] Failed to fetch insiders for ${symbol}:`, error);
      }
    }
    try {
      const earnings = await this.fetchEarningsSurprises();
      const significant = earnings.filter((e) => Math.abs(e.surprisePercent) > 5);
      discoveries.push(...significant.map((e) => this.earningsToDiscovery(e)));
    } catch (error) {
      console.error("[FinnhubHunter] Failed to fetch earnings:", error);
    }
    const seen = /* @__PURE__ */ new Set();
    return discoveries.filter((d) => {
      if (seen.has(d.sourceId)) return false;
      seen.add(d.sourceId);
      return true;
    });
  }
  transform(raw) {
    const text = `${raw.title} ${raw.description ?? ""}`.toLowerCase();
    const metadata = raw.metadata;
    return {
      id: randomUUID18(),
      source: "finnhub",
      sourceId: raw.sourceId,
      sourceUrl: raw.sourceUrl,
      title: raw.title,
      description: raw.description,
      author: raw.author,
      authorUrl: raw.authorUrl,
      publishedAt: raw.publishedAt,
      discoveredAt: /* @__PURE__ */ new Date(),
      category: this.categorize(metadata?.type),
      tags: this.extractTags(text, metadata),
      language: void 0,
      metrics: raw.metrics,
      relevanceFactors: {
        hasWeb3Keywords: this.isCryptoRelated(metadata?.symbol),
        hasAIKeywords: this.isAIRelated(metadata?.symbol),
        hasSolanaKeywords: false,
        hasEthereumKeywords: false,
        hasTypeScript: false,
        recentActivity: true,
        highEngagement: metadata?.type === "congress",
        // Congress trades are always high value
        isShowHN: false
      },
      rawMetadata: metadata,
      fingerprint: this.generateFingerprint(raw)
    };
  }
  async fetchCongressTrades() {
    const response = await fetch(
      `${FINNHUB_API}/stock/congressional-trading?symbol=&from=&to=&token=${this.apiKey}`,
      { headers: { "User-Agent": "gICM-Hunter/1.0" } }
    );
    if (!response.ok) {
      throw new Error(`Finnhub API error: ${response.status}`);
    }
    const data = await response.json();
    return (data.data ?? []).slice(0, 50);
  }
  async fetchInsiderTransactions(symbol) {
    const response = await fetch(
      `${FINNHUB_API}/stock/insider-transactions?symbol=${symbol}&token=${this.apiKey}`,
      { headers: { "User-Agent": "gICM-Hunter/1.0" } }
    );
    if (!response.ok) return [];
    const data = await response.json();
    return data.data ?? [];
  }
  async fetchEarningsSurprises() {
    const response = await fetch(
      `${FINNHUB_API}/calendar/earnings?from=${this.getDateString(-7)}&to=${this.getDateString(0)}&token=${this.apiKey}`,
      { headers: { "User-Agent": "gICM-Hunter/1.0" } }
    );
    if (!response.ok) return [];
    const data = await response.json();
    return (data.earningsCalendar ?? []).filter((e) => e.actual !== null && e.estimate !== null).map((e) => ({
      symbol: e.symbol,
      actual: e.actual,
      estimate: e.estimate,
      period: e.period,
      surprisePercent: (e.actual - e.estimate) / Math.abs(e.estimate) * 100
    }));
  }
  congressTradeToDiscovery(trade) {
    const isBuy = trade.transactionType.toLowerCase().includes("purchase");
    const emoji = isBuy ? "\u{1F7E2}" : "\u{1F534}";
    const action = isBuy ? "BOUGHT" : "SOLD";
    const amountRange = trade.amountFrom && trade.amountTo ? `$${this.formatNumber(trade.amountFrom)} - $${this.formatNumber(trade.amountTo)}` : "Amount undisclosed";
    return {
      sourceId: `finnhub:congress:${trade.symbol}:${trade.transactionDate}:${trade.name}`,
      sourceUrl: `https://finnhub.io/docs/api/congressional-trading`,
      title: `${emoji} [CONGRESS] ${trade.name} ${action} ${trade.symbol}`,
      description: `${trade.chamber} member ${trade.name} ${action.toLowerCase()} ${trade.symbol}. Amount: ${amountRange}. Filed: ${trade.filingDate}`,
      author: trade.name,
      publishedAt: new Date(trade.transactionDate),
      metrics: {
        points: trade.amountTo ?? trade.amountFrom ?? 0,
        likes: isBuy ? 1 : -1
      },
      metadata: { ...trade, type: "congress" }
    };
  }
  insiderToDiscovery(trade) {
    const isBuy = trade.change > 0;
    const emoji = isBuy ? "\u{1F7E2}" : "\u{1F534}";
    const action = isBuy ? "BOUGHT" : "SOLD";
    const value = Math.abs(trade.change * trade.transactionPrice);
    return {
      sourceId: `finnhub:insider:${trade.symbol}:${trade.transactionDate}:${trade.name}`,
      sourceUrl: `https://finnhub.io/docs/api/insider-transactions`,
      title: `${emoji} [INSIDER] ${trade.name} ${action} ${Math.abs(trade.change).toLocaleString()} ${trade.symbol}`,
      description: `Insider ${trade.name} ${action.toLowerCase()} ${Math.abs(trade.change).toLocaleString()} shares at $${trade.transactionPrice.toFixed(2)}. Total value: $${this.formatNumber(value)}`,
      author: trade.name,
      publishedAt: new Date(trade.transactionDate),
      metrics: {
        points: value,
        likes: trade.change
      },
      metadata: { ...trade, type: "insider" }
    };
  }
  earningsToDiscovery(earnings) {
    const isBeat = earnings.surprisePercent > 0;
    const emoji = isBeat ? "\u{1F3AF}" : "\u274C";
    const result = isBeat ? "BEAT" : "MISSED";
    return {
      sourceId: `finnhub:earnings:${earnings.symbol}:${earnings.period}`,
      sourceUrl: `https://finnhub.io/docs/api/earnings-calendar`,
      title: `${emoji} [EARNINGS] ${earnings.symbol} ${result} by ${Math.abs(earnings.surprisePercent).toFixed(1)}%`,
      description: `${earnings.symbol} reported EPS of $${earnings.actual.toFixed(2)} vs estimate of $${earnings.estimate.toFixed(2)} for ${earnings.period}`,
      publishedAt: /* @__PURE__ */ new Date(),
      metrics: {
        points: earnings.actual,
        likes: earnings.surprisePercent
      },
      metadata: { ...earnings, type: "earnings" }
    };
  }
  categorize(type) {
    return "other";
  }
  extractTags(text, metadata) {
    const tags = ["finnhub"];
    if (metadata?.type) {
      tags.push(metadata.type);
      if (metadata.type === "congress") tags.push("political-alpha");
      if (metadata.type === "insider") tags.push("insider-trade");
      if (metadata.type === "earnings") tags.push("earnings");
    }
    if (metadata?.symbol) {
      tags.push(metadata.symbol.toLowerCase());
      if (this.isCryptoRelated(metadata.symbol)) tags.push("crypto");
      if (this.isAIRelated(metadata.symbol)) tags.push("ai");
    }
    return tags;
  }
  isCryptoRelated(symbol) {
    if (!symbol) return false;
    const cryptoSymbols = ["COIN", "MSTR", "RIOT", "MARA", "CLSK", "HUT", "BITF", "BTBT"];
    return cryptoSymbols.includes(symbol.toUpperCase());
  }
  isAIRelated(symbol) {
    if (!symbol) return false;
    const aiSymbols = ["NVDA", "AMD", "PLTR", "AI", "SNOW", "CRM", "GOOGL", "MSFT"];
    return aiSymbols.includes(symbol.toUpperCase());
  }
  isRecent(dateStr) {
    const date = new Date(dateStr);
    const daysSince = (Date.now() - date.getTime()) / (1e3 * 60 * 60 * 24);
    return daysSince <= 7;
  }
  getDateString(daysOffset) {
    const date = /* @__PURE__ */ new Date();
    date.setDate(date.getDate() + daysOffset);
    return date.toISOString().split("T")[0];
  }
  formatNumber(num) {
    if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
    return num.toFixed(0);
  }
  generateFingerprint(raw) {
    const key = `finnhub:${raw.sourceId}`;
    return createHash24("sha256").update(key).digest("hex").slice(0, 32);
  }
};

// src/sources/npm-hunter.ts
import { createHash as createHash25, randomUUID as randomUUID19 } from "crypto";
var NPM_API = "https://api.npmjs.org";
var NPM_REGISTRY = "https://registry.npmjs.org";
var TRACKED_PACKAGES = [
  // AI/ML
  { name: "langchain", category: "ai" },
  { name: "@langchain/core", category: "ai" },
  { name: "openai", category: "ai" },
  { name: "@anthropic-ai/sdk", category: "ai" },
  { name: "ai", category: "ai" },
  // Vercel AI SDK
  { name: "ollama", category: "ai" },
  // Crypto/Web3
  { name: "@solana/web3.js", category: "crypto" },
  { name: "ethers", category: "crypto" },
  { name: "viem", category: "crypto" },
  { name: "wagmi", category: "crypto" },
  { name: "@coral-xyz/anchor", category: "crypto" },
  // Frontend Frameworks
  { name: "react", category: "frontend" },
  { name: "next", category: "frontend" },
  { name: "vue", category: "frontend" },
  { name: "svelte", category: "frontend" },
  { name: "solid-js", category: "frontend" },
  { name: "astro", category: "frontend" },
  // Backend/Runtime
  { name: "express", category: "backend" },
  { name: "fastify", category: "backend" },
  { name: "hono", category: "backend" },
  { name: "elysia", category: "backend" },
  // Dev Tools
  { name: "typescript", category: "tooling" },
  { name: "vite", category: "tooling" },
  { name: "turbo", category: "tooling" },
  { name: "bun", category: "tooling" },
  { name: "tsx", category: "tooling" }
];
var NPMHunter = class {
  source = "npm";
  config;
  constructor(config) {
    this.config = config;
  }
  async hunt() {
    const discoveries = [];
    for (const pkg of TRACKED_PACKAGES) {
      try {
        const downloads = await this.fetchDownloads(pkg.name);
        const info = await this.fetchPackageInfo(pkg.name);
        if (downloads && info) {
          const trend = await this.calculateTrend(pkg.name);
          const discovery = this.createDiscovery(pkg, downloads, info, trend);
          if (discovery) {
            discoveries.push(discovery);
          }
        }
        await new Promise((r) => setTimeout(r, 200));
      } catch (error) {
        console.error(`[NPMHunter] Failed to fetch ${pkg.name}:`, error);
      }
    }
    return discoveries.filter((d) => d.metrics.likes !== void 0 && Math.abs(d.metrics.likes) > 5).sort((a, b) => (b.metrics.likes ?? 0) - (a.metrics.likes ?? 0));
  }
  transform(raw) {
    const text = `${raw.title} ${raw.description ?? ""}`.toLowerCase();
    const metadata = raw.metadata;
    return {
      id: randomUUID19(),
      source: "npm",
      sourceId: raw.sourceId,
      sourceUrl: raw.sourceUrl,
      title: raw.title,
      description: raw.description,
      author: raw.author,
      authorUrl: raw.authorUrl,
      publishedAt: raw.publishedAt,
      discoveredAt: /* @__PURE__ */ new Date(),
      category: this.categorize(metadata?.category),
      tags: this.extractTags(text, metadata),
      language: void 0,
      metrics: raw.metrics,
      relevanceFactors: {
        hasWeb3Keywords: this.hasKeywords(text, RELEVANCE_KEYWORDS.web3),
        hasAIKeywords: this.hasKeywords(text, RELEVANCE_KEYWORDS.ai),
        hasSolanaKeywords: this.hasKeywords(text, RELEVANCE_KEYWORDS.solana),
        hasEthereumKeywords: this.hasKeywords(text, RELEVANCE_KEYWORDS.ethereum),
        hasTypeScript: this.hasKeywords(text, RELEVANCE_KEYWORDS.typescript),
        recentActivity: (metadata?.trend ?? 0) > 10,
        highEngagement: (metadata?.trend ?? 0) > 20,
        isShowHN: false
      },
      rawMetadata: metadata,
      fingerprint: this.generateFingerprint(raw)
    };
  }
  async fetchDownloads(packageName) {
    const response = await fetch(
      `${NPM_API}/downloads/point/last-week/${encodeURIComponent(packageName)}`,
      { headers: { "User-Agent": "gICM-Hunter/1.0" } }
    );
    if (!response.ok) return null;
    return response.json();
  }
  async fetchPackageInfo(packageName) {
    const response = await fetch(
      `${NPM_REGISTRY}/${encodeURIComponent(packageName)}`,
      { headers: { "User-Agent": "gICM-Hunter/1.0" } }
    );
    if (!response.ok) return null;
    return response.json();
  }
  async calculateTrend(packageName) {
    const thisWeek = await this.fetchDownloads(packageName);
    const lastWeekResponse = await fetch(
      `${NPM_API}/downloads/point/last-month/${encodeURIComponent(packageName)}`,
      { headers: { "User-Agent": "gICM-Hunter/1.0" } }
    );
    if (!lastWeekResponse.ok || !thisWeek) return 0;
    const lastMonth = await lastWeekResponse.json();
    const avgWeeklyLastMonth = lastMonth.downloads / 4;
    if (avgWeeklyLastMonth === 0) return 0;
    return (thisWeek.downloads - avgWeeklyLastMonth) / avgWeeklyLastMonth * 100;
  }
  createDiscovery(pkg, downloads, info, trend) {
    const emoji = trend > 0 ? "\u{1F4C8}" : trend < 0 ? "\u{1F4C9}" : "\u27A1\uFE0F";
    const trendStr = trend !== 0 ? ` (${trend > 0 ? "+" : ""}${trend.toFixed(1)}%)` : "";
    const latestVersion = info["dist-tags"]?.latest;
    const lastPublish = latestVersion ? info.time[latestVersion] : void 0;
    const isRecentlyUpdated = lastPublish ? Date.now() - new Date(lastPublish).getTime() < 7 * 24 * 60 * 60 * 1e3 : false;
    return {
      sourceId: `npm:${pkg.name}:${downloads.end}`,
      sourceUrl: `https://www.npmjs.com/package/${pkg.name}`,
      title: `${emoji} [NPM] ${pkg.name}: ${this.formatNumber(downloads.downloads)}/week${trendStr}`,
      description: `${info.description || pkg.name}${isRecentlyUpdated ? " | Recently updated!" : ""} | Category: ${pkg.category}`,
      author: info.author?.name || info.maintainers?.[0]?.name,
      authorUrl: info.repository?.url?.replace("git+", "").replace(".git", ""),
      publishedAt: lastPublish ? new Date(lastPublish) : void 0,
      metrics: {
        points: downloads.downloads,
        likes: trend,
        views: isRecentlyUpdated ? 1 : 0
      },
      metadata: {
        ...pkg,
        downloads: downloads.downloads,
        trend,
        latestVersion,
        lastPublish,
        keywords: info.keywords
      }
    };
  }
  categorize(category) {
    if (category === "ai") return "ai";
    if (category === "crypto") return "web3";
    if (category === "tooling") return "tooling";
    return "other";
  }
  extractTags(text, metadata) {
    const tags = ["npm", "javascript", "typescript"];
    if (metadata?.category) {
      tags.push(metadata.category);
    }
    if ((metadata?.trend ?? 0) > 20) tags.push("trending");
    if ((metadata?.trend ?? 0) < -20) tags.push("declining");
    if (this.hasKeywords(text, RELEVANCE_KEYWORDS.ai)) tags.push("ai");
    if (this.hasKeywords(text, RELEVANCE_KEYWORDS.web3)) tags.push("web3");
    return [...new Set(tags)];
  }
  hasKeywords(text, keywords) {
    const lowerText = text.toLowerCase();
    return keywords.some((kw) => lowerText.includes(kw.toLowerCase()));
  }
  formatNumber(num) {
    if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
    return num.toFixed(0);
  }
  generateFingerprint(raw) {
    const key = `npm:${raw.sourceId}`;
    return createHash25("sha256").update(key).digest("hex").slice(0, 32);
  }
};

// src/sources/rss-hunter.ts
import { createHash as createHash26 } from "crypto";
var DEFAULT_FEEDS = [
  // Crypto News (Priority 5)
  {
    name: "CoinDesk",
    url: "https://www.coindesk.com/arc/outboundfeeds/rss/",
    category: "crypto",
    priority: 5
  },
  {
    name: "The Block",
    url: "https://www.theblock.co/rss.xml",
    category: "crypto",
    priority: 5
  },
  {
    name: "Decrypt",
    url: "https://decrypt.co/feed",
    category: "crypto",
    priority: 4
  },
  {
    name: "CryptoSlate",
    url: "https://cryptoslate.com/feed/",
    category: "crypto",
    priority: 4
  },
  {
    name: "Cointelegraph",
    url: "https://cointelegraph.com/rss",
    category: "crypto",
    priority: 4
  },
  // AI/Tech News (Priority 4)
  {
    name: "TechCrunch AI",
    url: "https://techcrunch.com/category/artificial-intelligence/feed/",
    category: "ai",
    priority: 4
  },
  {
    name: "MIT Tech Review",
    url: "https://www.technologyreview.com/feed/",
    category: "ai",
    priority: 4
  },
  {
    name: "Ars Technica",
    url: "https://feeds.arstechnica.com/arstechnica/technology-lab",
    category: "tech",
    priority: 3
  },
  {
    name: "Wired",
    url: "https://www.wired.com/feed/rss",
    category: "tech",
    priority: 3
  },
  // Developer (Priority 3)
  {
    name: "Dev.to",
    url: "https://dev.to/feed",
    category: "dev",
    priority: 3
  },
  {
    name: "Hacker Noon",
    url: "https://hackernoon.com/feed",
    category: "dev",
    priority: 3
  },
  {
    name: "InfoQ",
    url: "https://feed.infoq.com/",
    category: "dev",
    priority: 2
  },
  // Solana Specific
  {
    name: "Solana Blog",
    url: "https://solana.com/news/rss.xml",
    category: "crypto",
    priority: 5
  },
  // DeFi Specific
  {
    name: "DeFi Pulse",
    url: "https://defipulse.com/blog/feed/",
    category: "crypto",
    priority: 4
  }
];
function parseRSSXML(xml) {
  const items = [];
  const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>|<entry[^>]*>([\s\S]*?)<\/entry>/gi;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const content = match[1] || match[2];
    const title = extractTag(content, "title");
    const link = extractTag(content, "link") || extractAtomLink(content);
    const description = extractTag(content, "description") || extractTag(content, "summary") || extractTag(content, "content");
    const pubDate = extractTag(content, "pubDate") || extractTag(content, "published") || extractTag(content, "updated");
    const author = extractTag(content, "author") || extractTag(content, "dc:creator");
    const guid = extractTag(content, "guid") || extractTag(content, "id");
    const categories = [];
    const catRegex = /<category[^>]*>([^<]+)<\/category>/gi;
    let catMatch;
    while ((catMatch = catRegex.exec(content)) !== null) {
      categories.push(catMatch[1].trim());
    }
    if (title && link) {
      items.push({
        title: decodeHTMLEntities(title),
        link,
        description: description ? decodeHTMLEntities(stripHTML(description)) : void 0,
        pubDate,
        author,
        categories,
        guid
      });
    }
  }
  return items;
}
function extractTag(content, tag) {
  const cdataRegex = new RegExp(
    `<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`,
    "i"
  );
  const regularRegex = new RegExp(`<${tag}[^>]*>([^<]*)<\\/${tag}>`, "i");
  const cdataMatch = content.match(cdataRegex);
  if (cdataMatch) return cdataMatch[1].trim();
  const regularMatch = content.match(regularRegex);
  if (regularMatch) return regularMatch[1].trim();
  return void 0;
}
function extractAtomLink(content) {
  const linkRegex = /<link[^>]*href=["']([^"']+)["'][^>]*\/?>/i;
  const match = content.match(linkRegex);
  return match ? match[1] : void 0;
}
function stripHTML(html) {
  return html.replace(/<[^>]*>/g, "").trim();
}
function decodeHTMLEntities(text) {
  const entities = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#39;": "'",
    "&apos;": "'",
    "&nbsp;": " ",
    "&#x27;": "'",
    "&#x2F;": "/"
  };
  return text.replace(/&[^;]+;/g, (entity) => entities[entity] || entity);
}
var RSSHunter = class {
  source = "rss";
  config;
  feeds;
  seenGuids = /* @__PURE__ */ new Set();
  constructor(config) {
    this.config = config;
    this.feeds = config.feeds || DEFAULT_FEEDS;
  }
  async hunt() {
    const discoveries = [];
    const now = /* @__PURE__ */ new Date();
    const maxAge = 24 * 60 * 60 * 1e3;
    const results = await Promise.allSettled(
      this.feeds.map((feed) => this.fetchFeed(feed))
    );
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const feed = this.feeds[i];
      if (result.status === "fulfilled" && result.value) {
        for (const item of result.value) {
          const guid = item.guid || item.link;
          if (this.seenGuids.has(guid)) continue;
          if (item.pubDate) {
            const pubDate = new Date(item.pubDate);
            if (now.getTime() - pubDate.getTime() > maxAge) continue;
          }
          if (this.config.filters?.keywords?.length) {
            const text = `${item.title} ${item.description || ""}`.toLowerCase();
            const hasKeyword = this.config.filters.keywords.some(
              (k) => text.includes(k.toLowerCase())
            );
            if (!hasKeyword) continue;
          }
          if (this.config.filters?.excludeKeywords?.length) {
            const text = `${item.title} ${item.description || ""}`.toLowerCase();
            const hasExcluded = this.config.filters.excludeKeywords.some(
              (k) => text.includes(k.toLowerCase())
            );
            if (hasExcluded) continue;
          }
          this.seenGuids.add(guid);
          discoveries.push(this.createDiscovery(item, feed));
        }
      } else if (result.status === "rejected") {
        console.warn(`[RSSHunter] Failed to fetch ${feed.name}:`, result.reason);
      }
    }
    discoveries.sort((a, b) => {
      const priorityA = a.metadata?.priority || 1;
      const priorityB = b.metadata?.priority || 1;
      if (priorityA !== priorityB) return priorityB - priorityA;
      const dateA = a.publishedAt?.getTime() || 0;
      const dateB = b.publishedAt?.getTime() || 0;
      return dateB - dateA;
    });
    return discoveries.slice(0, 50);
  }
  async fetchFeed(feed) {
    try {
      const response = await fetch(feed.url, {
        headers: {
          Accept: "application/rss+xml, application/xml, application/atom+xml, text/xml",
          "User-Agent": "gICM-HunterAgent/1.0"
        },
        signal: AbortSignal.timeout(1e4)
        // 10 second timeout
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const xml = await response.text();
      return parseRSSXML(xml);
    } catch (error) {
      console.error(`[RSSHunter] Error fetching ${feed.name}:`, error);
      return [];
    }
  }
  createDiscovery(item, feed) {
    const emoji = this.getCategoryEmoji(feed.category);
    return {
      sourceId: `rss-${feed.name}-${createHash26("md5").update(item.link).digest("hex").slice(0, 8)}`,
      sourceUrl: item.link,
      title: `${emoji} ${item.title}`,
      description: item.description?.slice(0, 500),
      author: item.author || feed.name,
      authorUrl: new URL(item.link).origin,
      publishedAt: item.pubDate ? new Date(item.pubDate) : void 0,
      metrics: {
        points: feed.priority
      },
      metadata: {
        type: "news_article",
        feedName: feed.name,
        feedCategory: feed.category,
        priority: feed.priority,
        categories: item.categories,
        guid: item.guid
      }
    };
  }
  getCategoryEmoji(category) {
    switch (category) {
      case "crypto":
        return "\u{1FA99}";
      case "ai":
        return "\u{1F916}";
      case "tech":
        return "\u{1F4BB}";
      case "dev":
        return "\u{1F468}\u200D\u{1F4BB}";
      case "market":
        return "\u{1F4CA}";
      default:
        return "\u{1F4F0}";
    }
  }
  transform(raw) {
    const text = `${raw.title} ${raw.description || ""}`.toLowerCase();
    const metadata = raw.metadata;
    const hasWeb3Keywords = RELEVANCE_KEYWORDS.web3.some(
      (k) => text.includes(k.toLowerCase())
    );
    const hasAIKeywords = RELEVANCE_KEYWORDS.ai.some(
      (k) => text.includes(k.toLowerCase())
    );
    const hasSolanaKeywords = RELEVANCE_KEYWORDS.solana.some(
      (k) => text.includes(k.toLowerCase())
    );
    const hasEthereumKeywords = RELEVANCE_KEYWORDS.ethereum.some(
      (k) => text.includes(k.toLowerCase())
    );
    const hasTypeScript = RELEVANCE_KEYWORDS.typescript.some(
      (k) => text.includes(k.toLowerCase())
    );
    const priority = metadata.priority || 1;
    const highEngagement = priority >= 4;
    let category = "other";
    const feedCategory = metadata.feedCategory;
    if (feedCategory === "crypto") {
      category = hasWeb3Keywords ? "web3" : "defi";
      if (text.includes("nft")) category = "nft";
    } else if (feedCategory === "ai") {
      category = "ai";
    } else if (feedCategory === "dev") {
      category = "tooling";
    }
    const tags = ["news"];
    tags.push(feedCategory);
    if (metadata.categories && Array.isArray(metadata.categories)) {
      const articleCats = metadata.categories;
      tags.push(...articleCats.slice(0, 5).map((c) => c.toLowerCase().replace(/\s+/g, "-")));
    }
    if (hasSolanaKeywords) tags.push("solana");
    if (hasEthereumKeywords) tags.push("ethereum");
    if (hasAIKeywords) tags.push("ai");
    if (hasWeb3Keywords) tags.push("web3");
    const fingerprint = createHash26("md5").update(raw.sourceUrl).digest("hex").slice(0, 16);
    return {
      id: `rss-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      source: this.source,
      sourceId: raw.sourceId,
      sourceUrl: raw.sourceUrl,
      title: raw.title,
      description: raw.description,
      author: raw.author,
      authorUrl: raw.authorUrl,
      publishedAt: raw.publishedAt,
      discoveredAt: /* @__PURE__ */ new Date(),
      category,
      tags: [...new Set(tags)],
      // Dedupe tags
      metrics: raw.metrics,
      relevanceFactors: {
        hasWeb3Keywords,
        hasAIKeywords,
        hasSolanaKeywords,
        hasEthereumKeywords,
        hasTypeScript,
        recentActivity: true,
        // All items are recent (< 24h)
        highEngagement,
        isShowHN: false
      },
      rawMetadata: raw.metadata,
      fingerprint
    };
  }
};

export {
  HuntSourceSchema,
  RawDiscoverySchema,
  HuntDiscoverySchema,
  GitHubRepoSchema,
  HNItemSchema,
  TwitterTweetSchema,
  RELEVANCE_KEYWORDS,
  DEFAULT_SCHEDULES,
  RugCheckHunter,
  PumpFunHunter,
  VybeHunter,
  GitHubHunter,
  HackerNewsHunter,
  TwitterHunter,
  NitterHunter,
  RedditHunter,
  ProductHuntHunter,
  ArxivHunter,
  LobstersHunter,
  DevToHunter,
  TikTokHunter,
  DeFiLlamaHunter,
  GeckoTerminalHunter,
  FearGreedHunter,
  BinanceHunter,
  FREDHunter,
  SECHunter,
  FinnhubHunter,
  NPMHunter,
  CoinGeckoHunter,
  CoinMarketCapHunter,
  LunarCrushHunter,
  PolymarketHunter,
  KalshiHunter,
  DEFAULT_FEEDS,
  RSSHunter
};
//# sourceMappingURL=chunk-6Y43THNA.js.map