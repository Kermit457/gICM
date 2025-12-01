import { test, expect } from "@playwright/test";

test.describe("Pipeline Marketplace", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/pipelines/marketplace");
  });

  test("should display marketplace page", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /Pipeline Marketplace/i })).toBeVisible();
  });

  test("should show category filters", async ({ page }) => {
    await expect(page.getByRole("button", { name: /All/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Automation/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Analytics/i })).toBeVisible();
  });

  test("should display template cards", async ({ page }) => {
    // Wait for templates to load
    const templateCards = page.locator('[class*="Card"]').filter({ hasText: /Install/ });
    await expect(templateCards.first()).toBeVisible();
  });

  test("should search templates", async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Search templates/i);
    await searchInput.fill("crypto");

    // Wait for results
    await page.waitForTimeout(500);

    // Check results are filtered
    await expect(page.getByText(/Crypto/i).first()).toBeVisible();
  });

  test("should filter by category", async ({ page }) => {
    // Click on AI/ML category
    await page.getByRole("button", { name: /AI\/ML/i }).click();

    // Verify filter is applied (button should be active)
    await expect(page.getByRole("button", { name: /AI\/ML/i })).toHaveAttribute("data-state", "active");
  });

  test("should sort templates", async ({ page }) => {
    // Open sort dropdown
    await page.getByRole("combobox").click();

    // Select highest rated
    await page.getByRole("option", { name: /Highest Rated/i }).click();

    // Verify sort is applied
    await expect(page.getByRole("combobox")).toContainText("Highest Rated");
  });

  test("should show template details", async ({ page }) => {
    // Click on a template card
    const firstCard = page.locator('[class*="Card"]').filter({ hasText: /Install/ }).first();

    // Check it shows key info
    await expect(firstCard.getByText(/v\d+\.\d+/)).toBeVisible(); // Version
    await expect(firstCard.locator('[class*="Star"]').first()).toBeVisible(); // Rating
  });

  test("should open install modal", async ({ page }) => {
    // Click install on first template
    await page.getByRole("button", { name: /Install/i }).first().click();

    // Check modal opens
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByText(/Install/i)).toBeVisible();
  });

  test("should show template rating stars", async ({ page }) => {
    // Find star ratings
    const stars = page.locator('[class*="Star"]');
    await expect(stars.first()).toBeVisible();
  });

  test("should display install count", async ({ page }) => {
    // Check download count is shown
    await expect(page.locator('[class*="Download"]').first()).toBeVisible();
  });
});

test.describe("Template Installation", () => {
  test("should complete installation flow", async ({ page }) => {
    await page.goto("/pipelines/marketplace");

    // Click install
    await page.getByRole("button", { name: /Install/i }).first().click();

    // Wait for modal
    await expect(page.getByRole("dialog")).toBeVisible();

    // Check template info is displayed
    await expect(page.getByText(/Version/i)).toBeVisible();
    await expect(page.getByText(/Author/i)).toBeVisible();
    await expect(page.getByText(/Estimated Cost/i)).toBeVisible();

    // Click install button in modal
    await page.getByRole("dialog").getByRole("button", { name: /Install Template/i }).click();

    // Modal should close
    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 5000 });
  });

  test("should cancel installation", async ({ page }) => {
    await page.goto("/pipelines/marketplace");

    // Click install
    await page.getByRole("button", { name: /Install/i }).first().click();

    // Wait for modal
    await expect(page.getByRole("dialog")).toBeVisible();

    // Click cancel
    await page.getByRole("button", { name: /Cancel/i }).click();

    // Modal should close
    await expect(page.getByRole("dialog")).not.toBeVisible();
  });
});

test.describe("Marketplace Search", () => {
  test("should handle empty search results", async ({ page }) => {
    await page.goto("/pipelines/marketplace");

    // Search for non-existent template
    const searchInput = page.getByPlaceholder(/Search templates/i);
    await searchInput.fill("xyznonexistent123");

    // Wait for results
    await page.waitForTimeout(500);

    // Should show no results message
    await expect(page.getByText(/No templates found/i)).toBeVisible();
  });

  test("should clear search", async ({ page }) => {
    await page.goto("/pipelines/marketplace");

    // Search for something
    const searchInput = page.getByPlaceholder(/Search templates/i);
    await searchInput.fill("test");
    await page.waitForTimeout(500);

    // Clear search
    await searchInput.clear();
    await page.waitForTimeout(500);

    // All templates should be visible again
    const templates = page.locator('[class*="Card"]').filter({ hasText: /Install/ });
    const count = await templates.count();
    expect(count).toBeGreaterThan(0);
  });
});
