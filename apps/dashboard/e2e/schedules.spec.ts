import { test, expect } from "@playwright/test";

test.describe("Pipeline Schedules", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/pipelines/schedules");
  });

  test("should display schedules page", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /Schedules/i })).toBeVisible();
  });

  test("should show schedule stats", async ({ page }) => {
    // Check stats cards are visible
    await expect(page.getByText(/Active Schedules/i)).toBeVisible();
    await expect(page.getByText(/Runs Today/i)).toBeVisible();
  });

  test("should open create schedule modal", async ({ page }) => {
    await page.getByRole("button", { name: /Create Schedule/i }).click();

    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByText(/Create Schedule/i)).toBeVisible();
  });

  test("should display cron builder", async ({ page }) => {
    await page.getByRole("button", { name: /Create Schedule/i }).click();

    // Check cron builder is visible
    await expect(page.getByText(/Schedule Type/i)).toBeVisible();

    // Select custom cron
    await page.getByRole("tab", { name: /Custom/i }).click();

    // Check cron input fields
    await expect(page.getByPlaceholder(/Minute/i)).toBeVisible();
    await expect(page.getByPlaceholder(/Hour/i)).toBeVisible();
  });

  test("should use cron presets", async ({ page }) => {
    await page.getByRole("button", { name: /Create Schedule/i }).click();

    // Click on preset tab
    await page.getByRole("tab", { name: /Preset/i }).click();

    // Select a preset
    await page.getByRole("button", { name: /Every hour/i }).click();

    // Check preview updates
    await expect(page.getByText(/0 \* \* \* \*/)).toBeVisible();
  });

  test("should toggle schedule status", async ({ page }) => {
    // Wait for schedule cards
    await page.waitForSelector('[data-testid="schedule-card"]', { timeout: 10000 });

    // Find toggle switch
    const toggle = page.locator('[data-testid="schedule-card"]').first()
      .getByRole("switch");

    // Get initial state
    const initialState = await toggle.isChecked();

    // Toggle
    await toggle.click();

    // Verify state changed
    await expect(toggle).toHaveAttribute("aria-checked", (!initialState).toString());
  });

  test("should show next run time", async ({ page }) => {
    await page.waitForSelector('[data-testid="schedule-card"]', { timeout: 10000 });

    // Check next run is displayed
    await expect(page.getByText(/Next run/i).first()).toBeVisible();
  });

  test("should filter schedules by status", async ({ page }) => {
    // Click filter
    await page.getByRole("button", { name: /Filter/i }).click();

    // Select active only
    await page.getByLabel(/Active only/i).check();

    // Apply filter
    await page.getByRole("button", { name: /Apply/i }).click();
  });
});

test.describe("Schedule Creation Flow", () => {
  test("should create a new schedule", async ({ page }) => {
    await page.goto("/pipelines/schedules");

    // Open modal
    await page.getByRole("button", { name: /Create Schedule/i }).click();

    // Select pipeline
    await page.getByRole("combobox", { name: /Pipeline/i }).click();
    await page.getByRole("option").first().click();

    // Set cron expression
    await page.getByRole("tab", { name: /Preset/i }).click();
    await page.getByRole("button", { name: /Daily/i }).click();

    // Set timezone
    await page.getByRole("combobox", { name: /Timezone/i }).click();
    await page.getByRole("option", { name: /UTC/i }).click();

    // Submit
    await page.getByRole("button", { name: /Create/i }).click();

    // Verify success
    await expect(page.getByText(/Schedule created/i)).toBeVisible({ timeout: 5000 });
  });
});
