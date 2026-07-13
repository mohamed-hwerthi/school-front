import { useQuery } from "@tanstack/react-query";
import { reportingApi } from "@/api/reporting.api";
import { useAnneeContext } from "./useAnneeContext";
import type { DashboardStats, MonthlyTrend } from "@/types/reporting";

const DASHBOARD_KEY = "reporting-dashboard";
const TRENDS_KEY = "reporting-trends";

/**
 * Dashboard stats for a given academic year.
 */
export function useDashboardStats(anneeScolaire?: string) {
  const { selectedAnnee } = useAnneeContext();
  const year = anneeScolaire ?? selectedAnnee?.label ?? "";
  return useQuery<DashboardStats>({
    queryKey: [DASHBOARD_KEY, year],
    queryFn: () => reportingApi.getDashboard(year),
    enabled: !!year,
  });
}

/**
 * Monthly trends for a given academic year.
 */
export function useMonthlyTrends(anneeScolaire?: string) {
  const { selectedAnnee } = useAnneeContext();
  const year = anneeScolaire ?? selectedAnnee?.label ?? "";
  return useQuery<MonthlyTrend[]>({
    queryKey: [TRENDS_KEY, year],
    queryFn: () => reportingApi.getTrends(year),
    enabled: !!year,
  });
}
