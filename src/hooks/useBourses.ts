import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  boursesApi,
  type BourseDTO,
  type BourseRequest,
} from "@/api/bourses.api";

const BOURSES_KEY = "bourses";

export function useBourses(anneeScolaire?: string) {
  return useQuery<BourseDTO[]>({
    queryKey: [BOURSES_KEY, anneeScolaire],
    queryFn: () => boursesApi.getAll(anneeScolaire),
  });
}

export function useBoursesByStudent(studentId: string, anneeScolaire?: string) {
  return useQuery<BourseDTO[]>({
    queryKey: [BOURSES_KEY, "student", studentId, anneeScolaire],
    queryFn: () => boursesApi.getByStudent(studentId, anneeScolaire),
    enabled: !!studentId,
  });
}

export function useCreateBourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: BourseRequest) => boursesApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [BOURSES_KEY] });
    },
  });
}

export function useUpdateBourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: BourseRequest }) =>
      boursesApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [BOURSES_KEY] });
    },
  });
}

export function useDeleteBourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => boursesApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [BOURSES_KEY] });
    },
  });
}
