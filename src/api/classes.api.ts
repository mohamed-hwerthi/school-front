import api from "./axios";

export interface ClasseDTO {
  id: string;
  letter: string;
  niveauId: string;
  niveauName: string;
  fullName: string;
}

const BASE = "/classes";

export const classesApi = {
  getAll: async (niveauId?: string): Promise<ClasseDTO[]> => {
    const params = niveauId ? `?niveauId=${niveauId}` : "";
    const res = await api.get<ClasseDTO[]>(`${BASE}${params}`);
    return res.data;
  },
};
