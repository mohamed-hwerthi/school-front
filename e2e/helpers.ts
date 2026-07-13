import { type Page } from "@playwright/test";

/**
 * Login helper with automatic rate-limit retry.
 * The backend enforces 10 POST /api/auth/* requests per minute per IP.
 * If login fails, this helper waits and retries.
 */
export async function login(page: Page, email: string, password: string) {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  const emailInput = page
    .locator('input[placeholder="nom@ecole.fr"]')
    .or(page.locator('input[type="email"]'))
    .first();
  await emailInput.waitFor({ timeout: 10000 });
  await emailInput.fill(email);

  const passInput = page
    .locator('input[type="password"]')
    .or(page.locator('input[placeholder="••••••••"]'))
    .first();
  await passInput.fill(password);

  await page.locator('button:has-text("Se connecter")').click();

  // Try to reach dashboard; if rate-limited, retry after waiting
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await page.waitForURL(/\/dashboard/, { timeout: 10000 });
      return; // success
    } catch {
      // Check for error indicators (rate limit or network error)
      const errorVisible = await page
        .locator("text=Network Error")
        .or(page.locator("text=Trop de"))
        .or(page.locator("text=réessayez"))
        .or(page.locator("text=incorrects"))
        .first()
        .isVisible({ timeout: 1000 })
        .catch(() => false);

      if (!errorVisible && attempt === 0) {
        // Maybe just slow — wait a bit more
        try {
          await page.waitForURL(/\/dashboard/, { timeout: 5000 });
          return;
        } catch {
          // fall through to retry
        }
      }

      if (attempt < 2) {
        // Wait for rate limit to partially reset, then retry
        await page.waitForTimeout(15000);
        await emailInput.fill(email);
        await passInput.fill(password);
        await page.locator('button:has-text("Se connecter")').click();
      }
    }
  }

  throw new Error(`Login failed for ${email} after retries`);
}

export async function loginAsAdmin(page: Page) {
  return login(page, "admin@school.dev", "admin123");
}

export async function loginAsDirecteur(page: Page) {
  return login(page, "directeur@school.dev", "directeur123");
}

export async function loginAsProf(page: Page) {
  return login(page, "prof@school.dev", "prof123");
}

export async function loginAsComptable(page: Page) {
  return login(page, "comptable@school.dev", "comptable123");
}

export async function loginAsParent(page: Page) {
  return login(page, "parent@school.dev", "parent123");
}
