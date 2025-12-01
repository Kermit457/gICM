/**
 * dev.team* MCP Tools
 * Team Collaboration - Shared contexts and workflows
 */
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
/**
 * Create a new team
 */
export declare function teamCreate(params: {
    name: string;
    description?: string;
}): Promise<{
    success: boolean;
    team?: Team;
    error?: string;
}>;
/**
 * List all teams
 */
export declare function teamList(): Promise<{
    teams: Array<{
        id: string;
        name: string;
        memberCount: number;
        createdAt: string;
        description?: string;
    }>;
    error?: string;
}>;
/**
 * Show team details
 */
export declare function teamShow(params: {
    name: string;
}): Promise<{
    found: boolean;
    team?: Team;
    error?: string;
}>;
/**
 * Add member to team
 */
export declare function teamAddMember(params: {
    teamName: string;
    memberName: string;
    email?: string;
    role?: "admin" | "member" | "viewer";
}): Promise<{
    success: boolean;
    member?: TeamMember;
    error?: string;
}>;
/**
 * Share a resource with team
 */
export declare function teamShare(params: {
    type: "workflow" | "memory" | "config";
    resourceName: string;
    teamName?: string;
    permissions?: "read" | "write" | "admin";
}): Promise<{
    success: boolean;
    shared?: SharedContext;
    error?: string;
}>;
/**
 * List shared resources
 */
export declare function teamShared(params: {
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
}>;
/**
 * Sync shared resources from team
 */
export declare function teamSync(params: {
    teamName?: string;
}): Promise<{
    success: boolean;
    synced: number;
    resources: string[];
    error?: string;
}>;
/**
 * Delete a team
 */
export declare function teamDelete(params: {
    name: string;
}): Promise<{
    success: boolean;
    error?: string;
}>;
export declare const teamTools: {
    "dev.team_create": {
        description: string;
        parameters: {
            name: {
                type: string;
                description: string;
            };
            description: {
                type: string;
                description: string;
                optional: boolean;
            };
        };
    };
    "dev.team_list": {
        description: string;
        parameters: {};
    };
    "dev.team_show": {
        description: string;
        parameters: {
            name: {
                type: string;
                description: string;
            };
        };
    };
    "dev.team_add_member": {
        description: string;
        parameters: {
            team_name: {
                type: string;
                description: string;
            };
            member_name: {
                type: string;
                description: string;
            };
            email: {
                type: string;
                description: string;
                optional: boolean;
            };
            role: {
                type: string;
                description: string;
                enum: string[];
                optional: boolean;
            };
        };
    };
    "dev.team_share": {
        description: string;
        parameters: {
            type: {
                type: string;
                description: string;
                enum: string[];
            };
            resource_name: {
                type: string;
                description: string;
            };
            team_name: {
                type: string;
                description: string;
                optional: boolean;
            };
            permissions: {
                type: string;
                description: string;
                enum: string[];
                optional: boolean;
            };
        };
    };
    "dev.team_shared": {
        description: string;
        parameters: {
            team_name: {
                type: string;
                description: string;
                optional: boolean;
            };
        };
    };
    "dev.team_sync": {
        description: string;
        parameters: {
            team_name: {
                type: string;
                description: string;
                optional: boolean;
            };
        };
    };
    "dev.team_delete": {
        description: string;
        parameters: {
            name: {
                type: string;
                description: string;
            };
        };
    };
};
export {};
//# sourceMappingURL=team.d.ts.map