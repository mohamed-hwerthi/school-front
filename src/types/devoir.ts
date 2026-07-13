export type TypeDevoir = 'DEVOIR' | 'EXERCICE' | 'PROJET' | 'EXPOSE';
export type StatutDevoir = 'BROUILLON' | 'PUBLIE' | 'FERME';
export type TypeRessource = 'DOCUMENT' | 'VIDEO' | 'LIEN' | 'IMAGE' | 'AUDIO';

export interface Devoir {
  id: string;
  titre: string;
  description: string | null;
  moduleId: string | null;
  classeId: string | null;
  enseignantId: string | null;
  datePublication: string;
  dateLimite: string;
  type: TypeDevoir;
  pointsMax: number;
  fichierUrl: string | null;
  statut: StatutDevoir;
  anneeScolaire: string;
  totalSoumissions: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDevoirRequest {
  titre: string;
  description?: string;
  moduleId?: string;
  classeId?: string;
  enseignantId?: string;
  datePublication?: string;
  dateLimite: string;
  type?: TypeDevoir;
  pointsMax?: number;
  fichierUrl?: string;
  statut?: StatutDevoir;
  anneeScolaire?: string;
}

export interface Soumission {
  id: string;
  devoirId: string;
  devoirTitre: string;
  eleveId: string;
  contenu: string | null;
  fichierUrl: string | null;
  dateSoumission: string;
  note: number | null;
  commentaireCorrection: string | null;
  corrige: boolean;
  enRetard: boolean;
  anneeScolaire: string;
  createdAt: string;
}

export interface CreateSoumissionRequest {
  devoirId: string;
  eleveId: string;
  contenu?: string;
  fichierUrl?: string;
}

export interface CorrectionRequest {
  note: number;
  commentaire?: string;
}

export interface RessourcePedagogique {
  id: string;
  titre: string;
  description: string | null;
  moduleId: string | null;
  type: TypeRessource;
  fichierUrl: string | null;
  lienExterne: string | null;
  enseignantId: string | null;
  tailleFichier: number | null;
  anneeScolaire: string;
  createdAt: string;
}

export interface CreateRessourceRequest {
  titre: string;
  description?: string;
  moduleId?: string;
  type?: TypeRessource;
  fichierUrl?: string;
  lienExterne?: string;
  enseignantId?: string;
  tailleFichier?: number;
  anneeScolaire?: string;
}

export interface DevoirStats {
  totalDevoirs: number;
  totalSoumissions: number;
  tauxSoumission: number;
  moyenneNotes: number;
  enRetard: number;
}
