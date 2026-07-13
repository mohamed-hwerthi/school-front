import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { relancesApi, RelanceRequest, TypeRelance } from "@/api/relances.api";
import { useAnneeContext } from "./useAnneeContext";
import { notify } from "@/lib/toast";

const KEYS = {
  all: (annee: string) => ["relances", annee] as const,
  byStudent: (id: string, annee: string) => ["relances", "student", id, annee] as const,
  pending: (annee: string) => ["relances", "pending", annee] as const,
  stats: (annee: string) => ["relances", "stats", annee] as const,
};

function useYear(provided?: string) {
  const { selectedAnnee } = useAnneeContext();
  return provided ?? selectedAnnee?.label ?? "";
}

export function useRelances(anneeScolaire?: string) {
  const year = useYear(anneeScolaire);
  return useQuery({
    queryKey: KEYS.all(year),
    queryFn: () => relancesApi.getAll(year),
    enabled: !!year,
  });
}

export function useRelancesByStudent(studentId: string, anneeScolaire?: string) {
  const year = useYear(anneeScolaire);
  return useQuery({
    queryKey: KEYS.byStudent(studentId, year),
    queryFn: () => relancesApi.getByStudent(studentId, year),
    enabled: !!studentId && !!year,
  });
}

export function useRelancesPending(anneeScolaire?: string) {
  const year = useYear(anneeScolaire);
  return useQuery({
    queryKey: KEYS.pending(year),
    queryFn: () => relancesApi.getPending(year),
    enabled: !!year,
  });
}

export function useRelanceStats(anneeScolaire?: string) {
  const year = useYear(anneeScolaire);
  return useQuery({
    queryKey: KEYS.stats(year),
    queryFn: () => relancesApi.getStats(year),
    enabled: !!year,
  });
}

export function useCreateRelance(anneeScolaire = "2025-2026") {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: RelanceRequest) => relancesApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["relances"] });
      notify.success("Relance creee avec succes");
    },
    onError: () => notify.error("Erreur lors de la creation"),
  });
}

export function useGenerateRelances(anneeScolaire?: string) {
  const { selectedAnnee } = useAnneeContext();
  const year = anneeScolaire ?? selectedAnnee?.label ?? "";
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (type: TypeRelance) => relancesApi.generate(year, type),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["relances"] });
      notify.success(`${data.length} relance(s) generee(s)`);
    },
    onError: () => notify.error("Erreur lors de la generation"),
  });
}

export function useMarkRelanceEnvoyee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => relancesApi.markEnvoyee(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["relances"] });
      notify.success("Relance marquee comme envoyee");
    },
    onError: () => notify.error("Erreur"),
  });
}

export function useMarkRelanceEchouee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => relancesApi.markEchouee(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["relances"] });
      notify.success("Relance marquee comme echouee");
    },
    onError: () => notify.error("Erreur"),
  });
}

export function useDeleteRelance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => relancesApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["relances"] });
      notify.success("Relance supprimee");
    },
    onError: () => notify.error("Erreur lors de la suppression"),
  });
}
