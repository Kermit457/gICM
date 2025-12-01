/**
 * Universal LLM Client for gICM
 * Enhanced with Opus 4.5 features: effort parameter, extended thinking, prompt caching
 */

import type { LLMClient, LLMConfig, LLMMessage, LLMResponse, EffortLevel, LLMProvider } from "./types.js";

// =============================================================================
// RESPONSE INTERFACES
// =============================================================================

interface OpenAIResponse {
  choices: Array<{ message: { content: string }; finish_reason?: string }>;
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  model?: string;
}

interface AnthropicContentBlock {
  type: "text" | "thinking";
  text?: string;
  thinking?: string;
}

interface AnthropicResponse {
  content: AnthropicContentBlock[];
  usage?: {
    input_tokens: number;
    output_tokens: number;
    cache_creation_input_tokens?: number;
    cache_read_input_tokens?: number;
  };
  stop_reason?: string;
  model?: string;
}

interface GeminiResponse {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number; totalTokenCount?: number };
}

interface DeepSeekResponse {
  choices: Array<{ message: { content: string }; finish_reason?: string }>;
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  model?: string;
}

// =============================================================================
// DEFAULT MODELS
// =============================================================================

const DEFAULT_MODELS: Record<string, string> = {
  openai: "gpt-4o",
  anthropic: "claude-opus-4-5-20251101",
  gemini: "gemini-2.0-flash",
  deepseek: "deepseek-chat",
};

// Effort parameter max tokens adjustment
const EFFORT_MAX_TOKENS: Record<EffortLevel, number> = {
  low: 2048,
  medium: 8192,
  high: 32000,
};

// =============================================================================
// UNIVERSAL LLM CLIENT
// =============================================================================

export class UniversalLLMClient implements LLMClient {
  private config: LLMConfig;
  private model: string;

  constructor(config: LLMConfig) {
    this.config = config;
    this.model = config.model ?? DEFAULT_MODELS[config.provider];
  }

  getConfig(): LLMConfig {
    return { ...this.config };
  }

  async chat(messages: LLMMessage[]): Promise<LLMResponse> {
    const startTime = Date.now();

    let response: LLMResponse;
    switch (this.config.provider) {
      case "openai":
        response = await this.chatOpenAI(messages);
        break;
      case "anthropic":
        response = await this.chatAnthropic(messages);
        break;
      case "gemini":
        response = await this.chatGemini(messages);
        break;
      case "deepseek":
        response = await this.chatDeepSeek(messages);
        break;
      default:
        throw new Error(`Unsupported provider: ${this.config.provider}`);
    }

    response.latencyMs = Date.now() - startTime;
    return response;
  }

  async complete(prompt: string): Promise<string> {
    const response = await this.chat([{ role: "user", content: prompt }]);
    return response.content;
  }

  // ===========================================================================
  // OPENAI
  // ===========================================================================

  private async chatOpenAI(messages: LLMMessage[]): Promise<LLMResponse> {
    const maxTokens = this.config.effort
      ? EFFORT_MAX_TOKENS[this.config.effort]
      : this.config.maxTokens;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: this.config.temperature,
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const data = (await response.json()) as OpenAIResponse;
    return {
      content: data.choices[0].message.content,
      usage: {
        promptTokens: data.usage?.prompt_tokens ?? 0,
        completionTokens: data.usage?.completion_tokens ?? 0,
        totalTokens: data.usage?.total_tokens ?? 0,
      },
      finishReason: data.choices[0].finish_reason,
      model: data.model,
    };
  }

  // ===========================================================================
  // ANTHROPIC (with Opus 4.5 features)
  // ===========================================================================

  private async chatAnthropic(messages: LLMMessage[]): Promise<LLMResponse> {
    const systemMessage = messages.find((m) => m.role === "system");
    const userMessages = messages.filter((m) => m.role !== "system");

    // Build request body
    const body: Record<string, unknown> = {
      model: this.model,
      max_tokens: this.config.maxTokens,
      messages: userMessages.map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      })),
    };

    // System prompt with optional caching
    if (systemMessage) {
      if (this.config.promptCaching) {
        body.system = [
          {
            type: "text",
            text: systemMessage.content,
            cache_control: { type: "ephemeral" },
          },
        ];
      } else {
        body.system = systemMessage.content;
      }
    }

    // Extended thinking (Opus 4.5 feature)
    if (this.config.extendedThinking?.enabled) {
      body.thinking = {
        type: "enabled",
        budget_tokens: this.config.extendedThinking.budgetTokens,
      };
      // Extended thinking requires temperature 1
      body.temperature = 1;
    } else {
      body.temperature = this.config.temperature;
    }

    // Build headers
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "x-api-key": this.config.apiKey,
      "anthropic-version": "2023-06-01",
    };

    // Enable prompt caching beta
    if (this.config.promptCaching) {
      headers["anthropic-beta"] = "prompt-caching-2024-07-31";
    }

    // Enable extended thinking beta
    if (this.config.extendedThinking?.enabled) {
      const existingBeta = headers["anthropic-beta"];
      headers["anthropic-beta"] = existingBeta
        ? `${existingBeta},interleaved-thinking-2025-05-14`
        : "interleaved-thinking-2025-05-14";
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${response.status} - ${error}`);
    }

    const data = (await response.json()) as AnthropicResponse;

    // Extract text and thinking from content blocks
    let content = "";
    let thinking = "";

    for (const block of data.content) {
      if (block.type === "text" && block.text) {
        content += block.text;
      } else if (block.type === "thinking" && block.thinking) {
        thinking += block.thinking;
      }
    }

    // Calculate tokens
    const inputTokens = data.usage?.input_tokens ?? 0;
    const outputTokens = data.usage?.output_tokens ?? 0;
    const cachedTokens =
      (data.usage?.cache_read_input_tokens ?? 0) +
      (data.usage?.cache_creation_input_tokens ?? 0);

    return {
      content,
      thinking: thinking || undefined,
      usage: {
        promptTokens: inputTokens,
        completionTokens: outputTokens,
        cachedTokens: cachedTokens || undefined,
        totalTokens: inputTokens + outputTokens,
      },
      finishReason: data.stop_reason,
      model: data.model,
    };
  }

  // ===========================================================================
  // GEMINI
  // ===========================================================================

  private async chatGemini(messages: LLMMessage[]): Promise<LLMResponse> {
    const systemMessage = messages.find((m) => m.role === "system");
    const contents = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

    const maxTokens = this.config.effort
      ? EFFORT_MAX_TOKENS[this.config.effort]
      : this.config.maxTokens;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.config.apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        systemInstruction: systemMessage
          ? { parts: [{ text: systemMessage.content }] }
          : undefined,
        generationConfig: {
          temperature: this.config.temperature,
          maxOutputTokens: maxTokens,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${error}`);
    }

    const data = (await response.json()) as GeminiResponse;
    return {
      content: data.candidates?.[0]?.content?.parts?.[0]?.text ?? "",
      usage: {
        promptTokens: data.usageMetadata?.promptTokenCount ?? 0,
        completionTokens: data.usageMetadata?.candidatesTokenCount ?? 0,
        totalTokens: data.usageMetadata?.totalTokenCount ?? 0,
      },
      model: this.model,
    };
  }

  // ===========================================================================
  // DEEPSEEK
  // ===========================================================================

  private async chatDeepSeek(messages: LLMMessage[]): Promise<LLMResponse> {
    const maxTokens = this.config.effort
      ? EFFORT_MAX_TOKENS[this.config.effort]
      : this.config.maxTokens;

    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: this.config.temperature,
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`DeepSeek API error: ${response.status} - ${error}`);
    }

    const data = (await response.json()) as DeepSeekResponse;
    return {
      content: data.choices[0].message.content,
      usage: {
        promptTokens: data.usage?.prompt_tokens ?? 0,
        completionTokens: data.usage?.completion_tokens ?? 0,
        totalTokens: data.usage?.total_tokens ?? 0,
      },
      finishReason: data.choices[0].finish_reason,
      model: data.model,
    };
  }
}

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

export function createLLMClient(config: LLMConfig): LLMClient {
  return new UniversalLLMClient(config);
}

// =============================================================================
// QUICK HELPERS
// =============================================================================

/**
 * Create a client optimized for fast, cheap responses
 */
export function createTurboClient(apiKey: string): LLMClient {
  return new UniversalLLMClient({
    provider: "anthropic",
    model: "claude-haiku-3-5-20241022",
    apiKey,
    temperature: 0.3,
    maxTokens: 2048,
    effort: "low",
  });
}

/**
 * Create a client optimized for complex reasoning with Opus 4.5
 */
export function createPowerClient(apiKey: string): LLMClient {
  return new UniversalLLMClient({
    provider: "anthropic",
    model: "claude-opus-4-5-20251101",
    apiKey,
    temperature: 0.5,
    maxTokens: 16384,
    effort: "high",
    extendedThinking: {
      enabled: true,
      budgetTokens: 16000,
    },
    promptCaching: true,
  });
}

/**
 * Create a balanced client for everyday use
 */
export function createBalancedClient(apiKey: string): LLMClient {
  return new UniversalLLMClient({
    provider: "anthropic",
    model: "claude-sonnet-4-20250514",
    apiKey,
    temperature: 0.7,
    maxTokens: 8192,
    effort: "medium",
    promptCaching: true,
  });
}

// =============================================================================
// MULTI-PROVIDER ROTATION CLIENT
// =============================================================================

export interface ProviderConfig {
  provider: LLMProvider;
  apiKey: string;
  model?: string;
  weight?: number; // 1-10, higher = more frequent selection
  costPer1kTokens?: number; // For cost optimization
}

export interface RotationStrategy {
  type: "round-robin" | "weighted" | "cost-optimized" | "latency-optimized";
  fallbackOrder?: LLMProvider[];
}

interface ProviderStats {
  successCount: number;
  failCount: number;
  totalLatencyMs: number;
  lastUsed: number;
  lastError?: string;
}

/**
 * Smart multi-provider LLM client with rotation and fallback
 * Supports: Claude (Anthropic), Gemini (Google), DeepSeek, OpenAI
 */
export class RotatingLLMClient implements LLMClient {
  private providers: Map<LLMProvider, UniversalLLMClient> = new Map();
  private providerConfigs: ProviderConfig[];
  private strategy: RotationStrategy;
  private stats: Map<LLMProvider, ProviderStats> = new Map();
  private currentIndex = 0;
  private baseConfig: Partial<LLMConfig>;

  constructor(
    providers: ProviderConfig[],
    strategy: RotationStrategy = { type: "round-robin" },
    baseConfig: Partial<LLMConfig> = {}
  ) {
    this.providerConfigs = providers;
    this.strategy = strategy;
    this.baseConfig = baseConfig;

    // Initialize clients for each provider
    for (const config of providers) {
      const client = new UniversalLLMClient({
        provider: config.provider,
        apiKey: config.apiKey,
        model: config.model,
        temperature: baseConfig.temperature ?? 0.7,
        maxTokens: baseConfig.maxTokens ?? 4096,
        effort: baseConfig.effort,
        extendedThinking: baseConfig.extendedThinking,
        promptCaching: baseConfig.promptCaching,
      });
      this.providers.set(config.provider, client);
      this.stats.set(config.provider, {
        successCount: 0,
        failCount: 0,
        totalLatencyMs: 0,
        lastUsed: 0,
      });
    }
  }

  getConfig(): LLMConfig {
    const firstProvider = this.providerConfigs[0];
    return {
      provider: firstProvider.provider,
      apiKey: firstProvider.apiKey,
      model: firstProvider.model,
      temperature: this.baseConfig.temperature ?? 0.7,
      maxTokens: this.baseConfig.maxTokens ?? 4096,
    };
  }

  async chat(messages: LLMMessage[]): Promise<LLMResponse> {
    const orderedProviders = this.getProviderOrder();

    for (const provider of orderedProviders) {
      const client = this.providers.get(provider);
      if (!client) continue;

      try {
        const startTime = Date.now();
        const response = await client.chat(messages);
        const latency = Date.now() - startTime;

        // Update stats
        const stats = this.stats.get(provider)!;
        stats.successCount++;
        stats.totalLatencyMs += latency;
        stats.lastUsed = Date.now();

        // Add provider info to response
        response.model = `${provider}:${response.model}`;
        return response;
      } catch (error) {
        // Update failure stats
        const stats = this.stats.get(provider)!;
        stats.failCount++;
        stats.lastError = error instanceof Error ? error.message : String(error);

        // Try next provider
        continue;
      }
    }

    throw new Error("All providers failed. Check API keys and quotas.");
  }

  async complete(prompt: string): Promise<string> {
    const response = await this.chat([{ role: "user", content: prompt }]);
    return response.content;
  }

  private getProviderOrder(): LLMProvider[] {
    const providers = this.providerConfigs.map((c) => c.provider);

    switch (this.strategy.type) {
      case "round-robin":
        return this.roundRobinOrder(providers);
      case "weighted":
        return this.weightedOrder();
      case "cost-optimized":
        return this.costOptimizedOrder();
      case "latency-optimized":
        return this.latencyOptimizedOrder();
      default:
        return providers;
    }
  }

  private roundRobinOrder(providers: LLMProvider[]): LLMProvider[] {
    const result = [...providers];
    // Rotate array based on current index
    const rotated = [...result.slice(this.currentIndex), ...result.slice(0, this.currentIndex)];
    this.currentIndex = (this.currentIndex + 1) % providers.length;
    return rotated;
  }

  private weightedOrder(): LLMProvider[] {
    // Sort by weight (higher first), with successful providers prioritized
    return [...this.providerConfigs]
      .sort((a, b) => {
        const statsA = this.stats.get(a.provider)!;
        const statsB = this.stats.get(b.provider)!;
        const weightA = (a.weight ?? 5) * (statsA.failCount > 3 ? 0.5 : 1);
        const weightB = (b.weight ?? 5) * (statsB.failCount > 3 ? 0.5 : 1);
        return weightB - weightA;
      })
      .map((c) => c.provider);
  }

  private costOptimizedOrder(): LLMProvider[] {
    // DeepSeek and Gemini are typically cheapest
    const costOrder: Record<string, number> = {
      deepseek: 1,
      gemini: 2,
      anthropic: 3,
      openai: 4,
    };
    return [...this.providerConfigs]
      .sort((a, b) => {
        const costA = a.costPer1kTokens ?? costOrder[a.provider] ?? 5;
        const costB = b.costPer1kTokens ?? costOrder[b.provider] ?? 5;
        return costA - costB;
      })
      .map((c) => c.provider);
  }

  private latencyOptimizedOrder(): LLMProvider[] {
    return [...this.providerConfigs]
      .sort((a, b) => {
        const statsA = this.stats.get(a.provider)!;
        const statsB = this.stats.get(b.provider)!;
        const avgA = statsA.successCount > 0 ? statsA.totalLatencyMs / statsA.successCount : 9999;
        const avgB = statsB.successCount > 0 ? statsB.totalLatencyMs / statsB.successCount : 9999;
        return avgA - avgB;
      })
      .map((c) => c.provider);
  }

  /**
   * Get current provider statistics
   */
  getStats(): Record<string, ProviderStats> {
    const result: Record<string, ProviderStats> = {};
    for (const [provider, stats] of this.stats) {
      result[provider] = { ...stats };
    }
    return result;
  }

  /**
   * Reset all statistics
   */
  resetStats(): void {
    for (const [provider] of this.stats) {
      this.stats.set(provider, {
        successCount: 0,
        failCount: 0,
        totalLatencyMs: 0,
        lastUsed: 0,
      });
    }
  }
}

// =============================================================================
// ROTATION CLIENT FACTORY
// =============================================================================

/**
 * Create a rotating client from environment variables
 * Reads: ANTHROPIC_API_KEY, GEMINI_API_KEY, DEEPSEEK_API_KEY, OPENAI_API_KEY
 */
export function createRotatingClient(
  strategy: RotationStrategy = { type: "cost-optimized" },
  baseConfig: Partial<LLMConfig> = {}
): RotatingLLMClient {
  const providers: ProviderConfig[] = [];

  // Check for each provider's API key in environment
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  const deepseekKey = process.env.DEEPSEEK_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (anthropicKey) {
    providers.push({
      provider: "anthropic",
      apiKey: anthropicKey,
      weight: 8,
      costPer1kTokens: 15, // Opus pricing
    });
  }

  if (geminiKey) {
    providers.push({
      provider: "gemini",
      apiKey: geminiKey,
      weight: 7,
      costPer1kTokens: 0, // Free tier
    });
  }

  if (deepseekKey) {
    providers.push({
      provider: "deepseek",
      apiKey: deepseekKey,
      weight: 6,
      costPer1kTokens: 0.14, // Very cheap
    });
  }

  if (openaiKey) {
    providers.push({
      provider: "openai",
      apiKey: openaiKey,
      weight: 7,
      costPer1kTokens: 5, // GPT-4o pricing
    });
  }

  if (providers.length === 0) {
    throw new Error(
      "No LLM API keys found. Set at least one of: ANTHROPIC_API_KEY, GEMINI_API_KEY, DEEPSEEK_API_KEY, OPENAI_API_KEY"
    );
  }

  return new RotatingLLMClient(providers, strategy, baseConfig);
}

/**
 * Create a brain client that smartly rotates between all available providers
 * Uses cost-optimized strategy by default (DeepSeek/Gemini first, Claude for complex tasks)
 */
export function createBrainClient(baseConfig: Partial<LLMConfig> = {}): RotatingLLMClient {
  return createRotatingClient({ type: "cost-optimized" }, {
    temperature: 0.7,
    maxTokens: 8192,
    ...baseConfig,
  });
}
