import axios from "axios";
import env from "@/config/env";

const api = axios.create({
  baseURL: env.API_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor — attach tenant + auth token
api.interceptors.request.use((config) => {
  // Multi-tenant header — prefer the logged-in user's tenant; fall back to build-time default
  let tenantId: string | undefined = env.TENANT_ID;
  try {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsed = JSON.parse(storedUser) as { tenantId?: string };
      if (parsed?.tenantId) tenantId = parsed.tenantId;
    }
  } catch {
    // ignore — fall back to env default
  }
  if (tenantId) {
    config.headers["X-Tenant-ID"] = tenantId;
  }

  // Auth token
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // School year header
  const anneeScolaire = localStorage.getItem("selected_annee_label");
  if (anneeScolaire) {
    config.headers["X-Annee-Scolaire"] = anneeScolaire;
  }

  return config;
});

// Track if we're already refreshing to prevent infinite loops
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null) => {
  failedQueue.forEach((p) => {
    if (error) {
      p.reject(error);
    } else {
      p.resolve(token!);
    }
  });
  failedQueue = [];
};

// Response interceptor — unwrap ApiResponse + handle refresh token
api.interceptors.response.use(
  (response) => {
    const body = response.data;
    if (body && typeof body === "object" && "success" in body) {
      if (!body.success) {
        return Promise.reject(new Error(body.message || "Erreur serveur"));
      }
      response.data = body.data;
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retrying, try refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      const refreshToken = localStorage.getItem("refreshToken");
      const hadToken = !!localStorage.getItem("token");

      // No refresh token or it's the auth endpoint itself — redirect to login
      if (!refreshToken || originalRequest.url?.includes("/auth/")) {
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        // Only force-redirect anonymous visitors away from auth-protected
        // pages — public pages (vitrine, /inscription) must just reject the
        // promise so they can render with limited data.
        if (hadToken) {
          window.location.href = "/";
        }
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Queue the request while refreshing
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(api(originalRequest));
            },
            reject,
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await axios.post(`${env.API_URL}/auth/refresh-token`, {
          refreshToken,
        });
        const data = response.data.data ?? response.data;
        const newToken = data.accessToken;
        const newRefreshToken = data.refreshToken;

        localStorage.setItem("token", newToken);
        localStorage.setItem("refreshToken", newRefreshToken);

        processQueue(null, newToken);

        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        window.location.href = "/";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Extract backend error message if available
    const msg = error.response?.data?.message || error.message;
    return Promise.reject(new Error(msg));
  }
);

export default api;
