// ── Pointage ─────────────────────────────────────────
export type EmployeType = 'ENSEIGNANT' | 'ADMIN' | 'PERSONNEL';
export type StatutPointage = 'PRESENT' | 'ABSENT' | 'RETARD' | 'CONGE';
export type StatutFormation = 'PLANIFIEE' | 'EN_COURS' | 'TERMINEE' | 'ANNULEE';

export interface Pointage {
  id: string;
  employeId: string;
  employeType: EmployeType;
  datePointage: string;
  heureArrivee?: string;
  heureDepart?: string;
  heuresTravaillees?: number;
  statut: StatutPointage;
  notes?: string;
  createdAt?: string;
}

export interface CreatePointageRequest {
  employeId: string;
  employeType: EmployeType;
  datePointage?: string;
  heureArrivee?: string;
  heureDepart?: string;
  heuresTravaillees?: number;
  statut?: StatutPointage;
  notes?: string;
}

// ── Fiche de Paie ────────────────────────────────────
export interface FichePaie {
  id: string;
  employeId: string;
  employeType: string;
  mois: number;
  annee: number;
  salaireBase: number;
  primes: number;
  retenues: number;
  salaireNet: number;
  datePaiement?: string;
  paye: boolean;
  commentaire?: string;
  createdAt?: string;
}

export interface CreateFichePaieRequest {
  employeId: string;
  employeType: string;
  mois: number;
  annee: number;
  salaireBase: number;
  primes?: number;
  retenues?: number;
  salaireNet: number;
  datePaiement?: string;
  paye?: boolean;
  commentaire?: string;
}

// ── Formation ────────────────────────────────────────
export interface FormationParticipant {
  id: string;
  formationId: string;
  employeId: string;
  employeType: string;
  present: boolean;
  certificatObtenu: boolean;
}

export interface Formation {
  id: string;
  titre: string;
  description?: string;
  formateur?: string;
  dateDebut: string;
  dateFin?: string;
  lieu?: string;
  nombreHeures?: number;
  cout?: number;
  statut: StatutFormation;
  participants: FormationParticipant[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateFormationRequest {
  titre: string;
  description?: string;
  formateur?: string;
  dateDebut: string;
  dateFin?: string;
  lieu?: string;
  nombreHeures?: number;
  cout?: number;
  statut?: StatutFormation;
}

export interface AddParticipantRequest {
  employeId: string;
  employeType: string;
  present?: boolean;
  certificatObtenu?: boolean;
}

// ── Stats ────────────────────────────────────────────
export interface RhStats {
  totalEmployes: number;
  masseSalariale: number;
  formationsEnCours: number;
  tauxPresence: number;
}
