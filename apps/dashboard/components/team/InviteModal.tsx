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
import { Shield, Crown, Eye, Pencil, UserPlus, AlertCircle } from "lucide-react";

type Role = "owner" | "admin" | "editor" | "viewer";

const ROLE_INFO: Record<Role, { label: string; icon: React.ElementType; description: string }> = {
  owner: {
    label: "Owner",
    icon: Crown,
    description: "Full control including billing",
  },
  admin: {
    label: "Admin",
    icon: Shield,
    description: "Manage team and settings",
  },
  editor: {
    label: "Editor",
    icon: Pencil,
    description: "Create and edit resources",
  },
  viewer: {
    label: "Viewer",
    icon: Eye,
    description: "Read-only access",
  },
};

interface InviteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvite: (data: { email: string; role: Role; message?: string }) => void;
  currentMemberCount: number;
  maxMembers: number;
}

export function InviteModal({
  open,
  onOpenChange,
  onInvite,
  currentMemberCount,
  maxMembers,
}: InviteModalProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("editor");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const isAtLimit = maxMembers !== -1 && currentMemberCount >= maxMembers;
  const selectableRoles: Role[] = ["admin", "editor", "viewer"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || isAtLimit) return;

    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    onInvite({ email, role, message: message || undefined });
    setLoading(false);
    setEmail("");
    setRole("editor");
    setMessage("");
  };

  const handleClose = () => {
    onOpenChange(false);
    setEmail("");
    setRole("editor");
    setMessage("");
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Invite Team Member
          </DialogTitle>
          <DialogDescription>
            Send an invitation to join your team. They will receive an email with a link to join.
          </DialogDescription>
        </DialogHeader>

        {isAtLimit ? (
          <div className="flex items-center gap-3 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            <div>
              <p className="font-medium text-yellow-500">Member limit reached</p>
              <p className="text-sm text-muted-foreground">
                Your plan allows {maxMembers} members. Upgrade to add more.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="colleague@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {selectableRoles.map((r) => {
                    const Icon = ROLE_INFO[r].icon;
                    return (
                      <SelectItem key={r} value={r}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <div>
                            <span className="font-medium">{ROLE_INFO[r].label}</span>
                            <span className="text-muted-foreground ml-2 text-xs">
                              - {ROLE_INFO[r].description}
                            </span>
                          </div>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Personal message (optional)</Label>
              <Textarea
                id="message"
                placeholder="Hey! I'd like to invite you to join our team..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={!email || loading}>
                {loading ? "Sending..." : "Send Invitation"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
