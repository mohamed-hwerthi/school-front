import api from "./axios";
import type { Room } from "@/types/room";
import { fromApi, toApi, type ClassroomApiDTO } from "./classroom-mapper";

const BASE = "/classrooms";

export const roomsApi = {
  getAll: async (): Promise<Room[]> => {
    const res = await api.get<ClassroomApiDTO[]>(BASE);
    return res.data.map(fromApi);
  },

  getById: async (id: string): Promise<Room> => {
    const res = await api.get<ClassroomApiDTO>(`${BASE}/${id}`);
    return fromApi(res.data);
  },

  create: async (data: Omit<Room, "id">): Promise<Room> => {
    const res = await api.post<ClassroomApiDTO>(BASE, toApi(data));
    return fromApi(res.data);
  },

  update: async (id: string, data: Omit<Room, "id">): Promise<Room> => {
    const res = await api.put<ClassroomApiDTO>(`${BASE}/${id}`, toApi(data));
    return fromApi(res.data);
  },

  delete: (id: string) => api.delete(`${BASE}/${id}`),
};
