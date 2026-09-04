import api from "./axios";
import type { Repartition, RepartitionRequest, RepartitionResult } from "@/types/repartition";

const BASE = "/repartition";

export const repartitionApi = {
  /** Élèves promus, classes d'accueil disponibles et proposition automatique. */
  get: async (anneeScolaire?: string): Promise<Repartition> => {
    const res = await api.get<Repartition>(BASE, { params: { anneeScolaire } });
    return res.data;
  },

  /** Enregistre la classe d'accueil de chaque élève promu. */
  save: async (data: RepartitionRequest): Promise<RepartitionResult> => {
    const res = await api.post<RepartitionResult>(BASE, data);
    return res.data;
  },
};
