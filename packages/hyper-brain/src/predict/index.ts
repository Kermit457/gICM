/**
 * Prediction Engine
 *
 * Generates predictions based on patterns and knowledge.
 */

import Anthropic from "@anthropic-ai/sdk";
import { Logger } from "../utils/logger.js";
import { StorageOrchestrator } from "../store/index.js";
import { RetrievalSystem } from "../retrieve/index.js";
import { LearningSystem } from "../learn/index.js";
import type { Prediction, Pattern, KnowledgeItem, PredictionType } from "../types/index.js";

export class PredictionEngine {
  private storage: StorageOrchestrator;
  private retrieval: RetrievalSystem;
  private learning: LearningSystem;
  private anthropic: Anthropic | null = null;
  private logger = new Logger("Prediction");

  constructor(
    storage: StorageOrchestrator,
    retrieval: RetrievalSystem,
    learning: LearningSystem
  ) {
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
  async predict(type: PredictionType, count: number = 5): Promise<Prediction[]> {
    const predictions: Prediction[] = [];

    switch (type) {
      case "market":
        predictions.push(...(await this.predictMarket(count)));
        break;
      case "content":
        predictions.push(...(await this.predictContent(count)));
        break;
      case "product":
        predictions.push(...(await this.predictProduct(count)));
        break;
      case "agent":
        predictions.push(...(await this.predictAgent(count)));
        break;
    }

    // Store predictions
    for (const prediction of predictions) {
      this.storage.storePrediction(prediction);
    }

    return predictions;
  }

  /**
   * Generate market predictions
   */
  private async predictMarket(count: number): Promise<Prediction[]> {
    const predictions: Prediction[] = [];

    // Get recent crypto knowledge
    const cryptoKnowledge = this.retrieval.getByTopic("crypto", 50);
    const patterns = this.storage.getAllPatterns().filter((p) =>
      p.name.toLowerCase().includes("crypto") || p.name.toLowerCase().includes("token")
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
      // Simple rule-based prediction
      const sentiment = this.calculateAverageSentiment(cryptoKnowledge);
      predictions.push(this.createSimplePrediction(
        "market",
        sentiment > 0.2 ? "Market sentiment is bullish, expect upward momentum" :
        sentiment < -0.2 ? "Market sentiment is bearish, expect downward pressure" :
        "Market sentiment is neutral, expect sideways movement",
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
  private async predictContent(count: number): Promise<Prediction[]> {
    const predictions: Prediction[] = [];

    // Get recent knowledge
    const knowledge = this.retrieval.getRecent(50);
    const patterns = this.storage.getAllPatterns();

    // Find trending topics
    const topicCounts: Map<string, number> = new Map();
    for (const item of knowledge) {
      for (const topic of item.topics) {
        topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
      }
    }

    const sortedTopics = Array.from(topicCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    for (const [topic, count] of sortedTopics) {
      predictions.push(this.createSimplePrediction(
        "content",
        `"${topic}" content will continue to trend`,
        Math.min(count / 20, 0.9),
        patterns.filter((p) => p.name.includes(topic)).map((p) => p.id),
        []
      ));
    }

    return predictions.slice(0, count);
  }

  /**
   * Generate product predictions
   */
  private async predictProduct(count: number): Promise<Prediction[]> {
    const predictions: Prediction[] = [];

    // Get product-related knowledge
    const productKnowledge = this.retrieval.getByTopic("development", 30);
    const aiKnowledge = this.retrieval.getByTopic("ai", 30);
    const combined = [...productKnowledge, ...aiKnowledge];

    // Analyze trends
    const techMentions: Map<string, number> = new Map();
    for (const item of combined) {
      for (const entity of item.entities) {
        if (entity.type === "technology") {
          techMentions.set(entity.name, (techMentions.get(entity.name) || 0) + 1);
        }
      }
    }

    const trendingTech = Array.from(techMentions.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

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
  private async predictAgent(count: number): Promise<Prediction[]> {
    // Predict agent performance based on patterns
    const patternStats = this.learning.getPatternStats();
    const predictions: Prediction[] = [];

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
  private async generateLLMPrediction(
    type: PredictionType,
    knowledge: KnowledgeItem[],
    patterns: Pattern[],
    prompt: string
  ): Promise<Prediction | null> {
    if (!this.anthropic) return null;

    try {
      const context = knowledge
        .slice(0, 10)
        .map((k) => `- ${k.content.summary} (${k.source.name}, sentiment: ${k.sentiment.toFixed(2)})`)
        .join("\n");

      const patternContext = patterns
        .slice(0, 5)
        .map((p) => `- ${p.name}: ${p.description} (accuracy: ${(p.accuracy * 100).toFixed(0)}%)`)
        .join("\n");

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
}`,
          },
        ],
      });

      const content = response.content[0];
      if (content.type === "text") {
        const jsonMatch = content.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]) as {
            outcome: string;
            probability: number;
            confidence: number;
            reasoning: string;
          };

          return {
            id: `pred-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            type,
            prediction: {
              outcome: parsed.outcome,
              probability: parsed.probability,
              confidence: parsed.confidence,
              timeframe: Date.now() + 24 * 60 * 60 * 1000, // 24h
            },
            basis: {
              patterns: patterns.slice(0, 3).map((p) => p.id),
              knowledge: knowledge.slice(0, 5).map((k) => k.id),
              reasoning: parsed.reasoning,
            },
            madeAt: Date.now(),
            expiresAt: Date.now() + 24 * 60 * 60 * 1000,
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
  private createSimplePrediction(
    type: PredictionType,
    outcome: string,
    probability: number,
    patternIds: string[],
    knowledgeIds: string[]
  ): Prediction {
    return {
      id: `pred-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type,
      prediction: {
        outcome,
        probability,
        confidence: Math.round(probability * 80), // Simple confidence mapping
        timeframe: Date.now() + 24 * 60 * 60 * 1000,
      },
      basis: {
        patterns: patternIds,
        knowledge: knowledgeIds,
        reasoning: "Rule-based prediction from pattern analysis",
      },
      madeAt: Date.now(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    };
  }

  /**
   * Calculate average sentiment
   */
  private calculateAverageSentiment(items: KnowledgeItem[]): number {
    if (items.length === 0) return 0;
    return items.reduce((sum, item) => sum + item.sentiment, 0) / items.length;
  }

  /**
   * Evaluate pending predictions
   */
  async evaluatePredictions(): Promise<{ evaluated: number; correct: number }> {
    const pending = this.storage.getPendingPredictions();
    const now = Date.now();
    let evaluated = 0;
    let correct = 0;

    for (const prediction of pending) {
      if (prediction.expiresAt < now) {
        // Prediction expired, evaluate based on current data
        const isCorrect = await this.evaluatePrediction(prediction);
        this.storage.updatePredictionOutcome(prediction.id, {
          correct: isCorrect,
          actual: isCorrect ? prediction.prediction.outcome : "Different outcome observed",
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
  private async evaluatePrediction(prediction: Prediction): Promise<boolean> {
    // Simple evaluation - check if prediction matches current data trends
    // In production, this would be more sophisticated
    return Math.random() > 0.3; // Placeholder
  }

  /**
   * Get prediction statistics
   */
  getStats(): {
    total: number;
    correct: number;
    accuracy: number;
    pending: number;
  } {
    const predictions = this.storage.getAllPredictions();
    const evaluated = predictions.filter((p) => p.outcome);
    const correct = evaluated.filter((p) => p.outcome?.correct).length;

    return {
      total: predictions.length,
      correct,
      accuracy: evaluated.length > 0 ? correct / evaluated.length : 0,
      pending: predictions.length - evaluated.length,
    };
  }
}
