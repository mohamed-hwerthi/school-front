import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  volumeHoraireApi,
  type VolumeHoraireDTO,
  type VolumeHoraireRequest,
} from "@/api/volume-horaire.api";

const KEY = "volume-horaire";

export function useVolumeHoraire(params?: { classeId?: string; anneeScolaireId?: string }) {
  return useQuery<VolumeHoraireDTO[]>({
    queryKey: [KEY, params ?? {}],
    queryFn: () => volumeHoraireApi.getAll(params),
  });
}

export function useCreateVolumeHoraire() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: VolumeHoraireRequest) => volumeHoraireApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateVolumeHoraire() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; data: VolumeHoraireRequest }) =>
      volumeHoraireApi.update(vars.id, vars.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useDeleteVolumeHoraire() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => volumeHoraireApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
