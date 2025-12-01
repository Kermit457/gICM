/**
 * dev.get_context_bundle - Get relevant context for a task
 *
 * Combines semantic search with file context to provide
 * comprehensive code context for a given task description.
 */
interface ContextChunk {
    file: string;
    startLine: number;
    endLine: number;
    content: string;
    relevance: number;
}
interface ContextBundle {
    task: string;
    chunks: ContextChunk[];
    relatedFiles: string[];
    suggestedApproach?: string;
    totalTokens: number;
}
export declare function getContextBundle(task: string, repository?: string, maxChunks?: number, expandContext?: boolean): Promise<ContextBundle>;
export {};
//# sourceMappingURL=context-bundle.d.ts.map