import api from "./axios";

export interface RecommandationDTO {
  id: string;
  studentId: string;
  studentName: string;
  domaineId: string;
  domaineName: string;
  trimestre: number;
  texte: string | null;
}

export interface RecommandationRequest {
  studentId: string;
  domaineId: string;
  trimestre: number;
  texte?: string;
}

export interface ObservationDTO {
  id: string;
  studentId: string;
  studentName: string;
  trimestre: number;
  comportement: string | null;
  certificatType: string | null;
}

export interface ObservationRequest {
  studentId: string;
  trimestre: number;
  comportement?: string;
  certificatType?: string;
}

const BASE = "/appreciations";

export const appreciationsApi = {
  getRecommandations: async (
    studentIds: string[],
    trimestre: number
  ): Promise<RecommandationDTO[]> => {
    const ids = studentIds.join(",");
    const res = await api.get<RecommandationDTO[]>(
      `${BASE}/recommandations?studentIds=${ids}&trimestre=${trimestre}`
    );
    return res.data;
  },

  upsertRecommandations: async (
    items: RecommandationRequest[]
  ): Promise<RecommandationDTO[]> => {
    const res = await api.post<RecommandationDTO[]>(
      `${BASE}/recommandations/bulk`,
      { items }
    );
    return res.data;
  },

  getObservations: async (
    studentIds: string[],
    trimestre: number
  ): Promise<ObservationDTO[]> => {
    const ids = studentIds.join(",");
    const res = await api.get<ObservationDTO[]>(
      `${BASE}/observations?studentIds=${ids}&trimestre=${trimestre}`
    );
    return res.data;
  },

  upsertObservations: async (
    items: ObservationRequest[]
  ): Promise<ObservationDTO[]> => {
    const res = await api.post<ObservationDTO[]>(
      `${BASE}/observations/bulk`,
      { items }
    );
    return res.data;
  },
};
