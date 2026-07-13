import { useLocation, Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import {
  Breadcrumb as BreadcrumbRoot,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { cn } from "@/lib/utils";

/**
 * Maps URL path segments to human-readable French labels.
 * Add new entries as new routes are added to the application.
 */
const SEGMENT_LABELS: Record<string, string> = {
  dashboard: "Tableau de bord",
  eleves: "Eleves",
  enseignants: "Enseignants",
  niveaux: "Niveaux",
  classes: "Classes",
  modules: "Matières",
  examens: "Examens",
  notes: "Notes",
  bulletins: "Bulletins",
  absences: "Absences",
  discipline: "Discipline",
  finance: "Finance",
  paiements: "Paiements",
  depenses: "Depenses",
  tresorerie: "Tresorerie",
  caisse: "Caisse",
  factures: "Factures",
  emploi: "Emploi du temps",
  messages: "Messages",
  config: "Configuration",
  settings: "Parametres",
  ajouter: "Ajouter",
  modifier: "Modifier",
  profil: "Profil",
  utilisateurs: "Utilisateurs",
  rapports: "Rapports",
  reporting: "Reporting",
  audit: "Audit",
  vitrine: "Vitrine",
  inscriptions: "Inscriptions",
  bibliotheque: "Bibliotheque",
  transport: "Transport",
  cantine: "Cantine",
  devoirs: "Devoirs",
  quiz: "Quiz",
  rh: "Ressources Humaines",
  documents: "Documents",
  analytics: "Analytique",
  notifications: "Notifications",
  passages: "Passages",
};

interface DynamicBreadcrumbProps {
  className?: string;
}

/**
 * Dynamic breadcrumb component that builds navigation crumbs from the
 * current URL path. Each segment is mapped to a readable label via
 * {@link SEGMENT_LABELS}. Numeric segments (IDs) are displayed as #{id}.
 */
export function DynamicBreadcrumb({ className }: DynamicBreadcrumbProps) {
  const location = useLocation();
  const segments = location.pathname.split("/").filter(Boolean);

  if (segments.length <= 1) return null;

  return (
    <BreadcrumbRoot className={cn("hidden md:block", className)}>
      <BreadcrumbList>
        {/* Home link */}
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/dashboard" className="flex items-center gap-1">
              <Home className="h-3.5 w-3.5" />
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        {segments.map((segment, index) => {
          const isLast = index === segments.length - 1;
          const isNumeric = /^\d+$/.test(segment);
          const label = isNumeric
            ? `#${segment}`
            : SEGMENT_LABELS[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
          const href = "/" + segments.slice(0, index + 1).join("/");

          return (
            <span key={index} className="contents">
              <BreadcrumbSeparator>
                <ChevronRight className="h-3.5 w-3.5" />
              </BreadcrumbSeparator>

              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={href}>{label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </span>
          );
        })}
      </BreadcrumbList>
    </BreadcrumbRoot>
  );
}
