import api from "./axios";
import type {
  ImportResult,
  ImportType,
  ExportType,
  ExportFormat,
  ExportFilters,
} from "@/types/import-export";

const IMPORT_BASE = "/import";
const EXPORT_BASE = "/export";

export const importExportApi = {
  // ===================== IMPORT =====================

  importFile: async (
    type: ImportType,
    file: File
  ): Promise<ImportResult> => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await api.post<ImportResult>(
      `${IMPORT_BASE}/${type}`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 60000, // 60s for large files
      }
    );
    return res.data;
  },

  // ===================== EXPORT =====================

  exportData: async (
    type: ExportType,
    format: ExportFormat = "csv",
    filters: ExportFilters = {}
  ): Promise<Blob> => {
    const params = new URLSearchParams();
    params.set("format", format);

    if (type === "notes") {
      if (filters.classeId) params.set("classeId", String(filters.classeId));
      if (filters.trimestre)
        params.set("trimestre", String(filters.trimestre));
    }
    if (type === "paiements" && filters.anneeScolaire) {
      params.set("anneeScolaire", filters.anneeScolaire);
    }
    if (type === "absences") {
      if (filters.from) params.set("from", filters.from);
      if (filters.to) params.set("to", filters.to);
    }

    const res = await api.get(`${EXPORT_BASE}/${type}?${params.toString()}`, {
      responseType: "blob",
      timeout: 60000,
    });
    return res.data;
  },

  // ===================== TEMPLATES =====================

  downloadTemplate: async (
    type: ImportType,
    format: ExportFormat = "csv"
  ): Promise<Blob> => {
    const res = await api.get(
      `${IMPORT_BASE}/template/${type}?format=${format}`,
      {
        responseType: "blob",
      }
    );
    return res.data;
  },
};

/**
 * Trigger a file download from a blob.
 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
