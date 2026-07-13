import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SuperAdminSidebar } from "./SuperAdminSidebar";
import { SuperAdminNavbar } from "./SuperAdminNavbar";

/**
 * Layout for the independent Super Admin space (`/super-admin/*`).
 *
 * Deliberately separate from {@link DashboardLayout}: the SaaS platform
 * operator gets his own sidebar and never sees the school-management menus.
 */
export default function SuperAdminLayout() {
  return (
    <SidebarProvider>
      <SuperAdminSidebar />
      <SidebarInset>
        <SuperAdminNavbar />
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
