/**
 * Workflow MCP Tools - Multi-agent workflow orchestration via MCP
 */
import { type WorkflowDefinition, type WorkflowExecution } from "@gicm/workflow-engine";
/**
 * Create a new workflow
 */
export declare function workflowCreate(name: string, options: {
    description?: string;
    template?: string;
    steps?: Array<{
        agent: string;
        input?: Record<string, unknown>;
        dependsOn?: string[];
        condition?: string;
    }>;
    variables?: Record<string, unknown>;
}): Promise<{
    success: boolean;
    workflow?: WorkflowDefinition;
    error?: string;
}>;
/**
 * Run a workflow
 */
export declare function workflowRun(nameOrId: string, options?: {
    input?: Record<string, unknown>;
    dryRun?: boolean;
}): Promise<{
    success: boolean;
    execution?: WorkflowExecution;
    error?: string;
}>;
/**
 * Get workflow execution status
 */
export declare function workflowStatus(id?: string): Promise<{
    success: boolean;
    execution?: WorkflowExecution;
    executions?: WorkflowExecution[];
    error?: string;
}>;
/**
 * List available workflows
 */
export declare function workflowList(): Promise<{
    success: boolean;
    workflows?: WorkflowDefinition[];
    templates?: {
        name: string;
        description: string;
    }[];
    error?: string;
}>;
export declare const workflowTools: {
    "dev.workflow_create": {
        description: string;
        parameters: {
            name: {
                type: string;
                description: string;
            };
            template: {
                type: string;
                description: string;
                optional: boolean;
            };
            description: {
                type: string;
                description: string;
                optional: boolean;
            };
            steps: {
                type: string;
                description: string;
                optional: boolean;
                items: {
                    type: string;
                    properties: {
                        agent: {
                            type: string;
                            description: string;
                        };
                        input: {
                            type: string;
                            description: string;
                        };
                        dependsOn: {
                            type: string;
                            items: {
                                type: string;
                            };
                            description: string;
                        };
                        condition: {
                            type: string;
                            description: string;
                        };
                    };
                };
            };
            variables: {
                type: string;
                description: string;
                optional: boolean;
            };
        };
    };
    "dev.workflow_run": {
        description: string;
        parameters: {
            workflow: {
                type: string;
                description: string;
            };
            input: {
                type: string;
                description: string;
                optional: boolean;
            };
            dry_run: {
                type: string;
                description: string;
                default: boolean;
                optional: boolean;
            };
        };
    };
    "dev.workflow_status": {
        description: string;
        parameters: {
            execution_id: {
                type: string;
                description: string;
                optional: boolean;
            };
        };
    };
    "dev.workflow_list": {
        description: string;
        parameters: {};
    };
};
//# sourceMappingURL=workflow.d.ts.map