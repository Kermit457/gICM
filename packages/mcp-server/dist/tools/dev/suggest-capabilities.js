/**
 * Capability Router - Suggests and auto-installs tools based on task context
 */
import axios from "axios";
import * as fs from "fs";
import * as path from "path";
const MARKETPLACE_API = process.env.GICM_API_URL || "https://gicm-marketplace.vercel.app/api";
/**
 * Analyze task and suggest relevant capabilities
 */
export async function suggestCapabilities(task, autoInstall = false, maxSuggestions = 5) {
    // Get project context
    const projectContext = getProjectContext();
    // Search marketplace for relevant tools
    const suggestions = await searchRelevantTools(task, projectContext, maxSuggestions);
    // Check which are already installed
    const installedCapabilities = getInstalledCapabilities();
    for (const suggestion of suggestions) {
        suggestion.isInstalled = installedCapabilities.includes(suggestion.id);
    }
    // Auto-install if requested
    const autoInstallable = suggestions
        .filter(s => !s.isInstalled && s.relevance >= 80)
        .map(s => s.id);
    if (autoInstall && autoInstallable.length > 0) {
        await installCapabilities(autoInstallable);
    }
    return {
        task,
        projectType: projectContext.type,
        suggestions,
        autoInstallable,
        message: generateMessage(suggestions, autoInstall),
    };
}
/**
 * Get current project context from .gicm/config.json
 */
function getProjectContext() {
    const configPath = path.join(process.cwd(), ".gicm", "config.json");
    if (fs.existsSync(configPath)) {
        try {
            const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
            return {
                type: config.project?.type || "unknown",
                language: config.project?.language || "typescript",
                frameworks: config.project?.frameworks || [],
            };
        }
        catch {
            // Ignore parse errors
        }
    }
    return { type: "unknown", language: "typescript", frameworks: [] };
}
/**
 * Get list of installed capability IDs
 */
function getInstalledCapabilities() {
    const configPath = path.join(process.cwd(), ".gicm", "config.json");
    if (fs.existsSync(configPath)) {
        try {
            const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
            return config.capabilities?.installed || [];
        }
        catch {
            // Ignore parse errors
        }
    }
    return [];
}
/**
 * Search marketplace for tools relevant to the task
 */
async function searchRelevantTools(task, context, limit) {
    try {
        // Try marketplace API
        const response = await axios.post(`${MARKETPLACE_API}/tools/search`, {
            query: task,
            limit,
            context: {
                projectType: context.type,
                language: context.language,
                frameworks: context.frameworks,
            },
        }, { timeout: 5000 });
        if (response.data?.tools) {
            return response.data.tools.map((tool) => ({
                id: tool.slug || tool.id,
                name: tool.name,
                kind: tool.kind,
                description: tool.description,
                relevance: tool.relevance || tool.score || 50,
                reason: tool.reason || `Matches "${task}"`,
                installCommand: `gicm add ${tool.slug || tool.id}`,
                isInstalled: false,
            }));
        }
    }
    catch {
        // Fallback to local suggestions
    }
    // Fallback: Generate local suggestions based on keywords
    return generateLocalSuggestions(task, context, limit);
}
/**
 * Generate suggestions locally based on task keywords
 */
function generateLocalSuggestions(task, context, limit) {
    const suggestions = [];
    const taskLower = task.toLowerCase();
    // Keyword-based suggestions
    const capabilityMap = {
        // Trading/DeFi
        "swap": { id: "wallet-agent", name: "Wallet Agent", kind: "agent", description: "Execute token swaps and wallet operations" },
        "trade": { id: "defi-agent", name: "DeFi Agent", kind: "agent", description: "DeFi protocol interactions and yield farming" },
        "token": { id: "hunter-agent", name: "Hunter Agent", kind: "agent", description: "Find and analyze token opportunities" },
        "audit": { id: "audit-agent", name: "Audit Agent", kind: "agent", description: "Smart contract security auditing" },
        "bridge": { id: "bridge-agent", name: "Bridge Agent", kind: "agent", description: "Cross-chain bridging operations" },
        // Development
        "test": { id: "testing-skill", name: "Testing Skill", kind: "skill", description: "Generate and run tests" },
        "refactor": { id: "refactor-agent", name: "Refactor Agent", kind: "agent", description: "Code refactoring and optimization" },
        "deploy": { id: "deployer-agent", name: "Deployer Agent", kind: "agent", description: "Deployment automation" },
        "build": { id: "builder-agent", name: "Builder Agent", kind: "agent", description: "Code generation and scaffolding" },
        // Social/Content
        "twitter": { id: "social-agent", name: "Social Agent", kind: "agent", description: "Social media automation" },
        "content": { id: "growth-engine", name: "Growth Engine", kind: "agent", description: "Content generation and marketing" },
        // Analysis
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
    // Add context-specific suggestions
    if (context.type === "nextjs" || context.frameworks.some(f => f.toLowerCase().includes("next"))) {
        if (!suggestions.find(s => s.id === "vercel-deploy-skill")) {
            suggestions.push({
                id: "vercel-deploy-skill",
                name: "Vercel Deploy Skill",
                kind: "skill",
                description: "Deploy Next.js apps to Vercel",
                relevance: 70,
                reason: "Project uses Next.js",
                installCommand: "gicm add vercel-deploy-skill",
                isInstalled: false,
            });
        }
    }
    // Sort by relevance and limit
    return suggestions
        .sort((a, b) => b.relevance - a.relevance)
        .slice(0, limit);
}
/**
 * Install capabilities via CLI
 */
async function installCapabilities(ids) {
    // Add to config (actual install would be done by CLI)
    const configPath = path.join(process.cwd(), ".gicm", "config.json");
    if (fs.existsSync(configPath)) {
        try {
            const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
            config.capabilities = config.capabilities || { installed: [], favorites: [] };
            for (const id of ids) {
                if (!config.capabilities.installed.includes(id)) {
                    config.capabilities.installed.push(id);
                }
            }
            fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        }
        catch {
            // Ignore errors
        }
    }
}
/**
 * Generate user-friendly message
 */
function generateMessage(suggestions, autoInstalled) {
    if (suggestions.length === 0) {
        return "No relevant capabilities found for this task.";
    }
    const installed = suggestions.filter(s => s.isInstalled);
    const notInstalled = suggestions.filter(s => !s.isInstalled);
    let message = "";
    if (installed.length > 0) {
        message += `✓ You have ${installed.length} relevant capability(ies) installed: ${installed.map(s => s.name).join(", ")}. `;
    }
    if (notInstalled.length > 0) {
        if (autoInstalled) {
            message += `⚡ Auto-installed ${notInstalled.length} capability(ies): ${notInstalled.map(s => s.name).join(", ")}.`;
        }
        else {
            message += `💡 ${notInstalled.length} additional capability(ies) available: ${notInstalled.map(s => s.name).join(", ")}. `;
            message += `Install with: gicm add ${notInstalled[0].id}`;
        }
    }
    return message.trim();
}
// Tool definition for MCP
export const suggestCapabilitiesTool = {
    "dev.suggest_capabilities": {
        description: "Analyze current task and suggest relevant gICM capabilities (agents, skills, commands) to install",
        parameters: {
            task: {
                type: "string",
                description: "Description of what you're trying to accomplish",
            },
            auto_install: {
                type: "boolean",
                description: "Auto-install high-relevance capabilities (>=80%)",
                default: false,
                optional: true,
            },
            max_suggestions: {
                type: "number",
                description: "Maximum suggestions to return",
                default: 5,
                optional: true,
            },
        },
    },
};
//# sourceMappingURL=suggest-capabilities.js.map