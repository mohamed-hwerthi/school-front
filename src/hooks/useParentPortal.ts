import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  parentPortalApi,
  type ParentNote,
  type ParentAbsence,
  type ParentBulletin,
  type ParentEmploiDuTemps,
  type ChildDevoir,
  type SubmitDevoirPayload,
  type ChildPaiements,
} from "@/api/parent-portal.api";
import { notify } from "@/lib/toast";
import { useLanguage } from "@/hooks/useLanguage";
import type { Child, Annonce } from "@/types/notification";

const PARENT_KEY = "parent-portal";

export function useChildren() {
  return useQuery<Child[]>({
    queryKey: [PARENT_KEY, "children"],
    queryFn: () => parentPortalApi.getChildren(),
  });
}

export function useParentAnnonces() {
  return useQuery<Annonce[]>({
    queryKey: [PARENT_KEY, "annonces"],
    queryFn: () => parentPortalApi.getAnnonces(),
  });
}

export function useChildNotes(studentId: string, trimestre = 1) {
  return useQuery<ParentNote[]>({
    queryKey: [PARENT_KEY, "notes", studentId, trimestre],
    queryFn: () => parentPortalApi.getChildNotes(studentId, trimestre),
    enabled: !!studentId,
  });
}

export function useChildAbsences(studentId: string) {
  return useQuery<ParentAbsence[]>({
    queryKey: [PARENT_KEY, "absences", studentId],
    queryFn: () => parentPortalApi.getChildAbsences(studentId),
    enabled: !!studentId,
  });
}

export function useChildBulletin(studentId: string, trimestre = 1) {
  return useQuery<ParentBulletin>({
    queryKey: [PARENT_KEY, "bulletin", studentId, trimestre],
    queryFn: () => parentPortalApi.getChildBulletin(studentId, trimestre),
    enabled: !!studentId,
    // Un trimestre sans notes renvoie 404 : inutile de réessayer.
    retry: false,
  });
}

export function useChildDevoirs(studentId: string) {
  return useQuery<ChildDevoir[]>({
    queryKey: [PARENT_KEY, "devoirs", studentId],
    queryFn: () => parentPortalApi.getChildDevoirs(studentId),
    enabled: !!studentId,
  });
}

export function useSubmitChildDevoir(studentId: string) {
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  return useMutation({
    mutationFn: ({
      devoirId,
      payload,
    }: {
      devoirId: string;
      payload: SubmitDevoirPayload;
    }) => parentPortalApi.submitChildDevoir(studentId, devoirId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PARENT_KEY, "devoirs", studentId] });
      notify.success(t("parentPortal.homework.submitted"));
    },
    onError: (err: Error) => notify.error(err.message),
  });
}

export function useChildPaiements(studentId: string) {
  return useQuery<ChildPaiements>({
    queryKey: [PARENT_KEY, "paiements", studentId],
    queryFn: () => parentPortalApi.getChildPaiements(studentId),
    enabled: !!studentId,
  });
}

export function useChildEmploiDuTemps(studentId: string) {
  return useQuery<ParentEmploiDuTemps[]>({
    queryKey: [PARENT_KEY, "emploi-du-temps", studentId],
    queryFn: () => parentPortalApi.getChildEmploiDuTemps(studentId),
    enabled: !!studentId,
  });
}
