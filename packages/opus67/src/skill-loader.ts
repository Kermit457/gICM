/**
 * OPUS 67 Skill Loader
 * Automatically loads relevant skills based on context
 */

import { readFileSync } from 'fs';
import { parse } from 'yaml';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Types
export interface Skill {
  id: string;
  name: string;
  tier: 1 | 2 | 3;
  token_cost: number;
  capabilities: string[];
  auto_load_when: {
    keywords?: string[];
    file_types?: string[];
    directories?: string[];
    task_patterns?: string[];
  };
  mcp_connections: string[];
}

export interface SkillRegistry {
  meta: {
    version: string;
    total_skills: number;
    max_skills_per_session: number;
    token_budget: number;
  };
  skills: Skill[];
  combinations: Record<string, {
    skills: string[];
    token_cost: number;
  }>;
}

export interface LoadContext {
  query: string;
  activeFiles?: string[];
  currentDirectory?: string;
  taskType?: 'code' | 'architecture' | 'data' | 'content' | 'ops';
}

export interface LoadResult {
  skills: Skill[];
  totalTokenCost: number;
  mcpConnections: string[];
  reason: string[];
}

/**
 * Load and parse the skills registry
 */
export function loadRegistry(): SkillRegistry {
  const registryPath = join(__dirname, '..', 'skills', 'registry.yaml');
  const content = readFileSync(registryPath, 'utf-8');
  return parse(content) as SkillRegistry;
}

/**
 * Extract keywords from a query
 */
function extractKeywords(query: string): string[] {
  return query
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2);
}

/**
 * Check if a skill matches the current context
 */
function skillMatchesContext(skill: Skill, context: LoadContext): { matches: boolean; reason: string } {
  const queryKeywords = extractKeywords(context.query);
  const autoLoad = skill.auto_load_when;

  // Check keyword matches
  if (autoLoad.keywords) {
    for (const keyword of autoLoad.keywords) {
      const keywordParts = keyword.toLowerCase().split(' ');
      if (keywordParts.every(part => queryKeywords.includes(part) || context.query.toLowerCase().includes(part))) {
        return { matches: true, reason: `keyword: "${keyword}"` };
      }
    }
  }

  // Check file type matches
  if (autoLoad.file_types && context.activeFiles) {
    for (const file of context.activeFiles) {
      for (const fileType of autoLoad.file_types) {
        if (file.endsWith(fileType)) {
          return { matches: true, reason: `file_type: "${fileType}"` };
        }
      }
    }
  }

  // Check directory matches
  if (autoLoad.directories && context.currentDirectory) {
    for (const dir of autoLoad.directories) {
      if (context.currentDirectory.includes(dir.replace('/', ''))) {
        return { matches: true, reason: `directory: "${dir}"` };
      }
    }
  }

  // Check task pattern matches
  if (autoLoad.task_patterns) {
    for (const pattern of autoLoad.task_patterns) {
      const regex = new RegExp(pattern.replace(/\.\*/, '.*'), 'i');
      if (regex.test(context.query)) {
        return { matches: true, reason: `pattern: "${pattern}"` };
      }
    }
  }

  return { matches: false, reason: '' };
}

/**
 * Load skills based on context
 */
export function loadSkills(context: LoadContext): LoadResult {
  const registry = loadRegistry();
  const matchedSkills: Array<{ skill: Skill; reason: string }> = [];
  
  // Find all matching skills
  for (const skill of registry.skills) {
    const { matches, reason } = skillMatchesContext(skill, context);
    if (matches) {
      matchedSkills.push({ skill, reason });
    }
  }

  // Sort by tier (lower = higher priority) and token cost
  matchedSkills.sort((a, b) => {
    if (a.skill.tier !== b.skill.tier) return a.skill.tier - b.skill.tier;
    return a.skill.token_cost - b.skill.token_cost;
  });

  // Apply token budget and max skills limit
  const selectedSkills: Skill[] = [];
  const reasons: string[] = [];
  let totalCost = 0;
  const seenMcps = new Set<string>();

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

/**
 * Load a specific skill combination
 */
export function loadCombination(combinationId: string): LoadResult {
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

  const skills = registry.skills.filter(s => combination.skills.includes(s.id));
  const mcps = new Set<string>();
  
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

/**
 * Format loaded skills for prompt injection
 */
export function formatSkillsForPrompt(result: LoadResult): string {
  if (result.skills.length === 0) {
    return '<!-- No specific skills loaded -->';
  }

  let output = `<!-- OPUS 67: ${result.skills.length} skills loaded (${result.totalTokenCost} tokens) -->\n`;
  output += '<loaded_skills>\n';
  
  for (const skill of result.skills) {
    output += `\n## ${skill.name}\n`;
    output += `Capabilities:\n`;
    for (const cap of skill.capabilities) {
      output += `- ${cap}\n`;
    }
  }
  
  output += '\n</loaded_skills>\n';
  output += `<!-- MCPs available: ${result.mcpConnections.join(', ')} -->`;
  
  return output;
}

// CLI test
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const testContext: LoadContext = {
    query: process.argv[2] || 'build anchor program for bonding curve',
    activeFiles: ['.rs', '.tsx'],
    currentDirectory: 'programs/curve'
  };

  console.log('Testing skill loader with context:', testContext);
  console.log('---');
  
  const result = loadSkills(testContext);
  console.log('Loaded skills:', result.skills.map(s => s.id));
  console.log('Token cost:', result.totalTokenCost);
  console.log('MCP connections:', result.mcpConnections);
  console.log('Reasons:', result.reason);
  console.log('---');
  console.log(formatSkillsForPrompt(result));
}
