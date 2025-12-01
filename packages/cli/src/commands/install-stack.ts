/**
 * Install Stack command - Install a complete stack from marketplace
 *
 * Usage: gicm install-stack <stackId>
 * Example: gicm install-stack ptc-tool-search-stack
 */

import chalk from "chalk";
import ora from "ora";
import { GICMAPIClient } from "../lib/api";
import { FileWriter } from "../lib/files";
import { UniversalBridge } from "../lib/bridge";
import type { CLIOptions, RegistryItem, Platform, StackResponse, StackListResponse } from "../lib/types";

export interface InstallStackOptions extends CLIOptions {
  list?: boolean;
}

/**
 * Install stack command handler
 */
export async function installStackCommand(
  stackId: string | undefined,
  options: InstallStackOptions = {}
): Promise<void> {
  const apiClient = new GICMAPIClient(options.apiUrl);
  const platform = (options.platform || "claude") as Platform;
  const fileWriter = new FileWriter(undefined, platform);

  const platformNames: Record<Platform, string> = {
    claude: "Claude",
    gemini: "Gemini",
    openai: "OpenAI",
  };

  // List mode - show all available stacks
  if (options.list || !stackId) {
    await listStacks(apiClient);
    return;
  }

  // Ensure config directory exists
  try {
    await fileWriter.ensureConfigDir();
  } catch (error) {
    process.exit(1);
  }

  const spinner = ora({
    text: `Fetching stack "${stackId}"...`,
    color: "cyan",
  }).start();

  try {
    // Fetch stack from API
    const stackData = await apiClient.getStack(stackId);

    if (stackData.missingItems.length > 0) {
      spinner.warn(
        chalk.yellow(
          `Stack has ${stackData.missingItems.length} missing items: ${stackData.missingItems.join(", ")}`
        )
      );
    }

    spinner.succeed(
      chalk.green(`Found stack: ${stackData.stack.name}`) +
        chalk.gray(` (${stackData.items.length} items)`)
    );

    // Display stack info
    console.log(chalk.cyan(`\n${chalk.bold("Stack Details:")}`));
    console.log(`  ${chalk.bold("Name:")} ${stackData.stack.name}`);
    console.log(`  ${chalk.bold("Description:")} ${stackData.stack.description}`);
    console.log(`  ${chalk.bold("Tags:")} ${stackData.stack.tags.join(", ")}`);
    console.log(`  ${chalk.bold("Version:")} ${stackData.stack.version}`);

    if (stackData.stack.featured) {
      console.log(chalk.yellow(`  ⭐ Featured Stack`));
    }

    // Show items by kind
    console.log(chalk.cyan(`\n${chalk.bold("Items to install for")} ${chalk.bold(platformNames[platform])}:`));

    const byKind = {
      agent: stackData.items.filter((i) => i.kind === "agent"),
      skill: stackData.items.filter((i) => i.kind === "skill"),
      command: stackData.items.filter((i) => i.kind === "command"),
      mcp: stackData.items.filter((i) => i.kind === "mcp"),
      setting: stackData.items.filter((i) => i.kind === "setting"),
      workflow: stackData.items.filter((i) => i.kind === "workflow"),
    };

    for (const [kind, kindItems] of Object.entries(byKind)) {
      if (kindItems.length > 0) {
        console.log(chalk.bold(`\n  ${kind.toUpperCase()}S (${kindItems.length}):`));
        kindItems.forEach((item) => {
          const prefix = chalk.green("●");
          const name = chalk.white(item.name);
          const desc = chalk.gray(
            `- ${item.description.slice(0, 55)}${item.description.length > 55 ? "..." : ""}`
          );
          console.log(`  ${prefix} ${name}`);
          console.log(`    ${desc}`);
        });
      }
    }

    // Show stats
    if (stackData.stats.tokenSavings > 0) {
      console.log(chalk.yellow(`\n💡 Combined token savings: ~${stackData.stats.tokenSavings}%`));
    }

    // Confirm installation (unless --yes flag)
    if (!options.skipConfirm) {
      console.log(chalk.cyan(`\nPress Ctrl+C to cancel, or waiting 2 seconds to continue...`));
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    // Install all items
    const installSpinner = ora({
      text: "Installing stack items...",
      color: "green",
    }).start();

    let installedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    for (const item of stackData.items) {
      try {
        // Download files
        const files = await apiClient.getFiles(item.slug);

        // Apply Universal Bridge Logic for non-Claude platforms
        const bridgedFiles = files.map((file) => {
          if (file.path.endsWith(".md") && platform !== "claude") {
            if (!file.content.includes("AETHER BRIDGE: ADAPTER ACTIVE")) {
              const bridgedContent = UniversalBridge.bridgePrompt(file.content, {
                sourcePlatform: "claude",
                targetPlatform: platform,
                agentName: item.name,
              });
              return { ...file, content: bridgedContent };
            }
          }
          return file;
        });

        // Write files
        await fileWriter.writeItem(item, bridgedFiles);

        installedCount++;
        installSpinner.text = `Installing... (${installedCount}/${stackData.items.length}) - ${item.name}`;
      } catch (error) {
        const errMsg = (error as Error).message;
        // Some items may not have files (like MCPs that are just config)
        if (errMsg.includes("404") || errMsg.includes("not found")) {
          skippedCount++;
          if (options.verbose) {
            installSpinner.text = `Skipping ${item.slug} (no files)...`;
          }
        } else {
          errors.push(`${item.slug}: ${errMsg}`);
        }
      }
    }

    if (errors.length > 0) {
      installSpinner.warn(
        chalk.yellow(`Installed ${installedCount} items with ${errors.length} errors`)
      );
      console.log(chalk.red("\nErrors:"));
      errors.forEach((e) => console.log(chalk.gray(`  - ${e}`)));
    } else {
      installSpinner.succeed(
        chalk.green(`Successfully installed ${installedCount} items!`) +
          (skippedCount > 0 ? chalk.gray(` (${skippedCount} skipped - no files)`) : "")
      );
    }

    // Show summary
    console.log(chalk.green("\n✓ Stack installation complete!\n"));
    console.log(chalk.cyan("Installed items:"));
    console.log(`  ${chalk.bold("Agents:")}    ${stackData.stats.byKind.agent}`);
    console.log(`  ${chalk.bold("Skills:")}    ${stackData.stats.byKind.skill}`);
    console.log(`  ${chalk.bold("Commands:")}  ${stackData.stats.byKind.command}`);
    console.log(`  ${chalk.bold("MCPs:")}      ${stackData.stats.byKind.mcp}`);
    if (stackData.stats.byKind.setting) {
      console.log(`  ${chalk.bold("Settings:")}  ${stackData.stats.byKind.setting}`);
    }
    if (stackData.stats.byKind.workflow) {
      console.log(`  ${chalk.bold("Workflows:")} ${stackData.stats.byKind.workflow}`);
    }

    // Show MCP configuration note for Claude
    const mcps = stackData.items.filter((i) => i.kind === "mcp");
    if (mcps.length > 0 && platform === "claude") {
      console.log(chalk.yellow("\n⚠️  MCP servers may require configuration:"));
      mcps.forEach((mcp) => {
        if (mcp.envKeys && mcp.envKeys.length > 0) {
          console.log(chalk.gray(`\n  ${mcp.name}:`));
          console.log(chalk.gray(`    Configure: .claude/mcp/${mcp.slug}.json`));
          console.log(chalk.gray(`    Required: ${mcp.envKeys.join(", ")}`));
        }
      });
    }

    console.log(
      chalk.gray(`\n💡 Tip: Reload your ${platformNames[platform]} editor to see the new items.\n`)
    );
    console.log(
      chalk.cyan(
        `📚 Documentation: https://gicm-marketplace.vercel.app/docs/stacks/${stackId}\n`
      )
    );
  } catch (error) {
    spinner.fail(chalk.red("Stack installation failed"));
    console.error(chalk.red(`\n${(error as Error).message}\n`));
    process.exit(1);
  }
}

/**
 * List all available stacks
 */
async function listStacks(apiClient: GICMAPIClient): Promise<void> {
  const spinner = ora({
    text: "Fetching available stacks...",
    color: "cyan",
  }).start();

  try {
    const data = await apiClient.listStacks();

    spinner.succeed(chalk.green(`Found ${data.total} stacks`));

    console.log(chalk.cyan("\nAvailable Stacks:\n"));

    for (const stack of data.stacks) {
      const featured = stack.featured ? chalk.yellow(" ⭐") : "";
      console.log(chalk.bold(`  ${stack.name}${featured}`));
      console.log(chalk.gray(`    ID: ${stack.id}`));
      console.log(chalk.gray(`    ${stack.description}`));
      console.log(chalk.gray(`    Items: ${stack.itemCount} | Tags: ${stack.tags.join(", ")}`));
      console.log("");
    }

    console.log(chalk.cyan("Install a stack with:"));
    console.log(chalk.white("  npx @gicm/cli install-stack <stack-id>\n"));
    console.log(chalk.gray("Example:"));
    console.log(chalk.white("  npx @gicm/cli install-stack ptc-tool-search-stack\n"));
  } catch (error) {
    spinner.fail(chalk.red("Failed to fetch stacks"));
    console.error(chalk.red(`\n${(error as Error).message}\n`));
    process.exit(1);
  }
}
