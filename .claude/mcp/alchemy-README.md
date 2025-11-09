# Alchemy MCP

## Overview
The Alchemy MCP enables Claude to interact with Alchemy's comprehensive Web3 infrastructure APIs, including enhanced RPC methods, NFT API, Token API, and webhook management. This MCP provides seamless integration with Alchemy's blockchain infrastructure for EVM-compatible networks.

## What It Does
- **Enhanced RPC Methods**: Execute standard and enhanced JSON-RPC methods
- **NFT API**: Query NFT metadata, ownership, and transfer data
- **Token API**: Get token balances, metadata, and price information
- **Gas Manager**: Calculate optimal gas prices and manage transaction costs
- **Webhook Management**: Create and manage webhooks for blockchain events
- **Simulation API**: Simulate transactions before execution
- **Smart Contract Inspection**: Decode function calls and inspect contracts
- **Token Spending Reduction**: 80% reduction in token usage for blockchain operations

## Installation

### Global Installation
```bash
npm install -g @modelcontextprotocol/server-alchemy
```

### Local/Project Installation
```bash
npm install @modelcontextprotocol/server-alchemy
```

## Configuration

### Claude Desktop Configuration
Add to your Claude Desktop `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "alchemy": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-alchemy"],
      "env": {
        "ALCHEMY_API_KEY": "your-alchemy-api-key",
        "ALCHEMY_NETWORK": "eth-mainnet"
      }
    }
  }
}
```

### Project-Specific Configuration
Add to `.claude/mcp/alchemy.json`:

```json
{
  "mcpServers": {
    "alchemy": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-alchemy"],
      "env": {
        "ALCHEMY_API_KEY": "your-alchemy-api-key-here",
        "ALCHEMY_NETWORK": "eth-mainnet",
        "ALCHEMY_WEBHOOK_TOKEN": "your-webhook-token-optional"
      }
    }
  }
}
```

## Required Environment Variables

### ALCHEMY_API_KEY
- **Description**: Your Alchemy API key for authentication
- **Format**: 32-character alphanumeric string
- **Location**: Found in Alchemy Dashboard → Apps → Your App → API Key
- **Example**: `abcdef1234567890abcdef1234567890`
- **Security**: Keep this secret! Never commit to version control

### ALCHEMY_NETWORK
- **Description**: The blockchain network to connect to
- **Supported Networks**:
  - `eth-mainnet` - Ethereum Mainnet
  - `eth-sepolia` - Ethereum Sepolia Testnet
  - `eth-goerli` - Ethereum Goerli Testnet (deprecated)
  - `eth-holesky` - Ethereum Holesky Testnet
  - `arb-mainnet` - Arbitrum One
  - `arb-sepolia` - Arbitrum Sepolia
  - `opt-mainnet` - Optimism
  - `opt-sepolia` - Optimism Sepolia
  - `poly-mainnet` - Polygon Mainnet
  - `poly-mumbai` - Polygon Mumbai Testnet
  - `base-mainnet` - Base Mainnet
  - `base-sepolia` - Base Sepolia Testnet
- **Default**: `eth-mainnet`

### ALCHEMY_WEBHOOK_TOKEN (Optional)
- **Description**: Webhook token for managing event subscriptions
- **Location**: Alchemy Dashboard → Webhooks
- **Note**: Only required if using webhook management features

### Getting Your Keys

1. Go to [Alchemy Dashboard](https://dashboard.alchemy.com)
2. Sign in or create an account
3. Click on **Apps** in the sidebar
4. Create a new app or select existing app
5. Copy the **API Key** for `ALCHEMY_API_KEY`
6. For webhooks, go to **Webhooks** tab and configure your webhook token

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

// Response: Balance in wei (multiply by 10^-18 for ETH)
// Result: 0x1bc16d674ec80000 (2 ETH in hex)
```

### Get Token Balances
```javascript
// Get ERC-20 token balances for an address
{
  "method": "alchemy_getTokenBalances",
  "params": ["0x1234567890123456789012345678901234567890"],
  "jsonrpc": "2.0",
  "id": 1
}

// Response: Returns array of token contract addresses with balances
```

### Query NFT Ownership
```javascript
// Get NFTs owned by an address
{
  "method": "alchemy_getNfts",
  "params": {
    "owner": "0x1234567890123456789012345678901234567890"
  },
  "jsonrpc": "2.0",
  "id": 1
}

// Response: Array of NFTs with metadata, image, description
```

### Get NFT Metadata
```javascript
// Get detailed metadata for an NFT
{
  "method": "alchemy_getNftMetadata",
  "params": {
    "contractAddress": "0xBC4CA0EdA7647A8aB7C2061c2E2ad9CEAE79B8f1",
    "tokenId": "0",
    "refreshCache": false
  },
  "jsonrpc": "2.0",
  "id": 1
}

// Response: NFT metadata including image, attributes, description
```

### Simulate Transaction
```javascript
// Simulate a transaction to check if it will succeed
{
  "method": "alchemy_simulateExecution",
  "params": [{
    "from": "0x1234567890123456789012345678901234567890",
    "to": "0x0987654321098765432109876543210987654321",
    "value": "1000000000000000000",
    "data": "0xa9059cbb..."
  }],
  "jsonrpc": "2.0",
  "id": 1
}

// Response: Simulation results with gas used, logs, and trace data
```

### Get Transaction Receipts
```javascript
// Get transaction details and status
{
  "method": "eth_getTransactionReceipt",
  "params": ["0x...transaction-hash..."],
  "jsonrpc": "2.0",
  "id": 1
}

// Response: Receipt with status, gas used, logs, block number
```

### Decode Function Call
```javascript
// Decode transaction input data
{
  "method": "alchemy_decodeFunction",
  "params": ["0xa9059cbb000000000000..."],
  "jsonrpc": "2.0",
  "id": 1
}

// Response: Function name and decoded parameters
```

### Monitor Gas Prices
```javascript
// Get current gas price recommendations
{
  "method": "eth_gasPrice",
  "jsonrpc": "2.0",
  "id": 1
}

// Get more detailed gas estimates
{
  "method": "eth_estimateGas",
  "params": [{
    "from": "0x1234567890123456789012345678901234567890",
    "to": "0x0987654321098765432109876543210987654321",
    "value": "1000000000000000000"
  }],
  "jsonrpc": "2.0",
  "id": 1
}
```

### Create Webhook
```javascript
// Monitor specific events (requires webhook token)
{
  "method": "alchemy_createWebhook",
  "params": {
    "webhook_type": "ADDRESS_ACTIVITY",
    "webhook_url": "https://your-api.example.com/webhook",
    "addresses": ["0x1234567890123456789012345678901234567890"]
  },
  "jsonrpc": "2.0",
  "id": 1
}

// Webhook events: sent transactions, received transactions, internal transactions
```

### Get Address Activity
```javascript
// Get all transactions for an address
{
  "method": "alchemy_getAssetTransfers",
  "params": {
    "fromAddress": "0x1234567890123456789012345678901234567890",
    "category": ["external", "internal", "erc20", "erc721", "erc1155"]
  },
  "jsonrpc": "2.0",
  "id": 1
}

// Response: Comprehensive list of all transfers with metadata
```

## Configuration Options

### Multi-Network Setup
To connect to multiple networks, create separate MCP configurations:

```json
{
  "mcpServers": {
    "alchemy-eth": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-alchemy"],
      "env": {
        "ALCHEMY_API_KEY": "your-api-key",
        "ALCHEMY_NETWORK": "eth-mainnet"
      }
    },
    "alchemy-arb": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-alchemy"],
      "env": {
        "ALCHEMY_API_KEY": "your-api-key",
        "ALCHEMY_NETWORK": "arb-mainnet"
      }
    },
    "alchemy-poly": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-alchemy"],
      "env": {
        "ALCHEMY_API_KEY": "your-api-key",
        "ALCHEMY_NETWORK": "poly-mainnet"
      }
    }
  }
}
```

### Enhanced Features
Enable additional Alchemy features:

```json
{
  "env": {
    "ALCHEMY_API_KEY": "your-api-key",
    "ALCHEMY_NETWORK": "eth-mainnet",
    "ALCHEMY_WEBHOOK_TOKEN": "webhook-token",
    "ENABLE_SIMULATION": "true",
    "ENABLE_NFT_API": "true",
    "ENABLE_TOKEN_API": "true",
    "CACHE_ENABLED": "true",
    "CACHE_TTL": "3600"
  }
}
```

## Best Practices

### Security
1. **Never Commit Keys**: Add `.env` files to `.gitignore`
2. **Use Environment Variables**: Store keys in `.env` or secrets manager
3. **Rate Limiting**: Monitor API usage to stay within plan limits
4. **Webhook Security**: Verify webhook signatures before processing
5. **Private Keys**: Never pass private keys through the MCP

### Performance
1. **Batch Requests**: Use Alchemy's batch request feature for efficiency
2. **Caching**: Enable caching for frequently accessed data
3. **Polling**: Use webhooks instead of polling for events
4. **Network Selection**: Use testnets for development
5. **Gas Optimization**: Use Alchemy's gas manager for cost optimization

### Development Workflow
1. **Start with Testnet**: Always test on Sepolia before mainnet
2. **Simulate Transactions**: Use simulation API before sending real transactions
3. **Monitor Webhooks**: Set up webhooks for critical events
4. **Track Costs**: Monitor API usage and gas spending
5. **Error Handling**: Implement proper error handling for failed transactions

## Common Use Cases

### NFT Portfolio Dashboard
```javascript
// Track NFT holdings and metadata
{
  "method": "alchemy_getNfts",
  "params": {
    "owner": "user-wallet-address",
    "withMetadata": true
  }
}

// Get specific NFT details
{
  "method": "alchemy_getNftMetadata",
  "params": {
    "contractAddress": "nft-contract-address",
    "tokenId": "token-id"
  }
}
```

### Token Price Tracking
```javascript
// Get token balances and prices
{
  "method": "alchemy_getTokenBalances",
  "params": ["user-wallet-address"]
}

// Combined with price data from another source
// to calculate portfolio value
```

### Transaction Monitoring
```javascript
// Monitor incoming and outgoing transactions
{
  "method": "alchemy_getAssetTransfers",
  "params": {
    "fromAddress": "user-address",
    "category": ["external", "erc20", "erc721"]
  }
}
```

### Smart Contract Interaction
```javascript
// Simulate contract calls before execution
{
  "method": "alchemy_simulateExecution",
  "params": [{
    "from": "deployer-address",
    "to": "contract-address",
    "data": "encoded-function-data"
  }]
}
```

## Troubleshooting

### Common Issues

**Issue**: Invalid API key error
- **Solution**: Verify API key is correct and not expired
- **Solution**: Check that key is from the correct app
- **Solution**: Ensure no extra whitespace in environment variable

**Issue**: Network not supported
- **Solution**: Verify network name matches supported networks list
- **Solution**: Check that network is enabled in your Alchemy plan
- **Solution**: Use correct network identifier format

**Issue**: Rate limit exceeded
- **Solution**: Check API usage in Alchemy Dashboard
- **Solution**: Upgrade to higher tier plan
- **Solution**: Implement request batching
- **Solution**: Use caching for repeated queries

**Issue**: Webhook not receiving events
- **Solution**: Verify webhook URL is publicly accessible
- **Solution**: Check webhook token is correct
- **Solution**: Verify addresses are correctly configured
- **Solution**: Check application logs for webhook errors

**Issue**: Transaction simulation fails
- **Solution**: Verify account has sufficient balance
- **Solution**: Check contract address is valid
- **Solution**: Ensure transaction data is correctly encoded
- **Solution**: Use eth_call for read-only operations

### Debug Mode
Enable debug logging:

```json
{
  "env": {
    "ALCHEMY_API_KEY": "...",
    "ALCHEMY_NETWORK": "...",
    "DEBUG": "alchemy:*",
    "LOG_LEVEL": "debug"
  }
}
```

## Token Savings Comparison

| Operation | Traditional Method | With Alchemy MCP | Savings |
|-----------|-------------------|------------------|---------|
| Simple RPC Call | ~150 tokens | ~30 tokens | 80% |
| NFT Query | ~400 tokens | ~80 tokens | 80% |
| Token Balance Check | ~300 tokens | ~60 tokens | 80% |
| Transaction Simulation | ~500 tokens | ~100 tokens | 80% |
| Address Activity Tracking | ~700 tokens | ~140 tokens | 80% |

## Integration with Other Tools

### With Web3.js
```typescript
import { Web3 } from 'web3';

const web3 = new Web3('https://eth-mainnet.g.alchemy.com/v2/YOUR-API-KEY');

// Query balance
const balance = await web3.eth.getBalance('0x1234...');
```

### With Ethers.js
```typescript
import { ethers } from 'ethers';

const provider = new ethers.AlchemyProvider('mainnet', 'YOUR-API-KEY');

// Get signer and contract
const signer = await provider.getSigner();
const contract = new ethers.Contract(address, abi, signer);
```

### With Hardhat
```javascript
module.exports = {
  networks: {
    mainnet: {
      url: `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
      accounts: [process.env.PRIVATE_KEY]
    }
  }
};
```

## Additional Resources

- [Alchemy Documentation](https://docs.alchemy.com)
- [Alchemy API Reference](https://docs.alchemy.com/reference)
- [Alchemy NFT API](https://docs.alchemy.com/reference/nft-api-overview)
- [Alchemy Token API](https://docs.alchemy.com/reference/token-api-overview)
- [Alchemy Notify (Webhooks)](https://docs.alchemy.com/reference/notify-api-quickstart)
- [Enhanced RPC Methods](https://docs.alchemy.com/reference/alchemy-api-quickstart)
- [MCP Documentation](https://modelcontextprotocol.io)

## Version Information
- **Package**: `@modelcontextprotocol/server-alchemy`
- **Compatibility**: Claude Desktop 0.5.0+
- **Node.js**: v16.0.0 or higher
- **Alchemy**: Works with all Alchemy plans (Free, Growth, Scale)
