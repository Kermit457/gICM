# Crypto Twitter Analyst

> **ID:** `crypto-twitter-analyst`
> **Tier:** 2
> **Token Cost:** 6000
> **MCP Connections:** tweetscout, santiment

## 🎯 What This Skill Does

- Score CT influencer credibility and track record
- Track trending tokens, narratives, and memes in real-time
- Analyze engagement patterns and detect artificial amplification
- Identify coordinated shill campaigns and bot activity
- Correlate social sentiment with price movements
- Build alpha-generating signal systems from Twitter data

## 📚 When to Use

This skill is automatically loaded when:

- **Keywords:** twitter, ct, influencer, kol, sentiment, trending, engagement, viral, mentions, cashtag
- **File Types:** N/A
- **Directories:** N/A

## 🚀 Core Capabilities

### 1. Score CT Influencer Credibility

Evaluating Key Opinion Leaders (KOLs) based on track record and engagement quality.

**Best Practices:**
- Track historical call accuracy over 30/90/365 days
- Weight recent performance higher (recency bias)
- Distinguish between organic and paid promotions
- Monitor for wallet connections to shilled projects
- Track follower growth patterns (bot detection)

**Common Patterns:**

```typescript
interface InfluencerScore {
  username: string;
  followersCount: number;
  credibilityScore: number; // 0-100
  callAccuracy: {
    win: number;
    loss: number;
    winRate: number;
  };
  engagementMetrics: {
    avgLikes: number;
    avgRetweets: number;
    avgReplies: number;
    engagementRate: number;
  };
  riskFlags: string[];
  walletConnections?: string[];
}

// Calculate influencer credibility score
async function scoreInfluencer(
  username: string,
  lookbackDays: number = 90
): Promise<InfluencerScore> {
  const tweets = await fetchUserTweets(username, lookbackDays);
  const profile = await fetchUserProfile(username);

  // Extract token calls from tweets
  const calls = extractTokenCalls(tweets);

  // Track outcomes
  let wins = 0;
  let losses = 0;

  for (const call of calls) {
    const performance = await calculateCallPerformance(
      call.token,
      call.timestamp,
      call.entryPrice
    );

    if (performance.maxGain >= 0.5) wins++; // 50% gain = win
    else if (performance.maxLoss <= -0.3) losses++; // 30% loss = loss
  }

  const winRate = wins + losses > 0 ? wins / (wins + losses) : 0;

  // Engagement metrics
  const avgLikes = tweets.reduce((sum, t) => sum + t.likes, 0) / tweets.length;
  const avgRetweets = tweets.reduce((sum, t) => sum + t.retweets, 0) / tweets.length;
  const avgReplies = tweets.reduce((sum, t) => sum + t.replies, 0) / tweets.length;
  const engagementRate =
    (avgLikes + avgRetweets + avgReplies) / profile.followersCount;

  // Detect risk flags
  const riskFlags = [];

  // Suspicious follower growth
  const followerGrowth = await analyzeFollowerGrowth(username);
  if (followerGrowth.spikes > 3) riskFlags.push('Suspicious follower growth');

  // Low engagement relative to followers
  if (engagementRate < 0.01) riskFlags.push('Low engagement rate');

  // Many deleted tweets (hiding failed calls)
  const deletedCount = await countDeletedTweets(username);
  if (deletedCount > 50) riskFlags.push('Frequent tweet deletions');

  // Calculate credibility score
  let credibilityScore = 0;

  // Win rate component (0-50 points)
  credibilityScore += winRate * 50;

  // Engagement component (0-30 points)
  credibilityScore += Math.min(engagementRate * 1000, 30);

  // Consistency component (0-20 points)
  const consistency = 1 - Math.abs(0.5 - winRate); // Penalty for extreme win rates (likely selective)
  credibilityScore += consistency * 20;

  // Apply penalties
  credibilityScore -= riskFlags.length * 10;
  credibilityScore = Math.max(0, Math.min(100, credibilityScore));

  return {
    username,
    followersCount: profile.followersCount,
    credibilityScore,
    callAccuracy: {
      win: wins,
      loss: losses,
      winRate,
    },
    engagementMetrics: {
      avgLikes,
      avgRetweets,
      avgReplies,
      engagementRate,
    },
    riskFlags,
  };
}

// Extract token mentions from tweet text
function extractTokenCalls(tweets: Tweet[]): TokenCall[] {
  const calls: TokenCall[] = [];

  for (const tweet of tweets) {
    // Match cashtags: $TOKEN or $TOKEN/SOL
    const cashtags = tweet.text.match(/\$[A-Z]{3,10}(?:\/[A-Z]{3,4})?/g) || [];

    // Look for contract addresses (Solana/Ethereum)
    const addresses =
      tweet.text.match(/[A-HJ-NP-Z1-9]{32,44}/g) || // Solana base58
      tweet.text.match(/0x[a-fA-F0-9]{40}/g) || // Ethereum hex
      [];

    // Look for buy signals
    const isBuySignal =
      /\b(buy|long|bullish|entering|accumulating)\b/i.test(tweet.text);

    if (isBuySignal && (cashtags.length > 0 || addresses.length > 0)) {
      calls.push({
        token: cashtags[0] || addresses[0],
        timestamp: tweet.timestamp,
        entryPrice: null, // Will fetch from price API
        tweetId: tweet.id,
      });
    }
  }

  return calls;
}

// Calculate performance of a token call
async function calculateCallPerformance(
  token: string,
  callTimestamp: number,
  entryPrice: number | null
): Promise<{ maxGain: number; maxLoss: number; currentGain: number }> {
  // Fetch price history from call time to now
  const priceHistory = await fetchPriceHistory(token, callTimestamp, Date.now());

  if (!entryPrice) {
    entryPrice = priceHistory[0]?.price || 0;
  }

  let maxGain = 0;
  let maxLoss = 0;

  for (const { price } of priceHistory) {
    const gain = (price - entryPrice) / entryPrice;
    maxGain = Math.max(maxGain, gain);
    maxLoss = Math.min(maxLoss, gain);
  }

  const currentPrice = priceHistory[priceHistory.length - 1]?.price || entryPrice;
  const currentGain = (currentPrice - entryPrice) / entryPrice;

  return { maxGain, maxLoss, currentGain };
}
```

**Gotchas:**
- Twitter API v2 has strict rate limits (450 req/15min for user timeline)
- Deleted tweets are not accessible via API (use archive services)
- Some influencers post vague calls then retroactively claim wins
- Paid promotions are not always disclosed

### 2. Track Trending Tokens/Narratives

Identifying viral tokens and emerging narratives before they peak.

**Best Practices:**
- Monitor cashtag volume across time windows (1h, 6h, 24h)
- Track velocity (rate of change in mentions)
- Identify influencers driving the trend
- Correlate with on-chain metrics (volume, holder growth)
- Set alerts for rapid acceleration

**Common Patterns:**

```typescript
interface TrendingToken {
  symbol: string;
  address?: string;
  mentionCount: {
    last1h: number;
    last6h: number;
    last24h: number;
  };
  velocity: number; // Mentions per hour, trending up/down
  topInfluencers: Array<{
    username: string;
    followers: number;
    mentionCount: number;
  }>;
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
  };
  priceChange24h: number;
}

// Track trending tokens in real-time
class TrendingTracker {
  private mentionWindow: Map<string, number[]> = new Map();

  trackMention(token: string, timestamp: number) {
    if (!this.mentionWindow.has(token)) {
      this.mentionWindow.set(token, []);
    }

    this.mentionWindow.get(token)!.push(timestamp);

    // Keep only last 24 hours
    const oneDayAgo = Date.now() - 86400000;
    this.mentionWindow.set(
      token,
      this.mentionWindow.get(token)!.filter((t) => t > oneDayAgo)
    );
  }

  getTrending(minMentions: number = 10): TrendingToken[] {
    const now = Date.now();
    const oneHourAgo = now - 3600000;
    const sixHoursAgo = now - 21600000;
    const oneDayAgo = now - 86400000;

    const trending: TrendingToken[] = [];

    for (const [token, timestamps] of this.mentionWindow.entries()) {
      const last1h = timestamps.filter((t) => t > oneHourAgo).length;
      const last6h = timestamps.filter((t) => t > sixHoursAgo).length;
      const last24h = timestamps.length;

      if (last1h < minMentions) continue;

      // Calculate velocity (change in mention rate)
      const velocity = last1h - (last6h - last1h) / 5; // Hourly rate comparison

      trending.push({
        symbol: token,
        mentionCount: { last1h, last6h, last24h },
        velocity,
        topInfluencers: [], // Populated separately
        sentiment: { positive: 0, neutral: 0, negative: 0 },
        priceChange24h: 0,
      });
    }

    return trending.sort((a, b) => b.velocity - a.velocity);
  }
}

// Analyze tweet sentiment
function analyzeSentiment(text: string): 'positive' | 'neutral' | 'negative' {
  const positiveWords = [
    'moon', 'bullish', 'buy', 'gem', 'alpha',
    'pumping', 'massive', 'huge', 'fire', 'lfg'
  ];

  const negativeWords = [
    'dump', 'bearish', 'sell', 'scam', 'rug',
    'avoid', 'exit', 'rekt', 'dead', 'fud'
  ];

  const lowerText = text.toLowerCase();

  let positiveCount = 0;
  let negativeCount = 0;

  for (const word of positiveWords) {
    if (lowerText.includes(word)) positiveCount++;
  }

  for (const word of negativeWords) {
    if (lowerText.includes(word)) negativeCount++;
  }

  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
}

// Identify narrative trends
interface NarrativeTrend {
  theme: string;
  keywords: string[];
  mentionCount: number;
  topTokens: string[];
  momentum: 'rising' | 'stable' | 'falling';
}

const NARRATIVES: Record<string, string[]> = {
  'AI': ['ai', 'artificial intelligence', 'machine learning', 'llm', 'agent'],
  'DePIN': ['depin', 'physical infrastructure', 'decentralized hardware'],
  'Gaming': ['gaming', 'play to earn', 'p2e', 'gamefi', 'nft game'],
  'Memes': ['meme', 'meme coin', 'community token', 'cult'],
  'RWA': ['rwa', 'real world asset', 'tokenized', 'securities'],
};

async function detectNarrativeTrends(
  tweets: Tweet[]
): Promise<NarrativeTrend[]> {
  const trends: NarrativeTrend[] = [];

  for (const [theme, keywords] of Object.entries(NARRATIVES)) {
    let mentionCount = 0;
    const tokens = new Set<string>();

    for (const tweet of tweets) {
      const lowerText = tweet.text.toLowerCase();

      // Check if tweet mentions this narrative
      const matchesNarrative = keywords.some((kw) => lowerText.includes(kw));

      if (matchesNarrative) {
        mentionCount++;

        // Extract tokens mentioned in narrative tweets
        const cashtags = tweet.text.match(/\$[A-Z]{3,10}/g) || [];
        cashtags.forEach((tag) => tokens.add(tag));
      }
    }

    if (mentionCount > 0) {
      trends.push({
        theme,
        keywords,
        mentionCount,
        topTokens: Array.from(tokens).slice(0, 5),
        momentum: 'stable', // Would compare to previous period
      });
    }
  }

  return trends.sort((a, b) => b.mentionCount - a.mentionCount);
}
```

**Gotchas:**
- Volume spikes can be from bot campaigns, not organic interest
- Narrative trends lag actual market movements
- Cashtags can be ambiguous ($SOL = Solana or Solana-related token?)
- Sentiment analysis struggles with sarcasm and slang

### 3. Analyze Engagement Patterns

Understanding how information spreads and identifying artificial amplification.

**Best Practices:**
- Compare engagement to follower count baseline
- Track engagement velocity (how fast it grows)
- Analyze reply/quote ratio (high ratio = controversial)
- Detect coordinated retweet patterns
- Monitor for bot-like behavior (instant engagement, similar usernames)

**Common Patterns:**

```typescript
interface EngagementAnalysis {
  tweetId: string;
  metrics: {
    likes: number;
    retweets: number;
    replies: number;
    quotes: number;
    views?: number;
  };
  velocity: {
    likesPerMinute: number;
    retweetsPerMinute: number;
  };
  patterns: {
    isOrganic: boolean;
    botProbability: number;
    coordinatedActivity: boolean;
  };
  topEngagers: Array<{
    username: string;
    type: 'like' | 'retweet' | 'reply';
    timestamp: number;
  }>;
}

async function analyzeEngagement(tweetId: string): Promise<EngagementAnalysis> {
  const tweet = await fetchTweet(tweetId);
  const engagers = await fetchEngagers(tweetId);

  // Calculate engagement velocity
  const tweetAge = (Date.now() - tweet.timestamp) / 60000; // minutes
  const likesPerMinute = tweet.likes / tweetAge;
  const retweetsPerMinute = tweet.retweets / tweetAge;

  // Detect bot patterns
  const botCount = engagers.filter((e) => {
    // Bot indicators:
    // - Account created recently
    // - Username with random numbers (e.g., user12345678)
    // - Very few followers
    // - Engaged within seconds of tweet
    const isNewAccount = Date.now() - e.accountCreated < 30 * 86400000; // 30 days
    const hasRandomUsername = /\d{4,}/.test(e.username);
    const hasLowFollowers = e.followers < 10;
    const instantEngagement = e.timestamp - tweet.timestamp < 10000; // 10 seconds

    return (
      (isNewAccount && hasRandomUsername) ||
      (hasLowFollowers && instantEngagement)
    );
  }).length;

  const botProbability = engagers.length > 0 ? botCount / engagers.length : 0;

  // Detect coordinated activity (many engagements at exact same time)
  const timestampCounts = new Map<number, number>();
  for (const engager of engagers) {
    const rounded = Math.floor(engager.timestamp / 60000) * 60000; // Round to minute
    timestampCounts.set(rounded, (timestampCounts.get(rounded) || 0) + 1);
  }

  const maxSimultaneous = Math.max(...timestampCounts.values());
  const coordinatedActivity = maxSimultaneous > Math.sqrt(engagers.length);

  // Determine if organic
  const isOrganic = botProbability < 0.2 && !coordinatedActivity;

  return {
    tweetId,
    metrics: {
      likes: tweet.likes,
      retweets: tweet.retweets,
      replies: tweet.replies,
      quotes: tweet.quotes,
      views: tweet.views,
    },
    velocity: {
      likesPerMinute,
      retweetsPerMinute,
    },
    patterns: {
      isOrganic,
      botProbability,
      coordinatedActivity,
    },
    topEngagers: engagers.slice(0, 20),
  };
}

// Detect retweet networks
interface RetweetNetwork {
  core: string[]; // Accounts that always retweet together
  reach: number; // Total followers of network
  activity: number; // Retweets per day
}

async function detectRetweetNetworks(
  tweets: Tweet[]
): Promise<RetweetNetwork[]> {
  // Build co-retweet matrix
  const coRetweets = new Map<string, Map<string, number>>();

  for (const tweet of tweets) {
    const retweeters = await fetchRetweeters(tweet.id);

    for (let i = 0; i < retweeters.length; i++) {
      for (let j = i + 1; j < retweeters.length; j++) {
        const a = retweeters[i];
        const b = retweeters[j];

        if (!coRetweets.has(a)) coRetweets.set(a, new Map());
        if (!coRetweets.has(b)) coRetweets.set(b, new Map());

        coRetweets.get(a)!.set(b, (coRetweets.get(a)!.get(b) || 0) + 1);
        coRetweets.get(b)!.set(a, (coRetweets.get(b)!.get(a) || 0) + 1);
      }
    }
  }

  // Find highly connected clusters
  const networks: RetweetNetwork[] = [];
  const processed = new Set<string>();

  for (const [account, connections] of coRetweets.entries()) {
    if (processed.has(account)) continue;

    // Find accounts that co-retweet >50% of the time
    const core = [account];
    const threshold = tweets.length * 0.5;

    for (const [connected, count] of connections.entries()) {
      if (count > threshold) {
        core.push(connected);
        processed.add(connected);
      }
    }

    if (core.length > 2) {
      const reach = await calculateNetworkReach(core);
      networks.push({
        core,
        reach,
        activity: tweets.length / 7, // per day over last week
      });
    }

    processed.add(account);
  }

  return networks.sort((a, b) => b.reach - a.reach);
}
```

**Gotchas:**
- Twitter's API doesn't provide full engager lists (sample only)
- Bot detection is heuristic and imperfect
- Coordinated activity could be legitimate community engagement
- Engagement velocity varies by time of day and day of week

### 4. Detect Coordinated Campaigns

Identifying paid promotions, pump-and-dump schemes, and shill groups.

**Best Practices:**
- Monitor for simultaneous posts from multiple accounts
- Track disclosure of paid partnerships (#ad, "sponsored")
- Cross-reference with wallet transactions (payment tracking)
- Identify KOL groups that shill together
- Alert on unusual activity patterns

**Common Patterns:**

```typescript
interface CoordinatedCampaign {
  token: string;
  accounts: string[];
  startTime: number;
  endTime: number;
  tweetCount: number;
  suspicionScore: number; // 0-100
  indicators: string[];
}

async function detectCampaigns(
  token: string,
  timeWindow: number = 86400000
): Promise<CoordinatedCampaign[]> {
  const mentions = await fetchTokenMentions(token, timeWindow);

  // Group by time clusters (mentions within 5 minutes of each other)
  const clusters: Tweet[][] = [];
  let currentCluster: Tweet[] = [];

  for (const tweet of mentions.sort((a, b) => a.timestamp - b.timestamp)) {
    if (
      currentCluster.length === 0 ||
      tweet.timestamp - currentCluster[currentCluster.length - 1].timestamp < 300000
    ) {
      currentCluster.push(tweet);
    } else {
      if (currentCluster.length >= 3) {
        clusters.push(currentCluster);
      }
      currentCluster = [tweet];
    }
  }

  // Analyze each cluster
  const campaigns: CoordinatedCampaign[] = [];

  for (const cluster of clusters) {
    const indicators = [];
    let suspicionScore = 0;

    // Indicator 1: Similar phrasing
    const uniquePhrases = new Set(cluster.map((t) => t.text.toLowerCase()));
    if (uniquePhrases.size / cluster.length < 0.5) {
      indicators.push('Copy-paste messaging');
      suspicionScore += 30;
    }

    // Indicator 2: Accounts created around same time
    const accounts = await Promise.all(
      cluster.map((t) => fetchUserProfile(t.author))
    );

    const accountAges = accounts.map((a) => Date.now() - a.createdAt);
    const avgAge = accountAges.reduce((sum, age) => sum + age, 0) / accountAges.length;
    const variance =
      accountAges.reduce((sum, age) => sum + Math.pow(age - avgAge, 2), 0) /
      accountAges.length;

    if (avgAge < 90 * 86400000 && variance < 10 * 86400000) {
      indicators.push('Accounts created around same time');
      suspicionScore += 25;
    }

    // Indicator 3: Low engagement on non-promotion tweets
    for (const account of accounts) {
      const recentTweets = await fetchUserTweets(account.username, 7);
      const nonPromoEngagement = recentTweets
        .filter((t) => !t.text.includes(token))
        .reduce((sum, t) => sum + t.likes + t.retweets, 0);

      if (nonPromoEngagement / recentTweets.length < 5) {
        indicators.push('Low organic engagement');
        suspicionScore += 15;
        break; // Only add once
      }
    }

    // Indicator 4: No disclosure of paid partnership
    const hasDisclosure = cluster.some((t) =>
      /#ad|#sponsored|paid partnership/i.test(t.text)
    );

    if (!hasDisclosure && suspicionScore > 30) {
      indicators.push('No paid partnership disclosure');
      suspicionScore += 30;
    }

    if (suspicionScore >= 50) {
      campaigns.push({
        token,
        accounts: accounts.map((a) => a.username),
        startTime: cluster[0].timestamp,
        endTime: cluster[cluster.length - 1].timestamp,
        tweetCount: cluster.length,
        suspicionScore,
        indicators,
      });
    }
  }

  return campaigns.sort((a, b) => b.suspicionScore - a.suspicionScore);
}

// Cross-reference with on-chain data
async function verifyInfluencerWallet(
  username: string,
  token: string
): Promise<{ hasConnection: boolean; transactions: any[] }> {
  // Try to find wallet address in bio, tweets, or known database
  const walletAddress = await findWalletForUser(username);

  if (!walletAddress) {
    return { hasConnection: false, transactions: [] };
  }

  // Check for token transactions
  const transactions = await getTokenTransactions(walletAddress, token);

  // Look for suspicious patterns:
  // - Received tokens before shilling
  // - Sold tokens after shilling
  const hasConnection = transactions.some((tx) => {
    return tx.type === 'transfer_in' && tx.amount > 1000;
  });

  return { hasConnection, transactions };
}
```

**Gotchas:**
- Paid campaigns are not always coordinated (organic can look suspicious)
- Legitimate communities can trigger false positives
- Wallet connections are often hidden (privacy coins, mixers)
- Disclosure requirements vary by jurisdiction

## 💡 Real-World Examples

### Example 1: Alpha Signal Generator

```typescript
class TwitterAlphaBot {
  private trendingTracker = new TrendingTracker();
  private alertThreshold = 50; // mentions per hour

  async monitor() {
    setInterval(async () => {
      const trending = this.trendingTracker.getTrending(this.alertThreshold);

      for (const token of trending) {
        // Skip if already alerted
        if (this.hasRecentAlert(token.symbol)) continue;

        // Score influencers mentioning it
        const influencers = await this.getInfluencers(token.symbol);
        const credibleInfluencers = influencers.filter(
          (i) => i.credibilityScore > 60
        );

        if (credibleInfluencers.length >= 2) {
          // Multiple credible KOLs = signal
          await this.sendAlert({
            token: token.symbol,
            reason: `${credibleInfluencers.length} credible influencers mentioned`,
            influencers: credibleInfluencers.map((i) => i.username),
            mentionVelocity: token.velocity,
          });
        }

        // Check for campaign signs
        const campaigns = await detectCampaigns(token.symbol);
        if (campaigns.length > 0 && campaigns[0].suspicionScore > 70) {
          await this.sendWarning({
            token: token.symbol,
            reason: 'Potential coordinated shill campaign detected',
            suspicionScore: campaigns[0].suspicionScore,
          });
        }
      }
    }, 60000); // Check every minute
  }

  private async sendAlert(alert: any) {
    console.log('ALPHA ALERT:', alert);
    // Send to Discord, Telegram, etc.
  }

  private async sendWarning(warning: any) {
    console.log('WARNING:', warning);
  }
}
```

### Example 2: Influencer Leaderboard

```typescript
async function buildInfluencerLeaderboard(
  category: 'solana' | 'eth' | 'memes' = 'solana'
): Promise<InfluencerScore[]> {
  // Curated list of CT influencers by category
  const influencers = await getCuratedInfluencers(category);

  const scores = await Promise.all(
    influencers.map((username) => scoreInfluencer(username, 90))
  );

  return scores
    .filter((s) => s.credibilityScore > 40) // Minimum threshold
    .sort((a, b) => b.credibilityScore - a.credibilityScore);
}
```

## 🔗 Related Skills

- **defi-data-analyst** - Correlating social signals with on-chain data
- **solana-anchor-expert** - Understanding what influencers are actually shilling
- **typescript-senior** - Building robust data pipelines for Twitter analysis
- **nextjs-14-expert** - Creating dashboards for Twitter analytics

## 📖 Further Reading

- [Twitter API v2 Documentation](https://developer.twitter.com/en/docs/twitter-api)
- [Santiment Academy - Social Trends](https://academy.santiment.net/)
- [LunarCrush - Social Intelligence](https://lunarcrush.com/)
- [Sentiment Analysis with Transformers](https://huggingface.co/models?pipeline_tag=sentiment-analysis)
- [Bot Detection Research](https://arxiv.org/abs/2106.13241)

---

*This skill is part of OPUS 67 v5.1 - "The Precision Update"*
