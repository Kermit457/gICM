# @gicm/defi-agent

> AI-powered DeFi analytics - Token analysis, yield optimization, liquidity monitoring

[![npm version](https://badge.fury.io/js/@gicm%2Fdefi-agent.svg)](https://www.npmjs.com/package/@gicm/defi-agent)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Installation

```bash
npm install @gicm/defi-agent
# or
pnpm add @gicm/defi-agent
```

## Features

- **Token Analysis**: Birdeye, DexScreener integration
- **Yield Optimization**: Find best APY opportunities
- **Liquidity Monitoring**: Track pool depths and slippage
- **Risk Scoring**: Evaluate token safety

## Quick Start

```typescript
import { DefiAgent } from "@gicm/defi-agent";

const agent = new DefiAgent({
  providers: ["birdeye", "dexscreener"],
});

const analysis = await agent.run({
  command: "analyze SOL/USDC liquidity",
});
```

## License

MIT - Built by [gICM](https://gicm.dev)
