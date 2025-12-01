// src/index.ts
import { CronJob as CronJob4 } from "cron";

// src/content/blog/generator.ts
import slugify from "slugify";
import readingTime from "reading-time";

// src/utils/llm.ts
import Anthropic from "@anthropic-ai/sdk";
var anthropicClient = null;
function getAnthropicClient() {
  if (!anthropicClient) {
    anthropicClient = new Anthropic();
  }
  return anthropicClient;
}
async function generateText(options) {
  const client = getAnthropicClient();
  const messages = [
    { role: "user", content: options.prompt }
  ];
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: options.maxTokens || 4e3,
    system: options.systemPrompt,
    messages
  });
  const content = response.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type");
  }
  return content.text;
}
async function generateJSON(options) {
  const text = await generateText({
    ...options,
    prompt: `${options.prompt}

Respond with valid JSON only, no other text.`
  });
  const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  if (!match) {
    throw new Error("No JSON found in response");
  }
  return JSON.parse(match[0]);
}

// src/utils/logger.ts
import pino from "pino";
var isProduction = process.env.NODE_ENV === "production";
var Logger = class {
  pino;
  context;
  constructor(context) {
    this.context = context;
    this.pino = pino({
      level: process.env.LOG_LEVEL || "info",
      // Use pino-pretty only in development
      ...isProduction ? {} : {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            ignore: "pid,hostname",
            translateTime: "SYS:standard"
          }
        }
      }
    });
  }
  info(message, data) {
    this.pino.info({ context: this.context, ...data }, message);
  }
  warn(message, data) {
    this.pino.warn({ context: this.context, ...data }, message);
  }
  error(message, data) {
    this.pino.error({ context: this.context, ...data }, message);
  }
  debug(message, data) {
    this.pino.debug({ context: this.context, ...data }, message);
  }
};

// src/content/blog/generator.ts
var BlogGenerator = class {
  logger;
  constructor() {
    this.logger = new Logger("BlogGenerator");
  }
  /**
   * Generate a complete blog post
   */
  async generate(options) {
    this.logger.info(`Generating blog post: ${options.topic}`);
    const keywords = options.targetKeywords || await this.findKeywords(options.topic, 5);
    this.logger.info(`Target keywords: ${keywords.join(", ")}`);
    const content = await this.generateContent(options, keywords);
    const title = await this.generateTitle(options.topic, keywords);
    const excerpt = await this.generateExcerpt(content);
    const seo = await this.generateSEO(options.topic, content, keywords);
    const slug = slugify(title, { lower: true, strict: true });
    const stats = readingTime(content);
    const post = {
      id: `post-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title,
      slug,
      excerpt,
      content,
      author: "gICM Team",
      category: options.category,
      tags: keywords.slice(0, 5),
      seo,
      readingTime: Math.ceil(stats.minutes),
      wordCount: stats.words,
      status: "draft",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      images: []
    };
    this.logger.info(`Generated post: ${post.title} (${post.wordCount} words)`);
    return post;
  }
  /**
   * Find relevant keywords for a topic
   */
  async findKeywords(topic, count) {
    try {
      const result = await generateJSON({
        prompt: `Find ${count} relevant SEO keywords for: "${topic}"

Context: gICM is an AI-powered development platform for Solana/Web3 and general coding.

Return as JSON array of strings:
["keyword1", "keyword2", ...]

Focus on keywords developers actually search for.`
      });
      return result;
    } catch {
      return [topic];
    }
  }
  /**
   * Generate the main content
   */
  async generateContent(options, keywords) {
    const lengthGuide = {
      short: "800-1200 words",
      medium: "1500-2000 words",
      long: "2500-3500 words"
    };
    const prompt = `Write a comprehensive blog post about: "${options.topic}"

Target audience: Developers interested in AI tools, Solana/Web3 development, and coding automation.

Requirements:
- Length: ${lengthGuide[options.length || "medium"]}
- Tone: ${options.tone || "professional"} but approachable
- Category: ${options.category}
- Must naturally include these keywords: ${keywords.join(", ")}
${options.includeCodeExamples ? "- Include practical code examples with explanations" : ""}

Structure:
1. Compelling introduction that hooks the reader
2. Clear H2 and H3 headers for sections
3. Practical, actionable content
4. ${options.includeCodeExamples ? "Code examples with TypeScript/JavaScript" : "Step-by-step instructions"}
5. Conclusion with clear call-to-action for gICM

Format: Markdown

Important:
- Write for developers, not marketers
- Be specific and technical where appropriate
- Include real-world use cases
- Reference gICM features naturally (not salesy)
- Add value that makes readers want to share`;
    return generateText({
      prompt,
      maxTokens: 4e3
    });
  }
  /**
   * Generate SEO-optimized title
   */
  async generateTitle(topic, keywords) {
    const text = await generateText({
      prompt: `Generate a compelling, SEO-optimized blog title for: "${topic}"

Requirements:
- 50-60 characters ideal
- Include primary keyword: "${keywords[0]}"
- Make it click-worthy but not clickbait
- Should work for developers/technical audience

Provide just the title, nothing else.`,
      maxTokens: 100
    });
    return text.trim().replace(/^["']|["']$/g, "");
  }
  /**
   * Generate excerpt
   */
  async generateExcerpt(content) {
    const text = await generateText({
      prompt: `Generate a compelling excerpt/summary for this blog post (150-160 characters, good for meta description):

${content.slice(0, 1e3)}...

Provide just the excerpt, nothing else.`,
      maxTokens: 100
    });
    return text.trim().replace(/^["']|["']$/g, "");
  }
  /**
   * Generate SEO metadata
   */
  async generateSEO(topic, content, keywords) {
    try {
      const result = await generateJSON({
        prompt: `Generate SEO metadata for a blog post about "${topic}":

Content preview:
${content.slice(0, 500)}...

Target keywords: ${keywords.join(", ")}

Return JSON:
{
  "title": "<60 chars, include primary keyword>",
  "description": "<155 chars, compelling, include keyword>",
  "keywords": ["<5-8 relevant keywords>"]
}`
      });
      return result;
    } catch {
      return {
        title: topic,
        description: content.slice(0, 155),
        keywords
      };
    }
  }
  /**
   * Generate blog post from template
   */
  async generateFromTemplate(template, variables) {
    let topic = template.topicTemplate;
    for (const [key, value] of Object.entries(variables)) {
      topic = topic.replace(`{${key}}`, value);
    }
    return this.generate({
      topic,
      category: template.category,
      targetKeywords: template.defaultKeywords,
      tone: template.tone,
      length: template.length,
      includeCodeExamples: template.includeCode
    });
  }
};

// src/content/blog/storage.ts
import fs from "fs/promises";
import path from "path";
var DEFAULT_CONFIG = {
  outputDir: process.env.BLOG_OUTPUT_DIR || "./content/blog",
  format: "both"
};
var BlogStorage = class {
  logger;
  config;
  constructor(config = {}) {
    this.logger = new Logger("BlogStorage");
    this.config = { ...DEFAULT_CONFIG, ...config };
  }
  /**
   * Ensure output directory exists
   */
  async ensureDir() {
    await fs.mkdir(this.config.outputDir, { recursive: true });
  }
  /**
   * Save a blog post
   */
  async save(post) {
    await this.ensureDir();
    const result = {};
    if (this.config.format === "json" || this.config.format === "both") {
      const jsonPath = path.join(this.config.outputDir, `${post.slug}.json`);
      await fs.writeFile(jsonPath, JSON.stringify(post, null, 2));
      result.jsonPath = jsonPath;
      this.logger.info(`Saved JSON: ${jsonPath}`);
    }
    if (this.config.format === "mdx" || this.config.format === "both") {
      const mdxPath = path.join(this.config.outputDir, `${post.slug}.mdx`);
      const mdxContent = this.toMDX(post);
      await fs.writeFile(mdxPath, mdxContent);
      result.mdxPath = mdxPath;
      this.logger.info(`Saved MDX: ${mdxPath}`);
    }
    return result;
  }
  /**
   * Convert blog post to MDX format
   */
  toMDX(post) {
    const frontmatter = {
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      author: post.author,
      category: post.category,
      tags: post.tags,
      publishedAt: post.publishedAt ? new Date(post.publishedAt).toISOString() : null,
      createdAt: new Date(post.createdAt).toISOString(),
      readingTime: post.readingTime,
      wordCount: post.wordCount,
      seo: post.seo
    };
    return `---
${Object.entries(frontmatter).map(([key, value]) => {
      if (value === null || value === void 0) return null;
      if (typeof value === "object") {
        return `${key}: ${JSON.stringify(value)}`;
      }
      return `${key}: ${JSON.stringify(value)}`;
    }).filter(Boolean).join("\n")}
---

${post.content}
`;
  }
  /**
   * Load a blog post by slug
   */
  async load(slug) {
    try {
      const jsonPath = path.join(this.config.outputDir, `${slug}.json`);
      const content = await fs.readFile(jsonPath, "utf-8");
      return JSON.parse(content);
    } catch {
      return null;
    }
  }
  /**
   * List all saved blog posts
   */
  async list() {
    try {
      await this.ensureDir();
      const files = await fs.readdir(this.config.outputDir);
      const jsonFiles = files.filter((f) => f.endsWith(".json"));
      const posts = [];
      for (const file of jsonFiles) {
        const slug = file.replace(".json", "");
        const post = await this.load(slug);
        if (post) posts.push(post);
      }
      return posts.sort((a, b) => b.createdAt - a.createdAt);
    } catch {
      return [];
    }
  }
  /**
   * Delete a blog post
   */
  async delete(slug) {
    const jsonPath = path.join(this.config.outputDir, `${slug}.json`);
    const mdxPath = path.join(this.config.outputDir, `${slug}.mdx`);
    try {
      await fs.unlink(jsonPath);
    } catch {
    }
    try {
      await fs.unlink(mdxPath);
    } catch {
    }
    this.logger.info(`Deleted blog post: ${slug}`);
  }
  /**
   * Get storage stats
   */
  async getStats() {
    const posts = await this.list();
    const stats = {
      totalPosts: posts.length,
      totalWords: 0,
      categories: {}
    };
    for (const post of posts) {
      stats.totalWords += post.wordCount || 0;
      stats.categories[post.category] = (stats.categories[post.category] || 0) + 1;
    }
    return stats;
  }
};

// src/social/twitter/index.ts
import { CronJob as CronJob2 } from "cron";

// src/social/twitter/client.ts
import { TwitterApi } from "twitter-api-v2";
var TwitterClient = class {
  client;
  logger;
  userId;
  config;
  mockMode = false;
  constructor(config) {
    this.logger = new Logger("TwitterClient");
    this.config = config;
    this.mockMode = this.detectMockMode();
  }
  /**
   * Check if credentials are available
   */
  detectMockMode() {
    const creds = this.config || {
      appKey: process.env.TWITTER_APP_KEY,
      appSecret: process.env.TWITTER_APP_SECRET,
      accessToken: process.env.TWITTER_ACCESS_TOKEN,
      accessSecret: process.env.TWITTER_ACCESS_SECRET
    };
    return !creds.appKey || !creds.appSecret || !creds.accessToken || !creds.accessSecret;
  }
  /**
   * Check if Twitter is available (not in mock mode)
   */
  isAvailable() {
    return !this.mockMode && !!this.userId;
  }
  getClient() {
    if (!this.client) {
      const credentials = this.config || {
        appKey: process.env.TWITTER_APP_KEY || "",
        appSecret: process.env.TWITTER_APP_SECRET || "",
        accessToken: process.env.TWITTER_ACCESS_TOKEN || "",
        accessSecret: process.env.TWITTER_ACCESS_SECRET || ""
      };
      this.client = new TwitterApi(credentials);
    }
    return this.client;
  }
  /**
   * Initialize and verify credentials
   */
  async init() {
    if (this.mockMode) {
      this.logger.warn("No Twitter credentials provided, running in MOCK mode");
      return;
    }
    try {
      const me = await this.getClient().v2.me();
      this.userId = me.data.id;
      this.logger.info(`Authenticated as @${me.data.username}`);
    } catch (error) {
      this.logger.warn(`Authentication failed, switching to mock mode: ${error}`);
      this.mockMode = true;
    }
  }
  /**
   * Post a tweet
   */
  async tweet(text, options) {
    if (this.mockMode) {
      this.logger.info(`[MOCK] Would post tweet: ${text.substring(0, 50)}...`);
      return { id: `mock-${Date.now()}`, text };
    }
    try {
      const params = {};
      if (options?.replyTo) {
        params.reply = { in_reply_to_tweet_id: options.replyTo };
      }
      if (options?.mediaIds?.length) {
        params.media = { media_ids: options.mediaIds };
      }
      const result = await this.getClient().v2.tweet(text, params);
      this.logger.info(`Posted tweet: ${result.data.id}`);
      return result.data;
    } catch (error) {
      this.logger.error(`Tweet failed: ${error}`);
      throw error;
    }
  }
  /**
   * Post a thread
   */
  async thread(tweets) {
    const posted = [];
    let previousId;
    for (const text of tweets) {
      const result = await this.tweet(text, { replyTo: previousId });
      posted.push(result);
      previousId = result.id;
    }
    this.logger.info(`Posted thread of ${tweets.length} tweets`);
    return posted;
  }
  /**
   * Get tweet metrics
   */
  async getMetrics(tweetId) {
    try {
      const tweet = await this.getClient().v2.singleTweet(tweetId, {
        "tweet.fields": ["public_metrics"]
      });
      const metrics = tweet.data.public_metrics;
      return {
        likes: metrics?.like_count || 0,
        retweets: metrics?.retweet_count || 0,
        replies: metrics?.reply_count || 0,
        impressions: metrics?.impression_count || 0
      };
    } catch (error) {
      this.logger.error(`Failed to get metrics: ${error}`);
      return { likes: 0, retweets: 0, replies: 0, impressions: 0 };
    }
  }
  /**
   * Get my recent tweets
   */
  async getMyTweets(count = 10) {
    if (!this.userId) {
      await this.init();
    }
    const tweets = await this.getClient().v2.userTimeline(this.userId, {
      max_results: count,
      "tweet.fields": ["created_at", "public_metrics"]
    });
    return tweets.data.data || [];
  }
  /**
   * Search recent tweets
   */
  async search(query, count = 10) {
    const results = await this.getClient().v2.search(query, {
      max_results: count,
      "tweet.fields": ["created_at", "public_metrics", "author_id"]
    });
    return results.data.data || [];
  }
  /**
   * Get user by username
   */
  async getUser(username) {
    try {
      const user = await this.getClient().v2.userByUsername(username, {
        "user.fields": ["public_metrics", "description"]
      });
      return user.data;
    } catch {
      return null;
    }
  }
  /**
   * Upload media
   */
  async uploadMedia(buffer, mimeType) {
    const mediaId = await this.getClient().v1.uploadMedia(buffer, { mimeType });
    return mediaId;
  }
  /**
   * Check rate limits
   */
  async getRateLimits() {
    return {
      tweetsRemaining: "check headers",
      resetTime: "check headers"
    };
  }
};

// src/social/twitter/queue.ts
import { CronJob } from "cron";
var DEFAULT_CONFIG2 = {
  maxTweetsPerDay: 5,
  optimalHours: [14, 16, 18, 20, 22],
  // UTC - targeting US hours
  minIntervalMinutes: 60
};
var TweetQueue = class {
  logger;
  queue = [];
  config;
  cronJob;
  onPost;
  constructor(config = {}) {
    this.logger = new Logger("TweetQueue");
    this.config = { ...DEFAULT_CONFIG2, ...config };
  }
  /**
   * Set the post handler
   */
  setPostHandler(handler) {
    this.onPost = handler;
  }
  /**
   * Start queue processing
   */
  start() {
    this.cronJob = new CronJob("*/5 * * * *", async () => {
      await this.processQueue();
    });
    this.cronJob.start();
    this.logger.info("Tweet queue started");
  }
  /**
   * Stop queue processing
   */
  stop() {
    if (this.cronJob) {
      this.cronJob.stop();
    }
    this.logger.info("Tweet queue stopped");
  }
  /**
   * Add tweet to queue
   */
  add(tweet, scheduledFor) {
    const scheduled = scheduledFor || this.findNextSlot();
    const queued = {
      id: `q-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      tweet,
      scheduledFor: scheduled,
      status: "pending",
      attempts: 0
    };
    this.queue.push(queued);
    this.queue.sort((a, b) => a.scheduledFor.getTime() - b.scheduledFor.getTime());
    this.logger.info(`Queued tweet for ${scheduled.toISOString()}: ${tweet.content.substring(0, 50)}...`);
    return queued;
  }
  /**
   * Add multiple tweets
   */
  addBatch(tweets) {
    return tweets.map((tweet) => this.add(tweet));
  }
  /**
   * Find next available slot
   */
  findNextSlot() {
    const now = /* @__PURE__ */ new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const todayTweets = this.queue.filter((q) => {
      const qDate = new Date(q.scheduledFor);
      qDate.setHours(0, 0, 0, 0);
      return qDate.getTime() === today.getTime() && q.status === "pending";
    });
    let lastTime = now;
    if (this.queue.length > 0) {
      const lastPending = [...this.queue].reverse().find((q) => q.status === "pending");
      if (lastPending && lastPending.scheduledFor > now) {
        lastTime = lastPending.scheduledFor;
      }
    }
    if (todayTweets.length >= this.config.maxTweetsPerDay) {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(this.config.optimalHours[0], 0, 0, 0);
      return tomorrow;
    }
    const currentHour = now.getUTCHours();
    let nextHour = this.config.optimalHours.find((h) => h > currentHour);
    if (!nextHour) {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setUTCHours(this.config.optimalHours[0], 0, 0, 0);
      return tomorrow;
    }
    const nextSlot = new Date(now);
    nextSlot.setUTCHours(nextHour, 0, 0, 0);
    const minNext = new Date(lastTime.getTime() + this.config.minIntervalMinutes * 60 * 1e3);
    return nextSlot > minNext ? nextSlot : minNext;
  }
  /**
   * Process queue
   */
  async processQueue() {
    const now = /* @__PURE__ */ new Date();
    const dueItems = this.queue.filter(
      (q) => q.status === "pending" && q.scheduledFor <= now
    );
    for (const item of dueItems) {
      if (!this.onPost) {
        this.logger.warn("No post handler set");
        continue;
      }
      try {
        item.attempts++;
        await this.onPost(item);
        item.status = "posted";
        this.logger.info(`Posted tweet: ${item.id}`);
      } catch (error) {
        item.error = String(error);
        if (item.attempts >= 3) {
          item.status = "failed";
          this.logger.error(`Tweet failed after 3 attempts: ${item.id}`);
        } else {
          item.scheduledFor = new Date(now.getTime() + 15 * 60 * 1e3);
          this.logger.warn(`Tweet ${item.id} failed, retry scheduled`);
        }
      }
    }
  }
  /**
   * Get queue status
   */
  getStatus() {
    const pending = this.queue.filter((q) => q.status === "pending").length;
    const posted = this.queue.filter((q) => q.status === "posted").length;
    const failed = this.queue.filter((q) => q.status === "failed").length;
    const nextUp = this.queue.find((q) => q.status === "pending") || null;
    return { pending, posted, failed, nextUp };
  }
  /**
   * Get all queued tweets
   */
  getQueue() {
    return [...this.queue];
  }
  /**
   * Remove tweet from queue
   */
  remove(id) {
    const index = this.queue.findIndex((q) => q.id === id);
    if (index !== -1) {
      this.queue.splice(index, 1);
      return true;
    }
    return false;
  }
  /**
   * Clear all pending tweets
   */
  clearPending() {
    const before = this.queue.length;
    this.queue = this.queue.filter((q) => q.status !== "pending");
    return before - this.queue.length;
  }
  /**
   * Get daily schedule
   */
  getDailySchedule(date = /* @__PURE__ */ new Date()) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);
    return this.queue.filter(
      (q) => q.scheduledFor >= startOfDay && q.scheduledFor < endOfDay
    );
  }
};

// src/social/twitter/generator.ts
var DEFAULT_CONFIG3 = {
  brand: {
    name: "gICM",
    handle: "@gICM_dev",
    voice: "Technical but accessible. Excited about AI and crypto. Helpful, not salesy.",
    topics: [
      "AI development tools",
      "Claude Code",
      "Solana/Web3",
      "React components",
      "Developer productivity",
      "Vibe coding"
    ]
  }
};
var TweetGenerator = class {
  logger;
  config;
  constructor(config = {}) {
    this.logger = new Logger("TweetGenerator");
    this.config = { ...DEFAULT_CONFIG3, ...config };
  }
  /**
   * Generate a tweet for a topic
   */
  async generate(options) {
    this.logger.info(`Generating ${options.type} tweet about: ${options.topic}`);
    const content = await generateText({
      systemPrompt: `You are the social media voice for ${this.config.brand.name}.
Voice: ${this.config.brand.voice}
Topics we cover: ${this.config.brand.topics.join(", ")}

Rules:
- Keep under 280 characters
- Use 1-2 relevant emojis max
- No hashtag spam (max 2)
- Be genuine, not marketing-speak
- Make it valuable, not just promotional`,
      prompt: `Write a ${options.type} tweet about: ${options.topic}

${options.context ? `Context: ${options.context}` : ""}

Type guidelines:
- insight: Share something smart/useful about the topic
- announcement: Announce news (not too hyped)
- thread_hook: Hook for a thread (end with "\u{1F9F5}" or similar)
- engagement: Ask a question or share opinion
- tip: Share a practical tip

Just return the tweet text, nothing else.`
    });
    return {
      id: `tweet-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content: content.trim(),
      type: options.type,
      topic: options.topic,
      scheduledFor: /* @__PURE__ */ new Date(),
      status: "draft",
      metrics: {
        impressions: 0,
        engagements: 0,
        clicks: 0,
        retweets: 0,
        likes: 0
      }
    };
  }
  /**
   * Generate a thread
   */
  async generateThread(options) {
    this.logger.info(`Generating thread about: ${options.topic}`);
    const threadContent = await generateJSON({
      systemPrompt: `You are the social media voice for ${this.config.brand.name}.
Voice: ${this.config.brand.voice}`,
      prompt: `Create a Twitter thread about: ${options.topic}

Key points to cover:
${options.points.map((p, i) => `${i + 1}. ${p}`).join("\n")}

Rules:
- First tweet: Hook that makes people want to read more
- Each tweet: Under 280 chars, can stand alone but flows together
- Last tweet: CTA or summary
- Max ${options.maxTweets || 7} tweets
- Number tweets like "1/", "2/", etc.
- Use emojis sparingly

Return JSON: { "tweets": ["tweet1", "tweet2", ...] }`
    });
    return threadContent.tweets.map((content, index) => ({
      id: `tweet-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
      content,
      type: index === 0 ? "thread_hook" : "insight",
      topic: options.topic,
      scheduledFor: /* @__PURE__ */ new Date(),
      status: "draft",
      threadPosition: index,
      metrics: {
        impressions: 0,
        engagements: 0,
        clicks: 0,
        retweets: 0,
        likes: 0
      }
    }));
  }
  /**
   * Generate tweet from blog post
   */
  async fromBlogPost(post) {
    this.logger.info(`Generating tweets from blog: ${post.title}`);
    const announcement = await this.generate({
      topic: post.title,
      type: "announcement",
      context: post.excerpt
    });
    const insight = await this.generate({
      topic: post.title,
      type: "tip",
      context: `Key takeaway from our blog: ${post.excerpt}`
    });
    return [announcement, insight];
  }
  /**
   * Generate daily content batch
   */
  async generateDailyBatch(count = 5) {
    const tweets = [];
    const types = ["insight", "tip", "engagement", "insight", "tip"];
    for (let i = 0; i < count; i++) {
      const topic = this.config.brand.topics[i % this.config.brand.topics.length];
      const type = types[i % types.length];
      const tweet = await this.generate({ topic, type });
      tweets.push(tweet);
    }
    return tweets;
  }
  /**
   * Generate engagement tweet (question/poll hook)
   */
  async generateEngagement(topic) {
    return this.generate({
      topic,
      type: "engagement",
      context: "Ask an interesting question that developers would want to answer"
    });
  }
  /**
   * Improve/rewrite a tweet
   */
  async improve(originalTweet, feedback) {
    const improved = await generateText({
      systemPrompt: `You are improving tweets for ${this.config.brand.name}.
Voice: ${this.config.brand.voice}`,
      prompt: `Improve this tweet based on feedback:

Original: "${originalTweet}"
Feedback: ${feedback}

Return only the improved tweet text.`
    });
    return improved.trim();
  }
  /**
   * Check tweet for issues
   */
  async review(tweet) {
    return generateJSON({
      prompt: `Review this tweet for ${this.config.brand.name}:

"${tweet}"

Check for:
- Length (must be under 280 chars)
- Tone (matches brand voice)
- Value (provides something useful)
- Grammar/typos
- Overuse of emojis or hashtags
- Marketing-speak to avoid

Return JSON: { "isGood": true/false, "issues": [...], "suggestions": [...] }`
    });
  }
};

// src/social/twitter/index.ts
var DEFAULT_CONFIG4 = {
  tweetsPerDay: 5,
  autoGenerate: true,
  topics: [
    "AI development",
    "Claude Code tips",
    "React components",
    "Solana development",
    "Developer productivity"
  ]
};
var TwitterManager = class {
  logger;
  client;
  queue;
  generator;
  config;
  dailyCron;
  constructor(config = {}) {
    this.logger = new Logger("TwitterManager");
    this.config = { ...DEFAULT_CONFIG4, ...config };
    this.client = new TwitterClient();
    this.queue = new TweetQueue({ maxTweetsPerDay: this.config.tweetsPerDay });
    this.generator = new TweetGenerator();
    this.queue.setPostHandler(async (queued) => {
      await this.postTweet(queued);
    });
  }
  /**
   * Initialize Twitter automation
   */
  async init() {
    await this.client.init();
    this.logger.info("Twitter manager initialized");
  }
  /**
   * Start automation
   */
  start() {
    this.queue.start();
    if (this.config.autoGenerate) {
      this.dailyCron = new CronJob2("0 6 * * *", async () => {
        await this.generateDailyContent();
      });
      this.dailyCron.start();
    }
    this.logger.info("Twitter automation started");
  }
  /**
   * Stop automation
   */
  stop() {
    this.queue.stop();
    if (this.dailyCron) {
      this.dailyCron.stop();
    }
    this.logger.info("Twitter automation stopped");
  }
  /**
   * Post a tweet
   */
  async postTweet(queued) {
    const result = await this.client.tweet(queued.tweet.content);
    queued.tweet.postedAt = Date.now();
    queued.tweet.twitterId = result.id;
    queued.tweet.status = "posted";
    this.logger.info(`Posted: ${result.id}`);
  }
  /**
   * Generate daily content
   */
  async generateDailyContent() {
    this.logger.info("Generating daily tweet content...");
    const tweets = await this.generator.generateDailyBatch(this.config.tweetsPerDay);
    for (const tweet of tweets) {
      this.queue.add(tweet);
    }
    this.logger.info(`Generated and queued ${tweets.length} tweets`);
    return tweets;
  }
  /**
   * Queue a custom tweet
   */
  queueTweet(tweet, scheduledFor) {
    return this.queue.add(tweet, scheduledFor);
  }
  /**
   * Generate and queue a thread
   */
  async queueThread(topic, points) {
    const tweets = await this.generator.generateThread({ topic, points });
    return tweets.map((tweet) => this.queue.add(tweet));
  }
  /**
   * Promote a blog post
   */
  async promoteBlogPost(post) {
    const tweets = await this.generator.fromBlogPost({
      id: "blog-promo",
      title: post.title,
      slug: "",
      excerpt: post.excerpt,
      content: "",
      category: "announcement",
      tags: [],
      author: "gICM",
      status: "published",
      publishedAt: Date.now(),
      seo: {
        title: post.title,
        description: post.excerpt,
        keywords: []
      },
      metrics: {
        views: 0,
        uniqueVisitors: 0,
        avgTimeOnPage: 0,
        bounceRate: 0,
        shares: 0
      }
    });
    const tweetsWithUrl = tweets.map((tweet) => ({
      ...tweet,
      content: `${tweet.content}

${post.url}`
    }));
    return tweetsWithUrl.map((tweet) => this.queue.add(tweet));
  }
  /**
   * Get queue status
   */
  getQueueStatus() {
    return this.queue.getStatus();
  }
  /**
   * Get today's schedule
   */
  getTodaySchedule() {
    return this.queue.getDailySchedule();
  }
  /**
   * Get tweet metrics
   */
  async getMetrics(tweetId) {
    return this.client.getMetrics(tweetId);
  }
  /**
   * Search for conversations to engage with
   */
  async findEngagementOpportunities(query) {
    const tweets = await this.client.search(query, 20);
    return tweets.map((tweet) => ({
      id: tweet.id,
      text: tweet.text,
      author: tweet.author_id || "unknown",
      engagement: (tweet.public_metrics?.like_count || 0) + (tweet.public_metrics?.retweet_count || 0) * 2
    }));
  }
};

// src/social/discord/client.ts
import { Client, GatewayIntentBits, TextChannel, EmbedBuilder } from "discord.js";
var DiscordClient = class {
  client;
  logger;
  config;
  ready = false;
  constructor(config) {
    this.logger = new Logger("DiscordClient");
    this.config = {
      token: config?.token || process.env.DISCORD_BOT_TOKEN,
      guildId: config?.guildId || process.env.DISCORD_GUILD_ID,
      announcementChannelId: config?.announcementChannelId || process.env.DISCORD_ANNOUNCEMENT_CHANNEL,
      contentChannelId: config?.contentChannelId || process.env.DISCORD_CONTENT_CHANNEL,
      feedbackChannelId: config?.feedbackChannelId || process.env.DISCORD_FEEDBACK_CHANNEL
    };
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
      ]
    });
    this.setupEventHandlers();
  }
  /**
   * Setup event handlers
   */
  setupEventHandlers() {
    this.client.on("ready", () => {
      this.ready = true;
      this.logger.info(`Discord bot ready as ${this.client.user?.tag}`);
    });
    this.client.on("error", (error) => {
      this.logger.error(`Discord error: ${error.message}`);
    });
  }
  /**
   * Connect to Discord
   */
  async connect() {
    if (!this.config.token) {
      this.logger.warn("No Discord token provided, skipping connection");
      return;
    }
    try {
      await this.client.login(this.config.token);
      this.logger.info("Connected to Discord");
    } catch (error) {
      this.logger.error(`Failed to connect: ${error}`);
      throw error;
    }
  }
  /**
   * Disconnect from Discord
   */
  async disconnect() {
    await this.client.destroy();
    this.ready = false;
    this.logger.info("Disconnected from Discord");
  }
  /**
   * Send announcement
   */
  async announce(content) {
    if (!this.ready) {
      this.logger.warn("Discord not ready, skipping announcement");
      return null;
    }
    try {
      const channel = await this.client.channels.fetch(this.config.announcementChannelId);
      if (!channel || !(channel instanceof TextChannel)) {
        this.logger.error("Announcement channel not found");
        return null;
      }
      const embed = new EmbedBuilder().setTitle(content.title).setDescription(content.description).setColor(content.color || 5793266).setTimestamp();
      if (content.url) {
        embed.setURL(content.url);
      }
      if (content.fields) {
        embed.addFields(content.fields);
      }
      const message = await channel.send({ embeds: [embed] });
      this.logger.info(`Sent announcement: ${content.title}`);
      return message;
    } catch (error) {
      this.logger.error(`Failed to send announcement: ${error}`);
      return null;
    }
  }
  /**
   * Share content (blog post, update, etc.)
   */
  async shareContent(content) {
    if (!this.ready) return null;
    try {
      const channel = await this.client.channels.fetch(this.config.contentChannelId);
      if (!channel || !(channel instanceof TextChannel)) {
        this.logger.error("Content channel not found");
        return null;
      }
      const typeEmoji = {
        blog: "\u{1F4DD}",
        update: "\u{1F680}",
        feature: "\u2728",
        tip: "\u{1F4A1}"
      };
      const embed = new EmbedBuilder().setTitle(`${typeEmoji[content.type]} ${content.title}`).setDescription(content.description).setURL(content.url).setColor(54442).setTimestamp();
      if (content.tags?.length) {
        embed.setFooter({ text: content.tags.map((t) => `#${t}`).join(" ") });
      }
      const message = await channel.send({ embeds: [embed] });
      this.logger.info(`Shared content: ${content.title}`);
      return message;
    } catch (error) {
      this.logger.error(`Failed to share content: ${error}`);
      return null;
    }
  }
  /**
   * Send simple message
   */
  async sendMessage(channelId, content) {
    if (!this.ready) return null;
    try {
      const channel = await this.client.channels.fetch(channelId);
      if (!channel || !(channel instanceof TextChannel)) {
        return null;
      }
      return await channel.send(content);
    } catch (error) {
      this.logger.error(`Failed to send message: ${error}`);
      return null;
    }
  }
  /**
   * Get feedback from feedback channel
   */
  async getRecentFeedback(limit = 50) {
    if (!this.ready || !this.config.feedbackChannelId) return [];
    try {
      const channel = await this.client.channels.fetch(this.config.feedbackChannelId);
      if (!channel || !(channel instanceof TextChannel)) {
        return [];
      }
      const messages = await channel.messages.fetch({ limit });
      return messages.map((m) => ({
        id: m.id,
        content: m.content,
        author: m.author.username,
        timestamp: m.createdAt
      }));
    } catch (error) {
      this.logger.error(`Failed to fetch feedback: ${error}`);
      return [];
    }
  }
  /**
   * Check if connected
   */
  isReady() {
    return this.ready;
  }
  /**
   * Get guild member count
   */
  async getMemberCount() {
    if (!this.ready) return 0;
    try {
      const guild = await this.client.guilds.fetch(this.config.guildId);
      return guild.memberCount;
    } catch {
      return 0;
    }
  }
};

// src/social/discord/announcer.ts
import { CronJob as CronJob3 } from "cron";
var DEFAULT_CONFIG5 = {
  autoAnnounce: true,
  dailyTipEnabled: true,
  dailyTipTime: "0 14 * * *"
  // 2 PM UTC daily
};
var DiscordAnnouncer = class {
  logger;
  client;
  config;
  dailyTipCron;
  constructor(client, config = {}) {
    this.logger = new Logger("DiscordAnnouncer");
    this.client = client;
    this.config = { ...DEFAULT_CONFIG5, ...config };
  }
  /**
   * Start announcer
   */
  start() {
    if (this.config.dailyTipEnabled) {
      this.dailyTipCron = new CronJob3(this.config.dailyTipTime, async () => {
        await this.postDailyTip();
      });
      this.dailyTipCron.start();
      this.logger.info("Daily tip cron started");
    }
    this.logger.info("Discord announcer started");
  }
  /**
   * Stop announcer
   */
  stop() {
    if (this.dailyTipCron) {
      this.dailyTipCron.stop();
    }
    this.logger.info("Discord announcer stopped");
  }
  /**
   * Announce new blog post
   */
  async announceBlogPost(post) {
    if (!this.config.autoAnnounce) return;
    await this.client.shareContent({
      title: post.title,
      description: post.excerpt,
      url: `https://gicm.dev/blog/${post.slug}`,
      type: "blog",
      tags: post.tags.slice(0, 5)
    });
  }
  /**
   * Announce new feature
   */
  async announceFeature(feature) {
    await this.client.announce({
      title: `\u2728 New Feature: ${feature.name}`,
      description: feature.description,
      url: feature.url,
      color: 65416
    });
  }
  /**
   * Announce new agent
   */
  async announceAgent(agent) {
    await this.client.announce({
      title: `\u{1F916} New Agent: ${agent.name}`,
      description: agent.description,
      color: 5793266,
      fields: [
        {
          name: "Capabilities",
          value: agent.capabilities.map((c) => `\u2022 ${c}`).join("\n")
        }
      ]
    });
  }
  /**
   * Announce new component
   */
  async announceComponent(component) {
    await this.client.announce({
      title: `\u{1F9E9} New Component: ${component.name}`,
      description: component.description,
      color: 16755200,
      fields: [{ name: "Category", value: component.category, inline: true }]
    });
  }
  /**
   * Post daily tip
   */
  async postDailyTip() {
    const tips = [
      {
        title: "Use Claude Code for faster development",
        description: "gICM integrates with Claude Code to give you AI-powered development superpowers."
      },
      {
        title: "Check out our component library",
        description: "Over 100+ React components ready to use in your Web3 projects."
      },
      {
        title: "Try our AI agents",
        description: "Let AI handle the heavy lifting - trading, research, content generation, and more."
      },
      {
        title: "Join the community",
        description: "Ask questions, share your projects, and connect with other builders."
      },
      {
        title: "Contribute to gICM",
        description: "gICM is open source! Check out our GitHub and submit your first PR."
      }
    ];
    const tip = tips[Math.floor(Math.random() * tips.length)];
    await this.client.shareContent({
      title: tip.title,
      description: tip.description,
      url: "https://gicm.dev",
      type: "tip"
    });
  }
  /**
   * Announce version update
   */
  async announceUpdate(version, changes) {
    await this.client.announce({
      title: `\u{1F680} gICM v${version} Released!`,
      description: "Check out what's new in this release.",
      color: 54442,
      fields: [
        {
          name: "Changes",
          value: changes.map((c) => `\u2022 ${c}`).join("\n")
        }
      ]
    });
  }
};

// src/social/discord/index.ts
var DiscordManager = class {
  logger;
  client;
  announcer;
  constructor(config = {}) {
    this.logger = new Logger("DiscordManager");
    this.client = new DiscordClient(config.client);
    this.announcer = new DiscordAnnouncer(this.client, config.announcer);
  }
  /**
   * Connect and start
   */
  async start() {
    await this.client.connect();
    this.announcer.start();
    this.logger.info("Discord manager started");
  }
  /**
   * Stop and disconnect
   */
  async stop() {
    this.announcer.stop();
    await this.client.disconnect();
    this.logger.info("Discord manager stopped");
  }
  /**
   * Announce blog post
   */
  async announceBlogPost(post) {
    await this.announcer.announceBlogPost(post);
  }
  /**
   * Announce new feature
   */
  async announceFeature(feature) {
    await this.announcer.announceFeature(feature);
  }
  /**
   * Announce new agent
   */
  async announceAgent(agent) {
    await this.announcer.announceAgent(agent);
  }
  /**
   * Announce new component
   */
  async announceComponent(component) {
    await this.announcer.announceComponent(component);
  }
  /**
   * Announce version update
   */
  async announceUpdate(version, changes) {
    await this.announcer.announceUpdate(version, changes);
  }
  /**
   * Get member count
   */
  async getMemberCount() {
    return this.client.getMemberCount();
  }
  /**
   * Get recent feedback
   */
  async getRecentFeedback(limit) {
    return this.client.getRecentFeedback(limit);
  }
  /**
   * Check if connected
   */
  isReady() {
    return this.client.isReady();
  }
};

// src/seo/keywords.ts
var DEFAULT_CONFIG6 = {
  domain: "gicm.dev",
  primaryTopics: [
    "AI development tools",
    "Claude Code",
    "vibe coding",
    "Solana development",
    "React components",
    "AI agents"
  ],
  competitors: ["cursor.com", "replit.com", "v0.dev", "bolt.new"]
};
var KeywordResearcher = class {
  logger;
  config;
  keywordCache = /* @__PURE__ */ new Map();
  constructor(config = {}) {
    this.logger = new Logger("KeywordResearcher");
    this.config = { ...DEFAULT_CONFIG6, ...config };
  }
  /**
   * Research keywords for a topic
   */
  async research(topic, count = 10) {
    const cacheKey = `${topic}-${count}`;
    if (this.keywordCache.has(cacheKey)) {
      return this.keywordCache.get(cacheKey);
    }
    this.logger.info(`Researching keywords for: ${topic}`);
    const keywords = await generateJSON({
      prompt: `Generate ${count} SEO keywords for this topic: "${topic}"

Context:
- Domain: ${this.config.domain}
- We cover: ${this.config.primaryTopics.join(", ")}
- Competitors: ${this.config.competitors.join(", ")}

For each keyword provide:
1. The keyword phrase (2-5 words, natural language)
2. Estimated search volume (high/medium/low)
3. Competition difficulty (easy/medium/hard)
4. Search intent (informational/commercial/transactional/navigational)

Focus on:
- Long-tail keywords we can rank for
- Keywords that match developer intent
- Mix of difficulty levels

Return JSON array:
[
  {
    "keyword": "keyword phrase",
    "searchVolume": "medium",
    "difficulty": "easy",
    "intent": "informational"
  }
]`
    });
    const result = keywords.map((k, i) => ({
      id: `kw-${Date.now()}-${i}`,
      keyword: k.keyword,
      volume: this.volumeToNumber(k.searchVolume),
      difficulty: this.difficultyToNumber(k.difficulty),
      intent: k.intent,
      currentRank: null,
      targetRank: 10,
      trend: "stable"
    }));
    this.keywordCache.set(cacheKey, result);
    return result;
  }
  /**
   * Find related keywords
   */
  async findRelated(keyword) {
    this.logger.info(`Finding related keywords for: ${keyword}`);
    const related = await generateJSON({
      prompt: `Generate 5 related/similar keywords to: "${keyword}"

These should be:
- Semantic variations
- Long-tail versions
- Related concepts

Return JSON array of keyword strings.`
    });
    return Promise.all(related.map((k) => this.analyze(k)));
  }
  /**
   * Analyze a single keyword
   */
  async analyze(keyword) {
    const analysis = await generateJSON({
      prompt: `Analyze this SEO keyword: "${keyword}"

Estimate:
1. Search volume (high/medium/low)
2. Competition difficulty (easy/medium/hard)
3. Search intent (informational/commercial/transactional/navigational)
4. Trend (rising/stable/declining)

Return JSON.`
    });
    return {
      id: `kw-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      keyword,
      volume: this.volumeToNumber(analysis.searchVolume),
      difficulty: this.difficultyToNumber(analysis.difficulty),
      intent: analysis.intent,
      currentRank: null,
      targetRank: 10,
      trend: analysis.trend
    };
  }
  /**
   * Find content gaps
   */
  async findContentGaps() {
    this.logger.info("Finding content gaps...");
    return generateJSON({
      prompt: `Identify content gaps for ${this.config.domain}

Topics we cover: ${this.config.primaryTopics.join(", ")}
Competitors: ${this.config.competitors.join(", ")}

Find keywords/topics where:
1. Users are searching but we likely don't have content
2. Competitors rank but we could compete
3. Emerging topics in our space

Return JSON array:
[
  {
    "keyword": "keyword phrase",
    "opportunity": "why this is a gap",
    "priority": "high"
  }
]`
    });
  }
  /**
   * Generate keyword clusters
   */
  async cluster(keywords) {
    const clusters = await generateJSON({
      prompt: `Cluster these keywords by topic/intent:

${keywords.join("\n")}

Group related keywords together under a parent topic.
Return JSON object with topic names as keys and keyword arrays as values.`
    });
    return new Map(Object.entries(clusters));
  }
  /**
   * Convert volume string to number
   */
  volumeToNumber(volume) {
    switch (volume) {
      case "high":
        return 1e4;
      case "medium":
        return 1e3;
      case "low":
        return 100;
    }
  }
  /**
   * Convert difficulty to number (0-100)
   */
  difficultyToNumber(difficulty) {
    switch (difficulty) {
      case "easy":
        return 25;
      case "medium":
        return 50;
      case "hard":
        return 80;
    }
  }
};

// src/seo/optimizer.ts
var SEOOptimizer = class {
  logger;
  constructor() {
    this.logger = new Logger("SEOOptimizer");
  }
  /**
   * Analyze content for SEO
   */
  async analyze(content, targetKeywords) {
    this.logger.info("Analyzing content for SEO...");
    const wordCount = content.split(/\s+/).length;
    const headings = content.match(/^#{1,6}\s.+$/gm) || [];
    const links = content.match(/\[.+\]\(.+\)/g) || [];
    const keywordCounts = targetKeywords.map((kw) => {
      const regex = new RegExp(kw, "gi");
      return (content.match(regex) || []).length;
    });
    const avgKeywordDensity = keywordCounts.reduce((a, b) => a + b, 0) / wordCount / targetKeywords.length;
    const llmAnalysis = await generateJSON({
      prompt: `Analyze this content for SEO:

Content (first 2000 chars):
${content.slice(0, 2e3)}

Target keywords: ${targetKeywords.join(", ")}

Analyze:
1. Title effectiveness (0-100)
2. Meta description potential (0-100)
3. Readability (0-100)
4. Heading structure (0-100)
5. Issues found (errors, warnings, info)
6. Improvement suggestions

Return JSON:
{
  "titleScore": 80,
  "descriptionScore": 70,
  "readabilityScore": 85,
  "headingStructureScore": 75,
  "issues": [
    { "type": "warning", "message": "issue description", "fix": "how to fix" }
  ],
  "suggestions": ["suggestion1", "suggestion2"]
}`
    });
    const overallScore = Math.round(
      (llmAnalysis.titleScore + llmAnalysis.descriptionScore + llmAnalysis.readabilityScore + llmAnalysis.headingStructureScore + Math.min(avgKeywordDensity * 1e3, 100)) / 5
    );
    const issues = [...llmAnalysis.issues];
    if (wordCount < 300) {
      issues.push({
        type: "warning",
        message: "Content is too short (< 300 words)",
        fix: "Add more valuable content to improve ranking potential"
      });
    }
    if (headings.length < 3) {
      issues.push({
        type: "warning",
        message: "Not enough headings for structure",
        fix: "Add H2/H3 headings to break up content"
      });
    }
    if (links.length < 2) {
      issues.push({
        type: "info",
        message: "Few internal/external links",
        fix: "Add relevant links to other content"
      });
    }
    if (avgKeywordDensity < 5e-3) {
      issues.push({
        type: "warning",
        message: "Low keyword density",
        fix: "Naturally include target keywords more often"
      });
    } else if (avgKeywordDensity > 0.03) {
      issues.push({
        type: "warning",
        message: "Keyword stuffing detected",
        fix: "Reduce keyword frequency to avoid penalties"
      });
    }
    return {
      score: overallScore,
      issues,
      suggestions: llmAnalysis.suggestions,
      meta: {
        titleScore: llmAnalysis.titleScore,
        descriptionScore: llmAnalysis.descriptionScore,
        keywordDensity: avgKeywordDensity,
        readability: llmAnalysis.readabilityScore,
        headingStructure: llmAnalysis.headingStructureScore
      }
    };
  }
  /**
   * Optimize content for SEO
   */
  async optimize(content, targetKeywords, analysis) {
    this.logger.info("Optimizing content for SEO...");
    if (analysis.score >= 85) {
      this.logger.info("Content already well-optimized");
      return content;
    }
    const optimized = await generateJSON({
      prompt: `Optimize this content for SEO without changing its meaning or style:

Original content:
${content}

Target keywords: ${targetKeywords.join(", ")}

Issues to fix:
${analysis.issues.map((i) => `- ${i.message}`).join("\n")}

Suggestions:
${analysis.suggestions.join("\n")}

Make improvements while:
- Keeping the same voice and style
- Not keyword stuffing
- Maintaining natural flow
- Keeping all technical accuracy

Return JSON: { "optimizedContent": "the full optimized content" }`
    });
    return optimized.optimizedContent;
  }
  /**
   * Generate meta tags
   */
  async generateMeta(content, targetKeywords) {
    return generateJSON({
      prompt: `Generate SEO meta tags for this content:

Content (first 1000 chars):
${content.slice(0, 1e3)}

Target keywords: ${targetKeywords.join(", ")}

Generate:
1. Title (50-60 chars, include primary keyword)
2. Meta description (150-160 chars, compelling)
3. OG title (slightly different, engaging)
4. OG description
5. Twitter title
6. Twitter description

Return JSON:
{
  "title": "...",
  "description": "...",
  "ogTitle": "...",
  "ogDescription": "...",
  "twitterTitle": "...",
  "twitterDescription": "..."
}`
    });
  }
  /**
   * Analyze blog post specifically
   */
  async analyzeBlogPost(post) {
    const fullContent = `# ${post.title}

${post.content}`;
    const keywords = post.seo?.keywords || post.tags;
    return this.analyze(fullContent, keywords);
  }
  /**
   * Generate schema markup
   */
  async generateSchema(post) {
    return {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: post.title,
      description: post.excerpt,
      author: {
        "@type": "Person",
        name: post.author
      },
      datePublished: new Date(post.publishedAt || Date.now()).toISOString(),
      keywords: post.tags.join(", "),
      articleSection: post.category
    };
  }
  /**
   * Check URL SEO
   */
  analyzeUrl(url) {
    const issues = [];
    let score = 100;
    if (url.length > 75) {
      issues.push("URL is too long");
      score -= 10;
    }
    if (!/^[a-z0-9-/]+$/.test(url)) {
      issues.push("URL contains special characters");
      score -= 15;
    }
    if (url.includes("--")) {
      issues.push("URL has consecutive hyphens");
      score -= 5;
    }
    if (url.split("/").some((s) => s.length > 50)) {
      issues.push("URL segment too long");
      score -= 10;
    }
    return { score: Math.max(0, score), issues };
  }
};

// src/content/mind-mapping.ts
import { z } from "zod";
var BranchTypeSchema = z.enum([
  "problem",
  // Problems this topic solves
  "solution",
  // Solutions/approaches
  "example",
  // Real-world examples
  "comparison",
  // Comparisons to alternatives
  "tutorial",
  // How-to content
  "future",
  // Future possibilities
  "community",
  // Community aspects
  "tool"
  // Related tools
]);
var MindMapNodeSchema = z.object({
  id: z.string(),
  concept: z.string(),
  description: z.string().optional(),
  branchType: BranchTypeSchema.optional(),
  children: z.array(z.lazy(() => MindMapNodeSchema)).default([]),
  contentIdeas: z.array(z.string()).default([]),
  keywords: z.array(z.string()).default([])
});
var MindMapSchema = z.object({
  id: z.string(),
  topic: z.string(),
  description: z.string(),
  root: MindMapNodeSchema,
  branches: z.record(BranchTypeSchema, MindMapNodeSchema).optional(),
  connections: z.array(z.object({
    from: z.string(),
    to: z.string(),
    relationship: z.string()
  })).default([]),
  generatedAt: z.number()
});
var ContentIdeaSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: z.enum(["blog", "tweet", "thread", "video", "tutorial"]),
  description: z.string(),
  sourceNodes: z.array(z.string()),
  // Node IDs that inspired this
  keywords: z.array(z.string()),
  priority: z.number().min(1).max(10),
  estimatedEffort: z.enum(["low", "medium", "high"])
});
var MindMapper = class {
  logger;
  constructor() {
    this.logger = new Logger("MindMapper");
  }
  /**
   * Generate a mind map from a central topic
   */
  generateMindMap(topic, context) {
    this.logger.info(`Generating mind map for: ${topic}`);
    const mapId = `map-${Date.now()}`;
    const root = this.createRootNode(topic, context);
    const branches = this.generateBranches(topic, context);
    root.children = Object.values(branches);
    const connections = this.findConnections(branches);
    const mindMap = {
      id: mapId,
      topic,
      description: context || `Mind map exploring ${topic}`,
      root,
      branches,
      connections,
      generatedAt: Date.now()
    };
    this.logger.info(`Mind map generated with ${Object.keys(branches).length} branches`);
    return mindMap;
  }
  /**
   * Extract content ideas from a mind map
   */
  extractContentIdeas(mindMap) {
    const ideas = [];
    let ideaCount = 0;
    for (const [branchType, branch] of Object.entries(mindMap.branches || {})) {
      const branchIdeas = this.processBranchForContent(
        branch,
        branchType,
        mindMap.topic
      );
      ideas.push(...branchIdeas);
      ideaCount += branchIdeas.length;
    }
    for (const conn of mindMap.connections) {
      const crossIdea = this.generateCrossConnectionIdea(
        mindMap,
        conn.from,
        conn.to,
        conn.relationship
      );
      if (crossIdea) {
        ideas.push(crossIdea);
        ideaCount++;
      }
    }
    this.logger.info(`Extracted ${ideaCount} content ideas from mind map`);
    return ideas.sort((a, b) => b.priority - a.priority);
  }
  /**
   * Create root node for topic
   */
  createRootNode(topic, context) {
    return {
      id: "root",
      concept: topic,
      description: context || `Central concept: ${topic}`,
      children: [],
      contentIdeas: [],
      keywords: this.extractKeywords(topic)
    };
  }
  /**
   * Generate standard branches for a topic
   */
  generateBranches(topic, context) {
    const topicLower = topic.toLowerCase();
    const isWeb3 = topicLower.includes("web3") || topicLower.includes("blockchain") || topicLower.includes("crypto") || topicLower.includes("defi");
    const isAI = topicLower.includes("ai") || topicLower.includes("llm") || topicLower.includes("agent") || topicLower.includes("ml");
    return {
      problem: this.createProblemBranch(topic, isWeb3, isAI),
      solution: this.createSolutionBranch(topic, isWeb3, isAI),
      example: this.createExampleBranch(topic, isWeb3, isAI),
      comparison: this.createComparisonBranch(topic, isWeb3, isAI),
      tutorial: this.createTutorialBranch(topic, isWeb3, isAI),
      future: this.createFutureBranch(topic, isWeb3, isAI),
      community: this.createCommunityBranch(topic, isWeb3, isAI),
      tool: this.createToolBranch(topic, isWeb3, isAI)
    };
  }
  createProblemBranch(topic, isWeb3, isAI) {
    const children = [];
    if (isWeb3) {
      children.push(
        { id: "prob-1", concept: "Transaction complexity", children: [], contentIdeas: [], keywords: ["gas", "fees", "UX"] },
        { id: "prob-2", concept: "Security vulnerabilities", children: [], contentIdeas: [], keywords: ["security", "audit", "smart contracts"] },
        { id: "prob-3", concept: "Scalability limitations", children: [], contentIdeas: [], keywords: ["L2", "scaling", "throughput"] }
      );
    }
    if (isAI) {
      children.push(
        { id: "prob-4", concept: "Hallucination issues", children: [], contentIdeas: [], keywords: ["accuracy", "grounding", "RAG"] },
        { id: "prob-5", concept: "Context limitations", children: [], contentIdeas: [], keywords: ["context window", "memory", "retrieval"] },
        { id: "prob-6", concept: "Cost optimization", children: [], contentIdeas: [], keywords: ["tokens", "API costs", "efficiency"] }
      );
    }
    children.push(
      { id: "prob-7", concept: "Learning curve", children: [], contentIdeas: [], keywords: ["onboarding", "documentation", "tutorials"] },
      { id: "prob-8", concept: "Integration challenges", children: [], contentIdeas: [], keywords: ["API", "SDK", "compatibility"] }
    );
    return {
      id: "branch-problem",
      concept: `Problems ${topic} Solves`,
      branchType: "problem",
      children,
      contentIdeas: [
        `The Top 5 Pain Points ${topic} Addresses`,
        `Why Traditional Approaches to ${topic} Fail`
      ],
      keywords: ["problems", "challenges", "pain points"]
    };
  }
  createSolutionBranch(topic, isWeb3, isAI) {
    const children = [];
    if (isWeb3) {
      children.push(
        { id: "sol-1", concept: "Account abstraction", children: [], contentIdeas: [], keywords: ["ERC-4337", "smart accounts"] },
        { id: "sol-2", concept: "Modular architecture", children: [], contentIdeas: [], keywords: ["composability", "protocols"] }
      );
    }
    if (isAI) {
      children.push(
        { id: "sol-3", concept: "RAG implementation", children: [], contentIdeas: [], keywords: ["retrieval", "embeddings", "vector DB"] },
        { id: "sol-4", concept: "Agent orchestration", children: [], contentIdeas: [], keywords: ["multi-agent", "coordination"] }
      );
    }
    children.push(
      { id: "sol-5", concept: "Automation", children: [], contentIdeas: [], keywords: ["workflow", "efficiency"] },
      { id: "sol-6", concept: "Developer experience", children: [], contentIdeas: [], keywords: ["DX", "tooling", "SDK"] }
    );
    return {
      id: "branch-solution",
      concept: `How ${topic} Works`,
      branchType: "solution",
      children,
      contentIdeas: [
        `${topic}: A Complete Technical Deep Dive`,
        `The Architecture Behind ${topic}`
      ],
      keywords: ["solution", "how it works", "architecture"]
    };
  }
  createExampleBranch(topic, isWeb3, isAI) {
    const children = [];
    if (isWeb3) {
      children.push(
        { id: "ex-1", concept: "DeFi integration", children: [], contentIdeas: [], keywords: ["Uniswap", "Aave", "DeFi"] },
        { id: "ex-2", concept: "NFT use cases", children: [], contentIdeas: [], keywords: ["NFT", "marketplace", "gaming"] }
      );
    }
    if (isAI) {
      children.push(
        { id: "ex-3", concept: "Code generation", children: [], contentIdeas: [], keywords: ["copilot", "code review"] },
        { id: "ex-4", concept: "Data analysis", children: [], contentIdeas: [], keywords: ["analytics", "insights"] }
      );
    }
    children.push(
      { id: "ex-5", concept: "Real-world deployment", children: [], contentIdeas: [], keywords: ["production", "case study"] },
      { id: "ex-6", concept: "Enterprise usage", children: [], contentIdeas: [], keywords: ["enterprise", "B2B"] }
    );
    return {
      id: "branch-example",
      concept: `${topic} in Action`,
      branchType: "example",
      children,
      contentIdeas: [
        `5 Real-World Examples of ${topic}`,
        `Case Study: How Company X Uses ${topic}`
      ],
      keywords: ["examples", "case studies", "use cases"]
    };
  }
  createComparisonBranch(topic, isWeb3, isAI) {
    const children = [];
    if (isWeb3) {
      children.push(
        { id: "cmp-1", concept: "vs Traditional Finance", children: [], contentIdeas: [], keywords: ["TradFi", "DeFi comparison"] },
        { id: "cmp-2", concept: "vs Other L1/L2", children: [], contentIdeas: [], keywords: ["Ethereum", "Solana", "comparison"] }
      );
    }
    if (isAI) {
      children.push(
        { id: "cmp-3", concept: "vs GPT-4", children: [], contentIdeas: [], keywords: ["OpenAI", "comparison"] },
        { id: "cmp-4", concept: "vs Claude", children: [], contentIdeas: [], keywords: ["Anthropic", "Claude"] }
      );
    }
    children.push(
      { id: "cmp-5", concept: "vs Manual approach", children: [], contentIdeas: [], keywords: ["automation", "efficiency"] },
      { id: "cmp-6", concept: "vs Competitors", children: [], contentIdeas: [], keywords: ["alternatives", "market"] }
    );
    return {
      id: "branch-comparison",
      concept: `${topic} vs Alternatives`,
      branchType: "comparison",
      children,
      contentIdeas: [
        `${topic} vs The Competition: Complete Comparison`,
        `When to Use ${topic} (and When Not To)`
      ],
      keywords: ["comparison", "vs", "alternatives"]
    };
  }
  createTutorialBranch(topic, isWeb3, isAI) {
    const children = [];
    children.push(
      { id: "tut-1", concept: "Getting started", children: [], contentIdeas: [], keywords: ["quickstart", "setup"] },
      { id: "tut-2", concept: "First project", children: [], contentIdeas: [], keywords: ["tutorial", "beginner"] },
      { id: "tut-3", concept: "Advanced patterns", children: [], contentIdeas: [], keywords: ["advanced", "patterns"] },
      { id: "tut-4", concept: "Best practices", children: [], contentIdeas: [], keywords: ["best practices", "tips"] },
      { id: "tut-5", concept: "Troubleshooting", children: [], contentIdeas: [], keywords: ["debugging", "errors"] }
    );
    return {
      id: "branch-tutorial",
      concept: `Learning ${topic}`,
      branchType: "tutorial",
      children,
      contentIdeas: [
        `${topic}: Complete Beginner's Guide`,
        `Build Your First Project with ${topic}`,
        `${topic} Best Practices: 10 Tips from Experts`
      ],
      keywords: ["tutorial", "guide", "learn", "how to"]
    };
  }
  createFutureBranch(topic, isWeb3, isAI) {
    const children = [];
    if (isWeb3) {
      children.push(
        { id: "fut-1", concept: "Mass adoption", children: [], contentIdeas: [], keywords: ["adoption", "mainstream"] },
        { id: "fut-2", concept: "Regulatory clarity", children: [], contentIdeas: [], keywords: ["regulation", "compliance"] }
      );
    }
    if (isAI) {
      children.push(
        { id: "fut-3", concept: "AGI implications", children: [], contentIdeas: [], keywords: ["AGI", "future"] },
        { id: "fut-4", concept: "Autonomous systems", children: [], contentIdeas: [], keywords: ["autonomy", "self-improving"] }
      );
    }
    children.push(
      { id: "fut-5", concept: "Roadmap", children: [], contentIdeas: [], keywords: ["roadmap", "plans"] },
      { id: "fut-6", concept: "Industry trends", children: [], contentIdeas: [], keywords: ["trends", "predictions"] }
    );
    return {
      id: "branch-future",
      concept: `Future of ${topic}`,
      branchType: "future",
      children,
      contentIdeas: [
        `${topic} in 2025: What's Coming Next`,
        `The Future of ${topic}: Expert Predictions`
      ],
      keywords: ["future", "predictions", "trends", "roadmap"]
    };
  }
  createCommunityBranch(topic, _isWeb3, _isAI) {
    return {
      id: "branch-community",
      concept: `${topic} Community`,
      branchType: "community",
      children: [
        { id: "com-1", concept: "Discord community", children: [], contentIdeas: [], keywords: ["Discord", "community"] },
        { id: "com-2", concept: "Open source", children: [], contentIdeas: [], keywords: ["open source", "GitHub"] },
        { id: "com-3", concept: "Contributors", children: [], contentIdeas: [], keywords: ["contributors", "team"] },
        { id: "com-4", concept: "Events", children: [], contentIdeas: [], keywords: ["events", "hackathons"] }
      ],
      contentIdeas: [
        `Join the ${topic} Community: A Complete Guide`,
        `How to Contribute to ${topic}`
      ],
      keywords: ["community", "open source", "contribute"]
    };
  }
  createToolBranch(topic, isWeb3, isAI) {
    const children = [];
    if (isWeb3) {
      children.push(
        { id: "tool-1", concept: "Wallets", children: [], contentIdeas: [], keywords: ["wallet", "Phantom", "MetaMask"] },
        { id: "tool-2", concept: "Block explorers", children: [], contentIdeas: [], keywords: ["Etherscan", "Solscan"] }
      );
    }
    if (isAI) {
      children.push(
        { id: "tool-3", concept: "LLM APIs", children: [], contentIdeas: [], keywords: ["API", "OpenAI", "Anthropic"] },
        { id: "tool-4", concept: "Vector databases", children: [], contentIdeas: [], keywords: ["Pinecone", "Qdrant"] }
      );
    }
    children.push(
      { id: "tool-5", concept: "Development tools", children: [], contentIdeas: [], keywords: ["IDE", "CLI", "SDK"] },
      { id: "tool-6", concept: "Testing tools", children: [], contentIdeas: [], keywords: ["testing", "debugging"] }
    );
    return {
      id: "branch-tool",
      concept: `${topic} Tools & Resources`,
      branchType: "tool",
      children,
      contentIdeas: [
        `Essential Tools for ${topic} Development`,
        `${topic} Toolkit: Everything You Need`
      ],
      keywords: ["tools", "resources", "SDK", "API"]
    };
  }
  /**
   * Find connections between branches
   */
  findConnections(branches) {
    const connections = [];
    connections.push({
      from: "branch-problem",
      to: "branch-solution",
      relationship: "solves"
    });
    connections.push({
      from: "branch-solution",
      to: "branch-tutorial",
      relationship: "teaches"
    });
    connections.push({
      from: "branch-tutorial",
      to: "branch-example",
      relationship: "demonstrates"
    });
    connections.push({
      from: "branch-tool",
      to: "branch-solution",
      relationship: "enables"
    });
    connections.push({
      from: "branch-future",
      to: "branch-problem",
      relationship: "anticipates"
    });
    return connections;
  }
  /**
   * Process a branch to generate content ideas
   */
  processBranchForContent(branch, branchType, topic) {
    const ideas = [];
    let idCount = 0;
    for (const idea of branch.contentIdeas) {
      ideas.push({
        id: `idea-${branchType}-${idCount++}`,
        title: idea,
        type: this.determineContentType(branchType),
        description: `Content idea from ${branchType} branch`,
        sourceNodes: [branch.id],
        keywords: [...branch.keywords, topic],
        priority: this.calculatePriority(branchType),
        estimatedEffort: this.estimateEffort(branchType)
      });
    }
    for (const child of branch.children) {
      const childIdea = {
        id: `idea-${branchType}-${idCount++}`,
        title: `${child.concept}: A Deep Dive into ${topic}`,
        type: "blog",
        description: child.description || `Exploring ${child.concept} in context of ${topic}`,
        sourceNodes: [branch.id, child.id],
        keywords: [...child.keywords, topic],
        priority: 5,
        estimatedEffort: "medium"
      };
      ideas.push(childIdea);
    }
    return ideas;
  }
  /**
   * Generate idea from cross-connection
   */
  generateCrossConnectionIdea(mindMap, from, to, relationship) {
    const fromType = from.replace("branch-", "");
    const toType = to.replace("branch-", "");
    return {
      id: `idea-cross-${from}-${to}`,
      title: `How ${mindMap.topic} ${relationship}: From ${fromType} to ${toType}`,
      type: "thread",
      description: `Cross-connection content linking ${fromType} and ${toType} perspectives`,
      sourceNodes: [from, to],
      keywords: [mindMap.topic, fromType, toType, relationship],
      priority: 7,
      estimatedEffort: "medium"
    };
  }
  /**
   * Determine best content type for branch
   */
  determineContentType(branchType) {
    const typeMap = {
      problem: "blog",
      solution: "blog",
      example: "tutorial",
      comparison: "blog",
      tutorial: "tutorial",
      future: "thread",
      community: "tweet",
      tool: "blog"
    };
    return typeMap[branchType] || "blog";
  }
  /**
   * Calculate priority for branch type
   */
  calculatePriority(branchType) {
    const priorityMap = {
      tutorial: 9,
      example: 8,
      problem: 7,
      solution: 7,
      comparison: 6,
      tool: 6,
      future: 5,
      community: 4
    };
    return priorityMap[branchType] || 5;
  }
  /**
   * Estimate effort for branch type
   */
  estimateEffort(branchType) {
    const effortMap = {
      tutorial: "high",
      example: "high",
      problem: "medium",
      solution: "high",
      comparison: "medium",
      tool: "low",
      future: "low",
      community: "low"
    };
    return effortMap[branchType] || "medium";
  }
  /**
   * Extract keywords from text
   */
  extractKeywords(text) {
    const words = text.toLowerCase().split(/\s+/);
    const stopWords = /* @__PURE__ */ new Set(["the", "a", "an", "is", "are", "for", "to", "of", "and", "in", "on"]);
    return words.filter((w) => w.length > 2 && !stopWords.has(w));
  }
};

// src/index.ts
var hub = null;
try {
  const { getHub } = await import("@gicm/integration-hub");
  hub = getHub();
} catch {
}
var GrowthEngine = class {
  logger;
  config;
  blogGenerator;
  blogStorage;
  twitterManager;
  discordManager;
  keywordResearcher;
  seoOptimizer;
  weeklyBlogCron;
  metricsCollectCron;
  status = {
    running: false,
    startedAt: null,
    metrics: {
      traffic: { daily: 0, weekly: 0, monthly: 0, trend: "stable" },
      content: { postsPublished: 0, totalViews: 0, avgEngagement: 0 },
      engagement: { twitterFollowers: 0, discordMembers: 0, newsletterSubs: 0 },
      seo: { avgPosition: 0, indexedPages: 0, backlinks: 0 }
    },
    upcomingContent: {
      week: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      blogPosts: [],
      tweets: [],
      threads: []
    }
  };
  constructor(config) {
    this.logger = new Logger("GrowthEngine");
    this.config = {
      blog: {
        postsPerWeek: config?.blog?.postsPerWeek || 3,
        categories: config?.blog?.categories || ["tutorial", "guide", "announcement"],
        targetWordCount: config?.blog?.targetWordCount || 1500
      },
      twitter: {
        tweetsPerDay: config?.twitter?.tweetsPerDay || 5,
        threadsPerWeek: config?.twitter?.threadsPerWeek || 2,
        engagementEnabled: config?.twitter?.engagementEnabled ?? true
      },
      seo: {
        primaryKeywords: config?.seo?.primaryKeywords || [],
        competitors: config?.seo?.competitors || [],
        targetPositions: config?.seo?.targetPositions || {}
      },
      discord: {
        serverId: config?.discord?.serverId || "",
        announcementChannel: config?.discord?.announcementChannel || "",
        contentChannel: config?.discord?.contentChannel || ""
      }
    };
    this.blogGenerator = new BlogGenerator();
    this.blogStorage = new BlogStorage();
    this.twitterManager = new TwitterManager({
      tweetsPerDay: this.config.twitter.tweetsPerDay
    });
    this.discordManager = new DiscordManager();
    this.keywordResearcher = new KeywordResearcher();
    this.seoOptimizer = new SEOOptimizer();
  }
  /**
   * Start the Growth Engine
   */
  async start() {
    this.logger.info("Starting Growth Engine...");
    try {
      await this.twitterManager.init();
      this.twitterManager.start();
      this.logger.info(`- Twitter: ${this.config.twitter.tweetsPerDay} tweets/day`);
    } catch (error) {
      this.logger.warn(`Twitter unavailable, continuing without it: ${error}`);
    }
    try {
      await this.discordManager.start();
      this.logger.info(`- Discord: ${this.discordManager.isReady() ? "connected" : "pending"}`);
    } catch (error) {
      this.logger.warn(`Discord unavailable, continuing without it: ${error}`);
    }
    this.weeklyBlogCron = new CronJob4("0 6 * * 0", async () => {
      try {
        await this.generateWeeklyContent();
      } catch (error) {
        this.logger.error(`Weekly content generation failed: ${error}`);
      }
    });
    this.weeklyBlogCron.start();
    this.metricsCollectCron = new CronJob4("0 */6 * * *", async () => {
      try {
        await this.collectMetrics();
      } catch (error) {
        this.logger.error(`Metrics collection failed: ${error}`);
      }
    });
    this.metricsCollectCron.start();
    this.status.running = true;
    if (hub) {
      hub.engineStarted("growth-engine");
      setInterval(() => hub.heartbeat("growth-engine"), 3e4);
    }
    this.status.startedAt = Date.now();
    this.logger.info("Growth Engine started successfully!");
    this.logger.info(`- Blog: ${this.config.blog.postsPerWeek} posts/week`);
  }
  /**
   * Stop the Growth Engine
   */
  async stop() {
    this.logger.info("Stopping Growth Engine...");
    this.twitterManager.stop();
    await this.discordManager.stop();
    if (this.weeklyBlogCron) {
      this.weeklyBlogCron.stop();
    }
    if (this.metricsCollectCron) {
      this.metricsCollectCron.stop();
    }
    this.status.running = false;
    this.logger.info("Growth Engine stopped");
  }
  /**
   * Announce on Discord
   */
  async announceFeature(feature) {
    await this.discordManager.announceFeature(feature);
  }
  async announceAgent(agent) {
    await this.discordManager.announceAgent(agent);
  }
  async announceComponent(component) {
    await this.discordManager.announceComponent(component);
  }
  async announceUpdate(version, changes) {
    await this.discordManager.announceUpdate(version, changes);
  }
  /**
   * Get Discord member count
   */
  async getDiscordMembers() {
    return this.discordManager.getMemberCount();
  }
  /**
   * Generate weekly content
   */
  async generateWeeklyContent() {
    this.logger.info("Generating weekly content...");
    const keywords = await this.keywordResearcher.findContentGaps();
    const topKeywords = keywords.slice(0, 5);
    for (let i = 0; i < this.config.blog.postsPerWeek; i++) {
      const keyword = topKeywords[i % topKeywords.length];
      const category = this.config.blog.categories[i % this.config.blog.categories.length];
      try {
        const length = this.config.blog.targetWordCount > 2e3 ? "long" : this.config.blog.targetWordCount > 1200 ? "medium" : "short";
        const post = await this.blogGenerator.generate({
          topic: keyword.keyword,
          category,
          length
        });
        const analysis = await this.seoOptimizer.analyzeBlogPost(post);
        if (analysis.score < 70) {
          post.content = await this.seoOptimizer.optimize(
            post.content,
            post.tags,
            analysis
          );
        }
        await this.blogStorage.save(post);
        this.status.upcomingContent.blogPosts.push(post);
        this.status.metrics.content.postsPublished++;
        await this.twitterManager.promoteBlogPost({
          title: post.title,
          excerpt: post.excerpt,
          url: `https://gicm.dev/blog/${post.slug}`
        });
        this.logger.info(`Generated and saved blog post: ${post.title}`);
      } catch (error) {
        this.logger.error(`Blog generation failed: ${error}`);
      }
    }
    await this.twitterManager.generateDailyContent();
  }
  /**
   * Collect metrics
   */
  async collectMetrics() {
    this.logger.info("Collecting metrics...");
    const queueStatus = this.twitterManager.getQueueStatus();
    this.status.metrics.content.tweets = queueStatus.posted;
    this.logger.info(`Metrics: ${JSON.stringify(this.status.metrics)}`);
  }
  /**
   * Get current status
   */
  getStatus() {
    return { ...this.status };
  }
  /**
   * Generate content now
   */
  async generateNow(type, topic) {
    switch (type) {
      case "blog":
        const post = await this.blogGenerator.generate({
          topic: topic || "AI development tools",
          category: "tutorial"
        });
        await this.blogStorage.save(post);
        this.logger.info(`Generated and saved blog: ${post.title}`);
        return post;
      case "tweet":
        await this.twitterManager.generateDailyContent();
        this.logger.info("Generated daily tweets");
        break;
      case "thread":
        await this.twitterManager.queueThread(topic || "AI Development", [
          "Introduction to AI tools",
          "Key benefits",
          "Getting started"
        ]);
        this.logger.info("Queued thread");
        break;
    }
  }
  /**
   * Get all saved blog posts
   */
  async getBlogPosts() {
    return this.blogStorage.list();
  }
  /**
   * Get blog storage stats
   */
  async getBlogStats() {
    return this.blogStorage.getStats();
  }
  /**
   * Research keywords
   */
  async researchKeywords(topic) {
    const keywords = await this.keywordResearcher.research(topic);
    this.logger.info(`Found ${keywords.length} keywords for "${topic}"`);
    keywords.forEach((k) => {
      this.logger.info(`  - ${k.keyword} (vol: ${k.volume}, diff: ${k.difficulty})`);
    });
  }
};

export {
  Logger,
  BlogGenerator,
  BlogStorage,
  TwitterClient,
  TweetQueue,
  TweetGenerator,
  TwitterManager,
  DiscordClient,
  DiscordAnnouncer,
  DiscordManager,
  KeywordResearcher,
  SEOOptimizer,
  MindMapper,
  GrowthEngine
};
//# sourceMappingURL=chunk-R3ULKJWC.js.map