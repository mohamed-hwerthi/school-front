import api from "./axios";

export interface ExamenDTO {
  id: string;
  name: string;
  namePrive: string | null;
  coeffEtatique: number;
  coeffPrive: number;
  ordreEtatique: number;
  ordrePrive: number;
  trimestre: number;
  classeId: string;
  classeName: string;
  teacherId: string | null;
  teacherName: string;
  moduleId: string;
  moduleName: string;
  versionEtatique: boolean;
  versionPrivee: boolean;
  nbNotes: number;
  nbEleves: number;
}

export interface ExamenRequest {
  name: string;
  namePrive?: string;
  coeffEtatique: number;
  coeffPrive: number;
  ordreEtatique: number;
  ordrePrive: number;
  trimestre: number;
  classeId: string;
  teacherId?: string;
  moduleId: string;
  versionEtatique: boolean;
  versionPrivee: boolean;
}

const BASE = "/examens";

export const examensApi = {
  getAll: async (moduleId?: string, classeId?: string, trimestre?: number): Promise<ExamenDTO[]> => {
    const params = new URLSearchParams();
    if (moduleId) params.set("moduleId", String(moduleId));
    if (classeId) params.set("classeId", String(classeId));
    if (trimestre) params.set("trimestre", String(trimestre));
    const qs = params.toString();
    const res = await api.get<ExamenDTO[]>(`${BASE}${qs ? `?${qs}` : ""}`);
    return res.data;
  },

  getById: async (id: string): Promise<ExamenDTO> => {
    const res = await api.get<ExamenDTO>(`${BASE}/${id}`);
    return res.data;
  },

  create: async (data: ExamenRequest): Promise<ExamenDTO> => {
    const res = await api.post<ExamenDTO>(BASE, data);
    return res.data;
  },

  update: async (id: string, data: ExamenRequest): Promise<ExamenDTO> => {
    const res = await api.put<ExamenDTO>(`${BASE}/${id}`, data);
    return res.data;
  },

  delete: (id: string) => api.delete(`${BASE}/${id}`),

  deleteBulk: (ids: string[]) => api.delete(`${BASE}/bulk`, { data: ids }),
};
