# Playwright Testing Expert

> **ID:** `testing-playwright`
> **Tier:** 3
> **Token Cost:** 6000
> **MCP Connections:** playwright

## 🎯 What This Skill Does

- Write E2E tests with Playwright
- Visual regression testing
- API testing
- Test fixtures and hooks
- Cross-browser testing

## 📚 When to Use

This skill is automatically loaded when:

- **Keywords:** playwright, e2e, test, browser, automation
- **File Types:** .spec.ts, .test.ts
- **Directories:** N/A

## 🚀 Core Capabilities


### 1. Write E2E tests with Playwright

Create reliable end-to-end tests that simulate real user interactions across modern browsers with automatic waiting and network interception.

**Best Practices:**
- Use data-testid attributes for selectors (avoid CSS/XPath fragility)
- Leverage auto-waiting (no need for manual waits)
- Use Page Object Model for maintainability
- Run tests in parallel for faster feedback
- Use soft assertions for multiple checks
- Isolate tests (each test should be independent)
- Use fixtures for setup/teardown
- Mock external dependencies

**Common Patterns:**
```typescript
import { test, expect } from '@playwright/test';

// Basic E2E test with best practices
test.describe('User Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    // Use data-testid for stable selectors
    await page.getByTestId('email-input').fill('user@example.com');
    await page.getByTestId('password-input').fill('password123');
    await page.getByTestId('login-button').click();

    // Automatic waiting for navigation
    await expect(page).toHaveURL('/dashboard');

    // Wait for specific element
    await expect(page.getByTestId('welcome-message')).toBeVisible();
    await expect(page.getByTestId('welcome-message')).toContainText('Welcome');
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.getByTestId('email-input').fill('wrong@example.com');
    await page.getByTestId('password-input').fill('wrongpassword');
    await page.getByTestId('login-button').click();

    // Check for error message without navigation
    await expect(page.getByTestId('error-message')).toBeVisible();
    await expect(page.getByTestId('error-message')).toContainText('Invalid credentials');
  });
});

// Page Object Model pattern
class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.page.getByTestId('email-input').fill(email);
    await this.page.getByTestId('password-input').fill(password);
    await this.page.getByTestId('login-button').click();
  }

  async getErrorMessage() {
    return this.page.getByTestId('error-message');
  }
}

// Using Page Object
test('login with POM', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('user@example.com', 'password123');
  await expect(page).toHaveURL('/dashboard');
});
```

**Gotchas:**
- Don't use timeouts unless absolutely necessary (auto-waiting is smarter)
- Avoid brittle selectors like CSS classes (use data-testid)
- Don't share state between tests (use beforeEach, not beforeAll)
- Be careful with flaky tests (usually indicates app issues)
- Remember: tests run in parallel by default (design accordingly)


### 2. Visual regression testing

Catch visual bugs automatically by comparing screenshots across test runs, ensuring UI consistency.

**Best Practices:**
- Use full page screenshots sparingly (slow)
- Screenshot specific components for faster tests
- Update baselines intentionally (review changes)
- Use threshold for minor rendering differences
- Ignore dynamic content (dates, timestamps)
- Test across viewports for responsive design
- Store screenshots in git or dedicated storage
- Review visual diffs in CI

**Common Patterns:**
```typescript
import { test, expect } from '@playwright/test';

// Component visual regression
test('button component matches snapshot', async ({ page }) => {
  await page.goto('/components/button');

  // Screenshot specific element
  const button = page.getByTestId('primary-button');
  await expect(button).toHaveScreenshot('primary-button.png');
});

// Full page screenshot
test('homepage visual regression', async ({ page }) => {
  await page.goto('/');

  // Wait for all images to load
  await page.waitForLoadState('networkidle');

  // Full page screenshot
  await expect(page).toHaveScreenshot('homepage.png', {
    fullPage: true,
  });
});

// Responsive visual testing
test.describe('Responsive design', () => {
  test('mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await expect(page).toHaveScreenshot('homepage-mobile.png');
  });

  test('tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await expect(page).toHaveScreenshot('homepage-tablet.png');
  });

  test('desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await expect(page).toHaveScreenshot('homepage-desktop.png');
  });
});

// Ignore dynamic content
test('page with dynamic content', async ({ page }) => {
  await page.goto('/dashboard');

  await expect(page).toHaveScreenshot('dashboard.png', {
    // Ignore specific elements
    mask: [page.getByTestId('timestamp')],
    // Allow small pixel differences (0-1)
    threshold: 0.2,
  });
});

// Screenshot with animations disabled
test('modal without animations', async ({ page }) => {
  await page.goto('/');
  await page.click('[data-testid="open-modal"]');

  await expect(page).toHaveScreenshot('modal.png', {
    animations: 'disabled', // Disable CSS animations
  });
});
```

**Gotchas:**
- Font rendering differs across OS (run tests in containers)
- Animations cause flaky screenshots (disable them)
- Dynamic content like dates breaks comparisons (mask them)
- Full page screenshots are slow (use component screenshots)
- Screenshot storage grows quickly (cleanup old baselines)


### 3. API testing

Test REST APIs, GraphQL endpoints, and WebSockets directly through Playwright's request context, bypassing the UI for faster tests.

**Best Practices:**
- Use API tests for backend logic (faster than E2E)
- Share authentication state between UI and API tests
- Mock external APIs for reliability
- Test error cases (4xx, 5xx responses)
- Validate response schemas with Zod
- Use fixtures for test data
- Test rate limiting and timeouts
- Combine API + UI tests for full coverage

**Common Patterns:**
```typescript
import { test, expect } from '@playwright/test';
import { z } from 'zod';

// REST API testing
test.describe('API Tests', () => {
  test('GET /api/users returns user list', async ({ request }) => {
    const response = await request.get('/api/users');

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const users = await response.json();
    expect(Array.isArray(users)).toBeTruthy();
    expect(users.length).toBeGreaterThan(0);
  });

  test('POST /api/users creates new user', async ({ request }) => {
    const newUser = {
      name: 'Test User',
      email: 'test@example.com',
    };

    const response = await request.post('/api/users', {
      data: newUser,
    });

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(201);

    const user = await response.json();
    expect(user).toMatchObject(newUser);
    expect(user.id).toBeDefined();
  });

  test('PUT /api/users/:id updates user', async ({ request }) => {
    const updates = { name: 'Updated Name' };

    const response = await request.put('/api/users/123', {
      data: updates,
    });

    expect(response.ok()).toBeTruthy();
    const user = await response.json();
    expect(user.name).toBe('Updated Name');
  });

  test('handles 404 error', async ({ request }) => {
    const response = await request.get('/api/users/99999');

    expect(response.status()).toBe(404);
    const error = await response.json();
    expect(error.message).toContain('not found');
  });
});

// Schema validation with Zod
const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  createdAt: z.string().datetime(),
});

test('validates API response schema', async ({ request }) => {
  const response = await request.get('/api/users/123');
  const user = await response.json();

  // Throws if schema doesn't match
  const validatedUser = UserSchema.parse(user);
  expect(validatedUser.email).toContain('@');
});

// Authentication flow
test.describe('Authenticated API', () => {
  let authToken: string;

  test.beforeAll(async ({ request }) => {
    // Login and get token
    const response = await request.post('/api/auth/login', {
      data: {
        email: 'test@example.com',
        password: 'password123',
      },
    });

    const { token } = await response.json();
    authToken = token;
  });

  test('access protected endpoint', async ({ request }) => {
    const response = await request.get('/api/protected', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    expect(response.ok()).toBeTruthy();
  });
});

// GraphQL testing
test('GraphQL query', async ({ request }) => {
  const response = await request.post('/graphql', {
    data: {
      query: `
        query GetUser($id: ID!) {
          user(id: $id) {
            id
            name
            email
          }
        }
      `,
      variables: { id: '123' },
    },
  });

  const { data, errors } = await response.json();
  expect(errors).toBeUndefined();
  expect(data.user).toBeDefined();
});
```

**Gotchas:**
- Request context is separate from browser context
- Cookies aren't shared automatically (use storageState)
- CORS doesn't apply to request context (it's server-side)
- Response.json() can only be called once
- Rate limiting can cause flaky tests (mock in CI)


### 4. Test fixtures and hooks

Create reusable test setup with fixtures and lifecycle hooks for cleaner, more maintainable tests.

**Best Practices:**
- Use fixtures for complex setup/teardown
- Extend base fixtures for custom functionality
- Leverage automatic cleanup with fixtures
- Use test.beforeEach for per-test setup
- Use test.beforeAll sparingly (breaks isolation)
- Create custom fixtures for common patterns
- Use workers for parallel test isolation
- Type fixtures with TypeScript

**Common Patterns:**
```typescript
import { test as base, expect } from '@playwright/test';

// Custom fixture for authenticated user
type AuthFixtures = {
  authenticatedPage: Page;
};

const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    // Setup: login before test
    await page.goto('/login');
    await page.getByTestId('email-input').fill('test@example.com');
    await page.getByTestId('password-input').fill('password123');
    await page.getByTestId('login-button').click();
    await page.waitForURL('/dashboard');

    // Use the authenticated page in test
    await use(page);

    // Teardown: logout after test (automatic cleanup)
    await page.goto('/logout');
  },
});

test('authenticated user can view profile', async ({ authenticatedPage }) => {
  await authenticatedPage.goto('/profile');
  await expect(authenticatedPage.getByTestId('profile-name')).toBeVisible();
});

// Database fixture
type DbFixtures = {
  db: Database;
  testUser: User;
};

const testWithDb = base.extend<DbFixtures>({
  db: async ({}, use) => {
    const db = await Database.connect(process.env.TEST_DB_URL);
    await use(db);
    await db.close();
  },

  testUser: async ({ db }, use) => {
    // Create test user
    const user = await db.users.create({
      email: `test-${Date.now()}@example.com`,
      name: 'Test User',
    });

    await use(user);

    // Cleanup: delete test user
    await db.users.delete(user.id);
  },
});

testWithDb('user data persistence', async ({ testUser, page }) => {
  // Test with pre-created user
  await page.goto(`/users/${testUser.id}`);
  await expect(page.getByText(testUser.name)).toBeVisible();
});

// Worker-scoped fixture (shared across tests in worker)
const testWithCache = base.extend<{}, { cache: Cache }>({
  cache: [async ({}, use) => {
    const cache = await Cache.connect();
    await use(cache);
    await cache.disconnect();
  }, { scope: 'worker' }],
});

// Lifecycle hooks
test.describe('User Management', () => {
  test.beforeAll(async () => {
    // Runs once before all tests in describe block
    console.log('Setting up test suite...');
  });

  test.beforeEach(async ({ page }) => {
    // Runs before each test
    await page.goto('/users');
  });

  test.afterEach(async ({ page }, testInfo) => {
    // Runs after each test
    if (testInfo.status !== 'passed') {
      await page.screenshot({
        path: `screenshots/${testInfo.title}.png`
      });
    }
  });

  test.afterAll(async () => {
    // Runs once after all tests
    console.log('Cleaning up test suite...');
  });

  test('create user', async ({ page }) => {
    // Test implementation
  });
});
```

**Gotchas:**
- beforeAll/afterAll break test isolation (use sparingly)
- Worker-scoped fixtures are shared (be careful with state)
- Fixtures run in dependency order (define dependencies correctly)
- Async fixtures must await use()
- Fixture cleanup runs even if test fails


### 5. Cross-browser testing

Ensure your application works across all major browsers (Chromium, Firefox, WebKit) with Playwright's built-in browser support.

**Best Practices:**
- Test on all three engines (Chromium, Firefox, WebKit)
- Use browser-specific projects in config
- Handle browser-specific quirks
- Test mobile browsers with device emulation
- Run full suite on Chromium, smoke tests on others
- Use browser context for isolation
- Configure retries for flaky browser-specific tests
- Test browser-specific features conditionally

**Common Patterns:**
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    // Mobile devices
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 13'] },
    },
  ],

  // Run tests in parallel across browsers
  workers: 4,

  // Retry flaky tests
  retries: process.env.CI ? 2 : 0,
});

// Browser-specific tests
test('webkit-specific feature', async ({ page, browserName }) => {
  test.skip(browserName !== 'webkit', 'WebKit-specific test');

  await page.goto('/');
  // Test WebKit-specific behavior
});

// Test across all browsers
test('cross-browser compatibility', async ({ page, browserName }) => {
  await page.goto('/');

  // Common assertions work everywhere
  await expect(page.getByTestId('header')).toBeVisible();

  // Browser-specific handling
  if (browserName === 'webkit') {
    // WebKit-specific assertions
  } else if (browserName === 'firefox') {
    // Firefox-specific assertions
  }
});

// Device emulation
test.describe('Mobile responsiveness', () => {
  test.use({
    viewport: { width: 375, height: 667 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
    isMobile: true,
    hasTouch: true,
  });

  test('mobile menu works', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('mobile-menu-toggle').click();
    await expect(page.getByTestId('mobile-menu')).toBeVisible();
  });
});

// Run same test across browsers with different data
for (const browserType of ['chromium', 'firefox', 'webkit']) {
  test(`${browserType} - form submission`, async ({ playwright }) => {
    const browser = await playwright[browserType].launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto('/form');
    await page.fill('[name="email"]', 'test@example.com');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/success');

    await browser.close();
  });
}
```

**Gotchas:**
- WebKit on Linux requires special dependencies
- Browser APIs may not be available (check with conditional tests)
- Font rendering differs across browsers (affects visual tests)
- Mobile emulation isn't the same as real devices
- Some CI providers don't support all browsers


## 💡 Real-World Examples

### Example 1: E-commerce Checkout Flow
```typescript
import { test, expect } from '@playwright/test';

test.describe('E-commerce Checkout', () => {
  test('complete purchase flow', async ({ page }) => {
    // Add item to cart
    await page.goto('/products/123');
    await page.getByTestId('add-to-cart').click();
    await expect(page.getByTestId('cart-count')).toHaveText('1');

    // Go to checkout
    await page.getByTestId('cart-icon').click();
    await page.getByTestId('checkout-button').click();

    // Fill shipping info
    await page.getByTestId('shipping-name').fill('John Doe');
    await page.getByTestId('shipping-address').fill('123 Main St');
    await page.getByTestId('shipping-city').fill('San Francisco');
    await page.getByTestId('shipping-zip').fill('94102');
    await page.getByTestId('continue-to-payment').click();

    // Fill payment info
    await page.getByTestId('card-number').fill('4242424242424242');
    await page.getByTestId('card-expiry').fill('12/25');
    await page.getByTestId('card-cvc').fill('123');
    await page.getByTestId('place-order').click();

    // Verify success
    await expect(page).toHaveURL(/\/order\/[0-9]+/);
    await expect(page.getByTestId('order-confirmation')).toBeVisible();
  });
});
```

### Example 2: Real-time Chat Application
```typescript
import { test, expect } from '@playwright/test';

test('real-time chat messaging', async ({ page, context }) => {
  // Open two pages as different users
  const page1 = page;
  const page2 = await context.newPage();

  // User 1 login
  await page1.goto('/chat');
  await page1.getByTestId('username').fill('Alice');
  await page1.getByTestId('join-chat').click();

  // User 2 login
  await page2.goto('/chat');
  await page2.getByTestId('username').fill('Bob');
  await page2.getByTestId('join-chat').click();

  // Alice sends message
  await page1.getByTestId('message-input').fill('Hello Bob!');
  await page1.getByTestId('send-button').click();

  // Bob receives message
  await expect(page2.getByText('Alice: Hello Bob!')).toBeVisible();

  // Bob replies
  await page2.getByTestId('message-input').fill('Hi Alice!');
  await page2.getByTestId('send-button').click();

  // Alice receives reply
  await expect(page1.getByText('Bob: Hi Alice!')).toBeVisible();
});
```

## 🔗 Related Skills

- **testing-unit** - Unit tests complement E2E tests
- **docker-containers** - Run tests in containers for consistency
- **devops-engineer** - Integrate E2E tests into CI/CD
- **auth-security** - Test authentication flows

## 📖 Further Reading

- [Playwright Documentation](https://playwright.dev/)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Page Object Model](https://playwright.dev/docs/pom)
- [Visual Comparisons](https://playwright.dev/docs/test-snapshots)
- [API Testing](https://playwright.dev/docs/api-testing)
- [Test Fixtures](https://playwright.dev/docs/test-fixtures)

---

*This skill is part of OPUS 67 v5.1 - "The Precision Update"*
*Generated by skill-generator.ts - Content to be filled by specialized agents*
