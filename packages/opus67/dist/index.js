import { generateBootScreen, detectMode, getMode, getConnectionsForSkills, modeSelector, formatConnectionsForPrompt, generateInlineStatus } from './chunk-D5BFFK4G.js';
export { ModeSelector, detectMode, formatConnectionsForPrompt, formatModeDisplay, generateAgentSpawnNotification, generateBootScreen, generateConnectionCode, generateHelpScreen, generateInlineStatus, generateModeSwitchNotification, generateStatusLine, getAllConnections, getAllModes, getConnectionsForKeywords, getConnectionsForSkills, getMode, loadModeRegistry, modeSelector } from './chunk-D5BFFK4G.js';
import { readFileSync } from 'fs';
import { parse } from 'yaml';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { EventEmitter } from 'eventemitter3';

var __dirname$1 = dirname(fileURLToPath(import.meta.url));
function loadRegistry() {
  const registryPath = join(__dirname$1, "..", "skills", "registry.yaml");
  const content = readFileSync(registryPath, "utf-8");
  return parse(content);
}
function extractKeywords(query) {
  return query.toLowerCase().replace(/[^\w\s]/g, " ").split(/\s+/).filter((word) => word.length > 2);
}
function skillMatchesContext(skill, context) {
  const queryKeywords = extractKeywords(context.query);
  const autoLoad = skill.auto_load_when;
  if (autoLoad.keywords) {
    for (const keyword of autoLoad.keywords) {
      const keywordParts = keyword.toLowerCase().split(" ");
      if (keywordParts.every((part) => queryKeywords.includes(part) || context.query.toLowerCase().includes(part))) {
        return { matches: true, reason: `keyword: "${keyword}"` };
      }
    }
  }
  if (autoLoad.file_types && context.activeFiles) {
    for (const file of context.activeFiles) {
      for (const fileType of autoLoad.file_types) {
        if (file.endsWith(fileType)) {
          return { matches: true, reason: `file_type: "${fileType}"` };
        }
      }
    }
  }
  if (autoLoad.directories && context.currentDirectory) {
    for (const dir of autoLoad.directories) {
      if (context.currentDirectory.includes(dir.replace("/", ""))) {
        return { matches: true, reason: `directory: "${dir}"` };
      }
    }
  }
  if (autoLoad.task_patterns) {
    for (const pattern of autoLoad.task_patterns) {
      const regex = new RegExp(pattern.replace(/\.\*/, ".*"), "i");
      if (regex.test(context.query)) {
        return { matches: true, reason: `pattern: "${pattern}"` };
      }
    }
  }
  return { matches: false, reason: "" };
}
function loadSkills(context) {
  const registry = loadRegistry();
  const matchedSkills = [];
  for (const skill of registry.skills) {
    const { matches, reason } = skillMatchesContext(skill, context);
    if (matches) {
      matchedSkills.push({ skill, reason });
    }
  }
  matchedSkills.sort((a, b) => {
    if (a.skill.tier !== b.skill.tier) return a.skill.tier - b.skill.tier;
    return a.skill.token_cost - b.skill.token_cost;
  });
  const selectedSkills = [];
  const reasons = [];
  let totalCost = 0;
  const seenMcps = /* @__PURE__ */ new Set();
  for (const { skill, reason } of matchedSkills) {
    if (selectedSkills.length >= registry.meta.max_skills_per_session) break;
    if (totalCost + skill.token_cost > registry.meta.token_budget) continue;
    selectedSkills.push(skill);
    reasons.push(`${skill.id} (${reason})`);
    totalCost += skill.token_cost;
    for (const mcp of skill.mcp_connections) {
      seenMcps.add(mcp);
    }
  }
  return {
    skills: selectedSkills,
    totalTokenCost: totalCost,
    mcpConnections: Array.from(seenMcps),
    reason: reasons
  };
}
function loadCombination(combinationId) {
  const registry = loadRegistry();
  const combination = registry.combinations[combinationId];
  if (!combination) {
    return {
      skills: [],
      totalTokenCost: 0,
      mcpConnections: [],
      reason: [`Combination "${combinationId}" not found`]
    };
  }
  const skills = registry.skills.filter((s) => combination.skills.includes(s.id));
  const mcps = /* @__PURE__ */ new Set();
  for (const skill of skills) {
    for (const mcp of skill.mcp_connections) {
      mcps.add(mcp);
    }
  }
  return {
    skills,
    totalTokenCost: combination.token_cost,
    mcpConnections: Array.from(mcps),
    reason: [`combination: ${combinationId}`]
  };
}
function formatSkillsForPrompt(result) {
  if (result.skills.length === 0) {
    return "<!-- No specific skills loaded -->";
  }
  let output = `<!-- OPUS 67: ${result.skills.length} skills loaded (${result.totalTokenCost} tokens) -->
`;
  output += "<loaded_skills>\n";
  for (const skill of result.skills) {
    output += `
## ${skill.name}
`;
    output += `Capabilities:
`;
    for (const cap of skill.capabilities) {
      output += `- ${cap}
`;
    }
  }
  output += "\n</loaded_skills>\n";
  output += `<!-- MCPs available: ${result.mcpConnections.join(", ")} -->`;
  return output;
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const testContext = {
    query: process.argv[2] || "build anchor program for bonding curve",
    activeFiles: [".rs", ".tsx"],
    currentDirectory: "programs/curve"
  };
  console.log("Testing skill loader with context:", testContext);
  console.log("---");
  const result = loadSkills(testContext);
  console.log("Loaded skills:", result.skills.map((s) => s.id));
  console.log("Token cost:", result.totalTokenCost);
  console.log("MCP connections:", result.mcpConnections);
  console.log("Reasons:", result.reason);
  console.log("---");
  console.log(formatSkillsForPrompt(result));
}
var AutonomyLogger = class extends EventEmitter {
  logs = [];
  config;
  currentInteraction = null;
  constructor(config = {}) {
    super();
    this.config = {
      maxLogs: config.maxLogs ?? 1e3,
      persistPath: config.persistPath,
      enableAnalytics: config.enableAnalytics ?? true
    };
  }
  /**
   * Start tracking an interaction
   */
  startInteraction(task, taskType) {
    const id = `int_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    this.currentInteraction = {
      id,
      timestamp: /* @__PURE__ */ new Date(),
      task,
      taskType,
      skillsLoaded: [],
      skillsUsed: [],
      mcpsConnected: [],
      mcpsUsed: [],
      success: false,
      executionTimeMs: 0,
      tokenCost: 0
    };
    this.emit("interaction:start", { id, task, taskType });
    return id;
  }
  /**
   * Record skills loaded for current interaction
   */
  recordSkillsLoaded(skills) {
    if (this.currentInteraction) {
      this.currentInteraction.skillsLoaded = skills;
    }
  }
  /**
   * Record a skill being used
   */
  recordSkillUsed(skill) {
    if (this.currentInteraction && !this.currentInteraction.skillsUsed?.includes(skill)) {
      this.currentInteraction.skillsUsed?.push(skill);
    }
  }
  /**
   * Record MCPs connected
   */
  recordMcpsConnected(mcps) {
    if (this.currentInteraction) {
      this.currentInteraction.mcpsConnected = mcps;
    }
  }
  /**
   * Record an MCP being used
   */
  recordMcpUsed(mcp) {
    if (this.currentInteraction && !this.currentInteraction.mcpsUsed?.includes(mcp)) {
      this.currentInteraction.mcpsUsed?.push(mcp);
    }
  }
  /**
   * Complete the interaction
   */
  completeInteraction(options) {
    if (!this.currentInteraction) return null;
    const startTime = this.currentInteraction.timestamp?.getTime() ?? Date.now();
    const log = {
      ...this.currentInteraction,
      success: options.success,
      executionTimeMs: Date.now() - startTime,
      tokenCost: options.tokenCost ?? 0,
      errorMessage: options.errorMessage,
      metadata: options.metadata
    };
    this.logs.push(log);
    this.currentInteraction = null;
    if (this.logs.length > this.config.maxLogs) {
      this.logs = this.logs.slice(-this.config.maxLogs);
    }
    this.emit("interaction:complete", log);
    return log;
  }
  /**
   * Record user feedback for a past interaction
   */
  recordFeedback(interactionId, feedback) {
    const log = this.logs.find((l) => l.id === interactionId);
    if (log) {
      log.userFeedback = feedback;
      this.emit("feedback:recorded", { id: interactionId, feedback });
    }
  }
  /**
   * Get all logs
   */
  getLogs(filter) {
    let result = [...this.logs];
    if (filter?.taskType) {
      result = result.filter((l) => l.taskType === filter.taskType);
    }
    if (filter?.success !== void 0) {
      result = result.filter((l) => l.success === filter.success);
    }
    return result;
  }
  /**
   * Analyze patterns from logs
   */
  analyzePatterns() {
    const skillUsage = /* @__PURE__ */ new Map();
    const mcpUsage = /* @__PURE__ */ new Map();
    const taskFailures = /* @__PURE__ */ new Map();
    for (const log of this.logs) {
      for (const skill of log.skillsUsed) {
        const current = skillUsage.get(skill) || { count: 0, successes: 0, totalTime: 0 };
        current.count++;
        if (log.success) current.successes++;
        current.totalTime += log.executionTimeMs;
        skillUsage.set(skill, current);
      }
      for (const mcp of log.mcpsUsed) {
        const current = mcpUsage.get(mcp) || { count: 0, errors: 0 };
        current.count++;
        if (!log.success) current.errors++;
        mcpUsage.set(mcp, current);
      }
      if (!log.success) {
        const taskKey = log.taskType;
        const current = taskFailures.get(taskKey) || { count: 0, errors: [] };
        current.count++;
        if (log.errorMessage) current.errors.push(log.errorMessage);
        taskFailures.set(taskKey, current);
      }
    }
    const skillUsagePatterns = Array.from(skillUsage.entries()).map(([skill, data]) => ({
      skill,
      usageCount: data.count,
      successRate: data.count > 0 ? data.successes / data.count : 0,
      avgExecutionTime: data.count > 0 ? data.totalTime / data.count : 0
    })).sort((a, b) => b.usageCount - a.usageCount);
    const mcpUsagePatterns = Array.from(mcpUsage.entries()).map(([mcp, data]) => ({
      mcp,
      usageCount: data.count,
      errorRate: data.count > 0 ? data.errors / data.count : 0
    })).sort((a, b) => b.usageCount - a.usageCount);
    const failurePatterns = Array.from(taskFailures.entries()).map(([taskPattern, data]) => ({
      taskPattern,
      failureCount: data.count,
      commonErrors: [...new Set(data.errors)].slice(0, 5),
      suggestedSkills: []
      // Would be populated by skill suggester
    }));
    const suggestions = [];
    for (const pattern of skillUsagePatterns) {
      if (pattern.usageCount > 3 && pattern.successRate < 0.5) {
        suggestions.push(`Skill "${pattern.skill}" has low success rate (${(pattern.successRate * 100).toFixed(0)}%). Consider reviewing or improving.`);
      }
    }
    const loadedNotUsed = /* @__PURE__ */ new Map();
    for (const log of this.logs) {
      for (const skill of log.skillsLoaded) {
        if (!log.skillsUsed.includes(skill)) {
          loadedNotUsed.set(skill, (loadedNotUsed.get(skill) || 0) + 1);
        }
      }
    }
    for (const [skill, count] of loadedNotUsed) {
      if (count > 5) {
        suggestions.push(`Skill "${skill}" loaded ${count} times but rarely used. Consider adjusting auto-load triggers.`);
      }
    }
    return {
      skillUsagePatterns,
      mcpUsagePatterns,
      failurePatterns,
      suggestions
    };
  }
  /**
   * Get summary stats
   */
  getSummary() {
    const total = this.logs.length;
    const successes = this.logs.filter((l) => l.success).length;
    const totalTokens = this.logs.reduce((sum, l) => sum + l.tokenCost, 0);
    const avgTime = total > 0 ? this.logs.reduce((sum, l) => sum + l.executionTimeMs, 0) / total : 0;
    return {
      totalInteractions: total,
      successRate: total > 0 ? successes / total : 0,
      totalTokensUsed: totalTokens,
      avgExecutionTimeMs: avgTime,
      positiveFeedback: this.logs.filter((l) => l.userFeedback === "positive").length,
      negativeFeedback: this.logs.filter((l) => l.userFeedback === "negative").length
    };
  }
};
var autonomyLogger = new AutonomyLogger();

// src/index.ts
var Opus67 = class {
  config;
  currentMode;
  constructor(config = {}) {
    this.config = {
      tokenBudget: config.tokenBudget ?? 5e4,
      maxSkills: config.maxSkills ?? 5,
      autoConnectMcps: config.autoConnectMcps ?? true,
      defaultMode: config.defaultMode ?? "auto",
      showBootScreen: config.showBootScreen ?? true
    };
    this.currentMode = this.config.defaultMode;
  }
  /**
   * Boot OPUS 67 and return boot screen
   */
  boot() {
    return generateBootScreen({ defaultMode: this.currentMode });
  }
  /**
   * Process a query with automatic mode detection
   */
  process(query, context) {
    const detection = detectMode({
      query,
      ...context,
      userPreference: this.currentMode !== "auto" ? this.currentMode : void 0
    });
    const modeConfig = getMode(detection.mode);
    const skills = loadSkills({
      query,
      activeFiles: context?.activeFiles
    });
    modeConfig.skills_priority || [];
    let mcpConnections = [];
    if (this.config.autoConnectMcps) {
      const skillIds = skills.skills.map((s) => s.id);
      mcpConnections = getConnectionsForSkills(skillIds);
    }
    const prompt = this.generatePrompt(detection, skills, mcpConnections);
    return {
      mode: detection.mode,
      modeConfig,
      skills,
      mcpConnections,
      prompt,
      bootScreen: this.config.showBootScreen ? this.boot() : void 0
    };
  }
  /**
   * Set mode manually
   */
  setMode(mode) {
    this.currentMode = mode;
    modeSelector.setMode(mode);
  }
  /**
   * Get current mode
   */
  getMode() {
    return this.currentMode;
  }
  /**
   * Generate context prompt
   */
  generatePrompt(detection, skills, mcps) {
    const modeConfig = getMode(detection.mode);
    return `
<!-- OPUS 67 SESSION -->
Mode: ${modeConfig.icon} ${detection.mode.toUpperCase()} (${(detection.confidence * 100).toFixed(0)}% confidence)
Complexity: ${detection.complexity_score}/10
Token Budget: ${modeConfig.token_budget}
Thinking: ${modeConfig.thinking_depth}
Sub-agents: ${modeConfig.sub_agents.enabled ? `Up to ${modeConfig.sub_agents.max_agents}` : "Disabled"}

Skills Loaded: ${skills.skills.map((s) => s.id).join(", ")}
MCPs Available: ${mcps.map((m) => m.id).join(", ")}

Detected by: ${detection.reasons.join("; ")}
<!-- /OPUS 67 SESSION -->

${formatSkillsForPrompt(skills)}

${formatConnectionsForPrompt(mcps)}
`.trim();
  }
  /**
   * Get mode status line
   */
  getStatusLine() {
    return generateInlineStatus(this.currentMode);
  }
};
var opus67 = new Opus67();
if (process.argv[1]?.endsWith("index.ts") || process.argv[1]?.endsWith("index.js")) {
  console.log(opus67.boot());
  console.log("\n--- Processing test query ---\n");
  const session = opus67.process("design the entire system architecture");
  console.log(`Mode: ${session.mode}`);
  console.log(`Confidence: ${session.modeConfig.description}`);
  console.log(`Skills: ${session.skills.skills.map((s) => s.id).join(", ")}`);
}

export { AutonomyLogger, Opus67, autonomyLogger, formatSkillsForPrompt, loadCombination, loadSkills, opus67 };
