import { Navigate, Outlet } from "react-router-dom";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Navbar } from "./Navbar";
import { useCurrentUser } from "@/hooks/useRbac";

export default function DashboardLayout() {
  const { role } = useCurrentUser();
  // The SUPER_ADMIN has his own independent space — he never uses the
  // school-management dashboard.
  if (role === "SUPER_ADMIN") return <Navigate to="/super-admin" replace />;

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Navbar />
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
