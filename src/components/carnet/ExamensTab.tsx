import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { useCarnetSelection } from "./CarnetSelectionContext";
import {
  Plus,
  Edit,
  Trash2,
  ClipboardCheck,
  GraduationCap,
  Search,
  Eye,
  CheckCircle2,
  Clock,
} from "lucide-react";
import ExamenDetailsSheet from "./ExamenDetailsSheet";
import { notify } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { useNiveaux } from "@/hooks/useNiveaux";
import { useClasses } from "@/hooks/useClasses";
import { useModules } from "@/hooks/useModules";
import {
  useExamensRaw,
  useCreateExamen,
  useUpdateExamen,
  useDeleteExamen,
  useDeleteExamensBulk,
} from "@/hooks/useExamens";
import { useTeachers } from "@/hooks/useTeachers";
import { useCurrentTrimestre } from "@/hooks/useAnneeScolaire";
import type { ExamenDTO, ExamenRequest } from "@/api/examens.api";

const emptyForm: ExamenRequest = {
  name: "",
  namePrive: "",
  coeffEtatique: 1,
  coeffPrive: 1,
  ordreEtatique: 1,
  ordrePrive: 1,
  trimestre: 1,
  classeId: 0,
  teacherId: undefined,
  moduleId: 0,
  versionEtatique: true,
  versionPrivee: true,
};

const TRIMESTRE_OPTIONS = [1, 2, 3] as const;

export default function ExamensTab() {
  const { niveaux } = useNiveaux();
  const { teachers } = useTeachers();

  // Filters
  const { niveauId: filterNiveauId, classeId: filterClasseId, setNiveauId: setFilterNiveauId, setClasseId: setFilterClasseId, goToTab } = useCarnetSelection();
  const [filterModuleId, setFilterModuleId] = useState<number>(0);
  const [filterTrimestre, setFilterTrimestre] = useState<number>(0);
  const [trimestreTouched, setTrimestreTouched] = useState(false);
  const currentTrimestre = useCurrentTrimestre();
  // Préselectionne le trimestre courant tant que l'utilisateur n'a pas
  // explicitement changé le filtre.
  useEffect(() => {
    if (!trimestreTouched && currentTrimestre && filterTrimestre === 0) {
      setFilterTrimestre(currentTrimestre);
    }
  }, [currentTrimestre, trimestreTouched, filterTrimestre]);
  const [filterStatut, setFilterStatut] = useState<"all" | "complete" | "partial" | "empty">("all");
  const [search, setSearch] = useState("");

  // Details drawer
  const [detailsExamen, setDetailsExamen] = useState<ExamenDTO | null>(null);

  const { data: classes = [] } = useClasses(filterNiveauId || undefined);
  const { data: modules = [] } = useModules(filterNiveauId || undefined);
  // Examens are fetched only once a class is selected — prevents loading
  // every exam of every class and trimester in one shot.
  // "0" is the "Toutes/Tous" sentinel of the Select filters; it is NOT a valid
  // UUID, so it must be treated as "no filter" (otherwise the API returns 400).
  const realClasseId = filterClasseId && filterClasseId !== "0" ? filterClasseId : undefined;
  const realModuleId = filterModuleId && String(filterModuleId) !== "0" ? String(filterModuleId) : undefined;
  const hasSelection = !!realClasseId;
  const { data: examens = [], isLoading } = useExamensRaw(
    realModuleId,
    realClasseId,
    filterTrimestre || undefined,
    hasSelection
  );

  // Mutations
  const createExamen = useCreateExamen();
  const updateExamen = useUpdateExamen();
  const deleteExamen = useDeleteExamen();
  const deleteBulk = useDeleteExamensBulk();

  // Dialog state
  const [showDialog, setShowDialog] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<ExamenRequest>({ ...emptyForm });
  const [formNiveauId, setFormNiveauId] = useState<number>(0);
  const { data: formClasses = [] } = useClasses(formNiveauId || undefined);
  const { data: formModules = [] } = useModules(formNiveauId || undefined);
  const [deleteTarget, setDeleteTarget] = useState<ExamenDTO | null>(null);

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Filtered examens
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return examens.filter((e) => {
      // Status filter
      if (filterStatut !== "all") {
        const total = e.nbEleves ?? 0;
        const filled = e.nbNotes ?? 0;
        if (filterStatut === "complete" && (total === 0 || filled < total)) return false;
        if (filterStatut === "empty" && filled > 0) return false;
        if (filterStatut === "partial" && (filled === 0 || filled >= total)) return false;
      }
      // Search filter
      if (!q) return true;
      return (
        e.name.toLowerCase().includes(q) ||
        e.moduleName.toLowerCase().includes(q) ||
        e.classeName.toLowerCase().includes(q) ||
        (e.teacherName?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [examens, search, filterStatut]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((e) => e.id)));
    }
  };

  const openAdd = () => {
    setEditId(null);
    setFormNiveauId(filterNiveauId);
    setForm({
      ...emptyForm,
      classeId: filterClasseId,
      moduleId: filterModuleId,
    });
    setShowDialog(true);
  };

  const openEdit = (e: ExamenDTO) => {
    setEditId(e.id);
    // Find the niveauId from the classe
    const classe = classes.find((c) => c.id === e.classeId);
    setFormNiveauId(classe?.niveauId ?? filterNiveauId);
    setForm({
      name: e.name,
      namePrive: e.namePrive || "",
      coeffEtatique: e.coeffEtatique,
      coeffPrive: e.coeffPrive,
      ordreEtatique: e.ordreEtatique,
      ordrePrive: e.ordrePrive,
      trimestre: e.trimestre,
      classeId: e.classeId,
      teacherId: e.teacherId || undefined,
      moduleId: e.moduleId,
      versionEtatique: e.versionEtatique,
      versionPrivee: e.versionPrivee,
    });
    setShowDialog(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      notify.error("Le nom de l'examen est obligatoire");
      return;
    }
    if (!form.classeId) {
      notify.error("La classe est obligatoire");
      return;
    }
    if (!form.moduleId) {
      notify.error("Le module est obligatoire");
      return;
    }
    if (!form.trimestre || form.trimestre < 1 || form.trimestre > 3) {
      notify.error("Le trimestre est obligatoire (1, 2 ou 3)");
      return;
    }
    if (editId) {
      updateExamen.mutate(
        { id: editId, data: form },
        {
          onSuccess: () => {
            notify.success("Examen modifié");
            setShowDialog(false);
          },
          onError: () => notify.error("Erreur lors de la modification"),
        }
      );
    } else {
      createExamen.mutate(form, {
        onSuccess: () => {
          notify.success("Examen créé");
          setShowDialog(false);
        },
        onError: () => notify.error("Erreur lors de la création"),
      });
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteExamen.mutate(deleteTarget.id, {
      onSuccess: () => {
        notify.success("Examen supprimé");
        setDeleteTarget(null);
      },
      onError: () => notify.error("Erreur lors de la suppression"),
    });
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    deleteBulk.mutate(Array.from(selectedIds), {
      onSuccess: () => {
        notify.success(`${selectedIds.size} examen(s) supprimé(s)`);
        setSelectedIds(new Set());
      },
      onError: () => notify.error("Erreur lors de la suppression"),
    });
  };

  const handleNiveauChange = (v: string) => {
    setFilterNiveauId(v);
    setFilterClasseId(0);
    setFilterModuleId(0);
    setFilterTrimestre(0);
    setSelectedIds(new Set());
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="rounded-xl border border-border/50 bg-card p-4 shadow-sm"
      >
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <Select
            value={filterNiveauId ? String(filterNiveauId) : ""}
            onValueChange={handleNiveauChange}
          >
            <SelectTrigger className="w-[180px]">
              <GraduationCap className="h-3.5 w-3.5 me-1.5 text-muted-foreground" />
              <SelectValue placeholder="Niveau" />
            </SelectTrigger>
            <SelectContent>
              {niveaux.map((n) => (
                <SelectItem key={n.id} value={String(n.id)}>
                  {n.nom}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filterClasseId ? String(filterClasseId) : ""}
            onValueChange={(v) => {
              setFilterClasseId(v);
              setSelectedIds(new Set());
            }}
            disabled={!filterNiveauId}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Classe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Toutes</SelectItem>
              {classes.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.fullName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filterModuleId ? String(filterModuleId) : ""}
            onValueChange={(v) => {
              setFilterModuleId(v);
              setSelectedIds(new Set());
            }}
            disabled={!filterNiveauId}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Matière" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Tous</SelectItem>
              {modules.map((m) => (
                <SelectItem key={m.id} value={String(m.id)}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filterTrimestre ? String(filterTrimestre) : "0"}
            onValueChange={(v) => {
              setFilterTrimestre(Number(v));
              setTrimestreTouched(true);
              setSelectedIds(new Set());
            }}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Trimestre" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Tous trimestres</SelectItem>
              {TRIMESTRE_OPTIONS.map((t) => (
                <SelectItem key={t} value={String(t)}>
                  Trimestre {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status segmented filter */}
          <div className="inline-flex items-center rounded-md border border-border bg-muted/30 p-0.5 text-xs">
            {(
              [
                { v: "all", l: "Tous" },
                { v: "empty", l: "À saisir" },
                { v: "partial", l: "Partiel" },
                { v: "complete", l: "Saisis" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.v}
                onClick={() => setFilterStatut(opt.v)}
                className={`px-2.5 py-1 rounded transition-colors ${
                  filterStatut === opt.v
                    ? "bg-background text-foreground shadow-sm font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {opt.l}
              </button>
            ))}
          </div>

          <div className="relative flex-1 min-w-0">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher..."
              className="ps-9"
            />
          </div>

          <div className="flex items-center gap-2">
            {selectedIds.size > 0 && (
              <Button
                variant="destructive"
                size="sm"
                className="gap-1.5"
                onClick={handleBulkDelete}
                disabled={deleteBulk.isPending}
              >
                <Trash2 className="h-4 w-4" />
                Supprimer ({selectedIds.size})
              </Button>
            )}
            <Button
              size="sm"
              className="gap-1.5 bg-gradient-primary shadow-btn"
              onClick={openAdd}
            >
              <Plus className="h-4 w-4" />
              Ajouter
            </Button>
          </div>
        </div>
        {hasSelection && (
          <div className="mt-2 text-xs text-muted-foreground">
            {filtered.length} examen{filtered.length !== 1 ? "s" : ""}
          </div>
        )}
      </motion.div>

      {/* Table */}
      {!hasSelection ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="rounded-xl border border-border/50 bg-card shadow-sm py-20 text-center"
        >
          <GraduationCap className="mx-auto h-12 w-12 text-muted-foreground opacity-25" />
          <p className="mt-3 font-medium text-foreground">
            Sélectionnez un niveau et une classe
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Choisissez une classe ci-dessus pour charger ses examens.
          </p>
        </motion.div>
      ) : (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
        className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="py-3 px-4 text-start">
                  <Checkbox
                    checked={
                      filtered.length > 0 &&
                      selectedIds.size === filtered.length
                    }
                    onCheckedChange={toggleAll}
                  />
                </th>
                <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground">
                  Nom
                </th>
                <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground hidden md:table-cell">
                  Matière
                </th>
                <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground hidden lg:table-cell">
                  Classe
                </th>
                <th className="py-3 px-4 text-center text-xs font-semibold text-muted-foreground">
                  Trim.
                </th>
                <th className="py-3 px-4 text-center text-xs font-semibold text-muted-foreground">
                  Saisies
                </th>
                <th className="py-3 px-4 text-center text-xs font-semibold text-muted-foreground">
                  Coeff. É
                </th>
                <th className="py-3 px-4 text-center text-xs font-semibold text-muted-foreground">
                  Coeff. P
                </th>
                <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground hidden xl:table-cell">
                  Enseignant
                </th>
                <th className="py-3 px-4 text-end text-xs font-semibold text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={10}
                    className="py-16 text-center text-muted-foreground"
                  >
                    Chargement...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="py-16 text-center text-muted-foreground"
                  >
                    <ClipboardCheck className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">Aucun examen trouvé</p>
                  </td>
                </tr>
              ) : (
                filtered.map((e) => (
                  <tr
                    key={e.id}
                    className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <Checkbox
                        checked={selectedIds.has(e.id)}
                        onCheckedChange={() => toggleSelect(e.id)}
                      />
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-foreground">{e.name}</p>
                      {e.namePrive && (
                        <p className="text-xs text-muted-foreground">
                          VP: {e.namePrive}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground hidden md:table-cell">
                      {e.moduleName}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground hidden lg:table-cell">
                      {e.classeName}
                    </td>
                    <td className="py-3 px-4 text-center text-muted-foreground">T{e.trimestre}</td>
                    <td className="py-3 px-4 text-center">
                      {(() => {
                        const total = e.nbEleves ?? 0;
                        const filled = e.nbNotes ?? 0;
                        const isComplete = total > 0 && filled >= total;
                        const isEmpty = filled === 0;
                        return (
                          <button
                            type="button"
                            onClick={() => setDetailsExamen(e)}
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition-colors ${
                              isComplete
                                ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                : isEmpty
                                ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                : "bg-orange-50 text-orange-700 hover:bg-orange-100"
                            }`}
                            title="Voir détails et statistiques"
                          >
                            {isComplete ? (
                              <CheckCircle2 className="h-3 w-3" />
                            ) : isEmpty ? (
                              <Clock className="h-3 w-3" />
                            ) : (
                              <Clock className="h-3 w-3" />
                            )}
                            {filled}/{total}
                          </button>
                        );
                      })()}
                    </td>
                    <td className="py-3 px-4 text-center">{e.coeffEtatique}</td>
                    <td className="py-3 px-4 text-center">{e.coeffPrive}</td>
                    <td className="py-3 px-4 text-muted-foreground hidden xl:table-cell">
                      {e.teacherName || "—"}
                    </td>
                    <td className="py-3 px-4 text-end">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                          onClick={() => setDetailsExamen(e)}
                          title="Voir détails et statistiques"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-amber-600"
                          onClick={() => openEdit(e)}
                          title="Modifier l'examen"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-red-600"
                          onClick={() => setDeleteTarget(e)}
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editId ? "Modifier l'examen" : "Nouvel examen"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nom de l'examen *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex: Contrôle 1"
                />
              </div>
              <div>
                <Label>Nom privé</Label>
                <Input
                  value={form.namePrive || ""}
                  onChange={(e) =>
                    setForm({ ...form, namePrive: e.target.value })
                  }
                  placeholder="Version privée"
                />
              </div>
            </div>

            <div>
              <Label>Niveau *</Label>
              <Select
                value={formNiveauId ? String(formNiveauId) : ""}
                onValueChange={(v) => {
                  setFormNiveauId(v);
                  setForm({ ...form, classeId: 0, moduleId: 0 });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un niveau" />
                </SelectTrigger>
                <SelectContent>
                  {niveaux.map((n) => (
                    <SelectItem key={n.id} value={String(n.id)}>
                      {n.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Classe *</Label>
                <Select
                  value={form.classeId ? String(form.classeId) : ""}
                  onValueChange={(v) =>
                    setForm({ ...form, classeId: v })
                  }
                  disabled={!formNiveauId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Classe" />
                  </SelectTrigger>
                  <SelectContent>
                    {formClasses.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Matière *</Label>
                <Select
                  value={form.moduleId ? String(form.moduleId) : ""}
                  onValueChange={(v) =>
                    setForm({ ...form, moduleId: v })
                  }
                  disabled={!formNiveauId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Matière" />
                  </SelectTrigger>
                  <SelectContent>
                    {formModules.map((m) => (
                      <SelectItem key={m.id} value={String(m.id)}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Enseignant</Label>
              <Select
                value={form.teacherId ? String(form.teacherId) : "none"}
                onValueChange={(v) =>
                  setForm({
                    ...form,
                    teacherId: v === "none" ? undefined : Number(v),
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner (optionnel)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Aucun —</SelectItem>
                  {teachers.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {t.prenom} {t.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Trimestre *</Label>
              <Select
                value={form.trimestre ? String(form.trimestre) : ""}
                onValueChange={(v) => setForm({ ...form, trimestre: Number(v) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un trimestre" />
                </SelectTrigger>
                <SelectContent>
                  {TRIMESTRE_OPTIONS.map((t) => (
                    <SelectItem key={t} value={String(t)}>
                      Trimestre {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Coefficient étatique</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.5}
                  value={form.coeffEtatique}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      coeffEtatique: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div>
                <Label>Coefficient privé</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.5}
                  value={form.coeffPrive}
                  onChange={(e) =>
                    setForm({ ...form, coeffPrive: Number(e.target.value) })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Ordre étatique</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.ordreEtatique}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      ordreEtatique: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div>
                <Label>Ordre privé</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.ordrePrive}
                  onChange={(e) =>
                    setForm({ ...form, ordrePrive: Number(e.target.value) })
                  }
                />
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="exve"
                  checked={form.versionEtatique}
                  onCheckedChange={(checked) =>
                    setForm({ ...form, versionEtatique: !!checked })
                  }
                />
                <Label htmlFor="exve" className="cursor-pointer">
                  Version étatique
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="exvp"
                  checked={form.versionPrivee}
                  onCheckedChange={(checked) =>
                    setForm({ ...form, versionPrivee: !!checked })
                  }
                />
                <Label htmlFor="exvp" className="cursor-pointer">
                  Version privée
                </Label>
              </div>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button variant="outline">Annuler</Button>
            </DialogClose>
            <Button
              onClick={handleSave}
              disabled={createExamen.isPending || updateExamen.isPending}
            >
              {editId ? "Modifier" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Supprimer l'examen{" "}
            <span className="font-semibold text-foreground">
              {deleteTarget?.name}
            </span>{" "}
            ? Les notes associées seront aussi supprimées.
          </p>
          <DialogFooter className="mt-2">
            <DialogClose asChild>
              <Button variant="outline">Annuler</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteExamen.isPending}
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details drawer */}
      <ExamenDetailsSheet
        examen={detailsExamen}
        open={!!detailsExamen}
        onOpenChange={(open) => !open && setDetailsExamen(null)}
        onEditNotes={(ex) => {
          setFilterClasseId(ex.classeId);
          setDetailsExamen(null);
          goToTab("notes");
          notify.success(`Saisissez les notes pour : ${ex.name} (T${ex.trimestre})`);
        }}
      />
    </div>
  );
}
