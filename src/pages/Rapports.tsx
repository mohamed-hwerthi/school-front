import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Search,
  Filter,
  Plus,
  Download,
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  Calendar,
  FileDown,
  Send,
  CheckCircle2,
  Clock,
  File,
  Printer,
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
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { useRapports, useDeleteRapport } from "@/hooks/useRapports";
import { DashboardSkeleton } from "@/components/skeletons/DashboardSkeleton";
import type { Rapport } from "@/types/rapport";
import { TYPES_RAPPORT, STATUTS_RAPPORT } from "@/types/rapport";
import { useLanguage } from "@/hooks/useLanguage";

const ITEMS_PER_PAGE = 8;

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.35 },
  }),
};

const statutConfig: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
  "Brouillon": { bg: "bg-gray-100", text: "text-gray-600", icon: File },
  "Généré": { bg: "bg-blue-100", text: "text-blue-700", icon: FileDown },
  "Validé": { bg: "bg-emerald-100", text: "text-emerald-700", icon: CheckCircle2 },
  "Envoyé": { bg: "bg-purple-100", text: "text-purple-700", icon: Send },
};

const typeColors: Record<string, string> = {
  "Bulletin trimestriel": "bg-violet-50 text-violet-700",
  "Rapport annuel": "bg-blue-50 text-blue-700",
  "Rapport de discipline": "bg-red-50 text-red-700",
  "Rapport d'absence": "bg-amber-50 text-amber-700",
  "Rapport financier": "bg-emerald-50 text-emerald-700",
  "PV de conseil": "bg-indigo-50 text-indigo-700",
};

export default function Rapports() {
  const { t } = useLanguage();
  const { data: rapports = [], isLoading: loading } = useRapports();
  const deleteRapport = useDeleteRapport();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatut, setFilterStatut] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewRapport, setViewRapport] = useState<Rapport | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Rapport | null>(null);

  // Stats
  const stats = [
    { label: t("reports.totalReports"), value: rapports.length, icon: FileText, bgLight: "bg-indigo-50", textColor: "text-indigo-700" },
    { label: "Brouillons", value: rapports.filter((r) => r.statut === "Brouillon").length, icon: File, bgLight: "bg-gray-50", textColor: "text-gray-700" },
    { label: "Validés", value: rapports.filter((r) => r.statut === "Validé").length, icon: CheckCircle2, bgLight: "bg-emerald-50", textColor: "text-emerald-700" },
    { label: "Envoyés", value: rapports.filter((r) => r.statut === "Envoyé").length, icon: Send, bgLight: "bg-purple-50", textColor: "text-purple-700" },
  ];

  // Filtered list
  const filtered = useMemo(() => {
    return rapports.filter((r) => {
      const matchSearch =
        search === "" ||
        r.titre.toLowerCase().includes(search.toLowerCase()) ||
        r.auteur.toLowerCase().includes(search.toLowerCase()) ||
        r.description.toLowerCase().includes(search.toLowerCase());
      const matchType = filterType === "all" || r.type === filterType;
      const matchStatut = filterStatut === "all" || r.statut === filterStatut;
      return matchSearch && matchType && matchStatut;
    });
  }, [rapports, search, filterType, filterStatut]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const hasFilters = search || filterType !== "all" || filterStatut !== "all";

  const resetFilters = () => {
    setSearch("");
    setFilterType("all");
    setFilterStatut("all");
    setCurrentPage(1);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteRapport.mutate(deleteTarget.id);
    setDeleteTarget(null);
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
          <h1 className="font-heading text-xl md:text-2xl font-bold text-foreground">{t("reports.title")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Bulletins, rapports et procès-verbaux</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5">
            <Download className="h-4 w-4" />
            Exporter tout
          </Button>
          <Button size="sm" className="gap-1.5 bg-gradient-primary shadow-btn" onClick={() => notify.info("Génération de rapport à venir")}>
            <Plus className="h-4 w-4" />
            Nouveau rapport
          </Button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            custom={i}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="rounded-xl border border-border/50 bg-card p-4 shadow-sm hover:shadow-md transition-shadow"
          >
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
            <Input value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} placeholder="Rechercher par titre, auteur..." className="ps-9" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={filterType} onValueChange={(v) => { setFilterType(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-[180px]"><Filter className="h-3.5 w-3.5 me-1.5 text-muted-foreground" /><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                {TYPES_RAPPORT.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterStatut} onValueChange={(v) => { setFilterStatut(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Statut" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                {STATUTS_RAPPORT.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={resetFilters} className="gap-1 text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />Réinitialiser
              </Button>
            )}
          </div>
        </div>
        <div className="mt-2 text-xs text-muted-foreground">{filtered.length} rapport{filtered.length !== 1 ? "s" : ""}</div>
      </motion.div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginated.length === 0 ? (
          <motion.div custom={5} variants={fadeUp} initial="hidden" animate="visible" className="col-span-full rounded-xl border border-border/50 bg-card p-12 text-center text-muted-foreground">
            <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Aucun rapport trouvé</p>
          </motion.div>
        ) : paginated.map((r, i) => {
          const StatutIcon = statutConfig[r.statut]?.icon || File;
          return (
            <motion.div
              key={r.id}
              custom={i + 5}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="rounded-xl border border-border/50 bg-card p-5 shadow-sm hover:shadow-md transition-shadow group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50">
                    <FileText className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm text-foreground truncate">{r.titre}</h3>
                    <p className="text-xs text-muted-foreground">{r.auteur}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${statutConfig[r.statut]?.bg} ${statutConfig[r.statut]?.text}`}>
                  <StatutIcon className="h-3 w-3" />{r.statut}
                </span>
              </div>

              <p className="mt-3 text-xs text-muted-foreground line-clamp-2">{r.description}</p>

              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant="secondary" className={`text-xs ${typeColors[r.type] || ""}`}>{r.type}</Badge>
              </div>

              <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{r.dateGeneration}</span>
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{r.periode}</span>
              </div>

              <div className="mt-4 pt-3 border-t border-border/40 flex items-center gap-2">
                <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => setViewRapport(r)}>
                  <Eye className="h-3.5 w-3.5" />Voir
                </Button>
                {r.fichier && (
                  <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => notify.success("Téléchargement simulé")}>
                    <FileDown className="h-3.5 w-3.5" />Télécharger
                  </Button>
                )}
                <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => notify.success("Impression simulée")}>
                  <Printer className="h-3.5 w-3.5" />Imprimer
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 ms-auto text-muted-foreground hover:text-red-600" onClick={() => setDeleteTarget(r)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </motion.div>
          );
        })}
      </div>

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
      <Dialog open={!!viewRapport} onOpenChange={(open) => !open && setViewRapport(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Détails du rapport</DialogTitle>
            <DialogDescription>Informations complètes</DialogDescription>
          </DialogHeader>
          {viewRapport && (
            <div className="space-y-4 mt-2">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-50">
                  <FileText className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <p className="font-heading text-lg font-bold">{viewRapport.titre}</p>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statutConfig[viewRapport.statut]?.bg} ${statutConfig[viewRapport.statut]?.text}`}>
                    {viewRapport.statut}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-xs text-muted-foreground">Type</p><p className="font-medium">{viewRapport.type}</p></div>
                <div><p className="text-xs text-muted-foreground">Période</p><p className="font-medium">{viewRapport.periode}</p></div>
                <div><p className="text-xs text-muted-foreground">Date</p><p className="font-medium">{viewRapport.dateGeneration}</p></div>
                <div><p className="text-xs text-muted-foreground">Auteur</p><p className="font-medium">{viewRapport.auteur}</p></div>
                <div><p className="text-xs text-muted-foreground">Destinataire</p><p className="font-medium">{viewRapport.destinataire}</p></div>
                <div><p className="text-xs text-muted-foreground">Fichier</p><p className="font-medium">{viewRapport.fichier || "Non généré"}</p></div>
                <div className="col-span-2"><p className="text-xs text-muted-foreground">Description</p><p className="font-medium">{viewRapport.description}</p></div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Supprimer <span className="font-semibold text-foreground">{deleteTarget?.titre}</span> ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2">
            <DialogClose asChild><Button variant="outline">Annuler</Button></DialogClose>
            <Button variant="destructive" onClick={handleDelete}>Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
