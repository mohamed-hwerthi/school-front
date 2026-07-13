import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

test.describe("T7: Absences & Discipline", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("T7-01: Absences page loads", async ({ page }) => {
    await page.goto("/dashboard/absences");
    await expect(page.locator("text=Absence").or(page.locator("text=Présence"))).toBeVisible({ timeout: 10000 });
  });

  test("T7-05: Discipline page loads", async ({ page }) => {
    await page.goto("/dashboard/discipline");
    await expect(page.locator("text=Discipline").or(page.locator("text=Incident"))).toBeVisible({ timeout: 10000 });
  });
});
