# @gicm/quantagent

Multi-agent LLM trading signals for crypto - technical analysis meets AI.

## Installation

```bash
npm install @gicm/quantagent
# or
pnpm add @gicm/quantagent
```

## Features

- **Multi-Agent Analysis** - Multiple AI personas analyze trades
- **Technical Indicators** - RSI, MACD, Moving Averages, Bollinger Bands
- **Consensus Scoring** - Weighted voting from multiple agents
- **React Components** - Ready-to-use UI components

## Usage

```typescript
import { QuantAgent, analyze } from "@gicm/quantagent";

const agent = new QuantAgent({
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
});

const signal = await agent.analyze({
  symbol: "SOL/USDC",
  timeframe: "4h",
  indicators: ["rsi", "macd", "bb"],
});

console.log(signal);
// {
//   direction: "long",
//   confidence: 0.78,
//   agents: ["Technical", "Momentum", "Sentiment"],
//   reasoning: "Strong bullish divergence..."
// }
```

## CLI

```bash
# Analyze a trading pair
quantagent analyze SOL/USDC --timeframe 4h

# Get quick signal
quantagent signal BTC/USDC
```

## React Components

```tsx
import { SignalCard, TradingPanel } from "@gicm/quantagent/components";

function App() {
  return <SignalCard symbol="SOL/USDC" />;
}
```

## License

MIT
