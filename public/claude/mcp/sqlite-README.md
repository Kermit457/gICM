# SQLite MCP Server

Lightweight local database operations with Node.js implementation.

## Overview

Provides AI assistants with access to SQLite databases for local development, testing, and lightweight data storage. Perfect for Web3 development tools and local blockchain data caching.

## Installation

```bash
npx gicm-stack add mcp/sqlite
```

## Configuration

```json
{
  "mcpServers": {
    "sqlite": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sqlite", "./data/local.db"]
    }
  }
}
```

## Features

- Local file-based database
- SQL query execution
- Schema management
- Zero configuration
- No server required

## Usage

```sql
-- Create table for local wallet cache
CREATE TABLE wallets (
  address TEXT PRIMARY KEY,
  balance REAL,
  last_updated INTEGER
);

-- Cache wallet data locally
INSERT INTO wallets VALUES ('0x...', 10.5, 1699564800);

-- Query cached data
SELECT * FROM wallets WHERE balance > 1.0;
```

## Tools

- `sqlite_query` - Execute SQL queries
- `sqlite_create_table` - Create tables
- `sqlite_insert` - Insert data

## GitHub

https://github.com/modelcontextprotocol/servers

---

**Version:** 1.0.0
