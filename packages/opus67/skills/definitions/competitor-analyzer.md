# Competitor Analyzer

> **ID:** `competitor-analyzer`
> **Tier:** 2
> **Token Cost:** 7000
> **MCP Connections:** tavily, exa, firecrawl

## 🎯 What This Skill Does

Conducts comprehensive competitive intelligence analysis to understand market positioning, feature differentiation, pricing strategies, and technology choices. This skill helps you understand your competitive landscape through systematic research, data collection, and strategic analysis.

**Core Functions:**
- Competitor feature analysis and gap identification
- Pricing comparison and value proposition analysis
- Tech stack detection and architecture understanding
- Market positioning and strategic differentiation
- Competitive moat assessment
- Go-to-market strategy analysis

## 📚 When to Use

This skill is automatically loaded when:

- **Keywords:** competitor, comparison, vs, alternative, compete, competitive analysis, market position, feature comparison
- **File Types:** N/A
- **Directories:** N/A

**Use this skill when you need to:**
- Launch a new product and need to understand the competitive landscape
- Evaluate acquisition or partnership targets
- Identify feature gaps in your product roadmap
- Benchmark pricing strategies against competitors
- Understand technical architecture decisions made by successful competitors
- Prepare investor presentations with competitive analysis
- Create battle cards for sales teams
- Detect emerging competitors early

## 🚀 Core Capabilities

### 1. Competitor Feature Analysis

**Objective:** Systematically catalog and compare product features across competitors to identify gaps, opportunities, and differentiation points.

#### Research Methodology

**Step 1: Competitor Identification**
```typescript
interface CompetitorIdentification {
  // Primary competitors (direct feature overlap)
  primary: {
    name: string;
    url: string;
    category: "direct" | "indirect";
    marketShare?: number;
    fundingRaised?: number;
  }[];

  // Secondary competitors (partial overlap)
  secondary: {
    name: string;
    url: string;
    overlap: string[]; // Which features overlap
  }[];

  // Emerging competitors (watch list)
  emerging: {
    name: string;
    growthRate: string;
    differentiator: string;
  }[];
}

// Discovery process
async function identifyCompetitors(productCategory: string) {
  // Use Tavily for comprehensive market search
  const searches = [
    `${productCategory} alternatives`,
    `best ${productCategory} tools 2024`,
    `${productCategory} comparison`,
    `top ${productCategory} software`,
    `${productCategory} vs competitors`
  ];

  // Use Exa for finding comparison pages and review sites
  const comparisonPages = await exa.search({
    query: `site:g2.com OR site:capterra.com OR site:alternativeto.net ${productCategory}`,
    type: "neural",
    numResults: 20
  });

  return aggregateCompetitors(searches, comparisonPages);
}
```

**Step 2: Feature Matrix Construction**
```typescript
interface FeatureMatrix {
  categories: {
    name: string; // e.g., "Core Features", "Integrations", "Security"
    features: {
      name: string;
      description: string;
      competitors: Record<string, FeatureSupport>;
    }[];
  }[];
}

interface FeatureSupport {
  status: "full" | "partial" | "planned" | "none";
  notes: string;
  sourceUrl: string;
  lastVerified: Date;
}

// Feature extraction from multiple sources
async function extractFeatures(competitorUrl: string) {
  // 1. Use Firecrawl to scrape pricing/features page
  const pricingPage = await firecrawl.scrape({
    url: `${competitorUrl}/pricing`,
    formats: ["markdown", "html"]
  });

  const featuresPage = await firecrawl.scrape({
    url: `${competitorUrl}/features`,
    formats: ["markdown", "html"]
  });

  // 2. Use Tavily to find third-party reviews
  const reviews = await tavily.search({
    query: `${competitorName} features review`,
    searchDepth: "advanced",
    includeImages: false,
    maxResults: 10
  });

  // 3. Parse and categorize features
  return {
    official: parseOfficialFeatures(pricingPage, featuresPage),
    verified: extractVerifiedFeatures(reviews),
    community: extractCommunityFeedback(reviews)
  };
}
```

**Step 3: Gap Analysis**
```typescript
interface GapAnalysis {
  missingFeatures: {
    feature: string;
    competitorsWithFeature: string[];
    userDemand: "high" | "medium" | "low";
    implementationComplexity: "easy" | "medium" | "hard";
    strategicValue: number; // 1-10
  }[];

  uniqueFeatures: {
    feature: string;
    competitiveAdvantage: string;
    defensibility: "high" | "medium" | "low";
  }[];

  betterImplementations: {
    feature: string;
    ourApproach: string;
    theirApproach: string;
    improvement: string;
  }[];
}

function analyzeGaps(ourFeatures: string[], competitorMatrix: FeatureMatrix): GapAnalysis {
  const gaps: GapAnalysis = {
    missingFeatures: [],
    uniqueFeatures: [],
    betterImplementations: []
  };

  // Identify table stakes features we're missing
  competitorMatrix.categories.forEach(category => {
    category.features.forEach(feature => {
      const competitorSupport = Object.values(feature.competitors)
        .filter(c => c.status === "full" || c.status === "partial");

      // If 70%+ of competitors have it and we don't, it's a gap
      const adoptionRate = competitorSupport.length / Object.keys(feature.competitors).length;
      if (adoptionRate >= 0.7 && !ourFeatures.includes(feature.name)) {
        gaps.missingFeatures.push({
          feature: feature.name,
          competitorsWithFeature: Object.keys(feature.competitors)
            .filter(c => feature.competitors[c].status === "full"),
          userDemand: determineUserDemand(feature.name),
          implementationComplexity: estimateComplexity(feature.name),
          strategicValue: calculateStrategicValue(feature, adoptionRate)
        });
      }
    });
  });

  return gaps;
}
```

**Best Practices:**

1. **Multi-Source Verification**
   - Never rely on a single source for feature information
   - Cross-reference official documentation, user reviews, and demo videos
   - Check Reddit, Twitter, and community forums for unfiltered feedback

2. **Temporal Tracking**
   - Feature sets change rapidly; timestamp all data
   - Set up alerts for competitor product launches
   - Re-verify quarterly for strategic competitors

3. **User Perspective**
   - Features on paper ≠ features that work well
   - Look for complaints about "has feature X but it's unusable"
   - Check user reviews for "promised but not delivered" features

4. **Depth Over Breadth**
   - For direct competitors: deep dive (100+ features)
   - For indirect competitors: focus on overlapping areas (20-30 features)
   - For emerging competitors: track differentiators only

**Common Patterns:**

```typescript
// Pattern 1: Automated Feature Monitoring
class CompetitorFeatureMonitor {
  async monitorChanges(competitor: string, checkFrequency: "weekly" | "monthly") {
    const baseline = await this.createFeatureSnapshot(competitor);

    setInterval(async () => {
      const current = await this.createFeatureSnapshot(competitor);
      const diff = this.diffFeatures(baseline, current);

      if (diff.additions.length > 0 || diff.removals.length > 0) {
        await this.notifyStakeholders({
          competitor,
          changes: diff,
          analysisUrl: await this.generateAnalysisReport(diff)
        });
      }
    }, checkFrequency === "weekly" ? 7 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000);
  }
}

// Pattern 2: Feature Scoring
interface FeatureScore {
  name: string;
  strategicImportance: number; // 1-10
  userDemand: number; // 1-10
  implementationCost: number; // 1-10 (inverse)
  competitiveAdvantage: number; // 1-10
  totalScore: number;
}

function scoreFeature(feature: string, context: AnalysisContext): FeatureScore {
  const importance = assessStrategicImportance(feature, context.businessGoals);
  const demand = estimateUserDemand(feature, context.userResearch);
  const cost = estimateImplementationCost(feature, context.techStack);
  const advantage = calculateCompetitiveAdvantage(feature, context.competitors);

  return {
    name: feature,
    strategicImportance: importance,
    userDemand: demand,
    implementationCost: 11 - cost, // Invert so higher is better
    competitiveAdvantage: advantage,
    totalScore: (importance * 0.3) + (demand * 0.3) + ((11 - cost) * 0.2) + (advantage * 0.2)
  };
}
```

**Gotchas:**

- **Marketing vs Reality:** Feature lists on marketing sites often include "coming soon" or poorly implemented features. Always verify with free trials or user reviews.
- **Vaporware:** Some competitors announce features months before they ship. Track announcement-to-delivery times.
- **Enterprise vs SMB:** Features available only to enterprise customers may not be visible in public documentation.
- **Regional Differences:** Some features are only available in certain markets (e.g., payment methods, compliance features).
- **API-Only Features:** Developer-facing features may not appear in main product documentation.

---

### 2. Pricing Comparison & Strategy Analysis

**Objective:** Understand competitor pricing models, extract maximum value metrics, and identify pricing opportunities.

#### Pricing Research Framework

**Step 1: Pricing Model Classification**
```typescript
interface PricingStrategy {
  competitor: string;
  model: "freemium" | "free-trial" | "usage-based" | "tiered" | "flat-rate" | "custom" | "hybrid";
  tiers: PricingTier[];
  discounts: {
    annual: number; // percentage
    volume: { threshold: number; discount: number }[];
    custom: string[];
  };
  packaging: {
    goodBetterBest: boolean;
    featureGating: string[]; // Which features are paywalled
    valueMetric: string; // What you pay for (users, API calls, storage, etc.)
  };
}

interface PricingTier {
  name: string;
  price: {
    amount: number;
    currency: string;
    interval: "month" | "year" | "usage";
  };
  limits: Record<string, number>; // e.g., { users: 10, storage: 100GB }
  features: string[];
  targetCustomer: string; // Who is this tier for?
}

// Comprehensive pricing extraction
async function extractPricing(competitor: string): Promise<PricingStrategy> {
  // 1. Official pricing page
  const pricingPage = await firecrawl.scrape({
    url: `${competitor}/pricing`,
    formats: ["markdown"]
  });

  // 2. Check for hidden pricing (enterprise)
  const contactSalesPage = await firecrawl.scrape({
    url: `${competitor}/contact-sales`,
    formats: ["markdown"]
  });

  // 3. Third-party pricing databases
  const saasPricingData = await exa.search({
    query: `${competitorName} pricing tiers cost`,
    type: "neural",
    category: "company"
  });

  // 4. User-reported pricing (Reddit, forums)
  const userPricing = await tavily.search({
    query: `site:reddit.com "${competitorName}" "how much" OR "pricing"`,
    searchDepth: "advanced"
  });

  return parsePricingStrategy({
    official: pricingPage,
    enterprise: contactSalesPage,
    thirdParty: saasPricingData,
    userReported: userPricing
  });
}
```

**Step 2: Value Metric Analysis**
```typescript
interface ValueMetricAnalysis {
  competitor: string;
  primaryMetric: string; // What drives the price (users, API calls, storage)
  metricJustification: string; // Why this metric makes sense
  metricAlignment: "strong" | "medium" | "weak"; // How well it aligns with value delivered

  // Pricing efficiency
  costPerValue: {
    metric: string;
    costPer: number;
    comparedToAverage: number; // Percentage above/below market
  }[];

  // Price anchoring
  anchorStrategy: {
    type: "decoy" | "premium" | "economy";
    executedBy: string; // Which tier serves as anchor
  };
}

// Compare value metrics across competitors
function analyzeValueMetrics(competitors: PricingStrategy[]): ValueMetricAnalysis[] {
  return competitors.map(comp => {
    const primaryMetric = identifyPrimaryMetric(comp);
    const efficiency = calculatePriceEfficiency(comp, primaryMetric);
    const anchor = identifyAnchorStrategy(comp.tiers);

    return {
      competitor: comp.competitor,
      primaryMetric,
      metricJustification: explainMetricChoice(primaryMetric, comp.model),
      metricAlignment: assessMetricAlignment(primaryMetric, comp.packaging),
      costPerValue: efficiency,
      anchorStrategy: anchor
    };
  });
}

// Pattern: Price sensitivity analysis
interface PriceSensitivityMap {
  segment: string; // "startup", "smb", "enterprise"
  willingness_to_pay: {
    median: number;
    range: [number, number];
  };
  price_resistance_points: number[]; // Prices where adoption drops
  competitor_positions: {
    name: string;
    price: number;
    marketShare: number;
  }[];
}
```

**Step 3: Competitive Pricing Positioning**
```typescript
interface PricingPositioning {
  ourPosition: "premium" | "mid-market" | "value" | "freemium-leader";
  rationale: string;

  priceGaps: {
    segment: string;
    gapSize: number; // Difference between price points
    opportunity: string;
  }[];

  recommendations: {
    action: string;
    impact: "high" | "medium" | "low";
    reasoning: string;
    risks: string[];
  }[];
}

function determinePricingPosition(
  ourPricing: PricingStrategy,
  competitors: PricingStrategy[]
): PricingPositioning {
  // Calculate price percentiles
  const allPrices = competitors.flatMap(c => c.tiers.map(t => t.price.amount));
  const sortedPrices = allPrices.sort((a, b) => a - b);

  const ourMainPrice = ourPricing.tiers.find(t => t.name === "Professional")?.price.amount || 0;
  const percentile = calculatePercentile(ourMainPrice, sortedPrices);

  let position: "premium" | "mid-market" | "value" | "freemium-leader";
  if (percentile >= 75) position = "premium";
  else if (percentile >= 40) position = "mid-market";
  else if (percentile >= 15) position = "value";
  else position = "freemium-leader";

  // Identify gaps in pricing ladder
  const gaps = identifyPriceGaps(sortedPrices, 20); // 20% threshold for "gap"

  return {
    ourPosition: position,
    rationale: explainPositioning(position, ourPricing, competitors),
    priceGaps: gaps,
    recommendations: generatePricingRecommendations(position, gaps, competitors)
  };
}
```

**Best Practices:**

1. **Normalize for Comparison**
   - Convert all prices to same currency (USD)
   - Normalize to monthly (if some are annual)
   - Account for feature differences when comparing tiers

2. **Hidden Costs**
   - Implementation/onboarding fees
   - Per-seat vs per-account pricing
   - Overage charges (what happens when you exceed limits?)
   - Add-ons and optional features

3. **Discount Analysis**
   - Annual commit discounts (usually 15-20%)
   - Volume discounts (usually kick in at 10+ seats)
   - First-time buyer promotions
   - Partner/ecosystem discounts

4. **Enterprise Pricing**
   - Use LinkedIn to find enterprise customers
   - Ask sales teams about typical deal sizes
   - Check Glassdoor for sales compensation plans (reveals ASP)

**Common Patterns:**

```typescript
// Pattern 1: Pricing Simulation
class PricingSimulator {
  async simulateRevenueImpact(
    currentPricing: PricingStrategy,
    proposedPricing: PricingStrategy,
    customerDistribution: Record<string, number> // tier -> customer count
  ) {
    const currentRevenue = this.calculateRevenue(currentPricing, customerDistribution);
    const proposedRevenue = this.calculateRevenue(proposedPricing, customerDistribution);

    // Model churn impact
    const churnImpact = await this.predictChurnFromPriceChange(
      currentPricing,
      proposedPricing,
      customerDistribution
    );

    // Model conversion rate changes
    const conversionImpact = await this.predictConversionChange(
      currentPricing,
      proposedPricing
    );

    return {
      revenueChange: proposedRevenue - currentRevenue,
      churnRisk: churnImpact,
      conversionOpportunity: conversionImpact,
      netImpact: proposedRevenue - currentRevenue - churnImpact + conversionImpact
    };
  }
}

// Pattern 2: Pricing Experiment Design
interface PricingExperiment {
  hypothesis: string;
  variants: PricingStrategy[];
  successMetrics: {
    primary: "revenue" | "conversion" | "ltv" | "market_share";
    secondary: string[];
  };
  duration: number; // days
  sampleSize: number;
  segments: string[]; // Which customer segments to test on
}
```

**Gotchas:**

- **Listed Price ≠ Actual Price:** Enterprise customers often negotiate 20-40% off list prices.
- **Payment Terms:** Net-30, Net-60 terms affect cash flow but not nominal price.
- **Commitment Penalties:** Early termination fees can make switching costs high.
- **Price Localization:** Prices vary by region (purchasing power parity adjustments).
- **Hidden Tiers:** Some companies have unlisted "mid-market" tiers between SMB and Enterprise.

---

### 3. Tech Stack Detection & Architecture Analysis

**Objective:** Understand the technical foundation competitors are built on to inform your own architectural decisions and identify technical competitive advantages.

#### Technology Intelligence Gathering

**Step 1: Technology Fingerprinting**
```typescript
interface TechStack {
  competitor: string;
  frontend: {
    framework: string[]; // React, Vue, Angular, etc.
    libraries: string[];
    cdn: string[];
    analytics: string[];
  };
  backend: {
    language: string[]; // Inferred from job postings, errors, headers
    framework: string[];
    infrastructure: {
      hosting: string; // AWS, GCP, Azure, Cloudflare
      cdn: string;
      database: string[]; // Inferred from job postings
    };
  };
  infrastructure: {
    monitoring: string[]; // Sentry, Datadog, etc.
    ci_cd: string[];
    security: string[];
  };
  confidence: Record<string, "confirmed" | "likely" | "speculative">;
}

// Multi-method tech detection
async function detectTechStack(competitorUrl: string): Promise<TechStack> {
  const stack: Partial<TechStack> = {
    competitor: competitorUrl,
    frontend: { framework: [], libraries: [], cdn: [], analytics: [] },
    backend: { language: [], framework: [], infrastructure: {} },
    infrastructure: { monitoring: [], ci_cd: [], security: [] },
    confidence: {}
  };

  // Method 1: Passive reconnaissance
  const htmlContent = await firecrawl.scrape({ url: competitorUrl });
  stack.frontend = detectFrontendTech(htmlContent);

  // Method 2: HTTP headers analysis
  const headers = await analyzeHttpHeaders(competitorUrl);
  Object.assign(stack.backend.infrastructure, parseInfrastructureHeaders(headers));

  // Method 3: JavaScript file analysis
  const jsFiles = await extractJavaScriptFiles(htmlContent);
  const bundleAnalysis = analyzeBundles(jsFiles);
  stack.frontend.libraries.push(...bundleAnalysis.dependencies);

  // Method 4: Job postings (reveals tech stack)
  const jobPostings = await tavily.search({
    query: `site:lever.co OR site:greenhouse.io "${competitorName}" engineer`,
    maxResults: 20
  });
  const techFromJobs = extractTechFromJobPostings(jobPostings);

  // Method 5: GitHub organization (if public)
  const githubOrg = await findGitHubOrganization(competitorName);
  if (githubOrg) {
    const repos = await analyzePublicRepos(githubOrg);
    stack.backend.language.push(...repos.languages);
  }

  // Method 6: Error messages and stack traces (Wayback Machine)
  const historicalErrors = await searchHistoricalErrors(competitorUrl);
  const errorTech = extractTechFromErrors(historicalErrors);

  return mergeWithConfidence(stack, techFromJobs, errorTech);
}

// Frontend technology detection
function detectFrontendTech(html: string): TechStack['frontend'] {
  const tech = {
    framework: [] as string[],
    libraries: [] as string[],
    cdn: [] as string[],
    analytics: [] as string[]
  };

  // React detection
  if (html.includes('__NEXT_DATA__')) tech.framework.push('Next.js');
  else if (html.includes('react-dom')) tech.framework.push('React');

  // Vue detection
  if (html.includes('__NUXT__')) tech.framework.push('Nuxt.js');
  else if (html.includes('v-cloak') || html.includes('[v-')) tech.framework.push('Vue.js');

  // Angular detection
  if (html.includes('ng-version')) tech.framework.push('Angular');

  // CDN detection
  if (html.includes('cloudflare')) tech.cdn.push('Cloudflare');
  if (html.includes('fastly')) tech.cdn.push('Fastly');
  if (html.includes('cloudfront')) tech.cdn.push('CloudFront');

  // Analytics detection
  if (html.includes('gtag') || html.includes('analytics.js')) tech.analytics.push('Google Analytics');
  if (html.includes('segment.com')) tech.analytics.push('Segment');
  if (html.includes('mixpanel')) tech.analytics.push('Mixpanel');

  return tech;
}
```

**Step 2: Performance & Scalability Analysis**
```typescript
interface PerformanceProfile {
  competitor: string;
  metrics: {
    ttfb: number; // Time to First Byte (ms)
    fcp: number; // First Contentful Paint (ms)
    lcp: number; // Largest Contentful Paint (ms)
    tti: number; // Time to Interactive (ms)
    cls: number; // Cumulative Layout Shift
  };
  bundleSize: {
    javascript: number; // KB
    css: number;
    images: number;
    total: number;
  };
  requests: {
    count: number;
    breakdown: Record<string, number>; // by type
  };
  scalabilityIndicators: {
    cdnUsage: boolean;
    imageOptimization: boolean;
    codeMinification: boolean;
    lazyLoading: boolean;
    serviceWorker: boolean;
  };
}

// Automated performance analysis
async function analyzePerformance(competitorUrl: string): Promise<PerformanceProfile> {
  // Use WebPageTest API or Lighthouse CI
  const lighthouseReport = await runLighthouse(competitorUrl);

  return {
    competitor: competitorUrl,
    metrics: extractCoreWebVitals(lighthouseReport),
    bundleSize: calculateBundleSizes(lighthouseReport),
    requests: analyzeNetworkRequests(lighthouseReport),
    scalabilityIndicators: detectScalabilityPatterns(lighthouseReport)
  };
}
```

**Step 3: Architecture Inference**
```typescript
interface ArchitectureProfile {
  competitor: string;
  architecture: {
    pattern: "monolith" | "microservices" | "serverless" | "hybrid";
    confidence: number;
    indicators: string[];
  };
  apiDesign: {
    style: "REST" | "GraphQL" | "gRPC" | "mixed";
    versioning: boolean;
    rateLimit: { detected: boolean; limits?: string };
  };
  deployment: {
    strategy: "blue-green" | "rolling" | "canary" | "unknown";
    frequency: "continuous" | "daily" | "weekly" | "unknown";
    regions: string[]; // Where are they deployed
  };
  dataStrategy: {
    caching: string[]; // Redis, Memcached, etc.
    database: string[]; // Postgres, MongoDB, etc.
    cdn: string;
  };
}

function inferArchitecture(techStack: TechStack, performance: PerformanceProfile): ArchitectureProfile {
  const indicators = [];
  let pattern: "monolith" | "microservices" | "serverless" | "hybrid" = "monolith";

  // Serverless indicators
  if (techStack.backend.infrastructure.hosting?.includes('Lambda') ||
      techStack.backend.infrastructure.hosting?.includes('Cloud Functions')) {
    pattern = "serverless";
    indicators.push("Serverless compute detected");
  }

  // Microservices indicators
  if (performance.requests.count > 50 &&
      performance.requests.breakdown['api'] > 20) {
    pattern = "microservices";
    indicators.push("High API request count suggests service decomposition");
  }

  // API style detection
  let apiStyle: "REST" | "GraphQL" | "gRPC" | "mixed" = "REST";
  if (techStack.frontend.libraries.includes('apollo-client') ||
      techStack.frontend.libraries.includes('relay')) {
    apiStyle = "GraphQL";
  }

  return {
    competitor: techStack.competitor,
    architecture: {
      pattern,
      confidence: calculateConfidence(indicators),
      indicators
    },
    apiDesign: {
      style: apiStyle,
      versioning: detectAPIVersioning(techStack),
      rateLimit: detectRateLimiting(techStack)
    },
    deployment: inferDeploymentStrategy(techStack),
    dataStrategy: inferDataStrategy(techStack)
  };
}
```

**Best Practices:**

1. **Ethical Boundaries**
   - Only use publicly available information
   - Don't attempt to access internal systems
   - Don't exploit security vulnerabilities even if found
   - Respect robots.txt and rate limits

2. **Multi-Source Validation**
   - Cross-reference findings from multiple sources
   - Job postings are highly reliable for tech stack
   - Conference talks and blog posts reveal architectural decisions
   - Open source contributions show technology preferences

3. **Temporal Tracking**
   - Technology choices evolve; track migration patterns
   - Note when major framework upgrades occur
   - Monitor for technology pivots (e.g., monolith → microservices)

**Common Patterns:**

```typescript
// Pattern: Technology Decision Rationale
interface TechDecisionAnalysis {
  technology: string;
  adoptionRate: number; // % of competitors using it
  reasons: {
    performance: string;
    scalability: string;
    developerExperience: string;
    ecosystem: string;
    cost: string;
  };
  tradeoffs: {
    pros: string[];
    cons: string[];
  };
  recommendation: "adopt" | "evaluate" | "avoid";
}

// Pattern: Technical Competitive Advantage
interface TechnicalMoat {
  competitor: string;
  advantages: {
    type: "performance" | "scalability" | "reliability" | "security";
    description: string;
    reproducibility: "easy" | "medium" | "hard";
    timeToMatch: string; // "weeks", "months", "years"
  }[];
}
```

**Gotchas:**

- **Reverse Proxies:** CDNs and proxies hide the real infrastructure behind them.
- **Technology Marketing:** Companies may use different tech in marketing vs. reality.
- **Legacy Systems:** Older parts of the product may use different tech than new features.
- **Acquisitions:** Acquired products often run on different stacks until replatformed.
- **Open Source ≠ Usage:** Just because a company contributes to a project doesn't mean they use it.

---

### 4. Market Positioning & Strategic Differentiation

**Objective:** Understand how competitors position themselves in the market and identify opportunities for differentiation.

#### Positioning Analysis Framework

**Step 1: Brand & Messaging Analysis**
```typescript
interface BrandPositioning {
  competitor: string;
  positioning: {
    tagline: string;
    valueProposition: string;
    targetCustomer: string[];
    problemSolved: string;
  };
  messaging: {
    homepage: {
      headline: string;
      subheadline: string;
      cta: string;
      heroImage: string; // What they show visually
    };
    keyMessages: string[]; // 3-5 core messages repeated
    toneOfVoice: "professional" | "friendly" | "technical" | "aspirational" | "playful";
    differentiation: string[]; // What makes them "different"
  };
  visualIdentity: {
    colorScheme: string[];
    design: "minimal" | "colorful" | "corporate" | "modern" | "classic";
    imagery: string; // Type of images used
  };
}

async function analyzeBrandPositioning(competitorUrl: string): Promise<BrandPositioning> {
  // Scrape homepage
  const homepage = await firecrawl.scrape({
    url: competitorUrl,
    formats: ["markdown", "html"]
  });

  // Scrape about page
  const aboutPage = await firecrawl.scrape({
    url: `${competitorUrl}/about`,
    formats: ["markdown"]
  });

  // Analyze messaging patterns
  const keyMessages = extractRepeatedPhrases(homepage, aboutPage);
  const toneAnalysis = analyzeToneOfVoice(homepage);

  return {
    competitor: competitorUrl,
    positioning: {
      tagline: extractTagline(homepage),
      valueProposition: extractValueProp(homepage),
      targetCustomer: identifyTargetCustomers(homepage, aboutPage),
      problemSolved: extractProblemStatement(homepage)
    },
    messaging: {
      homepage: parseHomepageHero(homepage),
      keyMessages,
      toneOfVoice: toneAnalysis.tone,
      differentiation: extractDifferentiators(homepage)
    },
    visualIdentity: analyzeVisualIdentity(homepage)
  };
}
```

**Step 2: Perceptual Mapping**
```typescript
interface PerceptualMap {
  dimensions: {
    x: { axis: string; min: string; max: string }; // e.g., "Simple" → "Powerful"
    y: { axis: string; min: string; max: string }; // e.g., "Cheap" → "Premium"
  };
  competitors: {
    name: string;
    position: { x: number; y: number }; // -1 to 1 scale
    marketShare: number;
    rationale: string;
  }[];
  opportunities: {
    quadrant: string;
    description: string;
    competition: "low" | "medium" | "high";
  }[];
}

function createPerceptualMap(
  competitors: BrandPositioning[],
  dimensionX: "simplicity" | "power" | "speed" | "flexibility",
  dimensionY: "price" | "features" | "reliability" | "support"
): PerceptualMap {
  const map: PerceptualMap = {
    dimensions: {
      x: defineDimension(dimensionX),
      y: defineDimension(dimensionY)
    },
    competitors: [],
    opportunities: []
  };

  // Score each competitor on both dimensions
  competitors.forEach(comp => {
    const xScore = scoreDimension(comp, dimensionX);
    const yScore = scoreDimension(comp, dimensionY);

    map.competitors.push({
      name: comp.competitor,
      position: { x: xScore, y: yScore },
      marketShare: estimateMarketShare(comp.competitor),
      rationale: explainPositioning(comp, xScore, yScore)
    });
  });

  // Identify white space
  map.opportunities = identifyWhiteSpace(map.competitors);

  return map;
}
```

**Step 3: Go-to-Market Strategy Analysis**
```typescript
interface GTMStrategy {
  competitor: string;
  channels: {
    acquisition: {
      channel: string; // "paid search", "content", "partnerships", etc.
      investment: "high" | "medium" | "low";
      effectiveness: string;
    }[];
    conversionFunnels: {
      entry: string;
      steps: string[];
      conversion: string;
    }[];
  };
  salesMotion: {
    model: "self-serve" | "sales-led" | "hybrid";
    avgDealSize: string;
    salesCycleLength: string;
    teamSize: number; // estimated from LinkedIn
  };
  partnerships: {
    type: "technology" | "channel" | "strategic";
    partners: string[];
    value: string;
  }[];
  communityStrategy: {
    hasOpenSource: boolean;
    hasCommunityForum: boolean;
    hasUserGroups: boolean;
    engagement: "high" | "medium" | "low";
  };
}

async function analyzeGTMStrategy(competitor: string): Promise<GTMStrategy> {
  // Analyze traffic sources
  const trafficSources = await analyzeTrafficSources(competitor);

  // Analyze LinkedIn presence
  const salesTeamSize = await estimateSalesTeamSize(competitor);

  // Analyze partnerships
  const partnerships = await findPartnerships(competitor);

  // Analyze community presence
  const community = await analyzeCommunityStrategy(competitor);

  return {
    competitor,
    channels: {
      acquisition: trafficSources,
      conversionFunnels: await mapConversionFunnels(competitor)
    },
    salesMotion: {
      model: determineSalesModel(competitor),
      avgDealSize: estimateAvgDealSize(competitor),
      salesCycleLength: estimateSalesCycle(competitor),
      teamSize: salesTeamSize
    },
    partnerships,
    communityStrategy: community
  };
}
```

**Step 4: Competitive Moat Assessment**
```typescript
interface CompetitiveMoat {
  competitor: string;
  moats: {
    type: "network_effects" | "switching_costs" | "brand" | "ip" | "data" | "scale";
    strength: "strong" | "medium" | "weak";
    description: string;
    durability: string; // How long will this moat last?
  }[];
  vulnerabilities: {
    area: string;
    severity: "critical" | "high" | "medium" | "low";
    exploitation: string; // How to attack this weakness
  }[];
  overallDefensibility: number; // 1-10 score
}

function assessCompetitiveMoat(
  competitor: string,
  positioning: BrandPositioning,
  gtm: GTMStrategy,
  techStack: TechStack
): CompetitiveMoat {
  const moats = [];
  const vulnerabilities = [];

  // Network effects analysis
  if (hasNetworkEffects(positioning, gtm)) {
    moats.push({
      type: "network_effects",
      strength: assessNetworkEffectStrength(gtm),
      description: "Value increases with number of users",
      durability: "Strong - compounds over time"
    });
  }

  // Switching costs analysis
  const switchingCosts = assessSwitchingCosts(positioning, techStack);
  if (switchingCosts.score > 5) {
    moats.push({
      type: "switching_costs",
      strength: switchingCosts.strength,
      description: switchingCosts.description,
      durability: "Medium - can be overcome with migration tools"
    });
  }

  // Brand moat
  const brandStrength = assessBrandStrength(competitor);
  if (brandStrength > 5) {
    moats.push({
      type: "brand",
      strength: brandStrength > 8 ? "strong" : "medium",
      description: "Strong brand recognition and trust",
      durability: "Medium - requires constant reinforcement"
    });
  }

  // Identify vulnerabilities
  vulnerabilities.push(...identifyVulnerabilities(competitor, positioning, gtm, techStack));

  return {
    competitor,
    moats,
    vulnerabilities,
    overallDefensibility: calculateDefensibility(moats, vulnerabilities)
  };
}
```

**Best Practices:**

1. **Customer Voice**
   - Read reviews on G2, Capterra, Trustpilot
   - Monitor social media mentions
   - Join their community forums incognito
   - Talk to their customers (ethically)

2. **Longitudinal Tracking**
   - Save historical snapshots (Wayback Machine)
   - Track messaging evolution quarterly
   - Note pivots and repositioning efforts
   - Document leadership changes and strategy shifts

3. **Category Creation vs. Competition**
   - Some companies create new categories (harder but bigger TAM)
   - Some companies compete in existing categories (easier but crowded)
   - Understand which strategy each competitor is pursuing

**Common Patterns:**

```typescript
// Pattern: Positioning Statement Generator
interface PositioningStatement {
  for: string; // target customer
  who: string; // customer need
  the: string; // product name
  is: string; // product category
  that: string; // key benefit
  unlike: string; // competitor
  our: string; // differentiation
}

// Pattern: Battle Card
interface BattleCard {
  competitor: string;
  whenToUse: string[]; // When sales should use this card
  strengths: { feature: string; response: string }[];
  weaknesses: { feature: string; capitalize: string }[];
  landmines: string[]; // Topics to avoid (they're better)
  trapSetting: string[]; // Questions to ask that expose their weaknesses
  proof_points: { claim: string; proof: string }[];
}
```

**Gotchas:**

- **Positioning vs. Reality:** What companies say ≠ what customers experience
- **Multiple Positions:** Large companies may position differently for different segments
- **Founder-Market Fit:** Sometimes positioning is driven by founder background, not market reality
- **Acquihire Positioning:** Recently acquired companies may not have coherent positioning
- **Pivot Signals:** Changing messaging rapidly indicates uncertainty or pivot

---

## 💡 Real-World Examples

### Example 1: SaaS Competitive Analysis (Slack vs Microsoft Teams)

```typescript
// Complete competitive analysis workflow
async function analyzeSaaSCompetition() {
  const competitors = ["slack.com", "teams.microsoft.com"];

  // Phase 1: Feature Analysis
  const featureMatrix = await Promise.all(
    competitors.map(async (url) => ({
      competitor: url,
      features: await extractFeatures(url)
    }))
  );

  const gapAnalysis = analyzeGaps(
    ourFeatures: ["channels", "threads", "search", "integrations"],
    competitorMatrix: featureMatrix
  );

  console.log("Feature Gaps:", gapAnalysis.missingFeatures);
  // Output: [
  //   {
  //     feature: "Video calling (native)",
  //     competitorsWithFeature: ["teams.microsoft.com"],
  //     userDemand: "high",
  //     implementationComplexity: "hard",
  //     strategicValue: 8
  //   }
  // ]

  // Phase 2: Pricing Analysis
  const pricingStrategies = await Promise.all(
    competitors.map(url => extractPricing(url))
  );

  console.log("Pricing Comparison:");
  pricingStrategies.forEach(p => {
    console.log(`${p.competitor}:`);
    console.log(`  Model: ${p.model}`);
    console.log(`  Tiers: ${p.tiers.length}`);
    console.log(`  Entry Price: $${p.tiers[0].price.amount}/${p.tiers[0].price.interval}`);
  });

  // Phase 3: Tech Stack
  const techStacks = await Promise.all(
    competitors.map(url => detectTechStack(url))
  );

  console.log("Tech Stacks:");
  techStacks.forEach(t => {
    console.log(`${t.competitor}:`);
    console.log(`  Frontend: ${t.frontend.framework.join(", ")}`);
    console.log(`  Hosting: ${t.backend.infrastructure.hosting}`);
  });

  // Phase 4: Positioning
  const positioning = await Promise.all(
    competitors.map(url => analyzeBrandPositioning(url))
  );

  console.log("Positioning:");
  positioning.forEach(p => {
    console.log(`${p.competitor}:`);
    console.log(`  Tagline: ${p.positioning.tagline}`);
    console.log(`  Target: ${p.positioning.targetCustomer.join(", ")}`);
    console.log(`  Differentiation: ${p.messaging.differentiation.join(", ")}`);
  });

  // Generate Report
  const report = generateCompetitiveReport({
    features: gapAnalysis,
    pricing: pricingStrategies,
    tech: techStacks,
    positioning
  });

  await saveReport(report, "competitive-analysis-2024-Q1.md");
}

// Output Report Structure:
/*
# Competitive Analysis Report: Team Communication Tools

## Executive Summary
- Market Leader: Microsoft Teams (70M DAU)
- Challenger: Slack (10M DAU)
- Key Trends: Consolidation around platform plays
- Our Opportunity: Focus on developer workflows

## Feature Gap Analysis
### Critical Gaps (Implement in 0-3 months)
1. Native video calling - 8 of 10 competitors have this
2. Calendar integration - Table stakes for enterprise

### Nice-to-Have (Implement in 6-12 months)
1. Whiteboarding - Only 3 competitors have this
2. AI meeting summaries - Emerging feature

## Pricing Insights
- Market Price Range: $0-$12.50/user/month
- Our Position: Mid-market ($8/user/month)
- Opportunity: Create premium tier at $15-20 for enterprise

## Technology Decisions
- React: 8/10 competitors use React (safe choice)
- AWS: 7/10 competitors on AWS (ecosystem benefits)
- GraphQL: Only 2/10 use GraphQL (differentiation opportunity)

## Strategic Recommendations
1. Double down on developer experience (underserved segment)
2. Build deeper GitHub/GitLab integrations
3. Position as "Slack for developers" not "Teams competitor"
4. Pricing: Stay mid-market, add premium tier for enterprises

## Battle Cards
[Detailed battle cards for sales team...]
*/
```

### Example 2: E-commerce Platform Analysis (Shopify vs WooCommerce)

```typescript
async function analyzeEcommercePlatforms() {
  const platforms = [
    { name: "Shopify", url: "shopify.com" },
    { name: "WooCommerce", url: "woocommerce.com" }
  ];

  // Compare different business models
  const analysis = await Promise.all(platforms.map(async (platform) => ({
    name: platform.name,

    // Pricing model differences
    pricing: await extractPricing(platform.url),
    // Shopify: Monthly subscription ($29-$299) + transaction fees
    // WooCommerce: Free plugin + hosting costs + extension costs

    // Revenue model
    revenueModel: platform.name === "Shopify"
      ? "subscription + payments"
      : "freemium + extensions",

    // Feature completeness
    features: await extractFeatures(platform.url),

    // Ecosystem size
    ecosystem: {
      apps: platform.name === "Shopify" ? 8000 : 55000,
      themes: platform.name === "Shopify" ? 100 : 5000,
      developers: await estimateEcosystemSize(platform.name)
    },

    // Target customer
    targetCustomer: platform.name === "Shopify"
      ? "Small to mid-market merchants seeking simplicity"
      : "Cost-conscious merchants with technical resources"
  })));

  // Strategic insights
  console.log("Key Differentiators:");
  console.log("Shopify: All-in-one, hosted, simple, premium pricing");
  console.log("WooCommerce: DIY, flexible, lower upfront cost, complexity");

  return {
    recommendation: "Position between them: Hosted (like Shopify) but open/flexible (like WooCommerce)",
    pricingStrategy: "Start at $19/mo (undercut Shopify) with generous free tier",
    featureFocus: ["Better developer experience than Shopify", "Easier than WooCommerce"],
    moat: "Build app ecosystem early - network effects are the real moat"
  };
}
```

### Example 3: API Product Comparison (Stripe vs PayPal)

```typescript
async function analyzePaymentAPIs() {
  const providers = ["stripe.com", "paypal.com"];

  const analysis = {
    devExperience: await Promise.all(providers.map(async (url) => ({
      provider: url,

      // Documentation quality
      docsQuality: await analyzeDocumentation(url + "/docs"),
      // Stripe: 9/10 (best-in-class)
      // PayPal: 6/10 (confusing, multiple products)

      // SDK availability
      sdks: await findSDKs(url),
      // Stripe: 12 languages, officially maintained
      // PayPal: 8 languages, varying quality

      // Integration difficulty
      timeToFirstTransaction: url.includes("stripe") ? "15 minutes" : "45 minutes",

      // API design
      apiDesign: await analyzeAPIDesign(url),
      // Stripe: RESTful, consistent, well-documented
      // PayPal: Multiple APIs, legacy baggage
    }))),

    pricing: await Promise.all(providers.map(extractPricing)),
    // Stripe: 2.9% + 30¢ (transparent)
    // PayPal: 2.9% + 30¢ + currency conversion fees (hidden costs)

    trustSignals: {
      stripe: ["Used by Amazon, Google, Microsoft", "Y Combinator alumni"],
      paypal: ["190M users", "25 years in business"]
    }
  };

  return {
    winner: "stripe",
    reasons: [
      "Superior developer experience",
      "Better documentation",
      "More transparent pricing",
      "Consistent API design"
    ],
    paypalAdvantages: [
      "Buyer accounts (network effect)",
      "Brand recognition",
      "International presence"
    ],
    ourStrategy: "Copy Stripe's developer experience, undercut on pricing by 20 basis points"
  };
}
```

## 🔗 Related Skills

- **market-researcher**: Use after competitor analysis to size the market opportunity
- **web-researcher**: General web research for finding competitor information
- **content-writer**: Create competitive battle cards and sales enablement content
- **seo-optimizer**: Analyze competitor SEO strategies
- **github-analyzer**: Analyze competitor open source presence and contributions

## 📖 Further Reading

### Books
- "Competitive Strategy" by Michael Porter
- "Blue Ocean Strategy" by W. Chan Kim & Renée Mauborgne
- "Obviously Awesome" by April Dunford (positioning)

### Articles & Resources
- [How to Do Competitive Analysis](https://www.crazyegg.com/blog/competitive-analysis/)
- [Competitive Intelligence Tools](https://www.g2.com/categories/competitive-intelligence)
- [BuiltWith](https://builtwith.com) - Technology lookup tool
- [SimilarWeb](https://www.similarweb.com) - Traffic analysis
- [Crunchbase](https://www.crunchbase.com) - Funding and company data

### Tools Mentioned
- **Tavily MCP**: Web search for competitive intelligence
- **Exa MCP**: Neural search for finding similar companies
- **Firecrawl MCP**: Scraping competitor websites
- **Wappalyzer**: Technology detection browser extension
- **BuiltWith**: Comprehensive technology lookup

---

*This skill is part of OPUS 67 v5.1 - "The Precision Update"*
