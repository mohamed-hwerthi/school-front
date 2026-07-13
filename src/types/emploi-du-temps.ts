export interface Creneau {
  id: string;
  label: string;
  heureDebut: string;
  heureFin: string;
  type: 'COURS' | 'PAUSE' | 'RECREATION';
}

export interface EmploiDuTempsEntry {
  id?: string;
  classeId: string;
  creneauId: string;
  jourSemaine: number;
  moduleId?: string;
  moduleName?: string;
  enseignantId?: string;
  enseignantNom?: string;
  salle?: string;
}

export interface Conflit {
  typeConflit?: string;
  message: string;
  jourSemaine: number;
  creneauId: string;
  enseignantId?: string;
  salle?: string;
}

export interface RemplacementRequest {
  emploiDuTempsId: string;
  enseignantRemplacantId: string;
  dateDebut: string;
  dateFin: string;
  motif?: string;
}

export interface Remplacement {
  id: string;
  emploiDuTempsId: string;
  enseignantRemplacantId: string;
  dateDebut: string;
  dateFin: string;
  motif?: string;
  createdAt?: string;
}

// --- Auto-generation types ---

export interface TeachingAssignment {
  classeId: string;
  moduleId: string;
  enseignantId: string;
  nbHeures: number;
}

export interface TimetableGenerateRequest {
  // Legacy mode — caller provides assignments/rooms explicitly
  assignments?: TeachingAssignment[];
  rooms?: string[];
  // Auto mode — service loads from DB
  niveauId?: string;
  anneeScolaireId?: string;
  solverTimeoutSeconds?: number;
}

export interface TimetableGenerateResponse {
  status: 'SOLVED' | 'INFEASIBLE';
  score: string;
  entries: EmploiDuTempsEntry[];
  unresolvedConflicts: string[];
}

export interface TimetablePreviewCheck {
  anneeScolaireId: string | null;
  anneeScolaireLabel: string | null;
  niveauId: string | null;
  niveauName: string | null;
  totalModules: number;
  modulesWithVolume: number;
  volumesWithoutTeacher: number;
  totalLessonsToSchedule: number;
  totalTeachersInvolved: number;
  teachersWithoutDispos: number;
  teachersWithoutDisposList: { id: string; name: string }[];
  totalAvailableRooms: number;
  roomsByType: Record<string, number>;
  missingRoomTypes: string[];
  courseSlotsPerWeek: number;
  totalSlotCapacity: number;
  canGenerate: boolean;
  blockers: string[];
  warnings: string[];
}
