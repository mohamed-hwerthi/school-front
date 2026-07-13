import api from "./axios";
import type { Absence, AbsenceBatchRequest, AbsenceStats, FeuilleJour } from "@/types/absence";

const BASE = "/absences";

export const absencesApi = {
  batchCreate: async (data: AbsenceBatchRequest): Promise<Absence[]> => {
    const payload = {
      absences: data.absences.map((a) => ({
        eleveId: a.eleveId,
        date: data.date,
        type: a.type,
        seance: a.seance,
        heureArrivee: a.heureArrivee,
        enseignantId: data.enseignantId,
      })),
    };
    const res = await api.post<Absence[]>(`${BASE}/batch`, payload);
    return res.data;
  },

  getByClasseDate: async (classeId: string, date: string): Promise<Absence[]> => {
    const params: Record<string, string | number> = { date };
    if (classeId) params.classeId = classeId;
    const res = await api.get<Absence[]>(`${BASE}`, { params });
    return res.data;
  },

  getFeuillesByDate: async (date: string): Promise<FeuilleJour[]> => {
    const res = await api.get<FeuilleJour[]>(`${BASE}/feuilles`, { params: { date } });
    return res.data;
  },

  getByEleve: async (eleveId: string): Promise<Absence[]> => {
    const res = await api.get<Absence[]>(`${BASE}/eleve/${eleveId}`);
    return res.data;
  },

  getStats: async (classeId?: string, dateDebut?: string, dateFin?: string): Promise<AbsenceStats> => {
    const params = new URLSearchParams();
    if (classeId) params.set("classeId", String(classeId));
    if (dateDebut) params.set("dateDebut", dateDebut);
    if (dateFin) params.set("dateFin", dateFin);

    const res = await api.get<AbsenceStats>(`${BASE}/stats?${params.toString()}`);
    return res.data;
  },

  justifier: async (id: string, motif: string): Promise<Absence> => {
    const res = await api.patch<Absence>(`${BASE}/${id}/justifier`, { motif });
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`${BASE}/${id}`);
  },
};
