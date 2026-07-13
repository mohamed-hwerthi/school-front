import { useQuery } from "@tanstack/react-query";
import {
  parentPortalApi,
  type ParentNote,
  type ParentAbsence,
  type ParentBulletin,
  type ParentEmploiDuTemps,
} from "@/api/parent-portal.api";
import type { Child } from "@/types/notification";

const PARENT_KEY = "parent-portal";

export function useChildren() {
  return useQuery<Child[]>({
    queryKey: [PARENT_KEY, "children"],
    queryFn: () => parentPortalApi.getChildren(),
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

export function useChildBulletin(studentId: string, classeId: string, trimestre = 1) {
  return useQuery<ParentBulletin>({
    queryKey: [PARENT_KEY, "bulletin", studentId, classeId, trimestre],
    queryFn: () => parentPortalApi.getChildBulletin(studentId, classeId, trimestre),
    enabled: !!studentId && !!classeId,
  });
}

export function useChildEmploiDuTemps(studentId: string) {
  return useQuery<ParentEmploiDuTemps[]>({
    queryKey: [PARENT_KEY, "emploi-du-temps", studentId],
    queryFn: () => parentPortalApi.getChildEmploiDuTemps(studentId),
    enabled: !!studentId,
  });
}
