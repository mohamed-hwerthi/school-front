import api from "./axios";
import type {
  Scolarite,
  ReinscriptionResult,
  SuiviReinscription,
  AttestationReussite,
} from "@/types/scolarite";

const BASE = "/scolarites";

export const scolariteApi = {
  /** A student's year-by-year schooling history. */
  getHistorique: async (studentId: string): Promise<Scolarite[]> => {
    const res = await api.get<Scolarite[]>(`${BASE}/student/${studentId}`);
    return res.data;
  },

  /** Re-enrol passing students from one year into the next. */
  reinscrire: async (
    anneeSource: string,
    anneeDestination: string
  ): Promise<ReinscriptionResult> => {
    const res = await api.post<ReinscriptionResult>(`${BASE}/reinscription`, null, {
      params: { anneeSource, anneeDestination },
    });
    return res.data;
  },

  /** Re-enrolment tracking for a school year. */
  getSuivi: async (anneeScolaire: string): Promise<SuiviReinscription> => {
    const res = await api.get<SuiviReinscription>(`${BASE}/suivi`, {
      params: { anneeScolaire },
    });
    return res.data;
  },

  /** Certificate of success for a student. */
  getAttestationReussite: async (
    studentId: string,
    anneeScolaire: string
  ): Promise<AttestationReussite> => {
    const res = await api.get<AttestationReussite>(`${BASE}/attestation-reussite`, {
      params: { studentId, anneeScolaire },
    });
    return res.data;
  },
};
