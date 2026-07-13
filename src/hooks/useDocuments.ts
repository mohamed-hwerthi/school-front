import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { documentsApi } from "@/api/documents.api";
import type {
  DocumentGenerationRequest,
  DocumentHistory,
  DocumentTemplateConfig,
} from "@/types/document";

const DOCUMENTS_KEY = "documents";

/**
 * Document generation history.
 */
export function useDocumentHistory() {
  return useQuery<DocumentHistory[]>({
    queryKey: [DOCUMENTS_KEY, "history"],
    queryFn: () => documentsApi.getHistorique(),
  });
}

/**
 * Document template configuration.
 */
export function useTemplateConfig() {
  return useQuery<DocumentTemplateConfig>({
    queryKey: [DOCUMENTS_KEY, "template-config"],
    queryFn: () => documentsApi.getTemplateConfig(),
  });
}

/**
 * Update template config mutation.
 */
export function useUpdateTemplateConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (config: DocumentTemplateConfig) =>
      documentsApi.updateTemplateConfig(config),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [DOCUMENTS_KEY, "template-config"] });
    },
  });
}

/**
 * Helper to trigger file download from a Blob.
 */
function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

/**
 * Generate certificat de scolarite mutation.
 */
export function useGenerateCertificatScolarite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (eleveId: string) =>
      documentsApi.generateCertificatScolarite(eleveId),
    onSuccess: (blob, eleveId) => {
      downloadBlob(blob, `certificat_scolarite_${eleveId}.html`);
      qc.invalidateQueries({ queryKey: [DOCUMENTS_KEY, "history"] });
    },
  });
}

/**
 * Generate carte scolaire mutation.
 */
export function useGenerateCarteScolaire() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (eleveId: string) =>
      documentsApi.generateCarteScolaire(eleveId),
    onSuccess: (blob, eleveId) => {
      downloadBlob(blob, `carte_scolaire_${eleveId}.html`);
      qc.invalidateQueries({ queryKey: [DOCUMENTS_KEY, "history"] });
    },
  });
}

/**
 * Generate attestation de reussite mutation.
 */
export function useGenerateAttestation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      eleveId,
      anneeScolaire,
    }: {
      eleveId: string;
      anneeScolaire?: string;
    }) => documentsApi.generateAttestation(eleveId, anneeScolaire),
    onSuccess: (blob, { eleveId }) => {
      downloadBlob(blob, `attestation_reussite_${eleveId}.html`);
      qc.invalidateQueries({ queryKey: [DOCUMENTS_KEY, "history"] });
    },
  });
}

/**
 * Generate releve de notes mutation.
 */
export function useGenerateReleveNotes() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      eleveId,
      trimestre,
    }: {
      eleveId: string;
      trimestre?: number;
    }) => documentsApi.generateReleveNotes(eleveId, trimestre),
    onSuccess: (blob, { eleveId }) => {
      downloadBlob(blob, `releve_notes_${eleveId}.html`);
      qc.invalidateQueries({ queryKey: [DOCUMENTS_KEY, "history"] });
    },
  });
}

/**
 * Generate recu de paiement mutation.
 */
export function useGenerateRecuPaiement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (paiementId: string) =>
      documentsApi.generateRecuPaiement(paiementId),
    onSuccess: (blob, paiementId) => {
      downloadBlob(blob, `recu_paiement_${paiementId}.html`);
      qc.invalidateQueries({ queryKey: [DOCUMENTS_KEY, "history"] });
    },
  });
}

/**
 * Generate bulk documents mutation.
 */
export function useGenerateBulk() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (request: DocumentGenerationRequest) =>
      documentsApi.generateBulk(request),
    onSuccess: (blob) => {
      downloadBlob(blob, "documents_bulk.zip");
      qc.invalidateQueries({ queryKey: [DOCUMENTS_KEY, "history"] });
    },
  });
}
