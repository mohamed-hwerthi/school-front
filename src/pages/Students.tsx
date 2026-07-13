import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useLanguage } from "@/hooks/useLanguage";
import { PermissionGate } from "@/components/auth/Gates";
import { ScopedEmptyState } from "@/components/auth/ScopedEmptyState";
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Upload,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  UserCheck,
  UserX,
  GraduationCap,
  MoreHorizontal,
  X,
  ShieldAlert,
  Loader2,
} from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useStudentsPaged, useAllStudents, useDeleteStudent } from "@/hooks/useStudents";
import { StudentsListSkeleton } from "@/components/skeletons/StudentsListSkeleton";
import { ExcelImportDialog } from "@/components/students/ExcelImportDialog";
import { STATUTS } from "@/types/student";
import type { Student } from "@/types/student";
import { useNiveaux } from "@/hooks/useNiveaux";
import ExportButton from "@/components/ExportButton";
import WhatsAppButton from "@/components/WhatsAppButton";

const ITEMS_PER_PAGE = 20;

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.35 } }),
};

const avatarColors = [
  "bg-emerald-100 text-emerald-700",
  "bg-blue-100 text-blue-700",
  "bg-purple-100 text-purple-700",
  "bg-orange-100 text-orange-700",
  "bg-pink-100 text-pink-700",
  "bg-cyan-100 text-cyan-700",
];

export default function Students() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { niveaux } = useNiveaux();

  // Filters state
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterNiveau, setFilterNiveau] = useState("all");
  const [filterStatut, setFilterStatut] = useState("all");
  const [filterClasse, setFilterClasse] = useState("all");
  const [currentPage, setCurrentPage] = useState(0); // 0-indexed for backend

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(0);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  // Server-side paginated query
  const { data: pagedData, isLoading, isFetching } = useStudentsPaged({
    page: currentPage,
    size: ITEMS_PER_PAGE,
    search: debouncedSearch || undefined,
    niveau: filterNiveau !== "all" ? filterNiveau : undefined,
    classe: filterClasse !== "all" ? filterClasse : undefined,
    status: filterStatut !== "all" ? filterStatut : undefined,
  });

  // Full list for stats (cached separately)
  const { data: allStudents = [] } = useAllStudents();

  // Mutations
  const deleteMutation = useDeleteStudent();

  const [deleteStudentTarget, setDeleteStudentTarget] = useState<Student | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const students = pagedData?.content ?? [];
  const totalElements = pagedData?.totalElements ?? 0;
  const totalPages = pagedData?.totalPages ?? 1;

  // Classes proposées dans le filtre : limitées au niveau sélectionné.
  const CLASSES = useMemo(
    () => [...new Set(
      allStudents
        .filter((s) => filterNiveau === "all" || s.niveau === filterNiveau)
        .map((s) => s.classe)
        .filter(Boolean)
    )].sort(),
    [allStudents, filterNiveau]
  );

  // Stats from full list
  const totalStudents = allStudents.length;
  const activeStudents = allStudents.filter((s) => s.statut === "Actif").length;
  const inactiveStudents = allStudents.filter((s) => s.statut === "Inactif").length;
  const garcons = allStudents.filter((s) => s.sexe === "M").length;
  const filles = allStudents.filter((s) => s.sexe === "F").length;
  const newThisMonth = allStudents.filter((s) => {
    const d = new Date(s.dateInscription);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const stats = [
    { label: t("students.totalStudents"), value: totalStudents, icon: Users, color: "bg-blue-500", bgLight: "bg-blue-50", textColor: "text-blue-700" },
    { label: t("students.activeStudents"), value: activeStudents, icon: UserCheck, color: "bg-emerald-500", bgLight: "bg-emerald-50", textColor: "text-emerald-700" },
    { label: t("common.boys"), value: garcons, icon: GraduationCap, color: "bg-purple-500", bgLight: "bg-purple-50", textColor: "text-purple-700" },
    { label: t("common.girls"), value: filles, icon: GraduationCap, color: "bg-pink-500", bgLight: "bg-pink-50", textColor: "text-pink-700" },
    { label: t("students.inactiveStudents"), value: inactiveStudents, icon: UserX, color: "bg-orange-500", bgLight: "bg-orange-50", textColor: "text-orange-700" },
    { label: t("common.newThisMonth"), value: newThisMonth, icon: TrendingUp, color: "bg-cyan-500", bgLight: "bg-cyan-50", textColor: "text-cyan-700" },
  ];

  // Handlers
  const resetFilters = () => {
    setSearch("");
    setFilterNiveau("all");
    setFilterStatut("all");
    setFilterClasse("all");
    setCurrentPage(0);
  };

  const hasFilters = search || filterNiveau !== "all" || filterStatut !== "all" || filterClasse !== "all";

  const handleDelete = () => {
    if (!deleteStudentTarget) return;
    deleteMutation.mutate(deleteStudentTarget.id, {
      onSuccess: () => setDeleteStudentTarget(null),
    });
  };


  const getInitials = (s: Student) => `${s.prenom[0]}${s.nom[0]}`.toUpperCase();
  const getAvatarColor = (id: string) => avatarColors[id % avatarColors.length];

  const statusConfig: Record<string, { bg: string; text: string }> = {
    Actif: { bg: "bg-emerald-100", text: "text-emerald-700" },
    Inactif: { bg: "bg-red-100", text: "text-red-700" },
    "En attente": { bg: "bg-amber-100", text: "text-amber-700" },
  };

  if (isLoading && !pagedData) return <StudentsListSkeleton />;

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
            {t("students.title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t("students.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton type="students" label={t("common.export")} />
          <PermissionGate perms={["WRITE_STUDENTS"]}>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setImportOpen(true)}
            >
              <Upload className="h-4 w-4" />
              {t("common.import")}
            </Button>
            <Button
              size="sm"
              className="gap-1.5 bg-gradient-primary shadow-btn"
              onClick={() => navigate("/dashboard/eleves/ajouter")}
            >
              <UserPlus className="h-4 w-4" />
              {t("students.newStudent")}
            </Button>
          </PermissionGate>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
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
      <motion.div
        custom={6}
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
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(0); }}
              placeholder={t("students.searchPlaceholder")}
              className="ps-9"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={filterNiveau} onValueChange={(v) => { setFilterNiveau(v); setFilterClasse("all"); setCurrentPage(0); }}>
              <SelectTrigger className="w-[150px]">
                <Filter className="h-3.5 w-3.5 me-1.5 text-muted-foreground" />
                <SelectValue placeholder="Niveau" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.allLevels")}</SelectItem>
                {niveaux.map((n) => (<SelectItem key={n.nom} value={n.nom}>{n.nom}</SelectItem>))}
              </SelectContent>
            </Select>
            <Select value={filterClasse} onValueChange={(v) => { setFilterClasse(v); setCurrentPage(0); }}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Classe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.allClasses")}</SelectItem>
                {CLASSES.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
              </SelectContent>
            </Select>
            <Select value={filterStatut} onValueChange={(v) => { setFilterStatut(v); setCurrentPage(0); }}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.allStatuses")}</SelectItem>
                {STATUTS.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
              </SelectContent>
            </Select>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={resetFilters} className="gap-1 text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
                {t("common.reset")}
              </Button>
            )}
          </div>
        </div>
        <div className="mt-2 text-xs text-muted-foreground flex items-center gap-2">
          {totalElements} {t("common.found")}
          {isFetching && <Loader2 className="h-3 w-3 animate-spin" />}
        </div>
      </motion.div>

      {/* Student Table */}
      <motion.div
        custom={7}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground">{t("common.student")}</th>
                <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground hidden sm:table-cell">{t("students.matricule")}</th>
                <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground hidden sm:table-cell">{t("students.class")}</th>
                <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground hidden md:table-cell">{t("students.level")}</th>
                <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground hidden lg:table-cell">{t("students.parentPhone")}</th>
                <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground">{t("common.status")}</th>
                <th className="py-3 px-4 text-end text-xs font-semibold text-muted-foreground">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <ScopedEmptyState
                      emptyLabel={t("students.noStudentFound")}
                      icon={Users}
                    />
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr
                    key={student.id}
                    className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className={`text-xs font-semibold ${getAvatarColor(student.id)}`}>
                            {getInitials(student)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">
                            {student.prenom} {student.nom}
                            {student.estBloque && <ShieldAlert className="inline h-3.5 w-3.5 text-red-500 ms-1.5" />}
                          </p>
                          {(student.prenomAr || student.nomAr) && (
                            <p className="text-xs text-muted-foreground" dir="rtl">{student.prenomAr} {student.nomAr}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 hidden sm:table-cell">
                      <span className="font-mono text-xs text-muted-foreground">{student.matricule}</span>
                    </td>
                    <td className="py-3 px-4 hidden sm:table-cell">
                      <Badge variant="outline" className="font-medium">{student.classe}</Badge>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell text-muted-foreground">{student.niveau}</td>
                    <td className="py-3 px-4 hidden lg:table-cell text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <span>{student.telephoneParent}</span>
                        <WhatsAppButton phone={student.telephoneParent} className="h-7 w-7" size={16} />
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusConfig[student.statut]?.bg} ${statusConfig[student.statut]?.text}`}>
                        {student.statut}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-end">
                      <div className="hidden sm:flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-blue-600" onClick={() => navigate(`/dashboard/eleves/${student.id}`)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <PermissionGate perms={["WRITE_STUDENTS"]}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-amber-600"
                            onClick={() => navigate(`/dashboard/eleves/modifier/${student.id}`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </PermissionGate>
                        <PermissionGate perms={["DELETE_STUDENTS"]}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-600" onClick={() => setDeleteStudentTarget(student)}>
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
                          <DropdownMenuItem onClick={() => navigate(`/dashboard/eleves/${student.id}`)}>
                            <Eye className="h-4 w-4 me-2" /> {t("common.profile")}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/dashboard/eleves/modifier/${student.id}`)}>
                            <Edit className="h-4 w-4 me-2" /> {t("common.edit")}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeleteStudentTarget(student)} className="text-red-600">
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

        {/* Pagination */}
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
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 7) {
                  pageNum = i;
                } else if (currentPage < 4) {
                  pageNum = i;
                } else if (currentPage > totalPages - 5) {
                  pageNum = totalPages - 7 + i;
                } else {
                  pageNum = currentPage - 3 + i;
                }
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === currentPage ? "default" : "outline"}
                    size="icon"
                    className="h-8 w-8 text-xs"
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum + 1}
                  </Button>
                );
              })}
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteStudentTarget} onOpenChange={(open) => !open && setDeleteStudentTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("common.confirmDelete")}</DialogTitle>
            <DialogDescription>
              {t("common.deleteConfirmMsg")}{" "}
              <span className="font-semibold text-foreground">
                {deleteStudentTarget?.prenom} {deleteStudentTarget?.nom}
              </span>{" "}
              ? {t("common.irreversible")}
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

      {/* Excel Import Dialog — uses the async wizard internally */}
      <ExcelImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
      />
    </div>
  );
}
