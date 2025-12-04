# create-opus67

> One-command installer for OPUS 67 - AI superpowers for any coding environment

```
   ██████╗ ██████╗ ██╗   ██╗███████╗     ██████╗ ███████╗
  ██╔═══██╗██╔══██╗██║   ██║██╔════╝    ██╔════╝ ╚════██║
  ██║   ██║██████╔╝██║   ██║███████╗    ███████╗     ██╔╝
  ██║   ██║██╔═══╝ ██║   ██║╚════██║    ██╔═══██╗   ██╔╝
  ╚██████╔╝██║     ╚██████╔╝███████║    ╚██████╔╝   ██║
   ╚═════╝ ╚═╝      ╚═════╝ ╚══════╝     ╚═════╝    ╚═╝
```

**140 Skills • 82 MCPs • 30 Modes • 84 Agents**

---

## Quick Start

```bash
npx create-opus67@latest
```

That's it. Follow the prompts to select your environment and installation type.

---

## What is OPUS 67?

> **OPUS 67 is NOT a separate AI.** It's your AI assistant with superpowers.

OPUS 67 enhances Claude, Cursor, VS Code, and other AI coding environments with:

- **140 Specialist Skills** - Pre-built workflows for every dev task
- **82 MCP Connections** - Live data, APIs, blockchain tools
- **30 Operating Modes** - Right context for each task type
- **84 Expert Agents** - Domain-specific personas

**Same driver, better race car.**

---

## CLI Commands

### Interactive Install (Default)
```bash
npx create-opus67
```

### Check Installation Status
```bash
npx create-opus67 status
```

### Update to Latest
```bash
npx create-opus67 update
```

### Browse Skills
```bash
npx create-opus67 skills
```

### List Agents
```bash
npx create-opus67 agents
```

### Generate Codespaces Config
```bash
npx create-opus67 codespaces
npx create-opus67 codespaces --type solana
```

### Generate Gitpod Config
```bash
npx create-opus67 gitpod
npx create-opus67 gitpod --type frontend
```

---

## Supported Environments

| Environment | Config File | Detection |
|-------------|-------------|-----------|
| **GitHub Codespaces** | `.devcontainer/devcontainer.json` | `CODESPACES` env |
| **Gitpod** | `.gitpod.yml` | `GITPOD_WORKSPACE_ID` env |
| **Claude Code** (Recommended) | `CLAUDE.md` | `~/.claude` |
| **Cursor** | `.cursorrules` | AppData/Cursor |
| **VS Code** | `.vscode/settings.json` | AppData/Code |
| **Windsurf** | `.windsurfrules` | AppData/Windsurf |
| **Zed** | `settings.json` | ~/.config/zed |
| **Manual** | `.opus67/config.json` | Always available |

---

## Installation Types

| Type | Skills | MCPs | Agents | Best For |
|------|--------|------|--------|----------|
| **Full** | 140 | 82 | 84 | Everything |
| **Solana** | 35 | 25 | 30 | Blockchain/Web3 |
| **Frontend** | 40 | 20 | 25 | React/Next.js |
| **Minimal** | 15 | 10 | 10 | Quick start |

---

## Example Output

```
$ npx create-opus67@latest

   ██████╗ ██████╗ ██╗   ██╗███████╗     ██████╗ ███████╗
  ██╔═══██╗██╔══██╗██║   ██║██╔════╝    ██╔════╝ ╚════██║
  ██║   ██║██████╔╝██║   ██║███████╗    ███████╗     ██╔╝
  ██║   ██║██╔═══╝ ██║   ██║╚════██║    ██╔═══██╗   ██╔╝
  ╚██████╔╝██║     ╚██████╔╝███████║    ╚██████╔╝   ██║
   ╚═════╝ ╚═╝      ╚═════╝ ╚══════╝     ╚═════╝    ╚═╝

                 Self-Evolving AI Runtime v5.1.0

  140 Skills • 82 MCPs • 30 Modes • 84 Agents

? Select your environment: Claude Code (Recommended)
? Select installation type: Full (140 skills, 82 MCPs, 84 agents)

Installing OPUS 67 v5.1.0...
  ├── Loading skills (140).............. ✓
  ├── Configuring MCPs (82)............. ✓
  ├── Setting up modes (30)............. ✓
  └── Generating config................. ✓

  ✓ OPUS 67 v5.1 "THE PRECISION UPDATE" installed successfully!

  What OPUS 67 gives you:
    • 140 specialist skills (auto-loaded based on task)
    • 82 MCP connections (live data, APIs, blockchain)
    • 30 optimized modes (right context for each task)
    • Multi-model routing (Opus/Sonnet/Haiku)

  Remember: Claude IS the brain. OPUS 67 = superpowers.
```

---

## Related Packages

| Package | Description |
|---------|-------------|
| [`@gicm/opus67`](https://www.npmjs.com/package/@gicm/opus67) | Core OPUS 67 runtime |
| [`create-opus67`](https://www.npmjs.com/package/create-opus67) | This installer |

---

## Links

- **Website:** [opus67.dev](https://opus67.dev)
- **Documentation:** [docs.opus67.dev](https://docs.opus67.dev)
- **GitHub:** [github.com/gicm-dev/gicm](https://github.com/gicm-dev/gicm)
- **npm:** [npmjs.com/package/create-opus67](https://www.npmjs.com/package/create-opus67)

---

## License

MIT © Mirko Basil Dölger / ICM Motion
