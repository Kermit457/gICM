// Main agent
export { HunterAgent } from "./hunter-agent.js";
export type { HunterAgentConfig } from "./hunter-agent.js";

// Types
export * from "./types.js";

// Token Scanner
export { TokenScanner } from "./scanner/index.js";
export type {
  TokenAnalysis,
  TokenScannerConfig,
  ScanOptions,
  Scores,
  Recommendation,
  RugCheckData,
  PumpFunData,
  VybeData,
  MarketData,
} from "./scanner/types.js";
export {
  calculateSafetyScore,
  calculateFundamentalsScore,
  calculateMomentumScore,
  calculateOnChainScore,
  calculateSentimentScore,
  calculateOverallScore,
  getRecommendation,
} from "./scanner/aggregators.js";
export { SCORE_WEIGHTS, RECOMMENDATION_THRESHOLDS } from "./scanner/types.js";

// Sources
export {
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
} from "./sources/index.js";
