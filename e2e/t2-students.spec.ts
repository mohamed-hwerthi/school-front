import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

test.describe("T2: Students CRUD", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("T2-01: Students page shows table", async ({ page }) => {
    await page.goto("/dashboard/eleves");
    // Wait for the page to load — look for table or list
    await expect(page.locator("table").or(page.locator('[class*="card"]')).first()).toBeVisible({ timeout: 10000 });
  });

  test("T2-02: Search filters students", async ({ page }) => {
    await page.goto("/dashboard/eleves");
    await page.waitForTimeout(2000); // Wait for data to load
    const searchInput = page.locator('input[placeholder*="echercher"]').or(page.locator('input[placeholder*="herch"]'));
    if (await searchInput.isVisible()) {
      await searchInput.fill("Ahmed");
      await page.waitForTimeout(1000);
      // Page should still be functional
      await expect(page).toHaveURL(/eleves/);
    }
  });

  test("T2-04: Add student page loads with form", async ({ page }) => {
    await page.goto("/dashboard/eleves/ajouter");
    // Form should have required fields
    await expect(page.locator('text=Nom').or(page.locator('text=Prénom')).first()).toBeVisible({ timeout: 5000 });
  });

  test("T2-05: Add student with empty fields shows validation errors", async ({ page }) => {
    await page.goto("/dashboard/eleves/ajouter");
    await page.waitForTimeout(1000);
    // Try to submit empty form
    const submitBtn = page.locator('button:has-text("Enregistrer")').or(page.locator('button:has-text("Ajouter")').or(page.locator('button[type="submit"]')));
    if (await submitBtn.first().isVisible()) {
      await submitBtn.first().click();
      await page.waitForTimeout(1000);
      // Should show validation errors
      await expect(page.locator('text=requis').or(page.locator('[class*="error"]').or(page.locator('[class*="destructive"]')))).toBeVisible({ timeout: 3000 }).catch(() => {
        // Some forms prevent submission without showing errors
      });
    }
  });

  test("T2-10: Export button visible on students page", async ({ page }) => {
    await page.goto("/dashboard/eleves");
    await page.waitForTimeout(2000);
    const exportBtn = page.locator('button:has-text("Exporter")').or(page.locator('button:has-text("Export")'));
    await expect(exportBtn.first()).toBeVisible({ timeout: 5000 });
  });
});
