import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { clotureApi } from "@/api/cloture.api";
import type { PreChecksResponse, ClotureRequest } from "@/types/cloture";

const KEY = "cloture";

/** Pre-closure verifications for a school year. */
export function usePreChecks(anneeId: string) {
  return useQuery<PreChecksResponse>({
    queryKey: [KEY, "pre-checks", anneeId],
    queryFn: () => clotureApi.getPreChecks(anneeId),
    enabled: !!anneeId,
  });
}

/** Close a school year (optionally rolling over to the next one). */
export function useCloturer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ anneeId, request }: { anneeId: string; request: ClotureRequest }) =>
      clotureApi.cloturer(anneeId, request),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] });
      qc.invalidateQueries({ queryKey: ["annees-scolaires"] });
    },
  });
}
