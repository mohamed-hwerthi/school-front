import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

test.describe("T9: Communication", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("T9-01: Annonces page loads", async ({ page }) => {
    await page.goto("/dashboard/annonces");
    await expect(page.locator("text=Annonce")).toBeVisible({ timeout: 10000 });
  });

  test("T9-02: Notifications page loads", async ({ page }) => {
    await page.goto("/dashboard/notifications");
    await expect(page.locator("text=Notification")).toBeVisible({ timeout: 10000 });
  });

  test("T9-03: Circulaires page loads", async ({ page }) => {
    await page.goto("/dashboard/circulaires");
    await expect(page.locator("text=Circulaire")).toBeVisible({ timeout: 10000 });
  });

  test("T9-04: Reunions page loads", async ({ page }) => {
    await page.goto("/dashboard/reunions");
    await expect(page.locator("text=Réunion").or(page.locator("text=Reunion"))).toBeVisible({ timeout: 10000 });
  });
});
