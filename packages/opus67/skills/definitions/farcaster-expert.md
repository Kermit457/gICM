# Farcaster Expert

> **ID:** `farcaster-expert`
> **Tier:** 2
> **Token Cost:** 5000
> **MCP Connections:** neynar

## 🎯 What This Skill Does

- Query Farcaster API via Neynar
- Build Farcaster Frames
- Analyze cast engagement
- Track channel activity

## 📚 When to Use

This skill is automatically loaded when:

- **Keywords:** farcaster, neynar, cast, frame, warpcast
- **File Types:** N/A
- **Directories:** N/A

## 🚀 Core Capabilities


### 1. Query Farcaster API via Neynar

Neynar provides a comprehensive API for accessing Farcaster data including user profiles, casts, channels, and social graphs. Understanding the API structure and best practices is crucial for building reliable applications.

**Best Practices:**
- Cache user data to minimize API calls
- Use webhook subscriptions for real-time updates
- Implement exponential backoff for rate limits
- Validate FIDs before making API calls
- Use bulk endpoints when fetching multiple users
- Store API keys securely in environment variables

**Common Patterns:**
```typescript
// Initialize Neynar client
import { NeynarAPIClient } from "@neynar/nodejs-sdk";

const client = new NeynarAPIClient(process.env.NEYNAR_API_KEY!);

// Fetch user by FID
async function getUserProfile(fid: number) {
  try {
    const user = await client.fetchBulkUsers([fid]);
    return user.users[0];
  } catch (error) {
    console.error("Error fetching user:", error);
    throw error;
  }
}

// Fetch user's recent casts
async function getUserCasts(fid: number, limit = 25) {
  const casts = await client.fetchCastsForUser(fid, { limit });
  return casts.casts;
}

// Search for casts by keyword
async function searchCasts(query: string) {
  const results = await client.searchCasts(query, {
    limit: 50,
    priorityMode: false,
  });
  return results.casts;
}

// Fetch channel information
async function getChannelInfo(channelId: string) {
  const channel = await client.fetchChannel(channelId);
  return {
    id: channel.id,
    name: channel.name,
    description: channel.description,
    followerCount: channel.follower_count,
    imageUrl: channel.image_url,
  };
}

// Get cast reactions and replies
async function getCastEngagement(castHash: string) {
  const cast = await client.lookUpCastByHash(castHash);
  return {
    likes: cast.reactions.likes_count,
    recasts: cast.reactions.recasts_count,
    replies: cast.replies.count,
    text: cast.text,
    author: cast.author.username,
  };
}

// Publish a cast
async function publishCast(
  signerUuid: string,
  text: string,
  options?: {
    parent?: string; // For replies
    embeds?: Array<{ url: string }>;
    channelId?: string;
  }
) {
  const cast = await client.publishCast(signerUuid, text, options);
  return cast;
}
```

**Gotchas:**
- FIDs are numeric, not string identifiers
- Rate limits vary by plan (check your tier)
- Cast hashes are case-sensitive
- Channel IDs use lowercase slugs
- Webhook payloads can be large - parse selectively
- Timestamps are in ISO 8601 format


### 2. Build Farcaster Frames

Farcaster Frames enable interactive experiences within casts. They use Open Graph-like meta tags to render buttons, images, and handle user interactions.

**Best Practices:**
- Keep frame images under 256KB
- Use aspect ratio 1.91:1 (1200x630 recommended)
- Validate POST data signatures for security
- Implement proper error states
- Cache generated images when possible
- Support both frame v1 and v2 specs
- Test frames in multiple clients (Warpcast, Supercast)

**Common Patterns:**
```typescript
// Basic Frame HTML structure
export function generateFrameHTML(
  title: string,
  imageUrl: string,
  buttons: Array<{ label: string; action?: string; target?: string }>,
  postUrl: string
) {
  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${title}</title>

    <!-- Frame metadata -->
    <meta property="fc:frame" content="vNext" />
    <meta property="fc:frame:image" content="${imageUrl}" />
    <meta property="fc:frame:post_url" content="${postUrl}" />

    ${buttons.map((btn, i) => `
    <meta property="fc:frame:button:${i + 1}" content="${btn.label}" />
    ${btn.action ? `<meta property="fc:frame:button:${i + 1}:action" content="${btn.action}" />` : ''}
    ${btn.target ? `<meta property="fc:frame:button:${i + 1}:target" content="${btn.target}" />` : ''}
    `).join('\n')}

    <!-- Open Graph fallback -->
    <meta property="og:title" content="${title}" />
    <meta property="og:image" content="${imageUrl}" />
  </head>
  <body>
    <h1>${title}</h1>
  </body>
</html>
  `;
}

// Validate frame signature (Next.js example)
import { getSSLHubRpcClient } from "@farcaster/hub-nodejs";

async function validateFrameMessage(messageBytes: string) {
  const hubClient = getSSLHubRpcClient("nemes.farcaster.xyz:2283");
  const result = await hubClient.validateMessage(
    Buffer.from(messageBytes, "hex")
  );
  return result.isOk();
}

// Frame handler with state management
interface FrameState {
  step: number;
  selectedOption?: string;
  userId?: number;
}

export async function handleFrameAction(
  body: any,
  currentState: FrameState
): Promise<{ image: string; buttons: any[]; state: FrameState }> {
  const { buttonIndex, fid, castId } = body.untrustedData;

  // Update state based on button clicked
  let newState = { ...currentState };

  switch (currentState.step) {
    case 0:
      // Initial state
      newState = { step: 1, userId: fid, selectedOption: `option${buttonIndex}` };
      break;
    case 1:
      // Second interaction
      newState = { ...currentState, step: 2 };
      break;
  }

  // Generate new frame based on state
  const image = await generateFrameImage(newState);
  const buttons = getButtonsForStep(newState.step);

  return { image, buttons, state: newState };
}

// Multi-page frame example
function createPollFrame(question: string, options: string[]) {
  return {
    version: "vNext",
    image: `https://yourapp.com/api/poll-image?q=${encodeURIComponent(question)}`,
    buttons: options.map((opt, i) => ({
      label: opt,
      action: "post",
    })),
    postUrl: "https://yourapp.com/api/poll-submit",
  };
}

// Transaction frame pattern
function createMintFrame(nftData: { name: string; price: string; image: string }) {
  return {
    version: "vNext",
    image: nftData.image,
    buttons: [
      { label: `Mint for ${nftData.price} ETH`, action: "tx" },
      { label: "Learn More", action: "post_redirect", target: "https://yourapp.com/nft" },
    ],
    postUrl: "https://yourapp.com/api/mint-tx",
  };
}
```

**Gotchas:**
- Images must be publicly accessible URLs
- Buttons are limited to 4 per frame
- Button labels have a 32 character limit
- POST data includes both trusted and untrusted data
- Frame state must be encoded in URLs or database
- Redirects must use post_redirect action
- Transaction frames require special handling


### 3. Analyze cast engagement

Understanding engagement metrics helps optimize content strategy and identify trending topics. Neynar provides comprehensive analytics data.

**Best Practices:**
- Track engagement over time for trends
- Normalize metrics by follower count
- Consider both absolute and relative engagement
- Use engagement rate (likes + recasts + replies / views) as key metric
- Compare performance across channels
- Monitor reply sentiment and quality

**Common Patterns:**
```typescript
// Calculate engagement metrics
interface CastMetrics {
  hash: string;
  likes: number;
  recasts: number;
  replies: number;
  timestamp: Date;
  authorFid: number;
}

function calculateEngagementRate(cast: CastMetrics, followerCount: number): number {
  const totalEngagement = cast.likes + cast.recasts + cast.replies;
  return (totalEngagement / followerCount) * 100;
}

// Analyze user's best performing casts
async function analyzeBestCasts(fid: number, days = 30) {
  const user = await client.fetchBulkUsers([fid]);
  const casts = await client.fetchCastsForUser(fid, { limit: 100 });

  const metrics = casts.casts.map(cast => ({
    hash: cast.hash,
    text: cast.text,
    likes: cast.reactions.likes_count,
    recasts: cast.reactions.recasts_count,
    replies: cast.replies.count,
    totalEngagement: cast.reactions.likes_count + cast.reactions.recasts_count + cast.replies.count,
    timestamp: new Date(cast.timestamp),
  }));

  // Sort by engagement
  const topCasts = metrics
    .sort((a, b) => b.totalEngagement - a.totalEngagement)
    .slice(0, 10);

  return {
    topCasts,
    averageEngagement: metrics.reduce((sum, m) => sum + m.totalEngagement, 0) / metrics.length,
    totalLikes: metrics.reduce((sum, m) => sum + m.likes, 0),
    followerCount: user.users[0].follower_count,
  };
}

// Track engagement trends over time
async function getEngagementTrend(fid: number, days = 30) {
  const casts = await client.fetchCastsForUser(fid, { limit: 200 });
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const dailyMetrics = new Map<string, { likes: number; recasts: number; replies: number; count: number }>();

  casts.casts.forEach(cast => {
    const date = new Date(cast.timestamp);
    if (date < cutoffDate) return;

    const dateKey = date.toISOString().split('T')[0];
    const existing = dailyMetrics.get(dateKey) || { likes: 0, recasts: 0, replies: 0, count: 0 };

    dailyMetrics.set(dateKey, {
      likes: existing.likes + cast.reactions.likes_count,
      recasts: existing.recasts + cast.reactions.recasts_count,
      replies: existing.replies + cast.replies.count,
      count: existing.count + 1,
    });
  });

  return Array.from(dailyMetrics.entries()).map(([date, metrics]) => ({
    date,
    ...metrics,
    avgEngagement: (metrics.likes + metrics.recasts + metrics.replies) / metrics.count,
  }));
}

// Compare performance across channels
async function compareChannelPerformance(fid: number, channelIds: string[]) {
  const results = await Promise.all(
    channelIds.map(async (channelId) => {
      const feed = await client.fetchFeed("filter", {
        filterType: "channel_id",
        channelId,
        fid,
        limit: 50,
      });

      const totalEngagement = feed.casts.reduce(
        (sum, cast) => sum + cast.reactions.likes_count + cast.reactions.recasts_count + cast.replies.count,
        0
      );

      return {
        channelId,
        castCount: feed.casts.length,
        totalEngagement,
        avgEngagement: totalEngagement / feed.casts.length,
      };
    })
  );

  return results.sort((a, b) => b.avgEngagement - a.avgEngagement);
}

// Identify viral content patterns
interface ViralPattern {
  hasImages: boolean;
  hasLinks: boolean;
  textLength: number;
  timeOfDay: number;
  dayOfWeek: number;
  channelId?: string;
}

function analyzeViralPatterns(casts: any[]): ViralPattern {
  const viralThreshold = 100; // Total engagement
  const viralCasts = casts.filter(
    cast => cast.reactions.likes_count + cast.reactions.recasts_count + cast.replies.count > viralThreshold
  );

  const patterns = viralCasts.map(cast => {
    const date = new Date(cast.timestamp);
    return {
      hasImages: cast.embeds?.some((e: any) => e.url?.match(/\.(jpg|png|gif)$/i)) || false,
      hasLinks: cast.embeds?.some((e: any) => e.url) || false,
      textLength: cast.text.length,
      timeOfDay: date.getHours(),
      dayOfWeek: date.getDay(),
      channelId: cast.parent_url,
    };
  });

  // Calculate averages
  return {
    hasImages: patterns.filter(p => p.hasImages).length / patterns.length > 0.5,
    hasLinks: patterns.filter(p => p.hasLinks).length / patterns.length > 0.5,
    textLength: patterns.reduce((sum, p) => sum + p.textLength, 0) / patterns.length,
    timeOfDay: Math.round(patterns.reduce((sum, p) => sum + p.timeOfDay, 0) / patterns.length),
    dayOfWeek: Math.round(patterns.reduce((sum, p) => sum + p.dayOfWeek, 0) / patterns.length),
  };
}
```

**Gotchas:**
- Engagement can be delayed (wait 1-2 hours for accurate metrics)
- Deleted casts still appear in some API responses
- Follower count changes over time (snapshot when measuring)
- Bot engagement can skew metrics
- Channel-specific casts may perform differently
- Recasts count includes quotes


### 4. Track channel activity

Channels are the primary way content is organized on Farcaster. Monitoring channel activity helps identify trends, active communities, and content opportunities.

**Best Practices:**
- Monitor channel follower growth
- Track top contributors and content creators
- Identify trending topics within channels
- Measure channel engagement rates
- Set up webhooks for real-time channel updates
- Compare channel health metrics across communities

**Common Patterns:**
```typescript
// Get channel activity summary
async function getChannelActivity(channelId: string, hours = 24) {
  const feed = await client.fetchFeed("filter", {
    filterType: "channel_id",
    channelId,
    limit: 100,
  });

  const cutoff = new Date();
  cutoff.setHours(cutoff.getHours() - hours);

  const recentCasts = feed.casts.filter(
    cast => new Date(cast.timestamp) > cutoff
  );

  const uniqueAuthors = new Set(recentCasts.map(c => c.author.fid));
  const totalEngagement = recentCasts.reduce(
    (sum, cast) => sum + cast.reactions.likes_count + cast.reactions.recasts_count + cast.replies.count,
    0
  );

  return {
    channelId,
    castCount: recentCasts.length,
    uniqueAuthors: uniqueAuthors.size,
    totalEngagement,
    avgEngagementPerCast: totalEngagement / recentCasts.length,
    topContributors: getTopContributors(recentCasts, 5),
  };
}

function getTopContributors(casts: any[], limit = 5) {
  const contributorMap = new Map<number, { fid: number; username: string; castCount: number; engagement: number }>();

  casts.forEach(cast => {
    const existing = contributorMap.get(cast.author.fid) || {
      fid: cast.author.fid,
      username: cast.author.username,
      castCount: 0,
      engagement: 0,
    };

    contributorMap.set(cast.author.fid, {
      ...existing,
      castCount: existing.castCount + 1,
      engagement: existing.engagement + cast.reactions.likes_count + cast.reactions.recasts_count + cast.replies.count,
    });
  });

  return Array.from(contributorMap.values())
    .sort((a, b) => b.engagement - a.engagement)
    .slice(0, limit);
}

// Track channel growth
async function trackChannelGrowth(channelId: string) {
  const channel = await client.fetchChannel(channelId);

  // Store in database for historical tracking
  return {
    channelId,
    followerCount: channel.follower_count,
    timestamp: new Date(),
    metadata: {
      name: channel.name,
      description: channel.description,
      imageUrl: channel.image_url,
    },
  };
}

// Find trending channels
async function findTrendingChannels(limit = 10) {
  // This requires tracking channel metrics over time
  // Pseudo-code for demonstration
  const channels = await client.searchChannels(""); // Gets popular channels

  const channelMetrics = await Promise.all(
    channels.channels.slice(0, 50).map(async (channel) => {
      const activity = await getChannelActivity(channel.id, 24);
      return {
        ...channel,
        activityScore: activity.castCount * activity.avgEngagementPerCast,
        ...activity,
      };
    })
  );

  return channelMetrics
    .sort((a, b) => b.activityScore - a.activityScore)
    .slice(0, limit);
}

// Monitor channel for specific topics
async function monitorChannelTopics(channelId: string, keywords: string[]) {
  const feed = await client.fetchFeed("filter", {
    filterType: "channel_id",
    channelId,
    limit: 100,
  });

  const matches = feed.casts.filter(cast =>
    keywords.some(keyword =>
      cast.text.toLowerCase().includes(keyword.toLowerCase())
    )
  );

  return {
    channelId,
    keywords,
    matchCount: matches.length,
    matches: matches.map(cast => ({
      hash: cast.hash,
      text: cast.text,
      author: cast.author.username,
      engagement: cast.reactions.likes_count + cast.reactions.recasts_count + cast.replies.count,
      timestamp: cast.timestamp,
    })),
  };
}

// Setup webhook for channel updates
async function setupChannelWebhook(channelId: string, webhookUrl: string) {
  // Using Neynar webhook API
  const webhook = await client.publishWebhook({
    name: `Channel ${channelId} Monitor`,
    url: webhookUrl,
    subscription: {
      "cast.created": {
        channel_ids: [channelId],
      },
    },
  });

  return webhook;
}

// Process webhook payload
export function processChannelWebhook(payload: any) {
  const { type, data } = payload;

  if (type === "cast.created") {
    const cast = data;
    return {
      eventType: "new_cast",
      channelId: cast.parent_url,
      author: cast.author.username,
      text: cast.text,
      hash: cast.hash,
      timestamp: cast.timestamp,
    };
  }

  return null;
}
```

**Gotchas:**
- Channel IDs are URL slugs (lowercase, hyphenated)
- Channels can be created by any user
- Channel ownership can change
- Some channels are "gated" (require NFT, etc.)
- Channel feeds can be large (paginate wisely)
- Webhook payloads need signature verification


## 💡 Real-World Examples

### Example 1: Build a Farcaster Analytics Dashboard

```typescript
// app/api/analytics/route.ts
import { NeynarAPIClient } from "@neynar/nodejs-sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new NeynarAPIClient(process.env.NEYNAR_API_KEY!);

export async function GET(req: NextRequest) {
  const fid = req.nextUrl.searchParams.get("fid");

  if (!fid) {
    return NextResponse.json({ error: "FID required" }, { status: 400 });
  }

  try {
    // Fetch user data
    const user = await client.fetchBulkUsers([parseInt(fid)]);
    const casts = await client.fetchCastsForUser(parseInt(fid), { limit: 100 });

    // Calculate metrics
    const totalEngagement = casts.casts.reduce(
      (sum, cast) => sum + cast.reactions.likes_count + cast.reactions.recasts_count + cast.replies.count,
      0
    );

    const avgEngagement = totalEngagement / casts.casts.length;
    const engagementRate = (totalEngagement / user.users[0].follower_count) * 100;

    // Get top casts
    const topCasts = casts.casts
      .sort((a, b) => {
        const aEng = a.reactions.likes_count + a.reactions.recasts_count + a.replies.count;
        const bEng = b.reactions.likes_count + b.reactions.recasts_count + b.replies.count;
        return bEng - aEng;
      })
      .slice(0, 5)
      .map(cast => ({
        text: cast.text,
        likes: cast.reactions.likes_count,
        recasts: cast.reactions.recasts_count,
        replies: cast.replies.count,
        timestamp: cast.timestamp,
      }));

    return NextResponse.json({
      user: {
        fid: user.users[0].fid,
        username: user.users[0].username,
        displayName: user.users[0].display_name,
        followerCount: user.users[0].follower_count,
        followingCount: user.users[0].following_count,
      },
      metrics: {
        totalCasts: casts.casts.length,
        totalEngagement,
        avgEngagement: Math.round(avgEngagement),
        engagementRate: engagementRate.toFixed(2),
      },
      topCasts,
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
```

### Example 2: Interactive Poll Frame

```typescript
// app/api/frames/poll/route.ts
import { NextRequest, NextResponse } from "next/server";
import { generateFrameHTML } from "@/lib/frames";

interface PollState {
  question: string;
  options: string[];
  votes: Record<string, number>;
  voters: Set<number>;
}

const pollState: PollState = {
  question: "What's your favorite Farcaster client?",
  options: ["Warpcast", "Supercast", "Farcaster.xyz", "Other"],
  votes: { "0": 0, "1": 0, "2": 0, "3": 0 },
  voters: new Set(),
};

export async function GET() {
  const imageUrl = `${process.env.NEXT_PUBLIC_URL}/api/frames/poll/image`;
  const buttons = pollState.options.map(opt => ({ label: opt }));

  const html = generateFrameHTML(
    pollState.question,
    imageUrl,
    buttons,
    `${process.env.NEXT_PUBLIC_URL}/api/frames/poll`
  );

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html" },
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { buttonIndex, fid } = body.untrustedData;

  // Record vote
  if (!pollState.voters.has(fid)) {
    pollState.votes[String(buttonIndex - 1)]++;
    pollState.voters.add(fid);
  }

  // Generate results image
  const imageUrl = `${process.env.NEXT_PUBLIC_URL}/api/frames/poll/results`;
  const html = generateFrameHTML(
    "Poll Results",
    imageUrl,
    [{ label: "View on Warpcast", action: "link", target: "https://warpcast.com" }],
    `${process.env.NEXT_PUBLIC_URL}/api/frames/poll`
  );

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html" },
  });
}
```

## 🔗 Related Skills

- **nextjs-app-router** - Build Frame endpoints with Next.js
- **react-hook-form-zod** - Validate Frame POST data
- **tailwind-ui-designer** - Design Frame images
- **supabase-backend** - Store Frame state and analytics

## 📖 Further Reading

- [Neynar API Documentation](https://docs.neynar.com/)
- [Farcaster Frames Specification](https://docs.farcaster.xyz/learn/what-is-farcaster/frames)
- [Farcaster Protocol Overview](https://docs.farcaster.xyz/)
- [Warpcast API Guide](https://warpcast.notion.site/Warpcast-API-Guide)
- [Building Your First Frame](https://docs.farcaster.xyz/developers/guides/frames/getting-started)

---

*This skill is part of OPUS 67 v5.1 - "The Precision Update"*
*Fully expanded with production-ready patterns and examples*
