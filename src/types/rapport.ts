export type TypeRapport = "Bulletin trimestriel" | "Rapport annuel" | "Rapport de discipline" | "Rapport d'absence" | "Rapport financier" | "PV de conseil";

export type StatutRapport = "Brouillon" | "Généré" | "Validé" | "Envoyé";

export type Rapport = {
  id: string;
  titre: string;
  type: TypeRapport;
  periode: string;
  dateGeneration: string;
  statut: StatutRapport;
  auteur: string;
  destinataire: string;
  description: string;
  fichier: string;
};

export const TYPES_RAPPORT: TypeRapport[] = [
  "Bulletin trimestriel",
  "Rapport annuel",
  "Rapport de discipline",
  "Rapport d'absence",
  "Rapport financier",
  "PV de conseil",
];

export const STATUTS_RAPPORT: StatutRapport[] = [
  "Brouillon",
  "Généré",
  "Validé",
  "Envoyé",
];
