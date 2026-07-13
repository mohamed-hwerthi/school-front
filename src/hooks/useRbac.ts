import { useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  getPermissionsForRole,
  roleHasPermission,
  roleHasAnyPermission,
  type Permission,
} from "@/lib/permissions";
import type { UserRole } from "@/types/auth";

/**
 * Convenience hook exposing the current user, role, and computed permissions.
 * Built on top of useAuth() — no extra state, just memoized derivations.
 *
 * Prefers `user.permissions` from the backend (/auth/me) when present;
 * falls back to the local role→permissions matrix otherwise.
 */
export function useCurrentUser() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const permissions = useMemo<Permission[]>(() => {
    if (user?.permissions && user.permissions.length > 0) {
      return user.permissions as Permission[];
    }
    return getPermissionsForRole(user?.role);
  }, [user?.role, user?.permissions]);
  return {
    user,
    role: user?.role ?? null,
    permissions,
    scopedClasseIds: user?.scopedClasseIds ?? [],
    scopedStudentIds: user?.scopedStudentIds ?? [],
    isAuthenticated,
    isLoading,
  };
}

/**
 * Returns true if the current user has the given permission.
 * Returns false when not logged in.
 */
export function useHasPermission(permission: Permission): boolean {
  const { permissions, role } = useCurrentUser();
  return useMemo(() => {
    // Prefer the backend-issued permissions list when available.
    if (permissions.length > 0) return permissions.includes(permission);
    return roleHasPermission(role, permission);
  }, [permissions, role, permission]);
}

/**
 * Returns true if the current user has at least one of the given permissions.
 * An empty array always returns true (no restriction).
 */
export function useHasAnyPermission(perms: Permission[]): boolean {
  const { permissions, role } = useCurrentUser();
  return useMemo(() => {
    if (perms.length === 0) return true;
    if (permissions.length > 0)
      return perms.some((p) => permissions.includes(p));
    return roleHasAnyPermission(role, perms);
  }, [permissions, role, perms]);
}

/**
 * Returns true if the current user's role is in the given list.
 * An empty list always returns true (no restriction).
 */
export function useHasRole(roles: UserRole[]): boolean {
  const { role } = useCurrentUser();
  return useMemo(() => {
    if (roles.length === 0) return true;
    return role !== null && roles.includes(role);
  }, [role, roles]);
}
