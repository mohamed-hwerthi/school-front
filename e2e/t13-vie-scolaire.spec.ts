import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

test.describe("T13: Vie Scolaire", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("T13-01: Bibliotheque page loads", async ({ page }) => {
    await page.goto("/dashboard/bibliotheque");
    await expect(page.locator("text=Biblioth").or(page.locator("text=Livre"))).toBeVisible({ timeout: 10000 });
  });

  test("T13-03: Transport page loads", async ({ page }) => {
    await page.goto("/dashboard/transport");
    await expect(page.locator("text=Transport").or(page.locator("text=Circuit"))).toBeVisible({ timeout: 10000 });
  });

  test("T13-04: Cantine page loads", async ({ page }) => {
    await page.goto("/dashboard/cantine");
    await expect(page.locator("text=Cantine").or(page.locator("text=Menu"))).toBeVisible({ timeout: 10000 });
  });

  test("T13-06: Devoirs page loads", async ({ page }) => {
    await page.goto("/dashboard/devoirs");
    await expect(page.locator("text=Devoir")).toBeVisible({ timeout: 10000 });
  });

  test("T13-07: Quiz page loads", async ({ page }) => {
    await page.goto("/dashboard/quiz");
    await expect(page.locator("text=Quiz").or(page.locator("text=Examen"))).toBeVisible({ timeout: 10000 });
  });
});
