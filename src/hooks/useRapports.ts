import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { rapportsApi, type RapportFilters } from "@/api/rapports.api";
import { notify } from "@/lib/toast";
import type { Rapport } from "@/types/rapport";

const RAPPORTS_KEY = "rapports";

/**
 * Fetch all rapports with optional type/statut filters.
 */
export function useRapports(params: RapportFilters = {}) {
  return useQuery<Rapport[]>({
    queryKey: [RAPPORTS_KEY, params],
    queryFn: () => rapportsApi.getAll(params),
  });
}

/**
 * Delete a rapport mutation with cache invalidation and toast notification.
 */
export function useDeleteRapport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => rapportsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [RAPPORTS_KEY] });
      notify.success("Rapport supprime");
    },
    onError: () => notify.error("Erreur lors de la suppression"),
  });
}
