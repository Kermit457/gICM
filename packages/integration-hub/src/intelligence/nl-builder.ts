/**
 * Natural Language Pipeline Builder
 * Phase 10C: Natural Language Pipeline Builder
 */

import { EventEmitter } from "eventemitter3";
import { randomUUID } from "crypto";
import { z } from "zod";

// ============================================================================
// TYPES
// ============================================================================

export const NLRequestSchema = z.object({
  description: z.string().min(10),
  context: z.string().optional(),
  constraints: z.object({
    maxSteps: z.number().optional(),
    maxCost: z.number().optional(),
    preferredModels: z.array(z.string()).optional(),
    requiredCapabilities: z.array(z.string()).optional(),
  }).optional(),
});
export type NLRequest = z.infer<typeof NLRequestSchema>;

export const GeneratedStepSchema = z.object({
  name: z.string(),
  type: z.enum([
    "llm_call",
    "data_transform",
    "api_call",
    "condition",
    "loop",
    "parallel",
    "human_review",
  ]),
  description: z.string(),
  config: z.record(z.unknown()),
  prompt: z.string().optional(),
  model: z.string().optional(),
  dependencies: z.array(z.number()).optional(),  // indices of dependent steps
  estimatedTokens: z.number().optional(),
  estimatedCost: z.number().optional(),
});
export type GeneratedStep = z.infer<typeof GeneratedStepSchema>;

export const GeneratedPipelineSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  steps: z.array(GeneratedStepSchema),
  inputSchema: z.record(z.object({
    type: z.string(),
    description: z.string(),
    required: z.boolean(),
    default: z.unknown().optional(),
  })),
  outputSchema: z.record(z.object({
    type: z.string(),
    description: z.string(),
  })),
  estimatedTotalTokens: z.number(),
  estimatedTotalCost: z.number(),
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
  alternatives: z.array(z.object({
    description: z.string(),
    tradeoffs: z.string(),
  })).optional(),
});
export type GeneratedPipeline = z.infer<typeof GeneratedPipelineSchema>;

export const RefinementSchema = z.object({
  type: z.enum(["add_step", "remove_step", "modify_step", "reorder", "change_model", "add_validation", "other"]),
  instruction: z.string(),
  stepIndex: z.number().optional(),
});
export type Refinement = z.infer<typeof RefinementSchema>;

export const ConversationMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
  timestamp: z.date(),
  pipelineSnapshot: GeneratedPipelineSchema.optional(),
});
export type ConversationMessage = z.infer<typeof ConversationMessageSchema>;

export const BuilderSessionSchema = z.object({
  id: z.string(),
  status: z.enum(["active", "completed", "abandoned"]),
  originalRequest: NLRequestSchema,
  currentPipeline: GeneratedPipelineSchema.optional(),
  conversation: z.array(ConversationMessageSchema),
  refinements: z.array(RefinementSchema),
  createdAt: z.date(),
  updatedAt: z.date(),
  completedAt: z.date().optional(),
});
export type BuilderSession = z.infer<typeof BuilderSessionSchema>;

export const NLBuilderConfigSchema = z.object({
  enabled: z.boolean().default(true),
  model: z.string().default("claude-3-sonnet-20240229"),
  maxConversationTurns: z.number().default(10),
  maxStepsPerPipeline: z.number().default(20),
  defaultCostLimit: z.number().default(1.0),
  templateMatching: z.boolean().default(true),
  autoSuggestImprovements: z.boolean().default(true),
});
export type NLBuilderConfig = z.infer<typeof NLBuilderConfigSchema>;

export interface NLBuilderEvents {
  "session:started": (session: BuilderSession) => void;
  "session:updated": (session: BuilderSession) => void;
  "session:completed": (session: BuilderSession) => void;
  "pipeline:generated": (pipeline: GeneratedPipeline) => void;
  "pipeline:refined": (pipeline: GeneratedPipeline, refinement: Refinement) => void;
}

// ============================================================================
// PIPELINE TEMPLATES
// ============================================================================

interface PipelineTemplate {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  steps: GeneratedStep[];
  inputSchema: GeneratedPipeline["inputSchema"];
  outputSchema: GeneratedPipeline["outputSchema"];
}

const PIPELINE_TEMPLATES: PipelineTemplate[] = [
  {
    id: "content-generation",
    name: "Content Generation",
    description: "Generate content from a topic or brief",
    keywords: ["write", "generate", "create", "content", "article", "blog", "post"],
    steps: [
      {
        name: "Research Topic",
        type: "llm_call",
        description: "Research and gather information about the topic",
        config: {},
        prompt: "Research the following topic and provide key points: {{topic}}",
        model: "claude-3-haiku-20240307",
        estimatedTokens: 500,
        estimatedCost: 0.001,
      },
      {
        name: "Generate Outline",
        type: "llm_call",
        description: "Create a structured outline",
        config: {},
        prompt: "Create an outline for content about: {{topic}}\n\nResearch: {{step_0_output}}",
        model: "claude-3-haiku-20240307",
        dependencies: [0],
        estimatedTokens: 300,
        estimatedCost: 0.0006,
      },
      {
        name: "Write Content",
        type: "llm_call",
        description: "Write the full content based on outline",
        config: {},
        prompt: "Write engaging content based on this outline: {{step_1_output}}",
        model: "claude-3-sonnet-20240229",
        dependencies: [1],
        estimatedTokens: 2000,
        estimatedCost: 0.02,
      },
    ],
    inputSchema: {
      topic: { type: "string", description: "The topic to write about", required: true },
    },
    outputSchema: {
      content: { type: "string", description: "The generated content" },
    },
  },
  {
    id: "data-extraction",
    name: "Data Extraction",
    description: "Extract structured data from unstructured text",
    keywords: ["extract", "parse", "data", "information", "structured", "json"],
    steps: [
      {
        name: "Analyze Structure",
        type: "llm_call",
        description: "Analyze the input and identify extractable fields",
        config: {},
        prompt: "Analyze this text and identify the key data fields that can be extracted:\n\n{{input_text}}",
        model: "claude-3-haiku-20240307",
        estimatedTokens: 400,
        estimatedCost: 0.0008,
      },
      {
        name: "Extract Data",
        type: "llm_call",
        description: "Extract the identified data into JSON format",
        config: { outputFormat: "json" },
        prompt: "Extract the following fields from the text and return as JSON:\nFields: {{step_0_output}}\n\nText: {{input_text}}",
        model: "claude-3-sonnet-20240229",
        dependencies: [0],
        estimatedTokens: 600,
        estimatedCost: 0.006,
      },
      {
        name: "Validate Output",
        type: "data_transform",
        description: "Validate the extracted JSON",
        config: { validate: true },
        dependencies: [1],
      },
    ],
    inputSchema: {
      input_text: { type: "string", description: "The text to extract data from", required: true },
    },
    outputSchema: {
      extracted_data: { type: "object", description: "The extracted structured data" },
    },
  },
  {
    id: "summarization",
    name: "Summarization",
    description: "Summarize long documents or text",
    keywords: ["summarize", "summary", "condense", "brief", "tldr", "shorten"],
    steps: [
      {
        name: "Chunk Document",
        type: "data_transform",
        description: "Split long document into manageable chunks",
        config: { chunkSize: 4000, overlap: 200 },
      },
      {
        name: "Summarize Chunks",
        type: "loop",
        description: "Summarize each chunk",
        config: { iterateOver: "step_0_output" },
        prompt: "Summarize the following text concisely:\n\n{{chunk}}",
        model: "claude-3-haiku-20240307",
        dependencies: [0],
        estimatedTokens: 1000,
        estimatedCost: 0.002,
      },
      {
        name: "Combine Summaries",
        type: "llm_call",
        description: "Combine chunk summaries into final summary",
        config: {},
        prompt: "Combine these summaries into a cohesive final summary:\n\n{{step_1_output}}",
        model: "claude-3-sonnet-20240229",
        dependencies: [1],
        estimatedTokens: 800,
        estimatedCost: 0.008,
      },
    ],
    inputSchema: {
      document: { type: "string", description: "The document to summarize", required: true },
      max_length: { type: "number", description: "Maximum summary length", required: false, default: 500 },
    },
    outputSchema: {
      summary: { type: "string", description: "The generated summary" },
    },
  },
  {
    id: "classification",
    name: "Classification",
    description: "Classify text into categories",
    keywords: ["classify", "categorize", "label", "tag", "category", "sentiment"],
    steps: [
      {
        name: "Classify",
        type: "llm_call",
        description: "Classify the input into specified categories",
        config: { outputFormat: "json" },
        prompt: "Classify the following text into one of these categories: {{categories}}\n\nText: {{input_text}}\n\nRespond with JSON: {\"category\": \"...\", \"confidence\": 0.0-1.0, \"reasoning\": \"...\"}",
        model: "claude-3-haiku-20240307",
        estimatedTokens: 200,
        estimatedCost: 0.0004,
      },
    ],
    inputSchema: {
      input_text: { type: "string", description: "The text to classify", required: true },
      categories: { type: "array", description: "List of possible categories", required: true },
    },
    outputSchema: {
      category: { type: "string", description: "The assigned category" },
      confidence: { type: "number", description: "Classification confidence" },
    },
  },
  {
    id: "translation",
    name: "Translation",
    description: "Translate text between languages",
    keywords: ["translate", "translation", "language", "convert", "localize"],
    steps: [
      {
        name: "Translate",
        type: "llm_call",
        description: "Translate text to target language",
        config: {},
        prompt: "Translate the following text to {{target_language}}. Preserve the original meaning and tone:\n\n{{input_text}}",
        model: "claude-3-sonnet-20240229",
        estimatedTokens: 500,
        estimatedCost: 0.005,
      },
      {
        name: "Quality Check",
        type: "llm_call",
        description: "Verify translation quality",
        config: { outputFormat: "json" },
        prompt: "Review this translation for accuracy:\nOriginal: {{input_text}}\nTranslation: {{step_0_output}}\n\nRespond with JSON: {\"quality_score\": 0-100, \"issues\": [], \"suggestions\": []}",
        model: "claude-3-haiku-20240307",
        dependencies: [0],
        estimatedTokens: 300,
        estimatedCost: 0.0006,
      },
    ],
    inputSchema: {
      input_text: { type: "string", description: "Text to translate", required: true },
      target_language: { type: "string", description: "Target language", required: true },
    },
    outputSchema: {
      translated_text: { type: "string", description: "The translated text" },
      quality_score: { type: "number", description: "Translation quality score" },
    },
  },
];

// ============================================================================
// NATURAL LANGUAGE BUILDER
// ============================================================================

export class NLBuilder extends EventEmitter<NLBuilderEvents> {
  private config: NLBuilderConfig;
  private sessions: Map<string, BuilderSession> = new Map();
  private templates: PipelineTemplate[] = PIPELINE_TEMPLATES;

  constructor(config: Partial<NLBuilderConfig> = {}) {
    super();
    this.config = NLBuilderConfigSchema.parse(config);
  }

  // ==========================================================================
  // SESSION MANAGEMENT
  // ==========================================================================

  async startSession(request: NLRequest): Promise<BuilderSession> {
    const session: BuilderSession = {
      id: randomUUID(),
      status: "active",
      originalRequest: request,
      conversation: [
        {
          role: "user",
          content: request.description,
          timestamp: new Date(),
        },
      ],
      refinements: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.sessions.set(session.id, session);
    this.emit("session:started", session);

    // Generate initial pipeline
    const pipeline = await this.generatePipeline(request);
    session.currentPipeline = pipeline;
    session.conversation.push({
      role: "assistant",
      content: this.formatPipelineResponse(pipeline),
      timestamp: new Date(),
      pipelineSnapshot: pipeline,
    });

    this.emit("session:updated", session);
    this.emit("pipeline:generated", pipeline);

    return session;
  }

  getSession(sessionId: string): BuilderSession | undefined {
    return this.sessions.get(sessionId);
  }

  async refineSession(sessionId: string, instruction: string): Promise<BuilderSession | undefined> {
    const session = this.sessions.get(sessionId);
    if (!session || session.status !== "active") return undefined;

    if (session.conversation.length >= this.config.maxConversationTurns * 2) {
      throw new Error("Maximum conversation turns reached");
    }

    // Add user message
    session.conversation.push({
      role: "user",
      content: instruction,
      timestamp: new Date(),
    });

    // Parse refinement type
    const refinement = this.parseRefinement(instruction, session.currentPipeline);
    session.refinements.push(refinement);

    // Apply refinement
    if (session.currentPipeline) {
      const refined = await this.applyRefinement(session.currentPipeline, refinement);
      session.currentPipeline = refined;

      session.conversation.push({
        role: "assistant",
        content: this.formatRefinementResponse(refinement, refined),
        timestamp: new Date(),
        pipelineSnapshot: refined,
      });

      this.emit("pipeline:refined", refined, refinement);
    }

    session.updatedAt = new Date();
    this.emit("session:updated", session);

    return session;
  }

  completeSession(sessionId: string): BuilderSession | undefined {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;

    session.status = "completed";
    session.completedAt = new Date();
    session.updatedAt = new Date();

    this.emit("session:completed", session);
    return session;
  }

  abandonSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    session.status = "abandoned";
    session.updatedAt = new Date();
    return true;
  }

  // ==========================================================================
  // PIPELINE GENERATION
  // ==========================================================================

  async generatePipeline(request: NLRequest): Promise<GeneratedPipeline> {
    // Try template matching first
    if (this.config.templateMatching) {
      const matchedTemplate = this.matchTemplate(request.description);
      if (matchedTemplate) {
        return this.templateToPipeline(matchedTemplate, request);
      }
    }

    // Generate custom pipeline
    return this.generateCustomPipeline(request);
  }

  private matchTemplate(description: string): PipelineTemplate | null {
    const words = description.toLowerCase().split(/\W+/);
    let bestMatch: PipelineTemplate | null = null;
    let bestScore = 0;

    for (const template of this.templates) {
      const score = template.keywords.filter((kw) =>
        words.some((w) => w.includes(kw) || kw.includes(w))
      ).length;

      if (score > bestScore && score >= 2) {
        bestScore = score;
        bestMatch = template;
      }
    }

    return bestMatch;
  }

  private templateToPipeline(
    template: PipelineTemplate,
    request: NLRequest
  ): GeneratedPipeline {
    const totalTokens = template.steps.reduce(
      (sum, s) => sum + (s.estimatedTokens || 0),
      0
    );
    const totalCost = template.steps.reduce(
      (sum, s) => sum + (s.estimatedCost || 0),
      0
    );

    return {
      id: randomUUID(),
      name: this.generatePipelineName(request.description),
      description: request.description,
      steps: template.steps,
      inputSchema: template.inputSchema,
      outputSchema: template.outputSchema,
      estimatedTotalTokens: totalTokens,
      estimatedTotalCost: totalCost,
      confidence: 0.85,
      reasoning: `Matched template "${template.name}" based on your description. ` +
        `This is a proven pattern for ${template.description.toLowerCase()}.`,
      alternatives: this.findAlternativeApproaches(template, request),
    };
  }

  private async generateCustomPipeline(request: NLRequest): Promise<GeneratedPipeline> {
    // This would call an LLM to generate a custom pipeline
    // For now, return a simple generic pipeline
    const steps: GeneratedStep[] = [
      {
        name: "Process Input",
        type: "llm_call",
        description: "Process the input according to requirements",
        config: {},
        prompt: `You are helping with: ${request.description}\n\nProcess this input: {{input}}`,
        model: this.config.model,
        estimatedTokens: 1000,
        estimatedCost: 0.01,
      },
      {
        name: "Format Output",
        type: "data_transform",
        description: "Format the output as needed",
        config: {},
        dependencies: [0],
      },
    ];

    return {
      id: randomUUID(),
      name: this.generatePipelineName(request.description),
      description: request.description,
      steps,
      inputSchema: {
        input: { type: "string", description: "The input to process", required: true },
      },
      outputSchema: {
        output: { type: "string", description: "The processed output" },
      },
      estimatedTotalTokens: 1000,
      estimatedTotalCost: 0.01,
      confidence: 0.6,
      reasoning: "Generated a basic custom pipeline. Consider refining the steps " +
        "to better match your specific requirements.",
      alternatives: [
        {
          description: "Add validation step",
          tradeoffs: "Increases reliability but adds latency and cost",
        },
        {
          description: "Split into multiple specialized steps",
          tradeoffs: "Better modularity but higher total cost",
        },
      ],
    };
  }

  private generatePipelineName(description: string): string {
    // Extract key words for name
    const words = description
      .split(/\W+/)
      .filter((w) => w.length > 3)
      .slice(0, 3);
    return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") + " Pipeline";
  }

  private findAlternativeApproaches(
    template: PipelineTemplate,
    request: NLRequest
  ): GeneratedPipeline["alternatives"] {
    const alternatives: GeneratedPipeline["alternatives"] = [];

    // Suggest adding validation
    if (!template.steps.some((s) => s.type === "data_transform" && s.config.validate)) {
      alternatives.push({
        description: "Add output validation step",
        tradeoffs: "More reliable but slightly higher cost (+$0.001)",
      });
    }

    // Suggest different model choices
    if (template.steps.some((s) => s.model?.includes("sonnet"))) {
      alternatives.push({
        description: "Use faster/cheaper Haiku model for all steps",
        tradeoffs: "50% cheaper, faster, but may reduce quality for complex tasks",
      });
    }

    // Suggest parallel execution
    const independentSteps = template.steps.filter(
      (s) => !s.dependencies || s.dependencies.length === 0
    );
    if (independentSteps.length > 1) {
      alternatives.push({
        description: "Run initial steps in parallel",
        tradeoffs: "Faster execution but requires more concurrent API calls",
      });
    }

    return alternatives;
  }

  // ==========================================================================
  // REFINEMENT
  // ==========================================================================

  private parseRefinement(instruction: string, pipeline?: GeneratedPipeline): Refinement {
    const lower = instruction.toLowerCase();

    if (lower.includes("add") && (lower.includes("step") || lower.includes("validation"))) {
      return { type: "add_step", instruction };
    }
    if (lower.includes("remove") || lower.includes("delete")) {
      const stepMatch = instruction.match(/step\s*(\d+)/i);
      return {
        type: "remove_step",
        instruction,
        stepIndex: stepMatch ? parseInt(stepMatch[1]) - 1 : undefined,
      };
    }
    if (lower.includes("change") || lower.includes("modify") || lower.includes("update")) {
      const stepMatch = instruction.match(/step\s*(\d+)/i);
      return {
        type: "modify_step",
        instruction,
        stepIndex: stepMatch ? parseInt(stepMatch[1]) - 1 : undefined,
      };
    }
    if (lower.includes("reorder") || lower.includes("move")) {
      return { type: "reorder", instruction };
    }
    if (lower.includes("model") || lower.includes("haiku") || lower.includes("sonnet")) {
      return { type: "change_model", instruction };
    }

    return { type: "other", instruction };
  }

  private async applyRefinement(
    pipeline: GeneratedPipeline,
    refinement: Refinement
  ): Promise<GeneratedPipeline> {
    const updated = { ...pipeline, id: randomUUID() };

    switch (refinement.type) {
      case "add_step":
        updated.steps = [
          ...updated.steps,
          {
            name: "New Step",
            type: "llm_call",
            description: "Added step based on refinement",
            config: {},
            model: "claude-3-haiku-20240307",
            estimatedTokens: 200,
            estimatedCost: 0.0004,
          },
        ];
        break;

      case "remove_step":
        if (refinement.stepIndex !== undefined && refinement.stepIndex < updated.steps.length) {
          updated.steps = updated.steps.filter((_, i) => i !== refinement.stepIndex);
          // Update dependencies
          updated.steps = updated.steps.map((s) => ({
            ...s,
            dependencies: s.dependencies
              ?.filter((d) => d !== refinement.stepIndex)
              .map((d) => (d > refinement.stepIndex! ? d - 1 : d)),
          }));
        }
        break;

      case "change_model":
        const targetModel = refinement.instruction.toLowerCase().includes("haiku")
          ? "claude-3-haiku-20240307"
          : "claude-3-sonnet-20240229";
        updated.steps = updated.steps.map((s) =>
          s.model ? { ...s, model: targetModel } : s
        );
        break;

      case "add_validation":
        updated.steps.push({
          name: "Validate Output",
          type: "data_transform",
          description: "Validate the output format and content",
          config: { validate: true },
          dependencies: [updated.steps.length - 1],
        });
        break;
    }

    // Recalculate totals
    updated.estimatedTotalTokens = updated.steps.reduce(
      (sum, s) => sum + (s.estimatedTokens || 0),
      0
    );
    updated.estimatedTotalCost = updated.steps.reduce(
      (sum, s) => sum + (s.estimatedCost || 0),
      0
    );

    return updated;
  }

  // ==========================================================================
  // FORMATTING
  // ==========================================================================

  private formatPipelineResponse(pipeline: GeneratedPipeline): string {
    let response = `I've generated a pipeline for you:\n\n`;
    response += `**${pipeline.name}**\n\n`;
    response += `${pipeline.reasoning}\n\n`;
    response += `**Steps (${pipeline.steps.length}):**\n`;

    pipeline.steps.forEach((step, i) => {
      response += `${i + 1}. **${step.name}** - ${step.description}`;
      if (step.model) response += ` (${step.model.split("-").pop()})`;
      response += `\n`;
    });

    response += `\n**Estimated Cost:** $${pipeline.estimatedTotalCost.toFixed(4)}\n`;
    response += `**Confidence:** ${(pipeline.confidence * 100).toFixed(0)}%\n\n`;

    if (pipeline.alternatives && pipeline.alternatives.length > 0) {
      response += `**Alternative approaches:**\n`;
      pipeline.alternatives.forEach((alt) => {
        response += `- ${alt.description}: ${alt.tradeoffs}\n`;
      });
    }

    response += `\nYou can refine this by saying things like "add a validation step" or "use haiku for all steps".`;

    return response;
  }

  private formatRefinementResponse(
    refinement: Refinement,
    pipeline: GeneratedPipeline
  ): string {
    let response = `I've updated the pipeline based on your request.\n\n`;
    response += `**Updated Steps (${pipeline.steps.length}):**\n`;

    pipeline.steps.forEach((step, i) => {
      response += `${i + 1}. **${step.name}** - ${step.description}\n`;
    });

    response += `\n**New Estimated Cost:** $${pipeline.estimatedTotalCost.toFixed(4)}\n`;
    response += `\nAnything else you'd like to change?`;

    return response;
  }

  // ==========================================================================
  // TEMPLATE MANAGEMENT
  // ==========================================================================

  addTemplate(template: PipelineTemplate): void {
    this.templates.push(template);
  }

  getTemplates(): PipelineTemplate[] {
    return [...this.templates];
  }
}

// ============================================================================
// SINGLETON & FACTORY
// ============================================================================

let instance: NLBuilder | null = null;

export function getNLBuilder(): NLBuilder {
  if (!instance) {
    instance = new NLBuilder();
  }
  return instance;
}

export function createNLBuilder(config: Partial<NLBuilderConfig> = {}): NLBuilder {
  instance = new NLBuilder(config);
  return instance;
}
