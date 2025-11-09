# MongoDB MCP Server

Query and analyze MongoDB databases with read-only access through natural language.

## Overview

The MongoDB MCP Server provides AI assistants with read-only access to MongoDB databases. It supports document exploration, schema inspection, aggregation pipelines, and works seamlessly with MongoDB Atlas cloud deployments.

## Installation

```bash
# Install via gICM
npx gicm-stack add mcp/mongodb

# Or configure manually in .claude/mcp.json
{
  "mcpServers": {
    "mongodb": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-mongodb", "mongodb://localhost:27017"]
    }
  }
}
```

## Environment Variables

```bash
# Required
MONGODB_URI=mongodb://username:password@localhost:27017/database_name

# For MongoDB Atlas
MONGODB_ATLAS_URI=mongodb+srv://username:password@cluster.mongodb.net/database_name

# Optional
MONGODB_MAX_POOL_SIZE=10
MONGODB_TIMEOUT_MS=30000
```

## Features

- **Document exploration** - Browse collections and documents
- **Schema inspection** - Auto-detect document structures
- **Aggregation pipelines** - Complex data analysis
- **MongoDB Atlas support** - Cloud database integration
- **Read-only mode** - Safe database exploration
- **JSON document handling** - Native MongoDB format

## Usage Examples

### Basic Queries

```javascript
// Find documents
db.users.find({ role: "admin" }).limit(10)

// Count documents
db.transactions.countDocuments({ status: "pending" })

// Find one document
db.nfts.findOne({ tokenId: "123" })
```

### Aggregation Pipelines

```javascript
// Group and count
db.trades.aggregate([
  { $match: { timestamp: { $gte: ISODate("2025-01-01") } } },
  { $group: { _id: "$token", totalVolume: { $sum: "$amount" } } },
  { $sort: { totalVolume: -1 } },
  { $limit: 10 }
])

// NFT rarity analysis
db.nft_metadata.aggregate([
  { $unwind: "$traits" },
  { $group: { _id: "$traits.type", count: { $sum: 1 } } },
  { $sort: { count: 1 } }
])
```

### Web3 Use Cases

```javascript
// Query wallet holdings
db.wallets.find({
  address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
}).project({ tokens: 1, balance: 1 })

// Track NFT transfers
db.nft_transfers.find({
  contractAddress: "0x...",
  blockNumber: { $gte: 18000000 }
}).sort({ blockNumber: -1 }).limit(100)

// Analyze token prices
db.prices.aggregate([
  { $match: { symbol: "SOL" } },
  { $group: {
      _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
      avgPrice: { $avg: "$price" },
      maxPrice: { $max: "$price" },
      minPrice: { $min: "$price" }
    }
  },
  { $sort: { _id: -1 } }
])
```

## Tools Provided

### `mongodb_query`
Execute read-only queries against MongoDB collections.

**Parameters:**
- `collection` (string): Collection name
- `query` (object): MongoDB query filter
- `limit` (number, optional): Maximum documents to return

### `mongodb_aggregate`
Run aggregation pipelines for complex data analysis.

**Parameters:**
- `collection` (string): Collection name
- `pipeline` (array): Aggregation pipeline stages

### `mongodb_list_collections`
List all collections in the database.

### `mongodb_count_documents`
Count documents matching a query.

**Parameters:**
- `collection` (string): Collection name
- `query` (object): MongoDB query filter

## Best Practices

1. **Use indexes** - Ensure queries utilize indexes
2. **Limit results** - Always use `.limit()` for large collections
3. **Project fields** - Use `.project()` to return only needed fields
4. **Use aggregation** - Leverage aggregation for complex analysis
5. **Monitor performance** - Watch query execution times

## Related MCPs

- [PostgreSQL MCP](./postgresql-README.md) - Relational database
- [Redis MCP](./redis-README.md) - Caching layer
- [Elasticsearch MCP](./elasticsearch-README.md) - Full-text search

## GitHub Repository

https://github.com/modelcontextprotocol/servers

---

**Last Updated:** 2025-11-08
**Version:** 1.0.0
