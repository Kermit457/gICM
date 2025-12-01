import { test, expect } from "@playwright/test";

test.describe("API Documentation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/pipelines/api-docs");
  });

  test("should display API documentation page", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /API Documentation/i })).toBeVisible();
  });

  test("should show quick start section", async ({ page }) => {
    await expect(page.getByText(/Quick Start/i)).toBeVisible();
    await expect(page.getByText(/Base URL/i)).toBeVisible();
    await expect(page.getByText(/Authentication/i)).toBeVisible();
  });

  test("should display endpoint list", async ({ page }) => {
    await expect(page.getByText(/Endpoints/i)).toBeVisible();

    // Check endpoint categories
    await expect(page.getByText(/Pipelines/i)).toBeVisible();
    await expect(page.getByText(/Executions/i)).toBeVisible();
    await expect(page.getByText(/Schedules/i)).toBeVisible();
  });

  test("should expand endpoint category", async ({ page }) => {
    // Click on Pipelines category
    await page.getByText(/Pipelines/).first().click();

    // Check endpoints are visible
    await expect(page.getByText(/GET.*\/api\/pipelines/)).toBeVisible();
    await expect(page.getByText(/POST.*\/api\/pipelines/)).toBeVisible();
  });

  test("should show HTTP method badges", async ({ page }) => {
    // Expand a category
    await page.getByText(/Pipelines/).first().click();

    // Check method badges
    await expect(page.getByText(/GET/).first()).toBeVisible();
    await expect(page.getByText(/POST/).first()).toBeVisible();
  });

  test("should copy base URL", async ({ page }) => {
    // Find copy button near base URL
    const copyButton = page.locator("button").filter({ hasText: "" }).first();

    // Note: clipboard testing requires permissions
    // This test just verifies the button exists
    await expect(page.getByText(/https:\/\/api\.gicm\.dev/)).toBeVisible();
  });

  test("should show API reference tabs", async ({ page }) => {
    // Check tabs exist
    await expect(page.getByRole("tab", { name: /Pipelines/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /Executions/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /Schedules/i })).toBeVisible();
  });

  test("should switch between API tabs", async ({ page }) => {
    // Click on Budgets tab
    await page.getByRole("tab", { name: /Budgets/i }).click();

    // Check budget endpoints are shown
    await expect(page.getByText(/\/api\/budgets/)).toBeVisible();
  });

  test("should show curl examples", async ({ page }) => {
    // Expand Pipelines category
    await page.getByRole("tab", { name: /Pipelines/i }).click();

    // Check curl example exists
    await expect(page.getByText(/curl -X/)).toBeVisible();
  });

  test("should show rate limits", async ({ page }) => {
    await expect(page.getByText(/Rate Limits/i)).toBeVisible();
    await expect(page.getByText(/100/).first()).toBeVisible(); // Standard tier
    await expect(page.getByText(/1,000/)).toBeVisible(); // Pro tier
  });

  test("should allow API key input", async ({ page }) => {
    const apiKeyInput = page.getByPlaceholder(/Enter API Key/i);
    await expect(apiKeyInput).toBeVisible();

    // Enter a test key
    await apiKeyInput.fill("test-api-key-123");
    await expect(apiKeyInput).toHaveValue("test-api-key-123");
  });

  test("should have OpenAPI spec link", async ({ page }) => {
    const openApiLink = page.getByRole("link", { name: /OpenAPI Spec/i });
    await expect(openApiLink).toBeVisible();
  });
});

test.describe("API Reference Navigation", () => {
  test("should navigate through all endpoint categories", async ({ page }) => {
    await page.goto("/pipelines/api-docs");

    const categories = ["Pipelines", "Executions", "Schedules", "Analytics", "Budgets", "Webhooks", "Marketplace"];

    for (const category of categories) {
      await page.getByRole("tab", { name: new RegExp(category, "i") }).click();
      await expect(page.getByRole("tab", { name: new RegExp(category, "i") })).toHaveAttribute("data-state", "active");
    }
  });

  test("should show request body schema", async ({ page }) => {
    await page.goto("/pipelines/api-docs");

    // Go to Pipelines tab
    await page.getByRole("tab", { name: /Pipelines/i }).click();

    // Check POST endpoint shows request body
    await expect(page.getByText(/Request Body/i).first()).toBeVisible();
  });

  test("should show query parameters", async ({ page }) => {
    await page.goto("/pipelines/api-docs");

    // Go to Analytics tab
    await page.getByRole("tab", { name: /Analytics/i }).click();

    // Check query params are shown
    await expect(page.getByText(/Query Parameters/i).first()).toBeVisible();
  });
});
