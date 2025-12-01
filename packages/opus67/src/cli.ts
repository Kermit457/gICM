#!/usr/bin/env node
/**
 * OPUS 67 CLI
 * Command-line interface for the self-evolving AI runtime
 */

import { createOPUS67 } from "./boot.js";
import { readFileSync } from "fs";
import { join } from "path";

const VERSION = "1.0.0";

const HELP = `
╔═══════════════════════════════════════════════════════════════╗
║                        OPUS 67                                 ║
║              Self-Evolving AI Runtime                          ║
╚═══════════════════════════════════════════════════════════════╝

Usage: opus67 <command> [options]

Commands:
  boot [path]       Initialize OPUS 67 for a project
  status            Show current status
  skills            List loaded skills
  mcp               List MCP connections
  analyze           Run pattern analysis
  suggest           Show skill suggestions
  help              Show this help message

Options:
  --version, -v     Show version
  --help, -h        Show help

Examples:
  opus67 boot .                    Boot OPUS 67 in current directory
  opus67 skills                    List all loaded skills
  opus67 analyze                   Analyze interaction patterns
`;

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === "help" || command === "-h" || command === "--help") {
    console.log(HELP);
    return;
  }

  if (command === "--version" || command === "-v") {
    console.log(`OPUS 67 v${VERSION}`);
    return;
  }

  switch (command) {
    case "boot": {
      const projectPath = args[1] || process.cwd();
      console.log(`\n🚪 Initializing OPUS 67 for: ${projectPath}\n`);
      
      try {
        const opus = await createOPUS67(projectPath);
        
        console.log("\n✅ OPUS 67 is ready");
        console.log(`   📁 Files indexed: ${opus.contextStats.totalFiles}`);
        console.log(`   📝 Tokens: ${opus.contextStats.totalTokens}`);
        console.log(`   🧠 Skills loaded: ${opus.loadedSkills.length}`);
        console.log(`   🔌 MCPs connected: ${opus.connectedMCPs.length}`);
        console.log("\n🚪 THE DOOR IS OPEN\n");
      } catch (error) {
        console.error("\n❌ Boot failed:", error);
        process.exit(1);
      }
      break;
    }

    case "status": {
      console.log("\n📊 OPUS 67 Status\n");
      console.log("   Version: " + VERSION);
      console.log("   Status: Ready for boot command");
      console.log("\n   Run 'opus67 boot .' to initialize\n");
      break;
    }

    case "skills": {
      console.log("\n🧠 Skills Registry\n");
      
      try {
        const registryPath = join(process.cwd(), "skills", "registry.yaml");
        const { parse } = await import("yaml");
        const content = readFileSync(registryPath, "utf-8");
        const registry = parse(content);
        
        console.log(`   Total skills: ${registry.skills?.length || 0}`);
        console.log("");
        
        for (const skill of registry.skills || []) {
          const status = skill.priority <= 2 ? "⭐" : "  ";
          console.log(`   ${status} ${skill.id} (${skill.tokens} tokens)`);
        }
        
        console.log("");
      } catch {
        console.log("   No skills registry found. Run 'opus67 boot' first.\n");
      }
      break;
    }

    case "mcp": {
      console.log("\n🔌 MCP Connections\n");
      
      try {
        const configPath = join(process.cwd(), "mcp", "connections.yaml");
        const { parse } = await import("yaml");
        const content = readFileSync(configPath, "utf-8");
        const config = parse(content);
        
        console.log(`   Total connections: ${config.connections?.length || 0}`);
        console.log("");
        
        for (const conn of config.connections || []) {
          const status = conn.status === "ready" ? "✅" : conn.status === "pending" ? "⏳" : "❌";
          console.log(`   ${status} ${conn.id} - ${conn.name}`);
        }
        
        console.log("");
      } catch {
        console.log("   No MCP config found. Run 'opus67 boot' first.\n");
      }
      break;
    }

    case "analyze": {
      console.log("\n🔍 Pattern Analysis\n");
      console.log("   Analysis requires active OPUS 67 instance.");
      console.log("   Run 'opus67 boot' first, then use programmatic API.\n");
      break;
    }

    case "suggest": {
      console.log("\n💡 Skill Suggestions\n");
      console.log("   Suggestions require interaction history.");
      console.log("   Use OPUS 67 for a while, then run analyze.\n");
      break;
    }

    default: {
      console.error(`\n❌ Unknown command: ${command}`);
      console.log("   Run 'opus67 help' for usage information.\n");
      process.exit(1);
    }
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
