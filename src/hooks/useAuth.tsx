import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { authApi } from "@/api/auth.api";
import type { AuthUser, LoginRequest, LoginResponse } from "@/types/auth";
import { notify } from "@/lib/toast";

interface TwoFactorPending {
  userId: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  twoFactorPending: TwoFactorPending | null;
  login: (data: LoginRequest) => Promise<LoginResponse>;
  verify2FA: (userId: string, code: string) => Promise<void>;
  cancelTwoFactor: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const TOKEN_KEY = "token";
const REFRESH_TOKEN_KEY = "refreshToken";
const USER_KEY = "user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem(USER_KEY);
    return stored ? JSON.parse(stored) : null;
  });
  const [isLoading, setIsLoading] = useState(true);
  const [twoFactorPending, setTwoFactorPending] = useState<TwoFactorPending | null>(null);

  const isAuthenticated = !!user && !!localStorage.getItem(TOKEN_KEY);

  // Verify token on mount
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setIsLoading(false);
      return;
    }

    authApi
      .getMe()
      .then((userData) => {
        setUser(userData);
        localStorage.setItem(USER_KEY, JSON.stringify(userData));
      })
      .catch(() => {
        clearAuth();
      })
      .finally(() => setIsLoading(false));
  }, []);

  const clearAuth = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
    setTwoFactorPending(null);
  }, []);

  const storeTokens = useCallback((response: LoginResponse) => {
    localStorage.setItem(TOKEN_KEY, response.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(response.user));
    setUser(response.user);
    setTwoFactorPending(null);
  }, []);

  const login = useCallback(async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await authApi.login(data);

    if (response.twoFactorRequired && response.twoFactorUserId) {
      // 2FA is required — don't store tokens yet
      setTwoFactorPending({ userId: response.twoFactorUserId });
      return response;
    }

    // No 2FA — store tokens directly
    storeTokens(response);
    return response;
  }, [storeTokens]);

  const verify2FA = useCallback(async (userId: string, code: string) => {
    const response = await authApi.verify2FA({ userId, code });
    storeTokens(response);
  }, [storeTokens]);

  const cancelTwoFactor = useCallback(() => {
    setTwoFactorPending(null);
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (refreshToken) {
      try {
        await authApi.logout(refreshToken);
      } catch {
        // Ignore logout API errors
      }
    }
    clearAuth();
    notify.info("Vous avez ete deconnecte");
  }, [clearAuth]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        twoFactorPending,
        login,
        verify2FA,
        cancelTwoFactor,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
