# Browser Automator

You are an expert in browser automation, end-to-end testing, and web interaction patterns using Playwright, Puppeteer, and natural language automation with Stagehand.

> **ID:** `browser-automator`
> **Tier:** 2
> **Token Cost:** 7000
> **MCP Connections:** playwright, stagehand

## Core Expertise

### 1. Playwright Browser Control

Playwright provides reliable, cross-browser automation with powerful selectors and modern async patterns.

```typescript
import { chromium, firefox, webkit, Browser, Page } from "playwright";

class PlaywrightAutomator {
  private browser: Browser | null = null;
  private page: Page | null = null;

  async launch(options?: {
    browser?: "chromium" | "firefox" | "webkit";
    headless?: boolean;
    slowMo?: number;
  }) {
    const browserType =
      options?.browser === "firefox"
        ? firefox
        : options?.browser === "webkit"
        ? webkit
        : chromium;

    this.browser = await browserType.launch({
      headless: options?.headless ?? true,
      slowMo: options?.slowMo ?? 0,
    });

    const context = await this.browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      locale: "en-US",
      timezoneId: "America/New_York",
    });

    this.page = await context.newPage();
  }

  async close() {
    await this.browser?.close();
  }

  async navigate(url: string) {
    if (!this.page) throw new Error("Browser not initialized");
    await this.page.goto(url, { waitUntil: "networkidle" });
  }

  async click(selector: string) {
    if (!this.page) throw new Error("Browser not initialized");
    await this.page.click(selector);
  }

  async fill(selector: string, value: string) {
    if (!this.page) throw new Error("Browser not initialized");
    await this.page.fill(selector, value);
  }

  async screenshot(path: string, fullPage = false) {
    if (!this.page) throw new Error("Browser not initialized");
    await this.page.screenshot({ path, fullPage });
  }
}
```

**Advanced selector strategies:**

```typescript
class SelectorStrategies {
  static css = {
    byId: (id: string) => `#${id}`,
    byClass: (className: string) => `.${className}`,
    byAttribute: (attr: string, value: string) => `[${attr}="${value}"]`,
    byDataTestId: (testId: string) => `[data-testid="${testId}"]`,
  };

  static text = {
    exact: (text: string) => `text="${text}"`,
    contains: (text: string) => `text=${text}`,
  };

  static role = {
    button: (name?: string) => name ? `role=button[name="${name}"]` : "role=button",
    link: (name?: string) => name ? `role=link[name="${name}"]` : "role=link",
    textbox: (name?: string) => name ? `role=textbox[name="${name}"]` : "role=textbox",
  };
}
```

### 2. Form Automation

Complete form filling with validation:

```typescript
interface FormField {
  selector: string;
  value: string;
  type?: "text" | "select" | "checkbox" | "radio" | "file";
}

class FormAutomation {
  private bot: PlaywrightAutomator;

  constructor(bot: PlaywrightAutomator) {
    this.bot = bot;
  }

  async fillForm(fields: FormField[]) {
    for (const field of fields) {
      switch (field.type) {
        case "select":
          await this.bot.page?.selectOption(field.selector, field.value);
          break;
        case "checkbox":
          if (field.value === "true") {
            await this.bot.page?.check(field.selector);
          }
          break;
        case "file":
          await this.bot.page?.setInputFiles(field.selector, field.value);
          break;
        default:
          await this.bot.fill(field.selector, field.value);
      }
      await this.bot.page?.waitForTimeout(100);
    }
  }

  async fillMultiStepForm(steps: Array<{ fields: FormField[]; nextButton: string }>) {
    for (let i = 0; i < steps.length; i++) {
      await this.fillForm(steps[i].fields);

      if (i < steps.length - 1) {
        await this.bot.click(steps[i].nextButton);
        await this.bot.page?.waitForLoadState("networkidle");
      } else {
        await this.bot.click(steps[i].nextButton);
      }
    }
  }
}
```

### 3. Authentication Flows

```typescript
class AuthFlows {
  private bot: PlaywrightAutomator;

  constructor(bot: PlaywrightAutomator) {
    this.bot = bot;
  }

  async loginWithCredentials(
    loginUrl: string,
    credentials: { email: string; password: string }
  ) {
    await this.bot.navigate(loginUrl);
    await this.bot.fill('input[type="email"]', credentials.email);
    await this.bot.fill('input[type="password"]', credentials.password);
    await this.bot.click('button[type="submit"]');
    await this.bot.page?.waitForURL(/dashboard|home/);
  }

  async saveCookies(path: string) {
    const cookies = await this.bot.page?.context().cookies();
    await fs.writeFile(path, JSON.stringify(cookies, null, 2));
  }

  async loadCookies(path: string) {
    const cookies = JSON.parse(await fs.readFile(path, "utf-8"));
    await this.bot.page?.context().addCookies(cookies);
  }
}
```

### 4. Stagehand Natural Language

```typescript
import { Stagehand } from "@browserbasehq/stagehand";

class NaturalLanguageAutomator {
  private stagehand: Stagehand;

  async initialize() {
    this.stagehand = new Stagehand({
      env: "LOCAL",
      headless: false,
      verbose: 1,
    });
    await this.stagehand.init();
  }

  async performAction(instruction: string) {
    await this.stagehand.act({ action: instruction });
  }

  async extractData(instruction: string) {
    return await this.stagehand.extract({ instruction });
  }

  async observe(instruction: string) {
    return await this.stagehand.observe({ instruction });
  }
}

// Usage
const bot = new NaturalLanguageAutomator();
await bot.initialize();

await bot.performAction("Go to github.com");
await bot.performAction("Click on the search bar");
await bot.performAction("Type 'playwright' and press enter");

const repoInfo = await bot.extractData(
  "Extract the repository name, stars, and description"
);
```

### 5. Network Interception

```typescript
class NetworkInterception {
  private bot: PlaywrightAutomator;

  constructor(bot: PlaywrightAutomator) {
    this.bot = bot;
  }

  async blockResources(resourceTypes: string[]) {
    await this.bot.page?.route("**/*", (route) => {
      if (resourceTypes.includes(route.request().resourceType())) {
        route.abort();
      } else {
        route.continue();
      }
    });
  }

  async mockApiResponse(urlPattern: string | RegExp, response: any) {
    await this.bot.page?.route(urlPattern, (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(response),
      });
    });
  }

  async captureRequests(urlPattern: string | RegExp) {
    const requests: any[] = [];

    this.bot.page?.on("request", (request) => {
      if (
        (typeof urlPattern === "string" && request.url().includes(urlPattern)) ||
        (urlPattern instanceof RegExp && urlPattern.test(request.url()))
      ) {
        requests.push({
          url: request.url(),
          method: request.method(),
          postData: request.postData(),
        });
      }
    });

    return requests;
  }
}
```

### 6. Parallel Automation

```typescript
class ParallelAutomation {
  async runInParallel<T>(
    tasks: Array<(bot: PlaywrightAutomator) => Promise<T>>
  ): Promise<T[]> {
    const bots = await Promise.all(
      tasks.map(async () => {
        const bot = new PlaywrightAutomator();
        await bot.launch();
        return bot;
      })
    );

    try {
      return await Promise.all(tasks.map((task, i) => task(bots[i])));
    } finally {
      await Promise.all(bots.map((bot) => bot.close()));
    }
  }

  async scrapeMultiplePages(urls: string[]) {
    return await this.runInParallel(
      urls.map((url) => async (bot) => {
        await bot.navigate(url);
        return await bot.page?.content();
      })
    );
  }
}
```

### 7. Stealth Mode

```typescript
import { chromium } from "playwright-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

class StealthAutomator {
  async launchStealth() {
    chromium.use(StealthPlugin());

    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.addInitScript(() => {
      Object.defineProperty(navigator, "webdriver", {
        get: () => false,
      });

      Object.defineProperty(navigator, "plugins", {
        get: () => [1, 2, 3, 4, 5],
      });

      (window as any).chrome = { runtime: {} };
    });

    return { browser, page };
  }

  async humanLikeType(page: Page, selector: string, text: string) {
    await page.click(selector);

    for (const char of text) {
      await page.keyboard.type(char);
      await page.waitForTimeout(Math.random() * 100 + 50);
    }
  }
}
```

### 8. Error Handling

```typescript
class RobustAutomator {
  private bot: PlaywrightAutomator;
  private maxRetries = 3;

  constructor(bot: PlaywrightAutomator) {
    this.bot = bot;
  }

  async retryAction<T>(action: () => Promise<T>, retries = this.maxRetries): Promise<T> {
    for (let i = 0; i < retries; i++) {
      try {
        return await action();
      } catch (error) {
        if (i === retries - 1) throw error;
        await this.bot.page?.waitForTimeout(1000 * (i + 1));
      }
    }
    throw new Error("Max retries exceeded");
  }

  async clickWithRetry(selector: string) {
    return await this.retryAction(async () => {
      await this.bot.page?.waitForSelector(selector);
      await this.bot.click(selector);
    });
  }

  async takeScreenshotOnError(action: () => Promise<void>, filename: string) {
    try {
      await action();
    } catch (error) {
      await this.bot.screenshot(`./errors/${filename}.png`, true);
      throw error;
    }
  }
}
```

### 9. Performance Monitoring

```typescript
class PerformanceMonitor {
  private bot: PlaywrightAutomator;

  constructor(bot: PlaywrightAutomator) {
    this.bot = bot;
  }

  async measurePageLoad(url: string) {
    const startTime = Date.now();
    await this.bot.navigate(url);

    const metrics = await this.bot.page?.evaluate(() => {
      const timing = performance.timing;
      return {
        domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
        loadComplete: timing.loadEventEnd - timing.navigationStart,
      };
    });

    return { ...metrics, totalTime: Date.now() - startTime };
  }
}
```

### 10. Common Workflows

**E-commerce checkout:**

```typescript
async function automateCheckout(productUrl: string, userInfo: any) {
  const bot = new PlaywrightAutomator();
  await bot.launch();

  try {
    await bot.navigate(productUrl);
    await bot.click('button:has-text("Add to Cart")');
    await bot.page?.waitForSelector('text=Added to cart');

    await bot.click('a:has-text("Cart")');
    await bot.click('button:has-text("Checkout")');

    await bot.fill("#email", userInfo.email);
    await bot.fill("#address", userInfo.address);
    await bot.click('button:has-text("Continue to payment")');

    await bot.fill("#cardNumber", userInfo.cardNumber);
    await bot.click('button:has-text("Place Order")');

    await bot.page?.waitForSelector('text=Order confirmed');

    return { success: true };
  } finally {
    await bot.close();
  }
}
```

**Social media automation:**

```typescript
async function postToSocialMedia(message: string) {
  const bot = new NaturalLanguageAutomator();
  await bot.initialize();

  try {
    await bot.performAction("Go to twitter.com");
    await bot.performAction("Click the tweet button");
    await bot.performAction(`Type: ${message}`);
    await bot.performAction("Click the post button");

    return { success: true };
  } finally {
    await bot.stagehand.close();
  }
}
```

**Data collection:**

```typescript
async function collectMarketData(symbols: string[]) {
  const parallel = new ParallelAutomation();

  return await parallel.runInParallel(
    symbols.map((symbol) => async (bot) => {
      await bot.navigate(`https://finance.yahoo.com/quote/${symbol}`);

      return {
        symbol,
        price: await bot.page?.textContent('[data-testid="qsp-price"]'),
        change: await bot.page?.textContent('[data-testid="qsp-price-change"]'),
      };
    })
  );
}
```

## Best Practices

1. **Use data-testid attributes** for reliable selectors
2. **Wait for network idle** before extracting data
3. **Implement retry logic** for flaky elements
4. **Take screenshots on failures** for debugging
5. **Use human-like delays** to avoid detection
6. **Clean up resources** by closing browsers
7. **Handle popups and dialogs** gracefully
8. **Use stealth mode** when needed
9. **Monitor performance** and optimize
10. **Test across browsers** for compatibility

## Common Patterns

### Pattern 1: Login and Navigate

```typescript
const bot = new PlaywrightAutomator();
const auth = new AuthFlows(bot);

await bot.launch();
await auth.loginWithCredentials("https://app.example.com/login", {
  email: "user@example.com",
  password: "password123",
});

await bot.navigate("https://app.example.com/dashboard");
```

### Pattern 2: Form with Validation

```typescript
const bot = new PlaywrightAutomator();
const form = new FormAutomation(bot);

await bot.launch();
await bot.navigate("https://example.com/signup");

await form.fillForm([
  { selector: "#firstName", value: "John", type: "text" },
  { selector: "#lastName", value: "Doe", type: "text" },
  { selector: "#email", value: "john@example.com", type: "text" },
  { selector: "#country", value: "US", type: "select" },
  { selector: "#terms", value: "true", type: "checkbox" },
]);

await bot.click('button[type="submit"]');
```

### Pattern 3: Scrape with Retry

```typescript
const bot = new PlaywrightAutomator();
const robust = new RobustAutomator(bot);

await bot.launch();

const data = await robust.retryAction(async () => {
  await bot.navigate("https://example.com/data");
  return await bot.page?.textContent(".important-data");
});
```

## Security Considerations

- **Never store credentials in code**
- **Use environment variables**
- **Respect rate limits**
- **Clear browser data between sessions**
- **Use proxies for sensitive operations**

## Related Skills

- `web-scraper` - Data extraction
- `playwright-pro` - E2E testing
- `deep-researcher` - Multi-source investigation

## Further Reading

- [Playwright Documentation](https://playwright.dev)
- [Stagehand GitHub](https://github.com/browserbase/stagehand)

---

*This skill is part of OPUS 67 v5.1 - "The Precision Update"*
