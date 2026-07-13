import { useQuery } from "@tanstack/react-query";
import { rapportsFinanciersApi } from "@/api/rapports-financiers.api";

export function useRapportFinancier(anneeScolaire = "2025-2026") {
  return useQuery({
    queryKey: ["rapport-financier", anneeScolaire],
    queryFn: () => rapportsFinanciersApi.generer(anneeScolaire),
  });
}
