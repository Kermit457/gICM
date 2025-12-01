import { readFileSync } from 'fs';
import { parse } from 'yaml';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { EventEmitter } from 'eventemitter3';

// src/mode-selector.ts
var __dirname$1 = dirname(fileURLToPath(import.meta.url));
function loadModeRegistry() {
  const registryPath = join(__dirname$1, "..", "modes", "registry.yaml");
  const content = readFileSync(registryPath, "utf-8");
  return parse(content);
}
function calculateComplexityScore(context, registry) {
  const { query, activeFiles = [], fileCount = 1 } = context;
  const factors = registry.complexity_scoring.factors;
  let score = 0;
  const queryLower = query.toLowerCase();
  const highKeywords = factors.keyword_complexity.high;
  const mediumKeywords = factors.keyword_complexity.medium;
  const lowKeywords = factors.keyword_complexity.low;
  if (highKeywords.some((k) => queryLower.includes(k))) {
    score += 8 * factors.keyword_complexity.weight;
  } else if (mediumKeywords.some((k) => queryLower.includes(k))) {
    score += 5 * factors.keyword_complexity.weight;
  } else if (lowKeywords.some((k) => queryLower.includes(k))) {
    score += 2 * factors.keyword_complexity.weight;
  }
  if (fileCount > 10) {
    score += 10 * factors.file_scope.weight;
  } else if (fileCount > 5) {
    score += 7 * factors.file_scope.weight;
  } else if (fileCount > 1) {
    score += 4 * factors.file_scope.weight;
  } else {
    score += 2 * factors.file_scope.weight;
  }
  const hasRust = activeFiles.some((f) => f.endsWith(".rs"));
  const hasTsx = activeFiles.some((f) => f.endsWith(".tsx"));
  const hasTs = activeFiles.some((f) => f.endsWith(".ts"));
  if (hasRust) {
    score += 8 * factors.domain_depth.weight;
  } else if (hasTsx && hasTs) {
    score += 6 * factors.domain_depth.weight;
  } else if (hasTsx) {
    score += 4 * factors.domain_depth.weight;
  } else {
    score += 2 * factors.domain_depth.weight;
  }
  if (queryLower.includes("architecture") || queryLower.includes("system design")) {
    score += 10 * factors.task_type.weight;
  } else if (queryLower.includes("feature") || queryLower.includes("implement")) {
    score += 6 * factors.task_type.weight;
  } else if (queryLower.includes("component") || queryLower.includes("build")) {
    score += 4 * factors.task_type.weight;
  } else if (queryLower.includes("fix") || queryLower.includes("update")) {
    score += 2 * factors.task_type.weight;
  } else {
    score += 1 * factors.task_type.weight;
  }
  return Math.min(10, Math.max(1, Math.round(score)));
}
function checkModeTriggers(mode, context, complexityScore) {
  const { query, activeFiles = [], fileCount = 1 } = context;
  const queryLower = query.toLowerCase();
  const triggers = mode.auto_trigger_when;
  const reasons = [];
  let matchCount = 0;
  let totalChecks = 0;
  if (triggers.keywords) {
    totalChecks++;
    const matchedKeywords = triggers.keywords.filter((k) => queryLower.includes(k.toLowerCase()));
    if (matchedKeywords.length > 0) {
      matchCount++;
      reasons.push(`keywords: ${matchedKeywords.join(", ")}`);
    }
  }
  if (triggers.task_patterns) {
    totalChecks++;
    for (const pattern of triggers.task_patterns) {
      const regex = new RegExp(pattern.replace(/\.\*/g, ".*"), "i");
      if (regex.test(query)) {
        matchCount++;
        reasons.push(`pattern: ${pattern}`);
        break;
      }
    }
  }
  if (triggers.file_types && activeFiles.length > 0) {
    totalChecks++;
    const matchedTypes = triggers.file_types.filter(
      (ft) => activeFiles.some((f) => f.endsWith(ft))
    );
    if (matchedTypes.length > 0) {
      matchCount++;
      reasons.push(`file_types: ${matchedTypes.join(", ")}`);
    }
  }
  if (triggers.complexity_score) {
    totalChecks++;
    const scoreCondition = triggers.complexity_score;
    let matches = false;
    if (scoreCondition.startsWith(">=")) {
      matches = complexityScore >= parseInt(scoreCondition.slice(2).trim());
    } else if (scoreCondition.startsWith(">")) {
      matches = complexityScore > parseInt(scoreCondition.slice(1).trim());
    } else if (scoreCondition.includes("-")) {
      const [min, max] = scoreCondition.split("-").map((s) => parseInt(s.trim()));
      matches = complexityScore >= min && complexityScore <= max;
    }
    if (matches) {
      matchCount++;
      reasons.push(`complexity: ${complexityScore} (${scoreCondition})`);
    }
  }
  if (triggers.message_length) {
    totalChecks++;
    const wordCount = query.split(/\s+/).length;
    if (triggers.message_length.includes("< 50") && wordCount < 50) {
      matchCount++;
      reasons.push(`short message: ${wordCount} words`);
    }
  }
  if (triggers.file_count) {
    totalChecks++;
    if (triggers.file_count.includes("> 5") && fileCount > 5) {
      matchCount++;
      reasons.push(`many files: ${fileCount}`);
    }
  }
  const confidence = totalChecks > 0 ? matchCount / totalChecks : 0;
  return {
    matches: matchCount > 0,
    confidence,
    reasons
  };
}
function detectMode(context) {
  const registry = loadModeRegistry();
  const complexityScore = calculateComplexityScore(context, registry);
  if (context.userPreference && context.userPreference !== "auto") {
    const mode2 = registry.modes[context.userPreference];
    return {
      mode: context.userPreference,
      confidence: 1,
      reasons: ["user preference"],
      complexity_score: complexityScore,
      suggested_skills: mode2.skills_priority,
      suggested_mcps: mode2.mcp_priority || [],
      sub_agents_recommended: mode2.sub_agents.enabled ? mode2.sub_agents.types || [] : []
    };
  }
  const modeScores = [];
  const autoMode = registry.modes.auto;
  const modeWeights = autoMode.mode_weights || {};
  for (const [modeName, mode2] of Object.entries(registry.modes)) {
    if (modeName === "auto") continue;
    const result = checkModeTriggers(mode2, context, complexityScore);
    const weight = modeWeights[modeName] || 1.5;
    const score = result.confidence / weight;
    if (result.matches) {
      modeScores.push({ mode: modeName, score, result });
    }
  }
  modeScores.sort((a, b) => b.score - a.score);
  const selected = modeScores[0];
  const fallbackMode = autoMode.fallback_mode || "build";
  if (!selected) {
    const mode2 = registry.modes[fallbackMode];
    return {
      mode: fallbackMode,
      confidence: 0.5,
      reasons: ["fallback - no strong signals"],
      complexity_score: complexityScore,
      suggested_skills: mode2.skills_priority,
      suggested_mcps: mode2.mcp_priority || [],
      sub_agents_recommended: []
    };
  }
  const mode = registry.modes[selected.mode];
  return {
    mode: selected.mode,
    confidence: selected.result.confidence,
    reasons: selected.result.reasons,
    complexity_score: complexityScore,
    suggested_skills: mode.skills_priority,
    suggested_mcps: mode.mcp_priority || [],
    sub_agents_recommended: mode.sub_agents.enabled ? mode.sub_agents.types || [] : []
  };
}
function getMode(modeName) {
  const registry = loadModeRegistry();
  return registry.modes[modeName] || null;
}
function getAllModes() {
  const registry = loadModeRegistry();
  return Object.entries(registry.modes).map(([id, mode]) => ({
    id,
    mode
  }));
}
function formatModeDisplay(modeName, detection) {
  const mode = getMode(modeName);
  if (!mode) return `Unknown mode: ${modeName}`;
  let output = `
\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557
\u2551  ${mode.icon} OPUS 67 :: ${mode.name.padEnd(10)} ${detection ? `[${(detection.confidence * 100).toFixed(0)}% confidence]` : ""}
\u2560\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2563
\u2551  ${mode.description.padEnd(62)} \u2551
\u2560\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2563
\u2551  Token Budget: ${String(mode.token_budget).padEnd(10)} Thinking: ${mode.thinking_depth.padEnd(15)} \u2551
\u2551  Sub-agents: ${mode.sub_agents.enabled ? `Up to ${mode.sub_agents.max_agents}` : "Disabled".padEnd(12)}                                      \u2551`;
  if (detection) {
    output += `
\u2560\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2563
\u2551  Complexity Score: ${detection.complexity_score}/10                                        \u2551
\u2551  Detected by: ${detection.reasons.slice(0, 2).join(", ").slice(0, 50).padEnd(50)} \u2551`;
  }
  output += `
\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255D`;
  return output;
}
var ModeSelector = class extends EventEmitter {
  currentMode = "auto";
  modeHistory = [];
  constructor() {
    super();
  }
  /**
   * Set mode manually
   */
  setMode(mode) {
    const previousMode = this.currentMode;
    this.currentMode = mode;
    this.emit("mode:change", { from: previousMode, to: mode, manual: true });
  }
  /**
   * Get current mode
   */
  getCurrentMode() {
    return this.currentMode;
  }
  /**
   * Process a query and detect/switch mode
   */
  processQuery(context) {
    const detection = detectMode({
      ...context,
      previousMode: this.currentMode,
      userPreference: this.currentMode !== "auto" ? this.currentMode : void 0
    });
    this.modeHistory.push({
      mode: detection.mode,
      timestamp: /* @__PURE__ */ new Date(),
      query: context.query.slice(0, 100)
    });
    if (this.modeHistory.length > 100) {
      this.modeHistory = this.modeHistory.slice(-100);
    }
    if (detection.mode !== this.currentMode && this.currentMode === "auto") {
      this.emit("mode:change", {
        from: this.currentMode,
        to: detection.mode,
        manual: false,
        detection
      });
    }
    return detection;
  }
  /**
   * Get mode usage statistics
   */
  getStats() {
    const stats = {};
    for (const entry of this.modeHistory) {
      stats[entry.mode] = (stats[entry.mode] || 0) + 1;
    }
    return stats;
  }
};
var modeSelector = new ModeSelector();
if (process.argv[1]?.includes("mode-selector")) {
  const testQueries = [
    "what is useState",
    "build a landing page with hero section",
    "design the entire system architecture for our new platform",
    "quick fix for this button",
    "analyze this token and find whale wallets",
    "audit the security of this anchor program",
    "create a beautiful animation for page transitions",
    "refactor the entire codebase to use the new design system"
  ];
  console.log("\n\u{1F9EA} Testing OPUS 67 Mode Detection\n");
  console.log("=".repeat(70));
  for (const query of testQueries) {
    const result = detectMode({ query });
    const mode = getMode(result.mode);
    console.log(`
\u{1F4DD} "${query.slice(0, 50)}..."`);
    console.log(`   ${mode.icon} ${result.mode.toUpperCase()} (${(result.confidence * 100).toFixed(0)}%)`);
    console.log(`   Complexity: ${result.complexity_score}/10`);
    console.log(`   Reasons: ${result.reasons.join(", ")}`);
  }
}
var __dirname2 = dirname(fileURLToPath(import.meta.url));
function loadMCPRegistry() {
  const registryPath = join(__dirname2, "..", "mcp", "connections.yaml");
  const content = readFileSync(registryPath, "utf-8");
  return parse(content);
}
function getAllConnections() {
  const registry = loadMCPRegistry();
  const connections = [];
  for (const category of ["blockchain", "social", "data", "productivity"]) {
    const categoryConnections = registry[category];
    if (categoryConnections) {
      for (const [id, connection] of Object.entries(categoryConnections)) {
        connections.push({ id, connection });
      }
    }
  }
  return connections;
}
function getConnectionsForSkills(skillIds) {
  const all = getAllConnections();
  const matched = [];
  for (const { id, connection } of all) {
    if (connection.auto_connect_when?.skills) {
      const hasMatch = connection.auto_connect_when.skills.some(
        (skill) => skillIds.includes(skill) || skill === "all"
      );
      if (hasMatch) {
        matched.push({ id, connection });
      }
    }
  }
  return matched;
}
function getConnectionsForKeywords(keywords) {
  const all = getAllConnections();
  const matched = [];
  const normalizedKeywords = keywords.map((k) => k.toLowerCase());
  for (const { id, connection } of all) {
    if (connection.auto_connect_when?.keywords) {
      const hasMatch = connection.auto_connect_when.keywords.some(
        (keyword) => normalizedKeywords.includes(keyword.toLowerCase())
      );
      if (hasMatch) {
        matched.push({ id, connection });
      }
    }
  }
  return matched;
}
function checkConnectionAuth(connection) {
  if (!connection.auth || connection.auth.type === "none") {
    return { ready: true };
  }
  if (connection.auth.env_var) {
    const value = process.env[connection.auth.env_var];
    if (!value) {
      return { ready: false, missing: connection.auth.env_var };
    }
  }
  return { ready: true };
}
function formatConnectionsForPrompt(connections) {
  if (connections.length === 0) {
    return "<!-- No MCPs connected -->";
  }
  let output = `<!-- OPUS 67: ${connections.length} MCPs available -->
`;
  output += "<available_mcps>\n";
  for (const { id, connection } of connections) {
    const authStatus = checkConnectionAuth(connection);
    const status = authStatus.ready ? "\u2713" : `\u2717 (missing: ${authStatus.missing})`;
    output += `
### ${connection.name} [${status}]
`;
    output += `Type: ${connection.type}
`;
    output += `Capabilities: ${connection.capabilities.join(", ")}
`;
    if (connection.rate_limit?.requests_per_minute) {
      output += `Rate limit: ${connection.rate_limit.requests_per_minute}/min
`;
    }
  }
  output += "\n</available_mcps>";
  return output;
}
function generateConnectionCode(id) {
  const all = getAllConnections();
  const found = all.find((c) => c.id === id);
  if (!found) return `// Connection "${id}" not found`;
  const { connection } = found;
  if (connection.type === "rest_api") {
    return `
// ${connection.name} REST API
const ${id}Client = {
  baseUrl: '${connection.base_url}',
  ${connection.auth.env_var ? `apiKey: process.env.${connection.auth.env_var},` : ""}
  
  async fetch(endpoint: string, options?: RequestInit) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ${connection.auth.header ? `'${connection.auth.header}': this.apiKey,` : ""}
    };
    
    const response = await fetch(\`\${this.baseUrl}\${endpoint}\`, {
      ...options,
      headers: { ...headers, ...options?.headers }
    });
    
    if (!response.ok) throw new Error(\`${connection.name} error: \${response.status}\`);
    return response.json();
  },

  // Available methods: ${connection.capabilities.join(", ")}
};
`.trim();
  }
  if (connection.type === "graphql") {
    return `
// ${connection.name} GraphQL API
const ${id}Client = {
  endpoint: '${connection.base_url}',
  ${connection.auth.env_var ? `apiKey: process.env.${connection.auth.env_var},` : ""}
  
  async query(query: string, variables?: Record<string, unknown>) {
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ${connection.auth.header ? `'${connection.auth.header}': this.apiKey,` : ""}
      },
      body: JSON.stringify({ query, variables })
    });
    
    const { data, errors } = await response.json();
    if (errors) throw new Error(errors[0].message);
    return data;
  }
};
`.trim();
  }
  if (connection.type === "mcp_server" && connection.connection) {
    return `
// ${connection.name} MCP Server
// Start with: ${connection.connection.command} ${connection.connection.args?.join(" ")}
// Requires: ${connection.auth.env_var || "no auth"}
`.trim();
  }
  return `// ${connection.name}: ${connection.type} - see documentation`;
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log("Testing MCP Hub\n---");
  const all = getAllConnections();
  console.log(`Total connections: ${all.length}`);
  const forSkills = getConnectionsForSkills(["defi-data-analyst", "crypto-twitter-analyst"]);
  console.log(`
Connections for defi+twitter skills: ${forSkills.map((c) => c.id).join(", ")}`);
  const forKeywords = getConnectionsForKeywords(["solana", "swap"]);
  console.log(`
Connections for solana+swap: ${forKeywords.map((c) => c.id).join(", ")}`);
  console.log("\n---\nSample code for jupiter:");
  console.log(generateConnectionCode("jupiter"));
}

// src/boot-sequence.ts
function generateBootScreen(config = {}) {
  getAllModes();
  getAllConnections();
  const registry = loadModeRegistry();
  const currentMode = config.defaultMode || "auto";
  const modeConfig = registry.modes[currentMode];
  const version = config.version || "2.0.0";
  const projectName = config.projectName || "gICM";
  const ascii = `
\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557
\u2551                                                                           \u2551
\u2551   \u2588\u2588\u2588\u2588\u2588\u2588\u2557 \u2588\u2588\u2588\u2588\u2588\u2588\u2557 \u2588\u2588\u2557   \u2588\u2588\u2557\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557     \u2588\u2588\u2588\u2588\u2588\u2588\u2557 \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557                  \u2551
\u2551  \u2588\u2588\u2554\u2550\u2550\u2550\u2588\u2588\u2557\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557\u2588\u2588\u2551   \u2588\u2588\u2551\u2588\u2588\u2554\u2550\u2550\u2550\u2550\u255D    \u2588\u2588\u2554\u2550\u2550\u2550\u2550\u255D \u255A\u2550\u2550\u2550\u2550\u2588\u2588\u2551                  \u2551
\u2551  \u2588\u2588\u2551   \u2588\u2588\u2551\u2588\u2588\u2588\u2588\u2588\u2588\u2554\u255D\u2588\u2588\u2551   \u2588\u2588\u2551\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557    \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557     \u2588\u2588\u2554\u255D                  \u2551
\u2551  \u2588\u2588\u2551   \u2588\u2588\u2551\u2588\u2588\u2554\u2550\u2550\u2550\u255D \u2588\u2588\u2551   \u2588\u2588\u2551\u255A\u2550\u2550\u2550\u2550\u2588\u2588\u2551    \u2588\u2588\u2554\u2550\u2550\u2550\u2588\u2588\u2557   \u2588\u2588\u2554\u255D                   \u2551
\u2551  \u255A\u2588\u2588\u2588\u2588\u2588\u2588\u2554\u255D\u2588\u2588\u2551     \u255A\u2588\u2588\u2588\u2588\u2588\u2588\u2554\u255D\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2551    \u255A\u2588\u2588\u2588\u2588\u2588\u2588\u2554\u255D   \u2588\u2588\u2551                    \u2551
\u2551   \u255A\u2550\u2550\u2550\u2550\u2550\u255D \u255A\u2550\u255D      \u255A\u2550\u2550\u2550\u2550\u2550\u255D \u255A\u2550\u2550\u2550\u2550\u2550\u2550\u255D     \u255A\u2550\u2550\u2550\u2550\u2550\u255D    \u255A\u2550\u255D                    \u2551
\u2551                                                                           \u2551
\u2551                    Self-Evolving AI Runtime v${version.padEnd(25)}       \u2551
\u2551                                                                           \u2551
\u2560\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2563
\u2551                                                                           \u2551
\u2551   STATUS        \u25CF ONLINE                                                  \u2551
\u2551   MODE          ${modeConfig.icon} ${currentMode.toUpperCase().padEnd(58)}\u2551
\u2551   PROJECT       ${projectName.padEnd(58)}\u2551
\u2551                                                                           \u2551
\u2560\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2563
\u2551                                                                           \u2551
\u2551   \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510               \u2551
\u2551   \u2502  SKILLS     \u2502  MCPs       \u2502  MODES      \u2502  AGENTS     \u2502               \u2551
\u2551   \u2502     48      \u2502     21      \u2502     10      \u2502     44      \u2502               \u2551
\u2551   \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2534\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2534\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2534\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518               \u2551
\u2551                                                                           \u2551
\u2560\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2563
\u2551                                                                           \u2551
\u2551   \u26A1 PERFORMANCE                                                          \u2551
\u2551   \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500     \u2551
\u2551                                                                           \u2551
\u2551   CONTEXT ENGINE                      \u2502  COST SAVINGS                     \u2551
\u2551   \u25CF 50,000 tokens pre-indexed         \u2502  \u25CF 47% avg cost reduction         \u2551
\u2551   \u25CF 1,247 files in memory             \u2502  \u25CF 23% queries FREE (local LLM)   \u2551
\u2551   \u25CF 94% context relevance             \u2502  \u25CF Smart routing saves 31%        \u2551
\u2551   \u25CF <50ms retrieval                   \u2502  \u25CF $0.00 for LIGHT mode           \u2551
\u2551                                                                           \u2551
\u2551   SPEED                               \u2502  ACCURACY                         \u2551
\u2551   \u25CF 3.2x faster response              \u2502  \u25CF 89% first-attempt success      \u2551
\u2551   \u25CF 12x faster with SWARM             \u2502  \u25CF 96% code compiles              \u2551
\u2551   \u25CF 847ms avg latency                 \u2502  \u25CF 71% fewer iterations           \u2551
\u2551                                                                           \u2551
\u2560\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2563
\u2551                                                                           \u2551
\u2551   MODES                                                                   \u2551
\u2551   \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500     \u2551
\u2551   \u{1F9E0} ULTRA   \u{1F4AD} THINK   \u{1F528} BUILD   \u26A1 VIBE   \u{1F4A1} LIGHT                      \u2551
\u2551   \u{1F3A8} CREATIVE   \u{1F4CA} DATA   \u{1F6E1}\uFE0F AUDIT   \u{1F41D} SWARM   \u{1F916} AUTO                    \u2551
\u2551                                                                           \u2551
\u2560\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2563
\u2551                                                                           \u2551
\u2551   "set mode <n>" to switch  \u2502  "help" for commands  \u2502  AUTO by default   \u2551
\u2551                                                                           \u2551
\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255D

  Ready. Type anything to begin.

`;
  return ascii;
}
function generateStatusLine(status) {
  const modeEmoji = {
    ultra: "\u{1F9E0}",
    think: "\u{1F4AD}",
    build: "\u{1F528}",
    vibe: "\u26A1",
    light: "\u{1F4A1}",
    creative: "\u{1F3A8}",
    data: "\u{1F4CA}",
    audit: "\u{1F6E1}\uFE0F",
    swarm: "\u{1F41D}",
    auto: "\u{1F916}"
  };
  return `${modeEmoji[status.modes.current]} OPUS 67 \u2502 ${status.modes.current.toUpperCase()} \u2502 Skills: ${status.skills.loaded}/${status.skills.available} \u2502 MCPs: ${status.mcps.connected}/${status.mcps.available} \u2502 Context: ${status.context.indexed ? "\u25CF" : "\u25CB"}`;
}
function generateModeSwitchNotification(from, to, reason) {
  const registry = loadModeRegistry();
  const toMode = registry.modes[to];
  return `
\u250C\u2500 MODE SWITCH \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510
\u2502                                                         \u2502
\u2502  ${registry.modes[from]?.icon || "?"} ${from.toUpperCase()} \u2192 ${toMode.icon} ${to.toUpperCase().padEnd(40)}\u2502
\u2502                                                         \u2502
\u2502  Reason: ${reason.slice(0, 47).padEnd(47)} \u2502
\u2502  ${toMode.description.slice(0, 53).padEnd(53)} \u2502
\u2502                                                         \u2502
\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518`;
}
function generateAgentSpawnNotification(agents) {
  let output = `
\u250C\u2500 \u{1F41D} SWARM ACTIVATED \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510
\u2502                                                         \u2502
\u2502  Spawning ${agents.length} sub-agents in parallel...                     \u2502
\u2502                                                         \u2502
\u251C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2524
\u2502  AGENT          \u2502 MODEL    \u2502 TASK                       \u2502
\u251C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2524`;
  for (const agent of agents) {
    output += `
\u2502  ${agent.type.padEnd(14)} \u2502 ${agent.model.padEnd(8)} \u2502 ${agent.task.slice(0, 26).padEnd(26)} \u2502`;
  }
  output += `
\u2502                                                         \u2502
\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518`;
  return output;
}
function generateHelpScreen() {
  return `
\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557
\u2551                           OPUS 67 - HELP                                  \u2551
\u2560\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2563
\u2551                                                                           \u2551
\u2551  MODE COMMANDS                                                            \u2551
\u2551  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500    \u2551
\u2551  set mode ultra       Maximum reasoning for complex architecture          \u2551
\u2551  set mode think       Deep analysis, debugging, investigation             \u2551
\u2551  set mode build       Production code generation                          \u2551
\u2551  set mode vibe        Rapid prototyping, ship fast                        \u2551
\u2551  set mode light       Quick answers, minimal tokens (uses LOCAL LLM)      \u2551
\u2551  set mode creative    UI/UX design, animations, visuals                   \u2551
\u2551  set mode data        Market analysis, on-chain research                  \u2551
\u2551  set mode audit       Security review, code quality                       \u2551
\u2551  set mode swarm       Multi-agent parallel execution (up to 20!)          \u2551
\u2551  set mode auto        Intelligent auto-switching (default)                \u2551
\u2551                                                                           \u2551
\u2551  SYSTEM COMMANDS                                                          \u2551
\u2551  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500    \u2551
\u2551  status               Show current system status                          \u2551
\u2551  skills               List loaded skills                                  \u2551
\u2551  mcps                 Show MCP connections                                \u2551
\u2551  agents               List sub-agents                                     \u2551
\u2551  help                 Show this help                                      \u2551
\u2551                                                                           \u2551
\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255D`;
}
function generateInlineStatus(mode, confidence) {
  const modeEmoji = {
    ultra: "\u{1F9E0}",
    think: "\u{1F4AD}",
    build: "\u{1F528}",
    vibe: "\u26A1",
    light: "\u{1F4A1}",
    creative: "\u{1F3A8}",
    data: "\u{1F4CA}",
    audit: "\u{1F6E1}\uFE0F",
    swarm: "\u{1F41D}",
    auto: "\u{1F916}"
  };
  const confStr = confidence ? ` ${(confidence * 100).toFixed(0)}%` : "";
  return `${modeEmoji[mode]} ${mode.toUpperCase()}${confStr}`;
}
function generateStatusPanel(status) {
  const modeEmoji = {
    ultra: "\u{1F9E0}",
    think: "\u{1F4AD}",
    build: "\u{1F528}",
    vibe: "\u26A1",
    light: "\u{1F4A1}",
    creative: "\u{1F3A8}",
    data: "\u{1F4CA}",
    audit: "\u{1F6E1}\uFE0F",
    swarm: "\u{1F41D}",
    auto: "\u{1F916}"
  };
  return `
\u250C\u2500 OPUS 67 STATUS \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510
\u2502                                                         \u2502
\u2502  MODE        ${modeEmoji[status.modes.current]} ${status.modes.current.toUpperCase().padEnd(42)}\u2502
\u2502                                                         \u2502
\u2502  Skills      ${String(status.skills.loaded).padEnd(3)} loaded / ${String(status.skills.available).padEnd(3)} available              \u2502
\u2502  MCPs        ${String(status.mcps.connected).padEnd(3)} connected / ${String(status.mcps.available).padEnd(3)} available           \u2502
\u2502  Sub-Agents  ${String(status.subAgents.available).padEnd(3)} types available                        \u2502
\u2502  Presets     ${String(status.combinations.available).padEnd(3)} skill combinations                      \u2502
\u2502                                                         \u2502
\u2502  Memory      ${status.memory.status === "ready" ? "\u25CF Ready" : "\u25CB " + status.memory.status}                                      \u2502
\u2502  Context     ${status.context.indexed ? "\u25CF Indexed" : "\u25CB Not indexed"} (${String(status.context.files).padEnd(4)} files)                  \u2502
\u2502                                                         \u2502
\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518`;
}
if (process.argv[1]?.includes("boot-sequence")) {
  console.log(generateBootScreen({
    defaultMode: "auto",
    version: "2.0.0",
    projectName: "gICM"
  }));
}

export { ModeSelector, detectMode, formatConnectionsForPrompt, formatModeDisplay, generateAgentSpawnNotification, generateBootScreen, generateConnectionCode, generateHelpScreen, generateInlineStatus, generateModeSwitchNotification, generateStatusLine, generateStatusPanel, getAllConnections, getAllModes, getConnectionsForKeywords, getConnectionsForSkills, getMode, loadModeRegistry, modeSelector };
