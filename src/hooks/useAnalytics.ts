import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { analyticsApi } from "@/api/analytics.api";
import type {
  SuiviEleve,
  ComparaisonClasses,
  Kpi,
  Cohorte,
  KpiConfig,
  KpiConfigRequest,
} from "@/types/analytics";

const SUIVI_KEY = "analytics-suivi-eleve";
const RISQUE_KEY = "analytics-eleves-risque";
const COMPARAISON_KEY = "analytics-comparaison-classes";
const KPI_KEY = "analytics-kpis";
const COHORTES_KEY = "analytics-cohortes";
const KPI_CONFIG_KEY = "analytics-kpi-config";

/**
 * 360-degree student tracking.
 */
export function useSuiviEleve(eleveId: string) {
  return useQuery<SuiviEleve>({
    queryKey: [SUIVI_KEY, eleveId],
    queryFn: () => analyticsApi.getSuiviEleve(eleveId),
    enabled: !!eleveId,
  });
}

/**
 * Students at risk above a given threshold.
 */
export function useElevesARisque(seuil: number = 70) {
  return useQuery<SuiviEleve[]>({
    queryKey: [RISQUE_KEY, seuil],
    queryFn: () => analyticsApi.getElevesARisque(seuil),
  });
}

/**
 * Class comparison stats.
 */
export function useComparaisonClasses() {
  return useQuery<ComparaisonClasses>({
    queryKey: [COMPARAISON_KEY],
    queryFn: () => analyticsApi.getComparaisonClasses(),
  });
}

/**
 * KPI values vs targets.
 */
export function useKpis() {
  return useQuery<Kpi[]>({
    queryKey: [KPI_KEY],
    queryFn: () => analyticsApi.getKpis(),
  });
}

/**
 * Cohort tracking.
 */
export function useCohortes(niveauId?: string) {
  return useQuery<Cohorte[]>({
    queryKey: [COHORTES_KEY, niveauId],
    queryFn: () => analyticsApi.getCohortes(niveauId),
  });
}

// ── KPI Config CRUD ──

export function useKpiConfigs() {
  return useQuery<KpiConfig[]>({
    queryKey: [KPI_CONFIG_KEY],
    queryFn: () => analyticsApi.getKpiConfigs(),
  });
}

export function useCreateKpiConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: KpiConfigRequest) => analyticsApi.createKpiConfig(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KPI_CONFIG_KEY] });
      qc.invalidateQueries({ queryKey: [KPI_KEY] });
    },
  });
}

export function useUpdateKpiConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: KpiConfigRequest }) =>
      analyticsApi.updateKpiConfig(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KPI_CONFIG_KEY] });
      qc.invalidateQueries({ queryKey: [KPI_KEY] });
    },
  });
}

export function useDeleteKpiConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => analyticsApi.deleteKpiConfig(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KPI_CONFIG_KEY] });
      qc.invalidateQueries({ queryKey: [KPI_KEY] });
    },
  });
}
