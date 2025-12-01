import { test, expect } from "@playwright/test";

test.describe("Cost Budgets", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/pipelines/budgets");
  });

  test("should display budgets page", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /Cost Budgets/i })).toBeVisible();
  });

  test("should show budget stats", async ({ page }) => {
    await expect(page.getByText(/Total Budgets/i)).toBeVisible();
    await expect(page.getByText(/Active/i)).toBeVisible();
    await expect(page.getByText(/Total Spend/i)).toBeVisible();
    await expect(page.getByText(/Overall Usage/i)).toBeVisible();
    await expect(page.getByText(/Active Alerts/i)).toBeVisible();
  });

  test("should open create budget modal", async ({ page }) => {
    await page.getByRole("button", { name: /Create Budget/i }).click();

    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByText(/Create Budget/i)).toBeVisible();
  });

  test("should display budget cards", async ({ page }) => {
    // Wait for budget cards
    const cards = page.locator('[class*="Card"]').filter({ hasText: /\$/ });
    await expect(cards.first()).toBeVisible();
  });

  test("should show progress bars", async ({ page }) => {
    // Check progress indicators exist
    const progressBars = page.locator('[role="progressbar"]');
    await expect(progressBars.first()).toBeVisible();
  });

  test("should switch to alerts tab", async ({ page }) => {
    await page.getByRole("tab", { name: /Alerts/i }).click();

    // Check alerts tab content
    await expect(page.getByText(/Alerts/i)).toBeVisible();
  });

  test("should acknowledge an alert", async ({ page }) => {
    // Go to alerts tab
    await page.getByRole("tab", { name: /Alerts/i }).click();

    // Find acknowledge button
    const ackButton = page.getByRole("button", { name: /Acknowledge/i });

    if (await ackButton.isVisible()) {
      await ackButton.first().click();

      // Verify alert is acknowledged
      await expect(page.getByText(/acknowledged/i)).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe("Budget Creation", () => {
  test("should create a new budget", async ({ page }) => {
    await page.goto("/pipelines/budgets");

    // Open modal
    await page.getByRole("button", { name: /Create Budget/i }).click();

    // Fill form
    await page.getByLabel(/Budget Name/i).fill("Test Budget");
    await page.getByLabel(/Description/i).fill("Test budget description");
    await page.getByLabel(/Limit Amount/i).fill("500");

    // Select period
    await page.getByRole("combobox", { name: /Period/i }).click();
    await page.getByRole("option", { name: /Monthly/i }).click();

    // Select scope
    await page.getByRole("combobox", { name: /Scope/i }).click();
    await page.getByRole("option", { name: /Global/i }).click();

    // Toggle settings
    await page.getByLabel(/Auto-pause pipelines/i).click();

    // Submit
    await page.getByRole("button", { name: /Create Budget/i }).click();

    // Verify success
    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 5000 });
  });

  test("should validate budget form", async ({ page }) => {
    await page.goto("/pipelines/budgets");

    // Open modal
    await page.getByRole("button", { name: /Create Budget/i }).click();

    // Try to submit empty form
    const createButton = page.getByRole("dialog").getByRole("button", { name: /Create Budget/i });

    // Button should be disabled without name
    await expect(createButton).toBeDisabled();

    // Fill name
    await page.getByLabel(/Budget Name/i).fill("Test");

    // Button should now be enabled
    await expect(createButton).toBeEnabled();
  });
});

test.describe("Budget Actions", () => {
  test("should pause a budget", async ({ page }) => {
    await page.goto("/pipelines/budgets");

    // Open dropdown on first budget card
    await page.locator('[data-testid="budget-menu"]').first().click();

    // Click pause
    await page.getByRole("menuitem", { name: /Pause/i }).click();

    // Verify status changed
    await expect(page.getByText(/paused/i).first()).toBeVisible();
  });

  test("should delete a budget", async ({ page }) => {
    await page.goto("/pipelines/budgets");

    // Count initial budgets
    const initialCount = await page.locator('[data-testid="budget-card"]').count();

    // Open dropdown
    await page.locator('[data-testid="budget-menu"]').first().click();

    // Click delete
    await page.getByRole("menuitem", { name: /Delete/i }).click();

    // Confirm deletion if dialog appears
    const confirmButton = page.getByRole("button", { name: /Confirm/i });
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
    }

    // Verify count decreased
    await expect(page.locator('[data-testid="budget-card"]')).toHaveCount(initialCount - 1);
  });
});
