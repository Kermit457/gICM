import { test, expect } from "@playwright/test";

test.describe("UI Component Previews", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home and click React UI filter
    await page.goto("/");
    await page.getByRole("button", { name: /React UI/i }).click();
    await page.waitForTimeout(500);
  });

  test("Design section loads with component cards", async ({ page }) => {
    // Verify grid is visible with cards
    const cards = page.locator('[data-testid="ui-component-card"]');
    await expect(cards.first()).toBeVisible({ timeout: 15000 });
    const count = await cards.count();
    expect(count).toBeGreaterThan(50);
  });

  test("Each component card preview renders without error", async ({ page }) => {
    // Check no error boundaries or fallback text
    const previews = page.locator('[data-testid="preview-area"]');
    const count = await previews.count();

    for (let i = 0; i < Math.min(count, 20); i++) {
      const preview = previews.nth(i);
      await expect(preview).toBeVisible();
      // Should NOT have fallback "Preview" text
      await expect(preview.locator('text="Preview"')).not.toBeVisible();
    }
  });

  test("Modal preview works for sample components", async ({ page }) => {
    // Click first 5 cards and verify modal preview renders
    const cards = page.locator('[data-testid="ui-component-card"]');

    for (let i = 0; i < 5; i++) {
      await cards.nth(i).click();
      await expect(page.locator('[role="dialog"]')).toBeVisible();

      // Click Preview tab
      await page.getByRole("tab", { name: /Preview/i }).click();

      // Verify preview content exists (no error)
      const previewArea = page.locator('[data-testid="modal-preview"]');
      await expect(previewArea).toBeVisible();

      // Close modal
      await page.keyboard.press("Escape");
      await page.waitForTimeout(200);
    }
  });

  test("Console has no React errors during preview render", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    await page.goto("/");
    await page.getByRole("button", { name: /React UI/i }).click();
    await page.waitForTimeout(2000);

    // Filter for React-specific errors
    const reactErrors = errors.filter(e =>
      e.includes("React") || e.includes("undefined") || e.includes("not defined")
    );
    expect(reactErrors).toHaveLength(0);
  });
});
