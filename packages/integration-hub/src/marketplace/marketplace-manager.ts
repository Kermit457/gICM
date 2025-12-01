/**
 * Marketplace Manager - Template discovery, installation, and management
 */

import { EventEmitter } from "eventemitter3";
import { v4 as uuidv4 } from "uuid";
import {
  MarketplaceTemplate,
  CreateTemplate,
  MarketplaceTemplateSchema,
  CreateTemplateSchema,
  Review,
  ReviewSchema,
  Installation,
  InstallationSchema,
  Collection,
  SearchFilters,
  SearchResults,
  MarketplaceEvents,
  TemplateCategory,
  CATEGORY_INFO,
} from "./types.js";

export interface MarketplaceManagerConfig {
  featuredRefreshMs?: number;
  cacheEnabled?: boolean;
  cacheTtlMs?: number;
}

const DEFAULT_CONFIG: Required<MarketplaceManagerConfig> = {
  featuredRefreshMs: 3600000, // 1 hour
  cacheEnabled: true,
  cacheTtlMs: 300000, // 5 minutes
};

export class MarketplaceManager extends EventEmitter<MarketplaceEvents> {
  private config: Required<MarketplaceManagerConfig>;
  private templates: Map<string, MarketplaceTemplate> = new Map();
  private reviews: Map<string, Review[]> = new Map();
  private installations: Map<string, Installation[]> = new Map();
  private collections: Map<string, Collection> = new Map();
  private userStars: Map<string, Set<string>> = new Map(); // userId -> templateIds
  private searchCache: Map<string, { results: SearchResults; timestamp: number }> = new Map();

  constructor(config: MarketplaceManagerConfig = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // Create a new template (draft)
  async createTemplate(input: CreateTemplate, authorId: string): Promise<MarketplaceTemplate> {
    const validated = CreateTemplateSchema.parse(input);

    const now = new Date();
    const slug = this.generateSlug(validated.name);

    const template: MarketplaceTemplate = MarketplaceTemplateSchema.parse({
      ...validated,
      id: uuidv4(),
      slug,
      status: "draft",
      stats: { installs: 0, stars: 0, forks: 0, views: 0 },
      rating: { average: 0, count: 0 },
      createdAt: now,
      updatedAt: now,
    });

    this.templates.set(template.id, template);
    this.reviews.set(template.id, []);

    this.emit("template:created", template);
    console.log(`[Marketplace] Created template: ${template.name}`);

    return template;
  }

  // Get template by ID
  getTemplate(id: string): MarketplaceTemplate | undefined {
    return this.templates.get(id);
  }

  // Get template by slug
  getTemplateBySlug(slug: string): MarketplaceTemplate | undefined {
    return Array.from(this.templates.values()).find((t) => t.slug === slug);
  }

  // Update template
  async updateTemplate(
    id: string,
    updates: Partial<CreateTemplate>
  ): Promise<MarketplaceTemplate | null> {
    const template = this.templates.get(id);
    if (!template) return null;

    const updated: MarketplaceTemplate = {
      ...template,
      ...updates,
      updatedAt: new Date(),
    };

    this.templates.set(id, updated);
    this.emit("template:updated", updated);

    return updated;
  }

  // Submit template for review
  async submitForReview(id: string): Promise<MarketplaceTemplate | null> {
    const template = this.templates.get(id);
    if (!template || template.status !== "draft") return null;

    template.status = "pending_review";
    template.updatedAt = new Date();
    this.templates.set(id, template);

    return template;
  }

  // Publish template (admin action)
  async publishTemplate(id: string): Promise<MarketplaceTemplate | null> {
    const template = this.templates.get(id);
    if (!template) return null;

    template.status = "published";
    template.publishedAt = new Date();
    template.updatedAt = new Date();
    this.templates.set(id, template);

    this.emit("template:published", template);
    console.log(`[Marketplace] Published template: ${template.name}`);

    return template;
  }

  // Search templates
  async search(filters: SearchFilters): Promise<SearchResults> {
    const cacheKey = JSON.stringify(filters);

    // Check cache
    if (this.config.cacheEnabled) {
      const cached = this.searchCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.config.cacheTtlMs) {
        return cached.results;
      }
    }

    let results = Array.from(this.templates.values()).filter(
      (t) => t.status === "published" && t.visibility === "public"
    );

    // Apply filters
    if (filters.query) {
      const query = filters.query.toLowerCase();
      results = results.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query) ||
          t.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    if (filters.category) {
      results = results.filter((t) => t.category === filters.category);
    }

    if (filters.tags?.length) {
      results = results.filter((t) =>
        filters.tags!.some((tag) => t.tags.includes(tag))
      );
    }

    if (filters.author) {
      results = results.filter((t) => t.author.id === filters.author);
    }

    if (filters.minRating !== undefined) {
      results = results.filter((t) => t.rating.average >= filters.minRating!);
    }

    // Sort
    switch (filters.sortBy) {
      case "popular":
        results.sort((a, b) => b.stats.installs - a.stats.installs);
        break;
      case "recent":
        results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        break;
      case "rating":
        results.sort((a, b) => b.rating.average - a.rating.average);
        break;
      case "installs":
        results.sort((a, b) => b.stats.installs - a.stats.installs);
        break;
      default: // relevance - if query, prioritize name matches
        if (filters.query) {
          const query = filters.query.toLowerCase();
          results.sort((a, b) => {
            const aNameMatch = a.name.toLowerCase().includes(query) ? 1 : 0;
            const bNameMatch = b.name.toLowerCase().includes(query) ? 1 : 0;
            return bNameMatch - aNameMatch || b.stats.installs - a.stats.installs;
          });
        }
    }

    // Paginate
    const total = results.length;
    const start = (filters.page - 1) * filters.limit;
    const paginatedResults = results.slice(start, start + filters.limit);

    const searchResults: SearchResults = {
      templates: paginatedResults,
      total,
      page: filters.page,
      totalPages: Math.ceil(total / filters.limit),
      hasMore: start + filters.limit < total,
    };

    // Cache results
    if (this.config.cacheEnabled) {
      this.searchCache.set(cacheKey, { results: searchResults, timestamp: Date.now() });
    }

    return searchResults;
  }

  // Get featured templates
  async getFeatured(): Promise<MarketplaceTemplate[]> {
    return Array.from(this.templates.values())
      .filter((t) => t.status === "published" && t.visibility === "public")
      .sort((a, b) => b.stats.installs - a.stats.installs)
      .slice(0, 8);
  }

  // Get templates by category
  async getByCategory(category: TemplateCategory): Promise<MarketplaceTemplate[]> {
    return Array.from(this.templates.values())
      .filter(
        (t) =>
          t.status === "published" &&
          t.visibility === "public" &&
          t.category === category
      )
      .sort((a, b) => b.stats.installs - a.stats.installs);
  }

  // Get category stats
  getCategoryStats(): Array<{ category: TemplateCategory; count: number; info: typeof CATEGORY_INFO[TemplateCategory] }> {
    const counts = new Map<TemplateCategory, number>();

    for (const template of this.templates.values()) {
      if (template.status === "published" && template.visibility === "public") {
        counts.set(template.category, (counts.get(template.category) || 0) + 1);
      }
    }

    return Object.entries(CATEGORY_INFO).map(([category, info]) => ({
      category: category as TemplateCategory,
      count: counts.get(category as TemplateCategory) || 0,
      info,
    }));
  }

  // Install template
  async installTemplate(
    templateId: string,
    userId: string,
    configOverrides?: Record<string, unknown>
  ): Promise<Installation> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    const installation: Installation = InstallationSchema.parse({
      id: uuidv4(),
      templateId,
      templateVersion: template.version,
      userId,
      configOverrides: configOverrides || {},
      status: "installed",
      installedAt: new Date(),
    });

    // Store installation
    const userInstalls = this.installations.get(userId) || [];
    userInstalls.push(installation);
    this.installations.set(userId, userInstalls);

    // Update stats
    template.stats.installs++;
    this.templates.set(templateId, template);

    this.emit("template:installed", installation);
    console.log(`[Marketplace] User ${userId} installed: ${template.name}`);

    return installation;
  }

  // Uninstall template
  async uninstallTemplate(templateId: string, userId: string): Promise<boolean> {
    const userInstalls = this.installations.get(userId);
    if (!userInstalls) return false;

    const index = userInstalls.findIndex((i) => i.templateId === templateId);
    if (index === -1) return false;

    userInstalls[index].status = "uninstalled";
    this.installations.set(userId, userInstalls);

    this.emit("template:uninstalled", templateId, userId);
    return true;
  }

  // Get user installations
  getUserInstallations(userId: string): Installation[] {
    return (this.installations.get(userId) || []).filter(
      (i) => i.status !== "uninstalled"
    );
  }

  // Star template
  async starTemplate(templateId: string, userId: string): Promise<boolean> {
    const template = this.templates.get(templateId);
    if (!template) return false;

    const userStarSet = this.userStars.get(userId) || new Set();

    if (userStarSet.has(templateId)) {
      // Unstar
      userStarSet.delete(templateId);
      template.stats.stars = Math.max(0, template.stats.stars - 1);
    } else {
      // Star
      userStarSet.add(templateId);
      template.stats.stars++;
      this.emit("template:starred", templateId, userId);
    }

    this.userStars.set(userId, userStarSet);
    this.templates.set(templateId, template);

    return userStarSet.has(templateId);
  }

  // Check if user starred template
  isStarred(templateId: string, userId: string): boolean {
    return this.userStars.get(userId)?.has(templateId) || false;
  }

  // Add review
  async addReview(
    templateId: string,
    userId: string,
    userName: string,
    rating: number,
    content: string,
    title?: string
  ): Promise<Review> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    // Check if user already reviewed
    const templateReviews = this.reviews.get(templateId) || [];
    const existingReview = templateReviews.find((r) => r.userId === userId);
    if (existingReview) {
      throw new Error("User already reviewed this template");
    }

    // Check if user installed the template
    const userInstalls = this.installations.get(userId) || [];
    const hasInstalled = userInstalls.some(
      (i) => i.templateId === templateId && i.status !== "uninstalled"
    );

    const review: Review = ReviewSchema.parse({
      id: uuidv4(),
      templateId,
      userId,
      userName,
      rating,
      title,
      content,
      helpful: 0,
      verified: hasInstalled,
      createdAt: new Date(),
    });

    templateReviews.push(review);
    this.reviews.set(templateId, templateReviews);

    // Update template rating
    const totalRatings = templateReviews.reduce((sum, r) => sum + r.rating, 0);
    template.rating = {
      average: totalRatings / templateReviews.length,
      count: templateReviews.length,
    };
    this.templates.set(templateId, template);

    this.emit("template:reviewed", review);

    return review;
  }

  // Get reviews for template
  getReviews(templateId: string): Review[] {
    return (this.reviews.get(templateId) || []).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  // Record view
  recordView(templateId: string): void {
    const template = this.templates.get(templateId);
    if (template) {
      template.stats.views++;
      this.templates.set(templateId, template);
    }
  }

  // Generate URL-friendly slug
  private generateSlug(name: string): string {
    let slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    // Ensure uniqueness
    let uniqueSlug = slug;
    let counter = 1;
    while (this.getTemplateBySlug(uniqueSlug)) {
      uniqueSlug = `${slug}-${counter}`;
      counter++;
    }

    return uniqueSlug;
  }

  // Clear search cache
  clearCache(): void {
    this.searchCache.clear();
  }
}

// Singleton instance
let marketplaceManager: MarketplaceManager | null = null;

export function getMarketplaceManager(config?: MarketplaceManagerConfig): MarketplaceManager {
  if (!marketplaceManager) {
    marketplaceManager = new MarketplaceManager(config);
  }
  return marketplaceManager;
}

export function createMarketplaceManager(config?: MarketplaceManagerConfig): MarketplaceManager {
  return new MarketplaceManager(config);
}
