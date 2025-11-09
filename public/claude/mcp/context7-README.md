# Context7 MCP

## Overview
Context7 MCP provides intelligent documentation search and retrieval capabilities. It enables Claude to search through official documentation, API references, and technical guides across multiple frameworks and libraries with high accuracy and context awareness.

## What It Does
- **Documentation Search**: Search through official docs for React, Next.js, Solana, Anchor, and more
- **API Reference Lookup**: Quick access to API documentation and function signatures
- **Code Examples**: Retrieve relevant code examples from official sources
- **Version-Specific**: Access documentation for specific framework versions
- **Contextual Results**: AI-powered relevance ranking for search results
- **Multi-Source**: Aggregate results from multiple documentation sources

## Installation

### Global Installation
```bash
npm install -g @context7/mcp-server
```

### Local/Project Installation
```bash
npm install @context7/mcp-server
```

## Configuration

### Claude Desktop Configuration
Add to your Claude Desktop `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@context7/mcp-server"],
      "env": {
        "CONTEXT7_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

### Project-Specific Configuration
Add to `.claude/mcp/context7.json`:

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@context7/mcp-server"],
      "env": {
        "CONTEXT7_API_KEY": "your-context7-api-key-here"
      }
    }
  }
}
```

## Required Environment Variables

### CONTEXT7_API_KEY
- **Description**: API key for Context7 service
- **How to Get**:
  1. Visit [context7.com](https://context7.com)
  2. Sign up for an account
  3. Navigate to API Keys section in dashboard
  4. Generate a new API key
- **Security**: Keep this secret! Add to `.env` file, never commit

### Optional Environment Variables

#### CONTEXT7_MAX_RESULTS
- **Description**: Maximum number of search results to return
- **Default**: `10`
- **Range**: `1-50`
- **Example**: `"CONTEXT7_MAX_RESULTS": "20"`

#### CONTEXT7_CACHE_TTL
- **Description**: Cache time-to-live in seconds
- **Default**: `3600` (1 hour)
- **Example**: `"CONTEXT7_CACHE_TTL": "7200"`

## Usage Examples

### Search Framework Documentation
```typescript
// Search for Next.js App Router documentation
const results = await context7.search({
  query: "Next.js App Router server components",
  sources: ["nextjs"],
  version: "14"
});

// Search Anchor framework docs
const anchorDocs = await context7.search({
  query: "Anchor PDA derivation with seeds",
  sources: ["anchor", "solana"],
  version: "latest"
});
```

### API Reference Lookup
```typescript
// Find specific API documentation
const apiRef = await context7.lookup({
  function: "useWallet",
  library: "@solana/wallet-adapter-react",
  type: "hook"
});

// Get React hook documentation
const hookDocs = await context7.lookup({
  function: "useEffect",
  library: "react",
  version: "18"
});
```

### Code Example Search
```typescript
// Find implementation examples
const examples = await context7.examples({
  query: "bonding curve implementation",
  language: "rust",
  framework: "anchor"
});

// Get authentication examples
const authExamples = await context7.examples({
  query: "JWT authentication with Next.js",
  language: "typescript",
  framework: "nextjs"
});
```

### Multi-Source Search
```typescript
// Search across multiple documentation sources
const results = await context7.search({
  query: "wallet connection handling",
  sources: ["solana", "web3js", "wallet-adapter"],
  includeExamples: true
});
```

## Supported Documentation Sources

### Frontend Frameworks
- **React**: Components, hooks, API reference
- **Next.js**: App Router, Pages Router, API routes
- **Vue**: Composition API, Options API
- **Svelte**: Components, stores, lifecycle

### Blockchain & Web3
- **Solana**: Programs, runtime, web3.js
- **Anchor**: Framework, macros, testing
- **Ethereum**: Solidity, web3.js, ethers.js
- **Wallet Adapters**: Phantom, MetaMask, WalletConnect

### Backend & Databases
- **Node.js**: Core APIs, modules
- **Supabase**: Auth, database, storage, realtime
- **PostgreSQL**: SQL, functions, extensions
- **Prisma**: Schema, migrations, client API

### UI Libraries
- **Tailwind CSS**: Utilities, configuration
- **shadcn/ui**: Components, theming
- **Radix UI**: Primitives, accessibility
- **Framer Motion**: Animations, gestures

### Testing & Tools
- **Jest**: Testing, mocking, matchers
- **Playwright**: E2E testing, browser automation
- **TypeScript**: Types, configuration, compiler
- **Zod**: Schema validation, inference

## Configuration Options

### Source Filtering
```json
{
  "env": {
    "CONTEXT7_API_KEY": "your-key",
    "CONTEXT7_DEFAULT_SOURCES": "nextjs,react,typescript,solana,anchor"
  }
}
```

### Language Preferences
```json
{
  "env": {
    "CONTEXT7_API_KEY": "your-key",
    "CONTEXT7_PREFERRED_LANGUAGE": "typescript",
    "CONTEXT7_INCLUDE_EXAMPLES": "true"
  }
}
```

### Version Pinning
```json
{
  "env": {
    "CONTEXT7_API_KEY": "your-key",
    "CONTEXT7_VERSION_PINS": "nextjs:14,react:18,anchor:0.29"
  }
}
```

## Best Practices

### Search Queries
1. **Be Specific**: Include framework/library name in queries
2. **Version Awareness**: Specify versions when needed
3. **Use Keywords**: Include technical terms and API names
4. **Context Matters**: Provide context for better results
5. **Iterate**: Refine queries based on initial results

### Performance Optimization
1. **Cache Results**: Enable caching for frequently accessed docs
2. **Limit Results**: Set reasonable max results limit
3. **Filter Sources**: Narrow down to relevant documentation sources
4. **Batch Queries**: Group related searches when possible
5. **Monitor Usage**: Track API usage to optimize costs

### Development Workflow
1. **Local Development**: Use Context7 for quick doc lookups
2. **Code Reviews**: Verify implementations against official docs
3. **Learning**: Explore new APIs and patterns through examples
4. **Debugging**: Find solutions to common problems in docs
5. **Best Practices**: Discover recommended patterns from official sources

## Common Use Cases

### Solana Development
```typescript
// Find Anchor program patterns
await context7.search({
  query: "Anchor account validation constraints",
  sources: ["anchor"],
  includeExamples: true
});

// Get CPI documentation
await context7.search({
  query: "Cross Program Invocation invoke_signed",
  sources: ["solana", "anchor"]
});
```

### Next.js App Development
```typescript
// Server Components documentation
await context7.search({
  query: "Next.js 14 Server Components streaming",
  sources: ["nextjs"],
  version: "14"
});

// API route handlers
await context7.search({
  query: "Next.js App Router API route handlers POST",
  sources: ["nextjs"]
});
```

### TypeScript Type Safety
```typescript
// Advanced TypeScript patterns
await context7.search({
  query: "TypeScript conditional types mapped types",
  sources: ["typescript"]
});

// Zod schema validation
await context7.search({
  query: "Zod schema refinement custom validation",
  sources: ["zod"]
});
```

## Troubleshooting

### Common Issues

**Issue**: No results found
- **Solution**: Broaden search query or check source availability
- **Solution**: Verify the framework/library is supported
- **Solution**: Check API key validity and quota

**Issue**: API key invalid
- **Solution**: Verify API key is correct and active
- **Solution**: Check if key has expired or been revoked
- **Solution**: Ensure no extra whitespace in environment variable

**Issue**: Rate limit exceeded
- **Solution**: Implement caching to reduce API calls
- **Solution**: Upgrade to higher tier plan if needed
- **Solution**: Add delays between rapid successive calls

**Issue**: Outdated documentation
- **Solution**: Specify version in search query
- **Solution**: Force cache refresh if enabled
- **Solution**: Report outdated content to Context7 support

### Debug Mode
Enable verbose logging:

```json
{
  "env": {
    "CONTEXT7_API_KEY": "your-key",
    "CONTEXT7_DEBUG": "true",
    "CONTEXT7_LOG_LEVEL": "verbose"
  }
}
```

## Advanced Features

### Semantic Search
Context7 uses AI-powered semantic search to understand intent:

```typescript
// Natural language queries
await context7.search({
  query: "How do I prevent reentrancy attacks in Solana programs?",
  sources: ["solana", "anchor"],
  semanticSearch: true
});
```

### Documentation Versioning
Access historical documentation versions:

```typescript
// Search specific versions
await context7.search({
  query: "useEffect cleanup function",
  sources: ["react"],
  version: "17.0.2"
});
```

### Custom Documentation Sources
Add your own documentation sources:

```json
{
  "env": {
    "CONTEXT7_API_KEY": "your-key",
    "CONTEXT7_CUSTOM_SOURCES": "https://docs.yourcompany.com"
  }
}
```

## Token Efficiency

Context7 reduces token usage by:
- **Direct Access**: Fetch only relevant documentation sections
- **Summarization**: Get concise summaries instead of full docs
- **Caching**: Reuse previously fetched documentation
- **Filtering**: Narrow results to most relevant content

Average token savings: **70-80%** compared to manual documentation reading

## Integration Examples

### With ICM Anchor Architect Agent
```typescript
// Agent automatically uses Context7 for Anchor documentation
// No manual configuration needed in agent workflow
```

### With Frontend Fusion Engine
```typescript
// Lookup Next.js patterns during development
const nextjsPatterns = await context7.search({
  query: "Next.js App Router parallel routes",
  sources: ["nextjs"]
});
```

### In CI/CD Pipeline
```typescript
// Validate code against latest documentation
const validation = await context7.validate({
  code: sourceCode,
  framework: "anchor",
  version: "latest"
});
```

## Pricing & Limits

### Free Tier
- **Requests**: 1,000 per month
- **Results**: Up to 10 per request
- **Sources**: All supported sources
- **Caching**: 1 hour TTL

### Pro Tier
- **Requests**: 10,000 per month
- **Results**: Up to 50 per request
- **Sources**: All sources + custom sources
- **Caching**: Configurable TTL
- **Priority**: Faster response times

### Enterprise Tier
- **Requests**: Unlimited
- **Results**: Unlimited
- **Sources**: Custom integration available
- **Support**: Dedicated support team
- **SLA**: 99.9% uptime guarantee

## Additional Resources

- [Context7 Website](https://context7.com)
- [Context7 Documentation](https://docs.context7.com)
- [API Reference](https://docs.context7.com/api)
- [Discord Community](https://discord.gg/context7)
- [GitHub Examples](https://github.com/context7/examples)

## Version Information
- **Package**: `@context7/mcp-server`
- **Compatibility**: Claude Desktop 0.5.0+
- **Node.js**: v16.0.0 or higher
- **Current Version**: 1.2.0
