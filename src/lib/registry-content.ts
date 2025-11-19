import type { RegistryItem } from "@/types/registry";

export const CONTENT_AGENTS: RegistryItem[] = [
  {
    id: "content-gemini-seo",
    kind: "agent",
    name: "Gemini SEO Master",
    slug: "gemini-seo",
    description: "SEO content optimizer using Gemini 3.0 Pro's 2M context window.",
    longDescription: "Analyzes top 20 SERP results and generates comprehensive, keyword-optimized articles that outrank competitors. Uses semantic keyword clustering and schema markup generation.",
    category: "Content Pipelines",
    tags: ["Gemini", "SEO", "Content", "Marketing"],
    install: "npx aether install agent:gemini-seo",
    platforms: ["gemini"],
    compatibility: {
      models: ["gemini-3.0-pro"],
      software: ["terminal", "cursor"],
    },
  },
  {
    id: "content-claude-writer",
    kind: "agent",
    name: "Claude Ghostwriter",
    slug: "claude-writer",
    description: "Long-form content specialist mimicking human tone and nuance.",
    longDescription: "Specialized in writing essays, technical documentation, and thought leadership pieces. Trained to avoid 'AI-isms' and maintain a consistent brand voice across long documents.",
    category: "Content Pipelines",
    tags: ["Claude", "Writing", "Content", "Blog"],
    install: "npx aether install agent:claude-writer",
    platforms: ["claude"],
    compatibility: {
      models: ["sonnet-4.5", "opus"],
      software: ["terminal", "cursor"],
    },
  },
  {
    id: "content-video-script-pro",
    kind: "agent",
    name: "Video Script Pro",
    slug: "video-script-pro",
    description: "YouTube script generator with hook, retention, and CTA optimization.",
    category: "Content Pipelines",
    tags: ["Universal", "Video", "YouTube", "Script"],
    install: "npx aether install agent:video-script-pro",
    platforms: ["claude", "gemini", "openai"],
    compatibility: {
      models: ["sonnet-4.5", "gemini-3.0-pro", "gpt-4o"],
      software: ["terminal", "cursor"],
    },
  },
];
