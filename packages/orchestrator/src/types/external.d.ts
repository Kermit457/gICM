/**
 * Type declarations for external packages that don't ship their own types.
 */

declare module "@gicm/growth-engine" {
  export interface GrowthEngineConfig {
    blog?: {
      postsPerWeek?: number;
      categories?: string[];
      targetWordCount?: number;
    };
    twitter?: {
      tweetsPerDay?: number;
      threadsPerWeek?: number;
      engagementEnabled?: boolean;
    };
    seo?: {
      primaryKeywords?: string[];
      competitors?: string[];
      targetPositions?: Record<string, number>;
    };
    discord?: {
      serverId?: string;
      announcementChannel?: string;
      contentChannel?: string;
    };
  }

  export interface BlogPost {
    id?: string;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    tags: string[];
  }

  export interface Tweet {
    id?: string;
    text?: string;
  }

  export interface EngineStatus {
    running: boolean;
    startedAt: number | null;
    metrics: {
      traffic: { daily: number; weekly: number; monthly: number; trend: string };
      content: { postsPublished: number; totalViews: number; avgEngagement: number; blogPosts?: number; tweets?: number };
      engagement: { twitterFollowers: number; discordMembers: number; newsletterSubs: number };
      seo: { avgPosition: number; indexedPages: number; backlinks: number };
    };
    upcomingContent: {
      week: string;
      blogPosts: BlogPost[];
      tweets: Tweet[];
      threads: unknown[];
    };
  }

  export class GrowthEngine {
    constructor(config?: Partial<GrowthEngineConfig>);
    start(): Promise<void>;
    stop(): Promise<void>;
    getStatus(): EngineStatus;
    generateNow(type: "blog" | "tweet" | "thread"): Promise<void>;
    announceUpdate(version: string, changes: string[]): Promise<void>;
    announceFeature(feature: { name: string; description: string; url?: string }): Promise<void>;
    announceAgent(agent: { name: string; description: string; capabilities: string[] }): Promise<void>;
    announceComponent(component: { name: string; description: string; category: string }): Promise<void>;
  }
}

declare module "@gicm/product-engine" {
  export interface ProductEngineConfig {
    discovery?: {
      enabled?: boolean;
      sources?: string[];
      intervalHours?: number;
    };
    building?: {
      autoBuild?: boolean;
      autoApprove?: boolean;
      outputDir?: string;
    };
    quality?: {
      minTestScore?: number;
      minReviewScore?: number;
      requireApproval?: boolean;
    };
    deployment?: {
      autoDeploy?: boolean;
      registry?: string;
      notifications?: boolean;
    };
  }

  export interface Opportunity {
    id: string;
    title: string;
    description: string;
    status: string;
    priority?: string;
    scores?: {
      overall: number;
    };
  }

  export interface BuildTask {
    id: string;
    status: string;
    opportunityId?: string;
    type?: string;
    spec?: unknown;
    progress?: number;
    startedAt?: number;
    completedAt?: number;
    logs?: string[];
    error?: string;
  }

  export interface EngineStatus {
    running: boolean;
    startedAt: number | null;
    metrics: {
      discovered: number;
      built: number;
      deployed: number;
      failed: number;
      avgBuildTime: number;
      avgQualityScore: number;
    };
    backlog: Opportunity[];
    activeBuild: BuildTask | null;
    recentBuilds: BuildTask[];
  }

  export class ProductEngine {
    constructor(config?: Partial<ProductEngineConfig>);
    start(): Promise<void>;
    stop(): void;
    runDiscovery(): Promise<Opportunity[]>;
    processNextBuild(): Promise<BuildTask | null>;
    getBacklog(): Opportunity[];
    getStatus(): EngineStatus;
    approveOpportunity(id: string): void;
    rejectOpportunity(id: string, reason: string): void;
  }
}
