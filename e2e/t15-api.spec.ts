import { test, expect, request } from "@playwright/test";

const API = "http://localhost:8080/api";
const TENANT_HEADER = { "X-Tenant-ID": "demo_school" };

test.describe("T15: API Backend", () => {
  let token: string;

  test.beforeAll(async () => {
    const ctx = await request.newContext();
    const res = await ctx.post(`${API}/auth/login`, {
      headers: TENANT_HEADER,
      data: { email: "admin@school.dev", password: "admin123" },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    // Backend wraps in ApiResponse: { success, data: { accessToken, ... }, message }
    token = body.data?.accessToken || body.accessToken;
    expect(token).toBeTruthy();
  });

  test("T15-01: Login returns 200 with tokens", async () => {
    // Verify the token obtained in beforeAll is valid
    expect(token).toBeTruthy();
    expect(token.split(".").length).toBe(3); // JWT has 3 parts
  });

  test("T15-02: Login with wrong password returns error", async () => {
    const ctx = await request.newContext();
    const res = await ctx.post(`${API}/auth/login`, {
      headers: TENANT_HEADER,
      data: { email: "admin@school.dev", password: "wrong" },
    });
    // Should not succeed
    const body = await res.json();
    if (res.ok()) {
      expect(body.success).toBe(false);
    } else {
      expect(res.status()).toBeGreaterThanOrEqual(400);
    }
  });

  test("T15-04: GET /auth/me without token returns 401 or 403", async () => {
    const ctx = await request.newContext();
    const res = await ctx.get(`${API}/auth/me`, {
      headers: TENANT_HEADER,
    });
    expect([401, 403]).toContain(res.status());
  });

  test("T15-05: GET /auth/me with token returns 200 and user data", async () => {
    const ctx = await request.newContext();
    const res = await ctx.get(`${API}/auth/me`, {
      headers: {
        ...TENANT_HEADER,
        Authorization: `Bearer ${token}`,
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data?.email || body.email).toBeTruthy();
  });

  test("T15-09: GET /tenants returns tenant list", async () => {
    const ctx = await request.newContext();
    const res = await ctx.get(`${API}/tenants`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    const tenants = body.data;
    expect(Array.isArray(tenants)).toBe(true);
    expect(tenants.length).toBeGreaterThan(0);
  });
});
