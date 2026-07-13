import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LogOut,
  User,
  MessageSquare,
  Search,
  Bell,
  Maximize,
  Minimize,
  Settings,
  ChevronRight,
  Globe,
  School,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSchool } from "@/hooks/useSchool";
import { useLanguage } from "@/hooks/useLanguage";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { buildVitrineUrl } from "@/lib/vitrine-routing";
import { YearSelector } from "./YearSelector";

const ROUTE_I18N_KEYS: Record<string, string> = {
  dashboard: "nav.dashboard",
  eleves: "nav.students",
  ajouter: "common.add",
  modifier: "common.edit",
  config: "nav.configuration",
  niveaux: "nav.levels",
  messages: "nav.messages",
  enseignants: "nav.teachers",
  personnel: "nav.personnel",
  absences: "nav.absences",
  discipline: "nav.discipline",
  calendrier: "nav.calendar",
  inscriptions: "nav.inscriptions",
  finance: "nav.finance",
  depenses: "nav.expenses",
  tresorerie: "nav.treasury",
  caisse: "nav.cashRegister",
  factures: "nav.invoices",
  relances: "nav.reminders",
  rapports: "nav.reports",
  annonces: "nav.announcements",
  notifications: "nav.notifications",
  reunions: "nav.meetings",
  circulaires: "nav.circulars",
  contrats: "nav.contractsLeaves",
  evaluations: "nav.evaluations",
  devoirs: "nav.homework",
  quiz: "nav.quiz",
  carnets: "nav.gradeBooks",
  bulletins: "nav.bulletins",
  utilisateurs: "nav.users",
  configuration: "nav.configuration",
  statistique: "nav.statistics",
  analytics: "nav.analytics",
  transport: "nav.transport",
  bibliotheque: "nav.library",
  cantine: "nav.canteen",
};

function Breadcrumb() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const allSegments = location.pathname.split("/").filter(Boolean);
  // Hide id segments (numeric or UUID) from the breadcrumb — keep cumulative paths intact.
  const isIdSegment = (seg: string) =>
    /^\d+$/.test(seg) ||
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(seg);
  const segments = allSegments.filter((seg) => !isIdSegment(seg));

  if (segments.length <= 1) return null;

  const crumbs = segments.map((seg, i) => {
    const i18nKey = ROUTE_I18N_KEYS[seg];
    const label = i18nKey ? t(i18nKey) : seg;
    // Build the path from the original (unfiltered) segments up to this crumb.
    const origIndex = allSegments.indexOf(seg);
    const path = "/" + allSegments.slice(0, origIndex + 1).join("/");
    const isLast = i === segments.length - 1;

    return { label, path, isLast };
  });

  return (
    <nav className="hidden md:flex items-center gap-1 text-xs text-muted-foreground">
      {crumbs.map((crumb, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="h-3 w-3" />}
          {crumb.isLast ? (
            <span className="text-foreground font-medium">{crumb.label}</span>
          ) : (
            <button
              onClick={() => navigate(crumb.path)}
              className="hover:text-foreground transition-colors"
            >
              {crumb.label}
            </button>
          )}
        </span>
      ))}
    </nav>
  );
}

export function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { school } = useSchool();
  const { t } = useLanguage();
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleLogout = useCallback(async () => {
    await logout();
    navigate("/", { replace: true });
  }, [logout, navigate]);

  const initials = user
    ? (`${(user.firstName ?? "").charAt(0)}${(user.lastName ?? "").charAt(0)}`.toUpperCase() || "??")
    : "??";
  const displayName = user
    ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email || "Utilisateur"
    : "Utilisateur";
  const displayRole = user?.role?.replace("_", " ") ?? "";

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border/40 backdrop-blur-xl bg-background/60 px-4">
      <SidebarTrigger className="-ms-1" />
      <Separator orientation="vertical" className="h-5" />

      <Breadcrumb />

      {/* Nom de l'école */}
      {school.nom && (
        <>
          <Separator orientation="vertical" className="hidden h-5 md:block" />
          <div className="hidden items-center gap-1.5 md:flex">
            <School className="h-4 w-4 text-primary" />
            <span className="max-w-[220px] truncate text-sm font-semibold text-foreground">
              {school.nom}
            </span>
          </div>
        </>
      )}

      {/* Search Bar - Center */}
      <div className="hidden lg:flex items-center mx-auto">
        <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/40 px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted/60 transition-colors cursor-pointer w-64">
          <Search className="h-3.5 w-3.5" />
          <span className="flex-1">{t("common.searchPlaceholder")}</span>
          <kbd className="hidden xl:inline-flex items-center gap-0.5 rounded border border-border/60 bg-background/80 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
            Ctrl+K
          </kbd>
        </div>
      </div>

      {/* School Year Selector */}
      <div className="ms-auto flex items-center">
        <YearSelector />
      </div>

      <div className="flex items-center gap-1.5">
        {/* Language Toggle */}
        <LanguageSwitcher />

        {/* SMS Badge */}
        <Badge
          variant="secondary"
          className="hidden md:flex gap-1.5 text-xs font-normal rounded-full px-3 py-1 bg-muted/50 hover:bg-muted/70 transition-colors"
        >
          <MessageSquare className="h-3 w-3" />
          4035 SMS
        </Badge>

        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="relative h-8 w-8 rounded-full hover:bg-muted/60 transition-all"
        >
          <Bell className="h-4 w-4 text-muted-foreground" />
          <span className="absolute -top-0.5 -end-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-background">
            3
          </span>
        </Button>

        {/* Public school website */}
        {(user?.tenantSlug || user?.tenantId) && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full hover:bg-muted/60 transition-all"
            title={t("nav.publicSite") || "Voir le site public"}
            onClick={() => {
              const slug = user.tenantSlug || user.tenantId.replaceAll("_", "-");
              window.open(buildVitrineUrl(slug, { preview: true }), "_blank", "noopener,noreferrer");
            }}
          >
            <Globe className="h-4 w-4 text-muted-foreground" />
          </Button>
        )}

        {/* Fullscreen Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="hidden md:flex h-8 w-8 rounded-full hover:bg-muted/60 transition-all"
          onClick={toggleFullscreen}
        >
          {isFullscreen ? (
            <Minimize className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Maximize className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>

        {/* Separator */}
        <Separator orientation="vertical" className="h-6 mx-1 hidden sm:block" />

        {/* User Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2.5 ps-1.5 pe-3 rounded-full hover:bg-muted/60 transition-all"
            >
              <div className="relative">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white text-xs font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute -bottom-0.5 -end-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-background" />
              </div>
              <div className="hidden sm:flex flex-col items-start">
                <span className="text-xs font-medium leading-none">{displayName}</span>
                <span className="text-[10px] text-muted-foreground leading-none mt-0.5">
                  {displayRole}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{displayName}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="me-2 h-4 w-4" />
              {t("common.profile")}
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="me-2 h-4 w-4" />
              {t("common.settings")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="me-2 h-4 w-4" />
              {t("common.logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
