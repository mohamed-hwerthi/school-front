import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { validate, type FormErrors } from "@/lib/validate";
import { fichePaieSchema } from "@/lib/communication-schemas";
import {
  Banknote,
  Search,
  Plus,
  Edit,
  Trash2,
  FileDown,
  MoreHorizontal,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Clock,
  DollarSign,
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
  useFichesPaie,
  useCreateFichePaie,
  useUpdateFichePaie,
  useDeleteFichePaie,
} from "@/hooks/useRh";
import { CURRENCY } from "@/config/currency";
import { useTeachers } from "@/hooks/useTeachers";
import { useAllUsers } from "@/hooks/useUsers";
import { usePersonnelList } from "@/hooks/usePersonnel";
import { useSchool } from "@/hooks/useSchool";
import { generateFichePaiePDF, moisLabel } from "@/lib/generateFichePaiePDF";
import { notify } from "@/lib/toast";
import type { FichePaie, CreateFichePaieRequest } from "@/types/rh";

const ITEMS_PER_PAGE = 15;

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.35 },
  }),
};

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

export default function PaiePage() {
  const { t } = useLanguage();

  const MOIS_LABELS: Record<number, string> = {
    1: t("common.months.january"),
    2: t("common.months.february"),
    3: t("common.months.march"),
    4: t("common.months.april"),
    5: t("common.months.may"),
    6: t("common.months.june"),
    7: t("common.months.july"),
    8: t("common.months.august"),
    9: t("common.months.september"),
    10: t("common.months.october"),
    11: t("common.months.november"),
    12: t("common.months.december"),
  };
  const [filterMois, setFilterMois] = useState("all");
  const [filterAnnee, setFilterAnnee] = useState(String(currentYear));
  const [search, setSearch] = useState("");
  const [filterPaye, setFilterPaye] = useState("all");
  const [currentPage, setCurrentPage] = useState(0);

  // Form state
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<FichePaie | null>(null);
  const [form, setForm] = useState<CreateFichePaieRequest>({
    employeId: "",
    employeType: "ENSEIGNANT",
    mois: currentMonth,
    annee: currentYear,
    salaireBase: 0,
    primes: 0,
    retenues: 0,
    salaireNet: 0,
    paye: false,
    commentaire: "",
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const [deleteTarget, setDeleteTarget] = useState<FichePaie | null>(null);

  const { data: fichesPaie = [], isLoading } = useFichesPaie();
  const createMutation = useCreateFichePaie();
  const updateMutation = useUpdateFichePaie();
  const deleteMutation = useDeleteFichePaie();

  // Employé selectors backing data
  const { teachers } = useTeachers();
  const { data: allUsers = [] } = useAllUsers();
  const { data: personnelList = [] } = usePersonnelList();
  const { school } = useSchool();

  /** Resolve a display name from an employeId + employeType pair, with a graceful fallback. */
  const employeNameById = (employeId: string, employeType: string): string => {
    if (employeType === "ENSEIGNANT") {
      const teacher = teachers.find((t) => t.id === employeId);
      if (teacher) return `${teacher.prenom} ${teacher.nom}`;
    }
    if (employeType === "PERSONNEL") {
      const p = personnelList.find((p) => p.id === employeId);
      if (p) return `${p.prenom} ${p.nom}`;
    }
    const user = allUsers.find((u) => u.id === employeId);
    if (user) return `${user.firstName} ${user.lastName}`;
    return `#${employeId}`;
  };

  const handleDownloadPDF = (f: FichePaie) => {
    if (!school) {
      notify.error("Informations de l'école non disponibles");
      return;
    }
    generateFichePaiePDF(
      {
        reference: `FP-${f.annee}-${String(f.mois).padStart(2, "0")}-${String(f.id).padStart(3, "0")}`,
        employeName: employeNameById(f.employeId, f.employeType),
        employeType: f.employeType,
        moisLabel: moisLabel(f.mois),
        annee: f.annee,
        salaireBase: f.salaireBase,
        primes: f.primes,
        retenues: f.retenues,
        salaireNet: f.salaireNet,
        datePaiement: f.datePaiement ?? null,
        paye: f.paye,
        commentaire: f.commentaire ?? null,
      },
      school
    );
  };

  // Filter by month/year + search
  const filtered = useMemo(() => {
    let list = fichesPaie;

    if (filterMois !== "all") {
      list = list.filter((f) => f.mois === Number(filterMois));
    }
    if (filterAnnee !== "all") {
      list = list.filter((f) => f.annee === Number(filterAnnee));
    }
    if (search) {
      // search holds the chosen employeId (as string) when set
      const empId = Number(search);
      if (!Number.isNaN(empId) && empId) {
        list = list.filter((f) => f.employeId === empId);
      }
    }
    if (filterPaye !== "all") {
      list = list.filter((f) =>
        filterPaye === "oui" ? f.paye : !f.paye
      );
    }
    return list;
  }, [fichesPaie, filterMois, filterAnnee, search, filterPaye]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE
  );

  const totalMasse = filtered.reduce((sum, f) => sum + f.salaireNet, 0);
  const totalPaye = filtered.filter((f) => f.paye).length;
  const totalNonPaye = filtered.filter((f) => !f.paye).length;

  const stats = [
    {
      label: t("payroll.payrollTotal"),
      value: `${totalMasse.toLocaleString()} ${CURRENCY}`,
      icon: DollarSign,
      color: "bg-blue-50",
      textColor: "text-blue-700",
    },
    {
      label: t("payroll.totalPayslips"),
      value: filtered.length,
      icon: Banknote,
      color: "bg-purple-50",
      textColor: "text-purple-700",
    },
    {
      label: t("payroll.paidPayslips"),
      value: totalPaye,
      icon: CheckCircle,
      color: "bg-emerald-50",
      textColor: "text-emerald-700",
    },
    {
      label: t("common.pending"),
      value: totalNonPaye,
      icon: Clock,
      color: "bg-amber-50",
      textColor: "text-amber-700",
    },
  ];

  // Auto-calculate salaire net
  const updateSalaireNet = (updates: Partial<CreateFichePaieRequest>) => {
    const newForm = { ...form, ...updates };
    const base = newForm.salaireBase || 0;
    const primes = newForm.primes || 0;
    const retenues = newForm.retenues || 0;
    newForm.salaireNet = base + primes - retenues;
    setForm(newForm);
  };

  const openCreate = () => {
    setEditTarget(null);
    setForm({
      employeId: "",
      employeType: "ENSEIGNANT",
      mois: currentMonth,
      annee: currentYear,
      salaireBase: 0,
      primes: 0,
      retenues: 0,
      salaireNet: 0,
      paye: false,
      commentaire: "",
    });
    setFormOpen(true);
  };

  const openEdit = (f: FichePaie) => {
    setEditTarget(f);
    setForm({
      employeId: f.employeId,
      employeType: f.employeType,
      mois: f.mois,
      annee: f.annee,
      salaireBase: f.salaireBase,
      primes: f.primes,
      retenues: f.retenues,
      salaireNet: f.salaireNet,
      datePaiement: f.datePaiement,
      paye: f.paye,
      commentaire: f.commentaire ?? "",
    });
    setFormOpen(true);
  };

  const handleSave = () => {
    const result = validate(fichePaieSchema, form);
    if (!result.ok) { setFormErrors(result.errors); return; }
    setFormErrors({});
    const onError = (err: Error & { response?: { data?: { message?: string } } }) => setFormErrors({ _root: err.response?.data?.message ?? "Erreur" });
    if (editTarget) {
      updateMutation.mutate(
        { id: editTarget.id, data: form },
        { onSuccess: () => setFormOpen(false), onError }
      );
    } else {
      createMutation.mutate(form, {
        onSuccess: () => setFormOpen(false),
        onError,
      });
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  };

  const hasFilters = search || filterPaye !== "all";
  const resetFilters = () => {
    setSearch("");
    setFilterPaye("all");
    setCurrentPage(0);
  };

  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

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
            {t("payroll.title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t("payroll.subtitle")}
          </p>
        </div>
        <Button
          size="sm"
          className="gap-1.5 bg-gradient-primary shadow-btn"
          onClick={openCreate}
        >
          <Plus className="h-4 w-4" />
          {t("payroll.newPayslip")}
        </Button>
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
          <Select
            value={filterMois}
            onValueChange={(v) => {
              setFilterMois(v);
              setCurrentPage(0);
            }}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Mois" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("finance.allMonths")}</SelectItem>
              {Object.entries(MOIS_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filterAnnee}
            onValueChange={(v) => {
              setFilterAnnee(v);
              setCurrentPage(0);
            }}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Annee" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("common.all")}</SelectItem>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={search || "all"}
            onValueChange={(v) => {
              setSearch(v === "all" ? "" : v);
              setCurrentPage(0);
            }}
          >
            <SelectTrigger className="flex-1 min-w-0">
              <Search className="h-3.5 w-3.5 me-1.5 text-muted-foreground" />
              <SelectValue placeholder="Filtrer par employé" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les employés</SelectItem>
              {teachers.map((t) => (
                <SelectItem key={`teacher-${t.id}`} value={String(t.id)}>
                  {t.prenom} {t.nom}
                  {t.specialite ? ` — ${t.specialite}` : ""}
                </SelectItem>
              ))}
              {allUsers
                .filter((u) => !["ENSEIGNANT", "PARENT"].includes(u.role))
                .map((u) => (
                  <SelectItem key={`user-${u.id}`} value={String(u.id)}>
                    {u.firstName} {u.lastName} ({u.role})
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <Select
            value={filterPaye}
            onValueChange={(v) => {
              setFilterPaye(v);
              setCurrentPage(0);
            }}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Paiement" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("common.all")}</SelectItem>
              <SelectItem value="oui">{t("payroll.paidPayslips")}</SelectItem>
              <SelectItem value="non">{t("payroll.unpaidPayslips")}</SelectItem>
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
                  {t("common.teacher")}
                </th>
                <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground hidden sm:table-cell">
                  {t("common.trimester")}
                </th>
                <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground hidden md:table-cell">
                  {t("payroll.baseSalary")}
                </th>
                <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground hidden lg:table-cell">
                  {t("payroll.bonuses")}
                </th>
                <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground hidden lg:table-cell">
                  {t("payroll.deductions")}
                </th>
                <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground">
                  Net
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
                    colSpan={8}
                    className="py-16 text-center text-muted-foreground"
                  >
                    <Banknote className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">{t("payroll.noPayslip")}</p>
                  </td>
                </tr>
              ) : (
                paginated.map((f) => (
                  <tr
                    key={f.id}
                    className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div>
                        <span className="font-medium text-foreground">
                          {employeNameById(f.employeId, f.employeType)}
                        </span>
                        <Badge variant="outline" className="ms-2 text-[10px]">
                          {f.employeType}
                        </Badge>
                      </div>
                    </td>
                    <td className="py-3 px-4 hidden sm:table-cell text-muted-foreground">
                      {MOIS_LABELS[f.mois]} {f.annee}
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell text-muted-foreground">
                      {f.salaireBase.toLocaleString()} {CURRENCY}
                    </td>
                    <td className="py-3 px-4 hidden lg:table-cell text-emerald-600">
                      +{f.primes.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 hidden lg:table-cell text-red-600">
                      -{f.retenues.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-semibold text-foreground">
                      {f.salaireNet.toLocaleString()} {CURRENCY}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          f.paye
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {f.paye ? t("payroll.statuses.paid") : t("payroll.statuses.pending")}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-end">
                      <div className="hidden sm:flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-teal-600"
                          onClick={() => handleDownloadPDF(f)}
                          title="Télécharger PDF"
                        >
                          <FileDown className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-amber-600"
                          onClick={() => openEdit(f)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-red-600"
                          onClick={() => setDeleteTarget(f)}
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
                          <DropdownMenuItem onClick={() => handleDownloadPDF(f)}>
                            <FileDown className="h-4 w-4 me-2" /> Télécharger PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEdit(f)}>
                            <Edit className="h-4 w-4 me-2" /> {t("common.edit")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeleteTarget(f)}
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
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editTarget ? t("payroll.editPayslip") : t("payroll.newPayslip")}
            </DialogTitle>
            <DialogDescription>
              {editTarget
                ? t("payroll.editInfo")
                : t("payroll.createPayslip")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t("common.type")} <span className="text-red-500">*</span></Label>
                <Select
                  value={form.employeType}
                  onValueChange={(v) =>
                    // Switching type invalidates the previously chosen employé
                    setForm({ ...form, employeType: v, employeId: "" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ENSEIGNANT">{t("attendance.employeeTypes.teacher")}</SelectItem>
                    <SelectItem value="ADMIN">{t("attendance.employeeTypes.admin")}</SelectItem>
                    <SelectItem value="PERSONNEL">{t("attendance.employeeTypes.staff")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="paieEmployeId">Employé <span className="text-red-500">*</span></Label>
                {(() => {
                  const options =
                    form.employeType === "ENSEIGNANT"
                      ? teachers.map((t) => ({
                          id: t.id,
                          label: `${t.prenom} ${t.nom}${t.specialite ? ` — ${t.specialite}` : ""}`,
                        }))
                      : form.employeType === "ADMIN"
                      ? allUsers
                          .filter((u) =>
                            ["SUPER_ADMIN", "ADMIN", "DIRECTEUR"].includes(u.role)
                          )
                          .map((u) => ({
                            id: u.id,
                            label: `${u.firstName} ${u.lastName} (${u.role})`,
                          }))
                      : personnelList.map((p) => ({
                          id: p.id,
                          label: `${p.prenom} ${p.nom}${p.fonction ? ` — ${p.fonction}` : ""}`,
                        }));
                  return (
                    <Select
                      value={form.employeId ? String(form.employeId) : ""}
                      onValueChange={(v) =>
                        setForm({ ...form, employeId: v })
                      }
                    >
                      <SelectTrigger id="paieEmployeId">
                        <SelectValue placeholder="Sélectionner un employé…" />
                      </SelectTrigger>
                      <SelectContent>
                        {options.length === 0 ? (
                          <div className="px-2 py-3 text-xs text-muted-foreground text-center">
                            Aucun {form.employeType === "ENSEIGNANT" ? "enseignant" : form.employeType === "ADMIN" ? "administrateur" : "personnel"} trouvé
                          </div>
                        ) : (
                          options.map((o) => (
                            <SelectItem key={o.id} value={String(o.id)}>
                              {o.label}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  );
                })()}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t("finance.month")} <span className="text-red-500">*</span></Label>
                <Select
                  value={String(form.mois)}
                  onValueChange={(v) =>
                    setForm({ ...form, mois: Number(v) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(MOIS_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="paieAnnee">{t("payroll.year")} <span className="text-red-500">*</span></Label>
                <Input
                  id="paieAnnee"
                  type="number"
                  value={form.annee || ""}
                  onChange={(e) =>
                    setForm({ ...form, annee: Number(e.target.value) })
                  }
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="salaireBase">{t("payroll.baseSalary")} <span className="text-red-500">*</span></Label>
              <Input
                id="salaireBase"
                type="number"
                value={form.salaireBase || ""}
                onChange={(e) =>
                  updateSalaireNet({ salaireBase: Number(e.target.value) })
                }
                placeholder="0"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="primes">{t("payroll.bonuses")}</Label>
                <Input
                  id="primes"
                  type="number"
                  value={form.primes || ""}
                  onChange={(e) =>
                    updateSalaireNet({ primes: Number(e.target.value) })
                  }
                  placeholder="0"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="retenues">{t("payroll.deductions")}</Label>
                <Input
                  id="retenues"
                  type="number"
                  value={form.retenues || ""}
                  onChange={(e) =>
                    updateSalaireNet({ retenues: Number(e.target.value) })
                  }
                  placeholder="0"
                />
              </div>
            </div>
            <div className="rounded-lg bg-muted/50 p-3 flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Net
              </span>
              <span className="text-lg font-bold text-foreground">
                {form.salaireNet.toLocaleString()} {CURRENCY}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="datePaiement">{t("payroll.paymentDate")}</Label>
                <Input
                  id="datePaiement"
                  type="date"
                  value={form.datePaiement ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, datePaiement: e.target.value || undefined })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t("payroll.payment")} {t("common.status").toLowerCase()}</Label>
                <Select
                  value={form.paye ? "true" : "false"}
                  onValueChange={(v) =>
                    setForm({ ...form, paye: v === "true" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">{t("payroll.statuses.pending")}</SelectItem>
                    <SelectItem value="true">{t("payroll.statuses.paid")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="commentaire">{t("common.comment")}</Label>
              <Textarea
                id="commentaire"
                value={form.commentaire ?? ""}
                onChange={(e) =>
                  setForm({ ...form, commentaire: e.target.value })
                }
                placeholder="Commentaire..."
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
                !form.employeId ||
                !form.salaireBase
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
            <DialogTitle>{t("payroll.deletePayslip")}</DialogTitle>
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
