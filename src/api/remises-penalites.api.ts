import api from "./axios";

// ─── Remise DTOs ──────────────────────────────────────

export interface RemiseDTO {
  id: string;
  studentId: string;
  studentFirstName: string;
  studentLastName: string;
  typeFraisId: string | null;
  typeFraisNom: string | null;
  type: "FRATRIE" | "BOURSE" | "PERSONNEL" | "ANTICIPATION" | "COMMERCIAL";
  valeur: number;
  estPourcentage: boolean;
  motif: string | null;
  anneeScolaire: string;
  active: boolean;
  createdAt: string;
}

export interface RemiseRequest {
  studentId: string;
  typeFraisId?: string | null;
  type: RemiseDTO["type"];
  valeur: number;
  estPourcentage?: boolean;
  motif?: string;
  anneeScolaire?: string;
  active?: boolean;
}

// ─── Pénalité DTOs ────────────────────────────────────

export interface PenaliteDTO {
  id: string;
  studentId: string;
  studentFirstName: string;
  studentLastName: string;
  paiementId: string | null;
  paiementReference: string | null;
  montant: number;
  motif: string;
  dateApplication: string;
  anneeScolaire: string;
  payee: boolean;
  createdAt: string;
}

export interface PenaliteRequest {
  studentId: string;
  paiementId?: string | null;
  montant: number;
  motif: string;
  dateApplication?: string;
  anneeScolaire?: string;
  payee?: boolean;
}

// ─── API calls ────────────────────────────────────────

export const remisesApi = {
  getAll: async (anneeScolaire = "2025-2026"): Promise<RemiseDTO[]> => {
    const res = await api.get<RemiseDTO[]>(`/remises?anneeScolaire=${anneeScolaire}`);
    return res.data;
  },

  getByStudent: async (studentId: string, anneeScolaire = "2025-2026"): Promise<RemiseDTO[]> => {
    const res = await api.get<RemiseDTO[]>(`/remises/eleve/${studentId}?anneeScolaire=${anneeScolaire}`);
    return res.data;
  },

  create: async (data: RemiseRequest): Promise<RemiseDTO> => {
    const res = await api.post<RemiseDTO>("/remises", data);
    return res.data;
  },

  update: async (id: string, data: RemiseRequest): Promise<RemiseDTO> => {
    const res = await api.put<RemiseDTO>(`/remises/${id}`, data);
    return res.data;
  },

  delete: (id: string) => api.delete(`/remises/${id}`),
};

export const penalitesApi = {
  getAll: async (anneeScolaire = "2025-2026"): Promise<PenaliteDTO[]> => {
    const res = await api.get<PenaliteDTO[]>(`/penalites?anneeScolaire=${anneeScolaire}`);
    return res.data;
  },

  getByStudent: async (studentId: string, anneeScolaire = "2025-2026"): Promise<PenaliteDTO[]> => {
    const res = await api.get<PenaliteDTO[]>(`/penalites/eleve/${studentId}?anneeScolaire=${anneeScolaire}`);
    return res.data;
  },

  create: async (data: PenaliteRequest): Promise<PenaliteDTO> => {
    const res = await api.post<PenaliteDTO>("/penalites", data);
    return res.data;
  },

  update: async (id: string, data: PenaliteRequest): Promise<PenaliteDTO> => {
    const res = await api.put<PenaliteDTO>(`/penalites/${id}`, data);
    return res.data;
  },

  togglePayee: async (id: string): Promise<PenaliteDTO> => {
    const res = await api.patch<PenaliteDTO>(`/penalites/${id}/toggle-payee`);
    return res.data;
  },

  delete: (id: string) => api.delete(`/penalites/${id}`),
};
