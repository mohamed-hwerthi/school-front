import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { conseilClasseApi } from "@/api/conseil-classe.api";
import { passagesApi } from "@/api/passages.api";
import type { ConseilClasse, PvAnnuel, PvAnnuelRequest } from "@/types/conseil-classe";
import type { BulkPassage } from "@/types/passage";

const CONSEIL_KEY = "conseil-classe";
const PV_KEY = "pv-annuel";
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

/** PV annuel figé de la classe — `null` tant qu'il n'a pas été édité. */
export function usePvAnnuel(classeId: string, anneeScolaire: string) {
  return useQuery<PvAnnuel | null>({
    queryKey: [PV_KEY, classeId, anneeScolaire],
    queryFn: () => conseilClasseApi.getPv(classeId, anneeScolaire),
    enabled: !!classeId && !!anneeScolaire,
  });
}

/** Édite le PV une première et unique fois, puis le met en cache. */
export function useCreatePvAnnuel(classeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: PvAnnuelRequest) => conseilClasseApi.createPv(classeId, data),
    onSuccess: (pv) => {
      qc.setQueryData([PV_KEY, classeId, pv.anneeScolaire], pv);
    },
  });
}
