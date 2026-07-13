import api from "./axios";

// ─── Backend DTOs ────────────────────────────────────────

export interface AuditFinancierDTO {
  id: string;
  entityType: string;
  entityId: string;
  action: "CREATE" | "UPDATE" | "DELETE";
  userId: string | null;
  userName: string | null;
  oldValues: string | null;
  newValues: string | null;
  createdAt: string;
}

// ─── API calls ───────────────────────────────────────────

export const auditFinancierApi = {
  getAll: async (entityType?: string): Promise<AuditFinancierDTO[]> => {
    const params = entityType ? `?entityType=${entityType}` : "";
    const res = await api.get<AuditFinancierDTO[]>(`/audit-financier${params}`);
    return res.data;
  },

  getByEntity: async (entityType: string, entityId: string): Promise<AuditFinancierDTO[]> => {
    const res = await api.get<AuditFinancierDTO[]>(
      `/audit-financier/${entityType}/${entityId}`
    );
    return res.data;
  },
};
