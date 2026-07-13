import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

test.describe("T14: RH & Personnel", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("T14-01: Contrats page loads", async ({ page }) => {
    await page.goto("/dashboard/contrats");
    await expect(page.locator("text=Contrat").or(page.locator("text=Congé"))).toBeVisible({ timeout: 10000 });
  });

  test("T14-02: Pointage page loads", async ({ page }) => {
    await page.goto("/dashboard/rh/pointage");
    await expect(page.locator("text=Pointage").or(page.locator("text=Présence"))).toBeVisible({ timeout: 10000 });
  });

  test("T14-03: Paie page loads", async ({ page }) => {
    await page.goto("/dashboard/rh/paie");
    await expect(page.locator("text=Paie").or(page.locator("text=Salaire"))).toBeVisible({ timeout: 10000 });
  });

  test("T14-04: Formations page loads", async ({ page }) => {
    await page.goto("/dashboard/rh/formations");
    await expect(page.locator("text=Formation")).toBeVisible({ timeout: 10000 });
  });

  test("T14-05: Teacher evaluations page loads", async ({ page }) => {
    await page.goto("/dashboard/teacher-evaluations");
    await expect(page.locator("text=Évaluation").or(page.locator("text=Evaluation"))).toBeVisible({ timeout: 10000 });
  });
});
