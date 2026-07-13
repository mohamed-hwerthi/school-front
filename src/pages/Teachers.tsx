import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useLanguage } from "@/hooks/useLanguage";
import { PermissionGate } from "@/components/auth/Gates";
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Calendar,
  Upload,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  UserCheck,
  UserX,
  GraduationCap,
  MoreHorizontal,
  X,
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
import { useTeachers } from "@/hooks/useTeachers";
import { TeachersListSkeleton } from "@/components/skeletons/TeachersListSkeleton";
import { ExcelImportDialog } from "@/components/teachers/ExcelImportDialog";
import DisponibiliteGrid from "@/components/teachers/DisponibiliteGrid";
import { SPECIALITES, STATUTS_ENSEIGNANT } from "@/types/teacher";
import type { Teacher } from "@/types/teacher";
import ExportButton from "@/components/ExportButton";

const ITEMS_PER_PAGE = 8;

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

export default function Teachers() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { teachers, isLoading: loading, deleteTeacher: removeTeacher, importTeachers } = useTeachers();

  const [search, setSearch] = useState("");
  const [filterSpecialite, setFilterSpecialite] = useState("all");
  const [filterStatut, setFilterStatut] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Dialog states
  const [viewTeacher, setViewTeacher] = useState<Teacher | null>(null);
  const [deleteTeacherTarget, setDeleteTeacherTarget] = useState<Teacher | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [dispoTeacher, setDispoTeacher] = useState<Teacher | null>(null);

  // ─── Derived data ─────────────────────────────────────
  const filtered = useMemo(() => {
    return teachers.filter((t) => {
      const matchSearch =
        search === "" ||
        `${t.prenom} ${t.nom}`.toLowerCase().includes(search.toLowerCase()) ||
        t.specialite.toLowerCase().includes(search.toLowerCase()) ||
        t.email.toLowerCase().includes(search.toLowerCase());
      const matchSpecialite = filterSpecialite === "all" || t.specialite === filterSpecialite;
      const matchStatut = filterStatut === "all" || t.statut === filterStatut;
      return matchSearch && matchSpecialite && matchStatut;
    });
  }, [teachers, search, filterSpecialite, filterStatut]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Stats
  const totalTeachers = teachers.length;
  const activeTeachers = teachers.filter((t) => t.statut === "Actif").length;
  const inactiveTeachers = teachers.filter((t) => t.statut === "Inactif").length;
  const hommes = teachers.filter((t) => t.sexe === "M").length;
  const femmes = teachers.filter((t) => t.sexe === "F").length;
  const newThisMonth = teachers.filter((t) => {
    const d = new Date(t.dateEmbauche);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const stats = [
    { label: t("teachers.totalTeachers"), value: totalTeachers, icon: Users, color: "bg-blue-500", bgLight: "bg-blue-50", textColor: "text-blue-700" },
    { label: t("common.active"), value: activeTeachers, icon: UserCheck, color: "bg-emerald-500", bgLight: "bg-emerald-50", textColor: "text-emerald-700" },
    { label: t("common.men"), value: hommes, icon: GraduationCap, color: "bg-purple-500", bgLight: "bg-purple-50", textColor: "text-purple-700" },
    { label: t("common.women"), value: femmes, icon: GraduationCap, color: "bg-pink-500", bgLight: "bg-pink-50", textColor: "text-pink-700" },
    { label: t("common.inactive"), value: inactiveTeachers, icon: UserX, color: "bg-orange-500", bgLight: "bg-orange-50", textColor: "text-orange-700" },
    { label: t("common.newThisMonth"), value: newThisMonth, icon: TrendingUp, color: "bg-cyan-500", bgLight: "bg-cyan-50", textColor: "text-cyan-700" },
  ];

  // ─── Handlers ─────────────────────────────────────────
  const resetFilters = () => {
    setSearch("");
    setFilterSpecialite("all");
    setFilterStatut("all");
    setCurrentPage(1);
  };

  const hasFilters = search || filterSpecialite !== "all" || filterStatut !== "all";

  const handleDelete = () => {
    if (!deleteTeacherTarget) return;
    removeTeacher(deleteTeacherTarget.id);
    setDeleteTeacherTarget(null);
  };

  const getInitials = (t: Teacher) => `${t.prenom[0]}${t.nom[0]}`.toUpperCase();
  const getAvatarColor = (id: string) => avatarColors[id % avatarColors.length];

  const statusConfig: Record<string, { bg: string; text: string }> = {
    Actif: { bg: "bg-emerald-100", text: "text-emerald-700" },
    Inactif: { bg: "bg-red-100", text: "text-red-700" },
    "En attente": { bg: "bg-amber-100", text: "text-amber-700" },
  };

  if (loading) return <TeachersListSkeleton />;

  // ─── Render ───────────────────────────────────────────
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
            {t("teachers.title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t("teachers.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton type="teachers" label={t("common.export")} />
          <PermissionGate perms={["WRITE_TEACHERS"]}>
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
              onClick={() => navigate("/dashboard/enseignants/ajouter")}
            >
              <UserPlus className="h-4 w-4" />
              {t("teachers.addTeacher")}
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
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              placeholder={t("common.searchByNameEmailEtc")}
              className="ps-9"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={filterSpecialite} onValueChange={(v) => { setFilterSpecialite(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-3.5 w-3.5 me-1.5 text-muted-foreground" />
                <SelectValue placeholder="Spécialité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.all")}</SelectItem>
                {SPECIALITES.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
              </SelectContent>
            </Select>
            <Select value={filterStatut} onValueChange={(v) => { setFilterStatut(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.allStatuses")}</SelectItem>
                {STATUTS_ENSEIGNANT.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
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
        <div className="mt-2 text-xs text-muted-foreground">
          {filtered.length} {t("common.found")}
        </div>
      </motion.div>

      {/* Teacher Table */}
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
                <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground">{t("common.teacher")}</th>
                <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground hidden sm:table-cell">{t("teachers.speciality")}</th>
                <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground hidden md:table-cell">{t("common.phone")}</th>
                <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground">{t("common.status")}</th>
                <th className="py-3 px-4 text-end text-xs font-semibold text-muted-foreground">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-muted-foreground">
                    <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">{t("teachers.noTeacherFound")}</p>
                    <p className="text-xs mt-1">{t("common.tryModifyFilters")}</p>
                  </td>
                </tr>
              ) : (
                paginated.map((teacher) => (
                  <tr
                    key={teacher.id}
                    className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className={`text-xs font-semibold ${getAvatarColor(teacher.id)}`}>
                            {getInitials(teacher)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">{teacher.prenom} {teacher.nom}</p>
                          <p className="text-xs text-muted-foreground">{teacher.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 hidden sm:table-cell">
                      <Badge variant="outline" className="font-medium">{teacher.specialite}</Badge>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell text-muted-foreground">{teacher.telephone}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusConfig[teacher.statut]?.bg} ${statusConfig[teacher.statut]?.text}`}>
                        {teacher.statut}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-end">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-blue-600" onClick={() => setViewTeacher(teacher)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <PermissionGate perms={["WRITE_TEACHERS"]}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-amber-600"
                            onClick={() => navigate(`/dashboard/enseignants/modifier/${teacher.id}`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-emerald-600 hidden sm:inline-flex"
                            onClick={() => setDispoTeacher(teacher)}
                            title="Disponibilités"
                          >
                            <Calendar className="h-4 w-4" />
                          </Button>
                        </PermissionGate>
                        <PermissionGate perms={["DELETE_TEACHERS"]}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-600" onClick={() => setDeleteTeacherTarget(teacher)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </PermissionGate>
                        {/* Mobile dropdown */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 sm:hidden">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setViewTeacher(teacher)}>
                              <Eye className="h-4 w-4 me-2" /> {t("common.view")}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/dashboard/enseignants/modifier/${teacher.id}`)}>
                              <Edit className="h-4 w-4 me-2" /> {t("common.edit")}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setDispoTeacher(teacher)}>
                              <Calendar className="h-4 w-4 me-2" /> Disponibilités
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setDeleteTeacherTarget(teacher)} className="text-red-600">
                              <Trash2 className="h-4 w-4 me-2" /> {t("common.delete")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filtered.length > ITEMS_PER_PAGE && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <p className="text-xs text-muted-foreground">
              {t("common.page")} {currentPage} {t("common.of")} {totalPages}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={page === currentPage ? "default" : "outline"}
                  size="icon"
                  className="h-8 w-8 text-xs"
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              ))}
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </motion.div>

      {/* ─── View Dialog ──────────────────────────────── */}
      <Dialog open={!!viewTeacher} onOpenChange={(open) => !open && setViewTeacher(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("teachers.teacherDetails")}</DialogTitle>
            <DialogDescription>{t("common.details")}</DialogDescription>
          </DialogHeader>
          {viewTeacher && (
            <div className="space-y-4 mt-2">
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14">
                  <AvatarFallback className={`text-lg font-bold ${getAvatarColor(viewTeacher.id)}`}>
                    {getInitials(viewTeacher)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-heading text-lg font-bold">{viewTeacher.prenom} {viewTeacher.nom}</p>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusConfig[viewTeacher.statut]?.bg} ${statusConfig[viewTeacher.statut]?.text}`}>
                    {viewTeacher.statut}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">{t("teachers.speciality")}</p>
                  <p className="font-medium">{viewTeacher.specialite}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t("common.gender")}</p>
                  <p className="font-medium">{viewTeacher.sexe === "M" ? t("common.male") : t("common.female")}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t("common.dateOfBirth")}</p>
                  <p className="font-medium">{viewTeacher.dateNaissance}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t("common.phone")}</p>
                  <p className="font-medium">{viewTeacher.telephone}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t("common.email")}</p>
                  <p className="font-medium">{viewTeacher.email}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t("teachers.hireDate")}</p>
                  <p className="font-medium">{viewTeacher.dateEmbauche}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirmation Dialog ───────────────── */}
      <Dialog open={!!deleteTeacherTarget} onOpenChange={(open) => !open && setDeleteTeacherTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer l'enseignant{" "}
              <span className="font-semibold text-foreground">
                {deleteTeacherTarget?.prenom} {deleteTeacherTarget?.nom}
              </span>{" "}
              ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2">
            <DialogClose asChild>
              <Button variant="outline">Annuler</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleDelete}>Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Excel Import Dialog ──────────────────────── */}
      <ExcelImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImport={importTeachers}
      />

      {/* ─── Disponibilités Dialog ────────────────────── */}
      {dispoTeacher && (
        <DisponibiliteGrid
          open={!!dispoTeacher}
          onClose={() => setDispoTeacher(null)}
          enseignantId={dispoTeacher.id}
          enseignantName={`${dispoTeacher.prenom} ${dispoTeacher.nom}`}
        />
      )}
    </div>
  );
}
