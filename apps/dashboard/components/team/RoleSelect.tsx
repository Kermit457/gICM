"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Shield, Crown, Eye, Pencil, Check, X } from "lucide-react";

type Role = "owner" | "admin" | "editor" | "viewer";

const ROLE_INFO: Record<Role, { label: string; icon: React.ElementType; color: string }> = {
  owner: {
    label: "Owner",
    icon: Crown,
    color: "text-yellow-500",
  },
  admin: {
    label: "Admin",
    icon: Shield,
    color: "text-purple-500",
  },
  editor: {
    label: "Editor",
    icon: Pencil,
    color: "text-blue-500",
  },
  viewer: {
    label: "Viewer",
    icon: Eye,
    color: "text-gray-500",
  },
};

interface RoleSelectProps {
  value: Role;
  onChange: (role: Role) => void;
  onCancel?: () => void;
  disabled?: boolean;
  showActions?: boolean;
}

export function RoleSelect({
  value,
  onChange,
  onCancel,
  disabled = false,
  showActions = true,
}: RoleSelectProps) {
  const selectableRoles: Role[] = ["admin", "editor", "viewer"];

  return (
    <div className="flex items-center gap-2">
      <Select
        value={value}
        onValueChange={(v) => onChange(v as Role)}
        disabled={disabled}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {selectableRoles.map((role) => {
            const Icon = ROLE_INFO[role].icon;
            return (
              <SelectItem key={role} value={role}>
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${ROLE_INFO[role].color}`} />
                  {ROLE_INFO[role].label}
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
      {showActions && onCancel && (
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
