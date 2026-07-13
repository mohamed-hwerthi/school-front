import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { studentsApi, type StudentFilters, type PagedResult } from "@/api/students.api";
import type { Student } from "@/types/student";

const STUDENTS_KEY = "students";

/**
 * Paginated + filtered students list (for Students.tsx).
 */
export function useStudentsPaged(filters: StudentFilters = {}) {
  return useQuery<PagedResult<Student>>({
    queryKey: [STUDENTS_KEY, "paged", filters],
    queryFn: () => studentsApi.getAll(filters),
  });
}

/**
 * All students (unpaginated, size=10000) for pages that need the full list
 * (Dashboard stats, Niveaux counts, Finance, etc.)
 */
export function useAllStudents() {
  return useQuery<Student[]>({
    queryKey: [STUDENTS_KEY, "all"],
    queryFn: async () => {
      const res = await studentsApi.getAll({ page: 0, size: 10000 });
      return res.content;
    },
  });
}

/**
 * Single student by ID.
 */
export function useStudent(id: string) {
  return useQuery<Student>({
    queryKey: [STUDENTS_KEY, id],
    queryFn: () => studentsApi.getById(id),
    enabled: !!id,
  });
}

/**
 * Create student mutation.
 */
export function useCreateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Student, "id" | "dateInscription">) =>
      studentsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [STUDENTS_KEY] });
    },
  });
}

/**
 * Update student mutation.
 */
export function useUpdateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Student> }) =>
      studentsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [STUDENTS_KEY] });
    },
  });
}

/**
 * Delete student mutation.
 */
export function useDeleteStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => studentsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [STUDENTS_KEY] });
    },
  });
}

/**
 * Bulk import mutation.
 */
export function useImportStudents() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (students: Omit<Student, "id" | "dateInscription">[]) =>
      studentsApi.importBulk(students),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [STUDENTS_KEY] });
    },
  });
}

/**
 * Robust import — returns a per-row result with success/skipped/failed counts
 * and detailed errors. Prefer this over useImportStudents for the UI wizard.
 */
export function useImportStudentsRobust() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (students: Omit<Student, "id" | "dateInscription">[]) =>
      studentsApi.importBulkRobust(students),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [STUDENTS_KEY] });
    },
  });
}
