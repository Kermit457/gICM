import React from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, icon, actions }: PageHeaderProps) {
  return (
    <div className="border-b bg-white">
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {icon && (
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-lime-400 to-emerald-500 flex items-center justify-center">
                {icon}
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold text-black mb-1">{title}</h1>
              {description && (
                <p className="text-zinc-600">{description}</p>
              )}
            </div>
          </div>
          {actions && <div>{actions}</div>}
        </div>
      </div>
    </div>
  );
}
