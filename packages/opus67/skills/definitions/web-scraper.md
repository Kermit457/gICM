# Web Scraper Expert

You are an expert in web scraping, data extraction, and automation with production-grade knowledge of modern scraping tools and anti-bot bypass techniques.

> **ID:** `web-scraper`
> **Tier:** 2
> **Token Cost:** 7000
> **MCP Connections:** firecrawl, jina, crawl4ai, playwright

## Core Expertise

### 1. Firecrawl Production Scraping

Firecrawl is a production-ready scraping API with built-in anti-bot bypass, JavaScript rendering, and structured data extraction.

```typescript
import { FirecrawlApp } from "@mendable/firecrawl-js";

const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });

// Single page scrape
const scrapeResult = await firecrawl.scrapeUrl("https://example.com", {
  formats: ["markdown", "html", "links"],
  onlyMainContent: true,
  includeTags: ["article", "main"],
  excludeTags: ["nav", "footer", "aside"],
  waitFor: 2000, // Wait for JS to load
});

console.log(scrapeResult.markdown); // Clean markdown output
console.log(scrapeResult.links); // All extracted links

// Crawl entire site
const crawlResult = await firecrawl.crawlUrl("https://docs.example.com", {
  limit: 100,
  scrapeOptions: {
    formats: ["markdown"],
    onlyMainContent: true,
  },
  includePaths: ["/docs/*"],
  excludePaths: ["/blog/*", "/api/*"],
  maxDepth: 3,
});

// Process results
for (const page of crawlResult.data) {
  console.log(page.metadata.title);
  console.log(page.markdown);
}
```

**Structured Data Extraction:**

```typescript
// Extract specific data with schema
const extractResult = await firecrawl.scrapeUrl("https://example.com/product/123", {
  formats: ["extract"],
  extract: {
    schema: {
      type: "object",
      properties: {
        productName: { type: "string" },
        price: { type: "number" },
        description: { type: "string" },
        inStock: { type: "boolean" },
        images: {
          type: "array",
          items: { type: "string" },
        },
        specifications: {
          type: "object",
          properties: {
            weight: { type: "string" },
            dimensions: { type: "string" },
            material: { type: "string" },
          },
        },
      },
      required: ["productName", "price"],
    },
  },
});

console.log(extractResult.extract);
// {
//   productName: "Wireless Mouse",
//   price: 29.99,
//   description: "Ergonomic wireless mouse...",
//   inStock: true,
//   images: ["img1.jpg", "img2.jpg"],
//   specifications: { ... }
// }
```

**Batch Scraping:**

```typescript
// Scrape multiple URLs in parallel
const urls = [
  "https://example.com/page1",
  "https://example.com/page2",
  "https://example.com/page3",
];

const batchResults = await firecrawl.batchScrapeUrls(urls, {
  formats: ["markdown"],
  onlyMainContent: true,
});

// Map URLs to results
const resultsMap = new Map(
  batchResults.data.map((result) => [result.metadata.sourceURL, result])
);
```

### 2. Jina URL-to-Markdown

Jina Reader provides instant URL-to-markdown conversion with no setup required.

```typescript
// Simple HTTP fetch - no API key needed
async function jinaReader(url: string): Promise<string> {
  const jinaUrl = `https://r.jina.ai/${encodeURIComponent(url)}`;
  const response = await fetch(jinaUrl);
  return response.text();
}

// Usage
const markdown = await jinaReader("https://example.com/article");
console.log(markdown);
```

**With Custom Options:**

```typescript
async function jinaReaderAdvanced(
  url: string,
  options?: {
    targetSelector?: string;
    waitForSelector?: string;
    removeSelector?: string;
    screenshot?: boolean;
  }
): Promise<{ markdown: string; screenshot?: string }> {
  const params = new URLSearchParams();
  if (options?.targetSelector) params.set("target", options.targetSelector);
  if (options?.waitForSelector) params.set("wait", options.waitForSelector);
  if (options?.removeSelector) params.set("remove", options.removeSelector);
  if (options?.screenshot) params.set("screenshot", "true");

  const jinaUrl = `https://r.jina.ai/${encodeURIComponent(url)}?${params}`;
  const response = await fetch(jinaUrl);

  if (options?.screenshot) {
    const json = await response.json();
    return {
      markdown: json.markdown,
      screenshot: json.screenshot, // Base64 image
    };
  }

  return { markdown: await response.text() };
}

// Extract only article content
const result = await jinaReaderAdvanced("https://example.com/article", {
  targetSelector: "article.main-content",
  removeSelector: ".advertisement, .popup",
  screenshot: true,
});
```

**Batch Processing:**

```typescript
async function batchJinaReader(urls: string[]): Promise<Map<string, string>> {
  const results = await Promise.all(
    urls.map(async (url) => {
      try {
        const markdown = await jinaReader(url);
        return [url, markdown] as const;
      } catch (error) {
        console.error(`Failed to scrape ${url}:`, error);
        return [url, ""] as const;
      }
    })
  );

  return new Map(results);
}

// Use for documentation scraping
const docUrls = [
  "https://docs.example.com/intro",
  "https://docs.example.com/api",
  "https://docs.example.com/guides",
];

const docs = await batchJinaReader(docUrls);
```

### 3. Crawl4AI Self-Hosted

Crawl4AI is a powerful open-source alternative for self-hosted scraping with LLM-friendly output.

```python
# Python setup
from crawl4ai import WebCrawler, CrawlerRunConfig, CacheMode

# Initialize crawler
crawler = WebCrawler()

# Basic crawl
result = await crawler.arun(
    url="https://example.com",
    config=CrawlerRunConfig(
        cache_mode=CacheMode.BYPASS,
        wait_for="css:.main-content",
        js_code="window.scrollTo(0, document.body.scrollHeight);",
    )
)

print(result.markdown_v2.raw_markdown)
```

**LLM-Optimized Extraction:**

```python
from crawl4ai.extraction_strategy import LLMExtractionStrategy
from pydantic import BaseModel, Field

# Define schema
class ProductInfo(BaseModel):
    name: str = Field(..., description="Product name")
    price: float = Field(..., description="Price in USD")
    rating: float = Field(..., description="Average rating")
    reviews_count: int = Field(..., description="Number of reviews")
    description: str = Field(..., description="Product description")

# Extract with LLM
strategy = LLMExtractionStrategy(
    provider="openai/gpt-4",
    api_token=os.getenv("OPENAI_API_KEY"),
    schema=ProductInfo.model_json_schema(),
    instruction="Extract product information from the page",
)

result = await crawler.arun(
    url="https://example.com/product/123",
    config=CrawlerRunConfig(
        extraction_strategy=strategy,
    )
)

product = ProductInfo.model_validate_json(result.extracted_content)
```

**TypeScript Integration:**

```typescript
import { spawn } from "child_process";

interface Crawl4AIResult {
  url: string;
  markdown: string;
  html: string;
  links: string[];
  metadata: Record<string, any>;
}

async function crawl4ai(url: string): Promise<Crawl4AIResult> {
  return new Promise((resolve, reject) => {
    const python = spawn("python", ["-c", `
import asyncio
import json
from crawl4ai import WebCrawler, CrawlerRunConfig

async def crawl():
    crawler = WebCrawler()
    result = await crawler.arun("${url}", config=CrawlerRunConfig())

    output = {
        "url": result.url,
        "markdown": result.markdown_v2.raw_markdown,
        "html": result.html,
        "links": result.links.get("external", []),
        "metadata": result.metadata,
    }
    print(json.dumps(output))

asyncio.run(crawl())
    `]);

    let output = "";
    python.stdout.on("data", (data) => {
      output += data.toString();
    });

    python.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`Crawl4AI exited with code ${code}`));
      } else {
        resolve(JSON.parse(output));
      }
    });
  });
}
```

### 4. Playwright Browser Automation

For complex SPAs and JavaScript-heavy sites, use Playwright for full browser control.

```typescript
import { chromium, Page } from "playwright";

class BrowserScraper {
  private page: Page | null = null;

  async initialize(options?: {
    headless?: boolean;
    userAgent?: string;
    viewport?: { width: number; height: number };
  }) {
    const browser = await chromium.launch({
      headless: options?.headless ?? true,
    });

    const context = await browser.newContext({
      userAgent:
        options?.userAgent ||
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      viewport: options?.viewport || { width: 1920, height: 1080 },
    });

    this.page = await context.newPage();

    // Block unnecessary resources
    await this.page.route("**/*", (route) => {
      const resourceType = route.request().resourceType();
      if (["image", "stylesheet", "font", "media"].includes(resourceType)) {
        route.abort();
      } else {
        route.continue();
      }
    });
  }

  async scrapeWithInfiniteScroll(url: string): Promise<string> {
    if (!this.page) throw new Error("Browser not initialized");

    await this.page.goto(url, { waitUntil: "networkidle" });

    // Scroll to bottom
    let previousHeight = 0;
    while (true) {
      const currentHeight = await this.page.evaluate(
        () => document.body.scrollHeight
      );

      if (currentHeight === previousHeight) break;

      previousHeight = currentHeight;
      await this.page.evaluate(() =>
        window.scrollTo(0, document.body.scrollHeight)
      );
      await this.page.waitForTimeout(1000);
    }

    return await this.page.content();
  }

  async scrapeWithPagination(
    baseUrl: string,
    maxPages: number
  ): Promise<string[]> {
    if (!this.page) throw new Error("Browser not initialized");

    const results: string[] = [];

    for (let i = 1; i <= maxPages; i++) {
      await this.page.goto(`${baseUrl}?page=${i}`, {
        waitUntil: "networkidle",
      });

      const content = await this.page.evaluate(() => {
        const articles = document.querySelectorAll("article");
        return Array.from(articles).map((a) => a.textContent || "");
      });

      results.push(...content);

      // Check if "Next" button exists
      const hasNext = await this.page.locator('a:has-text("Next")').count();
      if (hasNext === 0) break;
    }

    return results;
  }

  async scrapeWithLogin(
    loginUrl: string,
    credentials: { email: string; password: string },
    targetUrl: string
  ): Promise<string> {
    if (!this.page) throw new Error("Browser not initialized");

    // Navigate to login
    await this.page.goto(loginUrl);

    // Fill credentials
    await this.page.fill('input[type="email"]', credentials.email);
    await this.page.fill('input[type="password"]', credentials.password);
    await this.page.click('button[type="submit"]');

    // Wait for redirect
    await this.page.waitForURL(/dashboard|home/);

    // Navigate to target
    await this.page.goto(targetUrl, { waitUntil: "networkidle" });

    return await this.page.content();
  }

  async extractStructuredData(
    url: string,
    selectors: Record<string, string>
  ): Promise<Record<string, any>> {
    if (!this.page) throw new Error("Browser not initialized");

    await this.page.goto(url, { waitUntil: "networkidle" });

    const data: Record<string, any> = {};

    for (const [key, selector] of Object.entries(selectors)) {
      try {
        if (selector.startsWith("[") && selector.endsWith("]")) {
          // Array selector
          const cleanSelector = selector.slice(1, -1);
          data[key] = await this.page.locator(cleanSelector).allTextContents();
        } else {
          data[key] = await this.page.locator(selector).textContent();
        }
      } catch (error) {
        data[key] = null;
      }
    }

    return data;
  }
}

// Usage
const scraper = new BrowserScraper();
await scraper.initialize({ headless: true });

// E-commerce product scraping
const product = await scraper.extractStructuredData(
  "https://example.com/product/123",
  {
    title: "h1.product-title",
    price: ".price-current",
    rating: ".rating-stars",
    images: "[img.product-image]", // Array
    description: ".product-description",
    specifications: "[.spec-row]", // Array
  }
);
```

### 5. Anti-Bot Bypass Techniques

```typescript
import { chromium } from "playwright-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

// Use stealth plugin
chromium.use(StealthPlugin());

async function bypassCloudflare(url: string): Promise<string> {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  });

  const page = await context.newPage();

  // Add additional stealth measures
  await page.addInitScript(() => {
    // Override navigator properties
    Object.defineProperty(navigator, "webdriver", { get: () => false });
    Object.defineProperty(navigator, "plugins", { get: () => [1, 2, 3, 4, 5] });

    // Mock languages
    Object.defineProperty(navigator, "languages", {
      get: () => ["en-US", "en"],
    });

    // Add chrome object
    (window as any).chrome = { runtime: {} };
  });

  await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });

  // Wait for Cloudflare to pass
  await page.waitForFunction(() => !document.title.includes("Cloudflare"), {
    timeout: 30000,
  });

  const content = await page.content();
  await browser.close();

  return content;
}
```

### 6. Rate Limiting & Retry Logic

```typescript
import pLimit from "p-limit";
import pRetry from "p-retry";

class RateLimitedScraper {
  private limit = pLimit(5); // Max 5 concurrent requests
  private requestDelay = 1000; // 1 second between requests

  async scrapeUrls(urls: string[]): Promise<Map<string, string>> {
    const results = new Map<string, string>();

    const promises = urls.map((url, index) =>
      this.limit(async () => {
        // Delay between requests
        await new Promise((resolve) =>
          setTimeout(resolve, index * this.requestDelay)
        );

        // Retry on failure
        const content = await pRetry(() => this.scrapeWithTimeout(url), {
          retries: 3,
          minTimeout: 2000,
          onFailedAttempt: (error) => {
            console.log(
              `Attempt ${error.attemptNumber} failed for ${url}. Retrying...`
            );
          },
        });

        results.set(url, content);
      })
    );

    await Promise.all(promises);
    return results;
  }

  private async scrapeWithTimeout(
    url: string,
    timeout = 30000
  ): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.text();
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
```

### 7. Data Extraction Patterns

```typescript
import { load } from "cheerio";

class DataExtractor {
  // Extract all links
  extractLinks(html: string, baseUrl: string): string[] {
    const $ = load(html);
    const links: string[] = [];

    $("a[href]").each((_, el) => {
      const href = $(el).attr("href");
      if (href) {
        try {
          const url = new URL(href, baseUrl);
          links.push(url.href);
        } catch (e) {
          // Invalid URL, skip
        }
      }
    });

    return [...new Set(links)]; // Deduplicate
  }

  // Extract structured data (JSON-LD)
  extractJsonLd(html: string): any[] {
    const $ = load(html);
    const scripts: any[] = [];

    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const data = JSON.parse($(el).html() || "");
        scripts.push(data);
      } catch (e) {
        // Invalid JSON, skip
      }
    });

    return scripts;
  }

  // Extract meta tags
  extractMetadata(html: string): Record<string, string> {
    const $ = load(html);
    const metadata: Record<string, string> = {};

    // Open Graph
    $("meta[property^='og:']").each((_, el) => {
      const property = $(el).attr("property")?.replace("og:", "");
      const content = $(el).attr("content");
      if (property && content) metadata[property] = content;
    });

    // Twitter Cards
    $("meta[name^='twitter:']").each((_, el) => {
      const name = $(el).attr("name")?.replace("twitter:", "");
      const content = $(el).attr("content");
      if (name && content) metadata[`twitter_${name}`] = content;
    });

    // Standard meta
    $("meta[name]").each((_, el) => {
      const name = $(el).attr("name");
      const content = $(el).attr("content");
      if (name && content) metadata[name] = content;
    });

    return metadata;
  }

  // Extract tables
  extractTables(html: string): any[][] {
    const $ = load(html);
    const tables: any[][] = [];

    $("table").each((_, table) => {
      const rows: any[] = [];

      $(table)
        .find("tr")
        .each((_, tr) => {
          const cells: string[] = [];
          $(tr)
            .find("td, th")
            .each((_, cell) => {
              cells.push($(cell).text().trim());
            });
          if (cells.length > 0) rows.push(cells);
        });

      if (rows.length > 0) tables.push(rows);
    });

    return tables;
  }

  // Extract images with metadata
  extractImages(html: string, baseUrl: string): Array<{
    src: string;
    alt?: string;
    width?: number;
    height?: number;
  }> {
    const $ = load(html);
    const images: any[] = [];

    $("img[src]").each((_, img) => {
      const src = $(img).attr("src");
      if (src) {
        try {
          const url = new URL(src, baseUrl);
          images.push({
            src: url.href,
            alt: $(img).attr("alt"),
            width: parseInt($(img).attr("width") || "0"),
            height: parseInt($(img).attr("height") || "0"),
          });
        } catch (e) {
          // Invalid URL, skip
        }
      }
    });

    return images;
  }
}
```

### 8. Caching Strategy

```typescript
import { createHash } from "crypto";
import fs from "fs/promises";
import path from "path";

class ScraperCache {
  constructor(private cacheDir: string = ".scraper-cache") {}

  private getCacheKey(url: string): string {
    return createHash("sha256").update(url).digest("hex");
  }

  private getCachePath(url: string): string {
    return path.join(this.cacheDir, `${this.getCacheKey(url)}.json`);
  }

  async get(url: string, maxAge: number = 3600000): Promise<string | null> {
    try {
      const cachePath = this.getCachePath(url);
      const stats = await fs.stat(cachePath);

      // Check if cache is expired
      if (Date.now() - stats.mtimeMs > maxAge) {
        await fs.unlink(cachePath);
        return null;
      }

      const data = JSON.parse(await fs.readFile(cachePath, "utf-8"));
      return data.content;
    } catch (error) {
      return null;
    }
  }

  async set(url: string, content: string): Promise<void> {
    await fs.mkdir(this.cacheDir, { recursive: true });
    const cachePath = this.getCachePath(url);
    await fs.writeFile(
      cachePath,
      JSON.stringify({ url, content, timestamp: Date.now() })
    );
  }

  async clear(): Promise<void> {
    try {
      const files = await fs.readdir(this.cacheDir);
      await Promise.all(
        files.map((file) => fs.unlink(path.join(this.cacheDir, file)))
      );
    } catch (error) {
      // Cache dir doesn't exist, ignore
    }
  }
}

// Usage with scraper
async function cachedScrape(url: string): Promise<string> {
  const cache = new ScraperCache();

  // Try cache first
  const cached = await cache.get(url, 3600000); // 1 hour TTL
  if (cached) {
    console.log(`Cache hit for ${url}`);
    return cached;
  }

  // Scrape and cache
  console.log(`Cache miss for ${url}, scraping...`);
  const content = await jinaReader(url);
  await cache.set(url, content);

  return content;
}
```

### 9. Production Scraping Pipeline

```typescript
interface ScrapingJob {
  url: string;
  type: "firecrawl" | "jina" | "playwright";
  options?: any;
}

interface ScrapingResult {
  url: string;
  success: boolean;
  content?: string;
  error?: string;
  metadata: {
    scrapedAt: Date;
    method: string;
    duration: number;
  };
}

class ScrapingPipeline {
  private cache = new ScraperCache();
  private limiter = pLimit(3);

  async scrape(jobs: ScrapingJob[]): Promise<ScrapingResult[]> {
    return Promise.all(
      jobs.map((job) =>
        this.limiter(async () => {
          const startTime = Date.now();

          try {
            // Check cache
            const cached = await this.cache.get(job.url);
            if (cached) {
              return {
                url: job.url,
                success: true,
                content: cached,
                metadata: {
                  scrapedAt: new Date(),
                  method: `${job.type} (cached)`,
                  duration: Date.now() - startTime,
                },
              };
            }

            // Scrape based on type
            let content: string;
            switch (job.type) {
              case "firecrawl":
                const firecrawl = new FirecrawlApp({
                  apiKey: process.env.FIRECRAWL_API_KEY!,
                });
                const result = await firecrawl.scrapeUrl(job.url, job.options);
                content = result.markdown || "";
                break;

              case "jina":
                content = await jinaReader(job.url);
                break;

              case "playwright":
                const scraper = new BrowserScraper();
                await scraper.initialize();
                content = await scraper.scrapeWithInfiniteScroll(job.url);
                break;

              default:
                throw new Error(`Unknown scraping type: ${job.type}`);
            }

            // Cache result
            await this.cache.set(job.url, content);

            return {
              url: job.url,
              success: true,
              content,
              metadata: {
                scrapedAt: new Date(),
                method: job.type,
                duration: Date.now() - startTime,
              },
            };
          } catch (error) {
            return {
              url: job.url,
              success: false,
              error: error instanceof Error ? error.message : String(error),
              metadata: {
                scrapedAt: new Date(),
                method: job.type,
                duration: Date.now() - startTime,
              },
            };
          }
        })
      )
    );
  }
}

// Usage
const pipeline = new ScrapingPipeline();

const results = await pipeline.scrape([
  { url: "https://example.com/page1", type: "jina" },
  {
    url: "https://example.com/page2",
    type: "firecrawl",
    options: { formats: ["markdown"] },
  },
  { url: "https://example.com/spa", type: "playwright" },
]);

// Process results
for (const result of results) {
  if (result.success) {
    console.log(`✓ ${result.url} (${result.metadata.duration}ms)`);
  } else {
    console.error(`✗ ${result.url}: ${result.error}`);
  }
}
```

## Best Practices

1. **Always respect robots.txt** - Check before scraping at scale
2. **Use appropriate delays** - Don't hammer servers (1-2 seconds minimum)
3. **Cache aggressively** - Reduce redundant requests
4. **Handle errors gracefully** - Implement retry logic with exponential backoff
5. **Rotate user agents** - Avoid detection on large scraping jobs
6. **Use stealth mode** - For sites with bot protection
7. **Clean extracted data** - Remove extra whitespace, normalize encoding
8. **Monitor rate limits** - Track requests per second/minute
9. **Store raw HTML** - Keep original for re-processing if needed
10. **Add request headers** - Include referer, accept-language for authenticity

## Common Patterns

### Pattern 1: Documentation Scraper

```typescript
async function scrapeDocumentation(baseUrl: string): Promise<void> {
  const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY! });

  // Crawl entire docs site
  const crawlResult = await firecrawl.crawlUrl(baseUrl, {
    limit: 1000,
    scrapeOptions: {
      formats: ["markdown"],
      onlyMainContent: true,
    },
    includePaths: ["/docs/*", "/api/*", "/guides/*"],
    excludePaths: ["/blog/*"],
  });

  // Save to files
  for (const page of crawlResult.data) {
    const slug = new URL(page.metadata.sourceURL).pathname
      .replace(/^\//, "")
      .replace(/\//g, "-");

    await fs.writeFile(`./docs/${slug}.md`, page.markdown);
  }
}
```

### Pattern 2: E-commerce Price Monitor

```typescript
async function monitorPrices(productUrls: string[]): Promise<void> {
  const scraper = new BrowserScraper();
  await scraper.initialize();

  for (const url of productUrls) {
    const data = await scraper.extractStructuredData(url, {
      name: "h1.product-name",
      price: ".current-price",
      inStock: ".stock-status",
    });

    // Store in database
    await db.prices.create({
      url,
      name: data.name,
      price: parseFloat(data.price.replace(/[^0-9.]/g, "")),
      inStock: data.inStock.includes("In Stock"),
      checkedAt: new Date(),
    });
  }
}
```

### Pattern 3: News Aggregator

```typescript
async function aggregateNews(sources: string[]): Promise<Article[]> {
  const articles: Article[] = [];

  for (const source of sources) {
    const markdown = await jinaReader(source);

    // Parse markdown for articles
    const articleMatches = markdown.matchAll(/## (.*?)\n\n(.*?)\n\n/gs);

    for (const match of articleMatches) {
      articles.push({
        title: match[1],
        summary: match[2],
        source,
        scrapedAt: new Date(),
      });
    }
  }

  return articles;
}
```

## Security Considerations

- **Never expose API keys** in client-side code
- **Validate scraped data** before using (XSS risk)
- **Use proxies** for sensitive scraping
- **Implement timeouts** to prevent hanging
- **Sanitize URLs** to prevent SSRF attacks
- **Rate limit your own API** if exposing scraping functionality

## Related Skills

- `deep-researcher` - Multi-source investigation
- `browser-automator` - Complex browser interactions
- `docs-expert` - Documentation search and lookup

## Further Reading

- [Firecrawl Documentation](https://docs.firecrawl.dev)
- [Jina AI Reader](https://jina.ai/reader)
- [Crawl4AI GitHub](https://github.com/unclecode/crawl4ai)
- [Playwright Documentation](https://playwright.dev)

---

*This skill is part of OPUS 67 v5.1 - "The Precision Update"*
