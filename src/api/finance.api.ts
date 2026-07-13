import api from "./axios";
import type { PagedResult } from "./students.api";

// ─── Backend DTOs ────────────────────────────────────────

export interface TypeFraisDTO {
  id: string;
  nom: string;
  montant: number;
  frequence: "MENSUEL" | "TRIMESTRIEL" | "ANNUEL" | "UNIQUE";
  description: string | null;
  actif: boolean;
  createdAt: string;
}

export interface TypeFraisRequest {
  nom: string;
  montant: number;
  frequence: "MENSUEL" | "TRIMESTRIEL" | "ANNUEL" | "UNIQUE";
  description?: string;
  actif?: boolean;
}

export interface PaiementDTO {
  id: string;
  studentId: string;
  studentFirstName: string;
  studentLastName: string;
  typeFraisId: string;
  typeFraisNom: string;
  mois: string;
  anneeScolaire: string;
  montantDu: number;
  montantPaye: number;
  datePaiement: string | null;
  modePaiement: "ESPECES" | "VIREMENT" | "CHEQUE" | "CARTE_BANCAIRE" | "PRELEVEMENT" | null;
  statut: "PAYE" | "PARTIEL" | "EN_ATTENTE" | "EN_RETARD";
  reference: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaiementRequest {
  studentId: string;
  typeFraisId: string;
  mois: string;
  anneeScolaire: string;
  montantDu: number;
  montantPaye: number;
  datePaiement?: string | null;
  modePaiement?: "ESPECES" | "VIREMENT" | "CHEQUE" | "CARTE_BANCAIRE" | "PRELEVEMENT" | null;
  statut?: "PAYE" | "PARTIEL" | "EN_ATTENTE" | "EN_RETARD";
  reference?: string;
  notes?: string;
}

export interface FinanceDashboardDTO {
  totalEncaisse: number;
  totalDu: number;
  totalImpayes: number;
  tauxRecouvrement: number;
  totalPaiements: number;
  paiementsPayes: number;
  paiementsEnRetard: number;
  paiementsPartiels: number;
  paiementsEnAttente: number;
}

export interface PaiementFilters {
  page?: number;
  size?: number;
  search?: string;
  anneeScolaire?: string;
  mois?: string;
  statut?: string;
  modePaiement?: string;
  studentId?: string;
  typeFraisId?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}

// ─── API calls ───────────────────────────────────────────

export const typesFraisApi = {
  getAll: async (): Promise<TypeFraisDTO[]> => {
    const res = await api.get<TypeFraisDTO[]>("/types-frais");
    return res.data;
  },

  getAllActifs: async (): Promise<TypeFraisDTO[]> => {
    const res = await api.get<TypeFraisDTO[]>("/types-frais/actifs");
    return res.data;
  },

  getById: async (id: string): Promise<TypeFraisDTO> => {
    const res = await api.get<TypeFraisDTO>(`/types-frais/${id}`);
    return res.data;
  },

  create: async (data: TypeFraisRequest): Promise<TypeFraisDTO> => {
    const res = await api.post<TypeFraisDTO>("/types-frais", data);
    return res.data;
  },

  update: async (id: string, data: TypeFraisRequest): Promise<TypeFraisDTO> => {
    const res = await api.put<TypeFraisDTO>(`/types-frais/${id}`, data);
    return res.data;
  },

  delete: (id: string) => api.delete(`/types-frais/${id}`),
};

export const paiementsApi = {
  getAll: async (filters: PaiementFilters = {}): Promise<PagedResult<PaiementDTO>> => {
    const params = new URLSearchParams();
    if (filters.page != null) params.set("page", String(filters.page));
    if (filters.size != null) params.set("size", String(filters.size));
    if (filters.search) params.set("search", filters.search);
    if (filters.anneeScolaire) params.set("anneeScolaire", filters.anneeScolaire);
    if (filters.mois) params.set("mois", filters.mois);
    if (filters.statut) params.set("statut", filters.statut);
    if (filters.modePaiement) params.set("modePaiement", filters.modePaiement);
    if (filters.studentId != null) params.set("studentId", String(filters.studentId));
    if (filters.typeFraisId != null) params.set("typeFraisId", String(filters.typeFraisId));
    if (filters.sortBy) params.set("sortBy", filters.sortBy);
    if (filters.sortDir) params.set("sortDir", filters.sortDir);

    const res = await api.get<PagedResult<PaiementDTO>>(`/paiements?${params.toString()}`);
    return res.data;
  },

  getById: async (id: string): Promise<PaiementDTO> => {
    const res = await api.get<PaiementDTO>(`/paiements/${id}`);
    return res.data;
  },

  getByStudentId: async (studentId: string, anneeScolaire?: string): Promise<PaiementDTO[]> => {
    const params = anneeScolaire ? `?anneeScolaire=${anneeScolaire}` : "";
    const res = await api.get<PaiementDTO[]>(`/paiements/eleve/${studentId}${params}`);
    return res.data;
  },

  create: async (data: PaiementRequest): Promise<PaiementDTO> => {
    const res = await api.post<PaiementDTO>("/paiements", data);
    return res.data;
  },

  update: async (id: string, data: PaiementRequest): Promise<PaiementDTO> => {
    const res = await api.put<PaiementDTO>(`/paiements/${id}`, data);
    return res.data;
  },

  delete: (id: string) => api.delete(`/paiements/${id}`),

  getDashboard: async (anneeScolaire: string): Promise<FinanceDashboardDTO> => {
    const res = await api.get<FinanceDashboardDTO>(
      `/paiements/dashboard?anneeScolaire=${anneeScolaire}`
    );
    return res.data;
  },
};
