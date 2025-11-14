# gICM Marketplace - Installation Guide

## 🚀 Quick Start (30 Seconds)

Choose your preferred installation method:

### Method 1: Claude Code Marketplace (Recommended)

Add the gICM marketplace to your Claude Code instance:

```bash
/plugin marketplace add Kermit457/gICM
```

Then browse and install plugins:

```bash
# List all available plugins
/plugin list

# Install a specific plugin
/plugin install icm-anchor-architect

# Install with dependencies
/plugin install icm-anchor-architect --with-deps
```

**✅ Done!** Your plugins are now in `.claude/` and ready to use.

---

### Method 2: Standalone CLI

Install plugins directly without Claude Code:

```bash
# Install a plugin
npx @gicm/cli add agent/icm-anchor-architect

# Install multiple plugins
npx @gicm/cli add agent/icm-anchor-architect skill/solana-anchor-mastery command/anchor-init

# Install from a category
npx @gicm/cli add agents --all  # Install all agents
```

**✅ Done!** Plugins are installed to `.claude/` directory.

---

### Method 3: Manual Installation

Clone the repository and copy what you need:

```bash
# Clone the repository
git clone https://github.com/Kermit457/gICM.git
cd gICM

# Copy to your project
cp -r .claude/agents/icm-anchor-architect.md YOUR_PROJECT/.claude/agents/
cp -r .claude/skills/solana-anchor-mastery YOUR_PROJECT/.claude/skills/
```

---

## 📦 What Gets Installed?

All plugins install to your `.claude/` directory:

```
.claude/
├── agents/          # AI agents (*.md files)
│   ├── icm-anchor-architect.md
│   ├── frontend-fusion-engine.md
│   └── ...
├── skills/          # Progressive disclosure skills
│   ├── anchor-macros-deep-dive/
│   │   └── SKILL.md
│   └── ...
├── commands/        # Slash commands (*.md files)
│   ├── anchor-init.md
│   ├── deploy-foundry.md
│   └── ...
├── mcp/            # MCP server configs (*.json files)
│   ├── github.json
│   ├── solana-agent-kit.json
│   └── ...
└── settings/       # Claude settings
    ├── performance/
    └── security/
```

---

## 🎯 Popular Plugin Bundles

### Solana & Web3 Development

```bash
# Via Claude Code
/plugin install icm-anchor-architect
/plugin install frontend-fusion-engine
/plugin install smart-contract-auditor
/plugin install defi-integration-architect

# Via CLI
npx @gicm/cli add agent/icm-anchor-architect agent/frontend-fusion-engine agent/smart-contract-auditor agent/defi-integration-architect
```

### Full-Stack Development

```bash
# Via Claude Code
/plugin install fullstack-orchestrator
/plugin install database-schema-oracle
/plugin install api-design-architect
/plugin install typescript-precision-engineer

# Via CLI
npx @gicm/cli add agent/fullstack-orchestrator agent/database-schema-oracle agent/api-design-architect agent/typescript-precision-engineer
```

### Security & Testing

```bash
# Via Claude Code
/plugin install evm-security-auditor
/plugin install test-automation-engineer
/plugin install security-engineer

# Via CLI
npx @gicm/cli add agent/evm-security-auditor agent/test-automation-engineer agent/security-engineer
```

---

## 🔧 CLI Reference

### Installation Commands

```bash
# Install by type
npx @gicm/cli add agent/[name]
npx @gicm/cli add skill/[name]
npx @gicm/cli add command/[name]
npx @gicm/cli add mcp/[name]
npx @gicm/cli add setting/[name]

# Install all of a type
npx @gicm/cli add agents --all
npx @gicm/cli add skills --all

# Install from a stack preset
npx @gicm/cli add stack/solana-full-stack
```

### Utility Commands

```bash
# View CLI version
npx @gicm/cli --version

# Get help
npx @gicm/cli --help

# List available plugins
npx @gicm/cli list
```

---

## 🌐 Web Interface

Browse and download plugins visually:

1. Visit [gicm-marketplace.vercel.app](https://gicm-marketplace.vercel.app)
2. Browse 400+ plugins by category
3. Click "Add to Stack" for items you want
4. Download as ZIP or copy install commands

---

## ⚙️ Configuration

### Environment Variables

Some plugins require environment variables. Create a `.env` file:

```bash
# Blockchain RPC endpoints
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY

# API Keys
ANTHROPIC_API_KEY=sk-ant-xxx
ALCHEMY_API_KEY=xxx
HELIUS_API_KEY=xxx

# Database (for MCP integrations)
DATABASE_URL=postgresql://user:pass@host:5432/db
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx

# GitHub (for MCP)
GITHUB_TOKEN=ghp_xxx
```

Check each plugin's documentation for required variables.

### MCP Server Configuration

MCP servers are configured in `.claude/mcp/*.json` files. Example:

```json
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

---

## 🔍 Verify Installation

### Check Files

```bash
# List installed agents
ls .claude/agents/

# List installed skills
ls .claude/skills/

# List installed commands
ls .claude/commands/

# List installed MCPs
ls .claude/mcp/
```

### Test a Plugin

After installing `icm-anchor-architect`:

```bash
# Via Claude Code
claude "I want to build a Solana program with bonding curves"

# The icm-anchor-architect agent will be available
```

---

## 🐛 Troubleshooting

### "Plugin not found"

**Problem:** Claude Code can't find the marketplace.

**Solution:** Verify you've added the marketplace:

```bash
/plugin marketplace add Kermit457/gICM
/plugin marketplace list  # Verify it's added
```

### "Permission denied"

**Problem:** Can't write to `.claude/` directory.

**Solution:** Run with appropriate permissions or change directory ownership:

```bash
mkdir -p .claude
chmod -R 755 .claude
```

### "Invalid JSON" Error

**Problem:** MCP config file is malformed.

**Solution:** Validate JSON files:

```bash
cat .claude/mcp/github.json | json_pp
```

### CLI Not Working

**Problem:** `npx @gicm/cli` fails.

**Solution:** Ensure Node.js 18+ is installed:

```bash
node --version  # Should be v18 or higher
npm --version   # Should be v9 or higher
```

---

## 📚 Next Steps

After installation:

1. **Read the docs:** [.claude-plugin/README.md](.claude-plugin/README.md)
2. **Explore plugins:** [Browse marketplace](https://gicm-marketplace.vercel.app)
3. **Build a stack:** Try the [AI Stack Builder](https://gicm-marketplace.vercel.app/workflow)
4. **Join community:** [Discord](#) | [Twitter](#)

---

## 💡 Pro Tips

### Install by Workflow

```bash
# For a Solana DeFi project
npx @gicm/cli add stack/solana-defi-protocol

# For an NFT marketplace
npx @gicm/cli add stack/nft-marketplace

# For full-stack Web3 app
npx @gicm/cli add stack/web3-saas-api
```

### Update Plugins

```bash
# Re-run install command to get latest version
npx @gicm/cli add agent/icm-anchor-architect

# Or pull latest from GitHub
cd gICM && git pull origin main
```

### Customize Plugins

Edit files in `.claude/` to customize behavior:

```bash
# Edit an agent
code .claude/agents/icm-anchor-architect.md

# Edit a skill
code .claude/skills/solana-anchor-mastery/SKILL.md
```

---

## 🔗 Resources

- **Marketplace:** https://gicm-marketplace.vercel.app
- **GitHub:** https://github.com/Kermit457/gICM
- **Issues:** https://github.com/Kermit457/gICM/issues
- **NPM Package:** https://www.npmjs.com/package/@gicm/cli
- **Claude Code Docs:** https://docs.claude.com/claude-code

---

## 📄 License

MIT - See [LICENSE](LICENSE) for details

---

**Built for the Web3 builder community** 🚀
*The only Claude Code marketplace specialized for Solana, DeFi, and blockchain development*
