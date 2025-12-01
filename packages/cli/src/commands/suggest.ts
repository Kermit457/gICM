/**
 * Suggest command - Analyze task and suggest relevant capabilities
 */

import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { MarketplaceAPI } from '../lib/api';

interface SuggestOptions {
  apiUrl: string;
  autoInstall?: boolean;
  limit?: number;
  verbose?: boolean;
}

interface CapabilitySuggestion {
  id: string;
  name: string;
  kind: string;
  description: string;
  relevance: number;
  reason: string;
  installCommand: string;
  isInstalled: boolean;
}

/**
 * Suggest capabilities based on task description
 */
export async function suggestCommand(task: string, options: SuggestOptions): Promise<void> {
  const configPath = path.join(process.cwd(), '.gicm', 'config.json');

  if (!fs.existsSync(configPath)) {
    throw new Error('Project not initialized. Run "gicm init" first.');
  }

  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

  console.log(chalk.cyan(`\n Analyzing task: "${task}"\n`));

  // Get project context
  const context = {
    type: config.project?.type || 'unknown',
    language: config.project?.language || 'typescript',
    frameworks: config.project?.frameworks || [],
  };

  if (options.verbose) {
    console.log(chalk.gray(`  Project: ${context.type} (${context.language})`));
    console.log(chalk.gray(`  Frameworks: ${context.frameworks.join(', ') || 'none'}\n`));
  }

  // Search for relevant tools
  let suggestions: CapabilitySuggestion[] = [];

  try {
    const api = new MarketplaceAPI(options.apiUrl);
    const result = await api.searchTools(task, {
      limit: options.limit || 5,
    });

    if (result.results && result.results.length > 0) {
      suggestions = result.results.map((item) => ({
        id: item.metadata.id,
        name: item.tool.name,
        kind: item.metadata.kind,
        description: item.tool.description,
        relevance: Math.round(item.score * 100),
        reason: `Relevance score: ${item.score.toFixed(2)}`,
        installCommand: item.metadata.install || `gicm add ${item.metadata.id}`,
        isInstalled: false,
      }));
    }
  } catch {
    // Fallback to local suggestions
    suggestions = generateLocalSuggestions(task, context, options.limit || 5);
  }

  // Check installed status
  const installed = config.capabilities?.installed || [];
  for (const suggestion of suggestions) {
    suggestion.isInstalled = installed.includes(suggestion.id);
  }

  // Display suggestions
  if (suggestions.length === 0) {
    console.log(chalk.yellow('  No relevant capabilities found.\n'));
    console.log(`  Try: ${chalk.cyan('gicm search <query>')} to browse the marketplace.\n`);
    return;
  }

  console.log(chalk.white('  Suggested Capabilities:\n'));

  const notInstalled: CapabilitySuggestion[] = [];

  for (const suggestion of suggestions) {
    const relevanceColor = suggestion.relevance >= 80 ? chalk.green : suggestion.relevance >= 60 ? chalk.yellow : chalk.gray;
    const statusIcon = suggestion.isInstalled ? chalk.green('✓') : chalk.gray('○');

    console.log(`  ${statusIcon} ${chalk.cyan(suggestion.name)} ${chalk.gray(`(${suggestion.kind})`)}`);
    console.log(`    ${suggestion.description}`);
    console.log(`    Relevance: ${relevanceColor(suggestion.relevance + '%')} - ${chalk.gray(suggestion.reason)}`);

    if (!suggestion.isInstalled) {
      notInstalled.push(suggestion);
      console.log(`    ${chalk.gray(suggestion.installCommand)}`);
    }

    console.log('');
  }

  // Summary
  const installedCount = suggestions.filter(s => s.isInstalled).length;
  if (installedCount > 0) {
    console.log(chalk.green(`  ✓ ${installedCount} already installed`));
  }
  if (notInstalled.length > 0) {
    console.log(chalk.gray(`  ○ ${notInstalled.length} available to install\n`));
  }

  // Auto-install or prompt
  if (notInstalled.length > 0) {
    if (options.autoInstall) {
      console.log(chalk.cyan('  Auto-installing high-relevance capabilities...\n'));
      const highRelevance = notInstalled.filter(s => s.relevance >= 80);

      if (highRelevance.length > 0) {
        await installCapabilities(highRelevance.map(s => s.id), config, configPath);
        console.log(chalk.green(`  ✓ Installed: ${highRelevance.map(s => s.name).join(', ')}\n`));
      } else {
        console.log(chalk.yellow('  No capabilities with relevance >= 80% to auto-install.\n'));
      }
    } else {
      // Prompt user
      const shouldInstall = await promptInstall(notInstalled);
      if (shouldInstall.length > 0) {
        await installCapabilities(shouldInstall, config, configPath);
        console.log(chalk.green(`\n  ✓ Installed: ${shouldInstall.join(', ')}\n`));
      }
    }
  }
}

/**
 * Generate local suggestions based on keywords
 */
function generateLocalSuggestions(
  task: string,
  _context: { type: string; language: string; frameworks: string[] },
  limit: number
): CapabilitySuggestion[] {
  const suggestions: CapabilitySuggestion[] = [];
  const taskLower = task.toLowerCase();

  const capabilityMap: Record<string, { id: string; name: string; kind: string; description: string }> = {
    "swap": { id: "wallet-agent", name: "Wallet Agent", kind: "agent", description: "Execute token swaps and wallet operations" },
    "trade": { id: "defi-agent", name: "DeFi Agent", kind: "agent", description: "DeFi protocol interactions and yield farming" },
    "token": { id: "hunter-agent", name: "Hunter Agent", kind: "agent", description: "Find and analyze token opportunities" },
    "audit": { id: "audit-agent", name: "Audit Agent", kind: "agent", description: "Smart contract security auditing" },
    "bridge": { id: "bridge-agent", name: "Bridge Agent", kind: "agent", description: "Cross-chain bridging operations" },
    "test": { id: "testing-skill", name: "Testing Skill", kind: "skill", description: "Generate and run tests" },
    "refactor": { id: "refactor-agent", name: "Refactor Agent", kind: "agent", description: "Code refactoring and optimization" },
    "deploy": { id: "deployer-agent", name: "Deployer Agent", kind: "agent", description: "Deployment automation" },
    "build": { id: "builder-agent", name: "Builder Agent", kind: "agent", description: "Code generation and scaffolding" },
    "twitter": { id: "social-agent", name: "Social Agent", kind: "agent", description: "Social media automation" },
    "content": { id: "growth-engine", name: "Growth Engine", kind: "agent", description: "Content generation and marketing" },
    "analyze": { id: "decision-agent", name: "Decision Agent", kind: "agent", description: "Trade decision making and analysis" },
    "backtest": { id: "backtester", name: "Backtester", kind: "agent", description: "Strategy backtesting" },
  };

  for (const [keyword, capability] of Object.entries(capabilityMap)) {
    if (taskLower.includes(keyword)) {
      suggestions.push({
        ...capability,
        relevance: 85,
        reason: `Task mentions "${keyword}"`,
        installCommand: `gicm add ${capability.id}`,
        isInstalled: false,
      });
    }
  }

  return suggestions.sort((a, b) => b.relevance - a.relevance).slice(0, limit);
}

/**
 * Prompt user to select which capabilities to install
 */
async function promptInstall(suggestions: CapabilitySuggestion[]): Promise<string[]> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    console.log(chalk.white('  Quick install options:'));
    console.log(`    ${chalk.cyan('a')} - Install all`);
    console.log(`    ${chalk.cyan('1-' + suggestions.length)} - Install specific (e.g., "1,3")`);
    console.log(`    ${chalk.cyan('n')} - Skip\n`);

    rl.question(chalk.cyan('  Your choice: '), (answer) => {
      rl.close();

      const choice = answer.trim().toLowerCase();

      if (choice === 'a' || choice === 'all') {
        resolve(suggestions.map(s => s.id));
      } else if (choice === 'n' || choice === 'no' || choice === '') {
        resolve([]);
      } else {
        // Parse numbers
        const indices = choice.split(',').map(n => parseInt(n.trim(), 10) - 1);
        const selected = indices
          .filter(i => i >= 0 && i < suggestions.length)
          .map(i => suggestions[i].id);
        resolve(selected);
      }
    });
  });
}

/**
 * Install capabilities to config
 */
async function installCapabilities(
  ids: string[],
  config: Record<string, unknown>,
  configPath: string
): Promise<void> {
  config.capabilities = (config.capabilities as Record<string, unknown>) || { installed: [], favorites: [] };
  const capabilities = config.capabilities as { installed: string[]; favorites: string[] };

  for (const id of ids) {
    if (!capabilities.installed.includes(id)) {
      capabilities.installed.push(id);
    }
  }

  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}
