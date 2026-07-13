import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { annoncesApi } from "@/api/annonces.api";
import type { Annonce } from "@/types/notification";

const ANNONCES_KEY = "annonces";

export function useAnnonces(activeOnly = true) {
  return useQuery<Annonce[]>({
    queryKey: [ANNONCES_KEY, activeOnly],
    queryFn: () => annoncesApi.getAll(activeOnly),
  });
}

export function useAnnonceById(id: string) {
  return useQuery<Annonce>({
    queryKey: [ANNONCES_KEY, id],
    queryFn: () => annoncesApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateAnnonce() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Annonce, "id" | "createdAt" | "actif">) =>
      annoncesApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [ANNONCES_KEY] });
    },
  });
}

export function useUpdateAnnonce() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Annonce> }) =>
      annoncesApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [ANNONCES_KEY] });
    },
  });
}

export function useDeleteAnnonce() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => annoncesApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [ANNONCES_KEY] });
    },
  });
}
