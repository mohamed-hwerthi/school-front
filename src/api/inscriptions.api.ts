import api from "./axios";
import type {
  Inscription,
  CreateInscriptionRequest,
  UpdateStatutRequest,
  InscriptionStats,
  PagedInscriptions,
} from "@/types/inscription";

const BASE = "/inscriptions";
const PUBLIC_BASE = "/public/inscriptions";

export const inscriptionsApi = {
  /**
   * List inscriptions with filters (admin — requires MANAGE_INSCRIPTIONS).
   */
  getAll: async (params: {
    statut?: string;
    anneeScolaire?: string;
    niveauId?: string;
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: string;
  }): Promise<PagedInscriptions> => {
    const res = await api.get<PagedInscriptions>(BASE, { params });
    return res.data;
  },

  /**
   * Get a single inscription by ID (admin).
   */
  getById: async (id: string): Promise<Inscription> => {
    const res = await api.get<Inscription>(`${BASE}/${id}`);
    return res.data;
  },

  /**
   * Update inscription status (admin).
   */
  updateStatut: async (
    id: string,
    data: UpdateStatutRequest
  ): Promise<Inscription> => {
    const res = await api.put<Inscription>(`${BASE}/${id}/statut`, data);
    return res.data;
  },

  /**
   * Get inscription statistics (admin).
   */
  getStats: async (anneeScolaire?: string): Promise<InscriptionStats> => {
    const params = anneeScolaire ? { anneeScolaire } : {};
    const res = await api.get<InscriptionStats>(`${BASE}/stats`, { params });
    return res.data;
  },

  /**
   * Get waiting list for a niveau (admin).
   */
  getListeAttente: async (
    niveauId: string,
    anneeScolaire?: string
  ): Promise<Inscription[]> => {
    const params = anneeScolaire ? { anneeScolaire } : {};
    const res = await api.get<Inscription[]>(
      `${BASE}/liste-attente/${niveauId}`,
      { params }
    );
    return res.data;
  },

  /**
   * Submit a new inscription (public — no auth required).
   */
  create: async (data: CreateInscriptionRequest): Promise<Inscription> => {
    const res = await api.post<Inscription>(PUBLIC_BASE, data);
    return res.data;
  },

  /**
   * Check inscription status by dossier number (public — no auth required).
   */
  getByNumeroDossier: async (numeroDossier: string): Promise<Inscription> => {
    const res = await api.get<Inscription>(
      `${PUBLIC_BASE}/numero/${numeroDossier}`
    );
    return res.data;
  },

  /**
   * Convert an accepted inscription into a student (admin).
   */
  convertToStudent: async (id: string, classe?: string, sexe?: string) => {
    const params: Record<string, string> = {};
    if (classe) params.classe = classe;
    if (sexe) params.sexe = sexe;
    const res = await api.post(`${BASE}/${id}/convert-to-student`, null, { params });
    return res.data as import("@/types/student").Student;
  },
};
