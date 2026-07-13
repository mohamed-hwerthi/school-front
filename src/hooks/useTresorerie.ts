import { useQuery } from "@tanstack/react-query";
import { tresorerieApi, type TresorerieDTO } from "@/api/tresorerie.api";
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
