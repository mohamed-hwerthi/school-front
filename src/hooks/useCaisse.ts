import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { caisseApi, CaisseRequest, MouvementRequest } from "@/api/caisse.api";
import { useAnneeContext } from "./useAnneeContext";
import { notify } from "@/lib/toast";

const KEYS = {
  all: (annee: string) => ["caisse", annee] as const,
  ouverte: (annee: string) => ["caisse", "ouverte", annee] as const,
  mouvements: (id: string) => ["caisse", "mouvements", id] as const,
};

export function useCaisses(anneeScolaire?: string) {
  const { selectedAnnee } = useAnneeContext();
  const year = anneeScolaire ?? selectedAnnee?.label ?? "";
  return useQuery({
    queryKey: KEYS.all(year),
    queryFn: () => caisseApi.getAll(year),
    enabled: !!year,
  });
}

export function useCaisseOuverte(anneeScolaire?: string) {
  const { selectedAnnee } = useAnneeContext();
  const year = anneeScolaire ?? selectedAnnee?.label ?? "";
  return useQuery({
    queryKey: KEYS.ouverte(year),
    queryFn: () => caisseApi.getOuverte(year),
    enabled: !!year,
  });
}

export function useMouvements(caisseId: string) {
  return useQuery({
    queryKey: KEYS.mouvements(caisseId),
    queryFn: () => caisseApi.getMouvements(caisseId),
    enabled: !!caisseId,
  });
}

export function useOuvrirCaisse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CaisseRequest) => caisseApi.ouvrir(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["caisse"] });
      notify.success("Caisse ouverte avec succes");
    },
    onError: (err: any) => notify.error(err?.response?.data?.message || "Erreur"),
  });
}

export function useFermerCaisse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, fermePar }: { id: string; fermePar?: string }) => caisseApi.fermer(id, fermePar),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["caisse"] });
      notify.success("Caisse fermee avec succes");
    },
    onError: (err: any) => notify.error(err?.response?.data?.message || "Erreur"),
  });
}

export function useAddMouvement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: MouvementRequest) => caisseApi.addMouvement(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["caisse"] });
      notify.success("Mouvement ajoute");
    },
    onError: (err: any) => notify.error(err?.response?.data?.message || "Erreur"),
  });
}

export function useDeleteMouvement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => caisseApi.deleteMouvement(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["caisse"] });
      notify.success("Mouvement supprime");
    },
    onError: (err: any) => notify.error(err?.response?.data?.message || "Erreur"),
  });
}
