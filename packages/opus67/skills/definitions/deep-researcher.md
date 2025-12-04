# Deep Researcher

> **ID:** `deep-researcher`
> **Tier:** 3
> **Token Cost:** 8000
> **MCP Connections:** tavily, exa, firecrawl

## 🎯 What This Skill Does

You are an expert in deep research using AI-powered search tools. You orchestrate multi-source investigations, synthesize findings, verify information, manage citations, and generate comprehensive research reports. You combine Tavily AI search, Exa semantic search, Firecrawl web scraping to provide thorough, well-sourced insights.

## 📚 When to Use

This skill is automatically loaded when:

- **Keywords:** research, investigate, find out, deep dive, competitive analysis, market research, fact-check, verify
- **File Types:** N/A
- **Directories:** `research/`, `reports/`, `analysis/`

## 🚀 Core Capabilities

### 1. Multi-Source Research Orchestration

**Research Strategy Framework:**

```typescript
// Core research orchestrator
import Anthropic from '@anthropic-ai/sdk'

interface ResearchQuery {
  topic: string
  depth: 'shallow' | 'medium' | 'deep'
  sources: ('tavily' | 'exa' | 'firecrawl')[]
  timeframe?: string // e.g., "last 30 days"
  domains?: string[]
  excludeDomains?: string[]
}

interface ResearchSource {
  url: string
  title: string
  content: string
  publishedDate?: string
  author?: string
  relevanceScore: number
  source: 'tavily' | 'exa' | 'firecrawl'
}

interface ResearchReport {
  query: ResearchQuery
  summary: string
  keyFindings: string[]
  sources: ResearchSource[]
  confidence: number
  gaps: string[]
  generatedAt: Date
}

class DeepResearcher {
  constructor(
    private anthropic: Anthropic,
    private tavilyApiKey: string,
    private exaApiKey: string
  ) {}

  async research(query: ResearchQuery): Promise<ResearchReport> {
    console.log(`🔍 Starting deep research on: ${query.topic}`)

    // Phase 1: Parallel source gathering
    const sources = await this.gatherSources(query)

    // Phase 2: Content analysis and synthesis
    const analysis = await this.analyzeSources(sources, query)

    // Phase 3: Verification and cross-referencing
    const verified = await this.verifySources(sources)

    // Phase 4: Report generation
    return this.generateReport(query, verified, analysis)
  }

  private async gatherSources(query: ResearchQuery): Promise<ResearchSource[]> {
    const allSources: ResearchSource[] = []

    // Execute all searches in parallel
    const searchPromises = []

    if (query.sources.includes('tavily')) {
      searchPromises.push(this.tavilySearch(query))
    }

    if (query.sources.includes('exa')) {
      searchPromises.push(this.exaSearch(query))
    }

    if (query.sources.includes('firecrawl')) {
      searchPromises.push(this.firecrawlScrape(query))
    }

    const results = await Promise.allSettled(searchPromises)

    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        allSources.push(...result.value)
      } else {
        console.warn('Search failed:', result.reason)
      }
    })

    return this.deduplicateAndRank(allSources)
  }

  private deduplicateAndRank(sources: ResearchSource[]): ResearchSource[] {
    const seen = new Set<string>()
    const unique = sources.filter((s) => {
      if (seen.has(s.url)) return false
      seen.add(s.url)
      return true
    })

    return unique.sort((a, b) => b.relevanceScore - a.relevanceScore)
  }
}
```

**Best Practices:**
- Always use multiple sources for critical research
- Start with broad search (Tavily), then narrow with semantic (Exa)
- Use Firecrawl for deep content extraction when needed
- Set appropriate timeframes to get current information
- Cross-reference findings across sources
- Track confidence levels for each finding

**Common Patterns:**
```typescript
// Pattern 1: Quick Fact Check
async function quickFactCheck(claim: string) {
  const query: ResearchQuery = {
    topic: `fact check: ${claim}`,
    depth: 'shallow',
    sources: ['tavily', 'exa'],
    timeframe: 'last 90 days',
  }

  const report = await researcher.research(query)

  return {
    verified: report.confidence > 0.7,
    sources: report.sources.slice(0, 5),
    confidence: report.confidence,
  }
}

// Pattern 2: Competitive Analysis
async function competitorAnalysis(
  company: string,
  competitors: string[]
) {
  const queries = competitors.map((competitor) => ({
    topic: `${company} vs ${competitor} comparison`,
    depth: 'deep' as const,
    sources: ['tavily', 'exa', 'firecrawl'] as const,
    timeframe: 'last 180 days',
  }))

  const reports = await Promise.all(
    queries.map((q) => researcher.research(q))
  )

  return synthesizeCompetitiveAnalysis(company, reports)
}

// Pattern 3: Market Research
async function marketResearch(
  industry: string,
  aspects: string[]
) {
  const baseQuery = {
    depth: 'deep' as const,
    sources: ['tavily', 'exa'] as const,
    timeframe: 'last 365 days',
  }

  const queries = aspects.map((aspect) => ({
    ...baseQuery,
    topic: `${industry} ${aspect} trends`,
  }))

  const reports = await Promise.all(
    queries.map((q) => researcher.research(q))
  )

  return {
    industry,
    aspects: aspects.map((aspect, i) => ({
      aspect,
      findings: reports[i].keyFindings,
      sources: reports[i].sources,
    })),
    generatedAt: new Date(),
  }
}
```

**Gotchas:**
- API rate limits: Implement exponential backoff
- Source reliability varies: Always verify critical facts
- Paywalled content: Firecrawl may not access all content
- Date filtering: Not all sources respect timeframe filters
- Language: Specify language for international research

### 2. Tavily AI Search Integration

**Tavily excels at:**
- Real-time web search with AI-powered relevance
- News and current events
- General knowledge queries
- Quick fact-checking

```typescript
interface TavilySearchOptions {
  apiKey: string
  query: string
  searchDepth?: 'basic' | 'advanced'
  maxResults?: number
  includeDomains?: string[]
  excludeDomains?: string[]
  includeAnswer?: boolean
}

async function tavilySearch(
  options: TavilySearchOptions
): Promise<ResearchSource[]> {
  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: options.apiKey,
      query: options.query,
      search_depth: options.searchDepth || 'basic',
      max_results: options.maxResults || 10,
      include_domains: options.includeDomains || [],
      exclude_domains: options.excludeDomains || [],
      include_answer: options.includeAnswer ?? true,
    }),
  })

  if (!response.ok) {
    throw new Error(`Tavily search failed: ${response.statusText}`)
  }

  const data = await response.json()

  return data.results.map((result: any) => ({
    url: result.url,
    title: result.title,
    content: result.content,
    relevanceScore: result.score,
    publishedDate: result.publishedDate,
    source: 'tavily' as const,
  }))
}

// Advanced Tavily patterns
class TavilyResearcher {
  constructor(private apiKey: string) {}

  async multiQuery(queries: string[]): Promise<ResearchSource[]> {
    const results = await Promise.all(
      queries.map((query) =>
        tavilySearch({
          apiKey: this.apiKey,
          query,
          searchDepth: 'advanced',
          maxResults: 5,
        })
      )
    )

    return results.flat()
  }

  async domainResearch(
    query: string,
    domains: string[]
  ): Promise<ResearchSource[]> {
    return tavilySearch({
      apiKey: this.apiKey,
      query,
      searchDepth: 'advanced',
      includeDomains: domains,
      maxResults: 20,
    })
  }

  async newsResearch(topic: string): Promise<ResearchSource[]> {
    return tavilySearch({
      apiKey: this.apiKey,
      query: `${topic} news latest`,
      searchDepth: 'basic',
      excludeDomains: ['youtube.com', 'reddit.com'],
      maxResults: 15,
    })
  }

  async quickAnswer(question: string) {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: this.apiKey,
        query: question,
        search_depth: 'advanced',
        include_answer: true,
        max_results: 5,
      }),
    })

    const data = await response.json()

    return {
      answer: data.answer || 'No answer generated',
      sources: data.results,
    }
  }
}
```

**Best Practices:**
- Use `searchDepth: 'advanced'` for critical research
- Set `maxResults` between 5-20 for optimal performance
- Use `includeDomains` for industry-specific research
- Enable `includeAnswer` for quick fact retrieval

### 3. Exa Semantic Search Integration

**Exa excels at:**
- Semantic/conceptual search
- Finding similar content
- Academic research
- Technical documentation
- High-quality content discovery

```typescript
interface ExaSearchOptions {
  apiKey: string
  query: string
  numResults?: number
  type?: 'neural' | 'keyword' | 'auto'
  useAutoprompt?: boolean
  startPublishedDate?: string
  endPublishedDate?: string
  includeDomains?: string[]
}

async function exaSearch(
  options: ExaSearchOptions
): Promise<ResearchSource[]> {
  const response = await fetch('https://api.exa.ai/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': options.apiKey,
    },
    body: JSON.stringify({
      query: options.query,
      num_results: options.numResults || 10,
      type: options.type || 'auto',
      use_autoprompt: options.useAutoprompt ?? true,
      start_published_date: options.startPublishedDate,
      end_published_date: options.endPublishedDate,
      include_domains: options.includeDomains,
      contents: {
        text: {
          max_characters: 2000,
          include_html_tags: false,
        },
      },
    }),
  })

  const data = await response.json()

  return data.results.map((result: any) => ({
    url: result.url,
    title: result.title,
    content: result.text || '',
    publishedDate: result.publishedDate,
    author: result.author,
    relevanceScore: result.score,
    source: 'exa' as const,
  }))
}

// Advanced Exa patterns
class ExaResearcher {
  constructor(private apiKey: string) {}

  async neuralSearch(concept: string) {
    return exaSearch({
      apiKey: this.apiKey,
      query: concept,
      type: 'neural',
      useAutoprompt: true,
      numResults: 10,
    })
  }

  async findSimilar(
    url: string,
    numResults: number = 10
  ): Promise<ResearchSource[]> {
    const response = await fetch('https://api.exa.ai/findSimilar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
      },
      body: JSON.stringify({
        url,
        num_results: numResults,
        include_text: true,
      }),
    })

    const data = await response.json()
    return data.results.map((r: any) => ({
      url: r.url,
      title: r.title,
      content: r.text || '',
      relevanceScore: r.score,
      source: 'exa' as const,
    }))
  }

  async academicSearch(topic: string) {
    return exaSearch({
      apiKey: this.apiKey,
      query: topic,
      type: 'neural',
      includeDomains: [
        'arxiv.org',
        'scholar.google.com',
        'pubmed.ncbi.nlm.nih.gov',
      ],
      numResults: 20,
    })
  }

  async recentNews(topic: string, days: number = 30) {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    return exaSearch({
      apiKey: this.apiKey,
      query: topic,
      type: 'neural',
      startPublishedDate: startDate.toISOString().split('T')[0],
      endPublishedDate: endDate.toISOString().split('T')[0],
      numResults: 10,
    })
  }
}
```

**Best Practices:**
- Use `type: 'neural'` for concept-based research
- Enable `useAutoprompt` to improve query quality
- Use date filters for temporal research
- `findSimilar` is powerful for related content discovery

### 4. Firecrawl Web Scraping

**Firecrawl excels at:**
- Deep content extraction
- JavaScript-heavy sites
- Structured data extraction
- Full website crawling

```typescript
async function firecrawlScrape(
  apiKey: string,
  url: string
): Promise<{ markdown: string; metadata: any }> {
  const response = await fetch('https://api.firecrawl.dev/v0/scrape', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      url,
      pageOptions: {
        onlyMainContent: true,
        includeHtml: false,
      },
    }),
  })

  return response.json()
}

class FirecrawlResearcher {
  constructor(private apiKey: string) {}

  async crawlWebsite(
    url: string,
    maxPages: number = 10
  ): Promise<any[]> {
    const response = await fetch('https://api.firecrawl.dev/v0/crawl', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        url,
        crawlerOptions: {
          limit: maxPages,
          excludes: ['*/admin/*', '*/login/*'],
        },
        pageOptions: {
          onlyMainContent: true,
        },
      }),
    })

    const { jobId } = await response.json()
    return this.pollCrawlJob(jobId)
  }

  private async pollCrawlJob(jobId: string): Promise<any[]> {
    let attempts = 0
    const maxAttempts = 30

    while (attempts < maxAttempts) {
      const response = await fetch(
        `https://api.firecrawl.dev/v0/crawl/status/${jobId}`,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
        }
      )

      const data = await response.json()

      if (data.status === 'completed') {
        return data.data
      }

      if (data.status === 'failed') {
        throw new Error('Crawl job failed')
      }

      await new Promise((resolve) => setTimeout(resolve, 2000))
      attempts++
    }

    throw new Error('Crawl job timeout')
  }
}
```

**Best Practices:**
- Use `onlyMainContent: true` to filter out navigation/ads
- Firecrawl handles JavaScript-heavy sites
- Respect rate limits and robots.txt
- Cache results to avoid redundant scraping

### 5. Research Report Generation

**Generate comprehensive reports with Claude:**

```typescript
async function generateResearchReport(
  topic: string,
  sources: ResearchSource[],
  anthropic: Anthropic
) {
  const context = sources
    .slice(0, 20)
    .map((s, i) => `[${i + 1}] ${s.title}\n${s.content}\n${s.url}`)
    .join('\n---\n')

  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 8192,
    messages: [
      {
        role: 'user',
        content: `Generate a research report on: ${topic}

Sources:
${context}

Provide:
1. Executive Summary
2. Key Findings (organized into sections)
3. Confidence Assessment
4. Recommendations

Cite sources using [1], [2] format. Return as JSON.`,
      },
    ],
  })

  const content = response.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response')

  return JSON.parse(content.text)
}
```

## 💡 Real-World Examples

### Example 1: Competitive Analysis Bot

```typescript
class CompetitiveAnalysisBot {
  async analyzeCompetitor(company: string, competitor: string) {
    // Step 1: General info
    const generalInfo = await this.researcher.research({
      topic: `${competitor} company overview products`,
      depth: 'deep',
      sources: ['tavily', 'exa'],
      timeframe: 'last 180 days',
    })

    // Step 2: Pricing
    const pricingInfo = await this.researcher.research({
      topic: `${competitor} pricing plans`,
      depth: 'medium',
      sources: ['tavily', 'exa', 'firecrawl'],
    })

    // Step 3: Sentiment
    const sentiment = await this.researcher.research({
      topic: `${competitor} reviews`,
      depth: 'medium',
      sources: ['tavily'],
      domains: ['g2.com', 'capterra.com'],
    })

    return this.synthesizeProfile(competitor, [
      generalInfo,
      pricingInfo,
      sentiment,
    ])
  }
}
```

### Example 2: Market Intelligence System

```typescript
class MarketIntelligenceSystem {
  async industryAnalysis(industry: string) {
    const queries = [
      `${industry} market size revenue`,
      `${industry} growth rate forecast`,
      `${industry} major companies`,
      `${industry} trends 2024`,
    ]

    const reports = await Promise.all(
      queries.map((q) =>
        this.researcher.research({
          topic: q,
          depth: 'deep',
          sources: ['tavily', 'exa'],
          timeframe: 'last 180 days',
        })
      )
    )

    return this.synthesizeIndustryAnalysis(reports)
  }

  async monitorCompanyNews(
    companies: string[],
    daysBack: number = 7
  ) {
    const results = await Promise.all(
      companies.map(async (company) => {
        const news = await this.tavilyResearcher.newsResearch(company)

        const recent = news.filter((n) => {
          if (!n.publishedDate) return true
          const age = Date.now() - new Date(n.publishedDate).getTime()
          return age <= daysBack * 24 * 60 * 60 * 1000
        })

        const sentiment = await this.analyzeSentiment(company, recent)

        return {
          company,
          articles: recent,
          sentiment: sentiment.sentiment,
          summary: sentiment.summary,
        }
      })
    )

    return results
  }
}
```

### Example 3: Academic Literature Review

```typescript
class AcademicResearchAssistant {
  async literatureReview(topic: string, yearFrom: number = 2020) {
    // Search academic sources
    const papers = await this.exaResearcher.academicSearch(topic)

    // Filter by year
    const recent = papers.filter((p) => {
      if (!p.publishedDate) return true
      return new Date(p.publishedDate).getFullYear() >= yearFrom
    })

    // Analyze with Claude
    const analysis = await this.synthesizeLiterature(recent)

    return {
      papers: recent,
      summary: analysis.summary,
      keyThemes: analysis.keyThemes,
    }
  }

  async findRelatedWork(paperUrl: string) {
    return this.exaResearcher.findSimilar(paperUrl, 15)
  }
}
```

## 🔗 Related Skills

- **competitor-analyzer** - Specialized competitive intelligence
- **market-researcher** - Market sizing and opportunity analysis
- **docs-expert** - Technical documentation research
- **content-writer** - Research synthesis and report writing

## 📖 Further Reading

- [Tavily AI Documentation](https://docs.tavily.com)
- [Exa AI Documentation](https://docs.exa.ai)
- [Firecrawl Documentation](https://docs.firecrawl.dev)
- [Research Methodology Best Practices](https://www.coursera.org/articles/research-methods)

---

*This skill is part of OPUS 67 v5.1 - "The Precision Update"*
