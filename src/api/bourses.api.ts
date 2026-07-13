import api from "./axios";

// ─── Backend DTOs ────────────────────────────────────────

export interface BourseDTO {
  id: string;
  studentId: string;
  studentName: string;
  type: "BOURSE" | "AIDE" | "EXONERATION";
  label: string;
  montant: number;
  pourcentage: number | null;
  anneeScolaire: string;
  statut: "ACTIVE" | "SUSPENDUE" | "TERMINEE";
  dateDebut: string | null;
  dateFin: string | null;
  motif: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BourseRequest {
  studentId: string;
  type: "BOURSE" | "AIDE" | "EXONERATION";
  label: string;
  montant: number;
  pourcentage?: number | null;
  anneeScolaire: string;
  statut?: "ACTIVE" | "SUSPENDUE" | "TERMINEE";
  dateDebut?: string | null;
  dateFin?: string | null;
  motif?: string | null;
}

// ─── API calls ───────────────────────────────────────────

export const boursesApi = {
  getAll: async (anneeScolaire?: string): Promise<BourseDTO[]> => {
    const params = anneeScolaire ? `?anneeScolaire=${anneeScolaire}` : "";
    const res = await api.get<BourseDTO[]>(`/bourses${params}`);
    return res.data;
  },

  getById: async (id: string): Promise<BourseDTO> => {
    const res = await api.get<BourseDTO>(`/bourses/${id}`);
    return res.data;
  },

  getByStudent: async (studentId: string, anneeScolaire?: string): Promise<BourseDTO[]> => {
    const params = anneeScolaire ? `?anneeScolaire=${anneeScolaire}` : "";
    const res = await api.get<BourseDTO[]>(`/bourses/student/${studentId}${params}`);
    return res.data;
  },

  create: async (data: BourseRequest): Promise<BourseDTO> => {
    const res = await api.post<BourseDTO>("/bourses", data);
    return res.data;
  },

  update: async (id: string, data: BourseRequest): Promise<BourseDTO> => {
    const res = await api.put<BourseDTO>(`/bourses/${id}`, data);
    return res.data;
  },

  delete: (id: string) => api.delete(`/bourses/${id}`),
};
