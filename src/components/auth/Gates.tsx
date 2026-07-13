import type { ReactNode } from "react";
import { useHasAnyPermission, useHasRole } from "@/hooks/useRbac";
import type { Permission } from "@/lib/permissions";
import type { UserRole } from "@/types/auth";

interface RoleGateProps {
  /** Allowed roles. Empty array = no restriction. */
  roles: UserRole[];
  /** Rendered when the user is NOT in `roles`. Defaults to nothing. */
  fallback?: ReactNode;
  children: ReactNode;
}

/**
 * Conditionally renders children based on the user's role.
 *
 * @example
 *   <RoleGate roles={["ADMIN", "DIRECTEUR"]}>
 *     <Button>Supprimer</Button>
 *   </RoleGate>
 */
export function RoleGate({ roles, fallback = null, children }: RoleGateProps) {
  const allowed = useHasRole(roles);
  return <>{allowed ? children : fallback}</>;
}

interface PermissionGateProps {
  /** User must have at least one of these permissions. Empty = no restriction. */
  perms: Permission[];
  fallback?: ReactNode;
  children: ReactNode;
}

/**
 * Conditionally renders children based on the user's permissions.
 *
 * @example
 *   <PermissionGate perms={["WRITE_NOTES"]}>
 *     <Button>Saisir une note</Button>
 *   </PermissionGate>
 */
export function PermissionGate({
  perms,
  fallback = null,
  children,
}: PermissionGateProps) {
  const allowed = useHasAnyPermission(perms);
  return <>{allowed ? children : fallback}</>;
}
