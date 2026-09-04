import { Navigate, Outlet } from "react-router-dom";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Navbar } from "./Navbar";
import { AnneeClotureeBanner } from "./AnneeClotureeBanner";
import { TeacherBottomNav } from "./TeacherBottomNav";
import { useCurrentUser } from "@/hooks/useRbac";

export default function DashboardLayout() {
  const { role } = useCurrentUser();
  // The SUPER_ADMIN has his own independent space — he never uses the
  // school-management dashboard.
  if (role === "SUPER_ADMIN") return <Navigate to="/super-admin" replace />;

  const isTeacher = role === "ENSEIGNANT";

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Navbar />
        <AnneeClotureeBanner />
        {/* La barre d'onglets enseignante est fixe : on réserve sa hauteur en
            bas du contenu pour qu'elle ne recouvre jamais la fin de page. */}
        <div className={`flex-1 overflow-auto ${isTeacher ? "pb-[calc(56px+env(safe-area-inset-bottom))] md:pb-0" : ""}`}>
          <Outlet />
        </div>
        {isTeacher && <TeacherBottomNav />}
      </SidebarInset>
    </SidebarProvider>
  );
}
