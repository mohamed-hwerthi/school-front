export interface ImportError {
  rowNumber: number;
  field: string;
  message: string;
}

export interface ImportResult {
  totalRows: number;
  imported: number;
  skipped: number;
  errors: ImportError[];
}

export type ExportType = "students" | "teachers" | "notes" | "paiements" | "absences";
export type ExportFormat = "csv" | "xlsx";

export type ImportType = "students" | "teachers" | "notes";

export interface ExportFilters {
  classeId?: string;
  trimestre?: number;
  anneeScolaire?: string;
  from?: string;
  to?: string;
}
