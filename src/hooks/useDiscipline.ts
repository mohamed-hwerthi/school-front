import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { disciplineApi } from "@/api/discipline.api";
import type { Incident, Sanction, DossierDisciplinaire, SanctionSuggestion } from "@/types/discipline";

const INCIDENTS_KEY = "incidents";
const SANCTIONS_KEY = "sanctions";
const DOSSIER_KEY = "dossier-disciplinaire";

/**
 * All incidents.
 */
export function useIncidents() {
  return useQuery<Incident[]>({
    queryKey: [INCIDENTS_KEY],
    queryFn: () => disciplineApi.getIncidents(),
  });
}

/**
 * Single incident by ID.
 */
export function useIncident(id: string) {
  return useQuery<Incident>({
    queryKey: [INCIDENTS_KEY, id],
    queryFn: () => disciplineApi.getIncidentById(id),
    enabled: !!id,
  });
}

/**
 * Create incident mutation.
 */
export function useCreateIncident() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Incident, "id" | "createdAt">) =>
      disciplineApi.createIncident(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [INCIDENTS_KEY] });
    },
  });
}

/**
 * Update incident mutation.
 */
export function useUpdateIncident() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Incident> }) =>
      disciplineApi.updateIncident(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [INCIDENTS_KEY] });
    },
  });
}

/**
 * Delete incident mutation.
 */
export function useDeleteIncident() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => disciplineApi.deleteIncident(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [INCIDENTS_KEY] });
    },
  });
}

/**
 * All sanctions.
 */
export function useSanctions() {
  return useQuery<Sanction[]>({
    queryKey: [SANCTIONS_KEY],
    queryFn: () => disciplineApi.getSanctions(),
  });
}

/**
 * Sanctions by student.
 */
export function useSanctionsByEleve(eleveId: string) {
  return useQuery<Sanction[]>({
    queryKey: [SANCTIONS_KEY, "eleve", eleveId],
    queryFn: () => disciplineApi.getSanctionsByEleve(eleveId),
    enabled: !!eleveId,
  });
}

/**
 * Create sanction mutation.
 */
export function useCreateSanction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Sanction, "id" | "createdAt">) =>
      disciplineApi.createSanction(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [SANCTIONS_KEY] });
      qc.invalidateQueries({ queryKey: [INCIDENTS_KEY] });
    },
  });
}

/**
 * Update sanction mutation.
 */
export function useUpdateSanction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Sanction> }) =>
      disciplineApi.updateSanction(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [SANCTIONS_KEY] });
    },
  });
}

/**
 * Delete sanction mutation.
 */
export function useDeleteSanction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => disciplineApi.deleteSanction(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [SANCTIONS_KEY] });
    },
  });
}

/**
 * Discipline data by student (incidents + sanctions).
 */
export function useDisciplineByEleve(eleveId: string) {
  return useQuery<{ incidents: Incident[]; sanctions: Sanction[] }>({
    queryKey: ["discipline", "eleve", eleveId],
    queryFn: () => disciplineApi.getByEleve(eleveId),
    enabled: !!eleveId,
  });
}

// --- DISC-004: Workflow hooks ---

/**
 * Get sanction suggestion for escalation.
 */
export function useSanctionSuggestion(eleveId: string, enabled = false) {
  return useQuery<SanctionSuggestion>({
    queryKey: [SANCTIONS_KEY, "suggestion", eleveId],
    queryFn: () => disciplineApi.getSanctionSuggestion(eleveId),
    enabled: enabled && !!eleveId,
  });
}

/**
 * Approve sanction mutation.
 */
export function useApproveSanction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, approuveParId, commentaire }: { id: string; approuveParId: string; commentaire?: string }) =>
      disciplineApi.approveSanction(id, approuveParId, commentaire),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [SANCTIONS_KEY] });
    },
  });
}

/**
 * Lift (lever) sanction mutation.
 */
export function useLeverSanction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => disciplineApi.leverSanction(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [SANCTIONS_KEY] });
    },
  });
}

// --- DISC-005: Dossier disciplinaire ---

/**
 * Get full discipline record for a student.
 */
export function useDossierDisciplinaire(eleveId: string, enabled = true) {
  return useQuery<DossierDisciplinaire>({
    queryKey: [DOSSIER_KEY, eleveId],
    queryFn: () => disciplineApi.getDossierDisciplinaire(eleveId),
    enabled: enabled && !!eleveId,
  });
}
