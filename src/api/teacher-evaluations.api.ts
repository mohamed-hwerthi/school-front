import api from "./axios";
import type { TeacherEvaluation, TeacherEvaluationStats } from "@/types/teacher-evaluation";

const BASE = "/teacher-evaluations";

export const teacherEvaluationsApi = {
  getAll: async (params?: { teacherId?: string; anneeScolaire?: string }): Promise<TeacherEvaluation[]> => {
    const res = await api.get<TeacherEvaluation[]>(BASE, { params });
    return res.data;
  },

  getById: async (id: string): Promise<TeacherEvaluation> => {
    const res = await api.get<TeacherEvaluation>(`${BASE}/${id}`);
    return res.data;
  },

  create: async (data: Omit<TeacherEvaluation, "id" | "createdAt" | "teacherName" | "noteGlobale">): Promise<TeacherEvaluation> => {
    const res = await api.post<TeacherEvaluation>(BASE, data);
    return res.data;
  },

  update: async (id: string, data: Partial<TeacherEvaluation>): Promise<TeacherEvaluation> => {
    const res = await api.put<TeacherEvaluation>(`${BASE}/${id}`, data);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`${BASE}/${id}`);
  },

  getStats: async (teacherId: string): Promise<TeacherEvaluationStats> => {
    const res = await api.get<TeacherEvaluationStats>(`${BASE}/stats/${teacherId}`);
    return res.data;
  },
};
