import api from "./axios";
import type { Annonce } from "@/types/notification";

const BASE = "/annonces";

export const annoncesApi = {
  getAll: async (activeOnly = true): Promise<Annonce[]> => {
    const res = await api.get<Annonce[]>(BASE, {
      params: { activeOnly },
    });
    return res.data;
  },

  getById: async (id: string): Promise<Annonce> => {
    const res = await api.get<Annonce>(`${BASE}/${id}`);
    return res.data;
  },

  getByType: async (type: string): Promise<Annonce[]> => {
    const res = await api.get<Annonce[]>(`${BASE}/type/${type}`);
    return res.data;
  },

  create: async (data: Omit<Annonce, "id" | "createdAt" | "actif">): Promise<Annonce> => {
    const res = await api.post<Annonce>(BASE, data);
    return res.data;
  },

  update: async (id: string, data: Partial<Annonce>): Promise<Annonce> => {
    const res = await api.put<Annonce>(`${BASE}/${id}`, data);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`${BASE}/${id}`);
  },
};
