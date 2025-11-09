#!/usr/bin/env node
"use strict";
/**
 * gICM CLI - Official command-line interface for the gICM marketplace
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const add_1 = require("./commands/add");
const program = new commander_1.Command();
program
    .name('gicm')
    .description('Official CLI for gICM marketplace - Install agents, skills, commands, MCPs, and settings')
    .version('1.0.0');
program
    .command('add <items...>')
    .description('Install one or more items from the marketplace')
    .option('--api-url <url>', 'Custom API URL (for testing)', 'https://gicm-marketplace.vercel.app/api')
    .option('-y, --yes', 'Skip confirmation prompt', false)
    .option('-v, --verbose', 'Show verbose output', false)
    .action(async (items, options) => {
    try {
        await (0, add_1.addCommand)(items, {
            apiUrl: options.apiUrl,
            skipConfirm: options.yes,
            verbose: options.verbose,
        });
    }
    catch (error) {
        console.error(chalk_1.default.red(`\n✗ ${error.message}\n`));
        process.exit(1);
    }
});
// Show help if no arguments
if (process.argv.length === 2) {
    program.help();
}
// Parse arguments
program.parse(process.argv);
//# sourceMappingURL=index.js.map