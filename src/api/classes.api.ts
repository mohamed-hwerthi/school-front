import api from "./axios";

export interface ClasseDTO {
  id: string;
  letter: string;
  niveauId: string;
  niveauName: string;
  fullName: string;
  /** Capacité d'accueil ; null = non plafonnée. */
  capacite: number | null;
}

const BASE = "/classes";

export const classesApi = {
  getAll: async (niveauId?: string): Promise<ClasseDTO[]> => {
    const params = niveauId ? `?niveauId=${niveauId}` : "";
    const res = await api.get<ClasseDTO[]>(`${BASE}${params}`);
    return res.data;
  },

  /** Règle la capacité d'accueil d'une section (null = non plafonnée). */
  setCapacite: async (id: string, capacite: number | null): Promise<ClasseDTO> => {
    const res = await api.put<ClasseDTO>(`${BASE}/${id}/capacite`, { capacite });
    return res.data;
  },
};
