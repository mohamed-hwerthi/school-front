import api from "./axios";
import type { ConseilClasse } from "@/types/conseil-classe";

const BASE = "/conseil-classe";

export const conseilClasseApi = {
  /** Annual averages + proposed end-of-year decisions for a class. */
  getByClasse: async (classeId: string): Promise<ConseilClasse> => {
    const res = await api.get<ConseilClasse>(`${BASE}/${classeId}`);
    return res.data;
  },
};
