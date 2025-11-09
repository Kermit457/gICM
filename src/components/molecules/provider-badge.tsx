"use client";

import { Container, Zap, Package } from "lucide-react";

export type Provider = "e2b" | "claudefare" | "docker";

interface ProviderBadgeProps {
  provider: Provider;
  required?: boolean;
}

const PROVIDER_CONFIG = {
  e2b: {
    name: "E2B",
    description: "Sandboxed code execution environment",
    icon: Zap,
    color: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
    docs: "https://e2b.dev/docs",
  },
  claudefare: {
    name: "Claudefare",
    description: "Claude-specific features and integrations",
    icon: Package,
    color: "bg-lime-500/10 text-lime-700 border-lime-500/30",
    docs: "https://claude.ai/docs",
  },
  docker: {
    name: "Docker",
    description: "Containerized execution environment",
    icon: Container,
    color: "bg-teal-500/10 text-teal-700 border-teal-500/30",
    docs: "https://docs.docker.com",
  },
};

export function ProviderBadge({ provider, required = false }: ProviderBadgeProps) {
  const config = PROVIDER_CONFIG[provider];
  const Icon = config.icon;

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border ${config.color} transition-colors hover:opacity-80`}
      title={config.description}
    >
      <Icon size={16} />
      <div className="flex flex-col">
        <span className="text-xs font-semibold">{config.name}</span>
        {required && <span className="text-[10px] opacity-70">Required</span>}
      </div>
    </div>
  );
}

interface ProviderListProps {
  providers: Provider[];
}

export function ProviderList({ providers }: ProviderListProps) {
  if (providers.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold text-black">Provider Requirements</div>
      <div className="flex flex-wrap gap-2">
        {providers.map((provider) => (
          <ProviderBadge key={provider} provider={provider} required />
        ))}
      </div>
      <p className="text-xs text-zinc-600">
        Install required providers before running this {providers.length > 1 ? "component" : "item"}.
      </p>
    </div>
  );
}
