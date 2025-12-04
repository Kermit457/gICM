/**
 * Agent utilities
 * Patterns for building agentic AI applications
 */

import { z } from 'zod';

// Types
export interface AgentTool {
  name: string;
  description: string;
  inputSchema: z.ZodType;
  execute: (input: unknown) => Promise<unknown>;
}

export interface AgentConfig {
  maxIterations: number;
  maxTokens: number;
  tools: AgentTool[];
  systemPrompt?: string;
  onToolCall?: (toolName: string, input: unknown) => void;
  onToolResult?: (toolName: string, result: unknown) => void;
  onThinking?: (thought: string) => void;
}

export interface AgentResult {
  output: string;
  iterations: number;
  toolCalls: Array<{
    tool: string;
    input: unknown;
    output: unknown;
  }>;
  finishReason: 'complete' | 'max_iterations' | 'error';
}

export type AgentLoop = (
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  config: AgentConfig
) => Promise<AgentResult>;

/**
 * Create tool schema for Anthropic tool_use format
 */
export function createToolSchema(tool: AgentTool): {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
} {
  // Convert Zod schema to JSON Schema (simplified)
  const zodToJsonSchema = (schema: z.ZodType): Record<string, unknown> => {
    if (schema instanceof z.ZodObject) {
      const shape = schema.shape;
      const properties: Record<string, unknown> = {};
      const required: string[] = [];

      for (const [key, value] of Object.entries(shape)) {
        const zodValue = value as z.ZodType;
        properties[key] = zodToJsonSchema(zodValue);

        // Check if optional
        if (!(zodValue instanceof z.ZodOptional)) {
          required.push(key);
        }
      }

      return {
        type: 'object',
        properties,
        required: required.length > 0 ? required : undefined,
      };
    }

    if (schema instanceof z.ZodString) {
      return { type: 'string' };
    }

    if (schema instanceof z.ZodNumber) {
      return { type: 'number' };
    }

    if (schema instanceof z.ZodBoolean) {
      return { type: 'boolean' };
    }

    if (schema instanceof z.ZodArray) {
      return {
        type: 'array',
        items: zodToJsonSchema(schema.element),
      };
    }

    if (schema instanceof z.ZodEnum) {
      return {
        type: 'string',
        enum: schema.options,
      };
    }

    if (schema instanceof z.ZodOptional) {
      return zodToJsonSchema(schema.unwrap());
    }

    return { type: 'string' }; // Fallback
  };

  return {
    name: tool.name,
    description: tool.description,
    input_schema: zodToJsonSchema(tool.inputSchema),
  };
}

/**
 * Execute a tool with input validation
 */
export async function executeTool(
  tool: AgentTool,
  input: unknown
): Promise<{ success: true; result: unknown } | { success: false; error: string }> {
  try {
    const validatedInput = tool.inputSchema.parse(input);
    const result = await tool.execute(validatedInput);
    return { success: true, result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Invalid input: ${error.errors.map(e => e.message).join(', ')}`,
      };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Create a ReAct-style agent prompt
 */
export function createReActPrompt(tools: AgentTool[], systemPrompt?: string): string {
  const toolDescriptions = tools
    .map(t => `- ${t.name}: ${t.description}`)
    .join('\n');

  return `${systemPrompt || 'You are a helpful AI assistant.'}

You have access to the following tools:

${toolDescriptions}

To use a tool, respond with:
Thought: [your reasoning about what to do]
Action: [tool_name]
Action Input: [JSON input for the tool]

After receiving tool results, continue reasoning:
Thought: [analysis of the result]
Action: [next_tool_name or "Final Answer"]
Action Input: [input or final response]

When you have enough information, respond with:
Thought: I now have enough information to answer.
Final Answer: [your complete response]

Always think step by step and explain your reasoning.`;
}

/**
 * Parse ReAct-style response
 */
export function parseReActResponse(response: string): {
  thought?: string;
  action?: string;
  actionInput?: unknown;
  finalAnswer?: string;
} {
  const result: {
    thought?: string;
    action?: string;
    actionInput?: unknown;
    finalAnswer?: string;
  } = {};

  // Extract thought
  const thoughtMatch = response.match(/Thought:\s*(.+?)(?=\n(?:Action|Final Answer)|\n\n|$)/is);
  if (thoughtMatch) {
    result.thought = thoughtMatch[1].trim();
  }

  // Check for final answer
  const finalMatch = response.match(/Final Answer:\s*(.+)/is);
  if (finalMatch) {
    result.finalAnswer = finalMatch[1].trim();
    return result;
  }

  // Extract action
  const actionMatch = response.match(/Action:\s*(.+?)(?=\n|$)/i);
  if (actionMatch) {
    result.action = actionMatch[1].trim();
  }

  // Extract action input
  const inputMatch = response.match(/Action Input:\s*(.+)/is);
  if (inputMatch) {
    const inputStr = inputMatch[1].trim();
    try {
      result.actionInput = JSON.parse(inputStr);
    } catch {
      result.actionInput = inputStr;
    }
  }

  return result;
}

/**
 * Simple tool registry
 */
export function createToolRegistry() {
  const tools = new Map<string, AgentTool>();

  return {
    /**
     * Register a tool
     */
    register(tool: AgentTool) {
      tools.set(tool.name, tool);
    },

    /**
     * Get a tool by name
     */
    get(name: string): AgentTool | undefined {
      return tools.get(name);
    },

    /**
     * Get all tools
     */
    getAll(): AgentTool[] {
      return Array.from(tools.values());
    },

    /**
     * Get all tool schemas
     */
    getSchemas() {
      return this.getAll().map(createToolSchema);
    },

    /**
     * Execute a tool by name
     */
    async execute(name: string, input: unknown) {
      const tool = tools.get(name);
      if (!tool) {
        return { success: false, error: `Tool "${name}" not found` };
      }
      return executeTool(tool, input);
    },

    /**
     * Check if tool exists
     */
    has(name: string): boolean {
      return tools.has(name);
    },
  };
}

/**
 * Common tool definitions
 */
export const CommonTools = {
  /**
   * Create a calculator tool
   */
  calculator(): AgentTool {
    return {
      name: 'calculator',
      description: 'Perform mathematical calculations. Input should be a math expression.',
      inputSchema: z.object({
        expression: z.string().describe('Mathematical expression to evaluate'),
      }),
      execute: async (input) => {
        const { expression } = input as { expression: string };
        // Safe math evaluation (basic)
        const sanitized = expression.replace(/[^0-9+\-*/().%\s]/g, '');
        try {
          // eslint-disable-next-line no-eval
          const result = eval(sanitized);
          return { result };
        } catch {
          throw new Error('Invalid mathematical expression');
        }
      },
    };
  },

  /**
   * Create a time/date tool
   */
  datetime(): AgentTool {
    return {
      name: 'datetime',
      description: 'Get current date and time information',
      inputSchema: z.object({
        format: z.enum(['iso', 'unix', 'readable']).optional().default('iso'),
        timezone: z.string().optional(),
      }),
      execute: async (input) => {
        const { format } = input as { format: string };
        const now = new Date();

        switch (format) {
          case 'unix':
            return { timestamp: Math.floor(now.getTime() / 1000) };
          case 'readable':
            return { datetime: now.toLocaleString() };
          default:
            return { datetime: now.toISOString() };
        }
      },
    };
  },
};
