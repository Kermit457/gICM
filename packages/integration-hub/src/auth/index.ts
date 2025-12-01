/**
 * Auth Module - Multi-Tenancy & RBAC
 * Phase 9A: Enterprise Security Foundation
 */

// Types & Schemas
export {
  // Role & Permission types
  RoleSchema,
  Role,
  PermissionSchema,
  Permission,
  ResourceTypeSchema,
  ResourceType,
  ActionTypeSchema,
  ActionType,

  // Organization types
  OrgPlanSchema,
  OrgPlan,
  OrgSettingsSchema,
  OrgSettings,
  OrganizationSchema,
  Organization,
  CreateOrgSchema,
  CreateOrg,
  UpdateOrgSchema,
  UpdateOrg,

  // Member types
  MemberStatusSchema,
  MemberStatus,
  OrgMemberSchema,
  OrgMember,
  AddMemberSchema,
  AddMember,
  UpdateMemberSchema,
  UpdateMember,

  // Invite types
  InviteStatusSchema,
  InviteStatus,
  OrgInviteSchema,
  OrgInvite,
  CreateInviteSchema,
  CreateInvite,

  // Permission check types
  PermissionCheckSchema,
  PermissionCheck,
  PermissionResultSchema,
  PermissionResult,
  AuthContextSchema,
  AuthContext,

  // Events
  RBACEvents,

  // Constants
  PLAN_LIMITS,
  ROLE_LEVELS,
} from "./types.js";

// Permissions
export {
  PERMISSIONS,
  PermissionKey,
  ROLE_PERMISSIONS,
  PERMISSION_GROUPS,
  ROLE_DESCRIPTIONS,
  buildPermission,
  parsePermission,
  roleHasPermission,
  getPermissionsForRole,
  isHigherRole,
  isAtLeastRole,
  getMinRoleForPermission,
  mergePermissions,
  getResourcesForAction,
  getActionsForResource,
} from "./permissions.js";

// RBAC Manager
export {
  RBACManager,
  RBACManagerConfig,
  getRBACManager,
  createRBACManager,
} from "./rbac-manager.js";
