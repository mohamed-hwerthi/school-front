import { useQuery } from "@tanstack/react-query";
import {
  auditFinancierApi,
  type AuditFinancierDTO,
} from "@/api/audit-financier.api";

const AUDIT_KEY = "audit-financier";

export function useAuditFinancier(entityType?: string) {
  return useQuery<AuditFinancierDTO[]>({
    queryKey: [AUDIT_KEY, entityType],
    queryFn: () => auditFinancierApi.getAll(entityType),
  });
}

export function useAuditFinancierByEntity(entityType: string, entityId: string) {
  return useQuery<AuditFinancierDTO[]>({
    queryKey: [AUDIT_KEY, entityType, entityId],
    queryFn: () => auditFinancierApi.getByEntity(entityType, entityId),
    enabled: !!entityType && !!entityId,
  });
}
