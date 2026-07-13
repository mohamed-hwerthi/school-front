import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  importJobsApi,
  type ImportJob,
  type StartStudentsImportRequest,
} from "@/api/import-jobs.api";

const KEY = "import-jobs";

/**
 * Polls a single import job every 2 seconds until the back-end reports
 * a terminal status (DONE or FAILED). Once terminal, polling stops to
 * avoid unnecessary requests.
 */
export function useImportJob(id: string | null) {
  return useQuery<ImportJob>({
    queryKey: [KEY, id],
    queryFn: () => importJobsApi.getById(id!),
    enabled: !!id,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "DONE" || status === "FAILED" ? false : 2000;
    },
  });
}

export function useStartStudentsImport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: StartStudentsImportRequest) => importJobsApi.startStudents(req),
    onSuccess: () => {
      // Invalidate the students list once the job kicks off — we'll re-invalidate
      // on completion too via the polling hook
      qc.invalidateQueries({ queryKey: ["students"] });
    },
  });
}
