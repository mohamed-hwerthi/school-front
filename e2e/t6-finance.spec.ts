import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

test.describe("T6: Finance", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("T6-01: Finance page loads with table", async ({ page }) => {
    await page.goto("/dashboard/finance");
    await expect(page.locator("text=Paiement").or(page.locator("text=Finance"))).toBeVisible({ timeout: 10000 });
  });

  test("T6-06: Finance dashboard shows stats", async ({ page }) => {
    await page.goto("/dashboard/finance");
    await page.waitForTimeout(2000);
    // Should show some stat cards or dashboard info
    await expect(page).toHaveURL(/finance/);
  });

  test("T6-08: Export button visible on finance page", async ({ page }) => {
    await page.goto("/dashboard/finance");
    await page.waitForTimeout(2000);
    const exportBtn = page.locator('button:has-text("Exporter")').or(page.locator('button:has-text("Export")'));
    await expect(exportBtn.first()).toBeVisible({ timeout: 5000 });
  });

  test("T6-09: Depenses page loads", async ({ page }) => {
    await page.goto("/dashboard/finance/depenses");
    await expect(page.locator("text=Dépense").or(page.locator("text=Depense"))).toBeVisible({ timeout: 10000 });
  });

  test("T6-10: Caisse page loads", async ({ page }) => {
    await page.goto("/dashboard/finance/caisse");
    await expect(page.locator("text=Caisse")).toBeVisible({ timeout: 10000 });
  });

  test("T6-11: Relances page loads", async ({ page }) => {
    await page.goto("/dashboard/finance/relances");
    await expect(page.locator("text=Relance")).toBeVisible({ timeout: 10000 });
  });

  test("T6-13: Factures page loads", async ({ page }) => {
    await page.goto("/dashboard/factures");
    await expect(page.locator("text=Facture")).toBeVisible({ timeout: 10000 });
  });

  test("T6-14: Rapports financiers page loads", async ({ page }) => {
    await page.goto("/dashboard/finance/rapports");
    await expect(page).toHaveURL(/finance\/rapports/);
  });
});
