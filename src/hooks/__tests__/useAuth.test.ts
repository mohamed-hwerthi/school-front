import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { authApi } from "@/api/auth.api";
import type { LoginResponse, AuthUser } from "@/types/auth";

// Mock the auth API
vi.mock("@/api/auth.api", () => ({
  authApi: {
    login: vi.fn(),
    logout: vi.fn(),
    getMe: vi.fn(),
    refreshToken: vi.fn(),
    verify2FA: vi.fn(),
  },
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
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

describe("useAuth", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    // Default: getMe rejects (no valid session)
    vi.mocked(authApi.getMe).mockRejectedValue(new Error("Unauthorized"));
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("should throw when used outside AuthProvider", () => {
    expect(() => {
      renderHook(() => useAuth());
    }).toThrow("useAuth must be used within AuthProvider");
  });

  it("should have initial state with no user and not authenticated", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  describe("login", () => {
    it("should call authApi.login with correct payload", async () => {
      vi.mocked(authApi.login).mockResolvedValue(mockLoginResponse);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.login({
          email: "admin@school.com",
          password: "password123",
        });
      });

      expect(authApi.login).toHaveBeenCalledWith({
        email: "admin@school.com",
        password: "password123",
      });
    });

    it("should store tokens and user on successful login", async () => {
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
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it("should set twoFactorPending when 2FA is required", async () => {
      const twoFactorResponse: LoginResponse = {
        ...mockLoginResponse,
        accessToken: "",
        refreshToken: "",
        twoFactorRequired: true,
        twoFactorUserId: 1,
        user: undefined as unknown as AuthUser,
      };

      vi.mocked(authApi.login).mockResolvedValue(twoFactorResponse);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.login({
          email: "admin@school.com",
          password: "password123",
        });
      });

      expect(result.current.twoFactorPending).toEqual({ userId: 1 });
      expect(localStorage.getItem("token")).toBeNull();
    });
  });

  describe("logout", () => {
    it("should clear tokens and user on logout", async () => {
      // Set up initial authenticated state
      localStorage.setItem("token", "jwt-access-token");
      localStorage.setItem("refreshToken", "uuid-refresh-token");
      localStorage.setItem("user", JSON.stringify(mockUser));

      vi.mocked(authApi.getMe).mockResolvedValue(mockUser);
      vi.mocked(authApi.logout).mockResolvedValue();

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.logout();
      });

      expect(localStorage.getItem("token")).toBeNull();
      expect(localStorage.getItem("refreshToken")).toBeNull();
      expect(localStorage.getItem("user")).toBeNull();
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it("should call authApi.logout with refresh token", async () => {
      localStorage.setItem("token", "jwt-access-token");
      localStorage.setItem("refreshToken", "uuid-refresh-token");
      localStorage.setItem("user", JSON.stringify(mockUser));

      vi.mocked(authApi.getMe).mockResolvedValue(mockUser);
      vi.mocked(authApi.logout).mockResolvedValue();

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.logout();
      });

      expect(authApi.logout).toHaveBeenCalledWith("uuid-refresh-token");
    });

    it("should still clear auth even if logout API fails", async () => {
      localStorage.setItem("token", "jwt-access-token");
      localStorage.setItem("refreshToken", "uuid-refresh-token");
      localStorage.setItem("user", JSON.stringify(mockUser));

      vi.mocked(authApi.getMe).mockResolvedValue(mockUser);
      vi.mocked(authApi.logout).mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe("verify on mount", () => {
    it("should verify token on mount when token exists", async () => {
      localStorage.setItem("token", "existing-token");
      vi.mocked(authApi.getMe).mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(authApi.getMe).toHaveBeenCalled();
      expect(result.current.user).toEqual(mockUser);
    });

    it("should clear auth when token verification fails", async () => {
      localStorage.setItem("token", "invalid-token");
      localStorage.setItem("user", JSON.stringify(mockUser));
      vi.mocked(authApi.getMe).mockRejectedValue(new Error("Unauthorized"));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.user).toBeNull();
      expect(localStorage.getItem("token")).toBeNull();
    });
  });
});
