import api from "./axios";
import type { ConseilClasse, PvAnnuel, PvAnnuelRequest } from "@/types/conseil-classe";

const BASE = "/conseil-classe";

export const conseilClasseApi = {
  /** Annual averages + proposed end-of-year decisions for a class. */
  getByClasse: async (classeId: string): Promise<ConseilClasse> => {
    const res = await api.get<ConseilClasse>(`${BASE}/${classeId}`);
    return res.data;
  },

  /** PV annuel déjà édité pour cette classe, ou null s'il ne l'a jamais été. */
  getPv: async (classeId: string, anneeScolaire: string): Promise<PvAnnuel | null> => {
    const res = await api.get<PvAnnuel | null>(`${BASE}/${classeId}/pv`, {
      params: { anneeScolaire },
    });
    return res.data ?? null;
  },

  /** Fige le PV : refusé (409) s'il a déjà été édité. */
  createPv: async (classeId: string, data: PvAnnuelRequest): Promise<PvAnnuel> => {
    const res = await api.post<PvAnnuel>(`${BASE}/${classeId}/pv`, data);
    return res.data;
  },
};
