/**
 * gicm setup-claude - Configure Claude Code integration
 *
 * Generates .claude/settings.local.json with MCP server configuration
 */

import chalk from 'chalk';
import ora from 'ora';
import * as fs from 'fs-extra';
import * as path from 'path';
import { loadConfig, isInitialized } from '../lib/config';

interface SetupClaudeOptions {
  verbose?: boolean;
  mcpPort?: number;
}

interface ClaudeSettings {
  mcpServers?: Record<string, {
    command: string;
    args: string[];
    env?: Record<string, string>;
  }>;
  permissions?: {
    allow?: string[];
    deny?: string[];
  };
}

export async function setupClaudeCommand(options: SetupClaudeOptions = {}): Promise<void> {
  const cwd = process.cwd();

  console.log(chalk.bold('\n🤖 gICM Setup Claude\n'));

  // Check if initialized
  if (!await isInitialized(cwd)) {
    console.log(chalk.red('✗ Project not initialized.'));
    console.log(chalk.gray('  Run `gicm init` first.\n'));
    process.exit(1);
  }

  // Load config
  const config = await loadConfig(cwd);
  if (!config) {
    console.log(chalk.red('✗ Could not load config.'));
    process.exit(1);
  }

  const mcpPort = options.mcpPort || config.mcp.port;

  // Create .claude directory if needed
  const claudeDir = path.join(cwd, '.claude');
  await fs.ensureDir(claudeDir);

  // Generate settings.local.json
  const settingsPath = path.join(claudeDir, 'settings.local.json');
  const spinner = ora('Generating Claude Code settings...').start();

  try {
    // Load existing settings if present
    let existingSettings: ClaudeSettings = {};
    if (await fs.pathExists(settingsPath)) {
      try {
        existingSettings = await fs.readJson(settingsPath);
      } catch {
        // Ignore parse errors, will overwrite
      }
    }

    // Create gICM MCP server configuration
    const mcpServerConfig = {
      command: 'npx',
      args: ['@gicm/mcp-server', '--port', String(mcpPort)],
      env: {
        GICM_PROJECT_PATH: cwd,
        GICM_CONTEXT_ENGINE_URL: config.mcp.contextEngineUrl,
        GICM_AUTONOMY_LEVEL: String(config.autonomy.level),
      },
    };

    // Merge with existing settings
    const newSettings: ClaudeSettings = {
      ...existingSettings,
      mcpServers: {
        ...existingSettings.mcpServers,
        'gicm-dev': mcpServerConfig,
      },
      permissions: {
        allow: [
          ...(existingSettings.permissions?.allow || []),
          'Bash(gicm:*)',
          'Bash(npx @gicm/*:*)',
        ].filter((v, i, a) => a.indexOf(v) === i), // Dedupe
        deny: existingSettings.permissions?.deny || [],
      },
    };

    await fs.writeJson(settingsPath, newSettings, { spaces: 2 });
    spinner.succeed('Generated .claude/settings.local.json');

    // Also create/update CLAUDE.md with gICM instructions
    const claudeMdPath = path.join(claudeDir, 'CLAUDE.md');
    let claudeMd = '';

    if (await fs.pathExists(claudeMdPath)) {
      claudeMd = await fs.readFile(claudeMdPath, 'utf-8');
    }

    // Add gICM section if not present
    if (!claudeMd.includes('## gICM Integration')) {
      const gicmSection = `
## gICM Integration

This project is configured with gICM for enhanced AI development capabilities.

### Available MCP Tools

- \`dev.search_code\` - Semantic search across the codebase
- \`dev.get_context_bundle\` - Get relevant context for a task
- \`dev.plan_change\` - Generate implementation plans
- \`dev.run_agent\` - Execute specialized gICM agents
- \`dev.status\` - Check project and indexing status

### Usage

The gICM MCP server is configured in \`.claude/settings.local.json\`.
Use \`gicm index\` to update the codebase index when files change significantly.

### Autonomy Level

Current autonomy level: **${config.autonomy.level}** (${getAutonomyLabel(config.autonomy.level)})

`;
      claudeMd = claudeMd + '\n' + gicmSection;
      await fs.writeFile(claudeMdPath, claudeMd, 'utf-8');
      console.log(chalk.gray('  Updated .claude/CLAUDE.md with gICM instructions'));
    }

    // Success output
    console.log(chalk.green('\n✓ Claude Code integration configured!\n'));

    console.log(chalk.bold('Configuration:'));
    console.log(chalk.gray(`  MCP Server: gicm-dev`));
    console.log(chalk.gray(`  Port: ${mcpPort}`));
    console.log(chalk.gray(`  Autonomy Level: ${config.autonomy.level}`));

    console.log(chalk.bold('\n📋 Next steps:\n'));
    console.log(chalk.white('  1. Restart Claude Code to load the new MCP server'));
    console.log(chalk.white('  2. Verify the connection in Claude Code settings'));
    console.log(chalk.white('  3. Start asking Claude to help with your code!\n'));

    if (options.verbose) {
      console.log(chalk.bold('Settings file:'));
      console.log(chalk.gray(JSON.stringify(newSettings, null, 2)));
      console.log('');
    }

  } catch (error) {
    spinner.fail('Failed to generate settings');
    throw error;
  }
}

function getAutonomyLabel(level: number): string {
  switch (level) {
    case 1: return 'Manual - requires approval for all actions';
    case 2: return 'Bounded - auto-executes safe actions';
    case 3: return 'Supervised - auto-executes most actions';
    case 4: return 'Autonomous - full auto-execution';
    default: return 'Unknown';
  }
}
