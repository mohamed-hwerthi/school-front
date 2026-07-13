import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { teacherEvaluationsApi } from "@/api/teacher-evaluations.api";
import type { TeacherEvaluation, TeacherEvaluationStats } from "@/types/teacher-evaluation";

const EVALUATIONS_KEY = "teacher-evaluations";
const STATS_KEY = "teacher-evaluation-stats";

/**
 * All evaluations, optionally filtered by teacherId and/or anneeScolaire.
 */
export function useTeacherEvaluations(params?: { teacherId?: string; anneeScolaire?: string }) {
  return useQuery<TeacherEvaluation[]>({
    queryKey: [EVALUATIONS_KEY, params],
    queryFn: () => teacherEvaluationsApi.getAll(params),
  });
}

/**
 * Single evaluation by ID.
 */
export function useTeacherEvaluation(id: string) {
  return useQuery<TeacherEvaluation>({
    queryKey: [EVALUATIONS_KEY, id],
    queryFn: () => teacherEvaluationsApi.getById(id),
    enabled: !!id,
  });
}

/**
 * Create evaluation mutation.
 */
export function useCreateTeacherEvaluation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<TeacherEvaluation, "id" | "createdAt" | "teacherName" | "noteGlobale">) =>
      teacherEvaluationsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [EVALUATIONS_KEY] });
      qc.invalidateQueries({ queryKey: [STATS_KEY] });
    },
  });
}

/**
 * Update evaluation mutation.
 */
export function useUpdateTeacherEvaluation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TeacherEvaluation> }) =>
      teacherEvaluationsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [EVALUATIONS_KEY] });
      qc.invalidateQueries({ queryKey: [STATS_KEY] });
    },
  });
}

/**
 * Delete evaluation mutation.
 */
export function useDeleteTeacherEvaluation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => teacherEvaluationsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [EVALUATIONS_KEY] });
      qc.invalidateQueries({ queryKey: [STATS_KEY] });
    },
  });
}

/**
 * Stats (averages) for a specific teacher.
 */
export function useTeacherEvaluationStats(teacherId: string) {
  return useQuery<TeacherEvaluationStats>({
    queryKey: [STATS_KEY, teacherId],
    queryFn: () => teacherEvaluationsApi.getStats(teacherId),
    enabled: !!teacherId,
  });
}
