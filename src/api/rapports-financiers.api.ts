import api from "./axios";

// ─── Types ───────────────────────────────────────────

export interface Recapitulatif {
  totalDu: number;
  totalPaye: number;
  totalImpayes: number;
  totalDepenses: number;
  soldeNet: number;
  tauxRecouvrement: number;
  nbPaiements: number;
  nbPayes: number;
  nbPartiels: number;
  nbEnRetard: number;
  nbEnAttente: number;
  totalRemises: number;
  totalPenalites: number;
  nbRelances: number;
}

export interface LigneParMois {
  mois: string;
  montantDu: number;
  montantPaye: number;
  solde: number;
  nbPaiements: number;
  depenses: number;
}

export interface LigneParClasse {
  classe: string;
  nbEleves: number;
  montantDu: number;
  montantPaye: number;
  solde: number;
  tauxRecouvrement: number;
}

export interface LigneParEleve {
  studentId: string;
  nom: string;
  prenom: string;
  classe: string;
  montantDu: number;
  montantPaye: number;
  solde: number;
  statut: string;
}

export interface RapportFinancierDTO {
  recapitulatif: Recapitulatif;
  parMois: LigneParMois[];
  parClasse: LigneParClasse[];
  parEleve: LigneParEleve[];
}

// ─── API ─────────────────────────────────────────────

export const rapportsFinanciersApi = {
  generer: async (anneeScolaire = "2025-2026"): Promise<RapportFinancierDTO> => {
    const res = await api.get<RapportFinancierDTO>(
      `/rapports-financiers?anneeScolaire=${anneeScolaire}`
    );
    return res.data;
  },
};
