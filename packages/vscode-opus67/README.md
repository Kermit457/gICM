# OPUS 67 for VS Code

> AI superpowers for VS Code - 95 Skills, 84 MCPs, 30 Modes, 82 Agents

```
   ██████╗ ██████╗ ██╗   ██╗███████╗     ██████╗ ███████╗
  ██╔═══██╗██╔══██╗██║   ██║██╔════╝    ██╔════╝ ╚════██║
  ██║   ██║██████╔╝██║   ██║███████╗    ███████╗     ██╔╝
  ██║   ██║██╔═══╝ ██║   ██║╚════██║    ██╔═══██╗   ██╔╝
  ╚██████╔╝██║     ╚██████╔╝███████║    ╚██████╔╝   ██║
   ╚═════╝ ╚═╝      ╚═════╝ ╚══════╝     ╚═════╝    ╚═╝
```

**OPUS 67 ≠ Separate AI. OPUS 67 = Your AI + Enhancement Layer.**

Same driver, better race car.

---

## Features

### Status Bar Integration
- Shows current operating mode
- Click to switch modes
- Auto-detects mode based on file type

### Commands

| Command | Description |
|---------|-------------|
| `OPUS 67: Show Status` | Display full status dashboard |
| `OPUS 67: Browse Skills` | Browse available skills by category |
| `OPUS 67: Browse Agents` | Browse available agents by category |
| `OPUS 67: Select Mode` | Switch operating mode |
| `OPUS 67: Install in Project` | Run NPX installer in current project |
| `OPUS 67: Open Documentation` | Open opus67.dev |

### Operating Modes

| Mode | Description |
|------|-------------|
| **AUTO** | Auto-detect best approach |
| **BUILD** | Ship fast, working code |
| **REVIEW** | Thorough analysis |
| **ARCHITECT** | System design thinking |
| **DEBUG** | Root cause analysis |
| **SOLANA** | Blockchain-native |
| **GRAB** | Visual-first development |
| **VIBE** | Ship fast, iterate later |

### Auto-Detection

The extension automatically switches modes based on file type:
- `.rs`, `.anchor` → SOLANA mode
- `.tsx`, `.jsx` → BUILD mode
- `.test.ts`, `.spec.ts` → REVIEW mode

---

## Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `opus67.defaultMode` | `AUTO` | Default operating mode |
| `opus67.showStatusBar` | `true` | Show status bar item |
| `opus67.autoDetectSkills` | `true` | Auto-detect mode based on file type |

---

## Installation

### From VS Code Marketplace

Search for "OPUS 67" in the Extensions view.

### From VSIX

1. Download `opus67-1.0.0.vsix`
2. In VS Code: Extensions → ... → Install from VSIX

### From NPX (adds config to project)

```bash
npx create-opus67@latest
```

---

## Links

- **Website:** [opus67.dev](https://opus67.dev)
- **NPX Installer:** `npx create-opus67@latest`
- **GitHub:** [github.com/gicm-dev/gicm](https://github.com/gicm-dev/gicm)

---

## License

MIT © Mirko Basil Doelger / ICM Motion
