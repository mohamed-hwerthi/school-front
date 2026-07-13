import { useState, useMemo } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronDown, LogOut, Search } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { sidebarSections } from "@/data/sidebar-nav";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toggleSidebar } = useSidebar();
  const { user, logout } = useAuth();
  const { t, isRTL } = useLanguage();
  const [search, setSearch] = useState("");

  // Find which section contains the active route
  const activeSectionLabel = useMemo(() => {
    for (const section of sidebarSections) {
      for (const item of section.items) {
        const itemPath = item.url.split("?")[0];
        if (itemPath === "/dashboard" && location.pathname === "/dashboard") return section.label;
        if (itemPath !== "/dashboard" && location.pathname.startsWith(itemPath)) return section.label;
      }
    }
    return "Accueil";
  }, [location.pathname]);

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ [activeSectionLabel]: true });

  const toggleSection = (label: string) => {
    setOpenSections((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const isActive = (url: string) => {
    const [path, query] = url.split("?");
    if (path === "/dashboard") return location.pathname === "/dashboard";
    if (!location.pathname.startsWith(path)) return false;
    if (!query) return true;
    const target = new URLSearchParams(query);
    const current = new URLSearchParams(location.search);
    for (const [k, v] of target) {
      if (current.get(k) !== v) return false;
    }
    return true;
  };

  // Role-based filtering + search filtering.
  // - A section is hidden if its `roles` excludes the user's role.
  // - Inside a kept section, items with their own `roles` are filtered too.
  // - Sections that end up empty are dropped entirely.
  const userRole = user?.role;
  const roleAllows = (allowed?: string[]) =>
    !allowed || allowed.length === 0 || (userRole != null && allowed.includes(userRole));

  const filteredSections = useMemo(() => {
    const q = search.toLowerCase().trim();
    return sidebarSections
      .filter((section) => roleAllows(section.roles))
      .map((section) => ({
        ...section,
        items: section.items
          .filter((item) => roleAllows(item.roles))
          .filter(
            (item) =>
              !q ||
              t(item.titleKey).toLowerCase().includes(q) ||
              t(section.labelKey).toLowerCase().includes(q) ||
              item.title.toLowerCase().includes(q)
          ),
      }))
      .filter((s) => s.items.length > 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, t, userRole]);

  // Auto-open sections when searching
  useMemo(() => {
    if (search.trim()) {
      const allOpen: Record<string, boolean> = {};
      filteredSections.forEach((s) => { allOpen[s.label] = true; });
      setOpenSections(allOpen);
    }
  }, [search]);

  const handleLogout = async () => {
    try { await logout(); } catch { /* ignore */ }
    navigate("/");
  };

  const initials = user
    ? `${(user.firstName ?? "").charAt(0)}${(user.lastName ?? "").charAt(0)}`.trim() || "?"
    : "?";

  return (
    <Sidebar collapsible="icon" side={isRTL ? "right" : "left"} className="border-r-0">
      {/* ── Header ── */}
      <SidebarHeader className="px-4 pt-5 pb-3">
        <div className="flex items-center justify-between group-data-[collapsible=icon]:justify-center">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600 text-white text-sm font-extrabold shadow-lg shadow-purple-500/25">
              E
            </div>
            <div className="group-data-[collapsible=icon]:hidden">
              <span className="text-base font-extrabold tracking-tight text-foreground">
                EcoleNet
              </span>
              <span className="block text-[10px] font-medium text-muted-foreground -mt-0.5">
                {t("app.subtitle")}
              </span>
            </div>
          </Link>
          <button
            onClick={toggleSidebar}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground/60 hover:text-foreground hover:bg-muted transition-all group-data-[collapsible=icon]:hidden"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>

        {/* Search */}
        <div className="mt-4 group-data-[collapsible=icon]:hidden">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("common.searchPlaceholder")}
              className="w-full rounded-xl border-0 bg-muted/50 py-2 ps-9 pe-3 text-xs text-foreground placeholder:text-muted-foreground/40 focus:bg-muted/80 focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all"
            />
          </div>
        </div>
      </SidebarHeader>

      {/* ── Navigation ── */}
      <SidebarContent className="px-3 pt-1 pb-2 overflow-y-auto scrollbar-thin">
        <nav className="space-y-1">
          {filteredSections.map((section) => {
            const Icon = section.icon;
            const isOpen = openSections[section.label] ?? false;
            const hasActiveItem = section.items.some((item) => isActive(item.url));

            return (
              <div key={section.label} className="group-data-[collapsible=icon]:mb-1">
                {/* Section header */}
                <button
                  onClick={() => toggleSection(section.label)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start transition-all duration-200 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:rounded-xl group-data-[collapsible=icon]:p-2.5 ${
                    hasActiveItem
                      ? "bg-primary/[0.06] text-foreground"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  }`}
                >
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                    hasActiveItem
                      ? "bg-primary/10"
                      : "bg-muted/60 group-hover:bg-muted"
                  }`}>
                    <Icon className={`h-[18px] w-[18px] ${hasActiveItem ? section.color : "text-muted-foreground"}`} />
                  </div>
                  <span className={`flex-1 text-[13px] font-semibold group-data-[collapsible=icon]:hidden ${
                    hasActiveItem ? "text-foreground" : ""
                  }`}>
                    {t(section.labelKey)}
                  </span>
                  {section.items.length > 1 && (
                    <ChevronDown
                      className={`h-3.5 w-3.5 shrink-0 text-muted-foreground/40 transition-transform duration-200 group-data-[collapsible=icon]:hidden ${
                        isOpen ? "rotate-0" : "-rotate-90"
                      }`}
                    />
                  )}
                </button>

                {/* Sub items with smooth expand */}
                <div
                  className={`group-data-[collapsible=icon]:hidden overflow-hidden transition-all duration-250 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                    isOpen ? "max-h-[600px] opacity-100 mt-0.5" : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="ms-[22px] border-s-[1.5px] border-border/40 ps-3 space-y-[2px] pb-1">
                    {section.items.map((item) => {
                      const ItemIcon = item.icon;
                      const active = isActive(item.url);
                      return (
                        <Link
                          key={item.url}
                          to={item.url}
                          className={`relative flex items-center gap-2.5 rounded-lg px-3 py-[8px] transition-all duration-150 ${
                            active
                              ? "bg-primary/[0.08] text-primary font-semibold"
                              : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                          }`}
                        >
                          {/* Active indicator dot */}
                          <div className={`absolute -left-[15.5px] top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full transition-all ${
                            active ? "bg-primary scale-100" : "bg-border/60 scale-75"
                          }`} />
                          <ItemIcon className={`h-4 w-4 shrink-0 ${active ? "text-primary" : ""}`} />
                          <span className={`text-[13px] truncate ${active ? "" : "font-medium"}`}>{t(item.titleKey)}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </nav>
      </SidebarContent>

      {/* ── Footer ── */}
      <SidebarFooter className="px-3 pb-4 pt-2 group-data-[collapsible=icon]:px-2">
        <div className="rounded-2xl bg-gradient-to-r from-muted/60 to-muted/30 p-3 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:rounded-xl">
          <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
            <div className="relative">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white text-[11px] font-bold shadow-md">
                {initials}
              </div>
              <div className="absolute -bottom-0.5 -end-0.5 h-3 w-3 rounded-full border-2 border-card bg-emerald-500" />
            </div>
            <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
              <p className="text-[13px] font-semibold text-foreground truncate leading-tight">
                {user ? `${user.firstName} ${user.lastName}` : ""}
              </p>
              <p className="text-[11px] text-muted-foreground truncate leading-tight mt-0.5">
                {user?.role?.replace(/_/g, " ")}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-all group-data-[collapsible=icon]:hidden"
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
