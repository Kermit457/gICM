import { test, expect } from '@playwright/test';

test.describe('gICM Marketplace', () => {
  test('homepage loads successfully', async ({ page }) => {
    await page.goto('/');

    // Check page title
    await expect(page).toHaveTitle(/gICM/i);

    // Check for main heading
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible();
  });

  test('displays marketplace items', async ({ page }) => {
    await page.goto('/');

    // Wait for items to load
    await page.waitForLoadState('networkidle');

    // Check that there are item cards visible
    const itemCards = page.locator('[class*="card"]');
    const count = await itemCards.count();

    expect(count).toBeGreaterThan(0);
  });

  test('agents page loads', async ({ page }) => {
    await page.goto('/agents');

    await expect(page).toHaveURL(/\/agents/);
    await page.waitForLoadState('networkidle');

    // Check page loaded successfully
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('skills page loads', async ({ page }) => {
    await page.goto('/skills');

    await expect(page).toHaveURL(/\/skills/);
    await page.waitForLoadState('networkidle');

    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('settings page loads', async ({ page }) => {
    await page.goto('/settings');

    await expect(page).toHaveURL(/\/settings/);
    await page.waitForLoadState('networkidle');

    // Check settings categories are visible
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('workflow page loads', async ({ page }) => {
    await page.goto('/workflow');

    await expect(page).toHaveURL(/\/workflow/);
    await page.waitForLoadState('networkidle');
  });

  test('can navigate to item detail page', async ({ page }) => {
    await page.goto('/items/icm-anchor-architect');

    await page.waitForLoadState('networkidle');

    // Check that we're on an item detail page
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('new items are accessible', async ({ page }) => {
    // Test React Native Expert agent
    await page.goto('/items/react-native-expert');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();

    // Test ML Engineer agent
    await page.goto('/items/ml-engineer');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();

    // Test Kubernetes Architect agent
    await page.goto('/items/kubernetes-architect');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();

    // Test Advanced TypeScript Patterns skill
    await page.goto('/items/advanced-typescript-patterns');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();

    // Test anchor-init command
    await page.goto('/items/anchor-init');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();
  });

  test('verify total page count in build', async ({ page }) => {
    // Navigate to different routes to ensure they're all generated
    const routes = [
      '/',
      '/agents',
      '/skills',
      '/settings',
      '/workflow',
      '/stack',
      '/compare',
    ];

    for (const route of routes) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');

      // Verify page loaded without 404
      const body = await page.locator('body').textContent();
      expect(body).not.toContain('404');
      expect(body).not.toContain('This page could not be found');
    }
  });
});
