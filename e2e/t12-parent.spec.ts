import { test, expect } from "@playwright/test";
import { loginAsParent } from "./helpers";

test.describe("T12: Parent Portal", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsParent(page);
  });

  test("T12-01: Parent login redirects to dashboard", async ({ page }) => {
    await expect(page).toHaveURL(/dashboard/);
  });

  test("T12-02: Parent sees portail parent in sidebar", async ({ page }) => {
    await expect(page.locator('text=Portail Parent')).toBeVisible({ timeout: 5000 });
  });

  test("T12-03: Parent portal page loads", async ({ page }) => {
    await page.goto("/dashboard/portail-parent");
    await expect(page).toHaveURL(/portail-parent/);
  });
});
