import { z } from 'zod';

/**
 * PTC Coordinator Types
 *
 * Programmatic Tool Calling - Orchestrate tools via code generation
 * instead of individual API calls (37% token reduction)
 */

declare const ToolDefinitionSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodString;
    input_schema: z.ZodObject<{
        type: z.ZodLiteral<"object">;
        properties: z.ZodRecord<z.ZodString, z.ZodObject<{
            type: z.ZodString;
            description: z.ZodString;
            enum: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            description: string;
            type: string;
            enum?: string[] | undefined;
        }, {
            description: string;
            type: string;
            enum?: string[] | undefined;
        }>>;
        required: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        type: "object";
        properties: Record<string, {
            description: string;
            type: string;
            enum?: string[] | undefined;
        }>;
        required: string[];
    }, {
        type: "object";
        properties: Record<string, {
            description: string;
            type: string;
            enum?: string[] | undefined;
        }>;
        required: string[];
    }>;
}, "strip", z.ZodTypeAny, {
    name: string;
    description: string;
    input_schema: {
        type: "object";
        properties: Record<string, {
            description: string;
            type: string;
            enum?: string[] | undefined;
        }>;
        required: string[];
    };
}, {
    name: string;
    description: string;
    input_schema: {
        type: "object";
        properties: Record<string, {
            description: string;
            type: string;
            enum?: string[] | undefined;
        }>;
        required: string[];
    };
}>;
type ToolDefinition = z.infer<typeof ToolDefinitionSchema>;
declare const PipelineStepSchema: z.ZodObject<{
    id: z.ZodString;
    tool: z.ZodString;
    inputs: z.ZodRecord<z.ZodString, z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodBoolean, z.ZodNull]>>;
    dependsOn: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    condition: z.ZodOptional<z.ZodString>;
    retries: z.ZodOptional<z.ZodNumber>;
    timeout: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    id: string;
    tool: string;
    inputs: Record<string, string | number | boolean | null>;
    dependsOn?: string[] | undefined;
    condition?: string | undefined;
    retries?: number | undefined;
    timeout?: number | undefined;
}, {
    id: string;
    tool: string;
    inputs: Record<string, string | number | boolean | null>;
    dependsOn?: string[] | undefined;
    condition?: string | undefined;
    retries?: number | undefined;
    timeout?: number | undefined;
}>;
type PipelineStep = z.infer<typeof PipelineStepSchema>;
declare const PipelineSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodString;
    version: z.ZodDefault<z.ZodString>;
    steps: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        tool: z.ZodString;
        inputs: z.ZodRecord<z.ZodString, z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodBoolean, z.ZodNull]>>;
        dependsOn: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        condition: z.ZodOptional<z.ZodString>;
        retries: z.ZodOptional<z.ZodNumber>;
        timeout: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        tool: string;
        inputs: Record<string, string | number | boolean | null>;
        dependsOn?: string[] | undefined;
        condition?: string | undefined;
        retries?: number | undefined;
        timeout?: number | undefined;
    }, {
        id: string;
        tool: string;
        inputs: Record<string, string | number | boolean | null>;
        dependsOn?: string[] | undefined;
        condition?: string | undefined;
        retries?: number | undefined;
        timeout?: number | undefined;
    }>, "many">;
    inputs: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
        type: z.ZodString;
        description: z.ZodString;
        required: z.ZodOptional<z.ZodBoolean>;
        default: z.ZodOptional<z.ZodUnknown>;
    }, "strip", z.ZodTypeAny, {
        description: string;
        type: string;
        required?: boolean | undefined;
        default?: unknown;
    }, {
        description: string;
        type: string;
        required?: boolean | undefined;
        default?: unknown;
    }>>>;
    outputs: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    metadata: z.ZodOptional<z.ZodObject<{
        category: z.ZodOptional<z.ZodString>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        riskLevel: z.ZodOptional<z.ZodEnum<["safe", "low", "medium", "high", "critical"]>>;
        estimatedDuration: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        category?: string | undefined;
        tags?: string[] | undefined;
        riskLevel?: "safe" | "low" | "medium" | "high" | "critical" | undefined;
        estimatedDuration?: number | undefined;
    }, {
        category?: string | undefined;
        tags?: string[] | undefined;
        riskLevel?: "safe" | "low" | "medium" | "high" | "critical" | undefined;
        estimatedDuration?: number | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    description: string;
    id: string;
    version: string;
    steps: {
        id: string;
        tool: string;
        inputs: Record<string, string | number | boolean | null>;
        dependsOn?: string[] | undefined;
        condition?: string | undefined;
        retries?: number | undefined;
        timeout?: number | undefined;
    }[];
    inputs?: Record<string, {
        description: string;
        type: string;
        required?: boolean | undefined;
        default?: unknown;
    }> | undefined;
    outputs?: string[] | undefined;
    metadata?: {
        category?: string | undefined;
        tags?: string[] | undefined;
        riskLevel?: "safe" | "low" | "medium" | "high" | "critical" | undefined;
        estimatedDuration?: number | undefined;
    } | undefined;
}, {
    name: string;
    description: string;
    id: string;
    steps: {
        id: string;
        tool: string;
        inputs: Record<string, string | number | boolean | null>;
        dependsOn?: string[] | undefined;
        condition?: string | undefined;
        retries?: number | undefined;
        timeout?: number | undefined;
    }[];
    inputs?: Record<string, {
        description: string;
        type: string;
        required?: boolean | undefined;
        default?: unknown;
    }> | undefined;
    version?: string | undefined;
    outputs?: string[] | undefined;
    metadata?: {
        category?: string | undefined;
        tags?: string[] | undefined;
        riskLevel?: "safe" | "low" | "medium" | "high" | "critical" | undefined;
        estimatedDuration?: number | undefined;
    } | undefined;
}>;
type Pipeline = z.infer<typeof PipelineSchema>;
declare const SharedContextSchema: z.ZodObject<{
    inputs: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    results: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    state: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    meta: z.ZodObject<{
        startTime: z.ZodNumber;
        currentStep: z.ZodOptional<z.ZodString>;
        completedSteps: z.ZodArray<z.ZodString, "many">;
        errors: z.ZodArray<z.ZodObject<{
            step: z.ZodString;
            error: z.ZodString;
            timestamp: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            step: string;
            error: string;
            timestamp: number;
        }, {
            step: string;
            error: string;
            timestamp: number;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        startTime: number;
        completedSteps: string[];
        errors: {
            step: string;
            error: string;
            timestamp: number;
        }[];
        currentStep?: string | undefined;
    }, {
        startTime: number;
        completedSteps: string[];
        errors: {
            step: string;
            error: string;
            timestamp: number;
        }[];
        currentStep?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    inputs: Record<string, unknown>;
    results: Record<string, unknown>;
    state: Record<string, unknown>;
    meta: {
        startTime: number;
        completedSteps: string[];
        errors: {
            step: string;
            error: string;
            timestamp: number;
        }[];
        currentStep?: string | undefined;
    };
}, {
    inputs: Record<string, unknown>;
    results: Record<string, unknown>;
    state: Record<string, unknown>;
    meta: {
        startTime: number;
        completedSteps: string[];
        errors: {
            step: string;
            error: string;
            timestamp: number;
        }[];
        currentStep?: string | undefined;
    };
}>;
type SharedContext = z.infer<typeof SharedContextSchema>;
declare const StepResultSchema: z.ZodObject<{
    stepId: z.ZodString;
    status: z.ZodEnum<["success", "error", "skipped"]>;
    output: z.ZodOptional<z.ZodUnknown>;
    error: z.ZodOptional<z.ZodString>;
    duration: z.ZodNumber;
    timestamp: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    status: "error" | "success" | "skipped";
    timestamp: number;
    stepId: string;
    duration: number;
    error?: string | undefined;
    output?: unknown;
}, {
    status: "error" | "success" | "skipped";
    timestamp: number;
    stepId: string;
    duration: number;
    error?: string | undefined;
    output?: unknown;
}>;
type StepResult = z.infer<typeof StepResultSchema>;
declare const PipelineResultSchema: z.ZodObject<{
    pipelineId: z.ZodString;
    status: z.ZodEnum<["success", "partial", "error"]>;
    steps: z.ZodArray<z.ZodObject<{
        stepId: z.ZodString;
        status: z.ZodEnum<["success", "error", "skipped"]>;
        output: z.ZodOptional<z.ZodUnknown>;
        error: z.ZodOptional<z.ZodString>;
        duration: z.ZodNumber;
        timestamp: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        status: "error" | "success" | "skipped";
        timestamp: number;
        stepId: string;
        duration: number;
        error?: string | undefined;
        output?: unknown;
    }, {
        status: "error" | "success" | "skipped";
        timestamp: number;
        stepId: string;
        duration: number;
        error?: string | undefined;
        output?: unknown;
    }>, "many">;
    finalOutput: z.ZodOptional<z.ZodUnknown>;
    totalDuration: z.ZodNumber;
    startTime: z.ZodNumber;
    endTime: z.ZodNumber;
    context: z.ZodObject<{
        inputs: z.ZodRecord<z.ZodString, z.ZodUnknown>;
        results: z.ZodRecord<z.ZodString, z.ZodUnknown>;
        state: z.ZodRecord<z.ZodString, z.ZodUnknown>;
        meta: z.ZodObject<{
            startTime: z.ZodNumber;
            currentStep: z.ZodOptional<z.ZodString>;
            completedSteps: z.ZodArray<z.ZodString, "many">;
            errors: z.ZodArray<z.ZodObject<{
                step: z.ZodString;
                error: z.ZodString;
                timestamp: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                step: string;
                error: string;
                timestamp: number;
            }, {
                step: string;
                error: string;
                timestamp: number;
            }>, "many">;
        }, "strip", z.ZodTypeAny, {
            startTime: number;
            completedSteps: string[];
            errors: {
                step: string;
                error: string;
                timestamp: number;
            }[];
            currentStep?: string | undefined;
        }, {
            startTime: number;
            completedSteps: string[];
            errors: {
                step: string;
                error: string;
                timestamp: number;
            }[];
            currentStep?: string | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        inputs: Record<string, unknown>;
        results: Record<string, unknown>;
        state: Record<string, unknown>;
        meta: {
            startTime: number;
            completedSteps: string[];
            errors: {
                step: string;
                error: string;
                timestamp: number;
            }[];
            currentStep?: string | undefined;
        };
    }, {
        inputs: Record<string, unknown>;
        results: Record<string, unknown>;
        state: Record<string, unknown>;
        meta: {
            startTime: number;
            completedSteps: string[];
            errors: {
                step: string;
                error: string;
                timestamp: number;
            }[];
            currentStep?: string | undefined;
        };
    }>;
}, "strip", z.ZodTypeAny, {
    status: "error" | "success" | "partial";
    steps: {
        status: "error" | "success" | "skipped";
        timestamp: number;
        stepId: string;
        duration: number;
        error?: string | undefined;
        output?: unknown;
    }[];
    startTime: number;
    pipelineId: string;
    totalDuration: number;
    endTime: number;
    context: {
        inputs: Record<string, unknown>;
        results: Record<string, unknown>;
        state: Record<string, unknown>;
        meta: {
            startTime: number;
            completedSteps: string[];
            errors: {
                step: string;
                error: string;
                timestamp: number;
            }[];
            currentStep?: string | undefined;
        };
    };
    finalOutput?: unknown;
}, {
    status: "error" | "success" | "partial";
    steps: {
        status: "error" | "success" | "skipped";
        timestamp: number;
        stepId: string;
        duration: number;
        error?: string | undefined;
        output?: unknown;
    }[];
    startTime: number;
    pipelineId: string;
    totalDuration: number;
    endTime: number;
    context: {
        inputs: Record<string, unknown>;
        results: Record<string, unknown>;
        state: Record<string, unknown>;
        meta: {
            startTime: number;
            completedSteps: string[];
            errors: {
                step: string;
                error: string;
                timestamp: number;
            }[];
            currentStep?: string | undefined;
        };
    };
    finalOutput?: unknown;
}>;
type PipelineResult = z.infer<typeof PipelineResultSchema>;
declare const ValidationResultSchema: z.ZodObject<{
    valid: z.ZodBoolean;
    errors: z.ZodArray<z.ZodObject<{
        path: z.ZodString;
        message: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        path: string;
        message: string;
    }, {
        path: string;
        message: string;
    }>, "many">;
    warnings: z.ZodArray<z.ZodObject<{
        path: z.ZodString;
        message: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        path: string;
        message: string;
    }, {
        path: string;
        message: string;
    }>, "many">;
    riskScore: z.ZodNumber;
    estimatedTokens: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    valid: boolean;
    errors: {
        path: string;
        message: string;
    }[];
    warnings: {
        path: string;
        message: string;
    }[];
    riskScore: number;
    estimatedTokens: number;
}, {
    valid: boolean;
    errors: {
        path: string;
        message: string;
    }[];
    warnings: {
        path: string;
        message: string;
    }[];
    riskScore: number;
    estimatedTokens: number;
}>;
type ValidationResult = z.infer<typeof ValidationResultSchema>;
interface ToolHandler {
    (inputs: Record<string, unknown>, context: SharedContext): Promise<unknown>;
}
interface ToolRegistry {
    tools: Map<string, ToolDefinition>;
    handlers: Map<string, ToolHandler>;
    register(tool: ToolDefinition, handler: ToolHandler): void;
    get(name: string): {
        tool: ToolDefinition;
        handler: ToolHandler;
    } | undefined;
    has(name: string): boolean;
    list(): ToolDefinition[];
}
interface PTCEvents {
    'pipeline:start': (pipeline: Pipeline, context: SharedContext) => void;
    'pipeline:complete': (result: PipelineResult) => void;
    'pipeline:error': (error: Error, pipeline: Pipeline) => void;
    'step:start': (step: PipelineStep, context: SharedContext) => void;
    'step:complete': (result: StepResult, context: SharedContext) => void;
    'step:error': (error: Error, step: PipelineStep) => void;
    'step:skip': (step: PipelineStep, reason: string) => void;
}
interface PTCConfig {
    maxConcurrency: number;
    defaultTimeout: number;
    maxRetries: number;
    enableAuditLog: boolean;
    sandboxed: boolean;
}
declare const DEFAULT_PTC_CONFIG: PTCConfig;

/**
 * PTC Pipeline Templates
 *
 * Pre-built pipeline templates for common gICM workflows.
 * These templates provide 37% token reduction by batching
 * tool calls into single execution units.
 */

declare const researchAndAnalyze: Pipeline;
declare const swapToken: Pipeline;
declare const contentGeneration: Pipeline;
declare const securityAudit: Pipeline;
declare const portfolioAnalysis: Pipeline;
declare const PIPELINE_TEMPLATES: Record<string, Pipeline>;
declare function getTemplate(id: string): Pipeline | undefined;
declare function listTemplates(): Pipeline[];
declare function listTemplatesByCategory(category: string): Pipeline[];

export { DEFAULT_PTC_CONFIG as D, type PTCEvents as P, type StepResult as S, type ToolDefinition as T, type ValidationResult as V, type PTCConfig as a, type ToolHandler as b, type Pipeline as c, type PipelineResult as d, type PipelineStep as e, type SharedContext as f, type ToolRegistry as g, PipelineSchema as h, PipelineStepSchema as i, ToolDefinitionSchema as j, SharedContextSchema as k, StepResultSchema as l, PipelineResultSchema as m, ValidationResultSchema as n, PIPELINE_TEMPLATES as o, getTemplate as p, listTemplates as q, listTemplatesByCategory as r, researchAndAnalyze as s, swapToken as t, contentGeneration as u, securityAudit as v, portfolioAnalysis as w };
