import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  disponibilitesApi,
  type DisponibiliteDTO,
  type DisponibiliteRequest,
} from "@/api/disponibilites.api";

const KEY = "disponibilites";

export function useDisponibilites(enseignantId?: string) {
  return useQuery<DisponibiliteDTO[]>({
    queryKey: [KEY, enseignantId ?? "all"],
    queryFn: () => disponibilitesApi.getAll(enseignantId),
    enabled: enseignantId === undefined || !!enseignantId,
  });
}

export function useCreateDisponibilite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: DisponibiliteRequest) => disponibilitesApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateDisponibilite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; data: DisponibiliteRequest }) =>
      disponibilitesApi.update(vars.id, vars.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useDeleteDisponibilite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => disponibilitesApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
