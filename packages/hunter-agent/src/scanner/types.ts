import { z } from "zod";

// Recommendation levels
export const RecommendationSchema = z.enum([
  "STRONG_BUY",
  "BUY",
  "HOLD",
  "SELL",
  "AVOID",
]);
export type Recommendation = z.infer<typeof RecommendationSchema>;

// Score weights
export const SCORE_WEIGHTS = {
  safety: 0.30,
  fundamentals: 0.25,
  momentum: 0.20,
  onChain: 0.15,
  sentiment: 0.10,
} as const;

// Score thresholds for recommendations
export const RECOMMENDATION_THRESHOLDS = {
  STRONG_BUY: 80,
  BUY: 65,
  HOLD: 45,
  SELL: 25,
  // Below 25 = AVOID
} as const;

// Individual scores
export const ScoresSchema = z.object({
  safety: z.number().min(0).max(100),
  fundamentals: z.number().min(0).max(100),
  momentum: z.number().min(0).max(100),
  onChain: z.number().min(0).max(100),
  sentiment: z.number().min(0).max(100),
  overall: z.number().min(0).max(100),
});
export type Scores = z.infer<typeof ScoresSchema>;

// RugCheck data shape
export const RugCheckDataSchema = z.object({
  score: z.number().optional(),
  rugged: z.boolean().optional(),
  risks: z.array(z.string()).optional(),
  mintAuthority: z.boolean().optional(),
  freezeAuthority: z.boolean().optional(),
  lpLocked: z.boolean().optional(),
  topHoldersPercent: z.number().optional(),
});
export type RugCheckData = z.infer<typeof RugCheckDataSchema>;

// PumpFun data shape
export const PumpFunDataSchema = z.object({
  mint: z.string(),
  name: z.string().optional(),
  symbol: z.string().optional(),
  description: z.string().optional(),
  imageUri: z.string().optional(),
  twitter: z.string().optional(),
  telegram: z.string().optional(),
  website: z.string().optional(),
  bondingCurveProgress: z.number().optional(),
  marketCap: z.number().optional(),
  complete: z.boolean().optional(),
  raydiumPool: z.string().optional(),
  createdAt: z.date().optional(),
});
export type PumpFunData = z.infer<typeof PumpFunDataSchema>;

// Vybe data shape
export const VybeDataSchema = z.object({
  holders: z.number().optional(),
  topHolderPercent: z.number().optional(),
  top10Percent: z.number().optional(),
  whaleCount: z.number().optional(),
  concentrationRisk: z.enum(["low", "medium", "high"]).optional(),
  price: z.number().optional(),
  volume24h: z.number().optional(),
});
export type VybeData = z.infer<typeof VybeDataSchema>;

// CoinGecko/Market data shape
export const MarketDataSchema = z.object({
  price: z.number().optional(),
  marketCap: z.number().optional(),
  volume24h: z.number().optional(),
  priceChange24h: z.number().optional(),
  priceChange7d: z.number().optional(),
  liquidity: z.number().optional(),
  fdv: z.number().optional(),
  ath: z.number().optional(),
  athChangePercent: z.number().optional(),
});
export type MarketData = z.infer<typeof MarketDataSchema>;

// Combined source data
export const SourceDataSchema = z.object({
  rugcheck: RugCheckDataSchema.optional(),
  pumpfun: PumpFunDataSchema.optional(),
  vybe: VybeDataSchema.optional(),
  market: MarketDataSchema.optional(),
});
export type SourceData = z.infer<typeof SourceDataSchema>;

// Main TokenAnalysis result
export const TokenAnalysisSchema = z.object({
  mint: z.string(),
  symbol: z.string(),
  name: z.string(),

  scores: ScoresSchema,
  risks: z.array(z.string()),

  recommendation: RecommendationSchema,
  confidence: z.number().min(0).max(1),

  sources: SourceDataSchema,
  scannedAt: z.date(),
});
export type TokenAnalysis = z.infer<typeof TokenAnalysisSchema>;

// Scan options
export const ScanOptionsSchema = z.object({
  limit: z.number().min(1).max(100).default(10),
  minProgress: z.number().min(0).max(100).default(10),
  includeNsfw: z.boolean().default(false),
  minSafetyScore: z.number().min(0).max(100).optional(),
});
export type ScanOptions = z.infer<typeof ScanOptionsSchema>;

// Scanner configuration
export interface TokenScannerConfig {
  vybeApiKey?: string;
  enableVybe?: boolean;
  enableRugCheck?: boolean;
  enablePumpFun?: boolean;
  enableMarketData?: boolean;
  timeout?: number;
}
