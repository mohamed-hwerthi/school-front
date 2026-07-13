import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

test.describe("T8: Inscriptions", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("T8-01: Public inscription page loads", async ({ page }) => {
    await page.goto("/inscription");
    await expect(page.locator("text=Inscription").or(page.locator("text=inscription"))).toBeVisible({ timeout: 10000 });
  });

  test("T8-02: Admin inscriptions page loads", async ({ page }) => {
    await page.goto("/dashboard/inscriptions");
    await expect(page).toHaveURL(/inscriptions/);
  });
});
