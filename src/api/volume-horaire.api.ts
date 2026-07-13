import api from "./axios";

export interface VolumeHoraireDTO {
  id: string;
  moduleId: string;
  classeId: string;
  enseignantId: string | null;
  anneeScolaireId: string | null;
  nbHeuresHebdo: number;
  createdAt: string;
  updatedAt: string;
}

export interface VolumeHoraireRequest {
  moduleId: string;
  classeId: string;
  enseignantId?: string;
  anneeScolaireId?: string;
  nbHeuresHebdo: number;
}

const BASE = "/volume-horaire";

export const volumeHoraireApi = {
  getAll: async (params?: {
    classeId?: string;
    anneeScolaireId?: string;
  }): Promise<VolumeHoraireDTO[]> => {
    const res = await api.get<VolumeHoraireDTO[]>(BASE, { params });
    return res.data;
  },

  create: async (data: VolumeHoraireRequest): Promise<VolumeHoraireDTO> => {
    const res = await api.post<VolumeHoraireDTO>(BASE, data);
    return res.data;
  },

  update: async (
    id: string,
    data: VolumeHoraireRequest
  ): Promise<VolumeHoraireDTO> => {
    const res = await api.put<VolumeHoraireDTO>(`${BASE}/${id}`, data);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`${BASE}/${id}`);
  },
};
