import api from "./axios";

export interface FluxMensuel {
  mois: string;
  entrees: number;
  sorties: number;
  solde: number;
}

export interface TopDebiteur {
  studentId: string;
  studentName: string;
  classe: string;
  montantDu: number;
  montantPaye: number;
  solde: number;
}

export interface RepartitionDepense {
  categorie: string;
  montant: number;
}

export interface TresorerieDTO {
  totalEntrees: number;
  totalSorties: number;
  solde: number;
  totalDu: number;
  totalImpayes: number;
  tauxRecouvrement: number;
  elevesAJour: number;
  elevesEnRetard: number;
  totalEleves: number;
  elevesSuivis: number;
  fluxMensuels: FluxMensuel[];
  topDebiteurs: TopDebiteur[];
  repartitionDepenses: RepartitionDepense[];
}

/** Une ligne du grand livre mensuel. Les cles de `entrees`/`sorties` sont dynamiques. */
export interface LigneMois {
  cle: string;
  mois: string | null;
  libelle: string;
  annee: number | null;
  moisNumero: number | null;
  entrees: Record<string, number>;
  totalEntrees: number;
  sorties: Record<string, number>;
  totalSorties: number;
  solde: number;
  soldeCumule: number;
  montantDu: number;
  impayesEleves: number;
  salairesAVerser: number;
  nbMouvements: number;
}

export interface TresorerieDetailDTO {
  anneeScolaire: string;
  colonnesEntrees: string[];
  colonnesSorties: string[];
  lignes: LigneMois[];
  total: LigneMois;
}

export interface MouvementFinancier {
  id: string;
  date: string;
  sens: "ENTREE" | "SORTIE";
  source: "PAIEMENT" | "DEPENSE" | "SALAIRE" | "CAISSE";
  categorie: string;
  libelle: string;
  tiers: string | null;
  modePaiement: string | null;
  reference: string | null;
  montant: number;
  moisCle: string;
}

export const tresorerieApi = {
  get: async (anneeScolaire: string): Promise<TresorerieDTO> => {
    const res = await api.get<TresorerieDTO>(
      `/tresorerie?anneeScolaire=${anneeScolaire}`
    );
    return res.data;
  },

  getDetail: async (anneeScolaire: string): Promise<TresorerieDetailDTO> => {
    const res = await api.get<TresorerieDetailDTO>(
      `/tresorerie/detail?anneeScolaire=${encodeURIComponent(anneeScolaire)}`
    );
    return res.data;
  },

  /** `mois` au format "YYYY-MM" ; omis, l'annee entiere est renvoyee. */
  getMouvements: async (
    anneeScolaire: string,
    mois?: string
  ): Promise<MouvementFinancier[]> => {
    const params = new URLSearchParams({ anneeScolaire });
    if (mois) params.set("mois", mois);
    const res = await api.get<MouvementFinancier[]>(`/tresorerie/mouvements?${params}`);
    return res.data;
  },
};
