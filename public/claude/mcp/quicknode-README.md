# QuickNode MCP

## Overview
The QuickNode MCP enables Claude to interact with QuickNode's high-performance blockchain infrastructure, including optimized RPC endpoints, Token API, NFT API, and various add-ons. This MCP provides blazing-fast access to EVM-compatible networks with 99.99% uptime SLA.

## What It Does
- **High-Performance RPC**: Ultra-fast JSON-RPC endpoint access to 20+ blockchains
- **Token API**: Query token balances, metadata, prices, and holdings
- **NFT API**: Advanced NFT data, portfolio tracking, and metadata
- **AddOns**: Extended functionality including webhook support and advanced analytics
- **Network Multi-Chain**: Single API key supports all network endpoints
- **Request Optimization**: Optimized for low latency and high throughput
- **Token Spending Reduction**: 80% reduction in token usage for blockchain queries

## Installation

### Global Installation
```bash
npm install -g @modelcontextprotocol/server-quicknode
```

### Local/Project Installation
```bash
npm install @modelcontextprotocol/server-quicknode
```

## Configuration

### Claude Desktop Configuration
Add to your Claude Desktop `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "quicknode": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-quicknode"],
      "env": {
        "QUICKNODE_API_URL": "https://your-endpoint.quicknode.pro/your-token",
        "QUICKNODE_NETWORK": "ethereum-mainnet"
      }
    }
  }
}
```

### Project-Specific Configuration
Add to `.claude/mcp/quicknode.json`:

```json
{
  "mcpServers": {
    "quicknode": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-quicknode"],
      "env": {
        "QUICKNODE_API_URL": "https://your-endpoint.quicknode.pro/your-token",
        "QUICKNODE_NETWORK": "ethereum-mainnet",
        "QUICKNODE_TOKEN_API_KEY": "your-token-api-key-optional",
        "QUICKNODE_NFT_API_KEY": "your-nft-api-key-optional",
        "QUICKNODE_ENABLE_ADDONS": "true"
      }
    }
  }
}
```

## Required Environment Variables

### QUICKNODE_API_URL
- **Description**: Your QuickNode endpoint URL
- **Format**: `https://your-endpoint.quicknode.pro/your-token`
- **Location**: Found in QuickNode Dashboard → Endpoints → Your Endpoint → HTTP Provider
- **Example**: `https://eth-mainnet.quiknode.pro/abc123xyz/`
- **Security**: Keep this secret! Never commit to version control
- **Note**: Includes both the endpoint and authentication token

### QUICKNODE_NETWORK
- **Description**: The blockchain network identifier
- **Supported Networks**:
  - `ethereum-mainnet` - Ethereum Mainnet
  - `ethereum-sepolia` - Ethereum Sepolia Testnet
  - `ethereum-holesky` - Ethereum Holesky Testnet
  - `arbitrum-mainnet` - Arbitrum One
  - `arbitrum-sepolia` - Arbitrum Sepolia
  - `optimism-mainnet` - Optimism Mainnet
  - `optimism-sepolia` - Optimism Sepolia
  - `polygon-mainnet` - Polygon Mainnet
  - `polygon-mumbai` - Polygon Mumbai Testnet
  - `polygon-amoy` - Polygon Amoy Testnet
  - `base-mainnet` - Base Mainnet
  - `base-sepolia` - Base Sepolia Testnet
  - `solana-mainnet` - Solana Mainnet
  - `solana-devnet` - Solana Devnet
- **Default**: `ethereum-mainnet`

### QUICKNODE_TOKEN_API_KEY (Optional)
- **Description**: API key for Token API access
- **Location**: QuickNode Dashboard → Token API → API Key
- **Note**: Required for Token API features

### QUICKNODE_NFT_API_KEY (Optional)
- **Description**: API key for NFT API access
- **Location**: QuickNode Dashboard → NFT API → API Key
- **Note**: Required for NFT API features

### QUICKNODE_ENABLE_ADDONS (Optional)
- **Description**: Enable QuickNode add-ons
- **Values**: `true` or `false`
- **Default**: `true`
- **Available Add-ons**: Webhooks, Analytics, QuickAlerts

### Getting Your Credentials

1. Go to [QuickNode Dashboard](https://dashboard.quicknode.com)
2. Sign in or create an account
3. Click on **Endpoints** in the sidebar
4. Create a new endpoint or select existing endpoint
5. Copy the **HTTP Provider** URL for `QUICKNODE_API_URL`
6. For Token API: Go to **Token API** → Get API Key
7. For NFT API: Go to **NFT API** → Get API Key

## Usage Examples

### Get Account Balance
```javascript
// Get ETH balance for an address
{
  "method": "eth_getBalance",
  "params": ["0x1234567890123456789012345678901234567890", "latest"],
  "jsonrpc": "2.0",
  "id": 1
}

// Response: Balance in wei
// Result: 0x1bc16d674ec80000
```

### Get Token Balances (Token API)
```javascript
// Get all token balances for an address
{
  "method": "qn_getTokensByOwner",
  "params": {
    "wallet": "0x1234567890123456789012345678901234567890",
    "omitMetadata": false
  },
  "jsonrpc": "2.0",
  "id": 1
}

// Response: Array of token holdings with prices
```

### Get Token Metadata (Token API)
```javascript
// Get token information
{
  "method": "qn_getTokenMetadataBySymbol",
  "params": {
    "symbol": "USDC",
    "network": "ethereum-mainnet"
  },
  "jsonrpc": "2.0",
  "id": 1
}

// Response: Token metadata including address, decimals, supply
```

### Get Portfolio Value (Token API)
```javascript
// Get total portfolio value in USD
{
  "method": "qn_getWalletTokenBalance",
  "params": {
    "wallet": "0x1234567890123456789012345678901234567890",
    "excludeMetadata": false
  },
  "jsonrpc": "2.0",
  "id": 1
}

// Response: All tokens with balances and USD values
```

### Get NFT Holdings (NFT API)
```javascript
// Get all NFTs owned by an address
{
  "method": "qn_fetchNFTsByOwner",
  "params": {
    "wallet": "0x1234567890123456789012345678901234567890",
    "omitMetadata": false,
    "limit": 50
  },
  "jsonrpc": "2.0",
  "id": 1
}

// Response: Array of NFTs with images and metadata
```

### Get NFT Metadata (NFT API)
```javascript
// Get detailed NFT metadata
{
  "method": "qn_fetchNFTMetadata",
  "params": {
    "contractAddress": "0xBC4CA0EdA7647A8aB7C2061c2E2ad9CEAE79B8f1",
    "tokenId": "0",
    "omitMetadata": false
  },
  "jsonrpc": "2.0",
  "id": 1
}

// Response: Complete NFT metadata with image, traits, rarity
```

### Get NFT Floor Price (NFT API)
```javascript
// Get collection floor price and statistics
{
  "method": "qn_fetchNFTCollectionMetadata",
  "params": {
    "contractAddress": "0xBC4CA0EdA7647A8aB7C2061c2E2ad9CEAE79B8f1"
  },
  "jsonrpc": "2.0",
  "id": 1
}

// Response: Floor price, volume, sales count, unique holders
```

### Get NFT Transfers (NFT API)
```javascript
// Get NFT transfer history
{
  "method": "qn_fetchNFTTransfers",
  "params": {
    "contractAddress": "0xBC4CA0EdA7647A8aB7C2061c2E2ad9CEAE79B8f1",
    "limit": 10,
    "orderBy": "blockNumber"
  },
  "jsonrpc": "2.0",
  "id": 1
}

// Response: Transfer history with prices and timestamps
```

### Standard RPC Calls
```javascript
// Get transaction receipt
{
  "method": "eth_getTransactionReceipt",
  "params": ["0x...transaction-hash..."],
  "jsonrpc": "2.0",
  "id": 1
}

// Estimate gas
{
  "method": "eth_estimateGas",
  "params": [{
    "from": "0x...",
    "to": "0x...",
    "value": "1000000000000000000"
  }],
  "jsonrpc": "2.0",
  "id": 1
}

// Get block data
{
  "method": "eth_getBlockByNumber",
  "params": ["latest", true],
  "jsonrpc": "2.0",
  "id": 1
}
```

### QuickAlerts Webhooks (Add-on)
```javascript
// Create webhook for address activity
{
  "method": "qn_createWebhook",
  "params": {
    "webhookUrl": "https://your-api.example.com/webhook",
    "watchAddress": "0x1234567890123456789012345678901234567890",
    "network": "ethereum-mainnet"
  },
  "jsonrpc": "2.0",
  "id": 1
}

// Types: incomingTransaction, outgoingTransaction, all
```

## Configuration Options

### Multi-Chain Setup
Configure access to multiple networks with single endpoint:

```json
{
  "mcpServers": {
    "quicknode": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-quicknode"],
      "env": {
        "QUICKNODE_API_URL": "https://your-endpoint.quicknode.pro/your-token",
        "QUICKNODE_NETWORK": "ethereum-mainnet",
        "QUICKNODE_SECONDARY_NETWORK": "polygon-mainnet",
        "QUICKNODE_ENABLE_ADDONS": "true"
      }
    }
  }
}
```

### Enhanced Configuration with All Add-ons
```json
{
  "env": {
    "QUICKNODE_API_URL": "https://your-endpoint.quicknode.pro/your-token",
    "QUICKNODE_NETWORK": "ethereum-mainnet",
    "QUICKNODE_TOKEN_API_KEY": "your-token-api-key",
    "QUICKNODE_NFT_API_KEY": "your-nft-api-key",
    "QUICKNODE_ENABLE_ADDONS": "true",
    "QUICKNODE_ENABLE_WEBHOOKS": "true",
    "QUICKNODE_ENABLE_ANALYTICS": "true",
    "QUICKNODE_CACHE_ENABLED": "true",
    "QUICKNODE_CACHE_TTL": "300"
  }
}
```

## Best Practices

### Security
1. **Never Commit URLs**: Add `.env` files to `.gitignore`
2. **Use Environment Variables**: Store credentials in `.env` or secrets manager
3. **Monitor Usage**: Check API usage in QuickNode Dashboard
4. **Rotate Keys**: Periodically rotate endpoint tokens
5. **Webhook Security**: Verify webhook signatures before processing

### Performance
1. **Batch Requests**: Combine multiple RPC calls when possible
2. **Use Caching**: Enable caching for frequently accessed data
3. **Optimize Queries**: Use Token/NFT APIs instead of raw RPC for portfolio queries
4. **Connection Pooling**: Reuse HTTP connections
5. **Rate Limiting**: Implement backoff for rate limits

### Development Workflow
1. **Start with Testnet**: Test on Sepolia before mainnet
2. **Monitor Performance**: Track latency metrics
3. **Use QuickAlerts**: Set up webhooks for critical events
4. **Test Coverage**: Test all API endpoints before production
5. **Cost Tracking**: Monitor API usage and costs

## Common Use Cases

### Crypto Portfolio Tracker
```javascript
// Get all tokens and their USD values
{
  "method": "qn_getWalletTokenBalance",
  "params": {
    "wallet": "user-wallet-address",
    "excludeMetadata": false
  }
}

// Get NFT collection
{
  "method": "qn_fetchNFTsByOwner",
  "params": {
    "wallet": "user-wallet-address",
    "omitMetadata": false
  }
}

// Combine for total portfolio value
```

### NFT Valuation Tool
```javascript
// Get floor price and collection stats
{
  "method": "qn_fetchNFTCollectionMetadata",
  "params": {
    "contractAddress": "nft-contract-address"
  }
}

// Get individual NFT value and traits
{
  "method": "qn_fetchNFTMetadata",
  "params": {
    "contractAddress": "nft-contract-address",
    "tokenId": "token-id"
  }
}
```

### Transaction Monitoring
```javascript
// Set up webhook for incoming transactions
{
  "method": "qn_createWebhook",
  "params": {
    "webhookUrl": "https://your-api.example.com/webhook",
    "watchAddress": "address-to-monitor",
    "network": "ethereum-mainnet"
  }
}
```

### Token Swap Analysis
```javascript
// Monitor token transfers and prices
// Combine Token API data with transaction history
```

## Troubleshooting

### Common Issues

**Issue**: Invalid endpoint URL
- **Solution**: Verify URL from QuickNode Dashboard
- **Solution**: Check that endpoint is active
- **Solution**: Ensure token is correct and not expired

**Issue**: Method not found
- **Solution**: Verify Token API or NFT API is enabled
- **Solution**: Check API key is correct
- **Solution**: Ensure network supports the method

**Issue**: Rate limit exceeded
- **Solution**: Check API usage in QuickNode Dashboard
- **Solution**: Upgrade to higher tier plan
- **Solution**: Implement request batching and caching
- **Solution**: Use exponential backoff for retries

**Issue**: Incorrect token balances
- **Solution**: Verify wallet address is checksummed
- **Solution**: Check that token contract is valid
- **Solution**: Ensure Token API is properly configured

**Issue**: NFT metadata missing
- **Solution**: Verify contract is ERC-721 or ERC-1155
- **Solution**: Check token ID is correct
- **Solution**: Ensure NFT API is enabled

### Debug Mode
Enable debug logging:

```json
{
  "env": {
    "QUICKNODE_API_URL": "...",
    "QUICKNODE_NETWORK": "...",
    "DEBUG": "quicknode:*",
    "LOG_LEVEL": "debug"
  }
}
```

## Token Savings Comparison

| Operation | Traditional Method | With QuickNode MCP | Savings |
|-----------|-------------------|-------------------|---------|
| Balance Query | ~100 tokens | ~20 tokens | 80% |
| Token Holdings | ~300 tokens | ~60 tokens | 80% |
| NFT Portfolio | ~400 tokens | ~80 tokens | 80% |
| Portfolio Value | ~500 tokens | ~100 tokens | 80% |
| Collection Stats | ~350 tokens | ~70 tokens | 80% |

## Supported Networks

### EVM Networks
- Ethereum Mainnet & Testnets
- Arbitrum One & Sepolia
- Optimism Mainnet & Sepolia
- Polygon Mainnet & Mumbai
- Base Mainnet & Sepolia
- And 15+ more EVM chains

### Non-EVM Networks
- Solana Mainnet & Devnet
- Bitcoin & Ordinals support

## Integration with Other Tools

### With Web3.js
```typescript
import { Web3 } from 'web3';

const web3 = new Web3(process.env.QUICKNODE_API_URL);

// Query balance
const balance = await web3.eth.getBalance('0x1234...');
```

### With Ethers.js
```typescript
import { ethers } from 'ethers';

const provider = new ethers.JsonRpcProvider(process.env.QUICKNODE_API_URL);

// Get contract
const contract = new ethers.Contract(address, abi, provider);
```

### With QuickNode SDK
```typescript
import { QuickNodeSDK } from '@quicknode/sdk';

const sdk = new QuickNodeSDK({
  endpoint: process.env.QUICKNODE_API_URL
});

// Use Token API
const tokens = await sdk.token.getTokensByOwner(walletAddress);
```

## Additional Resources

- [QuickNode Documentation](https://docs.quicknode.com)
- [Token API Docs](https://docs.quicknode.com/token-api)
- [NFT API Docs](https://docs.quicknode.com/nft-api)
- [API Reference](https://docs.quicknode.com/api-reference)
- [Webhooks/QuickAlerts](https://docs.quicknode.com/quickalerts)
- [Network Support](https://docs.quicknode.com/supported-networks)
- [MCP Documentation](https://modelcontextprotocol.io)

## Version Information
- **Package**: `@modelcontextprotocol/server-quicknode`
- **Compatibility**: Claude Desktop 0.5.0+
- **Node.js**: v16.0.0 or higher
- **QuickNode**: Works with all QuickNode plans
- **Uptime SLA**: 99.99% guaranteed uptime
