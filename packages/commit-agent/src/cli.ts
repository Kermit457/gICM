#!/usr/bin/env node
/**
 * Commit Agent CLI
 *
 * Standalone CLI for the commit agent
 */

import { CommitAgent } from "./commit-agent.js";

const HELP = `
@gicm/commit-agent - AI-powered git commit workflow

Usage:
  gicm-commit [command] [options]

Commands:
  status              Show git status with risk assessment
  generate            Generate commit message from staged changes
  commit              Create commit with AI-generated message
  push                Push to remote
  pr                  Create pull request

Options:
  -a, --all           Stage all changes before commit
  -m, --message <msg> Override AI-generated message
  -p, --push          Push after commit
  --pr                Create PR after push
  --dry-run           Preview without executing
  --amend             Amend previous commit
  -v, --verbose       Verbose output
  -h, --help          Show this help

Examples:
  gicm-commit status
  gicm-commit generate
  gicm-commit commit -a -p
  gicm-commit commit -a -p --pr
  gicm-commit commit -m "fix: resolve null check"
`;

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("-h") || args.includes("--help") || args.length === 0) {
    console.log(HELP);
    process.exit(0);
  }

  const command = args[0];
  const flags = new Set(args.slice(1));

  const verbose = flags.has("-v") || flags.has("--verbose");
  const dryRun = flags.has("--dry-run");
  const all = flags.has("-a") || flags.has("--all");
  const push = flags.has("-p") || flags.has("--push");
  const createPr = flags.has("--pr");
  const amend = flags.has("--amend");

  // Extract message if provided
  let message: string | undefined;
  const messageIndex = args.findIndex((a) => a === "-m" || a === "--message");
  if (messageIndex !== -1 && args[messageIndex + 1]) {
    message = args[messageIndex + 1];
  }

  const agent = new CommitAgent({
    apiKey: process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY,
    verbose,
  });

  try {
    switch (command) {
      case "status": {
        const status = await agent.getStatus();
        const risk = status.isClean ? null : await agent.assessRisk();

        console.log(`\nBranch: ${status.branch}`);
        console.log(`Status: ${status.isClean ? "Clean" : "Has changes"}`);

        if (!status.isClean) {
          console.log(`\nStaged (${status.staged.length}):`);
          status.staged.forEach((f) => console.log(`  ${f.type}: ${f.path}`));

          console.log(`\nUnstaged (${status.unstaged.length}):`);
          status.unstaged.forEach((f) => console.log(`  ${f.type}: ${f.path}`));

          console.log(`\nUntracked (${status.untracked.length}):`);
          status.untracked.forEach((f) => console.log(`  ${f}`));

          if (risk) {
            console.log(`\nRisk Score: ${risk.totalScore}/100`);
            console.log(`Recommendation: ${risk.recommendation}`);
          }
        }
        break;
      }

      case "generate": {
        console.log("Analyzing changes...");
        const generated = await agent.generateMessage();

        console.log(`\nGenerated Message (confidence: ${Math.round(generated.confidence * 100)}%):`);
        console.log("---");
        console.log(generated.fullText);
        console.log("---");
        console.log(`\nReasoning: ${generated.reasoning}`);
        break;
      }

      case "commit": {
        console.log("Creating commit...");
        const result = await agent.commit({
          all,
          push,
          createPr,
          message,
          dryRun,
          amend,
        });

        if (!result.success) {
          console.error(`\nError: ${result.error}`);
          if (result.approvalRequired) {
            console.log(`Risk score: ${result.riskScore}`);
            console.log("This commit requires manual approval.");
          }
          process.exit(1);
        }

        if (dryRun) {
          console.log("\n[DRY RUN] Would commit with message:");
          console.log("---");
          console.log(result.message?.fullText);
          console.log("---");
        } else {
          console.log(`\nCommit created: ${result.commitHash?.substring(0, 7)}`);
          if (result.pushed) {
            console.log("Pushed to remote");
          }
          if (result.prUrl) {
            console.log(`PR created: ${result.prUrl}`);
          }
        }
        break;
      }

      case "push": {
        console.log("Pushing to remote...");
        const result = await agent.push({ setUpstream: true });

        if (!result.success) {
          console.error(`Error: ${result.error}`);
          process.exit(1);
        }

        console.log(`Pushed to ${result.remote}/${result.branch}`);
        break;
      }

      case "pr": {
        console.log("Creating pull request...");
        const result = await agent.createPR({ dryRun });

        if (!result.success) {
          console.error(`Error: ${result.error}`);
          process.exit(1);
        }

        if (result.url) {
          console.log(`PR created: ${result.url}`);
        }
        break;
      }

      default:
        console.error(`Unknown command: ${command}`);
        console.log(HELP);
        process.exit(1);
    }
  } catch (error) {
    console.error(`Error: ${(error as Error).message}`);
    process.exit(1);
  }
}

main();
