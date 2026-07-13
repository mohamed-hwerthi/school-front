import api from "./axios";
import type {
  Menu,
  CreateMenuRequest,
  AbonnementCantine,
  CreateAbonnementRequest,
  PointageRepas,
  PointageBatchRequest,
  CantineStats,
} from "@/types/cantine";

// ---- Menus ----

export const menusApi = {
  getAll: async (): Promise<Menu[]> => {
    const res = await api.get<Menu[]>("/cantine/menus");
    return res.data;
  },

  getById: async (id: string): Promise<Menu> => {
    const res = await api.get<Menu>(`/cantine/menus/${id}`);
    return res.data;
  },

  getMenuSemaine: async (semaine: number): Promise<Menu[]> => {
    const res = await api.get<Menu[]>(`/cantine/menus/semaine/${semaine}`);
    return res.data;
  },

  getMenuByDateRange: async (start: string, end: string): Promise<Menu[]> => {
    const res = await api.get<Menu[]>("/cantine/menus/range", {
      params: { start, end },
    });
    return res.data;
  },

  create: async (data: CreateMenuRequest): Promise<Menu> => {
    const res = await api.post<Menu>("/cantine/menus", data);
    return res.data;
  },

  update: async (id: string, data: CreateMenuRequest): Promise<Menu> => {
    const res = await api.put<Menu>(`/cantine/menus/${id}`, data);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/cantine/menus/${id}`);
  },

  uploadImage: async (id: string, file: File): Promise<Menu> => {
    const form = new FormData();
    form.append("file", file);
    const res = await api.post<Menu>(`/cantine/menus/${id}/image`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },
};

// ---- Abonnements Cantine ----

export const abonnementsCantineApi = {
  getAll: async (): Promise<AbonnementCantine[]> => {
    const res = await api.get<AbonnementCantine[]>("/cantine/abonnements");
    return res.data;
  },

  getActifs: async (): Promise<AbonnementCantine[]> => {
    const res = await api.get<AbonnementCantine[]>("/cantine/abonnements/actifs");
    return res.data;
  },

  getById: async (id: string): Promise<AbonnementCantine> => {
    const res = await api.get<AbonnementCantine>(`/cantine/abonnements/${id}`);
    return res.data;
  },

  getByEleve: async (eleveId: string): Promise<AbonnementCantine[]> => {
    const res = await api.get<AbonnementCantine[]>(`/cantine/abonnements/eleve/${eleveId}`);
    return res.data;
  },

  create: async (data: CreateAbonnementRequest): Promise<AbonnementCantine> => {
    const res = await api.post<AbonnementCantine>("/cantine/abonnements", data);
    return res.data;
  },

  update: async (id: string, data: CreateAbonnementRequest): Promise<AbonnementCantine> => {
    const res = await api.put<AbonnementCantine>(`/cantine/abonnements/${id}`, data);
    return res.data;
  },

  deactivate: async (id: string): Promise<AbonnementCantine> => {
    const res = await api.put<AbonnementCantine>(`/cantine/abonnements/${id}/deactivate`);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/cantine/abonnements/${id}`);
  },
};

// ---- Pointages Repas ----

export const pointagesRepasApi = {
  getByDate: async (date: string, typeRepas?: string): Promise<PointageRepas[]> => {
    const params: Record<string, string> = { date };
    if (typeRepas) params.typeRepas = typeRepas;
    const res = await api.get<PointageRepas[]>("/cantine/pointages", { params });
    return res.data;
  },

  getByEleve: async (eleveId: string): Promise<PointageRepas[]> => {
    const res = await api.get<PointageRepas[]>(`/cantine/pointages/eleve/${eleveId}`);
    return res.data;
  },

  pointer: async (data: PointageBatchRequest): Promise<PointageRepas[]> => {
    const res = await api.post<PointageRepas[]>("/cantine/pointages", data);
    return res.data;
  },

  getStats: async (): Promise<CantineStats> => {
    const res = await api.get<CantineStats>("/cantine/pointages/stats");
    return res.data;
  },
};
