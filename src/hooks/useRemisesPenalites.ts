import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  remisesApi,
  penalitesApi,
  type RemiseDTO,
  type PenaliteDTO,
  type RemiseRequest,
  type PenaliteRequest,
} from "@/api/remises-penalites.api";
import { useAnneeContext } from "./useAnneeContext";

const REMISES_KEY = "remises";
const PENALITES_KEY = "penalites";

function useYear(provided?: string) {
  const { selectedAnnee } = useAnneeContext();
  return provided ?? selectedAnnee?.label ?? "";
}

// ─── Remises ──────────────────────────────────────────

export function useRemises(anneeScolaire?: string) {
  const year = useYear(anneeScolaire);
  return useQuery<RemiseDTO[]>({
    queryKey: [REMISES_KEY, year],
    queryFn: () => remisesApi.getAll(year),
    enabled: !!year,
  });
}

export function useRemisesByStudent(studentId: string, anneeScolaire?: string) {
  const year = useYear(anneeScolaire);
  return useQuery<RemiseDTO[]>({
    queryKey: [REMISES_KEY, "student", studentId, year],
    queryFn: () => remisesApi.getByStudent(studentId, year),
    enabled: !!studentId && !!year,
  });
}

export function useCreateRemise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: RemiseRequest) => remisesApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [REMISES_KEY] });
    },
  });
}

export function useUpdateRemise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RemiseRequest }) =>
      remisesApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [REMISES_KEY] });
    },
  });
}

export function useDeleteRemise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => remisesApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [REMISES_KEY] });
    },
  });
}

// ─── Pénalités ────────────────────────────────────────

export function usePenalites(anneeScolaire?: string) {
  const year = useYear(anneeScolaire);
  return useQuery<PenaliteDTO[]>({
    queryKey: [PENALITES_KEY, year],
    queryFn: () => penalitesApi.getAll(year),
    enabled: !!year,
  });
}

export function usePenalitesByStudent(studentId: string, anneeScolaire?: string) {
  const year = useYear(anneeScolaire);
  return useQuery<PenaliteDTO[]>({
    queryKey: [PENALITES_KEY, "student", studentId, year],
    queryFn: () => penalitesApi.getByStudent(studentId, year),
    enabled: !!studentId && !!year,
  });
}

export function useCreatePenalite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: PenaliteRequest) => penalitesApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [PENALITES_KEY] });
    },
  });
}

export function useUpdatePenalite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PenaliteRequest }) =>
      penalitesApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [PENALITES_KEY] });
    },
  });
}

export function useTogglePenalitePayee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => penalitesApi.togglePayee(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [PENALITES_KEY] });
    },
  });
}

export function useDeletePenalite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => penalitesApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [PENALITES_KEY] });
    },
  });
}
