export type AbsenceType = 'ABSENCE' | 'RETARD';
export type AlertLevel = 'NORMAL' | 'JAUNE' | 'ROUGE';

export interface Absence {
  id: string;
  eleveId: string;
  eleveNom?: string;
  elevePrenom?: string;
  date: string;
  type: AbsenceType;
  seance: string;
  heureArrivee?: string;
  justifie: boolean;
  motif?: string;
  enseignantId?: string;
  createdAt: string;
}

export interface AbsenceBatchItem {
  eleveId: string;
  type: AbsenceType;
  seance: string;
  heureArrivee?: string;
}

export interface AbsenceBatchRequest {
  date: string;
  classeId: string;
  enseignantId?: string;
  absences: AbsenceBatchItem[];
}

export interface EleveAlert {
  eleveId: string;
  nom: string;
  prenom: string;
  absences: number;
  alertLevel: AlertLevel;
}

export interface AbsenceStats {
  totalAbsences: number;
  totalRetards: number;
  tauxPresence: number;
  alertLevel?: AlertLevel;
  elevesEnAlerte?: EleveAlert[];
  parEleve: Array<{
    eleveId: string;
    nom: string;
    prenom: string;
    absences: number;
    retards: number;
  }>;
}

export interface AbsenceSettings {
  id?: string;
  seuilAlerteJaune: number;
  seuilAlerteRouge: number;
  notificationAuto: boolean;
  notificationEmail: boolean;
  notificationSms: boolean;
}

export interface RapportPresence {
  classeLabel: string;
  mois: number;
  annee: number;
  totalEleves: number;
  totalAbsences: number;
  totalRetards: number;
  tauxPresenceGlobal: number;
  eleves: Array<{
    eleveId: string;
    nom: string;
    prenom: string;
    totalAbsences: number;
    totalRetards: number;
    totalJustifiees: number;
    tauxPresence: number;
  }>;
}

export interface MonthlyBreakdown {
  month: number;
  year: number;
  absences: number;
  retards: number;
  justifiees: number;
  tauxPresence: number;
}

export interface RecentAbsence {
  id: string;
  date: string;
  type: AbsenceType;
  seance: string;
  heureArrivee?: string;
  justifie: boolean;
  motif?: string;
}

export interface FeuilleJour {
  classeId: string;
  classeLabel: string;
  niveauName?: string;
  date: string;
  totalEleves: number;
  absences: number;
  retards: number;
  justifiees: number;
}

export interface HistoriquePresence {
  eleveId: string;
  studentName: string;
  totalAbsences: number;
  totalRetards: number;
  totalJustifiees: number;
  tauxPresence: number;
  alertLevel: AlertLevel;
  monthlyBreakdown: MonthlyBreakdown[];
  recentAbsences: RecentAbsence[];
}
