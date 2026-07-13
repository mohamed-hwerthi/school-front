import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

test.describe("T5: Emploi du temps", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("T5-01: EDT page loads", async ({ page }) => {
    await page.goto("/dashboard/emploi-du-temps");
    await expect(page.locator("text=Emploi").or(page.locator("text=temps"))).toBeVisible({ timeout: 10000 });
  });

  test("T5-06: Salles page loads", async ({ page }) => {
    await page.goto("/dashboard/emploi-salles");
    await expect(page).toHaveURL(/emploi-salles/);
  });
});
