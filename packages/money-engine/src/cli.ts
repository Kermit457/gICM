#!/usr/bin/env node
/**
 * gICM Money Engine CLI
 */

import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import { config as dotenvConfig } from "dotenv";
import { MoneyEngine } from "./index.js";
import type { TradingMode } from "./core/types.js";

dotenvConfig();

const program = new Command();

program
  .name("gicm-money")
  .description("gICM Money Engine - Self-funding system")
  .version("1.0.0");

program
  .command("start")
  .description("Start the money engine")
  .option("-m, --mode <mode>", "Trading mode: paper, micro, live", "paper")
  .option("--no-trading", "Disable trading bots")
  .option("--no-autopay", "Disable auto-pay expenses")
  .action(async (options: { mode: string; trading: boolean; autopay: boolean }) => {
    console.log(chalk.cyan.bold("\n💰 gICM Money Engine\n"));

    const engine = new MoneyEngine({
      rpcUrl: process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com",
      tradingMode: options.mode as TradingMode,
      enableTrading: options.trading,
      dcaAmountPerBuy: parseInt(process.env.DCA_AMOUNT_PER_BUY || "10"),
      dcaSchedule: process.env.DCA_SCHEDULE || "0 */4 * * *",
      autoPayExpenses: options.autopay,
    });

    const spinner = ora("Starting money engine...").start();

    try {
      await engine.start();
      spinner.succeed("Money engine started!");

      console.log(chalk.gray("\nPress Ctrl+C to stop\n"));

      process.on("SIGINT", async () => {
        console.log(chalk.yellow("\n\nShutting down..."));
        await engine.stop();
        process.exit(0);
      });

      // Keep process running
      await new Promise(() => {});
    } catch (error) {
      spinner.fail(`Failed to start: ${error}`);
      process.exit(1);
    }
  });

program
  .command("status")
  .description("Show financial status")
  .action(async () => {
    console.log(chalk.cyan.bold("\n💰 gICM Financial Status\n"));

    const engine = new MoneyEngine({
      rpcUrl: process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com",
      tradingMode: "paper",
      enableTrading: false,
    });

    try {
      const status = await engine.getStatus();

      console.log(chalk.white("Treasury:"));
      console.log(chalk.gray("─".repeat(40)));
      console.log(`  SOL Balance:     ${chalk.green(status.treasury?.solBalance || 0)} SOL`);
      console.log(`  USDC Balance:    ${chalk.green("$" + (status.treasury?.usdcBalance || 0))}`);

      console.log();
      console.log(chalk.white("Trading:"));
      console.log(chalk.gray("─".repeat(40)));
      console.log(`  Active:          ${status.trading.active ? chalk.green("Yes") : chalk.yellow("No")}`);
      if (status.trading.performance) {
        console.log(`  Paper PnL:       ${chalk.cyan(status.trading.performance.paper?.totalPnL || 0)}%`);
        console.log(`  Paper Trades:    ${status.trading.performance.paper?.totalTrades || 0}`);
      }

      console.log();
      console.log(chalk.white("Health:"));
      console.log(chalk.gray("─".repeat(40)));
      console.log(`  Runway:          ${chalk.green(status.health.runway)} months`);
      console.log();
    } catch (error) {
      console.log(chalk.red(`Error: ${error}`));
    }
  });

program
  .command("expenses")
  .description("Show expense breakdown")
  .action(async () => {
    console.log(chalk.cyan.bold("\n📤 gICM Expenses\n"));

    // Show demo expenses
    console.log(chalk.white("Monthly Expenses (estimated):"));
    console.log(chalk.gray("─".repeat(40)));
    console.log(`  Claude API:    ${chalk.yellow("$200")}/month`);
    console.log(`  Helius RPC:    ${chalk.yellow("$50")}/month`);
    console.log(`  Vercel Pro:    ${chalk.yellow("$20")}/month`);
    console.log(`  Domain:        ${chalk.yellow("$1.25")}/month`);
    console.log(chalk.gray("─".repeat(40)));
    console.log(`  ${chalk.bold("Total:")}         ${chalk.green("$271.25")}/month`);
    console.log();
  });

program
  .command("trade")
  .description("Trigger manual trade (DCA)")
  .option("-m, --mode <mode>", "Trading mode: paper, micro, live", "paper")
  .action(async (options: { mode: string }) => {
    console.log(chalk.cyan.bold("\n📈 Manual Trade\n"));

    const engine = new MoneyEngine({
      rpcUrl: process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com",
      tradingMode: options.mode as TradingMode,
      enableTrading: true,
      dcaAmountPerBuy: parseInt(process.env.DCA_AMOUNT_PER_BUY || "10"),
      dcaSchedule: "0 0 1 1 *", // Never (manual only)
      autoPayExpenses: false,
    });

    const spinner = ora("Starting engine...").start();

    try {
      await engine.start();
      spinner.text = "Triggering DCA...";

      // Use the trading engine directly
      const tradingEngine = engine.getTradingEngine();
      if (tradingEngine) {
        await tradingEngine.triggerDCA();
        spinner.succeed("Trade executed!");
      } else {
        spinner.warn("Trading engine not available");
      }

      await engine.stop();
    } catch (error) {
      spinner.fail(`Trade failed: ${error}`);
    }
  });

program.parse();
