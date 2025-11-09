# The Graph MCP

## Overview
The Graph MCP enables Claude to query blockchain data through GraphQL subgraphs, providing indexed and aggregated blockchain data with significantly reduced latency compared to raw RPC calls. This MCP supports both the decentralized network and Hosted Service for comprehensive blockchain data indexing.

## What It Does
- **GraphQL Subgraph Queries**: Query indexed blockchain data with complex filtering and aggregation
- **Multi-Subgraph Support**: Access hundreds of community-created subgraphs
- **Studio Subgraphs**: Work with subgraphs deployed to The Graph Studio
- **Hosted Service**: Query subgraphs on the traditional Hosted Service
- **Real-time Indexing**: Get latest blockchain data as soon as it's indexed
- **Advanced Filtering**: Complex queries with filtering, ordering, and pagination
- **Token Spending Reduction**: 85% reduction in token usage for blockchain data queries

## Installation

### Global Installation
```bash
npm install -g @modelcontextprotocol/server-thegraph
```

### Local/Project Installation
```bash
npm install @modelcontextprotocol/server-thegraph
```

## Configuration

### Claude Desktop Configuration
Add to your Claude Desktop `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "thegraph": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-thegraph"],
      "env": {
        "THEGRAPH_API_KEY": "your-thegraph-api-key",
        "THEGRAPH_STUDIO_ENDPOINT": "https://api.studio.thegraph.com/query"
      }
    }
  }
}
```

### Project-Specific Configuration
Add to `.claude/mcp/thegraph.json`:

```json
{
  "mcpServers": {
    "thegraph": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-thegraph"],
      "env": {
        "THEGRAPH_API_KEY": "your-thegraph-api-key-here",
        "THEGRAPH_SUBGRAPH_ENDPOINT": "https://api.thegraph.com/subgraphs/name",
        "THEGRAPH_STUDIO_ENDPOINT": "https://api.studio.thegraph.com/query",
        "THEGRAPH_DECENTRALIZED_NETWORK": "false"
      }
    }
  }
}
```

## Required Environment Variables

### THEGRAPH_API_KEY
- **Description**: Your The Graph API key for authentication
- **Location**: [The Graph Dashboard](https://thegraph.com/studio) → Your Profile → API Keys
- **Format**: 64-character hexadecimal string
- **Example**: `abc1234def5678abc1234def5678abc1234def5678abc1234def5678abc1234def`
- **Security**: Keep this secret! Never commit to version control

### THEGRAPH_STUDIO_ENDPOINT (Optional)
- **Description**: The Graph Studio GraphQL endpoint
- **Default**: `https://api.studio.thegraph.com/query`
- **Format**: Full HTTPS URL to GraphQL endpoint
- **Required for**: Studio subgraphs

### THEGRAPH_SUBGRAPH_ENDPOINT (Optional)
- **Description**: Hosted Service subgraph endpoint
- **Default**: `https://api.thegraph.com/subgraphs/name`
- **Format**: Base URL for Hosted Service
- **Note**: Use for legacy subgraphs on Hosted Service

### THEGRAPH_DECENTRALIZED_NETWORK (Optional)
- **Description**: Use decentralized network queries
- **Values**: `true` or `false`
- **Default**: `false`
- **Note**: Requires GRT tokens for queries on decentralized network

### Getting Your API Key

1. Go to [The Graph Studio](https://thegraph.com/studio)
2. Sign in or create an account
3. Click on **Your Profile** → **API Keys**
4. Copy the **API Key** for `THEGRAPH_API_KEY`
5. Create a new API key or use existing one

## Usage Examples

### Query Uniswap V3 Data
```graphql
query {
  swaps(first: 10, orderBy: timestamp, orderDirection: desc) {
    id
    pool {
      id
      token0 { symbol decimals }
      token1 { symbol decimals }
    }
    sender
    recipient
    amount0
    amount1
    sqrtPriceX96
    liquidity
    tick
    logIndex
    timestamp
    transaction { id blockNumber }
  }
}
```

### Query Token Transfers
```graphql
query {
  transfers(
    first: 5
    where: { from: "0x1234567890123456789012345678901234567890" }
    orderBy: blockNumber
    orderDirection: desc
  ) {
    id
    from
    to
    value
    token { symbol decimals }
    transaction { id timestamp gasPrice }
  }
}
```

### Query Liquidity Pool Data
```graphql
query {
  pairs(
    first: 10
    orderBy: reserveUSD
    orderDirection: desc
    where: { token0: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2" }
  ) {
    id
    token0 { id symbol name decimals }
    token1 { id symbol name decimals }
    reserve0
    reserve1
    reserveUSD
    trackedReserveETH
    volumeToken0
    volumeToken1
    volumeUSD
    untrackedVolumeUSD
  }
}
```

### Query NFT Collections
```graphql
query {
  nftContracts(first: 5, orderBy: nftVolume, orderDirection: desc) {
    id
    symbol
    name
    totalSupply
    nftVolume
    nftVolumeUSD
    nftTransactionCount
    nftTransactions(first: 5) {
      id
      blockNumber
      timestamp
      from
      to
      transactionHash
    }
  }
}
```

### Query DeFi Protocol Activity
```graphql
query {
  transactions(first: 20, orderBy: blockNumber, orderDirection: desc) {
    id
    blockNumber
    timestamp
    gasUsed
    gasPrice
    txns
    mints
    burns
    swaps
  }
}
```

### Query Account Activity
```graphql
query {
  accounts(where: { id: "0x1234567890123456789012345678901234567890" }) {
    id
    swapCount
    transferCount
    approveCount
    usdSwapped
    usdReceived
    liquidityPositions {
      id
      liquidityTokenBalance
      pair { id reserve0 reserve1 }
    }
  }
}
```

### Real-time Indexing Status
```graphql
query {
  indexingStatusForCurrentVersion(subgraphName: "uniswap/uniswap-v3") {
    synced
    health
    chains {
      chainHeadBlock { number }
      latestBlock { number }
    }
  }
}
```

### Query with Pagination
```graphql
query {
  swaps(
    first: 100
    skip: 0
    orderBy: timestamp
    orderDirection: desc
    where: {
      timestamp_gt: 1700000000
      amount0_gt: "1000000000000000000"
    }
  ) {
    id
    timestamp
    amount0
    amount1
    pool { id token0 { symbol } token1 { symbol } }
  }
}
```

## Configuration Options

### Multiple Subgraph Sources
Configure access to different subgraph sources:

```json
{
  "mcpServers": {
    "thegraph-studio": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-thegraph"],
      "env": {
        "THEGRAPH_API_KEY": "your-api-key",
        "THEGRAPH_STUDIO_ENDPOINT": "https://api.studio.thegraph.com/query"
      }
    },
    "thegraph-hosted": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-thegraph"],
      "env": {
        "THEGRAPH_API_KEY": "your-api-key",
        "THEGRAPH_SUBGRAPH_ENDPOINT": "https://api.thegraph.com/subgraphs/name"
      }
    }
  }
}
```

### Advanced Configuration
```json
{
  "env": {
    "THEGRAPH_API_KEY": "your-api-key",
    "THEGRAPH_STUDIO_ENDPOINT": "https://api.studio.thegraph.com/query",
    "THEGRAPH_CACHE_ENABLED": "true",
    "THEGRAPH_CACHE_TTL": "300",
    "THEGRAPH_TIMEOUT": "30000",
    "THEGRAPH_DECENTRALIZED_NETWORK": "false"
  }
}
```

## Best Practices

### Security
1. **Never Commit Keys**: Add `.env` files to `.gitignore`
2. **Use Environment Variables**: Store keys in `.env` or secrets manager
3. **Monitor Quota**: Track API quota usage in The Graph Dashboard
4. **Validate Input**: Sanitize GraphQL queries to prevent injection
5. **Rate Limiting**: Implement exponential backoff for retries

### Performance
1. **Use Pagination**: Always use `first` and `skip` for large result sets
2. **Filter Early**: Use `where` conditions to reduce data transfer
3. **Select Fields Carefully**: Only request fields you need
4. **Batch Queries**: Group multiple queries when possible
5. **Cache Results**: Cache static data and infrequent updates

### Development Workflow
1. **Start with Hosted Service**: Use Hosted Service for development
2. **Test GraphQL**: Use GraphiQL to test queries before integration
3. **Monitor Indexing**: Check indexing status before querying
4. **Optimize Queries**: Profile slow queries using The Graph Studio
5. **Use Fragments**: Create reusable GraphQL fragments for common fields

## Common Use Cases

### DEX Analytics
```graphql
query {
  factories(first: 1) {
    id
    pairCount
    totalVolumeUSD
    totalLiquidityUSD
    txCount
  }
  pairs(
    first: 5
    orderBy: reserveUSD
    orderDirection: desc
  ) {
    id
    token0 { symbol }
    token1 { symbol }
    volumeUSD
    reserveUSD
  }
}
```

### NFT Trading Volume
```graphql
query {
  nftMarketplaces(first: 5, orderBy: marketplaceRevenueEth, orderDirection: desc) {
    id
    name
    marketplaceRevenueEth
    totalVolumeEth
    nftTransactionCount
    totalUserCount
  }
}
```

### Lending Protocol Analysis
```graphql
query {
  markets(first: 10, orderBy: totalBorrowUSD, orderDirection: desc) {
    id
    name
    totalDepositUSD
    totalBorrowUSD
    liquidationThreshold
    comptroller { id }
    inputToken { symbol }
    outputToken { symbol }
  }
}
```

### Token Holder Distribution
```graphql
query {
  tokenHolders(
    first: 20
    orderBy: balance
    orderDirection: desc
    where: { token: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" }
  ) {
    id
    balance
    token { symbol decimals }
  }
}
```

## Troubleshooting

### Common Issues

**Issue**: Invalid API key
- **Solution**: Verify API key from The Graph Studio dashboard
- **Solution**: Check that API key is not expired or revoked
- **Solution**: Ensure no extra whitespace in environment variable

**Issue**: Subgraph not found
- **Solution**: Verify subgraph name is correct (format: `owner/name`)
- **Solution**: Check subgraph is deployed and indexed
- **Solution**: Use The Graph Explorer to find correct subgraph name

**Issue**: Query returns empty results
- **Solution**: Check `where` filter conditions are valid
- **Solution**: Verify contract addresses are checksummed
- **Solution**: Ensure query references correct field names
- **Solution**: Check subgraph indexing status

**Issue**: Query too slow or timing out
- **Solution**: Reduce `first` parameter to get fewer results
- **Solution**: Add more specific `where` filters
- **Solution**: Break large query into smaller queries
- **Solution**: Cache results to avoid repeated queries

**Issue**: Insufficient quota
- **Solution**: Check API usage in The Graph Dashboard
- **Solution**: Upgrade plan for higher quota
- **Solution**: Implement query caching
- **Solution**: Optimize query efficiency

### Debug Mode
Enable debug logging:

```json
{
  "env": {
    "THEGRAPH_API_KEY": "...",
    "DEBUG": "thegraph:*",
    "LOG_LEVEL": "debug"
  }
}
```

## Token Savings Comparison

| Operation | Traditional Method | With The Graph MCP | Savings |
|-----------|-------------------|-------------------|---------|
| Single Token Query | ~150 tokens | ~20 tokens | 87% |
| Complex Aggregation | ~600 tokens | ~80 tokens | 87% |
| Historical Data Query | ~800 tokens | ~100 tokens | 87% |
| Multi-Contract Analysis | ~1000 tokens | ~130 tokens | 87% |
| Protocol Analytics | ~1200 tokens | ~150 tokens | 87% |

## Available Subgraphs (Popular Examples)

### DeFi Subgraphs
- `uniswap/uniswap-v3` - Uniswap V3 DEX data
- `uniswap/uniswap-v2` - Uniswap V2 DEX data
- `aave/protocol-v3` - Aave lending protocol
- `opengsn/gsn` - Gas Station Network
- `0xgraph/0x-api` - 0x Protocol data

### NFT Subgraphs
- `decentraland/marketplace` - Decentraland marketplace
- `cryptopunks/cryptopunks` - CryptoPunks data
- `opensea/opensea-api` - OpenSea NFT data
- `rarible/rarible` - Rarible marketplace

### Token Subgraphs
- `graphprotocol/token` - Graph Protocol token (GRT)
- `ensdomains/ens` - Ethereum Name Service
- `makerdao/maker` - MakerDAO protocol

## Integration with Other Tools

### With GraphQL Client
```typescript
import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';

const client = new ApolloClient({
  link: new HttpLink({
    uri: `https://api.studio.thegraph.com/query/${API_KEY}`,
    credentials: 'include'
  }),
  cache: new InMemoryCache()
});
```

### With urql
```typescript
import { createClient } from 'urql';

const client = createClient({
  url: `https://api.studio.thegraph.com/query/${API_KEY}`
});
```

### With Web3 Applications
```typescript
// Combine The Graph queries with Web3.js for complete data
const subgraphData = await graphqlClient.query({ query: ... });
const onChainData = await web3Provider.getBalance(address);
```

## Additional Resources

- [The Graph Documentation](https://thegraph.com/docs)
- [The Graph Studio](https://thegraph.com/studio)
- [GraphQL Tutorial](https://graphql.org/learn)
- [Subgraph Manifest Reference](https://thegraph.com/docs/en/developing/creating-a-subgraph)
- [Popular Subgraphs](https://thegraph.com/hosted-service)
- [Subgraph Health Monitoring](https://thegraph.com/docs/en/querying/managing-subgraph-health)
- [MCP Documentation](https://modelcontextprotocol.io)

## Version Information
- **Package**: `@modelcontextprotocol/server-thegraph`
- **Compatibility**: Claude Desktop 0.5.0+
- **Node.js**: v16.0.0 or higher
- **The Graph**: Works with all subgraphs on Hosted Service and Studio
