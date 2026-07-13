export interface Facture {
  id: string;
  numero: string;
  eleveId: string;
  eleveNom?: string;
  dateEmission: string;
  dateEcheance?: string;
  montantTotal: number;
  montantRemise: number;
  montantNet: number;
  statut: 'NON_PAYEE' | 'PARTIELLEMENT_PAYEE' | 'PAYEE' | 'ANNULEE';
}

export interface Echeancier {
  id: string;
  eleveId: string;
  typeFraisId?: string;
  montantTotal: number;
  nbMensualites: number;
  dateDebut: string;
  echeances: Echeance[];
}

export interface Echeance {
  id: string;
  numero: number;
  montant: number;
  dateEcheance: string;
  statut: 'EN_ATTENTE' | 'PAYEE' | 'EN_RETARD';
  paiementId?: string;
}
