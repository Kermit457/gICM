/**
 * Component Builder
 *
 * Automatically builds React components from opportunities.
 */

import * as fs from "fs/promises";
import * as path from "path";
import type { ComponentSpec, BuildTask, Opportunity } from "../../core/types.js";
import { generateJSON, generateText } from "../../utils/llm.js";
import { Logger } from "../../utils/logger.js";
import { getComponentTemplate, type ComponentTemplate, COMPONENT_TEMPLATES } from "./templates.js";

export interface ComponentBuilderConfig {
  outputDir: string;
  autoInstall: boolean;
}

const DEFAULT_CONFIG: ComponentBuilderConfig = {
  outputDir: "packages/ui/src/components",
  autoInstall: true,
};

export class ComponentBuilder {
  private logger: Logger;
  private config: ComponentBuilderConfig;

  constructor(config: Partial<ComponentBuilderConfig> = {}) {
    this.logger = new Logger("ComponentBuilder");
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Design component from opportunity
   */
  async designComponent(opportunity: Opportunity): Promise<ComponentSpec> {
    this.logger.info(`Designing component for: ${opportunity.title}`);

    const spec = await generateJSON<{
      name: string;
      description: string;
      props: Array<{
        name: string;
        type: string;
        required: boolean;
        description: string;
      }>;
      features: string[];
      dependencies: string[];
      templateType: string;
    }>({
      prompt: `Design a React component based on this opportunity:

Title: ${opportunity.title}
Description: ${opportunity.description}
Type: ${opportunity.type}
Source: ${opportunity.source}

The component will be part of gICM's UI library with:
- React 18+ with TypeScript
- Tailwind CSS for styling
- shadcn/ui patterns
- Solana/Web3 support

Design the component with:
1. A clear PascalCase name (e.g., "TokenBalance", "WalletButton")
2. Description of what it does
3. Props with types
4. Key features
5. Dependencies (npm packages)
6. Template type: "basic" | "interactive" | "web3_wallet" | "data_display"

Return JSON:
{
  "name": "ComponentName",
  "description": "What it does",
  "props": [
    { "name": "propName", "type": "string", "required": true, "description": "what it does" }
  ],
  "features": ["feature1", "feature2"],
  "dependencies": ["package1"],
  "templateType": "basic"
}`,
    });

    return {
      name: spec.name,
      description: spec.description,
      props: spec.props,
      features: spec.features,
      dependencies: spec.dependencies,
      testCases: [
        {
          name: "renders_correctly",
          description: "Component renders without errors",
        },
        {
          name: "props_work",
          description: "Props are applied correctly",
        },
      ],
    };
  }

  /**
   * Build component from spec
   */
  async buildComponent(spec: ComponentSpec): Promise<BuildTask> {
    const taskId = `build-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const componentDir = path.join(this.config.outputDir, this.toKebabCase(spec.name));

    this.logger.info(`Building component: ${spec.name} at ${componentDir}`);

    const task: BuildTask = {
      id: taskId,
      opportunityId: "",
      type: "component",
      spec: {
        name: spec.name,
        description: spec.description,
        capabilities: spec.features,
        tools: [],
        dependencies: spec.dependencies,
        testCases: spec.testCases.map((tc) => ({
          name: tc.name,
          input: "",
          expectedBehavior: tc.description,
        })),
      },
      status: "in_progress",
      progress: 0,
      startedAt: Date.now(),
      logs: [],
    };

    try {
      // Create directory
      await fs.mkdir(componentDir, { recursive: true });
      task.logs.push(`Created directory: ${componentDir}`);
      task.progress = 10;

      // Determine template
      const templateName = this.selectTemplate(spec);
      const template = getComponentTemplate(templateName) || COMPONENT_TEMPLATES.basic;
      task.logs.push(`Using template: ${templateName}`);
      task.progress = 20;

      // Generate files from template
      for (const file of template.files) {
        const fileName = this.applyTemplate(file.path, spec);
        const content = this.applyTemplate(file.content, spec);
        const filePath = path.join(componentDir, fileName);
        await fs.writeFile(filePath, content);
        task.logs.push(`Created: ${fileName}`);
      }
      task.progress = 60;

      // Generate custom implementation if needed
      if (spec.features.length > 2) {
        const customCode = await this.generateCustomCode(spec);
        const mainFile = path.join(componentDir, `${spec.name}.tsx`);
        await fs.writeFile(mainFile, customCode);
        task.logs.push("Generated custom implementation");
      }
      task.progress = 90;

      task.status = "completed";
      task.progress = 100;
      task.completedAt = Date.now();
      task.outputPath = componentDir;
      task.logs.push("Build completed successfully!");

      this.logger.info(`Component ${spec.name} built successfully`);
    } catch (error) {
      task.status = "failed";
      task.error = String(error);
      task.logs.push(`Build failed: ${error}`);
      this.logger.error(`Build failed: ${error}`);
    }

    return task;
  }

  /**
   * Generate custom component code
   */
  private async generateCustomCode(spec: ComponentSpec): Promise<string> {
    const code = await generateText({
      prompt: `Generate a React component with TypeScript:

Component: ${spec.name}
Description: ${spec.description}

Props:
${spec.props.map((p) => `- ${p.name}: ${p.type} (${p.required ? "required" : "optional"}) - ${p.description}`).join("\n")}

Features:
${spec.features.map((f) => `- ${f}`).join("\n")}

Requirements:
- Use React 18+ patterns (hooks, functional components)
- Use TypeScript with proper types
- Use Tailwind CSS for styling
- Follow shadcn/ui patterns
- Include proper accessibility (aria labels, keyboard navigation)
- Export component and props type

Return only the TypeScript/TSX code, no explanations.`,
    });

    return code;
  }

  /**
   * Select appropriate template
   */
  private selectTemplate(spec: ComponentSpec): string {
    const nameLower = spec.name.toLowerCase();
    const descLower = spec.description.toLowerCase();

    if (nameLower.includes("wallet") || descLower.includes("wallet") || descLower.includes("solana")) {
      return "web3_wallet";
    }
    if (descLower.includes("display") || descLower.includes("list") || descLower.includes("data")) {
      return "data_display";
    }
    if (descLower.includes("input") || descLower.includes("form") || descLower.includes("interactive")) {
      return "interactive";
    }
    return "basic";
  }

  /**
   * Apply template variables
   */
  private applyTemplate(content: string, spec: ComponentSpec): string {
    return content
      .replace(/\{\{NAME\}\}/g, spec.name)
      .replace(/\{\{CSS_CLASS\}\}/g, this.toKebabCase(spec.name));
  }

  /**
   * Convert to kebab-case
   */
  private toKebabCase(name: string): string {
    return name
      .replace(/([a-z])([A-Z])/g, "$1-$2")
      .replace(/[\s_]+/g, "-")
      .toLowerCase();
  }

  /**
   * Full build pipeline from opportunity
   */
  async buildFromOpportunity(opportunity: Opportunity): Promise<BuildTask> {
    const spec = await this.designComponent(opportunity);
    const task = await this.buildComponent(spec);
    task.opportunityId = opportunity.id;
    return task;
  }
}
