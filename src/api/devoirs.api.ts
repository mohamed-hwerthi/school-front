import api from "./axios";
import type {
  Devoir,
  CreateDevoirRequest,
  Soumission,
  CreateSoumissionRequest,
  CorrectionRequest,
  RessourcePedagogique,
  CreateRessourceRequest,
  DevoirStats,
} from "@/types/devoir";

const DEVOIRS_BASE = "/devoirs";
const SOUMISSIONS_BASE = "/soumissions";
const RESSOURCES_BASE = "/ressources";

export const devoirsApi = {
  // Devoirs
  getAll: async (classeId?: string, moduleId?: string, anneeScolaire?: string): Promise<Devoir[]> => {
    const params = new URLSearchParams();
    if (classeId) params.set("classeId", String(classeId));
    if (moduleId) params.set("moduleId", String(moduleId));
    if (anneeScolaire) params.set("anneeScolaire", anneeScolaire);
    const qs = params.toString();
    const res = await api.get<Devoir[]>(`${DEVOIRS_BASE}${qs ? `?${qs}` : ""}`);
    return res.data;
  },

  getById: async (id: string): Promise<Devoir> => {
    const res = await api.get<Devoir>(`${DEVOIRS_BASE}/${id}`);
    return res.data;
  },

  create: async (data: CreateDevoirRequest): Promise<Devoir> => {
    const res = await api.post<Devoir>(DEVOIRS_BASE, data);
    return res.data;
  },

  update: async (id: string, data: CreateDevoirRequest): Promise<Devoir> => {
    const res = await api.put<Devoir>(`${DEVOIRS_BASE}/${id}`, data);
    return res.data;
  },

  close: async (id: string): Promise<Devoir> => {
    const res = await api.put<Devoir>(`${DEVOIRS_BASE}/${id}/close`);
    return res.data;
  },

  delete: (id: string) => api.delete(`${DEVOIRS_BASE}/${id}`),

  // Soumissions
  getSoumissionsByDevoir: async (devoirId: string): Promise<Soumission[]> => {
    const res = await api.get<Soumission[]>(`${SOUMISSIONS_BASE}/devoir/${devoirId}`);
    return res.data;
  },

  getSoumissionsByEleve: async (eleveId: string): Promise<Soumission[]> => {
    const res = await api.get<Soumission[]>(`${SOUMISSIONS_BASE}/eleve/${eleveId}`);
    return res.data;
  },

  submitSoumission: async (data: CreateSoumissionRequest): Promise<Soumission> => {
    const res = await api.post<Soumission>(SOUMISSIONS_BASE, data);
    return res.data;
  },

  correctSoumission: async (id: string, data: CorrectionRequest): Promise<Soumission> => {
    const res = await api.put<Soumission>(`${SOUMISSIONS_BASE}/${id}/correct`, data);
    return res.data;
  },

  getDevoirStats: async (devoirId: string): Promise<DevoirStats> => {
    const res = await api.get<DevoirStats>(`${SOUMISSIONS_BASE}/stats/${devoirId}`);
    return res.data;
  },

  deleteSoumission: (id: string) => api.delete(`${SOUMISSIONS_BASE}/${id}`),

  // Ressources
  getRessources: async (moduleId?: string, anneeScolaire?: string): Promise<RessourcePedagogique[]> => {
    const params = new URLSearchParams();
    if (moduleId) params.set("moduleId", String(moduleId));
    if (anneeScolaire) params.set("anneeScolaire", anneeScolaire);
    const qs = params.toString();
    const res = await api.get<RessourcePedagogique[]>(`${RESSOURCES_BASE}${qs ? `?${qs}` : ""}`);
    return res.data;
  },

  createRessource: async (data: CreateRessourceRequest): Promise<RessourcePedagogique> => {
    const res = await api.post<RessourcePedagogique>(RESSOURCES_BASE, data);
    return res.data;
  },

  updateRessource: async (id: string, data: CreateRessourceRequest): Promise<RessourcePedagogique> => {
    const res = await api.put<RessourcePedagogique>(`${RESSOURCES_BASE}/${id}`, data);
    return res.data;
  },

  deleteRessource: (id: string) => api.delete(`${RESSOURCES_BASE}/${id}`),
};
