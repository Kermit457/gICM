/**
 * Context commands - Save/load/list dev contexts to cloud
 */

import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { MarketplaceAPI } from '../lib/api';

interface ContextSaveOptions {
  apiUrl: string;
  name?: string;
  description?: string;
  public?: boolean;
  verbose?: boolean;
}

interface ContextLoadOptions {
  apiUrl: string;
  force?: boolean;
  verbose?: boolean;
}

interface ContextListOptions {
  apiUrl: string;
  mine?: boolean;
  verbose?: boolean;
}

interface SavedContext {
  id: string;
  name: string;
  description?: string;
  projectType: string;
  language: string;
  frameworks: string[];
  indexingConfig: Record<string, unknown>;
  mcpConfig: Record<string, unknown>;
  autonomyLevel: number;
  capabilities: string[];
  isPublic: boolean;
  createdAt: string;
  owner?: string;
}

/**
 * Save current context to cloud
 */
export async function contextSaveCommand(options: ContextSaveOptions): Promise<void> {
  const configPath = path.join(process.cwd(), '.gicm', 'config.json');

  if (!fs.existsSync(configPath)) {
    throw new Error('Project not initialized. Run "gicm init" first.');
  }

  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

  // Generate context name from project if not provided
  const contextName = options.name || `${config.project?.name || 'unnamed'}-context`;

  console.log(chalk.cyan('\n Saving context to cloud...\n'));

  const contextData = {
    name: contextName,
    description: options.description || `Dev context for ${config.project?.name}`,
    projectType: config.project?.type || 'unknown',
    language: config.project?.language || 'typescript',
    frameworks: config.project?.frameworks || [],
    indexingConfig: config.indexing || {},
    mcpConfig: config.mcp || {},
    autonomyLevel: config.autonomy?.level || 2,
    capabilities: config.capabilities?.installed || [],
    isPublic: options.public || false,
  };

  if (options.verbose) {
    console.log(chalk.gray('Context data:'));
    console.log(chalk.gray(JSON.stringify(contextData, null, 2)));
  }

  try {
    const api = new MarketplaceAPI(options.apiUrl);
    const result = await api.saveContext(contextData);

    console.log(chalk.green(`  Context saved successfully!\n`));
    console.log(`  ID: ${chalk.cyan(result.id)}`);
    console.log(`  Name: ${chalk.white(result.name)}`);
    console.log(`  Public: ${result.isPublic ? chalk.green('Yes') : chalk.gray('No')}`);
    console.log(`\n  Load it later with: ${chalk.cyan(`gicm context load ${result.id}`)}\n`);

    // Save context ID locally for reference
    const contextsFile = path.join(process.cwd(), '.gicm', 'contexts.json');
    let contexts: string[] = [];
    if (fs.existsSync(contextsFile)) {
      contexts = JSON.parse(fs.readFileSync(contextsFile, 'utf-8'));
    }
    if (!contexts.includes(result.id)) {
      contexts.push(result.id);
      fs.writeFileSync(contextsFile, JSON.stringify(contexts, null, 2));
    }

  } catch {
    // Fallback: save locally if API unavailable
    console.log(chalk.yellow('  Cloud unavailable, saving locally...\n'));

    const localContextsDir = path.join(os.homedir(), '.gicm', 'contexts');
    fs.mkdirSync(localContextsDir, { recursive: true });

    const contextId = `local-${Date.now()}`;
    const contextFile = path.join(localContextsDir, `${contextId}.json`);

    fs.writeFileSync(contextFile, JSON.stringify({
      id: contextId,
      ...contextData,
      createdAt: new Date().toISOString(),
    }, null, 2));

    console.log(chalk.green(`  Context saved locally!\n`));
    console.log(`  ID: ${chalk.cyan(contextId)}`);
    console.log(`  Path: ${chalk.gray(contextFile)}`);
    console.log(`\n  Load it later with: ${chalk.cyan(`gicm context load ${contextId}`)}\n`);
    // Don't throw - local save succeeded
    return;
  }
}

/**
 * Load context from cloud or local
 */
export async function contextLoadCommand(contextId: string, options: ContextLoadOptions): Promise<void> {
  const configPath = path.join(process.cwd(), '.gicm', 'config.json');

  // Check if project exists and warn about overwrite
  if (fs.existsSync(configPath) && !options.force) {
    console.log(chalk.yellow('\n  Project already initialized.'));
    console.log(chalk.gray('  Use --force to overwrite existing configuration.\n'));
    return;
  }

  console.log(chalk.cyan(`\n Loading context ${contextId}...\n`));

  let contextData: SavedContext | null = null;

  // Try cloud first
  try {
    const api = new MarketplaceAPI(options.apiUrl);
    contextData = await api.loadContext(contextId);
  } catch {
    // Try local fallback
    const localContextFile = path.join(os.homedir(), '.gicm', 'contexts', `${contextId}.json`);
    if (fs.existsSync(localContextFile)) {
      contextData = JSON.parse(fs.readFileSync(localContextFile, 'utf-8'));
    }
  }

  if (!contextData) {
    throw new Error(`Context "${contextId}" not found in cloud or locally.`);
  }

  if (options.verbose) {
    console.log(chalk.gray('Loaded context:'));
    console.log(chalk.gray(JSON.stringify(contextData, null, 2)));
  }

  // Create .gicm directory
  const gicmDir = path.join(process.cwd(), '.gicm');
  fs.mkdirSync(gicmDir, { recursive: true });

  // Build config from context
  const config = {
    version: '1.0.0',
    project: {
      name: path.basename(process.cwd()),
      type: contextData.projectType,
      language: contextData.language,
      frameworks: contextData.frameworks,
    },
    indexing: contextData.indexingConfig,
    mcp: contextData.mcpConfig,
    autonomy: {
      level: contextData.autonomyLevel,
      maxAutoExpense: 50,
      requireApproval: ['deploy', 'delete', 'transfer'],
    },
    capabilities: {
      registryUrl: options.apiUrl,
      installed: contextData.capabilities,
      favorites: [],
    },
    loadedFrom: {
      contextId: contextData.id,
      contextName: contextData.name,
      loadedAt: new Date().toISOString(),
    },
  };

  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

  console.log(chalk.green(`  Context loaded successfully!\n`));
  console.log(`  From: ${chalk.cyan(contextData.name)}`);
  console.log(`  Type: ${chalk.white(contextData.projectType)} (${contextData.language})`);
  console.log(`  Frameworks: ${chalk.gray(contextData.frameworks.join(', ') || 'none')}`);
  console.log(`  Autonomy Level: ${chalk.yellow(contextData.autonomyLevel.toString())}`);
  console.log(`\n  Next steps:`);
  console.log(`    ${chalk.cyan('gicm index')}        # Index your codebase`);
  console.log(`    ${chalk.cyan('gicm dev')}          # Start development services`);
  console.log(`    ${chalk.cyan('gicm setup-claude')} # Configure Claude integration\n`);
}

/**
 * List available contexts
 */
export async function contextListCommand(options: ContextListOptions): Promise<void> {
  console.log(chalk.cyan('\n Available Contexts\n'));

  const contexts: SavedContext[] = [];

  // Try to fetch from cloud
  let cloudAvailable = false;
  try {
    const api = new MarketplaceAPI(options.apiUrl);
    const cloudContexts = await api.listContexts(options.mine);
    contexts.push(...cloudContexts);
    cloudAvailable = true;
  } catch {
    console.log(chalk.gray('  (Cloud unavailable, showing local contexts only)\n'));
  }
  void cloudAvailable; // Used below if needed

  // Add local contexts
  const localContextsDir = path.join(os.homedir(), '.gicm', 'contexts');
  if (fs.existsSync(localContextsDir)) {
    const localFiles = fs.readdirSync(localContextsDir).filter(f => f.endsWith('.json'));
    for (const file of localFiles) {
      try {
        const localContext = JSON.parse(
          fs.readFileSync(path.join(localContextsDir, file), 'utf-8')
        );
        // Don't duplicate if already in cloud list
        if (!contexts.find(c => c.id === localContext.id)) {
          contexts.push({ ...localContext, isLocal: true } as SavedContext & { isLocal: boolean });
        }
      } catch {
        // Skip invalid files
      }
    }
  }

  if (contexts.length === 0) {
    console.log(chalk.gray('  No contexts found.\n'));
    console.log(`  Save your first context with: ${chalk.cyan('gicm context save')}\n`);
    return;
  }

  // Display contexts
  for (const ctx of contexts) {
    const isLocal = (ctx as SavedContext & { isLocal?: boolean }).isLocal;
    const location = isLocal ? chalk.gray('[local]') : chalk.blue('[cloud]');
    const visibility = ctx.isPublic ? chalk.green('[public]') : chalk.gray('[private]');

    console.log(`  ${chalk.cyan(ctx.id)}`);
    console.log(`    ${chalk.white(ctx.name)} ${location} ${visibility}`);
    console.log(`    ${chalk.gray(ctx.description || 'No description')}`);
    console.log(`    Type: ${ctx.projectType} | Lang: ${ctx.language} | Autonomy: ${ctx.autonomyLevel}`);
    if (ctx.frameworks.length > 0) {
      console.log(`    Frameworks: ${chalk.gray(ctx.frameworks.join(', '))}`);
    }
    console.log('');
  }

  console.log(`  Total: ${chalk.white(contexts.length.toString())} context(s)\n`);
  console.log(`  Load a context with: ${chalk.cyan('gicm context load <id>')}\n`);
}
