import api from "./axios";
import type {
  LoginRequest,
  LoginResponse,
  AuthUser,
  MeResponse,
  RefreshTokenRequest,
  Enable2FAResponse,
  Verify2FALoginRequest,
  Session,
} from "@/types/auth";

export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>("/auth/login", data);
    return response.data;
  },

  refreshToken: async (data: RefreshTokenRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>("/auth/refresh-token", data);
    return response.data;
  },

  logout: async (refreshToken: string): Promise<void> => {
    await api.post("/auth/logout", { refreshToken });
  },

  getMe: async (): Promise<AuthUser> => {
    const response = await api.get<MeResponse>("/auth/me");
    const { user, permissions, scopedClasseIds, scopedStudentIds } = response.data;
    return {
      ...user,
      permissions,
      scopedClasseIds,
      scopedStudentIds,
    };
  },

  forgotPassword: async (email: string): Promise<string> => {
    const response = await api.post<string>("/auth/forgot-password", { email });
    return response.data;
  },

  resetPassword: async (token: string, newPassword: string): Promise<string> => {
    const response = await api.post<string>("/auth/reset-password", { token, newPassword });
    return response.data;
  },

  // ─── 2FA ────────────────────────────────────────────────────

  enable2FA: async (): Promise<Enable2FAResponse> => {
    const response = await api.post<Enable2FAResponse>("/auth/2fa/enable");
    return response.data;
  },

  confirm2FA: async (code: string): Promise<void> => {
    await api.post("/auth/2fa/confirm", { code });
  },

  verify2FA: async (data: Verify2FALoginRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>("/auth/2fa/verify", data);
    return response.data;
  },

  disable2FA: async (code: string): Promise<void> => {
    await api.post("/auth/2fa/disable", { code });
  },

  // ─── Session management ───────────────────────────────────

  getSessions: async (): Promise<Session[]> => {
    const refreshToken = localStorage.getItem("refreshToken") || "";
    const response = await api.get<Session[]>("/auth/sessions", {
      headers: { "X-Current-Refresh-Token": refreshToken },
    });
    return response.data;
  },

  revokeSession: async (sessionId: string): Promise<void> => {
    await api.delete(`/auth/sessions/${sessionId}`);
  },

  revokeAllSessions: async (): Promise<void> => {
    const refreshToken = localStorage.getItem("refreshToken") || "";
    await api.delete("/auth/sessions", {
      headers: { "X-Current-Refresh-Token": refreshToken },
    });
  },
};
