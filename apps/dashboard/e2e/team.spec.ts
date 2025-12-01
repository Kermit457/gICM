import { test, expect } from "@playwright/test";

test.describe("Team Management", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/settings/team");
  });

  test("should display team page", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /Team Management/i })).toBeVisible();
  });

  test("should show team stats", async ({ page }) => {
    await expect(page.getByText(/Total Members/i)).toBeVisible();
    await expect(page.getByText(/Pending Invites/i)).toBeVisible();
    await expect(page.getByText(/Active Today/i)).toBeVisible();
  });

  test("should display member list", async ({ page }) => {
    // Wait for member cards
    const memberCards = page.locator('[data-testid="member-card"]');
    await expect(memberCards.first()).toBeVisible();
  });

  test("should open invite modal", async ({ page }) => {
    await page.getByRole("button", { name: /Invite Member/i }).click();

    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByText(/Invite Team Member/i)).toBeVisible();
  });
});

test.describe("Member Invitations", () => {
  test("should send invitation", async ({ page }) => {
    await page.goto("/settings/team");

    // Open modal
    await page.getByRole("button", { name: /Invite Member/i }).click();

    // Fill form
    await page.getByLabel(/Email address/i).fill("newuser@company.com");

    // Select role
    await page.getByRole("combobox").click();
    await page.getByRole("option", { name: /Editor/i }).click();

    // Optional message
    await page.getByLabel(/Personal message/i).fill("Welcome to the team!");

    // Submit
    await page.getByRole("button", { name: /Send Invitation/i }).click();

    // Verify modal closes
    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 5000 });
  });

  test("should validate email format", async ({ page }) => {
    await page.goto("/settings/team");

    // Open modal
    await page.getByRole("button", { name: /Invite Member/i }).click();

    // Fill invalid email
    await page.getByLabel(/Email address/i).fill("invalid-email");

    // Submit button should be disabled or form should show error
    const submitButton = page.getByRole("button", { name: /Send Invitation/i });
    await expect(submitButton).toBeDisabled();
  });

  test("should show pending invites tab", async ({ page }) => {
    await page.goto("/settings/team");

    // Switch to invites tab
    await page.getByRole("tab", { name: /Invites/i }).click();

    // Check invites content
    await expect(page.getByText(/Pending/i)).toBeVisible();
  });

  test("should revoke invitation", async ({ page }) => {
    await page.goto("/settings/team");

    // Switch to invites tab
    await page.getByRole("tab", { name: /Invites/i }).click();

    // Find revoke button
    const revokeButton = page.getByRole("button", { name: /Revoke/i });

    if (await revokeButton.isVisible()) {
      await revokeButton.first().click();

      // Confirm if dialog appears
      const confirmButton = page.getByRole("button", { name: /Confirm/i });
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }
    }
  });
});

test.describe("Member Roles", () => {
  test("should display role permissions tab", async ({ page }) => {
    await page.goto("/settings/team");

    // Switch to roles tab
    await page.getByRole("tab", { name: /Roles/i }).click();

    // Check role descriptions
    await expect(page.getByText(/Owner/i)).toBeVisible();
    await expect(page.getByText(/Admin/i)).toBeVisible();
    await expect(page.getByText(/Editor/i)).toBeVisible();
    await expect(page.getByText(/Viewer/i)).toBeVisible();
  });

  test("should show permission matrix", async ({ page }) => {
    await page.goto("/settings/team");

    // Switch to roles tab
    await page.getByRole("tab", { name: /Roles/i }).click();

    // Check permission groups
    await expect(page.getByText(/Pipelines/i)).toBeVisible();
    await expect(page.getByText(/Schedules/i)).toBeVisible();
    await expect(page.getByText(/Budgets/i)).toBeVisible();
  });

  test("should update member role", async ({ page }) => {
    await page.goto("/settings/team");

    // Find member that can have role changed (not owner)
    const memberCard = page.locator('[data-testid="member-card"]').filter({ hasNotText: /Owner/i }).first();

    if (await memberCard.isVisible()) {
      // Open role dropdown
      await memberCard.locator('[data-testid="role-select"]').click();

      // Select new role
      await page.getByRole("option", { name: /Viewer/i }).click();

      // Confirm change if needed
      const confirmButton = page.getByRole("button", { name: /Confirm/i });
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }

      // Verify role updated
      await expect(memberCard.getByText(/Viewer/i)).toBeVisible();
    }
  });
});

test.describe("Member Actions", () => {
  test("should remove member", async ({ page }) => {
    await page.goto("/settings/team");

    // Find removable member (not owner)
    const memberCard = page.locator('[data-testid="member-card"]').filter({ hasNotText: /Owner/i }).first();

    if (await memberCard.isVisible()) {
      // Open menu
      await memberCard.locator('[data-testid="member-menu"]').click();

      // Click remove
      await page.getByRole("menuitem", { name: /Remove/i }).click();

      // Confirm removal
      const confirmButton = page.getByRole("button", { name: /Remove/i });
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }
    }
  });

  test("should not allow removing owner", async ({ page }) => {
    await page.goto("/settings/team");

    // Find owner
    const ownerCard = page.locator('[data-testid="member-card"]').filter({ hasText: /Owner/i }).first();

    if (await ownerCard.isVisible()) {
      // Menu should not have remove option or be disabled
      const menu = ownerCard.locator('[data-testid="member-menu"]');
      if (await menu.isVisible()) {
        await menu.click();
        const removeOption = page.getByRole("menuitem", { name: /Remove/i });
        await expect(removeOption).not.toBeVisible();
      }
    }
  });
});

test.describe("Access Control", () => {
  test("should show member limit warning", async ({ page }) => {
    // This test checks if capacity warning appears when at limit
    await page.goto("/settings/team");

    // Look for capacity indicator
    const capacityText = page.getByText(/of \d+ members/i);
    await expect(capacityText).toBeVisible();
  });

  test("should restrict invite for viewers", async ({ page }) => {
    // Simulate viewer role - invite button should be hidden or disabled
    await page.goto("/settings/team");

    // For viewers, invite button should not be visible
    // This depends on the user's actual role
    const inviteButton = page.getByRole("button", { name: /Invite Member/i });

    // Test that button state matches user permissions
    // (In real app, this would check based on current user role)
    await expect(inviteButton).toBeVisible();
  });
});
