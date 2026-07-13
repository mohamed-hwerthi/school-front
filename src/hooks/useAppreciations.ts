import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  appreciationsApi,
  type RecommandationDTO,
  type RecommandationRequest,
  type ObservationDTO,
  type ObservationRequest,
} from "@/api/appreciations.api";

const RECO_KEY = "recommandations";
const OBS_KEY = "observations";

export function useRecommandations(studentIds: string[], trimestre: number) {
  return useQuery<RecommandationDTO[]>({
    queryKey: [RECO_KEY, studentIds, trimestre],
    queryFn: () => appreciationsApi.getRecommandations(studentIds, trimestre),
    enabled: studentIds.length > 0 && trimestre > 0,
  });
}

export function useUpsertRecommandations() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (items: RecommandationRequest[]) =>
      appreciationsApi.upsertRecommandations(items),
    onSuccess: () => qc.invalidateQueries({ queryKey: [RECO_KEY] }),
  });
}

export function useObservations(studentIds: string[], trimestre: number) {
  return useQuery<ObservationDTO[]>({
    queryKey: [OBS_KEY, studentIds, trimestre],
    queryFn: () => appreciationsApi.getObservations(studentIds, trimestre),
    enabled: studentIds.length > 0 && trimestre > 0,
  });
}

export function useUpsertObservations() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (items: ObservationRequest[]) =>
      appreciationsApi.upsertObservations(items),
    onSuccess: () => qc.invalidateQueries({ queryKey: [OBS_KEY] }),
  });
}
