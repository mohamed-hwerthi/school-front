export type TypeCirculaire = "Information" | "Règlement" | "Événement" | "Urgent" | "Pédagogique";

export type StatutCirculaire = "Brouillon" | "Publiée" | "Archivée";

export type CibleCirculaire = "Tous" | "Enseignants" | "Parents" | "Élèves" | "Administration";

export type Circulaire = {
  id: string;
  titre: string;
  type: TypeCirculaire;
  contenu: string;
  dateCreation: string;
  datePublication: string | null;
  statut: StatutCirculaire;
  auteur: string;
  cible: CibleCirculaire;
  pieceJointe: string | null;
  important: boolean;
};

export const TYPES_CIRCULAIRE: TypeCirculaire[] = [
  "Information",
  "Règlement",
  "Événement",
  "Urgent",
  "Pédagogique",
];

export const STATUTS_CIRCULAIRE: StatutCirculaire[] = [
  "Brouillon",
  "Publiée",
  "Archivée",
];

export const CIBLES_CIRCULAIRE: CibleCirculaire[] = [
  "Tous",
  "Enseignants",
  "Parents",
  "Élèves",
  "Administration",
];
