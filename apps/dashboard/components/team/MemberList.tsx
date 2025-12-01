"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  MoreVertical,
  Shield,
  Crown,
  Eye,
  Pencil,
  Trash2,
  UserCog,
} from "lucide-react";
import { RoleSelect } from "./RoleSelect";

// Types
type Role = "owner" | "admin" | "editor" | "viewer";

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

// Role metadata
const ROLE_INFO: Record<Role, { label: string; icon: React.ElementType; color: string }> = {
  owner: {
    label: "Owner",
    icon: Crown,
    color: "text-yellow-500 bg-yellow-50 dark:bg-yellow-950",
  },
  admin: {
    label: "Admin",
    icon: Shield,
    color: "text-purple-500 bg-purple-50 dark:bg-purple-950",
  },
  editor: {
    label: "Editor",
    icon: Pencil,
    color: "text-blue-500 bg-blue-50 dark:bg-blue-950",
  },
  viewer: {
    label: "Viewer",
    icon: Eye,
    color: "text-gray-500 bg-gray-50 dark:bg-gray-900",
  },
};

interface MemberListProps {
  members: Member[];
  currentUserId: string;
  canManage: boolean;
  onUpdateRole: (memberId: string, role: Role) => void;
  onRemoveMember: (memberId: string) => void;
}

export function MemberList({
  members,
  currentUserId,
  canManage,
  onUpdateRole,
  onRemoveMember,
}: MemberListProps) {
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [confirmRemoveMember, setConfirmRemoveMember] = useState<Member | null>(null);

  const formatLastActive = (date?: Date) => {
    if (!date) return "Never";

    const diff = Date.now() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const formatJoinDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Sort: owners first, then admins, then by join date
  const sortedMembers = [...members].sort((a, b) => {
    const roleOrder = { owner: 0, admin: 1, editor: 2, viewer: 3 };
    if (roleOrder[a.role] !== roleOrder[b.role]) {
      return roleOrder[a.role] - roleOrder[b.role];
    }
    return a.joinedAt.getTime() - b.joinedAt.getTime();
  });

  return (
    <>
      <div className="space-y-3">
        {sortedMembers.map((member) => {
          const isCurrentUser = member.userId === currentUserId;
          const isOwner = member.role === "owner";
          const RoleIcon = ROLE_INFO[member.role].icon;

          return (
            <Card key={member.id} data-testid="member-card">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="relative">
                    {member.avatarUrl ? (
                      <img
                        src={member.avatarUrl}
                        alt={member.displayName}
                        className="h-10 w-10 rounded-full"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center font-medium">
                        {getInitials(member.displayName)}
                      </div>
                    )}
                    {/* Online indicator */}
                    {member.lastActiveAt &&
                      Date.now() - member.lastActiveAt.getTime() < 300000 && (
                        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
                      )}
                  </div>

                  {/* Info */}
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {member.displayName}
                      {isCurrentUser && (
                        <Badge variant="outline" className="text-xs">
                          You
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {member.email}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Joined {formatJoinDate(member.joinedAt)} • Active{" "}
                      {formatLastActive(member.lastActiveAt)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Role Badge or Selector */}
                  {editingMemberId === member.id ? (
                    <RoleSelect
                      value={member.role}
                      onChange={(role) => {
                        onUpdateRole(member.id, role);
                        setEditingMemberId(null);
                      }}
                      onCancel={() => setEditingMemberId(null)}
                      disabled={isOwner}
                    />
                  ) : (
                    <Badge
                      variant="outline"
                      className={`${ROLE_INFO[member.role].color} gap-1`}
                    >
                      <RoleIcon className="h-3 w-3" />
                      {ROLE_INFO[member.role].label}
                    </Badge>
                  )}

                  {/* Actions */}
                  {canManage && !isCurrentUser && editingMemberId !== member.id && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" data-testid="member-menu">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {!isOwner && (
                          <DropdownMenuItem
                            onClick={() => setEditingMemberId(member.id)}
                          >
                            <UserCog className="mr-2 h-4 w-4" />
                            Change Role
                          </DropdownMenuItem>
                        )}
                        {!isOwner && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-500"
                              onClick={() => setConfirmRemoveMember(member)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Remove Member
                            </DropdownMenuItem>
                          </>
                        )}
                        {isOwner && (
                          <DropdownMenuItem disabled>
                            <Crown className="mr-2 h-4 w-4" />
                            Cannot modify owner
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Remove Confirmation Dialog */}
      <AlertDialog
        open={!!confirmRemoveMember}
        onOpenChange={(open) => !open && setConfirmRemoveMember(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{" "}
              <span className="font-semibold">
                {confirmRemoveMember?.displayName}
              </span>{" "}
              from the team? They will lose access to all resources.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={() => {
                if (confirmRemoveMember) {
                  onRemoveMember(confirmRemoveMember.id);
                  setConfirmRemoveMember(null);
                }
              }}
            >
              Remove Member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
