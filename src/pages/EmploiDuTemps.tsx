import { useState, useMemo } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { motion } from "framer-motion";
import {
  Calendar,
  Save,
  Loader2,
  AlertTriangle,
  Plus,
  X,
  Clock,
  Wand2,
  Sparkles,
  Trash2,
  CheckCircle2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
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
  useEmploiByClasse,
  useCreneaux,
  useSaveEmploi,
  useCheckConflits,
  useCreateCreneau,
  useGenerateEmploi,
} from "@/hooks/useEmploiDuTemps";
import { useClasses } from "@/hooks/useClasses";
import { useTeachers } from "@/hooks/useTeachers";
import { useModules } from "@/hooks/useModules";
import type { EmploiDuTempsEntry, Creneau, Conflit, TeachingAssignment, TimetableGenerateResponse } from "@/types/emploi-du-temps";
import { useRooms } from "@/hooks/useRooms";
import { useCurrentUser } from "@/hooks/useRbac";
import GenerationWizard from "@/components/emploi-du-temps/GenerationWizard";
import TeacherEmploiDuTemps from "@/components/emploi-du-temps/TeacherEmploiDuTemps";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.35 },
  }),
};

const SLOT_COLORS = [
  "bg-blue-50 border-blue-200 text-blue-800",
  "bg-emerald-50 border-emerald-200 text-emerald-800",
  "bg-purple-50 border-purple-200 text-purple-800",
  "bg-orange-50 border-orange-200 text-orange-800",
  "bg-pink-50 border-pink-200 text-pink-800",
  "bg-cyan-50 border-cyan-200 text-cyan-800",
];

export default function EmploiDuTempsPage() {
  const { role } = useCurrentUser();
  // A teacher gets a read-only view of his own schedule only; everyone else
  // (admin/direction) gets the full editing & generation interface.
  if (role === "ENSEIGNANT") return <TeacherEmploiDuTemps />;
  return <AdminEmploiDuTemps />;
}

function AdminEmploiDuTemps() {
  const { t } = useLanguage();

  const JOURS = useMemo(() => [
    { value: 1, label: t("common.days.monday") },
    { value: 2, label: t("common.days.tuesday") },
    { value: 3, label: t("common.days.wednesday") },
    { value: 4, label: t("common.days.thursday") },
    { value: 5, label: t("common.days.friday") },
    { value: 6, label: t("common.days.saturday") },
  ], [t]);

  const [selectedClasseId, setSelectedClasseId] = useState(0);
  const [editingEntry, setEditingEntry] = useState<{
    jour: number;
    creneauId: string;
    existing?: EmploiDuTempsEntry;
  } | null>(null);
  const [entryModuleId, setEntryModuleId] = useState("");
  const [entryEnseignantId, setEntryEnseignantId] = useState("");
  const [entrySalle, setEntrySalle] = useState("");
  const [creneauDialogOpen, setCreneauDialogOpen] = useState(false);
  const [newCreneau, setNewCreneau] = useState({
    label: "",
    heureDebut: "",
    heureFin: "",
    type: "COURS" as Creneau["type"],
  });
  const [conflits, setConflits] = useState<Conflit[]>([]);
  const [localEntries, setLocalEntries] = useState<EmploiDuTempsEntry[]>([]);
  const [hasLocalChanges, setHasLocalChanges] = useState(false);

  // Generation state
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [assignments, setAssignments] = useState<TeachingAssignment[]>([]);
  const [newAssignment, setNewAssignment] = useState<TeachingAssignment>({
    classeId: 0, moduleId: 0, enseignantId: 0, nbHeures: 1,
  });
  const [selectedRooms, setSelectedRooms] = useState<string[]>([]);
  const [solverTimeout, setSolverTimeout] = useState(30);
  const [generateResult, setGenerateResult] = useState<TimetableGenerateResponse | null>(null);

  const { data: classes = [] } = useClasses();
  const { teachers } = useTeachers();
  const { data: modules = [] } = useModules();
  const { rooms = [] } = useRooms();
  const { data: creneaux = [], isLoading: creneauxLoading } = useCreneaux();
  const { data: serverEntries = [], isLoading: entriesLoading } =
    useEmploiByClasse(selectedClasseId);

  const saveMutation = useSaveEmploi();
  const checkConflitsMutation = useCheckConflits();
  const createCreneauMutation = useCreateCreneau();
  const generateMutation = useGenerateEmploi();

  // Sync server entries to local when they change and no local edits
  const entries = hasLocalChanges ? localEntries : serverEntries;

  const courseCreneaux = useMemo(
    () => creneaux.filter((c) => c.type === "COURS"),
    [creneaux]
  );

  const getEntry = (jour: number, creneauId: string) =>
    entries.find((e) => e.jourSemaine === jour && e.creneauId === creneauId);

  const getModuleColor = (moduleId?: string) => {
    if (!moduleId) return "";
    return SLOT_COLORS[moduleId % SLOT_COLORS.length];
  };

  const openSlotEditor = (jour: number, creneauId: string) => {
    const existing = getEntry(jour, creneauId);
    setEditingEntry({ jour, creneauId, existing });
    setEntryModuleId(existing?.moduleId ? String(existing.moduleId) : "");
    setEntryEnseignantId(
      existing?.enseignantId ? String(existing.enseignantId) : ""
    );
    setEntrySalle(existing?.salle ?? "");
  };

  const handleSaveSlot = () => {
    if (!editingEntry) return;
    const { jour, creneauId } = editingEntry;
    const newEntry: EmploiDuTempsEntry = {
      classeId: selectedClasseId,
      jourSemaine: jour,
      creneauId,
      moduleId: entryModuleId ? entryModuleId : undefined,
      moduleName: modules.find((m) => m.id === entryModuleId)?.name,
      enseignantId: entryEnseignantId ? entryEnseignantId : undefined,
      enseignantNom: teachers.find((t) => t.id === entryEnseignantId)
        ? `${teachers.find((t) => t.id === entryEnseignantId)!.prenom} ${teachers.find((t) => t.id === entryEnseignantId)!.nom}`
        : undefined,
      salle: entrySalle || undefined,
    };

    const updated = [
      ...entries.filter(
        (e) => !(e.jourSemaine === jour && e.creneauId === creneauId)
      ),
      newEntry,
    ];
    setLocalEntries(updated);
    setHasLocalChanges(true);
    setEditingEntry(null);
  };

  const handleRemoveSlot = () => {
    if (!editingEntry) return;
    const { jour, creneauId } = editingEntry;
    const updated = entries.filter(
      (e) => !(e.jourSemaine === jour && e.creneauId === creneauId)
    );
    setLocalEntries(updated);
    setHasLocalChanges(true);
    setEditingEntry(null);
  };

  const handleSaveAll = () => {
    if (!selectedClasseId) return;
    checkConflitsMutation.mutate(
      { classeId: selectedClasseId, entries: localEntries },
      {
        onSuccess: (result) => {
          if (result.length > 0) {
            setConflits(result);
          } else {
            saveMutation.mutate(
              { classeId: selectedClasseId, entries: localEntries },
              {
                onSuccess: () => {
                  setHasLocalChanges(false);
                  setConflits([]);
                },
              }
            );
          }
        },
      }
    );
  };

  const handleForceSave = () => {
    if (!selectedClasseId) return;
    saveMutation.mutate(
      { classeId: selectedClasseId, entries: localEntries },
      {
        onSuccess: () => {
          setHasLocalChanges(false);
          setConflits([]);
        },
      }
    );
  };

  const handleCreateCreneau = () => {
    createCreneauMutation.mutate(newCreneau, {
      onSuccess: () => {
        setCreneauDialogOpen(false);
        setNewCreneau({ label: "", heureDebut: "", heureFin: "", type: "COURS" });
      },
    });
  };

  // --- Generation handlers ---
  const handleAddAssignment = () => {
    if (!newAssignment.classeId || !newAssignment.moduleId || !newAssignment.enseignantId || newAssignment.nbHeures < 1) return;
    setAssignments([...assignments, { ...newAssignment }]);
    setNewAssignment({ classeId: 0, moduleId: 0, enseignantId: 0, nbHeures: 1 });
  };

  const handleRemoveAssignment = (index: number) => {
    setAssignments(assignments.filter((_, i) => i !== index));
  };

  const handleToggleRoom = (roomName: string) => {
    setSelectedRooms((prev) =>
      prev.includes(roomName) ? prev.filter((r) => r !== roomName) : [...prev, roomName]
    );
  };

  const handleGenerate = () => {
    if (assignments.length === 0 || selectedRooms.length === 0) return;
    generateMutation.mutate(
      { assignments, rooms: selectedRooms, solverTimeoutSeconds: solverTimeout },
      {
        onSuccess: (result) => {
          setGenerateResult(result);
          setHasLocalChanges(false);
        },
      }
    );
  };

  const handleCloseGenerateDialog = () => {
    setGenerateDialogOpen(false);
    setGenerateResult(null);
  };

  const availableRooms = rooms.filter((r) => r.statut !== "En maintenance");

  const isLoading = creneauxLoading || (entriesLoading && selectedClasseId);

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
            {t("schedule.title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t("rooms.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="gap-1.5 bg-gradient-primary shadow-btn"
            onClick={() => setWizardOpen(true)}
          >
            <Sparkles className="h-4 w-4" />
            Générer auto
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => {
              setGenerateDialogOpen(true);
              setGenerateResult(null);
            }}
          >
            <Wand2 className="h-4 w-4" />
            {t("common.generate")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => setCreneauDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            {t("schedule.newSlot")}
          </Button>
          {hasLocalChanges && (
            <Button
              size="sm"
              className="gap-1.5 bg-gradient-primary shadow-btn"
              onClick={handleSaveAll}
              disabled={saveMutation.isPending || checkConflitsMutation.isPending}
            >
              {saveMutation.isPending || checkConflitsMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {t("common.save")}
            </Button>
          )}
        </div>
      </motion.div>

      {/* Class selector */}
      <motion.div
        custom={1}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="rounded-xl border border-border/50 bg-card p-4 shadow-sm"
      >
        <div className="flex items-center gap-3">
          <Select
            value={selectedClasseId ? String(selectedClasseId) : ""}
            onValueChange={(v) => {
              setSelectedClasseId(v);
              setHasLocalChanges(false);
              setConflits([]);
            }}
          >
            <SelectTrigger className="w-[250px]">
              <Calendar className="h-3.5 w-3.5 me-1.5 text-muted-foreground" />
              <SelectValue placeholder={t("schedule.selectClass")} />
            </SelectTrigger>
            <SelectContent>
              {classes.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.fullName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* Conflicts warning */}
      {conflits.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-xl border border-orange-200 bg-orange-50 p-4 space-y-2"
        >
          <div className="flex items-center gap-2 text-orange-700 font-medium">
            <AlertTriangle className="h-4 w-4" />
            {t("schedule.unresolvedConflicts")}
          </div>
          <ul className="text-sm text-orange-600 list-disc ps-5 space-y-1">
            {conflits.map((c, i) => (
              <li key={i}>{c.message}</li>
            ))}
          </ul>
          <div className="flex gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={() => setConflits([])}>
              {t("common.edit")}
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleForceSave}
              disabled={saveMutation.isPending}
            >
              {t("common.save")}
            </Button>
          </div>
        </motion.div>
      )}

      {/* Grid */}
      {selectedClasseId ? (
        isLoading ? (
          <div className="flex h-[40vh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <motion.div
            custom={2}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="py-3 px-3 text-start text-xs font-semibold text-muted-foreground w-[100px]">
                      {t("common.type")}
                    </th>
                    {JOURS.map((j) => (
                      <th
                        key={j.value}
                        className="py-3 px-2 text-center text-xs font-semibold text-muted-foreground min-w-[140px]"
                      >
                        {j.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {creneaux.map((creneau) => (
                    <tr
                      key={creneau.id}
                      className={`border-b border-border/50 ${
                        creneau.type !== "COURS" ? "bg-muted/10" : ""
                      }`}
                    >
                      <td className="py-2 px-3 text-xs text-muted-foreground">
                        <div className="font-medium">{creneau.label}</div>
                        <div className="text-[10px]">
                          {creneau.heureDebut} - {creneau.heureFin}
                        </div>
                        {creneau.type !== "COURS" && (
                          <Badge variant="outline" className="text-[10px] mt-0.5">
                            {creneau.type === "PAUSE" ? t("schedule.slotType.break") : t("schedule.slotType.recess")}
                          </Badge>
                        )}
                      </td>
                      {JOURS.map((jour) => {
                        if (creneau.type !== "COURS") {
                          return (
                            <td
                              key={jour.value}
                              className="py-2 px-2 text-center text-xs text-muted-foreground/50"
                            >
                              -
                            </td>
                          );
                        }
                        const entry = getEntry(jour.value, creneau.id);
                        return (
                          <td key={jour.value} className="py-2 px-2">
                            <button
                              className={`w-full rounded-lg border p-2 text-start text-xs transition-all hover:shadow-md cursor-pointer ${
                                entry
                                  ? getModuleColor(entry.moduleId)
                                  : "border-dashed border-border hover:border-primary/40 hover:bg-muted/30"
                              }`}
                              onClick={() =>
                                openSlotEditor(jour.value, creneau.id)
                              }
                            >
                              {entry ? (
                                <>
                                  <div className="font-semibold truncate">
                                    {entry.moduleName ?? "Matière"}
                                  </div>
                                  {entry.enseignantNom && (
                                    <div className="text-[10px] opacity-70 truncate">
                                      {entry.enseignantNom}
                                    </div>
                                  )}
                                  {entry.salle && (
                                    <div className="text-[10px] opacity-60">
                                      {t("schedule.room")}: {entry.salle}
                                    </div>
                                  )}
                                </>
                              ) : (
                                <div className="text-muted-foreground/50 text-center py-1">
                                  <Plus className="h-3 w-3 mx-auto" />
                                </div>
                              )}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )
      ) : (
        <motion.div
          custom={2}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="rounded-xl border border-border/50 bg-card shadow-sm p-16 text-center"
        >
          <Calendar className="h-10 w-10 mx-auto mb-3 opacity-30 text-muted-foreground" />
          <p className="font-medium text-muted-foreground">
            {t("schedule.selectClass")}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {t("rooms.subtitle")}
          </p>
        </motion.div>
      )}

      {/* Slot Editor Dialog */}
      <Dialog
        open={!!editingEntry}
        onOpenChange={(open) => !open && setEditingEntry(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingEntry?.existing
                ? t("schedule.editSlot")
                : t("schedule.assignSlot")}
            </DialogTitle>
            <DialogDescription>
              {JOURS.find((j) => j.value === editingEntry?.jour)?.label} -{" "}
              {creneaux.find((c) => c.id === editingEntry?.creneauId)?.label}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>{t("schedule.subject")}</Label>
              <Select value={entryModuleId} onValueChange={setEntryModuleId}>
                <SelectTrigger>
                  <SelectValue placeholder={t("schedule.selectSubject")} />
                </SelectTrigger>
                <SelectContent>
                  {modules.map((m) => (
                    <SelectItem key={m.id} value={String(m.id)}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t("common.teacher")}</Label>
              <Select
                value={entryEnseignantId}
                onValueChange={setEntryEnseignantId}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("schedule.selectTeacher")} />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {t.prenom} {t.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="salle">{t("schedule.room")}</Label>
              <Input
                id="salle"
                value={entrySalle}
                onChange={(e) => setEntrySalle(e.target.value)}
                placeholder={t("schedule.roomPlaceholder")}
              />
            </div>
          </div>
          <DialogFooter>
            {editingEntry?.existing && (
              <Button
                variant="destructive"
                onClick={handleRemoveSlot}
                className="me-auto"
              >
                {t("common.delete")}
              </Button>
            )}
            <DialogClose asChild>
              <Button variant="outline">{t("common.cancel")}</Button>
            </DialogClose>
            <Button onClick={handleSaveSlot}>{t("common.save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Creneau Dialog */}
      <Dialog open={creneauDialogOpen} onOpenChange={setCreneauDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("schedule.newSlot")}</DialogTitle>
            <DialogDescription>
              {t("schedule.newSlot")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="creneauLabel">{t("common.title")}</Label>
              <Input
                id="creneauLabel"
                value={newCreneau.label}
                onChange={(e) =>
                  setNewCreneau({ ...newCreneau, label: e.target.value })
                }
                placeholder={t("schedule.labelPlaceholder")}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="heureDebut">{t("schedule.startTime")}</Label>
                <Input
                  id="heureDebut"
                  type="time"
                  value={newCreneau.heureDebut}
                  onChange={(e) =>
                    setNewCreneau({ ...newCreneau, heureDebut: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="heureFin">{t("schedule.endTime")}</Label>
                <Input
                  id="heureFin"
                  type="time"
                  value={newCreneau.heureFin}
                  onChange={(e) =>
                    setNewCreneau({ ...newCreneau, heureFin: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select
                value={newCreneau.type}
                onValueChange={(v) =>
                  setNewCreneau({
                    ...newCreneau,
                    type: v as Creneau["type"],
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="COURS">{t("schedule.slotType.course")}</SelectItem>
                  <SelectItem value="PAUSE">{t("schedule.slotType.break")}</SelectItem>
                  <SelectItem value="RECREATION">{t("schedule.slotType.recess")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">{t("common.cancel")}</Button>
            </DialogClose>
            <Button
              onClick={handleCreateCreneau}
              disabled={
                createCreneauMutation.isPending ||
                !newCreneau.label ||
                !newCreneau.heureDebut ||
                !newCreneau.heureFin
              }
            >
              {createCreneauMutation.isPending
                ? t("common.creating")
                : t("common.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Auto-Generation Dialog */}
      <Dialog open={generateDialogOpen} onOpenChange={handleCloseGenerateDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5" />
              {t("common.generate")}
            </DialogTitle>
            <DialogDescription>
              {t("schedule.addSlot")}
            </DialogDescription>
          </DialogHeader>

          {generateResult ? (
            // --- Result view ---
            <div className="space-y-4 py-2">
              <div className={`rounded-lg border p-4 ${
                generateResult.status === "SOLVED"
                  ? "border-green-200 bg-green-50"
                  : "border-orange-200 bg-orange-50"
              }`}>
                <div className="flex items-center gap-2 font-medium">
                  {generateResult.status === "SOLVED" ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                  )}
                  <span className={generateResult.status === "SOLVED" ? "text-green-700" : "text-orange-700"}>
                    {generateResult.status === "SOLVED"
                      ? t("schedule.generatedSuccess")
                      : t("schedule.generatedConflicts")}
                  </span>
                </div>
                <p className="text-sm mt-1 opacity-70">
                  Score: {generateResult.score} | {generateResult.entries.length} cours places
                </p>
              </div>
              {generateResult.unresolvedConflicts.length > 0 && (
                <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
                  <p className="text-sm font-medium text-orange-700 mb-1">{t("schedule.unresolvedConflicts")}:</p>
                  <ul className="text-xs text-orange-600 list-disc ps-4 space-y-0.5">
                    {generateResult.unresolvedConflicts.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={handleCloseGenerateDialog}>
                  {t("common.close")}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            // --- Input form ---
            <div className="space-y-5 py-2">
              {/* Add assignment form */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold">{t("schedule.addSlot")}</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">{t("common.class")}</Label>
                    <Select
                      value={newAssignment.classeId ? String(newAssignment.classeId) : ""}
                      onValueChange={(v) => setNewAssignment({ ...newAssignment, classeId: v })}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Classe" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>{c.fullName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">{t("grades.modules")}</Label>
                    <Select
                      value={newAssignment.moduleId ? String(newAssignment.moduleId) : ""}
                      onValueChange={(v) => setNewAssignment({ ...newAssignment, moduleId: v })}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Matière" />
                      </SelectTrigger>
                      <SelectContent>
                        {modules.map((m) => (
                          <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">{t("common.teacher")}</Label>
                    <Select
                      value={newAssignment.enseignantId ? String(newAssignment.enseignantId) : ""}
                      onValueChange={(v) => setNewAssignment({ ...newAssignment, enseignantId: v })}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Enseignant" />
                      </SelectTrigger>
                      <SelectContent>
                        {teachers.map((t) => (
                          <SelectItem key={t.id} value={String(t.id)}>
                            {t.prenom} {t.nom}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">{t("schedule.startTime")}</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        min={1}
                        max={20}
                        className="h-9 text-xs"
                        value={newAssignment.nbHeures}
                        onChange={(e) => setNewAssignment({ ...newAssignment, nbHeures: Number(e.target.value) })}
                      />
                      <Button size="sm" className="h-9 px-3" onClick={handleAddAssignment}
                        disabled={!newAssignment.classeId || !newAssignment.moduleId || !newAssignment.enseignantId}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Assignment list */}
              {assignments.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">
                    Affectations ({assignments.length})
                  </Label>
                  <div className="max-h-40 overflow-y-auto space-y-1.5">
                    {assignments.map((a, i) => (
                      <div key={i} className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/20 px-3 py-2 text-xs">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="text-[10px]">
                            {classes.find((c) => c.id === a.classeId)?.fullName ?? `Classe ${a.classeId}`}
                          </Badge>
                          <span className="font-medium">
                            {modules.find((m) => m.id === a.moduleId)?.name ?? `Module ${a.moduleId}`}
                          </span>
                          <span className="text-muted-foreground">
                            {teachers.find((t) => t.id === a.enseignantId)
                              ? `${teachers.find((t) => t.id === a.enseignantId)!.prenom} ${teachers.find((t) => t.id === a.enseignantId)!.nom}`
                              : `Prof ${a.enseignantId}`}
                          </span>
                          <Badge className="text-[10px]">{a.nbHeures}h/sem</Badge>
                        </div>
                        <button onClick={() => handleRemoveAssignment(i)} className="text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Room selection */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">
                  {t("rooms.availablePlural")} ({selectedRooms.length})
                </Label>
                <div className="grid grid-cols-3 gap-1.5 max-h-32 overflow-y-auto">
                  {availableRooms.map((room) => (
                    <button
                      key={room.id}
                      onClick={() => handleToggleRoom(room.nom)}
                      className={`rounded-md border px-2 py-1.5 text-xs text-start transition-colors ${
                        selectedRooms.includes(room.nom)
                          ? "border-primary bg-primary/10 text-primary font-medium"
                          : "border-border/50 hover:border-primary/40"
                      }`}
                    >
                      {room.nom}
                      <span className="block text-[10px] text-muted-foreground">{room.type}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Timeout */}
              <div className="flex items-center gap-3">
                <Label className="text-sm whitespace-nowrap">Timeout (s):</Label>
                <Input
                  type="number"
                  min={5}
                  max={120}
                  className="w-24 h-9 text-xs"
                  value={solverTimeout}
                  onChange={(e) => setSolverTimeout(Number(e.target.value))}
                />
              </div>

              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">{t("common.cancel")}</Button>
                </DialogClose>
                <Button
                  onClick={handleGenerate}
                  disabled={generateMutation.isPending || assignments.length === 0 || selectedRooms.length === 0}
                  className="gap-1.5 bg-gradient-primary shadow-btn"
                >
                  {generateMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t("common.generating")}
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4" />
                      {t("common.generate")}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <GenerationWizard open={wizardOpen} onClose={() => setWizardOpen(false)} />
    </div>
  );
}
