import { useQuery } from "@tanstack/react-query";
import { auditApi, type AuditLogFilters, type PagedResult } from "@/api/audit.api";
import { notify } from "@/lib/toast";
import type { ActionLog } from "@/types/tracabilite";

const AUDIT_LOGS_KEY = "audit-logs";

/**
 * Paginated + filtered audit logs list.
 */
export function useAuditLogs(params: AuditLogFilters = {}) {
  return useQuery<PagedResult<ActionLog>>({
    queryKey: [AUDIT_LOGS_KEY, params],
    queryFn: () => auditApi.getAll(params),
    meta: {
      onError: (error: Error) => {
        notify.error(
          "Erreur de chargement",
          error.message || "Impossible de charger le journal d'audit"
        );
      },
    },
  });
}
