import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  portalAccountApi,
  type PortalAccount,
  type PortalCredentials,
} from "@/api/portal-account.api";

const KEY = "portal-account";

/** État du compte portail d'un élève (section « Gestion du compte »). */
export function usePortalAccount(studentId: string | undefined) {
  return useQuery<PortalAccount>({
    queryKey: [KEY, studentId],
    queryFn: () => portalAccountApi.get(studentId!),
    enabled: !!studentId,
  });
}

/** Crée le compte quand l'élève n'en a pas encore. */
export function useCreatePortalAccount(studentId: string | undefined) {
  const qc = useQueryClient();
  return useMutation<PortalCredentials, Error, void>({
    mutationFn: () => portalAccountApi.create(studentId!),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY, studentId] }),
  });
}

/** Régénère un mot de passe provisoire et le renvoie pour affichage/impression. */
export function useResetPortalPassword(studentId: string | undefined) {
  const qc = useQueryClient();
  return useMutation<PortalCredentials, Error, void>({
    mutationFn: () => portalAccountApi.resetPassword(studentId!),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY, studentId] }),
  });
}

/** Renvoie les identifiants en cours par email, sans changer le mot de passe. */
export function useSendPortalCredentials(studentId: string | undefined) {
  return useMutation<PortalCredentials, Error, void>({
    mutationFn: () => portalAccountApi.sendCredentials(studentId!),
  });
}

/** Active / désactive l'accès au portail. */
export function useSetPortalAccountActive(studentId: string | undefined) {
  const qc = useQueryClient();
  return useMutation<PortalAccount, Error, boolean>({
    mutationFn: (active: boolean) => portalAccountApi.setActive(studentId!, active),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY, studentId] }),
  });
}
