import api from "./axios";
import type { DashboardStats, MonthlyTrend } from "@/types/reporting";

const BASE = "/reporting";

export const reportingApi = {
  getDashboard: async (anneeScolaire: string = "2025-2026"): Promise<DashboardStats> => {
    const res = await api.get<DashboardStats>(`${BASE}/dashboard`, {
      params: { anneeScolaire },
    });
    return res.data;
  },

  getTrends: async (anneeScolaire: string = "2025-2026"): Promise<MonthlyTrend[]> => {
    const res = await api.get<MonthlyTrend[]>(`${BASE}/trends`, {
      params: { anneeScolaire },
    });
    return res.data;
  },
};
