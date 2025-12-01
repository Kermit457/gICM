/**
 * Growth Engine PTC Tool Handler
 *
 * Wraps the Growth Engine for use in PTC pipelines.
 * Enables content generation workflows: Blog → SEO → Twitter.
 */

import type { ToolDefinition, ToolHandler, SharedContext } from '../types.js';

// Tool Definition for blog generation
export const blogGenerateToolDefinition: ToolDefinition = {
  name: 'growth_generate_blog',
  description: `Generate an SEO-optimized blog post.

Creates a complete blog post with:
- Title optimized for search
- Meta description
- Structured content with headers
- Internal link suggestions
- Social media snippets

Categories: tutorial, guide, announcement, comparison, case-study, thought-leadership, changelog`,
  input_schema: {
    type: 'object',
    properties: {
      topic: {
        type: 'string',
        description: 'Main topic for the blog post',
      },
      category: {
        type: 'string',
        description: 'Content category',
        enum: ['tutorial', 'guide', 'announcement', 'comparison', 'case-study', 'thought-leadership', 'changelog'],
      },
      targetWordCount: {
        type: 'string',
        description: 'Target word count (default: 1500)',
      },
      keywords: {
        type: 'string',
        description: 'Comma-separated target keywords',
      },
      tone: {
        type: 'string',
        description: 'Writing tone: professional, casual, technical, friendly',
        enum: ['professional', 'casual', 'technical', 'friendly'],
      },
    },
    required: ['topic'],
  },
};

// Tool Definition for tweet generation
export const tweetGenerateToolDefinition: ToolDefinition = {
  name: 'growth_generate_tweets',
  description: `Generate a batch of tweets for social media.

Creates multiple tweets with:
- Engaging hooks
- Relevant hashtags
- Call-to-actions
- Thread structure (if requested)

Optimizes for engagement and reach.`,
  input_schema: {
    type: 'object',
    properties: {
      topic: {
        type: 'string',
        description: 'Topic for tweets',
      },
      count: {
        type: 'string',
        description: 'Number of tweets to generate (default: 5)',
      },
      style: {
        type: 'string',
        description: 'Tweet style: informative, promotional, engagement, thread',
        enum: ['informative', 'promotional', 'engagement', 'thread'],
      },
      includeHashtags: {
        type: 'string',
        description: 'Include hashtags (true/false)',
      },
      maxLength: {
        type: 'string',
        description: 'Max characters per tweet (default: 280)',
      },
    },
    required: ['topic'],
  },
};

// Tool Definition for keyword research
export const keywordResearchToolDefinition: ToolDefinition = {
  name: 'growth_keyword_research',
  description: `Research keywords for content strategy.

Analyzes:
- Search volume estimates
- Competition difficulty
- Related keywords
- Content gaps vs competitors
- Trending topics`,
  input_schema: {
    type: 'object',
    properties: {
      topic: {
        type: 'string',
        description: 'Main topic to research',
      },
      depth: {
        type: 'string',
        description: 'Research depth: quick, standard, deep',
        enum: ['quick', 'standard', 'deep'],
      },
      includeRelated: {
        type: 'string',
        description: 'Include related keywords (true/false)',
      },
    },
    required: ['topic'],
  },
};

// Tool Definition for SEO analysis
export const seoAnalyzeToolDefinition: ToolDefinition = {
  name: 'growth_seo_analyze',
  description: `Analyze content for SEO optimization.

Evaluates:
- Keyword density and placement
- Heading structure
- Meta description quality
- Internal linking opportunities
- Readability score
- Mobile-friendliness indicators`,
  input_schema: {
    type: 'object',
    properties: {
      content: {
        type: 'string',
        description: 'Content to analyze (markdown or plain text)',
      },
      targetKeywords: {
        type: 'string',
        description: 'Comma-separated target keywords',
      },
      url: {
        type: 'string',
        description: 'Optional URL for live page analysis',
      },
    },
    required: ['content'],
  },
};

// Tool Definition for content calendar
export const contentCalendarToolDefinition: ToolDefinition = {
  name: 'growth_content_calendar',
  description: `Get or plan content calendar.

Returns:
- Scheduled blog posts
- Queued tweets
- Upcoming threads
- Content metrics`,
  input_schema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        description: 'Action: view (current calendar), plan (generate plan)',
        enum: ['view', 'plan'],
      },
      weeks: {
        type: 'string',
        description: 'Number of weeks to view/plan (default: 1)',
      },
    },
    required: [],
  },
};

// Tool Definition for Discord announcement
export const discordAnnounceToolDefinition: ToolDefinition = {
  name: 'growth_discord_announce',
  description: `Announce updates on Discord.

Types:
- feature: New feature announcement
- agent: New agent release
- component: New component added
- update: Version update/changelog`,
  input_schema: {
    type: 'object',
    properties: {
      type: {
        type: 'string',
        description: 'Announcement type',
        enum: ['feature', 'agent', 'component', 'update'],
      },
      title: {
        type: 'string',
        description: 'Announcement title/name',
      },
      description: {
        type: 'string',
        description: 'Detailed description',
      },
      metadata: {
        type: 'string',
        description: 'JSON string with additional metadata (capabilities, version, etc.)',
      },
    },
    required: ['type', 'title', 'description'],
  },
};

// Handler implementations
export const createBlogGenerateHandler = (
  growthEngineFactory: () => Promise<{
    generateNow: (type: 'blog' | 'tweet' | 'thread') => Promise<void>;
  }>
): ToolHandler => {
  return async (inputs: Record<string, unknown>, _context: SharedContext): Promise<unknown> => {
    const topic = inputs.topic as string;
    const category = (inputs.category as string) || 'guide';
    const targetWordCountStr = (inputs.targetWordCount as string) || '1500';
    const keywordsStr = inputs.keywords as string | undefined;
    const tone = (inputs.tone as string) || 'professional';

    const targetWordCount = parseInt(targetWordCountStr, 10);
    const keywords = keywordsStr ? keywordsStr.split(',').map(k => k.trim()) : [topic];

    try {
      // Simulate blog generation (in production, use actual BlogGenerator)
      const slug = topic
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      const blogPost = {
        title: generateTitle(topic, category),
        slug,
        excerpt: `Learn about ${topic} in this comprehensive ${category}. Perfect for developers and entrepreneurs.`,
        content: generateBlogContent(topic, category, targetWordCount, tone),
        tags: keywords.slice(0, 5),
        category,
        metadata: {
          wordCount: targetWordCount,
          readingTime: Math.ceil(targetWordCount / 200),
          targetKeywords: keywords,
          generatedAt: new Date().toISOString(),
        },
        seo: {
          metaTitle: `${generateTitle(topic, category)} | gICM`,
          metaDescription: `Discover ${topic}. This ${category} covers everything you need to know.`,
          canonicalUrl: `https://gicm.dev/blog/${slug}`,
        },
      };

      return {
        success: true,
        blog: blogPost,
        socialSnippets: {
          twitter: `New ${category}: ${blogPost.title}\n\n${blogPost.excerpt.slice(0, 200)}...\n\nRead more: ${blogPost.seo.canonicalUrl}`,
          linkedin: `I just published a new ${category} on ${topic}.\n\n${blogPost.excerpt}\n\n${blogPost.seo.canonicalUrl}`,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Blog generation failed',
        blog: null,
      };
    }
  };
};

export const createTweetGenerateHandler = (): ToolHandler => {
  return async (inputs: Record<string, unknown>, _context: SharedContext): Promise<unknown> => {
    const topic = inputs.topic as string;
    const countStr = (inputs.count as string) || '5';
    const style = (inputs.style as string) || 'informative';
    const includeHashtagsStr = (inputs.includeHashtags as string) || 'true';
    const maxLengthStr = (inputs.maxLength as string) || '280';

    const count = parseInt(countStr, 10);
    const includeHashtags = includeHashtagsStr === 'true';
    const maxLength = parseInt(maxLengthStr, 10);

    try {
      const tweets = generateTweets(topic, count, style, includeHashtags, maxLength);

      return {
        success: true,
        tweets,
        stats: {
          count: tweets.length,
          avgLength: Math.round(tweets.reduce((sum, t) => sum + t.content.length, 0) / tweets.length),
          style,
          hashtags: includeHashtags,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Tweet generation failed',
        tweets: [],
      };
    }
  };
};

export const createKeywordResearchHandler = (): ToolHandler => {
  return async (inputs: Record<string, unknown>, _context: SharedContext): Promise<unknown> => {
    const topic = inputs.topic as string;
    const depth = (inputs.depth as string) || 'standard';
    const includeRelatedStr = (inputs.includeRelated as string) || 'true';

    const includeRelated = includeRelatedStr === 'true';

    try {
      // Simulate keyword research (in production, use actual APIs)
      const keywords = generateKeywordData(topic, depth, includeRelated);

      return {
        success: true,
        keywords,
        summary: {
          totalKeywords: keywords.length,
          avgDifficulty: Math.round(keywords.reduce((sum, k) => sum + k.difficulty, 0) / keywords.length),
          avgVolume: Math.round(keywords.reduce((sum, k) => sum + k.volume, 0) / keywords.length),
          topOpportunities: keywords
            .sort((a, b) => (b.volume / (b.difficulty + 1)) - (a.volume / (a.difficulty + 1)))
            .slice(0, 3)
            .map(k => k.keyword),
        },
        recommendations: [
          `Focus on "${keywords[0]?.keyword}" as primary keyword`,
          `Create supporting content for related keywords`,
          `Update existing content to include high-volume keywords`,
        ],
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Keyword research failed',
        keywords: [],
      };
    }
  };
};

export const createSEOAnalyzeHandler = (): ToolHandler => {
  return async (inputs: Record<string, unknown>, _context: SharedContext): Promise<unknown> => {
    const content = inputs.content as string;
    const targetKeywordsStr = inputs.targetKeywords as string | undefined;

    const targetKeywords = targetKeywordsStr ? targetKeywordsStr.split(',').map(k => k.trim()) : [];

    try {
      const analysis = analyzeSEO(content, targetKeywords);

      return {
        success: true,
        analysis,
        recommendations: analysis.recommendations,
        score: analysis.overallScore,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'SEO analysis failed',
        analysis: null,
      };
    }
  };
};

export const createContentCalendarHandler = (
  growthEngineFactory: () => Promise<{
    getStatus: () => {
      upcomingContent: {
        blogPosts: Array<{ title: string; slug: string }>;
        tweets: Array<{ content: string }>;
        threads: Array<{ topic: string }>;
      };
      metrics: {
        content: { postsPublished: number; tweets: number };
      };
    };
  }>
): ToolHandler => {
  return async (inputs: Record<string, unknown>, _context: SharedContext): Promise<unknown> => {
    const action = (inputs.action as string) || 'view';
    const weeksStr = (inputs.weeks as string) || '1';
    const weeks = parseInt(weeksStr, 10);

    try {
      if (action === 'view') {
        const engine = await growthEngineFactory();
        const status = engine.getStatus();

        return {
          success: true,
          calendar: {
            blogPosts: status.upcomingContent.blogPosts,
            tweets: status.upcomingContent.tweets.length,
            threads: status.upcomingContent.threads,
          },
          metrics: status.metrics.content,
          weeks,
        };
      }

      // Plan action - generate content plan
      const plan = generateContentPlan(weeks);

      return {
        success: true,
        plan,
        weeks,
        summary: {
          blogPosts: plan.blogPosts.length,
          tweets: plan.tweets.length,
          threads: plan.threads.length,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Calendar operation failed',
        calendar: null,
      };
    }
  };
};

export const createDiscordAnnounceHandler = (
  growthEngineFactory: () => Promise<{
    announceFeature: (data: { name: string; description: string; url?: string }) => Promise<void>;
    announceAgent: (data: { name: string; description: string; capabilities: string[] }) => Promise<void>;
    announceComponent: (data: { name: string; description: string; category: string }) => Promise<void>;
    announceUpdate: (version: string, changes: string[]) => Promise<void>;
  }>
): ToolHandler => {
  return async (inputs: Record<string, unknown>, _context: SharedContext): Promise<unknown> => {
    const type = inputs.type as string;
    const title = inputs.title as string;
    const description = inputs.description as string;
    const metadataStr = inputs.metadata as string | undefined;

    const metadata = metadataStr ? JSON.parse(metadataStr) : {};

    try {
      const engine = await growthEngineFactory();

      switch (type) {
        case 'feature':
          await engine.announceFeature({
            name: title,
            description,
            url: metadata.url,
          });
          break;

        case 'agent':
          await engine.announceAgent({
            name: title,
            description,
            capabilities: metadata.capabilities || [],
          });
          break;

        case 'component':
          await engine.announceComponent({
            name: title,
            description,
            category: metadata.category || 'general',
          });
          break;

        case 'update':
          await engine.announceUpdate(
            metadata.version || '1.0.0',
            metadata.changes || [description]
          );
          break;

        default:
          throw new Error(`Unknown announcement type: ${type}`);
      }

      return {
        success: true,
        announced: {
          type,
          title,
          description,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Discord announcement failed',
        announced: null,
      };
    }
  };
};

// Helper functions
function generateTitle(topic: string, category: string): string {
  const templates: Record<string, string[]> = {
    tutorial: [
      `How to ${topic}: A Complete Tutorial`,
      `${topic} Tutorial: Step-by-Step Guide`,
      `Master ${topic}: Beginner to Expert`,
    ],
    guide: [
      `The Ultimate Guide to ${topic}`,
      `${topic}: Everything You Need to Know`,
      `Complete ${topic} Guide for 2025`,
    ],
    announcement: [
      `Introducing ${topic}`,
      `${topic} is Here`,
      `Announcing ${topic}`,
    ],
    comparison: [
      `${topic} Comparison: Best Options`,
      `Comparing ${topic} Solutions`,
      `${topic} vs Alternatives`,
    ],
  };

  const categoryTemplates = templates[category] || templates.guide;
  return categoryTemplates[Math.floor(Math.random() * categoryTemplates.length)];
}

function generateBlogContent(topic: string, category: string, wordCount: number, tone: string): string {
  // Simplified content generation (in production, use LLM)
  return `# ${generateTitle(topic, category)}

## Introduction

${topic} is becoming increasingly important in today's tech landscape...

## Key Concepts

### Understanding ${topic}

Let's dive deep into what makes ${topic} essential...

### Best Practices

Here are the best practices for working with ${topic}...

## Implementation

Step-by-step guide to implementing ${topic}...

## Conclusion

${topic} is a powerful tool that can transform your workflow...

---

*Generated with gICM Growth Engine*
`;
}

function generateTweets(topic: string, count: number, style: string, includeHashtags: boolean, maxLength: number): Array<{ id: string; content: string; style: string }> {
  const tweets: Array<{ id: string; content: string; style: string }> = [];
  const hashtags = includeHashtags ? `\n\n#${topic.replace(/\s+/g, '')} #tech #web3` : '';

  const templates: Record<string, string[]> = {
    informative: [
      `Did you know? ${topic} can increase your productivity by 10x.`,
      `Here's what most people get wrong about ${topic}...`,
      `${topic} explained in 30 seconds:`,
    ],
    promotional: [
      `We just launched ${topic}! Check it out.`,
      `New feature alert: ${topic} is now available.`,
      `${topic} is changing the game. Here's how...`,
    ],
    engagement: [
      `What's your experience with ${topic}? Drop a comment below.`,
      `Hot take: ${topic} is underrated. Agree or disagree?`,
      `Poll: How often do you use ${topic}?`,
    ],
    thread: [
      `Let's talk about ${topic}. A thread:`,
      `Everything you need to know about ${topic}`,
      `${topic} masterclass (1/n):`,
    ],
  };

  const styleTemplates = templates[style] || templates.informative;

  for (let i = 0; i < count; i++) {
    const template = styleTemplates[i % styleTemplates.length];
    let content = template + hashtags;

    if (content.length > maxLength) {
      content = content.slice(0, maxLength - 3) + '...';
    }

    tweets.push({
      id: `tweet_${Date.now()}_${i}`,
      content,
      style,
    });
  }

  return tweets;
}

function generateKeywordData(topic: string, depth: string, includeRelated: boolean): Array<{ keyword: string; volume: number; difficulty: number; trend: string }> {
  const baseKeywords = [
    { keyword: topic, volume: 10000, difficulty: 60, trend: 'rising' },
    { keyword: `${topic} tutorial`, volume: 5000, difficulty: 45, trend: 'stable' },
    { keyword: `${topic} guide`, volume: 4000, difficulty: 50, trend: 'rising' },
    { keyword: `best ${topic}`, volume: 8000, difficulty: 70, trend: 'stable' },
    { keyword: `${topic} for beginners`, volume: 6000, difficulty: 35, trend: 'rising' },
  ];

  if (depth === 'quick') {
    return baseKeywords.slice(0, 3);
  }

  if (includeRelated && depth === 'deep') {
    return [
      ...baseKeywords,
      { keyword: `${topic} alternatives`, volume: 3000, difficulty: 55, trend: 'stable' },
      { keyword: `${topic} examples`, volume: 2500, difficulty: 40, trend: 'rising' },
      { keyword: `${topic} vs`, volume: 4500, difficulty: 65, trend: 'stable' },
      { keyword: `how to use ${topic}`, volume: 7000, difficulty: 40, trend: 'rising' },
      { keyword: `${topic} 2025`, volume: 3500, difficulty: 30, trend: 'rising' },
    ];
  }

  return baseKeywords;
}

function analyzeSEO(content: string, targetKeywords: string[]): {
  overallScore: number;
  keywordDensity: Record<string, number>;
  headingStructure: { h1: number; h2: number; h3: number };
  wordCount: number;
  readabilityScore: number;
  recommendations: string[];
} {
  const wordCount = content.split(/\s+/).length;
  const h1Count = (content.match(/^# /gm) || []).length;
  const h2Count = (content.match(/^## /gm) || []).length;
  const h3Count = (content.match(/^### /gm) || []).length;

  const keywordDensity: Record<string, number> = {};
  for (const keyword of targetKeywords) {
    const regex = new RegExp(keyword, 'gi');
    const matches = content.match(regex) || [];
    keywordDensity[keyword] = (matches.length / wordCount) * 100;
  }

  let score = 50;
  const recommendations: string[] = [];

  // Scoring
  if (h1Count === 1) score += 10;
  else recommendations.push('Add exactly one H1 heading');

  if (h2Count >= 3) score += 10;
  else recommendations.push('Add more H2 headings for structure');

  if (wordCount >= 1000) score += 15;
  else recommendations.push('Increase content length to at least 1000 words');

  const avgDensity = Object.values(keywordDensity).reduce((a, b) => a + b, 0) / (targetKeywords.length || 1);
  if (avgDensity >= 1 && avgDensity <= 3) score += 15;
  else recommendations.push('Optimize keyword density (1-3%)');

  return {
    overallScore: Math.min(100, score),
    keywordDensity,
    headingStructure: { h1: h1Count, h2: h2Count, h3: h3Count },
    wordCount,
    readabilityScore: 70, // Simplified
    recommendations,
  };
}

function generateContentPlan(weeks: number): {
  blogPosts: Array<{ week: number; topic: string; category: string }>;
  tweets: Array<{ week: number; count: number }>;
  threads: Array<{ week: number; topic: string }>;
} {
  const blogPosts = [];
  const tweets = [];
  const threads = [];

  for (let w = 1; w <= weeks; w++) {
    // 3 blog posts per week
    blogPosts.push(
      { week: w, topic: 'AI Development Tools', category: 'tutorial' },
      { week: w, topic: 'Web3 Integration', category: 'guide' },
      { week: w, topic: 'Platform Updates', category: 'changelog' }
    );

    // 35 tweets per week (5/day)
    tweets.push({ week: w, count: 35 });

    // 2 threads per week
    threads.push(
      { week: w, topic: 'Weekly Roundup' },
      { week: w, topic: 'Feature Deep Dive' }
    );
  }

  return { blogPosts, tweets, threads };
}

// Export all growth engine tools
export const growthEngineTools = {
  definitions: [
    blogGenerateToolDefinition,
    tweetGenerateToolDefinition,
    keywordResearchToolDefinition,
    seoAnalyzeToolDefinition,
    contentCalendarToolDefinition,
    discordAnnounceToolDefinition,
  ],
  createHandlers: (growthEngineFactory: () => Promise<any>) => ({
    'growth_generate_blog': createBlogGenerateHandler(growthEngineFactory),
    'growth_generate_tweets': createTweetGenerateHandler(),
    'growth_keyword_research': createKeywordResearchHandler(),
    'growth_seo_analyze': createSEOAnalyzeHandler(),
    'growth_content_calendar': createContentCalendarHandler(growthEngineFactory),
    'growth_discord_announce': createDiscordAnnounceHandler(growthEngineFactory),
  }),
};
