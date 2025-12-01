/**
 * LLM Types for gICM Agent Core
 * Enhanced with Opus 4.5 features: effort parameter, extended thinking, tool search
 */

import { z } from "zod";

// =============================================================================
// PROVIDER & MODEL
// =============================================================================

export const LLMProviderSchema = z.enum(["openai", "anthropic", "gemini", "deepseek"]);
export type LLMProvider = z.infer<typeof LLMProviderSchema>;

// =============================================================================
// EFFORT LEVELS (Opus 4.5 exclusive)
// =============================================================================

export const EffortLevelSchema = z.enum(["low", "medium", "high"]);
export type EffortLevel = z.infer<typeof EffortLevelSchema>;

// =============================================================================
// EXTENDED THINKING CONFIG
// =============================================================================

export const ExtendedThinkingSchema = z.object({
  enabled: z.boolean().default(false),
  budgetTokens: z.number().min(1000).max(128000).default(8000),
});
export type ExtendedThinking = z.infer<typeof ExtendedThinkingSchema>;

// =============================================================================
// MAIN LLM CONFIG
// =============================================================================

export const LLMConfigSchema = z.object({
  provider: LLMProviderSchema,
  model: z.string().optional(),
  apiKey: z.string(),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().default(4096),

  // Opus 4.5 features
  effort: EffortLevelSchema.optional(),
  extendedThinking: ExtendedThinkingSchema.optional(),

  // Prompt caching (90% savings)
  promptCaching: z.boolean().optional(),
});
export type LLMConfig = z.infer<typeof LLMConfigSchema>;

// =============================================================================
// MESSAGES
// =============================================================================

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

// =============================================================================
// THINKING BLOCK (from extended thinking)
// =============================================================================

export interface ThinkingBlock {
  type: "thinking";
  thinking: string;
}

// =============================================================================
// RESPONSE
// =============================================================================

export interface LLMResponse {
  content: string;
  thinking?: string; // Extended thinking output
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

// =============================================================================
// CLIENT INTERFACE
// =============================================================================

export interface LLMClient {
  chat(messages: LLMMessage[]): Promise<LLMResponse>;
  complete(prompt: string): Promise<string>;
  getConfig(): LLMConfig;
}
