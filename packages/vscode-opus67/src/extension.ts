import * as vscode from 'vscode';

// OPUS 67 Skills by category
const SKILLS = {
  'GRAB Skills': [
    { id: 'react-grab', name: 'React Grab', desc: 'Extract React components from any UI' },
    { id: 'theme-grab', name: 'Theme Grab', desc: 'Extract color schemes and design tokens' },
    { id: 'form-grab', name: 'Form Grab', desc: 'Clone form patterns and validation' },
    { id: 'layout-grab', name: 'Layout Grab', desc: 'Extract responsive layout patterns' },
  ],
  'Solana Skills': [
    { id: 'token-swap', name: 'Token Swap', desc: 'Jupiter integration for token swaps' },
    { id: 'anchor-interact', name: 'Anchor Interact', desc: 'Anchor program interactions' },
    { id: 'chain-query', name: 'Chain Query', desc: 'On-chain data queries' },
    { id: 'pump-launch', name: 'Pump Launch', desc: 'Token launch mechanics' },
  ],
  'Research Skills': [
    { id: 'web-search', name: 'Web Search', desc: 'Deep web research' },
    { id: 'code-search', name: 'Code Search', desc: 'Codebase semantic search' },
    { id: 'company-research', name: 'Company Research', desc: 'Competitive analysis' },
  ],
  'Builder Skills': [
    { id: 'api-scaffold', name: 'API Scaffold', desc: 'Generate API boilerplate' },
    { id: 'test-gen', name: 'Test Generator', desc: 'Auto-generate test suites' },
    { id: 'doc-gen', name: 'Doc Generator', desc: 'Generate documentation' },
  ],
};

// OPUS 67 Agents
const AGENTS = {
  'Vision Agents': [
    { id: 'grabber', name: 'Grabber', desc: 'Visual element extraction' },
    { id: 'cloner', name: 'Cloner', desc: 'UI pattern cloning' },
    { id: 'theme-extractor', name: 'Theme Extractor', desc: 'Design system extraction' },
  ],
  'Solana Agents': [
    { id: 'jupiter-trader', name: 'Jupiter Trader', desc: 'Token swap optimization' },
    { id: 'anchor-architect', name: 'Anchor Architect', desc: 'Program design patterns' },
    { id: 'defi-analyst', name: 'DeFi Analyst', desc: 'Protocol analysis' },
  ],
  'Builder Agents': [
    { id: 'fullstack-builder', name: 'Full Stack Builder', desc: 'End-to-end development' },
    { id: 'api-designer', name: 'API Designer', desc: 'API architecture' },
    { id: 'test-engineer', name: 'Test Engineer', desc: 'Quality assurance' },
  ],
};

// Operating modes
const MODES = [
  { id: 'AUTO', name: 'AUTO', desc: 'Auto-detect best approach', icon: '$(sparkle)' },
  { id: 'BUILD', name: 'BUILD', desc: 'Ship fast, working code', icon: '$(tools)' },
  { id: 'REVIEW', name: 'REVIEW', desc: 'Thorough analysis', icon: '$(eye)' },
  { id: 'ARCHITECT', name: 'ARCHITECT', desc: 'System design thinking', icon: '$(layout)' },
  { id: 'DEBUG', name: 'DEBUG', desc: 'Root cause analysis', icon: '$(bug)' },
  { id: 'SOLANA', name: 'SOLANA', desc: 'Blockchain-native', icon: '$(pulse)' },
  { id: 'GRAB', name: 'GRAB', desc: 'Visual-first development', icon: '$(screen-full)' },
  { id: 'VIBE', name: 'VIBE', desc: 'Ship fast, iterate later', icon: '$(rocket)' },
];

let statusBarItem: vscode.StatusBarItem;
let currentMode = 'AUTO';

export function activate(context: vscode.ExtensionContext) {
  console.log('OPUS 67 extension activated');

  // Create status bar item
  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.command = 'opus67.selectMode';
  updateStatusBar();

  const config = vscode.workspace.getConfiguration('opus67');
  if (config.get('showStatusBar')) {
    statusBarItem.show();
  }

  context.subscriptions.push(statusBarItem);

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('opus67.showStatus', showStatus),
    vscode.commands.registerCommand('opus67.browseSkills', browseSkills),
    vscode.commands.registerCommand('opus67.browseAgents', browseAgents),
    vscode.commands.registerCommand('opus67.selectMode', selectMode),
    vscode.commands.registerCommand('opus67.install', installInProject),
    vscode.commands.registerCommand('opus67.openDocs', openDocs),
  );

  // Watch for file changes to auto-detect skills
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(onFileChange),
  );

  // Show welcome message on first activation
  const hasShownWelcome = context.globalState.get('opus67.welcomeShown');
  if (!hasShownWelcome) {
    showWelcome();
    context.globalState.update('opus67.welcomeShown', true);
  }
}

function updateStatusBar() {
  const mode = MODES.find(m => m.id === currentMode) || MODES[0];
  statusBarItem.text = `${mode.icon} OPUS 67: ${mode.name}`;
  statusBarItem.tooltip = `OPUS 67 - ${mode.desc}\nClick to change mode`;
}

async function showStatus() {
  const panel = vscode.window.createWebviewPanel(
    'opus67Status',
    'OPUS 67 Status',
    vscode.ViewColumn.One,
    { enableScripts: true }
  );

  panel.webview.html = getStatusHtml();
}

function getStatusHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OPUS 67 Status</title>
  <style>
    body {
      font-family: var(--vscode-font-family);
      padding: 20px;
      color: var(--vscode-foreground);
      background: var(--vscode-editor-background);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo {
      font-family: monospace;
      font-size: 10px;
      color: #00d4ff;
      white-space: pre;
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      margin: 30px 0;
    }
    .stat {
      background: var(--vscode-input-background);
      padding: 20px;
      border-radius: 8px;
      text-align: center;
    }
    .stat-value {
      font-size: 32px;
      font-weight: bold;
      color: #00d4ff;
    }
    .stat-label {
      color: var(--vscode-descriptionForeground);
      margin-top: 5px;
    }
    .mode {
      background: var(--vscode-input-background);
      padding: 15px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .mode-title {
      font-size: 18px;
      margin-bottom: 10px;
    }
    .mode-desc {
      color: var(--vscode-descriptionForeground);
    }
    .principle {
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      border: 1px solid #00d4ff;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
      text-align: center;
    }
    .principle-text {
      font-size: 14px;
      color: #00d4ff;
    }
  </style>
</head>
<body>
  <div class="header">
    <pre class="logo">
   ██████╗ ██████╗ ██╗   ██╗███████╗     ██████╗ ███████╗
  ██╔═══██╗██╔══██╗██║   ██║██╔════╝    ██╔════╝ ╚════██║
  ██║   ██║██████╔╝██║   ██║███████╗    ███████╗     ██╔╝
  ██║   ██║██╔═══╝ ██║   ██║╚════██║    ██╔═══██╗   ██╔╝
  ╚██████╔╝██║     ╚██████╔╝███████║    ╚██████╔╝   ██║
   ╚═════╝ ╚═╝      ╚═════╝ ╚══════╝     ╚═════╝    ╚═╝
    </pre>
    <p style="color: var(--vscode-descriptionForeground);">Self-Evolving AI Runtime v4.2.0</p>
  </div>

  <div class="principle">
    <p class="principle-text">OPUS 67 ≠ Separate AI</p>
    <p class="principle-text">OPUS 67 = Your AI + Enhancement Layer</p>
    <p style="margin-top: 10px; color: #888;">Same driver, better race car.</p>
  </div>

  <div class="stats">
    <div class="stat">
      <div class="stat-value">95</div>
      <div class="stat-label">Skills</div>
    </div>
    <div class="stat">
      <div class="stat-value">84</div>
      <div class="stat-label">MCPs</div>
    </div>
    <div class="stat">
      <div class="stat-value">30</div>
      <div class="stat-label">Modes</div>
    </div>
    <div class="stat">
      <div class="stat-value">82</div>
      <div class="stat-label">Agents</div>
    </div>
  </div>

  <div class="mode">
    <div class="mode-title">Current Mode: ${currentMode}</div>
    <div class="mode-desc">${MODES.find(m => m.id === currentMode)?.desc || 'Auto-detect best approach'}</div>
  </div>
</body>
</html>`;
}

async function browseSkills() {
  const categories = Object.keys(SKILLS);
  const selectedCategory = await vscode.window.showQuickPick(categories, {
    placeHolder: 'Select skill category',
  });

  if (!selectedCategory) return;

  const skills = SKILLS[selectedCategory as keyof typeof SKILLS];
  const items = skills.map(s => ({
    label: s.name,
    description: s.desc,
    detail: `ID: ${s.id}`,
  }));

  const selected = await vscode.window.showQuickPick(items, {
    placeHolder: `${selectedCategory} - Select a skill`,
  });

  if (selected) {
    vscode.window.showInformationMessage(
      `OPUS 67: ${selected.label} skill activated. Use it in your AI prompts.`
    );
  }
}

async function browseAgents() {
  const categories = Object.keys(AGENTS);
  const selectedCategory = await vscode.window.showQuickPick(categories, {
    placeHolder: 'Select agent category',
  });

  if (!selectedCategory) return;

  const agents = AGENTS[selectedCategory as keyof typeof AGENTS];
  const items = agents.map(a => ({
    label: a.name,
    description: a.desc,
    detail: `ID: ${a.id}`,
  }));

  const selected = await vscode.window.showQuickPick(items, {
    placeHolder: `${selectedCategory} - Select an agent`,
  });

  if (selected) {
    vscode.window.showInformationMessage(
      `OPUS 67: ${selected.label} agent ready. Invoke with: "Use ${selected.label} to..."`
    );
  }
}

async function selectMode() {
  const items = MODES.map(m => ({
    label: `${m.icon} ${m.name}`,
    description: m.desc,
    id: m.id,
  }));

  const selected = await vscode.window.showQuickPick(items, {
    placeHolder: 'Select OPUS 67 operating mode',
  });

  if (selected) {
    currentMode = (selected as any).id;
    updateStatusBar();
    vscode.window.showInformationMessage(`OPUS 67: Mode set to ${currentMode}`);
  }
}

async function installInProject() {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    vscode.window.showErrorMessage('No workspace folder open');
    return;
  }

  const types = [
    { label: 'Full', description: '95 skills, 84 MCPs, 82 agents', value: 'full' },
    { label: 'Solana', description: '35 skills, 25 MCPs, 30 agents', value: 'solana' },
    { label: 'Frontend', description: '40 skills, 20 MCPs, 25 agents', value: 'frontend' },
    { label: 'Minimal', description: '15 skills, 10 MCPs, 10 agents', value: 'minimal' },
  ];

  const selected = await vscode.window.showQuickPick(types, {
    placeHolder: 'Select installation type',
  });

  if (!selected) return;

  const terminal = vscode.window.createTerminal('OPUS 67');
  terminal.show();
  terminal.sendText(`npx create-opus67@latest --type ${(selected as any).value} --yes`);
}

function openDocs() {
  vscode.env.openExternal(vscode.Uri.parse('https://opus67.dev'));
}

function onFileChange(editor: vscode.TextEditor | undefined) {
  if (!editor) return;

  const config = vscode.workspace.getConfiguration('opus67');
  if (!config.get('autoDetectSkills')) return;

  const fileName = editor.document.fileName;

  // Auto-detect mode based on file type
  if (fileName.endsWith('.rs') || fileName.endsWith('.anchor')) {
    if (currentMode !== 'SOLANA') {
      currentMode = 'SOLANA';
      updateStatusBar();
    }
  } else if (fileName.endsWith('.tsx') || fileName.endsWith('.jsx')) {
    if (currentMode !== 'BUILD') {
      currentMode = 'BUILD';
      updateStatusBar();
    }
  } else if (fileName.endsWith('.test.ts') || fileName.endsWith('.spec.ts')) {
    if (currentMode !== 'REVIEW') {
      currentMode = 'REVIEW';
      updateStatusBar();
    }
  }
}

function showWelcome() {
  vscode.window.showInformationMessage(
    'OPUS 67 activated! You now have access to 95 skills, 84 MCPs, and 82 agents.',
    'Browse Skills',
    'Select Mode',
    'Open Docs'
  ).then(selection => {
    if (selection === 'Browse Skills') {
      browseSkills();
    } else if (selection === 'Select Mode') {
      selectMode();
    } else if (selection === 'Open Docs') {
      openDocs();
    }
  });
}

export function deactivate() {
  if (statusBarItem) {
    statusBarItem.dispose();
  }
}
