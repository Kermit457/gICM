# @gicm/cli

Official command-line interface for the [gICM marketplace](https://gicm-marketplace.vercel.app). Install agents, skills, commands, MCPs, and settings instantly to supercharge your Claude development workflow.

## Features

- 🚀 **389 curated items** - Agents, skills, commands, MCPs, and settings
- 🔗 **Automatic dependency resolution** - Install items with all their dependencies
- 📦 **Smart file management** - Files organized in `.claude/` directory structure
- ✨ **Progressive Disclosure** - 88-92% token savings on skill usage
- 🔒 **Type-safe** - Built with TypeScript for reliability

## Installation

Use `npx` to run the CLI without installing (recommended):

```bash
npx @gicm/cli add agent/code-reviewer
```

Or install globally:

```bash
npm install -g @gicm/cli
gicm add agent/code-reviewer
```

## Usage

### Install Items

Install one or more items from the marketplace:

```bash
npx @gicm/cli add <kind>/<slug> [<kind>/<slug>...]
```

**Examples:**

```bash
# Install a single agent
npx @gicm/cli add agent/icm-anchor-architect

# Install multiple items
npx @gicm/cli add agent/code-reviewer skill/typescript-advanced command/deploy-foundry

# Install with automatic yes (skip confirmation)
npx @gicm/cli add agent/smart-contract-auditor -y

# Verbose output
npx @gicm/cli add skill/solana-development -v
```

### Item Types

| Type | Format | Example |
|------|--------|---------|
| **Agents** | `agent/<slug>` | `agent/icm-anchor-architect` |
| **Skills** | `skill/<slug>` | `skill/anchor-macros-deep-dive` |
| **Commands** | `command/<slug>` | `command/anchor-init` |
| **MCPs** | `mcp/<slug>` | `mcp/github` |
| **Settings** | `setting/<slug>` | `setting/mcp-timeout-duration` |

## File Structure

Items are installed to your `.claude/` directory:

```
.claude/
├── agents/          # AI agents (*.md)
│   └── icm-anchor-architect.md
├── skills/          # Progressive disclosure skills
│   └── anchor-macros-deep-dive/
│       └── SKILL.md
├── commands/        # Slash commands (*.md)
│   └── anchor-init.md
├── mcp/            # MCP server configs (*.json)
│   └── github.json
└── settings/       # Claude settings by category
    └── performance/
        └── mcp-timeout-duration.md
```

## Popular Items

### Agents

```bash
# Solana development specialist
npx @gicm/cli add agent/icm-anchor-architect

# Frontend React/Next.js expert
npx @gicm/cli add agent/frontend-fusion-engine

# Smart contract security auditor
npx @gicm/cli add agent/smart-contract-auditor

# Code review specialist
npx @gicm/cli add agent/code-reviewer
```

### Skills

```bash
# Solana Anchor framework mastery
npx @gicm/cli add skill/anchor-macros-deep-dive

# Advanced TypeScript patterns
npx @gicm/cli add skill/typescript-advanced

# DeFi integration patterns
npx @gicm/cli add skill/defi-integration
```

### Commands

```bash
# Initialize Anchor program
npx @gicm/cli add command/anchor-init

# Deploy Foundry contracts
npx @gicm/cli add command/deploy-foundry

# Security audit workflow
npx @gicm/cli add command/security-audit
```

### MCPs (Model Context Protocols)

```bash
# GitHub integration
npx @gicm/cli add mcp/github

# Filesystem access
npx @gicm/cli add mcp/filesystem

# PostgreSQL database
npx @gicm/cli add mcp/postgres
```

**Note:** MCPs require additional configuration. After installation, edit the `.json` file in `.claude/mcp/` to add your API keys and settings.

### Settings

```bash
# Configure MCP timeout
npx @gicm/cli add setting/mcp-timeout-duration

# Enable lazy skill loading
npx @gicm/cli add setting/lazy-skill-loading

# Enable parallel tool execution
npx @gicm/cli add setting/parallel-tool-execution
```

## Dependencies

The CLI automatically resolves and installs dependencies:

```bash
# Installing icm-anchor-architect also installs:
# - rust-systems-architect (dependency)
# - solana-guardian-auditor (dependency)
npx @gicm/cli add agent/icm-anchor-architect

# Output:
# ✓ Found 3 items (including 2 dependencies)
```

## CLI Options

```
Usage: gicm add <items...> [options]

Options:
  -y, --yes              Skip confirmation prompt
  -v, --verbose          Show verbose output
  --api-url <url>        Custom API URL (for testing)
  -h, --help             Display help
```

## Examples

### Install Full Solana Development Stack

```bash
npx @gicm/cli add \
  agent/icm-anchor-architect \
  skill/anchor-macros-deep-dive \
  skill/solana-anchor-mastery \
  command/anchor-init \
  command/anchor-test \
  mcp/solana-agent-kit
```

### Install Security Audit Tools

```bash
npx @gicm/cli add \
  agent/smart-contract-auditor \
  agent/evm-security-auditor \
  command/security-audit \
  skill/solidity-security
```

### Install Frontend Development Stack

```bash
npx @gicm/cli add \
  agent/frontend-fusion-engine \
  skill/react-performance \
  skill/typescript-advanced \
  command/component-gen
```

## Token Savings

Skills use Progressive Disclosure technology to reduce token usage by 88-92%:

- **Traditional prompt**: 12,500 tokens (full codebase + docs)
- **Progressive Disclosure**: 980 tokens (only relevant context)
- **Savings**: 92% reduction, same quality

[Calculate your savings →](https://gicm-marketplace.vercel.app/savings)

## Troubleshooting

### Permission Denied

If you see `EACCES` errors:

```bash
# Linux/Mac: Fix permissions
sudo chown -R $(whoami) .claude/

# Windows: Run as administrator or check folder permissions
```

### Item Not Found

If an item doesn't exist:

```bash
# Search the marketplace
# Coming soon: gicm search <query>

# Browse online
# https://gicm-marketplace.vercel.app
```

### Connection Issues

If the CLI can't connect to the marketplace:

1. Check your internet connection
2. Verify the marketplace is accessible: https://gicm-marketplace.vercel.app
3. Try with `--api-url` flag if using a custom deployment

## Development

### Local Setup

```bash
# Clone repository
git clone https://github.com/Kermit457/gICM.git
cd gICM/packages/cli

# Install dependencies
npm install

# Build
npm run build

# Link locally
npm link

# Test
gicm add agent/code-reviewer
```

### Project Structure

```
packages/cli/
├── src/
│   ├── commands/
│   │   └── add.ts          # Add command implementation
│   ├── lib/
│   │   ├── api.ts          # Marketplace API client
│   │   ├── files.ts        # File writing utilities
│   │   └── types.ts        # TypeScript types
│   └── index.ts            # CLI entry point
├── package.json
├── tsconfig.json
└── README.md
```

## Support

- **Issues**: [GitHub Issues](https://github.com/Kermit457/gICM/issues)
- **Marketplace**: [gicm-marketplace.vercel.app](https://gicm-marketplace.vercel.app)
- **Documentation**: [Browse all items](https://gicm-marketplace.vercel.app)

## License

MIT

---

**Built for the Web3 builder community** 🚀
