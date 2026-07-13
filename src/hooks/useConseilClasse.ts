import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { conseilClasseApi } from "@/api/conseil-classe.api";
import { passagesApi } from "@/api/passages.api";
import type { ConseilClasse } from "@/types/conseil-classe";
import type { BulkPassage } from "@/types/passage";

const CONSEIL_KEY = "conseil-classe";
const PASSAGES_KEY = "passages";

/** Load the conseil de classe (annual averages + proposed decisions) for a class. */
export function useConseilClasse(classeId: string) {
  return useQuery<ConseilClasse>({
    queryKey: [CONSEIL_KEY, classeId],
    queryFn: () => conseilClasseApi.getByClasse(classeId),
    enabled: !!classeId,
  });
}

/** Persist the validated decisions of a conseil de classe as Passage records. */
export function useBulkCreatePassages() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: BulkPassage) => passagesApi.bulkCreate(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [PASSAGES_KEY] });
      qc.invalidateQueries({ queryKey: [CONSEIL_KEY] });
    },
  });
}
