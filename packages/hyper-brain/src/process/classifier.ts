/**
 * Content Classifier
 *
 * Classifies content by topic, sentiment, and importance.
 */

import { Logger } from "../utils/logger.js";

export interface Classification {
  topics: string[];
  sentiment: number; // -1 to 1
  importance: number; // 0 to 100
  confidence: number; // 0 to 1
}

export class ContentClassifier {
  private logger = new Logger("Classifier");

  // Topic keywords
  private topicKeywords: Record<string, string[]> = {
    crypto: [
      "bitcoin", "ethereum", "solana", "token", "blockchain", "defi", "nft",
      "wallet", "swap", "dex", "memecoin", "pump", "dump", "whale", "airdrop",
    ],
    ai: [
      "llm", "gpt", "claude", "ai", "machine learning", "neural", "model",
      "training", "inference", "agent", "autonomous", "embedding", "transformer",
    ],
    trading: [
      "buy", "sell", "trade", "position", "long", "short", "profit", "loss",
      "entry", "exit", "stop loss", "take profit", "leverage", "margin",
    ],
    development: [
      "code", "build", "deploy", "api", "sdk", "framework", "library",
      "release", "version", "bug", "fix", "feature", "typescript", "python",
    ],
    news: [
      "announce", "launch", "release", "partnership", "funding", "raise",
      "acquisition", "ipo", "regulation", "sec", "government",
    ],
    research: [
      "paper", "study", "research", "analysis", "benchmark", "evaluation",
      "experiment", "results", "arxiv", "findings", "methodology",
    ],
    social: [
      "community", "discord", "telegram", "twitter", "viral", "trending",
      "followers", "engagement", "sentiment", "fud", "fomo",
    ],
  };

  // Sentiment keywords
  private positiveKeywords = [
    "bullish", "moon", "pump", "gain", "profit", "success", "breakthrough",
    "innovative", "amazing", "great", "excellent", "best", "top", "win",
    "growth", "opportunity", "exciting", "impressive", "powerful",
  ];

  private negativeKeywords = [
    "bearish", "dump", "crash", "loss", "scam", "rug", "hack", "exploit",
    "fail", "bad", "worst", "decline", "risk", "warning", "concern",
    "problem", "issue", "bug", "vulnerability", "fear",
  ];

  /**
   * Classify content
   */
  classify(text: string): Classification {
    const lowerText = text.toLowerCase();

    return {
      topics: this.classifyTopics(lowerText),
      sentiment: this.classifySentiment(lowerText),
      importance: this.classifyImportance(text),
      confidence: this.calculateConfidence(text),
    };
  }

  /**
   * Classify topics
   */
  private classifyTopics(text: string): string[] {
    const topics: string[] = [];
    const scores: Record<string, number> = {};

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

    // Get topics with highest scores
    const sorted = Object.entries(scores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

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
  private classifySentiment(text: string): number {
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
  private classifyImportance(text: string): number {
    let score = 50; // Base score

    // Adjust based on content indicators
    const lowerText = text.toLowerCase();

    // High-impact keywords
    if (/\b(breaking|urgent|major|significant|massive)\b/i.test(text)) {
      score += 20;
    }

    // Numbers often indicate concrete information
    if (/\$[\d,]+/.test(text)) score += 10; // Dollar amounts
    if (/\d+%/.test(text)) score += 5; // Percentages
    if (/\d+x\b/.test(text)) score += 5; // Multipliers

    // Specific entities
    if (/\b(Anthropic|OpenAI|Google|Microsoft|Solana|Ethereum)\b/i.test(text)) {
      score += 10;
    }

    // Length (longer content often more substantive)
    if (text.length > 500) score += 5;
    if (text.length > 1000) score += 5;

    // Official announcements
    if (/\b(official|announce|launch|release)\b/i.test(text)) {
      score += 10;
    }

    // Cap at 100
    return Math.min(100, Math.max(0, score));
  }

  /**
   * Calculate classification confidence
   */
  private calculateConfidence(text: string): number {
    // Based on text quality and signals
    let confidence = 0.5;

    // More text = more confident
    if (text.length > 100) confidence += 0.1;
    if (text.length > 500) confidence += 0.1;

    // Clear keywords boost confidence
    const keywordCount = this.countKeywords(text.toLowerCase());
    if (keywordCount > 3) confidence += 0.1;
    if (keywordCount > 7) confidence += 0.1;

    return Math.min(1, confidence);
  }

  /**
   * Count total keywords found
   */
  private countKeywords(text: string): number {
    let count = 0;

    for (const keywords of Object.values(this.topicKeywords)) {
      for (const keyword of keywords) {
        if (text.includes(keyword)) count++;
      }
    }

    return count;
  }
}
