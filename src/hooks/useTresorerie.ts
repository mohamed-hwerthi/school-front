import { useQuery } from "@tanstack/react-query";
import {
  tresorerieApi,
  type TresorerieDTO,
  type TresorerieDetailDTO,
  type MouvementFinancier,
} from "@/api/tresorerie.api";
import { useAnneeContext } from "./useAnneeContext";

const TRESORERIE_KEY = "tresorerie";

export function useTresorerie(anneeScolaire?: string) {
  const { selectedAnnee } = useAnneeContext();
  const year = anneeScolaire ?? selectedAnnee?.label ?? "";
  return useQuery<TresorerieDTO>({
    queryKey: [TRESORERIE_KEY, year],
    queryFn: () => tresorerieApi.get(year),
    enabled: !!year,
  });
}

/** Grand livre mensuel : entrees et sorties ventilees, mois par mois. */
export function useTresorerieDetail(anneeScolaire?: string) {
  const { selectedAnnee } = useAnneeContext();
  const year = anneeScolaire ?? selectedAnnee?.label ?? "";
  return useQuery<TresorerieDetailDTO>({
    queryKey: [TRESORERIE_KEY, "detail", year],
    queryFn: () => tresorerieApi.getDetail(year),
    enabled: !!year,
  });
}

/** Detail ligne a ligne. `mois` au format "YYYY-MM" ; null desactive la requete. */
export function useMouvementsFinanciers(mois: string | null, anneeScolaire?: string) {
  const { selectedAnnee } = useAnneeContext();
  const year = anneeScolaire ?? selectedAnnee?.label ?? "";
  return useQuery<MouvementFinancier[]>({
    queryKey: [TRESORERIE_KEY, "mouvements", year, mois],
    queryFn: () => tresorerieApi.getMouvements(year, mois ?? undefined),
    enabled: !!year && !!mois,
  });
}
