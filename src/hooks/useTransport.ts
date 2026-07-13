import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { vehiculesApi, circuitsApi, affectationsTransportApi } from "@/api/transport.api";
import type {
  Vehicule,
  Circuit,
  AffectationTransport,
  TransportStats,
  CreateCircuitRequest,
  CreateAffectationRequest,
} from "@/types/transport";

const VEHICULES_KEY = "vehicules";
const CIRCUITS_KEY = "circuits";
const AFFECTATIONS_TRANSPORT_KEY = "affectations-transport";

// ---- Vehicules ----

export function useVehicules() {
  return useQuery<Vehicule[]>({
    queryKey: [VEHICULES_KEY],
    queryFn: vehiculesApi.getAll,
  });
}

export function useCreateVehicule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Vehicule>) => vehiculesApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [VEHICULES_KEY] });
    },
  });
}

export function useUpdateVehicule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Vehicule> }) =>
      vehiculesApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [VEHICULES_KEY] });
    },
  });
}

export function useDeleteVehicule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => vehiculesApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [VEHICULES_KEY] });
    },
  });
}

// ---- Circuits ----

export function useCircuits() {
  return useQuery<Circuit[]>({
    queryKey: [CIRCUITS_KEY],
    queryFn: circuitsApi.getAll,
  });
}

export function useCircuit(id: string) {
  return useQuery<Circuit>({
    queryKey: [CIRCUITS_KEY, id],
    queryFn: () => circuitsApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateCircuit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCircuitRequest) => circuitsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [CIRCUITS_KEY] });
    },
  });
}

export function useUpdateCircuit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateCircuitRequest }) =>
      circuitsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [CIRCUITS_KEY] });
    },
  });
}

export function useDeleteCircuit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => circuitsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [CIRCUITS_KEY] });
      qc.invalidateQueries({ queryKey: [AFFECTATIONS_TRANSPORT_KEY] });
    },
  });
}

// ---- Affectations Transport ----

export function useAffectationsTransport() {
  return useQuery<AffectationTransport[]>({
    queryKey: [AFFECTATIONS_TRANSPORT_KEY],
    queryFn: affectationsTransportApi.getAll,
  });
}

export function useAffectationsByCircuit(circuitId: string) {
  return useQuery<AffectationTransport[]>({
    queryKey: [AFFECTATIONS_TRANSPORT_KEY, "circuit", circuitId],
    queryFn: () => affectationsTransportApi.getByCircuit(circuitId),
    enabled: !!circuitId,
  });
}

export function useTransportStats() {
  return useQuery<TransportStats>({
    queryKey: [AFFECTATIONS_TRANSPORT_KEY, "stats"],
    queryFn: affectationsTransportApi.getStats,
  });
}

export function useAffecterTransport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAffectationRequest) => affectationsTransportApi.affecter(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [AFFECTATIONS_TRANSPORT_KEY] });
      qc.invalidateQueries({ queryKey: [CIRCUITS_KEY] });
    },
  });
}

export function useDesaffecterTransport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => affectationsTransportApi.desaffecter(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [AFFECTATIONS_TRANSPORT_KEY] });
      qc.invalidateQueries({ queryKey: [CIRCUITS_KEY] });
    },
  });
}

export function useDeleteAffectation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => affectationsTransportApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [AFFECTATIONS_TRANSPORT_KEY] });
      qc.invalidateQueries({ queryKey: [CIRCUITS_KEY] });
    },
  });
}
