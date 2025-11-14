# MCP Plugin System Guide

> **Make gICM yours**: Easily add custom MCP servers to integrate any external service, API, or data source with Claude Code.

## Table of Contents

1. [What are MCPs?](#what-are-mcps)
2. [Quick Start](#quick-start)
3. [MCP Architecture](#mcp-architecture)
4. [Creating Your First MCP](#creating-your-first-mcp)
5. [MCP Configuration Schema](#mcp-configuration-schema)
6. [Building MCP Servers](#building-mcp-servers)
7. [CLI Tools](#cli-tools)
8. [Examples](#examples)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)

---

## What are MCPs?

**MCP (Model Context Protocol)** is Anthropic's standard for connecting Claude to external data sources and tools. Think of MCPs as plugins that give Claude access to:

- APIs (REST, GraphQL, WebSockets)
- Databases (SQL, NoSQL, Vector DBs)
- File systems and cloud storage
- Real-time data feeds
- Custom business logic

### Why Use MCPs?

- **Extend Claude's capabilities** beyond its training data
- **Access real-time data** (prices, news, blockchain state)
- **Integrate with your stack** (databases, APIs, internal tools)
- **Build custom workflows** specific to your needs

---

## Quick Start

### Using the CLI (Easiest Method)

```bash
# Interactive MCP creation wizard
npx @gicm/cli create-mcp

# Follow the prompts:
# 1. MCP name (e.g., "coingecko")
# 2. Description
# 3. Category
# 4. Environment variables
# 5. Tools to expose
```

This generates:
- `.claude/mcps/your-mcp.json` (configuration)
- `.claude/mcps/servers/your-mcp-server.js` (server template)
- Updated registry entry

### Manual Method

1. Create MCP config: `.claude/mcps/my-mcp.json`
2. Create MCP server: `.claude/mcps/servers/my-mcp-server.js`
3. Add to registry: `src/lib/registry.ts`
4. Test: `gicm validate`

---

## MCP Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Claude Code                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │              MCP Client                          │  │
│  │  (reads .claude/mcps/*.json configs)             │  │
│  └──────────────┬───────────────────────────────────┘  │
│                 │                                       │
└─────────────────┼───────────────────────────────────────┘
                  │ stdio/WebSocket
                  │
┌─────────────────▼───────────────────────────────────────┐
│              MCP Server Process                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  your-mcp-server.js                              │  │
│  │  - Exposes tools (functions)                     │  │
│  │  - Handles authentication                        │  │
│  │  - Makes API calls                               │  │
│  │  - Returns data to Claude                        │  │
│  └──────────────┬───────────────────────────────────┘  │
│                 │                                       │
└─────────────────┼───────────────────────────────────────┘
                  │ HTTP/WS
                  │
┌─────────────────▼───────────────────────────────────────┐
│           External API / Service                        │
│  (CoinGecko, Twitter, Database, etc.)                   │
└─────────────────────────────────────────────────────────┘
```

---

## Creating Your First MCP

### Example: CoinGecko Price API

#### Step 1: Create MCP Config

**File**: `.claude/mcps/coingecko.json`

```json
{
  "mcpServers": {
    "coingecko": {
      "command": "node",
      "args": [
        "C:\\Users\\YOUR_USERNAME\\path\\to\\.claude\\mcps\\servers\\coingecko-server.js"
      ],
      "env": {
        "COINGECKO_API_KEY": "${COINGECKO_API_KEY}"
      },
      "metadata": {
        "name": "CoinGecko",
        "description": "Crypto price and market data API",
        "category": "ICM & Crypto",
        "tags": ["crypto", "price", "market-data"],
        "version": "1.0.0",
        "author": "Your Name",
        "documentation": "https://docs.coingecko.com",
        "requiredEnvKeys": ["COINGECKO_API_KEY"],
        "tools": [
          {
            "name": "getPrice",
            "description": "Get current price for any crypto token"
          },
          {
            "name": "getMarketData",
            "description": "Get market cap, volume, price changes"
          }
        ],
        "pricing": {
          "free_tier": "10,000 calls/month",
          "paid_tier": "$129/month for 500,000 calls"
        },
        "setup": {
          "steps": [
            "Sign up at https://coingecko.com",
            "Get API key from dashboard",
            "Add COINGECKO_API_KEY to .env",
            "Run: gicm add mcp/coingecko"
          ]
        }
      }
    }
  }
}
```

#### Step 2: Create MCP Server

**File**: `.claude/mcps/servers/coingecko-server.js`

```javascript
#!/usr/bin/env node

const axios = require('axios');

// MCP Server for CoinGecko API
class CoinGeckoMCPServer {
  constructor() {
    this.apiKey = process.env.COINGECKO_API_KEY;
    this.baseUrl = 'https://api.coingecko.com/api/v3';
  }

  // Tool 1: Get Price
  async getPrice(params) {
    const { tokenId, currency = 'usd' } = params;

    try {
      const response = await axios.get(
        `${this.baseUrl}/simple/price`,
        {
          params: {
            ids: tokenId,
            vs_currencies: currency,
            include_24hr_change: true,
            include_market_cap: true,
            include_24hr_vol: true,
          },
          headers: {
            'x-cg-demo-api-key': this.apiKey,
          },
        }
      );

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Tool 2: Get Market Data
  async getMarketData(params) {
    const { tokenId } = params;

    try {
      const response = await axios.get(
        `${this.baseUrl}/coins/${tokenId}`,
        {
          params: {
            localization: false,
            tickers: false,
            community_data: true,
            developer_data: false,
          },
          headers: {
            'x-cg-demo-api-key': this.apiKey,
          },
        }
      );

      return {
        success: true,
        data: {
          name: response.data.name,
          symbol: response.data.symbol,
          marketCap: response.data.market_data.market_cap.usd,
          volume24h: response.data.market_data.total_volume.usd,
          priceChange24h: response.data.market_data.price_change_percentage_24h,
          circulatingSupply: response.data.market_data.circulating_supply,
          totalSupply: response.data.market_data.total_supply,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // MCP Protocol Handler
  async handleRequest(request) {
    const { method, params } = request;

    switch (method) {
      case 'getPrice':
        return await this.getPrice(params);
      case 'getMarketData':
        return await this.getMarketData(params);
      default:
        return {
          success: false,
          error: `Unknown method: ${method}`,
        };
    }
  }

  // Start MCP server
  start() {
    process.stdin.on('data', async (data) => {
      try {
        const request = JSON.parse(data.toString());
        const response = await this.handleRequest(request);
        process.stdout.write(JSON.stringify(response) + '\n');
      } catch (error) {
        process.stdout.write(
          JSON.stringify({
            success: false,
            error: error.message,
          }) + '\n'
        );
      }
    });

    // Keep process alive
    process.stdin.resume();
  }
}

// Start server
const server = new CoinGeckoMCPServer();
server.start();
```

#### Step 3: Test Your MCP

```bash
# Validate configuration
npx @gicm/cli validate

# Test MCP server directly
echo '{"method":"getPrice","params":{"tokenId":"bitcoin","currency":"usd"}}' | node .claude/mcps/servers/coingecko-server.js
```

---

## MCP Configuration Schema

### Full Schema Reference

```typescript
interface MCPConfig {
  mcpServers: {
    [serverName: string]: {
      // REQUIRED: How to start the server
      command: string;           // e.g., "node", "python", "npx"
      args: string[];           // e.g., ["path/to/server.js"]

      // OPTIONAL: Environment variables
      env?: {
        [key: string]: string;  // e.g., { "API_KEY": "${API_KEY}" }
      };

      // REQUIRED: Metadata for registry
      metadata: {
        name: string;           // Display name
        description: string;    // Short description (1-2 sentences)
        category: string;       // e.g., "ICM & Crypto", "Database", "API"
        tags: string[];        // Search tags
        version: string;       // Semantic version
        author: string;        // Your name or organization
        documentation: string; // Link to docs

        // Required env keys (for validation)
        requiredEnvKeys: string[];

        // Tools exposed by this MCP
        tools: Array<{
          name: string;
          description: string;
        }>;

        // OPTIONAL: Pricing info
        pricing?: {
          free_tier?: string;
          paid_tier?: string;
          enterprise?: string;
          note?: string;
        };

        // OPTIONAL: Setup instructions
        setup?: {
          steps: string[];
        };

        // OPTIONAL: Additional metadata
        [key: string]: any;
      };
    };
  };
}
```

### Field Guidelines

| Field | Required | Description | Example |
|-------|----------|-------------|---------|
| `command` | ✅ Yes | Executable to run | `"node"`, `"python3"`, `"npx"` |
| `args` | ✅ Yes | Arguments to pass | `["servers/my-server.js"]` |
| `env` | ❌ No | Environment variables | `{"API_KEY": "${API_KEY}"}` |
| `metadata.name` | ✅ Yes | Display name | `"CoinGecko"` |
| `metadata.description` | ✅ Yes | 1-2 sentence summary | `"Crypto price API"` |
| `metadata.category` | ✅ Yes | Registry category | `"ICM & Crypto"` |
| `metadata.tags` | ✅ Yes | Search keywords | `["crypto", "price"]` |
| `metadata.tools` | ✅ Yes | List of exposed tools | `[{name, description}]` |

---

## Building MCP Servers

### Server Template (Node.js)

```javascript
#!/usr/bin/env node

class MyMCPServer {
  constructor() {
    // Initialize with env vars
    this.apiKey = process.env.MY_API_KEY;
  }

  // Tool 1
  async myTool(params) {
    try {
      // Your logic here
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Request handler
  async handleRequest(request) {
    const { method, params } = request;

    if (this[method]) {
      return await this[method](params);
    }

    return { success: false, error: `Unknown method: ${method}` };
  }

  // Start server
  start() {
    process.stdin.on('data', async (data) => {
      try {
        const request = JSON.parse(data.toString());
        const response = await this.handleRequest(request);
        process.stdout.write(JSON.stringify(response) + '\n');
      } catch (error) {
        process.stdout.write(
          JSON.stringify({ success: false, error: error.message }) + '\n'
        );
      }
    });
    process.stdin.resume();
  }
}

const server = new MyMCPServer();
server.start();
```

### Server Template (Python)

```python
#!/usr/bin/env python3

import sys
import json
import os

class MyMCPServer:
    def __init__(self):
        self.api_key = os.getenv('MY_API_KEY')

    def my_tool(self, params):
        try:
            # Your logic here
            return {'success': True, 'data': result}
        except Exception as e:
            return {'success': False, 'error': str(e)}

    def handle_request(self, request):
        method = request.get('method')
        params = request.get('params', {})

        if hasattr(self, method):
            return getattr(self, method)(params)

        return {'success': False, 'error': f'Unknown method: {method}'}

    def start(self):
        for line in sys.stdin:
            try:
                request = json.loads(line)
                response = self.handle_request(request)
                print(json.dumps(response), flush=True)
            except Exception as e:
                print(json.dumps({'success': False, 'error': str(e)}), flush=True)

if __name__ == '__main__':
    server = MyMCPServer()
    server.start()
```

---

## CLI Tools

### `gicm create-mcp` - Interactive Wizard

```bash
npx @gicm/cli create-mcp
```

**Prompts:**
1. **MCP Name**: `coingecko`
2. **Description**: `Crypto price and market data API`
3. **Category**: `ICM & Crypto` (dropdown)
4. **Language**: `JavaScript` or `Python`
5. **Environment Variables**: `COINGECKO_API_KEY` (comma-separated)
6. **Tools**: `getPrice, getMarketData` (comma-separated)

**Output:**
- `.claude/mcps/coingecko.json`
- `.claude/mcps/servers/coingecko-server.js` (template with TODOs)
- Registry entry added to `src/lib/registry.ts`

### `gicm validate` - Validate MCP Configs

```bash
npx @gicm/cli validate --fix
```

**Checks:**
- ✅ JSON schema validity
- ✅ Required fields present
- ✅ Server file exists
- ✅ Env keys match between config and server
- ✅ No duplicate MCP IDs

---

## Examples

### Example 1: Database MCP (PostgreSQL)

**Config**: `.claude/mcps/postgres.json`

```json
{
  "mcpServers": {
    "postgres": {
      "command": "node",
      "args": ["C:\\path\\to\\.claude\\mcps\\servers\\postgres-server.js"],
      "env": {
        "POSTGRES_CONNECTION_STRING": "${POSTGRES_CONNECTION_STRING}"
      },
      "metadata": {
        "name": "PostgreSQL",
        "description": "Query PostgreSQL database with SQL",
        "category": "Database",
        "tags": ["database", "sql", "postgres"],
        "tools": [
          {"name": "executeQuery", "description": "Run SQL query"},
          {"name": "getSchema", "description": "Get table schemas"}
        ]
      }
    }
  }
}
```

### Example 2: REST API MCP (Custom)

**Server**: `.claude/mcps/servers/my-api-server.js`

```javascript
class MyAPIMCPServer {
  async fetchData(params) {
    const response = await fetch(`https://api.example.com/data/${params.id}`);
    const data = await response.json();
    return { success: true, data };
  }
}
```

---

## Best Practices

### Security

1. **Never hardcode API keys** - Use environment variables
2. **Validate all inputs** - Sanitize params before use
3. **Rate limit awareness** - Respect API rate limits
4. **Error handling** - Always return structured errors

### Performance

1. **Cache responses** when appropriate
2. **Batch requests** if API supports it
3. **Use connection pooling** for databases
4. **Timeout long operations** (max 30s recommended)

### Documentation

1. **Clear tool descriptions** - Users need to understand what tools do
2. **Example params** - Include in metadata
3. **Setup instructions** - Make it easy to get started
4. **Pricing transparency** - Document any costs

---

## Troubleshooting

### Common Issues

#### Issue: MCP server not starting

```bash
# Check if server file exists
ls .claude/mcps/servers/my-server.js

# Test server directly
echo '{"method":"ping"}' | node .claude/mcps/servers/my-server.js
```

#### Issue: Environment variables not loaded

```bash
# Verify .env file
cat .env | grep MY_API_KEY

# Test with explicit env
MY_API_KEY=test node .claude/mcps/servers/my-server.js
```

#### Issue: Invalid JSON config

```bash
# Validate JSON
npx @gicm/cli validate

# Check for syntax errors
cat .claude/mcps/my-mcp.json | jq .
```

---

## Advanced Topics

### WebSocket MCPs

For real-time data (price feeds, blockchain events):

```javascript
const WebSocket = require('ws');

class WebSocketMCP {
  constructor() {
    this.ws = new WebSocket('wss://api.example.com/stream');

    this.ws.on('message', (data) => {
      // Forward to Claude
      process.stdout.write(JSON.stringify({
        type: 'event',
        data: JSON.parse(data),
      }) + '\n');
    });
  }
}
```

### Multi-Tool MCPs

Group related tools in one MCP:

```javascript
class TradingMCP {
  async getPrice(params) { /* ... */ }
  async getVolume(params) { /* ... */ }
  async getOrderBook(params) { /* ... */ }
  async placeOrder(params) { /* ... */ }
}
```

### Authentication Patterns

**API Key:**
```javascript
headers: { 'Authorization': `Bearer ${this.apiKey}` }
```

**OAuth 2.0:**
```javascript
const token = await getOAuthToken(clientId, clientSecret);
headers: { 'Authorization': `Bearer ${token}` }
```

---

## Resources

- **MCP Specification**: https://spec.modelcontextprotocol.io
- **Claude Code Docs**: https://docs.claude.com/claude-code
- **gICM Marketplace**: https://gicm-marketplace.vercel.app
- **Example MCPs**: `.claude/mcps/` directory

---

## Contributing

Built a useful MCP? Share it with the community:

1. Test thoroughly with `gicm validate`
2. Document setup steps clearly
3. Submit to gICM marketplace
4. Tag appropriately for discovery

---

**Questions?** Open an issue at https://github.com/Kermit457/gICM/issues
