/**
 * RBAC Manager - Role-Based Access Control & Multi-Tenancy
 * Phase 9A: Enterprise Security Foundation
 */

import { EventEmitter } from "eventemitter3";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";
import {
  Organization,
  CreateOrg,
  UpdateOrg,
  OrganizationSchema,
  CreateOrgSchema,
  OrgMember,
  AddMember,
  UpdateMember,
  OrgMemberSchema,
  AddMemberSchema,
  OrgInvite,
  CreateInvite,
  OrgInviteSchema,
  CreateInviteSchema,
  Role,
  Permission,
  PermissionCheck,
  PermissionResult,
  AuthContext,
  RBACEvents,
  PLAN_LIMITS,
  ROLE_LEVELS,
} from "./types.js";
import {
  roleHasPermission,
  getPermissionsForRole,
  mergePermissions,
  buildPermission,
  isAtLeastRole,
} from "./permissions.js";

// ============================================================================
// CONFIGURATION
// ============================================================================

export interface RBACManagerConfig {
  inviteExpirationDays?: number;
  enableInviteEmails?: boolean;
  maxOrgsPerUser?: number;
  checkIntervalMs?: number;
}

const DEFAULT_CONFIG: Required<RBACManagerConfig> = {
  inviteExpirationDays: 7,
  enableInviteEmails: true,
  maxOrgsPerUser: 10,
  checkIntervalMs: 60000, // Check for expired invites
};

// ============================================================================
// RBAC MANAGER CLASS
// ============================================================================

export class RBACManager extends EventEmitter<RBACEvents> {
  private config: Required<RBACManagerConfig>;

  // In-memory storage (replace with database in production)
  private organizations: Map<string, Organization> = new Map();
  private members: Map<string, OrgMember[]> = new Map(); // orgId -> members[]
  private invites: Map<string, OrgInvite[]> = new Map(); // orgId -> invites[]
  private userOrgs: Map<string, string[]> = new Map(); // userId -> orgIds[]

  private checkInterval: NodeJS.Timeout | null = null;

  constructor(config: RBACManagerConfig = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ==========================================================================
  // LIFECYCLE
  // ==========================================================================

  start(): void {
    if (this.checkInterval) return;

    this.checkInterval = setInterval(() => {
      this.expireInvites();
    }, this.config.checkIntervalMs);

    console.log("[RBACManager] Started invite expiration monitoring");
  }

  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    console.log("[RBACManager] Stopped");
  }

  // ==========================================================================
  // ORGANIZATION MANAGEMENT
  // ==========================================================================

  async createOrganization(input: CreateOrg, creatorUserId: string): Promise<Organization> {
    const validated = CreateOrgSchema.parse(input);

    // Check user org limit
    const userOrgs = this.userOrgs.get(creatorUserId) || [];
    if (userOrgs.length >= this.config.maxOrgsPerUser) {
      throw new Error(`User has reached maximum organization limit (${this.config.maxOrgsPerUser})`);
    }

    // Check slug uniqueness
    for (const org of this.organizations.values()) {
      if (org.slug === validated.slug) {
        throw new Error(`Organization slug "${validated.slug}" is already taken`);
      }
    }

    const now = new Date();
    const plan = validated.plan || "free";

    const org: Organization = OrganizationSchema.parse({
      ...validated,
      id: uuidv4(),
      plan,
      settings: { ...PLAN_LIMITS[plan], ...validated.settings },
      createdAt: now,
      updatedAt: now,
      createdBy: creatorUserId,
    });

    // Store organization
    this.organizations.set(org.id, org);
    this.members.set(org.id, []);
    this.invites.set(org.id, []);

    // Add creator as owner
    await this.addMember(org.id, {
      userId: creatorUserId,
      role: "owner",
      email: validated.billingEmail || "owner@example.com",
      displayName: "Owner",
    });

    this.emit("org:created", org);
    console.log(`[RBACManager] Created organization: ${org.name} (${org.slug})`);

    return org;
  }

  getOrganization(orgId: string): Organization | undefined {
    return this.organizations.get(orgId);
  }

  getOrganizationBySlug(slug: string): Organization | undefined {
    for (const org of this.organizations.values()) {
      if (org.slug === slug) return org;
    }
    return undefined;
  }

  async updateOrganization(orgId: string, updates: UpdateOrg): Promise<Organization | null> {
    const org = this.organizations.get(orgId);
    if (!org) return null;

    // If changing slug, check uniqueness
    if (updates.slug && updates.slug !== org.slug) {
      for (const o of this.organizations.values()) {
        if (o.slug === updates.slug && o.id !== orgId) {
          throw new Error(`Organization slug "${updates.slug}" is already taken`);
        }
      }
    }

    // If changing plan, update limits
    let settings = org.settings;
    if (updates.plan && updates.plan !== org.plan) {
      settings = { ...PLAN_LIMITS[updates.plan], ...updates.settings };
    }

    const updated: Organization = {
      ...org,
      ...updates,
      settings: updates.settings ? { ...settings, ...updates.settings } : settings,
      updatedAt: new Date(),
    };

    this.organizations.set(orgId, updated);
    this.emit("org:updated", updated);

    return updated;
  }

  async deleteOrganization(orgId: string): Promise<boolean> {
    const org = this.organizations.get(orgId);
    if (!org) return false;

    // Remove all members from userOrgs
    const orgMembers = this.members.get(orgId) || [];
    for (const member of orgMembers) {
      const userOrgList = this.userOrgs.get(member.userId) || [];
      this.userOrgs.set(
        member.userId,
        userOrgList.filter((id) => id !== orgId)
      );
    }

    // Delete organization data
    this.organizations.delete(orgId);
    this.members.delete(orgId);
    this.invites.delete(orgId);

    this.emit("org:deleted", orgId);
    console.log(`[RBACManager] Deleted organization: ${org.name}`);

    return true;
  }

  getUserOrganizations(userId: string): Organization[] {
    const orgIds = this.userOrgs.get(userId) || [];
    return orgIds
      .map((id) => this.organizations.get(id))
      .filter((org): org is Organization => org !== undefined);
  }

  // ==========================================================================
  // MEMBER MANAGEMENT
  // ==========================================================================

  async addMember(orgId: string, input: AddMember): Promise<OrgMember> {
    const org = this.organizations.get(orgId);
    if (!org) throw new Error(`Organization not found: ${orgId}`);

    const validated = AddMemberSchema.parse(input);
    const orgMembers = this.members.get(orgId) || [];

    // Check if already a member
    if (orgMembers.some((m) => m.userId === validated.userId)) {
      throw new Error("User is already a member of this organization");
    }

    // Check member limit
    if (org.settings.maxMembers !== -1 && orgMembers.length >= org.settings.maxMembers) {
      throw new Error(`Organization has reached maximum member limit (${org.settings.maxMembers})`);
    }

    const now = new Date();
    const member: OrgMember = OrgMemberSchema.parse({
      id: uuidv4(),
      orgId,
      ...validated,
      status: "active",
      joinedAt: now,
      lastActiveAt: now,
    });

    // Store member
    orgMembers.push(member);
    this.members.set(orgId, orgMembers);

    // Update user orgs
    const userOrgList = this.userOrgs.get(member.userId) || [];
    userOrgList.push(orgId);
    this.userOrgs.set(member.userId, userOrgList);

    this.emit("member:added", member);
    console.log(`[RBACManager] Added member ${member.email} to ${org.name} as ${member.role}`);

    return member;
  }

  getMember(orgId: string, userId: string): OrgMember | undefined {
    const orgMembers = this.members.get(orgId) || [];
    return orgMembers.find((m) => m.userId === userId && m.status === "active");
  }

  getMemberById(memberId: string): OrgMember | undefined {
    for (const members of this.members.values()) {
      const member = members.find((m) => m.id === memberId);
      if (member) return member;
    }
    return undefined;
  }

  getOrgMembers(orgId: string): OrgMember[] {
    return (this.members.get(orgId) || []).filter((m) => m.status === "active");
  }

  async updateMember(orgId: string, userId: string, updates: UpdateMember): Promise<OrgMember | null> {
    const orgMembers = this.members.get(orgId) || [];
    const memberIndex = orgMembers.findIndex((m) => m.userId === userId);

    if (memberIndex === -1) return null;

    const member = orgMembers[memberIndex];

    // Prevent demoting the last owner
    if (updates.role && member.role === "owner" && updates.role !== "owner") {
      const owners = orgMembers.filter((m) => m.role === "owner" && m.status === "active");
      if (owners.length <= 1) {
        throw new Error("Cannot demote the last owner. Transfer ownership first.");
      }
    }

    const updated: OrgMember = {
      ...member,
      ...updates,
      lastActiveAt: new Date(),
    };

    orgMembers[memberIndex] = updated;
    this.members.set(orgId, orgMembers);

    this.emit("member:updated", updated);
    return updated;
  }

  async removeMember(orgId: string, userId: string): Promise<boolean> {
    const orgMembers = this.members.get(orgId) || [];
    const member = orgMembers.find((m) => m.userId === userId);

    if (!member) return false;

    // Prevent removing the last owner
    if (member.role === "owner") {
      const owners = orgMembers.filter((m) => m.role === "owner" && m.status === "active");
      if (owners.length <= 1) {
        throw new Error("Cannot remove the last owner. Transfer ownership first.");
      }
    }

    // Soft delete - mark as removed
    member.status = "removed";
    this.members.set(orgId, orgMembers);

    // Remove from user orgs
    const userOrgList = this.userOrgs.get(userId) || [];
    this.userOrgs.set(
      userId,
      userOrgList.filter((id) => id !== orgId)
    );

    this.emit("member:removed", member.id, orgId);
    console.log(`[RBACManager] Removed member ${member.email} from org ${orgId}`);

    return true;
  }

  // ==========================================================================
  // INVITE MANAGEMENT
  // ==========================================================================

  async createInvite(orgId: string, input: CreateInvite, invitedBy: string): Promise<OrgInvite> {
    const org = this.organizations.get(orgId);
    if (!org) throw new Error(`Organization not found: ${orgId}`);

    const validated = CreateInviteSchema.parse(input);
    const orgInvites = this.invites.get(orgId) || [];
    const orgMembers = this.members.get(orgId) || [];

    // Check if email is already a member
    if (orgMembers.some((m) => m.email === validated.email && m.status === "active")) {
      throw new Error("User with this email is already a member");
    }

    // Check if invite already exists (and is pending)
    const existingInvite = orgInvites.find(
      (i) => i.email === validated.email && i.status === "pending"
    );
    if (existingInvite) {
      throw new Error("An invite for this email is already pending");
    }

    // Check member limit
    if (org.settings.maxMembers !== -1 && orgMembers.length >= org.settings.maxMembers) {
      throw new Error(`Organization has reached maximum member limit (${org.settings.maxMembers})`);
    }

    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + validated.expiresInDays);

    const invite: OrgInvite = OrgInviteSchema.parse({
      id: uuidv4(),
      orgId,
      email: validated.email,
      role: validated.role,
      token: crypto.randomBytes(32).toString("hex"),
      expiresAt,
      status: "pending",
      invitedBy,
      invitedAt: now,
      message: validated.message,
    });

    orgInvites.push(invite);
    this.invites.set(orgId, orgInvites);

    this.emit("invite:created", invite);
    console.log(`[RBACManager] Created invite for ${invite.email} to ${org.name}`);

    return invite;
  }

  getInvite(inviteId: string): OrgInvite | undefined {
    for (const invites of this.invites.values()) {
      const invite = invites.find((i) => i.id === inviteId);
      if (invite) return invite;
    }
    return undefined;
  }

  getInviteByToken(token: string): OrgInvite | undefined {
    for (const invites of this.invites.values()) {
      const invite = invites.find((i) => i.token === token && i.status === "pending");
      if (invite) return invite;
    }
    return undefined;
  }

  getOrgInvites(orgId: string, pendingOnly = true): OrgInvite[] {
    const invites = this.invites.get(orgId) || [];
    if (pendingOnly) {
      return invites.filter((i) => i.status === "pending");
    }
    return invites;
  }

  async acceptInvite(token: string, userId: string, userEmail: string, displayName?: string): Promise<OrgMember> {
    const invite = this.getInviteByToken(token);
    if (!invite) throw new Error("Invalid or expired invite");

    // Check if expired
    if (new Date() > invite.expiresAt) {
      invite.status = "expired";
      this.emit("invite:expired", invite.id);
      throw new Error("Invite has expired");
    }

    // Create member
    const member = await this.addMember(invite.orgId, {
      userId,
      role: invite.role,
      email: userEmail,
      displayName,
    });

    // Update invite status
    invite.status = "accepted";
    invite.acceptedAt = new Date();
    invite.acceptedBy = userId;

    this.emit("invite:accepted", invite, member);
    console.log(`[RBACManager] Invite accepted by ${userEmail}`);

    return member;
  }

  async revokeInvite(inviteId: string): Promise<boolean> {
    for (const [orgId, invites] of this.invites.entries()) {
      const invite = invites.find((i) => i.id === inviteId);
      if (invite && invite.status === "pending") {
        invite.status = "revoked";
        this.emit("invite:revoked", inviteId);
        console.log(`[RBACManager] Revoked invite ${inviteId}`);
        return true;
      }
    }
    return false;
  }

  private expireInvites(): void {
    const now = new Date();

    for (const invites of this.invites.values()) {
      for (const invite of invites) {
        if (invite.status === "pending" && now > invite.expiresAt) {
          invite.status = "expired";
          this.emit("invite:expired", invite.id);
        }
      }
    }
  }

  // ==========================================================================
  // PERMISSION CHECKING
  // ==========================================================================

  async checkPermission(check: PermissionCheck): Promise<PermissionResult> {
    const { userId, orgId, resource, action, resourceId } = check;
    const permission = buildPermission(resource, action);

    // Get member
    const member = this.getMember(orgId, userId);
    if (!member) {
      return {
        allowed: false,
        reason: "User is not a member of this organization",
        checkedAt: new Date(),
      };
    }

    // Check if suspended
    if (member.status === "suspended") {
      return {
        allowed: false,
        reason: "User account is suspended",
        role: member.role,
        checkedAt: new Date(),
      };
    }

    // Get effective permissions
    const permissions = mergePermissions(member.role, member.customPermissions);

    // Check permission
    if (!permissions.includes(permission)) {
      this.emit("permission:denied", check, {
        allowed: false,
        reason: `Role "${member.role}" does not have permission "${permission}"`,
        role: member.role,
        checkedAt: new Date(),
      });

      return {
        allowed: false,
        reason: `Permission denied: ${permission}`,
        role: member.role,
        checkedAt: new Date(),
      };
    }

    return {
      allowed: true,
      role: member.role,
      checkedAt: new Date(),
    };
  }

  hasPermission(userId: string, orgId: string, permission: Permission): boolean {
    const member = this.getMember(orgId, userId);
    if (!member || member.status !== "active") return false;

    const permissions = mergePermissions(member.role, member.customPermissions);
    return permissions.includes(permission);
  }

  hasRole(userId: string, orgId: string, minRole: Role): boolean {
    const member = this.getMember(orgId, userId);
    if (!member || member.status !== "active") return false;

    return isAtLeastRole(member.role, minRole);
  }

  // ==========================================================================
  // AUTH CONTEXT
  // ==========================================================================

  getAuthContext(userId: string, orgId: string): AuthContext | null {
    const member = this.getMember(orgId, userId);
    if (!member || member.status !== "active") return null;

    const org = this.organizations.get(orgId);
    if (!org) return null;

    const permissions = mergePermissions(member.role, member.customPermissions);

    return {
      userId: member.userId,
      orgId,
      role: member.role,
      permissions,
      email: member.email,
      displayName: member.displayName,
      orgName: org.name,
      orgPlan: org.plan,
    };
  }

  // ==========================================================================
  // STATISTICS
  // ==========================================================================

  getStats(): {
    totalOrgs: number;
    totalMembers: number;
    totalInvites: number;
    orgsByPlan: Record<string, number>;
  } {
    const orgsByPlan: Record<string, number> = { free: 0, pro: 0, enterprise: 0 };
    let totalMembers = 0;
    let totalInvites = 0;

    for (const org of this.organizations.values()) {
      orgsByPlan[org.plan] = (orgsByPlan[org.plan] || 0) + 1;
    }

    for (const members of this.members.values()) {
      totalMembers += members.filter((m) => m.status === "active").length;
    }

    for (const invites of this.invites.values()) {
      totalInvites += invites.filter((i) => i.status === "pending").length;
    }

    return {
      totalOrgs: this.organizations.size,
      totalMembers,
      totalInvites,
      orgsByPlan,
    };
  }
}

// ============================================================================
// SINGLETON & FACTORY
// ============================================================================

let rbacManager: RBACManager | null = null;

export function getRBACManager(config?: RBACManagerConfig): RBACManager {
  if (!rbacManager) {
    rbacManager = new RBACManager(config);
  }
  return rbacManager;
}

export function createRBACManager(config?: RBACManagerConfig): RBACManager {
  return new RBACManager(config);
}
