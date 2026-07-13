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
  fluxMensuels: FluxMensuel[];
  topDebiteurs: TopDebiteur[];
  repartitionDepenses: RepartitionDepense[];
}

export const tresorerieApi = {
  get: async (anneeScolaire: string): Promise<TresorerieDTO> => {
    const res = await api.get<TresorerieDTO>(
      `/tresorerie?anneeScolaire=${anneeScolaire}`
    );
    return res.data;
  },
};
