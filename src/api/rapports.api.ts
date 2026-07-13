import api from "./axios";
import type { Rapport } from "@/types/rapport";

const BASE = "/rapports";

export interface RapportFilters {
  type?: string;
  statut?: string;
}

export const rapportsApi = {
  getAll: async (params: RapportFilters = {}): Promise<Rapport[]> => {
    const query = new URLSearchParams();
    if (params.type) query.set("type", params.type);
    if (params.statut) query.set("statut", params.statut);
    const qs = query.toString();
    const res = await api.get<Rapport[]>(`${BASE}${qs ? `?${qs}` : ""}`);
    return res.data;
  },

  getById: async (id: string): Promise<Rapport> => {
    const res = await api.get<Rapport>(`${BASE}/${id}`);
    return res.data;
  },

  create: async (data: Omit<Rapport, "id">): Promise<Rapport> => {
    const res = await api.post<Rapport>(BASE, data);
    return res.data;
  },

  update: async (id: string, data: Partial<Rapport>): Promise<Rapport> => {
    const res = await api.put<Rapport>(`${BASE}/${id}`, data);
    return res.data;
  },

  delete: (id: string) => api.delete(`${BASE}/${id}`),
};
