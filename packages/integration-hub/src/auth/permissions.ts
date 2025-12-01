/**
 * Permission Definitions & Matrix
 * Phase 9A: Enterprise Security Foundation
 */

import {
  Role,
  ResourceType,
  ActionType,
  Permission,
  ROLE_LEVELS,
} from "./types.js";

// ============================================================================
// PERMISSION DEFINITIONS
// ============================================================================

/**
 * All available permissions in the system.
 * Format: "resource:action"
 */
export const PERMISSIONS = {
  // Organization
  "organization:read": "organization:read",
  "organization:update": "organization:update",
  "organization:delete": "organization:delete",
  "organization:manage": "organization:manage",

  // Pipeline
  "pipeline:create": "pipeline:create",
  "pipeline:read": "pipeline:read",
  "pipeline:update": "pipeline:update",
  "pipeline:delete": "pipeline:delete",
  "pipeline:execute": "pipeline:execute",

  // Schedule
  "schedule:create": "schedule:create",
  "schedule:read": "schedule:read",
  "schedule:update": "schedule:update",
  "schedule:delete": "schedule:delete",

  // Budget
  "budget:create": "budget:create",
  "budget:read": "budget:read",
  "budget:update": "budget:update",
  "budget:delete": "budget:delete",

  // Webhook
  "webhook:create": "webhook:create",
  "webhook:read": "webhook:read",
  "webhook:update": "webhook:update",
  "webhook:delete": "webhook:delete",

  // Marketplace
  "marketplace:read": "marketplace:read",
  "marketplace:create": "marketplace:create",
  "marketplace:update": "marketplace:update",
  "marketplace:delete": "marketplace:delete",

  // Analytics
  "analytics:read": "analytics:read",
  "analytics:export": "analytics:export",

  // Audit
  "audit:read": "audit:read",
  "audit:export": "audit:export",

  // Settings
  "settings:read": "settings:read",
  "settings:update": "settings:update",

  // Members
  "member:read": "member:read",
  "member:update": "member:update",
  "member:delete": "member:delete",

  // Invites
  "invite:create": "invite:create",
  "invite:read": "invite:read",
  "invite:delete": "invite:delete",
} as const;

export type PermissionKey = keyof typeof PERMISSIONS;

// ============================================================================
// ROLE PERMISSION MATRIX
// ============================================================================

/**
 * Permission matrix for each role.
 * Higher roles inherit all permissions from lower roles.
 */
const VIEWER_PERMISSIONS: Permission[] = [
  PERMISSIONS["organization:read"],
  PERMISSIONS["pipeline:read"],
  PERMISSIONS["schedule:read"],
  PERMISSIONS["budget:read"],
  PERMISSIONS["webhook:read"],
  PERMISSIONS["marketplace:read"],
  PERMISSIONS["analytics:read"],
  PERMISSIONS["settings:read"],
  PERMISSIONS["member:read"],
  PERMISSIONS["invite:read"],
];

const EDITOR_PERMISSIONS: Permission[] = [
  ...VIEWER_PERMISSIONS,
  PERMISSIONS["pipeline:create"],
  PERMISSIONS["pipeline:update"],
  PERMISSIONS["pipeline:execute"],
  PERMISSIONS["schedule:create"],
  PERMISSIONS["schedule:update"],
  PERMISSIONS["budget:create"],
  PERMISSIONS["budget:update"],
  PERMISSIONS["webhook:create"],
  PERMISSIONS["webhook:update"],
  PERMISSIONS["marketplace:create"],
];

const ADMIN_PERMISSIONS: Permission[] = [
  ...EDITOR_PERMISSIONS,
  PERMISSIONS["pipeline:delete"],
  PERMISSIONS["schedule:delete"],
  PERMISSIONS["budget:delete"],
  PERMISSIONS["webhook:delete"],
  PERMISSIONS["marketplace:update"],
  PERMISSIONS["marketplace:delete"],
  PERMISSIONS["analytics:export"],
  PERMISSIONS["audit:read"],
  PERMISSIONS["audit:export"],
  PERMISSIONS["settings:update"],
  PERMISSIONS["member:update"],
  PERMISSIONS["member:delete"],
  PERMISSIONS["invite:create"],
  PERMISSIONS["invite:delete"],
];

const OWNER_PERMISSIONS: Permission[] = [
  ...ADMIN_PERMISSIONS,
  PERMISSIONS["organization:update"],
  PERMISSIONS["organization:delete"],
  PERMISSIONS["organization:manage"],
];

/**
 * Role to permissions mapping
 */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  viewer: VIEWER_PERMISSIONS,
  editor: EDITOR_PERMISSIONS,
  admin: ADMIN_PERMISSIONS,
  owner: OWNER_PERMISSIONS,
};

// ============================================================================
// PERMISSION HELPERS
// ============================================================================

/**
 * Build permission string from resource and action
 */
export function buildPermission(resource: ResourceType, action: ActionType): Permission {
  return `${resource}:${action}` as Permission;
}

/**
 * Parse permission string into resource and action
 */
export function parsePermission(permission: Permission): { resource: string; action: string } {
  const [resource, action] = permission.split(":");
  return { resource, action };
}

/**
 * Check if a role has a specific permission
 */
export function roleHasPermission(role: Role, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  return permissions.includes(permission);
}

/**
 * Get all permissions for a role
 */
export function getPermissionsForRole(role: Role): Permission[] {
  return [...ROLE_PERMISSIONS[role]];
}

/**
 * Check if role A is higher than role B
 */
export function isHigherRole(roleA: Role, roleB: Role): boolean {
  return ROLE_LEVELS[roleA] > ROLE_LEVELS[roleB];
}

/**
 * Check if role A is at least as high as role B
 */
export function isAtLeastRole(roleA: Role, roleB: Role): boolean {
  return ROLE_LEVELS[roleA] >= ROLE_LEVELS[roleB];
}

/**
 * Get the minimum role required for a permission
 */
export function getMinRoleForPermission(permission: Permission): Role | null {
  const roles: Role[] = ["viewer", "editor", "admin", "owner"];

  for (const role of roles) {
    if (roleHasPermission(role, permission)) {
      return role;
    }
  }

  return null;
}

/**
 * Merge custom permissions with role permissions
 */
export function mergePermissions(
  role: Role,
  customPermissions?: Permission[]
): Permission[] {
  const basePermissions = getPermissionsForRole(role);

  if (!customPermissions || customPermissions.length === 0) {
    return basePermissions;
  }

  // Merge and deduplicate
  const merged = new Set([...basePermissions, ...customPermissions]);
  return Array.from(merged);
}

/**
 * Get all resources a role can access for a given action
 */
export function getResourcesForAction(role: Role, action: ActionType): ResourceType[] {
  const permissions = ROLE_PERMISSIONS[role];
  const resources: ResourceType[] = [];

  for (const permission of permissions) {
    const { resource, action: permAction } = parsePermission(permission);
    if (permAction === action) {
      resources.push(resource as ResourceType);
    }
  }

  return resources;
}

/**
 * Get all actions a role can perform on a resource
 */
export function getActionsForResource(role: Role, resource: ResourceType): ActionType[] {
  const permissions = ROLE_PERMISSIONS[role];
  const actions: ActionType[] = [];

  for (const permission of permissions) {
    const { resource: permResource, action } = parsePermission(permission);
    if (permResource === resource) {
      actions.push(action as ActionType);
    }
  }

  return actions;
}

// ============================================================================
// PERMISSION GROUPS
// ============================================================================

/**
 * Grouped permissions for UI display
 */
export const PERMISSION_GROUPS = {
  pipelines: {
    label: "Pipelines",
    permissions: [
      { key: "pipeline:create", label: "Create pipelines" },
      { key: "pipeline:read", label: "View pipelines" },
      { key: "pipeline:update", label: "Edit pipelines" },
      { key: "pipeline:delete", label: "Delete pipelines" },
      { key: "pipeline:execute", label: "Execute pipelines" },
    ],
  },
  schedules: {
    label: "Schedules",
    permissions: [
      { key: "schedule:create", label: "Create schedules" },
      { key: "schedule:read", label: "View schedules" },
      { key: "schedule:update", label: "Edit schedules" },
      { key: "schedule:delete", label: "Delete schedules" },
    ],
  },
  budgets: {
    label: "Budgets",
    permissions: [
      { key: "budget:create", label: "Create budgets" },
      { key: "budget:read", label: "View budgets" },
      { key: "budget:update", label: "Edit budgets" },
      { key: "budget:delete", label: "Delete budgets" },
    ],
  },
  webhooks: {
    label: "Webhooks",
    permissions: [
      { key: "webhook:create", label: "Create webhooks" },
      { key: "webhook:read", label: "View webhooks" },
      { key: "webhook:update", label: "Edit webhooks" },
      { key: "webhook:delete", label: "Delete webhooks" },
    ],
  },
  marketplace: {
    label: "Marketplace",
    permissions: [
      { key: "marketplace:read", label: "Browse marketplace" },
      { key: "marketplace:create", label: "Publish templates" },
      { key: "marketplace:update", label: "Edit templates" },
      { key: "marketplace:delete", label: "Delete templates" },
    ],
  },
  analytics: {
    label: "Analytics",
    permissions: [
      { key: "analytics:read", label: "View analytics" },
      { key: "analytics:export", label: "Export analytics" },
    ],
  },
  audit: {
    label: "Audit Logs",
    permissions: [
      { key: "audit:read", label: "View audit logs" },
      { key: "audit:export", label: "Export audit logs" },
    ],
  },
  team: {
    label: "Team Management",
    permissions: [
      { key: "member:read", label: "View members" },
      { key: "member:update", label: "Update member roles" },
      { key: "member:delete", label: "Remove members" },
      { key: "invite:create", label: "Invite members" },
      { key: "invite:read", label: "View invites" },
      { key: "invite:delete", label: "Revoke invites" },
    ],
  },
  organization: {
    label: "Organization",
    permissions: [
      { key: "organization:read", label: "View organization" },
      { key: "organization:update", label: "Edit organization" },
      { key: "organization:delete", label: "Delete organization" },
      { key: "organization:manage", label: "Manage billing & plan" },
      { key: "settings:read", label: "View settings" },
      { key: "settings:update", label: "Edit settings" },
    ],
  },
};

// ============================================================================
// ROLE DESCRIPTIONS
// ============================================================================

export const ROLE_DESCRIPTIONS: Record<Role, { label: string; description: string }> = {
  viewer: {
    label: "Viewer",
    description: "Can view pipelines, schedules, and analytics. Read-only access.",
  },
  editor: {
    label: "Editor",
    description: "Can create and edit pipelines, schedules, and budgets. Cannot delete or manage team.",
  },
  admin: {
    label: "Admin",
    description: "Full access to all features. Can manage team members and settings.",
  },
  owner: {
    label: "Owner",
    description: "Organization owner with full control including billing and organization deletion.",
  },
};
