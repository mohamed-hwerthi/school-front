import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { absencesApi } from "@/api/absences.api";
import type { Absence, AbsenceBatchRequest, AbsenceStats, FeuilleJour } from "@/types/absence";

const ABSENCES_KEY = "absences";

/**
 * Absences by class + date. Pass classeId <= 0 to get all classes for the date.
 */
export function useAbsencesByClasseDate(classeId: string, date: string) {
  return useQuery<Absence[]>({
    queryKey: [ABSENCES_KEY, "classe", classeId, date],
    queryFn: () => absencesApi.getByClasseDate(classeId, date),
    enabled: !!date,
  });
}

/**
 * One "feuille" per class for a given date (counts of absents/retards/justifiees).
 */
export function useFeuillesByDate(date: string) {
  return useQuery<FeuilleJour[]>({
    queryKey: [ABSENCES_KEY, "feuilles", date],
    queryFn: () => absencesApi.getFeuillesByDate(date),
    enabled: !!date,
  });
}

/**
 * Absences by student.
 */
export function useAbsencesByEleve(eleveId: string) {
  return useQuery<Absence[]>({
    queryKey: [ABSENCES_KEY, "eleve", eleveId],
    queryFn: () => absencesApi.getByEleve(eleveId),
    enabled: !!eleveId,
  });
}

/**
 * Absence statistics.
 */
export function useAbsenceStats(classeId?: string, dateDebut?: string, dateFin?: string) {
  return useQuery<AbsenceStats>({
    queryKey: [ABSENCES_KEY, "stats", classeId, dateDebut, dateFin],
    queryFn: () => absencesApi.getStats(classeId, dateDebut, dateFin),
  });
}

/**
 * Batch create absences mutation.
 */
export function useBatchCreateAbsences() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: AbsenceBatchRequest) => absencesApi.batchCreate(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [ABSENCES_KEY] });
    },
  });
}

/**
 * Justify absence mutation.
 */
export function useJustifyAbsence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, motif }: { id: string; motif: string }) =>
      absencesApi.justifier(id, motif),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [ABSENCES_KEY] });
    },
  });
}

/**
 * Delete absence mutation.
 */
export function useDeleteAbsence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => absencesApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [ABSENCES_KEY] });
    },
  });
}
