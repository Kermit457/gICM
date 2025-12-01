import { B as BaseHunterSource, H as HunterConfig, g as RawDiscovery, a as HuntDiscovery } from '../tiktok-hunter-SSPUPsHp.js';
export { A as ArxivHunter, D as DevToHunter, G as GitHubHunter, c as HackerNewsHunter, L as LobstersHunter, N as NitterHunter, P as ProductHuntHunter, R as RedditHunter, d as TikTokHunter, T as TwitterHunter, q as TwitterHunterConfig } from '../tiktok-hunter-SSPUPsHp.js';
import 'zod';

declare class DeFiLlamaHunter implements BaseHunterSource {
    source: "defillama";
    private config;
    constructor(config: HunterConfig);
    hunt(): Promise<RawDiscovery[]>;
    transform(raw: RawDiscovery): HuntDiscovery;
    private fetchProtocols;
    private fetchYields;
    private filterProtocols;
    private filterYields;
    private protocolToRawDiscovery;
    private yieldToRawDiscovery;
    private categorize;
    private extractTags;
    private hasKeywords;
    private hasSignificantChange;
    private formatNumber;
    private generateFingerprint;
}

declare class GeckoTerminalHunter implements BaseHunterSource {
    source: "geckoterminal";
    private config;
    constructor(config: HunterConfig);
    hunt(): Promise<RawDiscovery[]>;
    transform(raw: RawDiscovery): HuntDiscovery;
    private fetchNewPools;
    private fetchTrendingPools;
    private filterPools;
    private poolToRawDiscovery;
    private extractTags;
    private hasKeywords;
    private isNewPool;
    private formatNumber;
    private generateFingerprint;
}

declare class FearGreedHunter implements BaseHunterSource {
    source: "feargreed";
    private config;
    constructor(config: HunterConfig);
    hunt(): Promise<RawDiscovery[]>;
    transform(raw: RawDiscovery): HuntDiscovery;
    private createDiscovery;
    private createTrendDiscovery;
    private createExtremeDiscovery;
    private getSignal;
    private getEmoji;
    private getTradingAdvice;
    private calculateAverage;
    private isExtreme;
    private extractTags;
    private generateFingerprint;
}

declare class BinanceHunter implements BaseHunterSource {
    source: "binance";
    private config;
    constructor(config: HunterConfig);
    hunt(): Promise<RawDiscovery[]>;
    transform(raw: RawDiscovery): HuntDiscovery;
    private fetch24hrTickers;
    private filterSignificantMoves;
    private findVolumeAnomalies;
    private tickerToDiscovery;
    private volumeAnomalyToDiscovery;
    private categorize;
    private extractTags;
    private isSolanaToken;
    private isAIToken;
    private isMemeToken;
    private hasKeywords;
    private formatPrice;
    private formatNumber;
    private generateFingerprint;
}

/**
 * CoinGecko Hunter - Market data, trending coins, and category tracking
 *
 * Free tier: 50 calls/min (no API key required for demo mode)
 * Pro tier: Higher limits with API key
 *
 * Endpoints used:
 * - /search/trending - Trending coins (7 coins)
 * - /coins/markets - Top coins by market cap
 * - /coins/categories - DeFi, NFT, Gaming categories
 * - /global - Global market data
 */

declare class CoinGeckoHunter implements BaseHunterSource {
    source: "coingecko";
    private config;
    private lastGlobalData;
    constructor(config: HunterConfig);
    hunt(): Promise<RawDiscovery[]>;
    private fetchTrending;
    private fetchTopMovers;
    private fetchHotCategories;
    private fetchGlobalData;
    private getHeaders;
    private createCoinDiscovery;
    private createMarketDiscovery;
    private createCategoryDiscovery;
    private createGlobalDiscovery;
    transform(raw: RawDiscovery): HuntDiscovery;
}

/**
 * CoinMarketCap Hunter - Market data, trending coins, and historical OHLCV
 *
 * Free tier: 10,000 calls/month, 30 calls/min
 * API Key required
 *
 * Endpoints used:
 * - /cryptocurrency/listings/latest - Top coins by market cap
 * - /cryptocurrency/quotes/latest - Current prices
 * - /cryptocurrency/trending/latest - Trending coins
 * - /global-metrics/quotes/latest - Global market data
 */

interface CMCCoin {
    id: number;
    name: string;
    symbol: string;
    slug: string;
    cmc_rank: number;
    num_market_pairs: number;
    circulating_supply: number;
    total_supply: number;
    max_supply: number | null;
    infinite_supply: boolean;
    last_updated: string;
    date_added: string;
    tags: string[];
    platform: {
        id: number;
        name: string;
        symbol: string;
        slug: string;
        token_address: string;
    } | null;
    quote: {
        USD: {
            price: number;
            volume_24h: number;
            volume_change_24h: number;
            percent_change_1h: number;
            percent_change_24h: number;
            percent_change_7d: number;
            percent_change_30d: number;
            market_cap: number;
            market_cap_dominance: number;
            fully_diluted_market_cap: number;
            last_updated: string;
        };
    };
}
interface CMCGlobalMetrics {
    active_cryptocurrencies: number;
    total_cryptocurrencies: number;
    active_market_pairs: number;
    active_exchanges: number;
    total_exchanges: number;
    eth_dominance: number;
    btc_dominance: number;
    eth_dominance_yesterday: number;
    btc_dominance_yesterday: number;
    defi_volume_24h: number;
    defi_volume_24h_reported: number;
    defi_market_cap: number;
    defi_24h_percentage_change: number;
    stablecoin_volume_24h: number;
    stablecoin_volume_24h_reported: number;
    stablecoin_market_cap: number;
    stablecoin_24h_percentage_change: number;
    derivatives_volume_24h: number;
    derivatives_volume_24h_reported: number;
    derivatives_24h_percentage_change: number;
    quote: {
        USD: {
            total_market_cap: number;
            total_volume_24h: number;
            total_volume_24h_reported: number;
            altcoin_volume_24h: number;
            altcoin_volume_24h_reported: number;
            altcoin_market_cap: number;
            defi_volume_24h: number;
            defi_volume_24h_reported: number;
            defi_24h_percentage_change: number;
            defi_market_cap: number;
            stablecoin_volume_24h: number;
            stablecoin_volume_24h_reported: number;
            stablecoin_24h_percentage_change: number;
            stablecoin_market_cap: number;
            derivatives_volume_24h: number;
            derivatives_volume_24h_reported: number;
            derivatives_24h_percentage_change: number;
            total_market_cap_yesterday: number;
            total_volume_24h_yesterday: number;
            total_market_cap_yesterday_percentage_change: number;
            total_volume_24h_yesterday_percentage_change: number;
            last_updated: string;
        };
    };
    last_updated: string;
}
declare class CoinMarketCapHunter implements BaseHunterSource {
    source: "coinmarketcap";
    private config;
    private lastGlobalData;
    constructor(config: HunterConfig);
    hunt(): Promise<RawDiscovery[]>;
    private fetchListings;
    private fetchGlobalMetrics;
    /**
     * Fetch historical OHLCV data for a specific coin
     * Note: This uses additional API credits
     */
    fetchHistoricalOHLCV(symbol: string, days?: number): Promise<Array<{
        timestamp: string;
        open: number;
        high: number;
        low: number;
        close: number;
        volume: number;
        market_cap: number;
    }> | null>;
    /**
     * Fetch current prices for specific symbols
     */
    fetchPrices(symbols: string[]): Promise<Map<string, {
        price: number;
        change24h: number;
        marketCap: number;
    }>>;
    private getHeaders;
    private createCoinDiscovery;
    private createGlobalDiscovery;
    transform(raw: RawDiscovery): HuntDiscovery;
}

/**
 * LunarCrush Hunter - Social sentiment and engagement metrics
 *
 * LunarCrush tracks social activity across Twitter, Reddit, YouTube, etc.
 * Provides Galaxy Score, AltRank, and social engagement metrics.
 *
 * Free tier: Limited endpoints (public API)
 * Pro tier: Full API access with key
 *
 * Endpoints:
 * - /coins/list - Top coins by social activity
 * - /coins/:coin - Detailed coin metrics
 * - /feeds - Social media feed aggregation
 */

declare class LunarCrushHunter implements BaseHunterSource {
    source: "lunarcrush";
    private config;
    private lastSocialVolumes;
    constructor(config: HunterConfig);
    hunt(): Promise<RawDiscovery[]>;
    private huntPublicData;
    private fetchTopCoins;
    private fetchSocialFeed;
    private getHeaders;
    private processCoin;
    private createHighSocialDiscovery;
    private createLowSocialDiscovery;
    private createVolumeSpikeDiscovery;
    private createSentimentDiscovery;
    private createFeedDiscovery;
    private getSourceEmoji;
    private formatSentiment;
    transform(raw: RawDiscovery): HuntDiscovery;
}

/**
 * RugCheck Hunter - Token Safety Scanner for Solana
 *
 * FREE API - No authentication required
 * Base URL: https://api.rugcheck.xyz
 *
 * Provides:
 * - Token safety reports
 * - Scam detection
 * - Trending/new tokens
 * - Community voting data
 */

interface RugCheckReport {
    mint: string;
    tokenMeta?: {
        name: string;
        symbol: string;
        uri?: string;
        mutable: boolean;
        updateAuthority?: string;
    };
    token?: {
        name: string;
        symbol: string;
        decimals: number;
        supply: number;
        mintAuthority?: string;
        freezeAuthority?: string;
    };
    risks: RugCheckRisk[];
    score: number;
    rugged: boolean;
    markets?: RugCheckMarket[];
    topHolders?: RugCheckHolder[];
    fileMeta?: {
        description?: string;
        image?: string;
        twitter?: string;
        telegram?: string;
        website?: string;
    };
}
interface RugCheckRisk {
    name: string;
    description: string;
    level: "warn" | "danger" | "info";
    score: number;
}
interface RugCheckMarket {
    pubkey: string;
    marketType: string;
    lpMint?: string;
    liquidityA?: number;
    liquidityB?: number;
}
interface RugCheckHolder {
    address: string;
    amount: number;
    pct: number;
    insider: boolean;
}
interface RugCheckSummary {
    mint: string;
    score: number;
    risks: string[];
    rugged: boolean;
}
interface RugCheckTrendingToken {
    mint: string;
    name: string;
    symbol: string;
    score: number;
    votes: number;
    views: number;
}
declare class RugCheckHunter implements BaseHunterSource {
    source: "rugcheck";
    private config;
    constructor(config: HunterConfig);
    hunt(): Promise<RawDiscovery[]>;
    /**
     * Get detailed safety report for a specific token
     */
    getTokenReport(mint: string): Promise<RugCheckReport | null>;
    /**
     * Get quick safety summary for a token
     */
    getTokenSummary(mint: string): Promise<RugCheckSummary | null>;
    /**
     * Check if a token is safe (score >= 80)
     */
    isTokenSafe(mint: string): Promise<{
        safe: boolean;
        score: number;
        risks: string[];
        rugged: boolean;
    }>;
    private fetchTrendingTokens;
    private fetchNewTokens;
    private fetchVerifiedTokens;
    private createTrendingDiscovery;
    private createNewTokenDiscovery;
    private createVerifiedDiscovery;
    private getSafetyEmoji;
    private getSafetyLabel;
    transform(raw: RawDiscovery): HuntDiscovery;
}

/**
 * Pump.fun Hunter - Memecoin Launch Tracker for Solana
 *
 * FREE API - No authentication required
 * Base URL: https://frontend-api.pump.fun
 *
 * Provides:
 * - New memecoin launches
 * - Bonding curve data
 * - King of the Hill tracking
 * - Token details and metadata
 */

interface PumpFunCoin {
    mint: string;
    name: string;
    symbol: string;
    description?: string;
    image_uri?: string;
    video_uri?: string;
    metadata_uri?: string;
    twitter?: string;
    telegram?: string;
    bonding_curve: string;
    associated_bonding_curve?: string;
    creator: string;
    created_timestamp: number;
    raydium_pool?: string;
    complete: boolean;
    virtual_sol_reserves: number;
    virtual_token_reserves: number;
    total_supply: number;
    website?: string;
    show_name: boolean;
    king_of_the_hill_timestamp?: number;
    market_cap?: number;
    reply_count?: number;
    last_reply?: number;
    nsfw: boolean;
    market_id?: string;
    inverted?: boolean;
    usd_market_cap?: number;
}
interface PumpFunKingOfTheHill {
    mint: string;
    name: string;
    symbol: string;
    market_cap: number;
    timestamp: number;
}
declare class PumpFunHunter implements BaseHunterSource {
    source: "pumpfun";
    private config;
    private lastKingOfTheHill;
    constructor(config: HunterConfig);
    hunt(): Promise<RawDiscovery[]>;
    /**
     * Fetch latest coins from Pump.fun
     */
    fetchNewCoins(limit?: number): Promise<PumpFunCoin[]>;
    /**
     * Fetch specific coin details
     */
    getCoinDetails(mint: string): Promise<PumpFunCoin | null>;
    /**
     * Fetch current king of the hill
     */
    fetchKingOfTheHill(): Promise<PumpFunCoin | null>;
    /**
     * Calculate bonding curve progress
     */
    private getBondingCurveProgress;
    /**
     * Calculate estimated market cap from reserves
     */
    private getEstimatedMarketCap;
    private createCoinDiscovery;
    private createKingDiscovery;
    transform(raw: RawDiscovery): HuntDiscovery;
}

/**
 * Vybe Network Hunter - Enterprise Solana Data Platform
 *
 * FREE TIER: 4 req/min, 12,000 credits/month
 * Base URL: https://api.vybenetwork.xyz
 * Auth: API Key required (sign up with wallet)
 *
 * Provides:
 * - Wallet PnL calculations
 * - Token holder distribution
 * - Trading activity
 * - Labeled wallets (CEXs, KOLs, treasuries)
 * - TVL metrics
 * - Pyth Oracle prices
 */

interface VybeWalletPnL {
    address: string;
    realized_pnl: number;
    unrealized_pnl: number;
    total_pnl: number;
    win_rate: number;
    total_trades: number;
    profitable_trades: number;
    average_trade_size: number;
    largest_win: number;
    largest_loss: number;
    last_updated: string;
}
interface VybeTokenBalance {
    mint: string;
    symbol: string;
    name: string;
    amount: number;
    decimals: number;
    usd_value: number;
    price: number;
    logo_uri?: string;
}
interface VybeTokenHolder {
    address: string;
    amount: number;
    percentage: number;
    rank: number;
    label?: string;
    is_known_entity: boolean;
    entity_type?: "cex" | "kol" | "treasury" | "protocol" | "unknown";
}
interface VybeTokenDetails {
    mint: string;
    name: string;
    symbol: string;
    decimals: number;
    supply: number;
    holders: number;
    price?: number;
    market_cap?: number;
    volume_24h?: number;
    price_change_24h?: number;
    logo_uri?: string;
    description?: string;
    website?: string;
    twitter?: string;
}
interface VybeTokenTrade {
    signature: string;
    timestamp: number;
    mint: string;
    symbol: string;
    side: "buy" | "sell";
    amount_token: number;
    amount_sol: number;
    price_usd: number;
    wallet: string;
    wallet_label?: string;
    dex: string;
}
interface VybeProgramTVL {
    program_id: string;
    name: string;
    tvl_usd: number;
    tvl_sol: number;
    change_24h: number;
    change_7d: number;
}
interface VybePythPrice {
    symbol: string;
    price: number;
    confidence: number;
    timestamp: number;
    ema_price: number;
}
declare class VybeHunter implements BaseHunterSource {
    source: "vybe";
    private config;
    private apiKey;
    constructor(config: HunterConfig);
    hunt(): Promise<RawDiscovery[]>;
    /**
     * Get wallet PnL and trading stats
     */
    fetchWalletPnL(address: string): Promise<VybeWalletPnL | null>;
    /**
     * Get token balances for a wallet
     */
    fetchTokenBalances(address: string): Promise<VybeTokenBalance[]>;
    /**
     * Get top holders for a token
     */
    fetchTokenHolders(mint: string): Promise<VybeTokenHolder[]>;
    /**
     * Get token details
     */
    fetchTokenDetails(mint: string): Promise<VybeTokenDetails | null>;
    /**
     * Get recent trades for a token
     */
    fetchTokenTrades(mint: string, limit?: number): Promise<VybeTokenTrade[]>;
    /**
     * Get TVL for a program
     */
    fetchProgramTVL(programId: string): Promise<VybeProgramTVL | null>;
    /**
     * Get Pyth Oracle price
     */
    fetchPythPrice(symbol: string): Promise<VybePythPrice | null>;
    /**
     * Get market data
     */
    fetchMarkets(): Promise<any[]>;
    /**
     * Check if wallet is profitable
     */
    isWalletProfitable(address: string): Promise<{
        profitable: boolean;
        totalPnL: number;
        winRate: number;
        trades: number;
    }>;
    /**
     * Get concentration risk for a token
     */
    getConcentrationRisk(mint: string): Promise<{
        topHolderPercent: number;
        top10Percent: number;
        whaleCount: number;
        risk: "low" | "medium" | "high";
    }>;
    private getHeaders;
    private createPnLDiscovery;
    transform(raw: RawDiscovery): HuntDiscovery;
}

declare class PolymarketHunter implements BaseHunterSource {
    source: "polymarket";
    private config;
    constructor(config: HunterConfig);
    hunt(): Promise<RawDiscovery[]>;
    transform(raw: RawDiscovery): HuntDiscovery;
    private fetchMarkets;
    private filterMarkets;
    private marketToRawDiscovery;
    private categorize;
    private extractTags;
    private hasKeywords;
    private formatNumber;
    private generateFingerprint;
}

declare class KalshiHunter implements BaseHunterSource {
    source: "kalshi";
    private config;
    constructor(config: HunterConfig);
    hunt(): Promise<RawDiscovery[]>;
    transform(raw: RawDiscovery): HuntDiscovery;
    private fetchMarkets;
    private filterMarkets;
    private marketToRawDiscovery;
    private categorize;
    private extractTags;
    private hasKeywords;
    private formatNumber;
    private generateFingerprint;
}

declare class FREDHunter implements BaseHunterSource {
    source: "fred";
    private config;
    private apiKey;
    constructor(config: HunterConfig);
    hunt(): Promise<RawDiscovery[]>;
    transform(raw: RawDiscovery): HuntDiscovery;
    private fetchSeries;
    private analyzeSeriesData;
    private getSignal;
    private extractTags;
    private generateFingerprint;
}

declare class SECHunter implements BaseHunterSource {
    source: "sec";
    private config;
    constructor(config: HunterConfig);
    hunt(): Promise<RawDiscovery[]>;
    transform(raw: RawDiscovery): HuntDiscovery;
    private fetchCompanyFilings;
    private fetchLatestForm4s;
    private filterRecentFilings;
    private filingToRawDiscovery;
    private getFormDescription;
    private getFormEmoji;
    private getFormImportance;
    private categorize;
    private extractTags;
    private isCryptoRelated;
    private isInterestingCompany;
    private isHighValueFiling;
    private hasKeywords;
    private generateFingerprint;
}

declare class FinnhubHunter implements BaseHunterSource {
    source: "finnhub";
    private config;
    private apiKey;
    constructor(config: HunterConfig);
    hunt(): Promise<RawDiscovery[]>;
    transform(raw: RawDiscovery): HuntDiscovery;
    private fetchCongressTrades;
    private fetchInsiderTransactions;
    private fetchEarningsSurprises;
    private congressTradeToDiscovery;
    private insiderToDiscovery;
    private earningsToDiscovery;
    private categorize;
    private extractTags;
    private isCryptoRelated;
    private isAIRelated;
    private isRecent;
    private getDateString;
    private formatNumber;
    private generateFingerprint;
}

declare class NPMHunter implements BaseHunterSource {
    source: "npm";
    private config;
    constructor(config: HunterConfig);
    hunt(): Promise<RawDiscovery[]>;
    transform(raw: RawDiscovery): HuntDiscovery;
    private fetchDownloads;
    private fetchPackageInfo;
    private calculateTrend;
    private createDiscovery;
    private categorize;
    private extractTags;
    private hasKeywords;
    private formatNumber;
    private generateFingerprint;
}

/**
 * RSS Hunter - Aggregated news feeds from crypto, AI, and tech sources
 *
 * No API key required. Parses RSS/Atom feeds from multiple sources.
 *
 * Categories:
 * - Crypto News: CoinDesk, The Block, Decrypt, CryptoSlate
 * - AI/Tech News: TechCrunch, Ars Technica, Wired, MIT Tech Review
 * - Developer: Dev.to, Hacker Noon, InfoQ
 * - Market: Bloomberg Crypto, Reuters Tech
 */

interface RSSFeed {
    name: string;
    url: string;
    category: "crypto" | "ai" | "tech" | "dev" | "market";
    priority: number;
}
declare const DEFAULT_FEEDS: RSSFeed[];
declare class RSSHunter implements BaseHunterSource {
    source: "rss";
    private config;
    private feeds;
    private seenGuids;
    constructor(config: HunterConfig & {
        feeds?: RSSFeed[];
    });
    hunt(): Promise<RawDiscovery[]>;
    private fetchFeed;
    private createDiscovery;
    private getCategoryEmoji;
    transform(raw: RawDiscovery): HuntDiscovery;
}

export { BinanceHunter, type CMCCoin, type CMCGlobalMetrics, CoinGeckoHunter, CoinMarketCapHunter, DEFAULT_FEEDS, DeFiLlamaHunter, FREDHunter, FearGreedHunter, FinnhubHunter, GeckoTerminalHunter, KalshiHunter, LunarCrushHunter, NPMHunter, PolymarketHunter, type PumpFunCoin, PumpFunHunter, type PumpFunKingOfTheHill, type RSSFeed, RSSHunter, RugCheckHunter, type RugCheckReport, type RugCheckRisk, type RugCheckSummary, type RugCheckTrendingToken, SECHunter, VybeHunter, type VybeTokenBalance, type VybeTokenDetails, type VybeTokenHolder, type VybeTokenTrade, type VybeWalletPnL };
