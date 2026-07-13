import api from "./axios";
import type { Child } from "@/types/notification";

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
  classeId: string;
  creneauId: string;
  jourSemaine: number;
  moduleId?: string;
  enseignantId?: string;
  salle?: string;
  createdAt: string;
  updatedAt: string;
}

export const parentPortalApi = {
  getChildren: async (): Promise<Child[]> => {
    const res = await api.get<Child[]>(`${BASE}/children`);
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

  getChildBulletin: async (
    studentId: string,
    classeId: string,
    trimestre = 1
  ): Promise<ParentBulletin> => {
    const res = await api.get<ParentBulletin>(`${BASE}/children/${studentId}/bulletin`, {
      params: { classeId, trimestre },
    });
    return res.data;
  },

  getChildEmploiDuTemps: async (studentId: string): Promise<ParentEmploiDuTemps[]> => {
    const res = await api.get<ParentEmploiDuTemps[]>(
      `${BASE}/children/${studentId}/emploi-du-temps`
    );
    return res.data;
  },
};
