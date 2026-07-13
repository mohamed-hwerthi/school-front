import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Eye,
  Search,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  X,
  Calendar,
  Clock,
  User,
  Monitor,
  Plus,
  Edit,
  Trash2,
  LogIn,
  FileDown,
  FileUp,
  DollarSign,
  MessageSquare,
  Shield,
  Activity,
} from "lucide-react";
import { notify } from "@/lib/toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useAuditLogs } from "@/hooks/useAuditLogs";
import { DashboardSkeleton } from "@/components/skeletons/DashboardSkeleton";
import type { ActionLog } from "@/types/tracabilite";
import { TYPES_ACTION, MODULES_ACTION } from "@/types/tracabilite";
import { useLanguage } from "@/hooks/useLanguage";

const ITEMS_PER_PAGE = 10;

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.35 },
  }),
};

const typeIcons: Record<string, React.ElementType> = {
  "Création": Plus,
  "Modification": Edit,
  "Suppression": Trash2,
  "Connexion": LogIn,
  "Export": FileDown,
  "Import": FileUp,
  "Paiement": DollarSign,
  "Communication": MessageSquare,
};

const typeColors: Record<string, { bg: string; text: string }> = {
  "Création": { bg: "bg-emerald-100", text: "text-emerald-700" },
  "Modification": { bg: "bg-blue-100", text: "text-blue-700" },
  "Suppression": { bg: "bg-red-100", text: "text-red-700" },
  "Connexion": { bg: "bg-purple-100", text: "text-purple-700" },
  "Export": { bg: "bg-cyan-100", text: "text-cyan-700" },
  "Import": { bg: "bg-teal-100", text: "text-teal-700" },
  "Paiement": { bg: "bg-amber-100", text: "text-amber-700" },
  "Communication": { bg: "bg-pink-100", text: "text-pink-700" },
};

const moduleColors: Record<string, string> = {
  "Élèves": "bg-blue-50 text-blue-700",
  "Enseignants": "bg-orange-50 text-orange-700",
  "Finance": "bg-emerald-50 text-emerald-700",
  "Salles": "bg-purple-50 text-purple-700",
  "Configuration": "bg-amber-50 text-amber-700",
  "Évaluations": "bg-rose-50 text-rose-700",
  "Circulaires": "bg-lime-50 text-lime-700",
  "Rapports": "bg-indigo-50 text-indigo-700",
  "Système": "bg-gray-100 text-gray-700",
};

export default function Tracabilite() {
  const { t } = useLanguage();
  const { data, isLoading: loading } = useAuditLogs();
  const actions = data?.content ?? [];
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterModule, setFilterModule] = useState("all");
  const [filterDate, setFilterDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewAction, setViewAction] = useState<ActionLog | null>(null);

  // Stats
  const stats = useMemo(() => {
    const today = "2026-02-23";
    const todayActions = actions.filter((a) => a.date === today).length;
    const connexions = actions.filter((a) => a.type === "Connexion").length;
    const modifications = actions.filter((a) => a.type === "Modification" || a.type === "Création" || a.type === "Suppression").length;
    const uniqueUsers = new Set(actions.map((a) => a.utilisateur)).size;
    return [
      { label: t("traceability.actionsToday"), value: todayActions, icon: Activity, bgLight: "bg-violet-50", textColor: "text-violet-700" },
      { label: t("traceability.logins"), value: connexions, icon: LogIn, bgLight: "bg-purple-50", textColor: "text-purple-700" },
      { label: t("traceability.modifications"), value: modifications, icon: Edit, bgLight: "bg-blue-50", textColor: "text-blue-700" },
      { label: t("traceability.activeUsers"), value: uniqueUsers, icon: User, bgLight: "bg-emerald-50", textColor: "text-emerald-700" },
    ];
  }, [actions]);

  const filtered = useMemo(() => {
    return actions.filter((a) => {
      const matchSearch = search === "" || a.description.toLowerCase().includes(search.toLowerCase()) || a.utilisateur.toLowerCase().includes(search.toLowerCase()) || a.details.toLowerCase().includes(search.toLowerCase());
      const matchType = filterType === "all" || a.type === filterType;
      const matchModule = filterModule === "all" || a.module === filterModule;
      const matchDate = filterDate === "" || a.date === filterDate;
      return matchSearch && matchType && matchModule && matchDate;
    });
  }, [actions, search, filterType, filterModule, filterDate]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const hasFilters = search || filterType !== "all" || filterModule !== "all" || filterDate !== "";

  const resetFilters = () => {
    setSearch("");
    setFilterType("all");
    setFilterModule("all");
    setFilterDate("");
    setCurrentPage(1);
  };

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="font-heading text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
            <Shield className="h-6 w-6 text-violet-600" />
            {t("traceability.title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t("traceability.subtitle")}</p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5 w-fit" onClick={() => notify.success("Export du journal (simulation)")}>
          <Download className="h-4 w-4" />
          {t("traceability.exportLog")}
        </Button>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((stat, i) => (
          <motion.div key={stat.label} custom={i} variants={fadeUp} initial="hidden" animate="visible" className="rounded-xl border border-border/50 bg-card p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${stat.bgLight}`}>
              <stat.icon className={`h-4.5 w-4.5 ${stat.textColor}`} />
            </div>
            <p className="mt-2.5 font-heading text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible" className="rounded-xl border border-border/50 bg-card p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} placeholder="Rechercher par description, utilisateur..." className="ps-9" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={filterType} onValueChange={(v) => { setFilterType(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-[150px]"><Filter className="h-3.5 w-3.5 me-1.5 text-muted-foreground" /><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                {TYPES_ACTION.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterModule} onValueChange={(v) => { setFilterModule(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Matière" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                {MODULES_ACTION.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input type="date" value={filterDate} onChange={(e) => { setFilterDate(e.target.value); setCurrentPage(1); }} className="w-[160px]" />
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={resetFilters} className="gap-1 text-muted-foreground"><X className="h-3.5 w-3.5" />{t("common.reset")}</Button>
            )}
          </div>
        </div>
        <div className="mt-2 text-xs text-muted-foreground">{filtered.length} action{filtered.length !== 1 ? "s" : ""}</div>
      </motion.div>

      {/* Timeline / Table */}
      <motion.div custom={5} variants={fadeUp} initial="hidden" animate="visible" className="space-y-2">
        {paginated.length === 0 ? (
          <div className="rounded-xl border border-border/50 bg-card p-12 text-center text-muted-foreground">
            <Eye className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Aucune action trouvée</p>
          </div>
        ) : paginated.map((action) => {
          const TypeIcon = typeIcons[action.type] || Activity;
          const colors = typeColors[action.type] || { bg: "bg-gray-100", text: "text-gray-700" };
          return (
            <div
              key={action.id}
              className="rounded-xl border border-border/50 bg-card p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setViewAction(action)}
            >
              <div className="flex items-start gap-4">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${colors.bg}`}>
                  <TypeIcon className={`h-5 w-5 ${colors.text}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <div>
                      <p className="font-medium text-sm text-foreground">{action.description}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{action.details}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="secondary" className={`text-xs ${moduleColors[action.module] || ""}`}>{action.module}</Badge>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colors.bg} ${colors.text}`}>{action.type}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><User className="h-3 w-3" />{action.utilisateur}</span>
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{action.date}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{action.heure}</span>
                    <span className="flex items-center gap-1"><Monitor className="h-3 w-3" />{action.ipAddress}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </motion.div>

      {/* Pagination */}
      {filtered.length > ITEMS_PER_PAGE && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Page {currentPage} sur {totalPages}</p>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const page = totalPages <= 5 ? i + 1 : currentPage <= 3 ? i + 1 : currentPage >= totalPages - 2 ? totalPages - 4 + i : currentPage - 2 + i;
              return <Button key={page} variant={page === currentPage ? "default" : "outline"} size="icon" className="h-8 w-8 text-xs" onClick={() => setCurrentPage(page)}>{page}</Button>;
            })}
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      )}

      {/* View Dialog */}
      <Dialog open={!!viewAction} onOpenChange={(open) => !open && setViewAction(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("traceability.actionDetails")}</DialogTitle>
            <DialogDescription>Informations de traçabilité</DialogDescription>
          </DialogHeader>
          {viewAction && (() => {
            const TypeIcon = typeIcons[viewAction.type] || Activity;
            const colors = typeColors[viewAction.type] || { bg: "bg-gray-100", text: "text-gray-700" };
            return (
              <div className="space-y-4 mt-2">
                <div className="flex items-center gap-4">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-xl ${colors.bg}`}>
                    <TypeIcon className={`h-6 w-6 ${colors.text}`} />
                  </div>
                  <div>
                    <p className="font-heading text-lg font-bold">{viewAction.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colors.bg} ${colors.text}`}>{viewAction.type}</span>
                      <Badge variant="secondary" className={`text-xs ${moduleColors[viewAction.module]}`}>{viewAction.module}</Badge>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-xs text-muted-foreground">Utilisateur</p><p className="font-medium">{viewAction.utilisateur}</p></div>
                  <div><p className="text-xs text-muted-foreground">Date</p><p className="font-medium">{viewAction.date}</p></div>
                  <div><p className="text-xs text-muted-foreground">Heure</p><p className="font-medium">{viewAction.heure}</p></div>
                  <div><p className="text-xs text-muted-foreground">Adresse IP</p><p className="font-medium font-mono text-xs">{viewAction.ipAddress}</p></div>
                  <div className="col-span-2"><p className="text-xs text-muted-foreground">Détails</p><p className="font-medium">{viewAction.details}</p></div>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
