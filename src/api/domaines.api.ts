import api from "./axios";

export interface SousDomaineDTO {
  id: string;
  name: string;
  nameAr: string | null;
  ordre: number;
  domaineId: string;
}

export interface DomaineDTO {
  id: string;
  name: string;
  nameAr: string | null;
  ordre: number;
  coeffEtatique: number;
  coeffPrive: number;
  versionEtatique: boolean;
  versionPrivee: boolean;
  niveauId: string;
  niveauName: string;
  sousDomaines: SousDomaineDTO[];
}

export interface DomaineRequest {
  name: string;
  nameAr?: string;
  ordre: number;
  coeffEtatique: number;
  coeffPrive: number;
  versionEtatique: boolean;
  versionPrivee: boolean;
  niveauId: string;
}

export interface SousDomaineRequest {
  name: string;
  nameAr?: string;
  ordre: number;
  domaineId: string;
}

const BASE = "/domaines";

export const domainesApi = {
  getAll: async (niveauId?: string): Promise<DomaineDTO[]> => {
    const params = niveauId ? `?niveauId=${niveauId}` : "";
    const res = await api.get<DomaineDTO[]>(`${BASE}${params}`);
    return res.data;
  },

  create: async (data: DomaineRequest): Promise<DomaineDTO> => {
    const res = await api.post<DomaineDTO>(BASE, data);
    return res.data;
  },

  update: async (id: string, data: DomaineRequest): Promise<DomaineDTO> => {
    const res = await api.put<DomaineDTO>(`${BASE}/${id}`, data);
    return res.data;
  },

  delete: (id: string) => api.delete(`${BASE}/${id}`),

  // Sous-domaines
  createSousDomaine: async (data: SousDomaineRequest): Promise<SousDomaineDTO> => {
    const res = await api.post<SousDomaineDTO>(`${BASE}/sous-domaines`, data);
    return res.data;
  },

  updateSousDomaine: async (id: string, data: SousDomaineRequest): Promise<SousDomaineDTO> => {
    const res = await api.put<SousDomaineDTO>(`${BASE}/sous-domaines/${id}`, data);
    return res.data;
  },

  deleteSousDomaine: (id: string) => api.delete(`${BASE}/sous-domaines/${id}`),
};
