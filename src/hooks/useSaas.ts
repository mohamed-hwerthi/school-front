import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { saasApi } from "@/api/saas.api";
import type {
  TenantOnboardingRequest,
  SuperAdminDashboard,
  TenantResponse,
  TenantUsage,
  TenantPlan,
} from "@/types/saas";

const DASHBOARD_KEY = "super-admin-dashboard";
const TENANTS_KEY = "super-admin-tenants";
const USAGE_KEY = "super-admin-tenant-usage";

/**
 * Super admin dashboard stats.
 */
export function useSuperAdminDashboard() {
  return useQuery<SuperAdminDashboard>({
    queryKey: [DASHBOARD_KEY],
    queryFn: () => saasApi.getDashboard(),
  });
}

/**
 * All tenants list.
 */
export function useSuperAdminTenants() {
  return useQuery<TenantResponse[]>({
    queryKey: [TENANTS_KEY],
    queryFn: () => saasApi.getAllTenants(),
  });
}

/**
 * Single tenant usage.
 */
export function useTenantUsage(id: string, enabled = true) {
  return useQuery<TenantUsage>({
    queryKey: [USAGE_KEY, id],
    queryFn: () => saasApi.getTenantUsage(id),
    enabled: enabled && !!id,
  });
}

/**
 * Onboard a new school.
 */
export function useOnboard() {
  return useMutation({
    mutationFn: (data: TenantOnboardingRequest) => saasApi.onboard(data),
  });
}

/**
 * Change tenant plan.
 */
export function useChangePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, plan }: { id: string; plan: string }) =>
      saasApi.changePlan(id, plan),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TENANTS_KEY] });
      qc.invalidateQueries({ queryKey: [DASHBOARD_KEY] });
    },
  });
}

/**
 * Activate a tenant.
 */
export function useActivateTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => saasApi.activateTenant(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TENANTS_KEY] });
      qc.invalidateQueries({ queryKey: [DASHBOARD_KEY] });
    },
  });
}

/**
 * Deactivate a tenant.
 */
export function useDeactivateTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => saasApi.deactivateTenant(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TENANTS_KEY] });
      qc.invalidateQueries({ queryKey: [DASHBOARD_KEY] });
    },
  });
}
