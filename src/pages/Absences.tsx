import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  ClipboardList,
  Search,
  Filter,
  X,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Clock,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Trash2,
  FileCheck,
  CalendarDays,
  UserCheck,
  UserX,
  TrendingUp,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PermissionGate } from "@/components/auth/Gates";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useAbsencesByClasseDate,
  useAbsenceStats,
  useJustifyAbsence,
  useDeleteAbsence,
} from "@/hooks/useAbsences";
import { useClasses } from "@/hooks/useClasses";
import { useAllStudents } from "@/hooks/useStudents";
import ExportButton from "@/components/ExportButton";
import type { Absence } from "@/types/absence";
import { useNavigate, useSearchParams } from "react-router-dom";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.35 },
  }),
};

export default function AbsencesPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const today = new Date().toISOString().split("T")[0];
  const initialClasseId = searchParams.get("classeId") || "";
  const initialDate = searchParams.get("date") || today;
  const [selectedClasseId, setSelectedClasseId] = useState<string>(initialClasseId);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterJustifie, setFilterJustifie] = useState("all");
  const [currentPage, setCurrentPage] = useState(0);

  const [justifyTarget, setJustifyTarget] = useState<Absence | null>(null);
  const [justifyMotif, setJustifyMotif] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Absence | null>(null);

  const { data: classes = [] } = useClasses();
  const { data: allStudents = [] } = useAllStudents();
  const absencesClasseId = selectedClasseId === "all" ? "" : selectedClasseId;
  const { data: absencesRaw = [], isLoading, isFetching } = useAbsencesByClasseDate(
    absencesClasseId,
    selectedDate
  );
  const absences = useMemo(() => {
    const byId = new Map(allStudents.map((s) => [s.id, s]));
    return absencesRaw.map((a) => {
      const s = byId.get(a.eleveId);
      return {
        ...a,
        eleveNom: a.eleveNom ?? s?.nom,
        elevePrenom: a.elevePrenom ?? s?.prenom,
      };
    });
  }, [absencesRaw, allStudents]);
  const { data: stats } = useAbsenceStats(
    absencesClasseId || undefined,
    undefined,
    undefined
  );
  const justifyMutation = useJustifyAbsence();
  const deleteMutation = useDeleteAbsence();

  const ITEMS_PER_PAGE = 20;

  const filtered = useMemo(() => {
    let list = absences;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (a) =>
          a.eleveNom?.toLowerCase().includes(q) ||
          a.elevePrenom?.toLowerCase().includes(q) ||
          a.seance.toLowerCase().includes(q)
      );
    }
    if (filterType !== "all") {
      list = list.filter((a) => a.type === filterType);
    }
    if (filterJustifie !== "all") {
      list = list.filter((a) =>
        filterJustifie === "oui" ? a.justifie : !a.justifie
      );
    }
    return list;
  }, [absences, search, filterType, filterJustifie]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE
  );

  const hasFilters = search || filterType !== "all" || filterJustifie !== "all";

  const resetFilters = () => {
    setSearch("");
    setFilterType("all");
    setFilterJustifie("all");
    setCurrentPage(0);
  };

  const handleJustify = () => {
    if (!justifyTarget) return;
    justifyMutation.mutate(
      { id: justifyTarget.id, motif: justifyMotif },
      {
        onSuccess: () => {
          setJustifyTarget(null);
          setJustifyMotif("");
        },
      }
    );
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  };

  const statCards = [
    {
      label: "Total Absences",
      value: stats?.totalAbsences ?? 0,
      icon: UserX,
      color: "bg-red-50",
      textColor: "text-red-700",
    },
    {
      label: "Total Retards",
      value: stats?.totalRetards ?? 0,
      icon: Clock,
      color: "bg-orange-50",
      textColor: "text-orange-700",
    },
    {
      label: "Taux de Presence",
      value: `${(stats?.tauxPresence ?? 0).toFixed(1)}%`,
      icon: TrendingUp,
      color: "bg-emerald-50",
      textColor: "text-emerald-700",
    },
  ];

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
          <h1 className="font-heading text-xl md:text-2xl font-bold text-foreground">
            Suivi des Absences
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Consultez et gerez les absences et retards des eleves
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton
            type="absences"
            label="Exporter"
            filters={{ from: selectedDate, to: selectedDate }}
          />
          {selectedClasseId && selectedClasseId !== "all" && (
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => navigate(`/dashboard/absences/feuille?classeId=${selectedClasseId}&date=${selectedDate}`)}>
              <FileCheck className="h-4 w-4" />
              Feuille complète
            </Button>
          )}
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => navigate("/dashboard/absences/feuilles")}>
            <CalendarDays className="h-4 w-4" />
            Feuilles du jour
          </Button>
          <PermissionGate perms={["WRITE_ABSENCES"]}>
            <Button size="sm" className="gap-1.5 bg-gradient-primary shadow-btn" onClick={() => navigate("/dashboard/absences/appel")}>
              <ClipboardList className="h-4 w-4" />
              Faire l'appel
            </Button>
          </PermissionGate>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            custom={i}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="rounded-xl border border-border/50 bg-card p-4 shadow-sm"
          >
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${stat.color}`}>
              <stat.icon className={`h-4.5 w-4.5 ${stat.textColor}`} />
            </div>
            <p className="mt-2.5 font-heading text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Class + Date selectors */}
      <motion.div
        custom={3}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="rounded-xl border border-border/50 bg-card p-4 shadow-sm"
      >
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="flex items-center gap-3 flex-1">
            <div className="flex-1">
              <Select
                value={selectedClasseId || "all"}
                onValueChange={(v) => {
                  setSelectedClasseId(v);
                  setCurrentPage(0);
                }}
              >
                <SelectTrigger>
                  <CalendarDays className="h-3.5 w-3.5 me-1.5 text-muted-foreground" />
                  <SelectValue placeholder="Selectionner une classe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les classes</SelectItem>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setCurrentPage(0);
              }}
              className="w-[180px]"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(0); }}
                placeholder="Rechercher un eleve..."
                className="ps-9"
              />
            </div>
            <Select value={filterType} onValueChange={(v) => { setFilterType(v); setCurrentPage(0); }}>
              <SelectTrigger className="w-[130px]">
                <Filter className="h-3.5 w-3.5 me-1.5 text-muted-foreground" />
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="ABSENCE">Absence</SelectItem>
                <SelectItem value="RETARD">Retard</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterJustifie} onValueChange={(v) => { setFilterJustifie(v); setCurrentPage(0); }}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Justifie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="oui">Justifie</SelectItem>
                <SelectItem value="non">Non justifie</SelectItem>
              </SelectContent>
            </Select>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={resetFilters} className="gap-1 text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
                Reinitialiser
              </Button>
            )}
          </div>
        </div>
        <div className="mt-2 text-xs text-muted-foreground flex items-center gap-2">
          {filtered.length} enregistrement{filtered.length !== 1 ? "s" : ""} trouve{filtered.length !== 1 ? "s" : ""}
          {isFetching && <Loader2 className="h-3 w-3 animate-spin" />}
        </div>
      </motion.div>

      {/* Table */}
      {selectedClasseId ? (
        <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible" className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground">Eleve</th>
                  <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground">Type</th>
                  <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground hidden sm:table-cell">Seance</th>
                  <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground hidden md:table-cell">Heure arrivee</th>
                  <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground">Justifie</th>
                  <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground hidden lg:table-cell">Motif</th>
                  <th className="py-3 px-4 text-end text-xs font-semibold text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-muted-foreground">
                      <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-30" />
                      <p className="font-medium">Aucune absence trouvee</p>
                      <p className="text-xs mt-1">Aucune absence enregistree pour cette classe et cette date</p>
                    </td>
                  </tr>
                ) : (
                  paginated.map((absence) => (
                    <tr key={absence.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-medium text-foreground">
                          {absence.elevePrenom} {absence.eleveNom}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className={absence.type === "ABSENCE" ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"}>
                          {absence.type === "ABSENCE" ? "Absence" : "Retard"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 hidden sm:table-cell text-muted-foreground">{absence.seance}</td>
                      <td className="py-3 px-4 hidden md:table-cell text-muted-foreground">{absence.heureArrivee ?? "-"}</td>
                      <td className="py-3 px-4">
                        {absence.justifie ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600">
                            <CheckCircle className="h-3.5 w-3.5" /> Oui
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-600">
                            <AlertTriangle className="h-3.5 w-3.5" /> Non
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 hidden lg:table-cell text-muted-foreground max-w-[200px] truncate">
                        {absence.motif ?? "-"}
                      </td>
                      <td className="py-3 px-4 text-end">
                        <div className="hidden sm:flex items-center justify-end gap-1">
                          {!absence.justifie && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-emerald-600"
                              onClick={() => {
                                setJustifyTarget(absence);
                                setJustifyMotif("");
                              }}
                            >
                              <FileCheck className="h-4 w-4" />
                            </Button>
                          )}
                          <PermissionGate perms={["WRITE_ABSENCES"]}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-600" onClick={() => setDeleteTarget(absence)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </PermissionGate>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 sm:hidden">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {!absence.justifie && (
                              <DropdownMenuItem
                                onClick={() => {
                                  setJustifyTarget(absence);
                                  setJustifyMotif("");
                                }}
                              >
                                <FileCheck className="h-4 w-4 me-2" /> Justifier
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => setDeleteTarget(absence)} className="text-red-600">
                              <Trash2 className="h-4 w-4 me-2" /> Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border px-4 py-3">
              <p className="text-xs text-muted-foreground">Page {currentPage + 1} sur {totalPages}</p>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage === 0} onClick={() => setCurrentPage((p) => p - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage >= totalPages - 1} onClick={() => setCurrentPage((p) => p + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      ) : (
        <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible" className="rounded-xl border border-border/50 bg-card shadow-sm p-16 text-center">
          <CalendarDays className="h-10 w-10 mx-auto mb-3 opacity-30 text-muted-foreground" />
          <p className="font-medium text-muted-foreground">Selectionnez une classe</p>
          <p className="text-xs text-muted-foreground mt-1">
            Choisissez une classe et une date pour voir les absences
          </p>
        </motion.div>
      )}

      {/* Justify Dialog */}
      <Dialog open={!!justifyTarget} onOpenChange={(open) => !open && setJustifyTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Justifier l'absence</DialogTitle>
            <DialogDescription>
              Justifier l'absence de{" "}
              <span className="font-semibold text-foreground">
                {justifyTarget?.elevePrenom} {justifyTarget?.eleveNom}
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="motif">Motif de justification</Label>
              <Textarea
                id="motif"
                value={justifyMotif}
                onChange={(e) => setJustifyMotif(e.target.value)}
                placeholder="Saisissez le motif..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Annuler</Button>
            </DialogClose>
            <Button onClick={handleJustify} disabled={justifyMutation.isPending || !justifyMotif.trim()}>
              {justifyMutation.isPending ? "Enregistrement..." : "Justifier"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Etes-vous sur de vouloir supprimer cette absence de{" "}
              <span className="font-semibold text-foreground">
                {deleteTarget?.elevePrenom} {deleteTarget?.eleveNom}
              </span>{" "}
              ? Cette action est irreversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2">
            <DialogClose asChild>
              <Button variant="outline">Annuler</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? "Suppression..." : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
