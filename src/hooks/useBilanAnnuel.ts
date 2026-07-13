import { useQuery } from "@tanstack/react-query";
import { bilanAnnuelApi } from "@/api/bilan-annuel.api";
import type { BilanAnnuel } from "@/types/bilan-annuel";

const KEY = "bilan-annuel";

/** Load the annual review (end-of-year decision statistics). */
export function useBilanAnnuel(anneeScolaire?: string) {
  return useQuery<BilanAnnuel>({
    queryKey: [KEY, anneeScolaire ?? "active"],
    queryFn: () => bilanAnnuelApi.get(anneeScolaire),
  });
}

/** ANN-023 — inter-year comparison (one bilan per school year). */
export function useBilanComparatif() {
  return useQuery<BilanAnnuel[]>({
    queryKey: [KEY, "comparatif"],
    queryFn: () => bilanAnnuelApi.getComparatif(),
  });
}
