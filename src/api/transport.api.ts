import api from "./axios";
import type {
  Vehicule,
  Circuit,
  Arret,
  AffectationTransport,
  TransportStats,
  CreateCircuitRequest,
  CreateAffectationRequest,
} from "@/types/transport";

// ---- Vehicules ----

export const vehiculesApi = {
  getAll: async (): Promise<Vehicule[]> => {
    const res = await api.get<Vehicule[]>("/vehicules");
    return res.data;
  },

  getById: async (id: string): Promise<Vehicule> => {
    const res = await api.get<Vehicule>(`/vehicules/${id}`);
    return res.data;
  },

  create: async (data: Partial<Vehicule>): Promise<Vehicule> => {
    const res = await api.post<Vehicule>("/vehicules", data);
    return res.data;
  },

  update: async (id: string, data: Partial<Vehicule>): Promise<Vehicule> => {
    const res = await api.put<Vehicule>(`/vehicules/${id}`, data);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/vehicules/${id}`);
  },
};

// ---- Circuits ----

export const circuitsApi = {
  getAll: async (): Promise<Circuit[]> => {
    const res = await api.get<Circuit[]>("/circuits");
    return res.data;
  },

  getById: async (id: string): Promise<Circuit> => {
    const res = await api.get<Circuit>(`/circuits/${id}`);
    return res.data;
  },

  getArrets: async (id: string): Promise<Arret[]> => {
    const res = await api.get<Arret[]>(`/circuits/${id}/arrets`);
    return res.data;
  },

  create: async (data: CreateCircuitRequest): Promise<Circuit> => {
    const res = await api.post<Circuit>("/circuits", data);
    return res.data;
  },

  update: async (id: string, data: CreateCircuitRequest): Promise<Circuit> => {
    const res = await api.put<Circuit>(`/circuits/${id}`, data);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/circuits/${id}`);
  },
};

// ---- Affectations Transport ----

export const affectationsTransportApi = {
  getAll: async (): Promise<AffectationTransport[]> => {
    const res = await api.get<AffectationTransport[]>("/affectations-transport");
    return res.data;
  },

  getByCircuit: async (circuitId: string): Promise<AffectationTransport[]> => {
    const res = await api.get<AffectationTransport[]>(`/affectations-transport/circuit/${circuitId}`);
    return res.data;
  },

  getByEleve: async (eleveId: string): Promise<AffectationTransport[]> => {
    const res = await api.get<AffectationTransport[]>(`/affectations-transport/eleve/${eleveId}`);
    return res.data;
  },

  getStats: async (): Promise<TransportStats> => {
    const res = await api.get<TransportStats>("/affectations-transport/stats");
    return res.data;
  },

  affecter: async (data: CreateAffectationRequest): Promise<AffectationTransport> => {
    const res = await api.post<AffectationTransport>("/affectations-transport", data);
    return res.data;
  },

  desaffecter: async (id: string): Promise<AffectationTransport> => {
    const res = await api.put<AffectationTransport>(`/affectations-transport/${id}/desaffecter`);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/affectations-transport/${id}`);
  },
};
