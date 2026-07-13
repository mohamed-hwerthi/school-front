import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Clock,
  Search,
  Plus,
  Edit,
  Trash2,
  MoreHorizontal,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  UserX,
  AlertTriangle,
  CalendarDays,
} from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  usePointagesByDate,
  useCreatePointage,
  useUpdatePointage,
  useDeletePointage,
} from "@/hooks/useRh";
import type { Pointage, StatutPointage, EmployeType } from "@/types/rh";

const STATUT_COLORS: Record<StatutPointage, string> = {
  PRESENT: "bg-emerald-100 text-emerald-700",
  ABSENT: "bg-red-100 text-red-700",
  RETARD: "bg-amber-100 text-amber-700",
  CONGE: "bg-blue-100 text-blue-700",
};

const ITEMS_PER_PAGE = 15;

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.35 },
  }),
};

export default function PointagePage() {
  const { t } = useLanguage();

  const STATUT_LABELS: Record<StatutPointage, string> = {
    PRESENT: t("attendance.statuses.present"),
    ABSENT: t("attendance.statuses.absent"),
    RETARD: t("attendance.statuses.late"),
    CONGE: t("attendance.statuses.leave"),
  };

  const EMPLOYE_TYPE_LABELS: Record<EmployeType, string> = {
    ENSEIGNANT: t("attendance.employeeTypes.teacher"),
    ADMIN: t("attendance.employeeTypes.admin"),
    PERSONNEL: t("attendance.employeeTypes.staff"),
  };

  const today = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [search, setSearch] = useState("");
  const [filterStatut, setFilterStatut] = useState("all");
  const [currentPage, setCurrentPage] = useState(0);

  // Form state
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Pointage | null>(null);
  const [form, setForm] = useState({
    employeId: 0,
    employeType: "ENSEIGNANT" as EmployeType,
    heureArrivee: "",
    heureDepart: "",
    statut: "PRESENT" as StatutPointage,
    notes: "",
  });

  const [deleteTarget, setDeleteTarget] = useState<Pointage | null>(null);

  const { data: pointages = [], isLoading } = usePointagesByDate(selectedDate);
  const createMutation = useCreatePointage();
  const updateMutation = useUpdatePointage();
  const deleteMutation = useDeletePointage();

  const filtered = useMemo(() => {
    let list = pointages;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          String(p.employeId).includes(q) ||
          p.employeType.toLowerCase().includes(q) ||
          (p.notes && p.notes.toLowerCase().includes(q))
      );
    }
    if (filterStatut !== "all") {
      list = list.filter((p) => p.statut === filterStatut);
    }
    return list;
  }, [pointages, search, filterStatut]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE
  );

  const stats = [
    {
      label: t("attendance.totalEntries"),
      value: pointages.length,
      icon: Clock,
      color: "bg-blue-50",
      textColor: "text-blue-700",
    },
    {
      label: t("attendance.presents"),
      value: pointages.filter((p) => p.statut === "PRESENT").length,
      icon: UserCheck,
      color: "bg-emerald-50",
      textColor: "text-emerald-700",
    },
    {
      label: t("attendance.absents"),
      value: pointages.filter((p) => p.statut === "ABSENT").length,
      icon: UserX,
      color: "bg-red-50",
      textColor: "text-red-700",
    },
    {
      label: t("attendance.lateArrivals"),
      value: pointages.filter((p) => p.statut === "RETARD").length,
      icon: AlertTriangle,
      color: "bg-amber-50",
      textColor: "text-amber-700",
    },
  ];

  const openCreate = () => {
    setEditTarget(null);
    setForm({
      employeId: 0,
      employeType: "ENSEIGNANT",
      heureArrivee: "",
      heureDepart: "",
      statut: "PRESENT",
      notes: "",
    });
    setFormOpen(true);
  };

  const openEdit = (p: Pointage) => {
    setEditTarget(p);
    setForm({
      employeId: p.employeId,
      employeType: p.employeType,
      heureArrivee: p.heureArrivee ?? "",
      heureDepart: p.heureDepart ?? "",
      statut: p.statut,
      notes: p.notes ?? "",
    });
    setFormOpen(true);
  };

  const handleSave = () => {
    const payload = {
      employeId: form.employeId,
      employeType: form.employeType,
      datePointage: selectedDate,
      heureArrivee: form.heureArrivee || undefined,
      heureDepart: form.heureDepart || undefined,
      statut: form.statut,
      notes: form.notes || undefined,
    };

    if (editTarget) {
      updateMutation.mutate(
        { id: editTarget.id, data: payload },
        { onSuccess: () => setFormOpen(false) }
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => setFormOpen(false),
      });
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  };

  const hasFilters = search || filterStatut !== "all";
  const resetFilters = () => {
    setSearch("");
    setFilterStatut("all");
    setCurrentPage(0);
  };

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
            {t("attendance.title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t("attendance.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              setCurrentPage(0);
            }}
            className="w-[180px]"
          />
          <Button
            size="sm"
            className="gap-1.5 bg-gradient-primary shadow-btn"
            onClick={openCreate}
          >
            <Plus className="h-4 w-4" />
            {t("attendance.newEntry")}
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
            className="rounded-xl border border-border/50 bg-card p-4 shadow-sm"
          >
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-lg ${stat.color}`}
            >
              <stat.icon className={`h-4.5 w-4.5 ${stat.textColor}`} />
            </div>
            <p className="mt-2.5 font-heading text-2xl font-bold text-foreground">
              {stat.value}
            </p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <motion.div
        custom={4}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="rounded-xl border border-border/50 bg-card p-4 shadow-sm"
      >
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(0);
              }}
              placeholder={t("attendance.searchPlaceholder")}
              className="ps-9"
            />
          </div>
          <Select
            value={filterStatut}
            onValueChange={(v) => {
              setFilterStatut(v);
              setCurrentPage(0);
            }}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("common.all")}</SelectItem>
              {(Object.keys(STATUT_LABELS) as StatutPointage[]).map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUT_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="gap-1 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" /> {t("common.reset")}
            </Button>
          )}
        </div>
      </motion.div>

      {/* Table */}
      <motion.div
        custom={5}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground">
                  {t("attendance.employeeType")} ID
                </th>
                <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground">
                  {t("common.type")}
                </th>
                <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground hidden sm:table-cell">
                  {t("attendance.arrivalTime")}
                </th>
                <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground hidden sm:table-cell">
                  {t("attendance.departureTime")}
                </th>
                <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground hidden md:table-cell">
                  {t("training.hours")}
                </th>
                <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground">
                  {t("common.status")}
                </th>
                <th className="py-3 px-4 text-end text-xs font-semibold text-muted-foreground">
                  {t("common.actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-16 text-center text-muted-foreground"
                  >
                    <CalendarDays className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">{t("attendance.noEntryForDate")}</p>
                  </td>
                </tr>
              ) : (
                paginated.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors"
                  >
                    <td className="py-3 px-4 font-medium text-foreground">
                      #{p.employeId}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline">
                        {EMPLOYE_TYPE_LABELS[p.employeType]}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 hidden sm:table-cell text-muted-foreground">
                      {p.heureArrivee ?? "-"}
                    </td>
                    <td className="py-3 px-4 hidden sm:table-cell text-muted-foreground">
                      {p.heureDepart ?? "-"}
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell text-muted-foreground">
                      {p.heuresTravaillees != null
                        ? `${p.heuresTravaillees}h`
                        : "-"}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUT_COLORS[p.statut]}`}
                      >
                        {STATUT_LABELS[p.statut]}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-end">
                      <div className="hidden sm:flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-amber-600"
                          onClick={() => openEdit(p)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-red-600"
                          onClick={() => setDeleteTarget(p)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 sm:hidden"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(p)}>
                            <Edit className="h-4 w-4 me-2" /> {t("common.edit")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeleteTarget(p)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 me-2" /> {t("common.delete")}
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
            <p className="text-xs text-muted-foreground">
              {t("common.page")} {currentPage + 1} {t("common.of")} {totalPages}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={currentPage === 0}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={currentPage >= totalPages - 1}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Create / Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editTarget ? t("attendance.editEntry") : t("attendance.newEntry")}
            </DialogTitle>
            <DialogDescription>
              {editTarget
                ? t("attendance.editInfo")
                : t("attendance.registerEntry")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="employeId">{t("attendance.employeeType")} ID</Label>
                <Input
                  id="employeId"
                  type="number"
                  value={form.employeId || ""}
                  onChange={(e) =>
                    setForm({ ...form, employeId: e.target.value })
                  }
                  placeholder="ID"
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t("attendance.employeeType")}</Label>
                <Select
                  value={form.employeType}
                  onValueChange={(v) =>
                    setForm({ ...form, employeType: v as EmployeType })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(EMPLOYE_TYPE_LABELS) as EmployeType[]).map(
                      (t) => (
                        <SelectItem key={t} value={t}>
                          {EMPLOYE_TYPE_LABELS[t]}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="heureArrivee">{t("attendance.arrivalTime")}</Label>
                <Input
                  id="heureArrivee"
                  type="time"
                  value={form.heureArrivee}
                  onChange={(e) =>
                    setForm({ ...form, heureArrivee: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="heureDepart">{t("attendance.departureTime")}</Label>
                <Input
                  id="heureDepart"
                  type="time"
                  value={form.heureDepart}
                  onChange={(e) =>
                    setForm({ ...form, heureDepart: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{t("common.status")}</Label>
              <Select
                value={form.statut}
                onValueChange={(v) =>
                  setForm({ ...form, statut: v as StatutPointage })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(STATUT_LABELS) as StatutPointage[]).map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUT_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes">{t("common.notes")}</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Notes..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">{t("common.cancel")}</Button>
            </DialogClose>
            <Button
              onClick={handleSave}
              disabled={
                createMutation.isPending ||
                updateMutation.isPending ||
                !form.employeId
              }
            >
              {createMutation.isPending || updateMutation.isPending
                ? t("common.saving")
                : t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("attendance.deleteEntry")}</DialogTitle>
            <DialogDescription>
              {t("common.deleteConfirmMsg")} ? {t("common.irreversible")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2">
            <DialogClose asChild>
              <Button variant="outline">{t("common.cancel")}</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? t("common.deleting") : t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
