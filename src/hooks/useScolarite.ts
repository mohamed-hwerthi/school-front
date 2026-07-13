import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { scolariteApi } from "@/api/scolarite.api";
import type { SuiviReinscription } from "@/types/scolarite";

const KEY = "scolarite";

/** ANN-051 — re-enrolment tracking for a school year. */
export function useSuiviReinscription(anneeScolaire: string) {
  return useQuery<SuiviReinscription>({
    queryKey: [KEY, "suivi", anneeScolaire],
    queryFn: () => scolariteApi.getSuivi(anneeScolaire),
    enabled: !!anneeScolaire,
  });
}

/** ANN-050 — mass re-enrolment of the passing students. */
export function useReinscrire() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ source, dest }: { source: string; dest: string }) =>
      scolariteApi.reinscrire(source, dest),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
