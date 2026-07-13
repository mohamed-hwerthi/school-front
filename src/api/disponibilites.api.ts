import api from "./axios";

export const DISPO_TYPES = ["INDISPONIBLE", "PREFERE", "EVITER"] as const;
export type DispoType = (typeof DISPO_TYPES)[number];

export interface DisponibiliteDTO {
  id: string;
  enseignantId: string;
  jourSemaine: number; // 1=Lundi ... 6=Samedi
  creneauId: string;
  type: DispoType;
  motif: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DisponibiliteRequest {
  enseignantId: string;
  jourSemaine: number;
  creneauId: string;
  type: DispoType;
  motif?: string;
}

const BASE = "/disponibilites-enseignants";

export const disponibilitesApi = {
  getAll: async (enseignantId?: string): Promise<DisponibiliteDTO[]> => {
    const res = await api.get<DisponibiliteDTO[]>(BASE, {
      params: enseignantId ? { enseignantId } : undefined,
    });
    return res.data;
  },

  create: async (data: DisponibiliteRequest): Promise<DisponibiliteDTO> => {
    const res = await api.post<DisponibiliteDTO>(BASE, data);
    return res.data;
  },

  update: async (
    id: string,
    data: DisponibiliteRequest
  ): Promise<DisponibiliteDTO> => {
    const res = await api.put<DisponibiliteDTO>(`${BASE}/${id}`, data);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`${BASE}/${id}`);
  },
};
