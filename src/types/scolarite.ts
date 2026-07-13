/** One historised year of a student's schooling (ANN-004). */
export interface Scolarite {
  id: string;
  studentId: string;
  studentName: string;
  anneeScolaire: string;
  niveau: string | null;
  classe: string | null;
  statut: string;
}

/** Outcome of a mass re-enrolment (ANN-050). */
export interface ReinscriptionResult {
  anneeSource: string;
  anneeDestination: string;
  nbReinscrits: number;
  nbIgnores: number;
  message: string;
}

/** Re-enrolment tracking, this year vs the previous one (ANN-051). */
export interface SuiviReinscription {
  anneeScolaire: string;
  anneePrecedente: string | null;
  totalInscrits: number;
  reinscrits: number;
  nouveaux: number;
  partis: number;
}

/** Certificate of success for a student for a school year (ANN-042). */
export interface AttestationReussite {
  studentId: string;
  studentName: string;
  anneeScolaire: string;
  eligible: boolean;
  ancienNiveau: string | null;
  nouveauNiveau: string | null;
  decision: string | null;
  message: string;
}
