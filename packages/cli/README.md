# @gicm/cli

> Command-line tool for installing agents, skills, commands, and MCPs from the gICM marketplace

## Installation

```bash
# Run directly with npx (no installation needed)
npx @gicm/cli add agent/hardhat-deployment-specialist

# Or install globally
npm install -g @gicm/cli
gicm add agent/hardhat-deployment-specialist
```

## Usage

### Install an item

```bash
# Install an agent
gicm add agent/hardhat-deployment-specialist

# Install a skill
gicm add skill/uniswap-v3-liquidity-math

# Install a command
gicm add command/deploy-hardhat

# Install an MCP
gicm add mcp/alchemy

# Skip confirmation prompts
gicm add agent/foundry-testing-expert --yes

# Skip dependencies
gicm add agent/uniswap-v3-integration-specialist --no-deps
```

### List installed items

```bash
# List all installed items
gicm list

# List only agents
gicm list --kind agent

# List only skills
gicm list --kind skill
```

### Search the marketplace

```bash
# Search by keyword
gicm search "flash loan"

# Search with filters
gicm search "solana" --kind skill
gicm search "defi" --tag "Uniswap"
```

### Remove an item

```bash
# Remove an installed item
gicm remove agent/hardhat-deployment-specialist

# Skip confirmation
gicm remove skill/aave-flashloan-patterns --yes
```

## How it works

1. **Fetches from API**: CLI connects to gICM marketplace API
2. **Resolves dependencies**: Automatically installs required dependencies
3. **Downloads files**: Fetches agent/skill/command/MCP files
4. **Installs locally**: Copies files to your `.claude/` directory
5. **Tracks installations**: Maintains config in `.claude/gicm-config.json`

## File locations

Items are installed to:
- **Agents**: `.claude/agents/`
- **Skills**: `.claude/skills/`
- **Commands**: `.claude/commands/`
- **MCPs**: `.claude/mcp/`

## Configuration

The CLI looks for `.claude` directory in:
1. Current working directory
2. User home directory (fallback)

Configuration is stored in `.claude/gicm-config.json`

## Environment Variables

- `GICM_API_URL`: Override API endpoint (default: `https://gicm.dev/api`)

## Examples

### Install a complete stack

```bash
# Install Hardhat deployment specialist with dependencies
gicm add agent/hardhat-deployment-specialist

# Install Uniswap V3 integration (includes ethers.js dependency)
gicm add agent/uniswap-v3-integration-specialist

# Install multiple items
gicm add skill/foundry-fuzzing-techniques
gicm add skill/merkle-tree-airdrops
gicm add command/gas-report
```

### Manage installations

```bash
# See what's installed
gicm list

# Search for DeFi tools
gicm search "aave"

# Remove unused items
gicm remove agent/old-agent --yes
```

## Development

```bash
# Clone repo
git clone https://github.com/gicm/gicm.git
cd gicm/packages/cli

# Install dependencies
npm install

# Build
npm run build

# Test locally
node bin/gicm.js add agent/test-agent
```

## License

MIT
