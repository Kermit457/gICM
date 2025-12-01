#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import { WinTracker } from "./tracker.js";
import type { WinCategory } from "./types.js";

const tracker = new WinTracker();

const program = new Command();

program
  .name("wins")
  .description("gICM Win Tracker - Track wins, streaks, achievements")
  .version("1.0.0");

program
  .command("record")
  .description("Record a win")
  .requiredOption("-c, --category <category>", "Category: money|growth|product|intelligence|agent")
  .requiredOption("-t, --title <title>", "Win title")
  .requiredOption("-v, --value <value>", "Win value", parseFloat)
  .option("-u, --unit <unit>", "Value unit", "count")
  .option("-s, --subcategory <sub>", "Subcategory", "general")
  .option("-d, --description <desc>", "Description")
  .action(async (opts) => {
    const validCategories = ["money", "growth", "product", "intelligence", "agent"];
    if (!validCategories.includes(opts.category)) {
      console.error(chalk.red(`Invalid category. Must be one of: ${validCategories.join(", ")}`));
      process.exit(1);
    }

    const win = await tracker.recordWin({
      category: opts.category as WinCategory,
      subcategory: opts.subcategory,
      title: opts.title,
      description: opts.description,
      value: opts.value,
      unit: opts.unit,
    });

    console.log(chalk.green(`\n  Win recorded! +${win.totalPoints} points\n`));
  });

program
  .command("today")
  .description("Show today's wins")
  .action(async () => {
    const stats = await tracker.getTodayStats();
    const streak = await tracker.getStreak();

    console.log(chalk.bold.yellow(`\n  TODAY'S WINS\n`));
    console.log(chalk.white(`   Total: ${stats.totalWins} wins`));
    console.log(chalk.white(`   Points: ${stats.totalPoints.toLocaleString()}`));
    console.log(chalk.white(`   Streak: ${streak.current} days\n`));

    console.log(chalk.gray("   By Category:"));
    for (const [cat, count] of Object.entries(stats.byCategory)) {
      if (count > 0) {
        const icon = getCategoryIcon(cat as WinCategory);
        console.log(chalk.gray(`   ${icon} ${cat}: ${count}`));
      }
    }

    if (stats.wins.length > 0) {
      console.log(chalk.gray("\n   Recent:"));
      for (const win of stats.wins.slice(-5)) {
        console.log(chalk.cyan(`   - ${win.title} (+${win.totalPoints})`));
      }
    }
    console.log();
  });

program
  .command("stats")
  .description("Show all-time stats")
  .action(async () => {
    const stats = await tracker.getAllTimeStats();

    console.log(chalk.bold.yellow(`\n  ALL-TIME STATS\n`));
    console.log(chalk.white(`   Total Wins: ${stats.totalWins.toLocaleString()}`));
    console.log(chalk.white(`   Total Points: ${stats.totalPoints.toLocaleString()}`));
    console.log(chalk.white(`   Current Streak: ${stats.currentStreak} days`));
    console.log(chalk.white(`   Longest Streak: ${stats.longestStreak} days`));
    console.log(chalk.white(`   Achievements: ${stats.achievements}\n`));

    console.log(chalk.gray("   By Category:"));
    for (const [cat, count] of Object.entries(stats.byCategory)) {
      const icon = getCategoryIcon(cat as WinCategory);
      console.log(chalk.gray(`   ${icon} ${cat}: ${count.toLocaleString()}`));
    }
    console.log();
  });

program
  .command("streak")
  .description("Show streak info")
  .action(async () => {
    const streak = await tracker.getStreak();

    console.log(chalk.bold.yellow(`\n  STREAK INFO\n`));
    console.log(chalk.white(`   Current: ${streak.current} days`));
    console.log(chalk.white(`   Longest: ${streak.longest} days`));
    console.log(chalk.white(`   Multiplier: ${(1 + streak.current * 0.1).toFixed(1)}x`));

    if (streak.current > 0 && streak.startedAt > 0) {
      const started = new Date(streak.startedAt).toLocaleDateString();
      console.log(chalk.gray(`   Started: ${started}`));
    }
    console.log();
  });

program
  .command("achievements")
  .description("Show achievements")
  .action(async () => {
    const all = await tracker.getAchievements();
    const unlocked = await tracker.getUnlockedAchievements();

    console.log(chalk.bold.yellow(`\n  ACHIEVEMENTS (${unlocked.length}/${all.length})\n`));

    for (const achievement of all) {
      const isUnlocked = unlocked.some(u => u.id === achievement.id);
      const status = isUnlocked ? chalk.green("[x]") : chalk.gray("[ ]");
      const rarityColor = getRarityColor(achievement.rarity);
      const name = isUnlocked ? chalk.white(achievement.name) : chalk.gray(achievement.name);

      console.log(`   ${status} ${name} ${rarityColor(`[${achievement.rarity}]`)}`);
      console.log(chalk.gray(`       ${achievement.description} (+${achievement.points} pts)`));
    }
    console.log();
  });

function getCategoryIcon(category: WinCategory): string {
  const icons: Record<WinCategory, string> = {
    money: "$",
    growth: "^",
    product: "*",
    intelligence: "?",
    agent: "@",
  };
  return icons[category] || "-";
}

function getRarityColor(rarity: string) {
  switch (rarity) {
    case "common": return chalk.gray;
    case "rare": return chalk.blue;
    case "epic": return chalk.magenta;
    case "legendary": return chalk.yellow;
    default: return chalk.white;
  }
}

program.parse();
