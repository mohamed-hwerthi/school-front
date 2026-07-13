import { Navigate } from "react-router-dom";
import { useHasAnyPermission } from "@/hooks/useRbac";
import { useAuth } from "@/hooks/useAuth";
import type { Permission } from "@/lib/permissions";

interface PermissionGuardProps {
  /** User must have at least one of these permissions to enter the route. */
  perms: Permission[];
  children: React.ReactNode;
}

/**
 * Route guard mirror of RoleGuard but based on permissions instead of roles.
 * Use when access is more naturally expressed as a capability
 * (e.g. "WRITE_NOTES") than as a role list.
 */
export function PermissionGuard({ perms, children }: PermissionGuardProps) {
  const { user } = useAuth();
  const allowed = useHasAnyPermission(perms);

  if (!user || !allowed) {
    return <Navigate to="/forbidden" replace />;
  }

  return <>{children}</>;
}
