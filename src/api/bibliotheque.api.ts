import api from "./axios";
import type {
  Livre,
  CreateLivreRequest,
  Emprunt,
  CreateEmpruntRequest,
  BibliothequeStats,
} from "@/types/bibliotheque";

// ─── Paged response shape ───────────────────────────────
interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

// ─── Livres API ─────────────────────────────────────────

export const livresApi = {
  getAll: async (params?: {
    page?: number;
    size?: number;
    search?: string;
    categorie?: string;
    sortBy?: string;
    sortDir?: string;
  }): Promise<PagedResponse<Livre>> => {
    const res = await api.get<PagedResponse<Livre>>("/livres", { params });
    return res.data;
  },

  getById: async (id: string): Promise<Livre> => {
    const res = await api.get<Livre>(`/livres/${id}`);
    return res.data;
  },

  getCategories: async (): Promise<string[]> => {
    const res = await api.get<string[]>("/livres/categories");
    return res.data;
  },

  create: async (data: CreateLivreRequest): Promise<Livre> => {
    const res = await api.post<Livre>("/livres", data);
    return res.data;
  },

  update: async (id: string, data: CreateLivreRequest): Promise<Livre> => {
    const res = await api.put<Livre>(`/livres/${id}`, data);
    return res.data;
  },

  delete: (id: string) => api.delete(`/livres/${id}`),
};

// ─── Emprunts API ───────────────────────────────────────

export const empruntsApi = {
  getAll: async (): Promise<Emprunt[]> => {
    const res = await api.get<Emprunt[]>("/emprunts");
    return res.data;
  },

  getById: async (id: string): Promise<Emprunt> => {
    const res = await api.get<Emprunt>(`/emprunts/${id}`);
    return res.data;
  },

  getByEleve: async (eleveId: string): Promise<Emprunt[]> => {
    const res = await api.get<Emprunt[]>(`/emprunts/eleve/${eleveId}`);
    return res.data;
  },

  getByLivre: async (livreId: string): Promise<Emprunt[]> => {
    const res = await api.get<Emprunt[]>(`/emprunts/livre/${livreId}`);
    return res.data;
  },

  getEnRetard: async (): Promise<Emprunt[]> => {
    const res = await api.get<Emprunt[]>("/emprunts/en-retard");
    return res.data;
  },

  getStats: async (): Promise<BibliothequeStats> => {
    const res = await api.get<BibliothequeStats>("/emprunts/stats");
    return res.data;
  },

  create: async (data: CreateEmpruntRequest): Promise<Emprunt> => {
    const res = await api.post<Emprunt>("/emprunts", data);
    return res.data;
  },

  retourner: async (id: string): Promise<Emprunt> => {
    const res = await api.put<Emprunt>(`/emprunts/${id}/retour`);
    return res.data;
  },
};
