import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  GraduationCap,
  Search,
  Plus,
  Edit,
  Trash2,
  MoreHorizontal,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Users,
  CalendarDays,
  MapPin,
  UserPlus,
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
  useFormations,
  useCreateFormation,
  useUpdateFormation,
  useDeleteFormation,
  useAddParticipant,
  useRemoveParticipant,
} from "@/hooks/useRh";
import { useTeachers } from "@/hooks/useTeachers";
import { useAllUsers } from "@/hooks/useUsers";
import type {
  Formation,
  CreateFormationRequest,
  StatutFormation,
  AddParticipantRequest,
} from "@/types/rh";

const STATUT_COLORS: Record<StatutFormation, string> = {
  PLANIFIEE: "bg-blue-100 text-blue-700",
  EN_COURS: "bg-amber-100 text-amber-700",
  TERMINEE: "bg-emerald-100 text-emerald-700",
  ANNULEE: "bg-red-100 text-red-700",
};

const ITEMS_PER_PAGE = 10;

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.35 },
  }),
};

export default function FormationsPage() {
  const { t } = useLanguage();

  const STATUT_LABELS: Record<StatutFormation, string> = {
    PLANIFIEE: t("training.statuses.planned"),
    EN_COURS: t("training.statuses.inProgress"),
    TERMINEE: t("training.statuses.completed"),
    ANNULEE: t("training.statuses.cancelled"),
  };

  const [search, setSearch] = useState("");
  const [filterStatut, setFilterStatut] = useState("all");
  const [currentPage, setCurrentPage] = useState(0);

  // Formation form
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Formation | null>(null);
  const [form, setForm] = useState<CreateFormationRequest>({
    titre: "",
    description: "",
    formateur: "",
    dateDebut: "",
    dateFin: "",
    lieu: "",
    nombreHeures: undefined,
    cout: undefined,
    statut: "PLANIFIEE",
  });

  // Participant form
  const [participantDialogOpen, setParticipantDialogOpen] = useState(false);
  const [selectedFormationId, setSelectedFormationId] = useState<number | null>(
    null
  );
  const [participantForm, setParticipantForm] = useState<AddParticipantRequest>(
    {
      employeId: 0,
      employeType: "ENSEIGNANT",
      present: false,
      certificatObtenu: false,
    }
  );

  const [deleteTarget, setDeleteTarget] = useState<Formation | null>(null);

  const { data: formations = [], isLoading } = useFormations();
  const createMutation = useCreateFormation();
  const updateMutation = useUpdateFormation();
  const deleteMutation = useDeleteFormation();
  const addParticipantMutation = useAddParticipant();
  const removeParticipantMutation = useRemoveParticipant();

  // Live lookup so the modal reflects mutations (add/remove participant)
  const selectedFormation = useMemo(
    () => formations.find((f) => f.id === selectedFormationId) ?? null,
    [formations, selectedFormationId]
  );

  // Backing data for the participant employé selector
  const { teachers } = useTeachers();
  const { data: allUsers = [] } = useAllUsers();

  // Candidates depend on the chosen employeType
  const employeCandidates = useMemo(() => {
    if (participantForm.employeType === "ENSEIGNANT") {
      return teachers.map((t) => ({
        id: t.id,
        label: `${t.prenom} ${t.nom}${t.specialite ? ` — ${t.specialite}` : ""}`,
      }));
    }
    if (participantForm.employeType === "ADMIN") {
      return allUsers
        .filter((u) => ["SUPER_ADMIN", "ADMIN", "DIRECTEUR"].includes(u.role))
        .map((u) => ({
          id: u.id,
          label: `${u.firstName} ${u.lastName} — ${u.role}`,
        }));
    }
    // PERSONNEL: comptables for now
    return allUsers
      .filter((u) => u.role === "COMPTABLE")
      .map((u) => ({
        id: u.id,
        label: `${u.firstName} ${u.lastName} — ${u.role}`,
      }));
  }, [participantForm.employeType, teachers, allUsers]);

  const filtered = useMemo(() => {
    let list = formations;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (f) =>
          f.titre.toLowerCase().includes(q) ||
          (f.formateur && f.formateur.toLowerCase().includes(q)) ||
          (f.lieu && f.lieu.toLowerCase().includes(q))
      );
    }
    if (filterStatut !== "all") {
      list = list.filter((f) => f.statut === filterStatut);
    }
    return list;
  }, [formations, search, filterStatut]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE
  );

  const stats = [
    {
      label: t("training.totalTrainings"),
      value: formations.length,
      icon: GraduationCap,
      color: "bg-blue-50",
      textColor: "text-blue-700",
    },
    {
      label: t("training.statuses.inProgress"),
      value: formations.filter((f) => f.statut === "EN_COURS").length,
      icon: CalendarDays,
      color: "bg-amber-50",
      textColor: "text-amber-700",
    },
    {
      label: t("training.completed"),
      value: formations.filter((f) => f.statut === "TERMINEE").length,
      icon: GraduationCap,
      color: "bg-emerald-50",
      textColor: "text-emerald-700",
    },
    {
      label: t("training.participants"),
      value: formations.reduce(
        (sum, f) => sum + (f.participants?.length ?? 0),
        0
      ),
      icon: Users,
      color: "bg-purple-50",
      textColor: "text-purple-700",
    },
  ];

  const openCreate = () => {
    setEditTarget(null);
    setForm({
      titre: "",
      description: "",
      formateur: "",
      dateDebut: "",
      dateFin: "",
      lieu: "",
      nombreHeures: undefined,
      cout: undefined,
      statut: "PLANIFIEE",
    });
    setFormOpen(true);
  };

  const openEdit = (f: Formation) => {
    setEditTarget(f);
    setForm({
      titre: f.titre,
      description: f.description ?? "",
      formateur: f.formateur ?? "",
      dateDebut: f.dateDebut,
      dateFin: f.dateFin ?? "",
      lieu: f.lieu ?? "",
      nombreHeures: f.nombreHeures,
      cout: f.cout,
      statut: f.statut,
    });
    setFormOpen(true);
  };

  const openParticipantDialog = (f: Formation) => {
    setSelectedFormationId(f.id);
    setParticipantForm({
      employeId: 0,
      employeType: "ENSEIGNANT",
      present: false,
      certificatObtenu: false,
    });
    setParticipantDialogOpen(true);
  };

  const handleSave = () => {
    const payload: CreateFormationRequest = {
      ...form,
      dateFin: form.dateFin || undefined,
      description: form.description || undefined,
      formateur: form.formateur || undefined,
      lieu: form.lieu || undefined,
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

  const handleAddParticipant = () => {
    if (!selectedFormation) return;
    addParticipantMutation.mutate(
      { formationId: selectedFormation.id, data: participantForm },
      {
        onSuccess: () => {
          setParticipantForm({
            employeId: 0,
            employeType: "ENSEIGNANT",
            present: false,
            certificatObtenu: false,
          });
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
            {t("training.title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t("training.subtitle")}
          </p>
        </div>
        <Button
          size="sm"
          className="gap-1.5 bg-gradient-primary shadow-btn"
          onClick={openCreate}
        >
          <Plus className="h-4 w-4" />
          {t("training.newTraining")}
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
          <div className="relative flex-1 min-w-0">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(0);
              }}
              placeholder={t("training.searchPlaceholder")}
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
              {(Object.keys(STATUT_LABELS) as StatutFormation[]).map((s) => (
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
                  {t("common.title")}
                </th>
                <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground hidden sm:table-cell">
                  {t("training.trainer")}
                </th>
                <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground hidden md:table-cell">
                  {t("common.date")}
                </th>
                <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground hidden lg:table-cell">
                  {t("training.location")}
                </th>
                <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground hidden lg:table-cell">
                  {t("training.participants")}
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
                    <GraduationCap className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">{t("training.noTraining")}</p>
                  </td>
                </tr>
              ) : (
                paginated.map((f) => (
                  <tr
                    key={f.id}
                    className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="font-medium text-foreground">
                        {f.titre}
                      </div>
                      {f.nombreHeures && (
                        <span className="text-xs text-muted-foreground">
                          {f.nombreHeures}h
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 hidden sm:table-cell text-muted-foreground">
                      {f.formateur ?? "-"}
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell text-muted-foreground">
                      <div className="text-xs">
                        {new Date(f.dateDebut).toLocaleDateString("fr-FR")}
                        {f.dateFin && (
                          <>
                            {" "}
                            - {new Date(f.dateFin).toLocaleDateString("fr-FR")}
                          </>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 hidden lg:table-cell text-muted-foreground">
                      {f.lieu ? (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {f.lieu}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="py-3 px-4 hidden lg:table-cell">
                      <Badge variant="outline" className="gap-1">
                        <Users className="h-3 w-3" />
                        {f.participants?.length ?? 0}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUT_COLORS[f.statut]}`}
                      >
                        {STATUT_LABELS[f.statut]}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-end">
                      <div className="hidden sm:flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-blue-600"
                          onClick={() => openParticipantDialog(f)}
                          title={t("training.manageParticipants")}
                        >
                          <UserPlus className="h-4 w-4" />
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
                          <DropdownMenuItem
                            onClick={() => openParticipantDialog(f)}
                          >
                            <UserPlus className="h-4 w-4 me-2" /> {t("training.participants")}
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

      {/* Create / Edit Formation Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editTarget ? t("training.editTraining") : t("training.newTraining")}
            </DialogTitle>
            <DialogDescription>
              {editTarget
                ? t("training.editInfo")
                : t("training.createTraining")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="titre">{t("common.title")}</Label>
              <Input
                id="titre"
                value={form.titre}
                onChange={(e) => setForm({ ...form, titre: e.target.value })}
                placeholder={t("training.trainingTitle")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">{t("common.description")}</Label>
              <Textarea
                id="description"
                value={form.description ?? ""}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Description..."
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="formateur">{t("training.trainer")}</Label>
                <Input
                  id="formateur"
                  value={form.formateur ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, formateur: e.target.value })
                  }
                  placeholder={t("training.trainerName")}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lieu">{t("training.location")}</Label>
                <Input
                  id="lieu"
                  value={form.lieu ?? ""}
                  onChange={(e) => setForm({ ...form, lieu: e.target.value })}
                  placeholder={t("training.location")}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="dateDebut">{t("common.startDate")}</Label>
                <Input
                  id="dateDebut"
                  type="date"
                  value={form.dateDebut}
                  onChange={(e) =>
                    setForm({ ...form, dateDebut: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dateFin">{t("common.endDate")}</Label>
                <Input
                  id="dateFin"
                  type="date"
                  value={form.dateFin ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, dateFin: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="nombreHeures">{t("training.hours")}</Label>
                <Input
                  id="nombreHeures"
                  type="number"
                  value={form.nombreHeures ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      nombreHeures: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    })
                  }
                  placeholder="0"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cout">{t("training.cost")}</Label>
                <Input
                  id="cout"
                  type="number"
                  value={form.cout ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      cout: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  placeholder="0"
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t("common.status")}</Label>
                <Select
                  value={form.statut}
                  onValueChange={(v) =>
                    setForm({ ...form, statut: v as StatutFormation })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(STATUT_LABELS) as StatutFormation[]).map(
                      (s) => (
                        <SelectItem key={s} value={s}>
                          {STATUT_LABELS[s]}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>
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
                !form.titre ||
                !form.dateDebut
              }
            >
              {createMutation.isPending || updateMutation.isPending
                ? t("common.saving")
                : t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Participants Dialog */}
      <Dialog
        open={participantDialogOpen}
        onOpenChange={(o) => {
          setParticipantDialogOpen(o);
          if (!o) setSelectedFormationId(null);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {t("training.participants")} - {selectedFormation?.titre}
            </DialogTitle>
            <DialogDescription>
              {t("training.manageParticipants")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Existing participants */}
            {selectedFormation?.participants &&
            selectedFormation.participants.length > 0 ? (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  {t("training.participants")}
                </Label>
                <div className="max-h-[200px] overflow-y-auto space-y-1.5">
                  {selectedFormation.participants.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between rounded-lg border border-border/50 p-2.5"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          #{p.employeId}
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          {p.employeType}
                        </Badge>
                        {p.present && (
                          <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">
                            Present
                          </Badge>
                        )}
                        {p.certificatObtenu && (
                          <Badge className="bg-blue-100 text-blue-700 text-[10px]">
                            Certifie
                          </Badge>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-red-600"
                        onClick={() =>
                          removeParticipantMutation.mutate(p.id)
                        }
                        disabled={removeParticipantMutation.isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                {t("common.noData")}
              </p>
            )}

            {/* Add participant form */}
            <div className="border-t border-border pt-4 space-y-3">
              <Label className="text-xs text-muted-foreground">
                {t("training.addParticipant")}
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Type</Label>
                  <Select
                    value={participantForm.employeType}
                    onValueChange={(v) =>
                      setParticipantForm({
                        ...participantForm,
                        employeType: v,
                        employeId: 0, // reset selected employé when type changes
                      })
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
                  <Label htmlFor="partEmployeId">Employé</Label>
                  <Select
                    value={participantForm.employeId ? String(participantForm.employeId) : ""}
                    onValueChange={(v) =>
                      setParticipantForm({
                        ...participantForm,
                        employeId: v,
                      })
                    }
                    disabled={employeCandidates.length === 0}
                  >
                    <SelectTrigger id="partEmployeId">
                      <SelectValue
                        placeholder={
                          employeCandidates.length === 0
                            ? "Aucun employé disponible"
                            : "Sélectionner…"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {employeCandidates.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                onClick={handleAddParticipant}
                disabled={
                  addParticipantMutation.isPending ||
                  !participantForm.employeId
                }
                className="w-full gap-1.5"
              >
                <UserPlus className="h-4 w-4" />
                {addParticipantMutation.isPending
                  ? t("training.adding")
                  : t("training.addParticipant")}
              </Button>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">{t("common.close")}</Button>
            </DialogClose>
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
            <DialogTitle>{t("training.deleteTraining")}</DialogTitle>
            <DialogDescription>
              {t("common.deleteConfirmMsg")} &quot;{deleteTarget?.titre}&quot; ? {t("common.irreversible")}
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
