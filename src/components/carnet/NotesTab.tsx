import { useState, useEffect, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { useCarnetSelection } from "./CarnetSelectionContext";
import { Save, PenLine, GraduationCap, Users, CheckCircle2, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { notify } from "@/lib/toast";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNiveaux } from "@/hooks/useNiveaux";
import { useClasses } from "@/hooks/useClasses";
import { useModules } from "@/hooks/useModules";
import { useExamensRaw } from "@/hooks/useExamens";
import { useNotesByExamen, useUpsertNotes } from "@/hooks/useNotes";
import { studentsApi } from "@/api/students.api";
import ExportButton from "@/components/ExportButton";
import type { NoteRequest, NoteStatut } from "@/api/notes.api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface LocalNote {
  studentId: string;
  studentName: string;
  valeur: string;
  observation: string;
  statut: NoteStatut;
}

const TRIMESTRES = [
  { value: 1, label: "Trimestre 1", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { value: 2, label: "Trimestre 2", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { value: 3, label: "Trimestre 3", color: "bg-purple-50 text-purple-700 border-purple-200" },
];

const AUTO_OBSERVATIONS_FR = ["Excellent", "Très bien", "Bien", "Assez bien", "Passable", "Insuffisant", "Très insuffisant"];
const AUTO_OBSERVATIONS_AR = ["ممتاز", "جيد جدا", "جيد", "حسن", "مقبول", "ضعيف", "ضعيف جدا"];
const AUTO_OBSERVATIONS_ALL = [...AUTO_OBSERVATIONS_FR, ...AUTO_OBSERVATIONS_AR];

const ARABIC_REGEX = /[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]/;

const getDefaultObservation = (valeur: string, isArabic: boolean): string => {
  if (valeur === "") return "";
  const n = Number(valeur.replace(",", "."));
  if (Number.isNaN(n)) return "";
  const scale = isArabic ? AUTO_OBSERVATIONS_AR : AUTO_OBSERVATIONS_FR;
  if (n >= 18) return scale[0];
  if (n >= 16) return scale[1];
  if (n >= 14) return scale[2];
  if (n >= 12) return scale[3];
  if (n >= 10) return scale[4];
  if (n >= 8) return scale[5];
  return scale[6];
};

export default function NotesTab() {
  const { niveaux } = useNiveaux();

  // Selection state
  const {
    niveauId, classeId, trimestre, moduleId, examenId,
    setNiveauId, setClasseId, setTrimestre, setModuleId, setExamenId,
    goToTab,
  } = useCarnetSelection();

  // Data queries
  const { data: classes = [] } = useClasses(niveauId || undefined);
  const { data: modules = [] } = useModules(niveauId || undefined);
  const { data: examens = [] } = useExamensRaw(
    moduleId || undefined,
    classeId || undefined,
    trimestre || undefined
  );
  const { data: existingNotesData } = useNotesByExamen(
    examenId,
    trimestre
  );
  const existingNotes = useMemo(() => existingNotesData ?? [], [existingNotesData]);

  // Get students for selected classe
  const selectedClasse = classes.find((c) => c.id === classeId);
  const classeName = selectedClasse?.fullName ?? "";
  const { data: studentsPage } = useQuery({
    queryKey: ["students", "by-classe", classeName],
    queryFn: () => studentsApi.getAll({ classe: classeName, size: 200 }),
    enabled: !!classeName,
  });
  const students = useMemo(() => studentsPage?.content ?? [], [studentsPage]);

  // Local notes state for editing
  const [localNotes, setLocalNotes] = useState<LocalNote[]>([]);
  const [dirtyIds, setDirtyIds] = useState<Set<number>>(new Set());
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const localNotesRef = useRef(localNotes);
  localNotesRef.current = localNotes;

  // Missing-notes confirmation modal
  const [missingDialogOpen, setMissingDialogOpen] = useState(false);
  const missingStudents = useMemo(
    () => localNotes.filter((n) => n.valeur === "" && n.statut === "PRESENT"),
    [localNotes]
  );

  // Merge students with existing notes
  useEffect(() => {
    if (!examenId || !trimestre || students.length === 0) {
      setLocalNotes((prev) => (prev.length === 0 ? prev : []));
      setDirtyIds((prev) => (prev.size === 0 ? prev : new Set()));
      setLastSavedAt((prev) => (prev === null ? prev : null));
      return;
    }

    const notesByStudent = new Map(
      existingNotes.map((n) => [n.studentId, n])
    );

    const merged: LocalNote[] = students.map((s) => {
      const existing = notesByStudent.get(s.id);
      return {
        studentId: s.id,
        studentName: `${s.prenom} ${s.nom}`,
        valeur: existing?.valeur != null ? String(existing.valeur) : "",
        observation: existing?.observation ?? "",
        statut: existing?.statut ?? "PRESENT",
      };
    });

    setLocalNotes(merged);
    setDirtyIds(new Set());
  }, [students, existingNotes, examenId, trimestre]);

  const upsertNotes = useUpsertNotes();

  const isValidValeur = (v: string) => {
    if (v === "") return true;
    const n = Number(v.replace(",", "."));
    return !Number.isNaN(n) && n >= 0 && n <= 20;
  };

  const selectedModule = modules.find((m) => m.id === moduleId);
  const isArabicModule = selectedModule ? ARABIC_REGEX.test(selectedModule.name) : false;

  const handleNoteChange = (studentId: string, field: "valeur" | "observation", value: string) => {
    let newValue = value;
    if (field === "valeur" && value !== "") {
      const n = Number(value.replace(",", "."));
      if (!Number.isNaN(n)) {
        if (n > 20) newValue = "20";
        else if (n < 0) newValue = "0";
      }
    }
    setLocalNotes((prev) =>
      prev.map((n) => {
        if (n.studentId !== studentId) return n;
        const updated = { ...n, [field]: newValue };
        if (field === "valeur") {
          const isAutoObs = n.observation === "" || AUTO_OBSERVATIONS_ALL.includes(n.observation);
          if (isAutoObs) {
            updated.observation = getDefaultObservation(newValue, isArabicModule);
          }
        }
        return updated;
      })
    );
    setDirtyIds((prev) => {
      const next = new Set(prev);
      next.add(studentId);
      return next;
    });
  };

  // Auto-save dirty notes (debounced 800ms)
  useEffect(() => {
    if (dirtyIds.size === 0 || !examenId || !trimestre) return;
    const handle = setTimeout(() => {
      const dirty = localNotesRef.current.filter((n) => dirtyIds.has(n.studentId));
      const valid = dirty.filter((n) => n.valeur !== "" && isValidValeur(n.valeur));
      if (valid.length === 0) return;

      const payload: NoteRequest[] = valid.map((n) => ({
        studentId: n.studentId,
        examenId,
        trimestre,
        valeur: Number(n.valeur.replace(",", ".")),
        observation: n.observation || undefined,
      }));
      const savedIds = new Set(valid.map((n) => n.studentId));

      upsertNotes.mutate(payload, {
        onSuccess: () => {
          setLastSavedAt(Date.now());
          setDirtyIds((prev) => {
            const next = new Set(prev);
            savedIds.forEach((id) => next.delete(id));
            return next;
          });
        },
        onError: () => notify.error("Erreur lors de la sauvegarde automatique"),
      });
    }, 800);
    return () => clearTimeout(handle);
  }, [dirtyIds, localNotes, examenId, trimestre]);

  const focusCell = (rowIdx: number, col: "valeur" | "observation") => {
    if (rowIdx < 0 || rowIdx >= localNotes.length) return;
    const target = document.querySelector<HTMLInputElement>(
      `[data-row="${rowIdx}"][data-col="${col}"]`
    );
    target?.focus();
    target?.select();
  };

  const handleCellKey = (
    e: React.KeyboardEvent<HTMLInputElement>,
    idx: number,
    col: "valeur" | "observation"
  ) => {
    if (e.key === "Enter" || e.key === "ArrowDown") {
      e.preventDefault();
      focusCell(idx + 1, col);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      focusCell(idx - 1, col);
    } else if (e.key === "ArrowRight" && col === "valeur" && (e.target as HTMLInputElement).selectionStart === (e.target as HTMLInputElement).value.length) {
      e.preventDefault();
      focusCell(idx, "observation");
    } else if (e.key === "ArrowLeft" && col === "observation" && (e.target as HTMLInputElement).selectionStart === 0) {
      e.preventDefault();
      focusCell(idx, "valeur");
    }
  };

  const buildPayload = (notes: LocalNote[]): NoteRequest[] =>
    notes.map((n) => ({
      studentId: n.studentId,
      examenId,
      trimestre,
      valeur: n.statut === "ABSENT"
        ? 0
        : n.statut === "PRESENT" && n.valeur !== ""
          ? Number(n.valeur.replace(",", "."))
          : null,
      observation: n.observation || undefined,
      statut: n.statut,
    }));

  const performSave = (notesToSave: NoteRequest[]) => {
    if (notesToSave.length === 0) {
      notify.error("Aucune note à sauvegarder");
      return;
    }
    upsertNotes.mutate(notesToSave, {
      onSuccess: () => {
        setLastSavedAt(Date.now());
        setDirtyIds(new Set());
        toast.success("Notes sauvegardées", {
          description: `${notesToSave.length} note(s) enregistrée(s)`,
          action: {
            label: "Voir les moyennes",
            onClick: () => goToTab("moyennes"),
          },
        });
        setExamenId("");
        // Redirige vers l'Aperçu pour voir la progression mise à jour.
        goToTab("apercu");
      },
      onError: () => notify.error("Erreur lors de la sauvegarde"),
    });
  };

  const handleSave = () => {
    const invalid = localNotes.find((n) => n.statut === "PRESENT" && !isValidValeur(n.valeur));
    if (invalid) {
      notify.error("Les notes doivent être entre 0 et 20");
      return;
    }
    if (missingStudents.length > 0) {
      setMissingDialogOpen(true);
      return;
    }
    const toSave = localNotes.filter((n) => n.valeur !== "" || n.statut !== "PRESENT");
    performSave(buildPayload(toSave));
  };

  const handleMarkAbsentAndSave = () => {
    const updated = localNotes.map((n) =>
      n.valeur === "" && n.statut === "PRESENT" ? { ...n, statut: "ABSENT" as NoteStatut } : n
    );
    setLocalNotes(updated);
    setMissingDialogOpen(false);
    performSave(buildPayload(updated));
  };

  const handleSaveOnly = () => {
    setMissingDialogOpen(false);
    const toSave = localNotes.filter((n) => n.valeur !== "" || n.statut !== "PRESENT");
    performSave(buildPayload(toSave));
  };

  const handleStatutChange = (studentId: string, statut: NoteStatut) => {
    setLocalNotes((prev) =>
      prev.map((n) =>
        n.studentId === studentId
          ? { ...n, statut, valeur: statut === "PRESENT" ? n.valeur : "" }
          : n
      )
    );
    setDirtyIds((prev) => {
      const next = new Set(prev);
      next.add(studentId);
      return next;
    });
  };

  const filledCount = localNotes.filter((n) => n.valeur !== "" || n.statut !== "PRESENT").length;
  const selectedExamen = examens.find((e) => e.id === examenId);
  const saveStatus: "idle" | "dirty" | "saving" | "saved" =
    upsertNotes.isPending ? "saving"
    : dirtyIds.size > 0 ? "dirty"
    : lastSavedAt ? "saved"
    : "idle";

  return (
    <div className="space-y-4">
      {/* Trimestre Selector */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="rounded-xl border border-border/50 bg-card p-4 shadow-sm"
      >
        <p className="text-sm font-medium text-foreground mb-3">
          Sélectionnez un trimestre
        </p>
        <div className="flex gap-3">
          {TRIMESTRES.map((t) => (
            <button
              key={t.value}
              onClick={() => setTrimestre(t.value)}
              className={`flex-1 rounded-xl border-2 p-4 text-center font-semibold transition-all ${
                trimestre === t.value
                  ? `${t.color} border-current shadow-sm`
                  : "border-border/50 text-muted-foreground hover:border-border"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Filters */}
      {trimestre > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="rounded-xl border border-border/50 bg-card p-4 shadow-sm"
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <Select
              value={niveauId || ""}
              onValueChange={(v) => setNiveauId(v)}
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
              value={classeId || ""}
              onValueChange={(v) => setClasseId(v)}
              disabled={!niveauId}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Classe" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={moduleId || ""}
              onValueChange={(v) => setModuleId(v)}
              disabled={!niveauId}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Matière" />
              </SelectTrigger>
              <SelectContent>
                {modules.map((m) => (
                  <SelectItem key={m.id} value={String(m.id)}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={examenId || ""}
              onValueChange={(v) => setExamenId(v)}
              disabled={!classeId || !moduleId}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Examen" />
              </SelectTrigger>
              <SelectContent>
                {examens.map((e) => (
                  <SelectItem key={e.id} value={String(e.id)}>
                    {e.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </motion.div>
      )}

      {/* Grade Entry Grid */}
      {examenId && trimestre > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="space-y-4"
        >
          {/* Info bar */}
          <div className="rounded-xl border border-border/50 bg-card p-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                <PenLine className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm text-foreground">
                    {selectedExamen?.name}
                  </p>
                  {existingNotes.length > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 border border-amber-200">
                      <RefreshCw className="h-3 w-3" />
                      Mise à jour
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {selectedExamen?.moduleName} · {selectedExamen?.classeName} · Trimestre {trimestre}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                {filledCount}/{localNotes.length} notes saisies
              </div>
              {saveStatus === "saving" && (
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Sauvegarde...
                </span>
              )}
              {saveStatus === "dirty" && (
                <span className="flex items-center gap-1.5 text-xs text-amber-700">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Modifications non sauvegardees
                </span>
              )}
              {saveStatus === "saved" && (
                <span className="flex items-center gap-1.5 text-xs text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Sauvegarde
                </span>
              )}
              {classeId && trimestre > 0 && (
                <ExportButton
                  type="notes"
                  label="Exporter"
                  filters={{ classeId, trimestre }}
                />
              )}
              <Button
                size="sm"
                className="gap-1.5"
                onClick={handleSave}
                disabled={upsertNotes.isPending || filledCount === 0}
              >
                <Save className="h-4 w-4" />
                {existingNotes.length > 0 ? `Mettre à jour (${existingNotes.length})` : "Sauvegarder"}
              </Button>
            </div>
          </div>

          {/* Grid */}
          <div className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground w-8">
                      #
                    </th>
                    <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground">
                      Élève
                    </th>
                    <th className="py-3 px-4 text-center text-xs font-semibold text-muted-foreground w-32">
                      Note /20
                    </th>
                    <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground">
                      Observation
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {localNotes.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="py-16 text-center text-muted-foreground"
                      >
                        <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
                        <p className="font-medium">
                          Aucun élève dans cette classe
                        </p>
                        <p className="text-xs mt-1">
                          Vérifiez que des élèves sont inscrits dans la classe{" "}
                          {classeName}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    localNotes.map((note, idx) => (
                      <tr
                        key={note.studentId}
                        className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors"
                      >
                        <td className="py-2 px-4 text-muted-foreground text-xs">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-4 font-medium text-foreground">
                          {note.studentName}
                        </td>
                        <td className="py-2 px-4">
                          {note.statut === "ABSENT" ? (
                            <button
                              type="button"
                              onClick={() => handleStatutChange(note.studentId, "PRESENT")}
                              className="w-24 mx-auto block rounded-md border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 transition-colors"
                              title="Cliquer pour rétablir la saisie"
                            >
                              ABS
                            </button>
                          ) : (
                            <Input
                              type="number"
                              min={0}
                              max={20}
                              step={0.25}
                              value={note.valeur}
                              data-row={idx}
                              data-col="valeur"
                              onKeyDown={(e) => handleCellKey(e, idx, "valeur")}
                              onFocus={(e) => e.target.select()}
                              onChange={(e) =>
                                handleNoteChange(
                                  note.studentId,
                                  "valeur",
                                  e.target.value
                                )
                              }
                              aria-invalid={!isValidValeur(note.valeur)}
                              className={`w-24 mx-auto text-center ${!isValidValeur(note.valeur) ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                              placeholder="—"
                            />
                          )}
                        </td>
                        <td className="py-2 px-4">
                          <Input
                            value={note.observation}
                            data-row={idx}
                            data-col="observation"
                            onKeyDown={(e) => handleCellKey(e, idx, "observation")}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) =>
                              handleNoteChange(
                                note.studentId,
                                "observation",
                                e.target.value
                              )
                            }
                            placeholder="Observation (optionnel)"
                            className="text-sm"
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {/* Missing notes confirmation dialog */}
      <Dialog open={missingDialogOpen} onOpenChange={setMissingDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Notes manquantes
            </DialogTitle>
            <DialogDescription>
              {missingStudents.length} élève(s) n'ont pas de note pour cet examen.
              Que voulez-vous faire ?
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-40 overflow-y-auto rounded-md border border-border/50 bg-muted/30 p-3 text-sm">
            <ul className="space-y-1">
              {missingStudents.map((s) => (
                <li key={s.studentId} className="text-muted-foreground">• {s.studentName}</li>
              ))}
            </ul>
          </div>
          <DialogFooter className="flex-col-reverse sm:flex-col-reverse gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={handleSaveOnly}
              disabled={upsertNotes.isPending}
              className="w-full"
            >
              Sauvegarder uniquement les notes saisies
            </Button>
            <Button
              onClick={handleMarkAbsentAndSave}
              disabled={upsertNotes.isPending}
              className="w-full"
            >
              Marquer absents (note = 0) et sauvegarder
            </Button>
            <Button
              variant="ghost"
              onClick={() => setMissingDialogOpen(false)}
              disabled={upsertNotes.isPending}
              className="w-full"
            >
              Annuler
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
