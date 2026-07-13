import api from "./axios";
import type { Facture, Echeancier } from "@/types/facture";

const BASE = "/factures";

export interface FactureFilters {
  page?: number;
  size?: number;
  statut?: string;
  eleveId?: string;
  search?: string;
}

export interface PagedFactures {
  content: Facture[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export const facturesApi = {
  // --- Factures ---
  getAll: async (filters: FactureFilters = {}): Promise<PagedFactures> => {
    const params = new URLSearchParams();
    if (filters.page != null) params.set("page", String(filters.page));
    if (filters.size != null) params.set("size", String(filters.size));
    if (filters.statut) params.set("statut", filters.statut);
    if (filters.eleveId) params.set("eleveId", String(filters.eleveId));
    if (filters.search) params.set("search", filters.search);

    const res = await api.get<PagedFactures>(`${BASE}?${params.toString()}`);
    return res.data;
  },

  getById: async (id: string): Promise<Facture> => {
    const res = await api.get<Facture>(`${BASE}/${id}`);
    return res.data;
  },

  getByEleve: async (eleveId: string): Promise<Facture[]> => {
    const res = await api.get<Facture[]>(`${BASE}/eleve/${eleveId}`);
    return res.data;
  },

  create: async (data: Omit<Facture, "id" | "numero" | "statut">): Promise<Facture> => {
    const res = await api.post<Facture>(BASE, data);
    return res.data;
  },

  update: async (id: string, data: Partial<Facture>): Promise<Facture> => {
    const res = await api.put<Facture>(`${BASE}/${id}`, data);
    return res.data;
  },

  generate: async (eleveId: string): Promise<Facture> => {
    const res = await api.post<Facture>(`${BASE}/generate`, { eleveId });
    return res.data;
  },

  cancel: async (id: string): Promise<Facture> => {
    const res = await api.patch<Facture>(`${BASE}/${id}/cancel`);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`${BASE}/${id}`);
  },

  // --- Echeanciers ---
  getEcheanciers: async (eleveId?: string): Promise<Echeancier[]> => {
    const params = eleveId ? `?eleveId=${eleveId}` : "";
    const res = await api.get<Echeancier[]>(`${BASE}/echeanciers${params}`);
    return res.data;
  },

  getEcheancierById: async (id: string): Promise<Echeancier> => {
    const res = await api.get<Echeancier>(`${BASE}/echeanciers/${id}`);
    return res.data;
  },

  createEcheancier: async (data: Omit<Echeancier, "id" | "echeances">): Promise<Echeancier> => {
    const res = await api.post<Echeancier>(`${BASE}/echeanciers`, data);
    return res.data;
  },

  deleteEcheancier: async (id: string): Promise<void> => {
    await api.delete(`${BASE}/echeanciers/${id}`);
  },
};
