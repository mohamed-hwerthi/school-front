import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { emploiDuTempsApi } from "@/api/emploi-du-temps.api";
import type {
  EmploiDuTempsEntry,
  Creneau,
  Conflit,
  Remplacement,
  RemplacementRequest,
  TimetableGenerateRequest,
  TimetableGenerateResponse,
  TimetablePreviewCheck,
} from "@/types/emploi-du-temps";

const EDT_KEY = "emploi-du-temps";
const CRENEAUX_KEY = "creneaux";
const REMPLACEMENTS_KEY = "remplacements";

export function useEmploiByClasse(classeId: string) {
  return useQuery<EmploiDuTempsEntry[]>({
    queryKey: [EDT_KEY, "classe", classeId],
    queryFn: () => emploiDuTempsApi.getByClasse(classeId),
    enabled: !!classeId,
  });
}

export function useEmploiByEnseignant(enseignantId: string) {
  return useQuery<EmploiDuTempsEntry[]>({
    queryKey: [EDT_KEY, "enseignant", enseignantId],
    queryFn: () => emploiDuTempsApi.getByEnseignant(enseignantId),
    enabled: !!enseignantId,
  });
}

/** The logged-in teacher's own timetable. */
export function useEmploiMine() {
  return useQuery<EmploiDuTempsEntry[]>({
    queryKey: [EDT_KEY, "me"],
    queryFn: () => emploiDuTempsApi.getMine(),
  });
}

export function useCreneaux() {
  return useQuery<Creneau[]>({
    queryKey: [CRENEAUX_KEY],
    queryFn: () => emploiDuTempsApi.getCreneaux(),
  });
}

export function useSaveEmploi() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ classeId, entries }: { classeId: string; entries: EmploiDuTempsEntry[] }) =>
      emploiDuTempsApi.saveAll(classeId, entries),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [EDT_KEY] });
    },
  });
}

export function useCheckConflits() {
  return useMutation<Conflit[], Error, { classeId: string; entries: EmploiDuTempsEntry[] }>({
    mutationFn: ({ classeId, entries }) =>
      emploiDuTempsApi.checkConflits(classeId, entries),
  });
}

export function useCreateCreneau() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Creneau, "id">) => emploiDuTempsApi.createCreneau(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [CRENEAUX_KEY] });
    },
  });
}

export function useDeleteCreneau() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => emploiDuTempsApi.deleteCreneau(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [CRENEAUX_KEY] });
    },
  });
}

// Remplacements
export function useRemplacements() {
  return useQuery<Remplacement[]>({
    queryKey: [REMPLACEMENTS_KEY],
    queryFn: () => emploiDuTempsApi.getRemplacements(),
  });
}

export function useCreateRemplacement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: RemplacementRequest) => emploiDuTempsApi.createRemplacement(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [REMPLACEMENTS_KEY] });
    },
  });
}

export function useDeleteRemplacement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => emploiDuTempsApi.deleteRemplacement(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [REMPLACEMENTS_KEY] });
    },
  });
}

// Auto-generation
export function useGenerateEmploi() {
  const qc = useQueryClient();
  return useMutation<TimetableGenerateResponse, Error, TimetableGenerateRequest>({
    mutationFn: (request) => emploiDuTempsApi.generate(request),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [EDT_KEY] });
    },
  });
}

export function useTimetablePreviewCheck(
  params: { niveauId?: string; anneeScolaireId?: string },
  enabled = true
) {
  return useQuery<TimetablePreviewCheck>({
    queryKey: [EDT_KEY, "preview-check", params],
    queryFn: () => emploiDuTempsApi.previewCheck(params),
    enabled,
    staleTime: 0, // always refetch when wizard opens — data may have changed
  });
}
