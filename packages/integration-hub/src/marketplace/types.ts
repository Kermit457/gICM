/**
 * Pipeline Marketplace - Type Definitions
 */

import { z } from "zod";

// Template categories
export const TemplateCategorySchema = z.enum([
  "automation",
  "analytics",
  "data-processing",
  "integration",
  "monitoring",
  "security",
  "ai-ml",
  "devops",
  "communication",
  "other",
]);
export type TemplateCategory = z.infer<typeof TemplateCategorySchema>;

// Template visibility
export const TemplateVisibilitySchema = z.enum(["public", "private", "unlisted"]);
export type TemplateVisibility = z.infer<typeof TemplateVisibilitySchema>;

// Template status
export const TemplateStatusSchema = z.enum(["draft", "pending_review", "published", "rejected", "archived"]);
export type TemplateStatus = z.infer<typeof TemplateStatusSchema>;

// Author info
export const AuthorSchema = z.object({
  id: z.string(),
  name: z.string(),
  avatar: z.string().url().optional(),
  verified: z.boolean().default(false),
  profileUrl: z.string().url().optional(),
});
export type Author = z.infer<typeof AuthorSchema>;

// Pipeline step definition (for templates)
export const TemplateStepSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  toolId: z.string(),
  config: z.record(z.unknown()).default({}),
  order: z.number(),
});
export type TemplateStep = z.infer<typeof TemplateStepSchema>;

// Input parameter definition
export const TemplateInputSchema = z.object({
  key: z.string(),
  label: z.string(),
  description: z.string().optional(),
  type: z.enum(["string", "number", "boolean", "select", "multiselect", "json"]),
  required: z.boolean().default(true),
  defaultValue: z.unknown().optional(),
  options: z.array(z.object({
    label: z.string(),
    value: z.string(),
  })).optional(),
  validation: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    pattern: z.string().optional(),
    message: z.string().optional(),
  }).optional(),
});
export type TemplateInput = z.infer<typeof TemplateInputSchema>;

// Marketplace template
export const MarketplaceTemplateSchema = z.object({
  id: z.string().uuid(),
  slug: z.string().regex(/^[a-z0-9-]+$/),

  // Basic info
  name: z.string().min(3).max(100),
  description: z.string().max(500),
  longDescription: z.string().max(5000).optional(),
  category: TemplateCategorySchema,
  tags: z.array(z.string()).max(10).default([]),

  // Version
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  changelog: z.string().optional(),

  // Pipeline definition
  steps: z.array(TemplateStepSchema),
  inputs: z.array(TemplateInputSchema).default([]),
  outputs: z.array(z.object({
    key: z.string(),
    description: z.string().optional(),
  })).default([]),

  // Metadata
  author: AuthorSchema,
  visibility: TemplateVisibilitySchema.default("public"),
  status: TemplateStatusSchema.default("draft"),

  // Requirements
  requiredTools: z.array(z.string()).default([]),
  estimatedDuration: z.string().optional(), // e.g., "2-5 minutes"
  estimatedCost: z.object({
    min: z.number(),
    max: z.number(),
    currency: z.string().default("USD"),
  }).optional(),

  // Stats
  stats: z.object({
    installs: z.number().default(0),
    stars: z.number().default(0),
    forks: z.number().default(0),
    views: z.number().default(0),
  }).default({}),

  // Rating
  rating: z.object({
    average: z.number().min(0).max(5).default(0),
    count: z.number().default(0),
  }).default({}),

  // Media
  iconUrl: z.string().url().optional(),
  screenshots: z.array(z.string().url()).max(5).default([]),
  demoUrl: z.string().url().optional(),
  documentationUrl: z.string().url().optional(),
  repositoryUrl: z.string().url().optional(),

  // Timestamps
  createdAt: z.date(),
  updatedAt: z.date(),
  publishedAt: z.date().optional(),
});
export type MarketplaceTemplate = z.infer<typeof MarketplaceTemplateSchema>;

// Template creation input
export const CreateTemplateSchema = MarketplaceTemplateSchema.omit({
  id: true,
  slug: true,
  status: true,
  stats: true,
  rating: true,
  createdAt: true,
  updatedAt: true,
  publishedAt: true,
});
export type CreateTemplate = z.infer<typeof CreateTemplateSchema>;

// Review
export const ReviewSchema = z.object({
  id: z.string().uuid(),
  templateId: z.string().uuid(),
  userId: z.string(),
  userName: z.string(),
  userAvatar: z.string().url().optional(),
  rating: z.number().min(1).max(5),
  title: z.string().max(100).optional(),
  content: z.string().max(2000),
  helpful: z.number().default(0),
  verified: z.boolean().default(false), // Verified user actually used the template
  createdAt: z.date(),
  updatedAt: z.date().optional(),
});
export type Review = z.infer<typeof ReviewSchema>;

// Installation record
export const InstallationSchema = z.object({
  id: z.string().uuid(),
  templateId: z.string().uuid(),
  templateVersion: z.string(),
  userId: z.string(),
  pipelineId: z.string().optional(), // Created pipeline ID
  configOverrides: z.record(z.unknown()).default({}),
  status: z.enum(["installed", "configured", "active", "uninstalled"]),
  installedAt: z.date(),
  lastUsedAt: z.date().optional(),
});
export type Installation = z.infer<typeof InstallationSchema>;

// Search filters
export const SearchFiltersSchema = z.object({
  query: z.string().optional(),
  category: TemplateCategorySchema.optional(),
  tags: z.array(z.string()).optional(),
  author: z.string().optional(),
  minRating: z.number().min(0).max(5).optional(),
  sortBy: z.enum(["relevance", "popular", "recent", "rating", "installs"]).default("relevance"),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});
export type SearchFilters = z.infer<typeof SearchFiltersSchema>;

// Search results
export const SearchResultsSchema = z.object({
  templates: z.array(MarketplaceTemplateSchema),
  total: z.number(),
  page: z.number(),
  totalPages: z.number(),
  hasMore: z.boolean(),
});
export type SearchResults = z.infer<typeof SearchResultsSchema>;

// Featured collections
export const CollectionSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string(),
  slug: z.string(),
  iconUrl: z.string().url().optional(),
  templates: z.array(z.string().uuid()), // Template IDs
  featured: z.boolean().default(false),
  order: z.number().default(0),
  createdAt: z.date(),
});
export type Collection = z.infer<typeof CollectionSchema>;

// Marketplace events
export interface MarketplaceEvents {
  "template:created": (template: MarketplaceTemplate) => void;
  "template:updated": (template: MarketplaceTemplate) => void;
  "template:published": (template: MarketplaceTemplate) => void;
  "template:installed": (installation: Installation) => void;
  "template:uninstalled": (templateId: string, userId: string) => void;
  "template:starred": (templateId: string, userId: string) => void;
  "template:reviewed": (review: Review) => void;
}

// Category metadata
export const CATEGORY_INFO: Record<TemplateCategory, { label: string; icon: string; description: string }> = {
  automation: {
    label: "Automation",
    icon: "⚡",
    description: "Automate repetitive tasks and workflows",
  },
  analytics: {
    label: "Analytics",
    icon: "📊",
    description: "Data analysis and reporting pipelines",
  },
  "data-processing": {
    label: "Data Processing",
    icon: "🔄",
    description: "ETL, transformation, and data pipelines",
  },
  integration: {
    label: "Integration",
    icon: "🔗",
    description: "Connect services and sync data",
  },
  monitoring: {
    label: "Monitoring",
    icon: "👁️",
    description: "System monitoring and alerting",
  },
  security: {
    label: "Security",
    icon: "🔒",
    description: "Security scanning and compliance",
  },
  "ai-ml": {
    label: "AI/ML",
    icon: "🤖",
    description: "Machine learning and AI pipelines",
  },
  devops: {
    label: "DevOps",
    icon: "🛠️",
    description: "CI/CD and infrastructure automation",
  },
  communication: {
    label: "Communication",
    icon: "💬",
    description: "Notifications, messaging, and alerts",
  },
  other: {
    label: "Other",
    icon: "📦",
    description: "Miscellaneous templates",
  },
};
