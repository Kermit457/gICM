# OPUS 67 VSCode Extension - CHANGELOG

## [1.0.0] - 2025-12-04

### 🎉 Initial Release

First public release of OPUS 67 for VS Code.

### ✨ Features

#### Status Bar Integration
- Shows current operating mode with icon
- Click to switch modes
- Auto-updates based on file type
- Tooltip with mode description

#### Commands
- **Show Status** - Full status dashboard with stats
- **Browse Skills** - Browse 95 skills by category
- **Browse Agents** - Browse 82 agents by category
- **Select Mode** - Switch between 8 operating modes
- **Install in Project** - NPX installer integration
- **Open Documentation** - Quick link to opus67.dev

#### Operating Modes (8)
- **AUTO** - Auto-detect best approach
- **BUILD** - Ship fast, working code
- **REVIEW** - Thorough analysis
- **ARCHITECT** - System design thinking
- **DEBUG** - Root cause analysis
- **SOLANA** - Blockchain-native
- **GRAB** - Visual-first development
- **VIBE** - Ship fast, iterate later

#### Auto-Detection
- `.rs`, `.anchor` → SOLANA mode
- `.tsx`, `.jsx` → BUILD mode
- `.test.ts`, `.spec.ts` → REVIEW mode

#### Configuration
- `opus67.defaultMode` - Default operating mode
- `opus67.showStatusBar` - Show/hide status bar
- `opus67.autoDetectSkills` - Enable/disable auto-detection

#### UI
- Beautiful status dashboard with ASCII logo
- Stats display (95 skills, 84 MCPs, 30 modes, 82 agents)
- Category-based skill/agent browsing
- Quick pick menus with descriptions

### 📦 Package Details
- Bundle size: 10.5 KB (minified)
- VSIX size: 7.89 KB
- Total files: 6

### 🎯 What's Included

**95 Skills Across Categories:**
- GRAB Skills (4) - react-grab, theme-grab, form-grab, layout-grab
- Solana Skills (4) - token-swap, anchor-interact, chain-query, pump-launch
- Research Skills (3) - web-search, code-search, company-research
- Builder Skills (3) - api-scaffold, test-gen, doc-gen
- And 81 more...

**82 Agents Across Categories:**
- Vision Agents (3) - grabber, cloner, theme-extractor
- Solana Agents (3) - jupiter-trader, anchor-architect, defi-analyst
- Builder Agents (3) - fullstack-builder, api-designer, test-engineer
- And 73 more...

**84 MCPs:**
- GitHub MCP, Jupiter MCP, Supabase MCP, Sentry MCP
- Notion MCP, Solana RPC, Anchor Program, Firecrawl
- Tavily, Playwright, and 74 more...

**30 Modes:**
- AUTO, BUILD, REVIEW, ARCHITECT, DEBUG
- SOLANA, GRAB, CLONE, RESEARCH, CONTEXT
- ULTRA, THINK, VIBE, LIGHT, SWARM
- And 15 more...

### 📝 Notes

**Core Principle:**
```
OPUS 67 ≠ Separate AI
OPUS 67 = Your AI + Enhancement Layer

Same driver, better race car.
```

OPUS 67 is NOT a separate AI. It's an enhancement layer that gives your AI (Claude, etc.) superpowers through:
- Skills (workflows for complex tasks)
- MCPs (tools you don't normally have)
- Modes (optimized contexts)
- Memory (persistent context across sessions)

### 🔗 Links
- Website: [opus67.dev](https://opus67.dev)
- NPX: `npx create-opus67@latest`
- GitHub: [github.com/gicm-dev/gicm](https://github.com/gicm-dev/gicm)

---

## Roadmap

### [1.1.0] - Planned
- [ ] Keybindings for quick mode switching
- [ ] Inline suggestions for skills
- [ ] Workspace-level mode persistence
- [ ] Custom skill creation UI

### [1.2.0] - Planned
- [ ] MCP server integration
- [ ] Real-time skill detection
- [ ] Agent execution panel
- [ ] Memory system UI

### [2.0.0] - Planned
- [ ] Full BRAIN integration
- [ ] Multi-workspace support
- [ ] Team collaboration features
- [ ] Custom agent builder

---

## Contributing

See the main [gICM repository](https://github.com/gicm-dev/gicm) for contribution guidelines.

## License

MIT © Mirko Basil Doelger / ICM Motion
