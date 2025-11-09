import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';
import fsExtra from 'fs-extra';
export async function getClaudeDir() {
    // Try to find .claude directory in current working directory or user home
    const cwd = process.cwd();
    const cwdClaudeDir = join(cwd, '.claude');
    try {
        await fs.access(cwdClaudeDir);
        return cwdClaudeDir;
    }
    catch {
        // Fall back to home directory
        return join(homedir(), '.claude');
    }
}
export async function ensureClaudeDir() {
    const claudeDir = await getClaudeDir();
    // Create subdirectories if they don't exist
    await fsExtra.ensureDir(join(claudeDir, 'agents'));
    await fsExtra.ensureDir(join(claudeDir, 'skills'));
    await fsExtra.ensureDir(join(claudeDir, 'commands'));
    await fsExtra.ensureDir(join(claudeDir, 'mcp'));
    return claudeDir;
}
export async function writeFile(filePath, content) {
    await fsExtra.ensureDir(dirname(filePath));
    await fs.writeFile(filePath, content, 'utf-8');
}
export async function readFile(filePath) {
    return fs.readFile(filePath, 'utf-8');
}
export async function fileExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    }
    catch {
        return false;
    }
}
export async function deleteFile(filePath) {
    await fs.unlink(filePath);
}
export async function getInstalledItems() {
    const claudeDir = await getClaudeDir();
    const configPath = join(claudeDir, 'gicm-config.json');
    try {
        const content = await readFile(configPath);
        const config = JSON.parse(content);
        return config.installed || [];
    }
    catch {
        return [];
    }
}
export async function saveInstalledItems(items) {
    const claudeDir = await ensureClaudeDir();
    const configPath = join(claudeDir, 'gicm-config.json');
    const config = {
        version: '0.1.0',
        installed: items,
        updatedAt: new Date().toISOString()
    };
    await writeFile(configPath, JSON.stringify(config, null, 2));
}
export function getInstallPath(kind, filename, claudeDir) {
    return join(claudeDir, kind + 's', filename);
}
//# sourceMappingURL=files.js.map