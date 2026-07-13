import api from "./axios";
import type {
  Pointage,
  CreatePointageRequest,
  FichePaie,
  CreateFichePaieRequest,
  Formation,
  CreateFormationRequest,
  FormationParticipant,
  AddParticipantRequest,
  RhStats,
} from "@/types/rh";

const BASE = "/rh";

export const rhApi = {
  // ── Pointage ──────────────────────────────────────
  getAllPointages: async (): Promise<Pointage[]> => {
    const res = await api.get<Pointage[]>(`${BASE}/pointage`);
    return res.data;
  },

  getPointagesByDate: async (date: string): Promise<Pointage[]> => {
    const res = await api.get<Pointage[]>(`${BASE}/pointage/date/${date}`);
    return res.data;
  },

  getPointagesByEmploye: async (employeId: string, employeType?: string): Promise<Pointage[]> => {
    const res = await api.get<Pointage[]>(`${BASE}/pointage/employe/${employeId}`, {
      params: { employeType: employeType || "ENSEIGNANT" },
    });
    return res.data;
  },

  createPointage: async (data: CreatePointageRequest): Promise<Pointage> => {
    const res = await api.post<Pointage>(`${BASE}/pointage`, data);
    return res.data;
  },

  updatePointage: async (id: string, data: CreatePointageRequest): Promise<Pointage> => {
    const res = await api.put<Pointage>(`${BASE}/pointage/${id}`, data);
    return res.data;
  },

  deletePointage: async (id: string): Promise<void> => {
    await api.delete(`${BASE}/pointage/${id}`);
  },

  // ── Fiches de Paie ────────────────────────────────
  getAllFichesPaie: async (): Promise<FichePaie[]> => {
    const res = await api.get<FichePaie[]>(`${BASE}/paie`);
    return res.data;
  },

  getFichePaieById: async (id: string): Promise<FichePaie> => {
    const res = await api.get<FichePaie>(`${BASE}/paie/${id}`);
    return res.data;
  },

  getFichesPaieByEmploye: async (employeId: string): Promise<FichePaie[]> => {
    const res = await api.get<FichePaie[]>(`${BASE}/paie/employe/${employeId}`);
    return res.data;
  },

  getFichesPaieByMois: async (mois: number, annee: number): Promise<FichePaie[]> => {
    const res = await api.get<FichePaie[]>(`${BASE}/paie/mois`, {
      params: { mois, annee },
    });
    return res.data;
  },

  createFichePaie: async (data: CreateFichePaieRequest): Promise<FichePaie> => {
    const res = await api.post<FichePaie>(`${BASE}/paie`, data);
    return res.data;
  },

  updateFichePaie: async (id: string, data: CreateFichePaieRequest): Promise<FichePaie> => {
    const res = await api.put<FichePaie>(`${BASE}/paie/${id}`, data);
    return res.data;
  },

  deleteFichePaie: async (id: string): Promise<void> => {
    await api.delete(`${BASE}/paie/${id}`);
  },

  // ── Formations ────────────────────────────────────
  getAllFormations: async (): Promise<Formation[]> => {
    const res = await api.get<Formation[]>(`${BASE}/formations`);
    return res.data;
  },

  getFormationById: async (id: string): Promise<Formation> => {
    const res = await api.get<Formation>(`${BASE}/formations/${id}`);
    return res.data;
  },

  createFormation: async (data: CreateFormationRequest): Promise<Formation> => {
    const res = await api.post<Formation>(`${BASE}/formations`, data);
    return res.data;
  },

  updateFormation: async (id: string, data: CreateFormationRequest): Promise<Formation> => {
    const res = await api.put<Formation>(`${BASE}/formations/${id}`, data);
    return res.data;
  },

  deleteFormation: async (id: string): Promise<void> => {
    await api.delete(`${BASE}/formations/${id}`);
  },

  addParticipant: async (formationId: string, data: AddParticipantRequest): Promise<FormationParticipant> => {
    const res = await api.post<FormationParticipant>(`${BASE}/formations/${formationId}/participants`, data);
    return res.data;
  },

  removeParticipant: async (participantId: string): Promise<void> => {
    await api.delete(`${BASE}/formations/participants/${participantId}`);
  },

  // ── Stats ─────────────────────────────────────────
  getStats: async (): Promise<RhStats> => {
    const res = await api.get<RhStats>(`${BASE}/formations/stats`);
    return res.data;
  },
};
