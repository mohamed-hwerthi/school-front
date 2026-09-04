import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  CalendarClock,
  CalendarDays,
  Clock,
  FileQuestion,
  Home,
  LayoutGrid,
  Library,
  Megaphone,
  MoreHorizontal,
  PenLine,
  PenTool,
  UserCheck,
  Users,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useLanguage } from "@/hooks/useLanguage";

interface NavEntry {
  url: string;
  labelKey: string;
  icon: React.ElementType;
}

/** Les quatre gestes quotidiens de l'enseignant : le reste passe par « Plus ». */
const MAIN_ENTRIES: NavEntry[] = [
  { url: "/dashboard", labelKey: "nav.dashboard", icon: Home },
  { url: "/dashboard/absences/feuilles", labelKey: "nav.absences", icon: UserCheck },
  { url: "/dashboard/saisie-notes", labelKey: "nav.gradeEntry", icon: PenLine },
  { url: "/dashboard/devoirs", labelKey: "nav.homework", icon: PenTool },
];

const MORE_ENTRIES: NavEntry[] = [
  { url: "/dashboard/emploi-du-temps", labelKey: "nav.schedule", icon: Clock },
  { url: "/dashboard/eleves", labelKey: "nav.students", icon: Users },
  { url: "/dashboard/examens", labelKey: "nav.exams", icon: FileQuestion },
  { url: "/dashboard/apercu-notes", labelKey: "nav.gradesOverview", icon: LayoutGrid },
  { url: "/dashboard/modules", labelKey: "nav.subjects", icon: Library },
  { url: "/dashboard/calendrier", labelKey: "nav.calendar", icon: CalendarClock },
  { url: "/dashboard/annonces", labelKey: "nav.announcements", icon: Megaphone },
  { url: "/dashboard/reunions", labelKey: "nav.meetings", icon: CalendarDays },
];

/** `/dashboard` ne doit s'allumer que sur lui-même, pas sur ses enfants. */
function isActive(pathname: string, url: string): boolean {
  return url === "/dashboard" ? pathname === url : pathname.startsWith(url);
}

/**
 * Barre d'onglets fixe en bas, sur mobile uniquement — l'équivalent enseignant
 * de celle du portail parent, pour que l'application installée se manipule au
 * pouce plutôt qu'en ouvrant le tiroir latéral à chaque fois.
 *
 * pb-[env(safe-area-inset-bottom)] évite l'indicateur d'accueil iPhone.
 */
export function TeacherBottomNav() {
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [moreOpen, setMoreOpen] = useState(false);

  const isMoreActive = MORE_ENTRIES.some((e) => isActive(location.pathname, e.url));

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background pb-[env(safe-area-inset-bottom)] md:hidden">
      <div className="grid grid-cols-5">
        {MAIN_ENTRIES.map((entry) => {
          const active = isActive(location.pathname, entry.url);
          return (
            <button
              key={entry.url}
              type="button"
              onClick={() => navigate(entry.url)}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-[56px] flex-col items-center justify-center gap-0.5 px-0 py-2 text-[10px] ${
                active ? "bg-primary/10 text-primary" : "text-muted-foreground"
              }`}
            >
              <entry.icon className="h-5 w-5" />
              <span className="leading-none">{t(entry.labelKey)}</span>
            </button>
          );
        })}

        <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              className={`flex min-h-[56px] flex-col items-center justify-center gap-0.5 text-[10px] ${
                isMoreActive ? "bg-primary/10 text-primary" : "text-muted-foreground"
              }`}
            >
              <MoreHorizontal className="h-5 w-5" />
              <span className="leading-none">{t("nav.more")}</span>
            </button>
          </SheetTrigger>
          <SheetContent
            side="bottom"
            className="max-h-[80svh] overflow-y-auto pb-[max(1rem,env(safe-area-inset-bottom))]"
          >
            <SheetHeader className="text-start">
              <SheetTitle>{t("nav.more")}</SheetTitle>
            </SheetHeader>
            <div className="mt-2 grid gap-1">
              {MORE_ENTRIES.map((entry) => (
                <button
                  key={entry.url}
                  type="button"
                  onClick={() => {
                    navigate(entry.url);
                    setMoreOpen(false);
                  }}
                  className={`flex min-h-[52px] items-center gap-3 rounded-lg px-3 text-start text-sm ${
                    isActive(location.pathname, entry.url)
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted"
                  }`}
                >
                  <entry.icon className="h-5 w-5" />
                  {t(entry.labelKey)}
                </button>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
