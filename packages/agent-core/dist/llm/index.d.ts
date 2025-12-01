import { z } from 'zod';

/**
 * LLM Types for gICM Agent Core
 * Enhanced with Opus 4.5 features: effort parameter, extended thinking, tool search
 */

declare const LLMProviderSchema: z.ZodEnum<["openai", "anthropic", "gemini", "deepseek"]>;
type LLMProvider = z.infer<typeof LLMProviderSchema>;
declare const EffortLevelSchema: z.ZodEnum<["low", "medium", "high"]>;
type EffortLevel = z.infer<typeof EffortLevelSchema>;
declare const ExtendedThinkingSchema: z.ZodObject<{
    enabled: z.ZodDefault<z.ZodBoolean>;
    budgetTokens: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    enabled: boolean;
    budgetTokens: number;
}, {
    enabled?: boolean | undefined;
    budgetTokens?: number | undefined;
}>;
type ExtendedThinking = z.infer<typeof ExtendedThinkingSchema>;
declare const LLMConfigSchema: z.ZodObject<{
    provider: z.ZodEnum<["openai", "anthropic", "gemini", "deepseek"]>;
    model: z.ZodOptional<z.ZodString>;
    apiKey: z.ZodString;
    temperature: z.ZodDefault<z.ZodNumber>;
    maxTokens: z.ZodDefault<z.ZodNumber>;
    effort: z.ZodOptional<z.ZodEnum<["low", "medium", "high"]>>;
    extendedThinking: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        budgetTokens: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        budgetTokens: number;
    }, {
        enabled?: boolean | undefined;
        budgetTokens?: number | undefined;
    }>>;
    promptCaching: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    apiKey: string;
    temperature: number;
    maxTokens: number;
    provider: "openai" | "anthropic" | "gemini" | "deepseek";
    model?: string | undefined;
    effort?: "low" | "medium" | "high" | undefined;
    extendedThinking?: {
        enabled: boolean;
        budgetTokens: number;
    } | undefined;
    promptCaching?: boolean | undefined;
}, {
    apiKey: string;
    provider: "openai" | "anthropic" | "gemini" | "deepseek";
    temperature?: number | undefined;
    maxTokens?: number | undefined;
    model?: string | undefined;
    effort?: "low" | "medium" | "high" | undefined;
    extendedThinking?: {
        enabled?: boolean | undefined;
        budgetTokens?: number | undefined;
    } | undefined;
    promptCaching?: boolean | undefined;
}>;
type LLMConfig = z.infer<typeof LLMConfigSchema>;
interface LLMMessage {
    role: "system" | "user" | "assistant";
    content: string;
}
interface ThinkingBlock {
    type: "thinking";
    thinking: string;
}
interface LLMResponse {
    content: string;
    thinking?: string;
    usage?: {
        promptTokens: number;
        completionTokens: number;
        thinkingTokens?: number;
        cachedTokens?: number;
        totalTokens: number;
    };
    finishReason?: string;
    model?: string;
    latencyMs?: number;
}
interface LLMClient {
    chat(messages: LLMMessage[]): Promise<LLMResponse>;
    complete(prompt: string): Promise<string>;
    getConfig(): LLMConfig;
}

/**
 * Universal LLM Client for gICM
 * Enhanced with Opus 4.5 features: effort parameter, extended thinking, prompt caching
 */

declare class UniversalLLMClient implements LLMClient {
    private config;
    private model;
    constructor(config: LLMConfig);
    getConfig(): LLMConfig;
    chat(messages: LLMMessage[]): Promise<LLMResponse>;
    complete(prompt: string): Promise<string>;
    private chatOpenAI;
    private chatAnthropic;
    private chatGemini;
    private chatDeepSeek;
}
declare function createLLMClient(config: LLMConfig): LLMClient;
/**
 * Create a client optimized for fast, cheap responses
 */
declare function createTurboClient(apiKey: string): LLMClient;
/**
 * Create a client optimized for complex reasoning with Opus 4.5
 */
declare function createPowerClient(apiKey: string): LLMClient;
/**
 * Create a balanced client for everyday use
 */
declare function createBalancedClient(apiKey: string): LLMClient;
interface ProviderConfig {
    provider: LLMProvider;
    apiKey: string;
    model?: string;
    weight?: number;
    costPer1kTokens?: number;
}
interface RotationStrategy {
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
declare class RotatingLLMClient implements LLMClient {
    private providers;
    private providerConfigs;
    private strategy;
    private stats;
    private currentIndex;
    private baseConfig;
    constructor(providers: ProviderConfig[], strategy?: RotationStrategy, baseConfig?: Partial<LLMConfig>);
    getConfig(): LLMConfig;
    chat(messages: LLMMessage[]): Promise<LLMResponse>;
    complete(prompt: string): Promise<string>;
    private getProviderOrder;
    private roundRobinOrder;
    private weightedOrder;
    private costOptimizedOrder;
    private latencyOptimizedOrder;
    /**
     * Get current provider statistics
     */
    getStats(): Record<string, ProviderStats>;
    /**
     * Reset all statistics
     */
    resetStats(): void;
}
/**
 * Create a rotating client from environment variables
 * Reads: ANTHROPIC_API_KEY, GEMINI_API_KEY, DEEPSEEK_API_KEY, OPENAI_API_KEY
 */
declare function createRotatingClient(strategy?: RotationStrategy, baseConfig?: Partial<LLMConfig>): RotatingLLMClient;
/**
 * Create a brain client that smartly rotates between all available providers
 * Uses cost-optimized strategy by default (DeepSeek/Gemini first, Claude for complex tasks)
 */
declare function createBrainClient(baseConfig?: Partial<LLMConfig>): RotatingLLMClient;

export { type EffortLevel, EffortLevelSchema, type ExtendedThinking, ExtendedThinkingSchema, type LLMClient, type LLMConfig, LLMConfigSchema, type LLMMessage, type LLMProvider, LLMProviderSchema, type LLMResponse, type ProviderConfig, RotatingLLMClient, type RotationStrategy, type ThinkingBlock, UniversalLLMClient, createBalancedClient, createBrainClient, createLLMClient, createPowerClient, createRotatingClient, createTurboClient };
