import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { authApi } from "@/api/auth.api";
import type { LoginResponse, AuthUser } from "@/types/auth";

// ── Mock auth API ───────────────────────────────────────────────────────────────
vi.mock("@/api/auth.api", () => ({
  authApi: {
    login: vi.fn(),
    logout: vi.fn(),
    getMe: vi.fn(),
    refreshToken: vi.fn(),
    verify2FA: vi.fn(),
  },
}));

// ── Mock sonner ─────────────────────────────────────────────────────────────────
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

const mockUser: AuthUser = {
  id: 1,
  email: "admin@school.com",
  firstName: "Admin",
  lastName: "User",
  role: "ADMIN",
  tenantId: "school1",
  isActive: true,
};

const mockLoginResponse: LoginResponse = {
  accessToken: "jwt-access-token",
  refreshToken: "uuid-refresh-token",
  tokenType: "Bearer",
  expiresIn: 900,
  user: mockUser,
  twoFactorRequired: false,
  twoFactorUserId: null,
};

function wrapper({ children }: { children: ReactNode }) {
  return createElement(AuthProvider, null, children);
}

describe("useAuth hook (test/hooks)", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    // Default: getMe rejects (no valid session)
    vi.mocked(authApi.getMe).mockRejectedValue(new Error("Unauthorized"));
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("starts with isLoading true", () => {
    // Do NOT set a token — getMe will not be called, but isLoading starts true
    // until the useEffect runs
    localStorage.setItem("token", "some-token");

    const { result } = renderHook(() => useAuth(), { wrapper });

    // On the very first render, isLoading is true (the useEffect hasn't resolved yet)
    expect(result.current.isLoading).toBe(true);
  });

  it("isAuthenticated is false when no token", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it("login stores token and user", async () => {
    vi.mocked(authApi.login).mockResolvedValue(mockLoginResponse);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.login({
        email: "admin@school.com",
        password: "password123",
      });
    });

    expect(localStorage.getItem("token")).toBe("jwt-access-token");
    expect(localStorage.getItem("refreshToken")).toBe("uuid-refresh-token");
    expect(localStorage.getItem("user")).toBe(JSON.stringify(mockUser));
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it("logout clears stored data", async () => {
    // Set up authenticated state
    localStorage.setItem("token", "jwt-access-token");
    localStorage.setItem("refreshToken", "uuid-refresh-token");
    localStorage.setItem("user", JSON.stringify(mockUser));

    vi.mocked(authApi.getMe).mockResolvedValue(mockUser);
    vi.mocked(authApi.logout).mockResolvedValue();

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Confirm authenticated before logout
    expect(result.current.isAuthenticated).toBe(true);

    await act(async () => {
      await result.current.logout();
    });

    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("refreshToken")).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });
});
