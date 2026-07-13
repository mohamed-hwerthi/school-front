import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  typesFraisApi,
  paiementsApi,
  type PaiementFilters,
} from "@/api/finance.api";
import { typeFraisFromApi, paiementFromApi, paiementToApi } from "@/api/finance-mapper";
import type { TypeFrais, Paiement } from "@/types/finance";
import type { PagedResult } from "@/api/students.api";

const TYPES_FRAIS_KEY = "types-frais";
const PAIEMENTS_KEY = "paiements";
const FINANCE_DASHBOARD_KEY = "finance-dashboard";

const DEFAULT_ANNEE = "2025-2026";

// ─── Types de frais ─────────────────────────────────────

export function useTypesFrais() {
  return useQuery<TypeFrais[]>({
    queryKey: [TYPES_FRAIS_KEY],
    queryFn: async () => {
      const data = await typesFraisApi.getAll();
      return data.map(typeFraisFromApi);
    },
  });
}

export function useTypesFraisActifs() {
  return useQuery<TypeFrais[]>({
    queryKey: [TYPES_FRAIS_KEY, "actifs"],
    queryFn: async () => {
      const data = await typesFraisApi.getAllActifs();
      return data.map(typeFraisFromApi);
    },
  });
}

// ─── Paiements (paged) ─────────────────────────────────

export function usePaiementsPaged(filters: PaiementFilters = {}) {
  return useQuery<PagedResult<Paiement>>({
    queryKey: [PAIEMENTS_KEY, "paged", filters],
    queryFn: async () => {
      const res = await paiementsApi.getAll(filters);
      return {
        ...res,
        content: res.content.map(paiementFromApi),
      };
    },
  });
}

// ─── All paiements for current year (unpaged, for stats/charts) ──

export function useAllPaiements(anneeScolaire: string = DEFAULT_ANNEE) {
  return useQuery<Paiement[]>({
    queryKey: [PAIEMENTS_KEY, "all", anneeScolaire],
    queryFn: async () => {
      const res = await paiementsApi.getAll({
        anneeScolaire,
        page: 0,
        size: 10000,
      });
      return res.content.map(paiementFromApi);
    },
  });
}

// ─── Paiements for a specific student ───────────────────

export function usePaiementsByStudent(studentId: string, anneeScolaire?: string) {
  return useQuery<Paiement[]>({
    queryKey: [PAIEMENTS_KEY, "student", studentId, anneeScolaire],
    queryFn: async () => {
      const data = await paiementsApi.getByStudentId(studentId, anneeScolaire);
      return data.map(paiementFromApi);
    },
    enabled: !!studentId,
  });
}

// ─── Dashboard stats ────────────────────────────────────

export function useFinanceDashboard(anneeScolaire: string = DEFAULT_ANNEE) {
  return useQuery({
    queryKey: [FINANCE_DASHBOARD_KEY, anneeScolaire],
    queryFn: () => paiementsApi.getDashboard(anneeScolaire),
  });
}

// ─── Mutations ──────────────────────────────────────────

export function useCreatePaiement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      eleveId: string;
      typeFraisId: string;
      mois: string;
      montantDu: number;
      montantPaye: number;
      datePaiement?: string | null;
      modePaiement?: string | null;
      statut?: string;
      reference?: string;
      notes?: string;
      anneeScolaire?: string;
    }) => {
      const annee = data.anneeScolaire || DEFAULT_ANNEE;
      return paiementsApi.create(paiementToApi(data, annee));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [PAIEMENTS_KEY] });
      qc.invalidateQueries({ queryKey: [FINANCE_DASHBOARD_KEY] });
    },
  });
}

export function useUpdatePaiement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: {
        eleveId: string;
        typeFraisId: string;
        mois: string;
        montantDu: number;
        montantPaye: number;
        datePaiement?: string | null;
        modePaiement?: string | null;
        statut?: string;
        reference?: string;
        notes?: string;
        anneeScolaire?: string;
      };
    }) => {
      const annee = data.anneeScolaire || DEFAULT_ANNEE;
      return paiementsApi.update(id, paiementToApi(data, annee));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [PAIEMENTS_KEY] });
      qc.invalidateQueries({ queryKey: [FINANCE_DASHBOARD_KEY] });
    },
  });
}

export function useDeletePaiement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => paiementsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [PAIEMENTS_KEY] });
      qc.invalidateQueries({ queryKey: [FINANCE_DASHBOARD_KEY] });
    },
  });
}
