import api from "./axios";
import type { BilanAnnuel } from "@/types/bilan-annuel";

const BASE = "/bilan-annuel";

export const bilanAnnuelApi = {
  /** Annual end-of-year decision statistics (defaults to the active year). */
  get: async (anneeScolaire?: string): Promise<BilanAnnuel> => {
    const res = await api.get<BilanAnnuel>(BASE, {
      params: anneeScolaire ? { anneeScolaire } : {},
    });
    return res.data;
  },

  /** ANN-023 — one bilan per recorded school year, for inter-year comparison. */
  getComparatif: async (): Promise<BilanAnnuel[]> => {
    const res = await api.get<BilanAnnuel[]>(`${BASE}/comparatif`);
    return res.data;
  },
};
