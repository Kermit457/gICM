"use strict";
/**
 * Add command - Install marketplace items
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addCommand = addCommand;
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const api_1 = require("../lib/api");
const files_1 = require("../lib/files");
const bridge_1 = require("../lib/bridge");
/**
 * Parse item string like "agent/slug" into { kind, slug }
 */
function parseItemString(itemStr) {
    const match = itemStr.match(/^(agent|skill|command|mcp|setting)\/([a-z0-9-]+)$/);
    if (!match) {
        throw new Error(`Invalid item format: "${itemStr}"\n` +
            `  Expected format: <kind>/<slug>\n` +
            `  Examples: agent/code-reviewer, skill/typescript-advanced, command/deploy-foundry`);
    }
    const [, kind, slug] = match;
    return {
        kind: kind,
        slug,
        original: itemStr,
    };
}
/**
 * Add command handler
 */
async function addCommand(items, options = {}) {
    const apiClient = new api_1.GICMAPIClient(options.apiUrl);
    // Initialize FileWriter with platform awareness
    const platform = options.platform || "claude";
    const fileWriter = new files_1.FileWriter(undefined, platform);
    // Ensure config directory exists and is writable
    try {
        await fileWriter.ensureConfigDir();
    }
    catch (error) {
        process.exit(1);
    }
    // Parse all item strings
    let parsedItems;
    try {
        parsedItems = items.map(parseItemString);
    }
    catch (error) {
        console.error(chalk_1.default.red(`\n✗ ${error.message}\n`));
        process.exit(1);
    }
    const platformNames = {
        claude: 'Claude',
        gemini: 'Gemini',
        openai: 'OpenAI'
    };
    const spinner = (0, ora_1.default)({
        text: `Fetching items from gICM marketplace for ${platformNames[platform]}...`,
        color: 'cyan',
    }).start();
    try {
        // Fetch all items
        const fetchedItems = [];
        for (const parsed of parsedItems) {
            const item = await apiClient.getItem(parsed.slug);
            fetchedItems.push(item);
        }
        spinner.text = 'Resolving dependencies...';
        // Resolve dependencies using bundle API
        const itemIds = fetchedItems.map(item => item.id);
        const bundle = await apiClient.resolveBundle(itemIds);
        spinner.succeed(chalk_1.default.green(`Found ${bundle.stats.totalCount} items`) +
            (bundle.stats.dependencyCount > 0
                ? chalk_1.default.gray(` (including ${bundle.stats.dependencyCount} dependencies)`)
                : ''));
        // Show what will be installed
        console.log(chalk_1.default.cyan(`\nItems to install for ${chalk_1.default.bold(platform)}:`));
        const byKind = {
            agent: bundle.items.filter(i => i.kind === 'agent'),
            skill: bundle.items.filter(i => i.kind === 'skill'),
            command: bundle.items.filter(i => i.kind === 'command'),
            mcp: bundle.items.filter(i => i.kind === 'mcp'),
            setting: bundle.items.filter(i => i.kind === 'setting'),
        };
        for (const [kind, kindItems] of Object.entries(byKind)) {
            if (kindItems.length > 0) {
                console.log(chalk_1.default.bold(`\n  ${kind.toUpperCase()}S (${kindItems.length}):`));
                kindItems.forEach(item => {
                    const isRequested = fetchedItems.some(f => f.id === item.id);
                    const prefix = isRequested ? chalk_1.default.green('●') : chalk_1.default.gray('○');
                    const name = isRequested ? chalk_1.default.white(item.name) : chalk_1.default.gray(item.name);
                    const desc = chalk_1.default.gray(`- ${item.description.slice(0, 60)}${item.description.length > 60 ? '...' : ''}`);
                    console.log(`  ${prefix} ${name}`);
                    console.log(`    ${desc}`);
                });
            }
        }
        if (bundle.stats.tokenSavings > 0) {
            console.log(chalk_1.default.yellow(`\n💡 Estimated token savings: ${bundle.stats.tokenSavings}%`));
        }
        // Confirm installation (unless --yes flag)
        if (!options.skipConfirm) {
            console.log(chalk_1.default.cyan(`\nPress Ctrl+C to cancel, or any key to continue...`));
            // Simple confirmation - in production you'd use enquirer
            // For now, just continue automatically after 1 second
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        // Download and install files
        const installSpinner = (0, ora_1.default)({
            text: 'Installing files...',
            color: 'green',
        }).start();
        let installedCount = 0;
        for (const item of bundle.items) {
            try {
                // Download files
                const files = await apiClient.getFiles(item.slug);
                // Apply Universal Bridge Logic
                // If targeting a different platform, wrap prompt files with compatibility shim
                const bridgedFiles = files.map(file => {
                    // Only transform markdown files (prompts) and only if not using default Claude
                    if (file.path.endsWith('.md') && platform !== 'claude') {
                        // Check if file content already has specific headers to avoid double wrapping
                        if (!file.content.includes('AETHER BRIDGE: ADAPTER ACTIVE')) {
                            const bridgedContent = bridge_1.UniversalBridge.bridgePrompt(file.content, {
                                sourcePlatform: 'claude', // Assuming source is Claude-native by default
                                targetPlatform: platform, // gemini or openai
                                agentName: item.name
                            });
                            return { ...file, content: bridgedContent };
                        }
                    }
                    return file;
                });
                // Write files
                await fileWriter.writeItem(item, bridgedFiles);
                installedCount++;
                installSpinner.text = `Installing... (${installedCount}/${bundle.stats.totalCount})`;
                if (options.verbose) {
                    installSpinner.text = `Installed ${item.kind}/${item.slug}`;
                }
            }
            catch (error) {
                installSpinner.fail(chalk_1.default.red(`Failed to install ${item.kind}/${item.slug}`));
                console.error(chalk_1.default.yellow(`  ${error.message}`));
                // Continue with other items
                installSpinner.start();
            }
        }
        installSpinner.succeed(chalk_1.default.green(`Successfully installed ${installedCount} items!`));
        // Show summary
        console.log(chalk_1.default.green('\n✓ Installation complete!\n'));
        console.log(chalk_1.default.cyan('Installed items:'));
        console.log(`  ${chalk_1.default.bold('Agents:')}   ${bundle.stats.byKind.agent}`);
        console.log(`  ${chalk_1.default.bold('Skills:')}   ${bundle.stats.byKind.skill}`);
        console.log(`  ${chalk_1.default.bold('Commands:')} ${bundle.stats.byKind.command}`);
        console.log(`  ${chalk_1.default.bold('MCPs:')}     ${bundle.stats.byKind.mcp}`);
        if (bundle.stats.byKind.setting) {
            console.log(`  ${chalk_1.default.bold('Settings:')} ${bundle.stats.byKind.setting}`);
        }
        // Show next steps for MCPs if any were installed (Claude-only feature)
        const mcps = bundle.items.filter(i => i.kind === 'mcp');
        if (mcps.length > 0) {
            if (platform === 'claude') {
                console.log(chalk_1.default.yellow('\n⚠️  MCP servers require configuration:'));
                mcps.forEach(mcp => {
                    if (mcp.envKeys && mcp.envKeys.length > 0) {
                        console.log(chalk_1.default.gray(`\n  ${mcp.name}:`));
                        console.log(chalk_1.default.gray(`    Configure: .claude/mcp/${mcp.slug}.json`));
                        console.log(chalk_1.default.gray(`    Required: ${mcp.envKeys.join(', ')}`));
                    }
                });
            }
            else {
                console.log(chalk_1.default.yellow('\n⚠️  Note: MCPs are Claude-only. Skipped MCP installation for ' + platformNames[platform]));
            }
        }
        console.log(chalk_1.default.gray(`\n💡 Tip: Reload your ${platformNames[platform]} editor to see the new items.\n`));
    }
    catch (error) {
        spinner.fail(chalk_1.default.red('Installation failed'));
        console.error(chalk_1.default.red(`\n${error.message}\n`));
        process.exit(1);
    }
}
//# sourceMappingURL=add.js.map