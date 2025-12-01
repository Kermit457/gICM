import {
  type Scores,
  type RugCheckData,
  type VybeData,
  type MarketData,
  type PumpFunData,
  type Recommendation,
  SCORE_WEIGHTS,
  RECOMMENDATION_THRESHOLDS,
} from "./types.js";

/**
 * Calculate safety score (30% weight)
 * Sources: RugCheck score, mint/freeze authority, holder distribution
 */
export function calculateSafetyScore(
  rugcheck?: RugCheckData,
  vybe?: VybeData
): { score: number; risks: string[] } {
  const risks: string[] = [];
  let score = 50; // Base neutral score

  if (!rugcheck && !vybe) {
    risks.push("No safety data available");
    return { score: 30, risks };
  }

  // RugCheck score (primary factor)
  if (rugcheck?.score !== undefined) {
    score = rugcheck.score;

    if (rugcheck.rugged) {
      risks.push("TOKEN RUGGED");
      return { score: 0, risks };
    }

    if (rugcheck.mintAuthority) {
      score -= 15;
      risks.push("Mint authority enabled");
    }

    if (rugcheck.freezeAuthority) {
      score -= 10;
      risks.push("Freeze authority enabled");
    }

    if (!rugcheck.lpLocked) {
      score -= 10;
      risks.push("Liquidity not locked");
    }

    if (rugcheck.topHoldersPercent && rugcheck.topHoldersPercent > 50) {
      score -= 15;
      risks.push(`Top holders own ${rugcheck.topHoldersPercent.toFixed(1)}%`);
    }

    if (rugcheck.risks) {
      risks.push(...rugcheck.risks);
    }
  }

  // Vybe concentration data (supplement)
  if (vybe?.concentrationRisk === "high") {
    score -= 10;
    if (!risks.some((r) => r.includes("holder"))) {
      risks.push("High holder concentration");
    }
  }

  if (vybe?.topHolderPercent && vybe.topHolderPercent > 30) {
    score -= 5;
    if (!risks.some((r) => r.includes("holder"))) {
      risks.push(`Single wallet owns ${vybe.topHolderPercent.toFixed(1)}%`);
    }
  }

  return { score: Math.max(0, Math.min(100, score)), risks };
}

/**
 * Calculate fundamentals score (25% weight)
 * Sources: Market cap, liquidity, volume, age
 */
export function calculateFundamentalsScore(
  market?: MarketData,
  pumpfun?: PumpFunData
): number {
  if (!market && !pumpfun) return 40; // Neutral when no data

  let score = 50;

  // Market cap tier
  const marketCap = market?.marketCap || pumpfun?.marketCap || 0;
  if (marketCap > 10_000_000) score += 20; // >$10M
  else if (marketCap > 1_000_000) score += 15; // >$1M
  else if (marketCap > 100_000) score += 10; // >$100K
  else if (marketCap > 10_000) score += 5; // >$10K
  else score -= 5; // Very low mcap

  // Liquidity
  if (market?.liquidity) {
    if (market.liquidity > 500_000) score += 15;
    else if (market.liquidity > 100_000) score += 10;
    else if (market.liquidity > 10_000) score += 5;
    else score -= 10; // Low liquidity = high slippage
  }

  // Volume relative to mcap (healthy = 10-50%)
  if (market?.volume24h && marketCap > 0) {
    const volumeRatio = market.volume24h / marketCap;
    if (volumeRatio > 0.1 && volumeRatio < 0.5) score += 10;
    else if (volumeRatio > 0.5) score += 5; // High but possibly wash trading
    else score -= 5; // Low activity
  }

  // Bonding curve progress (PumpFun)
  if (pumpfun?.bondingCurveProgress !== undefined) {
    if (pumpfun.bondingCurveProgress >= 100 || pumpfun.complete) {
      score += 10; // Graduated to Raydium
    } else if (pumpfun.bondingCurveProgress > 50) {
      score += 5; // Good progress
    }
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate momentum score (20% weight)
 * Sources: Price change 24h, volume spike, trending
 */
export function calculateMomentumScore(market?: MarketData): number {
  if (!market) return 50; // Neutral

  let score = 50;

  // Price change 24h
  const priceChange = market.priceChange24h || 0;
  if (priceChange > 50) score += 25; // >50% up
  else if (priceChange > 20) score += 15; // >20% up
  else if (priceChange > 5) score += 10; // >5% up
  else if (priceChange > 0) score += 5; // Slightly up
  else if (priceChange > -10) score -= 5; // Slightly down
  else if (priceChange > -30) score -= 15; // Significant drop
  else score -= 25; // Major dump

  // 7-day trend (if available)
  if (market.priceChange7d !== undefined) {
    if (market.priceChange7d > 100) score += 10;
    else if (market.priceChange7d > 0) score += 5;
    else if (market.priceChange7d < -50) score -= 10;
  }

  // Distance from ATH
  if (market.athChangePercent !== undefined) {
    if (market.athChangePercent > -10) score += 5; // Near ATH
    else if (market.athChangePercent < -90) score -= 10; // 90%+ down from ATH
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate on-chain score (15% weight)
 * Sources: Vybe holder count, whale %, tx count
 */
export function calculateOnChainScore(vybe?: VybeData): number {
  if (!vybe) return 50; // Neutral

  let score = 50;

  // Holder count
  if (vybe.holders !== undefined) {
    if (vybe.holders > 10000) score += 20;
    else if (vybe.holders > 1000) score += 15;
    else if (vybe.holders > 100) score += 10;
    else if (vybe.holders > 10) score += 5;
    else score -= 10; // Very few holders
  }

  // Top 10 concentration
  if (vybe.top10Percent !== undefined) {
    if (vybe.top10Percent < 30) score += 15; // Well distributed
    else if (vybe.top10Percent < 50) score += 5;
    else if (vybe.top10Percent > 70) score -= 15; // Very concentrated
    else score -= 5;
  }

  // Whale count
  if (vybe.whaleCount !== undefined) {
    if (vybe.whaleCount === 0) score += 10; // No whales
    else if (vybe.whaleCount <= 2) score += 5;
    else if (vybe.whaleCount > 5) score -= 10; // Many whales
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate sentiment score (10% weight)
 * Sources: Social presence, community size
 */
export function calculateSentimentScore(pumpfun?: PumpFunData): number {
  if (!pumpfun) return 50; // Neutral

  let score = 50;

  // Social links presence
  if (pumpfun.twitter) score += 15;
  if (pumpfun.telegram) score += 10;
  if (pumpfun.website) score += 10;

  // Description quality
  if (pumpfun.description) {
    if (pumpfun.description.length > 100) score += 10;
    else if (pumpfun.description.length > 20) score += 5;
  }

  // Image/branding
  if (pumpfun.imageUri) score += 5;

  // Penalize no socials
  if (!pumpfun.twitter && !pumpfun.telegram && !pumpfun.website) {
    score -= 20;
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate overall weighted score
 */
export function calculateOverallScore(scores: Omit<Scores, "overall">): number {
  const overall =
    scores.safety * SCORE_WEIGHTS.safety +
    scores.fundamentals * SCORE_WEIGHTS.fundamentals +
    scores.momentum * SCORE_WEIGHTS.momentum +
    scores.onChain * SCORE_WEIGHTS.onChain +
    scores.sentiment * SCORE_WEIGHTS.sentiment;

  return Math.round(overall * 10) / 10; // Round to 1 decimal
}

/**
 * Get recommendation based on overall score and risks
 */
export function getRecommendation(
  overallScore: number,
  risks: string[]
): Recommendation {
  // Critical risks override score
  const criticalRisks = risks.filter(
    (r) =>
      r.includes("RUGGED") ||
      r.includes("Mint authority") ||
      r.includes("No safety data")
  );

  if (criticalRisks.length > 0 && overallScore < 70) {
    return "AVOID";
  }

  // Score-based recommendation
  if (overallScore >= RECOMMENDATION_THRESHOLDS.STRONG_BUY) return "STRONG_BUY";
  if (overallScore >= RECOMMENDATION_THRESHOLDS.BUY) return "BUY";
  if (overallScore >= RECOMMENDATION_THRESHOLDS.HOLD) return "HOLD";
  if (overallScore >= RECOMMENDATION_THRESHOLDS.SELL) return "SELL";
  return "AVOID";
}

/**
 * Calculate confidence based on data availability
 */
export function calculateConfidence(sources: {
  rugcheck?: unknown;
  pumpfun?: unknown;
  vybe?: unknown;
  market?: unknown;
}): number {
  let available = 0;
  let total = 4;

  if (sources.rugcheck) available++;
  if (sources.pumpfun) available++;
  if (sources.vybe) available++;
  if (sources.market) available++;

  // Base confidence on data availability
  const dataConfidence = available / total;

  // Minimum confidence floor
  return Math.max(0.3, dataConfidence);
}
