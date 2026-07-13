import api from "./axios";
import type {
  SuiviEleve,
  ComparaisonClasses,
  Kpi,
  Cohorte,
  KpiConfig,
  KpiConfigRequest,
} from "@/types/analytics";

const BASE = "/analytics";

export const analyticsApi = {
  getSuiviEleve: async (eleveId: string): Promise<SuiviEleve> => {
    const res = await api.get<SuiviEleve>(`${BASE}/suivi-eleve/${eleveId}`);
    return res.data;
  },

  getElevesARisque: async (seuil: number = 70): Promise<SuiviEleve[]> => {
    const res = await api.get<SuiviEleve[]>(`${BASE}/eleves-a-risque`, {
      params: { seuil },
    });
    return res.data;
  },

  getComparaisonClasses: async (): Promise<ComparaisonClasses> => {
    const res = await api.get<ComparaisonClasses>(`${BASE}/comparaison-classes`);
    return res.data;
  },

  getKpis: async (): Promise<Kpi[]> => {
    const res = await api.get<Kpi[]>(`${BASE}/kpis`);
    return res.data;
  },

  getCohortes: async (niveauId?: string): Promise<Cohorte[]> => {
    const res = await api.get<Cohorte[]>(`${BASE}/cohortes`, {
      params: niveauId ? { niveauId } : {},
    });
    return res.data;
  },

  // KPI Config CRUD
  getKpiConfigs: async (): Promise<KpiConfig[]> => {
    const res = await api.get<KpiConfig[]>(`${BASE}/kpi-config`);
    return res.data;
  },

  getKpiConfig: async (id: string): Promise<KpiConfig> => {
    const res = await api.get<KpiConfig>(`${BASE}/kpi-config/${id}`);
    return res.data;
  },

  createKpiConfig: async (data: KpiConfigRequest): Promise<KpiConfig> => {
    const res = await api.post<KpiConfig>(`${BASE}/kpi-config`, data);
    return res.data;
  },

  updateKpiConfig: async (id: string, data: KpiConfigRequest): Promise<KpiConfig> => {
    const res = await api.put<KpiConfig>(`${BASE}/kpi-config/${id}`, data);
    return res.data;
  },

  deleteKpiConfig: async (id: string): Promise<void> => {
    await api.delete(`${BASE}/kpi-config/${id}`);
  },
};
