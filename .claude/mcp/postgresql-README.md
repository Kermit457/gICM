# PostgreSQL MCP Server

Provides read-only access to PostgreSQL databases with schema inspection and safe query execution.

## Overview

The PostgreSQL MCP Server enables AI assistants to interact with PostgreSQL databases through natural language queries. It provides schema exploration, read-only query execution, and supports both local and cloud PostgreSQL instances including Azure PostgreSQL.

## Installation

```bash
# Install via gICM
npx gicm-stack add mcp/postgresql

# Or configure manually in .claude/mcp.json
{
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres", "postgresql://localhost/mydb"]
    }
  }
}
```

## Environment Variables

```bash
# Required
DATABASE_URL=postgresql://user:password@localhost:5432/database_name

# Optional - for Azure PostgreSQL
AZURE_POSTGRESQL_HOST=myserver.postgres.database.azure.com
AZURE_POSTGRESQL_USER=myuser@myserver
AZURE_POSTGRESQL_PASSWORD=mypassword
AZURE_POSTGRESQL_DATABASE=mydb
```

## Features

### Schema Exploration
- List all databases
- Inspect table schemas
- View column types and constraints
- Explore relationships and foreign keys

### Safe Query Execution
- **Read-only mode** - Prevents data modification
- SQL query execution with result limiting
- Automatic query sanitization
- Transaction rollback on errors

### Azure PostgreSQL Support
- Native Azure PostgreSQL integration
- Managed identity authentication
- Connection pooling
- SSL/TLS encryption

## Usage Examples

### Basic Queries

```typescript
// List all tables
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public';

// Inspect table schema
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users';

// Query data (read-only)
SELECT * FROM users WHERE created_at > NOW() - INTERVAL '7 days' LIMIT 100;
```

### Natural Language Queries

"Show me all users created in the last week"
"What are the columns in the transactions table?"
"Find the most recent orders"

### Web3 Use Cases

```sql
-- Query blockchain event logs stored in PostgreSQL
SELECT * FROM event_logs
WHERE contract_address = '0x...'
ORDER BY block_number DESC
LIMIT 100;

-- Analyze user wallet balances
SELECT wallet_address, SUM(balance) as total_balance
FROM user_wallets
GROUP BY wallet_address
HAVING SUM(balance) > 1000;

-- Track NFT ownership history
SELECT * FROM nft_transfers
WHERE token_id = 123
ORDER BY timestamp DESC;
```

## Tools Provided

### `postgres_query`
Execute read-only SQL queries against the database.

**Parameters:**
- `query` (string): SQL query to execute
- `limit` (number, optional): Maximum rows to return (default: 100)

**Example:**
```json
{
  "tool": "postgres_query",
  "arguments": {
    "query": "SELECT * FROM users WHERE role = 'admin'",
    "limit": 50
  }
}
```

### `postgres_list_tables`
List all tables in the database.

**Example:**
```json
{
  "tool": "postgres_list_tables",
  "arguments": {}
}
```

### `postgres_describe_table`
Get schema information for a specific table.

**Parameters:**
- `table_name` (string): Name of the table

**Example:**
```json
{
  "tool": "postgres_describe_table",
  "arguments": {
    "table_name": "users"
  }
}
```

## Security

- **Read-only access** - Cannot INSERT, UPDATE, or DELETE
- **Connection pooling** - Efficient resource management
- **Query timeout** - Prevents long-running queries
- **Result limiting** - Prevents memory exhaustion
- **SQL injection protection** - Parameterized queries

## Performance Considerations

- **Indexing**: Ensure proper indexes for frequently queried columns
- **Query limits**: Use LIMIT to prevent large result sets
- **Connection pooling**: Reuses connections for better performance
- **Read replicas**: Use read replicas for heavy query loads

## Configuration Options

```json
{
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-postgres",
        "postgresql://localhost/mydb"
      ],
      "env": {
        "PGCONNECT_TIMEOUT": "30",
        "PGSTATEMENT_TIMEOUT": "60000"
      }
    }
  }
}
```

## Troubleshooting

**Connection failed:**
- Verify DATABASE_URL is correct
- Check PostgreSQL server is running
- Ensure firewall allows connections
- Verify user has SELECT permissions

**Slow queries:**
- Add indexes to frequently queried columns
- Use LIMIT to reduce result size
- Consider using EXPLAIN to analyze query plans
- Check for missing foreign key indexes

## Best Practices

1. **Use connection pooling** for production deployments
2. **Set query timeouts** to prevent runaway queries
3. **Limit result sizes** with LIMIT clauses
4. **Use read replicas** for heavy query workloads
5. **Enable SSL/TLS** for remote connections
6. **Monitor query performance** with pg_stat_statements

## Related MCPs

- [Supabase MCP](./supabase-README.md) - Full Supabase integration
- [SQLite MCP](./sqlite-README.md) - Lightweight local database
- [MongoDB MCP](./mongodb-README.md) - NoSQL alternative

## GitHub Repository

https://github.com/modelcontextprotocol/servers

## License

MIT License - See repository for full license text

---

**Last Updated:** 2025-11-08
**Version:** 1.0.0
**Compatibility:** Claude Code, Cursor, VS Code with MCP support
