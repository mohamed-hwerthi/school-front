import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { personnelApi } from "@/api/personnel.api";
import type { Personnel } from "@/types/personnel";
import { notify } from "@/lib/toast";

const QUERY_KEY = ["personnel"];

/** Full list of non-teaching staff. */
export function usePersonnelList() {
  return useQuery<Personnel[]>({
    queryKey: QUERY_KEY,
    queryFn: personnelApi.getAll,
  });
}

/** Single staff member by id. */
export function usePersonnel(id: string) {
  return useQuery<Personnel>({
    queryKey: [...QUERY_KEY, id],
    queryFn: () => personnelApi.getById(id),
    enabled: !!id,
  });
}

export function useCreatePersonnel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Personnel, "id" | "dateEmbauche">) =>
      personnelApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      notify.success("Employé ajouté");
    },
    onError: (err: Error) => notify.error(err.message),
  });
}

export function useUpdatePersonnel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Personnel> }) =>
      personnelApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      notify.success("Employé modifié");
    },
    onError: (err: Error) => notify.error(err.message),
  });
}

export function useDeletePersonnel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => personnelApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      notify.success("Employé supprimé");
    },
    onError: (err: Error) => notify.error(err.message),
  });
}
