import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { evenementsApi } from "@/api/evenements.api";
import type {
  EvenementCalendrier,
  EvenementCalendrierInput,
} from "@/types/evenement";

const EVENEMENTS_KEY = "evenements-calendrier";

export function useEvenements(params?: { from?: string; to?: string; type?: string }) {
  return useQuery<EvenementCalendrier[]>({
    queryKey: [EVENEMENTS_KEY, params ?? {}],
    queryFn: () => evenementsApi.getAll(params),
  });
}

export function useCreateEvenement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: EvenementCalendrierInput) => evenementsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [EVENEMENTS_KEY] });
    },
  });
}

export function useUpdateEvenement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<EvenementCalendrierInput> }) =>
      evenementsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [EVENEMENTS_KEY] });
    },
  });
}

export function useDeleteEvenement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => evenementsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [EVENEMENTS_KEY] });
    },
  });
}
