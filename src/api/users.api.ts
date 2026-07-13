import api from "./axios";
import type { UserItem, CreateUserRequest } from "@/types/user";

const BASE = "/users";

export interface UserFilters {
  page?: number;
  size?: number;
  search?: string;
  role?: string;
  isActive?: boolean;
}

export interface PagedUsers {
  content: UserItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export const usersApi = {
  getAll: async (filters: UserFilters = {}): Promise<PagedUsers> => {
    const params = new URLSearchParams();
    if (filters.page != null) params.set("page", String(filters.page));
    if (filters.size != null) params.set("size", String(filters.size));
    if (filters.search) params.set("search", filters.search);
    if (filters.role) params.set("role", filters.role);
    if (filters.isActive != null) params.set("isActive", String(filters.isActive));

    const res = await api.get<PagedUsers>(`${BASE}?${params.toString()}`);
    return res.data;
  },

  getById: async (id: string): Promise<UserItem> => {
    const res = await api.get<UserItem>(`${BASE}/${id}`);
    return res.data;
  },

  create: async (data: CreateUserRequest): Promise<UserItem> => {
    const res = await api.post<UserItem>(BASE, data);
    return res.data;
  },

  update: async (id: string, data: Partial<CreateUserRequest>): Promise<UserItem> => {
    const res = await api.put<UserItem>(`${BASE}/${id}`, data);
    return res.data;
  },

  toggleActive: async (id: string): Promise<UserItem> => {
    const res = await api.patch<UserItem>(`${BASE}/${id}/toggle-active`);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`${BASE}/${id}`);
  },
};
