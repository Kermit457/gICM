#!/usr/bin/env node
import {
  GrowthEngine,
  Logger
} from "./chunk-R3ULKJWC.js";

// src/cli.ts
import dotenv from "dotenv";
process.setMaxListeners(20);
dotenv.config();
var logger = new Logger("CLI");
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const engine = new GrowthEngine();
  switch (command) {
    case "start":
      await engine.start();
      logger.info("Growth Engine is running. Press Ctrl+C to stop.");
      process.on("SIGINT", () => {
        engine.stop();
        process.exit(0);
      });
      break;
    case "generate":
      const type = args[1];
      if (!["blog", "tweet", "thread"].includes(type)) {
        logger.error("Usage: growth generate <blog|tweet|thread> [topic]");
        process.exit(1);
      }
      const contentTopic = args.slice(2).join(" ") || void 0;
      const result = await engine.generateNow(type, contentTopic);
      if (result && type === "blog") {
        console.log(`
Blog post created:`);
        console.log(`  Title: ${result.title}`);
        console.log(`  Slug: ${result.slug}`);
        console.log(`  Words: ${result.wordCount}`);
        console.log(`  Saved to: ./content/blog/${result.slug}.mdx`);
      }
      break;
    case "blogs":
      const blogCmd = args[1];
      if (blogCmd === "list") {
        const posts = await engine.getBlogPosts();
        if (posts.length === 0) {
          console.log("\nNo blog posts found.");
        } else {
          console.log(`
=== Blog Posts (${posts.length}) ===
`);
          posts.forEach((p, i) => {
            console.log(`${i + 1}. ${p.title}`);
            console.log(`   Slug: ${p.slug}`);
            console.log(`   Category: ${p.category} | Words: ${p.wordCount}`);
            console.log(`   Created: ${new Date(p.createdAt).toLocaleDateString()}`);
            console.log("");
          });
        }
      } else if (blogCmd === "stats") {
        const stats = await engine.getBlogStats();
        console.log("\n=== Blog Statistics ===\n");
        console.log(`Total posts: ${stats.totalPosts}`);
        console.log(`Total words: ${stats.totalWords.toLocaleString()}`);
        console.log("\nBy category:");
        Object.entries(stats.categories).forEach(([cat, count]) => {
          console.log(`  ${cat}: ${count}`);
        });
      } else {
        console.log(`
Blog Commands:
  growth blogs list     List all blog posts
  growth blogs stats    Show blog statistics
        `);
      }
      break;
    case "keywords":
      const topic = args.slice(1).join(" ") || "AI development tools";
      await engine.researchKeywords(topic);
      break;
    case "status":
      const status = engine.getStatus();
      console.log("\n=== Growth Engine Status ===\n");
      console.log(`Running: ${status.running}`);
      console.log(`Started: ${status.startedAt ? new Date(status.startedAt).toISOString() : "N/A"}`);
      console.log("\nMetrics:");
      console.log(`  Posts published: ${status.metrics.content.postsPublished}`);
      console.log(`  Total views: ${status.metrics.content.totalViews}`);
      console.log(`  Avg engagement: ${status.metrics.content.avgEngagement}%`);
      const upcomingCount = status.upcomingContent.upcoming?.length || 0;
      console.log(`
Upcoming content: ${upcomingCount} items`);
      break;
    case "discord":
      const discordCmd = args[1];
      switch (discordCmd) {
        case "feature":
          const featureName = args[2] || "New Feature";
          const featureDesc = args.slice(3).join(" ") || "A new feature has been added!";
          await engine.announceFeature({ name: featureName, description: featureDesc });
          logger.info(`Announced feature: ${featureName}`);
          break;
        case "update":
          const version = args[2] || "1.0.0";
          const changes = args.slice(3).join(" ").split(",").map((c) => c.trim());
          await engine.announceUpdate(version, changes);
          logger.info(`Announced update: v${version}`);
          break;
        case "members":
          const members = await engine.getDiscordMembers();
          console.log(`Discord members: ${members}`);
          break;
        default:
          console.log(`
Discord Commands:
  growth discord feature <name> <description>   Announce a feature
  growth discord update <version> <changes>     Announce version update
  growth discord members                        Get member count
          `);
      }
      break;
    case "help":
    default:
      console.log(`
gICM Growth Engine CLI

Usage:
  growth start                       Start the engine (runs continuously)
  growth generate <type> [topic]     Generate content (blog, tweet, thread)
  growth blogs list                  List all saved blog posts
  growth blogs stats                 Show blog statistics
  growth keywords <topic>            Research keywords for a topic
  growth discord <cmd>               Discord commands (feature, update, members)
  growth status                      Show engine status
  growth help                        Show this help

Examples:
  growth start
  growth generate blog "Building AI agents with Claude"
  growth generate tweet
  growth blogs list
  growth keywords "claude code"
  growth discord feature "Dark Mode" "Now supports dark mode!"
  growth discord update 2.0.0 "New UI,Better perf,Bug fixes"
      `);
      break;
  }
}
main().catch((error) => {
  logger.error(`CLI error: ${error}`);
  process.exit(1);
});
//# sourceMappingURL=cli.js.map