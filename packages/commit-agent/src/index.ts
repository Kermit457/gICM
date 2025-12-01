/**
 * @gicm/commit-agent
 *
 * AI-powered git commit message generation with full workflow automation
 */

// Core types
export * from "./core/types.js";
export * from "./core/constants.js";

// Git operations
export { GitOperations } from "./git/operations.js";
export { DiffAnalyzer } from "./git/diff-analyzer.js";
export { PRCreator } from "./git/pr-creator.js";

// Message generation
export { MessageGenerator } from "./message/generator.js";

// Main agent
export { CommitAgent } from "./commit-agent.js";
