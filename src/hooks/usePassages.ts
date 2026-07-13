import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { passagesApi } from "@/api/passages.api";
import { useAnneeContext } from "./useAnneeContext";
import type { Passage, BulkPassage } from "@/types/passage";

const PASSAGES_KEY = "passages";

/**
 * Passages for a given academic year.
 */
export function usePassages(anneeScolaire?: string) {
  const { selectedAnnee } = useAnneeContext();
  const year = anneeScolaire ?? selectedAnnee?.label ?? "";
  return useQuery<Passage[]>({
    queryKey: [PASSAGES_KEY, year],
    queryFn: () => passagesApi.getByAnneeScolaire(year),
    enabled: !!year,
  });
}

/**
 * Passages for a specific student.
 */
export function usePassagesByStudent(studentId: string) {
  return useQuery<Passage[]>({
    queryKey: [PASSAGES_KEY, "student", studentId],
    queryFn: () => passagesApi.getByStudent(studentId),
    enabled: !!studentId,
  });
}

/**
 * Create a single passage decision.
 */
export function useCreatePassage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Passage, "id" | "createdAt" | "studentName">) =>
      passagesApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [PASSAGES_KEY] });
    },
  });
}

/**
 * Create passages in bulk (end-of-year processing).
 */
export function useBulkCreatePassages() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: BulkPassage) => passagesApi.bulkCreate(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [PASSAGES_KEY] });
    },
  });
}
