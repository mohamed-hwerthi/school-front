export interface Passage {
  id: string;
  studentId: string;
  studentName: string;
  ancienNiveau: string;
  nouveauNiveau: string;
  ancienneClasse: string;
  nouvelleClasse: string;
  decision: "PASSAGE" | "REDOUBLEMENT" | "EXCLUSION" | "TRANSFERT";
  anneeScolaire: string;
  motif: string;
  createdAt: string;
}

export interface BulkPassage {
  passages: Omit<Passage, "id" | "createdAt" | "studentName">[];
}

export const DECISIONS = ["PASSAGE", "REDOUBLEMENT", "EXCLUSION", "TRANSFERT"] as const;

export type DecisionType = (typeof DECISIONS)[number];
