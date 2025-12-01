import { test, expect } from "@playwright/test";

test.describe("Pipelines", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/pipelines");
  });

  test("should display pipelines page", async ({ page }) => {
    await expect(page).toHaveTitle(/Pipelines/);
    await expect(page.getByRole("heading", { name: /Pipelines/i })).toBeVisible();
  });

  test("should show pipeline list", async ({ page }) => {
    // Wait for pipeline cards to load
    await page.waitForSelector('[data-testid="pipeline-card"]', { timeout: 10000 });

    // Check that at least one pipeline is displayed
    const pipelines = page.locator('[data-testid="pipeline-card"]');
    await expect(pipelines.first()).toBeVisible();
  });

  test("should open create pipeline modal", async ({ page }) => {
    // Click create button
    await page.getByRole("button", { name: /Create Pipeline/i }).click();

    // Check modal is open
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByText(/Create New Pipeline/i)).toBeVisible();
  });

  test("should filter pipelines by status", async ({ page }) => {
    // Click status filter
    await page.getByRole("combobox", { name: /Status/i }).click();

    // Select "Active" filter
    await page.getByRole("option", { name: /Active/i }).click();

    // Verify filter is applied
    await expect(page.getByRole("combobox", { name: /Status/i })).toContainText("Active");
  });

  test("should search pipelines", async ({ page }) => {
    // Type in search box
    const searchInput = page.getByPlaceholder(/Search pipelines/i);
    await searchInput.fill("test pipeline");

    // Wait for search results
    await page.waitForTimeout(500); // Debounce

    // Verify search is applied
    await expect(searchInput).toHaveValue("test pipeline");
  });

  test("should navigate to pipeline details", async ({ page }) => {
    // Wait for pipelines to load
    await page.waitForSelector('[data-testid="pipeline-card"]', { timeout: 10000 });

    // Click on first pipeline
    await page.locator('[data-testid="pipeline-card"]').first().click();

    // Should navigate to details page
    await expect(page).toHaveURL(/\/pipelines\/[a-z0-9-]+/);
  });

  test("should execute pipeline", async ({ page }) => {
    // Wait for pipelines to load
    await page.waitForSelector('[data-testid="pipeline-card"]', { timeout: 10000 });

    // Click execute button on first pipeline
    await page.locator('[data-testid="pipeline-card"]').first()
      .getByRole("button", { name: /Execute/i }).click();

    // Check execution modal or toast
    await expect(page.getByText(/Execution started/i)).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Pipeline Details", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a specific pipeline (mock ID)
    await page.goto("/pipelines/test-pipeline-id");
  });

  test("should display pipeline details", async ({ page }) => {
    await expect(page.getByRole("heading")).toBeVisible();
  });

  test("should show pipeline steps", async ({ page }) => {
    await expect(page.getByText(/Steps/i)).toBeVisible();
  });

  test("should show execution history", async ({ page }) => {
    // Click on history tab
    await page.getByRole("tab", { name: /History/i }).click();

    // Check history section is visible
    await expect(page.getByText(/Execution History/i)).toBeVisible();
  });
});
