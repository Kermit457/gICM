import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-lime-100 to-emerald-100 dark:from-lime-900/20 dark:to-emerald-900/20 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-lime-600 dark:text-lime-400" />
      </div>

      <h3 className="text-xl font-semibold text-black dark:text-white mb-2">
        {title}
      </h3>

      <p className="text-zinc-600 dark:text-zinc-400 mb-6 max-w-md">
        {description}
      </p>

      {(action || secondaryAction) && (
        <div className="flex gap-3">
          {action && (
            <Button onClick={action.onClick}>
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button variant="outline" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
