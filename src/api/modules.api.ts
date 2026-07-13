import api from "./axios";

export const SALLE_TYPES = [
  "NORMAL",
  "LABO_SVT",
  "LABO_PHYSIQUE",
  "INFO",
  "GYMNASE",
  "ARTS",
  "MUSIQUE",
] as const;
export type SalleType = (typeof SALLE_TYPES)[number];

export const PREFERENCES_HORAIRES = ["MATIN", "APRES_MIDI", "INDIFFERENT"] as const;
export type PreferenceHoraire = (typeof PREFERENCES_HORAIRES)[number];

export interface ModuleDTO {
  id: string;
  name: string;
  nameVp: string | null;
  coeffEtatique: number;
  coeffPrive: number;
  ordreEtatique: number;
  ordrePrive: number;
  niveauId: string;
  niveauName: string;
  domaineId: string | null;
  domaineName: string | null;
  sousDomaineId: string | null;
  sousDomaineName: string | null;
  versionEtatique: boolean;
  versionPrivee: boolean;
  salleTypeRequise: SalleType;
  dureeMinSeance: number;
  dureeMaxSeance: number;
  preferenceHoraire: PreferenceHoraire;
}

export interface ModuleRequest {
  name: string;
  nameVp?: string;
  coeffEtatique: number;
  coeffPrive: number;
  ordreEtatique: number;
  ordrePrive: number;
  niveauId: string;
  domaineId?: string;
  sousDomaineId?: string;
  versionEtatique: boolean;
  versionPrivee: boolean;
  salleTypeRequise?: SalleType;
  dureeMinSeance?: number;
  dureeMaxSeance?: number;
  preferenceHoraire?: PreferenceHoraire;
}

const BASE = "/modules";

export const modulesApi = {
  getAll: async (niveauId?: string): Promise<ModuleDTO[]> => {
    const params = niveauId ? `?niveauId=${niveauId}` : "";
    const res = await api.get<ModuleDTO[]>(`${BASE}${params}`);
    return res.data;
  },

  getById: async (id: string): Promise<ModuleDTO> => {
    const res = await api.get<ModuleDTO>(`${BASE}/${id}`);
    return res.data;
  },

  create: async (data: ModuleRequest): Promise<ModuleDTO> => {
    const res = await api.post<ModuleDTO>(BASE, data);
    return res.data;
  },

  update: async (id: string, data: ModuleRequest): Promise<ModuleDTO> => {
    const res = await api.put<ModuleDTO>(`${BASE}/${id}`, data);
    return res.data;
  },

  delete: (id: string) => api.delete(`${BASE}/${id}`),
};
