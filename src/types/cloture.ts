/** One pre-closure verification item. */
export interface PreCheck {
  code: string;
  label: string;
  ok: boolean;
  blocking: boolean;
  detail: string;
}

/** Result of the pre-closure verifications for a school year. */
export interface PreChecksResponse {
  anneeId: string;
  anneeScolaire: string;
  cloturable: boolean;
  checks: PreCheck[];
}

/** Options for closing a school year. */
export interface ClotureRequest {
  creerAnneeSuivante: boolean;
  labelAnneeSuivante?: string;
  dateDebutSuivante?: string;
  dateFinSuivante?: string;
  activerAnneeSuivante: boolean;
}

/** Outcome of a school-year closure. */
export interface ClotureResult {
  anneeClotureeId: string;
  anneeClotureeLabel: string;
  nouvelleAnneeId: string | null;
  nouvelleAnneeLabel: string | null;
  trimestresCrees: number;
  message: string;
}
