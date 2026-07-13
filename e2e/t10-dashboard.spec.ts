import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

test.describe("T10: Dashboard & Analytics", () => {
  // Extend timeout to handle backend rate limiting on login
  test.describe.configure({ timeout: 60_000 });
  test("T10-01: Dashboard shows stats cards", async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page).toHaveURL(/dashboard/);
    // Wait for page to fully load (skeleton or real content)
    await page.waitForLoadState("networkidle");
    // Dashboard should render the main stat card labels
    await expect(
      page.locator("text=Total Élèves").or(page.locator("text=Enseignants")).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("T10-06: Calendar page loads", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/dashboard/calendrier");
    await page.waitForLoadState("networkidle");
    // Calendar should show the page title "Calendrier Scolaire"
    await expect(
      page.locator("text=Calendrier Scolaire")
    ).toBeVisible({ timeout: 5000 });
  });
});
