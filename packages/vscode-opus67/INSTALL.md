# OPUS 67 VSCode Extension - Installation Guide

## 📦 Package Created

Your VSIX package is ready:
```
packages/vscode-opus67/opus67-1.0.0.vsix
```

---

## 🚀 Installation Methods

### Method 1: Install from VSIX (Local)

1. **Open VS Code**
2. **Go to Extensions** (Ctrl+Shift+X / Cmd+Shift+X)
3. **Click the "..." menu** in the Extensions view
4. **Select "Install from VSIX..."**
5. **Navigate to:** `packages/vscode-opus67/opus67-1.0.0.vsix`
6. **Click "Install"**
7. **Reload VS Code** when prompted

### Method 2: Command Line Installation

```bash
code --install-extension packages/vscode-opus67/opus67-1.0.0.vsix
```

### Method 3: VS Code Marketplace (Coming Soon)

Search for "OPUS 67" in the Extensions marketplace.

---

## ✅ Verify Installation

After installation, you should see:
- **Status Bar:** `$(sparkle) OPUS 67: AUTO` in the bottom right
- **Commands:** Press `Ctrl+Shift+P` and type "OPUS 67" to see available commands

---

## 🎯 Quick Start

### 1. View Status Dashboard
- Press `Ctrl+Shift+P`
- Type: `OPUS 67: Show Status`
- View your 95 skills, 84 MCPs, 30 modes, 82 agents

### 2. Browse Skills
- Press `Ctrl+Shift+P`
- Type: `OPUS 67: Browse Skills`
- Select a category (GRAB, Solana, Research, Builder)
- Choose a skill to activate

### 3. Switch Modes
- Click the status bar item: `OPUS 67: AUTO`
- Or press `Ctrl+Shift+P` → `OPUS 67: Select Mode`
- Choose your operating mode:
  - **AUTO** - Auto-detect best approach
  - **BUILD** - Ship fast, working code
  - **SOLANA** - Blockchain-native development
  - **GRAB** - Visual-first development
  - **VIBE** - Ship fast, iterate later

### 4. Auto Mode Detection
The extension automatically switches modes based on file type:
- `.rs`, `.anchor` → **SOLANA** mode
- `.tsx`, `.jsx` → **BUILD** mode
- `.test.ts`, `.spec.ts` → **REVIEW** mode

---

## ⚙️ Configuration

Open VS Code Settings (`Ctrl+,`) and search for "OPUS 67":

```json
{
  "opus67.defaultMode": "AUTO",
  "opus67.showStatusBar": true,
  "opus67.autoDetectSkills": true
}
```

---

## 📝 Available Commands

| Command | Keyboard Shortcut | Description |
|---------|------------------|-------------|
| `OPUS 67: Show Status` | - | Display status dashboard |
| `OPUS 67: Browse Skills` | - | Browse 95 skills by category |
| `OPUS 67: Browse Agents` | - | Browse 82 agents by category |
| `OPUS 67: Select Mode` | Click status bar | Switch operating mode |
| `OPUS 67: Install in Project` | - | Run NPX installer |
| `OPUS 67: Open Documentation` | - | Open opus67.dev |

---

## 🔧 Troubleshooting

### Extension Not Showing
1. Check installed extensions: `Ctrl+Shift+X`
2. Search for "OPUS 67"
3. Ensure it's enabled

### Status Bar Not Visible
1. Open Settings: `Ctrl+,`
2. Search: `opus67.showStatusBar`
3. Set to `true`

### Commands Not Working
1. Reload VS Code: `Ctrl+Shift+P` → `Reload Window`
2. Check output: `Ctrl+Shift+U` → Select "OPUS 67"

---

## 🌐 Next Steps

### Install in Your Project
```bash
npx create-opus67@latest
```

Choose installation type:
- **Full** - 95 skills, 84 MCPs, 82 agents
- **Solana** - 35 skills, 25 MCPs, 30 agents
- **Frontend** - 40 skills, 20 MCPs, 25 agents
- **Minimal** - 15 skills, 10 MCPs, 10 agents

---

## 📚 Resources

- **Website:** [opus67.dev](https://opus67.dev)
- **NPX Installer:** `npx create-opus67@latest`
- **GitHub:** [github.com/gicm-dev/gicm](https://github.com/gicm-dev/gicm)
- **Documentation:** See `packages/opus67/docs/`

---

## 🎉 You're Ready!

OPUS 67 is now active in VS Code. You have access to:
- **95 Skills** - GRAB, Solana, Research, Builder
- **84 MCPs** - GitHub, Jupiter, Supabase, Sentry, etc.
- **30 Modes** - AUTO, BUILD, SOLANA, GRAB, VIBE, etc.
- **82 Agents** - Vision, Solana, Builder agents

**Remember:** OPUS 67 ≠ Separate AI. OPUS 67 = Your AI + Enhancement Layer.

Same driver, better race car.
