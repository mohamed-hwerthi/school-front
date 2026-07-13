import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { anneeScolaireApi } from "@/api/annee-scolaire.api";
import type {
  AnneeScolaire,
  Trimestre,
  Vacance,
  JourFerie,
} from "@/types/annee-scolaire";

const ANNEES_KEY = "annees-scolaires";
const TRIMESTRES_KEY = "trimestres";
const VACANCES_KEY = "vacances";
const JOURS_FERIES_KEY = "jours-feries";

// ─── Annee Scolaire ──────────────────────────────

/**
 * Active academic year.
 */
export function useActiveAnneeScolaire() {
  return useQuery<AnneeScolaire>({
    queryKey: [ANNEES_KEY, "active"],
    queryFn: () => anneeScolaireApi.getActive(),
  });
}

/**
 * All academic years.
 */
export function useAllAnneesScolaires() {
  return useQuery<AnneeScolaire[]>({
    queryKey: [ANNEES_KEY],
    queryFn: () => anneeScolaireApi.getAll(),
  });
}

/**
 * Create academic year.
 */
export function useCreateAnneeScolaire() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<AnneeScolaire, "id" | "active" | "cloturee">) =>
      anneeScolaireApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [ANNEES_KEY] });
    },
  });
}

/**
 * Update academic year.
 */
export function useUpdateAnneeScolaire() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AnneeScolaire> }) =>
      anneeScolaireApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [ANNEES_KEY] });
    },
  });
}

/**
 * Close academic year.
 */
export function useCloturerAnneeScolaire() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => anneeScolaireApi.cloturer(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [ANNEES_KEY] });
    },
  });
}

/**
 * Activate academic year.
 */
export function useActivateAnneeScolaire() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => anneeScolaireApi.activate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [ANNEES_KEY] });
    },
  });
}

// ─── Trimestres ──────────────────────────────

/**
 * Trimesters for an academic year.
 */
export function useTrimestres(anneeScolaireId: string | null | undefined) {
  return useQuery<Trimestre[]>({
    queryKey: [TRIMESTRES_KEY, anneeScolaireId],
    queryFn: () => anneeScolaireApi.getTrimestres(anneeScolaireId!),
    enabled: !!anneeScolaireId,
  });
}

/**
 * Trimestre numéro (1/2/3) couvrant la date du jour, basé sur les bornes
 * de l'année scolaire active. Retourne `null` tant que les données chargent.
 * Fallback : avant le T1 → 1 ; après le dernier → dernier ; sinon → 1.
 */
export function useCurrentTrimestre(): number | null {
  const { data: annee } = useActiveAnneeScolaire();
  const { data: trimestres = [] } = useTrimestres(annee?.id);

  if (!annee || trimestres.length === 0) return null;

  const today = new Date().toISOString().slice(0, 10);
  const sorted = [...trimestres].sort((a, b) => a.numero - b.numero);

  const match = sorted.find(
    (t) => today >= t.dateDebut && today <= t.dateFin
  );
  if (match) return match.numero;

  if (today < sorted[0].dateDebut) return sorted[0].numero;
  return sorted[sorted.length - 1].numero;
}

/**
 * Create trimester.
 */
export function useCreateTrimestre() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      anneeScolaireId,
      data,
    }: {
      anneeScolaireId: string;
      data: Omit<Trimestre, "id" | "anneeScolaireId">;
    }) => anneeScolaireApi.createTrimestre(anneeScolaireId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TRIMESTRES_KEY] });
    },
  });
}

/**
 * Update trimester.
 */
export function useUpdateTrimestre() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Trimestre> }) =>
      anneeScolaireApi.updateTrimestre(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TRIMESTRES_KEY] });
    },
  });
}

/**
 * Delete trimester.
 */
export function useDeleteTrimestre() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => anneeScolaireApi.deleteTrimestre(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TRIMESTRES_KEY] });
    },
  });
}

// ─── Vacances ──────────────────────────────

/**
 * Holidays for an academic year.
 */
export function useVacances(anneeScolaireId: string | null | undefined) {
  return useQuery<Vacance[]>({
    queryKey: [VACANCES_KEY, anneeScolaireId],
    queryFn: () => anneeScolaireApi.getVacances(anneeScolaireId!),
    enabled: !!anneeScolaireId,
  });
}

/**
 * Create holiday.
 */
export function useCreateVacance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      anneeScolaireId,
      data,
    }: {
      anneeScolaireId: string;
      data: Omit<Vacance, "id" | "anneeScolaireId">;
    }) => anneeScolaireApi.createVacance(anneeScolaireId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [VACANCES_KEY] });
    },
  });
}

/**
 * Delete holiday.
 */
export function useDeleteVacance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => anneeScolaireApi.deleteVacance(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [VACANCES_KEY] });
    },
  });
}

// ─── Jours Feries ──────────────────────────────

/**
 * Public holidays for an academic year.
 */
export function useJoursFeries(anneeScolaireId: string | null | undefined) {
  return useQuery<JourFerie[]>({
    queryKey: [JOURS_FERIES_KEY, anneeScolaireId],
    queryFn: () => anneeScolaireApi.getJoursFeries(anneeScolaireId!),
    enabled: !!anneeScolaireId,
  });
}

/**
 * Create public holiday.
 */
export function useCreateJourFerie() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      anneeScolaireId,
      data,
    }: {
      anneeScolaireId: string;
      data: Omit<JourFerie, "id" | "anneeScolaireId">;
    }) => anneeScolaireApi.createJourFerie(anneeScolaireId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [JOURS_FERIES_KEY] });
    },
  });
}

/**
 * Delete public holiday.
 */
export function useDeleteJourFerie() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => anneeScolaireApi.deleteJourFerie(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [JOURS_FERIES_KEY] });
    },
  });
}
