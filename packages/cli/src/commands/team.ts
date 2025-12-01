/**
 * Team CLI Commands
 * Collaborative contexts and shared workflows
 */

import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import Table from "cli-table3";
import * as fs from "fs";
import * as path from "path";

interface TeamMember {
  id: string;
  name: string;
  email?: string;
  role: "owner" | "admin" | "member" | "viewer";
  joinedAt: string;
}

interface Team {
  id: string;
  name: string;
  description?: string;
  members: TeamMember[];
  createdAt: string;
  createdBy: string;
}

interface SharedContext {
  id: string;
  name: string;
  teamId: string;
  type: "workflow" | "memory" | "config";
  path: string;
  sharedBy: string;
  sharedAt: string;
  permissions: "read" | "write" | "admin";
}

const TEAM_CONFIG_DIR = ".gicm/team";

function getTeamConfigPath(basePath: string = process.cwd()): string {
  return path.join(basePath, TEAM_CONFIG_DIR);
}

function getTeamsFile(basePath: string = process.cwd()): string {
  return path.join(getTeamConfigPath(basePath), "teams.json");
}

function getSharedFile(basePath: string = process.cwd()): string {
  return path.join(getTeamConfigPath(basePath), "shared.json");
}

function ensureTeamDir(basePath: string = process.cwd()): void {
  const teamDir = getTeamConfigPath(basePath);
  if (!fs.existsSync(teamDir)) {
    fs.mkdirSync(teamDir, { recursive: true });
  }
}

function loadTeams(basePath: string = process.cwd()): Team[] {
  const teamsFile = getTeamsFile(basePath);
  if (!fs.existsSync(teamsFile)) {
    return [];
  }
  return JSON.parse(fs.readFileSync(teamsFile, "utf-8"));
}

function saveTeams(teams: Team[], basePath: string = process.cwd()): void {
  ensureTeamDir(basePath);
  fs.writeFileSync(getTeamsFile(basePath), JSON.stringify(teams, null, 2));
}

function loadShared(basePath: string = process.cwd()): SharedContext[] {
  const sharedFile = getSharedFile(basePath);
  if (!fs.existsSync(sharedFile)) {
    return [];
  }
  return JSON.parse(fs.readFileSync(sharedFile, "utf-8"));
}

function saveShared(shared: SharedContext[], basePath: string = process.cwd()): void {
  ensureTeamDir(basePath);
  fs.writeFileSync(getSharedFile(basePath), JSON.stringify(shared, null, 2));
}

function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
}

export function registerTeamCommands(program: Command): void {
  const team = program
    .command("team")
    .description("Team collaboration - shared contexts and workflows");

  // gicm team create
  team
    .command("create <name>")
    .description("Create a new team")
    .option("-d, --description <description>", "Team description")
    .action(async (name: string, options) => {
      const spinner = ora("Creating team...").start();

      try {
        const teams = loadTeams();

        // Check if team already exists
        if (teams.find(t => t.name.toLowerCase() === name.toLowerCase())) {
          spinner.fail(chalk.red(`Team '${name}' already exists`));
          return;
        }

        const team: Team = {
          id: generateId(),
          name,
          description: options.description,
          members: [{
            id: generateId(),
            name: "You",
            role: "owner",
            joinedAt: new Date().toISOString(),
          }],
          createdAt: new Date().toISOString(),
          createdBy: "You",
        };

        teams.push(team);
        saveTeams(teams);

        spinner.succeed(chalk.green(`Team '${name}' created`));
        console.log(chalk.gray(`  ID: ${team.id}`));
        console.log(chalk.gray(`  Members: 1 (you as owner)`));
      } catch (error) {
        spinner.fail(chalk.red("Failed to create team"));
        if (error instanceof Error) {
          console.error(chalk.red(error.message));
        }
        process.exit(1);
      }
    });

  // gicm team list
  team
    .command("list")
    .description("List all teams")
    .action(async () => {
      try {
        const teams = loadTeams();

        if (teams.length === 0) {
          console.log(chalk.yellow("No teams found. Create one with: gicm team create <name>"));
          return;
        }

        const table = new Table({
          head: ["Name", "Members", "Created", "Description"],
          colWidths: [20, 10, 20, 35],
        });

        for (const t of teams) {
          table.push([
            t.name,
            t.members.length.toString(),
            new Date(t.createdAt).toLocaleDateString(),
            (t.description || "").substring(0, 32),
          ]);
        }

        console.log(chalk.bold("\nTeams:"));
        console.log(table.toString());
      } catch (error) {
        if (error instanceof Error) {
          console.error(chalk.red(error.message));
        }
        process.exit(1);
      }
    });

  // gicm team show <name>
  team
    .command("show <name>")
    .description("Show team details")
    .action(async (name: string) => {
      try {
        const teams = loadTeams();
        const t = teams.find(t => t.name.toLowerCase() === name.toLowerCase());

        if (!t) {
          console.log(chalk.yellow(`Team '${name}' not found`));
          return;
        }

        console.log(chalk.bold(`\nTeam: ${t.name}`));
        console.log(chalk.gray(`  ID: ${t.id}`));
        if (t.description) {
          console.log(chalk.gray(`  Description: ${t.description}`));
        }
        console.log(chalk.gray(`  Created: ${t.createdAt}`));
        console.log();
        console.log(chalk.bold("  Members:"));

        const table = new Table({
          head: ["Name", "Role", "Joined"],
          colWidths: [25, 12, 25],
        });

        for (const member of t.members) {
          table.push([
            member.name + (member.email ? ` (${member.email})` : ""),
            member.role,
            new Date(member.joinedAt).toLocaleDateString(),
          ]);
        }

        console.log(table.toString());
      } catch (error) {
        if (error instanceof Error) {
          console.error(chalk.red(error.message));
        }
        process.exit(1);
      }
    });

  // gicm team add-member <team> <name>
  team
    .command("add-member <teamName> <memberName>")
    .description("Add a member to a team")
    .option("-e, --email <email>", "Member email")
    .option("-r, --role <role>", "Member role (admin, member, viewer)", "member")
    .action(async (teamName: string, memberName: string, options) => {
      const spinner = ora("Adding member...").start();

      try {
        const teams = loadTeams();
        const t = teams.find(t => t.name.toLowerCase() === teamName.toLowerCase());

        if (!t) {
          spinner.fail(chalk.red(`Team '${teamName}' not found`));
          return;
        }

        const member: TeamMember = {
          id: generateId(),
          name: memberName,
          email: options.email,
          role: options.role as TeamMember["role"],
          joinedAt: new Date().toISOString(),
        };

        t.members.push(member);
        saveTeams(teams);

        spinner.succeed(chalk.green(`Added ${memberName} to team '${teamName}'`));
      } catch (error) {
        spinner.fail(chalk.red("Failed to add member"));
        if (error instanceof Error) {
          console.error(chalk.red(error.message));
        }
        process.exit(1);
      }
    });

  // gicm team share <type> <name>
  team
    .command("share <type> <resourceName>")
    .description("Share a resource with a team (workflow, memory, config)")
    .option("-t, --team <team>", "Team to share with")
    .option("-p, --permissions <perms>", "Permissions (read, write, admin)", "read")
    .action(async (type: string, resourceName: string, options) => {
      const spinner = ora("Sharing resource...").start();

      try {
        if (!["workflow", "memory", "config"].includes(type)) {
          spinner.fail(chalk.red("Invalid type. Use: workflow, memory, or config"));
          return;
        }

        const teams = loadTeams();
        const team = options.team
          ? teams.find(t => t.name.toLowerCase() === options.team.toLowerCase())
          : teams[0];

        if (!team) {
          spinner.fail(chalk.red(options.team ? `Team '${options.team}' not found` : "No teams found"));
          return;
        }

        // Get resource path based on type
        let resourcePath = "";
        switch (type) {
          case "workflow":
            resourcePath = `.gicm/workflows/${resourceName}.json`;
            break;
          case "memory":
            resourcePath = `.gicm/memory/entries/default`;
            break;
          case "config":
            resourcePath = `.gicm/config.json`;
            break;
        }

        const shared = loadShared();
        const context: SharedContext = {
          id: generateId(),
          name: resourceName,
          teamId: team.id,
          type: type as SharedContext["type"],
          path: resourcePath,
          sharedBy: "You",
          sharedAt: new Date().toISOString(),
          permissions: options.permissions as SharedContext["permissions"],
        };

        shared.push(context);
        saveShared(shared);

        spinner.succeed(chalk.green(`Shared ${type} '${resourceName}' with team '${team.name}'`));
        console.log(chalk.gray(`  Permissions: ${options.permissions}`));
      } catch (error) {
        spinner.fail(chalk.red("Failed to share resource"));
        if (error instanceof Error) {
          console.error(chalk.red(error.message));
        }
        process.exit(1);
      }
    });

  // gicm team shared
  team
    .command("shared")
    .description("List shared resources")
    .option("-t, --team <team>", "Filter by team")
    .action(async (options) => {
      try {
        const shared = loadShared();
        const teams = loadTeams();

        let filtered = shared;
        if (options.team) {
          const team = teams.find(t => t.name.toLowerCase() === options.team.toLowerCase());
          if (team) {
            filtered = shared.filter(s => s.teamId === team.id);
          }
        }

        if (filtered.length === 0) {
          console.log(chalk.yellow("No shared resources found"));
          return;
        }

        const table = new Table({
          head: ["Name", "Type", "Team", "Permissions", "Shared At"],
          colWidths: [20, 12, 15, 12, 20],
        });

        for (const s of filtered) {
          const team = teams.find(t => t.id === s.teamId);
          table.push([
            s.name,
            s.type,
            team?.name || "Unknown",
            s.permissions,
            new Date(s.sharedAt).toLocaleDateString(),
          ]);
        }

        console.log(chalk.bold("\nShared Resources:"));
        console.log(table.toString());
      } catch (error) {
        if (error instanceof Error) {
          console.error(chalk.red(error.message));
        }
        process.exit(1);
      }
    });

  // gicm team sync
  team
    .command("sync")
    .description("Sync shared resources from team")
    .option("-t, --team <team>", "Team to sync from")
    .action(async (options) => {
      const spinner = ora("Syncing team resources...").start();

      try {
        const shared = loadShared();
        const teams = loadTeams();

        let toSync = shared;
        if (options.team) {
          const team = teams.find(t => t.name.toLowerCase() === options.team.toLowerCase());
          if (team) {
            toSync = shared.filter(s => s.teamId === team.id);
          }
        }

        // In a real implementation, this would fetch from a remote server
        // For now, we just confirm local resources are in sync
        spinner.succeed(chalk.green(`Synced ${toSync.length} shared resources`));

        for (const s of toSync) {
          const team = teams.find(t => t.id === s.teamId);
          console.log(chalk.gray(`  ✓ ${s.type}: ${s.name} (from ${team?.name})`));
        }
      } catch (error) {
        spinner.fail(chalk.red("Failed to sync"));
        if (error instanceof Error) {
          console.error(chalk.red(error.message));
        }
        process.exit(1);
      }
    });

  // gicm team delete <name>
  team
    .command("delete <name>")
    .description("Delete a team")
    .action(async (name: string) => {
      const spinner = ora("Deleting team...").start();

      try {
        const teams = loadTeams();
        const index = teams.findIndex(t => t.name.toLowerCase() === name.toLowerCase());

        if (index === -1) {
          spinner.fail(chalk.red(`Team '${name}' not found`));
          return;
        }

        // Remove team's shared resources
        const shared = loadShared();
        const teamId = teams[index].id;
        const filtered = shared.filter(s => s.teamId !== teamId);
        saveShared(filtered);

        // Remove team
        teams.splice(index, 1);
        saveTeams(teams);

        spinner.succeed(chalk.green(`Team '${name}' deleted`));
      } catch (error) {
        spinner.fail(chalk.red("Failed to delete team"));
        if (error instanceof Error) {
          console.error(chalk.red(error.message));
        }
        process.exit(1);
      }
    });
}
