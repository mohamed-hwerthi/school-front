import {
  useQuery,
  useMutation,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import {
  typesFraisApi,
  paiementsApi,
  type PaiementFilters,
  type TypeFraisRequest,
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

export function useCreateTypeFrais() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: TypeFraisRequest) => typesFraisApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TYPES_FRAIS_KEY] });
    },
  });
}

export function useUpdateTypeFrais() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: TypeFraisRequest }) =>
      typesFraisApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TYPES_FRAIS_KEY] });
    },
  });
}

export function useDeleteTypeFrais() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => typesFraisApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TYPES_FRAIS_KEY] });
      // Un type supprimé disparaît des libellés de paiements.
      qc.invalidateQueries({ queryKey: [PAIEMENTS_KEY] });
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


/**
 * Met à jour chirurgicalement les listes déjà en cache après un POST/PUT.
 *
 * La liste complète (`useAllPaiements`) fait ~10 000 lignes : l'invalider
 * relançait tout le GET pour un seul paiement. On remplace la ligne en cache,
 * et on se contente de marquer périmées les vues qu'on ne peut pas
 * reconstruire côté client (listes paginées, dashboard) — elles ne
 * refetchent que si elles sont montées ailleurs.
 */
function upsertPaiementCache(qc: QueryClient, p: Paiement, annee: string) {
  const upsert = (old?: Paiement[]) => {
    if (!old) return old;
    const i = old.findIndex((x) => x.id === p.id);
    if (i === -1) return [...old, p];
    const next = old.slice();
    next[i] = p;
    return next;
  };

  qc.setQueryData<Paiement[]>([PAIEMENTS_KEY, "all", annee], upsert);
  qc.setQueriesData<Paiement[]>(
    {
      predicate: (q) => {
        const k = q.queryKey;
        return (
          k[0] === PAIEMENTS_KEY &&
          k[1] === "student" &&
          k[2] === p.eleveId &&
          (k[3] === undefined || k[3] === annee)
        );
      },
    },
    upsert,
  );

  qc.invalidateQueries({ queryKey: [PAIEMENTS_KEY, "paged"] });
  qc.invalidateQueries({ queryKey: [FINANCE_DASHBOARD_KEY] });
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
    onSuccess: (dto, vars) => {
      upsertPaiementCache(qc, paiementFromApi(dto), vars.anneeScolaire || DEFAULT_ANNEE);
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
    onSuccess: (dto, vars) => {
      upsertPaiementCache(qc, paiementFromApi(dto), vars.data.anneeScolaire || DEFAULT_ANNEE);
    },
  });
}
