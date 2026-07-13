import api from "./axios";

export interface NiveauDTO {
  id: string;
  name: string;
  sections: string[];
}

const BASE = "/niveaux";

export const niveauxApi = {
  getAll: async (): Promise<NiveauDTO[]> => {
    const res = await api.get<NiveauDTO[]>(BASE);
    return res.data;
  },

  create: async (name: string): Promise<NiveauDTO> => {
    const res = await api.post<NiveauDTO>(BASE, { name });
    return res.data;
  },

  delete: (id: string) => api.delete(`${BASE}/${id}`),

  addClasse: async (niveauId: string, letter: string): Promise<NiveauDTO> => {
    const res = await api.post<NiveauDTO>(`${BASE}/${niveauId}/classes`, { letter });
    return res.data;
  },

  removeClasse: (niveauId: string, letter: string) =>
    api.delete(`${BASE}/${niveauId}/classes/${letter}`),
};
