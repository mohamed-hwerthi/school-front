import { lazy, Suspense } from "react";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useCurrentUser } from "@/hooks/useRbac";

const Dashboard = lazy(() => import("@/pages/Dashboard"));
const TeacherDashboard = lazy(() => import("@/pages/TeacherDashboard"));
const ComptableDashboard = lazy(() => import("@/pages/ComptableDashboard"));

function PageLoader() {
  return (
    <div className="flex h-[60vh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

/**
 * Route entry for /dashboard. Picks the right dashboard based on the user's role.
 *
 * - ADMIN, DIRECTEUR → Dashboard (existing school-wide KPIs)
 * - ENSEIGNANT → TeacherDashboard (his classes only)
 * - COMPTABLE → ComptableDashboard (finance focus)
 * - PARENT → redirect to /dashboard/portail-parent
 *
 * Note: SUPER_ADMIN never reaches this — DashboardLayout redirects him to
 * his own independent /super-admin space before the outlet renders.
 */
export default function DashboardByRole() {
  const { role, isLoading } = useCurrentUser();

  if (isLoading) return <PageLoader />;

  switch (role) {
    case "ENSEIGNANT":
      return (
        <Suspense fallback={<PageLoader />}>
          <TeacherDashboard />
        </Suspense>
      );
    case "COMPTABLE":
      return (
        <Suspense fallback={<PageLoader />}>
          <ComptableDashboard />
        </Suspense>
      );
    case "PARENT":
      return <Navigate to="/dashboard/portail-parent" replace />;
    case "ADMIN":
    case "DIRECTEUR":
    default:
      return (
        <Suspense fallback={<PageLoader />}>
          <Dashboard />
        </Suspense>
      );
  }
}
