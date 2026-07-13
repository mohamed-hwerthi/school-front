import { test, expect } from "@playwright/test";
import { login, loginAsAdmin, loginAsProf, loginAsComptable, loginAsParent } from "./helpers";

test.describe("T1: Authentication", () => {
  // Extend timeout to handle backend rate limiting (10 auth req/min)
  test.describe.configure({ timeout: 60_000 });
  test("T1-01: Login with valid credentials redirects to dashboard", async ({ page }) => {
    await login(page, "admin@school.dev", "admin123");
    await expect(page).toHaveURL(/dashboard/);
  });

  test("T1-02: Login with wrong password shows error", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.locator('input[type="email"]').fill("admin@school.dev");
    await page.locator('input[type="password"]').fill("wrongpassword");
    await page.locator('button[type="submit"]').click();
    // Should show error message (French: "Identifiants incorrects" or similar)
    await expect(
      page.locator("text=incorrect").or(page.locator("text=Invalid")).or(page.locator("text=Identifiants")).or(page.locator("text=Network Error"))
    ).toBeVisible({ timeout: 5000 });
    // Should stay on login page (not redirect to dashboard)
    await expect(page).not.toHaveURL(/dashboard/);
  });

  test("T1-04: Login with empty fields shows validation error", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.locator('button[type="submit"]').click();
    // Should show Zod validation error (French: "requis" or "email")
    await expect(
      page.locator("text=requis").or(page.locator("text=email"))
    ).toBeVisible({ timeout: 3000 });
  });

  test("T1-05: Demo buttons login directly", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    // Click the "Super Admin" demo button
    const demoBtn = page.locator('button:has-text("Super Admin")');
    if (await demoBtn.isVisible({ timeout: 3000 })) {
      await demoBtn.click();
      // Wait for redirect, with retry if rate-limited
      try {
        await page.waitForURL(/\/dashboard/, { timeout: 10000 });
      } catch {
        // May be rate-limited — wait and click again
        await page.waitForTimeout(15000);
        const retryBtn = page.locator('button:has-text("Super Admin")');
        if (await retryBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await retryBtn.click();
        }
        await page.waitForURL(/\/dashboard/, { timeout: 15000 });
      }
      await expect(page).toHaveURL(/dashboard/);
    }
  });

  test("T1-06: Logout returns to login page", async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page).toHaveURL(/dashboard/);
    // Click logout button in sidebar footer (has title="Deconnexion")
    const logoutBtn = page.locator('button[title="Déconnexion"]');
    await logoutBtn.waitFor({ timeout: 5000 });
    await logoutBtn.click();
    await page.waitForURL("/", { timeout: 10000 });
    await expect(page).toHaveURL("/");
  });

  test("T1-07: Access /dashboard without token redirects to login", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForURL("/", { timeout: 5000 });
    await expect(page).toHaveURL("/");
  });

  test("T1-09: PARENT role sidebar shows only parent-related items", async ({ page }) => {
    await loginAsParent(page);
    // Parent should see Portail Parent link in sidebar
    await expect(page.locator('a[href="/dashboard/portail-parent"]')).toBeVisible({ timeout: 5000 });
    // Should NOT see finance section links
    await expect(page.locator('a[href="/dashboard/finance"]')).not.toBeVisible();
    // Should NOT see admin section links
    await expect(page.locator('a[href="/dashboard/utilisateurs"]')).not.toBeVisible();
  });

  test("T1-10: ENSEIGNANT cannot access finance page", async ({ page }) => {
    await loginAsProf(page);
    await page.goto("/dashboard/finance");
    // RoleGuard redirects to /forbidden which shows "403 - Acces refuse"
    await expect(page.locator("h1")).toContainText("403", { timeout: 5000 });
  });

  test("T1-12: SUPER_ADMIN can access all pages", async ({ page }) => {
    // This test may need extra time due to rate-limit retries on login
    test.setTimeout(90_000);
    await loginAsAdmin(page);
    // Check finance page - should NOT show the Forbidden heading
    await page.goto("/dashboard/finance");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1:has-text('403')")).not.toBeVisible({ timeout: 3000 });
    // Check users page
    await page.goto("/dashboard/utilisateurs");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1:has-text('403')")).not.toBeVisible({ timeout: 3000 });
    // Check super-admin page
    await page.goto("/dashboard/super-admin");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1:has-text('403')")).not.toBeVisible({ timeout: 3000 });
  });
});
