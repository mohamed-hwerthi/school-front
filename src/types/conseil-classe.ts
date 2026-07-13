import type { DecisionType } from "@/types/passage";

/** One row of a conseil de classe: a student, their annual average and the proposed decision. */
export interface PropositionPassage {
  studentId: string;
  studentName: string;
  niveauActuel: string;
  classeActuelle: string;
  moyenneT1: number | null;
  moyenneT2: number | null;
  moyenneT3: number | null;
  moyenneAnnuelle: number | null;
  rang: number | null;
  decisionProposee: DecisionType;
  niveauSuivant: string | null;
  mention: string | null;
}

/** Conseil de classe for one class: propositions plus the context to validate them. */
export interface ConseilClasse {
  classeId: string;
  classeNom: string;
  niveauNom: string;
  niveauSuivant: string | null;
  seuilPassage: number;
  anneeScolaire: string | null;
  propositions: PropositionPassage[];
}
