# Market Researcher

> **ID:** `market-researcher`
> **Tier:** 2
> **Token Cost:** 8000
> **MCP Connections:** tavily, exa

## 🎯 What This Skill Does

Conducts comprehensive market research to identify opportunities, size markets, understand customer segments, and analyze industry trends. This skill combines qualitative and quantitative research methods to provide actionable insights for strategic decision-making.

**Core Functions:**
- TAM/SAM/SOM market sizing calculations
- Trend analysis and forecasting
- User persona development and research
- Growth opportunity identification
- Competitive landscape mapping
- Market segmentation analysis
- Industry dynamics assessment

## 📚 When to Use

This skill is automatically loaded when:

- **Keywords:** market research, tam, sam, som, market size, opportunity, market analysis, industry trends, buyer persona, customer segment
- **File Types:** N/A
- **Directories:** N/A

**Use this skill when you need to:**
- Validate a business idea before building
- Prepare investor pitch decks with market data
- Identify new market segments or niches
- Forecast revenue potential
- Understand macro trends affecting your industry
- Create buyer personas for marketing
- Evaluate market entry strategies
- Assess product-market fit
- Plan go-to-market strategy

## 🚀 Core Capabilities

### 1. Market Size Estimation (TAM/SAM/SOM)

**Objective:** Calculate Total Addressable Market, Serviceable Available Market, and Serviceable Obtainable Market using top-down, bottom-up, and value-theory approaches.

#### Market Sizing Framework

**Step 1: TAM (Total Addressable Market)**

```typescript
interface TAMCalculation {
  method: "top-down" | "bottom-up" | "value-theory";
  market: string;
  geography: string[];
  calculation: {
    formula: string;
    inputs: Record<string, number>;
    result: number;
    currency: string;
  };
  sources: DataSource[];
  confidence: "high" | "medium" | "low";
  assumptions: string[];
}

// Top-Down Approach (using industry reports)
async function calculateTAMTopDown(industry: string, geography: string[]): Promise<TAMCalculation> {
  // 1. Find industry reports
  const industryReports = await tavily.search({
    query: `${industry} market size ${new Date().getFullYear()} ${geography.join(" ")}`,
    searchDepth: "advanced",
    maxResults: 10
  });

  // 2. Find research reports (Gartner, IDC, Forrester, etc.)
  const researchReports = await exa.search({
    query: `site:gartner.com OR site:idc.com OR site:forrester.com "${industry}" market forecast`,
    type: "neural",
    numResults: 5
  });

  // 3. Extract market size data
  const marketData = extractMarketSizeData(industryReports, researchReports);

  // 4. Aggregate and validate
  const tam = aggregateMarketSize(marketData, geography);

  return {
    method: "top-down",
    market: industry,
    geography,
    calculation: {
      formula: "Sum of all potential customers × Average spend per customer",
      inputs: {
        totalPotentialCustomers: tam.customerCount,
        avgSpendPerCustomer: tam.avgSpend
      },
      result: tam.total,
      currency: "USD"
    },
    sources: marketData.sources,
    confidence: assessDataQuality(marketData),
    assumptions: [
      "Market growth rate assumed constant at historical average",
      "All potential customers have equal propensity to purchase",
      "Currency conversions use current exchange rates"
    ]
  };
}

// Bottom-Up Approach (building from first principles)
async function calculateTAMBottomUp(
  product: string,
  targetCustomer: string
): Promise<TAMCalculation> {
  // 1. Identify target customer count
  const demographics = await researchDemographics(targetCustomer);

  // 2. Estimate addressable percentage
  const addressable = await estimateAddressablePercentage(
    product,
    targetCustomer,
    demographics
  );

  // 3. Estimate willingness to pay
  const pricing = await estimateWillingnessToP ay(product, targetCustomer);

  // 4. Calculate TAM
  const tam = demographics.totalPopulation * addressable.percentage * pricing.avgPrice;

  return {
    method: "bottom-up",
    market: `${product} for ${targetCustomer}`,
    geography: demographics.geographies,
    calculation: {
      formula: "Target Population × Addressable % × Average Price",
      inputs: {
        targetPopulation: demographics.totalPopulation,
        addressablePercentage: addressable.percentage,
        averagePrice: pricing.avgPrice
      },
      result: tam,
      currency: "USD"
    },
    sources: [
      ...demographics.sources,
      ...addressable.sources,
      ...pricing.sources
    ],
    confidence: "medium",
    assumptions: [
      `${(addressable.percentage * 100).toFixed(1)}% of target population is addressable`,
      `Average customer lifetime value: $${pricing.ltv}`,
      "Annual purchase frequency: " + pricing.frequency
    ]
  };
}

// Value Theory Approach (based on value created)
interface ValueTheoryTAM {
  problemCost: number; // How much does the problem cost customers?
  valueCaptured: number; // What % of that value can you capture?
  tam: number;
  reasoning: string;
}

async function calculateTAMValueTheory(
  problem: string,
  solution: string,
  targetMarket: string
): Promise<TAMCalculation> {
  // 1. Quantify the problem
  const problemCost = await quantifyProblemCost(problem, targetMarket);

  // 2. Estimate value capture
  const valueCapture = await estimateValueCapture(solution, problem);

  // 3. Calculate TAM
  const tam = problemCost.total * valueCapture.percentage;

  return {
    method: "value-theory",
    market: targetMarket,
    geography: problemCost.geographies,
    calculation: {
      formula: "Total Problem Cost × Value Capture %",
      inputs: {
        totalProblemCost: problemCost.total,
        valueCapturePercentage: valueCapture.percentage
      },
      result: tam,
      currency: "USD"
    },
    sources: [...problemCost.sources, ...valueCapture.sources],
    confidence: "low", // Most speculative method
    assumptions: [
      `Problem costs ${targetMarket}: $${problemCost.total.toLocaleString()}/year`,
      `Solution captures ${(valueCapture.percentage * 100).toFixed(1)}% of value`,
      "Value capture based on similar solutions in adjacent markets"
    ]
  };
}
```

**Step 2: SAM (Serviceable Available Market)**

```typescript
interface SAMCalculation {
  tam: number;
  sam: number;
  samPercentage: number;
  constraints: {
    geographic: string[];
    regulatory: string[];
    competitive: string[];
    productCapability: string[];
  };
  reasoning: string;
}

function calculateSAM(tam: TAMCalculation, constraints: MarketConstraints): SAMCalculation {
  let sam = tam.calculation.result;
  const appliedConstraints = {
    geographic: [] as string[],
    regulatory: [] as string[],
    competitive: [] as string[],
    productCapability: [] as string[]
  };

  // Apply geographic constraints
  if (constraints.geographicLimitations) {
    const geoReduction = calculateGeographicReduction(
      tam.geography,
      constraints.geographicLimitations
    );
    sam *= (1 - geoReduction);
    appliedConstraints.geographic.push(
      `Limited to ${constraints.geographicLimitations.join(", ")} (${(geoReduction * 100).toFixed(0)}% reduction)`
    );
  }

  // Apply regulatory constraints
  if (constraints.regulatoryBarriers) {
    const regReduction = calculateRegulatoryImpact(constraints.regulatoryBarriers);
    sam *= (1 - regReduction);
    appliedConstraints.regulatory.push(
      `Regulatory barriers in ${constraints.regulatoryBarriers.join(", ")} (${(regReduction * 100).toFixed(0)}% reduction)`
    );
  }

  // Apply competitive constraints (market saturation)
  if (constraints.marketSaturation) {
    const competitiveReduction = constraints.marketSaturation;
    sam *= (1 - competitiveReduction);
    appliedConstraints.competitive.push(
      `Market saturation: ${(competitiveReduction * 100).toFixed(0)}% already served`
    );
  }

  // Apply product capability constraints
  if (constraints.productLimitations) {
    const productReduction = calculateProductLimitations(constraints.productLimitations);
    sam *= (1 - productReduction);
    appliedConstraints.productCapability.push(
      `Product can only serve ${((1 - productReduction) * 100).toFixed(0)}% of TAM use cases`
    );
  }

  return {
    tam: tam.calculation.result,
    sam,
    samPercentage: (sam / tam.calculation.result) * 100,
    constraints: appliedConstraints,
    reasoning: generateSAMReasoning(tam, sam, appliedConstraints)
  };
}

// Example SAM calculation
/*
TAM: $50B (global project management software market)
→ Geographic: Only US/EU (60% of global) = $30B
→ Regulatory: GDPR limits EU SMB (10% reduction) = $27B
→ Competitive: 40% market already well-served = $16.2B
→ Product: Can only serve agile teams (50% of market) = $8.1B
SAM: $8.1B (16% of TAM)
*/
```

**Step 3: SOM (Serviceable Obtainable Market)**

```typescript
interface SOMCalculation {
  sam: number;
  som: number;
  somPercentage: number;
  timeframe: string;
  assumptions: {
    marketShareTarget: number; // 0-1 (e.g., 0.05 = 5%)
    timeToAchieve: number; // years
    growthRate: number; // compound annual
    competitivePosition: "leader" | "challenger" | "follower" | "niche";
  };
  reasoning: string;
  milestones: {
    year: number;
    marketShare: number;
    revenue: number;
  }[];
}

function calculateSOM(
  sam: SAMCalculation,
  gtmStrategy: GTMStrategy,
  competitivePosition: CompetitiveAnalysis
): SOMCalculation {
  // Realistic market share targets based on position
  const marketShareTargets = {
    leader: 0.20, // 20% market share
    challenger: 0.10, // 10% market share
    follower: 0.03, // 3% market share
    niche: 0.01 // 1% market share (but 50%+ of niche)
  };

  const targetShare = marketShareTargets[gtmStrategy.positioning];
  const timeToAchieve = estimateTimeToMarketShare(gtmStrategy, competitivePosition);
  const growthRate = calculateGrowthRate(gtmStrategy, competitivePosition);

  // Calculate year-by-year growth
  const milestones = [];
  let currentShare = 0;
  for (let year = 1; year <= timeToAchieve; year++) {
    currentShare = targetShare * (year / timeToAchieve) ** (1 / growthRate);
    milestones.push({
      year,
      marketShare: currentShare * 100,
      revenue: sam.sam * currentShare
    });
  }

  const som = sam.sam * targetShare;

  return {
    sam: sam.sam,
    som,
    somPercentage: (som / sam.sam) * 100,
    timeframe: `${timeToAchieve} years`,
    assumptions: {
      marketShareTarget: targetShare,
      timeToAchieve,
      growthRate,
      competitivePosition: gtmStrategy.positioning
    },
    reasoning: generateSOMReasoning(sam, targetShare, gtmStrategy, competitivePosition),
    milestones
  };
}

// Complete Market Sizing Report
interface MarketSizingReport {
  tam: TAMCalculation;
  sam: SAMCalculation;
  som: SOMCalculation;
  summary: {
    tam: string;
    sam: string;
    som: string;
    opportunity: string;
    confidence: string;
  };
  visualizations: {
    funnelChart: string; // TAM → SAM → SOM funnel
    revenueProjection: string; // Year-over-year revenue
    marketShareEvolution: string; // Market share growth
  };
}
```

**Best Practices:**

1. **Use Multiple Methods**
   - Calculate TAM using all three methods (top-down, bottom-up, value-theory)
   - If methods diverge significantly, investigate why
   - Present a range rather than a single number

2. **Be Conservative**
   - Investors prefer conservative estimates you exceed vs. aggressive ones you miss
   - Document all assumptions clearly
   - Adjust for realistic market penetration rates

3. **Validate with Reality Checks**
   - Compare to similar markets
   - Check if TAM makes sense relative to GDP
   - Validate against competitor revenues
   - Ask: "If we captured 1%, would that revenue make sense?"

4. **Update Regularly**
   - Markets change; update annually
   - Track actual vs. projected market share
   - Adjust assumptions based on learnings

**Common Patterns:**

```typescript
// Pattern: Market Sizing Template
class MarketSizingAnalysis {
  async generateFullReport(
    product: string,
    targetMarket: string,
    geography: string[]
  ): Promise<MarketSizingReport> {
    // Run all three TAM methods in parallel
    const [topDown, bottomUp, valueTheory] = await Promise.all([
      this.calculateTAMTopDown(targetMarket, geography),
      this.calculateTAMBottomUp(product, targetMarket),
      this.calculateTAMValueTheory(product, targetMarket)
    ]);

    // Use median TAM as base case
    const tamValues = [
      topDown.calculation.result,
      bottomUp.calculation.result,
      valueTheory.calculation.result
    ].sort((a, b) => a - b);
    const medianTAM = tamValues[1];

    // Calculate SAM and SOM
    const sam = this.calculateSAM(medianTAM, await this.identifyConstraints());
    const som = this.calculateSOM(sam, await this.analyzeGTMStrategy());

    return {
      tam: { ...topDown, calculation: { ...topDown.calculation, result: medianTAM } },
      sam,
      som,
      summary: this.generateExecutiveSummary(medianTAM, sam, som),
      visualizations: this.generateVisualizations(medianTAM, sam, som)
    };
  }
}

// Pattern: Comparable Market Analysis
interface ComparableMarket {
  market: string;
  tam: number;
  growthRate: number;
  similarity: number; // 0-1
  reasoning: string;
}

async function findComparableMarkets(targetMarket: string): Promise<ComparableMarket[]> {
  // Find similar markets to validate estimates
  const comparables = await tavily.search({
    query: `markets similar to ${targetMarket} market size`,
    searchDepth: "advanced"
  });

  return parseComparableMarkets(comparables);
}
```

**Gotchas:**

- **TAM ≠ Revenue Opportunity:** TAM is theoretical max; no company captures 100% of TAM
- **Market Definition Matters:** "Project management software" vs. "agile project management for developers" yields very different TAMs
- **Don't Confuse Users with Customers:** B2B SaaS: users ≠ buyers
- **Growth Rates:** Don't assume linear growth; markets have S-curves
- **Geographic Differences:** $50B global market ≠ $50B addressable if you only serve US

---

### 2. Trend Analysis & Forecasting

**Objective:** Identify emerging trends, analyze their potential impact, and forecast how they'll shape the market.

#### Trend Research Framework

**Step 1: Trend Identification**

```typescript
interface TrendAnalysis {
  trend: string;
  category: "technology" | "social" | "economic" | "regulatory" | "demographic";
  stage: "nascent" | "emerging" | "growing" | "mature" | "declining";
  momentum: {
    searchVolume: number; // Google Trends
    socialMentions: number; // Twitter, Reddit
    mediaC overage: number; // News articles
    fundingActivity: number; // VC investments
    growthRate: string; // % YoY
  };
  impact: {
    timeframe: "immediate" | "near-term" | "medium-term" | "long-term";
    magnitude: "transformative" | "significant" | "moderate" | "minimal";
    confidence: number; // 0-100
  };
  signals: string[]; // What indicates this trend is real?
  counterSignals: string[]; // What would invalidate this trend?
}

async function identifyTrends(industry: string, timeframe: string): Promise<TrendAnalysis[]> {
  const trends: TrendAnalysis[] = [];

  // 1. Search for trend reports
  const trendReports = await tavily.search({
    query: `${industry} trends ${new Date().getFullYear()} emerging technologies`,
    searchDepth: "advanced",
    maxResults: 20
  });

  // 2. Search for VC investment patterns
  const vcInvestments = await exa.search({
    query: `site:crunchbase.com OR site:pitchbook.com "${industry}" funding trends`,
    type: "neural"
  });

  // 3. Search for conference talks and thought leadership
  const conferences = await tavily.search({
    query: `${industry} conference keynote ${new Date().getFullYear()} future trends`,
    maxResults: 15
  });

  // 4. Social listening for emerging narratives
  const socialTrends = await tavily.search({
    query: `site:reddit.com OR site:twitter.com "${industry}" "next big thing" OR "future of"`,
    maxResults: 30
  });

  // Extract and categorize trends
  const extractedTrends = [
    ...parseTrendReports(trendReports),
    ...analyzeInvestmentPatterns(vcInvestments),
    ...extractConferenceThemes(conferences),
    ...analyzeSocialNarratives(socialTrends)
  ];

  // Deduplicate and score trends
  const dedupedTrends = deduplicateTrends(extractedTrends);

  for (const trend of dedupedTrends) {
    trends.push({
      ...trend,
      momentum: await calculateTrendMomentum(trend.trend),
      impact: await assessTrendImpact(trend, industry),
      signals: await identifySignals(trend),
      counterSignals: await identifyCounterSignals(trend)
    });
  }

  // Sort by impact × momentum
  return trends.sort((a, b) => {
    const scoreA = a.momentum.growthRate * a.impact.confidence;
    const scoreB = b.momentum.growthRate * b.impact.confidence;
    return scoreB - scoreA;
  });
}

// Calculate trend momentum
async function calculateTrendMomentum(trend: string): Promise<TrendAnalysis['momentum']> {
  // Google Trends data (search volume)
  const searchVolume = await getSearchVolume(trend);

  // Social media mentions
  const socialMentions = await getSocialMentions(trend);

  // News coverage
  const mediaCoverage = await getMediaCoverage(trend);

  // VC funding in this space
  const fundingActivity = await getVCFunding(trend);

  // Calculate YoY growth rate
  const growthRate = calculateGrowthRate(searchVolume, socialMentions, mediaCoverage);

  return {
    searchVolume,
    socialMentions,
    mediaCoverage,
    fundingActivity,
    growthRate: `${growthRate.toFixed(1)}%`
  };
}
```

**Step 2: Trend Impact Assessment**

```typescript
interface TrendImpactAssessment {
  trend: string;
  threats: {
    description: string;
    probability: number; // 0-1
    impact: "existential" | "major" | "moderate" | "minor";
    timeframe: string;
    mitigation: string;
  }[];
  opportunities: {
    description: string;
    potential: number; // $ value
    probability: number; // 0-1
    timeframe: string;
    action: string;
  }[];
  strategicImplications: string[];
}

async function assessTrendImpact(
  trend: TrendAnalysis,
  business: BusinessContext
): Promise<TrendImpactAssessment> {
  const assessment: TrendImpactAssessment = {
    trend: trend.trend,
    threats: [],
    opportunities: [],
    strategicImplications: []
  };

  // Identify threats
  const potentialThreats = identifyThreats(trend, business);
  for (const threat of potentialThreats) {
    assessment.threats.push({
      description: threat.description,
      probability: calculateThreatProbability(threat, trend),
      impact: assessThreatMagnitude(threat, business),
      timeframe: estimateThreatTimeframe(threat, trend),
      mitigation: generateMitigationStrategy(threat, business)
    });
  }

  // Identify opportunities
  const potentialOpportunities = identifyOpportunities(trend, business);
  for (const opportunity of potentialOpportunities) {
    assessment.opportunities.push({
      description: opportunity.description,
      potential: estimateOpportunityValue(opportunity, trend, business),
      probability: calculateOpportunityProbability(opportunity, trend),
      timeframe: estimateOpportunityTimeframe(opportunity, trend),
      action: generateActionPlan(opportunity, business)
    });
  }

  // Strategic implications
  assessment.strategicImplications = synthesizeImplications(
    trend,
    assessment.threats,
    assessment.opportunities,
    business
  );

  return assessment;
}

// Trend forecasting
interface TrendForecast {
  trend: string;
  scenarios: {
    name: "best-case" | "base-case" | "worst-case";
    probability: number;
    description: string;
    timeline: {
      year: number;
      prediction: string;
      indicators: string[];
    }[];
  }[];
  checkpoints: {
    date: string;
    milestone: string;
    ifTrue: string;
    ifFalse: string;
  }[];
}

function forecastTrend(trend: TrendAnalysis, yearsAhead: number): TrendForecast {
  const scenarios: TrendForecast['scenarios'] = [
    {
      name: "best-case",
      probability: 0.25,
      description: "Trend accelerates faster than expected",
      timeline: generateOptimisticTimeline(trend, yearsAhead)
    },
    {
      name: "base-case",
      probability: 0.50,
      description: "Trend evolves as currently projected",
      timeline: generateBaseTimeline(trend, yearsAhead)
    },
    {
      name: "worst-case",
      probability: 0.25,
      description: "Trend stalls or reverses",
      timeline: generatePessimisticTimeline(trend, yearsAhead)
    }
  ];

  // Define checkpoints to validate forecast
  const checkpoints = generateCheckpoints(trend, yearsAhead);

  return {
    trend: trend.trend,
    scenarios,
    checkpoints
  };
}
```

**Step 3: Hype Cycle Analysis**

```typescript
interface HypeCycle {
  trend: string;
  currentStage: "innovation-trigger" | "peak-inflated-expectations" | "trough-disillusionment" | "slope-enlightenment" | "plateau-productivity";
  yearsToMature: number;
  reasoning: string;
  indicators: string[];
  recommendation: "invest-now" | "wait-and-see" | "early-adoption" | "late-majority" | "avoid";
}

function analyzeHypeCycle(trend: TrendAnalysis): HypeCycle {
  // Determine hype cycle stage based on signals
  let stage: HypeCycle['currentStage'];
  let yearsToMature: number;
  let recommendation: HypeCycle['recommendation'];

  const momentum = trend.momentum;
  const mediaHype = momentum.mediaCoverage / momentum.socialMentions;

  if (momentum.searchVolume < 100 && momentum.fundingActivity < 10) {
    stage = "innovation-trigger";
    yearsToMature = 5-10;
    recommendation = "wait-and-see";
  } else if (mediaHype > 5 && momentum.growthRate > 100) {
    stage = "peak-inflated-expectations";
    yearsToMature = 3-7;
    recommendation = "wait-and-see";
  } else if (momentum.growthRate < 0) {
    stage = "trough-disillusionment";
    yearsToMature = 2-5;
    recommendation = "early-adoption";
  } else if (momentum.growthRate > 0 && momentum.growthRate < 50) {
    stage = "slope-enlightenment";
    yearsToMature = 1-3;
    recommendation = "invest-now";
  } else {
    stage = "plateau-productivity";
    yearsToMature = 0;
    recommendation = "late-majority";
  }

  return {
    trend: trend.trend,
    currentStage: stage,
    yearsToMature,
    reasoning: explainHypeCycleStage(stage, momentum),
    indicators: listStageIndicators(stage, trend),
    recommendation
  };
}
```

**Best Practices:**

1. **Distinguish Fads from Trends**
   - Fads: Rapid spike, no fundamentals, driven by social media
   - Trends: Gradual growth, real problem solved, multiple drivers

2. **Look for Confluence**
   - Strongest trends have multiple drivers (tech + social + economic)
   - Weak trends are uni-dimensional

3. **Track Leading Indicators**
   - Developer activity (GitHub stars, npm downloads)
   - VC investment (not just amount, but quality of VCs)
   - Conference attendance and talk submissions
   - Job postings mentioning the trend

4. **Use Scenario Planning**
   - Don't predict one future; prepare for multiple
   - Create contingency plans for each scenario

**Common Patterns:**

```typescript
// Pattern: Trend Monitoring Dashboard
class TrendMonitor {
  async createDashboard(industry: string): Promise<TrendDashboard> {
    const trends = await identifyTrends(industry, "next-3-years");

    return {
      topTrends: trends.slice(0, 10),
      emergingThreats: trends.filter(t => t.impact.magnitude === "transformative"),
      opportunities: trends.filter(t => t.impact.confidence > 70),
      watchList: trends.filter(t => t.stage === "nascent" || t.stage === "emerging"),
      updates: {
        frequency: "weekly",
        alertThreshold: "significant-change",
        recipients: ["strategy@company.com"]
      }
    };
  }
}

// Pattern: Trend Report Template
interface TrendReport {
  executiveSummary: string;
  trends: TrendAnalysis[];
  keyTakeaways: string[];
  recommendations: {
    immediate: string[];
    nearTerm: string[];
    longTerm: string[];
  };
  nextReview: string;
}
```

**Gotchas:**

- **Recency Bias:** Recent trends seem more important than they are
- **Confirmation Bias:** You'll find evidence for trends you already believe in
- **Linear Extrapolation:** "If X grew 100% last year, it'll grow 100% next year" (rarely true)
- **Missing Second-Order Effects:** AI might reduce jobs, but create new job categories
- **Survivor Bias:** Successful trends are visible; failed trends disappear from history

---

### 3. User Persona Research & Development

**Objective:** Create detailed, research-backed buyer personas that inform product, marketing, and sales strategies.

#### Persona Development Framework

**Step 1: Data Collection**

```typescript
interface PersonaResearch {
  demographic: {
    age: string;
    gender: string;
    location: string;
    education: string;
    income: string;
  };
  professional: {
    jobTitle: string;
    industry: string;
    companySize: string;
    seniority: "IC" | "manager" | "director" | "vp" | "c-level";
    yearsExperience: number;
  };
  psychographic: {
    goals: string[];
    challenges: string[];
    motivations: string[];
    fears: string[];
    values: string[];
  };
  behavioral: {
    mediaConsumption: string[]; // Where they get info
    buyingProcess: string; // How they make decisions
    toolsUsed: string[]; // Current tech stack
    influencers: string[]; // Who they trust
  };
  quotes: string[]; // Actual quotes from interviews/surveys
  sources: DataSource[];
}

async function researchPersona(targetRole: string, industry: string): Promise<PersonaResearch> {
  // 1. Scrape job descriptions to understand role
  const jobPostings = await tavily.search({
    query: `site:linkedin.com "${targetRole}" "${industry}" job description`,
    maxResults: 50
  });

  const roleDefinition = analyzeJobPostings(jobPostings);

  // 2. Find communities where this persona hangs out
  const communities = await findCommunities(targetRole, industry);

  // 3. Analyze discussions to understand pain points
  const discussions = await scrapeDiscussions(communities);
  const painPoints = extractPainPoints(discussions);

  // 4. Research buying behavior
  const buyingBehavior = await researchBuyingBehavior(targetRole, industry);

  // 5. Find typical tools and workflows
  const techStack = await identifyToolsUsed(targetRole, industry);

  // 6. Compile persona
  return {
    demographic: inferDemographics(targetRole, industry),
    professional: {
      jobTitle: targetRole,
      industry,
      companySize: roleDefinition.typicalCompanySize,
      seniority: roleDefinition.seniority,
      yearsExperience: roleDefinition.avgExperience
    },
    psychographic: {
      goals: painPoints.goals,
      challenges: painPoints.challenges,
      motivations: painPoints.motivations,
      fears: painPoints.fears,
      values: inferValues(discussions)
    },
    behavioral: {
      mediaConsumption: identifyMediaChannels(discussions),
      buyingProcess: buyingBehavior.process,
      toolsUsed: techStack,
      influencers: identifyInfluencers(discussions)
    },
    quotes: extractRepresentativeQuotes(discussions),
    sources: [/* ... */]
  };
}

// Find where personas hang out online
async function findCommunities(role: string, industry: string): Promise<Community[]> {
  const searches = [
    `${role} ${industry} reddit`,
    `${role} slack community`,
    `${role} discord server`,
    `${role} linkedin group`,
    `${role} forum`
  ];

  const communities: Community[] = [];

  for (const search of searches) {
    const results = await tavily.search({ query: search, maxResults: 10 });
    communities.push(...parseCommunityLinks(results));
  }

  return communities;
}
```

**Step 2: Persona Segmentation**

```typescript
interface PersonaSegment {
  name: string; // e.g., "Scrappy Startup Steve"
  description: string;
  percentage: number; // % of total market
  characteristics: PersonaResearch;
  valueProp: {
    primary: string; // Main value prop for this segment
    secondary: string[];
    messaging: string; // How to talk to this segment
  };
  channels: {
    acquisition: string[]; // Where to find them
    content: string[]; // What content resonates
  };
  dealSize: {
    average: number;
    range: [number, number];
  };
  conversionRate: number; // Expected conversion rate
  priority: "high" | "medium" | "low"; // Strategic priority
}

function segmentPersonas(personas: PersonaResearch[]): PersonaSegment[] {
  // Cluster personas based on similar characteristics
  const clusters = clusterPersonas(personas, {
    features: ["professional.companySize", "psychographic.goals", "behavioral.buyingProcess"]
  });

  return clusters.map(cluster => {
    const representative = findRepresentative(cluster);
    return {
      name: generatePersonaName(representative),
      description: generateDescription(cluster),
      percentage: (cluster.length / personas.length) * 100,
      characteristics: representative,
      valueProp: craftValueProposition(cluster),
      channels: identifyChannels(cluster),
      dealSize: calculateDealSize(cluster),
      conversionRate: estimateConversionRate(cluster),
      priority: assessStrategicPriority(cluster)
    };
  });
}

// Complete Persona Profile
interface BuyerPersona {
  // Identity
  name: string; // "DevOps Dave"
  tagline: string; // "Automation-obsessed infrastructure engineer"
  photo: string; // Stock photo URL or description

  // Demographics & Professional
  demographics: PersonaResearch['demographic'];
  professional: PersonaResearch['professional'];

  // Psychographics
  goals: string[];
  challenges: string[];
  motivations: string[];

  // Day in the Life
  typicalDay: {
    time: string;
    activity: string;
    tools: string[];
  }[];

  // Buying Behavior
  buyingJourney: {
    stage: "awareness" | "consideration" | "decision";
    questions: string[];
    concerns: string[];
    content: string[]; // What content helps at this stage
  }[];

  // Decision Criteria
  mustHaves: string[];
  niceToHaves: string[];
  dealBreakers: string[];

  // Messaging & Positioning
  messaging: {
    headlines: string[]; // Headlines that resonate
    painPoints: string[]; // Pain points to emphasize
    benefits: string[]; // Benefits to highlight
    proofPoints: string[]; // What builds trust
  };

  // Channels
  channels: {
    acquisition: string[];
    engagement: string[];
    retention: string[];
  };

  // Real Quotes
  quotes: {
    challenge: string[];
    desired_outcome: string[];
    objection: string[];
  };
}
```

**Step 3: Persona Validation**

```typescript
interface PersonaValidation {
  persona: string;
  validationMethods: {
    method: "survey" | "interview" | "data-analysis" | "a-b-test";
    sampleSize: number;
    findings: string[];
    confidence: number; // 0-100
  }[];
  accuracy: {
    demographic: number; // % accurate
    psychographic: number;
    behavioral: number;
    overall: number;
  };
  updates: string[]; // Required updates based on validation
}

async function validatePersona(persona: BuyerPersona): Promise<PersonaValidation> {
  const validation: PersonaValidation = {
    persona: persona.name,
    validationMethods: [],
    accuracy: { demographic: 0, psychographic: 0, behavioral: 0, overall: 0 },
    updates: []
  };

  // Method 1: Survey current customers matching this persona
  const surveyResults = await surveyCurrent Customers(persona);
  validation.validationMethods.push({
    method: "survey",
    sampleSize: surveyResults.responses,
    findings: surveyResults.findings,
    confidence: surveyResults.confidence
  });

  // Method 2: Interview prospects matching this persona
  const interviewResults = await interviewProspects(persona);
  validation.validationMethods.push({
    method: "interview",
    sampleSize: interviewResults.interviews,
    findings: interviewResults.findings,
    confidence: interviewResults.confidence
  });

  // Method 3: Analyze CRM data
  const crmAnalysis = await analyzeCRMData(persona);
  validation.validationMethods.push({
    method: "data-analysis",
    sampleSize: crmAnalysis.contacts,
    findings: crmAnalysis.findings,
    confidence: crmAnalysis.confidence
  });

  // Calculate accuracy scores
  validation.accuracy = calculateAccuracyScores(validation.validationMethods);

  // Identify required updates
  validation.updates = identifyRequiredUpdates(validation);

  return validation;
}
```

**Best Practices:**

1. **Base on Real Data**
   - Interview 10+ customers per persona
   - Survey 100+ prospects per persona
   - Analyze behavioral data from CRM/analytics

2. **Focus on Jobs-to-be-Done**
   - What job is the customer hiring your product to do?
   - Functional job, emotional job, social job

3. **Keep Personas Alive**
   - Update quarterly based on new learnings
   - Add real customer quotes continuously
   - Validate assumptions with A/B tests

4. **Make Them Actionable**
   - Link personas to marketing campaigns
   - Create persona-specific sales playbooks
   - Design features for specific personas

**Common Patterns:**

```typescript
// Pattern: Persona-Based Content Strategy
interface ContentStrategy {
  persona: string;
  stages: {
    stage: "awareness" | "consideration" | "decision" | "retention";
    content: {
      type: string; // "blog", "video", "webinar", etc.
      topic: string;
      cta: string;
      distribution: string[];
    }[];
  }[];
}

// Pattern: Persona Scoring Model
interface PersonaScore {
  lead: string;
  personaMatch: {
    persona: string;
    score: number; // 0-100
    signals: string[]; // What signals indicate this persona
  }[];
  recommendedActions: string[];
}
```

**Gotchas:**

- **Too Many Personas:** More than 3-5 personas dilutes focus
- **Stereotyping:** Personas are archetypes, not stereotypes; avoid bias
- **Static Personas:** Personas evolve; update them or they become fiction
- **Vanity Personas:** Don't create personas because they're fun; create personas that drive strategy
- **Ignoring Negative Personas:** Also define who you DON'T want to sell to

---

### 4. Growth Opportunity Identification

**Objective:** Systematically identify and evaluate opportunities for business growth.

#### Opportunity Assessment Framework

**Step 1: Opportunity Discovery**

```typescript
interface GrowthOpportunity {
  type: "market-expansion" | "product-expansion" | "channel-expansion" | "partnership" | "acquisition";
  description: string;
  potential: {
    revenue: number; // Estimated annual revenue
    margin: number; // Expected margin %
    timeToValue: string; // When does this pay off?
  };
  requirements: {
    investment: number;
    resources: string[];
    capabilities: string[];
    timeline: string;
  };
  risks: {
    risk: string;
    probability: number;
    impact: string;
    mitigation: string;
  }[];
  strategicFit: {
    score: number; // 1-10
    reasoning: string;
  };
  priority: "P0" | "P1" | "P2" | "P3";
}

async function identifyGrowthOpportunities(
  company: CompanyContext
): Promise<GrowthOpportunity[]> {
  const opportunities: GrowthOpportunity[] = [];

  // 1. Market Expansion Opportunities
  const marketExpansion = await identifyMarketExpansion(company);
  opportunities.push(...marketExpansion);

  // 2. Product Expansion Opportunities
  const productExpansion = await identifyProductExpansion(company);
  opportunities.push(...productExpansion);

  // 3. Channel Expansion Opportunities
  const channelExpansion = await identifyChannelExpansion(company);
  opportunities.push(...channelExpansion);

  // 4. Partnership Opportunities
  const partnerships = await identifyPartnerships(company);
  opportunities.push(...partnerships);

  // 5. Acquisition Opportunities
  const acquisitions = await identifyAcquisitions(company);
  opportunities.push(...acquisitions);

  // Score and prioritize
  return prioritizeOpportunities(opportunities, company);
}

// Market expansion discovery
async function identifyMarketExpansion(company: CompanyContext): Promise<GrowthOpportunity[]> {
  const opportunities: GrowthOpportunity[] = [];

  // Geographic expansion
  const geoOpportunities = await analyzeGeographicExpansion(company);
  opportunities.push(...geoOpportunities);

  // Vertical market expansion
  const verticalOpportunities = await analyzeVerticalExpansion(company);
  opportunities.push(...verticalOpportunities);

  // Customer segment expansion (SMB → Mid-market → Enterprise)
  const segmentOpportunities = await analyzeSegmentExpansion(company);
  opportunities.push(...segmentOpportunities);

  return opportunities;
}

// Example: Geographic expansion analysis
async function analyzeGeographicExpansion(
  company: CompanyContext
): Promise<GrowthOpportunity[]> {
  const currentMarkets = company.geographies;
  const allMarkets = ["North America", "Europe", "APAC", "LATAM", "MEA"];
  const potentialMarkets = allMarkets.filter(m => !currentMarkets.includes(m));

  const opportunities: GrowthOpportunity[] = [];

  for (const market of potentialMarkets) {
    // Research market size
    const marketSize = await calculateMarketSize(company.industry, [market]);

    // Research market maturity
    const maturity = await assessMarketMaturity(company.industry, market);

    // Research competitive landscape
    const competition = await analyzeCompetitors(company.industry, market);

    // Research regulatory requirements
    const regulatory = await assessRegulatoryBarriers(market);

    opportunities.push({
      type: "market-expansion",
      description: `Expand to ${market} market`,
      potential: {
        revenue: marketSize.sam * 0.01, // Assume 1% market share
        margin: company.avgMargin * 0.8, // Slightly lower margin in new market
        timeToValue: "18-24 months"
      },
      requirements: {
        investment: estimateInvestment(market, company),
        resources: ["Local sales team", "Regional support", "Localization"],
        capabilities: ["Multi-currency", "Local compliance", "Regional infrastructure"],
        timeline: "12-18 months"
      },
      risks: identifyRisks(market, competition, regulatory),
      strategicFit: {
        score: assessStrategicFit(market, company),
        reasoning: explainFit(market, company)
      },
      priority: calculatePriority(marketSize, competition, regulatory)
    });
  }

  return opportunities.sort((a, b) => b.strategicFit.score - a.strategicFit.score);
}
```

**Step 2: Opportunity Evaluation**

```typescript
interface OpportunityEvaluation {
  opportunity: GrowthOpportunity;
  scores: {
    marketAttractiveness: number; // 1-10
    competitivePosition: number; // 1-10
    strategicFit: number; // 1-10
    riskAdjusted: number; // 1-10
    totalScore: number; // Weighted average
  };
  analysis: {
    pros: string[];
    cons: string[];
    assumptions: string[];
    dealBreakers: string[];
  };
  recommendation: "pursue" | "explore-further" | "deprioritize" | "pass";
  nextSteps: string[];
}

function evaluateOpportunity(
  opportunity: GrowthOpportunity,
  company: CompanyContext
): OpportunityEvaluation {
  // Score market attractiveness
  const marketScore = scoreMarketAttractiveness(opportunity);

  // Score competitive position
  const competitiveScore = scoreCompetitivePosition(opportunity, company);

  // Score strategic fit
  const strategicScore = opportunity.strategicFit.score;

  // Calculate risk-adjusted score
  const riskScore = calculateRiskAdjustedScore(opportunity);

  // Weighted total (you can adjust weights)
  const totalScore = (
    marketScore * 0.3 +
    competitiveScore * 0.25 +
    strategicScore * 0.25 +
    riskScore * 0.20
  );

  // Determine recommendation
  let recommendation: OpportunityEvaluation['recommendation'];
  if (totalScore >= 8) recommendation = "pursue";
  else if (totalScore >= 6) recommendation = "explore-further";
  else if (totalScore >= 4) recommendation = "deprioritize";
  else recommendation = "pass";

  return {
    opportunity,
    scores: {
      marketAttractiveness: marketScore,
      competitivePosition: competitiveScore,
      strategicFit: strategicScore,
      riskAdjusted: riskScore,
      totalScore
    },
    analysis: {
      pros: identifyPros(opportunity),
      cons: identifyCons(opportunity),
      assumptions: opportunity.requirements.capabilities,
      dealBreakers: identifyDealBreakers(opportunity)
    },
    recommendation,
    nextSteps: generateNextSteps(opportunity, recommendation)
  };
}

// Prioritization matrix
interface OpportunityMatrix {
  opportunities: {
    name: string;
    effort: "low" | "medium" | "high";
    impact: "low" | "medium" | "high";
    quadrant: "quick-wins" | "major-projects" | "fill-ins" | "thankless-tasks";
  }[];
  recommendations: {
    quickWins: GrowthOpportunity[]; // High impact, low effort
    majorProjects: GrowthOpportunity[]; // High impact, high effort
    fillIns: GrowthOpportunity[]; // Low impact, low effort
    avoid: GrowthOpportunity[]; // Low impact, high effort
  };
}
```

**Step 3: Opportunity Roadmap**

```typescript
interface GrowthRoadmap {
  horizon1: { // 0-12 months
    opportunities: GrowthOpportunity[];
    expectedImpact: number;
    theme: string;
  };
  horizon2: { // 12-36 months
    opportunities: GrowthOpportunity[];
    expectedImpact: number;
    theme: string;
  };
  horizon3: { // 36+ months
    opportunities: GrowthOpportunity[];
    expectedImpact: number;
    theme: string;
  };
  dependencies: {
    opportunity: string;
    requires: string[];
  }[];
  milestones: {
    date: string;
    milestone: string;
    success_criteria: string;
  }[];
}

function createGrowthRoadmap(
  opportunities: OpportunityEvaluation[],
  company: CompanyContext
): GrowthRoadmap {
  // Filter to high-priority opportunities
  const prioritized = opportunities.filter(o =>
    o.recommendation === "pursue" || o.recommendation === "explore-further"
  );

  // Segment by time horizon
  const horizon1 = prioritized.filter(o =>
    o.opportunity.requirements.timeline.includes("6") ||
    o.opportunity.requirements.timeline.includes("12")
  );

  const horizon2 = prioritized.filter(o =>
    o.opportunity.requirements.timeline.includes("18") ||
    o.opportunity.requirements.timeline.includes("24")
  );

  const horizon3 = prioritized.filter(o =>
    !horizon1.includes(o) && !horizon2.includes(o)
  );

  return {
    horizon1: {
      opportunities: horizon1.map(o => o.opportunity),
      expectedImpact: sumImpact(horizon1),
      theme: identifyTheme(horizon1)
    },
    horizon2: {
      opportunities: horizon2.map(o => o.opportunity),
      expectedImpact: sumImpact(horizon2),
      theme: identifyTheme(horizon2)
    },
    horizon3: {
      opportunities: horizon3.map(o => o.opportunity),
      expectedImpact: sumImpact(horizon3),
      theme: identifyTheme(horizon3)
    },
    dependencies: mapDependencies(prioritized),
    milestones: generateMilestones(prioritized)
  };
}
```

**Best Practices:**

1. **Balance Horizons**
   - 70% effort on Horizon 1 (core business)
   - 20% on Horizon 2 (emerging opportunities)
   - 10% on Horizon 3 (moonshots)

2. **Kill Bad Ideas Fast**
   - Set clear go/no-go criteria
   - Run small experiments before big bets
   - Don't be afraid to shut down initiatives

3. **Track Assumptions**
   - Every opportunity is based on assumptions
   - Test assumptions systematically
   - Update opportunities as assumptions change

4. **Consider Opportunity Cost**
   - Saying yes to one opportunity means saying no to others
   - Explicitly trade off opportunities

**Common Patterns:**

```typescript
// Pattern: Opportunity Scoring Model
const SCORING_CRITERIA = {
  marketSize: { weight: 0.20, question: "How big is the market?" },
  growth: { weight: 0.15, question: "How fast is it growing?" },
  competition: { weight: 0.15, question: "How strong is competition?" },
  fit: { weight: 0.20, question: "How well does it fit our strengths?" },
  execution: { weight: 0.15, question: "How confident are we in execution?" },
  timing: { weight: 0.15, question: "Is now the right time?" }
};

// Pattern: Opportunity Pipeline
interface OpportunityPipeline {
  backlog: GrowthOpportunity[]; // Ideas to explore
  evaluating: GrowthOpportunity[]; // Currently researching
  validated: GrowthOpportunity[]; // Validated, ready to execute
  executing: GrowthOpportunity[]; // Currently executing
  completed: GrowthOpportunity[]; // Completed (success or failure)
}
```

**Gotchas:**

- **Shiny Object Syndrome:** Don't chase every opportunity; focus wins
- **Underestimating Execution Risk:** "The plan is easy; execution is hard"
- **Overestimating Market Size:** Validate TAM assumptions rigorously
- **Ignoring Cultural Fit:** Some opportunities don't match company culture/values
- **Analysis Paralysis:** Perfect data doesn't exist; make decisions with imperfect information

---

## 💡 Real-World Examples

### Example 1: SaaS Market Sizing (Project Management Software)

```typescript
async function analyzePMSoftwareMarket() {
  // TAM Calculation (Top-Down)
  const tamTopDown = await calculateTAMTopDown("project management software", ["Global"]);
  console.log(`TAM (Top-Down): $${(tamTopDown.calculation.result / 1e9).toFixed(1)}B`);
  // Result: $50B (Gartner: Global PM software market)

  // TAM Calculation (Bottom-Up)
  const tamBottomUp = await calculateTAMBottomUp(
    "Project management software",
    "Software development teams"
  );
  console.log(`TAM (Bottom-Up): $${(tamBottomUp.calculation.result / 1e9).toFixed(1)}B`);
  // Result: $45B (50M developers × $900 annual spend)

  // SAM Calculation
  const sam = calculateSAM(tamTopDown, {
    geographicLimitations: ["US", "Canada", "UK", "Germany"],
    marketSaturation: 0.40, // 40% already using Jira, Asana, etc.
    productLimitations: ["agile-teams-only"]
  });
  console.log(`SAM: $${(sam.sam / 1e9).toFixed(1)}B (${sam.samPercentage.toFixed(1)}% of TAM)`);
  // Result: $8.1B (16% of TAM)

  // SOM Calculation
  const som = calculateSOM(sam, {
    positioning: "challenger",
    goToMarket: "product-led-growth"
  });
  console.log(`SOM (Year 3): $${(som.som / 1e6).toFixed(1)}M (${som.somPercentage.toFixed(2)}% of SAM)`);
  // Result: $81M (1% of SAM in 3 years)
}
```

### Example 2: Trend Analysis (AI Code Generation)

```typescript
async function analyzeAICodeGenTrend() {
  const trend = await identifyTrends("software development", "next-5-years");
  const aiCodeGen = trend.find(t => t.trend.includes("AI code generation"));

  console.log("Trend: AI Code Generation");
  console.log(`Stage: ${aiCodeGen.stage}`); // "growing"
  console.log(`Momentum: ${aiCodeGen.momentum.growthRate}`); // "150% YoY"
  console.log(`Impact: ${aiCodeGen.impact.magnitude}`); // "transformative"

  // Hype cycle analysis
  const hype = analyzeHypeCycle(aiCodeGen);
  console.log(`Hype Cycle Stage: ${hype.currentStage}`); // "slope-enlightenment"
  console.log(`Years to Mature: ${hype.yearsToMature}`); // 2-3 years
  console.log(`Recommendation: ${hype.recommendation}`); // "invest-now"

  // Forecast
  const forecast = forecastTrend(aiCodeGen, 5);
  console.log("Base Case Scenario:");
  forecast.scenarios[1].timeline.forEach(t => {
    console.log(`  Year ${t.year}: ${t.prediction}`);
  });
  // Year 1: 10% of developers using AI code gen
  // Year 2: 25% of developers using AI code gen
  // Year 3: 50% of developers using AI code gen (mainstream adoption)
  // Year 4: 70% of developers using AI code gen
  // Year 5: 85% of developers using AI code gen (plateau)
}
```

### Example 3: Persona Development (DevOps Engineer)

```typescript
async function createDevOpsPersona() {
  const persona = await researchPersona("DevOps Engineer", "SaaS");

  console.log("Persona: DevOps Dave");
  console.log(`Title: ${persona.professional.jobTitle}`);
  console.log(`Goals: ${persona.psychographic.goals.join(", ")}`);
  // Goals: "Automate everything", "Reduce toil", "Improve reliability", "Ship faster"

  console.log(`Challenges: ${persona.psychographic.challenges.join(", ")}`);
  // Challenges: "Alert fatigue", "Too many tools", "Manual deployments", "Lack of visibility"

  console.log(`Tools Used: ${persona.behavioral.toolsUsed.join(", ")}`);
  // Tools: "Jenkins", "Kubernetes", "Terraform", "Prometheus", "Grafana", "PagerDuty"

  console.log(`Media: ${persona.behavioral.mediaConsumption.join(", ")}`);
  // Media: "DevOps Weekly newsletter", "Hacker News", "r/devops", "KubeCon", "SREcon"

  // Sample quote
  console.log(`Quote: "${persona.quotes[0]}"`);
  // "I spend 60% of my time firefighting and only 40% on actual improvements"
}
```

### Example 4: Growth Opportunity Analysis (Geographic Expansion)

```typescript
async function evaluateEuropeExpansion() {
  const opportunity: GrowthOpportunity = {
    type: "market-expansion",
    description: "Expand to European market (UK, Germany, France)",
    potential: {
      revenue: 5000000, // $5M ARR in year 2
      margin: 0.65, // 65% margin
      timeToValue: "18 months"
    },
    requirements: {
      investment: 1500000, // $1.5M investment
      resources: [
        "VP Europe",
        "3 sales reps",
        "2 solutions engineers",
        "Customer success team"
      ],
      capabilities: [
        "GDPR compliance",
        "Multi-currency billing",
        "European data centers",
        "Localization (DE, FR)"
      ],
      timeline: "12 months"
    },
    risks: [
      {
        risk: "Slower sales cycles in Europe",
        probability: 0.7,
        impact: "Revenue ramp takes 24 months instead of 18",
        mitigation: "Hire experienced Europe sales leader"
      },
      {
        risk: "GDPR compliance costs higher than expected",
        probability: 0.5,
        impact: "Additional $500K investment required",
        mitigation: "Complete compliance audit before launch"
      }
    ],
    strategicFit: {
      score: 8,
      reasoning: "Strong product-market fit, low competition, large TAM"
    },
    priority: "P1"
  };

  const evaluation = evaluateOpportunity(opportunity, companyContext);

  console.log(`Market Attractiveness: ${evaluation.scores.marketAttractiveness}/10`);
  console.log(`Competitive Position: ${evaluation.scores.competitivePosition}/10`);
  console.log(`Strategic Fit: ${evaluation.scores.strategicFit}/10`);
  console.log(`Total Score: ${evaluation.scores.totalScore}/10`);
  console.log(`Recommendation: ${evaluation.recommendation}`); // "pursue"
}
```

## 🔗 Related Skills

- **competitor-analyzer**: Analyze competitive landscape in target markets
- **trend-spotter**: Identify emerging trends affecting your market
- **web-researcher**: General research for market data collection
- **content-writer**: Create market research reports and personas
- **data-analyst**: Quantitative analysis of market data

## 📖 Further Reading

### Books
- "Crossing the Chasm" by Geoffrey Moore (market segmentation)
- "The Mom Test" by Rob Fitzpatrick (customer research)
- "Obviously Awesome" by April Dunford (market positioning)
- "Playing to Win" by A.G. Lafley (strategy frameworks)

### Reports & Databases
- [Gartner](https://www.gartner.com) - IT market research
- [CB Insights](https://www.cbinsights.com) - Market intelligence
- [Statista](https://www.statista.com) - Market statistics
- [Crunchbase](https://www.crunchbase.com) - Funding and company data
- [PitchBook](https://pitchbook.com) - Private market data

### Tools Mentioned
- **Tavily MCP**: Web search for market research
- **Exa MCP**: Neural search for finding market data
- **Google Trends**: Search volume trends
- **SimilarWeb**: Website traffic analytics
- **LinkedIn Sales Navigator**: B2B persona research

---

*This skill is part of OPUS 67 v5.1 - "The Precision Update"*
