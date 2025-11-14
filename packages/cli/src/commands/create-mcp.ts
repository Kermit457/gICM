/**
 * Create MCP Command - Interactive wizard for creating custom MCPs
 */

import chalk from 'chalk';
import inquirer from 'inquirer';
import fs from 'fs-extra';
import path from 'path';
import { z } from 'zod';

// MCP Schema Validator
const MCPConfigSchema = z.object({
  mcpServers: z.record(
    z.string(),
    z.object({
      command: z.string(),
      args: z.array(z.string()),
      env: z.record(z.string(), z.string()).optional(),
      metadata: z.object({
        name: z.string(),
        description: z.string(),
        category: z.string(),
        tags: z.array(z.string()),
        version: z.string(),
        author: z.string(),
        documentation: z.string(),
        requiredEnvKeys: z.array(z.string()),
        tools: z.array(
          z.object({
            name: z.string(),
            description: z.string(),
          })
        ),
        pricing: z
          .object({
            free_tier: z.string().optional(),
            paid_tier: z.string().optional(),
            enterprise: z.string().optional(),
            note: z.string().optional(),
          })
          .optional(),
        setup: z
          .object({
            steps: z.array(z.string()),
          })
          .optional(),
      }),
    })
  ),
});

interface CreateMCPOptions {
  name?: string;
  skipConfirm?: boolean;
  verbose?: boolean;
}

const CATEGORIES = [
  'ICM & Crypto',
  'Database',
  'API Integration',
  'Cloud Services',
  'AI/ML',
  'DevOps',
  'Analytics',
  'Other',
];

const LANGUAGES = [
  { name: 'JavaScript (Node.js)', value: 'javascript' },
  { name: 'Python', value: 'python' },
  { name: 'Other (manual setup)', value: 'other' },
];

export async function createMCPCommand(options: CreateMCPOptions) {
  console.log(chalk.blue.bold('\n🔌 MCP Creation Wizard\n'));

  try {
    // Find project root (.claude directory)
    const projectRoot = findProjectRoot();
    if (!projectRoot) {
      throw new Error(
        'Could not find .claude directory. Are you in a Claude Code project?'
      );
    }

    const mcpsDir = path.join(projectRoot, '.claude', 'mcps');
    const serversDir = path.join(mcpsDir, 'servers');

    // Ensure directories exist
    await fs.ensureDir(mcpsDir);
    await fs.ensureDir(serversDir);

    // Interactive prompts
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'MCP name (lowercase, no spaces):',
        default: options.name,
        validate: (input: string) => {
          if (!input) return 'Name is required';
          if (!/^[a-z0-9-]+$/.test(input))
            return 'Use lowercase letters, numbers, and hyphens only';

          const configPath = path.join(mcpsDir, `${input}.json`);
          if (fs.existsSync(configPath))
            return `MCP "${input}" already exists`;

          return true;
        },
      },
      {
        type: 'input',
        name: 'displayName',
        message: 'Display name:',
        validate: (input: string) => (input ? true : 'Display name is required'),
      },
      {
        type: 'input',
        name: 'description',
        message: 'Short description (1-2 sentences):',
        validate: (input: string) => (input ? true : 'Description is required'),
      },
      {
        type: 'list',
        name: 'category',
        message: 'Category:',
        choices: CATEGORIES,
      },
      {
        type: 'input',
        name: 'tags',
        message: 'Tags (comma-separated):',
        default: 'api, integration',
        filter: (input: string) =>
          input.split(',').map((tag) => tag.trim()),
      },
      {
        type: 'list',
        name: 'language',
        message: 'Server language:',
        choices: LANGUAGES,
      },
      {
        type: 'input',
        name: 'envKeys',
        message: 'Environment variables (comma-separated, or press Enter for none):',
        default: '',
        filter: (input: string) =>
          input
            ? input.split(',').map((key) => key.trim().toUpperCase())
            : [],
      },
      {
        type: 'input',
        name: 'tools',
        message: 'Tool names (comma-separated):',
        default: 'getData, processData',
        validate: (input: string) => (input ? true : 'At least one tool is required'),
        filter: (input: string) =>
          input.split(',').map((tool) => tool.trim()),
      },
      {
        type: 'input',
        name: 'author',
        message: 'Author name:',
        default: 'gICM Community',
      },
      {
        type: 'input',
        name: 'documentation',
        message: 'Documentation URL (or press Enter to skip):',
        default: 'https://example.com/docs',
      },
      {
        type: 'input',
        name: 'version',
        message: 'Version:',
        default: '1.0.0',
        validate: (input: string) => {
          if (!/^\d+\.\d+\.\d+$/.test(input))
            return 'Use semantic versioning (e.g., 1.0.0)';
          return true;
        },
      },
    ]);

    const mcpName = answers.name;
    const configPath = path.join(mcpsDir, `${mcpName}.json`);
    const serverPath = path.join(serversDir, `${mcpName}-server.${answers.language === 'python' ? 'py' : 'js'}`);

    if (options.verbose) {
      console.log(chalk.gray(`\nGenerating files:`));
      console.log(chalk.gray(`  Config: ${configPath}`));
      console.log(chalk.gray(`  Server: ${serverPath}`));
    }

    // Generate MCP config
    const mcpConfig = {
      mcpServers: {
        [mcpName]: {
          command: answers.language === 'python' ? 'python3' : 'node',
          args: [serverPath.replace(/\\/g, '\\\\')],
          ...(answers.envKeys.length > 0 && {
            env: answers.envKeys.reduce(
              (acc: Record<string, string>, key: string) => {
                acc[key] = `\${${key}}`;
                return acc;
              },
              {}
            ),
          }),
          metadata: {
            name: answers.displayName,
            description: answers.description,
            category: answers.category,
            tags: answers.tags,
            version: answers.version,
            author: answers.author,
            documentation: answers.documentation,
            requiredEnvKeys: answers.envKeys,
            tools: answers.tools.map((toolName: string) => ({
              name: toolName,
              description: `TODO: Describe what ${toolName} does`,
            })),
            pricing: {
              free_tier: 'TODO: Describe free tier',
              paid_tier: 'TODO: Describe paid tier',
              note: 'Update pricing information as needed',
            },
            setup: {
              steps: [
                'TODO: Step 1 - Sign up for API',
                'TODO: Step 2 - Get API key',
                `TODO: Step 3 - Add env vars to .env`,
                `Run: npx @gicm/cli add mcp/${mcpName}`,
              ],
            },
          },
        },
      },
    };

    // Validate schema
    try {
      MCPConfigSchema.parse(mcpConfig);
    } catch (error) {
      throw new Error(`Generated config failed validation: ${error}`);
    }

    // Write config file
    await fs.writeJson(configPath, mcpConfig, { spaces: 2 });

    // Generate server template
    if (answers.language === 'javascript') {
      const serverTemplate = generateJavaScriptTemplate(
        mcpName,
        answers.tools,
        answers.envKeys
      );
      await fs.writeFile(serverPath, serverTemplate);
    } else if (answers.language === 'python') {
      const serverTemplate = generatePythonTemplate(
        mcpName,
        answers.tools,
        answers.envKeys
      );
      await fs.writeFile(serverPath, serverTemplate);
    }

    // Success message
    console.log(chalk.green.bold('\n✓ MCP created successfully!\n'));
    console.log(chalk.blue('Files generated:'));
    console.log(chalk.gray(`  📄 ${configPath}`));
    console.log(chalk.gray(`  📄 ${serverPath}\n`));

    console.log(chalk.yellow('Next steps:'));
    console.log(chalk.gray('  1. Edit server file to implement your tools'));
    console.log(chalk.gray('  2. Add required environment variables to .env'));
    console.log(chalk.gray('  3. Test: npx @gicm/cli validate'));
    console.log(chalk.gray(`  4. Add to registry: npx @gicm/cli add mcp/${mcpName}\n`));

    console.log(
      chalk.blue('📖 Read the guide: ') + chalk.underline('MCP_PLUGIN_GUIDE.md\n')
    );
  } catch (error) {
    throw error;
  }
}

function generateJavaScriptTemplate(
  mcpName: string,
  tools: string[],
  envKeys: string[]
): string {
  const envInit = envKeys
    .map((key) => `    this.${key.toLowerCase()} = process.env.${key};`)
    .join('\n');

  const toolMethods = tools
    .map(
      (tool) => `  async ${tool}(params) {
    // TODO: Implement ${tool}
    // Access params with: params.yourParam
    // Access env vars with: this.${envKeys[0]?.toLowerCase() || 'apiKey'}

    try {
      // Your implementation here
      const result = { message: 'TODO: Implement this tool' };

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }`
    )
    .join('\n\n');

  return `#!/usr/bin/env node

/**
 * ${mcpName.toUpperCase()} MCP Server
 *
 * TODO: Add server description
 *
 * Environment Variables:
${envKeys.map((key) => ` * - ${key}: TODO: Describe this env var`).join('\n')}
 */

class ${toPascalCase(mcpName)}MCPServer {
  constructor() {
${envInit || '    // No environment variables configured'}
  }

${toolMethods}

  // Request handler (don't modify this)
  async handleRequest(request) {
    const { method, params } = request;

    if (typeof this[method] === 'function') {
      return await this[method](params);
    }

    return {
      success: false,
      error: \`Unknown method: \${method}\`,
    };
  }

  // Start MCP server (don't modify this)
  start() {
    process.stdin.on('data', async (data) => {
      try {
        const request = JSON.parse(data.toString());
        const response = await this.handleRequest(request);
        process.stdout.write(JSON.stringify(response) + '\\n');
      } catch (error) {
        process.stdout.write(
          JSON.stringify({
            success: false,
            error: error.message,
          }) + '\\n'
        );
      }
    });

    process.stdin.resume();
  }
}

// Start the server
const server = new ${toPascalCase(mcpName)}MCPServer();
server.start();
`;
}

function generatePythonTemplate(
  mcpName: string,
  tools: string[],
  envKeys: string[]
): string {
  const envInit = envKeys
    .map((key) => `        self.${key.toLowerCase()} = os.getenv('${key}')`)
    .join('\n');

  const toolMethods = tools
    .map(
      (tool) => `    def ${tool}(self, params):
        """
        TODO: Implement ${tool}
        Access params with: params.get('yourParam')
        Access env vars with: self.${envKeys[0]?.toLowerCase() || 'api_key'}
        """
        try:
            # Your implementation here
            result = {'message': 'TODO: Implement this tool'}

            return {
                'success': True,
                'data': result
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }`
    )
    .join('\n\n');

  return `#!/usr/bin/env python3

"""
${mcpName.toUpperCase()} MCP Server

TODO: Add server description

Environment Variables:
${envKeys.map((key) => `- ${key}: TODO: Describe this env var`).join('\n')}
"""

import sys
import json
import os

class ${toPascalCase(mcpName)}MCPServer:
    def __init__(self):
${envInit || '        pass  # No environment variables configured'}

${toolMethods}

    def handle_request(self, request):
        """Request handler (don't modify this)"""
        method = request.get('method')
        params = request.get('params', {})

        if hasattr(self, method):
            return getattr(self, method)(params)

        return {
            'success': False,
            'error': f'Unknown method: {method}'
        }

    def start(self):
        """Start MCP server (don't modify this)"""
        for line in sys.stdin:
            try:
                request = json.loads(line)
                response = self.handle_request(request)
                print(json.dumps(response), flush=True)
            except Exception as e:
                print(json.dumps({
                    'success': False,
                    'error': str(e)
                }), flush=True)

if __name__ == '__main__':
    server = ${toPascalCase(mcpName)}MCPServer()
    server.start()
`;
}

function toPascalCase(str: string): string {
  return str
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

function findProjectRoot(): string | null {
  let currentDir = process.cwd();

  while (currentDir !== path.parse(currentDir).root) {
    const claudeDir = path.join(currentDir, '.claude');
    if (fs.existsSync(claudeDir)) {
      return currentDir;
    }
    currentDir = path.dirname(currentDir);
  }

  return null;
}
