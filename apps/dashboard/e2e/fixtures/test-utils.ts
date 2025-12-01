/**
 * E2E Test Utilities
 */

import { Page, expect } from "@playwright/test";

/**
 * Wait for page to be fully loaded
 */
export async function waitForPageLoad(page: Page) {
  await page.waitForLoadState("networkidle");
  await page.waitForLoadState("domcontentloaded");
}

/**
 * Login helper (if auth is implemented)
 */
export async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel(/Email/i).fill(email);
  await page.getByLabel(/Password/i).fill(password);
  await page.getByRole("button", { name: /Sign in/i }).click();
  await page.waitForURL("/dashboard");
}

/**
 * Mock API responses
 */
export async function mockApiResponse(
  page: Page,
  url: string,
  response: unknown,
  status = 200
) {
  await page.route(url, (route) => {
    route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify(response),
    });
  });
}

/**
 * Wait for toast notification
 */
export async function waitForToast(page: Page, text: string) {
  await expect(page.getByText(text)).toBeVisible({ timeout: 5000 });
}

/**
 * Close modal if open
 */
export async function closeModalIfOpen(page: Page) {
  const closeButton = page.getByRole("button", { name: /Close/i });
  if (await closeButton.isVisible()) {
    await closeButton.click();
  }
}

/**
 * Generate test data
 */
export const testData = {
  pipeline: {
    name: "Test Pipeline",
    description: "A test pipeline for E2E testing",
  },
  schedule: {
    cronExpression: "0 * * * *",
    timezone: "UTC",
  },
  budget: {
    name: "Test Budget",
    limitAmount: 100,
    period: "monthly",
  },
};

/**
 * Screenshot helper for debugging
 */
export async function takeDebugScreenshot(page: Page, name: string) {
  await page.screenshot({
    path: `./test-results/debug-${name}-${Date.now()}.png`,
    fullPage: true,
  });
}

/**
 * Wait for network request to complete
 */
export async function waitForApiCall(page: Page, urlPattern: string) {
  return page.waitForResponse(
    (response) => response.url().includes(urlPattern) && response.status() === 200
  );
}

/**
 * Check accessibility basics
 */
export async function checkBasicA11y(page: Page) {
  // Check for main landmark
  await expect(page.locator("main")).toBeVisible();

  // Check for heading
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  // Check for skip link (if implemented)
  const skipLink = page.getByRole("link", { name: /Skip to content/i });
  if (await skipLink.isVisible()) {
    await expect(skipLink).toBeVisible();
  }
}

/**
 * Fill form fields helper
 */
export async function fillForm(
  page: Page,
  fields: Record<string, string | number | boolean>
) {
  for (const [label, value] of Object.entries(fields)) {
    const input = page.getByLabel(new RegExp(label, "i"));

    if (typeof value === "boolean") {
      if (value) {
        await input.check();
      } else {
        await input.uncheck();
      }
    } else {
      await input.fill(String(value));
    }
  }
}

/**
 * Select dropdown option
 */
export async function selectOption(page: Page, label: string, optionText: string) {
  await page.getByRole("combobox", { name: new RegExp(label, "i") }).click();
  await page.getByRole("option", { name: new RegExp(optionText, "i") }).click();
}
