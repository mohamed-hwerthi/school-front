export type EvenementType =
  | "GENERAL"
  | "REUNION"
  | "SORTIE"
  | "EXAMEN"
  | "FERIE"
  | "AUTRE";

export interface EvenementCalendrier {
  id: string;
  titre: string;
  description?: string;
  dateDebut: string; // YYYY-MM-DD
  dateFin?: string;  // YYYY-MM-DD
  type: EvenementType;
  couleur?: string;
  lieu?: string;
  createdAt: string;
  updatedAt: string;
}

export type EvenementCalendrierInput = Omit<
  EvenementCalendrier,
  "id" | "createdAt" | "updatedAt"
>;
