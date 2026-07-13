import api from "./axios";
import type { Passage, BulkPassage } from "@/types/passage";

const BASE = "/passages";

export const passagesApi = {
  getByAnneeScolaire: async (anneeScolaire: string = "2025-2026"): Promise<Passage[]> => {
    const res = await api.get<Passage[]>(BASE, {
      params: { anneeScolaire },
    });
    return res.data;
  },

  create: async (data: Omit<Passage, "id" | "createdAt" | "studentName">): Promise<Passage> => {
    const res = await api.post<Passage>(BASE, data);
    return res.data;
  },

  bulkCreate: async (data: BulkPassage): Promise<Passage[]> => {
    const res = await api.post<Passage[]>(`${BASE}/bulk`, data);
    return res.data;
  },

  getByStudent: async (studentId: string): Promise<Passage[]> => {
    const res = await api.get<Passage[]>(`${BASE}/student/${studentId}`);
    return res.data;
  },
};
