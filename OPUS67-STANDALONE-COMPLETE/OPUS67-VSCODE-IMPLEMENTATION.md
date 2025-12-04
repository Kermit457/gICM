# OPUS 67 VS Code Extension
## Complete Implementation Guide

---

## Overview

The OPUS 67 VS Code extension provides:
- Skill browser sidebar
- Agent switcher
- Mode selector
- Status bar integration
- Command palette actions
- Code snippets
- Context-aware code actions

---

## Quick Setup

```bash
# Create extension project
npx yo code

# Select:
# ? What type of extension do you want to create? New Extension (TypeScript)
# ? What's the name of your extension? opus67
# ? What's the identifier of your extension? opus67
# ? What's the description of your extension? OPUS 67 - The AI Engine That Ships Code
# ? Initialize a git repository? Yes
# ? Bundle the source code with webpack? Yes
# ? Which package manager to use? npm

cd opus67
```

---

## Project Structure

```
opus67-vscode/
├── .vscode/
│   ├── launch.json               # Debug configs
│   └── tasks.json
├── src/
│   ├── extension.ts              # Entry point
│   ├── commands/
│   │   ├── index.ts              # Command registration
│   │   ├── switchAgent.ts
│   │   ├── loadSkill.ts
│   │   ├── setMode.ts
│   │   ├── browseSkills.ts
│   │   └── openDashboard.ts
│   ├── providers/
│   │   ├── skillTreeProvider.ts  # Skills sidebar
│   │   ├── agentTreeProvider.ts  # Agents sidebar
│   │   ├── modeTreeProvider.ts   # Modes sidebar
│   │   ├── statusBarProvider.ts  # Status bar
│   │   └── codeActionProvider.ts # Lightbulb actions
│   ├── services/
│   │   ├── configService.ts      # Config management
│   │   ├── skillService.ts       # Skill operations
│   │   ├── registryService.ts    # Fetch registries
│   │   └── aiIntegration.ts      # AI provider hooks
│   ├── webviews/
│   │   ├── dashboard.ts          # Dashboard webview
│   │   └── skillViewer.ts        # Skill detail view
│   ├── data/
│   │   ├── skills.json           # Bundled skills
│   │   ├── agents.json           # Bundled agents
│   │   └── modes.json            # Bundled modes
│   └── utils/
│       ├── constants.ts
│       └── helpers.ts
├── resources/
│   ├── icons/
│   │   ├── opus67.svg
│   │   ├── opus67-dark.svg
│   │   ├── skill.svg
│   │   ├── agent.svg
│   │   └── mode.svg
│   └── media/
│       ├── dashboard.html
│       ├── dashboard.css
│       └── dashboard.js
├── snippets/
│   ├── typescript.json
│   ├── rust.json
│   └── solana.json
├── package.json                  # Extension manifest
├── tsconfig.json
├── webpack.config.js
├── .vscodeignore
└── README.md
```

---

## Core Files

### package.json (Extension Manifest)

```json
{
  "name": "opus67",
  "displayName": "OPUS 67",
  "description": "The AI Engine That Ships Code - 130 skills, 47 tools, 82 agents",
  "version": "4.0.0",
  "publisher": "icm-motion",
  "icon": "resources/icons/opus67.png",
  "galleryBanner": {
    "color": "#1a1a2e",
    "theme": "dark"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/icm-motion/opus67-vscode"
  },
  "bugs": {
    "url": "https://github.com/icm-motion/opus67-vscode/issues"
  },
  "homepage": "https://opus67.dev",
  "engines": {
    "vscode": "^1.85.0"
  },
  "categories": [
    "Programming Languages",
    "Snippets",
    "Machine Learning",
    "Other"
  ],
  "keywords": [
    "ai",
    "claude",
    "solana",
    "blockchain",
    "copilot",
    "assistant",
    "opus67",
    "mcp"
  ],
  "activationEvents": [
    "onStartupFinished"
  ],
  "main": "./dist/extension.js",
  "contributes": {
    "commands": [
      {
        "command": "opus67.switchAgent",
        "title": "Switch Agent",
        "category": "OPUS 67",
        "icon": "$(person)"
      },
      {
        "command": "opus67.loadSkill",
        "title": "Load Skill",
        "category": "OPUS 67",
        "icon": "$(book)"
      },
      {
        "command": "opus67.setMode",
        "title": "Set Mode",
        "category": "OPUS 67",
        "icon": "$(settings-gear)"
      },
      {
        "command": "opus67.browseSkills",
        "title": "Browse Skills",
        "category": "OPUS 67",
        "icon": "$(library)"
      },
      {
        "command": "opus67.showStatus",
        "title": "Show Status",
        "category": "OPUS 67"
      },
      {
        "command": "opus67.openDashboard",
        "title": "Open Dashboard",
        "category": "OPUS 67",
        "icon": "$(dashboard)"
      },
      {
        "command": "opus67.refreshSkills",
        "title": "Refresh Skills",
        "category": "OPUS 67",
        "icon": "$(refresh)"
      },
      {
        "command": "opus67.viewSkill",
        "title": "View Skill Details",
        "category": "OPUS 67"
      },
      {
        "command": "opus67.copySkill",
        "title": "Copy Skill to Clipboard",
        "category": "OPUS 67"
      },
      {
        "command": "opus67.injectSkill",
        "title": "Inject Skill into Context",
        "category": "OPUS 67"
      }
    ],
    "viewsContainers": {
      "activitybar": [
        {
          "id": "opus67",
          "title": "OPUS 67",
          "icon": "resources/icons/opus67.svg"
        }
      ]
    },
    "views": {
      "opus67": [
        {
          "id": "opus67.skills",
          "name": "Skills",
          "icon": "$(book)",
          "contextualTitle": "OPUS 67 Skills"
        },
        {
          "id": "opus67.agents",
          "name": "Agents",
          "icon": "$(person)",
          "contextualTitle": "OPUS 67 Agents"
        },
        {
          "id": "opus67.modes",
          "name": "Modes",
          "icon": "$(settings-gear)",
          "contextualTitle": "OPUS 67 Modes"
        },
        {
          "id": "opus67.quickActions",
          "name": "Quick Actions",
          "icon": "$(zap)",
          "contextualTitle": "OPUS 67 Quick Actions"
        }
      ]
    },
    "viewsWelcome": [
      {
        "view": "opus67.skills",
        "contents": "Loading OPUS 67 skills...\n[Refresh](command:opus67.refreshSkills)"
      }
    ],
    "menus": {
      "view/title": [
        {
          "command": "opus67.refreshSkills",
          "when": "view == opus67.skills",
          "group": "navigation"
        }
      ],
      "view/item/context": [
        {
          "command": "opus67.viewSkill",
          "when": "view == opus67.skills && viewItem == skill",
          "group": "inline"
        },
        {
          "command": "opus67.copySkill",
          "when": "view == opus67.skills && viewItem == skill",
          "group": "1_actions"
        },
        {
          "command": "opus67.injectSkill",
          "when": "view == opus67.skills && viewItem == skill",
          "group": "1_actions"
        }
      ],
      "editor/context": [
        {
          "submenu": "opus67.editorContext",
          "group": "opus67"
        }
      ],
      "opus67.editorContext": [
        {
          "command": "opus67.loadSkill",
          "group": "1_skills"
        },
        {
          "command": "opus67.switchAgent",
          "group": "2_agents"
        }
      ],
      "commandPalette": [
        {
          "command": "opus67.viewSkill",
          "when": "false"
        }
      ]
    },
    "submenus": [
      {
        "id": "opus67.editorContext",
        "label": "🚀 OPUS 67"
      }
    ],
    "configuration": {
      "title": "OPUS 67",
      "properties": {
        "opus67.defaultAgent": {
          "type": "string",
          "default": "full-stack",
          "description": "Default agent to use on startup",
          "enum": [
            "full-stack",
            "solana-defi",
            "anchor-expert",
            "frontend-master",
            "security-auditor"
          ]
        },
        "opus67.defaultMode": {
          "type": "string",
          "default": "vibe",
          "description": "Default behavioral mode",
          "enum": [
            "vibe",
            "architect",
            "ship",
            "audit",
            "teach",
            "debug"
          ]
        },
        "opus67.autoLoadSkills": {
          "type": "boolean",
          "default": true,
          "description": "Automatically load relevant skills based on file type"
        },
        "opus67.showStatusBar": {
          "type": "boolean",
          "default": true,
          "description": "Show OPUS 67 status in the status bar"
        },
        "opus67.aiProvider": {
          "type": "string",
          "default": "auto",
          "description": "AI provider integration",
          "enum": [
            "auto",
            "continue",
            "codeium",
            "copilot",
            "manual"
          ],
          "enumDescriptions": [
            "Auto-detect installed AI extensions",
            "Use Continue extension",
            "Use Codeium extension",
            "Use GitHub Copilot",
            "Manual configuration"
          ]
        },
        "opus67.registryUrl": {
          "type": "string",
          "default": "https://api.gicm.ai/opus67",
          "description": "OPUS 67 registry URL (advanced)"
        }
      }
    },
    "snippets": [
      {
        "language": "typescript",
        "path": "./snippets/typescript.json"
      },
      {
        "language": "typescriptreact",
        "path": "./snippets/typescript.json"
      },
      {
        "language": "rust",
        "path": "./snippets/rust.json"
      }
    ],
    "keybindings": [
      {
        "command": "opus67.loadSkill",
        "key": "ctrl+shift+o",
        "mac": "cmd+shift+o",
        "when": "editorTextFocus"
      },
      {
        "command": "opus67.switchAgent",
        "key": "ctrl+shift+a",
        "mac": "cmd+shift+a"
      },
      {
        "command": "opus67.setMode",
        "key": "ctrl+shift+m",
        "mac": "cmd+shift+m"
      },
      {
        "command": "opus67.openDashboard",
        "key": "ctrl+shift+d",
        "mac": "cmd+shift+d"
      }
    ],
    "colors": [
      {
        "id": "opus67.skillHighlight",
        "description": "Color for loaded skills",
        "defaults": {
          "dark": "#8b5cf6",
          "light": "#7c3aed"
        }
      }
    ]
  },
  "scripts": {
    "vscode:prepublish": "npm run package",
    "compile": "webpack",
    "watch": "webpack --watch",
    "package": "webpack --mode production --devtool hidden-source-map",
    "compile-tests": "tsc -p . --outDir out",
    "watch-tests": "tsc -p . -w --outDir out",
    "pretest": "npm run compile-tests && npm run compile && npm run lint",
    "lint": "eslint src --ext ts",
    "test": "vscode-test"
  },
  "devDependencies": {
    "@types/vscode": "^1.85.0",
    "@types/node": "20.x",
    "@typescript-eslint/eslint-plugin": "^6.15.0",
    "@typescript-eslint/parser": "^6.15.0",
    "eslint": "^8.56.0",
    "typescript": "^5.3.3",
    "ts-loader": "^9.5.1",
    "webpack": "^5.89.0",
    "webpack-cli": "^5.1.4",
    "@vscode/test-cli": "^0.0.4",
    "@vscode/test-electron": "^2.3.8"
  },
  "dependencies": {
    "node-fetch": "^3.3.2"
  }
}
```

---

### src/extension.ts

```typescript
import * as vscode from 'vscode';
import { SkillTreeProvider } from './providers/skillTreeProvider';
import { AgentTreeProvider } from './providers/agentTreeProvider';
import { ModeTreeProvider } from './providers/modeTreeProvider';
import { QuickActionTreeProvider } from './providers/quickActionTreeProvider';
import { StatusBarProvider } from './providers/statusBarProvider';
import { CodeActionProvider } from './providers/codeActionProvider';
import { ConfigService } from './services/configService';
import { RegistryService } from './services/registryService';
import { registerCommands } from './commands';

let statusBarProvider: StatusBarProvider;
let outputChannel: vscode.OutputChannel;

export async function activate(context: vscode.ExtensionContext) {
  outputChannel = vscode.window.createOutputChannel('OPUS 67');
  outputChannel.appendLine('OPUS 67 extension activating...');

  try {
    // Initialize services
    const registryService = new RegistryService(context);
    const configService = new ConfigService(context, registryService);
    
    // Load data
    await configService.initialize();
    outputChannel.appendLine(`Loaded ${configService.getSkillCount()} skills`);

    // Register tree view providers
    const skillTreeProvider = new SkillTreeProvider(configService);
    const agentTreeProvider = new AgentTreeProvider(configService);
    const modeTreeProvider = new ModeTreeProvider(configService);
    const quickActionTreeProvider = new QuickActionTreeProvider(configService);

    context.subscriptions.push(
      vscode.window.registerTreeDataProvider('opus67.skills', skillTreeProvider),
      vscode.window.registerTreeDataProvider('opus67.agents', agentTreeProvider),
      vscode.window.registerTreeDataProvider('opus67.modes', modeTreeProvider),
      vscode.window.registerTreeDataProvider('opus67.quickActions', quickActionTreeProvider)
    );

    // Register status bar
    const showStatusBar = vscode.workspace.getConfiguration('opus67').get('showStatusBar', true);
    if (showStatusBar) {
      statusBarProvider = new StatusBarProvider(configService);
      context.subscriptions.push(statusBarProvider);
    }

    // Register code actions
    const codeActionProvider = new CodeActionProvider(configService);
    context.subscriptions.push(
      vscode.languages.registerCodeActionsProvider(
        [
          { scheme: 'file', language: 'typescript' },
          { scheme: 'file', language: 'typescriptreact' },
          { scheme: 'file', language: 'javascript' },
          { scheme: 'file', language: 'javascriptreact' },
          { scheme: 'file', language: 'rust' },
        ],
        codeActionProvider,
        {
          providedCodeActionKinds: [vscode.CodeActionKind.QuickFix, vscode.CodeActionKind.Refactor]
        }
      )
    );

    // Register commands
    registerCommands(context, configService, {
      skillTreeProvider,
      agentTreeProvider,
      modeTreeProvider,
      statusBarProvider,
    });

    // Auto-load skills based on workspace
    if (vscode.workspace.getConfiguration('opus67').get('autoLoadSkills', true)) {
      await autoLoadWorkspaceSkills(configService);
    }

    // Watch for file changes
    context.subscriptions.push(
      vscode.workspace.onDidOpenTextDocument((doc) => {
        if (vscode.workspace.getConfiguration('opus67').get('autoLoadSkills', true)) {
          autoLoadSkillsForDocument(doc, configService);
        }
      })
    );

    // Show welcome message on first install
    const isFirstInstall = !context.globalState.get('opus67.installed');
    if (isFirstInstall) {
      await context.globalState.update('opus67.installed', true);
      showWelcomeMessage();
    }

    outputChannel.appendLine('OPUS 67 extension activated successfully!');
  } catch (error) {
    outputChannel.appendLine(`Activation error: ${error}`);
    vscode.window.showErrorMessage(`OPUS 67 failed to activate: ${error}`);
  }
}

export function deactivate() {
  if (statusBarProvider) {
    statusBarProvider.dispose();
  }
  outputChannel.appendLine('OPUS 67 extension deactivated');
}

async function autoLoadWorkspaceSkills(configService: ConfigService) {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) return;

  for (const folder of workspaceFolders) {
    // Check for Anchor project
    const anchorToml = vscode.Uri.joinPath(folder.uri, 'Anchor.toml');
    try {
      await vscode.workspace.fs.stat(anchorToml);
      await configService.loadSkillById('solana-anchor-expert');
      outputChannel.appendLine('Auto-loaded Anchor skills');
    } catch {}

    // Check for Next.js project
    const nextConfig = vscode.Uri.joinPath(folder.uri, 'next.config.js');
    try {
      await vscode.workspace.fs.stat(nextConfig);
      await configService.loadSkillById('nextjs-14-expert');
      outputChannel.appendLine('Auto-loaded Next.js skills');
    } catch {}
  }
}

function autoLoadSkillsForDocument(doc: vscode.TextDocument, configService: ConfigService) {
  const ext = doc.fileName.split('.').pop()?.toLowerCase();
  
  const skillMap: Record<string, string[]> = {
    'rs': ['solana-anchor-expert', 'rust-expert'],
    'tsx': ['nextjs-14-expert', 'react-patterns'],
    'ts': ['typescript-senior'],
    'sol': ['solidity-expert'],
  };

  const skills = skillMap[ext || ''];
  if (skills) {
    skills.forEach(skill => configService.loadSkillById(skill).catch(() => {}));
  }
}

function showWelcomeMessage() {
  vscode.window
    .showInformationMessage(
      '🚀 OPUS 67 installed! 130 skills, 47 tools, 82 agents ready.',
      'Open Dashboard',
      'Browse Skills',
      'View Docs'
    )
    .then((selection) => {
      if (selection === 'Open Dashboard') {
        vscode.commands.executeCommand('opus67.openDashboard');
      } else if (selection === 'Browse Skills') {
        vscode.commands.executeCommand('opus67.browseSkills');
      } else if (selection === 'View Docs') {
        vscode.env.openExternal(vscode.Uri.parse('https://opus67.dev/docs'));
      }
    });
}
```

---

### src/providers/skillTreeProvider.ts

```typescript
import * as vscode from 'vscode';
import { ConfigService, Skill, SkillCategory } from '../services/configService';

export class SkillTreeProvider implements vscode.TreeDataProvider<SkillTreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<SkillTreeItem | undefined>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  constructor(private configService: ConfigService) {
    // Listen for config changes
    this.configService.onDidChange(() => this.refresh());
  }

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(element: SkillTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: SkillTreeItem): Promise<SkillTreeItem[]> {
    if (!element) {
      // Root level - show categories
      const categories = this.configService.getSkillCategories();
      return categories.map(
        (cat) =>
          new SkillTreeItem(
            cat.name,
            `${cat.count} skills`,
            vscode.TreeItemCollapsibleState.Collapsed,
            'category',
            cat
          )
      );
    }

    if (element.type === 'category') {
      // Show skills in category
      const skills = this.configService.getSkillsByCategory(element.category!.id);
      return skills.map((skill) => {
        const isLoaded = this.configService.isSkillLoaded(skill.id);
        return new SkillTreeItem(
          skill.id,
          skill.description,
          vscode.TreeItemCollapsibleState.None,
          'skill',
          undefined,
          skill,
          isLoaded
        );
      });
    }

    return [];
  }
}

class SkillTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly description: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly type: 'category' | 'skill',
    public readonly category?: SkillCategory,
    public readonly skill?: Skill,
    public readonly isLoaded?: boolean
  ) {
    super(label, collapsibleState);

    this.tooltip = this.createTooltip();
    this.contextValue = type;

    if (type === 'skill') {
      this.iconPath = new vscode.ThemeIcon(
        isLoaded ? 'check' : 'book',
        isLoaded ? new vscode.ThemeColor('opus67.skillHighlight') : undefined
      );
      
      this.command = {
        command: 'opus67.viewSkill',
        title: 'View Skill',
        arguments: [this.skill],
      };

      if (isLoaded) {
        this.description = `${this.description} ✓`;
      }
    } else {
      this.iconPath = new vscode.ThemeIcon('folder');
    }
  }

  private createTooltip(): vscode.MarkdownString | string {
    if (this.type === 'skill' && this.skill) {
      const md = new vscode.MarkdownString();
      md.appendMarkdown(`### ${this.skill.id}\n\n`);
      md.appendMarkdown(`${this.skill.description}\n\n`);
      md.appendMarkdown(`**Category:** ${this.skill.category}\n\n`);
      md.appendMarkdown(`**Tokens:** ~${this.skill.tokens}\n\n`);
      if (this.skill.dependencies?.length) {
        md.appendMarkdown(`**Dependencies:** ${this.skill.dependencies.join(', ')}`);
      }
      return md;
    }
    return this.description;
  }
}
```

---

### src/providers/statusBarProvider.ts

```typescript
import * as vscode from 'vscode';
import { ConfigService } from '../services/configService';

export class StatusBarProvider implements vscode.Disposable {
  private mainItem: vscode.StatusBarItem;
  private agentItem: vscode.StatusBarItem;
  private modeItem: vscode.StatusBarItem;
  private skillCountItem: vscode.StatusBarItem;

  constructor(private configService: ConfigService) {
    // Main OPUS 67 indicator
    this.mainItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      100
    );
    this.mainItem.command = 'opus67.openDashboard';
    this.mainItem.text = '$(rocket) OPUS 67';
    this.mainItem.tooltip = 'Open OPUS 67 Dashboard';
    this.mainItem.show();

    // Agent indicator
    this.agentItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      99
    );
    this.agentItem.command = 'opus67.switchAgent';
    this.agentItem.show();

    // Mode indicator
    this.modeItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      98
    );
    this.modeItem.command = 'opus67.setMode';
    this.modeItem.show();

    // Skills count
    this.skillCountItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      97
    );
    this.skillCountItem.command = 'opus67.browseSkills';
    this.skillCountItem.show();

    // Initial update
    this.update();

    // Listen for changes
    this.configService.onDidChange(() => this.update());
  }

  update() {
    const agent = this.configService.getCurrentAgent();
    const mode = this.configService.getCurrentMode();
    const loadedSkills = this.configService.getLoadedSkillCount();
    const totalSkills = this.configService.getSkillCount();

    this.agentItem.text = `$(person) ${agent.name}`;
    this.agentItem.tooltip = `Current Agent: ${agent.name}\n${agent.description}\n\nClick to switch`;

    this.modeItem.text = `$(settings-gear) ${mode.name}`;
    this.modeItem.tooltip = `Current Mode: ${mode.name}\n${mode.description}\n\nClick to change`;

    this.skillCountItem.text = `$(book) ${loadedSkills}/${totalSkills}`;
    this.skillCountItem.tooltip = `${loadedSkills} skills loaded of ${totalSkills} available\n\nClick to browse`;
  }

  dispose() {
    this.mainItem.dispose();
    this.agentItem.dispose();
    this.modeItem.dispose();
    this.skillCountItem.dispose();
  }
}
```

---

### src/commands/index.ts

```typescript
import * as vscode from 'vscode';
import { ConfigService, Skill, Agent, Mode } from '../services/configService';

export function registerCommands(
  context: vscode.ExtensionContext,
  configService: ConfigService,
  providers: any
) {
  // Switch Agent
  context.subscriptions.push(
    vscode.commands.registerCommand('opus67.switchAgent', async () => {
      const agents = configService.getAgents();
      const currentAgent = configService.getCurrentAgent();

      const items = agents.map((a) => ({
        label: a.name,
        description: a.id === currentAgent.id ? '(current)' : '',
        detail: a.description,
        agent: a,
      }));

      const selected = await vscode.window.showQuickPick(items, {
        placeHolder: 'Select an agent',
        matchOnDescription: true,
        matchOnDetail: true,
      });

      if (selected) {
        await configService.setCurrentAgent(selected.agent.id);
        providers.statusBarProvider?.update();
        vscode.window.showInformationMessage(
          `Switched to ${selected.label} agent`
        );
      }
    })
  );

  // Load Skill
  context.subscriptions.push(
    vscode.commands.registerCommand('opus67.loadSkill', async () => {
      const skills = configService.getAllSkills();
      
      const items = skills.map((s) => {
        const isLoaded = configService.isSkillLoaded(s.id);
        return {
          label: `${isLoaded ? '$(check) ' : ''}${s.id}`,
          description: s.category,
          detail: `${s.description} (~${s.tokens} tokens)`,
          skill: s,
          picked: isLoaded,
        };
      });

      const selected = await vscode.window.showQuickPick(items, {
        placeHolder: 'Select skills to load',
        canPickMany: true,
        matchOnDescription: true,
        matchOnDetail: true,
      });

      if (selected) {
        for (const item of selected) {
          await configService.loadSkill(item.skill);
        }
        providers.skillTreeProvider?.refresh();
        vscode.window.showInformationMessage(
          `Loaded ${selected.length} skill(s)`
        );
      }
    })
  );

  // Set Mode
  context.subscriptions.push(
    vscode.commands.registerCommand('opus67.setMode', async () => {
      const modes = configService.getModes();
      const currentMode = configService.getCurrentMode();

      const items = modes.map((m) => ({
        label: m.name,
        description: m.id === currentMode.id ? '(current)' : '',
        detail: m.description,
        mode: m,
      }));

      const selected = await vscode.window.showQuickPick(items, {
        placeHolder: 'Select a mode',
      });

      if (selected) {
        await configService.setCurrentMode(selected.mode.id);
        providers.statusBarProvider?.update();
        vscode.window.showInformationMessage(
          `Switched to ${selected.label} mode`
        );
      }
    })
  );

  // Browse Skills
  context.subscriptions.push(
    vscode.commands.registerCommand('opus67.browseSkills', async () => {
      // Focus the skills view
      await vscode.commands.executeCommand('opus67.skills.focus');
    })
  );

  // View Skill
  context.subscriptions.push(
    vscode.commands.registerCommand('opus67.viewSkill', async (skill: Skill) => {
      if (!skill) return;
      
      const panel = vscode.window.createWebviewPanel(
        'opus67.skillView',
        `Skill: ${skill.id}`,
        vscode.ViewColumn.Beside,
        { enableScripts: true }
      );

      panel.webview.html = getSkillViewHtml(skill, configService.isSkillLoaded(skill.id));
    })
  );

  // Copy Skill
  context.subscriptions.push(
    vscode.commands.registerCommand('opus67.copySkill', async (item: any) => {
      if (!item?.skill) return;
      
      const content = configService.getSkillContent(item.skill.id);
      await vscode.env.clipboard.writeText(content);
      vscode.window.showInformationMessage(`Copied ${item.skill.id} to clipboard`);
    })
  );

  // Inject Skill
  context.subscriptions.push(
    vscode.commands.registerCommand('opus67.injectSkill', async (item: any) => {
      if (!item?.skill) return;
      
      await configService.loadSkill(item.skill);
      providers.skillTreeProvider?.refresh();
      vscode.window.showInformationMessage(`Loaded ${item.skill.id}`);
    })
  );

  // Open Dashboard
  context.subscriptions.push(
    vscode.commands.registerCommand('opus67.openDashboard', () => {
      const panel = vscode.window.createWebviewPanel(
        'opus67.dashboard',
        'OPUS 67 Dashboard',
        vscode.ViewColumn.One,
        { enableScripts: true }
      );

      panel.webview.html = getDashboardHtml(configService);
    })
  );

  // Show Status
  context.subscriptions.push(
    vscode.commands.registerCommand('opus67.showStatus', async () => {
      const agent = configService.getCurrentAgent();
      const mode = configService.getCurrentMode();
      const loadedSkills = configService.getLoadedSkillCount();
      const totalSkills = configService.getSkillCount();

      const message = `OPUS 67 v4.0.0

Agent: ${agent.name}
Mode: ${mode.name}
Skills: ${loadedSkills}/${totalSkills} loaded`;

      vscode.window.showInformationMessage(message, 'Open Dashboard').then((action) => {
        if (action === 'Open Dashboard') {
          vscode.commands.executeCommand('opus67.openDashboard');
        }
      });
    })
  );

  // Refresh Skills
  context.subscriptions.push(
    vscode.commands.registerCommand('opus67.refreshSkills', async () => {
      await configService.refreshFromRegistry();
      providers.skillTreeProvider?.refresh();
      providers.statusBarProvider?.update();
      vscode.window.showInformationMessage('Skills refreshed');
    })
  );
}

function getSkillViewHtml(skill: Skill, isLoaded: boolean): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { 
          font-family: var(--vscode-font-family); 
          padding: 20px; 
          color: var(--vscode-foreground);
          background: var(--vscode-editor-background);
        }
        h1 { font-size: 24px; margin-bottom: 10px; }
        .badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          margin-right: 8px;
        }
        .badge-category { background: var(--vscode-badge-background); }
        .badge-loaded { background: #22c55e; color: white; }
        .badge-tokens { background: var(--vscode-badge-background); }
        .description { margin: 20px 0; font-size: 14px; line-height: 1.6; }
        .section { margin: 20px 0; }
        .section h2 { font-size: 16px; margin-bottom: 10px; }
        pre { 
          background: var(--vscode-textBlockQuote-background); 
          padding: 12px; 
          border-radius: 6px; 
          overflow-x: auto;
        }
      </style>
    </head>
    <body>
      <h1>${skill.id}</h1>
      <div>
        <span class="badge badge-category">${skill.category}</span>
        <span class="badge badge-tokens">~${skill.tokens} tokens</span>
        ${isLoaded ? '<span class="badge badge-loaded">Loaded</span>' : ''}
      </div>
      <p class="description">${skill.description}</p>
      
      ${skill.dependencies?.length ? `
        <div class="section">
          <h2>Dependencies</h2>
          <p>${skill.dependencies.join(', ')}</p>
        </div>
      ` : ''}

      <div class="section">
        <h2>Usage</h2>
        <pre>Load this skill to enable ${skill.id} capabilities in your AI assistant.</pre>
      </div>
    </body>
    </html>
  `;
}

function getDashboardHtml(configService: ConfigService): string {
  const agent = configService.getCurrentAgent();
  const mode = configService.getCurrentMode();
  const totalSkills = configService.getSkillCount();
  const loadedSkills = configService.getLoadedSkillCount();

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { 
          font-family: var(--vscode-font-family); 
          padding: 30px; 
          color: var(--vscode-foreground);
          background: var(--vscode-editor-background);
        }
        h1 { 
          font-size: 28px; 
          margin-bottom: 30px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .stats { 
          display: grid; 
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); 
          gap: 20px; 
          margin-bottom: 30px;
        }
        .stat {
          background: var(--vscode-textBlockQuote-background);
          padding: 20px;
          border-radius: 8px;
          text-align: center;
        }
        .stat-value { 
          font-size: 36px; 
          font-weight: bold; 
          color: #8b5cf6;
        }
        .stat-label { 
          font-size: 14px; 
          color: var(--vscode-descriptionForeground);
          margin-top: 5px;
        }
        .section { margin: 30px 0; }
        .section h2 { font-size: 18px; margin-bottom: 15px; }
        .config-item {
          display: flex;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid var(--vscode-widget-border);
        }
        .config-label { color: var(--vscode-descriptionForeground); }
        .config-value { font-weight: 500; }
      </style>
    </head>
    <body>
      <h1>🚀 OPUS 67 Dashboard</h1>
      
      <div class="stats">
        <div class="stat">
          <div class="stat-value">${totalSkills}</div>
          <div class="stat-label">Total Skills</div>
        </div>
        <div class="stat">
          <div class="stat-value">${loadedSkills}</div>
          <div class="stat-label">Loaded</div>
        </div>
        <div class="stat">
          <div class="stat-value">47</div>
          <div class="stat-label">MCPs</div>
        </div>
        <div class="stat">
          <div class="stat-value">82</div>
          <div class="stat-label">Agents</div>
        </div>
      </div>

      <div class="section">
        <h2>Current Configuration</h2>
        <div class="config-item">
          <span class="config-label">Agent</span>
          <span class="config-value">${agent.name}</span>
        </div>
        <div class="config-item">
          <span class="config-label">Mode</span>
          <span class="config-value">${mode.name}</span>
        </div>
        <div class="config-item">
          <span class="config-label">Version</span>
          <span class="config-value">v4.0.0</span>
        </div>
      </div>

      <div class="section">
        <h2>Quick Actions</h2>
        <p>Use the sidebar to browse skills, switch agents, and change modes.</p>
        <p>Keyboard shortcuts:</p>
        <ul>
          <li><code>Cmd/Ctrl+Shift+O</code> - Load Skill</li>
          <li><code>Cmd/Ctrl+Shift+A</code> - Switch Agent</li>
          <li><code>Cmd/Ctrl+Shift+M</code> - Set Mode</li>
        </ul>
      </div>
    </body>
    </html>
  `;
}
```

---

## Snippets

### snippets/typescript.json

```json
{
  "OPUS Solana Swap": {
    "prefix": "opus-swap",
    "body": [
      "const swapResult = await jupiter.exchange({",
      "  inputMint: ${1:inputMint},",
      "  outputMint: ${2:outputMint},",
      "  amount: ${3:amount},",
      "  slippageBps: ${4:100},",
      "});",
      "",
      "console.log('Swap TX:', swapResult.txid);"
    ],
    "description": "Jupiter swap boilerplate"
  },
  "OPUS Anchor Program": {
    "prefix": "opus-anchor-program",
    "body": [
      "import * as anchor from '@coral-xyz/anchor';",
      "import { Program } from '@coral-xyz/anchor';",
      "import { ${1:ProgramName} } from '../target/types/${2:program_name}';",
      "",
      "describe('${2:program_name}', () => {",
      "  const provider = anchor.AnchorProvider.env();",
      "  anchor.setProvider(provider);",
      "",
      "  const program = anchor.workspace.${1:ProgramName} as Program<${1:ProgramName}>;",
      "",
      "  it('${3:test_name}', async () => {",
      "    $0",
      "  });",
      "});"
    ],
    "description": "Anchor test file boilerplate"
  },
  "OPUS Next.js API Route": {
    "prefix": "opus-nextapi",
    "body": [
      "import { NextRequest, NextResponse } from 'next/server';",
      "",
      "export async function ${1|GET,POST,PUT,DELETE|}(request: NextRequest) {",
      "  try {",
      "    $0",
      "    return NextResponse.json({ success: true });",
      "  } catch (error) {",
      "    return NextResponse.json(",
      "      { error: 'Internal server error' },",
      "      { status: 500 }",
      "    );",
      "  }",
      "}"
    ],
    "description": "Next.js 14 API route"
  }
}
```

---

## Publishing

### Build and Package

```bash
# Build
npm run package

# Package into .vsix
npx @vscode/vsce package

# Creates: opus67-4.0.0.vsix
```

### Publish to Marketplace

```bash
# Login (first time)
npx @vscode/vsce login icm-motion

# Publish
npx @vscode/vsce publish

# Or publish specific version
npx @vscode/vsce publish 4.0.0
```

---

## Timeline

| Day | Task |
|-----|------|
| 1-2 | Project scaffold, package.json, basic activation |
| 3-4 | Tree providers (skills, agents, modes) |
| 5-6 | Status bar, commands |
| 7-8 | Dashboard webview, skill viewer |
| 9-10 | Snippets, code actions |
| 11-12 | Testing, polish |
| 13-14 | Documentation, screenshots, publish |

**Total: ~3 weeks to marketplace**
