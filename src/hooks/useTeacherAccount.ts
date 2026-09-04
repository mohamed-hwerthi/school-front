import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  teacherAccountApi,
  type TeacherAccount,
  type TeacherCredentials,
} from "@/api/teacher-account.api";

const KEY = "teacher-account";

/** État du compte d'un enseignant (section « Gestion du compte »). */
export function useTeacherAccount(teacherId: string | undefined) {
  return useQuery<TeacherAccount>({
    queryKey: [KEY, teacherId],
    queryFn: () => teacherAccountApi.get(teacherId!),
    enabled: !!teacherId,
  });
}

/** Crée le compte quand l'enseignant n'en a pas encore. */
export function useCreateTeacherAccount(teacherId: string | undefined) {
  const qc = useQueryClient();
  return useMutation<TeacherCredentials, Error, void>({
    mutationFn: () => teacherAccountApi.create(teacherId!),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY, teacherId] }),
  });
}

/** Régénère un mot de passe provisoire et le renvoie pour affichage/impression. */
export function useResetTeacherPassword(teacherId: string | undefined) {
  const qc = useQueryClient();
  return useMutation<TeacherCredentials, Error, void>({
    mutationFn: () => teacherAccountApi.resetPassword(teacherId!),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY, teacherId] }),
  });
}

/** Renvoie les identifiants en cours par email, sans changer le mot de passe. */
export function useSendTeacherCredentials(teacherId: string | undefined) {
  return useMutation<TeacherCredentials, Error, void>({
    mutationFn: () => teacherAccountApi.sendCredentials(teacherId!),
  });
}

/** Active / désactive l'accès de l'enseignant. */
export function useSetTeacherAccountActive(teacherId: string | undefined) {
  const qc = useQueryClient();
  return useMutation<TeacherAccount, Error, boolean>({
    mutationFn: (active: boolean) => teacherAccountApi.setActive(teacherId!, active),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY, teacherId] }),
  });
}
