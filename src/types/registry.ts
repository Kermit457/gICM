import { z } from "zod";

export const ItemKindSchema = z.enum(["agent", "skill", "command", "mcp", "setting"]);

export const RegistryItemSchema = z.object({
  id: z.string(),
  kind: ItemKindSchema,
  name: z.string(),
  slug: z.string(),
  description: z.string(),
  longDescription: z.string().optional(),
  category: z.string(),
  tags: z.array(z.string()),
  dependencies: z.array(z.string()).optional().default([]),
  files: z.array(z.string()).optional().default([]),
  install: z.string(),
  setup: z.string().optional(),
  envKeys: z.array(z.string()).optional().default([]),
  repoPath: z.string().optional(),
  docsUrl: z.string().optional(),
  installs: z.number().optional().default(0),
  remixes: z.number().optional().default(0),
  tokenSavings: z.number().optional(), // for skills (percentage)
  layer: z.enum([".agent", ".claude", "docs"]).optional(), // for agents
  modelRecommendation: z.enum(["sonnet", "opus", "haiku"]).optional(), // for agents
});

// Manual type with proper optionals
export type RegistryItem = {
  id: string;
  kind: "agent" | "skill" | "command" | "mcp" | "setting";
  name: string;
  slug: string;
  description: string;
  longDescription?: string;
  category: string;
  tags: string[];
  dependencies?: string[];
  files?: string[];
  install: string;
  setup?: string;
  envKeys?: string[];
  repoPath?: string;
  docsUrl?: string;
  installs?: number;
  remixes?: number;
  tokenSavings?: number;
  layer?: ".agent" | ".claude" | "docs";
  modelRecommendation?: "sonnet" | "opus" | "haiku";
};
export type ItemKind = z.infer<typeof ItemKindSchema>;

// Settings-specific schema
export const SettingCategorySchema = z.enum([
  "Performance",
  "Security",
  "Development",
  "Integration",
  "Monitoring",
  "Optimization",
]);

export const SettingTypeSchema = z.enum([
  "boolean",
  "number",
  "string",
  "object",
  "array",
]);

export const ConfigLocationSchema = z.enum([
  ".claude/settings.json",
  "claude_desktop_config.json",
  ".env",
]);

export const SettingSchema = RegistryItemSchema.extend({
  kind: z.literal("setting"),
  category: SettingCategorySchema,
  settingType: SettingTypeSchema,
  defaultValue: z.any(),
  affectedComponents: z.array(z.string()).optional(), // IDs of agents/skills/mcps affected
  configLocation: ConfigLocationSchema,
  validationSchema: z
    .object({
      min: z.number().optional(),
      max: z.number().optional(),
      pattern: z.string().optional(),
      enum: z.array(z.any()).optional(),
    })
    .optional(),
  conflictsWith: z.array(z.string()).optional(),
});

export type Setting = z.infer<typeof SettingSchema>;
export type SettingCategory = z.infer<typeof SettingCategorySchema>;
export type SettingType = z.infer<typeof SettingTypeSchema>;

export const BundleSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string(),
  includes: z.array(z.string()),
  recommended: z.boolean().default(false),
});

export type Bundle = z.infer<typeof BundleSchema>;

export interface StackExport {
  name: string;
  created: Date;
  items: RegistryItem[];
  dependencies: RegistryItem[];
}
