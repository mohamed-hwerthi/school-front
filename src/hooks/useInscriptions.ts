import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { inscriptionsApi } from "@/api/inscriptions.api";
import type {
  Inscription,
  CreateInscriptionRequest,
  UpdateStatutRequest,
  InscriptionStats,
  PagedInscriptions,
} from "@/types/inscription";

const INSCRIPTIONS_KEY = "inscriptions";

/**
 * List inscriptions with filters and pagination (admin).
 */
export function useInscriptions(params: {
  statut?: string;
  anneeScolaire?: string;
  niveauId?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: string;
}) {
  return useQuery<PagedInscriptions>({
    queryKey: [INSCRIPTIONS_KEY, params],
    queryFn: () => inscriptionsApi.getAll(params),
  });
}

/**
 * Get a single inscription by ID (admin).
 */
export function useInscription(id: string) {
  return useQuery<Inscription>({
    queryKey: [INSCRIPTIONS_KEY, id],
    queryFn: () => inscriptionsApi.getById(id),
    enabled: !!id,
  });
}

/**
 * Create a new inscription (public).
 */
export function useCreateInscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateInscriptionRequest) =>
      inscriptionsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [INSCRIPTIONS_KEY] });
    },
  });
}

/**
 * Update inscription status (admin).
 */
export function useUpdateStatut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateStatutRequest }) =>
      inscriptionsApi.updateStatut(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [INSCRIPTIONS_KEY] });
    },
  });
}

/**
 * Get inscription statistics (admin).
 */
export function useInscriptionStats(anneeScolaire?: string) {
  return useQuery<InscriptionStats>({
    queryKey: [INSCRIPTIONS_KEY, "stats", anneeScolaire],
    queryFn: () => inscriptionsApi.getStats(anneeScolaire),
  });
}

/**
 * Get waiting list for a niveau (admin).
 */
export function useListeAttente(niveauId: string, anneeScolaire?: string) {
  return useQuery<Inscription[]>({
    queryKey: [INSCRIPTIONS_KEY, "liste-attente", niveauId, anneeScolaire],
    queryFn: () => inscriptionsApi.getListeAttente(niveauId, anneeScolaire),
    enabled: !!niveauId,
  });
}

/**
 * Convert an accepted inscription into a student (admin).
 */
export function useConvertInscriptionToStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, classe, sexe }: { id: string; classe?: string; sexe?: string }) =>
      inscriptionsApi.convertToStudent(id, classe, sexe),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [INSCRIPTIONS_KEY] });
      qc.invalidateQueries({ queryKey: ["students"] });
    },
  });
}

/**
 * Check inscription status by dossier number (public).
 */
export function useCheckInscription(numeroDossier: string) {
  return useQuery<Inscription>({
    queryKey: [INSCRIPTIONS_KEY, "check", numeroDossier],
    queryFn: () => inscriptionsApi.getByNumeroDossier(numeroDossier),
    enabled: !!numeroDossier && numeroDossier.length > 0,
  });
}
