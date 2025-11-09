# Solana Agent Kit MCP

Solana-specific blockchain operations and program interactions.

## Overview

Specialized MCP for Solana blockchain operations. Supports SPL tokens, NFTs, program interactions, and transaction building.

## Installation

```bash
npx gicm-stack add mcp/solana-agent-kit
```

## Environment Variables

```bash
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
SOLANA_WALLET_PRIVATE_KEY=your_private_key_base58
```

## Features

- SPL token operations
- NFT minting and transfers
- Program-derived addresses (PDAs)
- Transaction building and signing
- Anchor program interactions

## Usage

```javascript
// Get SOL balance
const balance = await getSolBalance("DYw8j...")

// Transfer SOL
await transferSol(recipientAddress, amountInLamports)

// Mint NFT
await mintNFT(metadata)

// Invoke Anchor program
await invokeProgram(programId, instruction, accounts)
```

## Tools

- `solana_get_balance`
- `solana_transfer`
- `solana_get_token_accounts`
- `solana_invoke_program`

---

**Version:** 1.0.0
