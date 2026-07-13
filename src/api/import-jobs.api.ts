import api from "./axios";
import type { Student } from "@/types/student";
import type { BulkImportRowError } from "./students.api";
import { toApi } from "./student-mapper";

export type ImportJobStatus = "PENDING" | "RUNNING" | "DONE" | "FAILED";
export type ImportJobStrategy = "SKIP" | "UPDATE";

export interface ImportJob {
  id: string;
  type: "STUDENTS" | "TEACHERS" | string;
  status: ImportJobStatus;
  strategy: ImportJobStrategy;
  totalRows: number;
  processed: number;
  successCount: number;
  skippedCount: number;
  errorCount: number;
  errors: BulkImportRowError[];
  createdBy: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
}

export interface StartStudentsImportRequest {
  rows: Omit<Student, "id" | "dateInscription">[];
  strategy?: ImportJobStrategy;
  createdBy?: string;
}

const BASE = "/import-jobs";

export const importJobsApi = {
  startStudents: async (req: StartStudentsImportRequest): Promise<ImportJob> => {
    // Convert UI rows (nom/prenom/...) to backend shape (firstName/lastName/...)
    const payload = {
      rows: req.rows.map(toApi),
      strategy: req.strategy ?? "SKIP",
      createdBy: req.createdBy,
    };
    const res = await api.post<ImportJob>(`${BASE}/students`, payload);
    return res.data;
  },

  getById: async (id: string): Promise<ImportJob> => {
    const res = await api.get<ImportJob>(`${BASE}/${id}`);
    return res.data;
  },

  list: async (type: string = "STUDENTS"): Promise<ImportJob[]> => {
    const res = await api.get<ImportJob[]>(BASE, { params: { type } });
    return res.data;
  },
};
