import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  categoriesDepenseApi,
  depensesApi,
  type DepenseFilters,
  type DepenseRequest,
  type CategorieDepenseRequest,
  type DepenseDTO,
  type CategorieDepenseDTO,
  type DepenseStatsDTO,
} from "@/api/depenses.api";
import type { PagedResult } from "@/api/students.api";

const CATEGORIES_KEY = "categories-depense";
const DEPENSES_KEY = "depenses";
const DEPENSES_STATS_KEY = "depenses-stats";

// ─── Catégories ─────────────────────────────────────────

export function useCategoriesDepense() {
  return useQuery<CategorieDepenseDTO[]>({
    queryKey: [CATEGORIES_KEY],
    queryFn: categoriesDepenseApi.getAll,
  });
}

export function useCreateCategorieDepense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CategorieDepenseRequest) => categoriesDepenseApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [CATEGORIES_KEY] }),
  });
}

export function useUpdateCategorieDepense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CategorieDepenseRequest }) =>
      categoriesDepenseApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [CATEGORIES_KEY] }),
  });
}

export function useDeleteCategorieDepense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => categoriesDepenseApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [CATEGORIES_KEY] }),
  });
}

// ─── Dépenses ───────────────────────────────────────────

export function useDepensesPaged(filters: DepenseFilters = {}) {
  return useQuery<PagedResult<DepenseDTO>>({
    queryKey: [DEPENSES_KEY, "paged", filters],
    queryFn: () => depensesApi.getAll(filters),
  });
}

export function useCreateDepense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: DepenseRequest) => depensesApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [DEPENSES_KEY] });
      qc.invalidateQueries({ queryKey: [DEPENSES_STATS_KEY] });
    },
  });
}

export function useUpdateDepense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: DepenseRequest }) =>
      depensesApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [DEPENSES_KEY] });
      qc.invalidateQueries({ queryKey: [DEPENSES_STATS_KEY] });
    },
  });
}

export function useDeleteDepense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => depensesApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [DEPENSES_KEY] });
      qc.invalidateQueries({ queryKey: [DEPENSES_STATS_KEY] });
    },
  });
}

export function useDepenseStats(anneeScolaire: string) {
  return useQuery<DepenseStatsDTO>({
    queryKey: [DEPENSES_STATS_KEY, anneeScolaire],
    queryFn: () => depensesApi.getStats(anneeScolaire),
    enabled: !!anneeScolaire,
  });
}
