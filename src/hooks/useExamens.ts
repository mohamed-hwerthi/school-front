import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { examensApi, type ExamenDTO, type ExamenRequest } from "@/api/examens.api";

const EXAMENS_KEY = "examens";

/**
 * Fetch raw ExamenDTO list.
 * `enabled` lets callers defer the request until a scope (e.g. a class) is
 * chosen — avoids loading every exam of every class/trimester at once.
 */
export function useExamensRaw(
  moduleId?: string,
  classeId?: string,
  trimestre?: number,
  enabled = true,
) {
  return useQuery<ExamenDTO[]>({
    queryKey: [EXAMENS_KEY, moduleId, classeId, trimestre],
    queryFn: () => examensApi.getAll(moduleId, classeId, trimestre),
    enabled,
  });
}

export function useCreateExamen() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ExamenRequest) => examensApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [EXAMENS_KEY] }),
  });
}

export function useUpdateExamen() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ExamenRequest }) =>
      examensApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [EXAMENS_KEY] }),
  });
}

export function useDeleteExamen() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => examensApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [EXAMENS_KEY] }),
  });
}

export function useDeleteExamensBulk() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => examensApi.deleteBulk(ids),
    onSuccess: () => qc.invalidateQueries({ queryKey: [EXAMENS_KEY] }),
  });
}
