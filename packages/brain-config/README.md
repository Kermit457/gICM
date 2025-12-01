# @gicm/brain-config

> Claude Opus 4.5 optimization toolkit - Save up to 85% on tokens while maintaining quality

[![npm version](https://badge.fury.io/js/@gicm%2Fbrain-config.svg)](https://www.npmjs.com/package/@gicm/brain-config)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Installation

```bash
npm install @gicm/brain-config
# or
pnpm add @gicm/brain-config
# or
yarn add @gicm/brain-config
```

## Why This Package?

Claude Opus 4.5 introduced powerful new features for token efficiency:
- **Effort Parameter**: Control token usage vs quality tradeoff (up to 76% savings)
- **Extended Thinking**: Deep reasoning with budget control
- **Prompt Caching**: Cache system prompts for 90% savings
- **Tool Search**: Dynamic tool loading to reduce context

This package provides a type-safe way to configure these features with pre-built presets for common use cases.

## Quick Start

```typescript
import { BrainManager, PRESET_BALANCED } from "@gicm/brain-config";

// Create a brain manager with the balanced preset
const brain = new BrainManager(PRESET_BALANCED.config);

// Get configuration for API calls
const config = brain.getConfig();
console.log(config.effort);     // "medium"
console.log(config.model);      // "claude-sonnet-4-20250514"
```

## Presets

10 pre-configured presets optimized for different use cases:

### Efficiency Presets

| Preset | Model | Effort | Token Savings | Best For |
|--------|-------|--------|---------------|----------|
| `PRESET_TURBO` | Haiku 3.5 | low | ~85% | Quick queries, simple tasks |
| `PRESET_BALANCED` | Sonnet 4 | medium | ~50% | Daily coding, research |
| `PRESET_POWERHOUSE` | Opus 4.5 | high | - | Complex reasoning, architecture |

### Use Case Presets

| Preset | Description | Key Features |
|--------|-------------|--------------|
| `PRESET_TRADING` | DeFi trading decisions | Low temperature, memory enabled |
| `PRESET_HUNTER` | Opportunity discovery | Batch processing, tool search |
| `PRESET_BUILDER` | Code generation | Extended thinking, high quality |
| `PRESET_GROWTH` | Content/marketing | Creative temperature, batching |
| `PRESET_AUTONOMY` | Autonomous operations | Safety-focused, audit logging |

### Special Presets

| Preset | Description |
|--------|-------------|
| `PRESET_DEEP_RESEARCH` | 1M token context for codebase analysis |
| `PRESET_ULTRA_SAVER` | Maximum cost savings (~95%) |

## Usage Examples

### Apply a Preset

```typescript
import { BrainManager, PRESET_TRADING } from "@gicm/brain-config";

const brain = new BrainManager();
brain.applyPreset("trading");

// Or initialize with preset
const tradingBrain = new BrainManager(PRESET_TRADING.config);
```

### Custom Configuration

```typescript
import { BrainManager } from "@gicm/brain-config";

const brain = new BrainManager({
  provider: "anthropic",
  model: "claude-opus-4-5-20251101",
  effort: "medium",
  temperature: 0.5,
  maxTokens: 16384,
  extendedThinking: {
    enabled: true,
    budgetTokens: 16000,
    preserveHistory: true,
  },
  promptCaching: {
    enabled: true,
    minCacheableTokens: 1024,
  },
  budget: {
    enabled: true,
    dailyLimitUSD: 20,
    monthlyLimitUSD: 200,
    alertThreshold: 0.8,
    pauseOnLimit: false,
  },
});
```

### Track Usage & Costs

```typescript
const brain = new BrainManager();

// Record usage after API calls
brain.recordUsage({
  requestId: "req_123",
  timestamp: new Date(),
  model: "claude-opus-4-5-20251101",
  effort: "medium",
  inputTokens: 5000,
  outputTokens: 1500,
  latencyMs: 2300,
});

// Get aggregated metrics
const dailyStats = brain.getAggregatedMetrics("day");
console.log(`Total cost: $${dailyStats.totalCostUSD.toFixed(2)}`);
console.log(`Tokens saved: ${dailyStats.totalTokensSaved}`);

// Check budget status
const budget = brain.getCurrentBudgetStatus();
console.log(`Daily: ${budget.daily.percent.toFixed(1)}% used`);
```

### Cost Estimation

```typescript
import { BrainManager, MODEL_PRICING } from "@gicm/brain-config";

const brain = new BrainManager();

// Estimate cost before making a call
const estimatedCost = brain.estimateCost(
  10000,  // input tokens
  2000,   // output tokens
  "claude-opus-4-5-20251101",
  { thinking: 5000 }  // optional thinking tokens
);

console.log(`Estimated cost: $${estimatedCost.toFixed(4)}`);

// Estimate savings from effort optimization
const savings = brain.estimateSavings(
  10000, 2000, "high", "medium"
);
console.log(`Switching to medium effort saves ${savings.percentSaved}%`);
```

### Event Handling

```typescript
const brain = new BrainManager();

brain.on("config:updated", (config) => {
  console.log("Config changed:", config.model);
});

brain.on("budget:warning", (used, limit, type) => {
  console.log(`${type} budget at ${(used/limit*100).toFixed(1)}%`);
});

brain.on("budget:exceeded", (used, limit, type) => {
  console.log(`${type} budget exceeded!`);
});

brain.on("usage:recorded", (metrics) => {
  console.log(`Request cost: $${metrics.costUSD.toFixed(4)}`);
});
```

## Integration with Anthropic SDK

```typescript
import Anthropic from "@anthropic-ai/sdk";
import { BrainManager, PRESET_POWERHOUSE } from "@gicm/brain-config";

const brain = new BrainManager(PRESET_POWERHOUSE.config);
const config = brain.getConfig();

const client = new Anthropic();

const response = await client.messages.create({
  model: config.model,
  max_tokens: config.maxTokens,
  temperature: config.extendedThinking?.enabled ? 1 : config.temperature,
  thinking: config.extendedThinking?.enabled
    ? { type: "enabled", budget_tokens: config.extendedThinking.budgetTokens }
    : undefined,
  system: config.promptCaching?.enabled
    ? [{ type: "text", text: "Your system prompt...", cache_control: { type: "ephemeral" } }]
    : "Your system prompt...",
  messages: [{ role: "user", content: "Hello!" }],
});

// Record usage
brain.recordUsage({
  requestId: response.id,
  timestamp: new Date(),
  model: response.model,
  effort: config.effort,
  inputTokens: response.usage.input_tokens,
  outputTokens: response.usage.output_tokens,
  latencyMs: 0, // Add your timing
});
```

## API Reference

### BrainConfig

```typescript
interface BrainConfig {
  // Model selection
  provider: "anthropic" | "openai" | "gemini";
  model: string;

  // Token efficiency
  effort: "low" | "medium" | "high";
  temperature: number;  // 0-2
  maxTokens: number;

  // Advanced features
  extendedThinking?: {
    enabled: boolean;
    budgetTokens: number;  // 1000-128000
    preserveHistory: boolean;
  };

  promptCaching?: {
    enabled: boolean;
    minCacheableTokens: number;
  };

  memory?: {
    enabled: boolean;
    provider: "local" | "redis" | "supabase";
    maxEntries: number;
    ttlSeconds: number;
    autoSummarize: boolean;
  };

  budget?: {
    enabled: boolean;
    dailyLimitUSD: number;
    monthlyLimitUSD: number;
    alertThreshold: number;  // 0.5-1
    pauseOnLimit: boolean;
  };
}
```

### BrainManager Methods

| Method | Description |
|--------|-------------|
| `getConfig()` | Get current configuration |
| `updateConfig(updates)` | Update configuration |
| `applyPreset(presetId)` | Apply a preset by ID |
| `recordUsage(metrics)` | Record API usage |
| `getUsageMetrics()` | Get usage history |
| `getAggregatedMetrics(period)` | Get aggregated stats |
| `getCurrentBudgetStatus()` | Get budget usage |
| `estimateCost(...)` | Estimate API cost |
| `estimateSavings(...)` | Estimate savings |

## Model Pricing (Built-in)

```typescript
import { MODEL_PRICING } from "@gicm/brain-config";

// Prices per 1M tokens
MODEL_PRICING["claude-opus-4-5-20251101"]    // $5 input, $25 output
MODEL_PRICING["claude-sonnet-4-20250514"]    // $3 input, $15 output
MODEL_PRICING["claude-haiku-3-5-20241022"]   // $0.25 input, $1.25 output
MODEL_PRICING["gpt-4o"]                       // $2.5 input, $10 output
MODEL_PRICING["gemini-2.0-flash"]            // $0.075 input, $0.3 output
```

## Effort Level Guide

| Level | Token Multiplier | Use Case |
|-------|------------------|----------|
| `low` | 0.25x | Simple queries, formatting, validation |
| `medium` | 0.5x | Daily coding, research, documentation |
| `high` | 1.0x | Complex reasoning, architecture, audits |

**Recommendation**: Start with `medium` (default) and only use `high` when you need maximum quality.

## License

MIT - Built by [gICM](https://gicm.dev)
