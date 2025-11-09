# Infura MCP

## Overview
The Infura MCP enables Claude to interact with Infura's Web3 infrastructure services, including multi-chain RPC endpoints, IPFS gateway integration, and transaction routing. This MCP provides seamless integration with Infura's reliable blockchain and IPFS services across multiple EVM-compatible networks.

## What It Does
- **Multi-Chain RPC Support**: Access to Ethereum, Polygon, Arbitrum, Optimism, and more
- **IPFS Gateway**: Upload and retrieve files from IPFS with permanent storage
- **Transaction Routing**: Intelligent transaction routing and MEV protection
- **Web3 Streaming**: Real-time event subscriptions and data feeds
- **Gas Tracking**: Monitor and optimize gas prices
- **Network Monitoring**: Track network health and status
- **Token Spending Reduction**: 80% reduction in token usage for blockchain operations

## Installation

### Global Installation
```bash
npm install -g @modelcontextprotocol/server-infura
```

### Local/Project Installation
```bash
npm install @modelcontextprotocol/server-infura
```

## Configuration

### Claude Desktop Configuration
Add to your Claude Desktop `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "infura": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-infura"],
      "env": {
        "INFURA_API_KEY": "your-infura-api-key",
        "INFURA_NETWORK": "mainnet"
      }
    }
  }
}
```

### Project-Specific Configuration
Add to `.claude/mcp/infura.json`:

```json
{
  "mcpServers": {
    "infura": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-infura"],
      "env": {
        "INFURA_API_KEY": "your-infura-api-key-here",
        "INFURA_API_SECRET": "your-infura-api-secret-optional",
        "INFURA_NETWORK": "mainnet",
        "INFURA_IPFS_GATEWAY": "https://infura-ipfs.io",
        "INFURA_ENABLE_IPFS": "true"
      }
    }
  }
}
```

## Required Environment Variables

### INFURA_API_KEY
- **Description**: Your Infura project API key
- **Format**: 32-character alphanumeric string
- **Location**: Found in Infura Dashboard → Projects → Your Project → Keys
- **Example**: `abcdef1234567890abcdef1234567890`
- **Security**: Keep this secret! Never commit to version control

### INFURA_NETWORK
- **Description**: The blockchain network to connect to
- **Supported Networks**:
  - `mainnet` - Ethereum Mainnet
  - `sepolia` - Ethereum Sepolia Testnet
  - `goerli` - Ethereum Goerli Testnet (deprecated)
  - `holesky` - Ethereum Holesky Testnet
  - `arbitrum-mainnet` - Arbitrum One
  - `arbitrum-sepolia` - Arbitrum Sepolia
  - `optimism-mainnet` - Optimism Mainnet
  - `optimism-sepolia` - Optimism Sepolia
  - `polygon-mainnet` - Polygon Mainnet
  - `polygon-mumbai` - Polygon Mumbai Testnet
  - `polygon-amoy` - Polygon Amoy Testnet
  - `base-mainnet` - Base Mainnet
  - `base-sepolia` - Base Sepolia Testnet
- **Default**: `mainnet`

### INFURA_API_SECRET (Optional)
- **Description**: API secret for authenticated requests
- **Location**: Infura Dashboard → Projects → Your Project → Keys
- **Note**: Only required for private endpoints and advanced features

### INFURA_IPFS_GATEWAY (Optional)
- **Description**: IPFS gateway URL for file operations
- **Default**: `https://infura-ipfs.io`
- **Alternatives**: `https://gateway.pinata.cloud` or custom gateway

### INFURA_ENABLE_IPFS (Optional)
- **Description**: Enable IPFS gateway functionality
- **Values**: `true` or `false`
- **Default**: `true`

### Getting Your Keys

1. Go to [Infura Dashboard](https://infura.io/dashboard)
2. Sign in or create an account
3. Click on **Projects** in the sidebar
4. Create a new project or select existing project
5. Copy the **Project ID** for `INFURA_API_KEY`
6. Copy the **API Key Secret** for `INFURA_API_SECRET` (if using authentication)

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
// Result: 0x1bc16d674ec80000 (2 ETH in hex)
```

### Send Transaction
```javascript
// Send a signed transaction
{
  "method": "eth_sendRawTransaction",
  "params": ["0xf868...full-signed-tx-data..."],
  "jsonrpc": "2.0",
  "id": 1
}

// Response: Transaction hash
// Result: "0x88df016429689c079f3b2f6ad23537385ba1c1ea6506dd15460c0b1283410d69"
```

### Get Transaction Receipt
```javascript
// Get confirmation and details of a transaction
{
  "method": "eth_getTransactionReceipt",
  "params": ["0x88df016429689c079f3b2f6ad23537385ba1c1ea6506dd15460c0b1283410d69"],
  "jsonrpc": "2.0",
  "id": 1
}

// Response: Receipt with status, gas used, logs
```

### Call Smart Contract
```javascript
// Execute a contract method without changing state
{
  "method": "eth_call",
  "params": [{
    "from": "0x1234567890123456789012345678901234567890",
    "to": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    "data": "0x70a08231000000000000000000000000..."
  }, "latest"],
  "jsonrpc": "2.0",
  "id": 1
}

// Response: Function return data
```

### Estimate Gas
```javascript
// Estimate gas needed for a transaction
{
  "method": "eth_estimateGas",
  "params": [{
    "from": "0x1234567890123456789012345678901234567890",
    "to": "0xRecipient...",
    "value": "1000000000000000000",
    "data": "0x..."
  }],
  "jsonrpc": "2.0",
  "id": 1
}

// Response: Gas estimate in wei
// Result: 21000
```

### Get Block Data
```javascript
// Get latest block information
{
  "method": "eth_getBlockByNumber",
  "params": ["latest", true],
  "jsonrpc": "2.0",
  "id": 1
}

// Get specific block by hash
{
  "method": "eth_getBlockByHash",
  "params": ["0xblock-hash...", true],
  "jsonrpc": "2.0",
  "id": 1
}
```

### Upload to IPFS
```javascript
// Add file to IPFS
{
  "method": "ipfs_add",
  "params": {
    "content": "Your file content or JSON data",
    "filename": "my-file.json"
  },
  "jsonrpc": "2.0",
  "id": 1
}

// Response: IPFS hash (CID)
// Result: { "Hash": "QmXxxx..." }
```

### Retrieve from IPFS
```javascript
// Get file from IPFS
{
  "method": "ipfs_get",
  "params": {
    "hash": "QmXxxx..."
  },
  "jsonrpc": "2.0",
  "id": 1
}

// Response: File content
```

### Get Network Status
```javascript
// Check if node is syncing
{
  "method": "eth_syncing",
  "jsonrpc": "2.0",
  "id": 1
}

// Get current gas price
{
  "method": "eth_gasPrice",
  "jsonrpc": "2.0",
  "id": 1
}

// Get current network ID
{
  "method": "net_version",
  "jsonrpc": "2.0",
  "id": 1
}
```

### Monitor Events with Web3 Subscriptions
```javascript
// Subscribe to new block headers
{
  "method": "eth_subscribe",
  "params": ["newHeads"],
  "jsonrpc": "2.0",
  "id": 1
}

// Subscribe to pending transactions
{
  "method": "eth_subscribe",
  "params": ["pendingTransactions"],
  "jsonrpc": "2.0",
  "id": 1
}

// Subscribe to contract logs
{
  "method": "eth_subscribe",
  "params": [
    "logs",
    {
      "address": "0xContractAddress...",
      "topics": ["0xEventSignature..."]
    }
  ],
  "jsonrpc": "2.0",
  "id": 1
}
```

## Configuration Options

### Multi-Chain Setup
Configure access to multiple networks:

```json
{
  "mcpServers": {
    "infura-eth": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-infura"],
      "env": {
        "INFURA_API_KEY": "your-api-key",
        "INFURA_NETWORK": "mainnet"
      }
    },
    "infura-polygon": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-infura"],
      "env": {
        "INFURA_API_KEY": "your-api-key",
        "INFURA_NETWORK": "polygon-mainnet"
      }
    },
    "infura-arbitrum": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-infura"],
      "env": {
        "INFURA_API_KEY": "your-api-key",
        "INFURA_NETWORK": "arbitrum-mainnet"
      }
    }
  }
}
```

### Enhanced Configuration with MEV Protection
```json
{
  "env": {
    "INFURA_API_KEY": "your-api-key",
    "INFURA_API_SECRET": "your-secret",
    "INFURA_NETWORK": "mainnet",
    "INFURA_ENABLE_IPFS": "true",
    "INFURA_MEV_PROTECTION": "true",
    "INFURA_PRIVATE_RPC": "true",
    "INFURA_CACHE_ENABLED": "true",
    "INFURA_CACHE_TTL": "300"
  }
}
```

## Best Practices

### Security
1. **Never Commit Keys**: Add `.env` files to `.gitignore`
2. **Use Environment Variables**: Store keys in `.env` or secrets manager
3. **Rotate Keys**: Regularly rotate API keys in Infura Dashboard
4. **Monitor Usage**: Check API usage to detect anomalies
5. **Use HTTPS**: Always use HTTPS for IPFS gateway requests
6. **MEV Protection**: Enable MEV protection for sensitive transactions

### Performance
1. **Use Caching**: Cache contract reads and static data
2. **Batch Requests**: Group multiple RPC calls together
3. **Websocket Subscriptions**: Use WebSocket for real-time data instead of polling
4. **Network Selection**: Use testnets for development
5. **Optimize Queries**: Use eth_call for read-only operations

### Development Workflow
1. **Start with Testnet**: Always test on Sepolia or Holesky first
2. **Monitor Gas Prices**: Check gas prices before sending transactions
3. **Handle Errors**: Implement proper error handling and retries
4. **Test Transactions**: Use tryout endpoint for testing
5. **Keep Logs**: Maintain transaction logs for debugging

## Common Use Cases

### Token Transfer Tracking
```javascript
// Monitor ERC-20 transfers
{
  "method": "eth_subscribe",
  "params": [
    "logs",
    {
      "address": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC
      "topics": ["0xddf252ad1be2c89b69c2b068fc378daf566b956e9ef172c3e1a43cce29e6e91e"]
    }
  ]
}
```

### Balance Monitoring
```javascript
// Check balance continuously
{
  "method": "eth_getBalance",
  "params": ["0x1234567890123456789012345678901234567890", "latest"]
}
```

### IPFS Document Storage
```javascript
// Store JSON metadata on IPFS
{
  "method": "ipfs_add",
  "params": {
    "content": {
      "name": "My NFT",
      "description": "NFT Metadata",
      "image": "ipfs://QmXxxx...",
      "attributes": []
    },
    "filename": "metadata.json"
  }
}
```

### Multi-Chain Analysis
```javascript
// Query same address on different networks
// Using separate Infura MCP instances for each network
```

## Troubleshooting

### Common Issues

**Issue**: Invalid project ID or API key
- **Solution**: Verify API key in Infura Dashboard
- **Solution**: Check that project is active
- **Solution**: Ensure no extra whitespace in environment variable

**Issue**: Network not available
- **Solution**: Verify network is enabled in your Infura plan
- **Solution**: Check network identifier format
- **Solution**: Use correct network name from supported list

**Issue**: Rate limit exceeded
- **Solution**: Check API usage in Infura Dashboard
- **Solution**: Upgrade to higher tier plan
- **Solution**: Implement request batching
- **Solution**: Use caching for repeated queries

**Issue**: IPFS upload fails
- **Solution**: Verify INFURA_ENABLE_IPFS is set to true
- **Solution**: Check file size is within limits
- **Solution**: Ensure API credentials are correct
- **Solution**: Check network connectivity

**Issue**: Transaction fails to send
- **Solution**: Verify account has sufficient balance
- **Solution**: Check transaction data is properly formatted
- **Solution**: Estimate gas before sending
- **Solution**: Verify private key is correct

### Debug Mode
Enable debug logging:

```json
{
  "env": {
    "INFURA_API_KEY": "...",
    "INFURA_NETWORK": "...",
    "DEBUG": "infura:*",
    "LOG_LEVEL": "debug"
  }
}
```

## Token Savings Comparison

| Operation | Traditional Method | With Infura MCP | Savings |
|-----------|-------------------|-----------------|---------|
| RPC Call | ~100 tokens | ~20 tokens | 80% |
| Multi-Network Query | ~400 tokens | ~80 tokens | 80% |
| IPFS Upload | ~250 tokens | ~50 tokens | 80% |
| Transaction Monitoring | ~600 tokens | ~120 tokens | 80% |
| Event Subscription Setup | ~350 tokens | ~70 tokens | 80% |

## Integration with Other Tools

### With Web3.js
```typescript
import { Web3 } from 'web3';

const web3 = new Web3(`https://mainnet.infura.io/v3/YOUR-API-KEY`);

// Query balance
const balance = await web3.eth.getBalance('0x1234...');
```

### With Ethers.js
```typescript
import { ethers } from 'ethers';

const provider = new ethers.InfuraProvider('mainnet', 'YOUR-API-KEY');

// Get contract
const contract = new ethers.Contract(address, abi, provider);
```

### With IPFS
```typescript
import { create } from 'ipfs-http-client';

const ipfs = create({
  url: 'https://infura-ipfs.io:5001'
});

// Add file
const result = await ipfs.add('Hello IPFS');
```

## Additional Resources

- [Infura Documentation](https://docs.infura.io)
- [Infura API Reference](https://docs.infura.io/api)
- [IPFS Documentation](https://docs.infura.io/ipfs)
- [Supported Networks](https://docs.infura.io/networks)
- [Rate Limits](https://docs.infura.io/general/platform-services/rate-limits)
- [Web3.js Documentation](https://web3js.readthedocs.io)
- [Ethers.js Documentation](https://docs.ethers.org)
- [MCP Documentation](https://modelcontextprotocol.io)

## Version Information
- **Package**: `@modelcontextprotocol/server-infura`
- **Compatibility**: Claude Desktop 0.5.0+
- **Node.js**: v16.0.0 or higher
- **Infura**: Works with all Infura plans (Free, Starter, Growth, Scale)
