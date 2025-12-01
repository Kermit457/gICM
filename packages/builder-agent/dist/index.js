// src/index.ts
import { BaseAgent, createLLMClient } from "@gicm/agent-core";
import { z } from "zod";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
var BuildRequestSchema = z.object({
  discoveryId: z.string(),
  type: z.enum(["agent", "skill", "mcp", "integration"]),
  name: z.string(),
  description: z.string(),
  sourceUrl: z.string().url(),
  features: z.array(z.string()).optional(),
  dependencies: z.array(z.string()).optional()
});
var BuildResultSchema = z.object({
  buildId: z.string(),
  request: BuildRequestSchema,
  status: z.enum(["pending", "building", "testing", "completed", "failed"]),
  outputPath: z.string().optional(),
  artifacts: z.array(z.string()).default([]),
  generatedCode: z.record(z.string()).optional(),
  error: z.string().optional()
});
var TEMPLATES = {
  agent: {
    index: (name, className) => `import { BaseAgent, type AgentConfig, type AgentContext, type AgentResult } from "@gicm/agent-core";
import { z } from "zod";

export interface ${className}Config extends AgentConfig {
  // Add custom config options here
}

export class ${className} extends BaseAgent {
  constructor(config: ${className}Config) {
    super("${name}", config);
    this.initializeTools();
  }

  private initializeTools(): void {
    // Register tools here
  }

  getSystemPrompt(): string {
    return \`You are a ${name} agent. Your role is to...\`;
  }

  async analyze(context: AgentContext): Promise<AgentResult> {
    const query = context.userQuery ?? "";

    // Implement analysis logic
    return this.createResult(
      true,
      { query },
      undefined,
      0.8,
      "Analysis completed"
    );
  }
}

export default ${className};
`,
    packageJson: (name, description) => JSON.stringify({
      name: `@gicm/${name}`,
      version: "1.0.0",
      description,
      type: "module",
      main: "dist/index.js",
      types: "dist/index.d.ts",
      exports: {
        ".": {
          types: "./dist/index.d.ts",
          import: "./dist/index.js"
        }
      },
      scripts: {
        build: "tsup src/index.ts --format esm --dts",
        dev: "tsup src/index.ts --format esm --dts --watch",
        test: "vitest"
      },
      dependencies: {
        "@gicm/agent-core": "^1.0.0",
        "zod": "^3.23.0"
      },
      devDependencies: {
        "@types/node": "^20.0.0",
        "tsup": "^8.0.0",
        "typescript": "^5.4.0",
        "vitest": "^1.0.0"
      },
      keywords: ["gicm", "agent", name],
      author: "gICM Builder Agent",
      license: "MIT"
    }, null, 2),
    tsconfig: () => JSON.stringify({
      compilerOptions: {
        target: "ES2022",
        module: "ESNext",
        moduleResolution: "bundler",
        lib: ["ES2022"],
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        declaration: true,
        outDir: "./dist",
        rootDir: "./src"
      },
      include: ["src/**/*"],
      exclude: ["node_modules", "dist"]
    }, null, 2)
  },
  skill: {
    index: (name, description) => `import { z } from "zod";

export const ${toPascalCase(name)}InputSchema = z.object({
  // Define input parameters
});
export type ${toPascalCase(name)}Input = z.infer<typeof ${toPascalCase(name)}InputSchema>;

export const ${toPascalCase(name)}OutputSchema = z.object({
  success: z.boolean(),
  data: z.unknown().optional(),
  error: z.string().optional(),
});
export type ${toPascalCase(name)}Output = z.infer<typeof ${toPascalCase(name)}OutputSchema>;

/**
 * ${description}
 */
export async function ${toCamelCase(name)}(
  input: ${toPascalCase(name)}Input
): Promise<${toPascalCase(name)}Output> {
  try {
    // Implement skill logic here
    return {
      success: true,
      data: { input },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export default ${toCamelCase(name)};
`
  },
  mcp: {
    index: (name, description) => `#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const server = new Server(
  {
    name: "${name}-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define tools
const tools = [
  {
    name: "${name}_action",
    description: "${description}",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The query or action to perform",
        },
      },
      required: ["query"],
    },
  },
];

// Handle tool listing
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools,
}));

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name: toolName, arguments: args } = request.params;

  switch (toolName) {
    case "${name}_action":
      // Implement tool logic
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ success: true, query: args?.query }),
          },
        ],
      };
    default:
      throw new Error(\`Unknown tool: \${toolName}\`);
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("${name} MCP server running on stdio");
}

main().catch(console.error);
`
  }
};
function toPascalCase(str) {
  return str.split(/[-_]/).map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join("");
}
function toCamelCase(str) {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}
var BuilderAgent = class extends BaseAgent {
  outputDir;
  llmClient;
  constructor(config) {
    super("builder", config);
    this.outputDir = config.outputDir ?? "./generated";
    if (config.apiKey) {
      this.llmClient = createLLMClient({
        provider: config.llmProvider ?? "anthropic",
        model: config.llmModel ?? "claude-sonnet-4-20250514",
        apiKey: config.apiKey,
        temperature: 0.3,
        // Lower temp for more consistent code
        maxTokens: 8192
      });
    }
  }
  logProgress(percent, message) {
    this.log(`[${percent}%] ${message}`);
  }
  getSystemPrompt() {
    return `You are a code generation agent for gICM.
Your role is to create high-quality TypeScript integrations from specifications:
- Agent wrappers that extend BaseAgent
- Skills for the marketplace
- MCP server integrations
- Direct library integrations

Generate clean, TypeScript-first code following gICM patterns:
- Use Zod for all schemas
- Follow BaseAgent pattern for agents
- Use EventEmitter3 for events
- Include proper error handling
- Add JSDoc comments

Always output valid, compilable TypeScript code.`;
  }
  async analyze(context) {
    const action = context.action ?? "build";
    switch (action) {
      case "build":
        return this.handleBuild(context.params?.request);
      case "generate":
        return this.handleGenerate(context.params);
      case "status":
        return this.createResult(true, { outputDir: this.outputDir });
      default:
        return this.createResult(false, null, `Unknown action: ${action}`);
    }
  }
  /**
   * Build a full package from a discovery request
   */
  async build(request) {
    this.log(`Building ${request.type}: ${request.name}`);
    this.logProgress(0, `Starting build for ${request.name}`);
    const buildId = `build-${Date.now()}`;
    const outputPath = join(this.outputDir, request.name);
    try {
      const generatedCode = await this.generateCode(request);
      this.logProgress(50, "Code generated, writing files...");
      const artifacts = await this.writeFiles(outputPath, generatedCode);
      this.logProgress(100, "Build completed");
      return {
        buildId,
        request,
        status: "completed",
        outputPath,
        artifacts,
        generatedCode
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Build failed";
      return {
        buildId,
        request,
        status: "failed",
        error: msg,
        artifacts: []
      };
    }
  }
  /**
   * Generate code using templates or LLM
   */
  async generateCode(request) {
    const { type, name, description, features } = request;
    const className = toPascalCase(name);
    const code = {};
    if (this.llmClient && features && features.length > 0) {
      const enhanced = await this.enhanceWithLLM(request);
      if (enhanced) {
        return enhanced;
      }
    }
    switch (type) {
      case "agent":
        code["src/index.ts"] = TEMPLATES.agent.index(name, className);
        code["package.json"] = TEMPLATES.agent.packageJson(name, description);
        code["tsconfig.json"] = TEMPLATES.agent.tsconfig();
        break;
      case "skill":
        code["src/index.ts"] = TEMPLATES.skill.index(name, description);
        code["package.json"] = TEMPLATES.agent.packageJson(name, description);
        code["tsconfig.json"] = TEMPLATES.agent.tsconfig();
        break;
      case "mcp":
        code["src/index.ts"] = TEMPLATES.mcp.index(name, description);
        code["package.json"] = JSON.stringify({
          name: `@gicm/${name}-mcp`,
          version: "1.0.0",
          description,
          type: "module",
          bin: { [name]: "./dist/index.js" },
          main: "dist/index.js",
          scripts: {
            build: "tsup src/index.ts --format esm",
            start: "node dist/index.js"
          },
          dependencies: {
            "@modelcontextprotocol/sdk": "^1.0.0"
          },
          devDependencies: {
            "@types/node": "^20.0.0",
            "tsup": "^8.0.0",
            "typescript": "^5.4.0"
          }
        }, null, 2);
        code["tsconfig.json"] = TEMPLATES.agent.tsconfig();
        break;
      case "integration":
        code["src/index.ts"] = `// ${name} Integration
// ${description}

export function init() {
  console.log("${name} initialized");
}
`;
        code["package.json"] = TEMPLATES.agent.packageJson(name, description);
        break;
    }
    return code;
  }
  /**
   * Use LLM to generate enhanced code based on features
   */
  async enhanceWithLLM(request) {
    if (!this.llmClient) return null;
    const prompt = `Generate a complete TypeScript ${request.type} package for gICM with these specifications:

Name: ${request.name}
Description: ${request.description}
Features: ${request.features?.join(", ")}
Source Reference: ${request.sourceUrl}

Requirements:
1. For agents: Extend BaseAgent from @gicm/agent-core
2. Use Zod for all input/output schemas
3. Include proper TypeScript types
4. Add error handling
5. Include JSDoc comments

Output format: Return a JSON object where keys are file paths and values are file contents.
Example: { "src/index.ts": "...", "package.json": "...", "tsconfig.json": "..." }

Generate production-ready code:`;
    try {
      const response = await this.llmClient.chat([
        { role: "system", content: this.getSystemPrompt() },
        { role: "user", content: prompt }
      ]);
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      this.log(`LLM enhancement failed: ${error}`, "warn");
    }
    return null;
  }
  /**
   * Write generated code to files
   */
  async writeFiles(outputPath, code) {
    const artifacts = [];
    for (const [filePath, content] of Object.entries(code)) {
      const fullPath = join(outputPath, filePath);
      const dir = dirname(fullPath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
      writeFileSync(fullPath, content, "utf-8");
      artifacts.push(filePath);
      this.log(`Written: ${filePath}`);
    }
    return artifacts;
  }
  /**
   * Quick generate without full build request
   */
  async generate(type, name, description) {
    const request = {
      discoveryId: `manual-${Date.now()}`,
      type,
      name,
      description,
      sourceUrl: "https://gicm.dev"
    };
    return this.build(request);
  }
  async handleBuild(request) {
    if (!request) {
      return this.createResult(false, null, "No build request provided");
    }
    try {
      const result = await this.build(request);
      return this.createResult(
        result.status === "completed",
        result,
        result.error,
        result.status === "completed" ? 0.95 : 0,
        `Built ${request.name}`
      );
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Build failed";
      return this.createResult(false, null, msg);
    }
  }
  async handleGenerate(params) {
    if (!params?.type || !params?.name || !params?.description) {
      return this.createResult(false, null, "Missing required params: type, name, description");
    }
    const result = await this.generate(
      params.type,
      params.name,
      params.description
    );
    return this.createResult(
      result.status === "completed",
      result,
      result.error,
      result.status === "completed" ? 0.9 : 0
    );
  }
};
var index_default = BuilderAgent;
export {
  BuildRequestSchema,
  BuildResultSchema,
  BuilderAgent,
  index_default as default
};
