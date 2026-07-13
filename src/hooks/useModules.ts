import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { modulesApi, type ModuleDTO, type ModuleRequest } from "@/api/modules.api";

const MODULES_KEY = "modules";

export function useModules(niveauId?: string) {
  return useQuery<ModuleDTO[]>({
    queryKey: [MODULES_KEY, niveauId],
    queryFn: () => modulesApi.getAll(niveauId),
  });
}

export function useCreateModule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ModuleRequest) => modulesApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [MODULES_KEY] }),
  });
}

export function useUpdateModule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ModuleRequest }) =>
      modulesApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [MODULES_KEY] }),
  });
}

export function useDeleteModule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => modulesApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [MODULES_KEY] }),
  });
}
