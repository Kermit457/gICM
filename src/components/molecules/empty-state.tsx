import { PackageOpen, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  type: "no-results" | "empty-stack" | "no-analytics";
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const ICONS = {
  "no-results": Search,
  "empty-stack": PackageOpen,
  "no-analytics": Sparkles,
};

export function EmptyState({ type, title, description, action }: EmptyStateProps) {
  const Icon = ICONS[type];

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="h-20 w-20 rounded-2xl bg-black/5 grid place-items-center mb-6">
        <Icon className="w-10 h-10 text-black/20" />
      </div>
      <h3 className="text-2xl font-black text-black mb-2">{title}</h3>
      <p className="text-black/60 max-w-md mb-6">{description}</p>
      {action && (
        <Button onClick={action.onClick} className="bg-lime-500 hover:bg-lime-600 text-black font-bold">
          {action.label}
        </Button>
      )}
    </div>
  );
}
