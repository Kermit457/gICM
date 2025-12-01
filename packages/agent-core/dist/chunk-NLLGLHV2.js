// src/llm/types.ts
import { z } from "zod";
var LLMProviderSchema = z.enum(["openai", "anthropic", "gemini", "deepseek"]);
var EffortLevelSchema = z.enum(["low", "medium", "high"]);
var ExtendedThinkingSchema = z.object({
  enabled: z.boolean().default(false),
  budgetTokens: z.number().min(1e3).max(128e3).default(8e3)
});
var LLMConfigSchema = z.object({
  provider: LLMProviderSchema,
  model: z.string().optional(),
  apiKey: z.string(),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().default(4096),
  // Opus 4.5 features
  effort: EffortLevelSchema.optional(),
  extendedThinking: ExtendedThinkingSchema.optional(),
  // Prompt caching (90% savings)
  promptCaching: z.boolean().optional()
});

// src/llm/client.ts
var DEFAULT_MODELS = {
  openai: "gpt-4o",
  anthropic: "claude-opus-4-5-20251101",
  gemini: "gemini-2.0-flash",
  deepseek: "deepseek-chat"
};
var EFFORT_MAX_TOKENS = {
  low: 2048,
  medium: 8192,
  high: 32e3
};
var UniversalLLMClient = class {
  config;
  model;
  constructor(config) {
    this.config = config;
    this.model = config.model ?? DEFAULT_MODELS[config.provider];
  }
  getConfig() {
    return { ...this.config };
  }
  async chat(messages) {
    const startTime = Date.now();
    let response;
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
  async complete(prompt) {
    const response = await this.chat([{ role: "user", content: prompt }]);
    return response.content;
  }
  // ===========================================================================
  // OPENAI
  // ===========================================================================
  async chatOpenAI(messages) {
    const maxTokens = this.config.effort ? EFFORT_MAX_TOKENS[this.config.effort] : this.config.maxTokens;
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: this.config.temperature,
        max_tokens: maxTokens
      })
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }
    const data = await response.json();
    return {
      content: data.choices[0].message.content,
      usage: {
        promptTokens: data.usage?.prompt_tokens ?? 0,
        completionTokens: data.usage?.completion_tokens ?? 0,
        totalTokens: data.usage?.total_tokens ?? 0
      },
      finishReason: data.choices[0].finish_reason,
      model: data.model
    };
  }
  // ===========================================================================
  // ANTHROPIC (with Opus 4.5 features)
  // ===========================================================================
  async chatAnthropic(messages) {
    const systemMessage = messages.find((m) => m.role === "system");
    const userMessages = messages.filter((m) => m.role !== "system");
    const body = {
      model: this.model,
      max_tokens: this.config.maxTokens,
      messages: userMessages.map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content
      }))
    };
    if (systemMessage) {
      if (this.config.promptCaching) {
        body.system = [
          {
            type: "text",
            text: systemMessage.content,
            cache_control: { type: "ephemeral" }
          }
        ];
      } else {
        body.system = systemMessage.content;
      }
    }
    if (this.config.extendedThinking?.enabled) {
      body.thinking = {
        type: "enabled",
        budget_tokens: this.config.extendedThinking.budgetTokens
      };
      body.temperature = 1;
    } else {
      body.temperature = this.config.temperature;
    }
    const headers = {
      "Content-Type": "application/json",
      "x-api-key": this.config.apiKey,
      "anthropic-version": "2023-06-01"
    };
    if (this.config.promptCaching) {
      headers["anthropic-beta"] = "prompt-caching-2024-07-31";
    }
    if (this.config.extendedThinking?.enabled) {
      const existingBeta = headers["anthropic-beta"];
      headers["anthropic-beta"] = existingBeta ? `${existingBeta},interleaved-thinking-2025-05-14` : "interleaved-thinking-2025-05-14";
    }
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers,
      body: JSON.stringify(body)
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${response.status} - ${error}`);
    }
    const data = await response.json();
    let content = "";
    let thinking = "";
    for (const block of data.content) {
      if (block.type === "text" && block.text) {
        content += block.text;
      } else if (block.type === "thinking" && block.thinking) {
        thinking += block.thinking;
      }
    }
    const inputTokens = data.usage?.input_tokens ?? 0;
    const outputTokens = data.usage?.output_tokens ?? 0;
    const cachedTokens = (data.usage?.cache_read_input_tokens ?? 0) + (data.usage?.cache_creation_input_tokens ?? 0);
    return {
      content,
      thinking: thinking || void 0,
      usage: {
        promptTokens: inputTokens,
        completionTokens: outputTokens,
        cachedTokens: cachedTokens || void 0,
        totalTokens: inputTokens + outputTokens
      },
      finishReason: data.stop_reason,
      model: data.model
    };
  }
  // ===========================================================================
  // GEMINI
  // ===========================================================================
  async chatGemini(messages) {
    const systemMessage = messages.find((m) => m.role === "system");
    const contents = messages.filter((m) => m.role !== "system").map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }]
    }));
    const maxTokens = this.config.effort ? EFFORT_MAX_TOKENS[this.config.effort] : this.config.maxTokens;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.config.apiKey}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        systemInstruction: systemMessage ? { parts: [{ text: systemMessage.content }] } : void 0,
        generationConfig: {
          temperature: this.config.temperature,
          maxOutputTokens: maxTokens
        }
      })
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${error}`);
    }
    const data = await response.json();
    return {
      content: data.candidates?.[0]?.content?.parts?.[0]?.text ?? "",
      usage: {
        promptTokens: data.usageMetadata?.promptTokenCount ?? 0,
        completionTokens: data.usageMetadata?.candidatesTokenCount ?? 0,
        totalTokens: data.usageMetadata?.totalTokenCount ?? 0
      },
      model: this.model
    };
  }
  // ===========================================================================
  // DEEPSEEK
  // ===========================================================================
  async chatDeepSeek(messages) {
    const maxTokens = this.config.effort ? EFFORT_MAX_TOKENS[this.config.effort] : this.config.maxTokens;
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: this.config.temperature,
        max_tokens: maxTokens
      })
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`DeepSeek API error: ${response.status} - ${error}`);
    }
    const data = await response.json();
    return {
      content: data.choices[0].message.content,
      usage: {
        promptTokens: data.usage?.prompt_tokens ?? 0,
        completionTokens: data.usage?.completion_tokens ?? 0,
        totalTokens: data.usage?.total_tokens ?? 0
      },
      finishReason: data.choices[0].finish_reason,
      model: data.model
    };
  }
};
function createLLMClient(config) {
  return new UniversalLLMClient(config);
}
function createTurboClient(apiKey) {
  return new UniversalLLMClient({
    provider: "anthropic",
    model: "claude-haiku-3-5-20241022",
    apiKey,
    temperature: 0.3,
    maxTokens: 2048,
    effort: "low"
  });
}
function createPowerClient(apiKey) {
  return new UniversalLLMClient({
    provider: "anthropic",
    model: "claude-opus-4-5-20251101",
    apiKey,
    temperature: 0.5,
    maxTokens: 16384,
    effort: "high",
    extendedThinking: {
      enabled: true,
      budgetTokens: 16e3
    },
    promptCaching: true
  });
}
function createBalancedClient(apiKey) {
  return new UniversalLLMClient({
    provider: "anthropic",
    model: "claude-sonnet-4-20250514",
    apiKey,
    temperature: 0.7,
    maxTokens: 8192,
    effort: "medium",
    promptCaching: true
  });
}
var RotatingLLMClient = class {
  providers = /* @__PURE__ */ new Map();
  providerConfigs;
  strategy;
  stats = /* @__PURE__ */ new Map();
  currentIndex = 0;
  baseConfig;
  constructor(providers, strategy = { type: "round-robin" }, baseConfig = {}) {
    this.providerConfigs = providers;
    this.strategy = strategy;
    this.baseConfig = baseConfig;
    for (const config of providers) {
      const client = new UniversalLLMClient({
        provider: config.provider,
        apiKey: config.apiKey,
        model: config.model,
        temperature: baseConfig.temperature ?? 0.7,
        maxTokens: baseConfig.maxTokens ?? 4096,
        effort: baseConfig.effort,
        extendedThinking: baseConfig.extendedThinking,
        promptCaching: baseConfig.promptCaching
      });
      this.providers.set(config.provider, client);
      this.stats.set(config.provider, {
        successCount: 0,
        failCount: 0,
        totalLatencyMs: 0,
        lastUsed: 0
      });
    }
  }
  getConfig() {
    const firstProvider = this.providerConfigs[0];
    return {
      provider: firstProvider.provider,
      apiKey: firstProvider.apiKey,
      model: firstProvider.model,
      temperature: this.baseConfig.temperature ?? 0.7,
      maxTokens: this.baseConfig.maxTokens ?? 4096
    };
  }
  async chat(messages) {
    const orderedProviders = this.getProviderOrder();
    for (const provider of orderedProviders) {
      const client = this.providers.get(provider);
      if (!client) continue;
      try {
        const startTime = Date.now();
        const response = await client.chat(messages);
        const latency = Date.now() - startTime;
        const stats = this.stats.get(provider);
        stats.successCount++;
        stats.totalLatencyMs += latency;
        stats.lastUsed = Date.now();
        response.model = `${provider}:${response.model}`;
        return response;
      } catch (error) {
        const stats = this.stats.get(provider);
        stats.failCount++;
        stats.lastError = error instanceof Error ? error.message : String(error);
        continue;
      }
    }
    throw new Error("All providers failed. Check API keys and quotas.");
  }
  async complete(prompt) {
    const response = await this.chat([{ role: "user", content: prompt }]);
    return response.content;
  }
  getProviderOrder() {
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
  roundRobinOrder(providers) {
    const result = [...providers];
    const rotated = [...result.slice(this.currentIndex), ...result.slice(0, this.currentIndex)];
    this.currentIndex = (this.currentIndex + 1) % providers.length;
    return rotated;
  }
  weightedOrder() {
    return [...this.providerConfigs].sort((a, b) => {
      const statsA = this.stats.get(a.provider);
      const statsB = this.stats.get(b.provider);
      const weightA = (a.weight ?? 5) * (statsA.failCount > 3 ? 0.5 : 1);
      const weightB = (b.weight ?? 5) * (statsB.failCount > 3 ? 0.5 : 1);
      return weightB - weightA;
    }).map((c) => c.provider);
  }
  costOptimizedOrder() {
    const costOrder = {
      deepseek: 1,
      gemini: 2,
      anthropic: 3,
      openai: 4
    };
    return [...this.providerConfigs].sort((a, b) => {
      const costA = a.costPer1kTokens ?? costOrder[a.provider] ?? 5;
      const costB = b.costPer1kTokens ?? costOrder[b.provider] ?? 5;
      return costA - costB;
    }).map((c) => c.provider);
  }
  latencyOptimizedOrder() {
    return [...this.providerConfigs].sort((a, b) => {
      const statsA = this.stats.get(a.provider);
      const statsB = this.stats.get(b.provider);
      const avgA = statsA.successCount > 0 ? statsA.totalLatencyMs / statsA.successCount : 9999;
      const avgB = statsB.successCount > 0 ? statsB.totalLatencyMs / statsB.successCount : 9999;
      return avgA - avgB;
    }).map((c) => c.provider);
  }
  /**
   * Get current provider statistics
   */
  getStats() {
    const result = {};
    for (const [provider, stats] of this.stats) {
      result[provider] = { ...stats };
    }
    return result;
  }
  /**
   * Reset all statistics
   */
  resetStats() {
    for (const [provider] of this.stats) {
      this.stats.set(provider, {
        successCount: 0,
        failCount: 0,
        totalLatencyMs: 0,
        lastUsed: 0
      });
    }
  }
};
function createRotatingClient(strategy = { type: "cost-optimized" }, baseConfig = {}) {
  const providers = [];
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  const deepseekKey = process.env.DEEPSEEK_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  if (anthropicKey) {
    providers.push({
      provider: "anthropic",
      apiKey: anthropicKey,
      weight: 8,
      costPer1kTokens: 15
      // Opus pricing
    });
  }
  if (geminiKey) {
    providers.push({
      provider: "gemini",
      apiKey: geminiKey,
      weight: 7,
      costPer1kTokens: 0
      // Free tier
    });
  }
  if (deepseekKey) {
    providers.push({
      provider: "deepseek",
      apiKey: deepseekKey,
      weight: 6,
      costPer1kTokens: 0.14
      // Very cheap
    });
  }
  if (openaiKey) {
    providers.push({
      provider: "openai",
      apiKey: openaiKey,
      weight: 7,
      costPer1kTokens: 5
      // GPT-4o pricing
    });
  }
  if (providers.length === 0) {
    throw new Error(
      "No LLM API keys found. Set at least one of: ANTHROPIC_API_KEY, GEMINI_API_KEY, DEEPSEEK_API_KEY, OPENAI_API_KEY"
    );
  }
  return new RotatingLLMClient(providers, strategy, baseConfig);
}
function createBrainClient(baseConfig = {}) {
  return createRotatingClient({ type: "cost-optimized" }, {
    temperature: 0.7,
    maxTokens: 8192,
    ...baseConfig
  });
}

export {
  LLMProviderSchema,
  EffortLevelSchema,
  ExtendedThinkingSchema,
  LLMConfigSchema,
  UniversalLLMClient,
  createLLMClient,
  createTurboClient,
  createPowerClient,
  createBalancedClient,
  RotatingLLMClient,
  createRotatingClient,
  createBrainClient
};
//# sourceMappingURL=chunk-NLLGLHV2.js.map