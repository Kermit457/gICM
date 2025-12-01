/**
 * HYPER BRAIN Configuration
 */

import { config as dotenvConfig } from "dotenv";

dotenvConfig();

// Re-export BrainConfig from types
export type { BrainConfig } from "./types/index.js";

// Import for internal use
import type { BrainConfig } from "./types/index.js";

export const DEFAULT_CONFIG: BrainConfig = {
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
  enableWebSocket: true,
};

export function loadConfig(overrides: Partial<BrainConfig> = {}): BrainConfig {
  return {
    ...DEFAULT_CONFIG,
    ...overrides,
  };
}

// Source intervals (in ms)
export const SOURCE_INTERVALS = {
  // Real-time (1 min)
  onchain: 60 * 1000,
  dex: 60 * 1000,
  whale: 60 * 1000,

  // Frequent (5 min)
  twitter: 5 * 60 * 1000,
  news: 5 * 60 * 1000,

  // Regular (15 min)
  hackernews: 15 * 60 * 1000,
  reddit: 15 * 60 * 1000,

  // Periodic (1 hour)
  github: 60 * 60 * 1000,
  producthunt: 60 * 60 * 1000,
  competitor: 60 * 60 * 1000,

  // Slow (6 hours)
  arxiv: 6 * 60 * 60 * 1000,
  docs: 6 * 60 * 60 * 1000,
  blog: 6 * 60 * 60 * 1000,
};

// Source credibility scores (0-100)
export const SOURCE_CREDIBILITY: Record<string, number> = {
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
  competitor: 80,
};

// Decay rates (0-1, higher = faster decay)
export const DECAY_RATES: Record<string, number> = {
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
  docs: 0.05,
};
