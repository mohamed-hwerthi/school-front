import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { livresApi, empruntsApi } from "@/api/bibliotheque.api";
import type {
  Livre,
  CreateLivreRequest,
  Emprunt,
  CreateEmpruntRequest,
  BibliothequeStats,
} from "@/types/bibliotheque";

const LIVRES_KEY = "livres";
const EMPRUNTS_KEY = "emprunts";

// ─── Livres ─────────────────────────────────────────────

export function useLivres(params?: {
  page?: number;
  size?: number;
  search?: string;
  categorie?: string;
}) {
  return useQuery({
    queryKey: [LIVRES_KEY, params],
    queryFn: () => livresApi.getAll(params),
  });
}

export function useLivreCategories() {
  return useQuery<string[]>({
    queryKey: [LIVRES_KEY, "categories"],
    queryFn: () => livresApi.getCategories(),
  });
}

export function useCreateLivre() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateLivreRequest) => livresApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [LIVRES_KEY] });
    },
  });
}

export function useUpdateLivre() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateLivreRequest }) =>
      livresApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [LIVRES_KEY] });
    },
  });
}

export function useDeleteLivre() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => livresApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [LIVRES_KEY] });
    },
  });
}

// ─── Emprunts ───────────────────────────────────────────

export function useEmprunts() {
  return useQuery<Emprunt[]>({
    queryKey: [EMPRUNTS_KEY],
    queryFn: () => empruntsApi.getAll(),
  });
}

export function useCreateEmprunt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateEmpruntRequest) => empruntsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [EMPRUNTS_KEY] });
      qc.invalidateQueries({ queryKey: [LIVRES_KEY] });
    },
  });
}

export function useRetourEmprunt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => empruntsApi.retourner(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [EMPRUNTS_KEY] });
      qc.invalidateQueries({ queryKey: [LIVRES_KEY] });
    },
  });
}

export function useEmpruntsEnRetard() {
  return useQuery<Emprunt[]>({
    queryKey: [EMPRUNTS_KEY, "en-retard"],
    queryFn: () => empruntsApi.getEnRetard(),
  });
}

export function useBibliothequeStats() {
  return useQuery<BibliothequeStats>({
    queryKey: [EMPRUNTS_KEY, "stats"],
    queryFn: () => empruntsApi.getStats(),
  });
}
