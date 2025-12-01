# @gicm/backtester

Trading strategy backtester with Monte Carlo simulation and risk analytics.

## Installation

```bash
npm install @gicm/backtester
# or
pnpm add @gicm/backtester
```

## Features

- **Strategy Testing** - Backtest trading strategies against historical data
- **Risk Analytics** - Sharpe ratio, max drawdown, win rate calculations
- **Monte Carlo** - Statistical simulation for strategy validation
- **CLI Tool** - Command-line interface for quick backtests

## Usage

```typescript
import { Backtester, Strategy } from "@gicm/backtester";

const strategy: Strategy = {
  name: "Simple MA Crossover",
  entry: (data) => data.sma20 > data.sma50,
  exit: (data) => data.sma20 < data.sma50,
};

const backtester = new Backtester();
const results = await backtester.run({
  strategy,
  data: priceData,
  initialCapital: 10000,
});

console.log(results.metrics);
// { sharpeRatio: 1.5, maxDrawdown: -12%, winRate: 58% }
```

## CLI

```bash
# Run backtest
gicm-backtest --strategy ma-crossover --pair SOL/USDC

# Monte Carlo simulation
gicm-backtest --monte-carlo --iterations 1000
```

## License

MIT
