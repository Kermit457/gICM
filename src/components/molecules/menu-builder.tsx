"use client";

import { useState } from "react";
import { Bot, Zap, Terminal, Plug, Settings, Workflow } from "lucide-react";
import { AGENTS, SKILLS, COMMANDS, MCPS } from "@/lib/registry";
import { SETTINGS } from "@/lib/settings-registry";
import { WORKFLOWS } from "@/lib/workflows";
import { ScrambleText } from "@/components/ui/scramble-text";

export type MenuCategory = "all" | "agents" | "skills" | "commands" | "settings" | "mcp" | "workflows";

interface MenuBuilderProps {
  selected: MenuCategory;
  onSelect: (category: MenuCategory) => void;
}

const MENU_ITEMS = [
  {
    id: "all" as MenuCategory,
    label: "All",
    icon: null,
    count: AGENTS.length + SKILLS.length + COMMANDS.length + MCPS.length + SETTINGS.length + WORKFLOWS.length,
  },
  {
    id: "agents" as MenuCategory,
    label: "Agents",
    icon: Bot,
    count: AGENTS.length,
  },
  {
    id: "skills" as MenuCategory,
    label: "Skills",
    icon: Zap,
    count: SKILLS.length,
  },
  {
    id: "commands" as MenuCategory,
    label: "Commands",
    icon: Terminal,
    count: COMMANDS.length,
  },
  {
    id: "settings" as MenuCategory,
    label: "Settings",
    icon: Settings,
    count: SETTINGS.length,
  },
  {
    id: "mcp" as MenuCategory,
    label: "MCP",
    icon: Plug,
    count: MCPS.length,
  },
  {
    id: "workflows" as MenuCategory,
    label: "Workflows",
    icon: Workflow,
    count: WORKFLOWS.length,
  },
];

/**
 * MenuBuilder Component
 * Horizontal navigation menu for selecting item types
 * Acts as both filter and stack builder
 */
export function MenuBuilder({ selected, onSelect }: MenuBuilderProps) {
  const [hoveredId, setHoveredId] = useState<MenuCategory | null>(null);

  return (
    <div className="sticky top-0 z-40 py-2">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        {/* Horizontal scrollable menu */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-2 border-b border-black/20 bg-white/90 backdrop-blur rounded-lg">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = selected === item.id;
            const isHovered = hoveredId === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSelect(item.id)}
                onMouseEnter={() => setHoveredId(item.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={`
                  flex items-center gap-2 px-3 py-1.5 rounded-lg font-semibold text-sm whitespace-nowrap
                  transition-all duration-200
                  ${isActive
                    ? "bg-black text-white shadow-md"
                    : "bg-transparent text-black/60 hover:bg-black/5 hover:text-black"
                  }
                `}
              >
                {Icon && <Icon size={16} />}
                <span className="inline-block min-w-[70px]">
                  {isHovered ? (
                    <ScrambleText text={item.label} trigger="hover" duration={250} />
                  ) : (
                    item.label
                  )}
                </span>
                {item.count > 0 && (
                  <span
                    className={`
                      ml-1 px-2 py-0.5 rounded-full text-xs font-bold
                      ${isActive
                        ? "bg-lime-300 text-black"
                        : "bg-black/20 text-black/60"
                      }
                    `}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
