"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Users,
  Mail,
  MoreVertical,
  Shield,
  Crown,
  UserCog,
  Eye,
  Pencil,
  Trash2,
  Clock,
  UserPlus,
  Copy,
  Check,
} from "lucide-react";
import { MemberList } from "@/components/team/MemberList";
import { InviteModal } from "@/components/team/InviteModal";
import { RoleSelect } from "@/components/team/RoleSelect";

// Types
type Role = "owner" | "admin" | "editor" | "viewer";
type InviteStatus = "pending" | "expired" | "accepted";

interface Member {
  id: string;
  userId: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  role: Role;
  joinedAt: Date;
  lastActiveAt?: Date;
}

interface Invite {
  id: string;
  email: string;
  role: Role;
  status: InviteStatus;
  expiresAt: Date;
  invitedAt: Date;
  invitedBy: string;
  message?: string;
}

// Role metadata
const ROLE_INFO: Record<Role, { label: string; icon: React.ElementType; description: string; color: string }> = {
  owner: {
    label: "Owner",
    icon: Crown,
    description: "Full control including billing",
    color: "text-yellow-500 bg-yellow-50 dark:bg-yellow-950",
  },
  admin: {
    label: "Admin",
    icon: Shield,
    description: "Manage team and settings",
    color: "text-purple-500 bg-purple-50 dark:bg-purple-950",
  },
  editor: {
    label: "Editor",
    icon: Pencil,
    description: "Create and edit resources",
    color: "text-blue-500 bg-blue-50 dark:bg-blue-950",
  },
  viewer: {
    label: "Viewer",
    icon: Eye,
    description: "Read-only access",
    color: "text-gray-500 bg-gray-50 dark:bg-gray-900",
  },
};

// Mock data
const mockMembers: Member[] = [
  {
    id: "m1",
    userId: "u1",
    email: "mirko@gicm.dev",
    displayName: "Mirko Dolger",
    role: "owner",
    joinedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    lastActiveAt: new Date(),
  },
  {
    id: "m2",
    userId: "u2",
    email: "alice@example.com",
    displayName: "Alice Chen",
    role: "admin",
    joinedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
    lastActiveAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: "m3",
    userId: "u3",
    email: "bob@example.com",
    displayName: "Bob Smith",
    role: "editor",
    joinedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    lastActiveAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
  {
    id: "m4",
    userId: "u4",
    email: "carol@example.com",
    displayName: "Carol Williams",
    role: "viewer",
    joinedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    lastActiveAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
];

const mockInvites: Invite[] = [
  {
    id: "i1",
    email: "dave@example.com",
    role: "editor",
    status: "pending",
    expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    invitedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    invitedBy: "Mirko Dolger",
    message: "Welcome to the team!",
  },
  {
    id: "i2",
    email: "eve@example.com",
    role: "viewer",
    status: "pending",
    expiresAt: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
    invitedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    invitedBy: "Alice Chen",
  },
];

const mockOrg = {
  id: "org1",
  name: "gICM Platform",
  slug: "gicm",
  plan: "pro" as const,
  settings: {
    maxMembers: 25,
  },
};

export default function TeamPage() {
  const [members, setMembers] = useState(mockMembers);
  const [invites, setInvites] = useState(mockInvites);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [activeTab, setActiveTab] = useState("members");
  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null);

  // Current user (mock)
  const currentUser = { id: "u1", role: "owner" as Role };

  // Stats
  const stats = {
    totalMembers: members.length,
    pendingInvites: invites.filter((i) => i.status === "pending").length,
    adminCount: members.filter((m) => m.role === "admin" || m.role === "owner").length,
    maxMembers: mockOrg.settings.maxMembers,
  };

  const handleInvite = (data: { email: string; role: Role; message?: string }) => {
    const invite: Invite = {
      id: Date.now().toString(),
      email: data.email,
      role: data.role,
      status: "pending",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      invitedAt: new Date(),
      invitedBy: members[0].displayName,
      message: data.message,
    };
    setInvites([...invites, invite]);
    setShowInviteModal(false);
  };

  const handleUpdateRole = (memberId: string, newRole: Role) => {
    setMembers(members.map((m) =>
      m.id === memberId ? { ...m, role: newRole } : m
    ));
  };

  const handleRemoveMember = (memberId: string) => {
    setMembers(members.filter((m) => m.id !== memberId));
  };

  const handleRevokeInvite = (inviteId: string) => {
    setInvites(invites.filter((i) => i.id !== inviteId));
  };

  const handleResendInvite = (inviteId: string) => {
    setInvites(invites.map((i) =>
      i.id === inviteId
        ? { ...i, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }
        : i
    ));
  };

  const copyInviteLink = (inviteId: string) => {
    navigator.clipboard.writeText(`https://app.gicm.dev/invite/${inviteId}`);
    setCopiedInviteId(inviteId);
    setTimeout(() => setCopiedInviteId(null), 2000);
  };

  const formatDate = (date: Date) => {
    return new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(
      Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
      "day"
    );
  };

  const canManageMembers = currentUser.role === "owner" || currentUser.role === "admin";

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8" />
            Team Management
          </h1>
          <p className="text-muted-foreground">
            Manage team members and permissions for {mockOrg.name}
          </p>
        </div>
        {canManageMembers && (
          <Button onClick={() => setShowInviteModal(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Invite Member
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.totalMembers}</div>
            <p className="text-xs text-muted-foreground">
              of {stats.maxMembers === -1 ? "unlimited" : stats.maxMembers} members
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.pendingInvites}</div>
            <p className="text-xs text-muted-foreground">Pending invites</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.adminCount}</div>
            <p className="text-xs text-muted-foreground">Admins & owners</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <Badge variant="secondary" className="text-sm">
              {mockOrg.plan.toUpperCase()}
            </Badge>
            <p className="text-xs text-muted-foreground mt-1">Current plan</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="members">
            Members ({members.length})
          </TabsTrigger>
          <TabsTrigger value="invites">
            Invites
            {stats.pendingInvites > 0 && (
              <span className="ml-2 bg-blue-500 text-white rounded-full px-2 py-0.5 text-xs">
                {stats.pendingInvites}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="roles">
            Roles & Permissions
          </TabsTrigger>
        </TabsList>

        {/* Members Tab */}
        <TabsContent value="members" className="mt-6">
          <MemberList
            members={members}
            currentUserId={currentUser.id}
            canManage={canManageMembers}
            onUpdateRole={handleUpdateRole}
            onRemoveMember={handleRemoveMember}
          />
        </TabsContent>

        {/* Invites Tab */}
        <TabsContent value="invites" className="mt-6">
          {invites.filter((i) => i.status === "pending").length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No pending invites</p>
              <p className="text-sm">Invite team members to collaborate</p>
            </div>
          ) : (
            <div className="space-y-4">
              {invites
                .filter((i) => i.status === "pending")
                .map((invite) => (
                  <Card key={invite.id}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                          <Mail className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-medium">{invite.email}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={ROLE_INFO[invite.role].color}
                            >
                              {ROLE_INFO[invite.role].label}
                            </Badge>
                            <span>•</span>
                            <Clock className="h-3 w-3" />
                            <span>Expires {formatDate(invite.expiresAt)}</span>
                          </div>
                          {invite.message && (
                            <p className="text-xs text-muted-foreground mt-1 italic">
                              "{invite.message}"
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyInviteLink(invite.id)}
                        >
                          {copiedInviteId === invite.id ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                        {canManageMembers && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleResendInvite(invite.id)}>
                                <Mail className="mr-2 h-4 w-4" />
                                Resend Invite
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-500"
                                onClick={() => handleRevokeInvite(invite.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Revoke Invite
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </TabsContent>

        {/* Roles Tab */}
        <TabsContent value="roles" className="mt-6">
          <div className="grid gap-4">
            {(Object.entries(ROLE_INFO) as [Role, typeof ROLE_INFO[Role]][]).map(
              ([role, info]) => {
                const Icon = info.icon;
                const memberCount = members.filter((m) => m.role === role).length;

                return (
                  <Card key={role}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${info.color}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{info.label}</CardTitle>
                            <CardDescription>{info.description}</CardDescription>
                          </div>
                        </div>
                        <Badge variant="secondary">
                          {memberCount} {memberCount === 1 ? "member" : "members"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-muted-foreground">
                        {role === "owner" && (
                          <ul className="list-disc list-inside space-y-1">
                            <li>Full access to all features</li>
                            <li>Manage billing and subscription</li>
                            <li>Delete organization</li>
                            <li>Transfer ownership</li>
                          </ul>
                        )}
                        {role === "admin" && (
                          <ul className="list-disc list-inside space-y-1">
                            <li>Manage team members and roles</li>
                            <li>Access all settings</li>
                            <li>View audit logs</li>
                            <li>Delete resources</li>
                          </ul>
                        )}
                        {role === "editor" && (
                          <ul className="list-disc list-inside space-y-1">
                            <li>Create and edit pipelines</li>
                            <li>Manage schedules and budgets</li>
                            <li>Execute pipelines</li>
                            <li>Publish to marketplace</li>
                          </ul>
                        )}
                        {role === "viewer" && (
                          <ul className="list-disc list-inside space-y-1">
                            <li>View pipelines and analytics</li>
                            <li>View schedules and budgets</li>
                            <li>Browse marketplace</li>
                            <li>Read-only access</li>
                          </ul>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              }
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Invite Modal */}
      <InviteModal
        open={showInviteModal}
        onOpenChange={setShowInviteModal}
        onInvite={handleInvite}
        currentMemberCount={members.length}
        maxMembers={mockOrg.settings.maxMembers}
      />
    </div>
  );
}
