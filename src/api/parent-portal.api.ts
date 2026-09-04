import api from "./axios";
import type { Child, Annonce } from "@/types/notification";

const BASE = "/parent-portal";

export interface ParentNote {
  id: string;
  studentId: string;
  studentName: string;
  examenId: string;
  examenName: string;
  trimestre: number;
  valeur: number;
  observation?: string;
}

export interface ParentAbsence {
  id: string;
  eleveId: string;
  date: string;
  type: string;
  seance: string;
  heureArrivee?: string;
  justifie: boolean;
  motif?: string;
  enseignantId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ParentBulletin {
  studentId: string;
  studentName: string;
  classe: string;
  niveau: string;
  trimestre: number;
  moyenneGenerale?: number;
  moyenneClasse?: number;
  rang?: number;
  totalEleves?: number;
  domaines: unknown[];
  modulesHorsDomaine: unknown[];
}

export interface ParentEmploiDuTemps {
  id: string;
  jourSemaine: number;
  creneauLabel?: string;
  heureDebut?: string;
  heureFin?: string;
  moduleNom?: string;
  enseignantNom?: string;
  salle?: string;
}

export interface ChildSoumission {
  id: string;
  contenu?: string;
  fichierUrl?: string;
  dateSoumission?: string;
  note?: number;
  commentaireCorrection?: string;
  corrige?: boolean;
  enRetard?: boolean;
}

export interface ChildDevoir {
  id: string;
  titre: string;
  description?: string;
  moduleNom?: string;
  enseignantNom?: string;
  type?: string;
  datePublication?: string;
  dateLimite?: string;
  pointsMax?: number;
  /** Enonce joint par l'enseignant. */
  fichierUrl?: string;
  statut?: string;
  /** false quand le devoir est cloture ou la copie deja corrigee. */
  rendable: boolean;
  soumission?: ChildSoumission | null;
}

export interface SubmitDevoirPayload {
  contenu?: string;
  fichierUrl?: string;
}

export interface ChildPaiementLigne {
  id: string;
  reference?: string;
  typeFraisNom?: string;
  mois?: string;
  anneeScolaire?: string;
  montantDu: number;
  montantPaye: number;
  reste: number;
  datePaiement?: string;
  modePaiement?: string;
  statut?: string;
}

export interface ChildPaiements {
  totalDu: number;
  totalPaye: number;
  reste: number;
  nbEnRetard: number;
  paiements: ChildPaiementLigne[];
}

export const parentPortalApi = {
  getChildren: async (): Promise<Child[]> => {
    const res = await api.get<Child[]>(`${BASE}/children`);
    return res.data;
  },

  getAnnonces: async (): Promise<Annonce[]> => {
    const res = await api.get<Annonce[]>(`${BASE}/annonces`);
    return res.data;
  },

  getChildNotes: async (studentId: string, trimestre = 1): Promise<ParentNote[]> => {
    const res = await api.get<ParentNote[]>(`${BASE}/children/${studentId}/notes`, {
      params: { trimestre },
    });
    return res.data;
  },

  getChildAbsences: async (studentId: string): Promise<ParentAbsence[]> => {
    const res = await api.get<ParentAbsence[]>(`${BASE}/children/${studentId}/absences`);
    return res.data;
  },

  // La classe est déduite côté serveur depuis la fiche de l'enfant.
  getChildBulletin: async (
    studentId: string,
    trimestre = 1
  ): Promise<ParentBulletin> => {
    const res = await api.get<ParentBulletin>(`${BASE}/children/${studentId}/bulletin`, {
      params: { trimestre },
    });
    return res.data;
  },

  getChildDevoirs: async (studentId: string): Promise<ChildDevoir[]> => {
    const res = await api.get<ChildDevoir[]>(`${BASE}/children/${studentId}/devoirs`);
    return res.data;
  },

  submitChildDevoir: async (
    studentId: string,
    devoirId: string,
    payload: SubmitDevoirPayload
  ): Promise<ChildDevoir> => {
    const res = await api.post<ChildDevoir>(
      `${BASE}/children/${studentId}/devoirs/${devoirId}/soumission`,
      payload
    );
    return res.data;
  },

  getChildPaiements: async (studentId: string): Promise<ChildPaiements> => {
    const res = await api.get<ChildPaiements>(`${BASE}/children/${studentId}/paiements`);
    return res.data;
  },

  getChildEmploiDuTemps: async (studentId: string): Promise<ParentEmploiDuTemps[]> => {
    const res = await api.get<ParentEmploiDuTemps[]>(
      `${BASE}/children/${studentId}/emploi-du-temps`
    );
    return res.data;
  },
};
