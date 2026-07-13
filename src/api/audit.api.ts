import api from "./axios";
import type { ActionLog, TypeAction, ModuleAction } from "@/types/tracabilite";

const BASE = "/audit-logs";

// ── Backend DTO shape ───────────────────────────────────────────────
export interface AuditLogDTO {
  id: string;
  username: string;
  action: string;
  entityType: string;
  entityId: string | null;
  details: string;
  ipAddress: string;
  timestamp: string; // ISO-8601
}

export interface AuditLogFilters {
  username?: string;
  action?: string;
  entityType?: string;
  from?: string;
  to?: string;
  page?: number;
  size?: number;
}

export interface PagedResult<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

// ── Mapper: backend DTO → frontend ActionLog ────────────────────────

const actionMap: Record<string, TypeAction> = {
  CREATE: "Création",
  UPDATE: "Modification",
  DELETE: "Suppression",
  LOGIN: "Connexion",
  LOGOUT: "Connexion",
};

function mapAction(action: string): TypeAction {
  return actionMap[action] ?? (action as TypeAction);
}

function mapAuditLog(dto: AuditLogDTO): ActionLog {
  const ts = new Date(dto.timestamp);
  const date = dto.timestamp.slice(0, 10); // YYYY-MM-DD
  const heure = ts.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return {
    id: dto.id,
    type: mapAction(dto.action),
    module: (dto.entityType ?? "Système") as ModuleAction,
    description: dto.details?.split("\n")[0] ?? dto.action,
    utilisateur: dto.username,
    date,
    heure,
    details: dto.details ?? "",
    ipAddress: dto.ipAddress ?? "",
  };
}

// ── API service ─────────────────────────────────────────────────────

export const auditApi = {
  getAll: async (
    filters: AuditLogFilters = {}
  ): Promise<PagedResult<ActionLog>> => {
    const params = new URLSearchParams();
    if (filters.username) params.set("username", filters.username);
    if (filters.action) params.set("action", filters.action);
    if (filters.entityType) params.set("entityType", filters.entityType);
    if (filters.from) params.set("from", filters.from);
    if (filters.to) params.set("to", filters.to);
    if (filters.page != null) params.set("page", String(filters.page));
    if (filters.size != null) params.set("size", String(filters.size));

    const query = params.toString();
    const url = query ? `${BASE}?${query}` : BASE;

    const res = await api.get<PagedResult<AuditLogDTO>>(url);
    return {
      ...res.data,
      content: res.data.content.map(mapAuditLog),
    };
  },
};
