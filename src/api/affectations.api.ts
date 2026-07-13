import api from "./axios";

export interface AffectationDTO {
  id: string;
  teacherId: string;
  teacherName: string;
  classeId: string;
  classeName: string;
  moduleId: string | null;
  moduleName: string | null;
  anneeScolaire: string;
  dateDebut: string | null;
  dateFin: string | null;
  notes: string | null;
}

export interface AffectationRequest {
  teacherId: string;
  classeId: string;
  moduleId: string | null;
  anneeScolaire: string;
  dateDebut?: string | null;
  dateFin?: string | null;
  notes?: string | null;
}

export interface AffectationBulkItem {
  classeId: string;
  moduleId: string | null;
}

export interface AffectationBulkRequest {
  teacherId: string;
  anneeScolaire: string;
  dateDebut?: string | null;
  dateFin?: string | null;
  notes?: string | null;
  items: AffectationBulkItem[];
}

export interface AffectationBulkResult {
  created: number;
  skipped: number;
  affectations: AffectationDTO[];
}

export interface AffectationFilters {
  teacherId?: string;
  classeId?: string;
  moduleId?: string;
  anneeScolaire?: string;
}

const BASE = "/affectations";

export const affectationsApi = {
  search: async (filters: AffectationFilters = {}): Promise<AffectationDTO[]> => {
    const params = new URLSearchParams();
    if (filters.teacherId != null) params.set("teacherId", String(filters.teacherId));
    if (filters.classeId != null) params.set("classeId", String(filters.classeId));
    if (filters.moduleId != null) params.set("moduleId", String(filters.moduleId));
    if (filters.anneeScolaire) params.set("anneeScolaire", filters.anneeScolaire);
    const qs = params.toString();
    const res = await api.get<AffectationDTO[]>(`${BASE}${qs ? `?${qs}` : ""}`);
    return res.data;
  },

  getOne: async (id: string): Promise<AffectationDTO> => {
    const res = await api.get<AffectationDTO>(`${BASE}/${id}`);
    return res.data;
  },

  create: async (req: AffectationRequest): Promise<AffectationDTO> => {
    const res = await api.post<AffectationDTO>(BASE, req);
    return res.data;
  },

  bulkCreate: async (req: AffectationBulkRequest): Promise<AffectationBulkResult> => {
    const res = await api.post<AffectationBulkResult>(`${BASE}/bulk`, req);
    return res.data;
  },

  update: async (id: string, req: AffectationRequest): Promise<AffectationDTO> => {
    const res = await api.put<AffectationDTO>(`${BASE}/${id}`, req);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`${BASE}/${id}`);
  },
};
