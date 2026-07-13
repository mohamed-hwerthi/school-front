import api from "./axios";
import type { Circulaire } from "@/types/circulaire";

// ─── Types ───────────────────────────────────────────

export interface CirculaireFilters {
  type?: string;
  statut?: string;
  cible?: string;
  search?: string;
}

export type CirculaireRequest = Omit<Circulaire, "id" | "dateCreation" | "datePublication">;

// ─── API calls ───────────────────────────────────────

export const circulairesApi = {
  getAll: async (filters: CirculaireFilters = {}): Promise<Circulaire[]> => {
    const params = new URLSearchParams();
    if (filters.type) params.set("type", filters.type);
    if (filters.statut) params.set("statut", filters.statut);
    if (filters.cible) params.set("cible", filters.cible);
    if (filters.search) params.set("search", filters.search);

    const query = params.toString();
    const res = await api.get<Circulaire[]>(`/circulaires${query ? `?${query}` : ""}`);
    return res.data;
  },

  getById: async (id: string): Promise<Circulaire> => {
    const res = await api.get<Circulaire>(`/circulaires/${id}`);
    return res.data;
  },

  create: async (data: CirculaireRequest): Promise<Circulaire> => {
    const res = await api.post<Circulaire>("/circulaires", data);
    return res.data;
  },

  update: async (id: string, data: Partial<CirculaireRequest>): Promise<Circulaire> => {
    const res = await api.put<Circulaire>(`/circulaires/${id}`, data);
    return res.data;
  },

  publish: async (id: string): Promise<Circulaire> => {
    const res = await api.put<Circulaire>(`/circulaires/${id}/publier`);
    return res.data;
  },

  archive: async (id: string): Promise<Circulaire> => {
    const res = await api.put<Circulaire>(`/circulaires/${id}/archiver`);
    return res.data;
  },

  delete: (id: string) => api.delete(`/circulaires/${id}`),
};
