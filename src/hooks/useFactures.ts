import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { facturesApi, type FactureFilters, type PagedFactures } from "@/api/factures.api";
import type { Facture, Echeancier } from "@/types/facture";

const FACTURES_KEY = "factures";
const ECHEANCIERS_KEY = "echeanciers";

// ─── Factures ──────────────────────────────

/**
 * Paginated + filtered invoices.
 */
export function useFacturesPaged(filters: FactureFilters = {}) {
  return useQuery<PagedFactures>({
    queryKey: [FACTURES_KEY, "paged", filters],
    queryFn: () => facturesApi.getAll(filters),
  });
}

/**
 * All invoices (unpaginated).
 */
export function useAllFactures() {
  return useQuery<Facture[]>({
    queryKey: [FACTURES_KEY, "all"],
    queryFn: async () => {
      const res = await facturesApi.getAll({ page: 0, size: 10000 });
      return res.content;
    },
  });
}

/**
 * Single invoice by ID.
 */
export function useFacture(id: string) {
  return useQuery<Facture>({
    queryKey: [FACTURES_KEY, id],
    queryFn: () => facturesApi.getById(id),
    enabled: !!id,
  });
}

/**
 * Invoices by student.
 */
export function useFacturesByEleve(eleveId: string) {
  return useQuery<Facture[]>({
    queryKey: [FACTURES_KEY, "eleve", eleveId],
    queryFn: () => facturesApi.getByEleve(eleveId),
    enabled: !!eleveId,
  });
}

/**
 * Create invoice.
 */
export function useCreateFacture() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Facture, "id" | "numero" | "statut">) =>
      facturesApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [FACTURES_KEY] });
    },
  });
}

/**
 * Update invoice.
 */
export function useUpdateFacture() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Facture> }) =>
      facturesApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [FACTURES_KEY] });
    },
  });
}

/**
 * Generate invoice for a student.
 */
export function useGenerateFacture() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (eleveId: string) => facturesApi.generate(eleveId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [FACTURES_KEY] });
    },
  });
}

/**
 * Cancel invoice.
 */
export function useCancelFacture() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => facturesApi.cancel(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [FACTURES_KEY] });
    },
  });
}

/**
 * Delete invoice.
 */
export function useDeleteFacture() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => facturesApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [FACTURES_KEY] });
    },
  });
}

// ─── Echeanciers ──────────────────────────────

/**
 * Payment schedules.
 */
export function useEcheanciers(eleveId?: string) {
  return useQuery<Echeancier[]>({
    queryKey: [ECHEANCIERS_KEY, eleveId],
    queryFn: () => facturesApi.getEcheanciers(eleveId),
  });
}

/**
 * Single payment schedule by ID.
 */
export function useEcheancier(id: string) {
  return useQuery<Echeancier>({
    queryKey: [ECHEANCIERS_KEY, id],
    queryFn: () => facturesApi.getEcheancierById(id),
    enabled: !!id,
  });
}

/**
 * Create payment schedule.
 */
export function useCreateEcheancier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Echeancier, "id" | "echeances">) =>
      facturesApi.createEcheancier(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [ECHEANCIERS_KEY] });
    },
  });
}

/**
 * Delete payment schedule.
 */
export function useDeleteEcheancier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => facturesApi.deleteEcheancier(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [ECHEANCIERS_KEY] });
    },
  });
}
