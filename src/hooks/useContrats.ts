import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { contratsApi } from "@/api/contrats.api";
import type { ContratEnseignant, Conge } from "@/types/contrat";

const CONTRATS_KEY = "contrats";
const CONGES_KEY = "conges";

// ─── Contrats ──────────────────────────────

/**
 * All contracts.
 */
export function useContrats() {
  return useQuery<ContratEnseignant[]>({
    queryKey: [CONTRATS_KEY],
    queryFn: () => contratsApi.getAll(),
  });
}

/**
 * Contracts by teacher.
 */
export function useContratsByEnseignant(enseignantId: string) {
  return useQuery<ContratEnseignant[]>({
    queryKey: [CONTRATS_KEY, "enseignant", enseignantId],
    queryFn: () => contratsApi.getByEnseignant(enseignantId),
    enabled: !!enseignantId,
  });
}

/**
 * Create contract.
 */
export function useCreateContrat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<ContratEnseignant, "id">) => contratsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [CONTRATS_KEY] });
    },
  });
}

/**
 * Update contract.
 */
export function useUpdateContrat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ContratEnseignant> }) =>
      contratsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [CONTRATS_KEY] });
    },
  });
}

/**
 * Delete contract.
 */
export function useDeleteContrat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => contratsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [CONTRATS_KEY] });
    },
  });
}

// ─── Conges ──────────────────────────────

/**
 * All leaves.
 */
export function useConges() {
  return useQuery<Conge[]>({
    queryKey: [CONGES_KEY],
    queryFn: () => contratsApi.getAllConges(),
  });
}

/**
 * Leaves by teacher.
 */
export function useCongesByEnseignant(enseignantId: string) {
  return useQuery<Conge[]>({
    queryKey: [CONGES_KEY, "enseignant", enseignantId],
    queryFn: () => contratsApi.getCongesByEnseignant(enseignantId),
    enabled: !!enseignantId,
  });
}

/**
 * Create leave request.
 */
export function useCreateConge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Conge, "id" | "enseignantNom" | "statut">) =>
      contratsApi.createConge(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [CONGES_KEY] });
    },
  });
}

/**
 * Approve leave.
 */
export function useApprouverConge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => contratsApi.approuverConge(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [CONGES_KEY] });
    },
  });
}

/**
 * Refuse leave.
 */
export function useRefuserConge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => contratsApi.refuserConge(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [CONGES_KEY] });
    },
  });
}

/**
 * Delete leave.
 */
export function useDeleteConge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => contratsApi.deleteConge(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [CONGES_KEY] });
    },
  });
}
