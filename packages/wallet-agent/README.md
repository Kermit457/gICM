# @gicm/wallet-agent

> AI-powered wallet operations - Natural language transactions via Coinbase AgentKit & Solana Agent Kit

[![npm version](https://badge.fury.io/js/@gicm%2Fwallet-agent.svg)](https://www.npmjs.com/package/@gicm/wallet-agent)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Installation

```bash
npm install @gicm/wallet-agent
# or
pnpm add @gicm/wallet-agent
```

## Features

- **Multi-Chain Support**: Solana and EVM chains
- **Natural Language**: "Swap 1 SOL for USDC" style commands
- **Coinbase AgentKit**: Enterprise-grade EVM operations
- **Solana Agent Kit**: Native Solana transactions
- **Type-Safe**: Full TypeScript with Zod validation

## Quick Start

```typescript
import { WalletAgent } from "@gicm/wallet-agent";

const agent = new WalletAgent({
  chain: "solana",
  // privateKey from env
});

// Execute natural language command
const result = await agent.run({
  command: "swap 1 SOL for USDC on Jupiter",
});

console.log(result.txHash);
```

## Supported Operations

| Operation | Description |
|-----------|-------------|
| `swap` | Token swaps via DEX aggregators |
| `transfer` | Send tokens to addresses |
| `balance` | Check wallet balances |
| `stake` | Stake SOL or tokens |
| `bridge` | Cross-chain transfers |

## License

MIT - Built by [gICM](https://gicm.dev)
