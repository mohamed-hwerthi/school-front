import api from "./axios";
import type { PagedResult } from "./students.api";

// ─── Backend DTOs ────────────────────────────────────────

export interface CategorieDepenseDTO {
  id: string;
  nom: string;
  type: "FIXE" | "VARIABLE";
  description: string | null;
  createdAt: string;
}

export interface CategorieDepenseRequest {
  nom: string;
  type?: "FIXE" | "VARIABLE";
  description?: string;
}

export interface DepenseDTO {
  id: string;
  categorieId: string;
  categorieNom: string;
  libelle: string;
  montant: number;
  dateDepense: string;
  modePaiement: "ESPECES" | "VIREMENT" | "CHEQUE" | "CARTE_BANCAIRE" | "PRELEVEMENT" | null;
  fournisseur: string | null;
  reference: string | null;
  recurrente: boolean;
  notes: string | null;
  anneeScolaire: string;
  createdAt: string;
  updatedAt: string;
}

export interface DepenseRequest {
  categorieId: string;
  libelle: string;
  montant: number;
  dateDepense: string;
  modePaiement?: "ESPECES" | "VIREMENT" | "CHEQUE" | "CARTE_BANCAIRE" | "PRELEVEMENT" | null;
  fournisseur?: string;
  reference?: string;
  recurrente?: boolean;
  notes?: string;
  anneeScolaire: string;
}

export interface DepenseStatsDTO {
  totalDepenses: number;
  nombreDepenses: number;
  parCategorie: { categorieId: string; categorieNom: string; total: number }[];
}

export interface DepenseFilters {
  page?: number;
  size?: number;
  search?: string;
  anneeScolaire?: string;
  categorieId?: string;
  modePaiement?: string;
  recurrente?: boolean;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}

// ─── API calls ───────────────────────────────────────────

export const categoriesDepenseApi = {
  getAll: async (): Promise<CategorieDepenseDTO[]> => {
    const res = await api.get<CategorieDepenseDTO[]>("/categories-depense");
    return res.data;
  },

  create: async (data: CategorieDepenseRequest): Promise<CategorieDepenseDTO> => {
    const res = await api.post<CategorieDepenseDTO>("/categories-depense", data);
    return res.data;
  },

  update: async (id: string, data: CategorieDepenseRequest): Promise<CategorieDepenseDTO> => {
    const res = await api.put<CategorieDepenseDTO>(`/categories-depense/${id}`, data);
    return res.data;
  },

  delete: (id: string) => api.delete(`/categories-depense/${id}`),
};

export const depensesApi = {
  getAll: async (filters: DepenseFilters = {}): Promise<PagedResult<DepenseDTO>> => {
    const params = new URLSearchParams();
    if (filters.page != null) params.set("page", String(filters.page));
    if (filters.size != null) params.set("size", String(filters.size));
    if (filters.search) params.set("search", filters.search);
    if (filters.anneeScolaire) params.set("anneeScolaire", filters.anneeScolaire);
    if (filters.categorieId != null) params.set("categorieId", String(filters.categorieId));
    if (filters.modePaiement) params.set("modePaiement", filters.modePaiement);
    if (filters.recurrente != null) params.set("recurrente", String(filters.recurrente));
    if (filters.sortBy) params.set("sortBy", filters.sortBy);
    if (filters.sortDir) params.set("sortDir", filters.sortDir);

    const res = await api.get<PagedResult<DepenseDTO>>(`/depenses?${params.toString()}`);
    return res.data;
  },

  getById: async (id: string): Promise<DepenseDTO> => {
    const res = await api.get<DepenseDTO>(`/depenses/${id}`);
    return res.data;
  },

  create: async (data: DepenseRequest): Promise<DepenseDTO> => {
    const res = await api.post<DepenseDTO>("/depenses", data);
    return res.data;
  },

  update: async (id: string, data: DepenseRequest): Promise<DepenseDTO> => {
    const res = await api.put<DepenseDTO>(`/depenses/${id}`, data);
    return res.data;
  },

  delete: (id: string) => api.delete(`/depenses/${id}`),

  getStats: async (anneeScolaire: string): Promise<DepenseStatsDTO> => {
    const res = await api.get<DepenseStatsDTO>(`/depenses/stats?anneeScolaire=${anneeScolaire}`);
    return res.data;
  },
};
