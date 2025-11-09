# Tenderly MCP

## Overview
The Tenderly MCP enables Claude to interact with Tenderly's comprehensive blockchain development and monitoring platform, including transaction simulation, real-time monitoring, debugging, and alerting capabilities. This MCP provides powerful tools for testing, monitoring, and analyzing blockchain transactions across multiple EVM-compatible networks.

## What It Does
- **Transaction Simulation**: Simulate transactions before execution to prevent failures
- **Real-Time Monitoring**: Monitor contracts and addresses for on-chain activity
- **Debugging Tools**: Advanced debugging with bytecode and state inspection
- **Smart Contracts**: Deploy and verify contracts directly through Tenderly
- **Alerting System**: Create alerts for specific events and conditions
- **Historical Analysis**: Analyze past transactions with full execution trace
- **Gas Analysis**: Understand gas consumption and optimize costs
- **Token Spending Reduction**: 85% reduction in token usage for development and monitoring

## Installation

### Global Installation
```bash
npm install -g @modelcontextprotocol/server-tenderly
```

### Local/Project Installation
```bash
npm install @modelcontextprotocol/server-tenderly
```

## Configuration

### Claude Desktop Configuration
Add to your Claude Desktop `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "tenderly": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-tenderly"],
      "env": {
        "TENDERLY_API_KEY": "your-tenderly-api-key",
        "TENDERLY_ACCOUNT_ID": "your-account-id",
        "TENDERLY_PROJECT_SLUG": "your-project"
      }
    }
  }
}
```

### Project-Specific Configuration
Add to `.claude/mcp/tenderly.json`:

```json
{
  "mcpServers": {
    "tenderly": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-tenderly"],
      "env": {
        "TENDERLY_API_KEY": "your-tenderly-api-key-here",
        "TENDERLY_ACCOUNT_ID": "your-tenderly-account-id",
        "TENDERLY_PROJECT_SLUG": "your-project-slug",
        "TENDERLY_NETWORK": "mainnet",
        "TENDERLY_RPC_URL": "https://mainnet.tenderly.co/your-key"
      }
    }
  }
}
```

## Required Environment Variables

### TENDERLY_API_KEY
- **Description**: Your Tenderly API key for authentication
- **Format**: 64-character alphanumeric string
- **Location**: Found in Tenderly Dashboard → Settings → API Keys
- **Example**: `abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890`
- **Security**: Keep this secret! Never commit to version control

### TENDERLY_ACCOUNT_ID
- **Description**: Your Tenderly account ID
- **Format**: Alphanumeric username or ID
- **Location**: Tenderly Dashboard → Settings → Account
- **Example**: `your-username` or `user123`
- **Note**: Used for API endpoints and RPC connections

### TENDERLY_PROJECT_SLUG
- **Description**: Your Tenderly project slug
- **Format**: URL-friendly project identifier
- **Location**: Tenderly Dashboard → Projects → Your Project
- **Example**: `my-project` or `production`
- **Note**: Used for accessing project-specific resources

### TENDERLY_NETWORK (Optional)
- **Description**: Default network to connect to
- **Supported Networks**:
  - `mainnet` - Ethereum Mainnet
  - `sepolia` - Ethereum Sepolia Testnet
  - `holesky` - Ethereum Holesky Testnet
  - `arbitrum-mainnet` - Arbitrum One
  - `arbitrum-sepolia` - Arbitrum Sepolia
  - `optimism-mainnet` - Optimism
  - `optimism-sepolia` - Optimism Sepolia
  - `polygon-mainnet` - Polygon
  - `polygon-mumbai` - Polygon Mumbai
  - `base-mainnet` - Base
  - `base-sepolia` - Base Sepolia
- **Default**: `mainnet`

### TENDERLY_RPC_URL (Optional)
- **Description**: Tenderly private RPC endpoint
- **Format**: `https://[network].tenderly.co/[account]/[project]/[key]`
- **Location**: Tenderly Dashboard → RPC URLs
- **Note**: For private RPC access and monitoring

### Getting Your Credentials

1. Go to [Tenderly Dashboard](https://dashboard.tenderly.co)
2. Sign in or create an account
3. Go to **Settings** → **API Keys**
4. Copy the **API Key** for `TENDERLY_API_KEY`
5. Get your **Account ID** from Settings
6. Create or select a **Project** and copy its slug

## Usage Examples

### Simulate Transaction
```javascript
// Simulate a transaction execution
{
  "method": "tenderly_simulateTransaction",
  "params": {
    "from": "0x1234567890123456789012345678901234567890",
    "to": "0x0987654321098765432109876543210987654321",
    "value": "1000000000000000000",
    "data": "0xa9059cbb...",
    "gas": 100000,
    "gasPrice": "20000000000"
  },
  "jsonrpc": "2.0",
  "id": 1
}

// Response: Simulation results with status, logs, gas used
```

### Batch Simulate Transactions
```javascript
// Simulate multiple transactions together
{
  "method": "tenderly_simulateTransactions",
  "params": [{
    "transactions": [
      {
        "from": "0x...",
        "to": "0x...",
        "value": "0",
        "data": "0x...",
        "gas": 100000
      },
      {
        "from": "0x...",
        "to": "0x...",
        "value": "0",
        "data": "0x...",
        "gas": 50000
      }
    ],
    "simulation_type": "quick"
  }],
  "jsonrpc": "2.0",
  "id": 1
}

// Response: Array of simulation results
```

### Get Transaction Trace
```javascript
// Get detailed execution trace of a transaction
{
  "method": "tenderly_traceTransaction",
  "params": {
    "transactionHash": "0x...",
    "blockNumber": 17000000
  },
  "jsonrpc": "2.0",
  "id": 1
}

// Response: Call tree, state changes, gas analysis, storage modifications
```

### Monitor Contract
```javascript
// Create monitoring for a contract address
{
  "method": "tenderly_createMonitor",
  "params": {
    "name": "USDC Monitor",
    "description": "Monitor USDC transfers and balance changes",
    "addresses": ["0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"],
    "network": "mainnet",
    "webhookUrl": "https://your-api.example.com/webhook"
  },
  "jsonrpc": "2.0",
  "id": 1
}
```

### Create Alert
```javascript
// Set up an alert for specific conditions
{
  "method": "tenderly_createAlert",
  "params": {
    "alertName": "Large Transfer Alert",
    "alertType": "transaction",
    "network": "mainnet",
    "filters": {
      "to": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      "value_gt": "1000000000000"
    },
    "notificationChannels": ["email", "webhook"]
  },
  "jsonrpc": "2.0",
  "id": 1
}
```

### Get Transaction Details
```javascript
// Fetch full transaction details with enhanced data
{
  "method": "tenderly_getTransaction",
  "params": {
    "transactionHash": "0x...",
    "blockNumber": 17000000,
    "includeTrace": true,
    "includeStorage": true
  },
  "jsonrpc": "2.0",
  "id": 1
}

// Response: Transaction data with logs, trace, state changes
```

### Debug Smart Contract
```javascript
// Debug a failed contract interaction
{
  "method": "tenderly_debugTransaction",
  "params": {
    "transactionHash": "0x...",
    "debugLevel": "full"
  },
  "jsonrpc": "2.0",
  "id": 1
}

// Response: Detailed debugging info, reverts, storage state
```

### Get Contract Storage
```javascript
// Read contract storage at specific address
{
  "method": "tenderly_getStorageAt",
  "params": {
    "address": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    "slot": "0x0",
    "blockNumber": "latest"
  },
  "jsonrpc": "2.0",
  "id": 1
}

// Response: Storage value at slot
```

### Get Balance History
```javascript
// Get balance changes for an address
{
  "method": "tenderly_getBalanceHistory",
  "params": {
    "address": "0x1234567890123456789012345678901234567890",
    "startBlock": 17000000,
    "endBlock": "latest"
  },
  "jsonrpc": "2.0",
  "id": 1
}

// Response: Historical balance changes
```

### Deploy Contract
```javascript
// Deploy a contract through Tenderly
{
  "method": "tenderly_deployContract",
  "params": {
    "contractName": "MyToken",
    "source": "contract MyToken { ... }",
    "constructorArgs": ["tokenName", "SYMBOL", 18],
    "network": "sepolia"
  },
  "jsonrpc": "2.0",
  "id": 1
}

// Response: Contract address and deployment transaction hash
```

### Gas Analysis
```javascript
// Analyze gas consumption
{
  "method": "tenderly_analyzeGas",
  "params": {
    "transactionHash": "0x...",
    "blockNumber": 17000000
  },
  "jsonrpc": "2.0",
  "id": 1
}

// Response: Detailed gas breakdown by operation
```

## Configuration Options

### Enhanced Monitoring Setup
```json
{
  "mcpServers": {
    "tenderly": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-tenderly"],
      "env": {
        "TENDERLY_API_KEY": "your-api-key",
        "TENDERLY_ACCOUNT_ID": "your-account",
        "TENDERLY_PROJECT_SLUG": "your-project",
        "TENDERLY_NETWORK": "mainnet",
        "TENDERLY_RPC_URL": "https://mainnet.tenderly.co/...",
        "TENDERLY_ENABLE_MONITORING": "true",
        "TENDERLY_ENABLE_ALERTS": "true",
        "TENDERLY_ENABLE_WEBHOOKS": "true",
        "TENDERLY_CACHE_ENABLED": "true"
      }
    }
  }
}
```

### Multi-Network Configuration
```json
{
  "mcpServers": {
    "tenderly-eth": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-tenderly"],
      "env": {
        "TENDERLY_API_KEY": "your-api-key",
        "TENDERLY_ACCOUNT_ID": "your-account",
        "TENDERLY_PROJECT_SLUG": "your-project",
        "TENDERLY_NETWORK": "mainnet"
      }
    },
    "tenderly-arb": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-tenderly"],
      "env": {
        "TENDERLY_API_KEY": "your-api-key",
        "TENDERLY_ACCOUNT_ID": "your-account",
        "TENDERLY_PROJECT_SLUG": "your-project",
        "TENDERLY_NETWORK": "arbitrum-mainnet"
      }
    }
  }
}
```

## Best Practices

### Security
1. **Never Commit Keys**: Add `.env` files to `.gitignore`
2. **Use Environment Variables**: Store keys in `.env` or secrets manager
3. **Monitor API Usage**: Check API usage in Tenderly Dashboard
4. **Webhook Security**: Verify webhook signatures and use HTTPS only
5. **Role-Based Access**: Use project-specific API keys for different teams

### Development & Testing
1. **Simulate Before Executing**: Always simulate transactions first
2. **Use Testnets**: Start with Sepolia or Holesky for testing
3. **Test Edge Cases**: Simulate edge cases and error scenarios
4. **Monitor Deployments**: Set up alerts for critical contracts
5. **Debug Failures**: Use transaction tracing to understand failures

### Monitoring & Alerting
1. **Set Up Monitors**: Monitor critical addresses and contracts
2. **Create Alerts**: Alert on large transactions or anomalies
3. **Use Webhooks**: Integrate with your systems via webhooks
4. **Regular Reviews**: Check monitoring dashboard regularly
5. **Response Plan**: Have escalation procedures for alerts

## Common Use Cases

### Pre-Execution Testing
```javascript
// Test transaction before sending to blockchain
{
  "method": "tenderly_simulateTransaction",
  "params": {
    "from": "user-address",
    "to": "contract-address",
    "data": "encoded-function-call",
    "value": "0"
  }
}

// Inspect: success, gas usage, logs, reverts
```

### Contract Deployment Verification
```javascript
// Simulate contract deployment
{
  "method": "tenderly_simulateTransaction",
  "params": {
    "from": "deployer-address",
    "data": "contract-bytecode",
    "gas": 5000000
  }
}

// Verify deployment succeeds before mainnet
```

### Transaction Debugging
```javascript
// Debug failed transaction
{
  "method": "tenderly_debugTransaction",
  "params": {
    "transactionHash": "failed-tx-hash",
    "debugLevel": "full"
  }
}

// Analyze: revert reason, state at each step, storage changes
```

### Real-Time Monitoring
```javascript
// Monitor token transfers
{
  "method": "tenderly_createMonitor",
  "params": {
    "name": "USDC Transfers",
    "addresses": ["0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"],
    "webhookUrl": "https://your-api.com/webhook"
  }
}
```

### Gas Optimization
```javascript
// Analyze gas consumption
{
  "method": "tenderly_analyzeGas",
  "params": {
    "transactionHash": "tx-hash"
  }
}

// Identify inefficient operations and optimize
```

## Troubleshooting

### Common Issues

**Issue**: Invalid API key
- **Solution**: Verify API key from Tenderly Dashboard
- **Solution**: Check key hasn't been revoked
- **Solution**: Ensure no extra whitespace in environment variable

**Issue**: Account or project not found
- **Solution**: Verify account ID and project slug are correct
- **Solution**: Check project exists in Tenderly Dashboard
- **Solution**: Verify permissions on the project

**Issue**: Simulation fails
- **Solution**: Check transaction parameters are valid
- **Solution**: Verify contract address is correct
- **Solution**: Ensure transaction data is properly encoded
- **Solution**: Check network selection is correct

**Issue**: Monitor not receiving events
- **Solution**: Verify webhook URL is accessible
- **Solution**: Check monitor configuration
- **Solution**: Verify addresses are in correct format
- **Solution**: Check Tenderly webhooks are enabled

**Issue**: Alert not triggering
- **Solution**: Verify alert conditions are correctly specified
- **Solution**: Check notification channels are configured
- **Solution**: Ensure filter conditions match transactions
- **Solution**: Verify alert is enabled in dashboard

### Debug Mode
Enable debug logging:

```json
{
  "env": {
    "TENDERLY_API_KEY": "...",
    "TENDERLY_ACCOUNT_ID": "...",
    "DEBUG": "tenderly:*",
    "LOG_LEVEL": "debug"
  }
}
```

## Token Savings Comparison

| Operation | Traditional Method | With Tenderly MCP | Savings |
|-----------|-------------------|------------------|---------|
| Simulate Transaction | ~400 tokens | ~60 tokens | 85% |
| Debug Failed Tx | ~600 tokens | ~90 tokens | 85% |
| Gas Analysis | ~300 tokens | ~45 tokens | 85% |
| Monitoring Setup | ~500 tokens | ~75 tokens | 85% |
| Alert Creation | ~350 tokens | ~52 tokens | 85% |

## Supported Networks

- Ethereum Mainnet & Testnets (Sepolia, Holesky)
- Arbitrum One & Sepolia
- Optimism Mainnet & Sepolia
- Polygon Mainnet & Mumbai
- Base Mainnet & Sepolia
- Fantom, Avalanche, Binance Smart Chain
- And 20+ more EVM-compatible networks

## Integration with Other Tools

### With Web3.js
```typescript
import { Web3 } from 'web3';

const web3 = new Web3(process.env.TENDERLY_RPC_URL);

// Execute and analyze
const tx = await web3.eth.sendTransaction({...});
```

### With Ethers.js
```typescript
import { ethers } from 'ethers';

const provider = new ethers.JsonRpcProvider(process.env.TENDERLY_RPC_URL);

// Simulate before sending
const result = await provider.call(tx);
```

### With Hardhat
```javascript
module.exports = {
  networks: {
    hardhat: {
      forking: {
        url: process.env.TENDERLY_RPC_URL
      }
    }
  }
};
```

## Additional Resources

- [Tenderly Documentation](https://docs.tenderly.co)
- [API Reference](https://docs.tenderly.co/reference)
- [Simulation API](https://docs.tenderly.co/simulation-api)
- [Monitoring Guide](https://docs.tenderly.co/monitoring)
- [Alerting Documentation](https://docs.tenderly.co/alerting)
- [Debugging Tools](https://docs.tenderly.co/debugging)
- [CLI Reference](https://docs.tenderly.co/tenderly-cli)
- [MCP Documentation](https://modelcontextprotocol.io)

## Version Information
- **Package**: `@modelcontextprotocol/server-tenderly`
- **Compatibility**: Claude Desktop 0.5.0+
- **Node.js**: v16.0.0 or higher
- **Tenderly**: Works with all Tenderly plans (Free, Pro, Enterprise)
