import api from "./axios";
import type { Notification } from "@/types/notification";

const BASE = "/notifications";

export const notificationsApi = {
  getAll: async (): Promise<Notification[]> => {
    const res = await api.get<Notification[]>(BASE);
    return res.data;
  },

  getUnreadCount: async (): Promise<number> => {
    const res = await api.get<number>(`${BASE}/count`);
    return res.data;
  },

  markAsRead: async (id: string): Promise<Notification> => {
    const res = await api.put<Notification>(`${BASE}/${id}/read`);
    return res.data;
  },

  markAllAsRead: async (): Promise<void> => {
    await api.put(`${BASE}/read-all`);
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`${BASE}/${id}`);
  },
};
