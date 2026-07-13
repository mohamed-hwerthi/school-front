export type InscriptionStatut =
  | "SOUMISE"
  | "EN_REVISION"
  | "ACCEPTEE"
  | "REFUSEE"
  | "EN_ATTENTE"
  | "LISTE_ATTENTE";

export interface Inscription {
  id: string;
  nom: string;
  prenom: string;
  dateNaissance: string;
  lieuNaissance?: string;
  sexe?: string;
  adresse?: string;
  telephoneParent?: string;
  emailParent?: string;
  nomParent?: string;
  prenomParent?: string;
  niveauId?: string;
  niveauNom?: string;
  anneeScolaire: string;
  statut: InscriptionStatut;
  commentaire?: string;
  numeroDossier: string;
  documentsPaths?: string[];
  montantFrais?: number;
  fraisPaye?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInscriptionRequest {
  nom: string;
  prenom: string;
  dateNaissance: string;
  lieuNaissance?: string;
  sexe?: string;
  adresse?: string;
  telephoneParent?: string;
  emailParent?: string;
  nomParent?: string;
  prenomParent?: string;
  niveauId?: string;
  anneeScolaire: string;
}

export interface UpdateStatutRequest {
  statut: InscriptionStatut;
  commentaire?: string;
}

export interface InscriptionStats {
  totalSoumises: number;
  totalAcceptees: number;
  totalRefusees: number;
  totalEnAttente: number;
  totalListeAttente: number;
  tauxConversion: number;
}

export interface PagedInscriptions {
  content: Inscription[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}
