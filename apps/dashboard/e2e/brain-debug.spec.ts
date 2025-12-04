import { test, expect } from "@playwright/test";

test("debug brain page API calls", async ({ page }) => {
  // Go to brain page
  await page.goto("http://localhost:3200/brain", { waitUntil: "networkidle" });

  // Wait for content
  await page.waitForTimeout(2000);

  // Check for Connected text in Header (main connection indicator)
  const connectedText = await page.locator("text=Connected").count();
  console.log(`\n=== CONNECTED COUNT: ${connectedText} ===`);

  // Check for Active text (engine status indicators)
  const activeText = await page.locator("text=Active").count();
  console.log(`=== ACTIVE COUNT: ${activeText} ===`);

  // Take screenshot
  await page.screenshot({ path: "brain-debug.png", fullPage: true });

  // Assert Header shows Connected (main fix verification)
  expect(connectedText).toBeGreaterThan(0);
});
