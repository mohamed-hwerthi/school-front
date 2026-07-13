import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  bulletinsApi,
  type BulletinDTO,
  type BulletinAnnuelDTO,
  type MatiereStatDTO,
  type BulletinTemplateDTO,
  type StatsReussiteDTO,
  type AttestationDTO,
  type ComparatifDTO,
} from "@/api/bulletins.api";

const KEY = "bulletins";
const TEMPLATES_KEY = "bulletin-templates";

export function useBulletins(
  classeId: string,
  trimestre: number,
  version: string = "etatique"
) {
  return useQuery<BulletinDTO[]>({
    queryKey: [KEY, classeId, trimestre, version],
    queryFn: () => bulletinsApi.getAll(classeId, trimestre, version),
    enabled: !!classeId && trimestre > 0,
  });
}

// ANN-040: annual bulletin (3-trimestre synthesis)
export function useBulletinsAnnuels(classeId: string, version: string = "etatique") {
  return useQuery<BulletinAnnuelDTO[]>({
    queryKey: [KEY, "annuel", classeId, version],
    queryFn: () => bulletinsApi.getAnnuels(classeId, version),
    enabled: !!classeId,
  });
}

// ANN-025: annual success rate per subject
export function useStatsMatieres(classeId: string, version: string = "etatique") {
  return useQuery<MatiereStatDTO[]>({
    queryKey: [KEY, "stats-matieres", classeId, version],
    queryFn: () => bulletinsApi.getStatsMatieres(classeId, version),
    enabled: !!classeId,
  });
}

export function useBulletin(
  classeId: string,
  studentId: string,
  trimestre: number,
  version: string = "etatique"
) {
  return useQuery<BulletinDTO>({
    queryKey: [KEY, "single", classeId, studentId, trimestre, version],
    queryFn: () => bulletinsApi.getOne(classeId, studentId, trimestre, version),
    enabled: !!classeId && !!studentId && trimestre > 0,
  });
}

// BUL-003: Templates
export function useBulletinTemplates() {
  return useQuery<BulletinTemplateDTO[]>({
    queryKey: [TEMPLATES_KEY],
    queryFn: () => bulletinsApi.getTemplates(),
  });
}

export function useBulletinTemplate(id: string) {
  return useQuery<BulletinTemplateDTO>({
    queryKey: [TEMPLATES_KEY, id],
    queryFn: () => bulletinsApi.getTemplate(id),
    enabled: !!id,
  });
}

export function useActiveTemplate() {
  return useQuery<BulletinTemplateDTO | null>({
    queryKey: [TEMPLATES_KEY, "active"],
    queryFn: () => bulletinsApi.getActiveTemplate(),
  });
}

export function useCreateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: BulletinTemplateDTO) =>
      bulletinsApi.createTemplate(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: [TEMPLATES_KEY] }),
  });
}

export function useUpdateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: BulletinTemplateDTO }) =>
      bulletinsApi.updateTemplate(id, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: [TEMPLATES_KEY] }),
  });
}

export function useActivateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => bulletinsApi.activateTemplate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [TEMPLATES_KEY] }),
  });
}

export function useDeleteTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => bulletinsApi.deleteTemplate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [TEMPLATES_KEY] }),
  });
}

// BUL-004: Mass generate
export function useMassGenerate(
  classeId: string,
  trimestreId: string
) {
  return useQuery<BulletinDTO[]>({
    queryKey: [KEY, "mass", classeId, trimestreId],
    queryFn: () => bulletinsApi.massGenerate(classeId, trimestreId),
    enabled: false, // manual trigger
  });
}

// BUL-005: Stats
export function useStatsReussite(
  classeId: string,
  trimestreId: string
) {
  return useQuery<StatsReussiteDTO>({
    queryKey: [KEY, "stats", classeId, trimestreId],
    queryFn: () =>
      bulletinsApi.getStatsReussite(classeId, trimestreId),
    enabled: !!classeId && !!trimestreId,
  });
}

// BUL-006: Attestation
export function useAttestation(eleveId: string) {
  return useQuery<AttestationDTO>({
    queryKey: [KEY, "attestation", eleveId],
    queryFn: () => bulletinsApi.getAttestation(eleveId),
    enabled: false, // manual trigger
  });
}

// BUL-007: Comparatif
export function useComparatifByNiveau(niveauId: string) {
  return useQuery<ComparatifDTO>({
    queryKey: [KEY, "comparatif", niveauId],
    queryFn: () => bulletinsApi.getComparatifByNiveau(niveauId),
    enabled: !!niveauId,
  });
}

export function useComparatifEvolution(classeId: string) {
  return useQuery<ComparatifDTO>({
    queryKey: [KEY, "comparatif-evolution", classeId],
    queryFn: () => bulletinsApi.getComparatifEvolution(classeId),
    enabled: !!classeId,
  });
}
