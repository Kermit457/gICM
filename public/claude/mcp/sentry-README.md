# Sentry MCP

Error tracking and performance monitoring integration.

## Overview

The Sentry MCP provides comprehensive error tracking, performance monitoring, and issue management. Monitor production errors, analyze performance bottlenecks, and debug issues faster with full stack traces and context.

## Installation

```bash
npx -y @sentry/mcp-server
```

## Environment Variables

```bash
SENTRY_DSN=https://xxxxxxxxxxxxxxxxxxxxx@oXXXXXX.ingest.sentry.io/XXXXXXX
SENTRY_AUTH_TOKEN=sntrys_xxxxxxxxxxxxxxxxxxxxx
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=your-project-slug
```

Get your DSN and auth token from: https://sentry.io/settings/

## Features

- **Error Tracking**: Real-time error capturing with full context
- **Performance Monitoring**: Transaction traces, slow queries, bottleneck detection
- **Release Tracking**: Deploy tracking, regression detection
- **Issue Management**: Triage, assign, resolve issues
- **Source Maps**: JavaScript/TypeScript error deobfuscation
- **Breadcrumbs**: User action trails leading to errors
- **Custom Context**: Add blockchain-specific metadata

## Usage Examples

### Capture Smart Contract Errors

```typescript
import * as Sentry from '@sentry/node';

try {
  const tx = await program.methods.launchToken(params).rpc();
} catch (error) {
  Sentry.captureException(error, {
    contexts: {
      blockchain: {
        program: program.programId.toString(),
        wallet: wallet.publicKey.toString(),
        cluster: "mainnet-beta"
      }
    },
    tags: {
      transaction_type: "token_launch",
      network: "solana"
    }
  });
  throw error;
}
```

### Monitor RPC Performance

```typescript
const transaction = Sentry.startTransaction({
  name: "Fetch Token Metadata",
  op: "blockchain.rpc"
});

try {
  const metadata = await connection.getAccountInfo(mintAddress);
  transaction.setData("account_size", metadata.data.length);
} finally {
  transaction.finish();
}
```

### Track Deployment

```typescript
// Create release before deployment
await sentry.createRelease({
  version: "1.2.0",
  projects: ["token-launcher"],
  refs: [{
    repository: "org/repo",
    commit: "abc123def456"
  }]
});

// Mark deployed
await sentry.finalizeRelease("1.2.0");
```

## Tools Provided

- `sentry_list_issues` - Query recent errors
- `sentry_get_issue` - Get issue details with stack trace
- `sentry_resolve_issue` - Mark issue as resolved
- `sentry_create_release` - Create deployment release
- `sentry_list_transactions` - Performance transaction data
- `sentry_set_user_feedback` - Add user feedback to errors

## Error Context Best Practices

**Blockchain Transactions:**
```typescript
Sentry.setContext("transaction", {
  signature: tx.signature,
  slot: tx.slot,
  fee: tx.fee,
  computeUnits: tx.computeUnits
});
```

**Wallet Operations:**
```typescript
Sentry.setUser({
  id: wallet.publicKey.toString(),
  wallet_type: "Phantom"
});
```

**DeFi Operations:**
```typescript
Sentry.setContext("defi", {
  protocol: "Raydium",
  pool: poolAddress.toString(),
  swap_amount: amount.toString(),
  slippage: "1%"
});
```

## Integration Patterns

**Next.js API Routes:**
```typescript
import { withSentry } from '@sentry/nextjs';

export default withSentry(async (req, res) => {
  // Automatic error capture
  const data = await fetchBlockchainData();
  res.json(data);
});
```

**React Error Boundaries:**
```typescript
<Sentry.ErrorBoundary fallback={<ErrorFallback />}>
  <WalletConnectButton />
</Sentry.ErrorBoundary>
```

## Web3-Specific Features

- **Transaction tracing**: Full RPC call sequences
- **Gas profiling**: Track gas usage patterns
- **Network errors**: RPC timeout detection
- **Wallet errors**: Connection and signing failures
- **Smart contract reverts**: Capture revert reasons

## Repository

https://github.com/getsentry/mcp-server

---

**Version:** 1.0.0
**Category:** Monitoring & Observability
**Last Updated:** 2025-01-08
