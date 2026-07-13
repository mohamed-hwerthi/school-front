import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

test.describe("T11: Admin & Configuration", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("T11-01: School info page loads", async ({ page }) => {
    await page.goto("/dashboard/ecole");
    await expect(page.locator("text=cole").or(page.locator("text=Ecole"))).toBeVisible({ timeout: 10000 });
  });

  test("T11-02: Niveaux page loads", async ({ page }) => {
    await page.goto("/dashboard/config/niveaux");
    await expect(page.locator("text=Niveau").or(page.locator("text=Classe"))).toBeVisible({ timeout: 10000 });
  });

  test("T11-03: Utilisateurs page loads", async ({ page }) => {
    await page.goto("/dashboard/utilisateurs");
    await expect(page.locator("text=Utilisateur").or(page.locator("text=utilisateur"))).toBeVisible({ timeout: 10000 });
  });

  test("T11-04: Configuration page loads", async ({ page }) => {
    await page.goto("/dashboard/configuration");
    await expect(page).toHaveURL(/configuration/);
  });

  test("T11-05: Tracabilite page loads", async ({ page }) => {
    await page.goto("/dashboard/tracabilite");
    await expect(page.locator("text=Traçabilité").or(page.locator("text=Tracabilite").or(page.locator("text=audit")))).toBeVisible({ timeout: 10000 });
  });

  test("T11-06: Super admin page loads", async ({ page }) => {
    await page.goto("/dashboard/super-admin");
    await expect(page).toHaveURL(/super-admin/);
  });
});
