import { useMemo, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Clock3, GraduationCap, Loader2, Save, BookOpen, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import { useActiveAnneeScolaire } from "@/hooks/useAnneeScolaire";
import {
  useVolumeHoraire,
  useCreateVolumeHoraire,
  useUpdateVolumeHoraire,
  useDeleteVolumeHoraire,
} from "@/hooks/useVolumeHoraire";
import { notify } from "@/lib/toast";

interface CellState {
  value: string;
  dirty: boolean;
}

export default function VolumeHoraire() {
  const { niveaux, isLoading: loadingNiveaux } = useNiveaux();
  const { data: anneeActive } = useActiveAnneeScolaire();

  const [selectedNiveauId, setSelectedNiveauId] = useState<number>(0);
  const anneeScolaireId = anneeActive?.id;

  const { data: classes = [] } = useClasses(selectedNiveauId || undefined);
  const { data: modules = [] } = useModules(selectedNiveauId || undefined);
  const { data: volumes = [] } = useVolumeHoraire({ anneeScolaireId });

  const createMut = useCreateVolumeHoraire();
  const updateMut = useUpdateVolumeHoraire();
  const deleteMut = useDeleteVolumeHoraire();

  // O(1) lookup: "moduleId-classeId" → existing volume row
  const volumeMap = useMemo(() => {
    const m = new Map<string, (typeof volumes)[number]>();
    for (const v of volumes) m.set(`${v.moduleId}-${v.classeId}`, v);
    return m;
  }, [volumes]);

  // Local edits, keyed by "moduleId-classeId"
  const [edits, setEdits] = useState<Record<string, CellState>>({});

  const cellKey = (moduleId: string, classeId: string) => `${moduleId}-${classeId}`;

  const getCellValue = useCallback(
    (moduleId: string, classeId: string) => {
      const key = cellKey(moduleId, classeId);
      if (edits[key] !== undefined) return edits[key].value;
      const existing = volumeMap.get(key);
      return existing ? String(existing.nbHeuresHebdo) : "";
    },
    [edits, volumeMap]
  );

  const isDirty = useCallback(
    (moduleId: string, classeId: string) => !!edits[cellKey(moduleId, classeId)]?.dirty,
    [edits]
  );

  const onCellChange = (moduleId: string, classeId: string, raw: string) => {
    if (raw !== "" && !/^\d{1,2}$/.test(raw)) return; // numeric only, max 2 digits
    setEdits((prev) => ({
      ...prev,
      [cellKey(moduleId, classeId)]: { value: raw, dirty: true },
    }));
  };

  const dirtyCount = Object.values(edits).filter((e) => e.dirty).length;

  const handleSaveAll = async () => {
    if (!anneeScolaireId) {
      notify.error("Aucune année scolaire active");
      return;
    }
    const ops: Promise<unknown>[] = [];
    for (const [key, edit] of Object.entries(edits)) {
      if (!edit.dirty) continue;
      const [modIdStr, classIdStr] = key.split("-");
      const moduleId = Number(modIdStr);
      const classeId = Number(classIdStr);
      const existing = volumeMap.get(key);
      const numeric = edit.value.trim() === "" ? null : Number(edit.value);

      if (numeric === null) {
        // Empty → delete existing if any
        if (existing) ops.push(deleteMut.mutateAsync(existing.id));
      } else if (existing) {
        if (existing.nbHeuresHebdo !== numeric) {
          ops.push(
            updateMut.mutateAsync({
              id: existing.id,
              data: {
                moduleId,
                classeId,
                anneeScolaireId,
                nbHeuresHebdo: numeric,
              },
            })
          );
        }
      } else {
        ops.push(
          createMut.mutateAsync({
            moduleId,
            classeId,
            anneeScolaireId,
            nbHeuresHebdo: numeric,
          })
        );
      }
    }

    try {
      await Promise.all(ops);
      notify.success(`${ops.length} modification${ops.length > 1 ? "s" : ""} enregistrée${ops.length > 1 ? "s" : ""}`);
      setEdits({});
    } catch (err) {
      notify.error(err instanceof Error ? err.message : "Erreur lors de l'enregistrement");
    }
  };

  const handleReset = () => setEdits({});

  // Total heures par classe (existing values + edits)
  const totalsByClasse = useMemo(() => {
    const totals = new Map<number, number>();
    for (const c of classes) {
      let sum = 0;
      for (const m of modules) {
        const raw = getCellValue(m.id, c.id);
        if (raw && !isNaN(Number(raw))) sum += Number(raw);
      }
      totals.set(c.id, sum);
    }
    return totals;
  }, [classes, modules, getCellValue]);

  const isSaving = createMut.isPending || updateMut.isPending || deleteMut.isPending;

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="font-heading text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
            <Clock3 className="h-6 w-6 text-primary" />
            Volume horaire hebdomadaire
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Saisissez le nombre d'heures hebdomadaires de chaque module pour chaque classe.
            {anneeActive && <span className="ms-2">Année active : <strong>{anneeActive.label}</strong></span>}
          </p>
        </div>
        {dirtyCount > 0 && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleReset} disabled={isSaving}>
              Annuler
            </Button>
            <Button size="sm" onClick={handleSaveAll} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 me-1.5 animate-spin" />
              ) : (
                <Save className="h-4 w-4 me-1.5" />
              )}
              Enregistrer ({dirtyCount})
            </Button>
          </div>
        )}
      </motion.div>

      <div className="rounded-xl border border-border/50 bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <Select
            value={selectedNiveauId ? String(selectedNiveauId) : ""}
            onValueChange={(v) => {
              setSelectedNiveauId(v);
              setEdits({});
            }}
          >
            <SelectTrigger className="w-[260px]">
              <GraduationCap className="h-3.5 w-3.5 me-1.5 text-muted-foreground" />
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
          {!anneeActive && (
            <span className="text-xs text-amber-600 flex items-center gap-1">
              <AlertCircle className="h-3.5 w-3.5" />
              Aucune année scolaire active
            </span>
          )}
        </div>
      </div>

      {!selectedNiveauId ? (
        <div className="rounded-xl border border-dashed border-border/60 bg-muted/10 py-16 text-center text-sm text-muted-foreground">
          <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
          Sélectionnez un niveau pour afficher la matrice.
        </div>
      ) : loadingNiveaux ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin me-2" /> Chargement...
        </div>
      ) : modules.length === 0 || classes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 bg-muted/10 py-16 text-center text-sm text-muted-foreground">
          {modules.length === 0 ? "Aucun module pour ce niveau" : "Aucune classe pour ce niveau"}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground sticky start-0 bg-muted/30 z-10 min-w-[200px]">
                    Matière
                  </th>
                  {classes.map((c) => (
                    <th key={c.id} className="py-3 px-3 text-center text-xs font-semibold text-muted-foreground min-w-[80px]">
                      {c.fullName}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {modules.map((m) => (
                  <tr key={m.id} className="border-b border-border/40 hover:bg-muted/10 transition-colors">
                    <td className="py-2 px-4 sticky start-0 bg-card z-10">
                      <div className="font-medium text-foreground">{m.name}</div>
                      <div className="text-[10px] text-muted-foreground">
                        Coef {m.coeffEtatique}
                        {m.dureeMinSeance === 2 && m.dureeMaxSeance === 2 && (
                          <span className="ms-1.5 inline-block px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">
                            séance double
                          </span>
                        )}
                      </div>
                    </td>
                    {classes.map((c) => {
                      const dirty = isDirty(m.id, c.id);
                      return (
                        <td key={c.id} className="py-1.5 px-2 text-center">
                          <Input
                            type="text"
                            inputMode="numeric"
                            value={getCellValue(m.id, c.id)}
                            onChange={(e) => onCellChange(m.id, c.id, e.target.value)}
                            className={`h-8 w-16 mx-auto text-center text-sm tabular-nums ${
                              dirty ? "border-amber-400 bg-amber-50" : ""
                            }`}
                            placeholder="—"
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border bg-muted/20 font-semibold">
                  <td className="py-2 px-4 text-end text-xs uppercase tracking-wide text-muted-foreground sticky start-0 bg-muted/20 z-10">
                    Total /sem.
                  </td>
                  {classes.map((c) => {
                    const total = totalsByClasse.get(c.id) ?? 0;
                    const tooHigh = total > 35;
                    return (
                      <td
                        key={c.id}
                        className={`py-2 px-3 text-center text-sm tabular-nums ${
                          tooHigh ? "text-red-600" : "text-foreground"
                        }`}
                      >
                        {total > 0 ? `${total}h` : "—"}
                      </td>
                    );
                  })}
                </tr>
              </tfoot>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}
