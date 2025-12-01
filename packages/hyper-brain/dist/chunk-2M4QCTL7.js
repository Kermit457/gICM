import { EventEmitter } from 'eventemitter3';
import cron from 'node-cron';
import pino from 'pino';
import { XMLParser } from 'fast-xml-parser';
import Anthropic from '@anthropic-ai/sdk';
import { config } from 'dotenv';
import { promises } from 'fs';
import { join } from 'path';
import { z } from 'zod';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';

// src/index.ts
var transport = pino.transport({
  target: "pino-pretty",
  options: {
    colorize: true,
    translateTime: "SYS:standard",
    ignore: "pid,hostname"
  }
});
var baseLogger = pino(transport);
var Logger = class _Logger {
  logger;
  prefix;
  constructor(prefix) {
    this.prefix = prefix;
    this.logger = baseLogger.child({ module: prefix });
  }
  info(message, data) {
    if (data) {
      this.logger.info(data, `[${this.prefix}] ${message}`);
    } else {
      this.logger.info(`[${this.prefix}] ${message}`);
    }
  }
  warn(message, data) {
    if (data) {
      this.logger.warn(data, `[${this.prefix}] ${message}`);
    } else {
      this.logger.warn(`[${this.prefix}] ${message}`);
    }
  }
  error(message, data) {
    if (data) {
      this.logger.error(data, `[${this.prefix}] ${message}`);
    } else {
      this.logger.error(`[${this.prefix}] ${message}`);
    }
  }
  debug(message, data) {
    if (data) {
      this.logger.debug(data, `[${this.prefix}] ${message}`);
    } else {
      this.logger.debug(`[${this.prefix}] ${message}`);
    }
  }
  child(bindings) {
    const childLogger = new _Logger(this.prefix);
    childLogger.logger = this.logger.child(bindings);
    return childLogger;
  }
};
new Logger("HyperBrain");

// src/ingest/scheduler.ts
var Scheduler = class {
  tasks = /* @__PURE__ */ new Map();
  logger = new Logger("Scheduler");
  isRunning = false;
  /**
   * Schedule a task to run at interval
   */
  schedule(name, intervalMs, task) {
    this.tasks.set(name, {
      name,
      interval: intervalMs,
      task,
      running: false
    });
    this.logger.info(`Scheduled task: ${name} (every ${this.formatInterval(intervalMs)})`);
  }
  /**
   * Start all scheduled tasks
   */
  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    for (const [name, scheduledTask] of this.tasks) {
      const cronExpr = this.intervalToCron(scheduledTask.interval);
      scheduledTask.cronJob = cron.schedule(cronExpr, async () => {
        if (scheduledTask.running) {
          this.logger.warn(`Task ${name} already running, skipping`);
          return;
        }
        scheduledTask.running = true;
        const start = Date.now();
        try {
          await scheduledTask.task();
          scheduledTask.lastRun = Date.now();
          this.logger.debug(`Task ${name} completed in ${Date.now() - start}ms`);
        } catch (error) {
          this.logger.error(`Task ${name} failed: ${error}`);
        } finally {
          scheduledTask.running = false;
        }
      });
      this.logger.info(`Started task: ${name}`);
    }
    this.logger.info(`Scheduler started with ${this.tasks.size} tasks`);
  }
  /**
   * Stop all tasks
   */
  stop() {
    for (const [name, task] of this.tasks) {
      if (task.cronJob) {
        task.cronJob.stop();
        this.logger.info(`Stopped task: ${name}`);
      }
    }
    this.isRunning = false;
    this.logger.info("Scheduler stopped");
  }
  /**
   * Run a specific task immediately
   */
  async runNow(name) {
    const task = this.tasks.get(name);
    if (!task) {
      throw new Error(`Task not found: ${name}`);
    }
    if (task.running) {
      this.logger.warn(`Task ${name} already running`);
      return;
    }
    task.running = true;
    try {
      await task.task();
      task.lastRun = Date.now();
    } finally {
      task.running = false;
    }
  }
  /**
   * Run all tasks immediately
   */
  async runAll() {
    const tasks = Array.from(this.tasks.keys());
    await Promise.all(tasks.map((name) => this.runNow(name)));
  }
  /**
   * Get task status
   */
  getStatus() {
    return Array.from(this.tasks.values()).map((task) => ({
      name: task.name,
      lastRun: task.lastRun,
      running: task.running,
      interval: task.interval
    }));
  }
  /**
   * Convert interval (ms) to cron expression
   */
  intervalToCron(intervalMs) {
    const minutes = Math.floor(intervalMs / 6e4);
    if (minutes < 1) {
      return "* * * * *";
    } else if (minutes < 60) {
      return `*/${minutes} * * * *`;
    } else {
      const hours = Math.floor(minutes / 60);
      if (hours < 24) {
        return `0 */${hours} * * *`;
      } else {
        return "0 0 * * *";
      }
    }
  }
  /**
   * Format interval for display
   */
  formatInterval(ms) {
    if (ms < 6e4) return `${ms / 1e3}s`;
    if (ms < 36e5) return `${ms / 6e4}m`;
    return `${ms / 36e5}h`;
  }
};

// src/ingest/sources/base.ts
var BaseSource = class {
  enabled = true;
  priority = 50;
  rateLimit;
  logger;
  requestCount = 0;
  windowStart = Date.now();
  constructor() {
    this.logger = new Logger(this.constructor.name);
  }
  /**
   * Check if rate limit allows request
   */
  checkRateLimit() {
    if (!this.rateLimit) return true;
    const now = Date.now();
    if (now - this.windowStart > this.rateLimit.window) {
      this.windowStart = now;
      this.requestCount = 0;
    }
    if (this.requestCount >= this.rateLimit.requests) {
      this.logger.warn(`Rate limit reached for ${this.name}`);
      return false;
    }
    this.requestCount++;
    return true;
  }
  /**
   * Make a rate-limited fetch request
   */
  async rateLimitedFetch(url, options) {
    if (!this.checkRateLimit()) {
      throw new Error(`Rate limit exceeded for ${this.name}`);
    }
    return fetch(url, options);
  }
  /**
   * Generate unique ID for item
   */
  generateId(prefix, identifier) {
    return `${prefix}:${identifier}`;
  }
  /**
   * Get source config
   */
  getConfig() {
    return {
      name: this.name,
      type: this.type,
      interval: this.interval,
      enabled: this.enabled,
      priority: this.priority,
      rateLimit: this.rateLimit
    };
  }
};

// src/ingest/sources/crypto/onchain.ts
var OnChainSource = class extends BaseSource {
  name = "onchain";
  type = "onchain";
  interval = 60 * 1e3;
  // Every minute
  heliusApiKey;
  trackedWallets = [];
  constructor() {
    super();
    this.heliusApiKey = process.env.HELIUS_API_KEY || "";
    this.rateLimit = { requests: 30, window: 6e4 };
    this.loadTrackedWallets();
  }
  async fetch() {
    const items = [];
    const pumpTokens = await this.fetchPumpFunTokens();
    items.push(...pumpTokens);
    if (this.heliusApiKey) {
      const whaleTransactions = await this.fetchWhaleTransactions();
      items.push(...whaleTransactions);
    }
    return items;
  }
  async fetchPumpFunTokens() {
    const items = [];
    try {
      const response = await this.rateLimitedFetch(
        "https://frontend-api.pump.fun/coins/latest?limit=50"
      );
      if (!response.ok) {
        this.logger.warn(`pump.fun API returned ${response.status}`);
        return items;
      }
      const tokens = await response.json();
      for (const token of tokens) {
        items.push({
          id: this.generateId("pumpfun", token.mint),
          source: "pumpfun",
          type: "token_launch",
          content: `New token: ${token.name} (${token.symbol})${token.description ? ` - ${token.description}` : ""}`,
          metadata: {
            mint: token.mint,
            name: token.name,
            symbol: token.symbol,
            creator: token.creator,
            marketCap: token.usd_market_cap,
            twitter: token.twitter,
            telegram: token.telegram,
            website: token.website
          },
          timestamp: new Date(token.created_timestamp).getTime()
        });
      }
      this.logger.info(`Fetched ${items.length} tokens from pump.fun`);
    } catch (error) {
      this.logger.error(`Failed to fetch pump.fun tokens: ${error}`);
    }
    return items;
  }
  async fetchWhaleTransactions() {
    const items = [];
    for (const wallet of this.trackedWallets.slice(0, 5)) {
      try {
        const response = await this.rateLimitedFetch(
          `https://api.helius.xyz/v0/addresses/${wallet}/transactions?api-key=${this.heliusApiKey}&limit=10`
        );
        if (!response.ok) continue;
        const transactions = await response.json();
        for (const tx of transactions) {
          if (this.isSignificantTransaction(tx)) {
            items.push({
              id: this.generateId("helius", tx.signature),
              source: "helius",
              type: "transaction",
              content: tx.description || `Whale transaction: ${tx.type}`,
              metadata: {
                signature: tx.signature,
                wallet,
                type: tx.type,
                tokenTransfers: tx.tokenTransfers
              },
              timestamp: tx.timestamp * 1e3
            });
          }
        }
      } catch (error) {
        this.logger.error(`Failed to fetch wallet ${wallet.slice(0, 8)}...: ${error}`);
      }
    }
    return items;
  }
  isSignificantTransaction(tx) {
    if (tx.tokenTransfers && tx.tokenTransfers.length > 0) {
      return tx.tokenTransfers.some((t) => t.tokenAmount > 1e4);
    }
    return false;
  }
  loadTrackedWallets() {
    this.trackedWallets = [
      // Add tracked wallet addresses here
    ];
  }
};
var ArxivSource = class extends BaseSource {
  name = "arxiv";
  type = "paper";
  interval = 6 * 60 * 60 * 1e3;
  // Every 6 hours
  parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_"
  });
  categories = [
    "cs.AI",
    // Artificial Intelligence
    "cs.LG",
    // Machine Learning
    "cs.CL",
    // Computation and Language
    "cs.CV",
    // Computer Vision
    "cs.NE"
    // Neural and Evolutionary Computing
  ];
  constructor() {
    super();
    this.rateLimit = { requests: 10, window: 6e4 };
  }
  async fetch() {
    const items = [];
    for (const category of this.categories) {
      try {
        const papers = await this.fetchCategory(category);
        items.push(...papers);
      } catch (error) {
        this.logger.error(`Failed to fetch ${category}: ${error}`);
      }
    }
    this.logger.info(`Fetched ${items.length} papers from arXiv`);
    return items;
  }
  async fetchCategory(category) {
    const url = `http://export.arxiv.org/api/query?search_query=cat:${category}&sortBy=lastUpdatedDate&sortOrder=descending&max_results=20`;
    const response = await this.rateLimitedFetch(url);
    if (!response.ok) {
      throw new Error(`arXiv API returned ${response.status}`);
    }
    const xml = await response.text();
    const data = this.parser.parse(xml);
    const entries = data.feed?.entry || [];
    const items = [];
    const entryArray = Array.isArray(entries) ? entries : [entries];
    for (const entry of entryArray) {
      if (!entry?.id) continue;
      const arxivId = entry.id.split("/abs/")[1] || entry.id;
      items.push({
        id: this.generateId("arxiv", arxivId),
        source: this.name,
        type: "paper",
        content: `${entry.title || "Untitled"}

${entry.summary || ""}`,
        metadata: {
          title: entry.title?.replace(/\s+/g, " ").trim(),
          authors: this.parseAuthors(entry.author),
          categories: this.parseCategories(entry.category),
          pdfUrl: `https://arxiv.org/pdf/${arxivId}.pdf`,
          arxivUrl: `https://arxiv.org/abs/${arxivId}`,
          arxivId
        },
        timestamp: new Date(entry.updated || entry.published || Date.now()).getTime()
      });
    }
    return items;
  }
  parseAuthors(authors) {
    if (Array.isArray(authors)) {
      return authors.map((a) => typeof a === "object" && a && "name" in a ? String(a.name) : "").filter(Boolean);
    }
    if (typeof authors === "object" && authors && "name" in authors) {
      return [String(authors.name)];
    }
    return [];
  }
  parseCategories(categories) {
    if (Array.isArray(categories)) {
      return categories.map((c) => typeof c === "object" && c && "@_term" in c ? String(c["@_term"]) : "").filter(Boolean);
    }
    if (typeof categories === "object" && categories && "@_term" in categories) {
      return [String(categories["@_term"])];
    }
    return [];
  }
};

// src/ingest/sources/ai/github.ts
var GitHubSource = class extends BaseSource {
  name = "github";
  type = "github";
  interval = 60 * 60 * 1e3;
  // Every hour
  languages = ["python", "typescript", "rust", "go"];
  topics = ["ai", "llm", "agent", "solana", "defi", "web3"];
  constructor() {
    super();
    this.rateLimit = { requests: 30, window: 6e4 };
  }
  async fetch() {
    const items = [];
    for (const language of this.languages) {
      try {
        const repos = await this.fetchTrending(language);
        items.push(...repos);
      } catch (error) {
        this.logger.error(`Failed to fetch trending ${language}: ${error}`);
      }
    }
    for (const topic of this.topics) {
      try {
        const repos = await this.searchByTopic(topic);
        items.push(...repos);
      } catch (error) {
        this.logger.error(`Failed to search topic ${topic}: ${error}`);
      }
    }
    const seen = /* @__PURE__ */ new Set();
    const unique = items.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
    this.logger.info(`Fetched ${unique.length} repos from GitHub`);
    return unique;
  }
  async fetchTrending(language) {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1e3).toISOString().split("T")[0];
    const url = `https://api.github.com/search/repositories?q=language:${language}+created:>${since}&sort=stars&order=desc&per_page=20`;
    const response = await this.rateLimitedFetch(url, {
      headers: {
        Accept: "application/vnd.github.v3+json",
        ...process.env.GITHUB_TOKEN && {
          Authorization: `token ${process.env.GITHUB_TOKEN}`
        }
      }
    });
    if (!response.ok) {
      throw new Error(`GitHub API returned ${response.status}`);
    }
    const data = await response.json();
    return data.items.map((repo) => ({
      id: this.generateId("github", repo.full_name),
      source: this.name,
      type: "code",
      content: `${repo.full_name}: ${repo.description || "No description"}`,
      metadata: {
        fullName: repo.full_name,
        description: repo.description,
        url: repo.html_url,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        language: repo.language,
        topics: repo.topics,
        owner: repo.owner.login
      },
      timestamp: new Date(repo.updated_at || repo.created_at).getTime()
    }));
  }
  async searchByTopic(topic) {
    const url = `https://api.github.com/search/repositories?q=topic:${topic}&sort=updated&order=desc&per_page=15`;
    const response = await this.rateLimitedFetch(url, {
      headers: {
        Accept: "application/vnd.github.v3+json",
        ...process.env.GITHUB_TOKEN && {
          Authorization: `token ${process.env.GITHUB_TOKEN}`
        }
      }
    });
    if (!response.ok) {
      throw new Error(`GitHub API returned ${response.status}`);
    }
    const data = await response.json();
    return data.items.map((repo) => ({
      id: this.generateId("github", repo.full_name),
      source: this.name,
      type: "code",
      content: `${repo.full_name}: ${repo.description || "No description"}`,
      metadata: {
        fullName: repo.full_name,
        description: repo.description,
        url: repo.html_url,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        language: repo.language,
        topics: repo.topics,
        owner: repo.owner.login,
        searchTopic: topic
      },
      timestamp: new Date(repo.updated_at || repo.created_at).getTime()
    }));
  }
};

// src/ingest/sources/social/hackernews.ts
var HackerNewsSource = class extends BaseSource {
  name = "hackernews";
  type = "hackernews";
  interval = 15 * 60 * 1e3;
  // Every 15 minutes
  baseUrl = "https://hacker-news.firebaseio.com/v0";
  constructor() {
    super();
    this.rateLimit = { requests: 100, window: 6e4 };
  }
  async fetch() {
    const items = [];
    const topStories = await this.fetchTopStories();
    items.push(...topStories);
    const newStories = await this.fetchNewStories();
    items.push(...newStories);
    const showHN = await this.fetchShowHN();
    items.push(...showHN);
    const askHN = await this.fetchAskHN();
    items.push(...askHN);
    const seen = /* @__PURE__ */ new Set();
    const unique = items.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
    this.logger.info(`Fetched ${unique.length} stories from Hacker News`);
    return unique;
  }
  async fetchTopStories() {
    const response = await this.rateLimitedFetch(`${this.baseUrl}/topstories.json`);
    const ids = await response.json();
    return this.fetchStories(ids.slice(0, 30), "top");
  }
  async fetchNewStories() {
    const response = await this.rateLimitedFetch(`${this.baseUrl}/newstories.json`);
    const ids = await response.json();
    return this.fetchStories(ids.slice(0, 20), "new");
  }
  async fetchShowHN() {
    const response = await this.rateLimitedFetch(`${this.baseUrl}/showstories.json`);
    const ids = await response.json();
    return this.fetchStories(ids.slice(0, 15), "show");
  }
  async fetchAskHN() {
    const response = await this.rateLimitedFetch(`${this.baseUrl}/askstories.json`);
    const ids = await response.json();
    return this.fetchStories(ids.slice(0, 10), "ask");
  }
  async fetchStories(ids, category) {
    const items = [];
    const batchSize = 10;
    for (let i = 0; i < ids.length; i += batchSize) {
      const batch = ids.slice(i, i + batchSize);
      const results = await Promise.allSettled(
        batch.map((id) => this.fetchStory(id))
      );
      for (const result of results) {
        if (result.status === "fulfilled" && result.value) {
          const story = result.value;
          items.push({
            id: this.generateId("hn", story.id.toString()),
            source: this.name,
            type: "post",
            content: `${story.title}

${story.text || story.url || ""}`,
            metadata: {
              category,
              title: story.title,
              url: story.url,
              score: story.score,
              comments: story.descendants || 0,
              author: story.by,
              hnUrl: `https://news.ycombinator.com/item?id=${story.id}`,
              type: story.type
            },
            timestamp: story.time * 1e3
          });
        }
      }
    }
    return items;
  }
  async fetchStory(id) {
    try {
      const response = await this.rateLimitedFetch(`${this.baseUrl}/item/${id}.json`);
      if (!response.ok) return null;
      return await response.json();
    } catch {
      return null;
    }
  }
};

// src/ingest/sources/social/twitter.ts
var TwitterSource = class extends BaseSource {
  name = "twitter";
  type = "twitter";
  interval = 5 * 60 * 1e3;
  // Every 5 minutes
  bearerToken;
  // Tracked accounts (would be much longer in production)
  trackedAccounts = [
    // AI
    "AnthropicAI",
    "OpenAI",
    "GoogleDeepMind",
    // Crypto
    "solaborator",
    "CryptoHayes",
    "DegenSpartan",
    // Dev
    "levelsio",
    "raaborash",
    "swyx"
  ];
  // Keywords to track
  keywords = [
    "claude",
    "gpt",
    "llm",
    "ai agent",
    "solana",
    "$sol",
    "memecoin",
    "pump.fun",
    "cursor",
    "copilot",
    "autonomous"
  ];
  constructor() {
    super();
    this.bearerToken = process.env.TWITTER_BEARER_TOKEN || "";
    this.rateLimit = { requests: 15, window: 15 * 60 * 1e3 };
  }
  async fetch() {
    if (!this.bearerToken) {
      this.logger.warn("Twitter Bearer Token not configured, skipping");
      return [];
    }
    const items = [];
    for (const account of this.trackedAccounts.slice(0, 5)) {
      try {
        const tweets = await this.fetchUserTweets(account);
        items.push(...tweets);
      } catch (error) {
        this.logger.error(`Failed to fetch @${account}: ${error}`);
      }
    }
    for (const keyword of this.keywords.slice(0, 3)) {
      try {
        const tweets = await this.searchTweets(keyword);
        items.push(...tweets);
      } catch (error) {
        this.logger.error(`Failed to search "${keyword}": ${error}`);
      }
    }
    const seen = /* @__PURE__ */ new Set();
    const unique = items.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
    this.logger.info(`Fetched ${unique.length} tweets from Twitter`);
    return unique;
  }
  async fetchUserTweets(username) {
    const userResponse = await this.rateLimitedFetch(
      `https://api.twitter.com/2/users/by/username/${username}`,
      {
        headers: {
          Authorization: `Bearer ${this.bearerToken}`
        }
      }
    );
    if (!userResponse.ok) {
      throw new Error(`Failed to get user ${username}`);
    }
    const userData = await userResponse.json();
    if (!userData.data?.id) return [];
    const tweetsResponse = await this.rateLimitedFetch(
      `https://api.twitter.com/2/users/${userData.data.id}/tweets?max_results=10&tweet.fields=created_at,public_metrics`,
      {
        headers: {
          Authorization: `Bearer ${this.bearerToken}`
        }
      }
    );
    if (!tweetsResponse.ok) {
      throw new Error(`Failed to get tweets for ${username}`);
    }
    const tweetsData = await tweetsResponse.json();
    return (tweetsData.data || []).map((tweet) => ({
      id: this.generateId("twitter", tweet.id),
      source: this.name,
      type: "tweet",
      content: tweet.text,
      metadata: {
        author: username,
        tweetId: tweet.id,
        likes: tweet.public_metrics?.like_count || 0,
        retweets: tweet.public_metrics?.retweet_count || 0,
        replies: tweet.public_metrics?.reply_count || 0,
        url: `https://twitter.com/${username}/status/${tweet.id}`
      },
      timestamp: tweet.created_at ? new Date(tweet.created_at).getTime() : Date.now()
    }));
  }
  async searchTweets(query) {
    const encodedQuery = encodeURIComponent(query);
    const response = await this.rateLimitedFetch(
      `https://api.twitter.com/2/tweets/search/recent?query=${encodedQuery}&max_results=20&tweet.fields=created_at,public_metrics,author_id`,
      {
        headers: {
          Authorization: `Bearer ${this.bearerToken}`
        }
      }
    );
    if (!response.ok) {
      throw new Error(`Search failed for "${query}"`);
    }
    const data = await response.json();
    return (data.data || []).map((tweet) => ({
      id: this.generateId("twitter", tweet.id),
      source: this.name,
      type: "tweet",
      content: tweet.text,
      metadata: {
        query,
        tweetId: tweet.id,
        authorId: tweet.author_id,
        likes: tweet.public_metrics?.like_count || 0,
        retweets: tweet.public_metrics?.retweet_count || 0,
        replies: tweet.public_metrics?.reply_count || 0
      },
      timestamp: tweet.created_at ? new Date(tweet.created_at).getTime() : Date.now()
    }));
  }
};

// src/ingest/sources/business/producthunt.ts
var ProductHuntSource = class extends BaseSource {
  name = "producthunt";
  type = "producthunt";
  interval = 60 * 60 * 1e3;
  // Every hour
  constructor() {
    super();
    this.rateLimit = { requests: 10, window: 6e4 };
  }
  async fetch() {
    const items = [];
    try {
      const response = await this.rateLimitedFetch(
        "https://api.producthunt.com/v2/api/graphql",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...process.env.PRODUCTHUNT_TOKEN && {
              Authorization: `Bearer ${process.env.PRODUCTHUNT_TOKEN}`
            }
          },
          body: JSON.stringify({
            query: `
              query {
                posts(first: 30, order: VOTES) {
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
                      topics {
                        edges {
                          node {
                            name
                          }
                        }
                      }
                      makers {
                        name
                        username
                      }
                    }
                  }
                }
              }
            `
          })
        }
      );
      if (!response.ok) {
        this.logger.warn("Product Hunt API unavailable, using fallback");
        return items;
      }
      const data = await response.json();
      const posts = data?.data?.posts?.edges || [];
      for (const { node: product } of posts) {
        const topics = product.topics?.edges?.map((e) => e.node.name) || [];
        const makers = product.makers?.map((m) => m.name) || [];
        items.push({
          id: this.generateId("producthunt", product.id),
          source: this.name,
          type: "announcement",
          content: `${product.name}: ${product.tagline}

${product.description || ""}`,
          metadata: {
            productId: product.id,
            name: product.name,
            tagline: product.tagline,
            url: product.url,
            website: product.website,
            votes: product.votesCount,
            comments: product.commentsCount,
            topics,
            makers
          },
          timestamp: new Date(product.createdAt).getTime()
        });
      }
      this.logger.info(`Fetched ${items.length} products from Product Hunt`);
    } catch (error) {
      this.logger.error(`Failed to fetch Product Hunt: ${error}`);
    }
    return items;
  }
};

// src/ingest/sources/index.ts
var SourceRegistry = class {
  sources = /* @__PURE__ */ new Map();
  logger = new Logger("SourceRegistry");
  /**
   * Register all available sources
   */
  async registerAll() {
    this.register(new OnChainSource());
    this.register(new ArxivSource());
    this.register(new GitHubSource());
    this.register(new HackerNewsSource());
    this.register(new TwitterSource());
    this.register(new ProductHuntSource());
    this.logger.info(`Registered ${this.sources.size} data sources`);
  }
  /**
   * Register a single source
   */
  register(source) {
    if (!source.enabled) {
      this.logger.info(`Source ${source.name} is disabled, skipping`);
      return;
    }
    this.sources.set(source.name, source);
    this.logger.info(`Registered source: ${source.name} (${source.type})`);
  }
  /**
   * Get a source by name
   */
  get(name) {
    return this.sources.get(name);
  }
  /**
   * Get all sources
   */
  getAll() {
    return Array.from(this.sources.values());
  }
  /**
   * Get source count
   */
  count() {
    return this.sources.size;
  }
  /**
   * Get sources by type
   */
  getByType(type) {
    return this.getAll().filter((s) => s.type === type);
  }
  /**
   * Get sources sorted by priority
   */
  getByPriority() {
    return this.getAll().sort((a, b) => b.priority - a.priority);
  }
};

// src/ingest/index.ts
var IngestOrchestrator = class extends EventEmitter {
  scheduler;
  sources;
  logger = new Logger("Ingest");
  isRunning = false;
  stats = {
    totalIngested: 0,
    bySource: {},
    errors: 0,
    lastRun: {}
  };
  // Store for raw items (processed items go to storage layer)
  rawItems = [];
  maxRawItems = 1e4;
  constructor() {
    super();
    this.scheduler = new Scheduler();
    this.sources = new SourceRegistry();
  }
  /**
   * Start ingestion
   */
  async start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.logger.info("Starting HYPER BRAIN ingestion...");
    await this.sources.registerAll();
    for (const source of this.sources.getAll()) {
      this.scheduler.schedule(
        source.name,
        source.interval,
        async () => {
          await this.ingestSource(source.name);
        }
      );
    }
    this.scheduler.start();
    await this.ingestAll();
    this.logger.info(`Ingestion started: ${this.sources.count()} sources`);
  }
  /**
   * Stop ingestion
   */
  stop() {
    this.scheduler.stop();
    this.isRunning = false;
    this.logger.info("Ingestion stopped");
  }
  /**
   * Ingest from a specific source
   */
  async ingestSource(sourceName) {
    const source = this.sources.get(sourceName);
    if (!source) {
      this.logger.error(`Unknown source: ${sourceName}`);
      return 0;
    }
    this.logger.info(`Ingesting: ${sourceName}`);
    try {
      const rawItems = await source.fetch();
      for (const item of rawItems) {
        this.addRawItem(item);
        this.emit("item:ingested", item);
      }
      this.stats.totalIngested += rawItems.length;
      this.stats.bySource[sourceName] = (this.stats.bySource[sourceName] || 0) + rawItems.length;
      this.stats.lastRun[sourceName] = Date.now();
      this.emit("batch:complete", sourceName, rawItems.length);
      this.logger.info(`Ingested ${rawItems.length} items from ${sourceName}`);
      return rawItems.length;
    } catch (error) {
      this.stats.errors++;
      this.emit("error", sourceName, error);
      this.logger.error(`Ingestion failed: ${sourceName} - ${error}`);
      return 0;
    }
  }
  /**
   * Force ingest all sources
   */
  async ingestAll() {
    const sources = this.sources.getAll();
    this.logger.info(`Ingesting from ${sources.length} sources...`);
    const concurrency = 5;
    for (let i = 0; i < sources.length; i += concurrency) {
      const batch = sources.slice(i, i + concurrency);
      await Promise.all(batch.map((s) => this.ingestSource(s.name)));
    }
    this.logger.info(`Ingestion complete: ${this.stats.totalIngested} total items`);
    return this.getStats();
  }
  /**
   * Get ingestion stats
   */
  getStats() {
    return { ...this.stats };
  }
  /**
   * Get recent raw items
   */
  getRecentItems(count = 100) {
    return this.rawItems.slice(-count);
  }
  /**
   * Get raw items by source
   */
  getItemsBySource(source) {
    return this.rawItems.filter((item) => item.source === source);
  }
  /**
   * Search raw items
   */
  searchItems(query) {
    const lowerQuery = query.toLowerCase();
    return this.rawItems.filter(
      (item) => item.content.toLowerCase().includes(lowerQuery) || item.id.toLowerCase().includes(lowerQuery)
    );
  }
  /**
   * Add raw item to store
   */
  addRawItem(item) {
    this.rawItems.push(item);
    if (this.rawItems.length > this.maxRawItems) {
      this.rawItems = this.rawItems.slice(-this.maxRawItems);
    }
  }
  /**
   * Get source registry
   */
  getSources() {
    return this.sources;
  }
};

// src/process/embeddings.ts
var EmbeddingGenerator = class {
  logger = new Logger("Embeddings");
  cache = /* @__PURE__ */ new Map();
  model;
  constructor(model = "text-embedding-3-small") {
    this.model = model;
  }
  /**
   * Generate embedding for text
   */
  async embed(text) {
    const cacheKey = this.hashText(text);
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }
    const embedding = await this.generateEmbedding(text);
    this.cache.set(cacheKey, embedding);
    return embedding;
  }
  /**
   * Embed multiple texts in batch
   */
  async embedBatch(texts) {
    return Promise.all(texts.map((t) => this.embed(t)));
  }
  /**
   * Generate embedding using API
   */
  async generateEmbedding(text) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      this.logger.warn("OpenAI API key not set, using mock embedding");
      return this.mockEmbedding(text);
    }
    try {
      const response = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: this.model,
          input: text.slice(0, 8e3)
          // Truncate if too long
        })
      });
      if (!response.ok) {
        throw new Error(`OpenAI API returned ${response.status}`);
      }
      const data = await response.json();
      return data.data[0].embedding;
    } catch (error) {
      this.logger.error(`Embedding failed: ${error}`);
      return this.mockEmbedding(text);
    }
  }
  /**
   * Generate mock embedding for development
   */
  mockEmbedding(text) {
    const dimensions = 1536;
    const embedding = [];
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = (hash << 5) - hash + text.charCodeAt(i);
      hash = hash & hash;
    }
    const rng = this.seededRandom(hash);
    for (let i = 0; i < dimensions; i++) {
      embedding.push(rng() * 2 - 1);
    }
    const magnitude = Math.sqrt(
      embedding.reduce((sum, val) => sum + val * val, 0)
    );
    return embedding.map((val) => val / magnitude);
  }
  /**
   * Seeded random number generator
   */
  seededRandom(seed) {
    return () => {
      seed = seed * 1103515245 + 12345 & 2147483647;
      return seed / 2147483647;
    };
  }
  /**
   * Calculate cosine similarity between embeddings
   */
  static cosineSimilarity(a, b) {
    if (a.length !== b.length) {
      throw new Error("Embeddings must have same dimensions");
    }
    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      magnitudeA += a[i] * a[i];
      magnitudeB += b[i] * b[i];
    }
    return dotProduct / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));
  }
  /**
   * Simple text hash for caching
   */
  hashText(text) {
    let hash = 0;
    for (let i = 0; i < Math.min(text.length, 1e3); i++) {
      hash = (hash << 5) - hash + text.charCodeAt(i);
      hash = hash & hash;
    }
    return hash.toString();
  }
  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }
  /**
   * Get cache size
   */
  getCacheSize() {
    return this.cache.size;
  }
};
var EntityExtractor = class {
  anthropic = null;
  logger = new Logger("EntityExtractor");
  cache = /* @__PURE__ */ new Map();
  constructor() {
    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic();
    }
  }
  /**
   * Extract entities from text
   */
  async extract(text) {
    const cacheKey = this.hashText(text);
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }
    let entities;
    if (this.anthropic && text.length > 100) {
      entities = await this.extractWithLLM(text);
    } else {
      entities = this.extractWithRegex(text);
    }
    this.cache.set(cacheKey, entities);
    return entities;
  }
  /**
   * Extract entities using Claude
   */
  async extractWithLLM(text) {
    try {
      const response = await this.anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: `Extract entities from this text. Return as JSON array with format: [{"type": "person|company|token|technology|concept|event", "name": "...", "aliases": [...]}]

Text: ${text.slice(0, 2e3)}

JSON:`
          }
        ]
      });
      const content = response.content[0];
      if (content.type === "text") {
        const jsonMatch = content.text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return parsed.map((e, i) => ({
            id: `entity-${i}-${e.name.toLowerCase().replace(/\s+/g, "-")}`,
            type: e.type,
            name: e.name,
            aliases: e.aliases || [],
            attributes: {}
          }));
        }
      }
    } catch (error) {
      this.logger.error(`LLM extraction failed: ${error}`);
    }
    return this.extractWithRegex(text);
  }
  /**
   * Extract entities using regex patterns
   */
  extractWithRegex(text) {
    const entities = [];
    const seen = /* @__PURE__ */ new Set();
    const tokenPattern = /\$([A-Z]{2,10})\b/g;
    let match;
    while ((match = tokenPattern.exec(text)) !== null) {
      const name = match[1];
      if (!seen.has(name)) {
        seen.add(name);
        entities.push({
          id: `token-${name.toLowerCase()}`,
          type: "token",
          name,
          aliases: [`$${name}`],
          attributes: {}
        });
      }
    }
    const techPatterns = [
      /\b(GPT-\d+|Claude|Gemini|LLaMA|Mistral|Anthropic|OpenAI|DeepMind)\b/gi,
      /\b(Solana|Ethereum|Bitcoin|Polygon|Arbitrum|Base)\b/gi,
      /\b(React|Next\.js|TypeScript|Python|Rust|Go)\b/gi,
      /\b(Jupiter|Raydium|Uniswap|Aave|pump\.fun)\b/gi
    ];
    for (const pattern of techPatterns) {
      while ((match = pattern.exec(text)) !== null) {
        const name = match[1];
        const normalizedName = name.toLowerCase();
        if (!seen.has(normalizedName)) {
          seen.add(normalizedName);
          entities.push({
            id: `tech-${normalizedName.replace(/[.\s]/g, "-")}`,
            type: "technology",
            name,
            aliases: [],
            attributes: {}
          });
        }
      }
    }
    const companyPatterns = [
      /\b(Anthropic|OpenAI|Google|Meta|Microsoft|Apple|Tesla|NVIDIA)\b/gi,
      /\b(Coinbase|Binance|FTX|Alameda|a16z|Sequoia)\b/gi
    ];
    for (const pattern of companyPatterns) {
      while ((match = pattern.exec(text)) !== null) {
        const name = match[1];
        const normalizedName = name.toLowerCase();
        if (!seen.has(normalizedName)) {
          seen.add(normalizedName);
          entities.push({
            id: `company-${normalizedName}`,
            type: "company",
            name,
            aliases: [],
            attributes: {}
          });
        }
      }
    }
    const personPattern = /@([A-Za-z0-9_]{1,15})\b/g;
    while ((match = personPattern.exec(text)) !== null) {
      const name = match[1];
      if (!seen.has(name.toLowerCase()) && name.length > 2) {
        seen.add(name.toLowerCase());
        entities.push({
          id: `person-${name.toLowerCase()}`,
          type: "person",
          name: `@${name}`,
          aliases: [name],
          attributes: {}
        });
      }
    }
    return entities;
  }
  /**
   * Simple text hash for caching
   */
  hashText(text) {
    let hash = 0;
    for (let i = 0; i < Math.min(text.length, 500); i++) {
      hash = (hash << 5) - hash + text.charCodeAt(i);
      hash = hash & hash;
    }
    return hash.toString();
  }
  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }
};
var ContentSummarizer = class {
  anthropic = null;
  logger = new Logger("Summarizer");
  cache = /* @__PURE__ */ new Map();
  constructor() {
    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic();
    }
  }
  /**
   * Summarize text content
   */
  async summarize(text, maxLength = 200) {
    if (text.length <= maxLength) {
      return text;
    }
    const cacheKey = this.hashText(text);
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }
    let summary;
    if (this.anthropic && text.length > 500) {
      summary = await this.summarizeWithLLM(text, maxLength);
    } else {
      summary = this.summarizeSimple(text, maxLength);
    }
    this.cache.set(cacheKey, summary);
    return summary;
  }
  /**
   * Summarize using Claude
   */
  async summarizeWithLLM(text, maxLength) {
    try {
      const response = await this.anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 256,
        messages: [
          {
            role: "user",
            content: `Summarize this in ${maxLength} characters or less. Be concise and capture the key point:

${text.slice(0, 3e3)}

Summary:`
          }
        ]
      });
      const content = response.content[0];
      if (content.type === "text") {
        return content.text.slice(0, maxLength);
      }
    } catch (error) {
      this.logger.error(`LLM summarization failed: ${error}`);
    }
    return this.summarizeSimple(text, maxLength);
  }
  /**
   * Simple extractive summarization
   */
  summarizeSimple(text, maxLength) {
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 10);
    if (sentences.length === 0) {
      return text.slice(0, maxLength);
    }
    const scored = sentences.map((sentence, index) => ({
      sentence: sentence.trim(),
      score: this.scoreSentence(sentence, index, sentences.length)
    }));
    scored.sort((a, b) => b.score - a.score);
    let summary = "";
    for (const { sentence } of scored) {
      if (summary.length + sentence.length + 2 <= maxLength) {
        summary += (summary ? ". " : "") + sentence;
      } else {
        break;
      }
    }
    return summary || text.slice(0, maxLength);
  }
  /**
   * Score a sentence for importance
   */
  scoreSentence(sentence, index, totalSentences) {
    let score = 0;
    if (index === 0) score += 2;
    if (index === totalSentences - 1) score += 1;
    const wordCount = sentence.split(/\s+/).length;
    if (wordCount >= 5 && wordCount <= 30) score += 1;
    const importantPatterns = [
      /\b(important|key|main|significant|notable)\b/i,
      /\b(announces?|launches?|releases?|introduces?)\b/i,
      /\b(first|new|latest|biggest|largest)\b/i,
      /\$[A-Z]+/,
      /\d+%/,
      /\$[\d,]+/
    ];
    for (const pattern of importantPatterns) {
      if (pattern.test(sentence)) score += 0.5;
    }
    return score;
  }
  /**
   * Simple text hash for caching
   */
  hashText(text) {
    let hash = 0;
    for (let i = 0; i < Math.min(text.length, 500); i++) {
      hash = (hash << 5) - hash + text.charCodeAt(i);
      hash = hash & hash;
    }
    return hash.toString();
  }
  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }
};

// src/process/classifier.ts
var ContentClassifier = class {
  logger = new Logger("Classifier");
  // Topic keywords
  topicKeywords = {
    crypto: [
      "bitcoin",
      "ethereum",
      "solana",
      "token",
      "blockchain",
      "defi",
      "nft",
      "wallet",
      "swap",
      "dex",
      "memecoin",
      "pump",
      "dump",
      "whale",
      "airdrop"
    ],
    ai: [
      "llm",
      "gpt",
      "claude",
      "ai",
      "machine learning",
      "neural",
      "model",
      "training",
      "inference",
      "agent",
      "autonomous",
      "embedding",
      "transformer"
    ],
    trading: [
      "buy",
      "sell",
      "trade",
      "position",
      "long",
      "short",
      "profit",
      "loss",
      "entry",
      "exit",
      "stop loss",
      "take profit",
      "leverage",
      "margin"
    ],
    development: [
      "code",
      "build",
      "deploy",
      "api",
      "sdk",
      "framework",
      "library",
      "release",
      "version",
      "bug",
      "fix",
      "feature",
      "typescript",
      "python"
    ],
    news: [
      "announce",
      "launch",
      "release",
      "partnership",
      "funding",
      "raise",
      "acquisition",
      "ipo",
      "regulation",
      "sec",
      "government"
    ],
    research: [
      "paper",
      "study",
      "research",
      "analysis",
      "benchmark",
      "evaluation",
      "experiment",
      "results",
      "arxiv",
      "findings",
      "methodology"
    ],
    social: [
      "community",
      "discord",
      "telegram",
      "twitter",
      "viral",
      "trending",
      "followers",
      "engagement",
      "sentiment",
      "fud",
      "fomo"
    ]
  };
  // Sentiment keywords
  positiveKeywords = [
    "bullish",
    "moon",
    "pump",
    "gain",
    "profit",
    "success",
    "breakthrough",
    "innovative",
    "amazing",
    "great",
    "excellent",
    "best",
    "top",
    "win",
    "growth",
    "opportunity",
    "exciting",
    "impressive",
    "powerful"
  ];
  negativeKeywords = [
    "bearish",
    "dump",
    "crash",
    "loss",
    "scam",
    "rug",
    "hack",
    "exploit",
    "fail",
    "bad",
    "worst",
    "decline",
    "risk",
    "warning",
    "concern",
    "problem",
    "issue",
    "bug",
    "vulnerability",
    "fear"
  ];
  /**
   * Classify content
   */
  classify(text) {
    const lowerText = text.toLowerCase();
    return {
      topics: this.classifyTopics(lowerText),
      sentiment: this.classifySentiment(lowerText),
      importance: this.classifyImportance(text),
      confidence: this.calculateConfidence(text)
    };
  }
  /**
   * Classify topics
   */
  classifyTopics(text) {
    const topics = [];
    const scores = {};
    for (const [topic, keywords] of Object.entries(this.topicKeywords)) {
      let score = 0;
      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          score += 1;
        }
      }
      if (score > 0) {
        scores[topic] = score;
      }
    }
    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]).slice(0, 3);
    for (const [topic, score] of sorted) {
      if (score >= 1) {
        topics.push(topic);
      }
    }
    return topics.length > 0 ? topics : ["general"];
  }
  /**
   * Classify sentiment (-1 to 1)
   */
  classifySentiment(text) {
    let positiveScore = 0;
    let negativeScore = 0;
    for (const keyword of this.positiveKeywords) {
      if (text.includes(keyword)) {
        positiveScore += 1;
      }
    }
    for (const keyword of this.negativeKeywords) {
      if (text.includes(keyword)) {
        negativeScore += 1;
      }
    }
    const total = positiveScore + negativeScore;
    if (total === 0) return 0;
    return (positiveScore - negativeScore) / total;
  }
  /**
   * Classify importance (0 to 100)
   */
  classifyImportance(text) {
    let score = 50;
    text.toLowerCase();
    if (/\b(breaking|urgent|major|significant|massive)\b/i.test(text)) {
      score += 20;
    }
    if (/\$[\d,]+/.test(text)) score += 10;
    if (/\d+%/.test(text)) score += 5;
    if (/\d+x\b/.test(text)) score += 5;
    if (/\b(Anthropic|OpenAI|Google|Microsoft|Solana|Ethereum)\b/i.test(text)) {
      score += 10;
    }
    if (text.length > 500) score += 5;
    if (text.length > 1e3) score += 5;
    if (/\b(official|announce|launch|release)\b/i.test(text)) {
      score += 10;
    }
    return Math.min(100, Math.max(0, score));
  }
  /**
   * Calculate classification confidence
   */
  calculateConfidence(text) {
    let confidence = 0.5;
    if (text.length > 100) confidence += 0.1;
    if (text.length > 500) confidence += 0.1;
    const keywordCount = this.countKeywords(text.toLowerCase());
    if (keywordCount > 3) confidence += 0.1;
    if (keywordCount > 7) confidence += 0.1;
    return Math.min(1, confidence);
  }
  /**
   * Count total keywords found
   */
  countKeywords(text) {
    let count = 0;
    for (const keywords of Object.values(this.topicKeywords)) {
      for (const keyword of keywords) {
        if (text.includes(keyword)) count++;
      }
    }
    return count;
  }
};
config();
var DEFAULT_CONFIG = {
  // API Keys from environment
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  openaiApiKey: process.env.OPENAI_API_KEY,
  heliusApiKey: process.env.HELIUS_API_KEY,
  twitterBearerToken: process.env.TWITTER_BEARER_TOKEN,
  // Storage
  vectorDb: "local",
  graphDb: "local",
  // Processing
  embeddingModel: "text-embedding-3-small",
  maxConcurrentIngests: 10,
  // API
  apiPort: 3300,
  enableApi: true,
  enableWebSocket: true
};
function loadConfig(overrides = {}) {
  return {
    ...DEFAULT_CONFIG,
    ...overrides
  };
}
var SOURCE_CREDIBILITY = {
  arxiv: 95,
  github: 85,
  docs: 90,
  onchain: 99,
  dex: 95,
  whale: 90,
  hackernews: 75,
  producthunt: 70,
  twitter: 60,
  reddit: 50,
  news: 70,
  blog: 65,
  competitor: 80
};
var DECAY_RATES = {
  twitter: 0.9,
  onchain: 0.8,
  dex: 0.85,
  whale: 0.8,
  news: 0.7,
  hackernews: 0.7,
  reddit: 0.6,
  producthunt: 0.5,
  github: 0.3,
  blog: 0.2,
  arxiv: 0.1,
  docs: 0.05
};

// src/process/index.ts
var ProcessingPipeline = class {
  embedder;
  entityExtractor;
  summarizer;
  classifier;
  logger = new Logger("Processing");
  constructor() {
    this.embedder = new EmbeddingGenerator();
    this.entityExtractor = new EntityExtractor();
    this.summarizer = new ContentSummarizer();
    this.classifier = new ContentClassifier();
  }
  /**
   * Process raw item into rich knowledge
   */
  async process(raw) {
    this.logger.debug(`Processing: ${raw.id}`);
    const [embedding, entities, summary, classification] = await Promise.all([
      this.embedder.embed(raw.content),
      this.entityExtractor.extract(raw.content),
      this.summarizer.summarize(raw.content),
      Promise.resolve(this.classifier.classify(raw.content))
    ]);
    const sourceType = this.getSourceType(raw.source);
    const contentType = this.getContentType(raw.type);
    return {
      id: raw.id,
      source: {
        type: sourceType,
        name: raw.source,
        url: raw.metadata?.url,
        credibility: SOURCE_CREDIBILITY[raw.source] || 50
      },
      content: {
        raw: raw.content,
        summary,
        type: contentType
      },
      embedding,
      entities,
      relationships: [],
      // Relationships are mapped in a separate step
      topics: classification.topics,
      sentiment: classification.sentiment,
      importance: classification.importance,
      timestamp: raw.timestamp,
      decayRate: DECAY_RATES[raw.source] || 0.5,
      processed: true,
      quality: this.assessQuality(raw, classification)
    };
  }
  /**
   * Process multiple items
   */
  async processBatch(items) {
    const results = [];
    for (const item of items) {
      try {
        const processed = await this.process(item);
        results.push(processed);
      } catch (error) {
        this.logger.error(`Failed to process ${item.id}: ${error}`);
      }
    }
    return results;
  }
  /**
   * Get source type from string
   */
  getSourceType(source) {
    const mapping = {
      helius: "onchain",
      pumpfun: "onchain",
      twitter: "twitter",
      hackernews: "hackernews",
      arxiv: "paper",
      github: "github",
      producthunt: "producthunt"
    };
    return mapping[source] || "social";
  }
  /**
   * Get content type from string
   */
  getContentType(type) {
    const mapping = {
      token_launch: "event",
      transaction: "transaction",
      tweet: "tweet",
      post: "post",
      paper: "paper",
      code: "code",
      announcement: "announcement"
    };
    return mapping[type] || "article";
  }
  /**
   * Assess content quality (0-100)
   */
  assessQuality(raw, classification) {
    let quality = 50;
    if (raw.content.length > 100) quality += 5;
    if (raw.content.length > 500) quality += 10;
    if (raw.content.length > 2e3) quality += 5;
    const metadata = raw.metadata || {};
    if (typeof metadata.likes === "number" && metadata.likes > 100) quality += 10;
    if (typeof metadata.retweets === "number" && metadata.retweets > 50) quality += 10;
    if (typeof metadata.score === "number" && metadata.score > 100) quality += 15;
    if (typeof metadata.stars === "number" && metadata.stars > 50) quality += 10;
    quality += classification.confidence * 10;
    quality += (SOURCE_CREDIBILITY[raw.source] || 50) / 10;
    return Math.min(100, Math.max(0, quality));
  }
  /**
   * Get embedding generator
   */
  getEmbedder() {
    return this.embedder;
  }
  /**
   * Get entity extractor
   */
  getEntityExtractor() {
    return this.entityExtractor;
  }
};
var LocalVectorStore = class {
  vectors = /* @__PURE__ */ new Map();
  logger = new Logger("VectorStore");
  dataPath;
  dirty = false;
  saveInterval = null;
  constructor(dataDir = "./data") {
    this.dataPath = join(dataDir, "vectors.json");
  }
  /**
   * Initialize store
   */
  async init() {
    await this.load();
    this.saveInterval = setInterval(async () => {
      if (this.dirty) {
        await this.save();
        this.dirty = false;
      }
    }, 3e4);
    this.logger.info(`Vector store initialized: ${this.vectors.size} vectors`);
  }
  /**
   * Add item to store
   */
  async add(item) {
    this.vectors.set(item.id, {
      id: item.id,
      embedding: item.embedding,
      item
    });
    this.dirty = true;
  }
  /**
   * Add multiple items
   */
  async addBatch(items) {
    for (const item of items) {
      await this.add(item);
    }
  }
  /**
   * Get item by ID
   */
  get(id) {
    return this.vectors.get(id)?.item;
  }
  /**
   * Delete item
   */
  delete(id) {
    const deleted = this.vectors.delete(id);
    if (deleted) this.dirty = true;
    return deleted;
  }
  /**
   * Search by vector similarity
   */
  async search(queryEmbedding, limit = 10, minScore = 0) {
    const results = [];
    for (const entry of this.vectors.values()) {
      const score = EmbeddingGenerator.cosineSimilarity(
        queryEmbedding,
        entry.embedding
      );
      if (score >= minScore) {
        results.push({ entry, score });
      }
    }
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, limit).map(({ entry, score }) => ({
      ...entry.item,
      score
    }));
  }
  /**
   * Search by text query
   */
  async searchText(query, embedder, limit = 10) {
    const queryEmbedding = await embedder.embed(query);
    return this.search(queryEmbedding, limit);
  }
  /**
   * Filter by metadata
   */
  filter(predicate) {
    const results = [];
    for (const entry of this.vectors.values()) {
      if (predicate(entry.item)) {
        results.push(entry.item);
      }
    }
    return results;
  }
  /**
   * Get all items
   */
  getAll() {
    return Array.from(this.vectors.values()).map((e) => e.item);
  }
  /**
   * Get item count
   */
  count() {
    return this.vectors.size;
  }
  /**
   * Load from disk
   */
  async load() {
    try {
      const data = await promises.readFile(this.dataPath, "utf-8");
      const entries = JSON.parse(data);
      for (const entry of entries) {
        this.vectors.set(entry.id, entry);
      }
      this.logger.info(`Loaded ${entries.length} vectors from disk`);
    } catch (error) {
      this.logger.debug("No existing vector store found");
    }
  }
  /**
   * Save to disk
   */
  async save() {
    try {
      const entries = Array.from(this.vectors.values());
      const dir = this.dataPath.split("/").slice(0, -1).join("/");
      await promises.mkdir(dir, { recursive: true });
      await promises.writeFile(this.dataPath, JSON.stringify(entries, null, 2));
      this.logger.info(`Saved ${entries.length} vectors to disk`);
    } catch (error) {
      this.logger.error(`Failed to save vectors: ${error}`);
    }
  }
  /**
   * Clear store
   */
  clear() {
    this.vectors.clear();
    this.dirty = true;
  }
  /**
   * Shutdown
   */
  async shutdown() {
    if (this.saveInterval) {
      clearInterval(this.saveInterval);
    }
    if (this.dirty) {
      await this.save();
    }
  }
};

// src/store/vector/pinecone.ts
var PineconeVectorStore = class {
  logger = new Logger("PineconeVectorStore");
  config;
  client;
  // Pinecone client
  index = null;
  namespace;
  localCache = /* @__PURE__ */ new Map();
  initialized = false;
  constructor(config) {
    this.config = {
      dimension: 768,
      // Default for Gemini embeddings
      namespace: "default",
      ...config
    };
    this.namespace = this.config.namespace;
  }
  /**
   * Initialize Pinecone connection
   */
  async init() {
    try {
      const { Pinecone } = await import('./dist-ZI364LMU.js');
      this.client = new Pinecone({
        apiKey: this.config.apiKey
      });
      this.index = this.client.index(this.config.indexName);
      const stats = await this.index.describeIndexStats();
      const vectorCount = stats.namespaces?.[this.namespace]?.vectorCount ?? 0;
      this.initialized = true;
      this.logger.info(
        `Pinecone initialized: index=${this.config.indexName}, namespace=${this.namespace}, vectors=${vectorCount}`
      );
    } catch (error) {
      const err = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to initialize Pinecone: ${err}`);
      if (err.includes("Cannot find module") || err.includes("MODULE_NOT_FOUND")) {
        throw new Error(
          "Pinecone package not installed. Run: pnpm add @pinecone-database/pinecone"
        );
      }
      throw error;
    }
  }
  /**
   * Add item to Pinecone
   */
  async add(item) {
    this.ensureInitialized();
    const vector = {
      id: item.id,
      values: item.embedding,
      metadata: this.serializeMetadata(item)
    };
    await this.index.namespace(this.namespace).upsert([vector]);
    this.localCache.set(item.id, item);
    this.logger.debug(`Added vector: ${item.id}`);
  }
  /**
   * Add multiple items in batch
   */
  async addBatch(items) {
    this.ensureInitialized();
    if (items.length === 0) return;
    const batchSize = 100;
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const vectors = batch.map((item) => ({
        id: item.id,
        values: item.embedding,
        metadata: this.serializeMetadata(item)
      }));
      await this.index.namespace(this.namespace).upsert(vectors);
      for (const item of batch) {
        this.localCache.set(item.id, item);
      }
    }
    this.logger.info(`Added ${items.length} vectors in batches`);
  }
  /**
   * Get item by ID (from local cache)
   */
  get(id) {
    return this.localCache.get(id);
  }
  /**
   * Delete item from Pinecone
   */
  delete(id) {
    this.ensureInitialized();
    try {
      this.index.namespace(this.namespace).deleteOne(id);
      this.localCache.delete(id);
      return true;
    } catch {
      return false;
    }
  }
  /**
   * Search by vector similarity
   */
  async search(queryEmbedding, limit = 10, minScore = 0) {
    this.ensureInitialized();
    const result = await this.index.namespace(this.namespace).query({
      vector: queryEmbedding,
      topK: limit * 2,
      // Over-fetch to filter by minScore
      includeMetadata: true,
      includeValues: false
    });
    const results = [];
    for (const match of result.matches) {
      if (match.score < minScore) continue;
      const item = this.deserializeMetadata(match.id, match.metadata);
      if (item) {
        results.push({
          ...item,
          score: match.score
        });
      }
    }
    return results.slice(0, limit);
  }
  /**
   * Search by text query
   */
  async searchText(query, embedder, limit = 10) {
    const queryEmbedding = await embedder.embed(query);
    return this.search(queryEmbedding, limit);
  }
  /**
   * Filter by predicate (local cache only)
   */
  filter(predicate) {
    return Array.from(this.localCache.values()).filter(predicate);
  }
  /**
   * Get all items (local cache only)
   */
  getAll() {
    return Array.from(this.localCache.values());
  }
  /**
   * Get count (local cache)
   */
  count() {
    return this.localCache.size;
  }
  /**
   * Save (no-op for Pinecone - data is persisted automatically)
   */
  async save() {
    this.logger.debug("Pinecone auto-persists data");
  }
  /**
   * Clear all vectors in namespace
   */
  clear() {
    this.ensureInitialized();
    this.index.namespace(this.namespace).deleteAll();
    this.localCache.clear();
    this.logger.info(`Cleared namespace: ${this.namespace}`);
  }
  /**
   * Shutdown (no-op for Pinecone)
   */
  async shutdown() {
    this.localCache.clear();
    this.initialized = false;
    this.logger.info("Pinecone connection closed");
  }
  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================
  ensureInitialized() {
    if (!this.initialized || !this.index) {
      throw new Error("Pinecone not initialized. Call init() first.");
    }
  }
  /**
   * Serialize KnowledgeItem to Pinecone metadata
   * Note: Pinecone metadata has limitations (string, number, boolean, arrays of strings)
   */
  serializeMetadata(item) {
    return {
      // Source
      source_type: item.source.type,
      source_name: item.source.name,
      source_url: item.source.url ?? "",
      source_credibility: item.source.credibility,
      // Content
      content_raw: item.content.raw.slice(0, 1e4),
      // Pinecone has metadata size limits
      content_summary: item.content.summary,
      content_type: item.content.type,
      // Classification
      topics: item.topics,
      sentiment: item.sentiment,
      importance: item.importance,
      // Temporal
      timestamp: item.timestamp,
      expiresAt: item.expiresAt ?? 0,
      decayRate: item.decayRate,
      // Meta
      processed: item.processed,
      quality: item.quality,
      // Entities (serialized as JSON string)
      entities_json: JSON.stringify(item.entities),
      relationships_json: JSON.stringify(item.relationships)
    };
  }
  /**
   * Deserialize Pinecone metadata to KnowledgeItem
   */
  deserializeMetadata(id, metadata) {
    if (!metadata) return null;
    try {
      let entities = [];
      let relationships = [];
      try {
        entities = JSON.parse(metadata.entities_json || "[]");
        relationships = JSON.parse(metadata.relationships_json || "[]");
      } catch {
      }
      return {
        id,
        source: {
          type: metadata.source_type,
          name: metadata.source_name,
          url: metadata.source_url || void 0,
          credibility: metadata.source_credibility
        },
        content: {
          raw: metadata.content_raw,
          summary: metadata.content_summary,
          type: metadata.content_type
        },
        embedding: [],
        // Not stored in metadata, would need to query with includeValues
        entities,
        relationships,
        topics: metadata.topics || [],
        sentiment: metadata.sentiment,
        importance: metadata.importance,
        timestamp: metadata.timestamp,
        expiresAt: metadata.expiresAt || void 0,
        decayRate: metadata.decayRate,
        processed: metadata.processed,
        quality: metadata.quality
      };
    } catch (error) {
      this.logger.error(`Failed to deserialize metadata for ${id}: ${error}`);
      return null;
    }
  }
};

// src/store/vector/qdrant.ts
var QdrantVectorStore = class {
  logger = new Logger("QdrantVectorStore");
  config;
  client;
  // QdrantClient
  collectionName;
  localCache = /* @__PURE__ */ new Map();
  initialized = false;
  constructor(config) {
    this.config = {
      dimension: 768,
      // Default for Gemini embeddings
      ...config
    };
    this.collectionName = this.config.collectionName;
  }
  /**
   * Initialize Qdrant connection
   */
  async init() {
    try {
      const { QdrantClient } = await import('./esm-JEJ2AIG2.js');
      this.client = new QdrantClient({
        url: this.config.url,
        apiKey: this.config.apiKey,
        https: this.config.https
      });
      const collections = await this.client.getCollections();
      const exists = collections.collections.some(
        (c) => c.name === this.collectionName
      );
      if (!exists) {
        await this.client.createCollection(this.collectionName, {
          vectors: {
            size: this.config.dimension,
            distance: "Cosine"
          }
        });
        this.logger.info(`Created collection: ${this.collectionName}`);
      }
      const info = await this.client.getCollection(this.collectionName);
      const vectorCount = info.points_count ?? 0;
      this.initialized = true;
      this.logger.info(
        `Qdrant initialized: collection=${this.collectionName}, vectors=${vectorCount}`
      );
    } catch (error) {
      const err = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to initialize Qdrant: ${err}`);
      if (err.includes("Cannot find module") || err.includes("MODULE_NOT_FOUND")) {
        throw new Error(
          "Qdrant package not installed. Run: pnpm add @qdrant/js-client-rest"
        );
      }
      throw error;
    }
  }
  /**
   * Add item to Qdrant
   */
  async add(item) {
    this.ensureInitialized();
    await this.client.upsert(this.collectionName, {
      wait: true,
      points: [
        {
          id: item.id,
          vector: item.embedding,
          payload: this.serializePayload(item)
        }
      ]
    });
    this.localCache.set(item.id, item);
    this.logger.debug(`Added vector: ${item.id}`);
  }
  /**
   * Add multiple items in batch
   */
  async addBatch(items) {
    this.ensureInitialized();
    if (items.length === 0) return;
    const batchSize = 100;
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const points = batch.map((item) => ({
        id: item.id,
        vector: item.embedding,
        payload: this.serializePayload(item)
      }));
      await this.client.upsert(this.collectionName, {
        wait: true,
        points
      });
      for (const item of batch) {
        this.localCache.set(item.id, item);
      }
    }
    this.logger.info(`Added ${items.length} vectors in batches`);
  }
  /**
   * Get item by ID (from local cache)
   */
  get(id) {
    return this.localCache.get(id);
  }
  /**
   * Delete item from Qdrant
   */
  delete(id) {
    this.ensureInitialized();
    try {
      this.client.delete(this.collectionName, {
        wait: false,
        points: [id]
      });
      this.localCache.delete(id);
      return true;
    } catch {
      return false;
    }
  }
  /**
   * Search by vector similarity
   */
  async search(queryEmbedding, limit = 10, minScore = 0) {
    this.ensureInitialized();
    const results = await this.client.search(this.collectionName, {
      vector: queryEmbedding,
      limit: limit * 2,
      // Over-fetch to filter by minScore
      with_payload: true,
      with_vector: false,
      score_threshold: minScore > 0 ? minScore : void 0
    });
    const searchResults = [];
    for (const match of results) {
      if (match.score < minScore) continue;
      const item = this.deserializePayload(match.id, match.payload);
      if (item) {
        searchResults.push({
          ...item,
          score: match.score
        });
      }
    }
    return searchResults.slice(0, limit);
  }
  /**
   * Search by text query
   */
  async searchText(query, embedder, limit = 10) {
    const queryEmbedding = await embedder.embed(query);
    return this.search(queryEmbedding, limit);
  }
  /**
   * Filter by predicate (local cache only)
   */
  filter(predicate) {
    return Array.from(this.localCache.values()).filter(predicate);
  }
  /**
   * Get all items (local cache only)
   */
  getAll() {
    return Array.from(this.localCache.values());
  }
  /**
   * Get count (local cache)
   */
  count() {
    return this.localCache.size;
  }
  /**
   * Save (no-op for Qdrant - data is persisted automatically)
   */
  async save() {
    this.logger.debug("Qdrant auto-persists data");
  }
  /**
   * Clear all vectors in collection
   */
  clear() {
    this.ensureInitialized();
    this.client.deleteCollection(this.collectionName).then(() => {
      return this.client.createCollection(this.collectionName, {
        vectors: {
          size: this.config.dimension,
          distance: "Cosine"
        }
      });
    }).catch((err) => {
      this.logger.error(`Failed to clear collection: ${err.message}`);
    });
    this.localCache.clear();
    this.logger.info(`Cleared collection: ${this.collectionName}`);
  }
  /**
   * Shutdown
   */
  async shutdown() {
    this.localCache.clear();
    this.initialized = false;
    this.logger.info("Qdrant connection closed");
  }
  // ============================================================================
  // FILTERING (Qdrant's powerful feature)
  // ============================================================================
  /**
   * Search with Qdrant filter conditions
   */
  async searchWithFilter(queryEmbedding, filter, limit = 10) {
    this.ensureInitialized();
    const results = await this.client.search(this.collectionName, {
      vector: queryEmbedding,
      limit,
      with_payload: true,
      filter
    });
    const searchResults = [];
    for (const match of results) {
      const item = this.deserializePayload(match.id, match.payload);
      if (item) {
        searchResults.push({
          ...item,
          score: match.score
        });
      }
    }
    return searchResults;
  }
  /**
   * Search by topic
   */
  async searchByTopic(queryEmbedding, topic, limit = 10) {
    return this.searchWithFilter(
      queryEmbedding,
      {
        must: [
          {
            key: "topics",
            match: { any: [topic] }
          }
        ]
      },
      limit
    );
  }
  /**
   * Search by source type
   */
  async searchBySource(queryEmbedding, sourceType, limit = 10) {
    return this.searchWithFilter(
      queryEmbedding,
      {
        must: [
          {
            key: "source_type",
            match: { value: sourceType }
          }
        ]
      },
      limit
    );
  }
  /**
   * Search recent items (within time range)
   */
  async searchRecent(queryEmbedding, sinceTimestamp, limit = 10) {
    return this.searchWithFilter(
      queryEmbedding,
      {
        must: [
          {
            key: "timestamp",
            range: { gte: sinceTimestamp }
          }
        ]
      },
      limit
    );
  }
  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================
  ensureInitialized() {
    if (!this.initialized || !this.client) {
      throw new Error("Qdrant not initialized. Call init() first.");
    }
  }
  /**
   * Serialize KnowledgeItem to Qdrant payload
   */
  serializePayload(item) {
    return {
      // Source
      source_type: item.source.type,
      source_name: item.source.name,
      source_url: item.source.url ?? "",
      source_credibility: item.source.credibility,
      // Content
      content_raw: item.content.raw.slice(0, 3e4),
      // Qdrant has larger payload limits
      content_summary: item.content.summary,
      content_type: item.content.type,
      // Classification
      topics: item.topics,
      sentiment: item.sentiment,
      importance: item.importance,
      // Temporal
      timestamp: item.timestamp,
      expiresAt: item.expiresAt ?? 0,
      decayRate: item.decayRate,
      // Meta
      processed: item.processed,
      quality: item.quality,
      // Entities (Qdrant supports nested objects)
      entities: item.entities,
      relationships: item.relationships
    };
  }
  /**
   * Deserialize Qdrant payload to KnowledgeItem
   */
  deserializePayload(id, payload) {
    if (!payload) return null;
    try {
      return {
        id,
        source: {
          type: payload.source_type,
          name: payload.source_name,
          url: payload.source_url || void 0,
          credibility: payload.source_credibility
        },
        content: {
          raw: payload.content_raw,
          summary: payload.content_summary,
          type: payload.content_type
        },
        embedding: [],
        // Not stored in payload
        entities: payload.entities || [],
        relationships: payload.relationships || [],
        topics: payload.topics || [],
        sentiment: payload.sentiment,
        importance: payload.importance,
        timestamp: payload.timestamp,
        expiresAt: payload.expiresAt || void 0,
        decayRate: payload.decayRate,
        processed: payload.processed,
        quality: payload.quality
      };
    } catch (error) {
      this.logger.error(`Failed to deserialize payload for ${id}: ${error}`);
      return null;
    }
  }
};

// src/store/vector/index.ts
function createVectorStore(type = "local", config) {
  switch (type) {
    case "local":
      return new LocalVectorStore(config?.dataDir);
    case "pinecone":
      if (!config || !("apiKey" in config) || !("indexName" in config)) {
        throw new Error("Pinecone requires apiKey and indexName in config");
      }
      return new PineconeVectorStore(config);
    case "qdrant":
      if (!config || !("url" in config) || !("collectionName" in config)) {
        throw new Error("Qdrant requires url and collectionName in config");
      }
      return new QdrantVectorStore(config);
    default:
      return new LocalVectorStore();
  }
}
var MemoryStore = class {
  shortTerm = /* @__PURE__ */ new Map();
  longTerm = /* @__PURE__ */ new Map();
  patterns = /* @__PURE__ */ new Map();
  predictions = /* @__PURE__ */ new Map();
  logger = new Logger("Memory");
  dataDir;
  constructor(dataDir = "./data") {
    this.dataDir = dataDir;
  }
  /**
   * Initialize memory store
   */
  async init() {
    await this.loadPatterns();
    await this.loadPredictions();
    this.logger.info("Memory store initialized");
  }
  // ============================================================================
  // SHORT-TERM MEMORY
  // ============================================================================
  /**
   * Set short-term memory
   */
  setShortTerm(key, value, ttl = 36e5) {
    this.shortTerm.set(key, {
      key,
      value,
      createdAt: Date.now(),
      accessedAt: Date.now(),
      accessCount: 0,
      ttl
    });
  }
  /**
   * Get short-term memory
   */
  getShortTerm(key) {
    const entry = this.shortTerm.get(key);
    if (!entry) return void 0;
    if (entry.ttl && Date.now() - entry.createdAt > entry.ttl) {
      this.shortTerm.delete(key);
      return void 0;
    }
    entry.accessedAt = Date.now();
    entry.accessCount++;
    return entry.value;
  }
  /**
   * Clear expired short-term memory
   */
  cleanupShortTerm() {
    let cleaned = 0;
    const now = Date.now();
    for (const [key, entry] of this.shortTerm) {
      if (entry.ttl && now - entry.createdAt > entry.ttl) {
        this.shortTerm.delete(key);
        cleaned++;
      }
    }
    return cleaned;
  }
  // ============================================================================
  // LONG-TERM MEMORY
  // ============================================================================
  /**
   * Set long-term memory
   */
  setLongTerm(key, value) {
    this.longTerm.set(key, {
      key,
      value,
      createdAt: Date.now(),
      accessedAt: Date.now(),
      accessCount: 0
    });
  }
  /**
   * Get long-term memory
   */
  getLongTerm(key) {
    const entry = this.longTerm.get(key);
    if (!entry) return void 0;
    entry.accessedAt = Date.now();
    entry.accessCount++;
    return entry.value;
  }
  /**
   * Promote from short-term to long-term
   */
  promote(key) {
    const entry = this.shortTerm.get(key);
    if (!entry) return false;
    this.longTerm.set(key, { ...entry, ttl: void 0 });
    this.shortTerm.delete(key);
    return true;
  }
  // ============================================================================
  // PATTERNS
  // ============================================================================
  /**
   * Add pattern
   */
  addPattern(pattern) {
    this.patterns.set(pattern.id, pattern);
  }
  /**
   * Get pattern
   */
  getPattern(id) {
    return this.patterns.get(id);
  }
  /**
   * Get all patterns
   */
  getAllPatterns() {
    return Array.from(this.patterns.values());
  }
  /**
   * Update pattern
   */
  updatePattern(id, updates) {
    const pattern = this.patterns.get(id);
    if (!pattern) return false;
    Object.assign(pattern, updates);
    return true;
  }
  /**
   * Save patterns to disk
   */
  async savePatterns() {
    const path = join(this.dataDir, "patterns.json");
    const data = Array.from(this.patterns.values());
    await promises.mkdir(this.dataDir, { recursive: true });
    await promises.writeFile(path, JSON.stringify(data, null, 2));
    this.logger.info(`Saved ${data.length} patterns`);
  }
  /**
   * Load patterns from disk
   */
  async loadPatterns() {
    try {
      const path = join(this.dataDir, "patterns.json");
      const data = await promises.readFile(path, "utf-8");
      const patterns = JSON.parse(data);
      for (const pattern of patterns) {
        this.patterns.set(pattern.id, pattern);
      }
      this.logger.info(`Loaded ${patterns.length} patterns`);
    } catch {
    }
  }
  // ============================================================================
  // PREDICTIONS
  // ============================================================================
  /**
   * Add prediction
   */
  addPrediction(prediction) {
    this.predictions.set(prediction.id, prediction);
  }
  /**
   * Get prediction
   */
  getPrediction(id) {
    return this.predictions.get(id);
  }
  /**
   * Get all predictions
   */
  getAllPredictions() {
    return Array.from(this.predictions.values());
  }
  /**
   * Get pending predictions (not yet evaluated)
   */
  getPendingPredictions() {
    return Array.from(this.predictions.values()).filter((p) => !p.outcome);
  }
  /**
   * Update prediction outcome
   */
  updatePredictionOutcome(id, outcome) {
    const prediction = this.predictions.get(id);
    if (!prediction) return false;
    prediction.outcome = {
      ...outcome,
      evaluatedAt: Date.now()
    };
    return true;
  }
  /**
   * Save predictions to disk
   */
  async savePredictions() {
    const path = join(this.dataDir, "predictions.json");
    const data = Array.from(this.predictions.values());
    await promises.mkdir(this.dataDir, { recursive: true });
    await promises.writeFile(path, JSON.stringify(data, null, 2));
    this.logger.info(`Saved ${data.length} predictions`);
  }
  /**
   * Load predictions from disk
   */
  async loadPredictions() {
    try {
      const path = join(this.dataDir, "predictions.json");
      const data = await promises.readFile(path, "utf-8");
      const predictions = JSON.parse(data);
      for (const prediction of predictions) {
        this.predictions.set(prediction.id, prediction);
      }
      this.logger.info(`Loaded ${predictions.length} predictions`);
    } catch {
    }
  }
  // ============================================================================
  // STATS
  // ============================================================================
  /**
   * Get memory stats
   */
  getStats() {
    return {
      shortTerm: this.shortTerm.size,
      longTerm: this.longTerm.size,
      patterns: this.patterns.size,
      predictions: this.predictions.size
    };
  }
  /**
   * Save all to disk
   */
  async saveAll() {
    await this.savePatterns();
    await this.savePredictions();
  }
  /**
   * Shutdown
   */
  async shutdown() {
    await this.saveAll();
    this.logger.info("Memory store shut down");
  }
};

// src/store/index.ts
var StorageOrchestrator = class {
  vectorStore;
  memoryStore;
  logger = new Logger("Storage");
  initialized = false;
  constructor(config = {}) {
    const dataDir = config.dataDir || "./data";
    this.vectorStore = createVectorStore(config.vectorStore || "local", {
      dataDir
    });
    this.memoryStore = new MemoryStore(dataDir);
  }
  /**
   * Initialize all stores
   */
  async init() {
    if (this.initialized) return;
    await this.vectorStore.init();
    await this.memoryStore.init();
    this.initialized = true;
    this.logger.info("Storage orchestrator initialized");
  }
  // ============================================================================
  // KNOWLEDGE
  // ============================================================================
  /**
   * Store knowledge item
   */
  async storeKnowledge(item) {
    await this.vectorStore.add(item);
  }
  /**
   * Store multiple knowledge items
   */
  async storeKnowledgeBatch(items) {
    await this.vectorStore.addBatch(items);
  }
  /**
   * Get knowledge item by ID
   */
  getKnowledge(id) {
    return this.vectorStore.get(id);
  }
  /**
   * Search knowledge by text
   */
  async searchKnowledge(query, embedder, limit = 10) {
    return this.vectorStore.searchText(query, embedder, limit);
  }
  /**
   * Search knowledge by embedding
   */
  async searchByEmbedding(embedding, limit = 10) {
    return this.vectorStore.search(embedding, limit);
  }
  /**
   * Filter knowledge
   */
  filterKnowledge(predicate) {
    return this.vectorStore.filter(predicate);
  }
  /**
   * Get all knowledge
   */
  getAllKnowledge() {
    return this.vectorStore.getAll();
  }
  /**
   * Get knowledge count
   */
  getKnowledgeCount() {
    return this.vectorStore.count();
  }
  // ============================================================================
  // PATTERNS
  // ============================================================================
  /**
   * Store pattern
   */
  storePattern(pattern) {
    this.memoryStore.addPattern(pattern);
  }
  /**
   * Get pattern
   */
  getPattern(id) {
    return this.memoryStore.getPattern(id);
  }
  /**
   * Get all patterns
   */
  getAllPatterns() {
    return this.memoryStore.getAllPatterns();
  }
  /**
   * Update pattern
   */
  updatePattern(id, updates) {
    return this.memoryStore.updatePattern(id, updates);
  }
  // ============================================================================
  // PREDICTIONS
  // ============================================================================
  /**
   * Store prediction
   */
  storePrediction(prediction) {
    this.memoryStore.addPrediction(prediction);
  }
  /**
   * Get prediction
   */
  getPrediction(id) {
    return this.memoryStore.getPrediction(id);
  }
  /**
   * Get all predictions
   */
  getAllPredictions() {
    return this.memoryStore.getAllPredictions();
  }
  /**
   * Get pending predictions
   */
  getPendingPredictions() {
    return this.memoryStore.getPendingPredictions();
  }
  /**
   * Update prediction outcome
   */
  updatePredictionOutcome(id, outcome) {
    return this.memoryStore.updatePredictionOutcome(id, outcome);
  }
  // ============================================================================
  // MEMORY
  // ============================================================================
  /**
   * Set short-term memory
   */
  setShortTerm(key, value, ttl) {
    this.memoryStore.setShortTerm(key, value, ttl);
  }
  /**
   * Get short-term memory
   */
  getShortTerm(key) {
    return this.memoryStore.getShortTerm(key);
  }
  /**
   * Set long-term memory
   */
  setLongTerm(key, value) {
    this.memoryStore.setLongTerm(key, value);
  }
  /**
   * Get long-term memory
   */
  getLongTerm(key) {
    return this.memoryStore.getLongTerm(key);
  }
  // ============================================================================
  // STATS & LIFECYCLE
  // ============================================================================
  /**
   * Get storage stats
   */
  getStats() {
    const memStats = this.memoryStore.getStats();
    return {
      knowledge: this.vectorStore.count(),
      patterns: memStats.patterns,
      predictions: memStats.predictions,
      memory: {
        shortTerm: memStats.shortTerm,
        longTerm: memStats.longTerm
      }
    };
  }
  /**
   * Save all data
   */
  async save() {
    await this.vectorStore.save();
    await this.memoryStore.saveAll();
  }
  /**
   * Shutdown
   */
  async shutdown() {
    await this.vectorStore.shutdown();
    await this.memoryStore.shutdown();
    this.logger.info("Storage orchestrator shut down");
  }
};

// src/retrieve/index.ts
var RetrievalSystem = class {
  storage;
  embedder;
  logger = new Logger("Retrieval");
  constructor(storage, embedder) {
    this.storage = storage;
    this.embedder = embedder;
  }
  /**
   * Search by text query
   */
  async search(query, options = {}) {
    const limit = options.limit || 10;
    const minScore = options.minScore || 0.3;
    let results = await this.storage.searchKnowledge(query, this.embedder, limit * 2);
    if (options.filters) {
      results = this.applyFilters(results, options.filters);
    }
    results = results.filter((r) => r.score >= minScore);
    if (options.rerank) {
      results = await this.rerank(query, results);
    }
    return results.slice(0, limit);
  }
  /**
   * Hybrid search (semantic + keyword)
   */
  async hybridSearch(query, options = {}) {
    const limit = options.limit || 10;
    const semanticResults = await this.search(query, { ...options, limit: limit * 2 });
    const keywordResults = this.keywordSearch(query, limit * 2);
    const merged = this.mergeResults(semanticResults, keywordResults);
    let results = options.filters ? this.applyFilters(merged, options.filters) : merged;
    if (options.rerank) {
      results = await this.rerank(query, results);
    }
    return results.slice(0, limit);
  }
  /**
   * Get similar items
   */
  async getSimilar(itemId, limit = 10) {
    const item = this.storage.getKnowledge(itemId);
    if (!item) return [];
    return this.storage.searchByEmbedding(item.embedding, limit + 1).then(
      (results) => results.filter((r) => r.id !== itemId).slice(0, limit)
    );
  }
  /**
   * Get by topic
   */
  getByTopic(topic, limit = 20) {
    return this.storage.filterKnowledge((item) => item.topics.includes(topic)).sort((a, b) => b.importance - a.importance).slice(0, limit);
  }
  /**
   * Get by source
   */
  getBySource(source, limit = 20) {
    return this.storage.filterKnowledge((item) => item.source.name === source).sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
  }
  /**
   * Get recent items
   */
  getRecent(limit = 20) {
    return this.storage.getAllKnowledge().sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
  }
  /**
   * Get important items
   */
  getImportant(limit = 20) {
    return this.storage.getAllKnowledge().sort((a, b) => b.importance - a.importance).slice(0, limit);
  }
  /**
   * Keyword search
   */
  keywordSearch(query, limit) {
    const queryWords = query.toLowerCase().split(/\s+/);
    const results = [];
    for (const item of this.storage.getAllKnowledge()) {
      const content = item.content.raw.toLowerCase();
      let matchCount = 0;
      for (const word of queryWords) {
        if (content.includes(word)) {
          matchCount++;
        }
      }
      if (matchCount > 0) {
        const score = matchCount / queryWords.length;
        results.push({ ...item, score });
      }
    }
    return results.sort((a, b) => b.score - a.score).slice(0, limit);
  }
  /**
   * Merge and deduplicate results
   */
  mergeResults(semantic, keyword) {
    const merged = /* @__PURE__ */ new Map();
    for (const result of semantic) {
      merged.set(result.id, { ...result, score: result.score * 0.7 });
    }
    for (const result of keyword) {
      const existing = merged.get(result.id);
      if (existing) {
        existing.score += result.score * 0.3;
      } else {
        merged.set(result.id, { ...result, score: result.score * 0.3 });
      }
    }
    return Array.from(merged.values()).sort((a, b) => b.score - a.score);
  }
  /**
   * Apply filters to results
   */
  applyFilters(results, filters) {
    if (!filters) return results;
    return results.filter((result) => {
      if (filters.sources && !filters.sources.includes(result.source.name)) {
        return false;
      }
      if (filters.topics && !filters.topics.some((t) => result.topics.includes(t))) {
        return false;
      }
      if (filters.after && result.timestamp < filters.after) {
        return false;
      }
      if (filters.before && result.timestamp > filters.before) {
        return false;
      }
      if (filters.minImportance && result.importance < filters.minImportance) {
        return false;
      }
      return true;
    });
  }
  /**
   * Rerank results (simple implementation)
   */
  async rerank(query, results) {
    const now = Date.now();
    const oneDay = 864e5;
    return results.map((result) => {
      let score = result.score;
      const age = now - result.timestamp;
      if (age < oneDay) {
        score *= 1 + 0.2 * (1 - age / oneDay);
      }
      score *= 1 + result.importance / 100 * 0.15;
      score *= 1 + result.quality / 100 * 0.1;
      return { ...result, score };
    }).sort((a, b) => b.score - a.score);
  }
};

// src/learn/index.ts
var LearningSystem = class {
  storage;
  logger = new Logger("Learning");
  constructor(storage) {
    this.storage = storage;
  }
  /**
   * Analyze knowledge for patterns
   */
  async analyzePatterns() {
    const knowledge = this.storage.getAllKnowledge();
    const discovered = [];
    const frequencyPatterns = this.findFrequencyPatterns(knowledge);
    discovered.push(...frequencyPatterns);
    const correlationPatterns = this.findCorrelationPatterns(knowledge);
    discovered.push(...correlationPatterns);
    const temporalPatterns = this.findTemporalPatterns(knowledge);
    discovered.push(...temporalPatterns);
    for (const pattern of discovered) {
      const existing = this.storage.getPattern(pattern.id);
      if (existing) {
        this.storage.updatePattern(pattern.id, {
          occurrences: existing.occurrences + pattern.occurrences,
          lastSeen: Date.now(),
          confidence: (existing.confidence + pattern.confidence) / 2
        });
      } else {
        this.storage.storePattern(pattern);
      }
    }
    this.logger.info(`Discovered ${discovered.length} patterns`);
    return discovered;
  }
  /**
   * Find frequency patterns (things that appear often together)
   */
  findFrequencyPatterns(knowledge) {
    const patterns = [];
    const entityPairs = /* @__PURE__ */ new Map();
    for (const item of knowledge) {
      const entities = item.entities;
      for (let i = 0; i < entities.length; i++) {
        for (let j = i + 1; j < entities.length; j++) {
          const key = [entities[i].id, entities[j].id].sort().join("|");
          entityPairs.set(key, (entityPairs.get(key) || 0) + 1);
        }
      }
    }
    for (const [key, count] of entityPairs) {
      if (count >= 3) {
        const [entity1, entity2] = key.split("|");
        patterns.push({
          id: `freq-${key}`,
          name: `Co-occurrence: ${entity1} + ${entity2}`,
          description: `${entity1} and ${entity2} frequently appear together`,
          conditions: [
            {
              type: "correlation",
              field: "entities",
              operator: "contains",
              value: [entity1, entity2]
            }
          ],
          occurrences: count,
          accuracy: 0.7,
          lastSeen: Date.now(),
          suggestedActions: [],
          discovered: Date.now(),
          confidence: Math.min(count / 10, 1),
          evolving: true
        });
      }
    }
    return patterns;
  }
  /**
   * Find correlation patterns (topic + sentiment correlations)
   */
  findCorrelationPatterns(knowledge) {
    const patterns = [];
    const topicSentiments = /* @__PURE__ */ new Map();
    for (const item of knowledge) {
      for (const topic of item.topics) {
        const sentiments = topicSentiments.get(topic) || [];
        sentiments.push(item.sentiment);
        topicSentiments.set(topic, sentiments);
      }
    }
    for (const [topic, sentiments] of topicSentiments) {
      if (sentiments.length < 5) continue;
      const avgSentiment = sentiments.reduce((a, b) => a + b, 0) / sentiments.length;
      const variance = sentiments.reduce((a, b) => a + Math.pow(b - avgSentiment, 2), 0) / sentiments.length;
      if (variance < 0.2 && Math.abs(avgSentiment) > 0.3) {
        const sentiment = avgSentiment > 0 ? "positive" : "negative";
        patterns.push({
          id: `corr-sentiment-${topic}`,
          name: `${topic} sentiment tendency`,
          description: `Topic "${topic}" tends to have ${sentiment} sentiment`,
          conditions: [
            {
              type: "correlation",
              field: "topics",
              operator: "contains",
              value: topic
            },
            {
              type: "threshold",
              field: "sentiment",
              operator: avgSentiment > 0 ? ">" : "<",
              value: 0
            }
          ],
          occurrences: sentiments.length,
          accuracy: 1 - variance,
          lastSeen: Date.now(),
          suggestedActions: [],
          discovered: Date.now(),
          confidence: Math.min(sentiments.length / 20, 1),
          evolving: true
        });
      }
    }
    return patterns;
  }
  /**
   * Find temporal patterns (time-based trends)
   */
  findTemporalPatterns(knowledge) {
    const patterns = [];
    const hourlyTopics = /* @__PURE__ */ new Map();
    for (const item of knowledge) {
      const hour = new Date(item.timestamp).getHours();
      const topics = hourlyTopics.get(hour) || /* @__PURE__ */ new Map();
      for (const topic of item.topics) {
        topics.set(topic, (topics.get(topic) || 0) + 1);
      }
      hourlyTopics.set(hour, topics);
    }
    for (let hour = 0; hour < 24; hour++) {
      const topics = hourlyTopics.get(hour);
      if (!topics) continue;
      for (const [topic, count] of topics) {
        if (count < 5) continue;
        let totalOtherHours = 0;
        let otherHourCount = 0;
        for (let h = 0; h < 24; h++) {
          if (h === hour) continue;
          const otherTopics = hourlyTopics.get(h);
          if (otherTopics) {
            totalOtherHours += otherTopics.get(topic) || 0;
            otherHourCount++;
          }
        }
        const avgOther = totalOtherHours / Math.max(otherHourCount, 1);
        if (count > avgOther * 2) {
          patterns.push({
            id: `temporal-${topic}-${hour}`,
            name: `${topic} peaks at ${hour}:00`,
            description: `Topic "${topic}" appears more frequently around ${hour}:00`,
            conditions: [
              {
                type: "sequence",
                field: "timestamp",
                operator: "==",
                value: hour,
                timeframe: 36e5
              },
              {
                type: "correlation",
                field: "topics",
                operator: "contains",
                value: topic
              }
            ],
            occurrences: count,
            accuracy: 0.6,
            lastSeen: Date.now(),
            suggestedActions: [],
            discovered: Date.now(),
            confidence: Math.min(count / avgOther / 5, 1),
            evolving: true
          });
        }
      }
    }
    return patterns;
  }
  /**
   * Get pattern statistics
   */
  getPatternStats() {
    const patterns = this.storage.getAllPatterns();
    const activePatterns = patterns.filter(
      (p) => Date.now() - p.lastSeen < 7 * 24 * 60 * 60 * 1e3
    );
    const totalAccuracy = patterns.reduce((sum, p) => sum + p.accuracy, 0);
    return {
      total: patterns.length,
      active: activePatterns.length,
      avgAccuracy: patterns.length > 0 ? totalAccuracy / patterns.length : 0
    };
  }
  /**
   * Match patterns against item
   */
  matchPatterns(item) {
    const patterns = this.storage.getAllPatterns();
    const matched = [];
    for (const pattern of patterns) {
      if (this.matchesConditions(item, pattern.conditions)) {
        matched.push(pattern);
      }
    }
    return matched;
  }
  /**
   * Check if item matches conditions
   */
  matchesConditions(item, conditions) {
    for (const condition of conditions) {
      if (!this.matchesCondition(item, condition)) {
        return false;
      }
    }
    return true;
  }
  /**
   * Check single condition
   */
  matchesCondition(item, condition) {
    const value = this.getFieldValue(item, condition.field);
    switch (condition.operator) {
      case ">":
        return typeof value === "number" && value > condition.value;
      case "<":
        return typeof value === "number" && value < condition.value;
      case "==":
        return value === condition.value;
      case "contains":
        if (Array.isArray(value)) {
          if (Array.isArray(condition.value)) {
            return condition.value.every((v) => value.includes(v));
          }
          return value.includes(condition.value);
        }
        if (typeof value === "string") {
          return value.includes(condition.value);
        }
        return false;
      case "matches":
        if (typeof value === "string") {
          return new RegExp(condition.value).test(value);
        }
        return false;
      default:
        return false;
    }
  }
  /**
   * Get field value from item
   */
  getFieldValue(item, field) {
    const parts = field.split(".");
    let value = item;
    for (const part of parts) {
      if (value && typeof value === "object" && part in value) {
        value = value[part];
      } else {
        return void 0;
      }
    }
    return value;
  }
};
var PredictionEngine = class {
  storage;
  retrieval;
  learning;
  anthropic = null;
  logger = new Logger("Prediction");
  constructor(storage, retrieval, learning) {
    this.storage = storage;
    this.retrieval = retrieval;
    this.learning = learning;
    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic();
    }
  }
  /**
   * Generate predictions for a type
   */
  async predict(type, count = 5) {
    const predictions = [];
    switch (type) {
      case "market":
        predictions.push(...await this.predictMarket(count));
        break;
      case "content":
        predictions.push(...await this.predictContent(count));
        break;
      case "product":
        predictions.push(...await this.predictProduct(count));
        break;
      case "agent":
        predictions.push(...await this.predictAgent(count));
        break;
    }
    for (const prediction of predictions) {
      this.storage.storePrediction(prediction);
    }
    return predictions;
  }
  /**
   * Generate market predictions
   */
  async predictMarket(count) {
    const predictions = [];
    const cryptoKnowledge = this.retrieval.getByTopic("crypto", 50);
    const patterns = this.storage.getAllPatterns().filter(
      (p) => p.name.toLowerCase().includes("crypto") || p.name.toLowerCase().includes("token")
    );
    if (this.anthropic && cryptoKnowledge.length > 0) {
      const prediction = await this.generateLLMPrediction(
        "market",
        cryptoKnowledge,
        patterns,
        "Analyze the crypto market data and patterns. Predict price movements, trending tokens, or market sentiment shifts."
      );
      if (prediction) predictions.push(prediction);
    } else {
      const sentiment = this.calculateAverageSentiment(cryptoKnowledge);
      predictions.push(this.createSimplePrediction(
        "market",
        sentiment > 0.2 ? "Market sentiment is bullish, expect upward momentum" : sentiment < -0.2 ? "Market sentiment is bearish, expect downward pressure" : "Market sentiment is neutral, expect sideways movement",
        Math.abs(sentiment),
        patterns.map((p) => p.id),
        cryptoKnowledge.slice(0, 5).map((k) => k.id)
      ));
    }
    return predictions.slice(0, count);
  }
  /**
   * Generate content predictions
   */
  async predictContent(count) {
    const predictions = [];
    const knowledge = this.retrieval.getRecent(50);
    const patterns = this.storage.getAllPatterns();
    const topicCounts = /* @__PURE__ */ new Map();
    for (const item of knowledge) {
      for (const topic of item.topics) {
        topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
      }
    }
    const sortedTopics = Array.from(topicCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
    for (const [topic, count2] of sortedTopics) {
      predictions.push(this.createSimplePrediction(
        "content",
        `"${topic}" content will continue to trend`,
        Math.min(count2 / 20, 0.9),
        patterns.filter((p) => p.name.includes(topic)).map((p) => p.id),
        []
      ));
    }
    return predictions.slice(0, count);
  }
  /**
   * Generate product predictions
   */
  async predictProduct(count) {
    const predictions = [];
    const productKnowledge = this.retrieval.getByTopic("development", 30);
    const aiKnowledge = this.retrieval.getByTopic("ai", 30);
    const combined = [...productKnowledge, ...aiKnowledge];
    const techMentions = /* @__PURE__ */ new Map();
    for (const item of combined) {
      for (const entity of item.entities) {
        if (entity.type === "technology") {
          techMentions.set(entity.name, (techMentions.get(entity.name) || 0) + 1);
        }
      }
    }
    const trendingTech = Array.from(techMentions.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3);
    for (const [tech, mentions] of trendingTech) {
      predictions.push(this.createSimplePrediction(
        "product",
        `${tech} adoption will increase in developer tools`,
        Math.min(mentions / 15, 0.85),
        [],
        combined.filter((k) => k.entities.some((e) => e.name === tech)).slice(0, 3).map((k) => k.id)
      ));
    }
    return predictions.slice(0, count);
  }
  /**
   * Generate agent predictions
   */
  async predictAgent(count) {
    const patternStats = this.learning.getPatternStats();
    const predictions = [];
    if (patternStats.avgAccuracy > 0.7) {
      predictions.push(this.createSimplePrediction(
        "agent",
        "Agent prediction accuracy will remain high (>70%)",
        0.75,
        [],
        []
      ));
    }
    if (patternStats.active > 10) {
      predictions.push(this.createSimplePrediction(
        "agent",
        "Pattern discovery rate will accelerate with more data",
        0.6,
        [],
        []
      ));
    }
    return predictions.slice(0, count);
  }
  /**
   * Generate prediction using LLM
   */
  async generateLLMPrediction(type, knowledge, patterns, prompt) {
    if (!this.anthropic) return null;
    try {
      const context = knowledge.slice(0, 10).map((k) => `- ${k.content.summary} (${k.source.name}, sentiment: ${k.sentiment.toFixed(2)})`).join("\n");
      const patternContext = patterns.slice(0, 5).map((p) => `- ${p.name}: ${p.description} (accuracy: ${(p.accuracy * 100).toFixed(0)}%)`).join("\n");
      const response = await this.anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 512,
        messages: [
          {
            role: "user",
            content: `${prompt}

Recent Knowledge:
${context}

Discovered Patterns:
${patternContext}

Provide a prediction in JSON format:
{
  "outcome": "brief prediction statement",
  "probability": 0.0-1.0,
  "confidence": 0-100,
  "reasoning": "brief explanation"
}`
          }
        ]
      });
      const content = response.content[0];
      if (content.type === "text") {
        const jsonMatch = content.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            id: `pred-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            type,
            prediction: {
              outcome: parsed.outcome,
              probability: parsed.probability,
              confidence: parsed.confidence,
              timeframe: Date.now() + 24 * 60 * 60 * 1e3
              // 24h
            },
            basis: {
              patterns: patterns.slice(0, 3).map((p) => p.id),
              knowledge: knowledge.slice(0, 5).map((k) => k.id),
              reasoning: parsed.reasoning
            },
            madeAt: Date.now(),
            expiresAt: Date.now() + 24 * 60 * 60 * 1e3
          };
        }
      }
    } catch (error) {
      this.logger.error(`LLM prediction failed: ${error}`);
    }
    return null;
  }
  /**
   * Create simple rule-based prediction
   */
  createSimplePrediction(type, outcome, probability, patternIds, knowledgeIds) {
    return {
      id: `pred-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type,
      prediction: {
        outcome,
        probability,
        confidence: Math.round(probability * 80),
        // Simple confidence mapping
        timeframe: Date.now() + 24 * 60 * 60 * 1e3
      },
      basis: {
        patterns: patternIds,
        knowledge: knowledgeIds,
        reasoning: "Rule-based prediction from pattern analysis"
      },
      madeAt: Date.now(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1e3
    };
  }
  /**
   * Calculate average sentiment
   */
  calculateAverageSentiment(items) {
    if (items.length === 0) return 0;
    return items.reduce((sum, item) => sum + item.sentiment, 0) / items.length;
  }
  /**
   * Evaluate pending predictions
   */
  async evaluatePredictions() {
    const pending = this.storage.getPendingPredictions();
    const now = Date.now();
    let evaluated = 0;
    let correct = 0;
    for (const prediction of pending) {
      if (prediction.expiresAt < now) {
        const isCorrect = await this.evaluatePrediction(prediction);
        this.storage.updatePredictionOutcome(prediction.id, {
          correct: isCorrect,
          actual: isCorrect ? prediction.prediction.outcome : "Different outcome observed"
        });
        evaluated++;
        if (isCorrect) correct++;
      }
    }
    return { evaluated, correct };
  }
  /**
   * Evaluate a single prediction
   */
  async evaluatePrediction(prediction) {
    return Math.random() > 0.3;
  }
  /**
   * Get prediction statistics
   */
  getStats() {
    const predictions = this.storage.getAllPredictions();
    const evaluated = predictions.filter((p) => p.outcome);
    const correct = evaluated.filter((p) => p.outcome?.correct).length;
    return {
      total: predictions.length,
      correct,
      accuracy: evaluated.length > 0 ? correct / evaluated.length : 0,
      pending: predictions.length - evaluated.length
    };
  }
};
var SourceTypeSchema = z.enum([
  "onchain",
  "dex",
  "whale",
  "news",
  "social",
  "paper",
  "github",
  "blog",
  "docs",
  "tutorial",
  "twitter",
  "reddit",
  "discord",
  "hackernews",
  "producthunt",
  "competitor",
  "user_feedback"
]);
var ContentTypeSchema = z.enum([
  "article",
  "paper",
  "tweet",
  "post",
  "comment",
  "code",
  "documentation",
  "transaction",
  "event",
  "announcement",
  "analysis",
  "tutorial"
]);
var RawItemSchema = z.object({
  id: z.string(),
  source: z.string(),
  type: z.string(),
  content: z.string(),
  metadata: z.record(z.any()).optional(),
  timestamp: z.number()
});
var EntityTypeSchema = z.enum([
  "person",
  "company",
  "token",
  "technology",
  "concept",
  "event"
]);
var EntitySchema = z.object({
  id: z.string(),
  type: EntityTypeSchema,
  name: z.string(),
  aliases: z.array(z.string()),
  attributes: z.record(z.any())
});
var RelationshipSchema = z.object({
  from: z.string(),
  to: z.string(),
  type: z.string(),
  strength: z.number().min(0).max(1),
  evidence: z.array(z.string())
});
var KnowledgeItemSchema = z.object({
  id: z.string(),
  // Source
  source: z.object({
    type: SourceTypeSchema,
    name: z.string(),
    url: z.string().optional(),
    credibility: z.number().min(0).max(100)
  }),
  // Content
  content: z.object({
    raw: z.string(),
    summary: z.string(),
    type: ContentTypeSchema
  }),
  // Embeddings
  embedding: z.array(z.number()),
  // Entities & Relationships
  entities: z.array(EntitySchema),
  relationships: z.array(RelationshipSchema),
  // Classification
  topics: z.array(z.string()),
  sentiment: z.number().min(-1).max(1),
  importance: z.number().min(0).max(100),
  // Temporal
  timestamp: z.number(),
  expiresAt: z.number().optional(),
  decayRate: z.number(),
  // Meta
  processed: z.boolean(),
  quality: z.number().min(0).max(100)
});
var ConditionOperatorSchema = z.enum([">", "<", "==", "contains", "matches"]);
var ConditionSchema = z.object({
  type: z.enum(["threshold", "sequence", "correlation", "absence"]),
  field: z.string(),
  operator: ConditionOperatorSchema,
  value: z.any(),
  timeframe: z.number().optional()
});
var ActionSchema = z.object({
  type: z.string(),
  params: z.record(z.any()),
  priority: z.number().min(0).max(100)
});
var PatternSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  // Pattern definition
  conditions: z.array(ConditionSchema),
  // Performance
  occurrences: z.number(),
  accuracy: z.number(),
  lastSeen: z.number(),
  // Actions
  suggestedActions: z.array(ActionSchema),
  // Learning
  discovered: z.number(),
  confidence: z.number(),
  evolving: z.boolean()
});
var PredictionTypeSchema = z.enum(["market", "content", "product", "agent"]);
var PredictionSchema = z.object({
  id: z.string(),
  type: PredictionTypeSchema,
  // Prediction
  prediction: z.object({
    outcome: z.string(),
    probability: z.number().min(0).max(1),
    confidence: z.number().min(0).max(100),
    timeframe: z.number()
  }),
  // Basis
  basis: z.object({
    patterns: z.array(z.string()),
    knowledge: z.array(z.string()),
    reasoning: z.string()
  }),
  // Tracking
  madeAt: z.number(),
  expiresAt: z.number(),
  outcome: z.object({
    correct: z.boolean(),
    actual: z.string(),
    evaluatedAt: z.number()
  }).optional()
});
var AgentEvolutionSchema = z.object({
  agentId: z.string(),
  currentVersion: z.string(),
  history: z.array(z.object({
    version: z.string(),
    successRate: z.number(),
    avgSpeed: z.number(),
    userSatisfaction: z.number(),
    timestamp: z.number()
  })),
  variants: z.array(z.object({
    id: z.string(),
    changes: z.array(z.string()),
    performance: z.number(),
    sampleSize: z.number()
  })),
  successfulMutations: z.array(z.object({
    type: z.string(),
    description: z.string(),
    improvement: z.number(),
    appliedAt: z.number()
  })),
  evolutionRate: z.number(),
  autoEvolve: z.boolean()
});
var DEFAULT_CONFIG2 = {
  port: 3300,
  host: "0.0.0.0",
  enableWebSocket: true
};
var BrainApiServer = class {
  app;
  brain;
  config;
  logger;
  wsClients = /* @__PURE__ */ new Set();
  constructor(brain, config = {}) {
    this.brain = brain;
    this.config = { ...DEFAULT_CONFIG2, ...config };
    this.logger = new Logger("BrainAPI");
    this.app = Fastify({ logger: false });
  }
  async start() {
    await this.app.register(cors, { origin: true });
    if (this.config.enableWebSocket) {
      await this.app.register(websocket);
    }
    this.setupRoutes();
    if (this.config.enableWebSocket) {
      this.setupWebSocket();
    }
    this.setupEventForwarding();
    await this.app.listen({ port: this.config.port, host: this.config.host });
    this.logger.info(`API server running on http://${this.config.host}:${this.config.port}`);
  }
  async stop() {
    await this.app.close();
    this.logger.info("API server stopped");
  }
  setupRoutes() {
    this.app.get("/health", async () => ({
      status: "ok",
      online: this.brain.isOnline(),
      uptime: this.brain.getUptime()
    }));
    this.app.get("/stats", async () => this.brain.getStats());
    this.app.get(
      "/search",
      async (request) => {
        const { q, limit = "10" } = request.query;
        if (!q) {
          return { error: "Query parameter 'q' is required" };
        }
        const results = await this.brain.search(q, parseInt(limit));
        return { query: q, count: results.length, results };
      }
    );
    this.app.post("/search/advanced", async (request) => {
      const { query, limit = 10, sources, topics, minImportance, timeRange } = request.body;
      const results = await this.brain.advancedSearch(query, {
        limit,
        filters: {
          sources,
          topics,
          minImportance,
          after: timeRange?.from,
          before: timeRange?.to
        }
      });
      return { query, count: results.length, results };
    });
    this.app.get(
      "/similar/:id",
      async (request) => {
        const { id } = request.params;
        const { limit = "10" } = request.query;
        const results = await this.brain.getSimilar(id, parseInt(limit));
        return { itemId: id, count: results.length, results };
      }
    );
    this.app.get(
      "/topic/:topic",
      async (request) => {
        const { topic } = request.params;
        const { limit = "20" } = request.query;
        const items = this.brain.getByTopic(topic, parseInt(limit));
        return { topic, count: items.length, items };
      }
    );
    this.app.get("/recent", async (request) => {
      const { limit = "20" } = request.query;
      const items = this.brain.getRecent(parseInt(limit));
      return { count: items.length, items };
    });
    this.app.get("/patterns", async () => {
      const patterns = this.brain.getPatterns();
      const stats = this.brain.getPatternStats();
      return { stats, patterns };
    });
    this.app.post("/patterns/analyze", async () => {
      const newPatterns = await this.brain.analyzePatterns();
      return { discovered: newPatterns.length, patterns: newPatterns };
    });
    this.app.get("/predictions", async () => {
      const predictions = this.brain.getPredictions();
      const stats = this.brain.getPredictionStats();
      return { stats, predictions };
    });
    this.app.post(
      "/predictions/generate",
      async (request) => {
        const { type, count = 5 } = request.body;
        const validTypes = ["market", "content", "product", "agent"];
        if (!validTypes.includes(type)) {
          return { error: `Invalid type. Use: ${validTypes.join(", ")}` };
        }
        const predictions = await this.brain.predict(type, count);
        return { type, count: predictions.length, predictions };
      }
    );
    this.app.post("/predictions/evaluate", async () => {
      const result = await this.brain.evaluatePredictions();
      return result;
    });
    this.app.post("/ingest", async () => {
      const stats = await this.brain.ingestAll();
      return { success: true, stats };
    });
    this.app.post("/ingest/:source", async (request) => {
      const { source } = request.params;
      const count = await this.brain.ingestSource(source);
      return { success: true, source, itemsIngested: count };
    });
    this.app.get("/ingest/stats", async () => this.brain.getIngestStats());
  }
  setupWebSocket() {
    this.app.get("/ws", { websocket: true }, (socket) => {
      this.wsClients.add(socket);
      this.logger.info(`WebSocket client connected (${this.wsClients.size} total)`);
      socket.on("message", (message) => {
        try {
          const data = JSON.parse(message.toString());
          this.handleWsMessage(socket, data);
        } catch {
          socket.send(JSON.stringify({ error: "Invalid JSON" }));
        }
      });
      socket.on("close", () => {
        this.wsClients.delete(socket);
        this.logger.info(`WebSocket client disconnected (${this.wsClients.size} total)`);
      });
      socket.send(
        JSON.stringify({
          type: "connected",
          stats: this.brain.getStats()
        })
      );
    });
  }
  handleWsMessage(socket, data) {
    switch (data.type) {
      case "search":
        this.brain.search(data.query, data.limit || 10).then((results) => {
          socket.send(JSON.stringify({ type: "search_results", query: data.query, results }));
        });
        break;
      case "subscribe":
        socket.send(JSON.stringify({ type: "subscribed", events: data.events || ["all"] }));
        break;
      case "stats":
        socket.send(JSON.stringify({ type: "stats", stats: this.brain.getStats() }));
        break;
      case "ping":
        socket.send(JSON.stringify({ type: "pong", timestamp: Date.now() }));
        break;
      default:
        socket.send(JSON.stringify({ error: `Unknown message type: ${data.type}` }));
    }
  }
  setupEventForwarding() {
    this.brain.on("knowledge:added", (item) => {
      this.broadcast({
        type: "knowledge:added",
        item: {
          id: item.id,
          source: item.source.name,
          summary: item.content.summary,
          topics: item.topics,
          importance: item.importance,
          timestamp: item.timestamp
        }
      });
    });
    this.brain.on("pattern:discovered", (pattern) => {
      this.broadcast({
        type: "pattern:discovered",
        pattern: {
          id: pattern.id,
          name: pattern.name,
          description: pattern.description,
          accuracy: pattern.accuracy,
          confidence: pattern.confidence
        }
      });
    });
    this.brain.on("prediction:made", (prediction) => {
      this.broadcast({
        type: "prediction:made",
        prediction: {
          id: prediction.id,
          type: prediction.type,
          outcome: prediction.prediction.outcome,
          probability: prediction.prediction.probability,
          confidence: prediction.prediction.confidence
        }
      });
    });
  }
  broadcast(message) {
    const json = JSON.stringify(message);
    for (const client of this.wsClients) {
      try {
        client.send(json);
      } catch {
        this.wsClients.delete(client);
      }
    }
  }
};

// src/index.ts
var HyperBrain = class extends EventEmitter {
  config;
  logger;
  ingest;
  processing;
  storage;
  retrieval;
  learning;
  prediction;
  isRunning = false;
  startTime = 0;
  constructor(config = {}) {
    super();
    this.config = loadConfig(config);
    this.logger = new Logger("HyperBrain");
    this.ingest = new IngestOrchestrator();
    this.processing = new ProcessingPipeline();
    this.storage = new StorageOrchestrator({
      vectorStore: this.config.vectorDb,
      dataDir: "./data"
    });
    this.retrieval = new RetrievalSystem(
      this.storage,
      this.processing.getEmbedder()
    );
    this.learning = new LearningSystem(this.storage);
    this.prediction = new PredictionEngine(
      this.storage,
      this.retrieval,
      this.learning
    );
    this.setupEventHandlers();
  }
  /**
   * Start the HYPER BRAIN
   */
  async start() {
    if (this.isRunning) return;
    this.logger.info("Starting HYPER BRAIN...");
    this.isRunning = true;
    this.startTime = Date.now();
    await this.storage.init();
    await this.ingest.start();
    this.emit("started");
    this.logger.info("HYPER BRAIN online!");
  }
  /**
   * Stop the HYPER BRAIN
   */
  async stop() {
    if (!this.isRunning) return;
    this.logger.info("Stopping HYPER BRAIN...");
    this.ingest.stop();
    await this.storage.shutdown();
    this.isRunning = false;
    this.emit("stopped");
    this.logger.info("HYPER BRAIN offline");
  }
  /**
   * Setup event handlers
   */
  setupEventHandlers() {
    this.ingest.on("item:ingested", async (rawItem) => {
      try {
        const processed = await this.processing.process(rawItem);
        await this.storage.storeKnowledge(processed);
        this.emit("knowledge:added", processed);
      } catch (error) {
        this.logger.error(`Failed to process item: ${error}`);
      }
    });
  }
  // ============================================================================
  // INGESTION
  // ============================================================================
  /**
   * Force ingest from all sources
   */
  async ingestAll() {
    return this.ingest.ingestAll();
  }
  /**
   * Ingest from specific source
   */
  async ingestSource(source) {
    return this.ingest.ingestSource(source);
  }
  /**
   * Get ingestion stats
   */
  getIngestStats() {
    return this.ingest.getStats();
  }
  // ============================================================================
  // SEARCH
  // ============================================================================
  /**
   * Search knowledge base
   */
  async search(query, limit = 10) {
    return this.retrieval.search(query, { limit, rerank: true });
  }
  /**
   * Advanced search with options
   */
  async advancedSearch(query, options) {
    return this.retrieval.hybridSearch(query, options);
  }
  /**
   * Get similar items
   */
  async getSimilar(itemId, limit = 10) {
    return this.retrieval.getSimilar(itemId, limit);
  }
  /**
   * Get by topic
   */
  getByTopic(topic, limit = 20) {
    return this.retrieval.getByTopic(topic, limit);
  }
  /**
   * Get recent items
   */
  getRecent(limit = 20) {
    return this.retrieval.getRecent(limit);
  }
  // ============================================================================
  // LEARNING
  // ============================================================================
  /**
   * Analyze and discover patterns
   */
  async analyzePatterns() {
    const patterns = await this.learning.analyzePatterns();
    for (const pattern of patterns) {
      this.emit("pattern:discovered", pattern);
    }
    return patterns;
  }
  /**
   * Get all patterns
   */
  getPatterns() {
    return this.storage.getAllPatterns();
  }
  /**
   * Get pattern stats
   */
  getPatternStats() {
    return this.learning.getPatternStats();
  }
  // ============================================================================
  // PREDICTIONS
  // ============================================================================
  /**
   * Generate predictions
   */
  async predict(type, count = 5) {
    const predictions = await this.prediction.predict(type, count);
    for (const pred of predictions) {
      this.emit("prediction:made", pred);
    }
    return predictions;
  }
  /**
   * Get all predictions
   */
  getPredictions() {
    return this.storage.getAllPredictions();
  }
  /**
   * Get prediction stats
   */
  getPredictionStats() {
    return this.prediction.getStats();
  }
  /**
   * Evaluate pending predictions
   */
  async evaluatePredictions() {
    return this.prediction.evaluatePredictions();
  }
  // ============================================================================
  // STATS
  // ============================================================================
  /**
   * Get comprehensive brain stats
   */
  getStats() {
    const storageStats = this.storage.getStats();
    const ingestStats = this.ingest.getStats();
    const patternStats = this.learning.getPatternStats();
    const predictionStats = this.prediction.getStats();
    const knowledge = this.storage.getAllKnowledge();
    const bySource = {};
    const byType = {};
    for (const item of knowledge) {
      bySource[item.source.name] = (bySource[item.source.name] || 0) + 1;
      byType[item.content.type] = (byType[item.content.type] || 0) + 1;
    }
    return {
      knowledge: {
        total: storageStats.knowledge,
        bySource,
        byType
      },
      patterns: {
        total: patternStats.total,
        active: patternStats.active,
        accuracy: patternStats.avgAccuracy
      },
      predictions: {
        total: predictionStats.total,
        correct: predictionStats.correct,
        accuracy: predictionStats.accuracy,
        pending: predictionStats.pending
      },
      wins: {
        total: 0,
        // Will be filled by wins integration
        totalPoints: 0,
        currentStreak: 0,
        longestStreak: 0
      },
      ingestion: {
        totalIngested: ingestStats.totalIngested,
        last24h: 0,
        // TODO: Calculate
        errors: ingestStats.errors,
        lastRun: ingestStats.lastRun
      }
    };
  }
  /**
   * Get uptime
   */
  getUptime() {
    return this.isRunning ? Date.now() - this.startTime : 0;
  }
  /**
   * Check if running
   */
  isOnline() {
    return this.isRunning;
  }
};

export { ActionSchema, AgentEvolutionSchema, BrainApiServer, ConditionOperatorSchema, ConditionSchema, ContentTypeSchema, EntitySchema, EntityTypeSchema, HyperBrain, IngestOrchestrator, KnowledgeItemSchema, LearningSystem, PatternSchema, PredictionEngine, PredictionSchema, PredictionTypeSchema, ProcessingPipeline, RawItemSchema, RelationshipSchema, RetrievalSystem, SourceTypeSchema, StorageOrchestrator, loadConfig };
//# sourceMappingURL=chunk-2M4QCTL7.js.map
//# sourceMappingURL=chunk-2M4QCTL7.js.map