import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  DollarSign,
  Calendar,
  MessageSquare,
  Settings,
  FileText,
  BarChart,
  Clock,
  Search,
} from "lucide-react";
import type { ElementType } from "react";

/* ── Page navigation items ───────────────────────────────── */

interface NavItem {
  label: string;
  href: string;
  icon: ElementType;
  keywords?: string[];
}

const NAV_ITEMS: NavItem[] = [
  { label: "Tableau de bord", href: "/dashboard", icon: LayoutDashboard, keywords: ["accueil", "home"] },
  { label: "Eleves", href: "/eleves", icon: Users, keywords: ["etudiants", "students"] },
  { label: "Enseignants", href: "/enseignants", icon: GraduationCap, keywords: ["professeurs", "teachers"] },
  { label: "Notes & Examens", href: "/carnet", icon: BookOpen, keywords: ["notes", "bulletins", "examens"] },
  { label: "Finance", href: "/finance", icon: DollarSign, keywords: ["paiements", "depenses", "caisse"] },
  { label: "Emploi du temps", href: "/emploi", icon: Calendar, keywords: ["horaires", "planning"] },
  { label: "Absences", href: "/absences", icon: Clock, keywords: ["retards", "presences"] },
  { label: "Messages", href: "/messages", icon: MessageSquare, keywords: ["communication", "sms"] },
  { label: "Rapports", href: "/reporting", icon: BarChart, keywords: ["statistiques", "analytics"] },
  { label: "Documents", href: "/documents", icon: FileText, keywords: ["certificats", "attestations"] },
  { label: "Parametres", href: "/settings", icon: Settings, keywords: ["configuration", "reglages"] },
];

/* ── Recent searches (in-memory) ────────────────────────── */

const MAX_RECENT = 5;

/**
 * Global command palette, opened with Ctrl+K (or Cmd+K on macOS).
 * Provides quick navigation to pages and recent search history.
 */
export function SearchCommand() {
  const [open, setOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const navigate = useNavigate();

  // Register global keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSelect = useCallback(
    (href: string, label: string) => {
      setRecentSearches((prev) => {
        const filtered = prev.filter((s) => s !== label);
        return [label, ...filtered].slice(0, MAX_RECENT);
      });
      setOpen(false);
      navigate(href);
    },
    [navigate],
  );

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Rechercher une page, un module..." />
      <CommandList>
        <CommandEmpty>Aucun resultat trouve.</CommandEmpty>

        {/* Recent searches */}
        {recentSearches.length > 0 && (
          <>
            <CommandGroup heading="Recherches recentes">
              {recentSearches.map((label) => {
                const item = NAV_ITEMS.find((n) => n.label === label);
                return (
                  <CommandItem
                    key={label}
                    onSelect={() => {
                      if (item) handleSelect(item.href, item.label);
                    }}
                  >
                    <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>{label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {/* Navigation */}
        <CommandGroup heading="Pages">
          {NAV_ITEMS.map((item) => (
            <CommandItem
              key={item.href}
              onSelect={() => handleSelect(item.href, item.label)}
              keywords={item.keywords}
            >
              <item.icon className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>{item.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        {/* Quick actions */}
        <CommandSeparator />
        <CommandGroup heading="Actions rapides">
          <CommandItem onSelect={() => handleSelect("/eleves/ajouter", "Ajouter un eleve")}>
            <Search className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Ajouter un eleve</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect("/enseignants/ajouter", "Ajouter un enseignant")}>
            <Search className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Ajouter un enseignant</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect("/finance?tab=paiements", "Nouveau paiement")}>
            <Search className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Nouveau paiement</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
