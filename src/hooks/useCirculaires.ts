import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { circulairesApi, type CirculaireFilters, type CirculaireRequest } from "@/api/circulaires.api";
import { notify } from "@/lib/toast";

const CIRCULAIRES_KEY = "circulaires";

export function useCirculaires(filters: CirculaireFilters = {}) {
  return useQuery({
    queryKey: [CIRCULAIRES_KEY, filters],
    queryFn: () => circulairesApi.getAll(filters),
  });
}

export function useCreateCirculaire() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CirculaireRequest) => circulairesApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [CIRCULAIRES_KEY] });
      notify.success("Circulaire creee avec succes");
    },
    onError: () => notify.error("Erreur lors de la creation"),
  });
}

export function useUpdateCirculaire() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CirculaireRequest> }) =>
      circulairesApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [CIRCULAIRES_KEY] });
      notify.success("Circulaire mise a jour");
    },
    onError: () => notify.error("Erreur lors de la mise a jour"),
  });
}

export function usePublishCirculaire() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => circulairesApi.publish(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [CIRCULAIRES_KEY] });
      notify.success("Circulaire publiee");
    },
    onError: () => notify.error("Erreur lors de la publication"),
  });
}

export function useArchiveCirculaire() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => circulairesApi.archive(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [CIRCULAIRES_KEY] });
      notify.success("Circulaire archivee");
    },
    onError: () => notify.error("Erreur lors de l'archivage"),
  });
}

export function useDeleteCirculaire() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => circulairesApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [CIRCULAIRES_KEY] });
      notify.success("Circulaire supprimee");
    },
    onError: () => notify.error("Erreur lors de la suppression"),
  });
}
