export interface Livre {
  id: string;
  titre: string;
  auteur: string | null;
  isbn: string | null;
  categorie: string | null;
  editeur: string | null;
  anneePublication: number | null;
  description: string | null;
  nombreExemplaires: number;
  exemplairesDisponibles: number;
  emplacement: string | null;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLivreRequest {
  titre: string;
  auteur?: string | null;
  isbn?: string | null;
  categorie?: string | null;
  editeur?: string | null;
  anneePublication?: number | null;
  description?: string | null;
  nombreExemplaires?: number | null;
  emplacement?: string | null;
  imageUrl?: string | null;
}

export type EmpruntStatut = "EN_COURS" | "RETOURNE" | "EN_RETARD" | "PERDU";

export interface Emprunt {
  id: string;
  livreId: string;
  livreTitle: string;
  eleveId: string;
  eleveName: string;
  dateEmprunt: string;
  dateRetourPrevue: string;
  dateRetourEffective: string | null;
  statut: EmpruntStatut;
  penalite: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmpruntRequest {
  livreId: string;
  eleveId: string;
  dateRetourPrevue: string;
  notes?: string | null;
}

export interface LivreEmprunte {
  livreId: string;
  titre: string;
  count: number;
}

export interface BibliothequeStats {
  totalLivres: number;
  totalEmprunts: number;
  empruntsEnCours: number;
  empruntsEnRetard: number;
  livresLesPlusEmpruntes: LivreEmprunte[];
}
