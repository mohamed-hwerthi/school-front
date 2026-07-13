import api from "./axios";

// ─── Types ───────────────────────────────────────────

export type StatutCaisse = "OUVERTE" | "FERMEE";
export type TypeMouvement = "ENTREE" | "SORTIE";
export type CategorieMouvement =
  | "PAIEMENT_SCOLARITE" | "INSCRIPTION" | "CANTINE" | "TRANSPORT"
  | "FOURNITURES" | "SALAIRE" | "FACTURE" | "MAINTENANCE" | "AUTRE";

export interface CaisseDTO {
  id: string;
  dateOuverture: string;
  dateFermeture: string | null;
  statut: StatutCaisse;
  soldeOuverture: number;
  soldeFermeture: number | null;
  totalEntrees: number;
  totalSorties: number;
  soldeActuel: number;
  anneeScolaire: string;
  notes: string | null;
  ouvertPar: string | null;
  fermePar: string | null;
  createdAt: string;
}

export interface CaisseRequest {
  soldeOuverture: number;
  anneeScolaire?: string;
  notes?: string;
  ouvertPar?: string;
}

export interface MouvementDTO {
  id: string;
  caisseId: string;
  type: TypeMouvement;
  categorie: CategorieMouvement;
  montant: number;
  libelle: string;
  referencePaiement: string | null;
  notes: string | null;
  createdAt: string;
}

export interface MouvementRequest {
  caisseId: string;
  type: TypeMouvement;
  categorie: CategorieMouvement;
  montant: number;
  libelle: string;
  referencePaiement?: string;
  notes?: string;
}

// ─── API ─────────────────────────────────────────────

export const caisseApi = {
  getAll: async (anneeScolaire = "2025-2026"): Promise<CaisseDTO[]> => {
    const res = await api.get<CaisseDTO[]>(`/caisse?anneeScolaire=${anneeScolaire}`);
    return res.data;
  },

  getOuverte: async (anneeScolaire = "2025-2026"): Promise<CaisseDTO | null> => {
    const res = await api.get<CaisseDTO | null>(`/caisse/ouverte?anneeScolaire=${anneeScolaire}`);
    return res.data;
  },

  getById: async (id: string): Promise<CaisseDTO> => {
    const res = await api.get<CaisseDTO>(`/caisse/${id}`);
    return res.data;
  },

  ouvrir: async (data: CaisseRequest): Promise<CaisseDTO> => {
    const res = await api.post<CaisseDTO>("/caisse/ouvrir", data);
    return res.data;
  },

  fermer: async (id: string, fermePar?: string): Promise<CaisseDTO> => {
    const res = await api.patch<CaisseDTO>(`/caisse/${id}/fermer${fermePar ? `?fermePar=${fermePar}` : ""}`);
    return res.data;
  },

  getMouvements: async (caisseId: string): Promise<MouvementDTO[]> => {
    const res = await api.get<MouvementDTO[]>(`/caisse/${caisseId}/mouvements`);
    return res.data;
  },

  addMouvement: async (data: MouvementRequest): Promise<MouvementDTO> => {
    const res = await api.post<MouvementDTO>("/caisse/mouvements", data);
    return res.data;
  },

  deleteMouvement: async (id: string) => api.delete(`/caisse/mouvements/${id}`),
};
