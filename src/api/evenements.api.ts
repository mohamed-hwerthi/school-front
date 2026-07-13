import api from "./axios";
import type {
  EvenementCalendrier,
  EvenementCalendrierInput,
} from "@/types/evenement";

const BASE = "/evenements-calendrier";

export const evenementsApi = {
  getAll: async (params?: {
    from?: string;
    to?: string;
    type?: string;
  }): Promise<EvenementCalendrier[]> => {
    const res = await api.get<EvenementCalendrier[]>(BASE, { params });
    return res.data;
  },

  getById: async (id: string): Promise<EvenementCalendrier> => {
    const res = await api.get<EvenementCalendrier>(`${BASE}/${id}`);
    return res.data;
  },

  create: async (
    data: EvenementCalendrierInput
  ): Promise<EvenementCalendrier> => {
    const res = await api.post<EvenementCalendrier>(BASE, data);
    return res.data;
  },

  update: async (
    id: string,
    data: Partial<EvenementCalendrierInput>
  ): Promise<EvenementCalendrier> => {
    const res = await api.put<EvenementCalendrier>(`${BASE}/${id}`, data);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`${BASE}/${id}`);
  },
};
