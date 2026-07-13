import api from "./axios";
import type {
  AnneeScolaire,
  Trimestre,
  Vacance,
  JourFerie,
} from "@/types/annee-scolaire";

const BASE = "/annees-scolaires";

export const anneeScolaireApi = {
  // --- Annee Scolaire ---
  getActive: async (): Promise<AnneeScolaire> => {
    const res = await api.get<AnneeScolaire>(`${BASE}/active`);
    return res.data;
  },

  getAll: async (): Promise<AnneeScolaire[]> => {
    const res = await api.get<AnneeScolaire[]>(BASE);
    return res.data;
  },

  create: async (data: Omit<AnneeScolaire, "id" | "active" | "cloturee">): Promise<AnneeScolaire> => {
    const res = await api.post<AnneeScolaire>(BASE, data);
    return res.data;
  },

  update: async (id: string, data: Partial<AnneeScolaire>): Promise<AnneeScolaire> => {
    const res = await api.put<AnneeScolaire>(`${BASE}/${id}`, data);
    return res.data;
  },

  cloturer: async (id: string): Promise<AnneeScolaire> => {
    const res = await api.patch<AnneeScolaire>(`${BASE}/${id}/cloturer`);
    return res.data;
  },

  activate: async (id: string): Promise<AnneeScolaire> => {
    const res = await api.patch<AnneeScolaire>(`${BASE}/${id}/activate`);
    return res.data;
  },

  // --- Trimestres ---
  getTrimestres: async (anneeScolaireId: string): Promise<Trimestre[]> => {
    const res = await api.get<Trimestre[]>(`${BASE}/${anneeScolaireId}/trimestres`);
    return res.data;
  },

  createTrimestre: async (anneeScolaireId: string, data: Omit<Trimestre, "id" | "anneeScolaireId">): Promise<Trimestre> => {
    const res = await api.post<Trimestre>(`${BASE}/${anneeScolaireId}/trimestres`, data);
    return res.data;
  },

  updateTrimestre: async (id: string, data: Partial<Trimestre>): Promise<Trimestre> => {
    const res = await api.put<Trimestre>(`${BASE}/trimestres/${id}`, data);
    return res.data;
  },

  deleteTrimestre: async (id: string): Promise<void> => {
    await api.delete(`${BASE}/trimestres/${id}`);
  },

  // --- Vacances ---
  getVacances: async (anneeScolaireId: string): Promise<Vacance[]> => {
    const res = await api.get<Vacance[]>(`${BASE}/${anneeScolaireId}/vacances`);
    return res.data;
  },

  createVacance: async (anneeScolaireId: string, data: Omit<Vacance, "id" | "anneeScolaireId">): Promise<Vacance> => {
    const res = await api.post<Vacance>(`${BASE}/${anneeScolaireId}/vacances`, data);
    return res.data;
  },

  deleteVacance: async (id: string): Promise<void> => {
    await api.delete(`${BASE}/vacances/${id}`);
  },

  // --- Jours Feries ---
  getJoursFeries: async (anneeScolaireId: string): Promise<JourFerie[]> => {
    const res = await api.get<JourFerie[]>(`${BASE}/${anneeScolaireId}/jours-feries`);
    return res.data;
  },

  createJourFerie: async (anneeScolaireId: string, data: Omit<JourFerie, "id" | "anneeScolaireId">): Promise<JourFerie> => {
    const res = await api.post<JourFerie>(`${BASE}/${anneeScolaireId}/jours-feries`, data);
    return res.data;
  },

  deleteJourFerie: async (id: string): Promise<void> => {
    await api.delete(`${BASE}/jours-feries/${id}`);
  },
};
