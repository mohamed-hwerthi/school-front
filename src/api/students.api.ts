import api from "./axios";
import type { Student } from "@/types/student";
import { fromApi, toApi, type StudentApiDTO } from "./student-mapper";

const BASE = "/students";

export interface PagedResult<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface StudentFilters {
  page?: number;
  size?: number;
  search?: string;
  niveau?: string;
  classe?: string;
  status?: string;
  sex?: string;
  blocked?: boolean;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}

export const studentsApi = {
  getAll: async (filters: StudentFilters = {}): Promise<PagedResult<Student>> => {
    const params = new URLSearchParams();
    if (filters.page != null) params.set("page", String(filters.page));
    if (filters.size != null) params.set("size", String(filters.size));
    if (filters.search) params.set("search", filters.search);
    if (filters.niveau) params.set("niveau", filters.niveau);
    if (filters.classe) params.set("classe", filters.classe);
    if (filters.status) params.set("status", filters.status);
    if (filters.sex) params.set("sex", filters.sex);
    if (filters.blocked != null) params.set("blocked", String(filters.blocked));
    if (filters.sortBy) params.set("sortBy", filters.sortBy);
    if (filters.sortDir) params.set("sortDir", filters.sortDir);

    const res = await api.get<PagedResult<StudentApiDTO>>(
      `${BASE}?${params.toString()}`
    );
    return {
      ...res.data,
      content: res.data.content.map(fromApi),
    };
  },

  getById: async (id: string): Promise<Student> => {
    const res = await api.get<StudentApiDTO>(`${BASE}/${id}`);
    return fromApi(res.data);
  },

  create: async (data: Omit<Student, "id" | "dateInscription">): Promise<Student> => {
    const res = await api.post<StudentApiDTO>(BASE, toApi(data));
    return fromApi(res.data);
  },

  update: async (id: string, data: Partial<Student>): Promise<Student> => {
    const res = await api.put<StudentApiDTO>(`${BASE}/${id}`, toApi(data as Omit<Student, "id" | "dateInscription">));
    return fromApi(res.data);
  },

  delete: (id: string) => api.delete(`${BASE}/${id}`),

  importBulk: async (
    students: Omit<Student, "id" | "dateInscription">[]
  ): Promise<Student[]> => {
    const payload = students.map(toApi);
    const res = await api.post<StudentApiDTO[]>(`${BASE}/import`, payload);
    return res.data.map(fromApi);
  },

  importBulkRobust: async (
    students: Omit<Student, "id" | "dateInscription">[]
  ): Promise<BulkImportResult> => {
    const payload = students.map(toApi);
    const res = await api.post<BulkImportResult>(`${BASE}/import/robust`, payload);
    return res.data;
  },
};

export interface BulkImportRowError {
  row: number;
  field?: string | null;
  message: string;
  code: "VALIDATION" | "DUPLICATE" | "ERROR";
}

export interface BulkImportResult {
  created: number;
  skipped: number;
  failed: number;
  errors: BulkImportRowError[];
}
