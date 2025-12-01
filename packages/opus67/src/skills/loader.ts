/**
 * OPUS 67 - Skill Loader
 * Loads and manages the 100 specialist skills
 */

import { readFileSync, existsSync } from "fs";
import { parse as parseYaml } from "yaml";
import { join } from "path";

// =============================================================================
// TYPES
// =============================================================================

export interface SkillDefinition {
  id: string;
  name: string;
  category: string;
  tokens: number;
  priority: number;
  triggers: {
    extensions?: string[];
    keywords?: string[];
    directories?: string[];
    files?: string[];
  };
  mcp_connections?: string[];
  capabilities: string[];
  knowledge?: string;
}

export interface SkillRegistry {
  version: string;
  total_skills: number;
  skills: SkillDefinition[];
  loading: {
    max_concurrent_skills: number;
    priority_threshold: number;
    token_budget: number;
    always_load?: string[];
    manual_only?: string[];
  };
  bundles: Record<string, string[]>;
}

export interface LoadedSkill {
  id: string;
  name: string;
  knowledge: string;
  capabilities: string[];
  tokens: number;
}

// =============================================================================
// SKILL LOADER
// =============================================================================

export class SkillLoader {
  private registryPath: string;
  private registry: SkillRegistry | null = null;
  private loadedSkills: Map<string, LoadedSkill> = new Map();
  private knowledgePath: string;

  constructor(registryPath: string) {
    this.registryPath = registryPath;
    this.knowledgePath = join(registryPath, "..", "definitions");
  }

  /**
   * Load the skills registry from YAML
   */
  async loadRegistry(): Promise<SkillRegistry> {
    const content = readFileSync(this.registryPath, "utf-8");
    this.registry = parseYaml(content) as SkillRegistry;
    
    // Auto-load always_load skills
    if (this.registry.loading?.always_load) {
      for (const skillId of this.registry.loading.always_load) {
        await this.loadSkill(skillId);
      }
    }

    return this.registry;
  }

  /**
   * Get the raw registry
   */
  getRegistry(): SkillRegistry {
    if (!this.registry) {
      throw new Error("Registry not loaded. Call loadRegistry() first.");
    }
    return this.registry;
  }

  /**
   * Load skills for a detected task
   */
  async loadForTask(skillIds: string[]): Promise<LoadedSkill[]> {
    const loaded: LoadedSkill[] = [];
    let totalTokens = 0;
    const budget = this.registry?.loading?.token_budget || 50000;

    for (const skillId of skillIds) {
      const skill = this.findSkill(skillId);
      if (!skill) continue;

      // Check token budget
      if (totalTokens + skill.tokens > budget) {
        console.warn(`[SkillLoader] Token budget exceeded, skipping ${skillId}`);
        break;
      }

      const loadedSkill = await this.loadSkill(skillId);
      if (loadedSkill) {
        loaded.push(loadedSkill);
        totalTokens += loadedSkill.tokens;
      }
    }

    return loaded;
  }

  /**
   * Load a single skill by ID
   */
  async loadSkill(skillId: string): Promise<LoadedSkill | null> {
    // Already loaded?
    if (this.loadedSkills.has(skillId)) {
      return this.loadedSkills.get(skillId)!;
    }

    const skill = this.findSkill(skillId);
    if (!skill) {
      console.warn(`[SkillLoader] Skill not found: ${skillId}`);
      return null;
    }

    // Check if manual-only
    if (this.registry?.loading?.manual_only?.includes(skillId)) {
      console.warn(`[SkillLoader] Skill ${skillId} is manual-only`);
      return null;
    }

    // Load knowledge (from inline or file)
    let knowledge = skill.knowledge || "";
    
    // Try loading extended knowledge from file
    const knowledgeFile = join(this.knowledgePath, `${skillId}.md`);
    if (existsSync(knowledgeFile)) {
      knowledge = readFileSync(knowledgeFile, "utf-8");
    }

    const loaded: LoadedSkill = {
      id: skill.id,
      name: skill.name,
      knowledge,
      capabilities: skill.capabilities,
      tokens: skill.tokens,
    };

    this.loadedSkills.set(skillId, loaded);
    console.log(`[SkillLoader] Loaded: ${skill.name} (${skill.tokens} tokens)`);

    return loaded;
  }

  /**
   * Load a bundle of skills
   */
  async loadBundle(bundleName: string): Promise<LoadedSkill[]> {
    if (!this.registry?.bundles?.[bundleName]) {
      throw new Error(`Bundle not found: ${bundleName}`);
    }

    const skillIds = this.registry.bundles[bundleName];
    return this.loadForTask(skillIds);
  }

  /**
   * Find skill definition by ID
   */
  private findSkill(skillId: string): SkillDefinition | undefined {
    return this.registry?.skills.find((s) => s.id === skillId);
  }

  /**
   * Detect skills needed based on input
   */
  detectSkills(input: string, filePaths?: string[]): string[] {
    if (!this.registry) return [];

    const detected: Set<string> = new Set();
    const lowerInput = input.toLowerCase();

    for (const skill of this.registry.skills) {
      // Skip low-priority skills by default
      if (skill.priority > (this.registry.loading?.priority_threshold || 3)) {
        continue;
      }

      let matched = false;

      // Check keywords
      for (const keyword of skill.triggers.keywords || []) {
        if (lowerInput.includes(keyword.toLowerCase())) {
          matched = true;
          break;
        }
      }

      // Check file extensions
      if (!matched && filePaths) {
        for (const ext of skill.triggers.extensions || []) {
          if (filePaths.some((p) => p.endsWith(ext))) {
            matched = true;
            break;
          }
        }
      }

      // Check directories
      if (!matched && filePaths) {
        for (const dir of skill.triggers.directories || []) {
          if (filePaths.some((p) => p.includes(dir))) {
            matched = true;
            break;
          }
        }
      }

      if (matched) {
        detected.add(skill.id);
      }
    }

    // Sort by priority and limit
    const sorted = Array.from(detected).sort((a, b) => {
      const skillA = this.findSkill(a);
      const skillB = this.findSkill(b);
      return (skillA?.priority || 99) - (skillB?.priority || 99);
    });

    const maxSkills = this.registry.loading?.max_concurrent_skills || 5;
    return sorted.slice(0, maxSkills);
  }

  /**
   * Get required MCP connections for loaded skills
   */
  getRequiredMCPs(): string[] {
    const mcps: Set<string> = new Set();
    
    for (const [_, skill] of this.loadedSkills) {
      const def = this.findSkill(skill.id);
      if (def?.mcp_connections) {
        def.mcp_connections.forEach((m) => mcps.add(m));
      }
    }

    return Array.from(mcps);
  }

  /**
   * Get list of loaded skills
   */
  getLoaded(): LoadedSkill[] {
    return Array.from(this.loadedSkills.values());
  }

  /**
   * Unload a skill
   */
  unload(skillId: string): boolean {
    return this.loadedSkills.delete(skillId);
  }

  /**
   * Unload all non-essential skills
   */
  cleanup(): void {
    const alwaysLoad = this.registry?.loading?.always_load || [];
    
    for (const [skillId] of this.loadedSkills) {
      if (!alwaysLoad.includes(skillId)) {
        this.loadedSkills.delete(skillId);
      }
    }
  }

  /**
   * Get stats
   */
  getStats(): { total: number; loaded: number; tokens: number } {
    let tokens = 0;
    for (const skill of this.loadedSkills.values()) {
      tokens += skill.tokens;
    }

    return {
      total: this.registry?.skills.length || 0,
      loaded: this.loadedSkills.size,
      tokens,
    };
  }

  /**
   * Format loaded skills for prompt injection
   */
  formatForPrompt(): string {
    if (this.loadedSkills.size === 0) {
      return "";
    }

    const sections: string[] = [];
    
    sections.push("## Active Skills\n");
    
    for (const skill of this.loadedSkills.values()) {
      sections.push(`### ${skill.name}`);
      sections.push(`**Capabilities:** ${skill.capabilities.join(", ")}`);
      if (skill.knowledge) {
        sections.push(`\n${skill.knowledge}`);
      }
      sections.push("---\n");
    }

    return sections.join("\n");
  }
}

export default SkillLoader;
