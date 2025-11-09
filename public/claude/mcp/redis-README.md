# Redis MCP Server

Natural language interface for Redis data management, caching, and real-time operations.

## Overview

Provides AI assistants with access to Redis for caching, session management, rate limiting, and vector operations. Supports string, hash, list, set, and JSON data types with full Redis Stack features.

## Installation

```bash
# Install via gICM
npx gicm-stack add mcp/redis

# Configure in .claude/mcp.json
{
  "mcpServers": {
    "redis": {
      "command": "npx",
      "args": ["-y", "@redis-mcp-server/redis", "redis://localhost:6379"]
    }
  }
}
```

## Environment Variables

```bash
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your_password
REDIS_DB=0
```

## Features

- **String/Hash/JSON operations** - All Redis data types
- **Vector embeddings** - Semantic search with RedisVectorStore
- **Session management** - User session storage
- **Rate limiting** - API rate limiting
- **Pub/Sub** - Real-time messaging
- **Caching** - High-performance caching layer

## Usage Examples

### Caching

```javascript
// Cache blockchain data
await redis.setex("block:18000000", 3600, JSON.stringify(blockData))

// Get cached data
const block = await redis.get("block:18000000")

// Cache with pattern
await redis.mset({
  "price:SOL": "102.34",
  "price:ETH": "2341.56",
  "price:BTC": "45234.12"
})
```

### Rate Limiting

```javascript
// Check rate limit
const key = `ratelimit:${userId}:${endpoint}`
const count = await redis.incr(key)
if (count === 1) {
  await redis.expire(key, 60) // 60 seconds window
}
if (count > 100) {
  throw new Error("Rate limit exceeded")
}
```

### Session Management

```javascript
// Store user session
await redis.hset(`session:${sessionId}`, {
  userId: "123",
  wallet: "0x742d35...",
  loginTime: Date.now()
})

// Get session
const session = await redis.hgetall(`session:${sessionId}`)
```

### Web3 Use Cases

```javascript
// Cache wallet balances
await redis.setex(
  `balance:${walletAddress}`,
  300, // 5 minutes
  JSON.stringify({ sol: 10.5, usdc: 1000 })
)

// Store pending transactions
await redis.lpush("tx:pending", txSignature)

// Real-time price feeds
await redis.publish("prices", JSON.stringify({
  token: "SOL",
  price: 102.34,
  timestamp: Date.now()
}))
```

## Tools Provided

### `redis_get` / `redis_set`
Basic key-value operations with TTL support.

### `redis_hset` / `redis_hget`
Hash operations for structured data.

### `redis_lpush` / `redis_lrange`
List operations for queues and logs.

### `redis_publish` / `redis_subscribe`
Pub/Sub for real-time messaging.

## Best Practices

1. **Set TTLs** - Always expire cached data
2. **Use pipelines** - Batch multiple commands
3. **Monitor memory** - Use `maxmemory-policy`
4. **Key naming** - Use consistent patterns (e.g., `object:id:field`)
5. **Separate databases** - Use different DB numbers for different purposes

## Related MCPs

- [PostgreSQL MCP](./postgresql-README.md) - Persistent storage
- [MongoDB MCP](./mongodb-README.md) - Document storage

## GitHub Repository

https://github.com/GongRzhe/REDIS-MCP-Server

---

**Last Updated:** 2025-11-08
**Version:** 1.0.0
