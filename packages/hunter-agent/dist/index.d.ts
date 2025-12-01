import { BaseAgent, AgentConfig, AgentContext, AgentResult } from '@gicm/agent-core';
import { H as HunterConfig, a as HuntDiscovery, b as HuntSource } from './tiktok-hunter-SSPUPsHp.js';
export { A as ArxivHunter, B as BaseHunterSource, p as DEFAULT_SCHEDULES, D as DevToHunter, G as GitHubHunter, j as GitHubRepo, i as GitHubRepoSchema, l as HNItem, k as HNItemSchema, c as HackerNewsHunter, h as HuntDiscoverySchema, e as HuntSourceSchema, L as LobstersHunter, N as NitterHunter, P as ProductHuntHunter, o as RELEVANCE_KEYWORDS, g as RawDiscovery, f as RawDiscoverySchema, R as RedditHunter, d as TikTokHunter, T as TwitterHunter, n as TwitterTweet, m as TwitterTweetSchema } from './tiktok-hunter-SSPUPsHp.js';
import { z } from 'zod';

declare const RecommendationSchema: z.ZodEnum<["STRONG_BUY", "BUY", "HOLD", "SELL", "AVOID"]>;
type Recommendation = z.infer<typeof RecommendationSchema>;
declare const SCORE_WEIGHTS: {
    readonly safety: 0.3;
    readonly fundamentals: 0.25;
    readonly momentum: 0.2;
    readonly onChain: 0.15;
    readonly sentiment: 0.1;
};
declare const RECOMMENDATION_THRESHOLDS: {
    readonly STRONG_BUY: 80;
    readonly BUY: 65;
    readonly HOLD: 45;
    readonly SELL: 25;
};
declare const ScoresSchema: z.ZodObject<{
    safety: z.ZodNumber;
    fundamentals: z.ZodNumber;
    momentum: z.ZodNumber;
    onChain: z.ZodNumber;
    sentiment: z.ZodNumber;
    overall: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    safety: number;
    fundamentals: number;
    momentum: number;
    onChain: number;
    sentiment: number;
    overall: number;
}, {
    safety: number;
    fundamentals: number;
    momentum: number;
    onChain: number;
    sentiment: number;
    overall: number;
}>;
type Scores = z.infer<typeof ScoresSchema>;
declare const RugCheckDataSchema: z.ZodObject<{
    score: z.ZodOptional<z.ZodNumber>;
    rugged: z.ZodOptional<z.ZodBoolean>;
    risks: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    mintAuthority: z.ZodOptional<z.ZodBoolean>;
    freezeAuthority: z.ZodOptional<z.ZodBoolean>;
    lpLocked: z.ZodOptional<z.ZodBoolean>;
    topHoldersPercent: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    score?: number | undefined;
    rugged?: boolean | undefined;
    risks?: string[] | undefined;
    mintAuthority?: boolean | undefined;
    freezeAuthority?: boolean | undefined;
    lpLocked?: boolean | undefined;
    topHoldersPercent?: number | undefined;
}, {
    score?: number | undefined;
    rugged?: boolean | undefined;
    risks?: string[] | undefined;
    mintAuthority?: boolean | undefined;
    freezeAuthority?: boolean | undefined;
    lpLocked?: boolean | undefined;
    topHoldersPercent?: number | undefined;
}>;
type RugCheckData = z.infer<typeof RugCheckDataSchema>;
declare const PumpFunDataSchema: z.ZodObject<{
    mint: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
    symbol: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    imageUri: z.ZodOptional<z.ZodString>;
    twitter: z.ZodOptional<z.ZodString>;
    telegram: z.ZodOptional<z.ZodString>;
    website: z.ZodOptional<z.ZodString>;
    bondingCurveProgress: z.ZodOptional<z.ZodNumber>;
    marketCap: z.ZodOptional<z.ZodNumber>;
    complete: z.ZodOptional<z.ZodBoolean>;
    raydiumPool: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodOptional<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    mint: string;
    symbol?: string | undefined;
    twitter?: string | undefined;
    description?: string | undefined;
    name?: string | undefined;
    imageUri?: string | undefined;
    telegram?: string | undefined;
    website?: string | undefined;
    bondingCurveProgress?: number | undefined;
    marketCap?: number | undefined;
    complete?: boolean | undefined;
    raydiumPool?: string | undefined;
    createdAt?: Date | undefined;
}, {
    mint: string;
    symbol?: string | undefined;
    twitter?: string | undefined;
    description?: string | undefined;
    name?: string | undefined;
    imageUri?: string | undefined;
    telegram?: string | undefined;
    website?: string | undefined;
    bondingCurveProgress?: number | undefined;
    marketCap?: number | undefined;
    complete?: boolean | undefined;
    raydiumPool?: string | undefined;
    createdAt?: Date | undefined;
}>;
type PumpFunData = z.infer<typeof PumpFunDataSchema>;
declare const VybeDataSchema: z.ZodObject<{
    holders: z.ZodOptional<z.ZodNumber>;
    topHolderPercent: z.ZodOptional<z.ZodNumber>;
    top10Percent: z.ZodOptional<z.ZodNumber>;
    whaleCount: z.ZodOptional<z.ZodNumber>;
    concentrationRisk: z.ZodOptional<z.ZodEnum<["low", "medium", "high"]>>;
    price: z.ZodOptional<z.ZodNumber>;
    volume24h: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    holders?: number | undefined;
    topHolderPercent?: number | undefined;
    top10Percent?: number | undefined;
    whaleCount?: number | undefined;
    concentrationRisk?: "low" | "medium" | "high" | undefined;
    price?: number | undefined;
    volume24h?: number | undefined;
}, {
    holders?: number | undefined;
    topHolderPercent?: number | undefined;
    top10Percent?: number | undefined;
    whaleCount?: number | undefined;
    concentrationRisk?: "low" | "medium" | "high" | undefined;
    price?: number | undefined;
    volume24h?: number | undefined;
}>;
type VybeData = z.infer<typeof VybeDataSchema>;
declare const MarketDataSchema: z.ZodObject<{
    price: z.ZodOptional<z.ZodNumber>;
    marketCap: z.ZodOptional<z.ZodNumber>;
    volume24h: z.ZodOptional<z.ZodNumber>;
    priceChange24h: z.ZodOptional<z.ZodNumber>;
    priceChange7d: z.ZodOptional<z.ZodNumber>;
    liquidity: z.ZodOptional<z.ZodNumber>;
    fdv: z.ZodOptional<z.ZodNumber>;
    ath: z.ZodOptional<z.ZodNumber>;
    athChangePercent: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    marketCap?: number | undefined;
    price?: number | undefined;
    volume24h?: number | undefined;
    priceChange24h?: number | undefined;
    priceChange7d?: number | undefined;
    liquidity?: number | undefined;
    fdv?: number | undefined;
    ath?: number | undefined;
    athChangePercent?: number | undefined;
}, {
    marketCap?: number | undefined;
    price?: number | undefined;
    volume24h?: number | undefined;
    priceChange24h?: number | undefined;
    priceChange7d?: number | undefined;
    liquidity?: number | undefined;
    fdv?: number | undefined;
    ath?: number | undefined;
    athChangePercent?: number | undefined;
}>;
type MarketData = z.infer<typeof MarketDataSchema>;
declare const TokenAnalysisSchema: z.ZodObject<{
    mint: z.ZodString;
    symbol: z.ZodString;
    name: z.ZodString;
    scores: z.ZodObject<{
        safety: z.ZodNumber;
        fundamentals: z.ZodNumber;
        momentum: z.ZodNumber;
        onChain: z.ZodNumber;
        sentiment: z.ZodNumber;
        overall: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        safety: number;
        fundamentals: number;
        momentum: number;
        onChain: number;
        sentiment: number;
        overall: number;
    }, {
        safety: number;
        fundamentals: number;
        momentum: number;
        onChain: number;
        sentiment: number;
        overall: number;
    }>;
    risks: z.ZodArray<z.ZodString, "many">;
    recommendation: z.ZodEnum<["STRONG_BUY", "BUY", "HOLD", "SELL", "AVOID"]>;
    confidence: z.ZodNumber;
    sources: z.ZodObject<{
        rugcheck: z.ZodOptional<z.ZodObject<{
            score: z.ZodOptional<z.ZodNumber>;
            rugged: z.ZodOptional<z.ZodBoolean>;
            risks: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            mintAuthority: z.ZodOptional<z.ZodBoolean>;
            freezeAuthority: z.ZodOptional<z.ZodBoolean>;
            lpLocked: z.ZodOptional<z.ZodBoolean>;
            topHoldersPercent: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            score?: number | undefined;
            rugged?: boolean | undefined;
            risks?: string[] | undefined;
            mintAuthority?: boolean | undefined;
            freezeAuthority?: boolean | undefined;
            lpLocked?: boolean | undefined;
            topHoldersPercent?: number | undefined;
        }, {
            score?: number | undefined;
            rugged?: boolean | undefined;
            risks?: string[] | undefined;
            mintAuthority?: boolean | undefined;
            freezeAuthority?: boolean | undefined;
            lpLocked?: boolean | undefined;
            topHoldersPercent?: number | undefined;
        }>>;
        pumpfun: z.ZodOptional<z.ZodObject<{
            mint: z.ZodString;
            name: z.ZodOptional<z.ZodString>;
            symbol: z.ZodOptional<z.ZodString>;
            description: z.ZodOptional<z.ZodString>;
            imageUri: z.ZodOptional<z.ZodString>;
            twitter: z.ZodOptional<z.ZodString>;
            telegram: z.ZodOptional<z.ZodString>;
            website: z.ZodOptional<z.ZodString>;
            bondingCurveProgress: z.ZodOptional<z.ZodNumber>;
            marketCap: z.ZodOptional<z.ZodNumber>;
            complete: z.ZodOptional<z.ZodBoolean>;
            raydiumPool: z.ZodOptional<z.ZodString>;
            createdAt: z.ZodOptional<z.ZodDate>;
        }, "strip", z.ZodTypeAny, {
            mint: string;
            symbol?: string | undefined;
            twitter?: string | undefined;
            description?: string | undefined;
            name?: string | undefined;
            imageUri?: string | undefined;
            telegram?: string | undefined;
            website?: string | undefined;
            bondingCurveProgress?: number | undefined;
            marketCap?: number | undefined;
            complete?: boolean | undefined;
            raydiumPool?: string | undefined;
            createdAt?: Date | undefined;
        }, {
            mint: string;
            symbol?: string | undefined;
            twitter?: string | undefined;
            description?: string | undefined;
            name?: string | undefined;
            imageUri?: string | undefined;
            telegram?: string | undefined;
            website?: string | undefined;
            bondingCurveProgress?: number | undefined;
            marketCap?: number | undefined;
            complete?: boolean | undefined;
            raydiumPool?: string | undefined;
            createdAt?: Date | undefined;
        }>>;
        vybe: z.ZodOptional<z.ZodObject<{
            holders: z.ZodOptional<z.ZodNumber>;
            topHolderPercent: z.ZodOptional<z.ZodNumber>;
            top10Percent: z.ZodOptional<z.ZodNumber>;
            whaleCount: z.ZodOptional<z.ZodNumber>;
            concentrationRisk: z.ZodOptional<z.ZodEnum<["low", "medium", "high"]>>;
            price: z.ZodOptional<z.ZodNumber>;
            volume24h: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            holders?: number | undefined;
            topHolderPercent?: number | undefined;
            top10Percent?: number | undefined;
            whaleCount?: number | undefined;
            concentrationRisk?: "low" | "medium" | "high" | undefined;
            price?: number | undefined;
            volume24h?: number | undefined;
        }, {
            holders?: number | undefined;
            topHolderPercent?: number | undefined;
            top10Percent?: number | undefined;
            whaleCount?: number | undefined;
            concentrationRisk?: "low" | "medium" | "high" | undefined;
            price?: number | undefined;
            volume24h?: number | undefined;
        }>>;
        market: z.ZodOptional<z.ZodObject<{
            price: z.ZodOptional<z.ZodNumber>;
            marketCap: z.ZodOptional<z.ZodNumber>;
            volume24h: z.ZodOptional<z.ZodNumber>;
            priceChange24h: z.ZodOptional<z.ZodNumber>;
            priceChange7d: z.ZodOptional<z.ZodNumber>;
            liquidity: z.ZodOptional<z.ZodNumber>;
            fdv: z.ZodOptional<z.ZodNumber>;
            ath: z.ZodOptional<z.ZodNumber>;
            athChangePercent: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            marketCap?: number | undefined;
            price?: number | undefined;
            volume24h?: number | undefined;
            priceChange24h?: number | undefined;
            priceChange7d?: number | undefined;
            liquidity?: number | undefined;
            fdv?: number | undefined;
            ath?: number | undefined;
            athChangePercent?: number | undefined;
        }, {
            marketCap?: number | undefined;
            price?: number | undefined;
            volume24h?: number | undefined;
            priceChange24h?: number | undefined;
            priceChange7d?: number | undefined;
            liquidity?: number | undefined;
            fdv?: number | undefined;
            ath?: number | undefined;
            athChangePercent?: number | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        rugcheck?: {
            score?: number | undefined;
            rugged?: boolean | undefined;
            risks?: string[] | undefined;
            mintAuthority?: boolean | undefined;
            freezeAuthority?: boolean | undefined;
            lpLocked?: boolean | undefined;
            topHoldersPercent?: number | undefined;
        } | undefined;
        pumpfun?: {
            mint: string;
            symbol?: string | undefined;
            twitter?: string | undefined;
            description?: string | undefined;
            name?: string | undefined;
            imageUri?: string | undefined;
            telegram?: string | undefined;
            website?: string | undefined;
            bondingCurveProgress?: number | undefined;
            marketCap?: number | undefined;
            complete?: boolean | undefined;
            raydiumPool?: string | undefined;
            createdAt?: Date | undefined;
        } | undefined;
        vybe?: {
            holders?: number | undefined;
            topHolderPercent?: number | undefined;
            top10Percent?: number | undefined;
            whaleCount?: number | undefined;
            concentrationRisk?: "low" | "medium" | "high" | undefined;
            price?: number | undefined;
            volume24h?: number | undefined;
        } | undefined;
        market?: {
            marketCap?: number | undefined;
            price?: number | undefined;
            volume24h?: number | undefined;
            priceChange24h?: number | undefined;
            priceChange7d?: number | undefined;
            liquidity?: number | undefined;
            fdv?: number | undefined;
            ath?: number | undefined;
            athChangePercent?: number | undefined;
        } | undefined;
    }, {
        rugcheck?: {
            score?: number | undefined;
            rugged?: boolean | undefined;
            risks?: string[] | undefined;
            mintAuthority?: boolean | undefined;
            freezeAuthority?: boolean | undefined;
            lpLocked?: boolean | undefined;
            topHoldersPercent?: number | undefined;
        } | undefined;
        pumpfun?: {
            mint: string;
            symbol?: string | undefined;
            twitter?: string | undefined;
            description?: string | undefined;
            name?: string | undefined;
            imageUri?: string | undefined;
            telegram?: string | undefined;
            website?: string | undefined;
            bondingCurveProgress?: number | undefined;
            marketCap?: number | undefined;
            complete?: boolean | undefined;
            raydiumPool?: string | undefined;
            createdAt?: Date | undefined;
        } | undefined;
        vybe?: {
            holders?: number | undefined;
            topHolderPercent?: number | undefined;
            top10Percent?: number | undefined;
            whaleCount?: number | undefined;
            concentrationRisk?: "low" | "medium" | "high" | undefined;
            price?: number | undefined;
            volume24h?: number | undefined;
        } | undefined;
        market?: {
            marketCap?: number | undefined;
            price?: number | undefined;
            volume24h?: number | undefined;
            priceChange24h?: number | undefined;
            priceChange7d?: number | undefined;
            liquidity?: number | undefined;
            fdv?: number | undefined;
            ath?: number | undefined;
            athChangePercent?: number | undefined;
        } | undefined;
    }>;
    scannedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    symbol: string;
    name: string;
    risks: string[];
    mint: string;
    scores: {
        safety: number;
        fundamentals: number;
        momentum: number;
        onChain: number;
        sentiment: number;
        overall: number;
    };
    recommendation: "STRONG_BUY" | "BUY" | "HOLD" | "SELL" | "AVOID";
    confidence: number;
    sources: {
        rugcheck?: {
            score?: number | undefined;
            rugged?: boolean | undefined;
            risks?: string[] | undefined;
            mintAuthority?: boolean | undefined;
            freezeAuthority?: boolean | undefined;
            lpLocked?: boolean | undefined;
            topHoldersPercent?: number | undefined;
        } | undefined;
        pumpfun?: {
            mint: string;
            symbol?: string | undefined;
            twitter?: string | undefined;
            description?: string | undefined;
            name?: string | undefined;
            imageUri?: string | undefined;
            telegram?: string | undefined;
            website?: string | undefined;
            bondingCurveProgress?: number | undefined;
            marketCap?: number | undefined;
            complete?: boolean | undefined;
            raydiumPool?: string | undefined;
            createdAt?: Date | undefined;
        } | undefined;
        vybe?: {
            holders?: number | undefined;
            topHolderPercent?: number | undefined;
            top10Percent?: number | undefined;
            whaleCount?: number | undefined;
            concentrationRisk?: "low" | "medium" | "high" | undefined;
            price?: number | undefined;
            volume24h?: number | undefined;
        } | undefined;
        market?: {
            marketCap?: number | undefined;
            price?: number | undefined;
            volume24h?: number | undefined;
            priceChange24h?: number | undefined;
            priceChange7d?: number | undefined;
            liquidity?: number | undefined;
            fdv?: number | undefined;
            ath?: number | undefined;
            athChangePercent?: number | undefined;
        } | undefined;
    };
    scannedAt: Date;
}, {
    symbol: string;
    name: string;
    risks: string[];
    mint: string;
    scores: {
        safety: number;
        fundamentals: number;
        momentum: number;
        onChain: number;
        sentiment: number;
        overall: number;
    };
    recommendation: "STRONG_BUY" | "BUY" | "HOLD" | "SELL" | "AVOID";
    confidence: number;
    sources: {
        rugcheck?: {
            score?: number | undefined;
            rugged?: boolean | undefined;
            risks?: string[] | undefined;
            mintAuthority?: boolean | undefined;
            freezeAuthority?: boolean | undefined;
            lpLocked?: boolean | undefined;
            topHoldersPercent?: number | undefined;
        } | undefined;
        pumpfun?: {
            mint: string;
            symbol?: string | undefined;
            twitter?: string | undefined;
            description?: string | undefined;
            name?: string | undefined;
            imageUri?: string | undefined;
            telegram?: string | undefined;
            website?: string | undefined;
            bondingCurveProgress?: number | undefined;
            marketCap?: number | undefined;
            complete?: boolean | undefined;
            raydiumPool?: string | undefined;
            createdAt?: Date | undefined;
        } | undefined;
        vybe?: {
            holders?: number | undefined;
            topHolderPercent?: number | undefined;
            top10Percent?: number | undefined;
            whaleCount?: number | undefined;
            concentrationRisk?: "low" | "medium" | "high" | undefined;
            price?: number | undefined;
            volume24h?: number | undefined;
        } | undefined;
        market?: {
            marketCap?: number | undefined;
            price?: number | undefined;
            volume24h?: number | undefined;
            priceChange24h?: number | undefined;
            priceChange7d?: number | undefined;
            liquidity?: number | undefined;
            fdv?: number | undefined;
            ath?: number | undefined;
            athChangePercent?: number | undefined;
        } | undefined;
    };
    scannedAt: Date;
}>;
type TokenAnalysis = z.infer<typeof TokenAnalysisSchema>;
declare const ScanOptionsSchema: z.ZodObject<{
    limit: z.ZodDefault<z.ZodNumber>;
    minProgress: z.ZodDefault<z.ZodNumber>;
    includeNsfw: z.ZodDefault<z.ZodBoolean>;
    minSafetyScore: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    minProgress: number;
    includeNsfw: boolean;
    minSafetyScore?: number | undefined;
}, {
    limit?: number | undefined;
    minProgress?: number | undefined;
    includeNsfw?: boolean | undefined;
    minSafetyScore?: number | undefined;
}>;
type ScanOptions = z.infer<typeof ScanOptionsSchema>;
interface TokenScannerConfig {
    vybeApiKey?: string;
    enableVybe?: boolean;
    enableRugCheck?: boolean;
    enablePumpFun?: boolean;
    enableMarketData?: boolean;
    timeout?: number;
}

/**
 * Calculate safety score (30% weight)
 * Sources: RugCheck score, mint/freeze authority, holder distribution
 */
declare function calculateSafetyScore(rugcheck?: RugCheckData, vybe?: VybeData): {
    score: number;
    risks: string[];
};
/**
 * Calculate fundamentals score (25% weight)
 * Sources: Market cap, liquidity, volume, age
 */
declare function calculateFundamentalsScore(market?: MarketData, pumpfun?: PumpFunData): number;
/**
 * Calculate momentum score (20% weight)
 * Sources: Price change 24h, volume spike, trending
 */
declare function calculateMomentumScore(market?: MarketData): number;
/**
 * Calculate on-chain score (15% weight)
 * Sources: Vybe holder count, whale %, tx count
 */
declare function calculateOnChainScore(vybe?: VybeData): number;
/**
 * Calculate sentiment score (10% weight)
 * Sources: Social presence, community size
 */
declare function calculateSentimentScore(pumpfun?: PumpFunData): number;
/**
 * Calculate overall weighted score
 */
declare function calculateOverallScore(scores: Omit<Scores, "overall">): number;
/**
 * Get recommendation based on overall score and risks
 */
declare function getRecommendation(overallScore: number, risks: string[]): Recommendation;

declare class TokenScanner {
    private config;
    private rugcheck;
    private pumpfun;
    private vybe;
    constructor(config?: Partial<TokenScannerConfig>);
    /**
     * Scan a single token by mint address
     */
    scanToken(mint: string): Promise<TokenAnalysis>;
    /**
     * Scan new launches from Pump.fun
     */
    scanNewLaunches(options?: Partial<ScanOptions>): Promise<TokenAnalysis[]>;
    /**
     * Scan multiple tokens in batch
     */
    scanBatch(mints: string[]): Promise<TokenAnalysis[]>;
    /**
     * Calculate bonding curve progress for PumpFun coins
     */
    private calculateBondingProgress;
    /**
     * Build market data from available sources
     */
    private buildMarketData;
    /**
     * Analyze token data and compute scores
     */
    private analyzeToken;
    /**
     * Fetch RugCheck safety data
     */
    private fetchRugCheckData;
    /**
     * Fetch Pump.fun token data
     */
    private fetchPumpFunData;
    /**
     * Fetch Vybe on-chain data
     */
    private fetchVybeData;
}

interface HunterAgentConfig extends AgentConfig {
    sources: HunterConfig[];
    deduplicationTTL?: number;
    onDiscovery?: (discoveries: HuntDiscovery[]) => Promise<void>;
    scanner?: TokenScannerConfig;
}
declare class HunterAgent extends BaseAgent {
    private hunters;
    private jobs;
    private seen;
    private deduplicationTTL;
    private onDiscovery?;
    private isRunning;
    private scanner;
    constructor(config: HunterAgentConfig);
    getSystemPrompt(): string;
    analyze(context: AgentContext): Promise<AgentResult>;
    start(): Promise<void>;
    stop(): Promise<void>;
    huntNow(sources?: HuntSource[]): Promise<HuntDiscovery[]>;
    private performHunt;
    private huntSource;
    private getStatus;
    private createHunter;
    private getSchedule;
    private findSourceConfig;
    private hasSeen;
    private markSeen;
    private cleanupSeen;
    /**
     * Scan a single token by mint address
     * Combines data from RugCheck, Pump.fun, Vybe, and CoinGecko
     */
    scanToken(mint: string): Promise<TokenAnalysis>;
    /**
     * Scan new launches from Pump.fun
     * Returns analyzed tokens sorted by overall score
     */
    scanNewLaunches(options?: Partial<ScanOptions>): Promise<TokenAnalysis[]>;
    /**
     * Scan multiple tokens in batch
     */
    scanBatch(mints: string[]): Promise<TokenAnalysis[]>;
    /**
     * Get the underlying token scanner instance
     */
    getScanner(): TokenScanner;
}

export { HuntDiscovery, HuntSource, HunterAgent, type HunterAgentConfig, HunterConfig, type MarketData, type PumpFunData, RECOMMENDATION_THRESHOLDS, type Recommendation, type RugCheckData, SCORE_WEIGHTS, type ScanOptions, type Scores, type TokenAnalysis, TokenScanner, type TokenScannerConfig, type VybeData, calculateFundamentalsScore, calculateMomentumScore, calculateOnChainScore, calculateOverallScore, calculateSafetyScore, calculateSentimentScore, getRecommendation };
