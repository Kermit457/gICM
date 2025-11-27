"use strict";
/**
 * File writing utilities for gICM CLI
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileWriter = void 0;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const chalk_1 = __importDefault(require("chalk"));
class FileWriter {
    constructor(basePath, platform = "claude") {
        this.basePath = basePath || process.cwd();
        this.platform = platform;
    }
    /**
     * Get the root configuration directory name (.claude or .gemini)
     */
    get configDirName() {
        return `.${this.platform}`;
    }
    /**
     * Write files for a marketplace item
     */
    async writeItem(item, files) {
        try {
            for (const file of files) {
                await this.writeFile(file.path, file.content);
            }
        }
        catch (error) {
            this.handleError(error, item);
            throw error;
        }
    }
    /**
     * Write a single file
     */
    async writeFile(relativePath, content) {
        const fullPath = path.join(this.basePath, this.configDirName, relativePath);
        // Ensure directory exists
        await fs.ensureDir(path.dirname(fullPath));
        // Write file
        await fs.writeFile(fullPath, content, 'utf-8');
    }
    /**
     * Check if config directory exists and is writable
     */
    async ensureConfigDir() {
        const configDir = path.join(this.basePath, this.configDirName);
        try {
            // Create directory if it doesn't exist
            await fs.ensureDir(configDir);
            // Test write permissions
            const testFile = path.join(configDir, '.aether-test');
            await fs.writeFile(testFile, 'test', 'utf-8');
            await fs.remove(testFile);
        }
        catch (error) {
            console.error(chalk_1.default.red(`\n✗ Cannot write to ${this.configDirName} directory`));
            console.error(chalk_1.default.yellow('  Please check folder permissions.\n'));
            throw error;
        }
    }
    /**
     * Get installation paths for different item types
     */
    getInstallPath(item) {
        const basePath = path.join(this.basePath, this.configDirName);
        switch (item.kind) {
            case 'agent':
                return path.join(basePath, 'agents', `${item.slug}.md`);
            case 'skill':
                return path.join(basePath, 'skills', item.slug, 'SKILL.md');
            case 'command':
                return path.join(basePath, 'commands', `${item.slug}.md`);
            case 'mcp':
                return path.join(basePath, 'mcp', `${item.slug}.json`);
            case 'setting': {
                // Settings are in category folders
                const category = item.category.toLowerCase().replace(/\s+/g, '-');
                return path.join(basePath, 'settings', category, `${item.slug}.md`);
            }
            default:
                throw new Error(`Unknown item kind: ${item.kind}`);
        }
    }
    /**
     * Check if item is already installed
     */
    async isInstalled(item) {
        const installPath = this.getInstallPath(item);
        return fs.pathExists(installPath);
    }
    /**
     * Get list of installed items by kind
     */
    async getInstalledItems(kind) {
        const basePath = path.join(this.basePath, this.configDirName);
        const installed = [];
        try {
            if (!kind || kind === 'agent') {
                const agentsDir = path.join(basePath, 'agents');
                if (await fs.pathExists(agentsDir)) {
                    const files = await fs.readdir(agentsDir);
                    installed.push(...files.filter(f => f.endsWith('.md')).map(f => `agent/${f.replace('.md', '')}`));
                }
            }
            if (!kind || kind === 'skill') {
                const skillsDir = path.join(basePath, 'skills');
                if (await fs.pathExists(skillsDir)) {
                    const dirs = await fs.readdir(skillsDir);
                    for (const dir of dirs) {
                        const skillFile = path.join(skillsDir, dir, 'SKILL.md');
                        if (await fs.pathExists(skillFile)) {
                            installed.push(`skill/${dir}`);
                        }
                    }
                }
            }
            if (!kind || kind === 'command') {
                const commandsDir = path.join(basePath, 'commands');
                if (await fs.pathExists(commandsDir)) {
                    const files = await fs.readdir(commandsDir);
                    installed.push(...files.filter(f => f.endsWith('.md')).map(f => `command/${f.replace('.md', '')}`));
                }
            }
            if (!kind || kind === 'mcp') {
                const mcpDir = path.join(basePath, 'mcp');
                if (await fs.pathExists(mcpDir)) {
                    const files = await fs.readdir(mcpDir);
                    installed.push(...files.filter(f => f.endsWith('.json')).map(f => `mcp/${f.replace('.json', '')}`));
                }
            }
            if (!kind || kind === 'setting') {
                const settingsDir = path.join(basePath, 'settings');
                if (await fs.pathExists(settingsDir)) {
                    const categories = await fs.readdir(settingsDir);
                    for (const category of categories) {
                        const categoryPath = path.join(settingsDir, category);
                        const stat = await fs.stat(categoryPath);
                        if (stat.isDirectory()) {
                            const files = await fs.readdir(categoryPath);
                            installed.push(...files.filter(f => f.endsWith('.md')).map(f => `setting/${f.replace('.md', '')}`));
                        }
                    }
                }
            }
        }
        catch (error) {
            // Directory doesn't exist yet, return empty array
            return [];
        }
        return installed;
    }
    /**
     * Handle file writing errors
     */
    handleError(error, item) {
        const err = error;
        if (err.code === 'EACCES') {
            console.error(chalk_1.default.red(`\n✗ Permission denied writing ${item.kind}/${item.slug}`));
            console.error(chalk_1.default.yellow('  Please check folder permissions.\n'));
        }
        else if (err.code === 'ENOSPC') {
            console.error(chalk_1.default.red('\n✗ Disk full'));
            console.error(chalk_1.default.yellow('  Please free up space and try again.\n'));
        }
        else {
            console.error(chalk_1.default.red(`\n✗ Failed to write ${item.kind}/${item.slug}`));
            console.error(chalk_1.default.yellow(`  ${err.message}\n`));
        }
    }
}
exports.FileWriter = FileWriter;
//# sourceMappingURL=files.js.map