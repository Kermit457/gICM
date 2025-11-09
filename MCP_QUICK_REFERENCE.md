# MCP Quick Reference Guide

## Valid MCP Packages - Ready to Use

These packages **exist on npm** and can be installed immediately:

```bash
# Core/Reference Servers
npx -y @modelcontextprotocol/server-filesystem
npx -y @modelcontextprotocol/server-memory
npx -y @modelcontextprotocol/server-sequential-thinking
npx -y @modelcontextprotocol/server-everything

# Integration Servers
npx -y @modelcontextprotocol/server-github
npx -y @modelcontextprotocol/server-gitlab
npx -y @modelcontextprotocol/server-postgres
npx -y @modelcontextprotocol/server-redis
npx -y @modelcontextprotocol/server-slack
npx -y @modelcontextprotocol/server-brave-search
npx -y @modelcontextprotocol/server-puppeteer
npx -y @modelcontextprotocol/server-aws-kb-retrieval
npx -y @modelcontextprotocol/server-google-maps
```

## Quick Fixes for Common Configs

### SQLite → Use Filesystem Server
```bash
# Instead of: npx @modelcontextprotocol/server-sqlite (doesn't exist)
npx -y @modelcontextprotocol/server-filesystem
# OR for direct SQLite access:
npm install better-sqlite3
```

### Playwright → Use Puppeteer
```bash
# Instead of: npx @modelcontextprotocol/server-playwright (doesn't exist)
npx -y @modelcontextprotocol/server-puppeteer
```

### Git → Use GitHub
```bash
# Instead of: npx @modelcontextprotocol/server-git (doesn't exist)
npx -y @modelcontextprotocol/server-github
```

### PostgreSQL (alternative spelling)
```bash
# Instead of: npx @modelcontextprotocol/server-postgresql (doesn't exist)
npx -y @modelcontextprotocol/server-postgres
```

### AWS → Use AWS KB Retrieval
```bash
# Instead of: npx @modelcontextprotocol/server-aws (doesn't exist)
npx -y @modelcontextprotocol/server-aws-kb-retrieval
```

## SDK Alternatives for Common Services

### Databases
```bash
# MongoDB
npm install mongodb

# Supabase
npm install @supabase/supabase-js

# PlanetScale
npm install @planetscale/database

# Prisma
npm install @prisma/client

# Elasticsearch
npm install @elastic/elasticsearch

# Redis (if not using MCP server)
npm install @upstash/redis
```

### Blockchain/Web3
```bash
# Ethereum (Alchemy/Infura/QuickNode)
npm install @alch/alchemy-sdk
npm install ethers
npm install web3

# Solana
npm install @solana/web3.js

# The Graph
npm install graphql-request
```

### Cloud Providers
```bash
# AWS
npm install @aws-sdk/client-*

# Google Cloud
npm install @google-cloud/*

# Azure
npm install @azure/*

# Vercel
npm install @vercel/client

# Netlify
npm install netlify

# Cloudflare
# Use Cloudflare API directly
```

### Productivity
```bash
# Notion
npm install @notionhq/client

# Linear
npm install @linear/sdk

# Jira
npm install jira-client

# Airtable
npm install airtable

# Figma (community)
npm install figma-mcp
```

### Communication
```bash
# Discord
npm install discord.js

# Slack (if not using MCP)
npm install @slack/web-api

# Twilio
npm install twilio

# SendGrid
npm install @sendgrid/mail
```

### AI/LLM
```bash
# OpenAI (GPT, DALL-E)
npm install openai

# Anthropic (Claude)
npm install @anthropic-ai/sdk

# Replicate
npm install replicate

# Hugging Face
npm install @huggingface/inference

# Groq
npm install groq-sdk
```

### Monitoring
```bash
# Sentry
npm install @sentry/node

# Datadog
npm install dd-trace

# PostHog
npm install posthog-node

# Mixpanel
npm install mixpanel
```

### Payments
```bash
# Stripe
npm install stripe
```

### Vector Databases
```bash
# Pinecone
npm install @pinecone-database/pinecone
```

### DevOps
```bash
# Docker
npm install dockerode

# Kubernetes
npm install @kubernetes/client-node
```

### Other Services
```bash
# E2B Sandbox
npm install @e2b/sdk

# Temporal
npm install @temporalio/client

# LaunchDarkly
npm install launchdarkly-node-server-sdk

# LangSmith
npm install langsmith

# Langfuse
npm install langfuse

# Logto
npm install @logto/node

# Infisical
npm install @infisical/sdk

# Google Drive
npm install googleapis
```

## Config File Format

All MCP configs now include status information:

```json
{
  "_comment": "⚠️ Warning about package status",
  "_note": "Explanation and recommendation",
  "_alternative": "Alternative package to use",
  "_status": "VALID_PACKAGE | CUSTOM_REQUIRED | SDK_DIRECT | API_SERVICE | etc.",
  "mcpServers": {
    "server-name": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-*"],
      "env": {}
    }
  }
}
```

## Status Codes

- **VALID_PACKAGE**: Package exists on npm, ready to use
- **CUSTOM_REQUIRED**: Custom implementation needed
- **SDK_DIRECT**: Use the service's SDK directly
- **API_SERVICE**: API service, not an MCP package
- **USE_ALTERNATIVE**: Use a different MCP package
- **USE_COMMUNITY**: Community package available
- **PLACEHOLDER**: Package doesn't exist yet

## Testing a Valid MCP

```bash
# Example: Test the GitHub MCP
npx -y @modelcontextprotocol/server-github

# In your Claude config (.claude/claude.json):
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "your-token-here"
      }
    }
  }
}
```

## Resources

- Official MCP Docs: https://github.com/modelcontextprotocol
- MCP Servers Repository: https://github.com/modelcontextprotocol/servers
- npm MCP Packages: https://www.npmjs.com/search?q=%40modelcontextprotocol
- Community MCP Registry: https://github.com/modelcontextprotocol/registry

---

*Last Updated: November 9, 2025*
*For full audit details, see MCP_AUDIT_REPORT.md*
