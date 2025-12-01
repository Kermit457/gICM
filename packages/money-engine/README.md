# @gicm/money-engine

> Self-funding DeFi engine for the gICM platform

[![npm version](https://badge.fury.io/js/@gicm%2Fmoney-engine.svg)](https://www.npmjs.com/package/@gicm/money-engine)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Installation

```bash
npm install @gicm/money-engine
# or
pnpm add @gicm/money-engine
```

## Features

- **Treasury Management**: SOL/USDC balances and allocations
- **DCA Trading Bots**: Paper, micro, and live trading modes
- **Expense Tracking**: Auto-pay for infrastructure costs
- **Risk Management**: Position sizing and stop-losses

## Quick Start

```typescript
import { MoneyEngine } from "@gicm/money-engine";

const engine = new MoneyEngine({
  mode: "paper", // paper | micro | live
  dcaConfig: {
    asset: "SOL",
    amount: 10,
    schedule: "0 */4 * * *", // Every 4 hours
  },
});

await engine.start();
```

## CLI Commands

```bash
gicm-money start     # Start the engine
gicm-money status    # Show financial status
gicm-money expenses  # Show expense breakdown
gicm-money trade     # Trigger manual DCA
```

## License

MIT - Built by [gICM](https://gicm.dev)
