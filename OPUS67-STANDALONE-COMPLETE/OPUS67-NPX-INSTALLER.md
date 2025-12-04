# OPUS 67: NPX Installer Implementation
## `npx create-opus67@latest`

---

## Overview

**Goal:** One command installs OPUS 67 into any compatible AI coding environment.

```bash
npx create-opus67@latest
```

**Time to build:** 1 week
**Cost:** $0
**Distribution:** npm (1.6M daily downloads)

---

## User Experience

```
$ npx create-opus67@latest

   ██████  ██████  ██    ██ ███████      ██████  ███████ 
  ██    ██ ██   ██ ██    ██ ██          ██            ██ 
  ██    ██ ██████  ██    ██ ███████     ███████      ██  
  ██    ██ ██      ██    ██      ██     ██    ██    ██   
   ██████  ██       ██████  ███████      ██████     ██   
                                                    
                 The Killer AI Engine
                      v4.0.0

? Select your environment: (Use arrow keys)
❯ Claude Code (Recommended)
  VS Code + Continue
  VS Code + Codeium  
  Cursor
  Windsurf
  Zed
  Neovim
  Custom/Manual

? Select installation type:
❯ Full (130 skills, 47 MCPs, 82 agents)
  Solana Only (Solana stack + DeFi tools)
  Frontend Only (React, Next.js, UI tools)
  Minimal (Core skills only)

Detecting environment...
✓ Claude Code found at ~/.claude
✓ Node.js v20.10.0
✓ Git configured

Installing OPUS 67 v4.0...
  ├── Downloading skills (130)............... ✓
  ├── Configuring MCPs (47).................. ✓
  ├── Loading agents (82).................... ✓
  ├── Setting up modes (30).................. ✓
  └── Generating config...................... ✓

✓ OPUS 67 installed successfully!

┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  OPUS 67 v4.0 is ready!                                    │
│                                                             │
│  Skills:  130 loaded                                        │
│  MCPs:    47 configured                                     │
│  Agents:  82 available                                      │
│  Modes:   30 ready                                          │
│                                                             │
│  Quick start:                                               │
│    $ claude "Create a Solana bonding curve"                │
│                                                             │
│  Commands:                                                  │
│    $ opus67 status     - Check installation                 │
│    $ opus67 update     - Update to latest                   │
│    $ opus67 skills     - Browse skills                      │
│    $ opus67 agents     - List agents                        │
│                                                             │
│  Docs: https://opus67.dev/docs                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Package Structure

```
create-opus67/
├── package.json
├── bin/
│   └── create-opus67.js          # CLI entry point
├── src/
│   ├── index.ts                  # Main installer
│   ├── detect.ts                 # Environment detection
│   ├── install.ts                # Installation logic
│   ├── config.ts                 # Config generation
│   ├── prompts.ts                # Interactive prompts
│   └── utils.ts                  # Helpers
├── templates/
│   ├── claude-code/
│   │   ├── CLAUDE.md
│   │   ├── settings.json
│   │   └── mcp-config.json
│   ├── vscode-continue/
│   │   ├── config.json
│   │   └── .continuerc
│   ├── cursor/
│   │   ├── .cursorrules
│   │   └── settings.json
│   ├── windsurf/
│   │   └── config.json
│   └── common/
│       ├── skills/
│       ├── agents/
│       └── modes/
├── assets/
│   ├── skills-registry.json
│   ├── agents-registry.json
│   ├── mcps-registry.json
│   └── modes-registry.json
└── README.md
```

---

## Core Implementation

### package.json

```json
{
  "name": "create-opus67",
  "version": "4.0.0",
  "description": "Install OPUS 67 - The Killer AI Engine",
  "bin": {
    "create-opus67": "./bin/create-opus67.js"
  },
  "scripts": {
    "build": "tsup src/index.ts --format cjs,esm",
    "dev": "tsup src/index.ts --watch"
  },
  "dependencies": {
    "chalk": "^5.3.0",
    "commander": "^11.1.0",
    "enquirer": "^2.4.1",
    "ora": "^7.0.1",
    "fs-extra": "^11.2.0",
    "got": "^14.0.0",
    "figlet": "^1.7.0"
  },
  "devDependencies": {
    "tsup": "^8.0.1",
    "typescript": "^5.3.3"
  },
  "keywords": [
    "opus67",
    "ai",
    "claude",
    "solana",
    "mcp",
    "coding-assistant"
  ],
  "repository": "github:icm-motion/opus67",
  "license": "MIT"
}
```

### bin/create-opus67.js

```javascript
#!/usr/bin/env node

import { run } from '../dist/index.js';

run().catch(console.error);
```

### src/index.ts

```typescript
import chalk from 'chalk';
import { Command } from 'commander';
import enquirer from 'enquirer';
import ora from 'ora';
import figlet from 'figlet';
import { detectEnvironment } from './detect';
import { installOpus67 } from './install';
import { generateConfig } from './config';

const VERSION = '4.0.0';

export async function run() {
  // Show banner
  console.log(chalk.cyan(figlet.textSync('OPUS 67', { horizontalLayout: 'full' })));
  console.log(chalk.gray('                 The Killer AI Engine'));
  console.log(chalk.gray(`                      v${VERSION}\n`));

  const program = new Command();
  
  program
    .name('create-opus67')
    .description('Install OPUS 67 AI Engine')
    .version(VERSION)
    .option('-e, --env <environment>', 'Target environment')
    .option('-t, --type <type>', 'Installation type (full|solana|frontend|minimal)')
    .option('-y, --yes', 'Skip prompts, use defaults')
    .action(async (options) => {
      await installer(options);
    });

  // Subcommands for installed opus67
  program
    .command('status')
    .description('Check OPUS 67 installation status')
    .action(checkStatus);

  program
    .command('update')
    .description('Update OPUS 67 to latest version')
    .action(updateOpus67);

  program
    .command('skills')
    .description('Browse available skills')
    .action(browseSkills);

  program
    .command('agents')
    .description('List available agents')
    .action(listAgents);

  await program.parseAsync();
}

async function installer(options: any) {
  // Detect environment
  const spinner = ora('Detecting environment...').start();
  const detected = await detectEnvironment();
  spinner.succeed('Environment detected');

  // Show what was found
  console.log(chalk.gray('\nFound:'));
  for (const [key, value] of Object.entries(detected)) {
    if (value) {
      console.log(chalk.green(`  ✓ ${key}`));
    }
  }
  console.log('');

  // Select environment (or use detected/provided)
  let environment = options.env;
  if (!environment && !options.yes) {
    const response = await enquirer.prompt<{ env: string }>({
      type: 'select',
      name: 'env',
      message: 'Select your environment:',
      choices: [
        { name: 'claude-code', message: 'Claude Code (Recommended)' },
        { name: 'vscode-continue', message: 'VS Code + Continue' },
        { name: 'vscode-codeium', message: 'VS Code + Codeium' },
        { name: 'cursor', message: 'Cursor' },
        { name: 'windsurf', message: 'Windsurf' },
        { name: 'zed', message: 'Zed' },
        { name: 'neovim', message: 'Neovim' },
        { name: 'manual', message: 'Custom/Manual' },
      ],
      initial: detected.claudeCode ? 0 : detected.cursor ? 3 : 0,
    });
    environment = response.env;
  }

  // Select installation type
  let installType = options.type || 'full';
  if (!options.yes) {
    const response = await enquirer.prompt<{ type: string }>({
      type: 'select',
      name: 'type',
      message: 'Select installation type:',
      choices: [
        { name: 'full', message: 'Full (130 skills, 47 MCPs, 82 agents)' },
        { name: 'solana', message: 'Solana Only (Solana stack + DeFi tools)' },
        { name: 'frontend', message: 'Frontend Only (React, Next.js, UI tools)' },
        { name: 'minimal', message: 'Minimal (Core skills only)' },
      ],
    });
    installType = response.type;
  }

  // Install
  console.log('');
  const installSpinner = ora('Installing OPUS 67 v4.0...').start();

  try {
    await installOpus67({
      environment,
      type: installType,
      detected,
      onProgress: (step, status) => {
        installSpinner.text = `Installing OPUS 67 v4.0...\n  ${step} ${status}`;
      },
    });

    installSpinner.succeed('OPUS 67 installed successfully!');

    // Show success message
    showSuccessMessage(environment);

  } catch (error) {
    installSpinner.fail('Installation failed');
    console.error(chalk.red(error));
    process.exit(1);
  }
}

function showSuccessMessage(environment: string) {
  console.log(chalk.cyan(`
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ${chalk.green('OPUS 67 v4.0 is ready!')}                                    │
│                                                             │
│  Skills:  ${chalk.yellow('130')} loaded                                        │
│  MCPs:    ${chalk.yellow('47')} configured                                     │
│  Agents:  ${chalk.yellow('82')} available                                      │
│  Modes:   ${chalk.yellow('30')} ready                                          │
│                                                             │
│  Quick start:                                               │
│    ${chalk.gray('$ claude "Create a Solana bonding curve"')}                │
│                                                             │
│  Commands:                                                  │
│    ${chalk.gray('$ opus67 status')}     - Check installation                 │
│    ${chalk.gray('$ opus67 update')}     - Update to latest                   │
│    ${chalk.gray('$ opus67 skills')}     - Browse skills                      │
│    ${chalk.gray('$ opus67 agents')}     - List agents                        │
│                                                             │
│  Docs: ${chalk.blue('https://opus67.dev/docs')}                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
  `));
}

async function checkStatus() {
  // Implementation
}

async function updateOpus67() {
  // Implementation
}

async function browseSkills() {
  // Implementation
}

async function listAgents() {
  // Implementation
}
```

### src/detect.ts

```typescript
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

export interface DetectedEnvironment {
  claudeCode: boolean;
  claudeCodePath?: string;
  vscode: boolean;
  vscodePath?: string;
  cursor: boolean;
  cursorPath?: string;
  windsurf: boolean;
  windsurfPath?: string;
  zed: boolean;
  zedPath?: string;
  neovim: boolean;
  neovimPath?: string;
  continueExt: boolean;
  codeiumExt: boolean;
  nodeVersion: string;
  gitConfigured: boolean;
}

export async function detectEnvironment(): Promise<DetectedEnvironment> {
  const home = os.homedir();
  const platform = os.platform();

  const result: DetectedEnvironment = {
    claudeCode: false,
    vscode: false,
    cursor: false,
    windsurf: false,
    zed: false,
    neovim: false,
    continueExt: false,
    codeiumExt: false,
    nodeVersion: process.version,
    gitConfigured: false,
  };

  // Claude Code
  const claudeCodePath = path.join(home, '.claude');
  if (await fs.pathExists(claudeCodePath)) {
    result.claudeCode = true;
    result.claudeCodePath = claudeCodePath;
  }

  // VS Code
  const vscodePaths = {
    darwin: path.join(home, 'Library/Application Support/Code'),
    win32: path.join(home, 'AppData/Roaming/Code'),
    linux: path.join(home, '.config/Code'),
  };
  const vscodePath = vscodePaths[platform as keyof typeof vscodePaths];
  if (vscodePath && await fs.pathExists(vscodePath)) {
    result.vscode = true;
    result.vscodePath = vscodePath;
    
    // Check for extensions
    const extPath = path.join(vscodePath, 'extensions');
    if (await fs.pathExists(extPath)) {
      const extensions = await fs.readdir(extPath);
      result.continueExt = extensions.some(e => e.startsWith('continue.'));
      result.codeiumExt = extensions.some(e => e.startsWith('codeium.'));
    }
  }

  // Cursor
  const cursorPaths = {
    darwin: path.join(home, 'Library/Application Support/Cursor'),
    win32: path.join(home, 'AppData/Roaming/Cursor'),
    linux: path.join(home, '.config/Cursor'),
  };
  const cursorPath = cursorPaths[platform as keyof typeof cursorPaths];
  if (cursorPath && await fs.pathExists(cursorPath)) {
    result.cursor = true;
    result.cursorPath = cursorPath;
  }

  // Windsurf
  const windsurfPaths = {
    darwin: path.join(home, 'Library/Application Support/Windsurf'),
    win32: path.join(home, 'AppData/Roaming/Windsurf'),
    linux: path.join(home, '.config/Windsurf'),
  };
  const windsurfPath = windsurfPaths[platform as keyof typeof windsurfPaths];
  if (windsurfPath && await fs.pathExists(windsurfPath)) {
    result.windsurf = true;
    result.windsurfPath = windsurfPath;
  }

  // Zed
  const zedPaths = {
    darwin: path.join(home, '.config/zed'),
    win32: path.join(home, 'AppData/Roaming/Zed'),
    linux: path.join(home, '.config/zed'),
  };
  const zedPath = zedPaths[platform as keyof typeof zedPaths];
  if (zedPath && await fs.pathExists(zedPath)) {
    result.zed = true;
    result.zedPath = zedPath;
  }

  // Neovim
  const neovimPaths = {
    darwin: path.join(home, '.config/nvim'),
    win32: path.join(home, 'AppData/Local/nvim'),
    linux: path.join(home, '.config/nvim'),
  };
  const neovimPath = neovimPaths[platform as keyof typeof neovimPaths];
  if (neovimPath && await fs.pathExists(neovimPath)) {
    result.neovim = true;
    result.neovimPath = neovimPath;
  }

  // Git
  const gitConfigPath = path.join(home, '.gitconfig');
  result.gitConfigured = await fs.pathExists(gitConfigPath);

  return result;
}
```

### src/install.ts

```typescript
import fs from 'fs-extra';
import path from 'path';
import got from 'got';
import os from 'os';
import { DetectedEnvironment } from './detect';

const REGISTRY_URL = 'https://raw.githubusercontent.com/icm-motion/opus67/main/registry';

interface InstallOptions {
  environment: string;
  type: 'full' | 'solana' | 'frontend' | 'minimal';
  detected: DetectedEnvironment;
  onProgress: (step: string, status: string) => void;
}

export async function installOpus67(options: InstallOptions) {
  const { environment, type, detected, onProgress } = options;

  // 1. Download skills
  onProgress('├── Downloading skills', '...');
  const skills = await downloadSkills(type);
  onProgress('├── Downloading skills', `(${skills.length}) ✓`);

  // 2. Configure MCPs
  onProgress('├── Configuring MCPs', '...');
  const mcps = await configureMCPs(type);
  onProgress('├── Configuring MCPs', `(${mcps.length}) ✓`);

  // 3. Load agents
  onProgress('├── Loading agents', '...');
  const agents = await loadAgents(type);
  onProgress('├── Loading agents', `(${agents.length}) ✓`);

  // 4. Setup modes
  onProgress('├── Setting up modes', '...');
  const modes = await setupModes(type);
  onProgress('├── Setting up modes', `(${modes.length}) ✓`);

  // 5. Generate config for target environment
  onProgress('└── Generating config', '...');
  await generateConfigForEnvironment(environment, detected, {
    skills,
    mcps,
    agents,
    modes,
  });
  onProgress('└── Generating config', '✓');

  return { skills, mcps, agents, modes };
}

async function downloadSkills(type: string) {
  const registry = await got(`${REGISTRY_URL}/skills.json`).json<any>();
  
  const skillSets = {
    full: registry.skills,
    solana: registry.skills.filter((s: any) => 
      s.category === 'solana' || s.category === 'blockchain' || s.core
    ),
    frontend: registry.skills.filter((s: any) => 
      s.category === 'frontend' || s.category === 'ui' || s.core
    ),
    minimal: registry.skills.filter((s: any) => s.core),
  };

  return skillSets[type as keyof typeof skillSets] || skillSets.full;
}

async function configureMCPs(type: string) {
  const registry = await got(`${REGISTRY_URL}/mcps.json`).json<any>();
  
  const mcpSets = {
    full: registry.mcps,
    solana: registry.mcps.filter((m: any) => 
      m.category === 'solana' || m.category === 'web3' || m.core
    ),
    frontend: registry.mcps.filter((m: any) => 
      m.category === 'dev-tools' || m.core
    ),
    minimal: registry.mcps.filter((m: any) => m.core),
  };

  return mcpSets[type as keyof typeof mcpSets] || mcpSets.full;
}

async function loadAgents(type: string) {
  const registry = await got(`${REGISTRY_URL}/agents.json`).json<any>();
  
  const agentSets = {
    full: registry.agents,
    solana: registry.agents.filter((a: any) => 
      a.domain === 'solana' || a.domain === 'defi' || a.core
    ),
    frontend: registry.agents.filter((a: any) => 
      a.domain === 'frontend' || a.domain === 'design' || a.core
    ),
    minimal: registry.agents.filter((a: any) => a.core),
  };

  return agentSets[type as keyof typeof agentSets] || agentSets.full;
}

async function setupModes(type: string) {
  const registry = await got(`${REGISTRY_URL}/modes.json`).json<any>();
  return registry.modes; // All modes available regardless of type
}

async function generateConfigForEnvironment(
  environment: string,
  detected: DetectedEnvironment,
  data: any
) {
  const home = os.homedir();

  switch (environment) {
    case 'claude-code':
      await generateClaudeCodeConfig(detected.claudeCodePath || path.join(home, '.claude'), data);
      break;
    case 'cursor':
      await generateCursorConfig(detected.cursorPath!, data);
      break;
    case 'vscode-continue':
      await generateContinueConfig(detected.vscodePath!, data);
      break;
    case 'windsurf':
      await generateWindsurfConfig(detected.windsurfPath!, data);
      break;
    case 'zed':
      await generateZedConfig(detected.zedPath!, data);
      break;
    case 'neovim':
      await generateNeovimConfig(detected.neovimPath!, data);
      break;
    case 'manual':
      await generateManualConfig(path.join(process.cwd(), '.opus67'), data);
      break;
  }
}

async function generateClaudeCodeConfig(basePath: string, data: any) {
  await fs.ensureDir(basePath);
  
  // Generate CLAUDE.md with all skills/agents
  const claudeMd = generateClaudeMd(data);
  await fs.writeFile(path.join(basePath, 'CLAUDE.md'), claudeMd);
  
  // Generate MCP config
  const mcpConfig = generateMCPConfig(data.mcps);
  await fs.writeFile(
    path.join(basePath, 'claude_desktop_config.json'),
    JSON.stringify(mcpConfig, null, 2)
  );
  
  // Generate settings
  const settings = generateSettings(data);
  await fs.writeFile(
    path.join(basePath, 'settings.json'),
    JSON.stringify(settings, null, 2)
  );
}

// Similar functions for other environments...
async function generateCursorConfig(basePath: string, data: any) {
  // .cursorrules file
  const rules = generateCursorRules(data);
  await fs.writeFile(path.join(process.cwd(), '.cursorrules'), rules);
}

async function generateContinueConfig(basePath: string, data: any) {
  // Continue extension config
}

async function generateWindsurfConfig(basePath: string, data: any) {
  // Windsurf config
}

async function generateZedConfig(basePath: string, data: any) {
  // Zed config
}

async function generateNeovimConfig(basePath: string, data: any) {
  // Neovim lua config
}

async function generateManualConfig(basePath: string, data: any) {
  await fs.ensureDir(basePath);
  await fs.writeFile(
    path.join(basePath, 'opus67-config.json'),
    JSON.stringify(data, null, 2)
  );
}

function generateClaudeMd(data: any): string {
  // Generate the CLAUDE.md content
  return `# OPUS 67 v4.0 Configuration

## Skills (${data.skills.length})
${data.skills.map((s: any) => `- ${s.id}: ${s.description}`).join('\n')}

## Agents (${data.agents.length})
${data.agents.map((a: any) => `- ${a.id}: ${a.role}`).join('\n')}

## Modes (${data.modes.length})
${data.modes.map((m: any) => `- ${m.id}: ${m.description}`).join('\n')}

[Full OPUS 67 system prompt here...]
`;
}

function generateMCPConfig(mcps: any[]) {
  const servers: Record<string, any> = {};
  
  for (const mcp of mcps) {
    servers[mcp.id] = {
      command: mcp.command,
      args: mcp.args || [],
      env: mcp.env || {},
    };
  }
  
  return { mcpServers: servers };
}

function generateSettings(data: any) {
  return {
    opus67: {
      version: '4.0.0',
      skills: data.skills.length,
      mcps: data.mcps.length,
      agents: data.agents.length,
      modes: data.modes.length,
    },
  };
}

function generateCursorRules(data: any): string {
  return `# OPUS 67 v4.0 - Cursor Rules

You are enhanced with OPUS 67, the killer AI engine for development.

## Available Skills (${data.skills.length})
${data.skills.slice(0, 20).map((s: any) => `- ${s.id}`).join('\n')}
... and ${data.skills.length - 20} more

## Available Agents (${data.agents.length})
${data.agents.slice(0, 10).map((a: any) => `- ${a.id}: ${a.role}`).join('\n')}

## Modes
${data.modes.map((m: any) => `- ${m.id}: ${m.description}`).join('\n')}

[Full rules here...]
`;
}
```

---

## CLI Commands (Post-Install)

### opus67 status

```bash
$ opus67 status

OPUS 67 v4.0.0
──────────────

Environment: Claude Code
Path: ~/.claude

Components:
  ✓ Skills:  130/130 loaded
  ✓ MCPs:    47/47 configured  
  ✓ Agents:  82/82 available
  ✓ Modes:   30/30 ready

Health:
  ✓ Config valid
  ✓ MCPs reachable
  ✓ No conflicts

Last updated: 2 hours ago
```

### opus67 skills

```bash
$ opus67 skills

OPUS 67 Skills Browser
──────────────────────

? Select category: (Use arrow keys)
❯ All (130)
  Solana (15)
  AI/LLM (8)
  Frontend (12)
  Full-Stack (14)
  DevOps (12)
  Research (8)
  GRAB (16)

[After selection]

Solana Skills (15):
  1. solana-anchor-expert    - Anchor framework mastery
  2. solana-2025-stack       - Modern Solana development
  3. jupiter-trader          - Token swaps via Jupiter
  4. pump-fun-expert         - Pump.fun launches
  5. token-extensions        - Token-2022 program
  ...

? View skill details? (y/N)
```

### opus67 update

```bash
$ opus67 update

Checking for updates...
Current: v4.0.0
Latest:  v4.0.1

Changes in v4.0.1:
  + Added 3 new skills
  + Fixed jupiter-trader MCP config
  + Updated agent definitions

? Update now? (Y/n) Y

Updating OPUS 67...
  ├── Backing up current config... ✓
  ├── Downloading v4.0.1... ✓
  ├── Updating skills (+3)... ✓
  ├── Updating MCPs... ✓
  └── Verifying... ✓

✓ Updated to v4.0.1!
```

---

## Distribution

### npm Publishing

```bash
# Build
npm run build

# Publish
npm publish --access public
```

### GitHub Release

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'
      
      - run: npm ci
      - run: npm run build
      - run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

---

## Timeline

| Day | Task |
|-----|------|
| 1 | Project scaffold, package.json, basic CLI |
| 2 | Environment detection, prompts |
| 3 | Installation logic, config generation |
| 4 | Claude Code + Cursor templates |
| 5 | VS Code Continue + Windsurf templates |
| 6 | Testing, edge cases, error handling |
| 7 | Documentation, npm publish, announcement |

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Weekly downloads | 1,000+ in first month |
| GitHub stars | 500+ |
| Issues resolved | <24h response |
| Install success rate | >95% |
