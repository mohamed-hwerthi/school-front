import { useState, useMemo } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { useCirculaires, useDeleteCirculaire, usePublishCirculaire, useArchiveCirculaire } from "@/hooks/useCirculaires";
import { motion } from "framer-motion";
import {
  Newspaper,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  Calendar,
  Send,
  AlertTriangle,
  Users,
  FileText,
  Paperclip,
  Star,
  Archive,
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
import { DashboardSkeleton } from "@/components/skeletons/DashboardSkeleton";
import type { Circulaire } from "@/types/circulaire";
import { TYPES_CIRCULAIRE, STATUTS_CIRCULAIRE, CIBLES_CIRCULAIRE } from "@/types/circulaire";

const ITEMS_PER_PAGE = 6;

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.35 },
  }),
};

const statutConfig: Record<string, { bg: string; text: string }> = {
  "Brouillon": { bg: "bg-gray-100", text: "text-gray-600" },
  "Publiée": { bg: "bg-emerald-100", text: "text-emerald-700" },
  "Archivée": { bg: "bg-amber-100", text: "text-amber-700" },
};

const typeConfig: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
  "Information": { bg: "bg-blue-50", text: "text-blue-700", icon: FileText },
  "Règlement": { bg: "bg-violet-50", text: "text-violet-700", icon: FileText },
  "Événement": { bg: "bg-emerald-50", text: "text-emerald-700", icon: Calendar },
  "Urgent": { bg: "bg-red-50", text: "text-red-700", icon: AlertTriangle },
  "Pédagogique": { bg: "bg-purple-50", text: "text-purple-700", icon: FileText },
};

export default function Circulaires() {
  const { t } = useLanguage();
  const { data: circulaires = [], isLoading: loading } = useCirculaires();
  const deleteMutation = useDeleteCirculaire();
  const publishMutation = usePublishCirculaire();
  const archiveMutation = useArchiveCirculaire();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatut, setFilterStatut] = useState("all");
  const [filterCible, setFilterCible] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewCirculaire, setViewCirculaire] = useState<Circulaire | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Circulaire | null>(null);

  const stats = [
    { label: t("circulars.totalCirculars"), value: circulaires.length, icon: Newspaper, bgLight: "bg-lime-50", textColor: "text-lime-700" },
    { label: t("circulars.publishedCirculars"), value: circulaires.filter((c) => c.statut === "Publiée").length, icon: Send, bgLight: "bg-emerald-50", textColor: "text-emerald-700" },
    { label: t("circulars.draftCirculars"), value: circulaires.filter((c) => c.statut === "Brouillon").length, icon: Edit, bgLight: "bg-gray-50", textColor: "text-gray-700" },
    { label: t("circulars.urgentCirculars"), value: circulaires.filter((c) => c.type === "Urgent").length, icon: AlertTriangle, bgLight: "bg-red-50", textColor: "text-red-700" },
  ];

  const filtered = useMemo(() => {
    return circulaires.filter((c) => {
      const matchSearch = search === "" || c.titre.toLowerCase().includes(search.toLowerCase()) || c.contenu.toLowerCase().includes(search.toLowerCase());
      const matchType = filterType === "all" || c.type === filterType;
      const matchStatut = filterStatut === "all" || c.statut === filterStatut;
      const matchCible = filterCible === "all" || c.cible === filterCible;
      return matchSearch && matchType && matchStatut && matchCible;
    });
  }, [circulaires, search, filterType, filterStatut, filterCible]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const hasFilters = search || filterType !== "all" || filterStatut !== "all" || filterCible !== "all";

  const resetFilters = () => {
    setSearch("");
    setFilterType("all");
    setFilterStatut("all");
    setFilterCible("all");
    setCurrentPage(1);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id);
    setDeleteTarget(null);
  };

  const handlePublish = (id: string) => {
    publishMutation.mutate(id);
  };

  const handleArchive = (id: string) => {
    archiveMutation.mutate(id);
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
          <h1 className="font-heading text-xl md:text-2xl font-bold text-foreground">{t("circulars.title")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t("circulars.subtitle")}</p>
        </div>
        <Button size="sm" className="gap-1.5 bg-gradient-primary shadow-btn w-fit" onClick={() => notify.info("Création de circulaire à venir")}>
          <Plus className="h-4 w-4" />
          {t("circulars.newCircular")}
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
            <Input value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} placeholder={t("circulars.searchPlaceholder")} className="ps-9" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={filterType} onValueChange={(v) => { setFilterType(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-[150px]"><Filter className="h-3.5 w-3.5 me-1.5 text-muted-foreground" /><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                {TYPES_CIRCULAIRE.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterStatut} onValueChange={(v) => { setFilterStatut(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-[130px]"><SelectValue placeholder="Statut" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                {STATUTS_CIRCULAIRE.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterCible} onValueChange={(v) => { setFilterCible(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-[140px]"><Users className="h-3.5 w-3.5 me-1.5 text-muted-foreground" /><SelectValue placeholder="Cible" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                {CIBLES_CIRCULAIRE.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={resetFilters} className="gap-1 text-muted-foreground"><X className="h-3.5 w-3.5" />{t("common.reset")}</Button>
            )}
          </div>
        </div>
        <div className="mt-2 text-xs text-muted-foreground">{filtered.length} circulaire{filtered.length !== 1 ? "s" : ""}</div>
      </motion.div>

      {/* Cards */}
      <div className="space-y-4">
        {paginated.length === 0 ? (
          <motion.div custom={5} variants={fadeUp} initial="hidden" animate="visible" className="rounded-xl border border-border/50 bg-card p-12 text-center text-muted-foreground">
            <Newspaper className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">{t("common.noResults")}</p>
          </motion.div>
        ) : paginated.map((c, i) => {
          const TypeIcon = typeConfig[c.type]?.icon || FileText;
          return (
            <motion.div
              key={c.id}
              custom={i + 5}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className={`rounded-xl border bg-card p-5 shadow-sm hover:shadow-md transition-shadow ${c.important ? "border-red-200 bg-red-50/30" : "border-border/50"}`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${typeConfig[c.type]?.bg || "bg-gray-50"}`}>
                  <TypeIcon className={`h-5 w-5 ${typeConfig[c.type]?.text || "text-gray-600"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm text-foreground">{c.titre}</h3>
                        {c.important && <Star className="h-4 w-4 text-amber-500 fill-amber-500" />}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <Badge variant="secondary" className={`text-xs ${typeConfig[c.type]?.bg} ${typeConfig[c.type]?.text}`}>{c.type}</Badge>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statutConfig[c.statut]?.bg} ${statutConfig[c.statut]?.text}`}>{c.statut}</span>
                        <Badge variant="outline" className="text-xs gap-1"><Users className="h-3 w-3" />{c.cible}</Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-blue-600" onClick={() => setViewCirculaire(c)}><Eye className="h-4 w-4" /></Button>
                      {c.statut === "Brouillon" && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-emerald-600" onClick={() => handlePublish(c.id)} title="Publier"><Send className="h-4 w-4" /></Button>
                      )}
                      {c.statut === "Publiée" && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-amber-600" onClick={() => handleArchive(c.id)} title="Archiver"><Archive className="h-4 w-4" /></Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-600" onClick={() => setDeleteTarget(c)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground line-clamp-2 whitespace-pre-line">{c.contenu}</p>
                  <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{c.datePublication || c.dateCreation}</span>
                    <span>{c.auteur}</span>
                    {c.pieceJointe && <span className="flex items-center gap-1 text-blue-600"><Paperclip className="h-3 w-3" />{c.pieceJointe}</span>}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Pagination */}
      {filtered.length > ITEMS_PER_PAGE && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{t("common.page")} {currentPage} {t("common.of")} {totalPages}</p>
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
      <Dialog open={!!viewCirculaire} onOpenChange={(open) => !open && setViewCirculaire(null)}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewCirculaire?.titre}</DialogTitle>
            <DialogDescription className="flex items-center gap-2 mt-1">
              {viewCirculaire && <>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statutConfig[viewCirculaire.statut]?.bg} ${statutConfig[viewCirculaire.statut]?.text}`}>{viewCirculaire.statut}</span>
                <Badge variant="secondary" className="text-xs">{viewCirculaire.type}</Badge>
                <Badge variant="outline" className="text-xs">{viewCirculaire.cible}</Badge>
              </>}
            </DialogDescription>
          </DialogHeader>
          {viewCirculaire && (
            <div className="space-y-4 mt-2">
              <div className="rounded-lg bg-muted/40 p-4 text-sm whitespace-pre-line">{viewCirculaire.contenu}</div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-xs text-muted-foreground">{t("reports.author")}</p><p className="font-medium">{viewCirculaire.auteur}</p></div>
                <div><p className="text-xs text-muted-foreground">{t("common.date")}</p><p className="font-medium">{viewCirculaire.dateCreation}</p></div>
                {viewCirculaire.datePublication && <div><p className="text-xs text-muted-foreground">{t("common.published")}</p><p className="font-medium">{viewCirculaire.datePublication}</p></div>}
                {viewCirculaire.pieceJointe && <div><p className="text-xs text-muted-foreground">{t("reports.file")}</p><p className="font-medium text-blue-600">{viewCirculaire.pieceJointe}</p></div>}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("common.confirmDelete")}</DialogTitle>
            <DialogDescription>{t("common.deleteConfirmMsg")} <span className="font-semibold text-foreground">{deleteTarget?.titre}</span> ?</DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2">
            <DialogClose asChild><Button variant="outline">{t("common.cancel")}</Button></DialogClose>
            <Button variant="destructive" onClick={handleDelete}>{t("common.delete")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
