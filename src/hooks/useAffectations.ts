import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  affectationsApi,
  type AffectationDTO,
  type AffectationFilters,
  type AffectationRequest,
  type AffectationBulkRequest,
} from "@/api/affectations.api";

const KEY = "affectations";

export function useAffectations(filters: AffectationFilters = {}) {
  return useQuery<AffectationDTO[]>({
    queryKey: [KEY, filters],
    queryFn: () => affectationsApi.search(filters),
  });
}

export function useCreateAffectation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: AffectationRequest) => affectationsApi.create(req),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useBulkCreateAffectation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: AffectationBulkRequest) => affectationsApi.bulkCreate(req),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateAffectation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, req }: { id: string; req: AffectationRequest }) =>
      affectationsApi.update(id, req),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useDeleteAffectation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => affectationsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
