# Web3 Multi-Chain MCP Server

Single MCP to interact with multiple blockchains: Ethereum, Solana, TON, Cardano, XRP.

## Overview

Unified interface for cross-chain operations. Supports EVM chains (Ethereum, Base, Arbitrum, BSC, Polygon, Avalanche) and non-EVM chains.

## Installation

```bash
npx gicm-stack add mcp/web3-multichain
```

## Environment Variables

```bash
# EVM Chains
ETH_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
BASE_RPC_URL=https://mainnet.base.org
ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc

# Solana
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com

# Private keys (for signing)
PRIVATE_KEY=0x...
```

## Features

- Multi-chain RPC endpoints
- Wallet balance queries
- Transaction history
- Smart contract interactions
- Cross-chain bridging support

## Usage

```javascript
// Get ETH balance
const balance = await getBalance("ethereum", "0x742d35...")

// Query Solana wallet
const solBalance = await getBalance("solana", "DYw8j...")

// Get transaction
const tx = await getTransaction("base", "0xabc123...")
```

## GitHub

https://github.com/strangelove-ventures/web3-mcp

---

**Version:** 1.0.0
