import api from "./axios";
import type {
  DocumentGenerationRequest,
  DocumentHistory,
  DocumentTemplateConfig,
} from "@/types/document";

const BASE = "/documents";

export const documentsApi = {
  generateCertificatScolarite: async (eleveId: string): Promise<Blob> => {
    const res = await api.post(`${BASE}/certificat-scolarite/${eleveId}`, null, {
      responseType: "blob",
    });
    return res.data;
  },

  generateCarteScolaire: async (eleveId: string): Promise<Blob> => {
    const res = await api.post(`${BASE}/carte-scolaire/${eleveId}`, null, {
      responseType: "blob",
    });
    return res.data;
  },

  generateAttestation: async (
    eleveId: string,
    anneeScolaire?: string
  ): Promise<Blob> => {
    const params = anneeScolaire ? { anneeScolaire } : {};
    const res = await api.post(`${BASE}/attestation/${eleveId}`, null, {
      params,
      responseType: "blob",
    });
    return res.data;
  },

  generateReleveNotes: async (
    eleveId: string,
    trimestre?: number
  ): Promise<Blob> => {
    const params = trimestre ? { trimestre } : {};
    const res = await api.post(`${BASE}/releve-notes/${eleveId}`, null, {
      params,
      responseType: "blob",
    });
    return res.data;
  },

  generateRecuPaiement: async (paiementId: string): Promise<Blob> => {
    const res = await api.post(`${BASE}/recu-paiement/${paiementId}`, null, {
      responseType: "blob",
    });
    return res.data;
  },

  generateBulk: async (request: DocumentGenerationRequest): Promise<Blob> => {
    const res = await api.post(`${BASE}/bulk`, request, {
      responseType: "blob",
    });
    return res.data;
  },

  getHistorique: async (): Promise<DocumentHistory[]> => {
    const res = await api.get<DocumentHistory[]>(`${BASE}/historique`);
    return res.data;
  },

  getTemplateConfig: async (): Promise<DocumentTemplateConfig> => {
    const res = await api.get<DocumentTemplateConfig>(
      `${BASE}/template-config`
    );
    return res.data;
  },

  updateTemplateConfig: async (
    config: DocumentTemplateConfig
  ): Promise<DocumentTemplateConfig> => {
    const res = await api.put<DocumentTemplateConfig>(
      `${BASE}/template-config`,
      config
    );
    return res.data;
  },
};
