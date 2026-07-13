import api from "./axios";

export type NoteStatut = "PRESENT" | "ABSENT" | "EXEMPT";

export interface NoteDTO {
  id: string;
  studentId: string;
  studentName: string;
  examenId: string;
  examenName: string;
  trimestre: number;
  valeur: number | null;
  observation: string | null;
  statut: NoteStatut;
}

export interface NoteRequest {
  studentId: string;
  examenId: string;
  trimestre: number;
  valeur: number | null;
  observation?: string;
  statut?: NoteStatut;
}

export interface MoyenneDTO {
  studentId: string;
  studentName: string;
  trimestre: number;
  moyennesParModule: Record<string, number>;
  moyenneGenerale: number;
}

// NOT-007: Bareme
export interface BaremeDTO {
  id?: string;
  label: string;
  noteMax: number;
  noteMin: number;
  notePassage: number;
  actif: boolean;
}

// NOT-009: Competences
export interface CompetenceDTO {
  id?: string;
  moduleId: string;
  label: string;
  description?: string;
}

// NOT-010: Evaluation competences
export interface EvaluationCompetenceDTO {
  id?: string;
  eleveId: string;
  competenceId: string;
  competenceLabel?: string;
  examenId: string;
  niveau: "NON_ATTEINT" | "EN_COURS" | "ATTEINT" | "DEPASSE";
  commentaire?: string;
}

const BASE = "/notes";

export const notesApi = {
  getByExamen: async (examenId: string, trimestre: number): Promise<NoteDTO[]> => {
    const res = await api.get<NoteDTO[]>(`${BASE}?examenId=${examenId}&trimestre=${trimestre}`);
    return res.data;
  },

  getByStudent: async (studentId: string, trimestre: number): Promise<NoteDTO[]> => {
    const res = await api.get<NoteDTO[]>(`${BASE}/student/${studentId}?trimestre=${trimestre}`);
    return res.data;
  },

  upsertBulk: async (notes: NoteRequest[]): Promise<NoteDTO[]> => {
    const res = await api.post<NoteDTO[]>(`${BASE}/bulk`, { notes });
    return res.data;
  },

  getMoyennes: async (classeId: string, trimestre: number): Promise<MoyenneDTO[]> => {
    const res = await api.get<MoyenneDTO[]>(`${BASE}/moyennes?classeId=${classeId}&trimestre=${trimestre}`);
    return res.data;
  },

  delete: (id: string) => api.delete(`${BASE}/${id}`),

  // Baremes
  getBaremes: async (): Promise<BaremeDTO[]> => {
    const res = await api.get<BaremeDTO[]>(`${BASE}/baremes`);
    return res.data;
  },

  createBareme: async (dto: BaremeDTO): Promise<BaremeDTO> => {
    const res = await api.post<BaremeDTO>(`${BASE}/baremes`, dto);
    return res.data;
  },

  updateBareme: async (id: string, dto: BaremeDTO): Promise<BaremeDTO> => {
    const res = await api.put<BaremeDTO>(`${BASE}/baremes/${id}`, dto);
    return res.data;
  },

  // Competences
  getCompetences: async (moduleId?: string): Promise<CompetenceDTO[]> => {
    const params = moduleId ? `?moduleId=${moduleId}` : "";
    const res = await api.get<CompetenceDTO[]>(`${BASE}/competences${params}`);
    return res.data;
  },

  createCompetence: async (dto: CompetenceDTO): Promise<CompetenceDTO> => {
    const res = await api.post<CompetenceDTO>(`${BASE}/competences`, dto);
    return res.data;
  },

  deleteCompetence: async (id: string): Promise<void> => {
    await api.delete(`${BASE}/competences/${id}`);
  },

  // Evaluations competences
  getEvaluationsCompetences: async (examenId: string, eleveId?: string): Promise<EvaluationCompetenceDTO[]> => {
    const params = eleveId ? `?examenId=${examenId}&eleveId=${eleveId}` : `?examenId=${examenId}`;
    const res = await api.get<EvaluationCompetenceDTO[]>(`${BASE}/evaluations-competences${params}`);
    return res.data;
  },

  createEvaluationCompetence: async (dto: EvaluationCompetenceDTO): Promise<EvaluationCompetenceDTO> => {
    const res = await api.post<EvaluationCompetenceDTO>(`${BASE}/evaluations-competences`, dto);
    return res.data;
  },
};
