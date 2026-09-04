import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { repartitionApi } from "@/api/repartition.api";
import type { Repartition, RepartitionRequest } from "@/types/repartition";

const REPARTITION_KEY = "repartition";

/** État de la répartition des élèves promus pour une année. */
export function useRepartition(anneeScolaire: string) {
  return useQuery<Repartition>({
    queryKey: [REPARTITION_KEY, anneeScolaire],
    queryFn: () => repartitionApi.get(anneeScolaire),
    enabled: !!anneeScolaire,
  });
}

/** Valide la répartition : la classe d'accueil part sur le passage, l'élève et sa scolarité. */
export function useSaveRepartition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: RepartitionRequest) => repartitionApi.save(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [REPARTITION_KEY] });
      qc.invalidateQueries({ queryKey: ["students"] });
      qc.invalidateQueries({ queryKey: ["passages"] });
    },
  });
}
