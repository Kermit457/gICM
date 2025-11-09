import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import prompts from 'prompts';
import path from 'path';
import { ensureClaudeDir, readFile, writeFile } from '../utils/files.js';
// Settings metadata (imported from registry)
const SETTINGS_REGISTRY = [
    // Performance
    { id: 'performance/mcp-timeout-duration', type: 'number', default: 30000, min: 5000, max: 300000 },
    { id: 'performance/mcp-retry-attempts', type: 'number', default: 3, min: 0, max: 10 },
    { id: 'performance/skill-cache-ttl', type: 'number', default: 3600, min: 0, max: 86400 },
    { id: 'performance/parallel-tool-execution', type: 'boolean', default: true },
    { id: 'performance/token-budget-limit', type: 'number', default: 200000, min: 10000, max: 200000 },
    { id: 'performance/response-streaming', type: 'boolean', default: true },
    { id: 'performance/context-window-size', type: 'number', default: 200000, min: 10000, max: 200000 },
    { id: 'performance/agent-cache-strategy', type: 'string', default: 'session', enum: ['none', 'session', 'persistent'] },
    { id: 'performance/batch-operation-size', type: 'number', default: 10, min: 1, max: 100 },
    { id: 'performance/network-timeout', type: 'number', default: 30000, min: 5000, max: 120000 },
    { id: 'performance/lazy-skill-loading', type: 'boolean', default: true },
    { id: 'performance/compression-enabled', type: 'boolean', default: true },
    // Security
    { id: 'security/require-env-validation', type: 'boolean', default: true },
    { id: 'security/sandbox-mode', type: 'boolean', default: false },
    { id: 'security/api-key-rotation-days', type: 'number', default: 90, min: 0, max: 365 },
    { id: 'security/allowed-domains', type: 'array', default: [] },
    { id: 'security/audit-log-enabled', type: 'boolean', default: false },
    { id: 'security/mcp-permission-model', type: 'string', default: 'permissive', enum: ['strict', 'permissive', 'custom'] },
    { id: 'security/credential-encryption', type: 'boolean', default: false },
    { id: 'security/rate-limit-per-hour', type: 'number', default: 1000, min: 10, max: 100000 },
    { id: 'security/disallowed-commands', type: 'array', default: ['rm -rf /', 'dd if=', 'mkfs', ':(){ :|:& };:'] },
    { id: 'security/require-signature-verification', type: 'boolean', default: false },
    // Development
    { id: 'development/auto-git-commit', type: 'boolean', default: false },
    { id: 'development/conventional-commits', type: 'boolean', default: true },
    { id: 'development/pre-commit-hooks', type: 'boolean', default: true },
    { id: 'development/test-before-deploy', type: 'boolean', default: true },
    { id: 'development/linting-enabled', type: 'boolean', default: true },
    { id: 'development/format-on-save', type: 'boolean', default: true },
    { id: 'development/typescript-strict-mode', type: 'boolean', default: true },
    { id: 'development/dependency-auto-update', type: 'string', default: 'none', enum: ['none', 'patch', 'minor', 'major'] },
    // Integration
    { id: 'integration/default-rpc-provider', type: 'string', default: 'helius', enum: ['alchemy', 'infura', 'quicknode', 'helius', 'custom'] },
    { id: 'integration/subgraph-endpoint', type: 'string', default: 'studio', enum: ['hosted', 'studio', 'decentralized'] },
    { id: 'integration/wallet-adapter-priority', type: 'array', default: ['phantom', 'solflare', 'backpack'] },
    { id: 'integration/ipfs-gateway-url', type: 'string', default: 'cloudflare-ipfs.com' },
    { id: 'integration/analytics-enabled', type: 'boolean', default: false },
    { id: 'integration/error-reporting-service', type: 'string', default: 'none', enum: ['sentry', 'bugsnag', 'rollbar', 'none'] },
    { id: 'integration/monitoring-dashboard', type: 'string', default: 'none', enum: ['datadog', 'newrelic', 'grafana', 'prometheus', 'none'] },
    // Monitoring
    { id: 'monitoring/performance-profiling', type: 'boolean', default: false },
    { id: 'monitoring/memory-usage-alerts', type: 'number', default: 0, min: 0, max: 32768 },
    { id: 'monitoring/slow-query-threshold-ms', type: 'number', default: 1000, min: 0, max: 60000 },
    { id: 'monitoring/error-notification-webhook', type: 'string', default: '' },
    { id: 'monitoring/uptime-monitoring', type: 'boolean', default: false },
    { id: 'monitoring/cost-tracking', type: 'boolean', default: false },
    // Optimization
    { id: 'optimization/bundle-analyzer-enabled', type: 'boolean', default: false },
    { id: 'optimization/tree-shaking', type: 'boolean', default: true },
    { id: 'optimization/code-splitting-strategy', type: 'string', default: 'route', enum: ['route', 'component', 'vendor', 'manual'] },
    { id: 'optimization/image-optimization', type: 'boolean', default: true },
    { id: 'optimization/cdn-caching-strategy', type: 'string', default: 'balanced', enum: ['aggressive', 'balanced', 'conservative'] },
];
async function getSettingsFilePath() {
    const claudeDir = await ensureClaudeDir();
    return path.join(claudeDir, 'settings.json');
}
async function loadSettings() {
    try {
        const settingsPath = await getSettingsFilePath();
        const content = await readFile(settingsPath);
        return JSON.parse(content);
    }
    catch (error) {
        return { settings: {} };
    }
}
async function saveSettings(config) {
    const settingsPath = await getSettingsFilePath();
    await writeFile(settingsPath, JSON.stringify(config, null, 2));
}
function validateSettingValue(settingId, value) {
    const setting = SETTINGS_REGISTRY.find(s => s.id === settingId);
    if (!setting) {
        return { valid: false, error: `Unknown setting: ${settingId}` };
    }
    let parsedValue = value;
    // Parse value based on type
    if (setting.type === 'number') {
        parsedValue = Number(value);
        if (isNaN(parsedValue)) {
            return { valid: false, error: `Expected number, got: ${value}` };
        }
        if ('min' in setting && parsedValue < setting.min) {
            return { valid: false, error: `Value must be at least ${setting.min}` };
        }
        if ('max' in setting && parsedValue > setting.max) {
            return { valid: false, error: `Value must be at most ${setting.max}` };
        }
    }
    else if (setting.type === 'boolean') {
        if (typeof value === 'string') {
            parsedValue = value.toLowerCase() === 'true';
        }
        else {
            parsedValue = Boolean(value);
        }
    }
    else if (setting.type === 'array') {
        if (typeof value === 'string') {
            parsedValue = value.split(',').map(s => s.trim());
        }
        else if (!Array.isArray(value)) {
            return { valid: false, error: `Expected array or comma-separated string` };
        }
    }
    else if (setting.type === 'string') {
        parsedValue = String(value);
        if ('enum' in setting && setting.enum && !setting.enum.includes(parsedValue)) {
            return { valid: false, error: `Value must be one of: ${setting.enum.join(', ')}` };
        }
    }
    return { valid: true, parsedValue };
}
// Add setting
async function addSetting(settingId, options) {
    const spinner = ora();
    try {
        spinner.start('Loading settings...');
        const config = await loadSettings();
        spinner.stop();
        const setting = SETTINGS_REGISTRY.find(s => s.id === settingId);
        if (!setting) {
            console.error(chalk.red(`Unknown setting: ${settingId}`));
            console.log();
            console.log(chalk.gray('Use'), chalk.cyan('gicm settings list'), chalk.gray('to see all available settings'));
            process.exit(1);
        }
        let value = options.value;
        // If no value provided, use default or prompt
        if (value === undefined) {
            if (!options.yes) {
                const initialValue = setting.type === 'array' || setting.type === 'object'
                    ? JSON.stringify(setting.default)
                    : setting.default;
                const response = await prompts({
                    type: setting.type === 'boolean' ? 'confirm' :
                        'enum' in setting && setting.enum ? 'select' : 'text',
                    name: 'value',
                    message: `Set value for ${settingId}:`,
                    initial: initialValue,
                    choices: 'enum' in setting && setting.enum ? setting.enum.map((v) => ({ title: v, value: v })) : undefined,
                });
                if (response.value === undefined) {
                    console.log(chalk.yellow('Cancelled'));
                    return;
                }
                value = response.value;
            }
            else {
                value = setting.default;
            }
        }
        // Validate value
        const validation = validateSettingValue(settingId, value);
        if (!validation.valid) {
            console.error(chalk.red(`Invalid value: ${validation.error}`));
            process.exit(1);
        }
        // Save setting
        config.settings[settingId] = {
            id: settingId,
            value: validation.parsedValue,
            setAt: new Date().toISOString(),
        };
        spinner.start('Saving settings...');
        await saveSettings(config);
        spinner.succeed(chalk.green(`Setting ${chalk.cyan(settingId)} = ${chalk.yellow(JSON.stringify(validation.parsedValue))}`));
        console.log();
        console.log(chalk.gray(`Settings file: ${await getSettingsFilePath()}`));
    }
    catch (error) {
        spinner.fail('Failed to add setting');
        throw error;
    }
}
// Remove setting
async function removeSetting(settingId, options) {
    const spinner = ora();
    try {
        spinner.start('Loading settings...');
        const config = await loadSettings();
        spinner.stop();
        if (!config.settings[settingId]) {
            console.error(chalk.yellow(`Setting ${settingId} is not set`));
            return;
        }
        if (!options.yes) {
            const response = await prompts({
                type: 'confirm',
                name: 'confirm',
                message: `Remove setting ${chalk.cyan(settingId)}?`,
                initial: true
            });
            if (!response.confirm) {
                console.log(chalk.yellow('Cancelled'));
                return;
            }
        }
        delete config.settings[settingId];
        spinner.start('Saving settings...');
        await saveSettings(config);
        spinner.succeed(chalk.green(`Removed setting ${chalk.cyan(settingId)}`));
    }
    catch (error) {
        spinner.fail('Failed to remove setting');
        throw error;
    }
}
// List settings
async function listSettings(options) {
    const spinner = ora('Loading settings...').start();
    try {
        const config = await loadSettings();
        spinner.stop();
        const categories = options.category ? [options.category] :
            ['performance', 'security', 'development', 'integration', 'monitoring', 'optimization'];
        for (const category of categories) {
            const categorySettings = SETTINGS_REGISTRY.filter(s => s.id.startsWith(`${category}/`));
            if (categorySettings.length === 0)
                continue;
            console.log();
            console.log(chalk.bold.cyan(`${category.toUpperCase()} Settings`));
            console.log(chalk.gray('─'.repeat(50)));
            for (const setting of categorySettings) {
                const isSet = config.settings[setting.id];
                const displayValue = isSet ? isSet.value : setting.default;
                const status = isSet ? chalk.green('✓') : chalk.gray('○');
                if (options.all || isSet) {
                    console.log(`${status} ${chalk.yellow(setting.id.split('/')[1])}`);
                    console.log(`  ${chalk.gray('Value:')} ${chalk.cyan(JSON.stringify(displayValue))}`);
                    if (isSet) {
                        console.log(`  ${chalk.gray('Set at:')} ${new Date(isSet.setAt).toLocaleString()}`);
                    }
                    else {
                        console.log(`  ${chalk.gray('(using default value)')}`);
                    }
                }
            }
        }
        console.log();
        console.log(chalk.gray(`Total: ${Object.keys(config.settings).length} settings configured`));
        console.log();
    }
    catch (error) {
        spinner.fail('Failed to list settings');
        throw error;
    }
}
// Validate settings
async function validateSettings() {
    const spinner = ora('Validating settings...').start();
    try {
        const config = await loadSettings();
        const errors = [];
        const warnings = [];
        for (const [settingId, settingValue] of Object.entries(config.settings)) {
            const validation = validateSettingValue(settingId, settingValue.value);
            if (!validation.valid) {
                errors.push(`${chalk.red('✗')} ${chalk.cyan(settingId)}: ${validation.error}`);
            }
        }
        spinner.stop();
        if (errors.length > 0) {
            console.log();
            console.log(chalk.bold.red('Validation Errors:'));
            errors.forEach(err => console.log(`  ${err}`));
            console.log();
            process.exit(1);
        }
        if (warnings.length > 0) {
            console.log();
            console.log(chalk.bold.yellow('Warnings:'));
            warnings.forEach(warn => console.log(`  ${warn}`));
            console.log();
        }
        console.log(chalk.green('✓ All settings are valid'));
    }
    catch (error) {
        spinner.fail('Validation failed');
        throw error;
    }
}
// Create settings command with subcommands
export function createSettingsCommand() {
    const settings = new Command('settings')
        .description('Manage Claude Code settings');
    settings
        .command('add <setting-id>')
        .description('Add or update a setting')
        .option('--value <value>', 'Setting value')
        .option('-y, --yes', 'Use default value without prompting')
        .action(addSetting);
    settings
        .command('remove <setting-id>')
        .description('Remove a setting')
        .option('-y, --yes', 'Skip confirmation')
        .action(removeSetting);
    settings
        .command('list')
        .description('List all settings')
        .option('-c, --category <category>', 'Filter by category')
        .option('-a, --all', 'Show all settings including unset ones')
        .action(listSettings);
    settings
        .command('validate')
        .description('Validate settings configuration')
        .action(validateSettings);
    return settings;
}
//# sourceMappingURL=settings.js.map