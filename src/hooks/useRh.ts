import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { rhApi } from "@/api/rh.api";
import type {
  Pointage,
  CreatePointageRequest,
  FichePaie,
  CreateFichePaieRequest,
  Formation,
  CreateFormationRequest,
  AddParticipantRequest,
  RhStats,
} from "@/types/rh";

const POINTAGE_KEY = "pointages";
const PAIE_KEY = "fiches-paie";
const FORMATIONS_KEY = "formations";
const RH_STATS_KEY = "rh-stats";

// ── Pointage ────────────────────────────────────────

export function usePointages() {
  return useQuery<Pointage[]>({
    queryKey: [POINTAGE_KEY],
    queryFn: () => rhApi.getAllPointages(),
  });
}

export function usePointagesByDate(date: string) {
  return useQuery<Pointage[]>({
    queryKey: [POINTAGE_KEY, "date", date],
    queryFn: () => rhApi.getPointagesByDate(date),
    enabled: !!date,
  });
}

export function usePointagesByEmploye(employeId: string, employeType?: string) {
  return useQuery<Pointage[]>({
    queryKey: [POINTAGE_KEY, "employe", employeId, employeType],
    queryFn: () => rhApi.getPointagesByEmploye(employeId, employeType),
    enabled: !!employeId,
  });
}

export function useCreatePointage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePointageRequest) => rhApi.createPointage(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [POINTAGE_KEY] });
    },
  });
}

export function useUpdatePointage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreatePointageRequest }) =>
      rhApi.updatePointage(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [POINTAGE_KEY] });
    },
  });
}

export function useDeletePointage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => rhApi.deletePointage(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [POINTAGE_KEY] });
    },
  });
}

// ── Fiches de Paie ──────────────────────────────────

export function useFichesPaie() {
  return useQuery<FichePaie[]>({
    queryKey: [PAIE_KEY],
    queryFn: () => rhApi.getAllFichesPaie(),
  });
}

export function useFichesPaieByEmploye(employeId: string) {
  return useQuery<FichePaie[]>({
    queryKey: [PAIE_KEY, "employe", employeId],
    queryFn: () => rhApi.getFichesPaieByEmploye(employeId),
    enabled: !!employeId,
  });
}

export function useFichesPaieByMois(mois: number, annee: number) {
  return useQuery<FichePaie[]>({
    queryKey: [PAIE_KEY, "mois", mois, annee],
    queryFn: () => rhApi.getFichesPaieByMois(mois, annee),
    enabled: mois > 0 && annee > 0,
  });
}

export function useCreateFichePaie() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateFichePaieRequest) => rhApi.createFichePaie(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [PAIE_KEY] });
    },
  });
}

export function useUpdateFichePaie() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateFichePaieRequest }) =>
      rhApi.updateFichePaie(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [PAIE_KEY] });
    },
  });
}

export function useDeleteFichePaie() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => rhApi.deleteFichePaie(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [PAIE_KEY] });
    },
  });
}

// ── Formations ──────────────────────────────────────

export function useFormations() {
  return useQuery<Formation[]>({
    queryKey: [FORMATIONS_KEY],
    queryFn: () => rhApi.getAllFormations(),
  });
}

export function useFormation(id: string) {
  return useQuery<Formation>({
    queryKey: [FORMATIONS_KEY, id],
    queryFn: () => rhApi.getFormationById(id),
    enabled: !!id,
  });
}

export function useCreateFormation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateFormationRequest) => rhApi.createFormation(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [FORMATIONS_KEY] });
    },
  });
}

export function useUpdateFormation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateFormationRequest }) =>
      rhApi.updateFormation(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [FORMATIONS_KEY] });
    },
  });
}

export function useDeleteFormation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => rhApi.deleteFormation(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [FORMATIONS_KEY] });
    },
  });
}

export function useAddParticipant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ formationId, data }: { formationId: string; data: AddParticipantRequest }) =>
      rhApi.addParticipant(formationId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [FORMATIONS_KEY] });
    },
  });
}

export function useRemoveParticipant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (participantId: string) => rhApi.removeParticipant(participantId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [FORMATIONS_KEY] });
    },
  });
}

// ── Stats ───────────────────────────────────────────

export function useRhStats() {
  return useQuery<RhStats>({
    queryKey: [RH_STATS_KEY],
    queryFn: () => rhApi.getStats(),
  });
}
