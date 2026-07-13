import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  domainesApi,
  type DomaineDTO,
  type DomaineRequest,
  type SousDomaineRequest,
} from "@/api/domaines.api";

const DOMAINES_KEY = "domaines";

export function useDomaines(niveauId?: string) {
  return useQuery<DomaineDTO[]>({
    queryKey: [DOMAINES_KEY, niveauId],
    queryFn: () => domainesApi.getAll(niveauId),
  });
}

export function useCreateDomaine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: DomaineRequest) => domainesApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [DOMAINES_KEY] }),
  });
}

export function useUpdateDomaine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: DomaineRequest }) =>
      domainesApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [DOMAINES_KEY] }),
  });
}

export function useDeleteDomaine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => domainesApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [DOMAINES_KEY] }),
  });
}

export function useCreateSousDomaine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: SousDomaineRequest) => domainesApi.createSousDomaine(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [DOMAINES_KEY] }),
  });
}

export function useUpdateSousDomaine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SousDomaineRequest }) =>
      domainesApi.updateSousDomaine(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [DOMAINES_KEY] }),
  });
}

export function useDeleteSousDomaine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => domainesApi.deleteSousDomaine(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [DOMAINES_KEY] }),
  });
}
