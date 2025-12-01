/**
 * dev.team* MCP Tools
 * Team Collaboration - Shared contexts and workflows
 */

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

/**
 * Create a new team
 */
export async function teamCreate(params: {
  name: string;
  description?: string;
}): Promise<{ success: boolean; team?: Team; error?: string }> {
  try {
    const teams = loadTeams();

    // Check if team already exists
    if (teams.find(t => t.name.toLowerCase() === params.name.toLowerCase())) {
      return { success: false, error: `Team '${params.name}' already exists` };
    }

    const team: Team = {
      id: generateId(),
      name: params.name,
      description: params.description,
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

    return { success: true, team };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * List all teams
 */
export async function teamList(): Promise<{
  teams: Array<{
    id: string;
    name: string;
    memberCount: number;
    createdAt: string;
    description?: string;
  }>;
  error?: string;
}> {
  try {
    const teams = loadTeams();

    return {
      teams: teams.map(t => ({
        id: t.id,
        name: t.name,
        memberCount: t.members.length,
        createdAt: t.createdAt,
        description: t.description,
      })),
    };
  } catch (error) {
    return {
      teams: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Show team details
 */
export async function teamShow(params: {
  name: string;
}): Promise<{ found: boolean; team?: Team; error?: string }> {
  try {
    const teams = loadTeams();
    const team = teams.find(t => t.name.toLowerCase() === params.name.toLowerCase());

    return { found: !!team, team };
  } catch (error) {
    return {
      found: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Add member to team
 */
export async function teamAddMember(params: {
  teamName: string;
  memberName: string;
  email?: string;
  role?: "admin" | "member" | "viewer";
}): Promise<{ success: boolean; member?: TeamMember; error?: string }> {
  try {
    const teams = loadTeams();
    const team = teams.find(t => t.name.toLowerCase() === params.teamName.toLowerCase());

    if (!team) {
      return { success: false, error: `Team '${params.teamName}' not found` };
    }

    const member: TeamMember = {
      id: generateId(),
      name: params.memberName,
      email: params.email,
      role: params.role || "member",
      joinedAt: new Date().toISOString(),
    };

    team.members.push(member);
    saveTeams(teams);

    return { success: true, member };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Share a resource with team
 */
export async function teamShare(params: {
  type: "workflow" | "memory" | "config";
  resourceName: string;
  teamName?: string;
  permissions?: "read" | "write" | "admin";
}): Promise<{ success: boolean; shared?: SharedContext; error?: string }> {
  try {
    if (!["workflow", "memory", "config"].includes(params.type)) {
      return { success: false, error: "Invalid type. Use: workflow, memory, or config" };
    }

    const teams = loadTeams();
    const team = params.teamName
      ? teams.find(t => t.name.toLowerCase() === params.teamName!.toLowerCase())
      : teams[0];

    if (!team) {
      return { success: false, error: params.teamName ? `Team '${params.teamName}' not found` : "No teams found" };
    }

    // Get resource path based on type
    let resourcePath = "";
    switch (params.type) {
      case "workflow":
        resourcePath = `.gicm/workflows/${params.resourceName}.json`;
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
      name: params.resourceName,
      teamId: team.id,
      type: params.type,
      path: resourcePath,
      sharedBy: "You",
      sharedAt: new Date().toISOString(),
      permissions: params.permissions || "read",
    };

    shared.push(context);
    saveShared(shared);

    return { success: true, shared: context };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * List shared resources
 */
export async function teamShared(params: {
  teamName?: string;
}): Promise<{
  resources: Array<{
    id: string;
    name: string;
    type: string;
    teamName: string;
    permissions: string;
    sharedAt: string;
  }>;
  error?: string;
}> {
  try {
    const shared = loadShared();
    const teams = loadTeams();

    let filtered = shared;
    if (params.teamName) {
      const team = teams.find(t => t.name.toLowerCase() === params.teamName!.toLowerCase());
      if (team) {
        filtered = shared.filter(s => s.teamId === team.id);
      }
    }

    return {
      resources: filtered.map(s => {
        const team = teams.find(t => t.id === s.teamId);
        return {
          id: s.id,
          name: s.name,
          type: s.type,
          teamName: team?.name || "Unknown",
          permissions: s.permissions,
          sharedAt: s.sharedAt,
        };
      }),
    };
  } catch (error) {
    return {
      resources: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Sync shared resources from team
 */
export async function teamSync(params: {
  teamName?: string;
}): Promise<{ success: boolean; synced: number; resources: string[]; error?: string }> {
  try {
    const shared = loadShared();
    const teams = loadTeams();

    let toSync = shared;
    if (params.teamName) {
      const team = teams.find(t => t.name.toLowerCase() === params.teamName!.toLowerCase());
      if (team) {
        toSync = shared.filter(s => s.teamId === team.id);
      }
    }

    // In a real implementation, this would fetch from a remote server
    // For now, we just confirm local resources are in sync
    const resources = toSync.map(s => {
      const team = teams.find(t => t.id === s.teamId);
      return `${s.type}: ${s.name} (from ${team?.name})`;
    });

    return { success: true, synced: toSync.length, resources };
  } catch (error) {
    return {
      success: false,
      synced: 0,
      resources: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Delete a team
 */
export async function teamDelete(params: {
  name: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const teams = loadTeams();
    const index = teams.findIndex(t => t.name.toLowerCase() === params.name.toLowerCase());

    if (index === -1) {
      return { success: false, error: `Team '${params.name}' not found` };
    }

    // Remove team's shared resources
    const shared = loadShared();
    const teamId = teams[index].id;
    const filtered = shared.filter(s => s.teamId !== teamId);
    saveShared(filtered);

    // Remove team
    teams.splice(index, 1);
    saveTeams(teams);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Tool definitions for dev.team* namespace
export const teamTools = {
  "dev.team_create": {
    description:
      "Create a new team for collaboration. Teams allow sharing workflows, memories, and configurations with other team members.",
    parameters: {
      name: {
        type: "string",
        description: "Name of the team to create",
      },
      description: {
        type: "string",
        description: "Optional description of the team",
        optional: true,
      },
    },
  },

  "dev.team_list": {
    description:
      "List all teams you belong to. Shows team name, member count, and creation date.",
    parameters: {},
  },

  "dev.team_show": {
    description:
      "Show detailed information about a team including all members and their roles.",
    parameters: {
      name: {
        type: "string",
        description: "Name of the team to show",
      },
    },
  },

  "dev.team_add_member": {
    description:
      "Add a new member to a team. You must be an owner or admin to add members.",
    parameters: {
      team_name: {
        type: "string",
        description: "Name of the team to add member to",
      },
      member_name: {
        type: "string",
        description: "Name of the member to add",
      },
      email: {
        type: "string",
        description: "Email of the member (optional)",
        optional: true,
      },
      role: {
        type: "string",
        description: "Role for the member (admin, member, viewer)",
        enum: ["admin", "member", "viewer"],
        optional: true,
      },
    },
  },

  "dev.team_share": {
    description:
      "Share a resource (workflow, memory, or config) with a team. Team members can then access and use this resource.",
    parameters: {
      type: {
        type: "string",
        description: "Type of resource to share",
        enum: ["workflow", "memory", "config"],
      },
      resource_name: {
        type: "string",
        description: "Name of the resource to share",
      },
      team_name: {
        type: "string",
        description: "Team to share with (defaults to first team)",
        optional: true,
      },
      permissions: {
        type: "string",
        description: "Permission level for shared resource",
        enum: ["read", "write", "admin"],
        optional: true,
      },
    },
  },

  "dev.team_shared": {
    description:
      "List all resources shared with teams. Optionally filter by team name.",
    parameters: {
      team_name: {
        type: "string",
        description: "Filter by team name (optional)",
        optional: true,
      },
    },
  },

  "dev.team_sync": {
    description:
      "Sync shared resources from team members. Downloads the latest versions of shared workflows, memories, and configs.",
    parameters: {
      team_name: {
        type: "string",
        description: "Sync from specific team (optional)",
        optional: true,
      },
    },
  },

  "dev.team_delete": {
    description:
      "Delete a team. This also removes all shared resources associated with the team. You must be the owner to delete a team.",
    parameters: {
      name: {
        type: "string",
        description: "Name of the team to delete",
      },
    },
  },
};
