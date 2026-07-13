import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

test.describe("T4: Notes & Bulletins", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("T4-01: Carnet notes page loads with tabs", async ({ page }) => {
    await page.goto("/dashboard/carnets");
    await expect(page.locator("text=Notes").or(page.locator("text=Carnet"))).toBeVisible({ timeout: 10000 });
  });

  test("T4-04: Evaluations page loads", async ({ page }) => {
    await page.goto("/dashboard/evaluations");
    await expect(page.locator("text=Évaluation").or(page.locator("text=Evaluation"))).toBeVisible({ timeout: 10000 });
  });

  test("T4-09: Bulletin templates page loads", async ({ page }) => {
    await page.goto("/dashboard/bulletin-templates");
    await expect(page.locator("text=Template").or(page.locator("text=Bulletin"))).toBeVisible({ timeout: 10000 });
  });

  test("T4-10: Stats reussite page loads", async ({ page }) => {
    await page.goto("/dashboard/stats-reussite");
    await expect(page).toHaveURL(/stats-reussite/);
  });

  test("T4-08: Bulletins masse page loads", async ({ page }) => {
    await page.goto("/dashboard/bulletins-masse");
    await expect(page.locator("text=Bulletin").or(page.locator("text=masse"))).toBeVisible({ timeout: 10000 });
  });
});
