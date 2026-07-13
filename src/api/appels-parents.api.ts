import api from "./axios";

export interface AppelParentDTO {
  id: string;
  eleveId: string;
  appelePar: string | null;
  telephone: string | null;
  motif: string | null;
  notes: string;
  dateAppel: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppelParentRequest {
  eleveId: string;
  appelePar?: string;
  telephone?: string;
  motif?: string;
  notes: string;
  dateAppel?: string;
}

const BASE = "/appels-parents";

export const appelsParentsApi = {
  getAll: async (eleveId?: string): Promise<AppelParentDTO[]> => {
    const res = await api.get<AppelParentDTO[]>(BASE, {
      params: eleveId ? { eleveId } : undefined,
    });
    return res.data;
  },

  create: async (data: AppelParentRequest): Promise<AppelParentDTO> => {
    const res = await api.post<AppelParentDTO>(BASE, data);
    return res.data;
  },

  update: async (id: string, data: AppelParentRequest): Promise<AppelParentDTO> => {
    const res = await api.put<AppelParentDTO>(`${BASE}/${id}`, data);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`${BASE}/${id}`);
  },
};
