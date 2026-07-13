import api from "./axios";

export interface MeetingRequest {
  title: string;
  date: string;
  heureDebut: string;
  heureFin: string;
  enseignantId?: string;
  parentId?: string;
  studentId?: string;
  statut?: string;
  notes?: string;
}

export interface MeetingResponse {
  id: string;
  title: string;
  date: string;
  heureDebut: string;
  heureFin: string;
  enseignantId?: string;
  enseignantName?: string;
  parentId?: string;
  parentName?: string;
  studentId?: string;
  studentName?: string;
  statut: "PLANIFIE" | "CONFIRME" | "ANNULE";
  notes?: string;
  createdAt: string;
}

const BASE = "/meetings";

export const meetingsApi = {
  getAll: async (): Promise<MeetingResponse[]> => {
    const res = await api.get<MeetingResponse[]>(BASE);
    return res.data;
  },

  getById: async (id: string): Promise<MeetingResponse> => {
    const res = await api.get<MeetingResponse>(`${BASE}/${id}`);
    return res.data;
  },

  getByTeacher: async (enseignantId: string): Promise<MeetingResponse[]> => {
    const res = await api.get<MeetingResponse[]>(`${BASE}/teacher/${enseignantId}`);
    return res.data;
  },

  getByParent: async (parentId: string): Promise<MeetingResponse[]> => {
    const res = await api.get<MeetingResponse[]>(`${BASE}/parent/${parentId}`);
    return res.data;
  },

  getByStudent: async (studentId: string): Promise<MeetingResponse[]> => {
    const res = await api.get<MeetingResponse[]>(`${BASE}/student/${studentId}`);
    return res.data;
  },

  getByDateRange: async (start: string, end: string): Promise<MeetingResponse[]> => {
    const res = await api.get<MeetingResponse[]>(`${BASE}/range`, {
      params: { start, end },
    });
    return res.data;
  },

  getByStatut: async (statut: string): Promise<MeetingResponse[]> => {
    const res = await api.get<MeetingResponse[]>(`${BASE}/statut/${statut}`);
    return res.data;
  },

  create: async (data: MeetingRequest): Promise<MeetingResponse> => {
    const res = await api.post<MeetingResponse>(BASE, data);
    return res.data;
  },

  update: async (id: string, data: MeetingRequest): Promise<MeetingResponse> => {
    const res = await api.put<MeetingResponse>(`${BASE}/${id}`, data);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`${BASE}/${id}`);
  },
};
