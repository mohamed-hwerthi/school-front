import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, LogOut, Plus } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";

/** Navigation for the independent Super Admin space. */
const NAV_ITEMS = [
  { label: "Tableau de bord", icon: LayoutDashboard, url: "/super-admin" },
  { label: "Nouvelle école", icon: Plus, url: "/super-admin/nouvelle-ecole" },
];

/**
 * Sidebar for the Super Admin platform space — deliberately separate from
 * the school `AppSidebar`: the platform operator never browses school menus.
 */
export function SuperAdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t, isRTL } = useLanguage();

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      /* ignore */
    }
    navigate("/");
  };

  const initials = user
    ? `${(user.firstName ?? "").charAt(0)}${(user.lastName ?? "").charAt(0)}`.trim() || "?"
    : "?";

  return (
    <Sidebar side={isRTL ? "right" : "left"} className="border-r-0">
      {/* Header */}
      <SidebarHeader className="px-4 pt-5 pb-3">
        <Link to="/super-admin" className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600 text-white text-sm font-extrabold shadow-lg shadow-purple-500/25">
            E
          </div>
          <div>
            <span className="text-base font-extrabold tracking-tight text-foreground">
              EcoleNet
            </span>
            <span className="block text-[10px] font-medium text-muted-foreground -mt-0.5">
              Espace Super Admin
            </span>
          </div>
        </Link>
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent className="px-3 pt-1 pb-2">
        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.url;
            return (
              <Link
                key={item.url}
                to={item.url}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 ${
                  active
                    ? "bg-primary/[0.06] text-foreground"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                }`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                    active ? "bg-primary/10" : "bg-muted/60"
                  }`}
                >
                  <Icon
                    className={`h-[18px] w-[18px] ${
                      active ? "text-primary" : "text-muted-foreground"
                    }`}
                  />
                </div>
                <span className="flex-1 text-[13px] font-semibold">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="px-3 pb-4 pt-2">
        <div className="rounded-2xl bg-gradient-to-r from-muted/60 to-muted/30 p-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white text-[11px] font-bold shadow-md">
                {initials}
              </div>
              <div className="absolute -bottom-0.5 -end-0.5 h-3 w-3 rounded-full border-2 border-card bg-emerald-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-foreground truncate leading-tight">
                {user ? `${user.firstName} ${user.lastName}` : ""}
              </p>
              <p className="text-[11px] text-muted-foreground truncate leading-tight mt-0.5">
                {user?.role?.replace(/_/g, " ")}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-all"
              title={t("common.logout")}
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
