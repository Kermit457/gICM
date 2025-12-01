# gICM Agent Team - Quick Reference

> **Last Updated:** 2025-11-30
> **Status:** All 33 packages built & published to npm

---

## Quick Start

```bash
# Clone and setup
git clone <repo>
cd gICM
pnpm install
pnpm build:all

# Run specific engine
pnpm money:status
pnpm growth:status
pnpm product:discover
pnpm autonomy:status
```

---

## NPM Packages

All packages published under `@gicm` org. Install any package:

```bash
npm install @gicm/<package-name>
```

### Core (build first)
| Package | Install | Purpose |
|---------|---------|---------|
| `@gicm/agent-core` | `npm i @gicm/agent-core` | Base agent class, LLM client |
| `@gicm/brain-config` | `npm i @gicm/brain-config` | Shared configuration |
| `@gicm/cli` | `npm i -g @gicm/cli` | CLI tool |

### Agents
| Package | Install | Purpose |
|---------|---------|---------|
| `@gicm/wallet-agent` | `npm i @gicm/wallet-agent` | Wallet ops, swaps |
| `@gicm/defi-agent` | `npm i @gicm/defi-agent` | DeFi protocols |
| `@gicm/hunter-agent` | `npm i @gicm/hunter-agent` | Opportunity discovery |
| `@gicm/decision-agent` | `npm i @gicm/decision-agent` | Trade decisions |
| `@gicm/audit-agent` | `npm i @gicm/audit-agent` | Smart contract audits |
| `@gicm/nft-agent` | `npm i @gicm/nft-agent` | NFT operations |
| `@gicm/dao-agent` | `npm i @gicm/dao-agent` | DAO governance |
| `@gicm/social-agent` | `npm i @gicm/social-agent` | Social automation |
| `@gicm/bridge-agent` | `npm i @gicm/bridge-agent` | Cross-chain bridging |
| `@gicm/builder-agent` | `npm i @gicm/builder-agent` | Code generation |
| `@gicm/refactor-agent` | `npm i @gicm/refactor-agent` | Code refactoring |
| `@gicm/deployer-agent` | `npm i @gicm/deployer-agent` | Deployments |

### Engines
| Package | Install | Purpose |
|---------|---------|---------|
| `@gicm/money-engine` | `npm i @gicm/money-engine` | Treasury, DCA trading |
| `@gicm/growth-engine` | `npm i @gicm/growth-engine` | Content, marketing |
| `@gicm/product-engine` | `npm i @gicm/product-engine` | Auto product dev |

### Orchestration
| Package | Install | Purpose |
|---------|---------|---------|
| `@gicm/autonomy` | `npm i @gicm/autonomy` | Bounded autonomy |
| `@gicm/orchestrator` | `npm i @gicm/orchestrator` | Multi-agent orchestration |
| `@gicm/hub` | `npm i @gicm/hub` | Central coordination |
| `@gicm/hyper-brain` | `npm i @gicm/hyper-brain` | Advanced AI orchestration |

---

## Build Commands

```bash
# Build everything
pnpm build:all

# Build specific groups
pnpm build:core      # agent-core + brain-config
pnpm build:agents    # All *-agent packages
pnpm build:engines   # money, growth, product engines
pnpm build:packages  # All packages

# Build single package
pnpm --filter @gicm/wallet-agent build
```

---

## CLI Commands

```bash
# Money Engine
pnpm money status          # Treasury status
pnpm money trade           # Manual DCA

# Growth Engine
pnpm growth status         # Marketing metrics
pnpm growth generate blog  # Generate blog post

# Product Engine
pnpm product discover      # Run discovery
pnpm product backlog       # View opportunities

# Autonomy
pnpm autonomy status       # Engine status
pnpm autonomy queue        # Pending approvals

# Hunter
pnpm hunter scan           # Scan for opportunities
```

---

## Agent Pattern

All agents extend `BaseAgent`:

```typescript
import { BaseAgent } from "@gicm/agent-core";

export class MyAgent extends BaseAgent {
  async run(input: unknown): Promise<unknown> {
    this.emit("started");
    // ... implementation
    this.emit("completed", result);
    return result;
  }
}
```

---

## Environment Setup

Copy `.env.example` to `.env` and fill in required keys:

```bash
cp .env.example .env
```

**Required keys:**
- `ANTHROPIC_API_KEY` or `GEMINI_API_KEY` (at least one LLM)
- `SOLANA_RPC_URL` (for blockchain ops)
- `GITHUB_TOKEN` (for discovery)

---

## File Structure

```
gICM/
├── packages/           # All @gicm packages
│   ├── agent-core/     # Base infrastructure
│   ├── *-agent/        # Individual agents
│   ├── *-engine/       # Autonomous engines
│   └── autonomy/       # Bounded autonomy
├── services/           # Backend services
│   ├── ai-hedge-fund/  # Python trading
│   └── context-engine/ # Python MCP server
├── apps/               # Frontend apps
│   └── marketplace/    # Next.js marketplace
├── CLAUDE.md           # Full documentation
├── AGENTS.md           # This file
└── .env.example        # Environment template
```

---

## Publishing

```bash
# Publish all packages
pnpm publish:all

# Publish single package
cd packages/<name>
npm version patch
pnpm publish --access public --no-git-checks
```

---

## Support

- **Full docs:** `CLAUDE.md`
- **Env vars:** `.env.example`
- **NPM org:** https://www.npmjs.com/org/gicm
