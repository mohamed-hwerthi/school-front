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
  ChevronLeft,
  ChevronRight,
  UserCheck,
  UserX,
  GraduationCap,
  MoreHorizontal,
  X,
  Briefcase,
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
import { usePersonnelList, useDeletePersonnel } from "@/hooks/usePersonnel";
import { TeachersListSkeleton } from "@/components/skeletons/TeachersListSkeleton";
import { STATUTS_PERSONNEL } from "@/types/personnel";
import type { Personnel } from "@/types/personnel";

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

function colorForId(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash + id.charCodeAt(i)) % avatarColors.length;
  return avatarColors[hash];
}

export default function PersonnelPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { data: personnel = [], isLoading } = usePersonnelList();
  const deletePersonnel = useDeletePersonnel();

  const [search, setSearch] = useState("");
  const [filterFonction, setFilterFonction] = useState("all");
  const [filterStatut, setFilterStatut] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const [viewItem, setViewItem] = useState<Personnel | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Personnel | null>(null);

  // Distinct fonctions present in the data (for the filter dropdown).
  const fonctions = useMemo(
    () => Array.from(new Set(personnel.map((p) => p.fonction).filter(Boolean))).sort(),
    [personnel]
  );

  const filtered = useMemo(() => {
    return personnel.filter((p) => {
      const matchSearch =
        search === "" ||
        `${p.prenom} ${p.nom}`.toLowerCase().includes(search.toLowerCase()) ||
        p.fonction.toLowerCase().includes(search.toLowerCase()) ||
        p.email.toLowerCase().includes(search.toLowerCase());
      const matchFonction = filterFonction === "all" || p.fonction === filterFonction;
      const matchStatut = filterStatut === "all" || p.statut === filterStatut;
      return matchSearch && matchFonction && matchStatut;
    });
  }, [personnel, search, filterFonction, filterStatut]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const total = personnel.length;
  const actifs = personnel.filter((p) => p.statut === "Actif").length;
  const inactifs = personnel.filter((p) => p.statut === "Inactif").length;
  const hommes = personnel.filter((p) => p.sexe === "M").length;
  const femmes = personnel.filter((p) => p.sexe === "F").length;

  const stats = [
    { label: t("personnel.totalPersonnel"), value: total, icon: Users, color: "bg-blue-500", bgLight: "bg-blue-50", textColor: "text-blue-700" },
    { label: t("common.active"), value: actifs, icon: UserCheck, color: "bg-emerald-500", bgLight: "bg-emerald-50", textColor: "text-emerald-700" },
    { label: t("common.inactive"), value: inactifs, icon: UserX, color: "bg-orange-500", bgLight: "bg-orange-50", textColor: "text-orange-700" },
    { label: t("common.men"), value: hommes, icon: GraduationCap, color: "bg-purple-500", bgLight: "bg-purple-50", textColor: "text-purple-700" },
    { label: t("common.women"), value: femmes, icon: GraduationCap, color: "bg-pink-500", bgLight: "bg-pink-50", textColor: "text-pink-700" },
  ];

  const resetFilters = () => {
    setSearch("");
    setFilterFonction("all");
    setFilterStatut("all");
    setCurrentPage(1);
  };
  const hasFilters = search || filterFonction !== "all" || filterStatut !== "all";

  const handleDelete = () => {
    if (!deleteTarget) return;
    deletePersonnel.mutate(deleteTarget.id);
    setDeleteTarget(null);
  };

  const getInitials = (p: Personnel) => `${p.prenom[0] ?? ""}${p.nom[0] ?? ""}`.toUpperCase();

  const statusConfig: Record<string, { bg: string; text: string }> = {
    Actif: { bg: "bg-emerald-100", text: "text-emerald-700" },
    Inactif: { bg: "bg-red-100", text: "text-red-700" },
    "En attente": { bg: "bg-amber-100", text: "text-amber-700" },
  };

  if (isLoading) return <TeachersListSkeleton />;

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
            {t("personnel.title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t("personnel.subtitle")}</p>
        </div>
        <PermissionGate perms={["MANAGE_RH"]}>
          <Button
            size="sm"
            className="gap-1.5 bg-gradient-primary shadow-btn"
            onClick={() => navigate("/dashboard/personnel/ajouter")}
          >
            <UserPlus className="h-4 w-4" />
            {t("personnel.addPersonnel")}
          </Button>
        </PermissionGate>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
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
      <motion.div custom={6} variants={fadeUp} initial="hidden" animate="visible" className="rounded-xl border border-border/50 bg-card p-4 shadow-sm">
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
            <Select value={filterFonction} onValueChange={(v) => { setFilterFonction(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-3.5 w-3.5 me-1.5 text-muted-foreground" />
                <SelectValue placeholder={t("personnel.fonction")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.all")}</SelectItem>
                {fonctions.map((f) => (<SelectItem key={f} value={f}>{f}</SelectItem>))}
              </SelectContent>
            </Select>
            <Select value={filterStatut} onValueChange={(v) => { setFilterStatut(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder={t("common.status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.allStatuses")}</SelectItem>
                {STATUTS_PERSONNEL.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
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
        <div className="mt-2 text-xs text-muted-foreground">{filtered.length} {t("common.found")}</div>
      </motion.div>

      {/* Table */}
      <motion.div custom={7} variants={fadeUp} initial="hidden" animate="visible" className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground">{t("personnel.employee")}</th>
                <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground hidden sm:table-cell">{t("personnel.fonction")}</th>
                <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground hidden md:table-cell">{t("common.phone")}</th>
                <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground">{t("common.status")}</th>
                <th className="py-3 px-4 text-end text-xs font-semibold text-muted-foreground">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-muted-foreground">
                    <Briefcase className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">{t("personnel.noPersonnelFound")}</p>
                    <p className="text-xs mt-1">{t("common.tryModifyFilters")}</p>
                  </td>
                </tr>
              ) : (
                paginated.map((p) => (
                  <tr key={p.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className={`text-xs font-semibold ${colorForId(p.id)}`}>
                            {getInitials(p)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">{p.prenom} {p.nom}</p>
                          <p className="text-xs text-muted-foreground">{p.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 hidden sm:table-cell">
                      <Badge variant="outline" className="font-medium">{p.fonction}</Badge>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell text-muted-foreground">{p.telephone}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusConfig[p.statut]?.bg} ${statusConfig[p.statut]?.text}`}>
                        {p.statut}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-end">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-blue-600" onClick={() => setViewItem(p)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <PermissionGate perms={["MANAGE_RH"]}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-amber-600"
                            onClick={() => navigate(`/dashboard/personnel/modifier/${p.id}`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-600" onClick={() => setDeleteTarget(p)}>
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
                            <DropdownMenuItem onClick={() => setViewItem(p)}>
                              <Eye className="h-4 w-4 me-2" /> {t("common.view")}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/dashboard/personnel/modifier/${p.id}`)}>
                              <Edit className="h-4 w-4 me-2" /> {t("common.edit")}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setDeleteTarget(p)} className="text-red-600">
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
            <p className="text-xs text-muted-foreground">{t("common.page")} {currentPage} {t("common.of")} {totalPages}</p>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button key={page} variant={page === currentPage ? "default" : "outline"} size="icon" className="h-8 w-8 text-xs" onClick={() => setCurrentPage(page)}>
                  {page}
                </Button>
              ))}
              <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </motion.div>

      {/* View Dialog */}
      <Dialog open={!!viewItem} onOpenChange={(open) => !open && setViewItem(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("personnel.personnelDetails")}</DialogTitle>
            <DialogDescription>{t("common.details")}</DialogDescription>
          </DialogHeader>
          {viewItem && (
            <div className="space-y-4 mt-2">
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14">
                  <AvatarFallback className={`text-lg font-bold ${colorForId(viewItem.id)}`}>
                    {getInitials(viewItem)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-heading text-lg font-bold">{viewItem.prenom} {viewItem.nom}</p>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusConfig[viewItem.statut]?.bg} ${statusConfig[viewItem.statut]?.text}`}>
                    {viewItem.statut}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">{t("personnel.fonction")}</p>
                  <p className="font-medium">{viewItem.fonction}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t("common.gender")}</p>
                  <p className="font-medium">{viewItem.sexe === "M" ? t("common.male") : t("common.female")}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t("common.dateOfBirth")}</p>
                  <p className="font-medium">{viewItem.dateNaissance || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t("common.phone")}</p>
                  <p className="font-medium">{viewItem.telephone || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t("common.email")}</p>
                  <p className="font-medium">{viewItem.email || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t("teachers.hireDate")}</p>
                  <p className="font-medium">{viewItem.dateEmbauche || "—"}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("common.confirmDeletion")}</DialogTitle>
            <DialogDescription>
              {t("personnel.confirmDeleteText")}{" "}
              <span className="font-semibold text-foreground">
                {deleteTarget?.prenom} {deleteTarget?.nom}
              </span>{" "}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2">
            <DialogClose asChild>
              <Button variant="outline">{t("common.cancel")}</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleDelete}>{t("common.delete")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
