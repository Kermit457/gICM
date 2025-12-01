/**
 * Multi-Tenancy & RBAC - Type Definitions
 * Phase 9A: Enterprise Security Foundation
 */

import { z } from "zod";

// ============================================================================
// ROLES & PERMISSIONS
// ============================================================================

// Role hierarchy: Owner > Admin > Editor > Viewer
export const RoleSchema = z.enum(["owner", "admin", "editor", "viewer"]);
export type Role = z.infer<typeof RoleSchema>;

// Permission format: resource:action
export const PermissionSchema = z.string().regex(/^[a-z_]+:[a-z_]+$/);
export type Permission = z.infer<typeof PermissionSchema>;

// Resource types
export const ResourceTypeSchema = z.enum([
  "organization",
  "pipeline",
  "schedule",
  "budget",
  "webhook",
  "marketplace",
  "analytics",
  "audit",
  "settings",
  "member",
  "invite",
]);
export type ResourceType = z.infer<typeof ResourceTypeSchema>;

// Action types
export const ActionTypeSchema = z.enum([
  "create",
  "read",
  "update",
  "delete",
  "execute",
  "manage",
  "invite",
  "export",
]);
export type ActionType = z.infer<typeof ActionTypeSchema>;

// ============================================================================
// ORGANIZATION
// ============================================================================

// Organization plan tiers
export const OrgPlanSchema = z.enum(["free", "pro", "enterprise"]);
export type OrgPlan = z.infer<typeof OrgPlanSchema>;

// Organization settings
export const OrgSettingsSchema = z.object({
  // Branding
  logoUrl: z.string().url().optional(),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),

  // Limits (based on plan)
  maxPipelines: z.number().int().positive().default(10),
  maxMembers: z.number().int().positive().default(5),
  maxSchedules: z.number().int().positive().default(5),
  maxBudgets: z.number().int().positive().default(3),

  // Features
  auditLogRetentionDays: z.number().int().min(7).default(30),
  apiRateLimit: z.number().int().positive().default(100),
  webhooksEnabled: z.boolean().default(true),
  ssoEnabled: z.boolean().default(false),

  // Notifications
  notifyOnBudgetAlert: z.boolean().default(true),
  notifyOnPipelineFailure: z.boolean().default(true),
  notifyOnNewMember: z.boolean().default(true),
});
export type OrgSettings = z.infer<typeof OrgSettingsSchema>;

// Organization schema
export const OrganizationSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  slug: z.string().regex(/^[a-z0-9-]+$/).min(3).max(50),
  description: z.string().max(500).optional(),

  // Plan & billing
  plan: OrgPlanSchema.default("free"),
  billingEmail: z.string().email().optional(),
  stripeCustomerId: z.string().optional(),

  // Settings
  settings: OrgSettingsSchema.default({}),

  // Metadata
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().uuid(),
});
export type Organization = z.infer<typeof OrganizationSchema>;

// Create organization input
export const CreateOrgSchema = OrganizationSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial({
  settings: true,
  plan: true,
});
export type CreateOrg = z.infer<typeof CreateOrgSchema>;

// Update organization input
export const UpdateOrgSchema = OrganizationSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
}).partial();
export type UpdateOrg = z.infer<typeof UpdateOrgSchema>;

// ============================================================================
// MEMBERS
// ============================================================================

// Member status
export const MemberStatusSchema = z.enum(["active", "suspended", "removed"]);
export type MemberStatus = z.infer<typeof MemberStatusSchema>;

// Organization member
export const OrgMemberSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  userId: z.string().uuid(),

  // Role & permissions
  role: RoleSchema,
  customPermissions: z.array(PermissionSchema).optional(), // Override role permissions

  // User info (denormalized for display)
  email: z.string().email(),
  displayName: z.string().optional(),
  avatarUrl: z.string().url().optional(),

  // Status
  status: MemberStatusSchema.default("active"),

  // Metadata
  invitedBy: z.string().uuid().optional(),
  invitedAt: z.date().optional(),
  joinedAt: z.date(),
  lastActiveAt: z.date().optional(),
});
export type OrgMember = z.infer<typeof OrgMemberSchema>;

// Add member input
export const AddMemberSchema = z.object({
  userId: z.string().uuid(),
  role: RoleSchema,
  email: z.string().email(),
  displayName: z.string().optional(),
  avatarUrl: z.string().url().optional(),
});
export type AddMember = z.infer<typeof AddMemberSchema>;

// Update member input
export const UpdateMemberSchema = z.object({
  role: RoleSchema.optional(),
  customPermissions: z.array(PermissionSchema).optional(),
  status: MemberStatusSchema.optional(),
});
export type UpdateMember = z.infer<typeof UpdateMemberSchema>;

// ============================================================================
// INVITATIONS
// ============================================================================

// Invite status
export const InviteStatusSchema = z.enum(["pending", "accepted", "expired", "revoked"]);
export type InviteStatus = z.infer<typeof InviteStatusSchema>;

// Organization invite
export const OrgInviteSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  email: z.string().email(),
  role: RoleSchema,

  // Token for accepting invite
  token: z.string().min(32),
  expiresAt: z.date(),

  // Status
  status: InviteStatusSchema.default("pending"),

  // Metadata
  invitedBy: z.string().uuid(),
  invitedAt: z.date(),
  acceptedAt: z.date().optional(),
  acceptedBy: z.string().uuid().optional(),

  // Personalization
  message: z.string().max(500).optional(),
});
export type OrgInvite = z.infer<typeof OrgInviteSchema>;

// Create invite input
export const CreateInviteSchema = z.object({
  email: z.string().email(),
  role: RoleSchema.default("viewer"),
  message: z.string().max(500).optional(),
  expiresInDays: z.number().int().min(1).max(30).default(7),
});
export type CreateInvite = z.infer<typeof CreateInviteSchema>;

// ============================================================================
// PERMISSION CHECK
// ============================================================================

// Permission check request
export const PermissionCheckSchema = z.object({
  userId: z.string().uuid(),
  orgId: z.string().uuid(),
  resource: ResourceTypeSchema,
  action: ActionTypeSchema,
  resourceId: z.string().optional(), // For resource-specific checks
});
export type PermissionCheck = z.infer<typeof PermissionCheckSchema>;

// Permission check result
export const PermissionResultSchema = z.object({
  allowed: z.boolean(),
  reason: z.string().optional(),
  role: RoleSchema.optional(),
  checkedAt: z.date(),
});
export type PermissionResult = z.infer<typeof PermissionResultSchema>;

// ============================================================================
// CONTEXT
// ============================================================================

// Auth context (attached to requests)
export const AuthContextSchema = z.object({
  userId: z.string().uuid(),
  orgId: z.string().uuid(),
  role: RoleSchema,
  permissions: z.array(PermissionSchema),

  // User info
  email: z.string().email(),
  displayName: z.string().optional(),

  // Organization info
  orgName: z.string(),
  orgPlan: OrgPlanSchema,
});
export type AuthContext = z.infer<typeof AuthContextSchema>;

// ============================================================================
// EVENTS
// ============================================================================

export interface RBACEvents {
  "org:created": (org: Organization) => void;
  "org:updated": (org: Organization) => void;
  "org:deleted": (orgId: string) => void;

  "member:added": (member: OrgMember) => void;
  "member:updated": (member: OrgMember) => void;
  "member:removed": (memberId: string, orgId: string) => void;

  "invite:created": (invite: OrgInvite) => void;
  "invite:accepted": (invite: OrgInvite, member: OrgMember) => void;
  "invite:revoked": (inviteId: string) => void;
  "invite:expired": (inviteId: string) => void;

  "permission:denied": (check: PermissionCheck, result: PermissionResult) => void;
}

// ============================================================================
// PLAN LIMITS
// ============================================================================

export const PLAN_LIMITS: Record<OrgPlan, OrgSettings> = {
  free: {
    maxPipelines: 10,
    maxMembers: 5,
    maxSchedules: 5,
    maxBudgets: 3,
    auditLogRetentionDays: 7,
    apiRateLimit: 100,
    webhooksEnabled: true,
    ssoEnabled: false,
    notifyOnBudgetAlert: true,
    notifyOnPipelineFailure: true,
    notifyOnNewMember: true,
  },
  pro: {
    maxPipelines: 100,
    maxMembers: 25,
    maxSchedules: 50,
    maxBudgets: 20,
    auditLogRetentionDays: 90,
    apiRateLimit: 1000,
    webhooksEnabled: true,
    ssoEnabled: false,
    notifyOnBudgetAlert: true,
    notifyOnPipelineFailure: true,
    notifyOnNewMember: true,
  },
  enterprise: {
    maxPipelines: -1, // unlimited
    maxMembers: -1,
    maxSchedules: -1,
    maxBudgets: -1,
    auditLogRetentionDays: 365,
    apiRateLimit: 10000,
    webhooksEnabled: true,
    ssoEnabled: true,
    notifyOnBudgetAlert: true,
    notifyOnPipelineFailure: true,
    notifyOnNewMember: true,
  },
};

// Role hierarchy levels (higher = more permissions)
export const ROLE_LEVELS: Record<Role, number> = {
  viewer: 1,
  editor: 2,
  admin: 3,
  owner: 4,
};
