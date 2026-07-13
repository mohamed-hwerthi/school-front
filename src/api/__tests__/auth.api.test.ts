import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { authApi } from "@/api/auth.api";
import api from "@/api/axios";

// Mock the axios instance
vi.mock("@/api/axios", () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("authApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe("login", () => {
    it("should send POST to /auth/login with email and password", async () => {
      const mockResponse = {
        data: {
          accessToken: "jwt-token",
          refreshToken: "refresh-token",
          tokenType: "Bearer",
          expiresIn: 900,
          user: {
            id: 1,
            email: "admin@school.com",
            firstName: "Admin",
            lastName: "User",
            role: "ADMIN",
            tenantId: "school1",
            isActive: true,
          },
          twoFactorRequired: false,
          twoFactorUserId: null,
        },
      };

      vi.mocked(api.post).mockResolvedValue(mockResponse);

      const result = await authApi.login({
        email: "admin@school.com",
        password: "password123",
      });

      expect(api.post).toHaveBeenCalledWith("/auth/login", {
        email: "admin@school.com",
        password: "password123",
      });
      expect(result.accessToken).toBe("jwt-token");
      expect(result.user.email).toBe("admin@school.com");
    });

    it("should propagate errors from API", async () => {
      vi.mocked(api.post).mockRejectedValue(new Error("Invalid credentials"));

      await expect(
        authApi.login({ email: "wrong@email.com", password: "wrong" })
      ).rejects.toThrow("Invalid credentials");
    });
  });

  describe("refreshToken", () => {
    it("should send POST to /auth/refresh-token", async () => {
      const mockResponse = {
        data: {
          accessToken: "new-jwt-token",
          refreshToken: "new-refresh-token",
          tokenType: "Bearer",
          expiresIn: 900,
          user: {
            id: 1,
            email: "admin@school.com",
            firstName: "Admin",
            lastName: "User",
            role: "ADMIN",
            tenantId: "school1",
            isActive: true,
          },
        },
      };

      vi.mocked(api.post).mockResolvedValue(mockResponse);

      const result = await authApi.refreshToken({
        refreshToken: "old-refresh-token",
      });

      expect(api.post).toHaveBeenCalledWith("/auth/refresh-token", {
        refreshToken: "old-refresh-token",
      });
      expect(result.accessToken).toBe("new-jwt-token");
    });
  });

  describe("logout", () => {
    it("should send POST to /auth/logout with refresh token", async () => {
      vi.mocked(api.post).mockResolvedValue({ data: null });

      await authApi.logout("my-refresh-token");

      expect(api.post).toHaveBeenCalledWith("/auth/logout", {
        refreshToken: "my-refresh-token",
      });
    });
  });

  describe("getMe", () => {
    it("should send GET to /auth/me", async () => {
      const mockUser = {
        id: 1,
        email: "admin@school.com",
        firstName: "Admin",
        lastName: "User",
        role: "ADMIN",
        tenantId: "school1",
        isActive: true,
      };

      vi.mocked(api.get).mockResolvedValue({ data: mockUser });

      const result = await authApi.getMe();

      expect(api.get).toHaveBeenCalledWith("/auth/me");
      expect(result.email).toBe("admin@school.com");
    });
  });

  describe("forgotPassword", () => {
    it("should send POST to /auth/forgot-password with email", async () => {
      vi.mocked(api.post).mockResolvedValue({ data: "Email sent" });

      const result = await authApi.forgotPassword("user@school.com");

      expect(api.post).toHaveBeenCalledWith("/auth/forgot-password", {
        email: "user@school.com",
      });
      expect(result).toBe("Email sent");
    });
  });

  describe("resetPassword", () => {
    it("should send POST to /auth/reset-password with token and new password", async () => {
      vi.mocked(api.post).mockResolvedValue({ data: "Password reset successfully" });

      const result = await authApi.resetPassword("reset-token-123", "newPassword456");

      expect(api.post).toHaveBeenCalledWith("/auth/reset-password", {
        token: "reset-token-123",
        newPassword: "newPassword456",
      });
      expect(result).toBe("Password reset successfully");
    });
  });

  describe("2FA endpoints", () => {
    it("enable2FA should send POST to /auth/2fa/enable", async () => {
      const mockResponse = {
        data: {
          secret: "TOTP_SECRET",
          qrCodeUri: "otpauth://totp/...",
        },
      };

      vi.mocked(api.post).mockResolvedValue(mockResponse);

      const result = await authApi.enable2FA();

      expect(api.post).toHaveBeenCalledWith("/auth/2fa/enable");
      expect(result.secret).toBe("TOTP_SECRET");
    });

    it("verify2FA should send POST to /auth/2fa/verify", async () => {
      const mockResponse = {
        data: {
          accessToken: "jwt-token",
          refreshToken: "refresh-token",
          tokenType: "Bearer",
          expiresIn: 900,
          user: { id: 1 },
        },
      };

      vi.mocked(api.post).mockResolvedValue(mockResponse);

      await authApi.verify2FA({ userId: 1, code: "123456" });

      expect(api.post).toHaveBeenCalledWith("/auth/2fa/verify", {
        userId: 1,
        code: "123456",
      });
    });

    it("confirm2FA should send POST to /auth/2fa/confirm", async () => {
      vi.mocked(api.post).mockResolvedValue({ data: null });

      await authApi.confirm2FA("654321");

      expect(api.post).toHaveBeenCalledWith("/auth/2fa/confirm", {
        code: "654321",
      });
    });

    it("disable2FA should send POST to /auth/2fa/disable", async () => {
      vi.mocked(api.post).mockResolvedValue({ data: null });

      await authApi.disable2FA("654321");

      expect(api.post).toHaveBeenCalledWith("/auth/2fa/disable", {
        code: "654321",
      });
    });
  });

  describe("session management", () => {
    it("getSessions should send GET to /auth/sessions with refresh token header", async () => {
      localStorage.setItem("refreshToken", "current-refresh-token");

      const mockSessions = [
        {
          id: 1,
          deviceName: "Chrome",
          ipAddress: "127.0.0.1",
          lastUsedAt: "2026-03-12T10:00:00",
          createdAt: "2026-03-10T08:00:00",
          current: true,
        },
      ];

      vi.mocked(api.get).mockResolvedValue({ data: mockSessions });

      const result = await authApi.getSessions();

      expect(api.get).toHaveBeenCalledWith("/auth/sessions", {
        headers: { "X-Current-Refresh-Token": "current-refresh-token" },
      });
      expect(result).toHaveLength(1);
      expect(result[0].current).toBe(true);
    });

    it("revokeSession should send DELETE to /auth/sessions/:id", async () => {
      vi.mocked(api.delete).mockResolvedValue({ data: null });

      await authApi.revokeSession(5);

      expect(api.delete).toHaveBeenCalledWith("/auth/sessions/5");
    });

    it("revokeAllSessions should send DELETE to /auth/sessions with header", async () => {
      localStorage.setItem("refreshToken", "my-token");
      vi.mocked(api.delete).mockResolvedValue({ data: null });

      await authApi.revokeAllSessions();

      expect(api.delete).toHaveBeenCalledWith("/auth/sessions", {
        headers: { "X-Current-Refresh-Token": "my-token" },
      });
    });
  });
});
