import { useMutation } from "@tanstack/react-query";
import { importExportApi, downloadBlob } from "@/api/import-export.api";
import type {
  ImportType,
  ExportType,
  ExportFormat,
  ExportFilters,
} from "@/types/import-export";

/**
 * Hook for importing data from a file (CSV or XLSX).
 */
export function useImportFile(type: ImportType) {
  return useMutation({
    mutationFn: (file: File) => importExportApi.importFile(type, file),
  });
}

/**
 * Hook for exporting data to a file.
 */
export function useExportData() {
  return useMutation({
    mutationFn: async ({
      type,
      format = "csv",
      filters = {},
    }: {
      type: ExportType;
      format?: ExportFormat;
      filters?: ExportFilters;
    }) => {
      const blob = await importExportApi.exportData(type, format, filters);
      const ext = format === "xlsx" ? "xlsx" : "csv";
      const filename = `${type}_export.${ext}`;
      downloadBlob(blob, filename);
      return blob;
    },
  });
}

/**
 * Hook for downloading an import template.
 */
export function useDownloadTemplate() {
  return useMutation({
    mutationFn: async ({
      type,
      format = "csv",
    }: {
      type: ImportType;
      format?: ExportFormat;
    }) => {
      const blob = await importExportApi.downloadTemplate(type, format);
      const ext = format === "xlsx" ? "xlsx" : "csv";
      const filename = `template_${type}.${ext}`;
      downloadBlob(blob, filename);
      return blob;
    },
  });
}
