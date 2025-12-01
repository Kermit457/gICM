/**
 * Workflow MCP Tools - Multi-agent workflow orchestration via MCP
 */
import { WorkflowEngine, listTemplates, getTemplate, } from "@gicm/workflow-engine";
const engine = new WorkflowEngine();
/**
 * Create a new workflow
 */
export async function workflowCreate(name, options) {
    try {
        let input;
        if (options.template) {
            const template = getTemplate(options.template);
            if (!template) {
                return {
                    success: false,
                    error: `Template "${options.template}" not found. Available: ${listTemplates().map((t) => t.name).join(", ")}`,
                };
            }
            input = { ...template, name: name || template.name };
        }
        else if (options.steps && options.steps.length > 0) {
            input = {
                name,
                description: options.description,
                steps: options.steps.map((s) => ({
                    agent: s.agent,
                    input: s.input || {},
                    dependsOn: s.dependsOn,
                    condition: s.condition,
                })),
                variables: options.variables,
            };
        }
        else {
            return {
                success: false,
                error: "Either template or steps must be provided",
            };
        }
        const workflow = await engine.createWorkflow(input);
        return { success: true, workflow };
    }
    catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : String(error),
        };
    }
}
/**
 * Run a workflow
 */
export async function workflowRun(nameOrId, options = {}) {
    try {
        const execution = await engine.runWorkflow({
            workflowName: nameOrId,
            workflowId: nameOrId,
            input: options.input,
            dryRun: options.dryRun,
        });
        return {
            success: execution.status === "completed",
            execution,
            error: execution.error,
        };
    }
    catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : String(error),
        };
    }
}
/**
 * Get workflow execution status
 */
export async function workflowStatus(id) {
    try {
        if (id) {
            const execution = await engine.getExecution(id);
            if (!execution) {
                return { success: false, error: `Execution "${id}" not found` };
            }
            return { success: true, execution };
        }
        else {
            const executions = await engine.listExecutions(undefined, 10);
            return { success: true, executions };
        }
    }
    catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : String(error),
        };
    }
}
/**
 * List available workflows
 */
export async function workflowList() {
    try {
        const workflows = await engine.listWorkflows();
        const templates = listTemplates();
        return { success: true, workflows, templates };
    }
    catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : String(error),
        };
    }
}
// Tool definitions for MCP
export const workflowTools = {
    "dev.workflow_create": {
        description: "Create a new multi-agent workflow from a template or custom step definitions",
        parameters: {
            name: {
                type: "string",
                description: "Name for the workflow",
            },
            template: {
                type: "string",
                description: "Use a built-in template (audit-deploy, research-decide-trade, scan-all-chains)",
                optional: true,
            },
            description: {
                type: "string",
                description: "Workflow description",
                optional: true,
            },
            steps: {
                type: "array",
                description: "Custom workflow steps (required if no template)",
                optional: true,
                items: {
                    type: "object",
                    properties: {
                        agent: { type: "string", description: "Agent ID to execute" },
                        input: { type: "object", description: "Input for the agent" },
                        dependsOn: {
                            type: "array",
                            items: { type: "string" },
                            description: "Step IDs this step depends on",
                        },
                        condition: {
                            type: "string",
                            description: "JavaScript condition expression",
                        },
                    },
                },
            },
            variables: {
                type: "object",
                description: "Shared variables for the workflow",
                optional: true,
            },
        },
    },
    "dev.workflow_run": {
        description: "Execute a workflow by name or ID with optional input variables",
        parameters: {
            workflow: {
                type: "string",
                description: "Workflow name or ID to run",
            },
            input: {
                type: "object",
                description: "Input variables to pass to the workflow",
                optional: true,
            },
            dry_run: {
                type: "boolean",
                description: "Preview execution without running agents",
                default: false,
                optional: true,
            },
        },
    },
    "dev.workflow_status": {
        description: "Get status of a workflow execution or list recent executions",
        parameters: {
            execution_id: {
                type: "string",
                description: "Execution ID to check (omit to list recent)",
                optional: true,
            },
        },
    },
    "dev.workflow_list": {
        description: "List available workflows and built-in templates",
        parameters: {},
    },
};
//# sourceMappingURL=workflow.js.map