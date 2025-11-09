# MCP Configuration Files

This directory contains Model Context Protocol (MCP) server configurations for Claude Desktop. MCPs extend Claude's capabilities by providing direct access to external services and tools.

## Overview

MCPs (Model Context Protocols) provide Claude with efficient access to external resources, reducing token usage by 70-90% compared to traditional methods. Each MCP is a standalone server that Claude communicates with to perform specific operations.

## Available MCPs

### 1. Filesystem MCP
**Purpose**: Local file operations and directory management
**Token Savings**: 80-90%
**Config File**: `filesystem.json`
**Documentation**: [filesystem-README.md](./filesystem-README.md)

**Key Features**:
- Read, write, create, and delete files
- Directory management and navigation
- Safe, restricted access to specified directories
- No environment variables required

**Quick Start**:
```bash
npm install -g @modelcontextprotocol/server-filesystem
```

---

### 2. Supabase MCP
**Purpose**: PostgreSQL database operations and management
**Token Savings**: 85%
**Config File**: `supabase.json`
**Documentation**: [supabase-README.md](./supabase-README.md)

**Key Features**:
- Database queries and operations
- Table creation and management
- Row Level Security (RLS) policy configuration
- Real-time subscriptions
- Schema inspection

**Required Environment Variables**:
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_KEY`: Service role key for admin operations

**Quick Start**:
```bash
npm install -g @modelcontextprotocol/server-supabase
```

---

### 3. Context7 MCP
**Purpose**: Documentation search and retrieval
**Token Savings**: 70-80%
**Config File**: `context7.json`
**Documentation**: [context7-README.md](./context7-README.md)

**Key Features**:
- Search official documentation (React, Next.js, Solana, Anchor, etc.)
- API reference lookup
- Code examples from official sources
- Version-specific documentation
- Multi-source aggregation

**Required Environment Variables**:
- `CONTEXT7_API_KEY`: API key from context7.com

**Quick Start**:
```bash
npm install -g @context7/mcp-server
```

**Get API Key**: Visit [context7.com](https://context7.com) and sign up

---

### 4. E2B MCP
**Purpose**: Secure code execution environment
**Token Savings**: Execution efficiency
**Config File**: `e2b.json`
**Documentation**: [e2b-README.md](./e2b-README.md)

**Key Features**:
- Execute Python, JavaScript, TypeScript, Rust code in sandbox
- Package installation (npm, pip, cargo)
- Web server testing
- Filesystem operations in sandbox
- Multi-language support (10+ languages)
- GPU acceleration (Pro tier)

**Required Environment Variables**:
- `E2B_API_KEY`: API key from e2b.dev

**Quick Start**:
```bash
npm install -g @e2b/mcp-server
```

**Get API Key**: Visit [e2b.dev](https://e2b.dev) and sign up
**Free Tier**: 100 hours/month execution time

---

### 5. GitHub MCP
**Purpose**: GitHub repository and workflow management
**Token Savings**: 75-85%
**Config File**: `github.json`
**Documentation**: [github-README.md](./github-README.md)

**Key Features**:
- Repository management (create, clone, update)
- Issue tracking and management
- Pull request operations
- Code search across repositories
- GitHub Actions automation
- Gists and release management

**Required Environment Variables**:
- `GITHUB_TOKEN`: Personal Access Token with appropriate scopes

**Quick Start**:
```bash
npm install -g @modelcontextprotocol/server-github
```

**Token Scopes Required**: `repo`, `workflow`, `read:org`, `read:user`

---

## Installation

### Global Installation (Recommended)
Install all MCPs globally for use across projects:

```bash
# Install all MCPs
npm install -g @modelcontextprotocol/server-filesystem
npm install -g @modelcontextprotocol/server-supabase
npm install -g @context7/mcp-server
npm install -g @e2b/mcp-server
npm install -g @modelcontextprotocol/server-github
```

### Local Installation
Install in specific project:

```bash
npm install @modelcontextprotocol/server-filesystem
npm install @modelcontextprotocol/server-supabase
npm install @context7/mcp-server
npm install @e2b/mcp-server
npm install @modelcontextprotocol/server-github
```

## Configuration

### Claude Desktop Setup

1. **Locate Claude Desktop Config**:
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
   - **Linux**: `~/.config/Claude/claude_desktop_config.json`

2. **Add MCP Servers**:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/your/project/path"]
    },
    "supabase": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-supabase"],
      "env": {
        "SUPABASE_URL": "your-project-url.supabase.co",
        "SUPABASE_SERVICE_KEY": "your-service-key"
      }
    },
    "context7": {
      "command": "npx",
      "args": ["-y", "@context7/mcp-server"],
      "env": {
        "CONTEXT7_API_KEY": "your-api-key"
      }
    },
    "e2b": {
      "command": "npx",
      "args": ["-y", "@e2b/mcp-server"],
      "env": {
        "E2B_API_KEY": "your-api-key"
      }
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "ghp_your_token"
      }
    }
  }
}
```

3. **Restart Claude Desktop** for changes to take effect

### Environment Variables

Create a `.env` file in your project root:

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key

# Context7
CONTEXT7_API_KEY=your-context7-api-key

# E2B
E2B_API_KEY=your-e2b-api-key

# GitHub
GITHUB_TOKEN=ghp_your_personal_access_token
```

**Security**: Add `.env` to `.gitignore` to prevent committing secrets!

## Usage Examples

### Filesystem MCP
```typescript
// Read configuration file
const config = await readFile('config.json');

// Write output file
await writeFile('output.json', JSON.stringify(data, null, 2));

// List directory contents
const files = await listDirectory('src/components');
```

### Supabase MCP
```sql
-- Query database
SELECT * FROM tokens WHERE active = true;

-- Create table with RLS
CREATE TABLE launches (
  id UUID PRIMARY KEY,
  token_mint TEXT NOT NULL,
  creator_wallet TEXT NOT NULL
);

ALTER TABLE launches ENABLE ROW LEVEL SECURITY;
```

### Context7 MCP
```typescript
// Search Next.js documentation
const docs = await context7.search({
  query: "Next.js App Router server components",
  sources: ["nextjs"],
  version: "14"
});

// Find Anchor patterns
const anchorDocs = await context7.search({
  query: "Anchor PDA derivation",
  sources: ["anchor", "solana"]
});
```

### E2B MCP
```python
# Execute Python code
result = await e2b.execute({
  language: "python",
  code: `
    import pandas as pd
    df = pd.DataFrame({'price': [100, 150, 200]})
    print(df.mean())
  `,
  packages: ["pandas"]
});
```

### GitHub MCP
```typescript
// Create pull request
const pr = await github.createPullRequest({
  owner: "username",
  repo: "project",
  title: "feat: Add new feature",
  head: "feature/new-feature",
  base: "main"
});

// Create issue
const issue = await github.createIssue({
  owner: "username",
  repo: "project",
  title: "Bug: Fix authentication",
  labels: ["bug", "priority-high"]
});
```

## Common Use Cases

### Full-Stack Development
1. **Filesystem** - Read/write code files
2. **Supabase** - Manage database schema
3. **Context7** - Look up framework documentation
4. **E2B** - Test code execution
5. **GitHub** - Create PRs and issues

### Solana Launch Platform
1. **Filesystem** - Manage Anchor program files
2. **Supabase** - Store launch data and analytics
3. **Context7** - Reference Anchor/Solana docs
4. **E2B** - Test Rust programs
5. **GitHub** - Version control and CI/CD

### Web3 Application
1. **Filesystem** - Manage smart contract code
2. **Supabase** - Store user data and transactions
3. **Context7** - Look up Web3 library docs
4. **E2B** - Test blockchain interactions
5. **GitHub** - Collaborate on codebase

## Troubleshooting

### General Issues

**Issue**: MCP not connecting
- **Solution**: Verify MCP package is installed
- **Solution**: Check Claude Desktop config file syntax
- **Solution**: Restart Claude Desktop
- **Solution**: Review logs in Claude Desktop settings

**Issue**: Environment variables not loading
- **Solution**: Verify `.env` file exists and is properly formatted
- **Solution**: Check environment variable names match exactly
- **Solution**: Restart Claude Desktop after changes
- **Solution**: Use absolute paths in config file

**Issue**: Permission errors
- **Solution**: Check filesystem permissions
- **Solution**: Verify API keys have required scopes
- **Solution**: Ensure tokens haven't expired

### MCP-Specific Issues

See individual README files for detailed troubleshooting:
- [Filesystem Troubleshooting](./filesystem-README.md#troubleshooting)
- [Supabase Troubleshooting](./supabase-README.md#troubleshooting)
- [Context7 Troubleshooting](./context7-README.md#troubleshooting)
- [E2B Troubleshooting](./e2b-README.md#troubleshooting)
- [GitHub Troubleshooting](./github-README.md#troubleshooting)

## Best Practices

### Security
1. **Never Commit Secrets**: Add `.env` to `.gitignore`
2. **Use Fine-Grained Tokens**: Minimal required permissions
3. **Rotate Keys Regularly**: Change API keys every 90 days
4. **Restrict Filesystem Access**: Only grant access to necessary directories
5. **Monitor Usage**: Review API usage and logs regularly

### Performance
1. **Cache Results**: Enable caching where available
2. **Batch Operations**: Group related operations together
3. **Use Appropriate MCPs**: Choose the right tool for the job
4. **Set Reasonable Timeouts**: Avoid hanging connections
5. **Monitor Rate Limits**: Implement exponential backoff

### Development Workflow
1. **Local Development**: Test MCPs locally before production
2. **Environment Separation**: Use different keys for dev/staging/prod
3. **Documentation**: Document MCP usage in project README
4. **Version Control**: Track MCP config changes in git (except secrets)
5. **Team Collaboration**: Share MCP setup instructions with team

## Token Efficiency Comparison

| Operation | Traditional | With MCP | Savings |
|-----------|------------|----------|---------|
| Read file | 300 tokens | 30 tokens | 90% |
| Database query | 400 tokens | 60 tokens | 85% |
| Doc search | 800 tokens | 160 tokens | 80% |
| Code execution | 500 tokens | 100 tokens | 80% |
| GitHub operation | 350 tokens | 50 tokens | 86% |

**Average Token Savings**: 80-90% across all operations

## Cost Analysis

### Free Tier Capabilities
- **Filesystem**: Unlimited (local operations)
- **Supabase**: 500MB database, 2GB bandwidth
- **Context7**: 1,000 requests/month
- **E2B**: 100 hours/month execution
- **GitHub**: 5,000 API requests/hour

### Pro Tier Costs (Approximate)
- **Supabase Pro**: $25/month
- **Context7 Pro**: $29/month
- **E2B Pro**: $29/month
- **GitHub Enterprise**: $21/user/month

**Total for Full Stack**: ~$104/month (Pro tier all services)

## Additional Resources

### Official Documentation
- [MCP Specification](https://modelcontextprotocol.io)
- [Claude Desktop](https://claude.ai/download)
- [Anthropic Documentation](https://docs.anthropic.com)

### Service Documentation
- [Supabase Docs](https://supabase.com/docs)
- [Context7 Docs](https://docs.context7.com)
- [E2B Docs](https://docs.e2b.dev)
- [GitHub API Docs](https://docs.github.com/en/rest)

### Community & Support
- [MCP Discord](https://discord.gg/modelcontextprotocol)
- [Anthropic Discord](https://discord.gg/anthropic)
- [GitHub Discussions](https://github.com/modelcontextprotocol/discussions)

## Version Information

| MCP | Package | Current Version | Compatibility |
|-----|---------|----------------|---------------|
| Filesystem | `@modelcontextprotocol/server-filesystem` | 1.0.0 | Claude Desktop 0.5.0+ |
| Supabase | `@modelcontextprotocol/server-supabase` | 1.0.0 | Claude Desktop 0.5.0+ |
| Context7 | `@context7/mcp-server` | 1.2.0 | Claude Desktop 0.5.0+ |
| E2B | `@e2b/mcp-server` | 2.1.0 | Claude Desktop 0.5.0+ |
| GitHub | `@modelcontextprotocol/server-github` | 1.0.0 | Claude Desktop 0.5.0+ |

**Node.js Requirement**: v16.0.0 or higher for all MCPs

## Contributing

To add a new MCP configuration:

1. Install the MCP package
2. Create `{mcp-name}.json` with configuration
3. Create `{mcp-name}-README.md` with documentation
4. Update this main README with new MCP details
5. Test thoroughly before committing
6. Submit PR with detailed description

## License

MCP configuration files are part of the gICM project.
Individual MCP packages are licensed by their respective authors.

---

**Last Updated**: November 6, 2025
**Maintained By**: ICM Motion Team
**Questions?** Open an issue or contact support
