# Supabase MCP

## Overview
The Supabase MCP enables Claude to query databases, manage tables, and configure Row Level Security (RLS) policies with 85% token reduction. This MCP provides seamless integration with Supabase PostgreSQL databases.

## What It Does
- **Database Queries**: Execute SQL queries and read data
- **Table Management**: Create, modify, and manage database tables
- **RLS Policies**: Configure and manage Row Level Security policies
- **Schema Operations**: View and modify database schema
- **Real-time Subscriptions**: Access real-time data changes
- **Token Optimization**: 85% reduction in token usage for database operations

## Installation

### Global Installation
```bash
npm install -g @modelcontextprotocol/server-supabase
```

### Local/Project Installation
```bash
npm install @modelcontextprotocol/server-supabase
```

## Configuration

### Claude Desktop Configuration
Add to your Claude Desktop `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-supabase"],
      "env": {
        "SUPABASE_URL": "https://your-project.supabase.co",
        "SUPABASE_SERVICE_KEY": "your-service-role-key"
      }
    }
  }
}
```

### Project-Specific Configuration
Add to `.claude/mcp/supabase.json`:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-supabase"],
      "env": {
        "SUPABASE_URL": "your-project-url.supabase.co",
        "SUPABASE_SERVICE_KEY": "your-service-role-key-here"
      }
    }
  }
}
```

## Required Environment Variables

### SUPABASE_URL
- **Description**: Your Supabase project URL
- **Format**: `https://[project-id].supabase.co`
- **Location**: Found in Supabase Dashboard → Settings → API
- **Example**: `https://abcdefghijklmnop.supabase.co`

### SUPABASE_SERVICE_KEY
- **Description**: Service role key for admin operations
- **Security**: Keep this secret! Never commit to version control
- **Location**: Found in Supabase Dashboard → Settings → API → Service Role Key
- **Note**: Use service role key for full database access (not anon key)

### Getting Your Keys

1. Go to your Supabase project dashboard
2. Navigate to Settings → API
3. Copy the **Project URL** for `SUPABASE_URL`
4. Copy the **service_role** key (not anon key) for `SUPABASE_SERVICE_KEY`

## Usage Examples

### Querying Data
```sql
-- Query all users
SELECT * FROM users WHERE active = true;

-- Join tables
SELECT
  users.name,
  posts.title,
  posts.created_at
FROM users
JOIN posts ON posts.user_id = users.id
ORDER BY posts.created_at DESC;
```

### Table Management
```sql
-- Create a new table
CREATE TABLE tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  symbol TEXT NOT NULL,
  name TEXT NOT NULL,
  supply BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add a column
ALTER TABLE tokens ADD COLUMN price_usd DECIMAL(20, 8);

-- Create an index
CREATE INDEX idx_tokens_symbol ON tokens(symbol);
```

### RLS Policies
```sql
-- Enable RLS
ALTER TABLE tokens ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can read all tokens
CREATE POLICY "Public read access"
ON tokens FOR SELECT
TO authenticated
USING (true);

-- Create policy: Only token creator can update
CREATE POLICY "Creator update access"
ON tokens FOR UPDATE
TO authenticated
USING (auth.uid() = creator_id);

-- View existing policies
SELECT * FROM pg_policies WHERE tablename = 'tokens';
```

### Schema Inspection
```sql
-- View all tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';

-- Describe table structure
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'tokens';

-- View foreign keys
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY';
```

### Data Operations
```sql
-- Insert data
INSERT INTO tokens (symbol, name, supply, creator_id)
VALUES ('SOL', 'Solana', 1000000000, 'user-uuid-here')
RETURNING *;

-- Update data
UPDATE tokens
SET price_usd = 25.50
WHERE symbol = 'SOL';

-- Delete data
DELETE FROM tokens
WHERE created_at < NOW() - INTERVAL '1 year';
```

## Configuration Options

### Connection Pooling
For high-traffic applications, use Supabase's connection pooling:

```json
{
  "env": {
    "SUPABASE_URL": "https://your-project.supabase.co",
    "SUPABASE_SERVICE_KEY": "your-key",
    "SUPABASE_DB_POOLER": "true"
  }
}
```

### Custom Schema
To work with custom schemas (not just `public`):

```json
{
  "env": {
    "SUPABASE_URL": "https://your-project.supabase.co",
    "SUPABASE_SERVICE_KEY": "your-key",
    "SUPABASE_SCHEMA": "custom_schema"
  }
}
```

## Best Practices

### Security
1. **Never Commit Keys**: Add `.env` files to `.gitignore`
2. **Use Service Role Carefully**: Service role bypasses RLS
3. **Implement RLS**: Always enable RLS for user-facing tables
4. **Validate Input**: Use prepared statements and parameterized queries
5. **Audit Logs**: Enable Supabase audit logging for production

### Performance
1. **Use Indexes**: Create indexes on frequently queried columns
2. **Optimize Queries**: Use EXPLAIN ANALYZE to profile queries
3. **Limit Results**: Always use LIMIT for large tables
4. **Connection Pooling**: Enable for high-traffic applications
5. **Cache Results**: Cache frequently accessed data

### Development Workflow
1. **Local Development**: Use Supabase local development setup
2. **Migration Scripts**: Store all schema changes as migration files
3. **Testing**: Use separate test database for development
4. **Backup**: Regular database backups before major changes
5. **Version Control**: Track schema changes in git

## Common Use Cases

### Launch Platform Database
```sql
-- Token launches table
CREATE TABLE launches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token_mint TEXT NOT NULL UNIQUE,
  creator_wallet TEXT NOT NULL,
  name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  image_url TEXT,
  bonding_curve_type TEXT DEFAULT 'exponential',
  initial_supply BIGINT NOT NULL,
  liquidity_usd DECIMAL(20, 2),
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  launched_at TIMESTAMP WITH TIME ZONE
);

-- RLS: Public read, authenticated create
ALTER TABLE launches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view launches"
ON launches FOR SELECT
USING (true);

CREATE POLICY "Authenticated can create launches"
ON launches FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = creator_wallet);
```

### Real-time Price Updates
```sql
-- Token prices table
CREATE TABLE token_prices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token_mint TEXT NOT NULL,
  price_usd DECIMAL(20, 8) NOT NULL,
  volume_24h DECIMAL(20, 2),
  market_cap DECIMAL(20, 2),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE token_prices;
```

## Troubleshooting

### Common Issues

**Issue**: Connection refused or timeout
- **Solution**: Verify `SUPABASE_URL` is correct and includes `https://`
- **Solution**: Check if Supabase project is active (not paused)
- **Solution**: Verify network connectivity and firewall rules

**Issue**: Authentication failed
- **Solution**: Ensure using service_role key (not anon key)
- **Solution**: Verify key hasn't been rotated in Supabase dashboard
- **Solution**: Check for extra whitespace in environment variable

**Issue**: Permission denied on query
- **Solution**: Verify RLS policies allow the operation
- **Solution**: Use service_role key for admin operations
- **Solution**: Check user authentication and role

**Issue**: MCP not finding tables
- **Solution**: Verify tables exist in `public` schema
- **Solution**: Check schema configuration if using custom schema
- **Solution**: Ensure service role has access to schema

### Debug Mode
Enable debug logging:

```json
{
  "env": {
    "SUPABASE_URL": "...",
    "SUPABASE_SERVICE_KEY": "...",
    "DEBUG": "supabase:*"
  }
}
```

## Token Savings Comparison

| Operation | Traditional Method | With Supabase MCP | Savings |
|-----------|-------------------|-------------------|---------|
| Simple SELECT | ~250 tokens | ~40 tokens | 84% |
| Complex JOIN | ~600 tokens | ~90 tokens | 85% |
| CREATE TABLE | ~400 tokens | ~60 tokens | 85% |
| RLS Policy Setup | ~500 tokens | ~75 tokens | 85% |
| Schema Inspection | ~800 tokens | ~120 tokens | 85% |

## Integration with Other Tools

### With Filesystem MCP
```bash
# Export schema to file
pg_dump -s > schema.sql

# Import data from CSV
COPY tokens(symbol, name, supply)
FROM '/path/to/tokens.csv'
DELIMITER ','
CSV HEADER;
```

### With Next.js
```typescript
// Use in server actions or API routes
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);
```

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [MCP Documentation](https://modelcontextprotocol.io)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Database Performance Optimization](https://supabase.com/docs/guides/database/performance)

## Version Information
- **Package**: `@modelcontextprotocol/server-supabase`
- **Compatibility**: Claude Desktop 0.5.0+
- **Node.js**: v16.0.0 or higher
- **Supabase**: Compatible with all Supabase projects
