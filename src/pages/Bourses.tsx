import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { validate, type FormErrors } from "@/lib/validate";
import { bourseSchema } from "@/lib/services-schemas";
import {
  GraduationCap,
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  X,
  Users,
  DollarSign,
  PauseCircle,
} from "lucide-react";
import { notify } from "@/lib/toast";
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
  useBourses,
  useCreateBourse,
  useUpdateBourse,
  useDeleteBourse,
} from "@/hooks/useBourses";
import type { BourseDTO, BourseRequest } from "@/api/bourses.api";
import { CURRENCY } from "@/config/currency";
import { useLanguage } from "@/hooks/useLanguage";

const ANNEES = ["2025-2026", "2024-2025", "2023-2024"];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.35 },
  }),
};

const TYPE_LABELS: Record<string, string> = {
  BOURSE: "Bourse",
  AIDE: "Aide",
  EXONERATION: "Exoneration",
};

const STATUT_LABELS: Record<string, string> = {
  ACTIVE: "Active",
  SUSPENDUE: "Suspendue",
  TERMINEE: "Terminee",
};

const STATUT_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  ACTIVE: "default",
  SUSPENDUE: "secondary",
  TERMINEE: "outline",
};

export default function Bourses() {
  const { t } = useLanguage();
  const [anneeScolaire, setAnneeScolaire] = useState(ANNEES[0]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatut, setFilterStatut] = useState("all");

  const { data: boursesData = [], isLoading } = useBourses(anneeScolaire);
  const createBourse = useCreateBourse();
  const updateBourse = useUpdateBourse();
  const deletebourseMutation = useDeleteBourse();

  // Dialog states
  const [viewBourse, setViewBourse] = useState<BourseDTO | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editBourse, setEditBourse] = useState<BourseDTO | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BourseDTO | null>(null);

  // Form state
  const emptyForm: BourseRequest = {
    studentId: 0,
    type: "BOURSE",
    label: "",
    montant: 0,
    pourcentage: null,
    anneeScolaire,
    statut: "ACTIVE",
    dateDebut: null,
    dateFin: null,
    motif: "",
  };
  const [form, setForm] = useState<BourseRequest>(emptyForm);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  // Filter bourses
  const filteredBourses = useMemo(() => {
    return boursesData.filter((b) => {
      const matchSearch =
        !search ||
        b.label.toLowerCase().includes(search.toLowerCase()) ||
        b.studentName.toLowerCase().includes(search.toLowerCase());
      const matchType = filterType === "all" || b.type === filterType;
      const matchStatut = filterStatut === "all" || b.statut === filterStatut;
      return matchSearch && matchType && matchStatut;
    });
  }, [boursesData, search, filterType, filterStatut]);

  // Stats
  const stats = useMemo(() => {
    const active = boursesData.filter((b) => b.statut === "ACTIVE");
    const totalMontant = active.reduce((sum, b) => sum + b.montant, 0);
    const totalBeneficiaires = new Set(active.map((b) => b.studentId)).size;
    const suspended = boursesData.filter((b) => b.statut === "SUSPENDUE").length;
    return { totalMontant, totalBeneficiaires, activeCount: active.length, suspended };
  }, [boursesData]);

  const resetFilters = () => {
    setSearch("");
    setFilterType("all");
    setFilterStatut("all");
  };

  const openAdd = () => {
    setForm({ ...emptyForm, anneeScolaire });
    setAddDialogOpen(true);
  };

  const openEdit = (b: BourseDTO) => {
    setForm({
      studentId: b.studentId,
      type: b.type,
      label: b.label,
      montant: b.montant,
      pourcentage: b.pourcentage,
      anneeScolaire: b.anneeScolaire,
      statut: b.statut,
      dateDebut: b.dateDebut,
      dateFin: b.dateFin,
      motif: b.motif,
    });
    setEditBourse(b);
  };

  const handleCreate = () => {
    const result = validate(bourseSchema, form);
    if (!result.ok) { setFormErrors(result.errors); return; }
    setFormErrors({});
    createBourse.mutate(form, {
      onSuccess: () => {
        notify.success("Bourse ajoutee");
        setAddDialogOpen(false);
      },
      onError: (err: Error & { response?: { data?: { message?: string } } }) => {
        setFormErrors({ _root: err.response?.data?.message ?? err.message });
      },
    });
  };

  const handleUpdate = () => {
    if (!editBourse) return;
    updateBourse.mutate(
      { id: editBourse.id, data: form },
      {
        onSuccess: () => {
          notify.success("Bourse modifiee");
          setEditBourse(null);
        },
        onError: (err) => notify.error(err.message),
      }
    );
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deletebourseMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        notify.success("Bourse supprimee");
        setDeleteTarget(null);
      },
      onError: (err) => notify.error(err.message),
    });
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
        <div className="h-64 bg-muted animate-pulse rounded-xl" />
      </div>
    );
  }

  const formFields = (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>ID Eleve *</Label>
          <Input
            type="number"
            value={form.studentId || ""}
            onChange={(e) => setForm({ ...form, studentId: e.target.value })}
            placeholder="ID de l'eleve"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Type *</Label>
          <Select
            value={form.type}
            onValueChange={(v) =>
              setForm({ ...form, type: v as "BOURSE" | "AIDE" | "EXONERATION" })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Choisir" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BOURSE">Bourse</SelectItem>
              <SelectItem value="AIDE">Aide</SelectItem>
              <SelectItem value="EXONERATION">Exoneration</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Libelle *</Label>
          <Input
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
            placeholder="Ex: Bourse d'excellence"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Montant ({CURRENCY}) *</Label>
          <Input
            type="number"
            value={form.montant || ""}
            onChange={(e) => setForm({ ...form, montant: Number(e.target.value) })}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Pourcentage (%)</Label>
          <Input
            type="number"
            value={form.pourcentage ?? ""}
            onChange={(e) =>
              setForm({
                ...form,
                pourcentage: e.target.value ? Number(e.target.value) : null,
              })
            }
            placeholder="Ex: 50"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Statut</Label>
          <Select
            value={form.statut ?? "ACTIVE"}
            onValueChange={(v) =>
              setForm({ ...form, statut: v as "ACTIVE" | "SUSPENDUE" | "TERMINEE" })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="SUSPENDUE">Suspendue</SelectItem>
              <SelectItem value="TERMINEE">Terminee</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Date debut</Label>
          <Input
            type="date"
            value={form.dateDebut ?? ""}
            onChange={(e) =>
              setForm({ ...form, dateDebut: e.target.value || null })
            }
          />
        </div>
        <div className="space-y-1.5">
          <Label>Date fin</Label>
          <Input
            type="date"
            value={form.dateFin ?? ""}
            onChange={(e) =>
              setForm({ ...form, dateFin: e.target.value || null })
            }
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Motif</Label>
          <Textarea
            value={form.motif ?? ""}
            onChange={(e) => setForm({ ...form, motif: e.target.value })}
            rows={2}
            placeholder="Raison d'attribution de la bourse..."
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 p-1">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {t("scholarships.title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestion des bourses, aides et exonerations — {anneeScolaire}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={anneeScolaire} onValueChange={setAnneeScolaire}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ANNEES.map((a) => (
                <SelectItem key={a} value={a}>
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button className="bg-gradient-primary shadow-btn gap-2" onClick={openAdd}>
            <Plus className="h-4 w-4" /> {t("scholarships.newScholarship")}
          </Button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0}
          className="rounded-xl border border-green-200 bg-gradient-to-br from-green-50 to-white p-5 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-100 p-2.5">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-green-600 font-medium">{t("scholarships.totalGranted")}</p>
              <p className="text-xl font-bold text-green-700">
                {stats.totalMontant.toLocaleString()} {CURRENCY}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={1}
          className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-5 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-2.5">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-blue-600 font-medium">{t("scholarships.beneficiaries")}</p>
              <p className="text-xl font-bold text-blue-700">
                {stats.totalBeneficiaires}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={2}
          className="rounded-xl border border-border/50 bg-card p-5 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-100 p-2.5">
              <GraduationCap className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">{t("scholarships.activeScholarships")}</p>
              <p className="text-xl font-bold text-foreground">{stats.activeCount}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={3}
          className="rounded-xl border border-border/50 bg-card p-5 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-orange-100 p-2.5">
              <PauseCircle className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">{t("scholarships.suspended")}</p>
              <p className="text-xl font-bold text-foreground">{stats.suspended}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("scholarships.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ps-9"
          />
        </div>
        <Select
          value={filterType}
          onValueChange={setFilterType}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            <SelectItem value="BOURSE">Bourse</SelectItem>
            <SelectItem value="AIDE">Aide</SelectItem>
            <SelectItem value="EXONERATION">Exoneration</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filterStatut}
          onValueChange={setFilterStatut}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="SUSPENDUE">Suspendue</SelectItem>
            <SelectItem value="TERMINEE">Terminee</SelectItem>
          </SelectContent>
        </Select>
        {(search || filterType !== "all" || filterStatut !== "all") && (
          <Button variant="ghost" size="sm" onClick={resetFilters} className="gap-1">
            <X className="h-3.5 w-3.5" /> Reinitialiser
          </Button>
        )}
        <span className="ms-auto text-xs text-muted-foreground">
          {filteredBourses.length} bourse{filteredBourses.length > 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="py-3 px-4 text-start font-semibold text-muted-foreground">
                  Eleve
                </th>
                <th className="py-3 px-4 text-start font-semibold text-muted-foreground">
                  Libelle
                </th>
                <th className="py-3 px-4 text-start font-semibold text-muted-foreground">
                  Type
                </th>
                <th className="py-3 px-4 text-end font-semibold text-muted-foreground">
                  Montant
                </th>
                <th className="py-3 px-4 text-start font-semibold text-muted-foreground">
                  Statut
                </th>
                <th className="py-3 px-4 text-start font-semibold text-muted-foreground">
                  Periode
                </th>
                <th className="py-3 px-4 text-center font-semibold text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredBourses.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-12 text-center text-muted-foreground"
                  >
                    {t("scholarships.noScholarship")}
                  </td>
                </tr>
              ) : (
                filteredBourses.map((b) => (
                  <tr
                    key={b.id}
                    className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors"
                  >
                    <td className="py-3 px-4 font-medium text-foreground">
                      {b.studentName}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{b.label}</td>
                    <td className="py-3 px-4">
                      <Badge variant="secondary" className="text-xs">
                        {TYPE_LABELS[b.type] || b.type}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-end font-semibold text-green-600 whitespace-nowrap">
                      {b.montant.toLocaleString()} {CURRENCY}
                      {b.pourcentage != null && (
                        <span className="text-xs text-muted-foreground ms-1">
                          ({b.pourcentage}%)
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={STATUT_VARIANT[b.statut] || "outline"}
                        className="text-xs"
                      >
                        {STATUT_LABELS[b.statut] || b.statut}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">
                      {b.dateDebut
                        ? new Date(b.dateDebut).toLocaleDateString("fr-FR")
                        : "--"}
                      {" - "}
                      {b.dateFin
                        ? new Date(b.dateFin).toLocaleDateString("fr-FR")
                        : "--"}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setViewBourse(b)}>
                            <Eye className="h-3.5 w-3.5 me-2" /> Voir
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEdit(b)}>
                            <Edit className="h-3.5 w-3.5 me-2" /> Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeleteTarget(b)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5 me-2" /> Supprimer
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
      </div>

      {/* View Dialog */}
      <Dialog open={!!viewBourse} onOpenChange={() => setViewBourse(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("scholarships.scholarshipDetail")}</DialogTitle>
          </DialogHeader>
          {viewBourse && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-muted-foreground">Eleve :</span>{" "}
                  <strong>{viewBourse.studentName}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground">Type :</span>{" "}
                  <strong>{TYPE_LABELS[viewBourse.type]}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground">Libelle :</span>{" "}
                  <strong>{viewBourse.label}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground">Montant :</span>{" "}
                  <strong className="text-green-600">
                    {viewBourse.montant.toLocaleString()} {CURRENCY}
                  </strong>
                </div>
                {viewBourse.pourcentage != null && (
                  <div>
                    <span className="text-muted-foreground">Pourcentage :</span>{" "}
                    <strong>{viewBourse.pourcentage}%</strong>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Statut :</span>{" "}
                  <Badge variant={STATUT_VARIANT[viewBourse.statut]} className="text-xs ms-1">
                    {STATUT_LABELS[viewBourse.statut]}
                  </Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">Debut :</span>{" "}
                  <strong>
                    {viewBourse.dateDebut
                      ? new Date(viewBourse.dateDebut).toLocaleDateString("fr-FR")
                      : "--"}
                  </strong>
                </div>
                <div>
                  <span className="text-muted-foreground">Fin :</span>{" "}
                  <strong>
                    {viewBourse.dateFin
                      ? new Date(viewBourse.dateFin).toLocaleDateString("fr-FR")
                      : "--"}
                  </strong>
                </div>
              </div>
              {viewBourse.motif && (
                <div>
                  <span className="text-muted-foreground">Motif :</span>
                  <p className="mt-1">{viewBourse.motif}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Fermer</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nouvelle bourse</DialogTitle>
            <DialogDescription>
              Attribuer une bourse, aide ou exoneration a un eleve
            </DialogDescription>
          </DialogHeader>
          {formFields}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Annuler</Button>
            </DialogClose>
            <Button
              className="bg-gradient-primary shadow-btn"
              onClick={handleCreate}
              disabled={createBourse.isPending}
            >
              {createBourse.isPending ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editBourse} onOpenChange={() => setEditBourse(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifier la bourse</DialogTitle>
          </DialogHeader>
          {formFields}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Annuler</Button>
            </DialogClose>
            <Button
              className="bg-gradient-primary shadow-btn"
              onClick={handleUpdate}
              disabled={updateBourse.isPending}
            >
              {updateBourse.isPending ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Voulez-vous vraiment supprimer la bourse "{deleteTarget?.label}" attribuee a{" "}
              {deleteTarget?.studentName} ? Cette action est irreversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Annuler</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deletebourseMutation.isPending}
            >
              {deletebourseMutation.isPending ? "Suppression..." : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
